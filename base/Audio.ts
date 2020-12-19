import {GoldenSun} from "./GoldenSun";

export class Audio {
    private game: Phaser.Game;
    private data: GoldenSun;
    private se_data: {[se_key: string]: Phaser.AudioSprite} = {};
    private current_bgm: Phaser.Sound = null;

    constructor(game: Phaser.Game, data: GoldenSun) {
        this.game = game;
        this.data = data;
    }

    add_se(se_key: string) {
        this.se_data[se_key] = this.game.add.audioSprite(se_key);
    }

    play_se(se_key: string, marker_key: string, on_stop?: Function, position_shift: number = 0, volume: number = 1) {
        const audio = this.se_data[se_key].play(marker_key, volume, position_shift);
        if (on_stop) {
            audio.onStop.addOnce(on_stop);
        }
    }

    add_bgm(bgm_key: string, play: boolean = false) {
        if (bgm_key && (!this.current_bgm || this.current_bgm.key !== bgm_key)) {
            if (this.current_bgm) this.current_bgm.destroy();
            this.current_bgm = this.game.add.audio(bgm_key);
            if (play) this.play_bgm();
        } else if (!bgm_key && this.current_bgm) {
            this.current_bgm.stop();
            this.current_bgm.destroy();
            this.current_bgm = null;
        }
    }

    play_bgm(loop: boolean = true, volume: number = 0.6) {
        this.current_bgm.loop = loop;
        this.current_bgm.volume = volume;
        this.current_bgm.play();
    }

    stop_bgm() {
        this.current_bgm.stop();
    }
}
