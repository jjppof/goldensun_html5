import * as physics from '../physics/collision_bodies.js';
import { maps } from '../initializers/maps.js';

export function config_collision_change(data, current_event) {
    let next_x = current_event.x, next_y = current_event.y;
    if (current_event.activation_directions[0] === "left") {
        next_x = current_event.x - 1;
    } else if (current_event.activation_directions[0] === "right") {
        next_x = current_event.x + 1;
    } else if (current_event.activation_directions[0] === "up") {
        next_y = current_event.y - 1;
    } else if (current_event.activation_directions[0] === "down") {
        next_y = current_event.y + 1;
    }
    data.waiting_to_change_collision = true;
    data.collision_event_data = {
        x: current_event.x,
        y: current_event.y,
        next_x: next_x,
        next_y: next_y,
        dest_collider_layer: current_event.dest_collider_layer,
        event: current_event
    };
}

export function change_map_body(data, new_collider_layer_index) {
    if (data.map_collider_layer === new_collider_layer_index) return;
    data.map_collider_layer = new_collider_layer_index;
    data.shadow.base_collider_layer = data.map_collider_layer;
    data.hero.base_collider_layer = data.map_collider_layer;
    physics.config_physics_for_map(data, false, new_collider_layer_index);
    physics.config_physics_for_interactable_objects(data, true);
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
    } else if (data.hero_tile_pos_x !== data.collision_event_data.event.x || data.hero_tile_pos_y !== data.collision_event_data.event.y) {
        data.waiting_to_change_collision = false;
    }
}
