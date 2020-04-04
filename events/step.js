import { maps } from '../maps/maps.js';
import * as numbers from '../magic_numbers.js';

export function config_step(data) {
    let next_x, next_y = data.current_event.y, shift_y;
    if (data.current_event.step_direction === "up") {
        shift_y = -parseInt(maps[data.map_name].sprite.tileHeight/numbers.STEP_SHIFT_FACTOR);
    } else if (data.current_event.step_direction === "down") {
        shift_y = parseInt(maps[data.map_name].sprite.tileHeight/numbers.STEP_SHIFT_FACTOR);
    }
    if (data.current_event.activation_direction === "left") {
        next_x = data.current_event.x - 1;
    } else if (data.current_event.activation_direction === "right") {
        next_x = data.current_event.x + 1;
    }
    data.wating_to_step = true;
    data.step_event_data = {
        x: data.current_event.x,
        y: data.current_event.y,
        next_x: next_x,
        next_y: next_y,
        shift_y: shift_y
    };
}

export function do_step(data) {
    if (data.hero_tile_pos_x === data.step_event_data.next_x && data.hero_tile_pos_y === data.step_event_data.next_y) {
        data.hero.body.y += data.step_event_data.shift_y;
        data.wating_to_step = false;
    } else if (data.hero_tile_pos_x !== data.current_event.x || data.hero_tile_pos_y !== data.current_event.y) {
        data.wating_to_step = false;
    }
}
