import {GameEvent, event_types} from "./GameEvent";

export class CameraShakeEvent extends GameEvent {
    private enable: boolean;

    constructor(game, data, active, key_name, keep_reveal, keep_custom_psynergy, enable) {
        super(game, data, event_types.CAMERA_SHAKE, active, key_name, keep_reveal, keep_custom_psynergy);
        this.enable = enable;
    }

    _fire() {
        if (this.enable) {
            this.data.camera.enable_shake();
        } else {
            this.data.camera.disable_shake();
        }
    }

    _destroy() {}
}
