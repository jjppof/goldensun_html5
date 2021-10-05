import {GameEvent, event_types} from "./GameEvent";

export class DestroyerEvent extends GameEvent {
    private target_event_key: string;

    constructor(game, data, active, key_name) {
        super(game, data, event_types.DESTROYER, active, key_name);
    }

    set_target_event(target_event_key: string) {
        this.target_event_key = target_event_key;
    }

    _fire() {
        if (this.target_event_key !== undefined) {
            let target_event = GameEvent.get_labeled_event(this.target_event_key);
            target_event.destroy();
            this.destroy();
        } else {
            console.warn("The Target event is undefined.");
        }
    }

    destroy() {
        this.target_event_key = null;
    }
}
