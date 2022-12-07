import {GoldenSun} from "../GoldenSun";
import {SpriteBase} from "../SpriteBase";
import {base_actions} from "../utils";
import {GameInfo} from "./initialize_info";

export function initialize_enemies(
    game: Phaser.Game,
    data: GoldenSun,
    enemies_db: any,
    load_promise_resolve: () => void
) {
    const enemies_list: GameInfo["enemies_list"] = {};
    for (let i = 0; i < enemies_db.length; ++i) {
        const info = {
            data: enemies_db[i],
            sprite_base: null,
        };
        info.sprite_base = new SpriteBase(info.data.key_name, [base_actions.BATTLE]);

        const battle_spritesheet = info.data.battle_spritesheet;
        if (battle_spritesheet !== undefined) {
            let action;
            if (typeof battle_spritesheet !== "string") {
                action = battle_spritesheet;
            } else {
                const alias = enemies_db.find(dt => dt.key_name === battle_spritesheet);
                if (alias) {
                    action = alias.battle_spritesheet;
                }
            }
            if (action) {
                info.sprite_base.setActionSpritesheet(
                    base_actions.BATTLE,
                    action.spritesheet.image,
                    action.spritesheet.json
                );
                info.sprite_base.setActionAnimations(base_actions.BATTLE, action.animations, action.frames_count);
                info.sprite_base.setActionFrameRate(base_actions.BATTLE, action.frame_rate);
                info.sprite_base.setActionLoop(base_actions.BATTLE, action.loop);
                info.sprite_base.generateAllFrames();
                info.sprite_base.loadSpritesheets(game, false);
            }
        }
        enemies_list[info.data.key_name] = info;
    }
    game.load.start();
    data.set_whats_loading("enemies sprites");
    game.load.onLoadComplete.addOnce(load_promise_resolve);
    return enemies_list;
}
