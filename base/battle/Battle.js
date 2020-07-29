import { permanent_status, temporary_status, on_catch_status_msg, fighter_types } from "../Player.js";
import { party_data, main_char_list } from "../../initializers/main_chars.js";
import { BattleStage } from "./BattleStage.js";
import { enemies_list } from "../../initializers/enemies.js";
import { BattleLog } from "./BattleLog.js";
import { BattleMenuScreen } from "../../screens/battle_menus.js";
import { get_enemy_instance } from "../Enemy.js";
import { abilities_list } from "../../initializers/abilities.js";
import { ability_types, Ability, diminishing_ratios } from "../Ability.js";
import { ChoosingTargetWindow } from "../windows/battle/ChoosingTargetWindow.js";
import { EnemyAI } from "./EnemyAI.js";
import { BattleFormulas, CRITICAL_CHANCE, EVASION_CHANCE, DELUSION_MISS_CHANCE } from "./BattleFormulas.js";
import { effect_types, Effect, effect_usages } from "../Effect.js";
import { variation, ordered_elements, element_names } from "../../utils.js";
import { djinni_list } from "../../initializers/djinni.js";
import { djinn_status, Djinn } from "../Djinn.js";
import { MainChar } from "../MainChar.js";

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

export class Battle {
    constructor(game, data, background_key, enemy_party_key) {
        this.game = game;
        this.data = data;
        this.allies_info = party_data.members.slice(0, MAX_CHARS_IN_BATTLE).map(char => {
            return {
                sprite_key: char.key_name + "_battle",
                scale: char.battle_scale,
                instance: char
            };
        });
        this.enemies_party_data = this.data.enemies_parties_db[enemy_party_key];
        this.enemies_info = [];
        this.this_enemies_list = {};
        let battle_keys_count = {};
        let counter = 0;
        this.enemies_party_data.members.forEach(member_info => {
            const qtd = _.random(member_info.min, member_info.max);
            for (let i = 0; i < qtd; ++i) {
                this.enemies_info.push({
                    sprite_key: member_info.key + "_battle",
                    scale: enemies_list[member_info.key].battle_scale
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
                this.enemies_info[counter].instance = get_enemy_instance(member_info.key, name_suffix);
                this.enemies_info[counter].battle_key = this.enemies_info[counter].sprite_key + battle_key_suffix;
                this.this_enemies_list[this.enemies_info[counter].battle_key] = this.enemies_info[counter].instance;
                ++counter;
            }
        });
        this.enter_propagation_priority = 0;
        this.esc_propagation_priority = 0;
        this.battle_stage = new BattleStage(this.game, this.data, background_key, this.allies_info, this.enemies_info, this.esc_propagation_priority++, this.enter_propagation_priority++);
        this.battle_log = new BattleLog(this.game);
        this.battle_menu = new BattleMenuScreen(this.game, this.data, ++this.enter_propagation_priority, ++this.esc_propagation_priority, this.on_abilities_choose.bind(this), this.choose_targets.bind(this));
        this.target_window = new ChoosingTargetWindow(this.game, this.data);
        this.battle_phase = battle_phases.NONE;
        this.controls_enabled = false;
        this.on_going_effects = [];
        this.allies_defeated = false;
        this.enemies_defeated = false;
        ++this.enter_propagation_priority;
        ++this.esc_propagation_priority;
        this.set_controls();
    }

    set_controls() {
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
                    if (this.advance_log_resolve) {
                        this.advance_log_resolve();
                        this.advance_log_resolve = null;
                    }
                    break;
            }
        }, this, this.enter_propagation_priority);
    }

    start_battle() {
        this.check_phases();
    }

    on_abilities_choose(abilities) {
        this.player_abilities = abilities;
        this.battle_menu.close_menu();
        this.battle_stage.reset_positions();
        this.battle_stage.choosing_actions = false;
        this.battle_phase = battle_phases.ROUND_START;
        this.check_phases();
    }

    choose_targets(ability_key, action, callback, caster, item_obj) {
        const this_ability = abilities_list[ability_key];
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
        this.battle_phase = battle_phases.START;
        this.data.in_battle = true;
        this.data.battle_instance = this;
        this.battle_log.add(this.enemies_party_data.name + " appeared!");
        this.battle_stage.initialize_stage(() => {
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
    battle_phase_round_start() {
        const enemy_members = this.enemies_info.map(info => info.instance);
        this.enemies_abilities = Object.fromEntries(enemy_members.map((enemy, index) => {
            let abilities = new Array(enemy.turns);
            for (let i = 0; i < enemy.turns; ++i) {
                abilities[i] = EnemyAI.roll_action(enemy, party_data.members, enemy_members);
            }
            return [this.enemies_info[index].battle_key, abilities];
        }));
        for (let char_key in this.player_abilities) {
            const this_char = main_char_list[char_key];
            for (let i = 0; i < this.player_abilities[char_key].length; ++i) {
                const this_ability = abilities_list[this.player_abilities[char_key][i].key_name];
                const priority_move = this_ability !== undefined ? this_ability.priority_move : false;
                this.player_abilities[char_key][i].speed = BattleFormulas.player_turn_speed(this_char.current_agi, priority_move, i > 0);
                this.player_abilities[char_key][i].caster = this_char;
            }
        }
        for (let battle_key in this.enemies_abilities) {
            const this_enemy = this.this_enemies_list[battle_key];
            for (let i = 0; i < this.enemies_abilities[battle_key].length; ++i) {
                const this_ability = abilities_list[this.enemies_abilities[battle_key][i].key_name];
                const priority_move = this_ability !== undefined ? this_ability.priority_move : false;
                this.enemies_abilities[battle_key][i].speed = BattleFormulas.enemy_turn_speed(this_enemy.current_agi, i + 1, this_enemy.turns, priority_move);
                this.enemies_abilities[battle_key][i].caster = this_enemy;
            }
        }
        this.turns_actions = _.sortBy(Object.values(this.player_abilities).flat().concat(Object.values(this.enemies_abilities).flat()), action => {
            return action.speed; //still need to add left most and player preference criterias
        });
        this.battle_phase = battle_phases.COMBAT;
        this.controls_enabled = true;
        this.check_phases();
    }

    wait_for_key() {
        return new Promise(resolve => { this.advance_log_resolve = resolve; });
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
        if (action.caster.has_permanent_status(permanent_status.DOWNED)) {
            this.check_phases();
            return;
        }
        if (action.caster.is_paralyzed()) {
            if (action.caster.temporary_status.has(temporary_status.SLEEP)) {
                await this.battle_log.add(`${action.caster.name} is asleep!`);
            } else if (action.caster.temporary_status.has(temporary_status.STUN)) {
                await this.battle_log.add(`${action.caster.name} is stunned!`);
            }
            await this.wait_for_key();
            this.check_phases();
            return;
        }
        if (action.caster.fighter_type === fighter_types.ENEMY && !abilities_list[action.key_name].priority_move) {
            Object.assign(action, EnemyAI.roll_action(action.caster, party_data.members, this.enemies_info.map(info => info.instance)));
        }
        let ability = abilities_list[action.key_name];
        let item_name = "";
        if (action.caster.fighter_type === fighter_types.ALLY && ability !== undefined && ability.can_switch_to_unleash) {
            if (action.caster.equip_slots.weapon && items_list[action.caster.equip_slots.weapon.key_name].unleash_ability) {
                const weapon = items_list[action.caster.equip_slots.weapon.key_name];
                if (Math.random() < weapon.unleash_rate) {
                    item_name = weapon.name;
                    action.key_name = weapon.unleash_ability;
                    ability = abilities_list[weapon.unleash_ability];
                }
            }
        }
        if (ability === undefined) {
            await this.battle_log.add(`${action.key_name} ability key not registered.`);
            await this.wait_for_key();
            this.check_phases();
            return;
        }
        let djinn_name = action.djinn_key_name ? djinni_list[action.djinn_key_name].name : undefined;
        await this.battle_log.add_ability(action.caster, ability, item_name, djinn_name);
        if (ability.pp_cost > action.caster.current_pp) {
            await this.battle_log.add(`... But doesn't have enough PP!`);
            await this.wait_for_key();
            this.check_phases();
            return;
        } else {
            action.caster.current_pp -= ability.pp_cost;
        }
        if (action.type === "djinni") {
            if (ability.effects.some(effect => effect.type === effect_types.SET_DJINN)) {
                djinni_list[action.djinn_key_name].set_status(djinn_status.SET, action.caster);
            } else {
                djinni_list[action.key_name].set_status(djinn_status.STANDBY, action.caster);
            }
        } else if (action.type === "summon") {
            const requirements = _.find(this.data.summons_db, {key_name: ability.key_name}).requirements;
            const standby_djinni = Djinn.get_standby_djinni(MainChar.get_active_players(MAX_CHARS_IN_BATTLE));
            const has_available_djinni = _.every(requirements, (requirement, element) => {
                return standby_djinni[element] >= requirement;
            });
            if (!has_available_djinni) {
                await this.battle_log.add(`${action.caster.name} summons ${ability.name} but`);
                await this.battle_log.add(`doesn't have enough standby Djinn!`);
                await this.wait_for_key();
                this.check_phases();
                return;
            } else {
                Djinn.set_to_recovery(MainChar.get_active_players(MAX_CHARS_IN_BATTLE), requirements);
            }
        }
        this.battle_menu.chars_status_window.update_chars_info();
        if (ability.type === ability_types.UTILITY) {
            await this.wait_for_key();
        }
        if ([ability_types.ADDED_DAMAGE, ability_types.MULTIPLIER, ability_types.BASE_DAMAGE, ability_types.SUMMON, ability_types.HEALING].includes(ability.type)) {
            await this.hp_related_abilities(action, ability);
        } else if ([ability_types.PSYNERGY_DRAIN, ability_types.PSYNERGY_RECOVERY].includes(ability.type)) {
            await this.pp_related_abilities(action, ability);
        }
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
        if (action.type === "summon") {
            const requirements = _.find(this.data.summons_db, {key_name: ability.key_name}).requirements;
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
        this.check_phases();
    }

    async hp_related_abilities(action, ability) {
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
                        const djinn_used = _.sum(_.values(_.find(this.data.summons_db, {key_name: ability.key_name}).requirements));
                        damage = BattleFormulas.summon_damage(target_instance, ability.ability_power, djinn_used);
                        break;
                }
            }
            const ratios = Ability.get_diminishing_ratios(ability.type, ability.use_diminishing_ratio);
            damage = (damage * ratios[target_info.magnitude]) | 0;
            damage += variation();
            if (damage > 0) {
                await this.battle_log.add(`${target_instance.name} takes ${damage.toString()} damage!`);
            } else {
                await this.battle_log.add(`${target_instance.name} recovers ${Math.abs(damage).toString()} HP!`);
            }
            target_instance.current_hp = _.clamp(target_instance.current_hp - damage, 0, target_instance.max_hp);
            this.battle_menu.chars_status_window.update_chars_info();
            await this.wait_for_key();
            if (target_instance.current_hp === 0) {
                target_instance.add_permanent_status(permanent_status.DOWNED);
                await this.battle_log.add(on_catch_status_msg[permanent_status.DOWNED](target_instance));
                await this.wait_for_key();
            }
        }
    }

    async pp_related_abilities(action, ability) {
        for (let i = 0; i < action.targets.length; ++i) {
            const target_info = action.targets[i];
            if (target_info.magnitude === null) continue;
            const target_instance = target_info.target.instance;
            if (target_instance.has_permanent_status(permanent_status.DOWNED)) continue;
            let quantity = 0;
            switch(ability.type) {
                case ability_types.PSYNERGY_RECOVERY:
                    quantity = BattleFormulas.heal_ability(action.caster, ability.ability_power, ability.element);
                    break;
                case ability_types.PSYNERGY_DRAIN:
                    quantity = -BattleFormulas.psynergy_damage(action.caster, target_instance, ability.ability_power, ability.element);
                    break;
            }
            const ratios = Ability.get_diminishing_ratios(ability.type, ability.use_diminishing_ratio);
            quantity = (quantity * ratios[target_info.magnitude]) | 0;
            quantity += variation();
            target_instance.current_pp = _.clamp(target_instance.current_pp + quantity, 0, target_instance.max_pp);
            this.battle_menu.chars_status_window.update_chars_info();
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
        for (let j = 0; j < action.targets.length; ++j) {
            const target_info = action.targets[j];
            if (target_info.magnitude === null) continue;
            const target_instance = target_info.target.instance;
            if (target_instance.has_permanent_status(permanent_status.DOWNED)) continue;
            switch(effect.type) {
                case effect_types.PERMANENT_STATUS:
                    if (effect.add_status && target_instance.permanent_status.has(effect.status_key_name)) break;
                case effect_types.TEMPORARY_STATUS:
                    if (effect.add_status) {
                        if (target_instance.temporary_status.has(effect.status_key_name)) break;
                        let vulnerability = _.find(target_instance.class.vulnerabilities, {
                            status_key_name: effect.status_key_name
                        });
                        vulnerability = vulnerability === undefined ? 0 : vulnerability.chance;
                        const magnitude = diminishing_ratios.STATUS[target_info.magnitude];
                        if (BattleFormulas.ailment_success(action.caster, target_instance, effect.chance, magnitude, ability.element, vulnerability)) {
                            const this_effect = target_instance.add_effect(effect, ability, true);
                            if (this_effect.type === effect_types.TEMPORARY_STATUS) {
                                this.on_going_effects.push(this_effect);
                            }
                            await this.battle_log.add(on_catch_status_msg[effect.status_key_name](target_instance));
                        } else {
                            await this.battle_log.add(`But it has no effect on ${target_instance.name}!`);
                        }
                        await this.wait_for_key();
                    } else {
                        if (Math.random() < effect.chance) {
                            const this_effect = _.find(target_instance.effects, {
                                status_key_name: effect.status_key_name
                            });
                            if (this_effect) {
                                target_instance.remove_effect(this_effect, true);
                                if (this_effect.type === effect_types.TEMPORARY_STATUS) {
                                    this.on_going_effects = this.on_going_effects.filter(effect => {
                                        return effect !== this_effect;
                                    });
                                }
                            }
                        }
                    }
                    break;
                case effect_types.END_THE_ROUND:
                    await this.battle_log.add(`Everybody is resting!`);
                    await this.wait_for_key();
                    return true;
                case effect_types.TURNS:
                    await this.battle_log.add(`${action.caster.name} readies for action!`);
                    await this.wait_for_key();
                    this.on_going_effects.push(target_instance.add_effect(effect, ability, true));
                    break;
                case effect_types.COUNTER_STRIKE: break;
                case effect_types.FLEE: break;
                default:
                    this.on_going_effects.push(target_instance.add_effect(effect, ability, true));
            }
        }
        return false;
    }

    async battle_phase_round_end() {
        this.on_going_effects.filter(effect => {
            --effect.turn_count;
            if (effect.turn_count === 0) {
                target_instance.remove_effect(effect);
                target_instance.update_all();
                return false;
            } else {
                return true;
            }
        });
        for (let i = 0; i < MAX_CHARS_IN_BATTLE; ++i) {
            const player = party_data.members[i];
            if (player === undefined) continue;
            const player_djinni = player.djinni;
            for (let j = 0; j < player_djinni.length; ++j) {
                const djinn_key = player_djinni[j];
                const djinn = djinni_list[djinn_key];
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

    battle_phase_end() {
        if (this.allies_defeated) {
            this.battle_log.add(this.allies_info[0].instance.name + "' party has been defeated!");
        } else {
            this.battle_log.add(this.enemies_party_data.name + " has been defeated!");
        }
        this.unset_battle();
    }

    unset_battle() {

    }

    update() {
        this.battle_stage.update_stage();
    }
}
