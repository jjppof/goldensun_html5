import { get_surroundings, get_opposite_direcion } from "../utils.js";
import { maps } from "../initializers/maps.js";

export const event_types = {
    STAIR: "stair",
    SPEED: "speed",
    DOOR: "door",
    JUMP: "jump",
    STEP: "step",
    COLLISION: "collision",
};

export class TileEvent {
    constructor(type, x, y, activation_directions, activation_collision_layers, dynamic, active) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.location_key = this.x + "_" + this.y;
        this.id = TileEvent.id_incrementer++;
        this.activation_collision_layers = Array.isArray(activation_collision_layers) ? activation_collision_layers : [activation_collision_layers];
        this.activation_directions = Array.isArray(activation_directions) ? activation_directions : [activation_directions];
        this.dynamic = dynamic;
        this.active = Array.isArray(active) ? active : new Array(this.activation_directions.length).fill(active);
        TileEvent.events[this.id] = this;
    }

    is_active(direction) {
        const possible_directions = direction.split("_");
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
        this.active.map(() => true);
    }

    deactivate() {
        this.active.map(() => false);
    }

    static get_location_key(x, y) {
        return x.toString() + "_" + y.toString();
    }

    static get_event_by_id(events, id) {
        return _.findWhere(events, {id: id});
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

export class StairEvent extends TileEvent {
    constructor(x, y, activation_directions, activation_collision_layers, dynamic, active, change_to_collision_layer) {
        super(event_types.STAIR, x, y, activation_directions, activation_collision_layers, dynamic, active);
        this.change_to_collision_layer = change_to_collision_layer;
    }
}

export class SpeedEvent extends TileEvent {
    constructor(x, y, activation_directions, activation_collision_layers, dynamic, active, speed) {
        super(event_types.SPEED, x, y, activation_directions, activation_collision_layers, dynamic, active);
        this.speed = speed;
    }
}

export class DoorEvent extends TileEvent {
    constructor(x, y, activation_directions, activation_collision_layers, dynamic, active, target, x_target, y_target, advance_effect, dest_collider_layer) {
        super(event_types.DOOR, x, y, activation_directions, activation_collision_layers, dynamic, active);
        this.target = target;
        this.x_target = x_target;
        this.y_target = y_target;
        this.advance_effect = advance_effect;
        this.dest_collider_layer = dest_collider_layer;
    }
}

export class JumpEvent extends TileEvent {
    constructor(x, y, activation_directions, activation_collision_layers, dynamic, active, is_set) {
        super(event_types.JUMP, x, y, activation_directions, activation_collision_layers, dynamic, active);
        this.is_set = is_set;
    }

    static get_surrounding_events_towards_this(data, event, target_collision_layer) {
        const surroundings = get_surroundings(event.x, event.y, false, 2);
        let events = [];
        for (let i = 0; i < surroundings.length; ++i) {
            const surrounding = surroundings[i];
            const location_key = TileEvent.get_location_key(surrounding.x, surrounding.y);
            if (!(location_key in maps[data.map_name].events)) continue;
            for (let j = 0; j < maps[data.map_name].events[location_key].length; ++j) {
                const this_event = maps[data.map_name].events[location_key][j];
                if (this_event.is_set && this_event.type === event_types.JUMP) {
                    if (this_event.activation_collision_layers.includes(target_collision_layer)) {
                        if (this_event.activation_directions.includes(get_opposite_direcion(surrounding.direction))) {
                            events.push(this_event);
                        }
                    }
                }
            }
        }
        return events;
    }
}

export class StepEvent extends TileEvent {
    constructor(x, y, activation_directions, activation_collision_layers, dynamic, active, step_direction) {
        super(event_types.STEP, x, y, activation_directions, activation_collision_layers, dynamic, active);
        this.step_direction = step_direction;
    }
}

export class CollisionEvent extends TileEvent {
    constructor(x, y, activation_directions, activation_collision_layers, dynamic, active, dest_collider_layer) {
        super(event_types.COLLISION, x, y, activation_directions, activation_collision_layers, dynamic, active);
        this.dest_collider_layer = dest_collider_layer;
    }
}