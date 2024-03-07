import {GameEvent, event_types} from "./GameEvent";

export class SetIoVisibilityEvent extends GameEvent {
    private io_label: string;
    private visible: boolean;

    constructor(game, data, active, key_name, keep_reveal, keep_custom_psynergy, io_label, visible) {
        super(game, data, event_types.SET_IO_VISIBILITY, active, key_name, keep_reveal, keep_custom_psynergy);
        this.io_label = io_label;
        this.visible = visible ?? true;
    }

    _fire() {
        if (!(this.io_label in this.data.map.interactable_objects_label_map)) {
            this.data.logger.log_message(`Game Event [${this.type}]: IO with label "${this.io_label}" doesn't exist.`);
            return;
        }
        const interactable_object = this.data.map.interactable_objects_label_map[this.io_label];
        interactable_object.set_visible(this.visible);
    }

    _destroy() {}
}
