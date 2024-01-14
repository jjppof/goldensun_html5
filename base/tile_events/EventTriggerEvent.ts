import {GameEvent, game_event_origin} from "../game_events/GameEvent";
import {event_types, TileEvent} from "./TileEvent";
import * as _ from "lodash";
import {directions, split_direction} from "../utils";

export class EventTriggerEvent extends TileEvent {
    private events: GameEvent[] = [];
    private remove_from_field: boolean;
    public trigger_once: boolean;
    public trigger_on_exit: boolean;
    private fire_positions: {
        x: number;
        y: number;
    }[];

    constructor(
        game,
        data,
        x,
        y,
        activation_directions,
        initial_disabled_directions,
        activation_collision_layers,
        active_storage_key,
        affected_by_reveal,
        key_name: string,
        events,
        remove_from_field,
        trigger_once,
        trigger_on_exit
    ) {
        super(
            game,
            data,
            event_types.EVENT_TRIGGER,
            x,
            y,
            activation_directions,
            initial_disabled_directions,
            activation_collision_layers,
            active_storage_key,
            null,
            affected_by_reveal,
            key_name
        );
        this.remove_from_field = remove_from_field;
        this.trigger_once = trigger_once ?? false;
        this.trigger_on_exit = trigger_on_exit ?? false;
        this.fire_positions = [];
        events.forEach(event_info => {
            const event = this.data.game_event_manager.get_event_instance(event_info, game_event_origin.TILE_EVENT);
            this.events.push(event);
        });
    }

    set() {
        this.fire_positions = [];
        _.uniq([...this.activation_directions].flatMap(dir => split_direction(dir))).forEach(dir => {
            const pos = {x: this.x, y: this.y};
            if (dir === directions.left) {
                --pos.x;
            } else if (dir === directions.right) {
                ++pos.x;
            } else if (dir === directions.up) {
                --pos.y;
            } else if (dir === directions.down) {
                ++pos.y;
            }
            if (pos.x !== this.x || pos.y !== this.y) {
                this.fire_positions.push(pos);
            }
        });
        this.data.tile_event_manager.set_triggered_event(this);
    }

    fire() {
        if (this.trigger_on_exit) {
            if (
                this.fire_positions.some(
                    pos => pos.x === this.data.hero.tile_pos.x && pos.y === this.data.hero.tile_pos.y
                )
            ) {
                this.data.tile_event_manager.unset_triggered_event(this);
                this.events.forEach(event => event.fire());
            } else if (!this.check_position()) {
                this.data.tile_event_manager.unset_triggered_event(this);
            }
        } else {
            if (!this.check_position() || !this.data.hero_movement_allowed()) {
                return;
            }
            this.events.forEach(event => event.fire());
        }
        if (this.remove_from_field) {
            this.data.map.remove_event(this.location_key, this.id);
        }
    }

    destroy() {
        this.deactivate();
        this._origin_interactable_object = null;
        this.events.forEach(event => event?.destroy());
    }
}
