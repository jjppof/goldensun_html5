import { maps } from '../initializers/maps.js';
import { directions } from '../utils.js';

const STEP_SHIFT_FACTOR = 4;

export function config_step(data, current_event) {
    let next_x, next_y = current_event.y, shift_y;
    if (current_event.step_direction === directions.up) {
        shift_y = -((maps[data.map_name].sprite.tileHeight/STEP_SHIFT_FACTOR) | 0);
    } else if (current_event.step_direction === directions.down) {
        shift_y = (maps[data.map_name].sprite.tileHeight/STEP_SHIFT_FACTOR) | 0;
    }
    if (current_event.activation_directions[0] === directions.left) {
        next_x = current_event.x - 1;
    } else if (current_event.activation_directions[0] === directions.right) {
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
    if (data.hero.tile_x_pos === data.step_event_data.next_x && data.hero.tile_y_pos === data.step_event_data.next_y) {
        data.hero.sprite.body.y += data.step_event_data.shift_y;
        data.waiting_to_step = false;
    } else if (data.hero.tile_x_pos !== data.step_event_data.event.x || data.hero.tile_y_pos !== data.step_event_data.event.y) {
        data.waiting_to_step = false;
    }
}
