import { jump_event, jump_near_collision } from './jump.js';
import { set_door_event } from './door.js';
import { config_step } from './step.js';
import { config_collision_change } from './collision.js';
import { event_types } from '../base/TileEvent.js';
import { maps } from '../initializers/maps.js';
import { climbing_event } from './climb.js';

const EVENT_TIME = 350;

class EventQueue {
    constructor() {
        this.stair_event = false;
        this.queue = [];
    }

    add(event, this_activation_direction, fire_function) {
        switch(event.type) {
            case event_types.STAIR:
                if (event.active && event.is_set && event.activation_directions.includes(this_activation_direction)) {
                    this.stair_event = true;
                }
                break;
        }
        this.queue.push({
            event: event,
            fire_function: fire_function
        });
    }

    process_queue() {
        if (this.stair_event) {
            this.queue = this.queue.filter(item => item.event.type !== event_types.JUMP);
        }
        this.queue.forEach(item => {
            item.fire_function();
        });
    }
}

export function fire_event(game, data, current_event, this_activation_direction) {
    if (data.hero.current_direction !== this_activation_direction) return;
    if (current_event.type === event_types.STAIR && !data.idle_climbing) {
        climbing_event(game, data, current_event, this_activation_direction);
    } else if (current_event.type === event_types.DOOR) {
        set_door_event(game, data, current_event);
    } else if (current_event.type === event_types.JUMP) {
        jump_event(game, data, current_event);
    }
}

export function event_triggering(game, data, event_key) {
    let event_queue = new EventQueue();
    for (let i = 0; i < maps[data.map_name].events[event_key].length; ++i) {
        const this_event = maps[data.map_name].events[event_key][i];
        if (!this_event.activation_collision_layers.includes(data.map_collider_layer)) continue;
        if (this_event.type === event_types.JUMP) {
            jump_near_collision(data, this_event);
        }
        if (!this_event.is_active(data.hero.current_direction)) continue;
        const right_direction = this_event.activation_directions.includes(data.hero.current_direction);
        if (right_direction && ["walk", "dash", "climb"].includes(data.hero.current_action)) {
            if (data.event_timers[this_event.id] && !data.event_timers[this_event.id].timer.expired) {
                continue;
            }
            event_queue.add(
                this_event,
                data.hero.current_direction,
                () => {
                    data.event_timers[this_event.id] = game.time.events.add(EVENT_TIME, fire_event.bind(null, game, data, this_event, data.hero.current_direction), this);
                }
            );
        }
        if (this_event.type === event_types.SPEED) {
            if (data.hero.extra_speed !== this_event.speed) {
                event_queue.add(
                    this_event,
                    data.hero.current_direction,
                    () => {
                        data.hero.extra_speed = this_event.speed;
                    }
                );
            }
        } else if (this_event.type === event_types.DOOR) {
            if (!this_event.advance_effect) {
                event_queue.add(
                    this_event,
                    data.hero.current_direction,
                    () => {
                        fire_event(game, data, this_event, data.hero.current_direction);
                    }
                );
            }
        } else if (this_event.type === event_types.STEP && !data.waiting_to_step) {
            event_queue.add(
                this_event,
                data.hero.current_direction,
                () => {
                    config_step(data, this_event);
                }
            );
        } else if (this_event.type === event_types.COLLISION && !data.waiting_to_change_collision) {
            event_queue.add(
                this_event,
                data.hero.current_direction,
                () => {
                    config_collision_change(data, this_event);
                }
            );
        }
    }
    event_queue.process_queue();
}
