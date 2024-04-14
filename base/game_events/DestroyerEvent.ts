import {GameEvent, event_types} from "./GameEvent";

export class DestroyerEvent extends GameEvent {
    private target_event_key: string;

    constructor(game, data, active, key_name, keep_reveal, keep_custom_psynergy, target_event_key) {
        super(game, data, event_types.DESTROYER, active, key_name, keep_reveal, keep_custom_psynergy);
        this.target_event_key = target_event_key;
    }

    _fire() {
        if (this.target_event_key !== undefined) {
            const target_event = GameEvent.get_labeled_event(this.target_event_key);
            if (target_event) {
                target_event.destroy();
            } else {
                this.data.logger.log_message(`Could not find an event with "${this.target_event_key}" key.`);
            }
        } else {
            this.data.logger.log_message('The target event is undefined. Check "target_event_key" property.');
        }
    }

    _destroy() {}
}
