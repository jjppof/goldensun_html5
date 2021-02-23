import {GoldenSun} from "../GoldenSun";
import {SpriteBase} from "../SpriteBase";
import {base_actions} from "../utils";

export function initialize_enemies(
    game: Phaser.Game,
    data: GoldenSun,
    enemies_db: any,
    load_promise_resolve: () => void
) {
    const enemies_list = {};
    for (let i = 0; i < enemies_db.length; ++i) {
        const info = {
            data: enemies_db[i],
            sprite_base: null,
        };
        info.sprite_base = new SpriteBase(info.data.key_name, [base_actions.BATTLE]);

        const action = info.data.battle_spritesheet;
        if (action !== undefined) {
            info.sprite_base.setActionSpritesheet(base_actions.BATTLE, action.spritesheet_img, action.spritesheet);
            info.sprite_base.setActionAnimations(base_actions.BATTLE, action.positions, action.frames_number);
            info.sprite_base.setActionFrameRate(base_actions.BATTLE, action.frame_rate);
            info.sprite_base.setActionLoop(base_actions.BATTLE, action.loop);
            info.sprite_base.generateAllFrames();
            info.sprite_base.loadSpritesheets(game, false);
        }
        enemies_list[info.data.key_name] = info;
    }
    game.load.start();
    data.loading_what = "enemies sprites";
    game.load.onLoadComplete.addOnce(load_promise_resolve);
    return enemies_list;
}
