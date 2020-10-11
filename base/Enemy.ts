import { SpriteBase } from "./SpriteBase";
import { Player, fighter_types } from "./Player";
import { ordered_elements } from "./utils.js";
import * as _ from "lodash";
import * as numbers from "./magic_numbers.js";
import { effect_types } from "./Effect";

export class Enemy extends Player {
    public level: number;
    public turns: number;
    public max_hp: number;
    public max_pp: number;
    public hp_recovery: number;
    public pp_recovery: number;
    public atk: number;
    public def: number;
    public agi: number;
    public luk: number;
    public items: {
        key_name: string,
        quantity: number,
        use_weight: number
    }[];
    public abilities: {
        key_name: string,
        use_weight: number
    }[];
    public coins_reward: number;
    public item_reward: string;
    public item_reward_chance: number;
    public exp_reward: number;
    public venus_level: number;
    public mercury_level: number;
    public mars_level: number;
    public jupiter_level: number;
    public venus_power: number;
    public mercury_power: number;
    public mars_power: number;
    public jupiter_power: number;
    public venus_resist: number;
    public mercury_resist: number;
    public mars_resist: number;
    public jupiter_resist: number;
    public battle_animations_variations: {[ability_key: string]: string};
    public class: any;
    public current_exp: number;
    public current_hp: number;
    public current_pp: number;
    public current_hp_recovery: number;
    public current_pp_recovery: number;
    public current_atk: number;
    public current_def: number;
    public current_agi: number;
    public current_luk: number;
    public venus_level_current: number;
    public mercury_level_current: number;
    public mars_level_current: number;
    public jupiter_level_current: number;
    public venus_power_current: number;
    public mercury_power_current: number;
    public mars_power_current: number;
    public jupiter_power_current: number;
    public venus_resist_current: number;
    public mercury_resist_current: number;
    public mars_resist_current: number;
    public jupiter_resist_current: number;

    constructor(enemy_data, name) {
        super(enemy_data.key_name, name ? name : enemy_data.name);
        this.level = enemy_data.level;
        this.turns = enemy_data.turns;
        this.max_hp = enemy_data.max_hp;
        this.max_pp = enemy_data.max_pp;
        this.hp_recovery = enemy_data.hp_recovery;
        this.pp_recovery = enemy_data.pp_recovery;
        this.atk = enemy_data.atk;
        this.def = enemy_data.def;
        this.agi = enemy_data.agi;
        this.luk = enemy_data.luk;
        this.items = enemy_data.items;
        this.abilities = enemy_data.abilities;
        this.coins_reward = enemy_data.coins_reward;
        this.item_reward = enemy_data.item_reward;
        this.item_reward_chance = enemy_data.item_reward_chance;
        this.exp_reward = enemy_data.exp_reward;
        this.venus_level = enemy_data.venus_level;
        this.mercury_level = enemy_data.mercury_level;
        this.mars_level = enemy_data.mars_level;
        this.jupiter_level = enemy_data.jupiter_level;
        this.venus_power = enemy_data.venus_power;
        this.mercury_power = enemy_data.mercury_power;
        this.mars_power = enemy_data.mars_power;
        this.jupiter_power = enemy_data.jupiter_power;
        this.venus_resist = enemy_data.venus_resist;
        this.mercury_resist = enemy_data.mercury_resist;
        this.mars_resist = enemy_data.mars_resist;
        this.jupiter_resist = enemy_data.jupiter_resist;
        this.battle_scale = enemy_data.battle_scale;
        this.battle_animations_variations = Object.assign({}, enemy_data.battle_animations_variations);
        this.fighter_type = fighter_types.ENEMY;
        this.class = {
            name: "No Class",
            vulnerabilities: enemy_data.vulnerabilities === undefined ? [] : enemy_data.vulnerabilities
        };
        this.current_exp = -1;
        this.effects = [];
        this.set_base_attributes();
    }

    set_base_attributes() {
        this.current_hp = this.max_hp;
        this.current_pp = this.max_pp;
        this.current_hp_recovery = this.hp_recovery;
        this.current_pp_recovery = this.pp_recovery;
        this.current_atk = this.atk;
        this.current_def = this.def;
        this.current_agi = this.agi;
        this.current_luk = this.luk;
        this.venus_level_current = this.venus_level;
        this.mercury_level_current = this.mercury_level;
        this.mars_level_current = this.mars_level;
        this.jupiter_level_current = this.jupiter_level;
        this.venus_power_current = this.venus_power;
        this.mercury_power_current = this.mercury_power;
        this.mars_power_current = this.mars_power;
        this.jupiter_power_current = this.jupiter_power;
        this.venus_resist_current = this.venus_resist;
        this.mercury_resist_current = this.mercury_resist;
        this.mars_resist_current = this.mars_resist;
        this.jupiter_resist_current = this.jupiter_resist;
    }

    update_all() {
        this.set_base_attributes();
        this.effects.forEach(effect => {
            switch (effect.type) {
                case effect_types.POWER:
                case effect_types.RESIST:
                case effect_types.MAX_HP:
                case effect_types.MAX_PP:
                case effect_types.ATTACK:
                case effect_types.DEFENSE:
                case effect_types.AGILITY:
                case effect_types.LUCK:
                    effect.apply_effect();
                    break;
            }
        });
        for (let i = 0; i < ordered_elements.length; ++i) {
            const element = ordered_elements[i];
            const power_key = element + "_power_current";
            const resist_key = element + "_resist_current";
            this[power_key] = _.clamp(this[power_key], numbers.ELEM_ATTR_MIN, numbers.ELEM_ATTR_MAX);
            this[resist_key] = _.clamp(this[resist_key], numbers.ELEM_ATTR_MIN, numbers.ELEM_ATTR_MAX);
        }
    }
}

export class EnemyBase extends SpriteBase {
    constructor(key_name) {
        super(key_name, ["battle"]);
    }
}

export function get_enemy_instance(enemy_data, suffix) {
    return new Enemy(enemy_data, enemy_data.name + suffix);
}