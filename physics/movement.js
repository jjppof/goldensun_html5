import { main_char_list } from '../initializers/main_chars.js';
import { normal_push } from '../interactable_objects/push.js';
import { TileEvent, event_types } from '../base/TileEvent.js';
import { get_transition_directions, check_isdown, range_360, directions } from '../utils.js';
import * as numbers from '../magic_numbers.js';
import { maps } from '../initializers/maps.js';

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

export function update_arrow_inputs(data) {
    data.arrow_inputs =
          1 * data.cursors.right.isDown
        | 2 * data.cursors.left.isDown
        | 4 * data.cursors.up.isDown
        | 8 * data.cursors.down.isDown;
}

function check_interactable_objects(game, data, contact) {
    let j = 0;
    for (j = 0; j < maps[data.map_name].interactable_objects.length; ++j) { //check if hero is colliding with any interactable object
        let interactable_object_body = maps[data.map_name].interactable_objects[j].interactable_object_sprite.body;
        if (!interactable_object_body) continue;
        if (contact.bodyA === interactable_object_body.data || contact.bodyB === interactable_object_body.data) {
            if (contact.bodyA === data.hero.sprite.body.data || contact.bodyB === data.hero.sprite.body.data) {
                const interactable_object = maps[data.map_name].interactable_objects[j];
                if (["walk", "dash"].includes(data.hero.current_action) && data.map_collider_layer === interactable_object.base_collider_layer) {
                    data.hero.trying_to_push = true;
                    if (data.push_timer === null) {
                        data.hero.trying_to_push_direction = data.hero.current_direction;
                        const events_in_pos = maps[data.map_name].events[TileEvent.get_location_key(data.hero.tile_x_pos, data.hero.tile_y_pos)];
                        let has_stair = false;
                        if (events_in_pos) {
                            events_in_pos.forEach(event => {
                                if (event.type === event_types.STAIR && event.is_set && event.activation_directions.includes(data.hero.trying_to_push_direction)) {
                                    has_stair = true;
                                    return;
                                }
                            });
                        }
                        if (!has_stair) {
                            let item_position = interactable_object.get_current_position(data.map_name);
                            switch (data.hero.trying_to_push_direction) {
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
                            if (interactable_object.position_allowed(data, item_position.x, item_position.y)) {
                                data.push_timer = game.time.events.add(Phaser.Timer.QUARTER, normal_push.bind(this, game, data, interactable_object));
                            }
                        }
                    }
                    break;
                }
            }
        }
    }
    if (j === maps[data.map_name].interactable_objects.length) {
        data.hero.trying_to_push = false;
    }
}

export function collision_dealer(game, data) {
    let normals = [];
    for (let i = 0; i < game.physics.p2.world.narrowphase.contactEquations.length; ++i) {
        const contact = game.physics.p2.world.narrowphase.contactEquations[i];
        if (contact.bodyA === data.hero.sprite.body.data) { //check if hero collided with something
            normals.push(contact.normalA); //collision normals (one normal for each contact point)
        }
        check_interactable_objects(game, data, contact);
    }
    //normals having length, means that a collision is happening
    if (normals.length && ["walk", "dash", "climb"].includes(data.hero.current_action)) {
        if (Math.abs(data.hero.sprite.body.velocity.x) < SPEED_LIMIT_TO_STOP && Math.abs(data.hero.sprite.body.velocity.y) < SPEED_LIMIT_TO_STOP) { //speeds below SPEED_LIMIT_TO_STOP are not considered
            let contact_point_directions = new Array(normals.length); // a contact point direction is the opposite direction of the contact normal vector
            normals.forEach((normal, index) => { //slopes outside the MINIMAL_SLOPE range will be desconsidered
                if (Math.abs(normal[0]) < MINIMAL_SLOPE) normal[0] = 0;
                if (Math.abs(normal[1]) < MINIMAL_SLOPE) normal[1] = 0;
                if (Math.abs(normal[0]) > 1 - MINIMAL_SLOPE) normal[0] = Math.sign(normal[0]);
                if (Math.abs(normal[1]) > 1 - MINIMAL_SLOPE) normal[1] = Math.sign(normal[1]);
                contact_point_directions[index] = range_360(Math.atan2(normal[1], -normal[0])); //storing the angle as if it is in the 1st quadrant
            });
            const desired_direction = range_360(Math.atan2(-data.hero.sprite.body.velocity.temp_y, data.hero.sprite.body.velocity.temp_x)); //storing the angle as if it is in the 1st quadrant
            contact_point_directions.forEach(direction => { //check if the desired direction is going towards at least one contact direction with a error margin of 30 degrees
                if (direction >= desired_direction - numbers.degree15 && direction <= desired_direction + numbers.degree15) { //if true, it means that the hero is going the in the direction of the collision obejct, then it must stop
                    data.hero.sprite.body.velocity.temp_x = 0;
                    data.hero.sprite.body.velocity.temp_y = 0;
                    return;
                }
            });
            data.hero.stop_by_colliding = true;
            data.hero.force_direction = false;
        } else if (data.hero.current_action !== "climb") {
            data.hero.stop_by_colliding = false;
            if (normals.length === 1) { //everything inside this if is to deal with direction changing when colliding
                //finds which 30 degree sector the normal angle lies within, and converts to a direction
                const wall_direction = rotation_normal[(range_360(Math.atan2(normals[0][1], -normals[0][0]) + numbers.degree15) / numbers.degree30) | 0];
                const relative_direction = (rotation_key[data.arrow_inputs] - wall_direction) & 7;
                //if player's direction is within 1 of wall_direction
                if (relative_direction === 1 || relative_direction === 7) {
                    data.hero.force_direction = true;
                    data.hero.current_direction = (wall_direction + (relative_direction << 1)) & 7;
                } else {
                    data.hero.force_direction = false;
                }
            } else {
                data.hero.force_direction = false;
            }
        }
    } else {
        data.hero.stop_by_colliding = false;
        data.hero.force_direction = false;
    }

    if (["walk", "dash", "climb"].includes(data.hero.current_action)) { //sets the final velocity
        data.hero.sprite.body.velocity.x = data.hero.sprite.body.velocity.temp_x;
        data.hero.sprite.body.velocity.y = data.hero.sprite.body.velocity.temp_y;
    }
}

export function calculate_hero_speed(game, data) { //when setting temp_x or temp_y, it means that these velocities will still be analyzed in collision_dealer function
    const delta_time = game.time.elapsedMS / numbers.DELTA_TIME_FACTOR;
    if (data.hero.current_action === "dash") {
        data.hero.sprite.body.velocity.temp_x = (delta_time * data.hero.x_speed * (data.hero.sprite_info.dash_speed + data.hero.extra_speed)) | 0;
        data.hero.sprite.body.velocity.temp_y = (delta_time * data.hero.y_speed * (data.hero.sprite_info.dash_speed + data.hero.extra_speed)) | 0;
    } else if(data.hero.current_action === "walk") {
        data.hero.sprite.body.velocity.temp_x = (delta_time * data.hero.x_speed * (data.hero.sprite_info.walk_speed + data.hero.extra_speed)) | 0;
        data.hero.sprite.body.velocity.temp_y = (delta_time * data.hero.y_speed * (data.hero.sprite_info.walk_speed + data.hero.extra_speed)) | 0;
    } else if(data.hero.current_action === "climb") {
        data.hero.sprite.body.velocity.temp_x = (delta_time * data.hero.x_speed * data.hero.sprite_info.climb_speed) | 0;
        data.hero.sprite.body.velocity.temp_y = (delta_time * data.hero.y_speed * data.hero.sprite_info.climb_speed) | 0;
    } else if(data.hero.current_action === "idle") {
        data.hero.sprite.body.velocity.y = data.hero.sprite.body.velocity.x = 0;
    }
}

export function set_current_action(data) {
    if (data.on_event) {
        return;
    }
    const movement_direction = rotation_key[data.arrow_inputs];
    if (movement_direction === null && data.hero.current_action !== "idle" && !data.hero.climbing) {
        data.hero.current_action = "idle";
    } else if (movement_direction !== null && !data.hero.climbing && !data.hero.pushing) {
        const shift_pressed = game.input.keyboard.isDown(Phaser.Keyboard.SHIFT);
        if (shift_pressed && data.hero.current_action !== "dash") {
            data.hero.current_action = "dash";
        } else if (!shift_pressed && data.hero.current_action !== "walk") {
            data.hero.current_action = "walk";
        }
    }
}

export function set_speed_factors(data, check_on_event = false) {
    if (check_on_event && data.on_event) {
        return;
    }
    if (data.hero.climbing) {
        if (check_isdown(data.cursors, directions.up, directions.down) || check_isdown(data.cursors, directions.right, directions.left)) {
            data.hero.x_speed = 0;
            data.hero.y_speed = 0;
            data.idle_climbing = true;
        } else if (!data.cursors.up.isDown && data.cursors.down.isDown) {
            data.hero.x_speed = 0;
            data.hero.y_speed = 1;
            data.hero.current_direction = directions.down;
            data.idle_climbing = false;
        } else if (data.cursors.up.isDown && !data.cursors.down.isDown) {
            data.hero.x_speed = 0;
            data.hero.y_speed = -1;
            data.hero.current_direction = directions.up;
            data.idle_climbing = false;
        } else if (!data.cursors.up.isDown && !data.cursors.down.isDown) {
            data.hero.x_speed = 0;
            data.hero.y_speed = 0;
            data.idle_climbing = true;
        }
    } else {
        let desired_direction = rotation_key[data.arrow_inputs];
        //when force_direction is true, it means that the hero is going to face a different direction from the one specified in the keyboard arrows
        if (desired_direction !== null || data.hero.force_direction) {
            if (!data.hero.force_direction) {
                data.hero.current_direction = get_transition_directions(data.hero.current_direction, desired_direction);
            } else {
                desired_direction = data.hero.current_direction;
            }
            data.hero.x_speed = speeds[desired_direction].x;
            data.hero.y_speed = speeds[desired_direction].y;
        } else {
            data.hero.x_speed = data.hero.y_speed = 0;
        }
    }
}
