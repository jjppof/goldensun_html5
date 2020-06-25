import { u, get_surroundings } from "../utils.js";
import { NPC_Sprite, NPC } from './NPC.js';
import { InteractableObjects, InteractableObjects_Sprite, interactable_object_event_types, interactable_object_types } from "./InteractableObjects.js";
import * as numbers from '../magic_numbers.js';
import {
    TileEvent,
    StairEvent,
    SpeedEvent,
    DoorEvent,
    JumpEvent,
    StepEvent,
    CollisionEvent,
    event_types
} from './TileEvent.js';

export class Map {
    constructor (
        name,
        key_name,
        tileset_name,
        physics_names,
        tileset_image_url,
        tileset_json_url,
        physics_jsons_url
    ) {
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
    }

    loadMapAssets(game, force_load, on_complete) {
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

    async setLayers(game, data, maps, npc_db, interactable_objects_db, map_name, underlayer_group, overlayer_group, collider_layer, npc_group) {
        this.events = {};
        TileEvent.reset();
        this.sprite = game.add.tilemap(this.key_name);
        this.sprite.addTilesetImage(this.tileset_name, this.key_name);

        for (let tile_index in maps[map_name].sprite.tilesets[0].tileProperties) {
            maps[map_name].sprite.tilesets[0].tileProperties[tile_index].index = tile_index;
        }

        for (let property in this.sprite.properties) {
            if (property.startsWith("event")) { //check for events
                const property_info = JSON.parse(this.sprite.properties[property]);
                const this_event_location_key = TileEvent.get_location_key(property_info.x, property_info.y);
                if (!(this_event_location_key in this.events)) {
                    this.events[this_event_location_key] = [];
                }
                if (property_info.type === event_types.STAIR) {
                    const new_event = new StairEvent(
                        property_info.x,
                        property_info.y,
                        property_info.activation_directions,
                        property_info.activation_collision_layers ? property_info.activation_collision_layers : [0],
                        false,
                        property_info.active === undefined ? true : property_info.active,
                        property_info.change_to_collision_layer === undefined ? null : property_info.change_to_collision_layer
                    );
                    this.events[this_event_location_key].push(new_event);
                } else if (property_info.type === event_types.SPEED) {
                    const new_event = new SpeedEvent(
                        property_info.x,
                        property_info.y,
                        property_info.activation_directions,
                        property_info.activation_collision_layers ? property_info.activation_collision_layers : [0],
                        false,
                        property_info.active === undefined ? true : property_info.active,
                        property_info.speed
                    );
                    this.events[this_event_location_key].push(new_event);
                } else if (property_info.type === event_types.DOOR) {
                    const new_event = new DoorEvent(
                        property_info.x,
                        property_info.y,
                        property_info.activation_directions,
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
                } else if (property_info.type === event_types.JUMP) {
                    const new_event = new JumpEvent(
                        property_info.x,
                        property_info.y,
                        property_info.activation_directions,
                        property_info.activation_collision_layers ? property_info.activation_collision_layers : [0],
                        false,
                        property_info.initially_active === undefined ? true : property_info.initially_active,
                        property_info.is_set === undefined ? true : property_info.is_set
                    );
                    this.events[this_event_location_key].push(new_event);
                } else if (property_info.type === event_types.STEP) {
                    const new_event = new StepEvent(
                        property_info.x,
                        property_info.y,
                        property_info.activation_directions,
                        property_info.activation_collision_layers ? property_info.activation_collision_layers : [0],
                        false,
                        property_info.active === undefined ? true : property_info.active,
                        property_info.step_direction
                    );
                    this.events[this_event_location_key].push(new_event);
                } else if (property_info.type === event_types.COLLISION) {
                    const new_event = new CollisionEvent(
                        property_info.x,
                        property_info.y,
                        property_info.activation_directions,
                        property_info.activation_collision_layers ? property_info.activation_collision_layers : [0],
                        false,
                        property_info.active === undefined ? true : property_info.active,
                        property_info.dest_collider_layer
                    );
                    this.events[this_event_location_key].push(new_event);
                }
            } else if(property.startsWith("npc")) {
                const property_info = JSON.parse(this.sprite.properties[property]);
                this.npcs.push(new NPC(
                    property_info.type,
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
                    property_info.talk_range_factor === undefined ? numbers.NPC_TALK_RANGE : property_info.talk_range_factor
                ));
            } else if(property.startsWith("interactable_object")) {
                const property_info = JSON.parse(this.sprite.properties[property]);
                const interactable_object = new InteractableObjects(
                    game,
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
                if (data.interactable_objects_db[property_info.key_name].type === interactable_object_types.FROST) {
                    interactable_object.custom_data.frost_casted = false;
                }
                if (data.interactable_objects_db[property_info.key_name].type === interactable_object_types.GROWTH) {
                    interactable_object.custom_data.growth_casted = false;
                }
                if (data.interactable_objects_db[property_info.key_name].type === interactable_object_types.MOVE && property_info.block_stair_collider_layer_shift !== undefined) {
                    interactable_object.custom_data.block_stair_collider_layer_shift = property_info.block_stair_collider_layer_shift;
                }
            }
        }

        this.layers = this.sprite.layers.sort(function(a, b) {
            if (a.properties.over != b.properties.over) return a - b;
            if (a.properties.z != b.properties.z) return a - b;
        });

        for (let i = 0; i < this.layers.length; ++i) {
            let layer = this.sprite.createLayer(this.layers[i].name);
            this.layers[i].sprite = layer;
            this.layers[i].sprite.layer_z = this.layers[i].properties.z;
            layer.resizeWorld();
            layer.blendMode = PIXI.blendModes[this.layers[i].properties.blendMode];
            layer.alpha = this.layers[i].alpha;

            let is_over = this.layers[i].properties.over.toString().split(",");
            is_over = is_over.length > collider_layer ? parseInt(is_over[collider_layer]) : parseInt(is_over[0]);
            if (is_over !== 0)
                overlayer_group.add(layer);
            else
                underlayer_group.add(layer);
        }

        for (let i = 0; i < this.interactable_objects.length; ++i) {
            let interactable_object_info = this.interactable_objects[i];
            const action = interactable_object_info.key_name;
            let pynergy_item = new InteractableObjects_Sprite(
                interactable_object_info.key_name,
                [action]
            );
            pynergy_item.setActionSpritesheet(
                action,
                `assets/images/spritesheets/interactable_objects/psynergy_${interactable_objects_db[interactable_object_info.key_name].type}.png`,
                `assets/images/spritesheets/interactable_objects/psynergy_${interactable_objects_db[interactable_object_info.key_name].type}.json`
            );
            pynergy_item.setActionDirections(
                action, 
                interactable_objects_db[interactable_object_info.key_name].actions.animations,
                interactable_objects_db[interactable_object_info.key_name].actions.frames_count
            );
            pynergy_item.setActionFrameRate(action, interactable_objects_db[interactable_object_info.key_name].actions.frame_rate);
            pynergy_item.addAnimations();
            await new Promise(resolve => {
                pynergy_item.loadSpritesheets(game, true, () => {
                    let interactable_object_sprite = npc_group.create(0, 0, interactable_object_info.key_name + "_" + action);
                    interactable_object_info.set_sprite(interactable_object_sprite);
                    interactable_object_info.interactable_object_sprite.is_interactable_object = true;
                    interactable_object_info.interactable_object_sprite.roundPx = true;
                    interactable_object_info.interactable_object_sprite.base_collider_layer = interactable_object_info.base_collider_layer;
                    interactable_object_info.interactable_object_sprite.interactable_object = interactable_object_info;
                    if (interactable_objects_db[interactable_object_info.key_name].send_to_back !== undefined) { 
                        interactable_object_info.interactable_object_sprite.send_to_back = interactable_objects_db[interactable_object_info.key_name].send_to_back;
                    }
                    if (interactable_objects_db[interactable_object_info.key_name].anchor_x !== undefined) {
                        interactable_object_info.interactable_object_sprite.anchor.x = interactable_objects_db[interactable_object_info.key_name].anchor_x;
                    }
                    interactable_object_info.interactable_object_sprite.anchor.y = interactable_objects_db[interactable_object_info.key_name].anchor_y;
                    const shift_x = interactable_objects_db[interactable_object_info.key_name].shift_x !== undefined ? interactable_objects_db[interactable_object_info.key_name].shift_x : 0;
                    const shift_y = interactable_objects_db[interactable_object_info.key_name].shift_y !== undefined ? interactable_objects_db[interactable_object_info.key_name].shift_y : 0;
                    interactable_object_info.interactable_object_sprite.centerX = (interactable_object_info.x + 1) * this.sprite.tileWidth + shift_x;
                    const anchor_shift = interactable_objects_db[interactable_object_info.key_name].anchor_y * this.sprite.tileWidth * 0.5;
                    interactable_object_info.interactable_object_sprite.centerY = interactable_object_info.y * this.sprite.tileWidth - anchor_shift + shift_y;
                    pynergy_item.setAnimation(interactable_object_info.interactable_object_sprite, action);
                    const initial_animation = interactable_objects_db[interactable_object_info.key_name].initial_animation;
                    interactable_object_info.interactable_object_sprite.animations.play(action + "_" + initial_animation);
                    const position = interactable_object_info.get_current_position(data);
                    let x_pos = position.x;
                    let y_pos = position.y;
                    const not_allowed_tile_test = (x, y) => {
                        for (let k = 0; k < interactable_object_info.not_allowed_tiles.length; ++k) {
                            const not_allowed_tile = interactable_object_info.not_allowed_tiles[k];
                            if (not_allowed_tile.x === x && not_allowed_tile.y === y) {
                                return true;
                            }
                        }
                        return false;
                    };
                    for (let j = 0; j < interactable_objects_db[interactable_object_info.key_name].events.length; ++j) {
                        const event_info = interactable_objects_db[interactable_object_info.key_name].events[j];
                        x_pos += event_info.x_shift !== undefined ? event_info.x_shift : 0;
                        y_pos += event_info.y_shift !== undefined ? event_info.y_shift : 0;
                        let collider_layer_shift = event_info.collider_layer_shift !== undefined ? event_info.collider_layer_shift : 0;
                        collider_layer_shift = interactable_object_info.collider_layer_shift !== undefined ? interactable_object_info.collider_layer_shift : collider_layer_shift;
                        interactable_object_info.collider_layer_shift = collider_layer_shift;
                        const active_event = event_info.active !== undefined ? event_info.active : true;
                        const target_layer = interactable_object_info.base_collider_layer + collider_layer_shift;
                        switch (event_info.type) {
                            case interactable_object_event_types.JUMP:
                                if (not_allowed_tile_test(x_pos, y_pos)) continue;
                                const this_event_location_key = TileEvent.get_location_key(x_pos, y_pos);
                                if (!(this_event_location_key in this.events)) {
                                    this.events[this_event_location_key] = [];
                                }
                                const new_event = new JumpEvent(
                                    x_pos,
                                    y_pos,
                                    ["up", "down", "right", "left"],
                                    [target_layer],
                                    event_info.dynamic,
                                    active_event,
                                    event_info.is_set === undefined ? true: event_info.is_set
                                );
                                this.events[this_event_location_key].push(new_event);
                                interactable_object_info.insert_event(new_event.id);
                                interactable_object_info.events_info[event_info.type] = event_info;
                                interactable_object_info.collision_change_functions.push(() => {
                                    new_event.activation_collision_layers = [interactable_object_info.base_collider_layer + interactable_object_info.collider_layer_shift];
                                });
                                break;
                            case interactable_object_event_types.JUMP_AROUND:
                                let is_set = event_info.is_set === undefined ? true: event_info.is_set;
                                get_surroundings(x_pos, y_pos).forEach((pos, index) => {
                                    if (not_allowed_tile_test(pos.x, pos.y)) return;
                                    const this_event_location_key = TileEvent.get_location_key(pos.x, pos.y);
                                    if (this_event_location_key in this.events) {
                                        //check if already theres a jump event in this place
                                        for (let k = 0; k < this.events[this_event_location_key].length; ++k) {
                                            const event = this.events[this_event_location_key][k];
                                            if (event.type === event_types.JUMP && event.is_set) {
                                                if (event.activation_collision_layers.includes(target_layer)) {
                                                    is_set = false;
                                                }
                                            }
                                        }
                                    } else {
                                        this.events[this_event_location_key] = [];
                                    }
                                    const new_event = new JumpEvent(
                                        pos.x,
                                        pos.y,
                                        ["right", "left", "down", "up"][index],
                                        [interactable_object_info.base_collider_layer],
                                        event_info.dynamic,
                                        active_event,
                                        is_set
                                    );
                                    this.events[this_event_location_key].push(new_event);
                                    interactable_object_info.insert_event(new_event.id);
                                    interactable_object_info.collision_change_functions.push(() => {
                                        new_event.activation_collision_layers = [interactable_object_info.base_collider_layer];
                                    });
                                });
                                interactable_object_info.events_info[event_info.type] = event_info;
                                break;
                            case interactable_object_event_types.STAIR:
                                const events_data = [
                                    {
                                        x: x_pos,
                                        y: y_pos + 1,
                                        activation_directions: ["up"],
                                        activation_collision_layers: [interactable_object_info.base_collider_layer],
                                        change_to_collision_layer: interactable_object_info.base_collider_layer + interactable_object_info.intermediate_collider_layer_shift,
                                        climbing_only: false,
                                        collision_change_function: (event) => {
                                            event.activation_collision_layers = [interactable_object_info.base_collider_layer];
                                            event.change_to_collision_layer = interactable_object_info.base_collider_layer + interactable_object_info.intermediate_collider_layer_shift;
                                        }
                                    },{
                                        x: x_pos,
                                        y: y_pos,
                                        activation_directions: ["down"],
                                        activation_collision_layers: [interactable_object_info.base_collider_layer + interactable_object_info.intermediate_collider_layer_shift],
                                        change_to_collision_layer: interactable_object_info.base_collider_layer,
                                        climbing_only: true,
                                        collision_change_function: (event) => {
                                            event.activation_collision_layers = [interactable_object_info.base_collider_layer + interactable_object_info.intermediate_collider_layer_shift];
                                            event.change_to_collision_layer = interactable_object_info.base_collider_layer;
                                        }
                                    },{
                                        x: x_pos,
                                        y: y_pos + event_info.last_y_shift + 1,
                                        activation_directions: ["up"],
                                        activation_collision_layers: [interactable_object_info.base_collider_layer + interactable_object_info.intermediate_collider_layer_shift],
                                        change_to_collision_layer: target_layer,
                                        climbing_only: true,
                                        collision_change_function: (event) => {
                                            event.activation_collision_layers = [interactable_object_info.base_collider_layer + interactable_object_info.intermediate_collider_layer_shift];
                                            event.change_to_collision_layer = interactable_object_info.base_collider_layer + interactable_object_info.collider_layer_shift;
                                        }
                                    },{
                                        x: x_pos,
                                        y: y_pos + event_info.last_y_shift,
                                        activation_directions: ["down"],
                                        activation_collision_layers: [target_layer],
                                        change_to_collision_layer: interactable_object_info.base_collider_layer + interactable_object_info.intermediate_collider_layer_shift,
                                        climbing_only: false,
                                        collision_change_function: (event) => {
                                            event.activation_collision_layers = [interactable_object_info.base_collider_layer + interactable_object_info.collider_layer_shift];
                                            event.change_to_collision_layer = interactable_object_info.base_collider_layer + interactable_object_info.intermediate_collider_layer_shift;
                                        }
                                    }
                                ];
                                events_data.forEach(event_data => {
                                    const this_location_key = TileEvent.get_location_key(event_data.x, event_data.y);
                                    if (!(this_location_key in this.events)) {
                                        this.events[this_location_key] = [];
                                    }
                                    const new_event = new StairEvent(event_data.x, event_data.y,
                                        event_data.activation_directions,
                                        event_data.activation_collision_layers,
                                        event_info.dynamic,
                                        active_event,
                                        event_data.change_to_collision_layer,
                                        event_info.is_set,
                                        interactable_object_info,
                                        event_data.climbing_only
                                    );
                                    this.events[this_location_key].push(new_event);
                                    interactable_object_info.insert_event(new_event.id);
                                    interactable_object_info.collision_change_functions.push(event_data.collision_change_function.bind(null, new_event));
                                });
                                interactable_object_info.events_info[event_info.type] = event_info;
                                break;
                        }
                    }
                    resolve();
                });
            });
        }

        for (let i = 0; i < this.npcs.length; ++i) {
            let npc_info = this.npcs[i];
            let actions = [];
            if (npc_info.npc_type == NPC.movement_types.IDLE) {
                actions = ['idle'];
            }
            let npc = new NPC_Sprite(npc_info.key_name, actions);
            for (let j = 0; j < actions.length; ++j) {
                const action = actions[j];
                npc.setActionSpritesheet(
                    action,
                    `assets/images/spritesheets/${npc_info.key_name}_${action}.png`,
                    `assets/images/spritesheets/${npc_info.key_name}_${action}.json`
                );
                npc.setActionDirections(
                    action, 
                    npc_db[npc_info.key_name].actions[action].directions,
                    npc_db[npc_info.key_name].actions[action].frames_count
                );
                npc.setActionFrameRate(action, npc_db[npc_info.key_name].actions[action].frame_rate);
            }
            npc.addAnimations();
            await new Promise(resolve => {
                npc.loadSpritesheets(game, true, () => {
                    const initial_action = npc_db[npc_info.key_name].initial_action;
                    let npc_shadow_sprite = npc_group.create(0, 0, 'shadow');
                    npc_shadow_sprite.roundPx = true;
                    npc_shadow_sprite.blendMode = PIXI.blendModes.MULTIPLY;
                    npc_shadow_sprite.anchor.setTo(npc_info.ac_x, npc_info.ac_y);
                    npc_shadow_sprite.base_collider_layer = npc_info.base_collider_layer;
                    let npc_sprite = npc_group.create(0, 0, u([
                        npc_info.key_name,
                        initial_action
                    ]));
                    npc_info.set_shadow_sprite(npc_shadow_sprite);
                    npc_info.set_sprite(npc_sprite);
                    npc_info.npc_sprite.is_npc = true;
                    npc_info.npc_sprite.roundPx = true;
                    npc_info.npc_sprite.base_collider_layer = npc_info.base_collider_layer;
                    npc_info.npc_sprite.anchor.y = npc_db[npc_info.key_name].anchor_y;
                    npc_info.npc_sprite.centerX = (npc_info.initial_x + 1.5) * this.sprite.tileWidth;
                    const anchor_shift = npc_db[npc_info.key_name].anchor_y;
                    npc_info.npc_sprite.centerY = npc_info.initial_y * this.sprite.tileWidth - anchor_shift;
                    npc.setAnimation(npc_info.npc_sprite, initial_action);
                    npc_info.npc_sprite.animations.play(u([
                        initial_action,
                        npc_db[npc_info.key_name].actions[initial_action].initial_direction
                    ]));
                    resolve();
                });
            });
        }
    }
}
