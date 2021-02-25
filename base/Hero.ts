import {ControllableChar} from "./ControllableChar";
import * as numbers from "./magic_numbers";
import {event_types, LocationKey} from "./tile_events/TileEvent";
import {get_transition_directions, range_360, directions, base_actions, get_direction_mask} from "./utils";
import {normal_push} from "./interactable_objects/push";
import {Map} from "./Map";
import {ClimbEvent} from "./tile_events/ClimbEvent";
import {Button} from "./XGamepad";

export class Hero extends ControllableChar {
    private static readonly SPEED_LIMIT_TO_STOP = 13;
    private static readonly SPEED_LIMIT_TO_STOP_WORLD_MAP = 9;
    private static readonly MINIMAL_SLOPE = 0.1;

    //ROTATION_KEY can convert from pressed_keys to the corresponding in-game rotation
    private static readonly ROTATION_KEY = [
        null, //no keys pressed
        directions.right, //right
        directions.left, //left
        null, //right and left
        directions.up, //up
        directions.up_right, //up and right
        directions.up_left, //up and left
        null, //up, left, and right
        directions.down, //down
        directions.down_right, //down and right
        directions.down_left, //down and left
        null, //down, left, and right
        null, //down and up
        null, //down, up, and right
        null, //down, up, and left
        null, //down, up, left, and right
    ];

    //ROTATION_NORMAL converts from normal_angle region (floor((angle-15)/30)) to in-game rotation
    private static readonly ROTATION_NORMAL = [
        directions.right, //345-15 degrees
        directions.up_right, //15-45 degrees
        directions.up_right, //45-75 degrees
        directions.up, //75-105 degrees
        directions.up_left, //105-135 degrees
        directions.up_left, //135-165 degrees
        directions.left, //165-195 degrees
        directions.down_left, //195-225 degrees
        directions.down_left, //225-255 degrees
        directions.down, //255-285 degrees
        directions.down_right, //285-315 degrees
        directions.down_right, //315-345 degrees
    ];

    private static readonly SPEEDS = {
        [directions.right]: {x: 1, y: 0},
        [directions.left]: {x: -1, y: 0},
        [directions.up]: {x: 0, y: -1},
        [directions.up_right]: {x: numbers.INV_SQRT2, y: -numbers.INV_SQRT2},
        [directions.up_left]: {x: -numbers.INV_SQRT2, y: -numbers.INV_SQRT2},
        [directions.down]: {x: 0, y: 1},
        [directions.down_right]: {x: numbers.INV_SQRT2, y: numbers.INV_SQRT2},
        [directions.down_left]: {x: -numbers.INV_SQRT2, y: numbers.INV_SQRT2},
    };

    private force_diagonal_speed: {x: number; y: number} = {x: 0, y: 0};

    constructor(
        game,
        data,
        key_name,
        initial_x,
        initial_y,
        initial_action,
        initial_direction,
        walk_speed,
        dash_speed,
        climb_speed
    ) {
        super(
            game,
            data,
            key_name,
            true,
            walk_speed,
            dash_speed,
            climb_speed,
            initial_x,
            initial_y,
            initial_action,
            initial_direction
        );
    }

    private check_control_inputs() {
        const arrow_inputs =
            (1 * +this.data.gamepad.is_down(Button.RIGHT)) |
            (2 * +this.data.gamepad.is_down(Button.LEFT)) |
            (4 * +this.data.gamepad.is_down(Button.UP)) |
            (8 * +this.data.gamepad.is_down(Button.DOWN));
        this._required_direction = Hero.ROTATION_KEY[arrow_inputs];

        if (!this.ice_sliding_active) {
            let stick_dashing = false;
            if (!arrow_inputs) stick_dashing = false;
            else if (this.data.gamepad.is_down(Button.STICK_DASHING)) stick_dashing = true;
            this.dashing = stick_dashing || this.data.gamepad.is_down(Button.B);
        }
    }

    set_speed_factors(check_on_event: boolean = false, desired_direction?: directions) {
        if (check_on_event && this.data.tile_event_manager.on_event) return;
        desired_direction = desired_direction === undefined ? this.required_direction : desired_direction;
        if (this.climbing) {
            if (desired_direction === null) {
                this._x_speed = this._y_speed = 0;
                this.idle_climbing = true;
            } else {
                if ((desired_direction & 1) === 1) {
                    //transforms diagonal movements in non-diagonal
                    --desired_direction;
                }
                this.set_direction(desired_direction);
                this.idle_climbing = false;
                this._x_speed = Hero.SPEEDS[desired_direction].x;
                this._y_speed = Hero.SPEEDS[desired_direction].y;
            }
        } else if (!this.ice_sliding_active) {
            //when force_direction is true, it means that the hero is going to face a different direction from the one specified in the keyboard arrows
            if (desired_direction !== null || this.force_direction) {
                if (!this.force_direction) {
                    this.set_direction(desired_direction, false, false);
                    if (this.game.time.frames & 1) {
                        //this if controls the char turn frame rate, how fast is the transition
                        this._transition_direction = get_transition_directions(
                            this.transition_direction,
                            desired_direction
                        );
                    }
                } else {
                    desired_direction = this.current_direction;
                }
                if (this.force_direction && (this.current_direction & 1) === 1) {
                    //sets the speed according to the collision slope
                    this._x_speed = this.force_diagonal_speed.x;
                    this._y_speed = this.force_diagonal_speed.y;
                } else {
                    this._x_speed = Hero.SPEEDS[desired_direction].x;
                    this._y_speed = Hero.SPEEDS[desired_direction].y;
                }
            } else {
                this._x_speed = this._y_speed = 0;
            }
        } else {
            if (!this.sliding_on_ice) {
                if (
                    this.colliding_directions_mask & get_direction_mask(desired_direction) ||
                    desired_direction === null
                ) {
                    this._x_speed = this._y_speed = 0;
                } else {
                    //checks if a diagonal direction was asked
                    if ((desired_direction & 1) === 1) {
                        //changes to a not diagonal direction
                        if (this.colliding_directions_mask & get_direction_mask(desired_direction - 1)) {
                            desired_direction = (desired_direction + 1) & 7;
                        } else {
                            --desired_direction;
                        }
                    }
                    //starts sliding
                    this._x_speed = Hero.SPEEDS[desired_direction].x;
                    this._y_speed = Hero.SPEEDS[desired_direction].y;
                    this._ice_slide_direction = desired_direction;
                    this.sliding_on_ice = true;
                }
            } else if (
                this.sliding_on_ice &&
                this.colliding_directions_mask & get_direction_mask(this.ice_slide_direction)
            ) {
                //stops sliding
                this._x_speed = this._y_speed = 0;
                this._ice_slide_direction = null;
                this.sliding_on_ice = false;
            } else if (this.sliding_on_ice) {
                if (desired_direction !== null) {
                    //changes the hero direction while sliding
                    this.set_direction(desired_direction, false, false);
                    if (this.game.time.frames & 1) {
                        this._transition_direction = get_transition_directions(
                            this.transition_direction,
                            desired_direction
                        );
                    }
                }
                this._x_speed = Hero.SPEEDS[this.ice_slide_direction].x;
                this._y_speed = Hero.SPEEDS[this.ice_slide_direction].y;
            }
        }
    }

    private check_interactable_objects(map: Map, contact: p2.ContactEquation) {
        let j = 0;
        for (j = 0; j < map.interactable_objects.length; ++j) {
            //check if hero is colliding with any interactable object
            const interactable_object_body = map.interactable_objects[j].sprite.body;
            if (!interactable_object_body) continue;
            if (contact.bodyA === interactable_object_body.data || contact.bodyB === interactable_object_body.data) {
                if (contact.bodyA === this.sprite.body.data || contact.bodyB === this.sprite.body.data) {
                    const interactable_object = map.interactable_objects[j];
                    if (
                        [base_actions.WALK, base_actions.DASH].includes(this.current_action as base_actions) &&
                        this.data.map.collision_layer === interactable_object.base_collision_layer
                    ) {
                        this.trying_to_push = true;
                        if (this.push_timer === null) {
                            this._trying_to_push_direction = this.current_direction;
                            const events_in_pos = map.events[LocationKey.get_key(this.tile_x_pos, this.tile_y_pos)];
                            let has_stair = false;
                            if (events_in_pos) {
                                events_in_pos.forEach(event => {
                                    if (
                                        event.type === event_types.CLIMB &&
                                        (event as ClimbEvent).is_set &&
                                        event.activation_directions.includes(this.trying_to_push_direction)
                                    ) {
                                        has_stair = true;
                                        return;
                                    }
                                });
                            }
                            if (!has_stair) {
                                const item_position = interactable_object.get_current_position(map);
                                switch (this.trying_to_push_direction) {
                                    case directions.up:
                                        item_position.y -= 1;
                                        break;
                                    case directions.down:
                                        item_position.y += 1;
                                        break;
                                    case directions.left:
                                        item_position.x -= 1;
                                        break;
                                    case directions.right:
                                        item_position.x += 1;
                                        break;
                                }
                                if (interactable_object.position_allowed(item_position.x, item_position.y)) {
                                    this.push_timer = this.game.time.events.add(Phaser.Timer.QUARTER, () => {
                                        normal_push(this.game, this.data, interactable_object);
                                        this.trying_to_push = false;
                                        this.push_timer = null;
                                    });
                                }
                            }
                        }
                        break;
                    }
                }
            }
        }
        if (j === map.interactable_objects.length) {
            this.trying_to_push = false;
        }
    }

    private collision_dealer(map: Map) {
        let normals = [];
        for (let i = 0; i < this.game.physics.p2.world.narrowphase.contactEquations.length; ++i) {
            const contact = this.game.physics.p2.world.narrowphase.contactEquations[i];
            if (contact.bodyA === this.sprite.body.data) {
                //check if hero collided with something
                normals.push(contact.normalA); //collision normals (one normal for each contact point)
            }
            this.check_interactable_objects(map, contact);
        }
        //normals having length, means that a collision is happening
        this.colliding_directions_mask = normals.reduce((acc, normal) => {
            const angle = range_360(Math.atan2(-normal[1], -normal[0]));
            const direction = (1 + Math.floor((angle - numbers.degree45_half) / numbers.degree45)) & 7;
            return acc | get_direction_mask(direction);
        }, 0);
        if (
            normals.length &&
            [base_actions.WALK, base_actions.DASH, base_actions.CLIMB].includes(this.current_action as base_actions)
        ) {
            const speed_limit = this.data.map.is_world_map
                ? Hero.SPEED_LIMIT_TO_STOP_WORLD_MAP
                : Hero.SPEED_LIMIT_TO_STOP;
            if (
                Math.abs(this.sprite.body.velocity.x) < speed_limit &&
                Math.abs(this.sprite.body.velocity.y) < speed_limit
            ) {
                //speeds below SPEED_LIMIT_TO_STOP are not considered
                const contact_point_directions = new Array(normals.length); // a contact point direction is the opposite direction of the contact normal vector
                normals.forEach((normal, index) => {
                    const abs_normal_x = Math.abs(normal[0]);
                    const abs_normal_y = Math.abs(normal[1]);
                    //slopes outside the MINIMAL_SLOPE range will be desconsidered
                    if (abs_normal_x < Hero.MINIMAL_SLOPE) normal[0] = 0;
                    if (abs_normal_y < Hero.MINIMAL_SLOPE) normal[1] = 0;
                    if (abs_normal_x > 1 - Hero.MINIMAL_SLOPE) normal[0] = Math.sign(normal[0]);
                    if (abs_normal_y > 1 - Hero.MINIMAL_SLOPE) normal[1] = Math.sign(normal[1]);
                    contact_point_directions[index] = range_360(Math.atan2(normal[1], -normal[0])); //storing the angle as if it is in the 1st quadrant
                });
                const desired_direction = range_360(Math.atan2(-this.temp_velocity_y, this.temp_velocity_x)); //storing the angle as if it is in the 1st quadrant
                contact_point_directions.forEach(direction => {
                    //check if the desired direction is going towards at least one contact direction with a error margin of 30 degrees
                    if (
                        direction >= desired_direction - numbers.degree15 &&
                        direction <= desired_direction + numbers.degree15
                    ) {
                        //if true, it means that the hero is going the in the direction of the collision obejct, then it must stop
                        this.temp_velocity_x = 0;
                        this.temp_velocity_y = 0;
                        return;
                    }
                });
                this.stop_by_colliding = true;
                this.force_direction = false;
            } else if (this.current_action !== base_actions.CLIMB) {
                this.stop_by_colliding = false;
                if (normals.length === 1) {
                    //everything inside this if is to deal with direction changing when colliding
                    //finds which 30 degree sector the normal angle lies within, and converts to a direction
                    const normal = normals[0];
                    const wall_direction =
                        Hero.ROTATION_NORMAL[
                            (range_360(Math.atan2(normal[1], -normal[0]) + numbers.degree15) / numbers.degree30) | 0
                        ];
                    const relative_direction = (this.required_direction - wall_direction) & 7;
                    //if player's direction is within 1 of wall_direction
                    if (relative_direction === 1 || relative_direction === 7) {
                        this.force_direction = true;
                        const direction = (wall_direction + (relative_direction << 1)) & 7;
                        if ((direction & 1) === 1) {
                            //adapting the velocity to the contact slope
                            const going_up = (direction >> 1) & 2;
                            const is_ccw = going_up ? normal[0] >= 0 : normal[0] < 0;
                            //rotates normal vector 90deg
                            this.force_diagonal_speed.x = is_ccw ? normal[1] : -normal[1];
                            this.force_diagonal_speed.y = is_ccw ? -normal[0] : normal[0];
                        }
                        this.set_direction(direction);
                    } else {
                        this.force_direction = false;
                    }
                } else {
                    this.force_direction = false;
                }
            } else {
                this.stop_by_colliding = false;
            }
        } else {
            this.stop_by_colliding = false;
            this.force_direction = false;
        }
    }

    toggle_active(active: boolean) {
        if (active) {
            this.sprite.body.setCollisionGroup(this.data.collision.hero_collision_group);
            this.sprite.visible = true;
            if (this.shadow) {
                this.shadow.visible = true;
            }
            this._active = true;
        } else {
            this.sprite.body.clearCollision(this.data.collision.hero_collision_group);
            this.sprite.visible = false;
            if (this.shadow) {
                this.shadow.visible = false;
            }
            this._active = false;
        }
    }

    update(map: Map) {
        if (!this.active) return;
        this.check_control_inputs(); //check which arrow keys are being pressed
        this.set_speed_factors(true); //sets the direction of the movement
        this.choose_action_based_on_char_state(true); //chooses which sprite the hero shall assume
        this.calculate_speed(); //calculates the final speed
        this.collision_dealer(map); //check if the hero is colliding and its consequences
        this.apply_speed(); //applies the final speed
        this.play_current_action(true); //sets the hero sprite
        this.update_shadow(); //updates the hero's shadow position
        this.update_half_crop(); //halves the hero texture if needed
    }

    config_body(body_radius: number = numbers.HERO_BODY_RADIUS) {
        this.game.physics.p2.enable(this.sprite, false);
        this.reset_anchor(); //Important to be after the previous command
        this.sprite.body.clearShapes();
        this._body_radius = body_radius;
        this.sprite.body.setCircle(this.body_radius, 0, 0);
        this.sprite.body.setCollisionGroup(this.data.collision.hero_collision_group);
        this.sprite.body.mass = 1.0;
        this.sprite.body.damping = 0;
        this.sprite.body.angularDamping = 0;
        this.sprite.body.inertia = 0;
        this.sprite.body.setZeroRotation();
        this.sprite.body.fixedRotation = true;
    }
}
