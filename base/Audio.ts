import * as _ from "lodash";

export class Audio {
    private game: Phaser.Game;
    private se_data: {[se_key: string]: Phaser.AudioSprite} = {};
    private current_bgm: Phaser.Sound = null;

    constructor(game: Phaser.Game) {
        this.game = game;
    }

    /** Volume step to apply upon volume altering */
    public static readonly volume_step = 0.1;

    /**
     * Changes the game volume.
     * @param {number} delta - Delta to apply to the volume
     * @return {number} Final game volume
     */
    alter_volume(delta: number) {
        return (this.game.sound.volume = _.clamp(this.game.sound.volume + delta, 0, 1));
    }

    add_se(se_key: string) {
        this.se_data[se_key] = this.game.add.audioSprite(se_key);
    }

    play_se(key: string, on_stop?: Function, position_shift: number = 0, volume: number = 1) {
        const key_parts = key.split("/");

        const audio = this.se_data[key_parts[0]].play(key_parts[1], volume, position_shift);
        if (on_stop) {
            audio.onMarkerComplete.addOnce(on_stop);
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

    resume_bgm() {
        this.current_bgm.resume();
    }

    pause_bgm() {
        this.current_bgm.pause();
    }

    stop_bgm() {
        this.current_bgm.stop();
    }
}
