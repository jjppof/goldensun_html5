import { get_directions, split_direction } from "../../utils.js";

export const event_types = {
    CLIMB: "climb",
    SPEED: "speed",
    TELEPORT: "teleport",
    JUMP: "jump",
    STEP: "step",
    COLLISION: "collision"
};

export class TileEvent {
    constructor(game, data, type, x, y, activation_directions, activation_collision_layers, dynamic, active, origin_interactable_object) {
        this.game = game;
        this.data = data;
        this.type = type;
        this.x = x;
        this.y = y;
        this.location_key = TileEvent.get_location_key(this.x, this.y);
        this.id = TileEvent.id_incrementer++;
        this.activation_collision_layers = Array.isArray(activation_collision_layers) ? activation_collision_layers : [activation_collision_layers];
        if (activation_directions === undefined) {
            activation_directions = get_directions(true);
        }
        this.activation_directions = Array.isArray(activation_directions) ? activation_directions : [activation_directions];
        this.dynamic = dynamic;
        this.active = Array.isArray(active) ? active : new Array(this.activation_directions.length).fill(active);
        this.origin_interactable_object = origin_interactable_object === undefined ? null : origin_interactable_object;
        TileEvent.events[this.id] = this;
    }

    is_active(direction) {
        const possible_directions = split_direction(direction);
        for (let i = 0; i < possible_directions.length; ++i) {
            if (this.active[this.activation_directions.indexOf(possible_directions[i])]) {
                return true;
            }
        }
        return false;
    }

    activate_at(direction) {
        this.active[this.activation_directions.indexOf(direction)] = true;
    }

    deactivate_at(direction) {
        this.active[this.activation_directions.indexOf(direction)] = false;
    }

    activate() {
        this.active = this.active.map(() => true);
    }

    deactivate() {
        this.active = this.active.map(() => false);
    }

    check_position() {
        return this.data.hero.tile_x_pos === this.x && this.data.hero.tile_y_pos === this.y;
    }

    static get_location_key(x, y) {
        return x.toString() + "_" + y.toString();
    }

    static get_event_by_id(events, id) {
        return _.find(events, {id: id});
    }

    static get_event(id) {
        return TileEvent.events[id];
    }

    static reset() {
        TileEvent.id_incrementer = 0;
        TileEvent.events = {};
    }
}

TileEvent.reset();

export class SpeedEvent extends TileEvent {
    constructor(game, data, x, y, activation_directions, activation_collision_layers, dynamic, active, speed) {
        super(game, data, event_types.SPEED, x, y, activation_directions, activation_collision_layers, dynamic, active, null);
        this.speed = speed;
    }
}

export class StepEvent extends TileEvent {
    constructor(game, data, x, y, activation_directions, activation_collision_layers, dynamic, active, step_direction) {
        super(game, data, event_types.STEP, x, y, activation_directions, activation_collision_layers, dynamic, active, null);
        this.step_direction = step_direction;
    }
}

export class CollisionEvent extends TileEvent {
    constructor(game, data, x, y, activation_directions, activation_collision_layers, dynamic, active, dest_collider_layer) {
        super(game, data, event_types.COLLISION, x, y, activation_directions, activation_collision_layers, dynamic, active, null);
        this.dest_collider_layer = dest_collider_layer;
    }
}