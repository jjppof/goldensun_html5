import { base_actions } from '../utils.js';
import { event_types } from './TileEvent.js';

const EVENT_INIT_DELAY = 350;

class EventQueue {
    constructor() {
        this.climb_event = false;
        this.queue = [];
    }

    add(event, this_activation_direction, fire_function, fire = false) {
        switch(event.type) {
            case event_types.CLIMB:
                if (event.active && event.is_set && event.activation_directions.includes(this_activation_direction)) {
                    this.climb_event = true;
                }
                break;
        }
        if (fire) {
            fire_function();
        } else {
            this.queue.push({
                event: event,
                fire_function: fire_function
            });
        }
    }

    process_queue() {
        if (this.climb_event) {
            this.queue = this.queue.filter(item => item.event.type !== event_types.JUMP);
        }
        this.queue.forEach(item => item.fire_function());
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
        this.walking_on_pillars_tiles = new Set();
        this.triggered_events = {};
    }

    set_triggered_event(event) {
        this.triggered_events[event.id] = event;
    }

    unset_triggered_event(event) {
        delete this.triggered_events[event.id];
    }

    event_triggered(event) {
        return event.id in this.triggered_events;
    }

    fire_triggered_events() {
        Object.keys(this.triggered_events).forEach(id => {
            const this_event = this.triggered_events[id];
            if (this_event.type === event_types.SPEED) {
                this_event.unset();
            } else {
                this_event.fire();
            }
        });
    }

    fire_event(current_event, this_activation_direction) {
        if (this.hero.current_direction !== this_activation_direction) return;
        if (current_event.type === event_types.CLIMB && !this.hero.idle_climbing) {
            current_event.fire(this_activation_direction);
        } else if ([event_types.TELEPORT, event_types.JUMP].includes(current_event.type)) {
            current_event.fire();
        }
    }

    check_tile_events(event_key, map) {
        let event_queue = new EventQueue();
        for (let i = 0; i < map.events[event_key].length; ++i) {
            const this_event = map.events[event_key][i];
            if (!this_event.activation_collision_layers.includes(map.collision_layer)) continue;
            if (this_event.type === event_types.JUMP) {
                this_event.jump_near_collision();
            }
            if (!this_event.is_active(this.hero.current_direction)) continue;
            if (this_event.type === event_types.SPEED) {
                if (this.hero.extra_speed !== this_event.speed) {
                    event_queue.add(
                        this_event,
                        this.hero.current_direction,
                        this_event.fire.bind(this_event),
                        true
                    );
                }
            } else if (this_event.type === event_types.TELEPORT && !this_event.advance_effect) {
                    event_queue.add(
                        this_event,
                        this.hero.current_direction,
                        this.fire_event.bind(this, this_event, this.hero.current_direction)
                    );
            } else if ([event_types.STEP, event_types.COLLISION].includes(this_event.type) && !this.event_triggered(this_event)) {
                event_queue.add(
                    this_event,
                    this.hero.current_direction,
                    this_event.set.bind(this_event)
                );
            } else {
                const right_direction = this_event.activation_directions.includes(this.hero.current_direction);
                if (right_direction && [base_actions.WALK, base_actions.DASH, base_actions.CLIMB].includes(this.hero.current_action)) {
                    if (this.event_timers[this_event.id] && !this.event_timers[this_event.id].timer.expired) {
                        continue;
                    }
                    event_queue.add(
                        this_event,
                        this.hero.current_direction,
                        () => {
                            this.event_timers[this_event.id] = this.game.time.events.add(EVENT_INIT_DELAY, this.fire_event.bind(this, this_event, this.hero.current_direction));
                        }
                    );
                }
            }
        }
        event_queue.process_queue();
    }
}
