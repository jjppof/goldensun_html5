import {GoldenSun} from "./GoldenSun";

export class Audio {
    private game: Phaser.Game;
    private data: GoldenSun;
    private se_data: {[se_key: string]: Phaser.AudioSprite} = {};

    constructor(game: Phaser.Game, data: GoldenSun) {
        this.game = game;
        this.data = data;
    }

    add_se(se_key: string) {
        this.se_data[se_key] = this.game.add.audioSprite(se_key);
    }

    play_se(se_key: string, marker_key: string) {
        this.se_data[se_key].play(marker_key);
    }
}
