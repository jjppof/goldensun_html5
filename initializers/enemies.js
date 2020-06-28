import { Enemy } from '../base/battle/Enemy.js';

export let enemies_list = {};

export function initialize_enemies(enemies_db) {
    for (let i = 0; i < enemies_db.length; ++i) {
        const enemy_data = enemies_db[i];
        enemies_list[enemy_data.key_name] = new Enemy(
            enemy_data.key_name,
            enemy_data.name,
            enemy_data.level,
            enemy_data.turns,
            enemy_data.max_hp,
            enemy_data.max_pp,
            enemy_data.hp_recovery,
            enemy_data.pp_recovery,
            enemy_data.atk,
            enemy_data.def,
            enemy_data.agi,
            enemy_data.luk,
            enemy_data.battle_scale,
            enemy_data.items,
            enemy_data.abilities,
            enemy_data.coins_reward,
            enemy_data.item_reward,
            enemy_data.item_reward_change,
            enemy_data.exp_reward,
            enemy_data.venus_level,
            enemy_data.mercury_level,
            enemy_data.mars_level,
            enemy_data.jupiter_level,
            enemy_data.venus_power,
            enemy_data.mercury_power,
            enemy_data.mars_power,
            enemy_data.jupiter_power,
            enemy_data.venus_resist,
            enemy_data.mercury_resist,
            enemy_data.mars_resist,
            enemy_data.jupiter_resist
        );
    }
}