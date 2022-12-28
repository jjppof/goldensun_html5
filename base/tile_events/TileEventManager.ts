import {GoldenSun} from "../GoldenSun";
import {base_actions, directions} from "../utils";
import {ClimbEvent} from "./ClimbEvent";
import {CollisionEvent} from "./CollisionEvent";
import {EventTriggerEvent} from "./EventTriggerEvent";
import {IceSlideEvent} from "./IceSlideEvent";
import {JumpEvent} from "./JumpEvent";
import {RopeEvent} from "./RopeEvent";
import {SliderEvent} from "./SliderEvent";
import {SpeedEvent} from "./SpeedEvent";
import {StepEvent} from "./StepEvent";
import {TeleportEvent} from "./TeleportEvent";
import {event_types, IntegerPairKey, TileEvent} from "./TileEvent";

class EventQueue {
    private climb_event: boolean;
    private queue: {
        event: TileEvent;
        fire_function: Function;
    }[];

    constructor() {
        this.reset();
    }

    get length() {
        return this.queue.length;
    }

    add(event: TileEvent, this_activation_direction: directions, fire_function: Function, fire = false) {
        switch (event.type) {
            case event_types.CLIMB:
                if (event.is_active_at_direction(this_activation_direction)) {
                    this.climb_event = true;
                }
                break;
        }
        if (fire) {
            fire_function();
        } else {
            this.queue.push({
                event: event,
                fire_function: fire_function,
            });
        }
    }

    process_queue() {
        if (this.climb_event) {
            this.queue = this.queue.filter(item => item.event.type !== event_types.JUMP);
        }
        this.queue.forEach(item => item.fire_function());
    }

    reset() {
        this.climb_event = false;
        this.queue = [];
    }
}

/**
 * This class manages all the Tile Events of the game like
 * jump, climb, ice slide, etc. This class decides when to fire, trigger
 * or unset a tile event. This class also has a tile event factory
 * method.
 */
export class TileEventManager {
    private static readonly EVENT_INIT_DELAY = 350;

    private game: Phaser.Game;
    private data: GoldenSun;
    private _event_timers: {
        [timer_key: number]: {
            timer: Phaser.Timer;
            activation_direction: directions;
        };
    };
    public on_event: boolean;
    private _walking_on_pillars_tiles: Set<string>;
    private triggered_events: {[event_id: number]: TileEvent};
    private event_queue: EventQueue;

    constructor(game, data) {
        this.game = game;
        this.data = data;
        this._event_timers = {};
        this.on_event = false;
        this._walking_on_pillars_tiles = new Set();
        this.triggered_events = {};
        this.event_queue = new EventQueue();
    }

    get walking_on_pillars_tiles() {
        return this._walking_on_pillars_tiles;
    }
    /** An object that holds the timers and chosen activation direction
     * of tile events that are up to happen. */
    get event_timers() {
        return this._event_timers;
    }

    /** Checks whether there are events that are up to happen. */
    get timers_running() {
        return Boolean(Object.keys(this.event_timers).length);
    }

    set_triggered_event(event: TileEvent) {
        this.triggered_events[event.id] = event;
    }

    unset_triggered_event(event: TileEvent) {
        delete this.triggered_events[event.id];
    }

    event_triggered(event: TileEvent) {
        return event.id in this.triggered_events;
    }

    fire_triggered_events() {
        Object.keys(this.triggered_events).forEach(id => {
            const this_event: TileEvent = this.triggered_events[id];
            if (this_event.type === event_types.SPEED) {
                (this_event as SpeedEvent).unset();
            } else {
                this_event.fire();
            }
        });
    }

    private fire_event(current_event: TileEvent, this_activation_direction: directions) {
        if (current_event.check_if_disabled_by_storage()) {
            return;
        }
        if (current_event.type === event_types.ICE_SLIDE && this.data.hero.ice_sliding_active) {
            current_event.fire();
            return;
        }
        if (this.data.hero.current_direction !== this_activation_direction) {
            return;
        }
        if (current_event.type === event_types.CLIMB && !this.data.hero.idle_climbing) {
            (current_event as ClimbEvent).set_current_activation_direction(this_activation_direction);
            current_event.fire();
        } else if (![event_types.SPEED, event_types.STEP, event_types.COLLISION].includes(current_event.type)) {
            current_event.fire();
        }
    }

    /**
     * Checks whether exists TileEvents in the current hero location
     * and fire them. If there are any events in the current hero location,
     * they'll be added to the event queue, then fired in sequence.
     * @param location_key the location key of the current position of the hero.
     */
    check_tile_events() {
        const location_key = IntegerPairKey.get_key(this.data.hero.tile_x_pos, this.data.hero.tile_y_pos);
        if (!(location_key in this.data.map.events)) {
            return;
        }
        for (let i = 0; i < this.data.map.events[location_key].length; ++i) {
            const this_event = this.data.map.events[location_key][i];

            //ignore events on different collision layers than the one that the hero is.
            if (!this_event.activation_collision_layers.has(this.data.map.collision_layer)) {
                continue;
            }

            //ignore events that are not active in the direction that the hero is going.
            if (!this_event.is_active_at_direction(this.data.hero.current_direction)) {
                continue;
            }

            //activates different types of tile events.
            switch (this_event.type) {
                case event_types.SPEED:
                    if (this.data.hero.extra_speed !== (this_event as SpeedEvent).speed) {
                        this.event_queue.add(
                            this_event,
                            this.data.hero.current_direction,
                            this_event.fire.bind(this_event),
                            true
                        );
                    }
                    break;
                case event_types.STEP:
                case event_types.COLLISION:
                    if (!this.event_triggered(this_event)) {
                        this.event_queue.add(
                            this_event,
                            this.data.hero.current_direction,
                            (this_event as StepEvent | CollisionEvent).set.bind(this_event)
                        );
                    }
                    break;
                case event_types.ICE_SLIDE:
                case event_types.EVENT_TRIGGER:
                    this.event_queue.add(
                        this_event,
                        this.data.hero.current_direction,
                        this.fire_event.bind(this, this_event, this.data.hero.current_direction)
                    );
                    break;
                case event_types.TELEPORT:
                case event_types.JUMP:
                case event_types.CLIMB:
                case event_types.SLIDER:
                case event_types.ROPE:
                    if (
                        this_event.type === event_types.TELEPORT &&
                        !(this_event as TeleportEvent).open_door &&
                        !(this_event as TeleportEvent).start_climbing
                    ) {
                        this.event_queue.add(
                            this_event,
                            this.data.hero.current_direction,
                            this.fire_event.bind(this, this_event, this.data.hero.current_direction)
                        );
                    } else {
                        const right_direction = this_event.is_active_at_direction(this.data.hero.current_direction);
                        //the hero must be trying to walk/dash/climb towards the event activation direction.
                        if (
                            right_direction &&
                            [base_actions.WALK, base_actions.DASH, base_actions.CLIMB, base_actions.ROPE].includes(
                                this.data.hero.current_action as base_actions
                            )
                        ) {
                            //it's important to also bind direction because the hero may change its direction on timer end,
                            //so we need to make sure that we still are in the same direction as before.
                            const timer_key = IntegerPairKey.get_key(this_event.id, this.data.hero.current_direction);

                            //these events take a little time to start, if the timer of this event already started,
                            //this incoming event will be ignored.
                            if (this.event_timers[timer_key] && this.event_timers[timer_key].timer.running) {
                                continue;
                            }
                            this.event_queue.add(this_event, this.data.hero.current_direction, () => {
                                //creates a timer to activate this event. The event will be fired on this timer finish.
                                this.event_timers[timer_key] = {
                                    timer: this.game.time.create(true),
                                    activation_direction: this.data.hero.current_direction,
                                };
                                this.event_timers[timer_key].timer.add(TileEventManager.EVENT_INIT_DELAY, () => {
                                    //checks whether the hero is still going towards event activation direction and is in the same collision layer.
                                    if (
                                        this.event_timers[timer_key].activation_direction ===
                                            this.data.hero.current_direction &&
                                        this_event.is_active_at_direction(this.data.hero.current_direction) &&
                                        this_event.activation_collision_layers.has(this.data.hero.collision_layer)
                                    ) {
                                        this.fire_event(this_event, this.data.hero.current_direction);
                                    }
                                    //kills the timer that started this event
                                    if (this.event_timers[timer_key]) {
                                        if (!this.event_timers[timer_key].timer.autoDestroy) {
                                            this.event_timers[timer_key].timer.destroy();
                                        }
                                        delete this.event_timers[timer_key];
                                    }
                                });
                                this.event_timers[timer_key].timer.start();
                            });
                        }
                    }
                    break;
                default:
                    break;
            }
        }
        if (this.event_queue?.length) {
            this.event_queue.process_queue();
        }
        this.event_queue.reset();
    }

    /**
     * Tile event factory.
     * @param info object that contains TileEvent initializing data.
     * @returns returns a TileEvent type object.
     */
    get_event_instance(info: any) {
        if (info.type === event_types.CLIMB) {
            return new ClimbEvent(
                this.game,
                this.data,
                info.x,
                info.y,
                info.activation_directions,
                info.initial_disabled_directions,
                info.activation_collision_layers,
                info.active_storage_key,
                info.affected_by_reveal,
                info.key_name,
                info.change_to_collision_layer
            );
        } else if (info.type === event_types.SPEED) {
            return new SpeedEvent(
                this.game,
                this.data,
                info.x,
                info.y,
                info.activation_directions,
                info.initial_disabled_directions,
                info.activation_collision_layers,
                info.active_storage_key,
                info.affected_by_reveal,
                info.key_name,
                info.speed,
                info.on_stairs,
                info.force_axis
            );
        } else if (info.type === event_types.TELEPORT) {
            return new TeleportEvent(
                this.game,
                this.data,
                info.x,
                info.y,
                info.activation_directions,
                info.initial_disabled_directions,
                info.activation_collision_layers,
                info.active_storage_key,
                info.affected_by_reveal,
                info.key_name,
                info.target,
                info.x_target,
                info.y_target,
                info.open_door,
                info.start_climbing,
                info.stop_climbing,
                info.dest_collision_layer,
                info.destination_direction,
                info.keep_encounter_cumulator,
                info.fade_camera,
                info.skip_checks,
                info.finish_before_fadeout,
                info.skip_map_change_events,
                info.fade_duration,
                info.door_settings,
                info.spiral_stair
            );
        } else if (info.type === event_types.SLIDER) {
            return new SliderEvent(
                this.game,
                this.data,
                info.x,
                info.y,
                info.activation_directions,
                info.initial_disabled_directions,
                info.activation_collision_layers,
                info.active_storage_key,
                info.affected_by_reveal,
                info.key_name,
                info.x_target,
                info.y_target,
                info.dest_collision_layer,
                info.show_dust,
                info.teleport,
                info.teleport_target,
                info.teleport_init_x,
                info.teleport_init_y,
                info.teleport_end_x,
                info.teleport_end_y,
                info.ground_hit_animation
            );
        } else if (info.type === event_types.JUMP) {
            return new JumpEvent(
                this.game,
                this.data,
                info.x,
                info.y,
                info.activation_directions,
                info.initial_disabled_directions,
                info.activation_collision_layers,
                info.active_storage_key,
                null,
                info.affected_by_reveal,
                info.key_name
            );
        } else if (info.type === event_types.STEP) {
            return new StepEvent(
                this.game,
                this.data,
                info.x,
                info.y,
                info.activation_directions,
                info.initial_disabled_directions,
                info.activation_collision_layers,
                info.active_storage_key,
                info.affected_by_reveal,
                info.key_name,
                info.step_direction
            );
        } else if (info.type === event_types.COLLISION) {
            return new CollisionEvent(
                this.game,
                this.data,
                info.x,
                info.y,
                info.activation_directions,
                info.initial_disabled_directions,
                info.activation_collision_layers,
                info.active_storage_key,
                info.affected_by_reveal,
                info.key_name,
                info.dest_collision_layer
            );
        } else if (info.type === event_types.EVENT_TRIGGER) {
            return new EventTriggerEvent(
                this.game,
                this.data,
                info.x,
                info.y,
                info.activation_directions,
                info.initial_disabled_directions,
                info.activation_collision_layers,
                info.active_storage_key,
                info.affected_by_reveal,
                info.key_name,
                info.events,
                info.remove_from_field
            );
        } else if (info.type === event_types.ICE_SLIDE) {
            return new IceSlideEvent(
                this.game,
                this.data,
                info.x,
                info.y,
                info.activation_directions,
                info.initial_disabled_directions,
                info.activation_collision_layers,
                info.active_storage_key,
                info.affected_by_reveal,
                info.key_name,
                info.start_sliding_direction
            );
        } else if (info.type === event_types.ROPE) {
            return new RopeEvent(
                this.game,
                this.data,
                info.x,
                info.y,
                info.activation_directions,
                info.initial_disabled_directions,
                info.activation_collision_layers,
                info.active_storage_key,
                info.affected_by_reveal,
                info.key_name,
                info.origin_interactable_object,
                info.walk_over_rope,
                info.dock_exit_collision_layer,
                info.rope_collision_layer
            );
        } else {
            console.warn(`Tile event type ${info.type} not found.`);
            return null;
        }
    }
}
