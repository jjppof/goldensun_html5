import { TileEvent, event_types } from "./TileEvent";

export class SpeedEvent extends TileEvent {
    public speed: number;

    constructor(game, data, x, y, activation_directions, activation_collision_layers, dynamic, active, speed) {
        super(game, data, event_types.SPEED, x, y, activation_directions, activation_collision_layers, dynamic, active, null);
        this.speed = speed;
    }

    unset() {
        if (this.data.tile_event_manager.event_triggered(this) && !this.check_position()) {
            this.data.tile_event_manager.unset_triggered_event(this);
            this.data.hero.extra_speed -= this.speed;
        }
    }

    fire() {
        if (!this.data.tile_event_manager.event_triggered(this)) {
            this.data.tile_event_manager.set_triggered_event(this);
            this.data.hero.extra_speed += this.speed;
        }
    }
}