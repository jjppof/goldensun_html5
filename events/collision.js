import * as physics from '../physics/physics.js';
import { maps } from '../maps/maps.js';

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

export function change_map_body(data, new_collider_layer_index) {
    if (data.map_collider_layer === new_collider_layer_index) return;
    data.map_collider_layer = new_collider_layer_index;
    data.shadow.base_collider_layer = data.map_collider_layer;
    data.hero.base_collider_layer = data.map_collider_layer;
    physics.config_physics_for_map(data, false, new_collider_layer_index);
    physics.config_physics_for_psynergy_items(data, true);
    physics.config_physics_for_npcs(data, true);
    physics.config_collisions(data);
    let layers = maps[data.map_name].layers;
    for (let i = 0; i < layers.length; ++i) {
        let layer = layers[i];
        let is_over = layer.properties.over.toString().split(",");
        if (is_over.length > new_collider_layer_index) {
            is_over = is_over.length > new_collider_layer_index ? parseInt(is_over[new_collider_layer_index]) : parseInt(is_over[0]);
            if (is_over !== 0) {
                data.underlayer_group.remove(layer.sprite, false, true);
                let index = 0;
                for (index = 0; index < data.overlayer_group.children.length; ++index) {
                    let child = data.overlayer_group.children[index];
                    if (child.layer_z > layer.z) {
                        data.overlayer_group.addAt(layer.sprite, index, true);
                        break;
                    }
                }
                if (index === data.overlayer_group.children.length) {
                    data.overlayer_group.add(layer.sprite, true);
                }
            } else {
                data.overlayer_group.remove(layer.sprite, false, true);
                let index = 0;
                for (index = 0; index < data.underlayer_group.children.length; ++index) {
                    let child = data.underlayer_group.children[index];
                    if (child.layer_z > layer.z) {
                        data.underlayer_group.addAt(layer.sprite, index, true);
                        break;
                    }
                }
                if (index === data.underlayer_group.children.length) {
                    data.underlayer_group.add(layer.sprite, true);
                }
            }
        }
    }
}

export function do_collision_change(data) {
    if (data.hero_tile_pos_x === data.collision_event_data.next_x && data.hero_tile_pos_y === data.collision_event_data.next_y) {
        change_map_body(data, data.collision_event_data.dest_collider_layer);
        data.waiting_to_change_collision = false;
    } else if (data.hero_tile_pos_x !== data.current_event.x || data.hero_tile_pos_y !== data.current_event.y) {
        data.waiting_to_change_collision = false;
    }
}
