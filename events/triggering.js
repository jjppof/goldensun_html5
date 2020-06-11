import { jump_event, jump_near_collision } from './jump.js';
import { set_door_event } from './door.js';
import { config_step } from './step.js';
import { config_collision_change } from './collision.js';
import { event_types } from '../base/TileEvent.js';
import * as numbers from '../magic_numbers.js';
import { maps } from '../initializers/maps.js';
import * as climb from './climb.js';

export function fire_event(data, current_event, activation_direction) {
    if (data.event_activation_process) {
        if (!current_event.is_active(activation_direction)) return;
        if (current_event.type === event_types.STAIR && (data.stop_by_colliding || data.actual_action === "climb"))
            climb.climbing_event(data, current_event, activation_direction);
        else if (current_event.type === event_types.DOOR) {
            set_door_event(data, current_event, activation_direction);
        } else if (current_event.type === event_types.JUMP) {
            data.on_event = true;
            data.event_activation_process = false;
            jump_event(data, current_event);
        }
    }
}

export function event_triggering(game, data, event_key) {
    for (let i = 0; i < maps[data.map_name].events[event_key].length; ++i) {
        const this_event = maps[data.map_name].events[event_key][i];
        if (!this_event.activation_collision_layers.includes(data.map_collider_layer)) return;
        if (this_event.type === event_types.JUMP) {
            jump_near_collision(data, this_event);
        }
        let right_direction;
        if (Array.isArray(this_event.activation_directions)) {
            right_direction = this_event.activation_directions.includes(data.actual_direction);
        } else {
            right_direction = data.actual_direction === this_event.activation_directions;
        }
        if (!data.climbing) {
            if (!data.event_activation_process && right_direction && (data.actual_action === "walk" || data.actual_action === "dash")) {
                if (data.event_timers[this_event.id] && !data.event_timers[this_event.id].timer.expired) {
                    return;
                }
                data.event_activation_process = true;
                data.event_timers[this_event.id] = game.time.events.add(numbers.EVENT_TIME, fire_event.bind(null, data, this_event, data.actual_direction), this);
            } else if (data.event_activation_process && (!right_direction || data.actual_action === "idle")) {
                data.event_activation_process = false;
            }
        } else {
            if (!data.event_activation_process && this_event.activation_directions.includes(data.actual_direction)) {
                if (data.event_timers[this_event.id] && !data.event_timers[this_event.id].timer.expired) {
                    return;
                }
                data.event_activation_process = true;
                data.event_timers[this_event.id] = game.time.events.add(numbers.EVENT_TIME, fire_event.bind(null, data, this_event, data.actual_direction), this);
            } else if (data.event_activation_process && (!this_event.activation_directions.includes(data.actual_direction) || data.actual_direction === "idle")) {
                data.event_activation_process = false;
            }
        }

        if (this_event.type === event_types.SPEED) { //speed event activation
            if(data.extra_speed !== this_event.speed) {
                data.extra_speed = this_event.speed;
            }
        } else if (this_event.type === event_types.DOOR) { //door event activation
            if (!this_event.advance_effect) {
                data.event_activation_process = true;
                fire_event(data, this_event, data.actual_direction);
            }
        } else if (this_event.type === event_types.STEP && !data.waiting_to_step) {
            config_step(data, this_event);
        } else if (this_event.type === event_types.COLLISION && !data.waiting_to_change_collision) {
            config_collision_change(data, this_event);
        }
    }
}