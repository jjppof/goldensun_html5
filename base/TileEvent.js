import { get_surroundings, get_opposite_direction, get_directions, split_direction } from "../utils.js";

export const event_types = {
    STAIR: "stair",
    SPEED: "speed",
    DOOR: "door",
    JUMP: "jump",
    STEP: "step",
    COLLISION: "collision"
};

export class TileEvent {
    constructor(type, x, y, activation_directions, activation_collision_layers, dynamic, active, origin_interactable_object) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.location_key = this.x + "_" + this.y;
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

export class StairEvent extends TileEvent {
    constructor(x, y, activation_directions, activation_collision_layers, dynamic, active, change_to_collision_layer, is_set, origin_interactable_object, climbing_only) {
        super(event_types.STAIR, x, y, activation_directions, activation_collision_layers, dynamic, active, origin_interactable_object);
        this.change_to_collision_layer = change_to_collision_layer;
        this.is_set = is_set === undefined ? true : is_set;
        this.climbing_only = climbing_only === undefined ? false : climbing_only;
    }
}

export class SpeedEvent extends TileEvent {
    constructor(x, y, activation_directions, activation_collision_layers, dynamic, active, speed) {
        super(event_types.SPEED, x, y, activation_directions, activation_collision_layers, dynamic, active, null);
        this.speed = speed;
    }
}

export class DoorEvent extends TileEvent {
    constructor(x, y, activation_directions, activation_collision_layers, dynamic, active, target, x_target, y_target, advance_effect, dest_collider_layer) {
        super(event_types.DOOR, x, y, activation_directions, activation_collision_layers, dynamic, active, null);
        this.target = target;
        this.x_target = x_target;
        this.y_target = y_target;
        this.advance_effect = advance_effect;
        this.dest_collider_layer = dest_collider_layer;
    }
}

export class JumpEvent extends TileEvent {
    constructor(x, y, activation_directions, activation_collision_layers, dynamic, active, is_set) {
        super(event_types.JUMP, x, y, activation_directions, activation_collision_layers, dynamic, active, null);
        this.is_set = is_set;
    }

    static active_jump_surroundings(data, surroundings, target_layer) {
        for (let j = 0; j < surroundings.length; ++j) {
            const surrounding = surroundings[j];
            const this_key = TileEvent.get_location_key(surrounding.x, surrounding.y);
            if (this_key in data.map.events) {
                for (let k = 0; k < data.map.events[this_key].length; ++k) {
                    const surr_event = data.map.events[this_key][k];
                    if (surr_event.type === event_types.JUMP) {
                        if (surr_event.activation_collision_layers.includes(target_layer)) {
                            if (surr_event.dynamic === false && surr_event.is_set) {
                                surr_event.activate_at(get_opposite_direction(surrounding.direction));
                            }
                        }
                    }
                }
            }
        }
    }

    static get_surrounding_events_towards_this(data, event, target_collision_layer) {
        const surroundings = get_surroundings(event.x, event.y, false, 2);
        let events = [];
        for (let i = 0; i < surroundings.length; ++i) {
            const surrounding = surroundings[i];
            const location_key = TileEvent.get_location_key(surrounding.x, surrounding.y);
            if (!(location_key in data.map.events)) continue;
            for (let j = 0; j < data.map.events[location_key].length; ++j) {
                const this_event = data.map.events[location_key][j];
                if (this_event.is_set && this_event.type === event_types.JUMP) {
                    if (this_event.activation_collision_layers.includes(target_collision_layer)) {
                        if (this_event.activation_directions.includes(get_opposite_direction(surrounding.direction))) {
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
        super(event_types.STEP, x, y, activation_directions, activation_collision_layers, dynamic, active, null);
        this.step_direction = step_direction;
    }
}

export class CollisionEvent extends TileEvent {
    constructor(x, y, activation_directions, activation_collision_layers, dynamic, active, dest_collider_layer) {
        super(event_types.COLLISION, x, y, activation_directions, activation_collision_layers, dynamic, active, null);
        this.dest_collider_layer = dest_collider_layer;
    }
}