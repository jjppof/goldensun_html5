import {GoldenSun} from "../GoldenSun";
import {SpriteBase} from "../SpriteBase";
import {GameInfo} from "./initialize_info";

export function initialize_interactable_objs_data(
    game: Phaser.Game,
    data: GoldenSun,
    interactable_objects_db: any,
    load_promise_resolve: () => void
) {
    const iter_obj_sprite_base_list: GameInfo["iter_objs_sprite_base_list"] = {};
    let at_least_one_to_load = false;
    for (let interactable_objects_key in interactable_objects_db) {
        const iter_obj_data = interactable_objects_db[interactable_objects_key];
        if (!iter_obj_data.key_name) {
            console.warn("Interactable object registered without a key name. Please double-check.");
            continue;
        }
        if (iter_obj_data.actions) {
            const actions = Object.keys(iter_obj_data.actions);
            const sprite_base = new SpriteBase(iter_obj_data.key_name, actions);
            iter_obj_sprite_base_list[iter_obj_data.key_name] = sprite_base;
            for (let i = 0; i < actions.length; ++i) {
                const action_key = actions[i];
                let action_obj;
                if ("same_as" in iter_obj_data.actions[action_key]) {
                    const reference_key = iter_obj_data.actions[action_key].same_as;
                    action_obj = iter_obj_data.actions[reference_key];
                } else {
                    action_obj = iter_obj_data.actions[action_key];
                }
                sprite_base.setActionSpritesheet(action_key, action_obj.spritesheet.image, action_obj.spritesheet.json);
                sprite_base.setActionAnimations(action_key, action_obj.animations, action_obj.frames_count);
                sprite_base.setActionFrameRate(action_key, action_obj.frame_rate);
                sprite_base.setActionLoop(action_key, action_obj.loop);
            }
            sprite_base.generateAllFrames();
            sprite_base.loadSpritesheets(game, false);
            at_least_one_to_load = true;
        }
    }
    if (at_least_one_to_load) {
        game.load.start();
        data.set_whats_loading("interactable objects sprites");
        game.load.onLoadComplete.addOnce(load_promise_resolve);
    }
    return iter_obj_sprite_base_list;
}
