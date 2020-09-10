import * as physics from '../physics/collision_bodies.js';
import { maps } from '../initializers/maps.js';
import { directions } from '../utils.js';

export function config_collision_change(data, current_event) {
    let next_x = current_event.x, next_y = current_event.y;
    if (current_event.activation_directions[0] === directions.left) {
        next_x = current_event.x - 1;
    } else if (current_event.activation_directions[0] === directions.right) {
        next_x = current_event.x + 1;
    } else if (current_event.activation_directions[0] === directions.up) {
        next_y = current_event.y - 1;
    } else if (current_event.activation_directions[0] === directions.down) {
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

export function change_map_body(game, data, new_collider_layer_index) {
    if (data.map_collider_layer === new_collider_layer_index) return;
    data.map_collider_layer = new_collider_layer_index;
    data.hero.shadow.base_collider_layer = data.map_collider_layer;
    data.hero.sprite.base_collider_layer = data.map_collider_layer;
    physics.config_physics_for_map(game, data, false, new_collider_layer_index);
    physics.config_physics_for_interactable_objects(game, data, true);
    physics.config_physics_for_npcs(game, data, true);
    physics.config_collisions(data);
    let layers = maps[data.map_name].layers;
    for (let i = 0; i < layers.length; ++i) {
        let layer = layers[i];
        let is_over = layer.properties.over.toString().split(",");
        if (is_over.length > new_collider_layer_index) {
            is_over = is_over.length > new_collider_layer_index ? (is_over[new_collider_layer_index]) | 0 : (is_over[0]) | 0;
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

export function do_collision_change(game, data) {
    if (data.hero.tile_x_pos === data.collision_event_data.next_x && data.hero.tile_y_pos === data.collision_event_data.next_y) {
        change_map_body(game, data, data.collision_event_data.dest_collider_layer);
        data.waiting_to_change_collision = false;
    } else if (data.hero.tile_x_pos !== data.collision_event_data.event.x || data.hero.tile_y_pos !== data.collision_event_data.event.y) {
        data.waiting_to_change_collision = false;
    }
}
