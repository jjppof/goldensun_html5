import * as numbers from '../magic_numbers.js';
import { main_char_list } from '../initializers/main_chars.js';
import { maps } from '../initializers/maps.js';
import { event_types, TileEvent } from '../base/TileEvent.js';
import { get_surroundings } from '../utils.js';

export function jump_event(data, current_event) {
    if (!current_event.active || data.hero_tile_pos_x !== current_event.x || data.hero_tile_pos_y !== current_event.y) {
        data.on_event = false;
        return;
    }
    let jump_offset = numbers.JUMP_OFFSET;
    let direction;
    let jump_direction;
    let next_position = {x: current_event.x, y: current_event.y};
    let side_position = {x: current_event.x, y: current_event.y};
    if (Array.isArray(current_event.activation_directions)) {
        if (data.actual_direction === "left") {
            jump_offset = -jump_offset;
            direction = "x";
            next_position.x -= 2;
            side_position.x -= 1;
            jump_direction = "left";
        } else if (data.actual_direction === "right") {
            direction = "x";
            next_position.x += 2;
            side_position.x += 1;
            jump_direction = "right";
        } else if (data.actual_direction === "up") {
            jump_offset = -jump_offset;
            direction = "y";
            next_position.y -= 2;
            side_position.y -= 1;
            jump_direction = "up";
        } else if (data.actual_direction === "down") {
            direction = "y";
            next_position.y += 2;
            side_position.y += 1;
            jump_direction = "down";
        }
    } else {
        if (current_event.activation_directions === "left") {
            jump_offset = -jump_offset;
            direction = "x";
            next_position.x -= 2;
            side_position.x -= 1;
            jump_direction = "left";
        } else if (current_event.activation_directions === "right") {
            direction = "x";
            next_position.x += 2;
            side_position.x += 1;
            jump_direction = "right";
        } else if (current_event.activation_directions === "up") {
            jump_offset = -jump_offset;
            direction = "y";
            next_position.y -= 2;
            side_position.y -= 1;
            jump_direction = "up";
        } else if (current_event.activation_directions === "down") {
            direction = "y";
            next_position.y += 2;
            side_position.y += 1;
            jump_direction = "down";
        }
    }
    let side_pos_key = TileEvent.get_location_key(side_position.x, side_position.y);
    if (side_pos_key in maps[data.map_name].events) {
        for (let i = 0; i < maps[data.map_name].events[side_pos_key].length; ++i) {
            const event = maps[data.map_name].events[side_pos_key][i];
            if (event.type === event_types.JUMP) {
                data.on_event = false;
                data.shadow.visible = true;
                return;
            }
        }
    }
    let next_pos_key = next_position.x + "_" + next_position.y;
    for (let i = 0; i < maps[data.map_name].interactable_objects.length; ++i) {
        const next_interactable_object = maps[data.map_name].interactable_objects[i];
        if (next_interactable_object.current_x !== next_position.x || next_interactable_object.current_y !== next_position.y) continue;
        if (data.interactable_objects_db[next_interactable_object.key_name].type !== "move") continue;
        if (data.map_collider_layer !== next_interactable_object.base_collider_layer) continue;
        data.on_event = false;
        data.shadow.visible = true;
        return;
    }
    if (next_pos_key in maps[data.map_name].events) {
        let active_jump_event_found = false;
        for (let i = 0; i < maps[data.map_name].events[next_pos_key].length; ++i) {
            const event = maps[data.map_name].events[next_pos_key][i];
            if (event.type === event_types.JUMP && event.active) {
                active_jump_event_found = true;
                if (event.dynamic) {
                    set_jump_collision(data);
                } else if (current_event.dynamic) {
                    unset_set_jump_collision(data);
                }
            }
        }
        if (!active_jump_event_found) {
            data.on_event = false;
            data.shadow.visible = true;
            return;
        }
    } else if (current_event.dynamic) {
        data.on_event = false;
        data.shadow.visible = true;
        return;
    }
    let tween_obj = {};
    tween_obj[direction] = data.hero[direction] + jump_offset;
    const hero_y = data.hero.body.y;
    if (direction === "x") {
        tween_obj.y = [hero_y - 5, hero_y - 8, hero_y - 5, hero_y];
    }
    game.physics.p2.pause();
    data.hero.loadTexture(data.hero_name + "_jump");
    main_char_list[data.hero_name].setAnimation(data.hero, "jump");
    data.hero.animations.play("jump_" + jump_direction, main_char_list[data.hero_name].actions["jump"].frame_rate, false);
    data.hero.animations.currentAnim.onComplete.addOnce(() => {
        data.shadow.visible = false;
        data.shadow[direction] = data.hero[direction] + jump_offset;
        game.add.tween(data.hero.body).to( 
            tween_obj,
            numbers.JUMP_DURATION,
            Phaser.Easing.Linear.None,
            true
        ).onComplete.addOnce(() => {
            data.shadow.visible = true;
            data.hero.animations.currentAnim.reverseOnce();
            data.hero.animations.play("jump_" + jump_direction, main_char_list[data.hero_name].actions["jump"].frame_rate, false);
            data.hero.animations.currentAnim.onComplete.addOnce(() => {
                game.physics.p2.resume();
                data.on_event = false;
            });
        }, this);
    });
}

export function set_jump_collision(data) {
    for (let i = 0; i < data.dynamic_jump_events_bodies.length; ++i) {
        data.dynamic_jump_events_bodies[i].destroy();
    }
    data.dynamic_jump_events_bodies = [];
    data.walking_on_pillars_tiles.clear();
    data.hero.body.removeCollisionGroup(data.mapCollisionGroup, true);
    data.map_collider.body.removeCollisionGroup(data.heroCollisionGroup, true);
    for (let event_key in maps[data.map_name].events) {
        for (let j = 0; j < maps[data.map_name].events[event_key].length; ++j) {
            const event = maps[data.map_name].events[event_key][j];
            if (event.type === event_types.JUMP && event.dynamic) {
                let surroundings = [
                    {x: event.x - 1, y: event.y},
                    {x: event.x + 1, y: event.y},
                    {x: event.x, y: event.y - 1},
                    {x: event.x, y: event.y + 1},
                ];
                for (let i = 0; i < surroundings.length; ++i) {
                    const surrounding_key = TileEvent.get_location_key(surroundings[i].x, surroundings[i].y);
                    if (surrounding_key in maps[data.map_name].events) {
                        let dynamic_found = false;
                        for (let k = 0; k < maps[data.map_name].events[surrounding_key].length; ++k) {
                            if (maps[data.map_name].events[surrounding_key][k].dynamic) {
                                dynamic_found = true;
                                break;
                            }
                        }
                        if (dynamic_found) continue;
                    } 
                    let x_pos = (surroundings[i].x + .5) * maps[data.map_name].sprite.tileWidth;
                    let y_pos = (surroundings[i].y + .5) * maps[data.map_name].sprite.tileHeight;
                    let body = game.physics.p2.createBody(x_pos, y_pos, 0, true);
                    body.clearShapes();
                    body.setRectangle(maps[data.map_name].sprite.tileWidth, maps[data.map_name].sprite.tileHeight, 0, 0);
                    body.setCollisionGroup(data.dynamicEventsCollisionGroup);
                    body.damping = numbers.MAP_DAMPING;
                    body.angularDamping = numbers.MAP_DAMPING;
                    body.setZeroRotation();
                    body.fixedRotation = true;
                    body.dynamic = false;
                    body.static = true;
                    body.debug = data.hero.body.debug;
                    body.collides(data.heroCollisionGroup);
                    data.dynamic_jump_events_bodies.push(body);
                }
            }
        }
    }
}

export function unset_set_jump_collision(data) {
    data.hero.body.collides(data.mapCollisionGroup);
    data.map_collider.body.collides(data.heroCollisionGroup);
    for (let i = 0; i < data.dynamic_jump_events_bodies.length; ++i) {
        data.dynamic_jump_events_bodies[i].destroy();
    }
    data.dynamic_jump_events_bodies = [];
}

export function jump_near_collision(data, current_event) {
    const current_pos_key = data.hero_tile_pos_x + "_" + data.hero_tile_pos_y;
    let current_pos = {x: data.hero_tile_pos_x, y: data.hero_tile_pos_y};
    let surroundings = get_surroundings(current_pos.x, current_pos.y, true);
    let right_direction = false;
    if (Array.isArray(current_event.activation_directions)) {
        let possible_directions = data.actual_direction.split("_");
        for (let i = 0; i < possible_directions.length; ++i) {
            right_direction = right_direction || current_event.activation_directions.includes(possible_directions[i]);
        }
    } else {
        right_direction = data.actual_direction.includes(current_event.activation_directions);
    }

    let clear_bodies = () => {
        data.hero.body.collides(data.mapCollisionGroup);
        data.map_collider.body.collides(data.heroCollisionGroup);
        for (let j = 0; j < data.dynamic_jump_events_bodies.length; ++j) {
            data.dynamic_jump_events_bodies[j].destroy();
        }
        data.dynamic_jump_events_bodies = [];
    };
    let concat_keys = current_pos_key;
    let bodies_positions = [];
    let at_least_one_dynamic = false;
    for (let i = 0; i < surroundings.length; ++i) {
        const surrounding_key = TileEvent.get_location_key(surroundings[i].x, surroundings[i].y);
        if (surrounding_key in maps[data.map_name].events) {
            for (let j = 0; j < maps[data.map_name].events[surrounding_key].length; ++j) {
                const surrounding_event = maps[data.map_name].events[surrounding_key][j];
                if (surrounding_event.type === event_types.JUMP && right_direction) {
                    if ((surrounding_event.dynamic || current_event.dynamic) && !surroundings[i].diag && surrounding_event.is_set) {
                        at_least_one_dynamic = true;
                    }
                    const side_event_surroundings = get_surroundings(surroundings[i].x, surroundings[i].y, false);
                    bodies_positions.push(side_event_surroundings);
                    concat_keys += "-" + surrounding_key;
                }
            }
        }
    }
    if (!data.walking_on_pillars_tiles.has(concat_keys) && at_least_one_dynamic) {
        data.walking_on_pillars_tiles.clear();
        clear_bodies();
        data.walking_on_pillars_tiles.add(concat_keys);
        let bodies_position = new Set((surroundings.concat(...bodies_positions)).map(pos => pos.x + "_" + pos.y));
        concat_keys.split("-").forEach(key => {
            bodies_position.delete(key);
        });
        data.hero.body.removeCollisionGroup(data.mapCollisionGroup, true);
        data.map_collider.body.removeCollisionGroup(data.heroCollisionGroup, true);
        bodies_position.forEach(position => {
            const pos_array = position.split("_");
            let x_pos = (parseInt(pos_array[0]) + .5) * maps[data.map_name].sprite.tileWidth;
            let y_pos = (parseInt(pos_array[1]) + .5) * maps[data.map_name].sprite.tileHeight;
            let body = game.physics.p2.createBody(x_pos, y_pos, 0, true);
            body.clearShapes();
            body.setRectangle(maps[data.map_name].sprite.tileWidth, maps[data.map_name].sprite.tileHeight, 0, 0);
            body.setCollisionGroup(data.dynamicEventsCollisionGroup);
            body.damping = numbers.MAP_DAMPING;
            body.angularDamping = numbers.MAP_DAMPING;
            body.setZeroRotation();
            body.fixedRotation = true;
            body.dynamic = false;
            body.static = true;
            body.debug = data.hero.body.debug;
            body.collides(data.heroCollisionGroup);
            data.dynamic_jump_events_bodies.push(body);
        });
    }
    if (!current_event.dynamic && !right_direction && data.walking_on_pillars_tiles.size) {
        data.walking_on_pillars_tiles.clear();
        clear_bodies();
    }
}
