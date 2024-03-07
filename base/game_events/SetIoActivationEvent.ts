import {GameEvent, event_types} from "./GameEvent";

export class SetIoActivationEvent extends GameEvent {
    private io_label: string;
    private io_active: boolean;

    constructor(game, data, active, key_name, keep_reveal, keep_custom_psynergy, io_label, io_active) {
        super(game, data, event_types.SET_IO_ACTIVATION, active, key_name, keep_reveal, keep_custom_psynergy);
        this.io_label = io_label;
        this.io_active = io_active ?? true;
    }

    _fire() {
        if (!(this.io_label in this.data.map.interactable_objects_label_map)) {
            this.data.logger.log_message(`Game Event [${this.type}]: IO with label "${this.io_label}" doesn't exist.`);
            return;
        }
        const interactable_object = this.data.map.interactable_objects_label_map[this.io_label];
        interactable_object.toggle_active(this.io_active);
    }

    _destroy() {}
}
