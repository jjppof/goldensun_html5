import { u } from "../utils.js";
import { NPC_Sprite, NPC } from './NPC.js';

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
                const property_info = this.sprite.properties[property].split(",");
                if (property_info[0] === "stair") {
                    this.events[property_info[1] + "_" + property_info[2]] = {
                        type: property_info[0],
                        x: parseInt(property_info[1]),
                        y: parseInt(property_info[2]),
                        activation_direction: property_info[3]
                    }
                } else if (property_info[0] === "speed") {
                    this.events[property_info[1] + "_" + property_info[2]] = {
                        type: property_info[0],
                        x: parseInt(property_info[1]),
                        y: parseInt(property_info[2]),
                        speed: parseFloat(property_info[3])
                    }
                } else if (property_info[0] === "door") {
                    this.events[property_info[1] + "_" + property_info[2]] = {
                        type: property_info[0],
                        x: parseInt(property_info[1]),
                        y: parseInt(property_info[2]),
                        target: property_info[3],
                        activation_direction: property_info[4],
                        x_target: parseFloat(property_info[5]),
                        y_target: parseFloat(property_info[6]),
                        avance_effect: !!parseInt(property_info[7]),
                        collider_layer: property_info.length === 9 ? parseInt(property_info[8]) : 0
                    }
                } else if (property_info[0] === "jump") {
                    this.events[property_info[1] + "_" + property_info[2]] = {
                        type: property_info[0],
                        x: parseInt(property_info[1]),
                        y: parseInt(property_info[2]),
                        activation_direction: property_info[3],
                        collider_layer: property_info.length === 5 ? parseInt(property_info[4]) : 0
                    }
                } else if (property_info[0] === "step") {
                    this.events[property_info[1] + "_" + property_info[2]] = {
                        type: property_info[0],
                        x: parseInt(property_info[1]),
                        y: parseInt(property_info[2]),
                        activation_direction: property_info[3],
                        step_direction: property_info[4]
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
                    property_info.avatar ? property_info.avatar : null
                ));
            }
        }

        const layers = this.sprite.layers.sort(function(a, b) {
            if (a.properties.over != b.properties.over) return a - b;
            if (a.properties.z != b.properties.z) return a - b;
        });

        for (let i = 0; i < layers.length; ++i) {
            let layer = this.sprite.createLayer(layers[i].name);
            if (Array.isArray(layers[i].properties)) { //dealing with newer versions of tiledmap editor
                layers[i].properties = layers[i].properties.reduce((map, obj) => {
                    map[obj.name] = obj.value;
                    return map;
                }, {});
            }
            layer.resizeWorld();
            layer.blendMode = PIXI.blendModes[layers[i].properties.blendMode];
            layer.alpha = layers[i].alpha;

            let is_over = layers[i].properties.over.toString().split(",");
            is_over = is_over.length > collider_layer ? parseInt(is_over[collider_layer]) : parseInt(is_over[0]);
            if (is_over != 0)
                overlayer_group.add(layer);
            else
                underlayer_group.add(layer);
        }

        for (let i = 0; i < this.npcs.length; ++i) {
            let npc_info = this.npcs[i];
            let actions = [];
            if (npc_info.npc_type == NPC.movement_types.IDLE) {
                actions = ['idle'];
            }
            let npc = new NPC_Sprite(npc_info.key_name, actions);
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
                    let npc_shadow_sprite = npc_group.create(0, 0, 'shadow');
                    npc_shadow_sprite.blendMode = PIXI.blendModes.MULTIPLY;
                    npc_shadow_sprite.anchor.setTo(npc_info.ac_x, npc_info.ac_y);
                    let npc_sprite = npc_group.create(0, 0, u([
                        npc_info.key_name,
                        initial_action
                    ]));
                    npc_info.set_shadow_sprite(npc_shadow_sprite);
                    npc_info.set_sprite(npc_sprite);
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
