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
            if (contact.bodyA === data.hero.body.data || contact.bodyB === data.hero.body.data) {
                const interactable_object = maps[data.map_name].interactable_objects[j];
                if (["walk", "dash"].includes(data.current_action) && data.map_collider_layer === interactable_object.base_collider_layer) {
                    data.trying_to_push = true;
                    if (data.push_timer === null) {
                        data.trying_to_push_direction = data.current_direction;
                        const events_in_pos = maps[data.map_name].events[TileEvent.get_location_key(data.hero_tile_pos_x, data.hero_tile_pos_y)];
                        let has_stair = false;
                        if (events_in_pos) {
                            events_in_pos.forEach(event => {
                                if (event.type === event_types.STAIR && event.is_set && event.activation_directions.includes(data.trying_to_push_direction)) {
                                    has_stair = true;
                                    return;
                                }
                            });
                        }
                        if (!has_stair) {
                            let item_position = interactable_object.get_current_position(data.map_name);
                            switch (data.trying_to_push_direction) {
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
        data.trying_to_push = false;
    }
}

export function collision_dealer(game, data) {
    let normals = [];
    for (let i = 0; i < game.physics.p2.world.narrowphase.contactEquations.length; ++i) {
        const contact = game.physics.p2.world.narrowphase.contactEquations[i];
        if (contact.bodyA === data.hero.body.data) { //check if hero collided with something
            normals.push(contact.normalA); //collision normals (one normal for each contact point)
        }
        check_interactable_objects(game, data, contact);
    }
    //normals having length, means that a collision is happening
    if (normals.length && ["walk", "dash", "climb"].includes(data.current_action)) {
        if (Math.abs(data.hero.body.velocity.x) < SPEED_LIMIT_TO_STOP && Math.abs(data.hero.body.velocity.y) < SPEED_LIMIT_TO_STOP) { //speeds below SPEED_LIMIT_TO_STOP are not considered
            let contact_point_directions = new Array(normals.length); // a contact point direction is the opposite direction of the contact normal vector
            normals.forEach((normal, index) => { //slopes outside the MINIMAL_SLOPE range will be desconsidered
                if (Math.abs(normal[0]) < MINIMAL_SLOPE) normal[0] = 0;
                if (Math.abs(normal[1]) < MINIMAL_SLOPE) normal[1] = 0;
                if (Math.abs(normal[0]) > 1 - MINIMAL_SLOPE) normal[0] = Math.sign(normal[0]);
                if (Math.abs(normal[1]) > 1 - MINIMAL_SLOPE) normal[1] = Math.sign(normal[1]);
                contact_point_directions[index] = range_360(Math.atan2(normal[1], -normal[0])); //storing the angle as if it is in the 1st quadrant
            });
            const desired_direction = range_360(Math.atan2(-data.hero.body.velocity.temp_y, data.hero.body.velocity.temp_x)); //storing the angle as if it is in the 1st quadrant
            contact_point_directions.forEach(direction => { //check if the desired direction is going towards at least one contact direction with a error margin of 30 degrees
                if (direction >= desired_direction - numbers.degree15 && direction <= desired_direction + numbers.degree15) { //if true, it means that the hero is going the in the direction of the collision obejct, then it must stop
                    data.hero.body.velocity.temp_x = 0;
                    data.hero.body.velocity.temp_y = 0;
                    return;
                }
            });
            data.stop_by_colliding = true;
            data.force_direction = false;
            data.forcing_on_diagonal = false;
        } else if (data.current_action !== "climb") {
            data.stop_by_colliding = false;
            if (normals.length === 1) { //everything inside this if is to deal with direction changing when colliding
                //finds which 30 degree sector the normal angle lies within, and converts to a direction
                const wall_direction = rotation_normal[(range_360(Math.atan2(normals[0][1], -normals[0][0]) + numbers.degree15) / numbers.degree30) | 0];
                const relative_direction = (rotation_key[data.arrow_inputs] - wall_direction) & 7;
                //if player's direction is within 1 of wall_direction
                if (relative_direction === 1 || relative_direction === 7) {
                    data.force_direction = true;
                    data.forcing_on_diagonal = wall_direction & 1 === 1;
                    data.current_direction = (wall_direction + (relative_direction << 1)) & 7;
                } else {
                    data.force_direction = false;
                    data.forcing_on_diagonal = false;
                }
            } else {
                data.force_direction = false;
                data.forcing_on_diagonal = false;
            }
        }
    } else {
        data.stop_by_colliding = false;
        data.force_direction = false;
        data.forcing_on_diagonal = false;
    }

    if (["walk", "dash", "climb"].includes(data.current_action)) { //sets the final velocity
        data.hero.body.velocity.x = data.hero.body.velocity.temp_x;
        data.hero.body.velocity.y = data.hero.body.velocity.temp_y;
    }
}

export function calculate_hero_speed(game, data) { //when setting temp_x or temp_y, it means that these velocities will still be analyzed in collision_dealer function
    const delta_time = game.time.elapsedMS / numbers.DELTA_TIME_FACTOR;
    if (data.current_action === "dash") {
        data.hero.body.velocity.temp_x = (delta_time * data.x_speed * (main_char_list[data.hero_name].sprite_base.dash_speed + data.extra_speed)) | 0;
        data.hero.body.velocity.temp_y = (delta_time * data.y_speed * (main_char_list[data.hero_name].sprite_base.dash_speed + data.extra_speed)) | 0;
    } else if(data.current_action === "walk") {
        data.hero.body.velocity.temp_x = (delta_time * data.x_speed * (main_char_list[data.hero_name].sprite_base.walk_speed + data.extra_speed)) | 0;
        data.hero.body.velocity.temp_y = (delta_time * data.y_speed * (main_char_list[data.hero_name].sprite_base.walk_speed + data.extra_speed)) | 0;
    } else if(data.current_action === "climb") {
        data.hero.body.velocity.temp_x = (delta_time * data.x_speed * main_char_list[data.hero_name].sprite_base.climb_speed) | 0;
        data.hero.body.velocity.temp_y = (delta_time * data.y_speed * main_char_list[data.hero_name].sprite_base.climb_speed) | 0;
    } else if(data.current_action === "idle") {
        data.hero.body.velocity.y = data.hero.body.velocity.x = 0;
    }
}

export function set_speed_factors(data) {
    if (data.climbing) {
        if (check_isdown(data.cursors, directions.up, directions.down) || check_isdown(data.cursors, directions.right, directions.left)) {
            data.x_speed = 0;
            data.y_speed = 0;
            data.idle_climbing = true;
        } else if (!data.cursors.up.isDown && data.cursors.down.isDown) {
            data.x_speed = 0;
            data.y_speed = 1;
            data.current_direction = directions.down;
            data.idle_climbing = false;
        } else if (data.cursors.up.isDown && !data.cursors.down.isDown) {
            data.x_speed = 0;
            data.y_speed = -1;
            data.current_direction = directions.up;
            data.idle_climbing = false;
        } else if (!data.cursors.up.isDown && !data.cursors.down.isDown) {
            data.x_speed = 0;
            data.y_speed = 0;
            data.idle_climbing = true;
        }
    } else {
        if (!data.force_direction) { //makes no sense to force on diagonal if force_direction is false
            data.forcing_on_diagonal = false;
        }
        if (check_isdown(data.cursors, directions.up, directions.down) || check_isdown(data.cursors, directions.right, directions.left)) { //opposite direction should not result in movement
            data.x_speed = 0;
            data.y_speed = 0;
        //when force_direction is true, it means that the hero is going to face a different direction from the one specified in the keyboard arrows
        } else if ((check_isdown(data.cursors, directions.up) && !data.forcing_on_diagonal) || (data.current_direction === directions.up && data.force_direction && !data.forcing_on_diagonal)) {
            if (!data.force_direction) {
                data.current_direction = get_transition_directions(data.current_direction, directions.up);
            }
            data.x_speed = 0;
            data.y_speed = -1;
        } else if ((check_isdown(data.cursors, directions.down) && !data.forcing_on_diagonal) || (data.current_direction === directions.down && data.force_direction && !data.forcing_on_diagonal)) {
            if (!data.force_direction) {
                data.current_direction = get_transition_directions(data.current_direction, directions.down);
            }
            data.x_speed = 0;
            data.y_speed = 1;
        } else if ((check_isdown(data.cursors, directions.left) && !data.forcing_on_diagonal) || (data.current_direction === directions.left && data.force_direction && !data.forcing_on_diagonal)) {
            if (!data.force_direction) {
                data.current_direction = get_transition_directions(data.current_direction, directions.left);
            }
            data.x_speed = -1;
            data.y_speed = 0;
        } else if ((check_isdown(data.cursors, directions.right) && !data.forcing_on_diagonal) || (data.current_direction === directions.right && data.force_direction && !data.forcing_on_diagonal)) {
            if (!data.force_direction) {
                data.current_direction = get_transition_directions(data.current_direction, directions.right);
            }
            data.x_speed = 1;
            data.y_speed = 0;
        } else if (check_isdown(data.cursors, directions.up, directions.left) || (data.current_direction === directions.up_left && data.force_direction && data.forcing_on_diagonal)) {
            if (!data.force_direction) {
                data.current_direction = get_transition_directions(data.current_direction, directions.up_left);
            }
            data.x_speed = -numbers.INV_SQRT2;
            data.y_speed = -numbers.INV_SQRT2;
        } else if (check_isdown(data.cursors, directions.up, directions.right) || (data.current_direction === directions.up_right && data.force_direction && data.forcing_on_diagonal)) {
            if (!data.force_direction) {
                data.current_direction = get_transition_directions(data.current_direction, directions.up_right);
            }
            data.x_speed = numbers.INV_SQRT2;
            data.y_speed = -numbers.INV_SQRT2;
        } else if (check_isdown(data.cursors, directions.down, directions.left) || (data.current_direction === directions.down_left && data.force_direction && data.forcing_on_diagonal)) {
            if (!data.force_direction) {
                data.current_direction = get_transition_directions(data.current_direction, directions.down_left);
            }
            data.x_speed = -numbers.INV_SQRT2;
            data.y_speed = numbers.INV_SQRT2;
        } else if (check_isdown(data.cursors, directions.down, directions.right) || (data.current_direction === directions.down_right && data.force_direction && data.forcing_on_diagonal)) {
            if (!data.force_direction) {
                data.current_direction = get_transition_directions(data.current_direction, directions.down_right);
            }
            data.x_speed = numbers.INV_SQRT2;
            data.y_speed = numbers.INV_SQRT2;
        }
    }
}
