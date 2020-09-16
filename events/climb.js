import * as numbers from '../magic_numbers.js';
import { set_jump_collision, unset_set_jump_collision } from './jump.js';
import { directions } from '../utils.js';

export function climbing_event(game, data, current_event, activation_direction) {
    if (!data.hero.stop_by_colliding || data.hero.jumping || data.hero.pushing || data.in_battle || data.hero.tile_x_pos !== current_event.x || data.hero.tile_y_pos !== current_event.y) {
        return;
    }
    if (!data.hero.climbing && !current_event.climbing_only) {
        start_climbing(game, data, current_event, activation_direction);
    } else if ((data.hero.climbing && !current_event.climbing_only) || (data.hero.climbing && current_event.climbing_only)) {
        finish_climbing(game, data, current_event, activation_direction);
    }
}

function start_climbing(game, data, current_event, activation_direction) {
    game.physics.p2.pause();
    if (current_event.change_to_collision_layer !== null) {
        data.collision.change_map_body(data, current_event.change_to_collision_layer);
    }
    data.on_event = true;
    if (activation_direction === directions.down) {
        const turn_animation = data.hero.play("climb", "turn");
        turn_animation.onComplete.addOnce(() => {
            data.hero.shadow.visible = false;
            const x_tween = data.map.sprite.tileWidth * (current_event.x + 0.5);
            const y_tween = data.hero.sprite.y + 25;
            game.add.tween(data.hero.sprite.body).to(
                { x: x_tween, y: y_tween },
                300,
                Phaser.Easing.Linear.None,
                true
            );
            const start_animation = data.hero.play("climb", "start");
            start_animation.onComplete.addOnce(() => {
                data.hero.play("climb", "idle");
                data.on_event = false;
                data.hero.climbing = true;
                data.hero.current_action = "climb";
                if (current_event.dynamic) {
                    create_climb_collision_bodies(game, data, current_event);
                }
                game.physics.p2.resume();
            });
        });
    } else if (activation_direction === directions.up) {
        data.hero.play("climb", "idle");
        const out_time = Phaser.Timer.QUARTER/3;
        const x_tween = data.map.sprite.tileWidth * (current_event.x + 0.5);
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
            data.hero.climbing = true;
        });
        data.hero.shadow.visible = false;
        data.hero.current_action = "climb";
        data.hero.idle_climbing = true;
    }
}

function finish_climbing(game, data, current_event, activation_direction) {
    game.physics.p2.pause();
    if (activation_direction === directions.up) {
        for (let i = 0; i < data.map.interactable_objects.length; ++i) {
            const next_interactable_object = data.map.interactable_objects[i];
            if (next_interactable_object.current_x !== current_event.x || next_interactable_object.current_y !== current_event.y - 1) continue;
            if (current_event.change_to_collision_layer !== next_interactable_object.base_collider_layer) continue;
            game.physics.p2.resume();
            return;
        }
        if (current_event.change_to_collision_layer !== null) {
            data.collision.change_map_body(data, current_event.change_to_collision_layer);
        }
        data.on_event = true;
        const end_animation = data.hero.play("climb", "end");
        data.hero.shadow.visible = false;
        game.add.tween(data.hero.sprite.body).to(
            { y: data.hero.sprite.y - 15 },
            170,
            Phaser.Easing.Linear.None,
            true
        );
        const final_shadow_pos = data.hero.sprite.y - 15;
        game.time.events.add(170, () => {
            data.hero.shadow.y = final_shadow_pos;
            data.hero.shadow.visible = true;
        });
        end_animation.onComplete.addOnce(() => {
            game.time.events.add(150, () => {
                data.hero.shadow.y = data.hero.sprite.y;
                data.hero.play("idle", "up");
                if (current_event.dynamic) {
                    remove_climb_collision_bodies(data, current_event, false);
                }
                game.time.events.add(250, () => {
                    data.on_event = false;
                    data.hero.climbing = false;
                    data.hero.current_action = "idle";
                    data.hero.current_direction = directions.up;
                    game.physics.p2.resume();
                }, this);
            }, this);
        });
    } else if (activation_direction === directions.down) {
        if (current_event.change_to_collision_layer !== null) {
            data.collision.change_map_body(data, current_event.change_to_collision_layer);
        }
        data.on_event = true;
        data.hero.play("idle", "up");
        const out_time = Phaser.Timer.QUARTER/3;
        game.add.tween(data.hero.sprite.body).to(
            { y: data.hero.sprite.y + 15 },
            out_time,
            Phaser.Easing.Linear.None,
            true
        ).onComplete.addOnce(() => {
            game.physics.p2.resume();
            data.on_event = false;
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

function create_climb_collision_bodies(game, data, current_event) {
    current_event.origin_interactable_object.interactable_object_sprite.send_to_back = true;
    const postions = current_event.origin_interactable_object.events_info.stair.collision_tiles.map(tile_shift => {
        return {x: current_event.origin_interactable_object.current_x + tile_shift.x, y: current_event.origin_interactable_object.current_y + tile_shift.y};
    });
    unset_set_jump_collision(data);
    data.hero.sprite.body.removeCollisionGroup(data.collision.map_collision_group, true);
    data.map.collision_sprite.body.removeCollisionGroup(data.collision.hero_collision_group, true);
    for (let collide_index in data.collision.interactable_objs_collision_groups) {
        data.hero.sprite.body.removeCollisionGroup(data.collision.interactable_objs_collision_groups[collide_index], true);
    }
    for (let i = 0; i < postions.length; ++i) {
        const x_pos = (postions[i].x + .5) * data.map.sprite.tileWidth;
        const y_pos = (postions[i].y + .5) * data.map.sprite.tileHeight;
        let body = game.physics.p2.createBody(x_pos, y_pos, 0, true);
        body.clearShapes();
        body.setRectangle(data.map.sprite.tileWidth, data.map.sprite.tileHeight, 0, 0);
        body.setCollisionGroup(data.collision.dynamic_events_collision_group);
        body.damping = numbers.MAP_DAMPING;
        body.angularDamping = numbers.MAP_DAMPING;
        body.setZeroRotation();
        body.fixedRotation = true;
        body.dynamic = false;
        body.static = true;
        body.debug = data.hero.sprite.body.debug;
        body.collides(data.collision.hero_collision_group);
        current_event.origin_interactable_object.custom_data.collision_tiles_bodies.push(body);
    }
}

function remove_climb_collision_bodies(data, current_event, collide_with_map = true) {
    current_event.origin_interactable_object.interactable_object_sprite.send_to_back = false;
    set_jump_collision(game, data);
    if (collide_with_map) {
        data.hero.sprite.body.collides(data.collision.map_collision_group);
        data.map.collision_sprite.body.collides(data.collision.hero_collision_group);
    }
    for (let collide_index in data.collision.interactable_objs_collision_groups) {
        data.hero.sprite.body.removeCollisionGroup(data.collision.interactable_objs_collision_groups[collide_index], true);
    }
    if (data.map.collision_layer in data.collision.interactable_objs_collision_groups) {
        data.hero.sprite.body.collides(data.collision.interactable_objs_collision_groups[data.map.collision_layer]);
    }
    let bodies = current_event.origin_interactable_object.custom_data.collision_tiles_bodies;
    for (let i = 0; i < bodies.length; ++i) {
        bodies[i].destroy();
    }
    bodies = [];
}
