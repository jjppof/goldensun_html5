import * as numbers from '../magic_numbers.js';
import { main_char_list } from '../chars/main_char_list.js';
import { maps } from '../maps/maps.js';

export function jump_event(data) {
    data.jumping = false;
    data.shadow.visible = false;
    let jump_offset = numbers.JUMP_OFFSET;
    let direction;
    let jump_direction;
    let next_position = {x: data.hero_tile_pos_x, y: data.hero_tile_pos_y};
    if (Array.isArray(data.current_event.activation_direction)) {
        if (data.actual_direction === "left") {
            jump_offset = -jump_offset;
            direction = "x";
            next_position.x -= 2;
            jump_direction = "left";
        } else if (data.actual_direction === "right") {
            direction = "x";
            next_position.x += 2;
            jump_direction = "right";
        } else if (data.actual_direction === "up") {
            jump_offset = -jump_offset;
            direction = "y";
            next_position.y -= 2;
            jump_direction = "up";
        } else if (data.actual_direction === "down") {
            direction = "y";
            next_position.y += 2;
            jump_direction = "down";
        }
    } else {
        if (data.current_event.activation_direction === "left") {
            jump_offset = -jump_offset;
            direction = "x";
            next_position.x -= 2;
            jump_direction = "left";
        } else if (data.current_event.activation_direction === "right") {
            direction = "x";
            next_position.x += 2;
            jump_direction = "right";
        } else if (data.current_event.activation_direction === "up") {
            jump_offset = -jump_offset;
            direction = "y";
            next_position.y -= 2;
            jump_direction = "up";
        } else if (data.current_event.activation_direction === "down") {
            direction = "y";
            next_position.y += 2;
            jump_direction = "down";
        }
    }
    let next_pos_key = next_position.x + "_" + next_position.y;
    if (!data.current_event.dynamic && next_pos_key in maps[data.map_name].events) {
        if (maps[data.map_name].events[next_pos_key].type === "jump" && maps[data.map_name].events[next_pos_key].dynamic) {
            set_jump_collision(data);
        }
    }
    if (data.current_event.dynamic && next_pos_key in maps[data.map_name].events) {
        if (maps[data.map_name].events[next_pos_key].type === "jump" && !maps[data.map_name].events[next_pos_key].dynamic) {
            unset_set_jump_collision(data);
        }
    } else if (data.current_event.dynamic && !(next_pos_key in maps[data.map_name].events)) {
        data.on_event = false;
        data.current_event = null;
        data.shadow.visible = true;
        return;
    }
    let tween_obj = {};
    data.shadow[direction] = data.hero[direction] + jump_offset;
    tween_obj[direction] = data.hero[direction] + jump_offset;
    if (direction === "x") {
        tween_obj.y = [data.hero.y - 5, data.hero.y];
    }
    data.hero.loadTexture(data.hero_name + "_jump");
    main_char_list[data.hero_name].setAnimation(data.hero, "jump");
    data.hero.animations.frameName = "jump/" + jump_direction;
    game.add.tween(data.hero.body).to( 
        tween_obj, 
        numbers.JUMP_DURATION, 
        Phaser.Easing.Linear.None, 
        true
    ).onComplete.addOnce(() => {
        data.on_event = false;
        data.current_event = null;
        data.shadow.visible = true;
    }, this);
}

export function set_jump_collision(data) {
    data.hero.body.removeCollisionGroup(data.mapCollisionGroup, true);
    data.map_collider.body.removeCollisionGroup(data.heroCollisionGroup, true);
    for (let event_key in maps[data.map_name].events) {
        let event = maps[data.map_name].events[event_key];
        if (event.type === "jump" && event.dynamic) {
            let surroundings = [
                {x: event.x - 1, y: event.y},
                {x: event.x + 1, y: event.y},
                {x: event.x, y: event.y - 1},
                {x: event.x, y: event.y + 1},
            ];
            for (let i = 0; i < surroundings.length; ++i) {
                const surrounding_key = surroundings[i].x + "_" + surroundings[i].y;
                if (surrounding_key in maps[data.map_name].events) {
                    if (maps[data.map_name].events[surrounding_key].dynamic) {
                        continue;
                    }
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
                data.dynamic_events_bodies.push(body);
            }
        }
    }
}

export function unset_set_jump_collision(data) {
    data.hero.body.collides(data.mapCollisionGroup);
    data.map_collider.body.collides(data.heroCollisionGroup);
    for (let i = 0; i < data.dynamic_events_bodies.length; ++i) {
        data.dynamic_events_bodies[i].destroy();
    }
    data.dynamic_events_bodies = [];
}

export function jump_near_collision(data) {
    const current_pos_key = data.hero_tile_pos_x + "_" + data.hero_tile_pos_y;
    let current_pos = {x: data.hero_tile_pos_x, y: data.hero_tile_pos_y};
    let get_surroundings = (x, y) => {
        return [
            {x: x - 1, y: y},
            {x: x + 1, y: y},
            {x: x, y: y - 1},
            {x: x, y: y + 1},
        ];
    };
    let surroundings = get_surroundings(current_pos.x, current_pos.y);
    let right_direction = false;
    if (Array.isArray(data.current_event.activation_direction)) {
        let possible_directions = data.actual_direction.split("_");
        for (let i = 0; i < possible_directions.length; ++i) {
            right_direction = right_direction || data.current_event.activation_direction.includes(possible_directions[i]);
        }
    } else {
        right_direction = data.actual_direction.includes(data.current_event.activation_direction);
    }

    for (let i = 0; i < surroundings.length; ++i) {
        const surrounding_key = surroundings[i].x + "_" + surroundings[i].y;
        if (surrounding_key in maps[data.map_name].events) {
            let event = maps[data.map_name].events[surrounding_key];
            const pair_key = current_pos_key + "-" + surrounding_key;
            if (event.type === "jump" && (event.dynamic || data.current_event.dynamic) && right_direction) {
                if (!data.walking_on_pillars_tiles.has(pair_key)) {
                    data.walking_on_pillars_tiles.add(pair_key);
                    let side_event_surroundings = get_surroundings(surroundings[i].x, surroundings[i].y);
                    let bodies_position = new Set((surroundings.concat(side_event_surroundings)).map(pos => pos.x + "_" + pos.y));
                    bodies_position.delete(current_pos_key);
                    bodies_position.delete(surrounding_key);
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
                        data.walking_on_pillars_bodies.push(body);
                    });
                    break;
                }
            } else if (event.type === "jump" && (event.dynamic || data.current_event.dynamic) && !right_direction) {
                if (data.walking_on_pillars_tiles.has(pair_key)) {
                    data.walking_on_pillars_tiles.delete(pair_key);
                    data.hero.body.collides(data.mapCollisionGroup);
                    data.map_collider.body.collides(data.heroCollisionGroup);
                    for (let j = 0; j < data.walking_on_pillars_bodies.length; ++j) {
                        data.walking_on_pillars_bodies[j].destroy();
                    }
                    data.walking_on_pillars_bodies = [];
                    break;
                }
            }
        }
    }
}
