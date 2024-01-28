/*
If you go to 080DD8B8 in VBA's memory viewer and edit the byte that says "x83" in the memory viewer part of VBA,
you can play any sound effect from 0-255 just by using Reveal (keeping in mind that some of them will be songs and
others may be empty). You can double that up by going to 080DD976 and changing the "xA7" there as well, which
is the sound effect that plays when you exit the Reveal zone.
*/

import * as _ from "lodash";
import {GoldenSun} from "./GoldenSun";
import {initialize_se} from "./initializers/sound_effects";
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
    private _current_bgm: Phaser.Sound = null;
    private bgm_volume: number;
    private playing_bgms: {[id_key: string]: Phaser.Sound} = {};

    constructor(game: Phaser.Game, data: GoldenSun) {
        this.game = game;
        this.data = data;
    }

    /** The current BGM Phaser.Sound object. */
    get current_bgm() {
        return this._current_bgm;
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
     * Initializes the game sound effects.
     */
    async init_se() {
        let load_se_promise_resolve;
        const load_se_promise = new Promise(resolve => (load_se_promise_resolve = resolve));
        const se_data = this.game.cache.getJSON("se_db");
        initialize_se(this.game, this.data, se_data, load_se_promise_resolve);
        await load_se_promise;
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

        if (key_parts[0] in this.se_data && key_parts[1] in this.se_data[key_parts[0]].sounds) {
            const audio = this.se_data[key_parts[0]].play(key_parts[1], volume, position_shift);
            if (on_stop) {
                audio.onMarkerComplete.addOnce(on_stop);
            }
            return audio;
        } else {
            this.data.logger.log_message(`SFX key not registered: ${key}.`);
        }

        return null;
    }

    /**
     * Plays a registered sound effect, pausing the current bgm before and resuming it after
     * @param key the sound effect key name.
     * @param position_shift the amount of time in sec. to initially cut of this sfx.
     * @param volume the volume that it will be plays. [0,1].
     */
    play_se_pausing_bgm(key: string, position_shift: number = 0, volume: number = 1) {
        this.pause_bgm();
        this.play_se(key, this.resume_bgm.bind(this), position_shift, volume);
    }

    /**
     * Sets the current bgm object to played by the engine.
     * @param bgm_key The bgm key name.
     * @param play whether is to already start playing.
     */
    set_bgm(bgm_key: string, play: boolean = false) {
        if (bgm_key && (!this.current_bgm || this.current_bgm.key !== bgm_key)) {
            if (this.current_bgm) this.current_bgm.destroy();
            this._current_bgm = this.game.add.audio(bgm_key);
            if (play) {
                this.play_bgm();
            }
        } else if (!bgm_key && this.current_bgm) {
            this.current_bgm.stop();
            this.current_bgm.destroy();
            this._current_bgm = null;
        }
    }

    /**
     * Plays current activated bgm sound.
     * @param loop Whether the bgm should loop or not.
     * @param volume The volume to be applied. [0,1].
     * @param on_complete On bgm complete callback.
     * @param fade_in if true, the bgm will fade in on start.
     * @param fade_duration The fade in duration in ms.
     */
    play_bgm(
        loop: boolean = true,
        volume?: number,
        on_complete?: () => void,
        fade_in: boolean = false,
        fade_duration: number = 750
    ) {
        this.current_bgm.loop = loop;
        this.current_bgm.volume = volume ?? Audio.DEFAULT_BGM_VOLUME;
        this.bgm_volume = this.current_bgm.volume;
        if (fade_in) {
            this.current_bgm.fadeIn(fade_duration);
        } else {
            this.current_bgm.play();
        }
        if (on_complete) {
            this.current_bgm.onMarkerComplete.addOnce(on_complete);
        }
    }

    /**
     * Adds a new BGM audio to Phaser sound manager and plays it. You can give an unique name for this BGM by passing 'bgm_identifier' argument.
     * @param bgm_key The bgm key name registered in the json db.
     * @param loop Whether the bgm should loop or not.
     * @param volume The volume to be applied. [0,1].
     * @param on_complete On bgm complete callback.
     * @param fade_in if true, the bgm will fade in on start.
     * @param fade_duration The fade in duration in ms.
     * @param bgm_identifier an unique name for this bgm.
     * @returns returns the Phaser.Sound object.
     */
    play_parallel_bgm(
        bgm_key: string,
        loop: boolean = true,
        volume?: number,
        on_complete?: () => void,
        fade_in: boolean = false,
        fade_duration: number = 750,
        bgm_identifier?: string
    ) {
        let bgm: Phaser.Sound;
        if (bgm_identifier && bgm_identifier in this.playing_bgms) {
            bgm = this.playing_bgms[bgm_identifier];
        } else {
            bgm = this.game.add.audio(bgm_key);
            if (bgm_identifier) {
                this.playing_bgms[bgm_identifier] = bgm;
            }
        }
        bgm.loop = loop;
        bgm.volume = volume ?? Audio.DEFAULT_BGM_VOLUME;
        if (fade_in) {
            bgm.fadeIn(fade_duration);
        } else {
            bgm.play();
        }
        if (on_complete) {
            bgm.onMarkerComplete.addOnce(on_complete);
        }
        return bgm;
    }

    /**
     * Gets the Phaser.Sound object of a bgm.
     * @param bgm_identifier the bgm identifier.
     * @returns the bgm Phaser.Sound object.
     */
    get_bgm_object(bgm_identifier: string) {
        if (bgm_identifier in this.playing_bgms) {
            return this.playing_bgms[bgm_identifier];
        } else {
            return null;
        }
    }

    /**
     * Plays the current active battle bgm.
     */
    play_battle_bgm() {
        this.current_bgm.addMarker(`battle/init/${this.current_bgm.key}`, 0.0, 1.0, undefined, false);
        this.current_bgm.play(`battle/init/${this.current_bgm.key}`);
        this.current_bgm.onMarkerComplete.addOnce(() => {
            this.current_bgm.addMarker(
                `battle/main/${this.current_bgm.key}`,
                1.0,
                this.current_bgm.totalDuration - 1.0,
                undefined,
                true
            );
            this.current_bgm.play(`battle/main/${this.current_bgm.key}`);
            this.current_bgm.onLoop.addOnce(() => {
                this.current_bgm.currentMarker = `battle/main/${this.current_bgm.key}`;
            });
        });
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
     * Pauses a bgm.
     * @param bgm_identifier the bgm identifier to be paused. If not passed, it will pause current bgm.
     * @param fade_out if true, the bgm will fade out before pausing.
     * @param fade_duration the fadeout duration in ms.
     */
    pause_bgm(bgm_identifier?: string, fade_out: boolean = false, fade_duration: number = 750) {
        let bgm: Phaser.Sound;
        if (bgm_identifier && bgm_identifier in this.playing_bgms) {
            bgm = this.playing_bgms[bgm_identifier];
        } else {
            bgm = this.current_bgm;
        }
        if (fade_out) {
            bgm.fadeOut(fade_duration);
            bgm.onFadeComplete.addOnce(() => {
                bgm?.pause();
            });
        } else {
            bgm?.pause();
        }
    }

    /**
     * Stops a bgm. If 'bgm_identifier', the bgm entry is removed on stop finish.
     * @param bgm_identifier the bgm identifier to be stopped. If not passed, it will stop current bgm.
     * @param fade_out if true, the bgm will fade out before stopping.
     * @param fade_duration the fadeout duration in ms.
     */
    stop_bgm(bgm_identifier?: string, fade_out: boolean = false, fade_duration: number = 750) {
        let from_identifier = false;
        let bgm: Phaser.Sound;
        if (bgm_identifier && bgm_identifier in this.playing_bgms) {
            bgm = this.playing_bgms[bgm_identifier];
            from_identifier = true;
        } else {
            bgm = this.current_bgm;
        }
        if (fade_out) {
            bgm.fadeOut(fade_duration);
            bgm.onFadeComplete.addOnce(() => {
                bgm?.stop();
                if (from_identifier) {
                    bgm?.destroy();
                    delete this.playing_bgms[bgm_identifier];
                }
            });
        } else {
            bgm?.stop();
        }
    }
}
