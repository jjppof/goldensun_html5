import {Player, fighter_types, main_stats} from "./Player";
import {ordered_elements} from "./utils";
import * as _ from "lodash";
import * as numbers from "./magic_numbers";
import {effect_types} from "./Effect";
import {Classes} from "./Classes";

export class Enemy extends Player {
    public items: {
        key_name: string;
        quantity: number;
        use_weight: number;
    }[];
    public abilities: {
        key_name: string;
        use_weight: number;
    }[];
    public coins_reward: number;
    public item_reward: string;
    public item_reward_chance: number;
    public exp_reward: number;
    public class: Classes;
    public current_hp_recovery: number;
    public current_pp_recovery: number;
    public weight_pick_random_ability: number;
    public weight_recover_ailment: number;
    public weight_recover_hp: number;
    public target_weaker_chance: number;
    public base_stats: {[main_stat in main_stats]?: number};

    constructor(enemy_data, name) {
        super(enemy_data.key_name, name ? name : enemy_data.name);
        this.level = enemy_data.level;
        this.turns = enemy_data.turns;
        this.base_turns = this.turns;
        this.current_hp = enemy_data.max_hp;
        this.current_pp = enemy_data.max_pp;
        this.hp_recovery = enemy_data.hp_recovery;
        this.pp_recovery = enemy_data.pp_recovery;
        this.base_stats = {};
        [
            main_stats.MAX_HP,
            main_stats.MAX_PP,
            main_stats.ATTACK,
            main_stats.DEFENSE,
            main_stats.AGILITY,
            main_stats.LUCK,
        ].forEach(stat => {
            this.base_stats[stat] = enemy_data[stat];
            this[stat] = enemy_data[stat];
        });
        this.items = enemy_data.items;
        this.abilities = enemy_data.abilities;
        this.coins_reward = enemy_data.coins_reward;
        this.item_reward = enemy_data.item_reward;
        this.item_reward_chance = enemy_data.item_reward_chance;
        this.exp_reward = enemy_data.exp_reward;
        this.base_level = Object.assign({}, enemy_data.base_level);
        this.base_power = Object.assign({}, enemy_data.base_power);
        this.base_resist = Object.assign({}, enemy_data.base_resist);
        this.battle_scale = enemy_data.battle_scale;
        this.battle_shadow_key = enemy_data.battle_shadow_key;
        this.status_sprite_shift = enemy_data.status_sprite_shift ?? 0;
        this.battle_animations_variations = Object.assign({}, enemy_data.battle_animations_variations);
        this.fighter_type = fighter_types.ENEMY;
        this.weight_pick_random_ability = enemy_data.weight_pick_random_ability ?? 1.0;
        this.weight_recover_ailment = enemy_data.weight_recover_ailment ?? 1.0;
        this.weight_recover_hp = enemy_data.weight_recover_hp ?? 1.0;
        this.target_weaker_chance = enemy_data.target_weaker_chance ?? 0.5;
        this.class = new Classes(
            "no_class",
            "No Class",
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            enemy_data.vulnerabilities
        );
        this.current_exp = -1;
        this.effects = [];
        this.set_base_attributes();
    }

    set_base_attributes() {
        [
            main_stats.MAX_HP,
            main_stats.MAX_PP,
            main_stats.ATTACK,
            main_stats.DEFENSE,
            main_stats.AGILITY,
            main_stats.LUCK,
        ].forEach(stat => {
            this[stat] = this.before_buff_stats[stat] = this.base_stats[stat];
            this.buff_stats[stat] = 0;
        });
        this.current_hp_recovery = this.hp_recovery;
        this.current_pp_recovery = this.pp_recovery;
        this.extra_turns = 0;
        for (let element of ordered_elements) {
            this.current_power[element] = this.base_power[element];
            this.current_resist[element] = this.base_resist[element];
            this.current_level[element] = this.base_level[element];
        }
    }

    update_all() {
        this.set_base_attributes();
        this.effects.forEach(effect => {
            switch (effect.type) {
                case effect_types.POWER:
                case effect_types.RESIST:
                case effect_types.ELEMENTAL_LEVEL:
                case effect_types.ATTACK:
                case effect_types.DEFENSE:
                case effect_types.AGILITY:
                case effect_types.LUCK:
                case effect_types.TURNS:
                    effect.apply_effect();
                    break;
            }
        });
        this.atk += this.buff_stats.atk;
        this.def += this.buff_stats.def;
        this.agi += this.buff_stats.agi;
        this.luk += this.buff_stats.luk;
        this.max_hp += this.buff_stats.max_hp;
        this.max_pp += this.buff_stats.max_pp;
        for (let i = 0; i < ordered_elements.length; ++i) {
            const element = ordered_elements[i];
            this.current_power[element] = _.clamp(
                this.current_power[element],
                numbers.ELEM_ATTR_MIN,
                numbers.ELEM_ATTR_MAX
            );
            this.base_resist[element] = _.clamp(
                this.base_resist[element],
                numbers.ELEM_ATTR_MIN,
                numbers.ELEM_ATTR_MAX
            );
        }
        this.apply_turns_count_value();
    }
}

export function get_enemy_instance(enemy_data, suffix: string) {
    return new Enemy(enemy_data, enemy_data.name + suffix);
}
