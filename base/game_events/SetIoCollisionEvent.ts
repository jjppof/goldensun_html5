import {GameEvent, event_types} from "./GameEvent";

enum control_types {
    DISABLE = "disable",
    ENABLE = "enable",
    REMOVE = "remove",
}

export class SetIoCollisionEvent extends GameEvent {
    private io_label: string;
    private control_type: control_types;

    constructor(game, data, active, key_name, keep_reveal, keep_custom_psynergy, io_label, control_type) {
        super(game, data, event_types.SET_IO_COLLISION, active, key_name, keep_reveal, keep_custom_psynergy);
        this.io_label = io_label;
        this.control_type = control_type;
    }

    _fire() {
        const interactable_object = this.data.map.interactable_objects_label_map[this.io_label];
        if (!(this.io_label in this.data.map.interactable_objects_label_map)) {
            this.data.logger.log_message(`Game Event [${this.type}]: IO with label "${this.io_label}" doesn't exist.`);
            return;
        }
        switch (this.control_type) {
            case control_types.REMOVE:
                interactable_object.destroy_body(true);
                break;
            case control_types.ENABLE:
                interactable_object.toggle_collision(true);
                break;
            case control_types.DISABLE:
                interactable_object.toggle_collision(false);
                break;
        }
    }

    _destroy() {}
}
