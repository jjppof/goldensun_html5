import {GoldenSun} from "../GoldenSun";

export function initialize_bgm_data(game: Phaser.Game, data: GoldenSun, bgm_db: any, load_promise_resolve: () => void) {
    const promises = [];
    for (let bgm_key in bgm_db) {
        const bgm_data = bgm_db[bgm_key];
        const loader = game.load.audio(bgm_data.key, [bgm_data.path]);
        let promise_resolve;
        promises.push(new Promise(resolve => (promise_resolve = resolve)));
        loader.onLoadComplete.addOnce(promise_resolve);
    }
    game.load.start();
    data.set_whats_loading("bgms");
    game.load.onLoadComplete.addOnce(load_promise_resolve);
}
