import { u } from "../utils.js";
import { NPC_Sprite, NPC } from './NPC.js';
import { PsynergyItems, PsynergyItems_Sprite } from "./PsynergyItems.js";

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
        this.psynergy_items = [];
    }

    loadMapAssets(game) {
        game.load.tilemap(this.key_name, this.tileset_json_url, null, Phaser.Tilemap.TILED_JSON);
        game.load.image(this.key_name, this.tileset_image_url);
        for (let i = 0; i < this.physics_names.length; ++i) {
            game.load.physics(this.physics_names[i], this.physics_jsons_url[i]);
        }
    }

    async setLayers(game, data, maps, npc_db, psynergy_items_db, map_name, underlayer_group, overlayer_group, collider_layer, npc_group) {
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
                    property_info.base_collider_layer === undefined ? 0 : property_info.base_collider_layer
                ));
            } else if(property.startsWith("psynergy_item")) {
                const property_info = JSON.parse(this.sprite.properties[property]);
                this.psynergy_items.push(new PsynergyItems(
                    property_info.key_name,
                    property_info.x,
                    property_info.y,
                    property_info.allowed_tiles,
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

        for (let i = 0; i < this.psynergy_items.length; ++i) {
            let psynergy_item_info = this.psynergy_items[i];
            const action = psynergy_item_info.key_name;
            let pynergy_item = new PsynergyItems_Sprite(
                psynergy_item_info.key_name,
                [action]
            );
            pynergy_item.setActionSpritesheet(
                action,
                `assets/images/spritesheets/psynergy_${psynergy_items_db[psynergy_item_info.key_name].type}.png`,
                `assets/images/spritesheets/psynergy_${psynergy_items_db[psynergy_item_info.key_name].type}.json`
            );
            pynergy_item.setActionDirections(
                action, 
                psynergy_items_db[psynergy_item_info.key_name].actions.animations,
                psynergy_items_db[psynergy_item_info.key_name].actions.frames_count
            );
            pynergy_item.setActionFrameRate(action, psynergy_items_db[psynergy_item_info.key_name].actions.frame_rate);
            pynergy_item.addAnimations();
            await new Promise(resolve => {
                pynergy_item.loadSpritesheets(game, true, () => {
                    let psynergy_item_sprite = npc_group.create(0, 0, psynergy_item_info.key_name + "_" + action);
                    psynergy_item_info.set_sprite(psynergy_item_sprite);
                    psynergy_item_info.psynergy_item_sprite.is_psynergy_item = true;
                    psynergy_item_info.psynergy_item_sprite.base_collider_layer = psynergy_item_info.base_collider_layer;
                    psynergy_item_info.psynergy_item_sprite.anchor.y = psynergy_items_db[psynergy_item_info.key_name].anchor_y;
                    psynergy_item_info.psynergy_item_sprite.centerX = (psynergy_item_info.x + 1) * this.sprite.tileWidth;
                    const anchor_shift = psynergy_items_db[psynergy_item_info.key_name].anchor_y * this.sprite.tileWidth * 0.5;
                    psynergy_item_info.psynergy_item_sprite.centerY = psynergy_item_info.y * this.sprite.tileWidth - anchor_shift;
                    pynergy_item.setAnimation(psynergy_item_info.psynergy_item_sprite, action);
                    const initial_animation = psynergy_items_db[psynergy_item_info.key_name].initial_animation;
                    psynergy_item_info.psynergy_item_sprite.animations.play(action + "_" + initial_animation);
                    const position = psynergy_item_info.get_current_position(data);
                    const x_pos = position.x;
                    const y_pos = position.y + psynergy_items_db[psynergy_item_info.key_name].jump_y_shift;
                    if (psynergy_items_db[psynergy_item_info.key_name].events.includes("jump")) {
                        const event_key = x_pos + "_" + y_pos;
                        this.events[event_key] = {
                            type: "jump",
                            dynamic: true,
                            x: x_pos,
                            y: y_pos,
                            activation_direction: ["up", "down", "right", "left"],
                            activation_collision_layers: [psynergy_item_info.base_collider_layer + psynergy_items_db[psynergy_item_info.key_name].jump_collide_layer_shift],
                            active: true, 
                        }
                        psynergy_item_info.insert_event(event_key);
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
                    npc_info.npc_sprite.centerX = (npc_info.initial_x + 1) * this.sprite.tileWidth;
                    const anchor_shift = npc_db[npc_info.key_name].anchor_y * this.sprite.tileWidth * 0.5;
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
