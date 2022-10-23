import {GameEvent, event_types} from "./GameEvent";

export class EventActivationEvent extends GameEvent {
    private event_label: string;
    private activate: boolean;

    constructor(game, data, active, key_name, keep_reveal, event_label, activate) {
        super(game, data, event_types.EVENT_ACTIVATION, active, key_name, keep_reveal);
        this.event_label = event_label;
        this.activate = activate;
    }

    _fire() {
        const event = GameEvent.get_labeled_event(this.event_label);
        if (!event) {
            return;
        }
        event.set_event_activation(this.activate);
    }

    _destroy() {}
}
