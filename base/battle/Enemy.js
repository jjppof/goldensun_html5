import { SpriteBase } from "../SpriteBase.js";
import { enemies_list } from "../../initializers/enemies.js";
import { fighter_types } from "./Battle.js";

export class Enemy {
    constructor(enemy_data, name) {
        this.key_name = enemy_data.key_name;
        this.name = name ? name : enemy_data.name;
        this.level = enemy_data.level;
        this.turns = enemy_data.turns;
        this.max_hp = enemy_data.max_hp;
        this.current_hp = enemy_data.max_hp;
        this.max_pp = enemy_data.max_pp;
        this.current_pp = enemy_data.max_pp;
        this.hp_recovery = enemy_data.hp_recovery;
        this.current_hp_recovery = enemy_data.hp_recovery;
        this.pp_recovery = enemy_data.pp_recovery;
        this.current_pp_recovery = enemy_data.pp_recovery;
        this.atk = enemy_data.atk;
        this.current_atk = enemy_data.atk;
        this.def = enemy_data.def;
        this.current_def = enemy_data.def;
        this.agi = enemy_data.agi;
        this.current_agi = enemy_data.agi;
        this.luk = enemy_data.luk;
        this.current_luk = enemy_data.luk;
        this.items = enemy_data.items;
        this.abilities = enemy_data.abilities;
        this.coins_reward = enemy_data.coins_reward;
        this.item_reward = enemy_data.item_reward;
        this.item_reward_chance = enemy_data.item_reward_chance;
        this.exp_reward = enemy_data.exp_reward;
        this.venus_level = enemy_data.venus_level;
        this.venus_level_current = enemy_data.venus_level;
        this.mercury_level = enemy_data.mercury_level;
        this.mercury_level_current = enemy_data.mercury_level;
        this.mars_level = enemy_data.mars_level;
        this.mars_level_current = enemy_data.mars_level;
        this.jupiter_level = enemy_data.jupiter_level;
        this.jupiter_level_current = enemy_data.jupiter_level;
        this.venus_power = enemy_data.venus_power;
        this.venus_power_current = enemy_data.venus_power;
        this.mercury_power = enemy_data.mercury_power;
        this.mercury_power_current = enemy_data.mercury_power;
        this.mars_power = enemy_data.mars_power;
        this.mars_power_current = enemy_data.mars_power;
        this.jupiter_power = enemy_data.jupiter_power;
        this.jupiter_power_current = enemy_data.jupiter_power;
        this.venus_resist = enemy_data.venus_resist;
        this.venus_resist_current = enemy_data.venus_resist;
        this.mercury_resist = enemy_data.mercury_resist;
        this.mercury_resist_current = enemy_data.mercury_resist;
        this.mars_resist = enemy_data.mars_resist;
        this.mars_resist_current = enemy_data.mars_resist;
        this.jupiter_resist = enemy_data.jupiter_resist;
        this.jupiter_resist_current = enemy_data.jupiter_resist;
        this.fighter_type = fighter_types.ENEMY;
        this.temporary_status = new Set();
        this.permanent_status = new Set();
    }

    add_permanent_status(status) {
        this.permanent_status.add(status);
    }

    remove_permanent_status(status) {
        this.permanent_status.delete(status);
    }

    add_temporary_status(status) {
        this.temporary_status.add(status);
    }

    remove_temporary_status(status) {
        this.temporary_status.delete(status);
    }
}

export class EnemyBase extends SpriteBase {
    constructor(
        key_name,
        battle_scale,
        data
    ) {
        super(key_name, ["battle"]);
        this.key_name = key_name;
        this.battle_scale = battle_scale;
        this.data = data;
    }
}

export function get_enemy_instance(key_name, suffix) {
    return new Enemy(enemies_list[key_name].data, enemies_list[key_name].data.name + suffix);
}