import {GoldenSun} from "../GoldenSun";
import {SpriteBase} from "../SpriteBase";

export function initialize_interactable_objs_data(
    game: Phaser.Game,
    data: GoldenSun,
    interactable_objects_db: any,
    load_promise_resolve: () => void
) {
    const iter_obj_sprite_base_list = {};
    for (let interactable_objects_key in interactable_objects_db) {
        const iter_obj_data = interactable_objects_db[interactable_objects_key];
        const sprite_base = new SpriteBase(iter_obj_data.key_name, [iter_obj_data.key_name]);
        iter_obj_sprite_base_list[iter_obj_data.key_name] = sprite_base;
        sprite_base.setActionSpritesheet(
            iter_obj_data.key_name,
            iter_obj_data.spritesheet.image,
            iter_obj_data.spritesheet.json
        );
        sprite_base.setActionAnimations(
            iter_obj_data.key_name,
            iter_obj_data.actions.animations,
            iter_obj_data.actions.frames_count
        );
        sprite_base.setActionFrameRate(iter_obj_data.key_name, iter_obj_data.actions.frame_rate);
        sprite_base.setActionLoop(iter_obj_data.key_name, iter_obj_data.actions.loop);
        sprite_base.generateAllFrames();
        sprite_base.loadSpritesheets(game, false);
    }
    game.load.start();
    data.loading_what = "interactable objects sprites";
    game.load.onLoadComplete.addOnce(load_promise_resolve);
    return iter_obj_sprite_base_list;
}
