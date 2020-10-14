import { directions } from "../utils";
import { TileEvent, event_types } from "./TileEvent";

export class CollisionEvent extends TileEvent {
    public dest_collider_layer: number;
    public next_x: number;
    public next_y: number;

    constructor(game, data, x, y, activation_directions, activation_collision_layers, dynamic, active, dest_collider_layer) {
        super(game, data, event_types.COLLISION, x, y, activation_directions, activation_collision_layers, dynamic, active, null);
        this.dest_collider_layer = dest_collider_layer;
        this.next_x = 0;
        this.next_y = 0;
    }

    set() {
        let next_x = this.x, next_y = this.y;
        if (this.activation_directions[0] === directions.left) {
            next_x = this.x - 1;
        } else if (this.activation_directions[0] === directions.right) {
            next_x = this.x + 1;
        } else if (this.activation_directions[0] === directions.up) {
            next_y = this.y - 1;
        } else if (this.activation_directions[0] === directions.down) {
            next_y = this.y + 1;
        }
        this.next_x = next_x;
        this.next_y = next_y;
        this.data.tile_event_manager.set_triggered_event(this);
    }

    fire() {
        if (this.data.hero.tile_x_pos === this.next_x && this.data.hero.tile_y_pos === this.next_y) {
            this.data.tile_event_manager.unset_triggered_event(this);
            this.data.collision.change_map_body(this.data, this.dest_collider_layer);
        } else if (!this.check_position()) {
            this.data.tile_event_manager.unset_triggered_event(this);
        }
    }
}