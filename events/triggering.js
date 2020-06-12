import { jump_event, jump_near_collision } from './jump.js';
import { set_door_event } from './door.js';
import { config_step } from './step.js';
import { config_collision_change } from './collision.js';
import { event_types } from '../base/TileEvent.js';
import * as numbers from '../magic_numbers.js';
import { maps } from '../initializers/maps.js';
import { climbing_event } from './climb.js';

export function fire_event(game, data, current_event, activation_direction) {
    if (data.actual_direction !== activation_direction) return;
    if (current_event.type === event_types.STAIR && data.actual_direction !== "idle") {
        climbing_event(game, data, current_event, activation_direction);
    } else if (current_event.type === event_types.DOOR) {
        set_door_event(data, current_event, activation_direction);
    } else if (current_event.type === event_types.JUMP) {
        jump_event(data, current_event);
    }
}

export function event_triggering(game, data, event_key) {
    for (let i = 0; i < maps[data.map_name].events[event_key].length; ++i) {
        const this_event = maps[data.map_name].events[event_key][i];
        if (!this_event.activation_collision_layers.includes(data.map_collider_layer)) continue;
        if (this_event.type === event_types.JUMP) {
            jump_near_collision(data, this_event);
        }
        if (!this_event.is_active(data.actual_direction)) continue;
        const right_direction = this_event.activation_directions.includes(data.actual_direction);
        if (right_direction && ["walk", "dash", "climb"].includes(data.actual_action)) {
            if (data.event_timers[this_event.id] && !data.event_timers[this_event.id].timer.expired) {
                continue;
            }
            data.event_timers[this_event.id] = game.time.events.add(numbers.EVENT_TIME, fire_event.bind(null, game, data, this_event, data.actual_direction), this);
        }
        if (this_event.type === event_types.SPEED) {
            if (data.extra_speed !== this_event.speed) {
                data.extra_speed = this_event.speed;
            }
        } else if (this_event.type === event_types.DOOR) {
            if (!this_event.advance_effect) {
                fire_event(game, data, this_event, data.actual_direction);
            }
        } else if (this_event.type === event_types.STEP && !data.waiting_to_step) {
            config_step(data, this_event);
        } else if (this_event.type === event_types.COLLISION && !data.waiting_to_change_collision) {
            config_collision_change(data, this_event);
        }
    }
}