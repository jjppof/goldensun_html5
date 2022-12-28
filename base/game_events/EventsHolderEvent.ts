import {GameEvent, event_types} from "./GameEvent";

export class EventsHolderEvent extends GameEvent {
    private events: GameEvent[];

    constructor(game, data, active, key_name, keep_reveal, events) {
        super(game, data, event_types.EVENTS_HOLDER, active, key_name, keep_reveal);
        this.events = [];
        if (events !== undefined) {
            events.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info);
                this.events.push(event);
            });
        }
    }

    _fire() {
        this.events.forEach(event => event.fire(this.origin_npc));
    }

    _destroy() {
        this.events.forEach(event => event.destroy());
    }
}
