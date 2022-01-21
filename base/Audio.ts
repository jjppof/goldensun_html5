import * as _ from "lodash";
import {GoldenSun} from "./GoldenSun";
import {Button} from "./XGamepad";

/**
 * This class is responsible for manipulating background musics (BGM)
 * and sound effect audios (SFX) of the engine.
 */
export class Audio {
    /** Volume step to apply upon volume altering */
    private static readonly VOLUME_STEP = 0.05;
    /** Volume change held threshold */
    private static readonly VOLUME_ALTER_LOOP_TIME = 100;
    /** Default bgm volume */
    private static readonly DEFAULT_BGM_VOLUME = 0.6;

    private game: Phaser.Game;
    private data: GoldenSun;
    private se_data: {[se_key: string]: Phaser.AudioSprite} = {};
    private current_bgm: Phaser.Sound = null;
    private bgm_volume: number;

    constructor(game: Phaser.Game, data: GoldenSun) {
        this.game = game;
        this.data = data;
    }

    /**
     * Changes the game volume.
     * @param {number} delta - Delta to apply to the volume
     * @return {number} Final game volume
     */
    private alter_volume(delta: number) {
        return (this.game.sound.volume = _.clamp(this.game.sound.volume + delta, 0, 1));
    }

    /**
     * Initializes mute and volume alter controls.
     */
    initialize_controls() {
        const controls = [
            {
                buttons: Button.MUTE,
                on_down: () => {
                    this.game.sound.context.resume();
                    this.game.sound.mute = !this.game.sound.mute;
                },
            },
            {
                buttons: Button.VOL_UP,
                on_down: () => this.alter_volume(+Audio.VOLUME_STEP),
                params: {loop_time: Audio.VOLUME_ALTER_LOOP_TIME},
            },
            {
                buttons: Button.VOL_DOWN,
                on_down: () => this.alter_volume(-Audio.VOLUME_STEP),
                params: {loop_time: Audio.VOLUME_ALTER_LOOP_TIME},
            },
        ];
        this.data.control_manager.add_controls(controls, {persist: true});
    }

    /**
     * Registers a sound effect in the engine.
     * @param se_key the sound effect key name.
     */
    add_se(se_key: string) {
        this.se_data[se_key] = this.game.add.audioSprite(se_key);
    }

    /**
     * Plays a registered sound effect.
     * @param key the sound effect key name.
     * @param on_stop on sfx stop callback function.
     * @param position_shift the amount of time in sec. to initially cut of this sfx.
     * @param volume the volume that it will be plays. [0,1].
     * @returns Returns the Phaser.Sound instance.
     */
    play_se(key: string, on_stop?: Function, position_shift: number = 0, volume: number = 1) {
        const key_parts = key.split("/");

        const audio = this.se_data[key_parts[0]].play(key_parts[1], volume, position_shift);
        if (on_stop) {
            audio.onMarkerComplete.addOnce(on_stop);
        }

        return audio;
    }

    /**
     * Registers a bgm sound in the engine.
     * @param bgm_key The bgm key name.
     * @param play whether is to already start playing.
     */
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

    /**
     * Plays a bgm sound.
     * @param loop Whether the bgm should loop or not.
     * @param volume The volume to be applied. [0,1]
     */
    play_bgm(loop: boolean = true, volume?: number) {
        this.current_bgm.loop = loop;
        this.current_bgm.volume = volume ?? Audio.DEFAULT_BGM_VOLUME;
        this.bgm_volume = this.current_bgm.volume;
        this.current_bgm.play();
    }

    /**
     * Resumes the current bgm sound that was paused.
     */
    resume_bgm() {
        this.current_bgm.volume = 0;
        this.current_bgm.resume();
        this.game.add.tween(this.current_bgm).to(
            {
                volume: this.bgm_volume,
            },
            1000,
            Phaser.Easing.Linear.None,
            true
        );
    }

    /**
     * Pauses the current bgm sound.
     */
    pause_bgm() {
        this.current_bgm.pause();
    }

    /**
     * Stops the current bgm sound.
     */
    stop_bgm() {
        this.current_bgm.stop();
    }
}
