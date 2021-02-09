import {SpriteBase} from "../SpriteBase";

export function initialize_misc_data(game, misc_db, load_promise_resolve) {
    let misc_sprite_base_list = {};
    let load_promises = [];
    for (let misc_key in misc_db) {
        const misc_data = misc_db[misc_key];
        const sprite_base = new SpriteBase(misc_data.key_name, Object.keys(misc_data.actions));
        misc_sprite_base_list[misc_data.key_name] = sprite_base;
        for (let action_key in misc_data.actions) {
            const action = misc_data.actions[action_key];
            sprite_base.setActionSpritesheet(action_key, action.spritesheet.image, action.spritesheet.json);
            sprite_base.setActionAnimations(action_key, action.animations, action.frames_count);
            sprite_base.setActionFrameRate(action_key, action.frame_rate);
            sprite_base.setActionLoop(action_key, action.loop);
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
