import { TileEvent, event_types } from "./TileEvent.js";

export class SpeedEvent extends TileEvent {
    constructor(game, data, x, y, activation_directions, activation_collision_layers, dynamic, active, speed) {
        super(game, data, event_types.SPEED, x, y, activation_directions, activation_collision_layers, dynamic, active, null);
        this.speed = speed;
        this.speed_set = false;
    }

    unset() {
        if (this.speed_set && !this.check_position()) {
            this.speed_set = false;
            this.data.tile_event_manager.unset_triggered_event(this);
            this.data.hero.extra_speed -= this.speed;
        }
    }

    fire() {
        if (!this.speed_set) {
            this.data.tile_event_manager.set_triggered_event(this);
            this.data.hero.extra_speed += this.speed;
        }
    }
}