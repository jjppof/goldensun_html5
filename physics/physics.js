import { maps } from '../maps/maps.js';
import * as numbers from '../magic_numbers.js';
import { get_transition_directions } from '../utils.js';
import { main_char_list } from '../chars/main_chars.js';
import { normal_push } from '../psynergy_items/push.js';

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

export function config_physics_for_psynergy_items(data, only_set_groups = false) {
    for (let i = 0; i < maps[data.map_name].psynergy_items.length; ++i) {
        let psynergy_item = maps[data.map_name].psynergy_items[i];
        if (!(psynergy_item.base_collider_layer in data.psynergyItemCollisionGroups)) {
            data.psynergyItemCollisionGroups[psynergy_item.base_collider_layer] = game.physics.p2.createCollisionGroup(); //groups only need to be created once
        }
        if (only_set_groups) continue;
        game.physics.p2.enable(psynergy_item.psynergy_item_sprite, false);
        psynergy_item.psynergy_item_sprite.anchor.y = data.psynergy_items_db[psynergy_item.key_name].anchor_y; //Important to be after the previous command
        psynergy_item.psynergy_item_sprite.body.clearShapes();
        const width = data.psynergy_items_db[psynergy_item.key_name].body_radius * 2;
        psynergy_item.psynergy_item_sprite.body.setRectangle(width, width, 0, 0);
        psynergy_item.psynergy_item_sprite.body.setCollisionGroup(data.psynergyItemCollisionGroups[psynergy_item.base_collider_layer]);
        psynergy_item.psynergy_item_sprite.body.damping = numbers.PSYNERGY_ITEM_DAMPING;
        psynergy_item.psynergy_item_sprite.body.angularDamping = numbers.PSYNERGY_ITEM_DAMPING;
        psynergy_item.psynergy_item_sprite.body.setZeroRotation();
        psynergy_item.psynergy_item_sprite.body.fixedRotation = true; //disalble npm collision body rotation
        psynergy_item.psynergy_item_sprite.body.dynamic = false;
        psynergy_item.psynergy_item_sprite.body.static = true;
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

    for (let collide_index in data.psynergyItemCollisionGroups) {
        data.hero.body.removeCollisionGroup(data.psynergyItemCollisionGroups[collide_index], true);
    }
    if (data.map_collider_layer in data.psynergyItemCollisionGroups) {
        data.hero.body.collides(data.psynergyItemCollisionGroups[data.map_collider_layer]);
    }

    for (let i = 0; i < data.npc_group.children.length; ++i) {
        let sprite = data.npc_group.children[i];
        if (!sprite.is_npc && !sprite.is_psynergy_item) continue;
        sprite.body.collides(data.heroCollisionGroup);
    }
    data.hero.body.collides(data.dynamicEventsCollisionGroup);
}

export function collision_dealer(data) {
    let normals = [];
    for (let i = 0; i < game.physics.p2.world.narrowphase.contactEquations.length; ++i) {
        let c = game.physics.p2.world.narrowphase.contactEquations[i];
        if (c.bodyA === data.hero.body.data) { //check if hero collided with something
            normals.push(c.normalA);
        }
        let j = 0;
        for (j = 0; j < maps[data.map_name].psynergy_items.length; ++j) {  //check if hero is colliding with any psynergy item
            let psynergy_item_body = maps[data.map_name].psynergy_items[j].psynergy_item_sprite.body;
            if (c.bodyA === psynergy_item_body.data || c.bodyB === psynergy_item_body.data) {
                if (c.bodyA === data.hero.body.data || c.bodyB === data.hero.body.data) {
                    let psynergy_item = maps[data.map_name].psynergy_items[j];
                    if (["walk", "dash"].includes(data.actual_action) && data.map_collider_layer === psynergy_item.base_collider_layer) {
                        data.trying_to_push = true;
                        if (data.push_timer === null) {
                            data.trying_to_push_direction = data.actual_direction;
                            let item_position = psynergy_item.get_current_position(data);
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
                            if (psynergy_item.position_allowed(data, item_position.x, item_position.y)) {
                                data.push_timer = game.time.events.add(Phaser.Timer.QUARTER, normal_push.bind(this, data, psynergy_item));
                            }
                        }
                        break;
                    }
                }
            }
        }
        if (j === maps[data.map_name].psynergy_items.length) {
            data.trying_to_push = false;
        }
    }
    if (normals.length) {
        let resultant_normal = normals.reduce((accumulator, current) => {
            accumulator[0] += current[0];
            accumulator[1] += current[1];
            return accumulator;
        }, [0, 0]);
        let conditions_to_stop = [];
        if (data.actual_direction.includes("down") && resultant_normal[1] < 0) {
            if (Math.abs(resultant_normal[1]) > 0.9) {
                conditions_to_stop.push(true);
            } else {
                conditions_to_stop.push(false);
            }
        }
        if (data.actual_direction.includes("up") && resultant_normal[1] > 0) {
            if (Math.abs(resultant_normal[1]) > 0.9) {
                conditions_to_stop.push(true);
            } else {
                conditions_to_stop.push(false);
            }
        }
        if (data.actual_direction.includes("left") && resultant_normal[0] > 0) {
            if (Math.abs(resultant_normal[0]) > 0.9) {
                conditions_to_stop.push(true);
            } else {
                conditions_to_stop.push(false);
            }
        }
        if (data.actual_direction.includes("right") && resultant_normal[0] < 0) {
            if (Math.abs(resultant_normal[0]) > 0.9) {
                conditions_to_stop.push(true);
            } else {
                conditions_to_stop.push(false);
            }
        }
        if (conditions_to_stop.length === 1 && data.actual_direction.includes("_")) {
            data.stop_by_colliding = false;
        } else if (conditions_to_stop.length && conditions_to_stop.every(cond => cond)) {
            data.hero.body.velocity.x = data.hero.body.velocity.y = 0;
            data.stop_by_colliding = true;
        } else {
            data.stop_by_colliding = false;
        }
    } else {
        data.stop_by_colliding = false;
    }
}

export function calculate_hero_speed(data) {
    if (data.actual_action === "dash") {
        data.hero.body.velocity.x = parseInt(data.delta_time * data.x_speed * (main_char_list[data.hero_name].dash_speed + data.extra_speed));
        data.hero.body.velocity.y = parseInt(data.delta_time * data.y_speed * (main_char_list[data.hero_name].dash_speed + data.extra_speed));
    } else if(data.actual_action === "walk") {
        data.hero.body.velocity.x = parseInt(data.delta_time * data.x_speed * (main_char_list[data.hero_name].walk_speed + data.extra_speed));
        data.hero.body.velocity.y = parseInt(data.delta_time * data.y_speed * (main_char_list[data.hero_name].walk_speed + data.extra_speed));
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
            data.climb_direction = "down";
        } else if (data.cursors.up.isDown && !data.cursors.down.isDown) {
            data.x_speed = 0;
            data.y_speed = -1;
            data.climb_direction = "up";
        } else if (!data.cursors.up.isDown && !data.cursors.down.isDown) {
            data.x_speed = 0;
            data.y_speed = 0;
            data.climb_direction = "idle";
        }
    } else {
        if (data.cursors.up.isDown && !data.cursors.left.isDown && !data.cursors.right.isDown && !data.cursors.down.isDown && (data.actual_direction !== "up" || force)){
            data.actual_direction = get_transition_directions(data.actual_direction, "up"); 
            data.x_speed = 0;
            data.y_speed = -1;
        } else if (!data.cursors.up.isDown && !data.cursors.left.isDown && !data.cursors.right.isDown && data.cursors.down.isDown && (data.actual_direction !== "down" || force)){
            data.actual_direction = get_transition_directions(data.actual_direction, "down");
            data.x_speed = 0;
            data.y_speed = 1;
        } else if (!data.cursors.up.isDown && data.cursors.left.isDown && !data.cursors.right.isDown && !data.cursors.down.isDown && (data.actual_direction !== "left" || force)){
            data.actual_direction = get_transition_directions(data.actual_direction, "left");
            data.x_speed = -1;
            data.y_speed = 0;
        } else if (!data.cursors.up.isDown && !data.cursors.left.isDown && data.cursors.right.isDown && !data.cursors.down.isDown && (data.actual_direction !== "right" || force)){
            data.actual_direction = get_transition_directions(data.actual_direction, "right");
            data.x_speed = 1;
            data.y_speed = 0;
        } else if (data.cursors.up.isDown && data.cursors.left.isDown && !data.cursors.right.isDown && !data.cursors.down.isDown && (data.actual_direction !== "up_left" || force)){
            data.actual_direction = get_transition_directions(data.actual_direction, "up_left");
            data.x_speed = -numbers.INV_SQRT2;
            data.y_speed = -numbers.INV_SQRT2;
        } else if (data.cursors.up.isDown && !data.cursors.left.isDown && data.cursors.right.isDown && !data.cursors.down.isDown && (data.actual_direction !== "up_right" || force)){
            data.actual_direction = get_transition_directions(data.actual_direction, "up_right");
            data.x_speed = numbers.INV_SQRT2;
            data.y_speed = -numbers.INV_SQRT2;
        } else if (!data.cursors.up.isDown && data.cursors.left.isDown && !data.cursors.right.isDown && data.cursors.down.isDown && (data.actual_direction !== "down_left" || force)){
            data.actual_direction = get_transition_directions(data.actual_direction, "down_left");
            data.x_speed = -numbers.INV_SQRT2;
            data.y_speed = numbers.INV_SQRT2;
        } else if (!data.cursors.up.isDown && !data.cursors.left.isDown && data.cursors.right.isDown && data.cursors.down.isDown && (data.actual_direction !== "down_right" || force)){
            data.actual_direction = get_transition_directions(data.actual_direction, "down_right");
            data.x_speed = numbers.INV_SQRT2;
            data.y_speed = numbers.INV_SQRT2;
        }
    }
}
