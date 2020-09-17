import { jump_event, jump_near_collision } from './jump.js';
import { set_door_event } from './door.js';
import { config_step } from './step.js';
import { event_types } from '../base/TileEvent.js';
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

export class TileEventManager {
    constructor(game, data, hero, collision) {
        this.game = game;
        this.data = data;
        this.hero = hero;
        this.collision = collision;
        this.event_timers = {};
        this.on_event = false;
    }

    fire_event(current_event, this_activation_direction) {
        if (this.hero.current_direction !== this_activation_direction) return;
        if (current_event.type === event_types.STAIR && !this.hero.idle_climbing) {
            climbing_event(this.game, this.data, current_event, this_activation_direction);
        } else if (current_event.type === event_types.DOOR) {
            set_door_event(this.game, this.data, current_event);
        } else if (current_event.type === event_types.JUMP) {
            jump_event(this.game, this.data, current_event);
        }
    }
    
    event_triggering(event_key, map) {
        let event_queue = new EventQueue();
        for (let i = 0; i < map.events[event_key].length; ++i) {
            const this_event = map.events[event_key][i];
            if (!this_event.activation_collision_layers.includes(map.collision_layer)) continue;
            if (this_event.type === event_types.JUMP) {
                jump_near_collision(this.game, this.data, this_event);
            }
            if (!this_event.is_active(this.hero.current_direction)) continue;
            const right_direction = this_event.activation_directions.includes(this.hero.current_direction);
            if (right_direction && ["walk", "dash", "climb"].includes(this.hero.current_action)) {
                if (this.event_timers[this_event.id] && !this.event_timers[this_event.id].timer.expired) {
                    continue;
                }
                event_queue.add(
                    this_event,
                    this.hero.current_direction,
                    () => {
                        this.event_timers[this_event.id] = this.game.time.events.add(EVENT_TIME, this.fire_event.bind(this, this_event, this.hero.current_direction));
                    }
                );
            }
            if (this_event.type === event_types.SPEED) {
                if (this.hero.extra_speed !== this_event.speed) {
                    event_queue.add(
                        this_event,
                        this.hero.current_direction,
                        () => {
                            this.hero.extra_speed = this_event.speed;
                        }
                    );
                }
            } else if (this_event.type === event_types.DOOR) {
                if (!this_event.advance_effect) {
                    event_queue.add(
                        this_event,
                        this.hero.current_direction,
                        () => {
                            this.fire_event(this_event, this.hero.current_direction);
                        }
                    );
                }
            } else if (this_event.type === event_types.STEP && !this.data.waiting_to_step) {
                event_queue.add(
                    this_event,
                    this.hero.current_direction,
                    () => {
                        config_step(this.data, this_event);
                    }
                );
            } else if (this_event.type === event_types.COLLISION && !this.collision.waiting_to_change_collision) {
                event_queue.add(
                    this_event,
                    this.hero.current_direction,
                    () => {
                        this.collision.config_collision_change(this_event);
                    }
                );
            }
        }
        event_queue.process_queue();
    }
}
