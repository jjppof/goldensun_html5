import { Enemy } from '../base/battle/Enemy.js';

export let enemies_list = {};

export function initialize_enemies(game, enemies_db, load_promise_resolve) {
    let load_promises = [];
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

        const action = enemy_data.battle_spritesheet;
        if (action !== undefined) {
            enemies_list[enemy_data.key_name].setActionSpritesheet(action.key, action.spritesheet_img, action.spritesheet);
            enemies_list[enemy_data.key_name].setActionDirections(action.key, action.directions, action.directions_frames_number);
            enemies_list[enemy_data.key_name].setActionFrameRate(action.key, action.frame_rate);
            enemies_list[enemy_data.key_name].setActionLoop(action.key, action.loop);
            enemies_list[enemy_data.key_name].addAnimations();

            let load_spritesheet_promise_resolve;
            let load_spritesheet_promise = new Promise(resolve => {
                load_spritesheet_promise_resolve = resolve;
            });
            load_promises.push(load_spritesheet_promise);
            enemies_list[enemy_data.key_name].loadSpritesheets(game, true, load_spritesheet_promise_resolve);
        }
    }
    Promise.all(load_promises).then(load_promise_resolve);
}