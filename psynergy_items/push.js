import * as numbers from  "../magic_numbers.js";
import { maps } from '../maps/maps.js';

export function fire_push_movement(data, psynergy_item) {
    if (data.trying_to_push && ["up", "down", "left", "right"].includes(data.trying_to_push_direction) && data.trying_to_push_direction === data.actual_direction) {
        let positive_limit = data.hero.x + (-psynergy_item.psynergy_item_sprite.y - psynergy_item.psynergy_item_sprite.x);
        let negative_limit = -data.hero.x + (-psynergy_item.psynergy_item_sprite.y + psynergy_item.psynergy_item_sprite.x);
        let expected_position;
        if (-data.hero.y >= positive_limit && -data.hero.y >= negative_limit) {
            expected_position = "down";
        } else if (-data.hero.y <= positive_limit && -data.hero.y >= negative_limit) {
            expected_position = "left";
        } else if (-data.hero.y <= positive_limit && -data.hero.y <= negative_limit) {
            expected_position = "up";
        } else if (-data.hero.y >= positive_limit && -data.hero.y <= negative_limit) {
            expected_position = "right";
        }
        if (expected_position === data.trying_to_push_direction) {
            data.pushing = true;
            data.actual_action = "push";
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
            let item_events = psynergy_item.get_events();
            for (let i = 0; i < item_events.length; ++i) {
                const event_key = item_events[i];
                let event = maps[data.map_name].events[event_key];
                delete maps[data.map_name].events[event_key];
                let old_x = event.x;
                let old_y = event.y;
                let new_x = old_x + event_shift_x;
                let new_y = old_y + event_shift_y;
                const new_event_key = new_x + "_" + new_y;
                psynergy_item.update_event(event_key, new_event_key);
                event.x = new_x;
                event.y = new_y;
                maps[data.map_name].events[new_event_key] = event;
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
                    const old_key = old_surroundings[j].x + "_" + old_surroundings[j].y;
                    const new_key = new_surroundings[j].x + "_" + new_surroundings[j].y;
                    if (old_key in maps[data.map_name].events) {
                        if (maps[data.map_name].events[old_key].dynamic === false) {
                            maps[data.map_name].events[old_key].active = false;
                        }
                    }
                    if (new_key in maps[data.map_name].events) {
                        if (maps[data.map_name].events[new_key].dynamic === false) {
                            maps[data.map_name].events[new_key].active = true;
                        }
                    }
                }
            }
            let sprites = [data.shadow, data.hero.body, psynergy_item.psynergy_item_sprite.body];
            for (let i = 0; i < sprites.length; ++i) {
                let body = sprites[i];
                game.add.tween(body).to({
                    x: body.x + tween_x,
                    y: body.y + tween_y
                }, numbers.PUSH_TIME, Phaser.Easing.Linear.None, true);
            }
            game.time.events.add(numbers.PUSH_TIME + 50, () => {
                data.pushing = false;
                game.physics.p2.resume();
            }, this);
        }
    }
    data.trying_to_push = false;
    data.push_timer = null;
}