import { u } from "../utils.js";
import { NPC_IDLE } from '../config.js';
import { NPC } from './NPC.js';

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
    }

    loadMapAssets(game) {
        game.load.tilemap(this.key_name, this.tileset_json_url, null, Phaser.Tilemap.TILED_JSON);
        game.load.image(this.key_name, this.tileset_image_url);
        for (let i = 0; i < this.physics_names.length; ++i) {
            game.load.physics(this.physics_names[i], this.physics_jsons_url[i]);
        }
    }

    async setLayers(game, maps, npc_db, map_name, underlayer_group, overlayer_group, collider_layer, npc_group) {
        this.sprite = game.add.tilemap(this.key_name);
        this.sprite.addTilesetImage(this.tileset_name, this.key_name);

        for (let tile_index in maps[map_name].sprite.tilesets[0].tileProperties) {
            maps[map_name].sprite.tilesets[0].tileProperties[tile_index].index = tile_index;
        }

        let properties = this.sprite.properties;
        if (Array.isArray(properties)) { //dealing with newer versions of tiledmap editor
            properties = properties.reduce((map, obj) => {
                map[obj.name] = obj.value;
                return map;
            }, {});
        }
        for (let property in properties) {
            if (property.startsWith("event")) { //check for events
                const property_info = properties[property].split(",");
                if (property_info[0] == "stair") {
                    this.events[u([property_info[1], property_info[2]])] = {
                        type : property_info[0],
                        x : property_info[1],
                        y : property_info[2],
                        activation_direction : property_info[3]
                    }
                } else if (property_info[0] == "speed") {
                    this.events[u([property_info[1], property_info[2]])] = {
                        type : property_info[0],
                        x : property_info[1],
                        y : property_info[2],
                        speed : parseFloat(property_info[3])
                    }
                } else if (property_info[0] == "door") {
                    this.events[u([property_info[1], property_info[2]])] = {
                        type : property_info[0],
                        x : parseInt(property_info[1]),
                        y : parseInt(property_info[2]),
                        target : property_info[3],
                        activation_direction : property_info[4],
                        x_target : parseFloat(property_info[5]),
                        y_target : parseFloat(property_info[6]),
                        avance_effect: !!parseInt(property_info[7]),
                        collider_layer: property_info.length == 9 ? parseInt(property_info[8]) : 0
                    }
                } else if (property_info[0] == "jump") {
                    this.events[u([property_info[1], property_info[2]])] = {
                        type : property_info[0],
                        x : property_info[1],
                        y : property_info[2],
                        activation_direction : property_info[3],
                        collider_layer : property_info.length == 5 ? parseInt(property_info[4]) : 0
                    }
                } 
            } else if(property.startsWith("npc")) {
                const property_info = JSON.parse(properties[property]);
                this.npcs.push({
                    type: property_info.type,
                    key_name: property_info.key_name,
                    initial_x: property_info.initial_x,
                    initial_y: property_info.initial_y,
                    npc_type: property_info.npc_type, //0 - normal, 1- inn, 2 - weapon shop...
                    movement_type: property_info.movement_type, //0 - idle
                    message: property_info.message,
                    thought_message: property_info.thought_message,
                    avatar: property_info.avatar ? property_info.avatar : null
                });
            }
        }

        const layers = this.sprite.layers.sort(function(a, b) {
            if (a.properties.over != b.properties.over) return a - b;
            if (a.properties.z != b.properties.z) return a - b;
        });

        for (let i = 0; i < layers.length; ++i) {
            let layer = this.sprite.createLayer(layers[i].name);
            let layer_properties = layers[i].properties;
            if (Array.isArray(layer_properties)) { //dealing with newer versions of tiledmap editor
                layer_properties = layer_properties.reduce((map, obj) => {
                    map[obj.name] = obj.value;
                    return map;
                }, {});
            }
            layer.resizeWorld();
            layer.blendMode = PIXI.blendModes[layer_properties.blendMode];
            layer.alpha = layers[i].alpha;

            let is_over = layer_properties.over.toString().split(",");
            is_over = is_over.length > collider_layer ? parseInt(is_over[collider_layer]) : parseInt(is_over[0]);
            if (is_over != 0)
                overlayer_group.add(layer);
            else
                underlayer_group.add(layer);
        }

        for (let i = 0; i < this.npcs.length; ++i) {
            let npc_info = this.npcs[i];
            let actions = [];
            if (npc_info.npc_type == NPC_IDLE)
                actions = ['idle'];
            let npc = new NPC(npc_info.key_name, actions);
            for (let j = 0; j < actions.length; j++) {
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
            await new Promise((resolve) => {
                npc.loadSpritesheets(game, true, () => {
                    const initial_action = npc_db[npc_info.key_name].initial_action;
                    npc_info.npc_sprite = npc_group.create(0, 0, u([
                        npc_info.key_name,
                        initial_action
                    ]));
                    npc_info.npc_sprite.is_npc = true;
                    npc_info.npc_sprite.centerX = npc_info.initial_x * this.sprite.tileWidth;
                    npc_info.npc_sprite.centerY = npc_info.initial_y * this.sprite.tileWidth;
                    npc_info.npc_sprite.anchor.y = npc_db[npc_info.key_name].anchor_y;
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
