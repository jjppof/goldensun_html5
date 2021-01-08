import {GameEvent} from "../game_events/GameEvent";
import {event_types, TileEvent} from "./TileEvent";

export class EventTriggerEvent extends TileEvent {
    public events: GameEvent[] = [];

    constructor(game, data, x, y, activation_directions, activation_collision_layers, dynamic, active, events) {
        super(
            game,
            data,
            event_types.EVENT_TRIGGER,
            x,
            y,
            activation_directions,
            activation_collision_layers,
            dynamic,
            active,
            null
        );
        events.forEach(event_info => {
            const event = this.data.game_event_manager.get_event_instance(event_info);
            this.events.push(event);
        });
    }

    fire() {
        if (!this.check_position() || !this.data.hero_movement_allowed()) {
            return;
        }
        this.events.forEach(event => event.fire());
    }
}
