import {GoldenSun} from "../GoldenSun";

export function initialize_se(game: Phaser.Game, data: GoldenSun, se_data, load_promise_resolve) {
    const promises = [];
    for (let se_key in se_data) {
        const audio_data = se_data[se_key];
        const loader = game.load.audiosprite(se_key, audio_data.audio, null, audio_data.json);
        let promise_resolve;
        promises.push(new Promise(resolve => (promise_resolve = resolve)));
        loader.onLoadComplete.addOnce(() => {
            data.audio.add_se(se_key);
            promise_resolve();
        });
    }
    game.load.start();
    data.loading_what = "sounds";
    Promise.all(promises).then(load_promise_resolve);
}
