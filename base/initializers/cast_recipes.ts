import {GoldenSun} from "../GoldenSun";

export function initialize_cast_recipes(
    game: Phaser.Game,
    data: GoldenSun,
    abilities_cast_db: any,
    load_promise_resolve: () => void
) {
    const abilities_cast_recipes = {};
    for (let abilities_cast_key in abilities_cast_db) {
        const json_path = abilities_cast_db[abilities_cast_key];
        game.load.json(`abilities_cast_${abilities_cast_key}`, json_path);
    }
    game.load.start();
    data.loading_what = "cast recipes";
    game.load.onLoadComplete.addOnce(() => {
        for (let abilities_cast_key in abilities_cast_db) {
            abilities_cast_recipes[abilities_cast_key] = game.cache.getJSON(`abilities_cast_${abilities_cast_key}`);
        }
        load_promise_resolve();
    });
    return abilities_cast_recipes;
}
