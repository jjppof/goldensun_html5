import {event_types, LocationKey, TileEvent} from "./TileEvent";
import * as numbers from "../magic_numbers";
import * as _ from "lodash";
import {get_surroundings, get_opposite_direction, directions, split_direction, direction_range} from "../utils";
import {GoldenSun} from "../GoldenSun";
import {Map} from "../Map";

const JUMP_OFFSET = 30;
const JUMP_DURATION = 150;

export class JumpEvent extends TileEvent {
    public is_set: boolean;

    constructor(
        game,
        data,
        x,
        y,
        activation_directions,
        activation_collision_layers,
        dynamic,
        active,
        active_storage_key,
        affected_by_reveal,
        is_set
    ) {
        super(
            game,
            data,
            event_types.JUMP,
            x,
            y,
            activation_directions,
            activation_collision_layers,
            dynamic,
            active,
            active_storage_key,
            null,
            affected_by_reveal
        );
        this.is_set = is_set ?? true;
    }

    fire() {
        if (!this.data.hero.stop_by_colliding || !this.check_position() || !this.data.hero_movement_allowed(false)) {
            return;
        }
        let jump_offset = JUMP_OFFSET;
        let direction;
        let jump_direction;
        let next_position = {x: this.x, y: this.y};
        let side_position = {x: this.x, y: this.y};
        if (this.data.hero.current_direction === directions.left) {
            jump_offset = -jump_offset;
            direction = "x";
            next_position.x -= 2;
            side_position.x -= 1;
            jump_direction = directions.left;
        } else if (this.data.hero.current_direction === directions.right) {
            direction = "x";
            next_position.x += 2;
            side_position.x += 1;
            jump_direction = directions.right;
        } else if (this.data.hero.current_direction === directions.up) {
            jump_offset = -jump_offset;
            direction = "y";
            next_position.y -= 2;
            side_position.y -= 1;
            jump_direction = directions.up;
        } else if (this.data.hero.current_direction === directions.down) {
            direction = "y";
            next_position.y += 2;
            side_position.y += 1;
            jump_direction = directions.down;
        }
        if (jump_direction === undefined) {
            return;
        }
        const side_pos_key = LocationKey.get_key(side_position.x, side_position.y);
        if (side_pos_key in this.data.map.events) {
            for (let i = 0; i < this.data.map.events[side_pos_key].length; ++i) {
                const event = this.data.map.events[side_pos_key][i];
                let interactable_object_found = false;
                for (let j = 0; j < this.data.map.interactable_objects.length; ++j) {
                    const interactable_object = this.data.map.interactable_objects[j];
                    //if the side position has a interactable object, it does not cancel this jump event
                    if (this.data.map.collision_layer !== interactable_object.base_collision_layer) continue;
                    if (event.x === interactable_object.current_x && event.y === interactable_object.current_y) {
                        interactable_object_found = true;
                        break;
                    }
                }
                if (interactable_object_found) {
                    continue;
                }
                //cancel jumping if the next side event is also a jump
                if (
                    event.type === event_types.JUMP &&
                    (event as JumpEvent).is_set &&
                    event.activation_collision_layers.includes(this.data.map.collision_layer)
                ) {
                    return;
                }
            }
        }
        const next_pos_key = LocationKey.get_key(next_position.x, next_position.y);
        for (let i = 0; i < this.data.map.interactable_objects.length; ++i) {
            const next_interactable_object = this.data.map.interactable_objects[i];
            if (
                next_interactable_object.current_x !== next_position.x ||
                next_interactable_object.current_y !== next_position.y
            )
                continue;
            if (this.data.map.collision_layer !== next_interactable_object.base_collision_layer) continue;
            return;
        }
        for (let i = 0; i < this.data.map.npcs.length; ++i) {
            const next_npc = this.data.map.npcs[i];
            if (next_npc.tile_x_pos !== next_position.x || next_npc.tile_y_pos !== next_position.y) continue;
            if (this.data.map.collision_layer !== next_npc.base_collision_layer) continue;
            return;
        }
        if (next_pos_key in this.data.map.events) {
            let active_jump_event_found = false;
            for (let i = 0; i < this.data.map.events[next_pos_key].length; ++i) {
                const event = this.data.map.events[next_pos_key][i];
                if (
                    event.type === event_types.JUMP &&
                    event.is_active(get_opposite_direction(jump_direction)) &&
                    (event as JumpEvent).is_set &&
                    event.activation_collision_layers.includes(this.data.map.collision_layer)
                ) {
                    active_jump_event_found = true;
                    if (event.dynamic) {
                        JumpEvent.set_jump_collision(this.game, this.data);
                        break;
                    } else if (this.dynamic) {
                        JumpEvent.unset_set_jump_collision(this.data);
                    }
                }
            }
            if (!active_jump_event_found) {
                return;
            }
        } else if (this.dynamic) {
            return;
        }
        this.data.tile_event_manager.on_event = true;
        this.data.hero
            .jump({
                jump_height: 16,
                duration: JUMP_DURATION,
                jump_direction: jump_direction,
                dest: {
                    tile_x: next_position.x,
                    tile_y: next_position.y,
                    distance: jump_offset,
                },
            })
            .then(() => {
                this.data.tile_event_manager.on_event = false;
            });
    }

    destroy() {
        this._origin_interactable_object = null;
    }

    create_collision_bodies_around_jump_events() {
        const current_pos = {x: this.data.hero.tile_x_pos, y: this.data.hero.tile_y_pos};
        const surroundings = get_surroundings(current_pos.x, current_pos.y, true);
        let right_direction = false;
        const possible_directions = split_direction(this.data.hero.current_direction);
        //this for is used to check whether the hero is going towards the event activation directions
        for (let i = 0; i < possible_directions.length; ++i) {
            let is_possible = this.activation_directions.includes(possible_directions[i]);
            const possible_pos = _.find(surroundings, {direction: possible_directions[i]});
            const possible_pos_key = LocationKey.get_key(possible_pos.x, possible_pos.y);
            if (possible_pos_key in this.data.map.events) {
                //this for is used to check whether a possible direction is a valid position
                //because hero can walk over jump events that are set
                for (let j = 0; j < this.data.map.events[possible_pos_key].length; ++j) {
                    const surrounding_event = this.data.map.events[possible_pos_key][j];
                    if (
                        surrounding_event.type === event_types.JUMP &&
                        !(surrounding_event as JumpEvent).is_set &&
                        surrounding_event.activation_collision_layers.includes(this.data.map.collision_layer)
                    ) {
                        is_possible = false;
                        break;
                    }
                }
            }
            right_direction = right_direction || is_possible;
        }

        const clear_bodies = () => {
            this.data.collision.enable_map_collision();
            for (let j = 0; j < this.data.collision.dynamic_jump_events_bodies.length; ++j) {
                this.data.collision.dynamic_jump_events_bodies[j].destroy();
            }
            this.data.collision.dynamic_jump_events_bodies = [];
        };

        let concat_keys = String(LocationKey.get_key(this.data.hero.tile_x_pos, this.data.hero.tile_y_pos));
        const bodies_positions = [];
        let at_least_one_dynamic_and_not_diag = false;
        for (let i = 0; i < surroundings.length; ++i) {
            //this for is used to find surrounding jump events.
            //collision events should not be created over these events.
            const surrounding_key = LocationKey.get_key(surroundings[i].x, surroundings[i].y);
            if (surrounding_key in this.data.map.events) {
                for (let j = 0; j < this.data.map.events[surrounding_key].length; ++j) {
                    const surrounding_event = this.data.map.events[surrounding_key][j];
                    if (
                        surrounding_event.type === event_types.JUMP &&
                        right_direction &&
                        (surrounding_event as JumpEvent).is_set &&
                        surrounding_event.activation_collision_layers.includes(this.data.map.collision_layer)
                    ) {
                        if ((surrounding_event.dynamic || this.dynamic) && !surroundings[i].diag) {
                            //needs at least one non diagonal position in order to create the collision bodies
                            at_least_one_dynamic_and_not_diag = true;
                        }
                        const side_event_surroundings = get_surroundings(surroundings[i].x, surroundings[i].y, false);
                        bodies_positions.push(side_event_surroundings);
                        concat_keys = `${concat_keys}/${surrounding_key}`;
                    }
                }
            }
        }
        if (
            !this.data.tile_event_manager.walking_on_pillars_tiles.has(concat_keys) &&
            at_least_one_dynamic_and_not_diag
        ) {
            this.data.tile_event_manager.walking_on_pillars_tiles.clear();
            this.data.tile_event_manager.walking_on_pillars_tiles.add(concat_keys);
            clear_bodies();

            //using Set to get unique positions and dont create bodies in same location
            const bodies_position = new Set(
                surroundings.concat(...bodies_positions).map(pos => LocationKey.get_key(pos.x, pos.y))
            );
            concat_keys.split("/").forEach(key => {
                //exclude the positions of the side jump events
                bodies_position.delete(+key);
            });

            //the hero now will collide with the dynamic bodies that will be created
            this.data.collision.disable_map_collision();

            //gets the position behind the hero (position of opposite direction)
            let hero_opposite_dir = this.data.hero.current_direction;
            if ((hero_opposite_dir & 1) === 1) {
                //transforms diagonal positions in cardinal positions
                if (this.activation_directions.includes(hero_opposite_dir - 1)) {
                    --hero_opposite_dir;
                } else {
                    hero_opposite_dir = (hero_opposite_dir + 1) & 7;
                }
            }
            hero_opposite_dir = get_opposite_direction(hero_opposite_dir);
            const opposite_position = _.find(surroundings, {direction: hero_opposite_dir});

            //creates the collision bodies
            bodies_position.forEach(key => {
                const pos = LocationKey.get_pos(key);
                if (pos.x === opposite_position.x && pos.y === opposite_position.y && !this.dynamic) {
                    //collision bodies should not be created behind the hero
                    return;
                }
                const x_pos = (pos.x + 0.5) * this.data.map.tile_width;
                const y_pos = (pos.y + 0.5) * this.data.map.tile_height;
                const body = this.game.physics.p2.createBody(x_pos, y_pos, 0, true);
                body.clearShapes();
                body.setRectangle(this.data.map.tile_width, this.data.map.tile_height, 0, 0);
                body.setCollisionGroup(this.data.collision.dynamic_events_collision_group);
                body.damping = numbers.MAP_DAMPING;
                body.angularDamping = numbers.MAP_DAMPING;
                body.setZeroRotation();
                body.fixedRotation = true;
                body.dynamic = false;
                body.static = true;
                body.debug = this.data.hero.sprite.body.debug;
                body.collides(this.data.collision.hero_collision_group);
                this.data.collision.dynamic_jump_events_bodies.push(body);
            });
        }
        if (!this.dynamic && !right_direction && this.data.tile_event_manager.walking_on_pillars_tiles.size) {
            const event_x = (this.x + 0.5) * this.data.map.tile_width;
            const event_y = (this.y + 0.5) * this.data.map.tile_height;
            const distance_to_clear = this.data.map.tile_width / 4;

            //calculates the minimal distance to clear the collision bodies
            let clear_bodies_flag = false;
            if (
                this.activation_directions.includes(directions.up) &&
                !_.intersection(possible_directions, direction_range(directions.up)).length
            ) {
                clear_bodies_flag = event_y - this.data.hero.sprite.y < distance_to_clear;
            }
            if (
                !clear_bodies_flag &&
                this.activation_directions.includes(directions.down) &&
                !_.intersection(possible_directions, direction_range(directions.down)).length
            ) {
                clear_bodies_flag = this.data.hero.sprite.y - event_y < distance_to_clear;
            }
            if (
                !clear_bodies_flag &&
                this.activation_directions.includes(directions.right) &&
                !_.intersection(possible_directions, direction_range(directions.right)).length
            ) {
                clear_bodies_flag = this.data.hero.sprite.x - event_x < distance_to_clear;
            }
            if (
                !clear_bodies_flag &&
                this.activation_directions.includes(directions.left) &&
                !_.intersection(possible_directions, direction_range(directions.left)).length
            ) {
                clear_bodies_flag = event_x - this.data.hero.sprite.x < distance_to_clear;
            }

            if (clear_bodies_flag) {
                //if the hero is not going toward an activation direction of this event, collision bodies are removed
                this.data.tile_event_manager.walking_on_pillars_tiles.clear();
                clear_bodies();
            }
        }
    }

    static set_jump_collision(game: Phaser.Game, data: GoldenSun) {
        for (let i = 0; i < data.collision.dynamic_jump_events_bodies.length; ++i) {
            data.collision.dynamic_jump_events_bodies[i].destroy();
        }
        data.collision.dynamic_jump_events_bodies = [];
        data.tile_event_manager.walking_on_pillars_tiles.clear();
        data.collision.disable_map_collision();
        for (let event_key in data.map.events) {
            for (let j = 0; j < data.map.events[event_key].length; ++j) {
                const event = data.map.events[event_key][j];
                if (
                    event.type === event_types.JUMP &&
                    event.dynamic &&
                    (event as JumpEvent).is_set &&
                    event.activation_collision_layers.includes(data.map.collision_layer)
                ) {
                    const surroundings = get_surroundings(event.x, event.y);
                    for (let i = 0; i < surroundings.length; ++i) {
                        const surrounding_key = LocationKey.get_key(surroundings[i].x, surroundings[i].y);
                        if (surrounding_key in data.map.events) {
                            let dynamic_found = false;
                            for (let k = 0; k < data.map.events[surrounding_key].length; ++k) {
                                const this_event = data.map.events[surrounding_key][k];
                                if (
                                    this_event.dynamic &&
                                    this_event.type === event_types.JUMP &&
                                    (this_event as JumpEvent).is_set &&
                                    this_event.activation_collision_layers.includes(data.map.collision_layer)
                                ) {
                                    dynamic_found = true;
                                    break;
                                }
                            }
                            if (dynamic_found) continue;
                        }
                        const x_pos = (surroundings[i].x + 0.5) * data.map.tile_width;
                        const y_pos = (surroundings[i].y + 0.5) * data.map.tile_height;
                        const body = game.physics.p2.createBody(x_pos, y_pos, 0, true);
                        body.clearShapes();
                        body.setRectangle(data.map.tile_width, data.map.tile_height, 0, 0);
                        body.setCollisionGroup(data.collision.dynamic_events_collision_group);
                        body.damping = numbers.MAP_DAMPING;
                        body.angularDamping = numbers.MAP_DAMPING;
                        body.setZeroRotation();
                        body.fixedRotation = true;
                        body.dynamic = false;
                        body.static = true;
                        body.debug = data.hero.sprite.body.debug;
                        body.collides(data.collision.hero_collision_group);
                        data.collision.dynamic_jump_events_bodies.push(body);
                    }
                }
            }
        }
    }

    static unset_set_jump_collision(data: GoldenSun) {
        data.collision.enable_map_collision();
        for (let i = 0; i < data.collision.dynamic_jump_events_bodies.length; ++i) {
            data.collision.dynamic_jump_events_bodies[i].destroy();
        }
        data.collision.dynamic_jump_events_bodies = [];
    }

    static active_jump_surroundings(
        data: GoldenSun,
        surroundings: ReturnType<typeof get_surroundings>,
        target_layer: Map["collision_layer"]
    ) {
        for (let j = 0; j < surroundings.length; ++j) {
            const surrounding = surroundings[j];
            const this_key = LocationKey.get_key(surrounding.x, surrounding.y);
            if (this_key in data.map.events) {
                for (let k = 0; k < data.map.events[this_key].length; ++k) {
                    const surr_event = data.map.events[this_key][k];
                    if (surr_event.type === event_types.JUMP) {
                        if (surr_event.activation_collision_layers.includes(target_layer)) {
                            if (surr_event.dynamic === false && (surr_event as JumpEvent).is_set) {
                                surr_event.activate_at(get_opposite_direction(surrounding.direction));
                            }
                        }
                    }
                }
            }
        }
    }
}
