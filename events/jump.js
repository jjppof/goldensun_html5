import * as numbers from '../magic_numbers.js';
import { main_char_list } from '../chars/main_char_list.js';
import { maps } from '../maps/maps.js';

export function jump_event(data, event_key) {
    let current_event = maps[data.map_name].events[event_key];
    data.shadow.visible = false;
    let jump_offset = numbers.JUMP_OFFSET;
    let direction;
    let jump_direction;
    let next_position = {x: current_event.x, y: current_event.y};
    let side_position = {x: current_event.x, y: current_event.y};
    if (Array.isArray(current_event.activation_direction)) {
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
        if (current_event.activation_direction === "left") {
            jump_offset = -jump_offset;
            direction = "x";
            next_position.x -= 2;
            side_position.x -= 1;
            jump_direction = "left";
        } else if (current_event.activation_direction === "right") {
            direction = "x";
            next_position.x += 2;
            side_position.x += 1;
            jump_direction = "right";
        } else if (current_event.activation_direction === "up") {
            jump_offset = -jump_offset;
            direction = "y";
            next_position.y -= 2;
            side_position.y -= 1;
            jump_direction = "up";
        } else if (current_event.activation_direction === "down") {
            direction = "y";
            next_position.y += 2;
            side_position.y += 1;
            jump_direction = "down";
        }
    }
    let side_pos_key = side_position.x + "_" + side_position.y;
    if (side_pos_key in maps[data.map_name].events) {
        if (maps[data.map_name].events[side_pos_key].type === "jump") {
            data.on_event = false;
            data.current_event = null;
            data.shadow.visible = true;
            return;
        }
    }
    let next_pos_key = next_position.x + "_" + next_position.y;
    if (next_pos_key in maps[data.map_name].events) {
        if (maps[data.map_name].events[next_pos_key].type !== "jump") {
            data.on_event = false;
            data.current_event = null;
            data.shadow.visible = true;
            return;
        }
        if (maps[data.map_name].events[next_pos_key].type === "jump" && maps[data.map_name].events[next_pos_key].dynamic) {
            set_jump_collision(data);
        }
    }
    if (current_event.dynamic && next_pos_key in maps[data.map_name].events) {
        if (maps[data.map_name].events[next_pos_key].type === "jump" && !maps[data.map_name].events[next_pos_key].dynamic) {
            unset_set_jump_collision(data);
        }
    } else if (current_event.dynamic && !(next_pos_key in maps[data.map_name].events)) {
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
    for (let i = 0; i < data.dynamic_jump_events_bodies.length; ++i) {
        data.dynamic_jump_events_bodies[i].destroy();
    }
    data.dynamic_jump_events_bodies = [];
    data.walking_on_pillars_tiles.clear();
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
                data.dynamic_jump_events_bodies.push(body);
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

export function jump_near_collision(data, event_key) {
    let current_event = maps[data.map_name].events[event_key];
    const current_pos_key = data.hero_tile_pos_x + "_" + data.hero_tile_pos_y;
    let current_pos = {x: data.hero_tile_pos_x, y: data.hero_tile_pos_y};
    let get_surroundings = (x, y, with_diagonals) => {
        let surroundings = [
            {x: x - 1, y: y},
            {x: x + 1, y: y},
            {x: x, y: y - 1},
            {x: x, y: y + 1},
        ];
        if (with_diagonals) {
            surroundings = surroundings.concat([
                {x: x - 1, y: y - 1},
                {x: x + 1, y: y - 1},
                {x: x - 1, y: y + 1},
                {x: x + 1, y: y + 1},
            ]);
        }
        return surroundings;
    };
    let surroundings = get_surroundings(current_pos.x, current_pos.y, true);
    let right_direction = false;
    if (Array.isArray(current_event.activation_direction)) {
        let possible_directions = data.actual_direction.split("_");
        for (let i = 0; i < possible_directions.length; ++i) {
            right_direction = right_direction || current_event.activation_direction.includes(possible_directions[i]);
        }
    } else {
        right_direction = data.actual_direction.includes(current_event.activation_direction);
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
        const surrounding_key = surroundings[i].x + "_" + surroundings[i].y;
        if (surrounding_key in maps[data.map_name].events) {
            let surrounding_event = maps[data.map_name].events[surrounding_key];
            if (surrounding_event.type === "jump" && right_direction) {
                if (surrounding_event.dynamic || current_event.dynamic) {
                    at_least_one_dynamic = true;
                }
                const side_event_surroundings = get_surroundings(surroundings[i].x, surroundings[i].y, false);
                bodies_positions.push(side_event_surroundings);
                concat_keys += "-" + surrounding_key;
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
