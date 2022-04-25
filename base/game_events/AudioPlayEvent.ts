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

    constructor(game, data, active, key_name, audio_type, audio_key, volume, loop, finish_events) {
        super(game, data, event_types.AUDIO_PLAY, active, key_name);
        this.audio_type = audio_type;
        this.audio_key = audio_key;
        this.volume = volume;
        this.loop = loop;
        if (finish_events !== undefined) {
            finish_events.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info);
                this.finish_events.push(event);
            });
        }
    }

    async _fire() {
        if (this.audio_type === audio_types.BGM) {
            this.data.audio.set_bgm(this.audio_key);
            this.data.audio.play_bgm(this.loop, this.volume, this.finish.bind(this));
        } else if (this.audio_type === audio_types.SFX) {
            this.data.audio.play_se(this.audio_key, this.finish.bind(this), undefined, this.volume);
        }
    }

    finish() {
        this.finish_events.forEach(event => event.fire(this.origin_npc));
    }

    _destroy() {
        this.finish_events.forEach(event => event.destroy());
    }
}
