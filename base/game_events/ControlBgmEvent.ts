import {GameEvent, event_types} from "./GameEvent";

enum control_types {
    RESUME = "resume",
    PAUSE = "pause",
    STOP = "stop",
    SET_VOLUME = "set_volume",
}

export class ControlBgmEvent extends GameEvent {
    private control_type: control_types;
    private volume: number;

    constructor(game, data, active, key_name, control_type, volume) {
        super(game, data, event_types.CONTROL_BGM, active, key_name);
        this.control_type = control_type;
        this.volume = volume;
    }

    _fire() {
        switch (this.control_type) {
            case control_types.RESUME:
                this.data.audio.resume_bgm();
                break;
            case control_types.PAUSE:
                this.data.audio.pause_bgm();
                break;
            case control_types.STOP:
                this.data.audio.stop_bgm();
                break;
            case control_types.SET_VOLUME:
                this.data.audio.current_bgm.volume = this.volume;
                break;
        }
    }

    _destroy() {}
}
