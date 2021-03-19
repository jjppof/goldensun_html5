import {GoldenSun} from "../GoldenSun";
import {SpriteBase} from "../SpriteBase";

export function initialize_npcs_data(
    game: Phaser.Game,
    data: GoldenSun,
    npc_db: any,
    load_promise_resolve: () => void
) {
    const npc_sprite_base_list = {};
    for (let npc_key in npc_db) {
        const npc_info = npc_db[npc_key];
        if (npc_info.actions === undefined) continue;
        const actions = Object.keys(npc_info.actions);
        const npc_sprite_info = new SpriteBase(npc_key, actions);
        npc_sprite_base_list[npc_key] = npc_sprite_info;
        for (let i = 0; i < actions.length; ++i) {
            const action_key = actions[i];
            const action_obj = npc_info.actions[action_key];
            npc_sprite_info.setActionSpritesheet(action_key, action_obj.spritesheet.image, action_obj.spritesheet.json);
            npc_sprite_info.setActionAnimations(action_key, action_obj.animations, action_obj.frames_count);
            npc_sprite_info.setActionFrameRate(action_key, action_obj.frame_rate);
            npc_sprite_info.setActionLoop(action_key, action_obj.loop);
        }
        npc_sprite_info.generateAllFrames();
        npc_sprite_info.loadSpritesheets(game, false);
    }
    game.load.start();
    data.loading_what = "npc sprites";
    game.load.onLoadComplete.addOnce(() => {
        for (let npc_key in npc_db) {
            const npc_info = npc_db[npc_key];
            const npc_sprite_info = npc_sprite_base_list[npc_key];
            for (let action_alias in npc_info.action_aliases) {
                npc_sprite_info.setActionAlias(game, action_alias, npc_info.action_aliases[action_alias]);
            }
        }
        load_promise_resolve();
    });
    return npc_sprite_base_list;
}
