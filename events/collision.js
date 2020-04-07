import * as physics from '../physics/physics.js';

export function config_collision_change(data) {
    let next_x = data.current_event.x, next_y = data.current_event.y;
    if (data.current_event.activation_direction === "left") {
        next_x = data.current_event.x - 1;
    } else if (data.current_event.activation_direction === "right") {
        next_x = data.current_event.x + 1;
    } else if (data.current_event.activation_direction === "up") {
        next_y = data.current_event.y - 1;
    } else if (data.current_event.activation_direction === "dpwn") {
        next_y = data.current_event.y + 1;
    }
    data.waiting_to_change_collision = true;
    data.collision_event_data = {
        x: data.current_event.x,
        y: data.current_event.y,
        next_x: next_x,
        next_y: next_y,
        dest_collider_layer: data.current_event.dest_collider_layer
    };
}

export function do_collision_change(data) {
    if (data.hero_tile_pos_x === data.collision_event_data.next_x && data.hero_tile_pos_y === data.collision_event_data.next_y) {
        physics.config_physics_for_map(data, false, data.collision_event_data.dest_collider_layer)
        data.waiting_to_change_collision = false;
    } else if (data.hero_tile_pos_x !== data.current_event.x || data.hero_tile_pos_y !== data.current_event.y) {
        data.waiting_to_change_collision = false;
    }
}
