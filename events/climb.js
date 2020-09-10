import { maps } from '../initializers/maps.js';
import { main_char_list } from '../initializers/main_chars.js';
import * as collision from '../events/collision.js';
import * as numbers from '../magic_numbers.js';
import { set_jump_collision, unset_set_jump_collision } from './jump.js';
import { directions } from '../utils.js';

export function climbing_event(game, data, current_event, activation_direction) {
    if (!data.hero.stop_by_colliding || data.hero.jumping || data.hero.pushing || data.in_battle || data.hero.tile_x_pos !== current_event.x || data.hero.tile_y_pos !== current_event.y) {
        return;
    }
    if (!data.hero.climbing && !current_event.climbing_only) {
        data.hero.climbing_event_data = {
            event: current_event
        }
        game.physics.p2.pause();
        if (current_event.change_to_collision_layer !== null) {
            collision.change_map_body(data, current_event.change_to_collision_layer);
        }
        if (activation_direction === directions.down) {
            data.on_event = true;
            data.hero.sprite.loadTexture(data.hero_name + "_climb");
            data.hero.sprite_info.setAnimation(data.hero.sprite, "climb");
            data.hero.sprite.animations.play("climb_start", 10, false, true);
        } else if (activation_direction === directions.up) {
            data.on_event = true;
            data.hero.sprite.loadTexture(data.hero_name + "_climb");
            data.hero.sprite_info.setAnimation(data.hero.sprite, "climb");
            data.hero.sprite.animations.play("climb_idle");
            const out_time = Phaser.Timer.QUARTER/3;
            const x_tween = maps[data.map_name].sprite.tileWidth*(current_event.x + 0.5);
            const y_tween = data.hero.sprite.y - 15;
            if (current_event.dynamic) {
                create_climb_collision_bodies(game, data, current_event);
            }
            game.add.tween(data.hero.sprite.body).to(
                { x: x_tween, y: y_tween },
                out_time,
                Phaser.Easing.Linear.None,
                true
            ).onComplete.addOnce(() => {
                game.physics.p2.resume();
                data.on_event = false;
                data.hero.climbing_event_data = null;
                data.hero.climbing = true;
            });
            data.hero.shadow.visible = false;
            data.hero.current_action = "climb";
            data.hero.idle_climbing = true;
        }
    } else if ((data.hero.climbing && !current_event.climbing_only) || (data.hero.climbing && current_event.climbing_only)) {
        data.hero.climbing_event_data = {
            event: current_event
        }
        game.physics.p2.pause();
        if (activation_direction === directions.up) {
            for (let i = 0; i < maps[data.map_name].interactable_objects.length; ++i) {
                const next_interactable_object = maps[data.map_name].interactable_objects[i];
                if (next_interactable_object.current_x !== current_event.x || next_interactable_object.current_y !== current_event.y - 1) continue;
                if (current_event.change_to_collision_layer !== next_interactable_object.base_collider_layer) continue;
                data.hero.climbing_event_data = null;
                game.physics.p2.resume();
                return;
            }
            if (current_event.change_to_collision_layer !== null) {
                collision.change_map_body(data, current_event.change_to_collision_layer);
            }
            data.on_event = true;
            data.hero.sprite.animations.play("climb_end", 9, false, false);
            data.hero.shadow.visible = false;
            game.add.tween(data.hero.sprite.body).to(
                { y: data.hero.sprite.y - 15 },
                170,
                Phaser.Easing.Linear.None,
                true
            );
        } else if (activation_direction === directions.down) {
            if (current_event.change_to_collision_layer !== null) {
                collision.change_map_body(data, current_event.change_to_collision_layer);
            }
            data.on_event = true;
            data.hero.sprite.loadTexture(data.hero_name + "_idle");
            data.hero.sprite_info.setAnimation(data.hero.sprite, "idle");
            data.hero.sprite.animations.play("idle_up");
            const out_time = Phaser.Timer.QUARTER/3;
            game.add.tween(data.hero.sprite.body).to(
                { y: data.hero.sprite.y + 15 },
                out_time,
                Phaser.Easing.Linear.None,
                true
            ).onComplete.addOnce(() => {
                game.physics.p2.resume();
                data.on_event = false;
                data.hero.climbing_event_data = null;
                data.hero.climbing = false;
            });
            if (current_event.dynamic) {
                remove_climb_collision_bodies(data, current_event);
            }
            data.hero.shadow.y = data.hero.sprite.y;
            data.hero.shadow.visible = true;
            data.hero.current_action = "idle";
            data.hero.current_direction = directions.up;
        }
    }
}

export function climb_event_animation_steps(data) {
    if (data.hero.sprite.animations.frameName === "climb/start/03") {
        data.hero.shadow.visible = false;
        const x_tween = maps[data.map_name].sprite.tileWidth * (data.hero.climbing_event_data.event.x + 0.5);
        const y_tween = data.hero.sprite.y + 25;
        game.add.tween(data.hero.sprite.body).to(
            { x: x_tween, y: y_tween },
            300,
            Phaser.Easing.Linear.None,
            true
        );
    } else if (data.hero.sprite.animations.frameName === "climb/start/06") {
        data.hero.sprite.animations.play("climb_idle", 9);
        data.on_event = false;
        data.hero.climbing = true;
        data.hero.current_action = "climb";
        if (data.hero.climbing_event_data.event.dynamic) {
            create_climb_collision_bodies(game, data, data.hero.climbing_event_data.event);
        }
        data.hero.climbing_event_data = null;
        game.physics.p2.resume();
    } else if (data.hero.sprite.animations.frameName === "climb/end/02") {
        game.time.events.add(150, () => {
            data.hero.shadow.y = data.hero.sprite.y;
            data.hero.shadow.visible = true;
            data.hero.sprite.loadTexture(data.hero_name + "_idle");
            data.hero.sprite_info.setAnimation(data.hero.sprite, "idle");
            data.hero.sprite.animations.play("idle_up");
            if (data.hero.climbing_event_data.event.dynamic) {
                remove_climb_collision_bodies(data, data.hero.climbing_event_data.event, false);
            }
            game.time.events.add(250, () => {
                data.on_event = false;
                data.hero.climbing_event_data = null;
                data.hero.climbing = false;
                data.hero.current_action = "idle";
                data.hero.current_direction = directions.up;
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
    data.hero.sprite.body.removeCollisionGroup(data.mapCollisionGroup, true);
    data.map_collider.body.removeCollisionGroup(data.heroCollisionGroup, true);
    for (let collide_index in data.interactableObjectCollisionGroups) {
        data.hero.sprite.body.removeCollisionGroup(data.interactableObjectCollisionGroups[collide_index], true);
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
        body.debug = data.hero.sprite.body.debug;
        body.collides(data.heroCollisionGroup);
        current_event.origin_interactable_object.custom_data.collision_tiles_bodies.push(body);
    }
}

function remove_climb_collision_bodies(data, current_event, collide_with_map = true) {
    current_event.origin_interactable_object.interactable_object_sprite.send_to_back = false;
    set_jump_collision(data);
    if (collide_with_map) {
        data.hero.sprite.body.collides(data.mapCollisionGroup);
        data.map_collider.body.collides(data.heroCollisionGroup);
    }
    for (let collide_index in data.interactableObjectCollisionGroups) {
        data.hero.sprite.body.removeCollisionGroup(data.interactableObjectCollisionGroups[collide_index], true);
    }
    if (data.map_collider_layer in data.interactableObjectCollisionGroups) {
        data.hero.sprite.body.collides(data.interactableObjectCollisionGroups[data.map_collider_layer]);
    }
    let bodies = current_event.origin_interactable_object.custom_data.collision_tiles_bodies;
    for (let i = 0; i < bodies.length; ++i) {
        bodies[i].destroy();
    }
    bodies = [];
}
