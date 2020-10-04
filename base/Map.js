import { base_actions, directions, map_directions } from "./utils.js";
import { NPC_Sprite, NPC, npc_movement_types } from './NPC.js';
import { InteractableObjects, InteractableObjects_Sprite, interactable_object_interaction_types } from "./InteractableObjects.js";
import { TileEvent, event_types as tile_event_types } from './tile_events/TileEvent.js';
import * as numbers from "./magic_numbers.js";
import { JumpEvent } from "./tile_events/JumpEvent.js";
import { TeleportEvent } from "./tile_events/TeleportEvent.js";
import { ClimbEvent } from "./tile_events/ClimbEvent.js";
import { StepEvent } from "./tile_events/StepEvent.js";
import { CollisionEvent } from "./tile_events/CollisionEvent.js";
import { SpeedEvent } from "./tile_events/SpeedEvent.js";
import { GameEvent } from "./game_events/GameEvent.js";

export class Map {
    constructor (
        game,
        data,
        name,
        key_name,
        tileset_name,
        physics_names,
        tileset_image_url,
        tileset_json_url,
        physics_jsons_url,
        lazy_load
    ) {
        this.game = game;
        this.data = data;
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
        this.color_filter = this.game.add.filter('ColorFilters');
        this.collision_layer = null;
        this.show_footsteps = false;
        this.assets_loaded = false;
        this.lazy_load = lazy_load === undefined ? false : lazy_load;
    }

    sort_sprites() {
        let send_to_back_list = new Array(this.data.npc_group.children.length);
        let send_to_front_list = new Array(this.data.npc_group.children.length);
        let has_sort_function = new Array(this.data.npc_group.children.length);
        this.data.npc_group.children.forEach((sprite, index) => {
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
        this.data.npc_group.sort('y_sort', Phaser.Group.SORT_ASCENDING);
        let shadow_index = this.data.npc_group.getChildIndex(this.data.hero.sprite) - 1;
        if (shadow_index >= -1 && shadow_index < this.data.npc_group.children.length) {
            if (shadow_index === -1) {
                shadow_index = 0;
            }
            this.data.npc_group.setChildIndex(this.data.hero.shadow, shadow_index); //making sure that shadow is always behind the hero
        }
        send_to_back_list.forEach(sprite => {
            if (sprite) {
                this.data.npc_group.sendChildToBack(sprite);
            }
        });
        send_to_front_list.forEach(sprite => {
            if (sprite) {
                this.data.npc_group.bringChildToTop(sprite);
            }
        });
        has_sort_function.forEach(sprite => {
            if (sprite) {
                sprite.sort_function();
            }
        });
    }

    freeze_body() {
        this.collision_sprite.body.velocity.y = this.collision_sprite.body.velocity.x = 0; //fixes map body
    }

    update() {
        this.freeze_body();
        this.npcs.forEach(npc => npc.update());
        this.sort_sprites();
    }

    load_map_assets(force_load, on_complete) {
        let load_tilemap_promise_resolve;
        let load_tilemap_promise = new Promise(resolve => {
            load_tilemap_promise_resolve = resolve;
        });
        this.game.load.tilemap(this.key_name, this.tileset_json_url, null, Phaser.Tilemap.TILED_JSON).onLoadComplete.addOnce(load_tilemap_promise_resolve);

        let load_image_promise_resolve;
        let load_image_promise = new Promise(resolve => {
            load_image_promise_resolve = resolve;
        });
        this.game.load.image(this.key_name, this.tileset_image_url).onLoadComplete.addOnce(load_image_promise_resolve);

        let physics_promises = [];
        for (let i = 0; i < this.physics_names.length; ++i) {
            let load_physics_promise_resolve;
            let load_physics_promise = new Promise(resolve => {
                load_physics_promise_resolve = resolve;
            });
            physics_promises.push(load_physics_promise);
            this.game.load.physics(this.physics_names[i], this.physics_jsons_url[i]).onLoadComplete.addOnce(load_physics_promise_resolve);
        }
        if (force_load) {
            Promise.all([load_tilemap_promise, load_image_promise, ...physics_promises]).then(() => {
                this.assets_loaded = true;
                on_complete();
            });
            this.game.load.start();
        }
    }

    config_body(collision_obj, collision_layer) {
        this.game.physics.p2.enable(this.collision_sprite, false);
        this.collision_sprite.body.clearShapes();
        this.collision_sprite.body.loadPolygon( //load map physics data json files
            this.physics_names[collision_layer], 
            this.physics_names[collision_layer]
        );
        this.collision_sprite.body.setCollisionGroup(collision_obj.map_collision_group);
        this.collision_sprite.body.damping = numbers.MAP_DAMPING;
        this.collision_sprite.body.angularDamping = numbers.MAP_DAMPING;
        this.collision_sprite.body.setZeroRotation();
        this.collision_sprite.body.dynamic = false;
        this.collision_sprite.body.static = true;
    }

    config_all_bodies(collision_obj, collision_layer) {
        this.npcs.forEach(npc => npc.config_body(collision_obj));
        this.interactable_objects.forEach(interactable_obj => interactable_obj.config_body(collision_obj));
        this.config_body(collision_obj, collision_layer);
    }

    get_current_tile(controllable_char, layer) {
        if (layer !== undefined) {
            return this.sprite.getTile(controllable_char.tile_x_pos, controllable_char.tile_y_pos, layer);
        } else {
            return this.layers.map(layer => this.sprite.getTile(controllable_char.tile_x_pos, controllable_char.tile_y_pos, layer.name)).filter(tile => tile);
        }
    }

    get_layer(name) {
        return _.find(this.layers, {name: name});
    }

    create_tile_events(raw_property) {
        const property_info = JSON.parse(raw_property);
        const this_event_location_key = TileEvent.get_location_key(property_info.x, property_info.y);
        if (!(this_event_location_key in this.events)) {
            this.events[this_event_location_key] = [];
        }
        if (property_info.type === tile_event_types.CLIMB) {
            const new_event = new ClimbEvent(
                this.game,
                this.data,
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
                this.game,
                this.data,
                property_info.x,
                property_info.y,
                map_directions(property_info.activation_directions),
                property_info.activation_collision_layers ? property_info.activation_collision_layers : [0],
                false,
                property_info.active === undefined ? true : property_info.active,
                property_info.speed
            );
            this.events[this_event_location_key].push(new_event);
        } else if (property_info.type === tile_event_types.TELEPORT) {
            const new_event = new TeleportEvent(
                this.game,
                this.data,
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
                this.game,
                this.data,
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
                this.game,
                this.data,
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
                this.game,
                this.data,
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

    create_npcs(raw_property) {
        const property_info = JSON.parse(raw_property);
        const initial_action = this.data.dbs.npc_db[property_info.key_name].initial_action;
        this.npcs.push(new NPC(
            this.game,
            this.data,
            property_info.key_name,
            property_info.initial_x,
            property_info.initial_y,
            initial_action,
            this.data.dbs.npc_db[property_info.key_name].actions[initial_action].initial_direction,
            property_info.enable_footsteps,
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

    create_interactable_objects(raw_property) {
        const property_info = JSON.parse(raw_property);
        const interactable_object = new InteractableObjects(
            this.game,
            this.data,
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
        for (let psynergy_key in data.dbs.interactable_objects_db[property_info.key_name].psynergy_keys) {
            const psynergy_properties = data.dbs.interactable_objects_db[property_info.key_name].psynergy_keys[psynergy_key];
            if (psynergy_properties.interaction_type === interactable_object_interaction_types.ONCE) {
                interactable_object.custom_data[psynergy_key + "_casted"] = false;
            }
        }
        if (data.dbs.interactable_objects_db[property_info.key_name].pushable && property_info.block_stair_collider_layer_shift !== undefined) {
            interactable_object.custom_data.block_stair_collider_layer_shift = property_info.block_stair_collider_layer_shift;
        }
    }

    async config_interactable_object() {
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
                this.data.dbs.interactable_objects_db[interactable_object.key_name].spritesheet.image,
                this.data.dbs.interactable_objects_db[interactable_object.key_name].spritesheet.json
            );
            interactable_obj_sprite_info.setActionDirections(
                action, 
                this.data.dbs.interactable_objects_db[interactable_object.key_name].actions.animations,
                this.data.dbs.interactable_objects_db[interactable_object.key_name].actions.frames_count
            );
            interactable_obj_sprite_info.setActionFrameRate(action, this.data.dbs.interactable_objects_db[interactable_object.key_name].actions.frame_rate);
            interactable_obj_sprite_info.setActionLoop(action, this.data.dbs.interactable_objects_db[interactable_object.key_name].actions.loop)
            interactable_obj_sprite_info.generateAllFrames();
            await new Promise(resolve => {
                interactable_obj_sprite_info.loadSpritesheets(this.game, true, () => {
                    interactable_object.initial_config(this.sprite);
                    interactable_object.initialize_related_events(this.events, this);
                    resolve();
                });
            });
        }
    }

    async config_npc() {
        for (let i = 0; i < this.npcs.length; ++i) {
            const npc = this.npcs[i];
            const npc_db = this.data.dbs.npc_db[npc.key_name];
            let actions = [];
            if (npc.movement_type === npc_movement_types.IDLE) {
                actions = [base_actions.IDLE];
            }
            const npc_sprite_info = new NPC_Sprite(npc.key_name, actions);
            for (let j = 0; j < actions.length; ++j) {
                const action = actions[j];
                npc_sprite_info.setActionSpritesheet(
                    action,
                    `assets/images/spritesheets/npc/${npc.key_name}_${action}.png`,
                    `assets/images/spritesheets/npc/${npc.key_name}_${action}.json`
                );
                npc_sprite_info.setActionDirections(
                    action,
                    npc_db.actions[action].directions,
                    npc_db.actions[action].frames_count
                );
                npc_sprite_info.setActionFrameRate(action, npc_db.actions[action].frame_rate);
                npc_sprite_info.setActionLoop(action, npc_db.actions[action].loop);
            }
            npc_sprite_info.generateAllFrames();
            await new Promise(resolve => {
                npc_sprite_info.loadSpritesheets(this.game, true, () => {
                    npc.set_shadow(npc_db.shadow_key, this.data.npc_group, npc.base_collider_layer, npc_db.shadow_anchor_x, npc_db.shadow_anchor_y);
                    npc.set_sprite(this.data.npc_group, npc_sprite_info, this.sprite, npc.base_collider_layer, npc_db.anchor_x, npc_db.anchor_y);
                    npc.set_sprite_as_npc();
                    npc.play();
                    resolve();
                });
            });
        }
    }

    config_layers(overlayer_group, underlayer_group) {
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
            is_over = is_over.length > this.collision_layer ? is_over[this.collision_layer] | 0 : is_over[0] | 0;
            if (is_over !== 0) {
                overlayer_group.add(layer);
            } else {
                underlayer_group.add(layer);
            }
        }
    }

    async mount_map(collision_layer) {
        if (!this.assets_loaded) {
            let load_promise_resolve;
            const load_promise = new Promise(resolve => load_promise_resolve = resolve);
            this.load_map_assets(true, load_promise_resolve);
            await load_promise;
        }
        this.collision_layer = collision_layer;
        this.events = {};
        TileEvent.reset();
        GameEvent.reset();
        this.sprite = this.game.add.tilemap(this.key_name);
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
                this.create_npcs(raw_property);
            } else if(property.startsWith("interactable_object")) {
                this.create_interactable_objects(raw_property);
            }
        }

        this.layers = this.sprite.layers.sort((a, b) => {
            if (a.properties.over !== b.properties.over) return a - b;
            if (a.properties.z !== b.properties.z) return a - b;
        });

        this.config_layers(this.data.overlayer_group, this.data.underlayer_group);
        await this.config_interactable_object();
        await this.config_npc();

        if (this.sprite.properties.footprint) {
            this.show_footsteps = true;
        }

        return this;
    }

    unset_map() {
        this.data.underlayer_group.removeAll();
        this.data.overlayer_group.removeAll();

        this.collision_sprite.body.clearShapes();

        if (this.show_footsteps) {
            this.data.hero.footsteps.clean_all();
        }

        let sprites_to_remove = []
        for (let i = 0; i < this.data.npc_group.children.length; ++i) {
            let sprite = this.data.npc_group.children[i];
            if (!sprite.is_npc && !sprite.is_interactable_object) continue;
            if (sprite.is_interactable_object && sprite.interactable_object.custom_data.blocking_stair_block) {
                sprite.interactable_object.custom_data.blocking_stair_block.destroy();
                sprite.interactable_object.custom_data.blocking_stair_block = undefined;
            }
            sprites_to_remove.push(sprite);
        }
        for (let i = 0; i < sprites_to_remove.length; ++i) {
            let sprite = sprites_to_remove[i];
            this.data.npc_group.remove(sprite, true);
        }

        this.npcs = [];
        this.interactable_objects = [];
        this.data.npc_group.removeAll();
        this.data.npc_group.add(this.data.hero.shadow);
        this.data.npc_group.add(this.data.hero.sprite);
    }
}
