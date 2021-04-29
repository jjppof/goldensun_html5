import {GoldenSun} from "../GoldenSun";
import {SpriteBase} from "../SpriteBase";
import {GameInfo} from "./initialize_info";

export function initialize_misc_data(
    game: Phaser.Game,
    data: GoldenSun,
    misc_db: any,
    load_promise_resolve: () => void
) {
    const misc_sprite_base_list: GameInfo["misc_sprite_base_list"] = {};
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
        sprite_base.loadSpritesheets(game, false);
    }
    game.load.start();
    data.set_whats_loading("misc sprites");
    game.load.onLoadComplete.addOnce(load_promise_resolve);
    return misc_sprite_base_list;
}
