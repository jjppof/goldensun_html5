import { ControllableChar } from "./ControllableChar.js";
import * as numbers from '../magic_numbers.js';
import { TileEvent, event_types } from "./TileEvent.js";
import { get_transition_directions, range_360, directions } from '../utils.js';
import { normal_push } from "../interactable_objects/push.js";
import { Footsteps } from "./Footsteps.js";

const SPEED_LIMIT_TO_STOP = 13;
const MINIMAL_SLOPE = 0.1;

//rotation_key can convert from pressed_keys to the corresponding in-game rotation
const rotation_key = [
    null,                   //no keys pressed
    directions.right,       //right
    directions.left,        //left
    null,                   //right and left
    directions.up,          //up
    directions.up_right,    //up and right
    directions.up_left,     //up and left
    null,                   //up, left, and right
    directions.down,        //down
    directions.down_right,  //down and right
    directions.down_left,   //down and left
    null,                   //down, left, and right
    null,                   //down and up
    null,                   //down, up, and right
    null,                   //down, up, and left
    null,                   //down, up, left, and right
];

//rotation_normal converts from normal_angle region (floor((angle-15)/30)) to in-game rotation
const rotation_normal = [
    directions.right,      //345-15 degrees
    directions.up_right,   //15-45 degrees
    directions.up_right,   //45-75 degrees
    directions.up,         //75-105 degrees
    directions.up_left,    //105-135 degrees
    directions.up_left,    //135-165 degrees
    directions.left,       //165-195 degrees
    directions.down_left,  //195-225 degrees
    directions.down_left,  //225-255 degrees
    directions.down,       //255-285 degrees
    directions.down_right, //285-315 degrees
    directions.down_right, //315-345 degrees
];

const speeds = {
    [directions.right]: {x: 1, y: 0},
    [directions.left]: {x: -1, y: 0},
    [directions.up]: {x: 0, y: -1},
    [directions.up_right]: {x: numbers.INV_SQRT2, y: -numbers.INV_SQRT2},
    [directions.up_left]: {x: -numbers.INV_SQRT2, y: -numbers.INV_SQRT2},
    [directions.down]: {x: 0, y: 1},
    [directions.down_right]: {x: numbers.INV_SQRT2, y: numbers.INV_SQRT2},
    [directions.down_left]: {x: -numbers.INV_SQRT2, y: numbers.INV_SQRT2}
};

export class Hero extends ControllableChar {
    constructor(game, data, key_name, initial_x, initial_y, initial_action, initial_direction) {
        super(game, data, key_name, initial_x, initial_y, initial_action, initial_direction);
        this.arrow_inputs = null;
        this.trying_to_push = false;
        this.trying_to_push_direction = null;
        this.push_timer = null;
        this.make_footsteps = true;
        this.footsteps = new Footsteps(this.game,this.data,this.initial_action,this.initial_direction);
    }

    update_arrow_inputs() {
        this.arrow_inputs =
              1 * this.data.cursors.right.isDown
            | 2 * this.data.cursors.left.isDown
            | 4 * this.data.cursors.up.isDown
            | 8 * this.data.cursors.down.isDown;
    }

    get_tile_properties(){
        return this.data.map.get_current_tile(this)[0].properties;
    }

    set_current_action() {
        if (this.data.tile_event_manager.on_event) {
            return;
        }
        const movement_direction = rotation_key[this.arrow_inputs];
        if (movement_direction === null && this.current_action !== "idle" && !this.climbing) {
            this.current_action = "idle";
        } else if (movement_direction !== null && !this.climbing && !this.pushing) {
            this.make_footsteps = !this.get_tile_properties().disable_footprint;
            if(this.footsteps.can_make_footprint == true && this.make_footsteps == true){
                this.footsteps.create_step(this.current_direction,this.current_action);
            }
            const shift_pressed = this.game.input.keyboard.isDown(Phaser.Keyboard.SHIFT);
            if (shift_pressed && this.current_action !== "dash") {
                this.current_action = "dash";
            } else if (!shift_pressed && this.current_action !== "walk") {
                this.current_action = "walk";
            }
        }
    }

    set_speed_factors(check_on_event = false) {
        if (check_on_event && this.data.tile_event_manager.on_event) {
            return;
        }
        let desired_direction = rotation_key[this.arrow_inputs];
        if (this.climbing) {
            if (desired_direction === null) {
                this.x_speed = this.y_speed = 0;
                this.idle_climbing = true;
            } else {
                if (desired_direction & 1 === 1) { //transforms diagonal movements in non-diagonal
                    --desired_direction;
                }
                this.current_direction = desired_direction;
                this.idle_climbing = false;
                this.x_speed = speeds[desired_direction].x;
                this.y_speed = speeds[desired_direction].y;
            }
        } else {
            //when force_direction is true, it means that the hero is going to face a different direction from the one specified in the keyboard arrows
            if (desired_direction !== null || this.force_direction) {
                if (!this.force_direction) {
                    this.current_direction = get_transition_directions(this.current_direction, desired_direction);
                } else {
                    desired_direction = this.current_direction;
                }
                this.x_speed = speeds[desired_direction].x;
                this.y_speed = speeds[desired_direction].y;
            } else {
                this.x_speed = this.y_speed = 0;
            }
        }
    }

    check_interactable_objects(map, contact) {
        let j = 0;
        for (j = 0; j < map.interactable_objects.length; ++j) { //check if hero is colliding with any interactable object
            const interactable_object_body = map.interactable_objects[j].interactable_object_sprite.body;
            if (!interactable_object_body) continue;
            if (contact.bodyA === interactable_object_body.data || contact.bodyB === interactable_object_body.data) {
                if (contact.bodyA === this.sprite.body.data || contact.bodyB === this.sprite.body.data) {
                    const interactable_object = map.interactable_objects[j];
                    if (["walk", "dash"].includes(this.current_action) && this.data.map.collision_layer === interactable_object.base_collider_layer) {
                        this.trying_to_push = true;
                        if (this.push_timer === null) {
                            this.trying_to_push_direction = this.current_direction;
                            const events_in_pos = map.events[TileEvent.get_location_key(this.tile_x_pos, this.tile_y_pos)];
                            let has_stair = false;
                            if (events_in_pos) {
                                events_in_pos.forEach(event => {
                                    if (event.type === event_types.STAIR && event.is_set && event.activation_directions.includes(this.trying_to_push_direction)) {
                                        has_stair = true;
                                        return;
                                    }
                                });
                            }
                            if (!has_stair) {
                                let item_position = interactable_object.get_current_position(map);
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
                                    this.push_timer = this.game.time.events.add(Phaser.Timer.QUARTER, normal_push.bind(this, this.game, this.data, interactable_object));
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

    collision_dealer(map) {
        let normals = [];
        for (let i = 0; i < this.game.physics.p2.world.narrowphase.contactEquations.length; ++i) {
            const contact = this.game.physics.p2.world.narrowphase.contactEquations[i];
            if (contact.bodyA === this.sprite.body.data) { //check if hero collided with something
                normals.push(contact.normalA); //collision normals (one normal for each contact point)
            }
            this.check_interactable_objects(map, contact);
        }
        //normals having length, means that a collision is happening
        if (normals.length && ["walk", "dash", "climb"].includes(this.current_action)) {
            if (Math.abs(this.sprite.body.velocity.x) < SPEED_LIMIT_TO_STOP && Math.abs(this.sprite.body.velocity.y) < SPEED_LIMIT_TO_STOP) { //speeds below SPEED_LIMIT_TO_STOP are not considered
                let contact_point_directions = new Array(normals.length); // a contact point direction is the opposite direction of the contact normal vector
                normals.forEach((normal, index) => { //slopes outside the MINIMAL_SLOPE range will be desconsidered
                    if (Math.abs(normal[0]) < MINIMAL_SLOPE) normal[0] = 0;
                    if (Math.abs(normal[1]) < MINIMAL_SLOPE) normal[1] = 0;
                    if (Math.abs(normal[0]) > 1 - MINIMAL_SLOPE) normal[0] = Math.sign(normal[0]);
                    if (Math.abs(normal[1]) > 1 - MINIMAL_SLOPE) normal[1] = Math.sign(normal[1]);
                    contact_point_directions[index] = range_360(Math.atan2(normal[1], -normal[0])); //storing the angle as if it is in the 1st quadrant
                });
                const desired_direction = range_360(Math.atan2(-this.sprite.body.velocity.temp_y, this.sprite.body.velocity.temp_x)); //storing the angle as if it is in the 1st quadrant
                contact_point_directions.forEach(direction => { //check if the desired direction is going towards at least one contact direction with a error margin of 30 degrees
                    if (direction >= desired_direction - numbers.degree15 && direction <= desired_direction + numbers.degree15) { //if true, it means that the hero is going the in the direction of the collision obejct, then it must stop
                        this.sprite.body.velocity.temp_x = 0;
                        this.sprite.body.velocity.temp_y = 0;
                        return;
                    }
                });
                this.stop_by_colliding = true;
                this.force_direction = false;
            } else if (this.current_action !== "climb") {
                this.stop_by_colliding = false;
                if (normals.length === 1) { //everything inside this if is to deal with direction changing when colliding
                    //finds which 30 degree sector the normal angle lies within, and converts to a direction
                    const wall_direction = rotation_normal[(range_360(Math.atan2(normals[0][1], -normals[0][0]) + numbers.degree15) / numbers.degree30) | 0];
                    const relative_direction = (rotation_key[this.arrow_inputs] - wall_direction) & 7;
                    //if player's direction is within 1 of wall_direction
                    if (relative_direction === 1 || relative_direction === 7) {
                        this.force_direction = true;
                        this.current_direction = (wall_direction + (relative_direction << 1)) & 7;
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
        this.apply_speed();
    }

    update(map) {
        this.update_arrow_inputs(); //check which arrow keys are being pressed
        this.set_speed_factors(true); //sets the direction of the movement
        this.set_current_action(); //chooses which sprite the hero shall assume
        this.calculate_speed(); //calculates the final speed
        this.collision_dealer(map); //check if the hero is colliding and its consequences
        this.set_action(true); //sets the hero sprite
        this.update_shadow(); //updates the hero's shadow position
    }

    config_body(collision_obj) {
        this.game.physics.p2.enable(this.sprite, false);
        data.hero.reset_anchor(); //Important to be after the previous command
        data.hero.sprite.body.clearShapes();
        data.hero.sprite.body.setCircle(numbers.HERO_BODY_RADIUS, 0, 0);
        data.hero.sprite.body.setCollisionGroup(collision_obj.hero_collision_group);
        data.hero.sprite.body.mass = 1.0;
        data.hero.sprite.body.damping = 0;
        data.hero.sprite.body.angularDamping = 0;
        data.hero.sprite.body.inertia = 0;
        data.hero.sprite.body.setZeroRotation();
        data.hero.sprite.body.fixedRotation = true;
    }
}