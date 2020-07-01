import { maps } from '../initializers/maps.js';

const STEP_SHIFT_FACTOR = 4;

export function config_step(data, current_event) {
    let next_x, next_y = current_event.y, shift_y;
    if (current_event.step_direction === "up") {
        shift_y = -parseInt(maps[data.map_name].sprite.tileHeight/STEP_SHIFT_FACTOR);
    } else if (current_event.step_direction === "down") {
        shift_y = parseInt(maps[data.map_name].sprite.tileHeight/STEP_SHIFT_FACTOR);
    }
    if (current_event.activation_directions[0] === "left") {
        next_x = current_event.x - 1;
    } else if (current_event.activation_directions[0] === "right") {
        next_x = current_event.x + 1;
    }
    data.waiting_to_step = true;
    data.step_event_data = {
        x: current_event.x,
        y: current_event.y,
        next_x: next_x,
        next_y: next_y,
        shift_y: shift_y,
        event: current_event
    };
}

export function do_step(data) {
    if (data.hero_tile_pos_x === data.step_event_data.next_x && data.hero_tile_pos_y === data.step_event_data.next_y) {
        data.hero.body.y += data.step_event_data.shift_y;
        data.waiting_to_step = false;
    } else if (data.hero_tile_pos_x !== data.step_event_data.event.x || data.hero_tile_pos_y !== data.step_event_data.event.y) {
        data.waiting_to_step = false;
    }
}
