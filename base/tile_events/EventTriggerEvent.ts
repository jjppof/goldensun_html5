import {GameEvent} from "../game_events/GameEvent";
import {event_types, TileEvent} from "./TileEvent";

export class EventTriggerEvent extends TileEvent {
    private events: GameEvent[] = [];
    private remove_from_field: boolean;

    constructor(
        game,
        data,
        x,
        y,
        activation_directions,
        activation_collision_layers,
        dynamic,
        active,
        active_storage_key,
        affected_by_reveal,
        events,
        remove_from_field
    ) {
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
            active_storage_key,
            null,
            affected_by_reveal
        );
        this.remove_from_field = remove_from_field;
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
        if (this.remove_from_field) {
            this.data.map.remove_event(this.location_key, this.id);
        }
    }

    destroy() {
        this._origin_interactable_object = null;
        this.events.forEach(event => event.destroy());
    }
}
