import { main_char_list } from '../initializers/main_chars.js';
import { normal_push } from '../interactable_objects/push.js';
import { TileEvent, event_types } from '../base/TileEvent.js';
import { get_transition_directions, check_isdown, range_360 } from '../utils.js';
import * as numbers from '../magic_numbers.js';
import { maps } from '../initializers/maps.js';

const SPEED_LIMIT_TO_STOP = 9;
const MINIMAL_SLOPE = 0.1;

export function collision_dealer(game, data) {
    let normals = [];
    for (let i = 0; i < game.physics.p2.world.narrowphase.contactEquations.length; ++i) {
        let c = game.physics.p2.world.narrowphase.contactEquations[i];
        if (c.bodyA === data.hero.body.data) { //check if hero collided with something
            normals.push(c.normalA); //collision normals (one normal for each contact point)
        }
        let j = 0;
        for (j = 0; j < maps[data.map_name].interactable_objects.length; ++j) {  //check if hero is colliding with any interactable object
            let interactable_object_body = maps[data.map_name].interactable_objects[j].interactable_object_sprite.body;
            if (!interactable_object_body) continue;
            if (c.bodyA === interactable_object_body.data || c.bodyB === interactable_object_body.data) {
                if (c.bodyA === data.hero.body.data || c.bodyB === data.hero.body.data) {
                    let interactable_object = maps[data.map_name].interactable_objects[j];
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
                                let item_position = interactable_object.get_current_position(data);
                                switch (data.trying_to_push_direction) {
                                    case "up":
                                        item_position.y -= 1;
                                        break;
                                    case "down":
                                        item_position.y += 1;
                                        break;
                                    case "left":
                                        item_position.x -= 1;
                                        break;
                                    case "right":
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
                const normal_angle = (Math.atan2(normals[0][1], -normals[0][0]) + numbers.degree360) % numbers.degree360;
                if (normal_angle >= numbers.degree15 && normal_angle < numbers.degree90 - numbers.degree15) {
                    if (check_isdown(data.cursors, "up")) {
                        data.force_direction = true;
                        data.forcing_on_diagonal = true;
                        data.current_direction = "up_left";
                    } else if (check_isdown(data.cursors, "right")) {
                        data.force_direction = true;
                        data.forcing_on_diagonal = true;
                        data.current_direction = "down_right";
                    } else {
                        data.force_direction = false;
                        data.forcing_on_diagonal = false;
                    }
                } else if (normal_angle >= numbers.degree90 + numbers.degree15 && normal_angle < Math.PI - numbers.degree15) {
                    if (check_isdown(data.cursors, "up")) {
                        data.force_direction = true;
                        data.forcing_on_diagonal = true;
                        data.current_direction = "up_right";
                    } else if (check_isdown(data.cursors, "left")) {
                        data.force_direction = true;
                        data.forcing_on_diagonal = true;
                        data.current_direction = "down_left";
                    } else {
                        data.force_direction = false;
                        data.forcing_on_diagonal = false;
                    }
                } else if (normal_angle >= Math.PI + numbers.degree15 && normal_angle < numbers.degree270 - numbers.degree15) {
                    if (check_isdown(data.cursors, "left")) {
                        data.force_direction = true;
                        data.forcing_on_diagonal = true;
                        data.current_direction = "up_left";
                    } else if (check_isdown(data.cursors, "down")) {
                        data.force_direction = true;
                        data.forcing_on_diagonal = true;
                        data.current_direction = "down_right";
                    } else {
                        data.force_direction = false;
                        data.forcing_on_diagonal = false;
                    }
                } else if (normal_angle >= numbers.degree270 + numbers.degree15 && normal_angle < numbers.degree360 - numbers.degree15) {
                    if (check_isdown(data.cursors, "right")) {
                        data.force_direction = true;
                        data.forcing_on_diagonal = true;
                        data.current_direction = "up_right";
                    } else if (check_isdown(data.cursors, "down")) {
                        data.force_direction = true;
                        data.forcing_on_diagonal = true;
                        data.current_direction = "down_left";
                    } else {
                        data.force_direction = false;
                        data.forcing_on_diagonal = false;
                    }
                } else if (normal_angle >= numbers.degree90 - numbers.degree15 && normal_angle < numbers.degree90 + numbers.degree15) {
                    if (check_isdown(data.cursors, "up", "left")) {
                        data.force_direction = true;
                        data.forcing_on_diagonal = false;
                        data.current_direction = "left";
                    } else if (check_isdown(data.cursors, "up", "right")) {
                        data.force_direction = true;
                        data.forcing_on_diagonal = false;
                        data.current_direction = "right";
                    } else {
                        data.force_direction = false;
                    }
                } else if (normal_angle >= Math.PI - numbers.degree15 && normal_angle < Math.PI + numbers.degree15) {
                    if (check_isdown(data.cursors, "down", "left")) {
                        data.force_direction = true;
                        data.forcing_on_diagonal = false;
                        data.current_direction = "down";
                    } else if (check_isdown(data.cursors, "up", "left")) {
                        data.force_direction = true;
                        data.forcing_on_diagonal = false;
                        data.current_direction = "up";
                    } else {
                        data.force_direction = false;
                    }
                } else if (normal_angle >= numbers.degree270 - numbers.degree15 && normal_angle < numbers.degree270 + numbers.degree15) {
                    if (check_isdown(data.cursors, "left", "down")) {
                        data.force_direction = true;
                        data.forcing_on_diagonal = false;
                        data.current_direction = "left";
                    } else if (check_isdown(data.cursors, "right", "down")) {
                        data.force_direction = true;
                        data.forcing_on_diagonal = false;
                        data.current_direction = "right";
                    } else {
                        data.force_direction = false;
                    }
                } else if (normal_angle >= numbers.degree360 - numbers.degree15 || normal_angle < numbers.degree15) {
                    if (check_isdown(data.cursors, "down", "right")) {
                        data.force_direction = true;
                        data.forcing_on_diagonal = false;
                        data.current_direction = "down";
                    } else if (check_isdown(data.cursors, "up", "right")) {
                        data.force_direction = true;
                        data.forcing_on_diagonal = false;
                        data.current_direction = "up";
                    } else {
                        data.force_direction = false;
                    }
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

export function calculate_hero_speed(data) { //when setting temp_x or temp_y, it means that these velocities will still be analyzed in collision_dealer function
    if (data.current_action === "dash") {
        data.hero.body.velocity.temp_x = (data.delta_time * data.x_speed * (main_char_list[data.hero_name].dash_speed + data.extra_speed)) | 0;
        data.hero.body.velocity.temp_y = (data.delta_time * data.y_speed * (main_char_list[data.hero_name].dash_speed + data.extra_speed)) | 0;
    } else if(data.current_action === "walk") {
        data.hero.body.velocity.temp_x = (data.delta_time * data.x_speed * (main_char_list[data.hero_name].walk_speed + data.extra_speed)) | 0;
        data.hero.body.velocity.temp_y = (data.delta_time * data.y_speed * (main_char_list[data.hero_name].walk_speed + data.extra_speed)) | 0;
    } else if(data.current_action === "climb") {
        data.hero.body.velocity.temp_x = (data.delta_time * data.x_speed * main_char_list[data.hero_name].climb_speed) | 0;
        data.hero.body.velocity.temp_y = (data.delta_time * data.y_speed * main_char_list[data.hero_name].climb_speed) | 0;
    } else if(data.current_action === "idle") {
        data.hero.body.velocity.y = data.hero.body.velocity.x = 0;
    }
}

export function set_speed_factors(data) {
    if (data.climbing) {
        if (check_isdown(data.cursors, "up", "down") || check_isdown(data.cursors, "right", "left")) {
            data.x_speed = 0;
            data.y_speed = 0;
            data.current_direction = "idle";
        } else if (!data.cursors.up.isDown && data.cursors.down.isDown) {
            data.x_speed = 0;
            data.y_speed = 1;
            data.current_direction = "down";
        } else if (data.cursors.up.isDown && !data.cursors.down.isDown) {
            data.x_speed = 0;
            data.y_speed = -1;
            data.current_direction = "up";
        } else if (!data.cursors.up.isDown && !data.cursors.down.isDown) {
            data.x_speed = 0;
            data.y_speed = 0;
            data.current_direction = "idle";
        }
    } else {
        if (!data.force_direction) { //makes no sense to force on diagonal if force_direction is false
            data.forcing_on_diagonal = false;
        }
        if (check_isdown(data.cursors, "up", "down") || check_isdown(data.cursors, "right", "left")) { //opposite direction should not result in movement
            data.x_speed = 0;
            data.y_speed = 0;
        //when force_direction is true, it means that the hero is going to face a different direction from the one specified in the keyboard arrows
        } else if ((check_isdown(data.cursors, "up") && !data.forcing_on_diagonal) || (data.current_direction === "up" && data.force_direction && !data.forcing_on_diagonal)) {
            if (!data.force_direction) {
                data.current_direction = get_transition_directions(data.current_direction, "up");
            }
            data.x_speed = 0;
            data.y_speed = -1;
        } else if ((check_isdown(data.cursors, "down") && !data.forcing_on_diagonal) || (data.current_direction === "down" && data.force_direction && !data.forcing_on_diagonal)) {
            if (!data.force_direction) {
                data.current_direction = get_transition_directions(data.current_direction, "down");
            }
            data.x_speed = 0;
            data.y_speed = 1;
        } else if ((check_isdown(data.cursors, "left") && !data.forcing_on_diagonal) || (data.current_direction === "left" && data.force_direction && !data.forcing_on_diagonal)) {
            if (!data.force_direction) {
                data.current_direction = get_transition_directions(data.current_direction, "left");
            }
            data.x_speed = -1;
            data.y_speed = 0;
        } else if ((check_isdown(data.cursors, "right") && !data.forcing_on_diagonal) || (data.current_direction === "right" && data.force_direction && !data.forcing_on_diagonal)) {
            if (!data.force_direction) {
                data.current_direction = get_transition_directions(data.current_direction, "right");
            }
            data.x_speed = 1;
            data.y_speed = 0;
        } else if (check_isdown(data.cursors, "up", "left") || (data.current_direction === "up_left" && data.force_direction && data.forcing_on_diagonal)) {
            if (!data.force_direction) {
                data.current_direction = get_transition_directions(data.current_direction, "up_left");
            }
            data.x_speed = -numbers.INV_SQRT2;
            data.y_speed = -numbers.INV_SQRT2;
        } else if (check_isdown(data.cursors, "up", "right") || (data.current_direction === "up_right" && data.force_direction && data.forcing_on_diagonal)) {
            if (!data.force_direction) {
                data.current_direction = get_transition_directions(data.current_direction, "up_right");
            }
            data.x_speed = numbers.INV_SQRT2;
            data.y_speed = -numbers.INV_SQRT2;
        } else if (check_isdown(data.cursors, "down", "left") || (data.current_direction === "down_left" && data.force_direction && data.forcing_on_diagonal)) {
            if (!data.force_direction) {
                data.current_direction = get_transition_directions(data.current_direction, "down_left");
            }
            data.x_speed = -numbers.INV_SQRT2;
            data.y_speed = numbers.INV_SQRT2;
        } else if (check_isdown(data.cursors, "down", "right") || (data.current_direction === "down_right" && data.force_direction && data.forcing_on_diagonal)) {
            if (!data.force_direction) {
                data.current_direction = get_transition_directions(data.current_direction, "down_right");
            }
            data.x_speed = numbers.INV_SQRT2;
            data.y_speed = numbers.INV_SQRT2;
        }
    }
}