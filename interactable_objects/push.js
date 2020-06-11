import * as numbers from  "../magic_numbers.js";
import { maps } from '../initializers/maps.js';
import { TileEvent, event_types } from "../base/TileEvent.js";

export function normal_push(data, interactable_object) {
    if (data.trying_to_push && ["up", "down", "left", "right"].includes(data.trying_to_push_direction) && data.trying_to_push_direction === data.actual_direction && !data.casting_psynergy) {
        fire_push_movement(data, interactable_object);
    }
    data.trying_to_push = false;
    data.push_timer = null;
}

export function target_only_push(data, interactable_object, before_move, push_end) {
    fire_push_movement(data, interactable_object, push_end, before_move, true);
}

export function fire_push_movement(data, interactable_object, push_end, before_move, target_only = false) {
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
            data.actual_action = "push";
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
            let old_surroundings = [
                {x: old_x - 2, y: old_y},
                {x: old_x + 2, y: old_y},
                {x: old_x, y: old_y - 2},
                {x: old_x, y: old_y + 2},
            ];
            let new_surroundings = [
                {x: new_x - 2, y: new_y},
                {x: new_x + 2, y: new_y},
                {x: new_x, y: new_y - 2},
                {x: new_x, y: new_y + 2},
            ];
            for (let j = 0; j < old_surroundings.length; ++j) {
                const old_key = TileEvent.get_location_key(old_surroundings[j].x, old_surroundings[j].y);
                const new_key = TileEvent.get_location_key(new_surroundings[j].x, new_surroundings[j].y);
                if (old_key in maps[data.map_name].events) {
                    for (let k = 0; k < maps[data.map_name].events[old_key].length; ++k) {
                        const old_surr_event = maps[data.map_name].events[old_key][k];
                        if (old_surr_event.type === event_types.JUMP) {
                            const target_layer = interactable_object.events_info.jump.collide_layer_shift + interactable_object.base_collider_layer;
                            if (old_surr_event.activation_collision_layers.includes(target_layer)) {
                                if (old_surr_event.dynamic === false) {
                                    old_surr_event.active = false;
                                }
                            }
                        }
                    }
                }
                if (new_key in maps[data.map_name].events) {
                    for (let k = 0; k < maps[data.map_name].events[new_key].length; ++k) {
                        const new_surr_event = maps[data.map_name].events[new_key][k];
                        if (new_surr_event.type === event_types.JUMP) {
                            const target_layer = interactable_object.events_info.jump.collide_layer_shift + interactable_object.base_collider_layer;
                            if (new_surr_event.activation_collision_layers.includes(target_layer)) {
                                if (new_surr_event.dynamic === false && new_surr_event.is_set) {
                                    new_surr_event.active = true;
                                }
                            }
                        }
                    }
                }
            }
        }
        let sprites = [interactable_object.interactable_object_sprite.body];
        if (!target_only) {
            sprites.push(...[data.shadow, data.hero.body]);
        }
        interactable_object.current_x += event_shift_x;
        interactable_object.current_y += event_shift_y;
        let promises = [];
        if (before_move !== undefined) {
            before_move(tween_x, tween_y);
        }
        for (let i = 0; i < sprites.length; ++i) {
            let body = sprites[i];
            let promise_resolve;
            promises.push(new Promise(resolve => { promise_resolve = resolve; }))
            game.add.tween(body).to({
                x: body.x + tween_x,
                y: body.y + tween_y
            }, numbers.PUSH_TIME, Phaser.Easing.Linear.None, true).onComplete.addOnce(promise_resolve);
        }
        Promise.all(promises).then(() => {
            data.pushing = false;
            game.physics.p2.resume();
            if (push_end !== undefined) {
                push_end();
            }
        });
    }
}
