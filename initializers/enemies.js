import { EnemyBase } from '../base/Enemy.js';

export let enemies_list = {};

export function initialize_enemies(game, enemies_db, load_promise_resolve) {
    let load_promises = [];
    for (let i = 0; i < enemies_db.length; ++i) {
        const enemy_data = enemies_db[i];
        enemies_list[enemy_data.key_name] = new EnemyBase(enemy_data.key_name, enemy_data.battle_scale, enemy_data);

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