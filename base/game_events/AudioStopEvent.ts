import {GameEvent, event_types} from "./GameEvent";

export class AudioStopEvent extends GameEvent {
    private pause_only: boolean;
    private fade_out: boolean;
    private bgm_identifier: string;

    constructor(game, data, active, key_name, keep_reveal, pause_only, fade_out, bgm_identifier) {
        super(game, data, event_types.AUDIO_STOP, active, key_name, keep_reveal);
        this.pause_only = pause_only;
        this.fade_out = fade_out;
        this.bgm_identifier = bgm_identifier;
    }

    _fire() {
        if (this.data.audio.get_bgm_object(this.bgm_identifier)) {
            if (this.pause_only) {
                this.data.audio.pause_bgm(this.bgm_identifier, this.fade_out);
            } else {
                this.data.audio.stop_bgm(this.bgm_identifier, this.fade_out);
            }
        } else {
            this.data.logger.log_message(`There's no active BGM with '${this.bgm_identifier}' identifier.`);
        }
    }

    _destroy() {}
}
