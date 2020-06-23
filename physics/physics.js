import { maps } from '../initializers/maps.js';
import * as numbers from '../magic_numbers.js';
import { get_transition_directions, check_isdown } from '../utils.js';
import { main_char_list } from '../initializers/main_chars.js';
import { normal_push } from '../interactable_objects/push.js';
import { TileEvent, event_types } from '../base/TileEvent.js';

export function config_physics_for_hero(data, initialize = true) {
    if (initialize) data.heroCollisionGroup = game.physics.p2.createCollisionGroup(); //groups only need to be created once
    game.physics.p2.enable(data.hero, false);
    data.hero.anchor.y = numbers.HERO_Y_AP; //Important to be after the previous command
    data.hero.body.clearShapes();
    data.hero.body.setCircle(numbers.HERO_BODY_RADIUS, 0, 0);
    data.hero.body.setCollisionGroup(data.heroCollisionGroup);
    data.hero.body.mass = numbers.HERO_BODY_MASS;
    data.hero.body.damping = numbers.HERO_DAMPING;
    data.hero.body.angularDamping = numbers.HERO_DAMPING;
    data.hero.body.setZeroRotation();
    data.hero.body.fixedRotation = true; //disalble hero collision body rotation
}

export function config_physics_for_npcs(data, only_set_groups = false) {
    for (let i = 0; i < maps[data.map_name].npcs.length; ++i) {
        let npc = maps[data.map_name].npcs[i];
        if (!(npc.base_collider_layer in data.npcCollisionGroups)) {
            data.npcCollisionGroups[npc.base_collider_layer] = game.physics.p2.createCollisionGroup(); //groups only need to be created once
        }
        if (only_set_groups) continue;
        game.physics.p2.enable(npc.npc_sprite, false);
        npc.npc_sprite.anchor.y = data.npc_db[npc.key_name].anchor_y; //Important to be after the previous command
        npc.npc_sprite.body.clearShapes();
        npc.npc_sprite.body.setCircle(data.npc_db[npc.key_name].body_radius, 0, 0);
        npc.npc_sprite.body.setCollisionGroup(data.npcCollisionGroups[npc.base_collider_layer]);
        npc.npc_sprite.body.damping = numbers.NPC_DAMPING;
        npc.npc_sprite.body.angularDamping = numbers.NPC_DAMPING;
        npc.npc_sprite.body.setZeroRotation();
        npc.npc_sprite.body.fixedRotation = true; //disalble npm collision body rotation
        npc.npc_sprite.body.dynamic = false;
        npc.npc_sprite.body.static = true;
    }
}

export function config_physics_for_interactable_objects(data, only_set_groups = false) {
    for (let i = 0; i < maps[data.map_name].interactable_objects.length; ++i) {
        let interactable_object = maps[data.map_name].interactable_objects[i];
        if (!(interactable_object.base_collider_layer in data.interactableObjectCollisionGroups)) {
            data.interactableObjectCollisionGroups[interactable_object.base_collider_layer] = game.physics.p2.createCollisionGroup(); //groups only need to be created once
        }
        if (only_set_groups) continue;
        game.physics.p2.enable(interactable_object.interactable_object_sprite, false);
        interactable_object.interactable_object_sprite.anchor.y = data.interactable_objects_db[interactable_object.key_name].anchor_y; //Important to be after the previous command
        interactable_object.interactable_object_sprite.body.clearShapes();
        const width = data.interactable_objects_db[interactable_object.key_name].body_radius * 2;
        interactable_object.interactable_object_sprite.body.setRectangle(width, width, 0, 0);
        interactable_object.interactable_object_sprite.body.setCollisionGroup(data.interactableObjectCollisionGroups[interactable_object.base_collider_layer]);
        interactable_object.interactable_object_sprite.body.damping = numbers.INTERACTABLE_OBJECT_DAMPING;
        interactable_object.interactable_object_sprite.body.angularDamping = numbers.INTERACTABLE_OBJECT_DAMPING;
        interactable_object.interactable_object_sprite.body.setZeroRotation();
        interactable_object.interactable_object_sprite.body.fixedRotation = true; //disalble npm collision body rotation
        interactable_object.interactable_object_sprite.body.dynamic = false;
        interactable_object.interactable_object_sprite.body.static = true;
    }
}

export function config_physics_for_map(data, initialize = true, collision_layer = undefined) {
    if (initialize) { //groups only need to be created once
        data.map_collider = game.add.sprite(0, 0);
        data.map_collider.width = data.map_collider.height = 0;
        data.mapCollisionGroup = game.physics.p2.createCollisionGroup();
    }
    game.physics.p2.enable(data.map_collider, false);
    data.map_collider.body.clearShapes();
    data.map_collider.body.loadPolygon( //load map physics data json files
        maps[data.map_name].physics_names[collision_layer !== undefined ? collision_layer : data.map_collider_layer], 
        maps[data.map_name].physics_names[collision_layer !== undefined ? collision_layer : data.map_collider_layer]
    );
    data.map_collider.body.setCollisionGroup(data.mapCollisionGroup);
    data.map_collider.body.damping = numbers.MAP_DAMPING;
    data.map_collider.body.angularDamping = numbers.MAP_DAMPING;
    data.map_collider.body.setZeroRotation();
    data.map_collider.body.dynamic = false;
    data.map_collider.body.static = true;
}

export function config_world_physics() {
    game.physics.startSystem(Phaser.Physics.P2JS);
    game.physics.p2.setImpactEvents(true);
    game.physics.p2.world.defaultContactMaterial.restitution = numbers.WORLD_RESTITUTION;
    game.physics.p2.world.defaultContactMaterial.relaxation = numbers.WORLD_RELAXION;
    game.physics.p2.world.defaultContactMaterial.friction = numbers.WORLD_FRICTION;
    game.physics.p2.world.setGlobalStiffness(numbers.WORLD_STIFFNESS);
    game.physics.p2.restitution = numbers.WORLD_RESTITUTION;
}

export function config_collisions(data) { //make the world bodies interact with hero body
    data.hero.body.collides(data.mapCollisionGroup);
    data.map_collider.body.collides(data.heroCollisionGroup);

    for (let collide_index in data.npcCollisionGroups) {
        data.hero.body.removeCollisionGroup(data.npcCollisionGroups[collide_index], true);
    }
    if (data.map_collider_layer in data.npcCollisionGroups) {
        data.hero.body.collides(data.npcCollisionGroups[data.map_collider_layer]);
    }

    for (let collide_index in data.interactableObjectCollisionGroups) {
        data.hero.body.removeCollisionGroup(data.interactableObjectCollisionGroups[collide_index], true);
    }
    if (data.map_collider_layer in data.interactableObjectCollisionGroups) {
        data.hero.body.collides(data.interactableObjectCollisionGroups[data.map_collider_layer]);
    }

    for (let i = 0; i < data.npc_group.children.length; ++i) {
        let sprite = data.npc_group.children[i];
        if (!sprite.is_npc && !sprite.is_interactable_object) continue;
        sprite.body.collides(data.heroCollisionGroup);
    }
    data.hero.body.collides(data.dynamicEventsCollisionGroup);
}

export function collision_dealer(game, data) {
    let normals = [];
    for (let i = 0; i < game.physics.p2.world.narrowphase.contactEquations.length; ++i) {
        let c = game.physics.p2.world.narrowphase.contactEquations[i];
        if (c.bodyA === data.hero.body.data) { //check if hero collided with something
            normals.push(c.normalA);
            if (c.contactPointA[0] >= numbers.COLLISION_MARGIN && data.actual_direction === "left")
                data.hero.body.velocity.x = 0;
            if (c.contactPointA[0] <= -numbers.COLLISION_MARGIN && data.actual_direction === "right")
                data.hero.body.velocity.x = 0;
            if (c.contactPointA[1] <= -numbers.COLLISION_MARGIN && data.actual_direction === "down")
                data.hero.body.velocity.y = 0;
            if (c.contactPointA[1] >= numbers.COLLISION_MARGIN && data.actual_direction === "up")
                data.hero.body.velocity.y = 0;
        }
        let j = 0;
        for (j = 0; j < maps[data.map_name].interactable_objects.length; ++j) {  //check if hero is colliding with any interactable object
            let interactable_object_body = maps[data.map_name].interactable_objects[j].interactable_object_sprite.body;
            if (c.bodyA === interactable_object_body.data || c.bodyB === interactable_object_body.data) {
                if (c.bodyA === data.hero.body.data || c.bodyB === data.hero.body.data) {
                    let interactable_object = maps[data.map_name].interactable_objects[j];
                    if (["walk", "dash"].includes(data.actual_action) && data.map_collider_layer === interactable_object.base_collider_layer) {
                        data.trying_to_push = true;
                        if (data.push_timer === null) {
                            data.trying_to_push_direction = data.actual_direction;
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
    if (normals.length && data.actual_action === "climb") {
        if (Math.abs(data.hero.body.velocity.x) < numbers.SPEED_LIMIT_TO_STOP && Math.abs(data.hero.body.velocity.y) < numbers.SPEED_LIMIT_TO_STOP) {
            data.stop_by_colliding = true;
        } else {
            data.stop_by_colliding = false;
        }
    } else if (normals.length && ["walk", "dash"].includes(data.actual_action)) {
        if (Math.abs(data.hero.body.velocity.x) < numbers.SPEED_LIMIT_TO_STOP && Math.abs(data.hero.body.velocity.y) < numbers.SPEED_LIMIT_TO_STOP) {
            normals.forEach(normal => {
                if (Math.abs(normal[0]) < 0.1) normal[0] = 0;
                if (Math.abs(normal[1]) < 0.1) normal[1] = 0;
                if (Math.sign(-normal[0]) === Math.sign(data.hero.body.velocity.ask_x) && Math.sign(-normal[1]) === Math.sign(data.hero.body.velocity.ask_y)) {
                    if (normal[0] !== 0) data.hero.body.velocity.ask_x = 0;
                    if (normal[1] !== 0) data.hero.body.velocity.ask_y = 0;
                    return;
                }
            });
            data.stop_by_colliding = true;
            data.force_direction = false;
            data.forcing_on_diagonal = false;
        } else {
            data.stop_by_colliding = false;
            if (normals.length === 1) {
                const normal_angle = (Math.atan2(normals[0][1], -normals[0][0]) + numbers.degree360) % numbers.degree360;
                if (normal_angle >= numbers.degree15 && normal_angle < numbers.degree90 - numbers.degree15) {
                    if (check_isdown(data.cursors, "up")) {
                        data.force_direction = true;
                        data.forcing_on_diagonal = true;
                        data.actual_direction = "up_left";
                    } else if (check_isdown(data.cursors, "right")) {
                        data.force_direction = true;
                        data.forcing_on_diagonal = true;
                        data.actual_direction = "down_right";
                    } else {
                        data.force_direction = false;
                        data.forcing_on_diagonal = false;
                    }
                } else if (normal_angle >= numbers.degree90 + numbers.degree15 && normal_angle < Math.PI - numbers.degree15) {
                    if (check_isdown(data.cursors, "up")) {
                        data.force_direction = true;
                        data.forcing_on_diagonal = true;
                        data.actual_direction = "up_right";
                    } else if (check_isdown(data.cursors, "left")) {
                        data.force_direction = true;
                        data.forcing_on_diagonal = true;
                        data.actual_direction = "down_left";
                    } else {
                        data.force_direction = false;
                        data.forcing_on_diagonal = false;
                    }
                } else if (normal_angle >= Math.PI + numbers.degree15 && normal_angle < numbers.degree270 - numbers.degree15) {
                    if (check_isdown(data.cursors, "left")) {
                        data.force_direction = true;
                        data.forcing_on_diagonal = true;
                        data.actual_direction = "up_left";
                    } else if (check_isdown(data.cursors, "down")) {
                        data.force_direction = true;
                        data.forcing_on_diagonal = true;
                        data.actual_direction = "down_right";
                    } else {
                        data.force_direction = false;
                        data.forcing_on_diagonal = false;
                    }
                } else if (normal_angle >= numbers.degree270 + numbers.degree15 && normal_angle < numbers.degree360 - numbers.degree15) {
                    if (check_isdown(data.cursors, "right")) {
                        data.force_direction = true;
                        data.forcing_on_diagonal = true;
                        data.actual_direction = "up_right";
                    } else if (check_isdown(data.cursors, "down")) {
                        data.force_direction = true;
                        data.forcing_on_diagonal = true;
                        data.actual_direction = "down_left";
                    } else {
                        data.force_direction = false;
                        data.forcing_on_diagonal = false;
                    }
                } else if (normal_angle >= numbers.degree90 - numbers.degree15 && normal_angle < numbers.degree90 + numbers.degree15) {
                    if (check_isdown(data.cursors, "up", "left")) {
                        data.force_direction = true;
                        data.forcing_on_diagonal = false;
                        data.actual_direction = "left";
                    } else if (check_isdown(data.cursors, "up", "right")) {
                        data.force_direction = true;
                        data.forcing_on_diagonal = false;
                        data.actual_direction = "right";
                    } else {
                        data.force_direction = false;
                    }
                } else if (normal_angle >= Math.PI - numbers.degree15 && normal_angle < Math.PI + numbers.degree15) {
                    if (check_isdown(data.cursors, "down", "left")) {
                        data.force_direction = true;
                        data.forcing_on_diagonal = false;
                        data.actual_direction = "down";
                    } else if (check_isdown(data.cursors, "up", "left")) {
                        data.force_direction = true;
                        data.forcing_on_diagonal = false;
                        data.actual_direction = "up";
                    } else {
                        data.force_direction = false;
                    }
                } else if (normal_angle >= numbers.degree270 - numbers.degree15 && normal_angle < numbers.degree270 + numbers.degree15) {
                    if (check_isdown(data.cursors, "left", "down")) {
                        data.force_direction = true;
                        data.forcing_on_diagonal = false;
                        data.actual_direction = "left";
                    } else if (check_isdown(data.cursors, "right", "down")) {
                        data.force_direction = true;
                        data.forcing_on_diagonal = false;
                        data.actual_direction = "right";
                    } else {
                        data.force_direction = false;
                    }
                } else if (normal_angle >= numbers.degree360 - numbers.degree15 || normal_angle < numbers.degree15) {
                    if (check_isdown(data.cursors, "down", "right")) {
                        data.force_direction = true;
                        data.forcing_on_diagonal = false;
                        data.actual_direction = "down";
                    } else if (check_isdown(data.cursors, "up", "right")) {
                        data.force_direction = true;
                        data.forcing_on_diagonal = false;
                        data.actual_direction = "up";
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

    if (["walk", "dash"].includes(data.actual_action)) {
        data.hero.body.velocity.x = data.hero.body.velocity.ask_x;
        data.hero.body.velocity.y = data.hero.body.velocity.ask_y;
    }
}

export function calculate_hero_speed(data) {
    if (data.actual_action === "dash") {
        data.hero.body.velocity.ask_x = parseInt(data.delta_time * data.x_speed * (main_char_list[data.hero_name].dash_speed + data.extra_speed));
        data.hero.body.velocity.ask_y = parseInt(data.delta_time * data.y_speed * (main_char_list[data.hero_name].dash_speed + data.extra_speed));
    } else if(data.actual_action === "walk") {
        data.hero.body.velocity.ask_x = parseInt(data.delta_time * data.x_speed * (main_char_list[data.hero_name].walk_speed + data.extra_speed));
        data.hero.body.velocity.ask_y = parseInt(data.delta_time * data.y_speed * (main_char_list[data.hero_name].walk_speed + data.extra_speed));
    } else if(data.actual_action === "climb") {
        data.hero.body.velocity.x = parseInt(data.delta_time * data.x_speed * main_char_list[data.hero_name].climb_speed);
        data.hero.body.velocity.y = parseInt(data.delta_time * data.y_speed * main_char_list[data.hero_name].climb_speed);
    } else if(data.actual_action === "idle") {
        data.hero.body.velocity.y = data.hero.body.velocity.x = 0;
    }
}

export function set_speed_factors(data, force = false) {
    if (data.climbing) {
        if (!data.cursors.up.isDown && data.cursors.down.isDown) {
            data.x_speed = 0;
            data.y_speed = 1;
            data.actual_direction = "down";
        } else if (data.cursors.up.isDown && !data.cursors.down.isDown) {
            data.x_speed = 0;
            data.y_speed = -1;
            data.actual_direction = "up";
        } else if (!data.cursors.up.isDown && !data.cursors.down.isDown) {
            data.x_speed = 0;
            data.y_speed = 0;
            data.actual_direction = "idle";
        }
    } else {
        if ((check_isdown(data.cursors, "up") && ((data.actual_direction !== "up" && !data.forcing_on_diagonal) || force)) || (data.actual_direction === "up" && data.force_direction)){
            if (!data.force_direction) {
                data.actual_direction = get_transition_directions(data.actual_direction, "up");
            }
            data.x_speed = 0;
            data.y_speed = -1;
        } else if ((check_isdown(data.cursors, "down") && ((data.actual_direction !== "down" && !data.forcing_on_diagonal) || force)) || (data.actual_direction === "down" && data.force_direction)){
            if (!data.force_direction) {
                data.actual_direction = get_transition_directions(data.actual_direction, "down");
            }
            data.x_speed = 0;
            data.y_speed = 1;
        } else if ((check_isdown(data.cursors, "left") && ((data.actual_direction !== "left" && !data.forcing_on_diagonal) || force)) || (data.actual_direction === "left" && data.force_direction)){
            if (!data.force_direction) {
                data.actual_direction = get_transition_directions(data.actual_direction, "left");
            }
            data.x_speed = -1;
            data.y_speed = 0;
        } else if ((check_isdown(data.cursors, "right") && ((data.actual_direction !== "right" && !data.forcing_on_diagonal) || force)) || (data.actual_direction === "right" && data.force_direction)){
            if (!data.force_direction) {
                data.actual_direction = get_transition_directions(data.actual_direction, "right");
            }
            data.x_speed = 1;
            data.y_speed = 0;
        } else if ((check_isdown(data.cursors, "up", "left") && (data.actual_direction !== "up_left" || force)) || (data.actual_direction === "up_left" && data.force_direction)){
            if (!data.force_direction) {
                data.actual_direction = get_transition_directions(data.actual_direction, "up_left");
            }
            data.x_speed = -numbers.INV_SQRT2;
            data.y_speed = -numbers.INV_SQRT2;
        } else if ((check_isdown(data.cursors, "up", "right") && (data.actual_direction !== "up_right" || force)) || (data.actual_direction === "up_right" && data.force_direction)){
            if (!data.force_direction) {
                data.actual_direction = get_transition_directions(data.actual_direction, "up_right");
            }
            data.x_speed = numbers.INV_SQRT2;
            data.y_speed = -numbers.INV_SQRT2;
        } else if ((check_isdown(data.cursors, "down", "left") && (data.actual_direction !== "down_left" || force)) || (data.actual_direction === "down_left" && data.force_direction)){
            if (!data.force_direction) {
                data.actual_direction = get_transition_directions(data.actual_direction, "down_left");
            }
            data.x_speed = -numbers.INV_SQRT2;
            data.y_speed = numbers.INV_SQRT2;
        } else if ((check_isdown(data.cursors, "down", "right") && (data.actual_direction !== "down_right" || force)) || (data.actual_direction === "down_right" && data.force_direction)){
            if (!data.force_direction) {
                data.actual_direction = get_transition_directions(data.actual_direction, "down_right");
            }
            data.x_speed = numbers.INV_SQRT2;
            data.y_speed = numbers.INV_SQRT2;
        }
    }
}
