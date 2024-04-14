import {GameEvent, event_types} from "./GameEvent";

enum audio_types {
    SFX = "sfx",
    BGM = "bgm",
}

export class AudioPlayEvent extends GameEvent {
    private finish_events: GameEvent[] = [];
    private audio_type: audio_types;
    private audio_key: string;
    private volume: number;
    private loop: boolean;
    private fade_in: boolean;
    private in_parallel: boolean;
    private bgm_identifier: string;
    private _bgm: Phaser.Sound;

    constructor(
        game,
        data,
        active,
        key_name,
        keep_reveal,
        keep_custom_psynergy,
        audio_type,
        audio_key,
        volume,
        loop,
        fade_in,
        in_parallel,
        bgm_identifier,
        finish_events
    ) {
        super(game, data, event_types.AUDIO_PLAY, active, key_name, keep_reveal, keep_custom_psynergy);
        this.audio_type = audio_type;
        this.audio_key = audio_key;
        this.volume = volume ?? 1.0;
        this.loop = loop;
        this.fade_in = fade_in;
        this.in_parallel = in_parallel;
        this.bgm_identifier = bgm_identifier;
        this._bgm = null;
        if (finish_events !== undefined) {
            finish_events.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info, this.type, this.origin_npc);
                this.finish_events.push(event);
            });
        }
    }

    _fire() {
        if (this.audio_type === audio_types.BGM) {
            if (this.in_parallel) {
                this._bgm = this.data.audio.play_parallel_bgm(
                    this.audio_key,
                    this.loop,
                    this.volume,
                    this.finish.bind(this),
                    this.fade_in,
                    undefined,
                    this.bgm_identifier
                );
            } else {
                this.data.audio.set_bgm(this.audio_key);
                this.data.audio.play_bgm(this.loop, this.volume, this.finish.bind(this), this.fade_in);
            }
        } else if (this.audio_type === audio_types.SFX) {
            this.data.audio.play_se(this.audio_key, this.finish.bind(this), undefined, this.volume);
        }
    }

    finish() {
        if (this._bgm) {
            this._bgm.destroy();
            this._bgm = null;
        }
        this.finish_events.forEach(event => event.fire(this.origin_npc));
    }

    _destroy() {
        if (this._bgm) {
            this._bgm.destroy();
            this._bgm = null;
        }
        this.finish_events.forEach(event => event?.destroy());
    }
}
