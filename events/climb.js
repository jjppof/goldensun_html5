import { maps } from '../initializers/maps.js';
import { main_char_list } from '../initializers/main_chars.js';
import * as collision from '../events/collision.js';
import * as numbers from '../magic_numbers.js';
import { set_jump_collision, unset_set_jump_collision } from './jump.js';

export function climbing_event(game, data, current_event, activation_direction) {
    if (!data.stop_by_colliding || data.jumping || data.pushing || data.hero_tile_pos_x !== current_event.x || data.hero_tile_pos_y !== current_event.y) {
        return;
    }
    if (!data.climbing && !current_event.climbing_only) {
        data.climbing_event_data = {
            event: current_event
        }
        game.physics.p2.pause();
        if (current_event.change_to_collision_layer !== null) {
            collision.change_map_body(data, current_event.change_to_collision_layer);
        }
        if (activation_direction === "down") {
            data.on_event = true;
            data.hero.loadTexture(data.hero_name + "_climb");
            main_char_list[data.hero_name].setAnimation(data.hero, "climb");
            data.hero.animations.play("climb_start", 9, false, true);
        } else if (activation_direction === "up") {
            data.on_event = true;
            data.hero.loadTexture(data.hero_name + "_climb");
            main_char_list[data.hero_name].setAnimation(data.hero, "climb");
            data.hero.animations.play("climb_idle");
            const out_time = Phaser.Timer.QUARTER/3;
            const x_tween = maps[data.map_name].sprite.tileWidth*(current_event.x + 0.5);
            const y_tween = data.hero.y - 15;
            if (current_event.dynamic) {
                create_climb_collision_bodies(game, data, current_event);
            }
            game.add.tween(data.hero.body).to(
                { x: x_tween, y: y_tween },
                out_time,
                Phaser.Easing.Linear.None,
                true
            ).onComplete.addOnce(() => {
                game.physics.p2.resume();
                data.on_event = false;
                data.climbing_event_data = null;
                data.climbing = true;
            });
            data.shadow.visible = false;
            data.actual_action = "climb";
            data.actual_direction = "idle";
        }
    } else if ((data.climbing && !current_event.climbing_only) || (data.climbing && current_event.climbing_only)) {
        data.climbing_event_data = {
            event: current_event
        }
        game.physics.p2.pause();
        if (current_event.change_to_collision_layer !== null) {
            collision.change_map_body(data, current_event.change_to_collision_layer);
        }
        if (activation_direction === "up") {
            data.on_event = true;
            data.hero.animations.play("climb_end", 8, false, false);
            data.shadow.visible = false;
            const time = Phaser.Timer.QUARTER >> 1;
            game.add.tween(data.hero.body).to(
                { y: data.hero.y - 12 },
                time,
                Phaser.Easing.Linear.None,
                true
            );
        } else if (activation_direction === "down") {
            data.on_event = true;
            data.hero.loadTexture(data.hero_name + "_idle");
            main_char_list[data.hero_name].setAnimation(data.hero, "idle");
            data.hero.animations.play("idle_up");
            const out_time = Phaser.Timer.QUARTER/3;
            game.add.tween(data.hero.body).to(
                { y: data.hero.y + 15 },
                out_time,
                Phaser.Easing.Linear.None,
                true
            ).onComplete.addOnce(() => {
                game.physics.p2.resume();
                data.on_event = false;
                data.climbing_event_data = null;
                data.climbing = false;
            });
            if (current_event.dynamic) {
                remove_climb_collision_bodies(data, current_event);
            }
            data.shadow.y = data.hero.y;
            data.shadow.visible = true;
            data.actual_action = "idle";
            data.actual_direction = "up";
        }
    }
}

export function climb_event_animation_steps(data) {
    if (data.hero.animations.frameName === "climb/start/03") {
        data.shadow.visible = false;
        const x_tween = maps[data.map_name].sprite.tileWidth * (data.climbing_event_data.event.x + 0.5);
        const y_tween = data.hero.y + 25;
        game.add.tween(data.hero.body).to(
            { x: x_tween, y: y_tween },
            300,
            Phaser.Easing.Linear.None,
            true
        );
    } else if (data.hero.animations.frameName === "climb/start/06") {
        data.hero.animations.play("climb_idle", 9);
        data.on_event = false;
        data.climbing = true;
        data.actual_action = "climb";
        if (data.climbing_event_data.event.dynamic) {
            create_climb_collision_bodies(game, data, data.climbing_event_data.event);
        }
        data.climbing_event_data = null;
        game.physics.p2.resume();
    } else if (data.hero.animations.frameName === "climb/end/02") {
        game.time.events.add(150, () => {
            game.add.tween(data.hero.body).to(
                { y: data.hero.y - 2 },
                45,
                Phaser.Easing.Linear.None,
                true
            ).onComplete.addOnce(() => {
                data.shadow.y = data.hero.y;
                data.shadow.visible = true;
            });
            data.hero.loadTexture(data.hero_name + "_idle");
            main_char_list[data.hero_name].setAnimation(data.hero, "idle");
            data.hero.animations.play("idle_up");
            if (data.climbing_event_data.event.dynamic) {
                remove_climb_collision_bodies(data, data.climbing_event_data.event);
            }
            game.time.events.add(250, () => {
                data.on_event = false;
                data.climbing_event_data = null;
                data.climbing = false;
                data.actual_action = "idle";
                data.actual_direction = "up";
                game.physics.p2.resume();
            }, this);
        }, this);
    }
}

function create_climb_collision_bodies(game, data, current_event) {
    current_event.origin_interactable_object.interactable_object_sprite.send_to_back = true;
    const postions = current_event.origin_interactable_object.events_info.stair.collision_tiles.map(tile_shift => {
        return {x: current_event.origin_interactable_object.current_x + tile_shift.x, y: current_event.origin_interactable_object.current_y + tile_shift.y};
    });
    unset_set_jump_collision(data);
    data.hero.body.removeCollisionGroup(data.mapCollisionGroup, true);
    data.map_collider.body.removeCollisionGroup(data.heroCollisionGroup, true);
    for (let collide_index in data.interactableObjectCollisionGroups) {
        data.hero.body.removeCollisionGroup(data.interactableObjectCollisionGroups[collide_index], true);
    }
    for (let i = 0; i < postions.length; ++i) {
        const x_pos = (postions[i].x + .5) * maps[data.map_name].sprite.tileWidth;
        const y_pos = (postions[i].y + .5) * maps[data.map_name].sprite.tileHeight;
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
        current_event.origin_interactable_object.custom_data.collision_tiles_bodies.push(body);
    }
}

function remove_climb_collision_bodies(data, current_event) {
    current_event.origin_interactable_object.interactable_object_sprite.send_to_back = false;
    set_jump_collision(data);
    data.hero.body.collides(data.mapCollisionGroup);
    data.map_collider.body.collides(data.heroCollisionGroup);
    for (let collide_index in data.interactableObjectCollisionGroups) {
        data.hero.body.removeCollisionGroup(data.interactableObjectCollisionGroups[collide_index], true);
    }
    if (data.map_collider_layer in data.interactableObjectCollisionGroups) {
        data.hero.body.collides(data.interactableObjectCollisionGroups[data.map_collider_layer]);
    }
    let bodies = current_event.origin_interactable_object.custom_data.collision_tiles_bodies;
    for (let i = 0; i < bodies.length; ++i) {
        bodies[i].destroy();
    }
    bodies = [];
}
