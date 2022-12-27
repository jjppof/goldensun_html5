import {GoldenSun} from "../GoldenSun";

export function initialize_bgm_data(game: Phaser.Game, data: GoldenSun, bgm_db: any) {
    for (let bgm_data of bgm_db) {
        game.load.audio(bgm_data.key, [bgm_data.path]);
    }
    game.load.start();
    data.set_whats_loading("bgms");
    let promise_resolve;
    const promise = new Promise(resolve => (promise_resolve = resolve));
    game.load.onLoadComplete.addOnce(promise_resolve);
    return promise;
}
