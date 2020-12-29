import {SpriteBase} from "./SpriteBase";
import {Player, fighter_types} from "./Player";
import {ordered_elements} from "./utils";
import * as _ from "lodash";
import * as numbers from "./magic_numbers";
import {effect_types} from "./Effect";

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
    public class: any;
    public current_hp_recovery: number;
    public current_pp_recovery: number;

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
        this.base_level = Object.assign({}, enemy_data.base_level);
        this.base_power = Object.assign({}, enemy_data.base_power);
        this.base_resist = Object.assign({}, enemy_data.base_resist);
        this.battle_scale = enemy_data.battle_scale;
        this.battle_shadow_key = enemy_data.battle_shadow_key;
        this.battle_animations_variations = Object.assign({}, enemy_data.battle_animations_variations);
        this.fighter_type = fighter_types.ENEMY;
        this.class = {
            name: "No Class",
            vulnerabilities: enemy_data.vulnerabilities === undefined ? [] : enemy_data.vulnerabilities,
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
    }
}

export function get_enemy_instance(enemy_data, suffix) {
    return new Enemy(enemy_data, enemy_data.name + suffix);
}
