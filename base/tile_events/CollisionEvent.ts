import {directions, split_direction} from "../utils";
import {TileEvent, event_types} from "./TileEvent";
import * as _ from "lodash";

export class CollisionEvent extends TileEvent {
    private dest_collision_layer: number;
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
        dest_collision_layer
    ) {
        super(
            game,
            data,
            event_types.COLLISION,
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
        this.dest_collision_layer = dest_collision_layer;
        this.fire_positions = [];
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
        if (
            this.fire_positions.some(pos => pos.x === this.data.hero.tile_pos.x && pos.y === this.data.hero.tile_pos.y)
        ) {
            this.data.tile_event_manager.unset_triggered_event(this);
            this.data.collision.change_map_body(this.dest_collision_layer);
        } else if (!this.check_position()) {
            this.data.tile_event_manager.unset_triggered_event(this);
        }
    }

    destroy() {
        this._origin_interactable_object = null;
        this.deactivate();
    }
}
