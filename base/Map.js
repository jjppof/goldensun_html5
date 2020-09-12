import { directions, map_directions } from "../utils.js";
import { NPC_Sprite, NPC, npc_movement_types } from './NPC.js';
import { InteractableObjects, InteractableObjects_Sprite, interactable_object_interaction_types } from "./InteractableObjects.js";
import {
    TileEvent,
    StairEvent,
    SpeedEvent,
    DoorEvent,
    JumpEvent,
    StepEvent,
    CollisionEvent,
    event_types as tile_event_types
} from './TileEvent.js';
import { GameEvent } from "./GameEvent.js";
import * as numbers from "../magic_numbers.js";

export class Map {
    constructor (
        game,
        name,
        key_name,
        tileset_name,
        physics_names,
        tileset_image_url,
        tileset_json_url,
        physics_jsons_url
    ) {
        this.game = game;
        this.name = name;
        this.key_name = key_name;
        this.tileset_name = tileset_name;
        this.physics_names = physics_names;
        this.tileset_image_url = tileset_image_url;
        this.tileset_json_url = tileset_json_url;
        this.physics_jsons_url = physics_jsons_url;
        this.sprite = null;
        this.events = {};
        this.npcs = [];
        this.interactable_objects = [];
        this.collision_layers_number = this.physics_names.length;
        this.collision_sprite = this.game.add.sprite(0, 0);
        this.collision_sprite.width = this.collision_sprite.height = 0;
    }

    sort_sprites(data) {
        let send_to_back_list = new Array(data.npc_group.children.length);
        let send_to_front_list = new Array(data.npc_group.children.length);
        let has_sort_function = new Array(data.npc_group.children.length);
        data.npc_group.children.forEach((sprite, index) => {
            sprite.y_sort = (sprite.base_collider_layer.toString() + sprite.y.toString()) | 0;
            if (sprite.sort_function) {
                has_sort_function[index] = sprite;
                return;
            } else if (sprite.send_to_back) {
                send_to_back_list[index] = sprite;
                return;
            } else if (sprite.send_to_front) {
                send_to_front_list[index] = sprite;
                return;
            }
        });
        data.npc_group.sort('y_sort', Phaser.Group.SORT_ASCENDING);
        let shadow_index = data.npc_group.getChildIndex(data.hero.sprite) - 1;
        if (shadow_index >= -1 && shadow_index < data.npc_group.children.length) {
            if (shadow_index === -1) {
                shadow_index = 0;
            }
            data.npc_group.setChildIndex(data.hero.shadow, shadow_index); //making sure that shadow is always behind the hero
        }
        send_to_back_list.forEach(sprite => {
            if (sprite) {
                data.npc_group.sendChildToBack(sprite);
            }
        });
        send_to_front_list.forEach(sprite => {
            if (sprite) {
                data.npc_group.bringChildToTop(sprite);
            }
        });
        has_sort_function.forEach(sprite => {
            if (sprite) {
                sprite.sort_function();
            }
        });
    }

    load_map_assets(game, force_load, on_complete) {
        let load_tilemap_promise_resolve;
        let load_tilemap_promise = new Promise(resolve => {
            load_tilemap_promise_resolve = resolve;
        });
        game.load.tilemap(this.key_name, this.tileset_json_url, null, Phaser.Tilemap.TILED_JSON).onLoadComplete.addOnce(load_tilemap_promise_resolve, this);

        let load_image_promise_resolve;
        let load_image_promise = new Promise(resolve => {
            load_image_promise_resolve = resolve;
        });
        game.load.image(this.key_name, this.tileset_image_url).onLoadComplete.addOnce(load_image_promise_resolve, this);

        let physics_promises = [];
        for (let i = 0; i < this.physics_names.length; ++i) {
            let load_physics_promise_resolve;
            let load_physics_promise = new Promise(resolve => {
                load_physics_promise_resolve = resolve;
            });
            physics_promises.push(load_physics_promise);
            game.load.physics(this.physics_names[i], this.physics_jsons_url[i]).onLoadComplete.addOnce(load_physics_promise_resolve, this);
        }
        if (force_load) {
            Promise.all([load_tilemap_promise, load_image_promise, ...physics_promises]).then(on_complete);
            game.load.start();
        }
    }

    config_body(collision_obj, map_collider_layer) {
        this.game.physics.p2.enable(this.collision_sprite, false);
        this.collision_sprite.body.clearShapes();
        this.collision_sprite.body.loadPolygon( //load map physics data json files
            this.physics_names[map_collider_layer], 
            this.physics_names[map_collider_layer]
        );
        this.collision_sprite.body.setCollisionGroup(collision_obj.map_collision_group);
        this.collision_sprite.body.damping = numbers.MAP_DAMPING;
        this.collision_sprite.body.angularDamping = numbers.MAP_DAMPING;
        this.collision_sprite.body.setZeroRotation();
        this.collision_sprite.body.dynamic = false;
        this.collision_sprite.body.static = true;
    }

    config_all_bodies(collision_obj, map_collider_layer) {
        this.npcs.forEach(npc => npc.config_body(collision_obj));
        this.interactable_objects.forEach(interactable_obj => interactable_obj.config_body(collision_obj));
        this.config_body(collision_obj, map_collider_layer);
    }

    create_tile_events(raw_property) {
        const property_info = JSON.parse(raw_property);
        const this_event_location_key = TileEvent.get_location_key(property_info.x, property_info.y);
        if (!(this_event_location_key in this.events)) {
            this.events[this_event_location_key] = [];
        }
        if (property_info.type === tile_event_types.STAIR) {
            const new_event = new StairEvent(
                property_info.x,
                property_info.y,
                map_directions(property_info.activation_directions),
                property_info.activation_collision_layers ? property_info.activation_collision_layers : [0],
                false,
                property_info.active === undefined ? true : property_info.active,
                property_info.change_to_collision_layer === undefined ? null : property_info.change_to_collision_layer
            );
            this.events[this_event_location_key].push(new_event);
        } else if (property_info.type === tile_event_types.SPEED) {
            const new_event = new SpeedEvent(
                property_info.x,
                property_info.y,
                map_directions(property_info.activation_directions),
                property_info.activation_collision_layers ? property_info.activation_collision_layers : [0],
                false,
                property_info.active === undefined ? true : property_info.active,
                property_info.speed
            );
            this.events[this_event_location_key].push(new_event);
        } else if (property_info.type === tile_event_types.DOOR) {
            const new_event = new DoorEvent(
                property_info.x,
                property_info.y,
                map_directions(property_info.activation_directions),
                property_info.activation_collision_layers ? property_info.activation_collision_layers : [0],
                false,
                property_info.active === undefined ? true : property_info.active,
                property_info.target,
                property_info.x_target,
                property_info.y_target,
                property_info.advance_effect,
                property_info.dest_collider_layer ? property_info.dest_collider_layer : 0
            );
            this.events[this_event_location_key].push(new_event);
        } else if (property_info.type === tile_event_types.JUMP) {
            const new_event = new JumpEvent(
                property_info.x,
                property_info.y,
                map_directions(property_info.activation_directions),
                property_info.activation_collision_layers ? property_info.activation_collision_layers : [0],
                false,
                property_info.initially_active === undefined ? true : property_info.initially_active,
                property_info.is_set === undefined ? true : property_info.is_set
            );
            this.events[this_event_location_key].push(new_event);
        } else if (property_info.type === tile_event_types.STEP) {
            const new_event = new StepEvent(
                property_info.x,
                property_info.y,
                map_directions(property_info.activation_directions),
                property_info.activation_collision_layers ? property_info.activation_collision_layers : [0],
                false,
                property_info.active === undefined ? true : property_info.active,
                directions[property_info.step_direction]
            );
            this.events[this_event_location_key].push(new_event);
        } else if (property_info.type === tile_event_types.COLLISION) {
            const new_event = new CollisionEvent(
                property_info.x,
                property_info.y,
                map_directions(property_info.activation_directions),
                property_info.activation_collision_layers ? property_info.activation_collision_layers : [0],
                false,
                property_info.active === undefined ? true : property_info.active,
                property_info.dest_collider_layer
            );
            this.events[this_event_location_key].push(new_event);
        }
    }

    create_npcs(game, data, raw_property) {
        const property_info = JSON.parse(raw_property);
        this.npcs.push(new NPC(
            game,
            data,
            property_info.key_name,
            property_info.initial_x,
            property_info.initial_y,
            property_info.shadow_anchor_point.x,
            property_info.shadow_anchor_point.y,
            property_info.npc_type,
            property_info.movement_type,
            property_info.message,
            property_info.thought_message,
            property_info.avatar ? property_info.avatar : null,
            property_info.base_collider_layer === undefined ? 0 : property_info.base_collider_layer,
            property_info.talk_range_factor,
            property_info.events === undefined ? [] : property_info.events
        ));
    }

    create_interactable_objects(game, data, raw_property) {
        const property_info = JSON.parse(raw_property);
        const interactable_object = new InteractableObjects(
            game,
            data,
            property_info.key_name,
            property_info.x,
            property_info.y,
            property_info.allowed_tiles === undefined ? [] : property_info.allowed_tiles,
            property_info.base_collider_layer === undefined ? 0 : property_info.base_collider_layer,
            property_info.collider_layer_shift,
            property_info.not_allowed_tiles,
            property_info.object_drop_tiles,
            property_info.intermediate_collider_layer_shift
        );
        this.interactable_objects.push(interactable_object);
        for (let psynergy_key in data.interactable_objects_db[property_info.key_name].psynergy_keys) {
            const psynergy_properties = data.interactable_objects_db[property_info.key_name].psynergy_keys[psynergy_key];
            if (psynergy_properties.interaction_type === interactable_object_interaction_types.ONCE) {
                interactable_object.custom_data[psynergy_key + "_casted"] = false;
            }
        }
        if (data.interactable_objects_db[property_info.key_name].pushable && property_info.block_stair_collider_layer_shift !== undefined) {
            interactable_object.custom_data.block_stair_collider_layer_shift = property_info.block_stair_collider_layer_shift;
        }
    }

    async config_interactable_object(game, data) {
        for (let i = 0; i < this.interactable_objects.length; ++i) {
            const interactable_object = this.interactable_objects[i];
            const action = interactable_object.key_name;
            let interactable_obj_sprite_info = new InteractableObjects_Sprite(
                interactable_object.key_name,
                [action]
            );
            interactable_object.sprite_info = interactable_obj_sprite_info;
            interactable_obj_sprite_info.setActionSpritesheet(
                action,
                data.interactable_objects_db[interactable_object.key_name].spritesheet.image,
                data.interactable_objects_db[interactable_object.key_name].spritesheet.json
            );
            interactable_obj_sprite_info.setActionDirections(
                action, 
                data.interactable_objects_db[interactable_object.key_name].actions.animations,
                data.interactable_objects_db[interactable_object.key_name].actions.frames_count
            );
            interactable_obj_sprite_info.setActionFrameRate(action, data.interactable_objects_db[interactable_object.key_name].actions.frame_rate);
            interactable_obj_sprite_info.generateAllFrames();
            await new Promise(resolve => {
                interactable_obj_sprite_info.loadSpritesheets(game, true, () => {
                    interactable_object.initial_config(this.sprite);
                    interactable_object.initialize_related_events(this.events, this.key_name);
                    resolve();
                });
            });
        }
    }

    async config_npc(game, data) {
        for (let i = 0; i < this.npcs.length; ++i) {
            const npc = this.npcs[i];
            let actions = [];
            if (npc.movement_type === npc_movement_types.IDLE) {
                actions = ['idle'];
            }
            const npc_sprite_info = new NPC_Sprite(npc.key_name, actions);
            npc.sprite_info = npc_sprite_info;
            for (let j = 0; j < actions.length; ++j) {
                const action = actions[j];
                npc_sprite_info.setActionSpritesheet(
                    action,
                    `assets/images/spritesheets/npc/${npc.key_name}_${action}.png`,
                    `assets/images/spritesheets/npc/${npc.key_name}_${action}.json`
                );
                npc_sprite_info.setActionDirections(
                    action, 
                    data.npc_db[npc.key_name].actions[action].directions,
                    data.npc_db[npc.key_name].actions[action].frames_count
                );
                npc_sprite_info.setActionFrameRate(action, data.npc_db[npc.key_name].actions[action].frame_rate);
            }
            npc_sprite_info.generateAllFrames();
            await new Promise(resolve => {
                npc_sprite_info.loadSpritesheets(game, true, () => {
                    npc.initial_config(this.sprite);
                    resolve();
                });
            });
        }
    }

    config_layers(data) {
        for (let i = 0; i < this.layers.length; ++i) {
            let layer = this.sprite.createLayer(this.layers[i].name);
            this.layers[i].sprite = layer;
            this.layers[i].sprite.layer_z = this.layers[i].properties.z;
            layer.resizeWorld();
            if (this.layers[i].properties.blendMode !== undefined) {
                layer.blendMode = PIXI.blendModes[this.layers[i].properties.blendMode];
            }
            if (this.layers[i].alpha !== undefined) {
                layer.alpha = this.layers[i].alpha;
            }

            let is_over = this.layers[i].properties.over.toString().split(",");
            is_over = is_over.length > data.map_collider_layer ? is_over[data.map_collider_layer] | 0 : is_over[0] | 0;
            if (is_over !== 0) {
                data.overlayer_group.add(layer);
            } else {
                data.underlayer_group.add(layer);
            }
        }
    }

    async mount_map(game, data) {
        this.events = {};
        TileEvent.reset();
        GameEvent.reset();
        this.sprite = game.add.tilemap(this.key_name);
        this.sprite.addTilesetImage(this.tileset_name, this.key_name);

        for (let i = 0; i < this.sprite.tilesets.length; ++i) {
            const tileset = this.sprite.tilesets[i];
            for (let tile_index in tileset.tileProperties) {
                tileset.tileProperties[tile_index].index = tile_index;
            }
        }

        for (let property in this.sprite.properties) {
            const raw_property = this.sprite.properties[property];
            if (property.startsWith("event")) {
                this.create_tile_events(raw_property);
            } else if(property.startsWith("npc")) {
                this.create_npcs(game, data, raw_property);
            } else if(property.startsWith("interactable_object")) {
                this.create_interactable_objects(game, data, raw_property);
            }
        }

        this.layers = this.sprite.layers.sort((a, b) => {
            if (a.properties.over !== b.properties.over) return a - b;
            if (a.properties.z !== b.properties.z) return a - b;
        });

        this.config_layers(data);
        await this.config_interactable_object(game, data);
        await this.config_npc(game, data);
    }

    unset_map(data) {
        data.underlayer_group.removeAll();
        data.overlayer_group.removeAll();

        this.collision_sprite.body.clearShapes();

        let sprites_to_remove = []
        for (let i = 0; i < data.npc_group.children.length; ++i) {
            let sprite = data.npc_group.children[i];
            if (!sprite.is_npc && !sprite.is_interactable_object) continue;
            if (sprite.is_interactable_object && sprite.interactable_object.custom_data.blocking_stair_block) {
                sprite.interactable_object.custom_data.blocking_stair_block.destroy();
                sprite.interactable_object.custom_data.blocking_stair_block = undefined;
            }
            sprites_to_remove.push(sprite);
        }
        for (let i = 0; i < sprites_to_remove.length; ++i) {
            let sprite = sprites_to_remove[i];
            data.npc_group.remove(sprite, true);
        }

        this.npcs = [];
        this.interactable_objects = [];
        data.npc_group.removeAll();
        data.npc_group.add(data.hero.shadow);
        data.npc_group.add(data.hero.sprite);
    }
}
