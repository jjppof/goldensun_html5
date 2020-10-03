import { SpriteBase } from '../SpriteBase.js';

export function initialize_misc_data(game, misc_db, load_promise_resolve) {
    let misc_sprite_base_list = {};
    let load_promises = [];
    for (let i = 0; i < misc_db.length; ++i) {
        const misc_data = misc_db[i];
        const sprite_base = new SpriteBase(misc_data.key_name, misc_data.actions.map(action => action.key_name));
        misc_sprite_base_list[misc_data.key_name] = sprite_base;
        for (let j = 0; j < misc_data.actions.length; ++j) {
            const action = misc_data.actions[j];
            sprite_base.setActionSpritesheet(action.key_name, action.spritesheet.image, action.spritesheet.json);
            sprite_base.setActionDirections(action.key_name, action.animations, action.frames_count);
            sprite_base.setActionFrameRate(action.key_name, action.frame_rate);
            sprite_base.setActionLoop(action.key_name, action.loop);
        }
        sprite_base.generateAllFrames();
        let load_spritesheet_promise_resolve;
        const load_spritesheet_promise = new Promise(resolve => {
            load_spritesheet_promise_resolve = resolve;
        });
        load_promises.push(load_spritesheet_promise);
        sprite_base.loadSpritesheets(game, true, load_spritesheet_promise_resolve);
    }
    Promise.all(load_promises).then(load_promise_resolve);
    return misc_sprite_base_list;
}