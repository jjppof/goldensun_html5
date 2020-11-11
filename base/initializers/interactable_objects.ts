import {SpriteBase} from "../SpriteBase";

export function initialize_interactable_objs_data(game, interactable_objects_db, load_promise_resolve) {
    let iter_obj_sprite_base_list = {};
    let load_promises = [];
    for (let interactable_objects_key in interactable_objects_db) {
        const iter_obj_data = interactable_objects_db[interactable_objects_key];
        const sprite_base = new SpriteBase(iter_obj_data.key_name, [iter_obj_data.key_name]);
        iter_obj_sprite_base_list[iter_obj_data.key_name] = sprite_base;
        sprite_base.setActionSpritesheet(
            iter_obj_data.key_name,
            iter_obj_data.spritesheet.image,
            iter_obj_data.spritesheet.json
        );
        sprite_base.setActionDirections(
            iter_obj_data.key_name,
            iter_obj_data.actions.animations,
            iter_obj_data.actions.frames_count
        );
        sprite_base.setActionFrameRate(iter_obj_data.key_name, iter_obj_data.actions.frame_rate);
        sprite_base.setActionLoop(iter_obj_data.key_name, iter_obj_data.actions.loop);
        sprite_base.generateAllFrames();
        let load_spritesheet_promise_resolve;
        const load_spritesheet_promise = new Promise(resolve => {
            load_spritesheet_promise_resolve = resolve;
        });
        load_promises.push(load_spritesheet_promise);
        sprite_base.loadSpritesheets(game, true, load_spritesheet_promise_resolve);
    }
    Promise.all(load_promises).then(load_promise_resolve);
    return iter_obj_sprite_base_list;
}
