import { u, get_surroundings } from "../utils.js";
import { NPC_Sprite, NPC } from './NPC.js';
import { InteractableObjects, InteractableObjects_Sprite } from "./InteractableObjects.js";
import * as numbers from '../magic_numbers.js';

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

    loadMapAssets(game) {
        game.load.tilemap(this.key_name, this.tileset_json_url, null, Phaser.Tilemap.TILED_JSON);
        game.load.image(this.key_name, this.tileset_image_url);
        for (let i = 0; i < this.physics_names.length; ++i) {
            game.load.physics(this.physics_names[i], this.physics_jsons_url[i]);
        }
    }

    async setLayers(game, data, maps, npc_db, interactable_objects_db, map_name, underlayer_group, overlayer_group, collider_layer, npc_group) {
        this.events = {};
        this.sprite = game.add.tilemap(this.key_name);
        this.sprite.addTilesetImage(this.tileset_name, this.key_name);

        for (let tile_index in maps[map_name].sprite.tilesets[0].tileProperties) {
            maps[map_name].sprite.tilesets[0].tileProperties[tile_index].index = tile_index;
        }

        for (let i = 0; i < this.sprite.tilesets.length; ++i) {
            let tileset = this.sprite.tilesets[i];
            if ("tiles" in tileset) { //dealing with newer versions of tiledmap editor
                tileset.tileproperties = tileset.tiles.reduce((map, obj) => {
                    map[obj.id] = obj.properties.reduce((map_p, obj_p) => {
                        map_p[obj_p.name] = obj_p.value;
                        return map_p;
                    }, {});
                    return map;
                }, {});
            }
        }

        if (Array.isArray(this.sprite.properties)) { //dealing with newer versions of tiledmap editor
            this.sprite.properties = this.sprite.properties.reduce((map, obj) => {
                map[obj.name] = obj.value;
                return map;
            }, {});
        }
        for (let property in this.sprite.properties) {
            if (property.startsWith("event")) { //check for events
                const property_info = JSON.parse(this.sprite.properties[property]);
                if (property_info.type === "stair") {
                    this.events[property_info.x + "_" + property_info.y] = {
                        type: property_info.type,
                        dynamic: false,
                        x: property_info.x,
                        y: property_info.y,
                        activation_direction: property_info.activation_direction,
                        activation_collision_layers: property_info.activation_collision_layers ? property_info.activation_collision_layers : 0,
                        change_to_collision_layer: property_info.change_to_collision_layer === undefined ? null : property_info.change_to_collision_layer,
                    }
                } else if (property_info.type === "speed") {
                    this.events[property_info.x + "_" + property_info.y] = {
                        type: property_info.type,
                        dynamic: false,
                        x: property_info.x,
                        y: property_info.y,
                        speed: property_info.speed,
                        activation_collision_layers: property_info.activation_collision_layers ? property_info.activation_collision_layers : 0,
                    }
                } else if (property_info.type === "door") {
                    this.events[property_info.x + "_" + property_info.y] = {
                        type: property_info.type,
                        dynamic: false,
                        x: property_info.x,
                        y: property_info.y,
                        target: property_info.target,
                        activation_direction: property_info.activation_direction,
                        x_target: property_info.x_target,
                        y_target: property_info.y_target,
                        advance_effect: property_info.advance_effect,
                        dest_collider_layer: property_info.dest_collider_layer ? property_info.dest_collider_layer : 0,
                        activation_collision_layers: property_info.activation_collision_layers ? property_info.activation_collision_layers : 0,
                    }
                } else if (property_info.type === "jump") {
                    this.events[property_info.x + "_" + property_info.y] = {
                        type: property_info.type,
                        dynamic: false,
                        x: property_info.x,
                        y: property_info.y,
                        activation_direction: property_info.activation_direction,
                        activation_collision_layers: property_info.activation_collision_layers ? property_info.activation_collision_layers : 0,
                        active: property_info.initially_active === undefined ? true : property_info.initially_active,
                        is_set: property_info.is_set === undefined ? true : property_info.is_set,
                    }
                } else if (property_info.type === "step") {
                    this.events[property_info.x + "_" + property_info.y] = {
                        type: property_info.type,
                        dynamic: false,
                        x: property_info.x,
                        y: property_info.y,
                        activation_direction: property_info.activation_direction,
                        step_direction: property_info.step_direction,
                        activation_collision_layers: property_info.activation_collision_layers ? property_info.activation_collision_layers : 0,
                    }
                } else if (property_info.type === "collision") {
                    this.events[property_info.x + "_" + property_info.y] = {
                        type: property_info.type,
                        dynamic: false,
                        x: property_info.x,
                        y: property_info.y,
                        activation_direction: property_info.activation_direction,
                        activation_collision_layers: property_info.activation_collision_layers,
                        dest_collider_layer: property_info.dest_collider_layer
                    }
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
                this.interactable_objects.push(new InteractableObjects(
                    property_info.key_name,
                    property_info.x,
                    property_info.y,
                    property_info.allowed_tiles === undefined ? [] : property_info.allowed_tiles,
                    property_info.base_collider_layer === undefined ? 0 : property_info.base_collider_layer
                ));
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
            if (Array.isArray(this.layers[i].properties)) { //dealing with newer versions of tiledmap editor
                this.layers[i].properties = this.layers[i].properties.reduce((map, obj) => {
                    map[obj.name] = obj.value;
                    return map;
                }, {});
            }
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
                    interactable_object_info.interactable_object_sprite.base_collider_layer = interactable_object_info.base_collider_layer;
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
                    for (let j = 0; j < interactable_objects_db[interactable_object_info.key_name].events.length; ++j) {
                        const event_info = interactable_objects_db[interactable_object_info.key_name].events[j];
                        x_pos += event_info.x_shift !== undefined ? event_info.x_shift : 0;
                        y_pos += event_info.y_shift !== undefined ? event_info.y_shift : 0;
                        const collide_layer_shift = event_info.collide_layer_shift !== undefined ? event_info.collide_layer_shift : 0;
                        const active_event = event_info.active !== undefined ? event_info.active : true;
                        switch (event_info.type) {
                            case "jump":
                                const event_key = x_pos + "_" + y_pos;
                                this.events[event_key] = {
                                    type: "jump",
                                    dynamic: event_info.dynamic,
                                    x: x_pos,
                                    y: y_pos,
                                    activation_direction: ["up", "down", "right", "left"],
                                    activation_collision_layers: [interactable_object_info.base_collider_layer + collide_layer_shift],
                                    active: active_event,
                                    is_set: event_info.is_set === undefined ? true: event_info.is_set
                                }
                                interactable_object_info.insert_event(event_key);
                                interactable_object_info.events_info[event_info.type] = event_info;
                                break;
                            case "jump_around":
                                get_surroundings(x_pos, y_pos).forEach((pos, index) => {
                                    const event_key = pos.x + "_" + pos.y;
                                    this.events[event_key] = {
                                        type: "jump",
                                        dynamic: event_info.dynamic,
                                        x: pos.x,
                                        y: pos.y,
                                        activation_direction: ["right", "left", "down", "up"][index],
                                        activation_collision_layers: [interactable_object_info.base_collider_layer + collide_layer_shift],
                                        active: active_event,
                                        is_set: event_info.is_set === undefined ? true: event_info.is_set
                                    }
                                    interactable_object_info.insert_event(event_key);
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
