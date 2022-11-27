import {GoldenSun} from "../GoldenSun";
import {GameInfo} from "./initialize_info";

export function initialize_misc_battle_anim_recipes(
    game: Phaser.Game,
    data: GoldenSun,
    misc_battle_animations_db: any,
    load_promise_resolve: () => void
) {
    const misc_battle_animations_recipes: GameInfo["misc_battle_animations_recipes"] = {};
    for (let misc_battle_anim_key in misc_battle_animations_db) {
        const json_path = misc_battle_animations_db[misc_battle_anim_key];
        game.load.json(`misc_battle_animation_${misc_battle_anim_key}`, json_path);
    }
    game.load.start();
    data.set_whats_loading("misc battle anims");
    game.load.onLoadComplete.addOnce(() => {
        for (let misc_battle_anim_key in misc_battle_animations_db) {
            misc_battle_animations_recipes[misc_battle_anim_key] = game.cache.getJSON(`misc_battle_animation_${misc_battle_anim_key}`);
        }
        load_promise_resolve();
    });
    return misc_battle_animations_recipes;
}
