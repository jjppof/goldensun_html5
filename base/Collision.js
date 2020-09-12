import { directions } from "../utils.js";
import { maps } from "../initializers/maps.js";

export class Collision {
    constructor(game, hero) {
        this.game = game;
        this.hero = hero;
        this.config_world();
        this.hero_collision_group = this.game.physics.p2.createCollisionGroup();
        this.dynamic_events_collision_group = this.game.physics.p2.createCollisionGroup();
        this.map_collision_group = game.physics.p2.createCollisionGroup();
        this.npc_collision_groups = {};
        this.interactable_objs_collision_groups = {};
        this.max_layers_created = 0;
        this.collision_event_data = {};
        this.waiting_to_change_collision = false;
        this.dynamic_jump_events_bodies = [];
    }

    config_world() {
        this.game.physics.startSystem(Phaser.Physics.P2JS);
        this.game.physics.p2.setImpactEvents(true);
        this.game.physics.p2.world.defaultContactMaterial.restitution = 0;
        this.game.physics.p2.world.defaultContactMaterial.relaxation = 8;
        this.game.physics.p2.world.defaultContactMaterial.friction = 0;
        this.game.physics.p2.world.defaultContactMaterial.contactSkinSize = 1e-3;
        this.game.physics.p2.world.setGlobalStiffness(1e5);
        this.game.physics.p2.restitution = 0;
    }

    config_collision_groups(map) {
        //p2 has a limit number of collision groups that can be created. Then, NPCs and I. Objs. groups will be created on demand.
        for (let layer_index = this.max_layers_created; layer_index < map.collision_layers_number; ++layer_index) {
            this.npc_collision_groups[layer_index] = this.game.physics.p2.createCollisionGroup();
            this.interactable_objs_collision_groups[layer_index] = this.game.physics.p2.createCollisionGroup();
        }
        this.max_layers_created = Math.max(this.max_layers_created, map.collision_layers_number);
    }

    config_collisions(map, map_collider_layer, npc_group) {
        this.hero.sprite.body.collides(this.map_collision_group);
        map.collision_sprite.body.collides(this.hero_collision_group);

        for (let collide_index in this.npc_collision_groups) {
            this.hero.sprite.body.removeCollisionGroup(this.npc_collision_groups[collide_index], true);
        }
        if (map_collider_layer in this.npc_collision_groups) {
            this.hero.sprite.body.collides(this.npc_collision_groups[map_collider_layer]);
        }

        for (let collide_index in this.interactable_objs_collision_groups) {
            this.hero.sprite.body.removeCollisionGroup(this.interactable_objs_collision_groups[collide_index], true);
        }
        if (map_collider_layer in this.interactable_objs_collision_groups) {
            this.hero.sprite.body.collides(this.interactable_objs_collision_groups[map_collider_layer]);
        }

        for (let i = 0; i < npc_group.children.length; ++i) {
            const sprite = npc_group.children[i];
            if (!sprite.is_npc && !sprite.is_interactable_object) continue;
            if (!sprite.body) continue;
            sprite.body.collides(this.hero_collision_group);
        }
        this.hero.sprite.body.collides(this.dynamic_events_collision_group);
    }

    config_collision_change(current_event) {
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
        this.waiting_to_change_collision = true;
        this.collision_event_data = {
            x: current_event.x,
            y: current_event.y,
            next_x: next_x,
            next_y: next_y,
            dest_collider_layer: current_event.dest_collider_layer,
            event: current_event
        };
    }

    change_map_body(data, new_collider_layer_index) {
        if (data.map_collider_layer === new_collider_layer_index) return;
        data.map_collider_layer = new_collider_layer_index;
        this.hero.shadow.base_collider_layer = data.map_collider_layer;
        this.hero.sprite.base_collider_layer = data.map_collider_layer;
        maps[data.map_name].config_body(this, new_collider_layer_index);
        this.config_collision_groups(maps[data.map_name]);
        this.config_collisions(maps[data.map_name], data.map_collider_layer, data.npc_group);
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

    do_collision_change(data) {
        if (data.hero.tile_x_pos === this.collision_event_data.next_x && data.hero.tile_y_pos === this.collision_event_data.next_y) {
            this.change_map_body(data, this.collision_event_data.dest_collider_layer);
            this.waiting_to_change_collision = false;
        } else if (data.hero.tile_x_pos !== this.collision_event_data.event.x || data.hero.tile_y_pos !== this.collision_event_data.event.y) {
            this.waiting_to_change_collision = false;
        }
    }
}
