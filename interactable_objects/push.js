import * as numbers from  "../magic_numbers.js";
import { maps } from '../initializers/maps.js';
import { TileEvent, event_types, JumpEvent } from "../base/TileEvent.js";
import { get_surroundings, get_opposite_direcion } from "../utils.js";

const dust_count = 7;
const dust_radius = 18;
const frames = Phaser.Animation.generateFrameNames('dust/', 0, 7, '', 2);

export function normal_push(game, data, interactable_object) {
    if (data.trying_to_push && ["up", "down", "left", "right"].includes(data.trying_to_push_direction) && data.trying_to_push_direction === data.current_direction && !data.casting_psynergy && !data.jumping) {
        fire_push_movement(game, data, interactable_object);
    }
    data.trying_to_push = false;
    data.push_timer = null;
}

export function target_only_push(game, data, interactable_object, before_move, push_end, enable_physics_at_end = true) {
    fire_push_movement(game, data, interactable_object, push_end, before_move, true, enable_physics_at_end);
}

export function fire_push_movement(game, data, interactable_object, push_end, before_move, target_only = false, enable_physics_at_end = true) {
    let expected_position;
    if (!target_only) {
        let positive_limit = data.hero.x + (-interactable_object.interactable_object_sprite.y - interactable_object.interactable_object_sprite.x);
        let negative_limit = -data.hero.x + (-interactable_object.interactable_object_sprite.y + interactable_object.interactable_object_sprite.x);
        if (-data.hero.y >= positive_limit && -data.hero.y >= negative_limit) {
            expected_position = "down";
        } else if (-data.hero.y <= positive_limit && -data.hero.y >= negative_limit) {
            expected_position = "left";
        } else if (-data.hero.y <= positive_limit && -data.hero.y <= negative_limit) {
            expected_position = "up";
        } else if (-data.hero.y >= positive_limit && -data.hero.y <= negative_limit) {
            expected_position = "right";
        }
    }
    if (target_only || expected_position === data.trying_to_push_direction) {
        if (!target_only) {
            data.pushing = true;
            data.current_action = "push";
        }
        game.physics.p2.pause();
        let tween_x = 0, tween_y = 0;
        let event_shift_x = 0, event_shift_y = 0;
        switch (data.trying_to_push_direction) {
            case "up":
                event_shift_y = -1;
                tween_y = -numbers.PUSH_SHIFT;
                break;
            case "down":
                event_shift_y = 1;
                tween_y = numbers.PUSH_SHIFT;
                break;
            case "left":
                event_shift_x = -1;
                tween_x = -numbers.PUSH_SHIFT;
                break;
            case "right":
                event_shift_x = 1;
                tween_x = numbers.PUSH_SHIFT;
                break;
        }
        shift_events(data, interactable_object, event_shift_x, event_shift_y);
        let sprites = [interactable_object.interactable_object_sprite.body];
        if (!target_only) {
            sprites.push(...[data.shadow, data.hero.body]);
        }
        const prev_x = interactable_object.current_x;
        const prev_y = interactable_object.current_y;
        interactable_object.current_x += event_shift_x;
        interactable_object.current_y += event_shift_y;
        let promises = [];
        if (before_move !== undefined) {
            before_move(tween_x, tween_y);
        }
        if (interactable_object.custom_data.blocking_stair_block) {
            interactable_object.custom_data.blocking_stair_block.x += tween_x;
            interactable_object.custom_data.blocking_stair_block.y += tween_y;
        }
        for (let i = 0; i < sprites.length; ++i) {
            let body = sprites[i];
            let dest_x = body.x + tween_x;
            let dest_y = body.y + tween_y;
            if (body === data.shadow || body === data.hero.body) {
                if (tween_x === 0) {
                    dest_x = maps[data.map_name].sprite.tileWidth * (prev_x + event_shift_x + 0.5);
                } else if (tween_y === 0) {
                    dest_y = maps[data.map_name].sprite.tileHeight * (prev_y + event_shift_y + 0.5);
                }
            }
            let promise_resolve;
            promises.push(new Promise(resolve => { promise_resolve = resolve; }))
            game.add.tween(body).to({
                x: dest_x,
                y: dest_y
            }, numbers.PUSH_TIME, Phaser.Easing.Linear.None, true).onComplete.addOnce(() => {
                let drop_found = false;
                interactable_object.object_drop_tiles.forEach(drop_tile => {
                    if (drop_tile.x === interactable_object.current_x && drop_tile.y === interactable_object.current_y) {
                        drop_found = true;
                        const dest_y_shift_px = (drop_tile.dest_y - interactable_object.current_y) * maps[data.map_name].sprite.tileHeight;
                        shift_events(data, interactable_object, 0, drop_tile.dest_y - interactable_object.current_y);
                        interactable_object.current_y = drop_tile.dest_y;
                        interactable_object.change_collider_layer(data, drop_tile.destination_collider_layer);
                        game.add.tween(interactable_object.interactable_object_sprite.body).to({
                            y: interactable_object.interactable_object_sprite.body.y + dest_y_shift_px
                        },
                        drop_tile.animation_duration,
                        Phaser.Easing.Quadratic.In,
                        true
                        ).onComplete.addOnce(() => {
                            if (drop_tile.dust_animation) {
                                data.current_action = "idle";
                                data.hero.loadTexture(data.hero_name + "_" + data.current_action);
                                main_char_list[data.hero_name].setAnimation(data.hero, data.current_action);
                                data.hero.animations.play(data.current_action + "_" + data.current_direction);
                                dust_animation(game, data, interactable_object, promise_resolve);
                            } else {
                                promise_resolve();
                            }
                        });
                        return;
                    }
                });
                if (!drop_found) {
                    promise_resolve();
                }
            });
        }
        Promise.all(promises).then(() => {
            data.pushing = false;
            if (enable_physics_at_end) {
                game.physics.p2.resume();
            }
            if (push_end !== undefined) {
                push_end();
            }
        });
    }
}

function shift_events(data, interactable_object, event_shift_x, event_shift_y) {
    let object_events = interactable_object.get_events();
    for (let i = 0; i < object_events.length; ++i) {
        let event = object_events[i];
        maps[data.map_name].events[event.location_key] = maps[data.map_name].events[event.location_key].filter(e => {
            return e.id !== event.id;
        });
        if (maps[data.map_name].events[event.location_key].length === 0) {
            delete maps[data.map_name].events[event.location_key];
        }
        let old_x = event.x;
        let old_y = event.y;
        let new_x = old_x + event_shift_x;
        let new_y = old_y + event_shift_y;
        const new_event_location_key = TileEvent.get_location_key(new_x, new_y);
        event.x = new_x;
        event.y = new_y;
        event.location_key = new_event_location_key;
        if (!(new_event_location_key in maps[data.map_name].events)) {
            maps[data.map_name].events[new_event_location_key] = [];
        }
        maps[data.map_name].events[new_event_location_key].push(event);
        const new_surroundings = get_surroundings(new_x, new_y, false, 2);
        JumpEvent.active_jump_surroundings(data, new_surroundings, interactable_object.collider_layer_shift + interactable_object.base_collider_layer);
        const old_surroundings = get_surroundings(old_x, old_y, false, 2);
        for (let j = 0; j < old_surroundings.length; ++j) {
            const old_surrounding = old_surroundings[j];
            const old_key = TileEvent.get_location_key(old_surrounding.x, old_surrounding.y);
            if (old_key in maps[data.map_name].events) {
                for (let k = 0; k < maps[data.map_name].events[old_key].length; ++k) {
                    const old_surr_event = maps[data.map_name].events[old_key][k];
                    if (old_surr_event.type === event_types.JUMP) {
                        const target_layer = interactable_object.collider_layer_shift + interactable_object.base_collider_layer;
                        if (old_surr_event.activation_collision_layers.includes(target_layer) && old_surr_event.dynamic === false) {
                            old_surr_event.deactivate_at(get_opposite_direcion(old_surrounding.direction));
                        }
                    }
                }
            }
        }
    }
}

function dust_animation(game, data, interactable_object, promise_resolve) {
    let promises = new Array(dust_count);
    let sprites = new Array(dust_count);
    const origin_x = (interactable_object.current_x + 0.5) * maps[data.map_name].sprite.tileWidth;
    const origin_y = (interactable_object.current_y + 0.5) * maps[data.map_name].sprite.tileHeight;
    for (let i = 0; i < dust_count; ++i) {
        const this_angle = (Math.PI + numbers.degree60) * i/(dust_count - 1) - numbers.degree30;
        const x = origin_x + dust_radius * Math.cos(this_angle);
        const y = origin_y + dust_radius * Math.sin(this_angle);
        let dust_sprite = data.npc_group.create(origin_x, origin_y, 'dust');
        if (this_angle < 0 || this_angle > Math.PI) {
            data.npc_group.setChildIndex(dust_sprite, data.npc_group.getChildIndex(interactable_object.interactable_object_sprite));
        }
        dust_sprite.anchor.setTo(0.5, 0.5);
        game.add.tween(dust_sprite).to({
            x: x,
            y: y
        }, 400, Phaser.Easing.Linear.In, true);
        sprites[i] = dust_sprite;
        dust_sprite.animations.add('anim', frames, 12, false, false);
        let resolve_func;
        promises[i] = new Promise(resolve => { resolve_func = resolve; });
        dust_sprite.animations.currentAnim.onComplete.addOnce(resolve_func);
        dust_sprite.animations.play('anim');
    }
    Promise.all(promises).then(() => {
        sprites.forEach(sprite => {
            data.npc_group.remove(sprite, true);
        });
        promise_resolve();
    });
}
