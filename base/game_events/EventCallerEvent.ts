import {GameEvent, event_types} from "./GameEvent";

export class EventCallerEvent extends GameEvent {
    private event_label: string;
    private activate_event_before: boolean;

    constructor(game, data, active, key_name, keep_reveal, keep_custom_psynergy, event_label, activate_event_before) {
        super(game, data, event_types.EVENT_CALLER, active, key_name, keep_reveal, keep_custom_psynergy);
        this.event_label = event_label;
        this.activate_event_before = activate_event_before ?? true;
    }

    _fire() {
        const event = GameEvent.get_labeled_event(this.event_label);
        if (!event) {
            return;
        }
        if (this.activate_event_before) {
            event.set_event_activation(true);
        }
        event.fire(this.origin_npc);
    }

    _destroy() {}
}
