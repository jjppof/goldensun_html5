import { EnemyBase } from '../Enemy.js';

export function initialize_enemies(game, enemies_db, load_promise_resolve) {
    let load_promises = [];
    let enemies_list = {};
    for (let i = 0; i < enemies_db.length; ++i) {
        const enemy_data = enemies_db[i];
        enemies_list[enemy_data.key_name] = new EnemyBase(enemy_data.key_name, enemy_data.battle_scale, enemy_data);

        const action = enemy_data.battle_spritesheet;
        if (action !== undefined) {
            enemies_list[enemy_data.key_name].setActionSpritesheet("battle", action.spritesheet_img, action.spritesheet);
            enemies_list[enemy_data.key_name].setActionDirections("battle", action.positions, action.frames_number);
            enemies_list[enemy_data.key_name].setActionFrameRate("battle", action.frame_rate);
            enemies_list[enemy_data.key_name].setActionLoop("battle", action.loop);
            enemies_list[enemy_data.key_name].generateAllFrames();

            let load_spritesheet_promise_resolve;
            const load_spritesheet_promise = new Promise(resolve => {
                load_spritesheet_promise_resolve = resolve;
            });
            load_promises.push(load_spritesheet_promise);
            enemies_list[enemy_data.key_name].loadSpritesheets(game, true, load_spritesheet_promise_resolve);
        }
    }
    Promise.all(load_promises).then(load_promise_resolve);
    return enemies_list;
}