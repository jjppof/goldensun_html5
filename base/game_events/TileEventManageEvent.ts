import {TileEvent} from "../tile_events/TileEvent";
import {directions} from "../utils";
import {GameEvent, event_types} from "./GameEvent";

export class TileEventManageEvent extends GameEvent {
    private tile_event_key: string;
    private io_label: string;
    private activate_at: {[direction: string]: boolean};
    private pos: {x: number; y: number};
    private collision_layers: number[];

    constructor(
        game,
        data,
        active,
        key_name,
        keep_reveal,
        tile_event_key,
        io_label,
        activate_at,
        pos,
        collision_layers
    ) {
        super(game, data, event_types.TILE_EVENT_MANAGE, active, key_name, keep_reveal);
        this.tile_event_key = tile_event_key;
        this.io_label = io_label;
        this.activate_at = activate_at;
        this.pos = pos;
        if (collision_layers !== undefined) {
            this.collision_layers = Array.isArray(collision_layers) ? collision_layers : [collision_layers];
        }
    }

    _fire() {
        let events = [];
        if (this.tile_event_key) {
            const event = TileEvent.get_labeled_event(this.tile_event_key);
            if (event) {
                events.push(event);
            } else {
                this.data.logger.log_message(
                    `Game Event [${this.type}]: Event with ley "${this.tile_event_key}" doesn't exist.`
                );
                return;
            }
        } else if (this.io_label) {
            const interactable_object = this.data.map.interactable_objects_label_map[this.io_label];
            if (!(this.io_label in this.data.map.interactable_objects_label_map)) {
                this.data.logger.log_message(
                    `Game Event [${this.type}]: IO with label "${this.io_label}" doesn't exist.`
                );
                return;
            }
            events = interactable_object.get_events();
        } else {
            return;
        }

        for (let event of events) {
            if (!event) {
                continue;
            }
            if (this.activate_at) {
                if (this.activate_at.hasOwnProperty("all")) {
                    if (this.activate_at.all) {
                        event.activate();
                    } else {
                        event.deactivate();
                    }
                } else {
                    for (let direction in this.activate_at) {
                        const dir = directions[direction];
                        const active = this.activate_at[direction] as boolean;
                        if (active) {
                            event.activate_at(dir);
                        } else {
                            event.deactivate_at(dir);
                        }
                    }
                }
            }

            if (this.collision_layers) {
                event.set_activation_collision_layers(...this.collision_layers);
            }

            if (this.pos) {
                event.set_position(this.pos.x, this.pos.y, true);
            }
        }
    }

    _destroy() {}
}
