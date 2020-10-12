import { permanent_status, temporary_status, on_catch_status_msg, fighter_types } from "../Player";
import { BattleStage } from "./BattleStage";
import { BattleLog } from "./BattleLog";
import { MainBattleMenu, PlayerAbilities, PlayerAbility } from "../main_menus/MainBattleMenu";
import { Enemy, get_enemy_instance } from "../Enemy";
import { ability_types, Ability, diminishing_ratios, ability_categories } from "../Ability";
import { ChoosingTargetWindow } from "../windows/battle/ChoosingTargetWindow.js";
import { EnemyAI } from "./EnemyAI";
import { BattleFormulas, CRITICAL_CHANCE, EVASION_CHANCE, DELUSION_MISS_CHANCE } from "./BattleFormulas";
import { effect_types, Effect, effect_usages, effect_names, effect_msg } from "../Effect";
import { variation, ordered_elements, element_names } from "../utils.js";
import { djinn_status, Djinn } from "../Djinn";
import { MainChar } from "../MainChar";
import { BattleAnimationManager } from "./BattleAnimationManager";
import { GoldenSun } from "../GoldenSun";
import * as _ from "lodash";

export const MAX_CHARS_IN_BATTLE = 4;

/* ACTIONS:
- Attack
- Psynergy
- Djinni Use
- Djinni Recovery
- Item
- Enemy Action
- Defend
- Total Defense (yes, this is defined differently from Defend for some reason)
- Counterattack
- Daedalus
- Retreat
*/

const battle_phases = {
    NONE: 0, // (not in a battle)
    START: 1, // Start (camera pan, shows enemies, move to menu)
    MENU: 2, // (includes submenus, this phase doesn't end until the player has entered their final command)
    ROUND_START: 3, // Start (turn order is determined, enemies may commit to certain actions)
    COMBAT: 4, // (all actions are queued and take place here, you could further break up combat actions into subactions, which should be governed by a separate sub-state variable)
    ROUND_END: 5, // End (djinn recovery, status/buff/debuff timers decrement)
    END: 6 // End (the last enemy has fallen, exp/gold/drops are awarded)
};

export type PlayerInfo = {
    sprite_key: string,
    scale?: number,
    instance?: Enemy|MainChar,
    entered_in_battle?: boolean,
    battle_key?: string,
    sprite?: Phaser.Sprite
};

export class Battle {
    public game: Phaser.Game;
    public data: GoldenSun;
    public allies_info: PlayerInfo[];
    public enemies_party_name: string;
    public enemies_info: PlayerInfo[];
    public this_enemies_list: {[battle_key: string]: Enemy};
    public enter_propagation_priority: number;
    public esc_propagation_priority: number;
    public battle_stage: BattleStage;
    public battle_log: BattleLog;
    public battle_menu: MainBattleMenu;
    public target_window: ChoosingTargetWindow;
    public animation_manager: BattleAnimationManager;
    public battle_phase: number;
    public controls_enabled: boolean;
    public on_going_effects: Effect[];
    public allies_defeated: boolean;
    public enemies_defeated: boolean;
    public battle_finishing: boolean;
    public signal_bindings: Phaser.SignalBinding[];
    public advance_log_resolve: Function;
    public allies_abilities: PlayerAbilities;
    public enemies_abilities: PlayerAbilities;
    public turns_actions: PlayerAbility[];
    public allies_map_sprite: {[player_key: string]: Phaser.Sprite};
    public enemies_map_sprite: {[player_key: string]: Phaser.Sprite};

    constructor(game, data, background_key, enemy_party_key) {
        this.game = game;
        this.data = data;
        this.allies_info = this.data.info.party_data.members.slice(0, MAX_CHARS_IN_BATTLE).map(char => {
            char.init_effect_turns_count();
            return {
                sprite_key: char.key_name + "_battle",
                scale: char.battle_scale,
                instance: char,
                entered_in_battle: true
            };
        });
        const enemies_party_data = this.data.dbs.enemies_parties_db[enemy_party_key];
        this.enemies_party_name = enemies_party_data.name;
        this.enemies_info = [];
        this.this_enemies_list = {};
        let battle_keys_count = {};
        let counter = 0;
        enemies_party_data.members.forEach(member_info => {
            const qtd = _.random(member_info.min, member_info.max);
            for (let i = 0; i < qtd; ++i) {
                this.enemies_info.push({
                    sprite_key: member_info.key + "_battle"
                });
                if (this.enemies_info[counter].sprite_key in battle_keys_count) {
                    battle_keys_count[this.enemies_info[counter].sprite_key] += 1;
                } else {
                    battle_keys_count[this.enemies_info[counter].sprite_key] = 1;
                }
                let battle_key_suffix = "", name_suffix = "";
                if (battle_keys_count[this.enemies_info[counter].sprite_key] > 1) {
                    battle_key_suffix = "_" + battle_keys_count[this.enemies_info[counter].sprite_key].toString();
                    name_suffix = " " + battle_keys_count[this.enemies_info[counter].sprite_key].toString();
                }
                this.enemies_info[counter].instance = get_enemy_instance(this.data.info.enemies_list[member_info.key].data, name_suffix);
                this.enemies_info[counter].scale = this.enemies_info[counter].instance.battle_scale;
                this.enemies_info[counter].battle_key = this.enemies_info[counter].sprite_key + battle_key_suffix;
                this.this_enemies_list[this.enemies_info[counter].battle_key] = this.enemies_info[counter].instance as Enemy;
                ++counter;
            }
        });
        this.enter_propagation_priority = 0;
        this.esc_propagation_priority = 0;
        this.battle_stage = new BattleStage(this.game, this.data, background_key, this.allies_info, this.enemies_info, this.esc_propagation_priority++, this.enter_propagation_priority++);
        this.battle_log = new BattleLog(this.game);
        this.battle_menu = new MainBattleMenu(this.game, this.data, ++this.enter_propagation_priority, ++this.esc_propagation_priority, this.on_abilities_choose.bind(this), this.choose_targets.bind(this));
        this.target_window = new ChoosingTargetWindow(this.game, this.data);
        this.animation_manager = new BattleAnimationManager(this.game, this.data);
        this.battle_phase = battle_phases.NONE;
        this.controls_enabled = false;
        this.on_going_effects = [];
        this.allies_defeated = false;
        this.enemies_defeated = false;
        ++this.enter_propagation_priority;
        ++this.esc_propagation_priority;
        this.battle_finishing = false;
        this.signal_bindings = this.set_controls();
    }

    set_controls() {
        return [
            this.data.enter_input.add(() => {
                if (!this.data.in_battle || !this.controls_enabled) return;
                this.data.enter_input.halt();
                switch (this.battle_phase) {
                    case battle_phases.START:
                        this.controls_enabled = false;
                        this.battle_log.clear();
                        this.battle_phase = battle_phases.MENU;
                        this.check_phases();
                        break;
                    case battle_phases.COMBAT:
                    case battle_phases.ROUND_END:
                    case battle_phases.END:
                        if (this.advance_log_resolve) {
                            this.advance_log_resolve();
                            this.advance_log_resolve = null;
                        }
                        break;
                }
            }, this, this.enter_propagation_priority)
        ];
    }

    start_battle() {
        this.check_phases();
    }

    on_abilities_choose(abilities) {
        this.allies_abilities = abilities;
        this.battle_menu.close_menu();
        this.battle_stage.reset_positions();
        this.battle_stage.choosing_actions = false;
        this.battle_phase = battle_phases.ROUND_START;
        this.check_phases();
    }

    choose_targets(ability_key, action, callback, caster, item_obj) {
        const this_ability = this.data.info.abilities_list[ability_key];
        let quantities;
        if (action === "psynergy") {
            quantities = [this_ability.pp_cost];
        }
        if (action !== "defend") {
            this.target_window.open(action, this_ability.name, this_ability.element, ability_key, quantities, item_obj);
        }
        this.battle_stage.choose_targets(
            this_ability.range,
            this_ability.battle_target,
            this_ability.type,
            caster,
            targets => {
                if (this.target_window.window_open) {
                    this.target_window.close();
                }
                callback(targets);
            }
        );
    }

    check_parties() {
        this.allies_defeated = this.allies_info.every(player => player.instance.has_permanent_status(permanent_status.DOWNED));
        this.enemies_defeated = this.enemies_info.every(player => player.instance.has_permanent_status(permanent_status.DOWNED));
        if (this.allies_defeated || this.enemies_defeated) {
            this.battle_phase = battle_phases.END;
        }
    }

    check_phases() {
        this.check_parties();
        switch (this.battle_phase) {
            case battle_phases.NONE:
                this.battle_phase_none();
                break;
            case battle_phases.START:
            case battle_phases.MENU:
                this.battle_phase_menu();
                break;
            case battle_phases.ROUND_START:
                this.battle_phase_round_start();
                break;
            case battle_phases.COMBAT:
                this.battle_phase_combat();
                break;
            case battle_phases.ROUND_END:
                this.battle_phase_round_end();
                break;
            case battle_phases.END:
                this.battle_phase_end();
                break;
        }
    }

    battle_phase_none() {
        this.game.physics.p2.pause();
        this.battle_phase = battle_phases.START;
        this.data.in_battle = true;
        this.data.battle_instance = this;
        this.battle_log.add(this.enemies_party_name + " appeared!");
        this.battle_stage.initialize_stage(() => {
            this.allies_map_sprite = _.mapValues(_.keyBy(this.allies_info, 'instance.key_name'), info => info.sprite);
            this.enemies_map_sprite = _.mapValues(_.keyBy(this.enemies_info, 'instance.key_name'), info => info.sprite);
            this.controls_enabled = true;
        });
    }

    battle_phase_menu() {
        this.battle_stage.set_choosing_action_position();
        this.battle_menu.open_menu();
    }

    /*
    At round start, is calculated the players and enemies speeds.
    If a certain player speed is the same of a enemy, player goes first.
    If another tie, the most left char has priority.
    At a specific enemy turn start, I roll an action for that turn.
    The only thing needed to check about enemies actions at round start is:
        - Roll their actions for each turn and see if an ability with priority move is rolled.
        - If yes, this ability is fixed for that corresponding turn.
    For the other turns, an action is re-roll in the turn start to be used on it.
    */
    async battle_phase_round_start() {
        const enemy_members = this.enemies_info.map(info => info.instance);
        this.enemies_abilities = Object.fromEntries(enemy_members.map((enemy, index) => {
            let abilities = new Array(enemy.turns);
            for (let i = 0; i < enemy.turns; ++i) {
                abilities[i] = EnemyAI.roll_action(enemy, this.data.info.party_data.members, enemy_members);
            }
            return [this.enemies_info[index].battle_key, abilities];
        }));
        for (let char_key in this.allies_abilities) {
            const this_char = this.data.info.main_char_list[char_key];
            for (let i = 0; i < this.allies_abilities[char_key].length; ++i) {
                const this_ability = this.data.info.abilities_list[this.allies_abilities[char_key][i].key_name];
                const priority_move = this_ability !== undefined ? this_ability.priority_move : false;
                this.allies_abilities[char_key][i].speed = BattleFormulas.player_turn_speed(this_char.current_agi, priority_move, i > 0);
                this.allies_abilities[char_key][i].caster = this_char;
            }
        }
        for (let battle_key in this.enemies_abilities) {
            const this_enemy = this.this_enemies_list[battle_key];
            for (let i = 0; i < this.enemies_abilities[battle_key].length; ++i) {
                const this_ability = this.data.info.abilities_list[this.enemies_abilities[battle_key][i].key_name];
                const priority_move = this_ability !== undefined ? this_ability.priority_move : false;
                this.enemies_abilities[battle_key][i].speed = BattleFormulas.enemy_turn_speed(this_enemy.current_agi, i + 1, this_enemy.turns, priority_move);
                this.enemies_abilities[battle_key][i].caster = this_enemy;
            }
        }
        this.turns_actions = _.sortBy(Object.values(this.allies_abilities).flat().concat(Object.values(this.enemies_abilities).flat()), action => {
            return action.speed; //still need to add left most and player preference criterias
        });
        for (let i = 0; i < this.turns_actions.length; ++i) {
            const action = this.turns_actions[i];
            const ability = this.data.info.abilities_list[action.key_name];
            let battle_animation_key = this.data.info.abilities_list[action.key_name].battle_animation_key;
            if (ability.has_animation_variation && action.key_name in action.caster.battle_animations_variations) {
                battle_animation_key = action.caster.battle_animations_variations[action.key_name];
            }
            action.battle_animation_key = battle_animation_key;
            await this.animation_manager.load_animation(battle_animation_key);
        }
        this.battle_phase = battle_phases.COMBAT;
        this.controls_enabled = true;
        this.check_phases();
    }

    wait_for_key() {
        return new Promise(resolve => { this.advance_log_resolve = resolve; });
    }

    async check_downed(target) {
        if (target.current_hp === 0) {
            target.add_permanent_status(permanent_status.DOWNED);
            await this.battle_log.add(on_catch_status_msg[permanent_status.DOWNED](target));
            await this.wait_for_key();
        }
    }

    /*
    Standard attack:
    1. Unleash check (followed by another check for unleash type if weapon has multiple unleashes)
    2. Miss check
    3. Crit check 1  (using brn % 32)
    4. Crit check 2 (using total crit chance from equipment, ((equipment_chance/2)*rand(0,65535) >> 16)
    5. Status effect check
    6. Added 0-3 damage
    If any of checks 1-4 succeed, it skips to 5
    */
    async battle_phase_combat() {
        if (!this.turns_actions.length) {
            this.battle_phase = battle_phases.ROUND_END;
            this.check_phases();
            return;
        }
        const action = this.turns_actions.pop();
        if (action.caster.has_permanent_status(permanent_status.DOWNED)) { //check whether this char is downed
            this.check_phases();
            return;
        }
        if (action.caster.is_paralyzed()) { //check whether this char is paralyzed
            if (action.caster.temporary_status.has(temporary_status.SLEEP)) {
                await this.battle_log.add(`${action.caster.name} is asleep!`);
            } else if (action.caster.temporary_status.has(temporary_status.STUN)) {
                await this.battle_log.add(`${action.caster.name} is paralyzed and cannot move!`);
            }
            await this.wait_for_key();
            this.check_phases();
            return;
        }
        if (action.caster.fighter_type === fighter_types.ENEMY && !this.data.info.abilities_list[action.key_name].priority_move) { //reroll enemy ability
            Object.assign(action, EnemyAI.roll_action(action.caster, this.data.info.party_data.members, this.enemies_info.map(info => info.instance)));
        }
        let ability = this.data.info.abilities_list[action.key_name];
        let item_name = "";
        if (action.caster.fighter_type === fighter_types.ALLY && ability !== undefined && ability.can_switch_to_unleash) { //change the current ability to unleash ability from weapon
            const caster = action.caster as MainChar;
            if (caster.equip_slots.weapon && this.data.info.items_list[caster.equip_slots.weapon.key_name].unleash_ability) {
                const weapon = this.data.info.items_list[caster.equip_slots.weapon.key_name];
                if (Math.random() < weapon.unleash_rate) {
                    item_name = weapon.name;
                    action.key_name = weapon.unleash_ability;
                    ability = this.data.info.abilities_list[weapon.unleash_ability];
                }
            }
        }
        if (ability === undefined) {
            await this.battle_log.add(`${action.key_name} ability key not registered.`);
            await this.wait_for_key();
            this.check_phases();
            return;
        }
        if (action.caster.has_temporary_status(temporary_status.SEAL) && ability.ability_category === ability_categories.PSYNERGY) { //check if is possible to cast ability due to seal
            await this.battle_log.add(`But the Psynergy was blocked!`);
            await this.wait_for_key();
            this.check_phases();
            return;
        }
        if (ability.pp_cost > action.caster.current_pp) { //check if char has enough pp to cast ability
            await this.battle_log.add(`... But doesn't have enough PP!`);
            await this.wait_for_key();
            this.check_phases();
            return;
        } else {
            action.caster.current_pp -= ability.pp_cost;
        }
        let djinn_name = action.djinn_key_name ? this.data.info.djinni_list[action.djinn_key_name].name : undefined;
        await this.battle_log.add_ability(action.caster, ability, item_name, djinn_name);
        if (ability.ability_category === ability_categories.DJINN) {
            if (ability.effects.some(effect => effect.type === effect_types.SET_DJINN)) {
                this.data.info.djinni_list[action.djinn_key_name].set_status(djinn_status.SET, action.caster);
            } else {
                this.data.info.djinni_list[action.key_name].set_status(djinn_status.STANDBY, action.caster);
            }
        } else if (ability.ability_category === ability_categories.SUMMON) { //some summon checks
            const requirements = this.data.dbs.summons_db[ability.key_name].requirements;
            const standby_djinni = Djinn.get_standby_djinni(this.data.info.djinni_list, MainChar.get_active_players(this.data.info.party_data, MAX_CHARS_IN_BATTLE));
            const has_available_djinni = _.every(requirements, (requirement, element) => {
                return standby_djinni[element] >= requirement;
            });
            if (!has_available_djinni) { //check if is possible to cast a summon
                await this.battle_log.add(`${action.caster.name} summons ${ability.name} but`);
                await this.battle_log.add(`doesn't have enough standby Djinn!`);
                await this.wait_for_key();
                this.check_phases();
                return;
            } else { //set djinni used in this summon to recovery mode
                Djinn.set_to_recovery(this.data.info.djinni_list, MainChar.get_active_players(this.data.info.party_data, MAX_CHARS_IN_BATTLE), requirements);
            }
        }
        this.battle_menu.chars_status_window.update_chars_info();
        if (ability.type === ability_types.UTILITY) {
            await this.wait_for_key();
        }
        if (this.animation_manager.animation_available(action.battle_animation_key)) {
            const caster_sprite = action.caster.fighter_type === fighter_types.ALLY ? this.allies_map_sprite[action.caster.key_name] : this.enemies_map_sprite[action.caster.key_name];
            const target_sprites = action.targets.flatMap(info => info.magnitude ? [info.target.sprite] : []);
            const group_caster = action.caster.fighter_type === fighter_types.ALLY ? this.battle_stage.group_allies : this.battle_stage.group_enemies;
            const group_taker = action.caster.fighter_type === fighter_types.ALLY ? this.battle_stage.group_enemies : this.battle_stage.group_allies;
            await this.animation_manager.play(action.battle_animation_key, caster_sprite, target_sprites, group_caster, group_taker, this.battle_stage);
            this.battle_stage.prevent_camera_angle_overflow();
        } else {
            await this.battle_log.add(`Animation for ${ability.name} not available...`);
            await this.wait_for_key();
        }
        //apply ability damage
        if (![ability_types.UTILITY, ability_types.EFFECT_ONLY].includes(ability.type)) {
            await this.apply_damage(action, ability);
        }
        //apply ability effects
        for (let i = 0; i < ability.effects.length; ++i) {
            const effect = ability.effects[i];
            if (!effect_usages.ON_USE) continue;
            const end_turn = await this.apply_effects(action, ability, effect);
            if (end_turn) {
                this.battle_phase = battle_phases.ROUND_END;
                this.check_phases();
                return;
            }
        }
        await this.battle_stage.set_stage_default_position();
        //summon after cast power buff
        if (ability.ability_category === ability_categories.SUMMON) {
            const requirements = this.data.dbs.summons_db[ability.key_name].requirements;
            for (let i = 0; i < ordered_elements.length; ++i) {
                const element = ordered_elements[i];
                const power = BattleFormulas.summon_power(requirements[element]);
                if (power > 0) {
                    action.caster.add_effect({
                        type: "power",
                        quantity: power,
                        operator: "plus",
                        attribute: element
                    }, ability, true);
                    await this.battle_log.add(`${action.caster.name}'s ${element_names[element]} Power rises by ${power.toString()}!`);
                    await this.wait_for_key();
                }
            }
        }
        //check for poison damage
        const poison_status = action.caster.is_poisoned();
        if (poison_status) {
            let damage = BattleFormulas.battle_poison_damage(action.caster, poison_status);
            if (damage > action.caster.current_hp) {
                damage = action.caster.current_hp;
            }
            action.caster.current_hp = _.clamp(action.caster.current_hp - damage, 0, action.caster.max_hp);
            const poison_name = poison_status === permanent_status.POISON ? "poison" : "venom";
            await this.battle_log.add(`The ${poison_name} does ${damage.toString()} damage to ${action.caster.name}!`);
            this.battle_menu.chars_status_window.update_chars_info();
            await this.wait_for_key();
            await this.check_downed(action.caster);
        }
        if (action.caster.has_temporary_status(temporary_status.DEATH_CURSE)) {
            const this_effect = _.find(action.caster.effects, {
                status_key_name: temporary_status.DEATH_CURSE
            });
            if (action.caster.get_effect_turns_count(this_effect) === 1) {
                action.caster.current_hp = 0;
                action.caster.add_permanent_status(permanent_status.DOWNED);
                await this.battle_log.add(`The Grim Reaper calls out to ${action.caster.name}`);
                await this.wait_for_key();
            }
        }
        this.check_phases();
    }

    async apply_damage(action, ability) {
        let increased_crit;
        if (ability.has_critical) {
            increased_crit = action.caster.effects.filter(effect => effect.type === effect_types.CRITICALS).reduce((acc, effect) => {
                return Effect.apply_operator(acc, effect.quantity, effect.operator);
            }, 0);
        }
        for (let i = 0; i < action.targets.length; ++i) {
            const target_info = action.targets[i];
            if (target_info.magnitude === null) continue;
            const target_instance = target_info.target.instance;
            if (target_instance.has_permanent_status(permanent_status.DOWNED)) continue;
            if (ability.can_be_evaded) {
                if (Math.random() < EVASION_CHANCE || (action.caster.temporary_status.has(temporary_status.DELUSION) && Math.random() < DELUSION_MISS_CHANCE)) {
                    await this.battle_log.add(`${target_instance.name} nimbly dodges the blow!`);
                    return this.wait_for_key();
                }
            }
            let damage = 0;
            if (ability.has_critical && (Math.random() < CRITICAL_CHANCE || Math.random() < increased_crit/2)) {
                const mult_mod = ability.crit_mult_factor === undefined ? 1.25 : ability.crit_mult_factor;
                const add_mod = 6.0 + target_instance.level/5.0;
                damage = BattleFormulas.physical_attack(action.caster, target_instance, mult_mod, add_mod, ability.element);
            } else {
                switch(ability.type) {
                    case ability_types.ADDED_DAMAGE:
                        damage = BattleFormulas.physical_attack(action.caster, target_instance, 1.0, ability.ability_power, ability.element);
                        break;
                    case ability_types.MULTIPLIER:
                        damage = BattleFormulas.physical_attack(action.caster, target_instance, ability.ability_power/10.0, 0, ability.element);
                        break;
                    case ability_types.BASE_DAMAGE:
                        damage = BattleFormulas.psynergy_damage(action.caster, target_instance, ability.ability_power, ability.element);
                        break;
                    case ability_types.HEALING:
                        damage = -BattleFormulas.heal_ability(action.caster, ability.ability_power, ability.element);
                        break;
                    case ability_types.SUMMON:
                        const djinn_used = _.sum(_.values(this.data.dbs.summons_db[ability.key_name].requirements));
                        damage = BattleFormulas.summon_damage(target_instance, ability.ability_power, djinn_used);
                        break;
                    case ability_types.DIRECT_DAMAGE:
                        damage = ability.ability_power;
                        break;
                }
            }
            const ratios = Ability.get_diminishing_ratios(ability.type, ability.use_diminishing_ratio);
            damage = (damage * ratios[target_info.magnitude]) | 0;
            damage += variation();
            if (damage >= 0) {
                target_instance.effects.forEach(effect => {
                    if (effect.type === effect_types.DAMAGE_MODIFIER) {
                        damage = effect.apply_effect(damage).after;
                    }
                });
            }
            await this.battle_log.add_damage(damage, target_instance, ability.affects_pp);
            const current_property = ability.affects_pp ? "current_pp" : "current_hp";
            const max_property = ability.affects_pp ? "max_pp" : "max_hp";
            target_instance.current_hp = _.clamp(target_instance[current_property] - damage, 0, target_instance[max_property]);
            this.battle_menu.chars_status_window.update_chars_info();
            await this.wait_for_key();
            await this.check_downed(target_instance);
            for (let j = 0; j < ability.effects.length; ++j) {
                const effect_obj = ability.effects[j];
                if (effect_obj.type === effect_types.DAMAGE_INPUT) {
                    const player = effect_obj.on_caster ? action.caster : target_instance;
                    const di_effect = player.add_effect(effect_obj, ability).effect;
                    const effect_result = di_effect.apply_effect(damage);
                    if ([effect_types.CURRENT_HP, effect_types.CURRENT_PP].includes(di_effect.sub_effect.type)) {
                        const effect_damage = effect_result.before - effect_result.after;
                        if (effect_damage !== 0) {
                            if (di_effect.effect_msg) {
                                await this.battle_log.add(effect_msg[di_effect.effect_msg](target_instance));
                            } else {
                                await this.battle_log.add_damage(effect_damage, player, di_effect.sub_effect.type === effect_types.CURRENT_PP);
                            }
                            this.battle_menu.chars_status_window.update_chars_info();
                            await this.wait_for_key();
                        }
                        await this.check_downed(player);
                    }
                    player.remove_effect(di_effect);
                }
            }
        }
    }

/*
If a sleep is cast over a target that is already sleeping,
it will recalculate the chance, and if it lands it will "top up" (read: replace) the effect's duration.
So if a character is sleeping, the remaining duration is 6 rounds, and you cast Sleep on them again and it lands, it'll get bumped up to 7 rounds.
When Sleep normally gets inflicted with a max duration of 7 anyway.

Buffs and debuffs can stack values, but durations get overwritten every time and do not stack.

Poison/Venom can't land again, although Venom can replace Poison (but not the other way around).
And Candle Curse (countdown to death) can be "advanced".
So, if a character will die after 5 turns and you land another Curse on them, it will drop the remaining count to 4.
*/

    async apply_effects(action, ability, effect) {
        let effect_result;
        for (let j = 0; j < action.targets.length; ++j) {
            const target_info = action.targets[j];
            if (target_info.magnitude === null) continue;
            const target_instance = target_info.target.instance;
            if (target_instance.has_permanent_status(permanent_status.DOWNED)) continue;
            switch(effect.type) {
                case effect_types.PERMANENT_STATUS:
                    if (effect.add_status) {
                        if (target_instance.has_permanent_status(effect.status_key_name)) break;
                        if (effect.status_key_name === permanent_status.POISON && target_instance.has_permanent_status(permanent_status.VENOM)) break;
                    }
                case effect_types.TEMPORARY_STATUS:
                    if (effect.add_status) {
                        let vulnerability = _.find(target_instance.class.vulnerabilities, {
                            status_key_name: effect.status_key_name
                        });
                        vulnerability = vulnerability === undefined ? 0 : vulnerability.chance;
                        const magnitude = diminishing_ratios.STATUS[target_info.magnitude];
                        if (BattleFormulas.ailment_success(action.caster, target_instance, effect.chance, magnitude, ability.element, vulnerability)) {
                            const this_effect = target_instance.add_effect(effect, ability, true).effect;
                            if (this_effect.type === effect_types.TEMPORARY_STATUS) {
                                if (!target_instance.has_temporary_status(this_effect.status_key_name)) {
                                    this.on_going_effects.push(this_effect);
                                }
                                if (this_effect.status_key_name === temporary_status.DEATH_CURSE && target_instance.has_temporary_status(temporary_status.DEATH_CURSE)) {
                                    target_instance.set_effect_turns_count(this_effect);
                                } else {
                                    target_instance.set_effect_turns_count(this_effect, this_effect.turn_count, false);
                                }
                            } else if (this_effect.status_key_name === permanent_status.VENOM && target_instance.has_permanent_status(permanent_status.POISON)) {
                                const poison_effect = _.find(target_instance.effects, {
                                    status_key_name: permanent_status.POISON
                                });
                                target_instance.remove_effect(poison_effect, true);
                            }
                            await this.battle_log.add(on_catch_status_msg[effect.status_key_name](target_instance));
                        } else {
                            await this.battle_log.add(`But it has no effect on ${target_instance.name}!`);
                        }
                        await this.wait_for_key();
                    } else {
                        if (Math.random() < effect.chance) {
                            let removed = false;
                            while (true) {
                                const this_effect = _.find(target_instance.effects, {
                                    status_key_name: effect.status_key_name
                                });
                                if (this_effect) {
                                    target_instance.remove_effect(this_effect, true);
                                    if (this_effect.status_key_name === permanent_status.DOWNED) {
                                        target_instance.init_effect_turns_count();
                                    }
                                    if (this_effect.type === effect_types.TEMPORARY_STATUS) {
                                        this.on_going_effects = this.on_going_effects.filter(effect => {
                                            return effect !== this_effect;
                                        });
                                    }
                                } else break;
                            }
                            if (removed) {
                                this.battle_log.add_recover_effect(effect);
                                await this.wait_for_key();
                            }
                        }
                    }
                    break;
                case effect_types.CURRENT_HP:
                    effect_result = target_instance.add_effect(effect, ability, true);
                    if (effect_result.effect.show_msg) {
                        const damage = effect_result.changes.before - effect_result.changes.after;
                        await this.battle_log.add_damage(damage, target_instance);
                        this.battle_menu.chars_status_window.update_chars_info();
                        await this.wait_for_key();
                    }
                    await this.check_downed(target_instance);
                    if (effect_result.effect.turns_quantity !== undefined) {
                        this.on_going_effects.push(effect_result.effect);
                    } else {
                        target_instance.remove_effect(effect_result.effect);
                    }
                    break;
                case effect_types.MAX_HP:
                case effect_types.MAX_PP:
                case effect_types.ATTACK:
                case effect_types.DEFENSE:
                case effect_types.AGILITY:
                case effect_types.LUCK:
                case effect_types.POWER:
                case effect_types.RESIST:
                    effect_result = target_instance.add_effect(effect, ability, true);
                    this.on_going_effects.push(effect_result.effect);
                    target_instance.set_effect_turns_count(effect_result.effect, effect_result.effect.turn_count, false);
                    if (effect_result.effect.show_msg) {
                        const diff = effect_result.changes.after - effect_result.changes.before;
                        const text = diff >= 0 ? "rises" : "drops";
                        let element_info = "";
                        if ([effect_types.POWER, effect_types.RESIST].includes(effect.type)) {
                            element_info = element_names[effect_result.effect.attribute] + " ";
                        }
                        await this.battle_log.add(`${target_instance.name}'s ${element_info}${effect_names[effect.type]} ${text} by ${Math.abs(diff)}!`);
                        this.battle_menu.chars_status_window.update_chars_info();
                        await this.wait_for_key();
                    }
                    break;
                case effect_types.END_THE_ROUND:
                    await this.battle_log.add(`Everybody is resting!`);
                    await this.wait_for_key();
                    return true;
                case effect_types.TURNS:
                    await this.battle_log.add(`${action.caster.name} readies for action!`);
                    await this.wait_for_key();
                    this.on_going_effects.push(target_instance.add_effect(effect, ability, true).effect);
                    break;
                case effect_types.DAMAGE_MODIFIER:
                    await this.battle_log.add(effect_msg[effect.effect_msg](target_instance));
                    await this.wait_for_key();
                    this.on_going_effects.push(target_instance.add_effect(effect, ability, true).effect);
                    break;
                case effect_types.COUNTER_STRIKE: break;
                case effect_types.FLEE: break;
                default:
                    this.on_going_effects.push(target_instance.add_effect(effect, ability, true).effect);
            }
        }
        return false;
    }

    async battle_phase_round_end() {
        let effects_to_remove = [];
        let effect_groups = {};
        for (let i = 0; i < this.on_going_effects.length; ++i) {
            const effect = this.on_going_effects[i];
            if (effect.char.has_permanent_status(permanent_status.DOWNED)) {
                effect.char.remove_effect(effect);
                effect.char.update_all();
                effects_to_remove.push(i);
                continue;
            }
            let avoid_msg = false;
            if (effect.turn_count !== undefined) {
                if (effect.char.get_effect_turns_count(effect) !== null) {
                    if (!(effect.char.key_name in effect_groups) || !(effect.char.get_effect_turns_key(effect) in effect_groups[effect.char.key_name])) {
                        effect.char.set_effect_turns_count(effect);
                    }
                    effect.turn_count = effect.char.get_effect_turns_count(effect);
                    if (!effect_groups[effect.char.key_name]) {
                        effect_groups[effect.char.key_name] = {
                            [effect.char.get_effect_turns_key(effect)]: effect
                        };
                    } else {
                        effect_groups[effect.char.key_name][effect.char.get_effect_turns_key(effect)] = effect;
                    }
                    avoid_msg = true;
                } else {
                    --effect.turn_count;
                }
                if (effect.turn_count === 0) {
                    effect.char.remove_effect(effect);
                    effect.char.update_all();
                    effects_to_remove.push(i);
                    if (!avoid_msg) {
                        this.battle_log.add_recover_effect(effect);
                        await this.wait_for_key();
                    }
                }
            }
        }
        for (let char_key_name in effect_groups) {
            for (let effect_turn_key in effect_groups[char_key_name]) {
                const effect = effect_groups[char_key_name][effect_turn_key];
                if (effect.turn_count === 0) {
                    this.battle_log.add_recover_effect(effect);
                    await this.wait_for_key();
                }
            }
        }
        this.on_going_effects = this.on_going_effects.filter((effect, index) => {
            return !effects_to_remove.includes(index);
        });
        for (let i = 0; i < MAX_CHARS_IN_BATTLE; ++i) {
            const player = this.data.info.party_data.members[i];
            if (player === undefined) continue;
            const player_djinni = player.djinni;
            for (let j = 0; j < player_djinni.length; ++j) {
                const djinn_key = player_djinni[j];
                const djinn = this.data.info.djinni_list[djinn_key];
                if (djinn.status === djinn_status.RECOVERY) {
                    if (djinn.recovery_turn === 0) {
                        djinn.set_status(djinn_status.SET, player);
                        await this.battle_log.add(`${djinn.name} is set to ${player.name}!`);
                        await this.wait_for_key(); 
                    } else {
                        --djinn.recovery_turn;
                    }
                }
            };
        };
        this.controls_enabled = false;
        this.battle_log.clear();
        this.battle_phase = battle_phases.MENU;
        this.check_phases();
    }

// Everyone gets equal experience with no division, but:
// - Characters who do not participate get half;
// - Downed characters get none.

    async battle_phase_end() {
        for (let i = 0; i < this.on_going_effects.length; ++i) {
            const effect = this.on_going_effects[i];
            effect.char.remove_effect(effect);
            effect.char.update_all();
        }
        if (this.allies_defeated) {
            this.battle_log.add(this.allies_info[0].instance.name + "' party has been defeated!");
        } else {
            this.battle_log.add(this.enemies_party_name + " has been defeated!");
            await this.wait_for_key();
            const total_exp = this.enemies_info.map(info => {
                return (info.instance as Enemy).exp_reward;
            }).reduce((a, b) => a + b, 0);
            this.battle_log.add(`You got ${total_exp.toString()} experience points.`);
            await this.wait_for_key();
            for (let i = 0; i < this.allies_info.length; ++i) {
                const info = this.allies_info[i];
                const char = info.instance as MainChar;
                if (!char.has_permanent_status(permanent_status.DOWNED)) {
                    const change = char.add_exp(info.entered_in_battle ? total_exp : total_exp >> 1);
                    if (change.before.level !== change.after.level) {
                        this.battle_log.add(`${char.name} is now a level ${char.level} ${char.class.name}!`);
                        await this.wait_for_key();
                        const gained_abilities = _.difference(change.after.abilities, change.before.abilities);
                        for (let j = 0; j < gained_abilities.length; ++j) {
                            const ability = this.data.info.abilities_list[gained_abilities[j]];
                            this.battle_log.add(`Mastered the ${char.class.name}'s ${ability.name}!`);
                            await this.wait_for_key();
                        }
                        for (let j = 0; j < change.before.stats.length; ++j) {
                            const stat = Object.keys(change.before.stats[j])[0];
                            const diff = change.after.stats[j][stat] - change.before.stats[j][stat];
                            if (diff !== 0) {
                                let stat_text;
                                switch (stat) {
                                    case "max_hp": stat_text = "Maximum HP"; break;
                                    case "max_pp": stat_text = "Maximum PP"; break;
                                    case "atk": stat_text = "Attack"; break;
                                    case "def": stat_text = "Defense"; break;
                                    case "agi": stat_text = "Agility"; break;
                                    case "luk": stat_text = "Luck"; break;
                                }
                                this.battle_log.add(`${stat_text} rises by ${diff.toString()}!`);
                                await this.wait_for_key();
                            }
                        }
                    }
                }
            }
            const total_coins = this.enemies_info.map(info => {
                return (info.instance as Enemy).coins_reward;
            }).reduce((a, b) => a + b, 0);
            this.battle_log.add(`You got ${total_coins.toString()} coins.`);
            await this.wait_for_key();
            for (let i = 0; i < this.enemies_info.length; ++i) {
                const enemy = this.enemies_info[i].instance as Enemy;
                if (enemy.item_reward && Math.random() < enemy.item_reward_chance) {
                    //add item
                    const item = this.data.info.items_list[enemy.item_reward];
                    if (item !== undefined) {
                        this.battle_log.add(`You got a ${item.name}.`);
                        await this.wait_for_key();
                    } else {
                        this.battle_log.add(`${enemy.item_reward} not registered...`);
                        await this.wait_for_key();
                    }
                }
            }
        }
        this.unset_battle();
    }

    unset_battle() {
        this.battle_finishing = true;
        this.battle_stage.unset_stage(() => {
            this.battle_log.destroy();
            this.battle_menu.destroy_menu();
            this.signal_bindings.forEach(signal_binding => {
                signal_binding.detach();
            });
            this.target_window.destroy();
            this.animation_manager.destroy();
        }, () => {
            this.data.in_battle = false;
            this.data.battle_instance = undefined;
            this.game.physics.p2.resume();
        });
    }

    update() {
        if (this.battle_finishing) return;
        this.battle_stage.update_stage();
        this.animation_manager.render();
    }
}
