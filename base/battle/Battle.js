import { party_data, main_char_list } from "../../initializers/main_chars.js";
import { BattleStage } from "./BattleStage.js";
import { enemies_list } from "../../initializers/enemies.js";
import { BattleLog } from "./BattleLog.js";
import { BattleMenuScreen } from "../../screens/battle_menus.js";
import { get_enemy_instance } from "./Enemy.js";
import { abilities_list } from "../../initializers/abilities.js";
import { ability_target_types, ability_types } from "../Ability.js";
import { ChoosingTargetWindow } from "../windows/battle/ChoosingTargetWindow.js";
import { EnemyAI } from "./EnemyAI.js";
import { BattleFormulas, CRITICAL_CHANCE, EVASION_CHANCE, DELUSION_MISS_CHANCE } from "./BattleFormulas.js";
import { effect_types, Effect } from "../Effect.js";
import { variation } from "../../utils.js";
import { temporary_status } from "../MainChar.js";

export const MAX_CHARS_IN_BATTLE = 4;
export const fighter_types = {
    ALLY: 1,
    ENEMY: 2,
}

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
                scale: char.battle_scale
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
        ++this.enter_propagation_priority;
        ++this.esc_propagation_priority;
        this.set_controls();
    }

    set_controls() {
        this.data.enter_input.add(() => {
            if (!this.data.in_battle || !this.controls_enabled) return;
            this.data.enter_input.halt();
            this.controls_enabled = false;
            switch (this.battle_phase) {
                case battle_phases.START:
                    this.battle_log.clear();
                    this.battle_phase = battle_phases.MENU;
                    this.check_phases();
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

    choose_targets(ability_key, action, callback, item_obj) {
        const this_ability = abilities_list[ability_key];
        let quantities;
        if (action === "psynergy") {
            quantities = [this_ability.pp_cost];
        }
        this.target_window.open(action, this_ability.name, this_ability.element, ability_key, quantities, item_obj);
        this.battle_stage.choose_targets(
            this_ability.range,
            this_ability.battle_target === ability_target_types.ALLY,
            this_ability.type,
            targets => {
                this.target_window.close();
                callback(targets);
            }
        );
    }

    check_phases() {
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
                this.player_abilities[char_key][i].speed = BattleFormulas.player_turn_speed(this_char.current_agi, this_ability.priority_move, i > 0);
                this.player_abilities[char_key][i].caster = this_char;
            }
        }
        for (let battle_key in this.enemies_abilities) {
            const this_enemy = this.this_enemies_list[battle_key];
            for (let i = 0; i < this.enemies_abilities[battle_key].length; ++i) {
                const this_ability = abilities_list[this.enemies_abilities[battle_key][i].key_name];
                this.enemies_abilities[battle_key][i].speed = BattleFormulas.enemy_turn_speed(this_enemy.current_agi, i + 1, this_enemy.turns, this_ability.priority_move);
                this.enemies_abilities[battle_key][i].caster = this_enemy;
            }
        }
        this.turns_actions = _.sortBy(Object.values(this.player_abilities).flat().concat(Object.values(this.enemies_abilities).flat()), action => {
            return action.speed; //still need to add left most and player preference criterias
        });
        this.battle_phase = battle_phases.COMBAT;
        this.check_phases();
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
    battle_phase_combat() {
        if (!this.turns_actions.length) {
            this.battle_phase = battle_phases.ROUND_END;
            this.check_phases();
            return;
        }
        const action = this.turns_actions.pop();
        if (action.caster.fighter_type === fighter_types.ENEMY && !abilities_list[action.key_name].priority_move) {
            Object.assign(action, EnemyAI.roll_action(enemy, party_data.members, this.enemies_info.map(info => info.instance)));
        }
        const ability = abilities_list[action.key_name];
        if ([ability_types.ADDED_DAMAGE, ability_types.MULTIPLIER, ability_types.BASE_DAMAGE, ability_types.SUMMON].includes(ability.type)) {
            this.harmful_abilities(action, ability);
        } else {
            
        }
    }

    harmful_abilities(action, ability) {
        if (ability.has_ability_unleash) {
            if (action.caster.equip_slots.weapon && items_list[action.caster.equip_slots.weapon.key_name].unleash_ability) {
                if (Math.random() < items_list[action.caster.equip_slots.weapon.key_name].unleash_rate) {
                    ability = abilities_list[items_list[action.caster.equip_slots.weapon.key_name].unleash_ability];
                }
            }
        }
        if (ability.can_be_evaded) {
            if (Math.random() < EVASION_CHANCE || (action.caster.temporary_status.has(temporary_status.DELUSION) && Math.random() < DELUSION_MISS_CHANCE)) {
                return;
            }
        }
        if (ability.has_critical) {
            const increased_crit = action.caster.effects.filter(effect => effect.type === effect_types.CRITICALS).reduce((acc, effect) => {
                return Effect.apply_operator(acc, effect.quantity, effect.operator);
            }, 0);
            if (Math.random() < CRITICAL_CHANCE || Math.random() < increased_crit/2) {
                action.targets.forEach(target_info => {
                    const target_instance = target_info.target.instance;
                    let damage = BattleFormulas.critical_damage(action.caster, target_instance, ability.crit_mult_factor);
                    damage = damage * target_info.magnitude + variation();
                });
                return;
            }
        }
        for (let i = 0; i < action.targets.length; ++i) {
            const target_info = action.targets[i];
            const target_instance = target_info.target.instance;
            let damage;
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
                case ability_types.SUMMON:
                    const djinn_used = _.sum(_.values(_.find(this.data.summons_db, {key_name: ability.key_name}).requirements));
                    damage = BattleFormulas.summon_damage(target_instance, ability.ability_power, djinn_used);
                    break;
            }
            damage = damage * target_info.magnitude + variation();
        }
    }

    battle_phase_round_end() {

    }

    update() {
        this.battle_stage.update_stage()
    }
}
