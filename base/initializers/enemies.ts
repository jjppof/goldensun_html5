import {SpriteBase} from "../SpriteBase";

export function initialize_enemies(game, enemies_db, load_promise_resolve) {
    let load_promises = [];
    let enemies_list = {};
    for (let i = 0; i < enemies_db.length; ++i) {
        let info = {
            data: enemies_db[i],
            sprite_base: null,
        };
        info.sprite_base = new SpriteBase(info.data.key_name, ["battle"]);

        const action = info.data.battle_spritesheet;
        if (action !== undefined) {
            info.sprite_base.setActionSpritesheet("battle", action.spritesheet_img, action.spritesheet);
            info.sprite_base.setActionDirections("battle", action.positions, action.frames_number);
            info.sprite_base.setActionFrameRate("battle", action.frame_rate);
            info.sprite_base.setActionLoop("battle", action.loop);
            info.sprite_base.generateAllFrames();

            let load_spritesheet_promise_resolve;
            const load_spritesheet_promise = new Promise(resolve => {
                load_spritesheet_promise_resolve = resolve;
            });
            load_promises.push(load_spritesheet_promise);
            info.sprite_base.loadSpritesheets(game, true, load_spritesheet_promise_resolve);
        }
        enemies_list[info.data.key_name] = info;
    }
    Promise.all(load_promises).then(load_promise_resolve);
    return enemies_list;
}
