import {NPC} from "./NPC";
import {InteractableObjects} from "./InteractableObjects";
import {LocationKey, TileEvent} from "./tile_events/TileEvent";
import * as numbers from "./magic_numbers";
import {event_types, GameEvent} from "./game_events/GameEvent";
import {GoldenSun} from "./GoldenSun";
import * as _ from "lodash";
import {ControllableChar} from "./ControllableChar";
import {base_actions} from "./utils";

export class Map {
    private static readonly MAX_CAMERA_ROTATION = 0.035;
    private static readonly CAMERA_ROTATION_STEP = 0.003;

    private game: Phaser.Game;
    private data: GoldenSun;
    private _name: string;
    private _key_name: string;
    private tileset_name: string;
    private physics_names: string;
    private tileset_image_url: string;
    private tileset_json_url: string;
    private physics_jsons_url: string;
    private _sprite: Phaser.Tilemap;
    private _events: {[location_key: number]: TileEvent[]};
    private _npcs: NPC[];
    private _interactable_objects: InteractableObjects[];
    private _collision_layers_number: number;
    private _collision_sprite: Phaser.Sprite;
    private _color_filter: any;
    private mode7_filter: any;
    private _collision_layer: number;
    private _show_footsteps: boolean;
    private assets_loaded: boolean;
    private _lazy_load: boolean;
    private collision_embedded: boolean;
    private _is_world_map: boolean;
    private bgm_key: string;
    private bgm_url: string;
    private background_key: string;
    private expected_party_level: number;
    private encounter_cumulator: number;
    private encounter_zones: {
        base_rate: number;
        parties: string[];
        rectangle: Phaser.Rectangle;
    }[];

    constructor(
        game,
        data,
        name,
        key_name,
        tileset_name,
        physics_names,
        tileset_image_url,
        tileset_json_url,
        physics_jsons_url,
        lazy_load,
        collision_embedded,
        bgm_key,
        bgm_url,
        expected_party_level,
        background_key
    ) {
        this.game = game;
        this.data = data;
        this._name = name;
        this._key_name = key_name;
        this.tileset_name = tileset_name;
        this.physics_names = physics_names ?? [];
        this.tileset_image_url = tileset_image_url;
        this.tileset_json_url = tileset_json_url;
        this.physics_jsons_url = physics_jsons_url ?? [];
        this._sprite = null;
        this._events = {};
        this._npcs = [];
        this._interactable_objects = [];
        this._collision_layers_number = this.physics_names.length;
        this._collision_sprite = this.game.add.sprite(0, 0);
        this._collision_sprite.width = this.collision_sprite.height = 0;
        this._color_filter = this.game.add.filter("ColorFilters");
        this.mode7_filter = this.game.add.filter("Mode7");
        this._collision_layer = null;
        this._show_footsteps = false;
        this.assets_loaded = false;
        this._lazy_load = lazy_load ?? false;
        this.collision_embedded = collision_embedded ?? false;
        this._is_world_map = false;
        this.bgm_key = bgm_key;
        this.bgm_url = bgm_url;
        this.expected_party_level = expected_party_level;
        this.encounter_cumulator = 0;
        this.encounter_zones = [];
        this.background_key = background_key;
    }

    get events() {
        return this._events;
    }
    get npcs() {
        return this._npcs;
    }
    get interactable_objects() {
        return this._interactable_objects;
    }
    get collision_layer() {
        return this._collision_layer;
    }
    get collision_sprite() {
        return this._collision_sprite;
    }
    get collision_layers_number() {
        return this._collision_layers_number;
    }
    get lazy_load() {
        return this._lazy_load;
    }
    get is_world_map() {
        return this._is_world_map;
    }
    get sprite() {
        return this._sprite;
    }
    get show_footsteps() {
        return this._show_footsteps;
    }
    get color_filter() {
        return this._color_filter;
    }
    get name() {
        return this._name;
    }
    get key_name() {
        return this._key_name;
    }
    get layers() {
        return this.sprite.layers;
    }

    get tile_width() {
        return this.sprite.properties?.real_tile_width ?? this.sprite.tileWidth;
    }

    get tile_height() {
        return this.sprite.properties?.real_tile_height ?? this.sprite.tileHeight;
    }

    //sort the sprites in the map by z index depending on hero position
    sort_sprites() {
        const send_to_back_list = new Array(this.data.npc_group.children.length);
        const send_to_front_list = new Array(this.data.npc_group.children.length);
        const has_sort_function = new Array(this.data.npc_group.children.length);
        this.data.npc_group.children.forEach((sprite: Phaser.Sprite, index) => {
            sprite.y_sort = +`${sprite.base_collision_layer}${sprite.y | 0}`;
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
        this.data.npc_group.sort("y_sort", Phaser.Group.SORT_ASCENDING);
        send_to_front_list.forEach(sprite => {
            if (sprite) {
                this.data.npc_group.bringToTop(sprite);
            }
        });
        has_sort_function.forEach(sprite => {
            if (sprite) {
                sprite.sort_function();
            }
        });
        send_to_back_list.forEach(sprite => {
            if (sprite) {
                this.data.npc_group.sendToBack(sprite);
            }
        });
    }

    private freeze_body() {
        this.collision_sprite.body.velocity.y = this.collision_sprite.body.velocity.x = 0;
    }

    update() {
        this.freeze_body();
        this.npcs.forEach(npc => {
            if (npc.active) {
                npc.update();
            }
        });
        this.sort_sprites();
        this.update_map_rotation();
        this.zone_check();
    }

    //if it's a world map, rotates de map on hero movement
    private update_map_rotation() {
        if (this.is_world_map) {
            const value_check =
                Math.abs(this.mode7_filter.angle) < Map.MAX_CAMERA_ROTATION * Math.abs(this.data.hero.x_speed);
            const sign_check = Math.sign(this.mode7_filter.angle) === this.data.hero.x_speed;
            if (this.data.hero.x_speed && (value_check || sign_check)) {
                this.mode7_filter.angle -= Math.sign(this.data.hero.x_speed) * Map.CAMERA_ROTATION_STEP;
            } else if (!this.data.hero.x_speed && Math.abs(this.mode7_filter.angle) > 0) {
                this.mode7_filter.angle -= Math.sign(this.mode7_filter.angle) * Map.CAMERA_ROTATION_STEP;
            }
        }
    }

    //pause map activity, like collisions, npc and interactable objects animation etc.
    pause() {
        this.sprite.pauseAnimation = true;
        const previously_inactive_npc = new Set<number>();
        const previously_inactive_io = new Set<number>();
        const previously_not_visible_layers = new Set<number>();
        this.layers.forEach((layer, index) => {
            if (layer.sprite.visible) {
                layer.sprite.visible = false;
            } else {
                previously_not_visible_layers.add(index);
            }
        });
        this.npcs.forEach((npc, index) => {
            if (npc.active) {
                npc.toggle_active(false);
            } else {
                previously_inactive_npc.add(index);
            }
        });
        this.interactable_objects.forEach((interactable_object, index) => {
            if (interactable_object.active) {
                interactable_object.toggle_active(false);
            } else {
                previously_inactive_io.add(index);
            }
        });
        return {
            previously_inactive_npc: previously_inactive_npc,
            previously_inactive_io: previously_inactive_io,
            previously_not_visible_layers: previously_not_visible_layers,
        };
    }

    //resume map activity, like collisions, npc and interactable objects animation etc.
    resume(previous_state?: ReturnType<Map["pause"]>) {
        this.sprite.pauseAnimation = false;
        this.layers.forEach((layer, index) => {
            if (previous_state?.previously_not_visible_layers.has(index)) {
                return;
            }
            layer.sprite.visible = true;
        });
        this.npcs.forEach((npc, index) => {
            if (previous_state?.previously_inactive_npc.has(index)) {
                return;
            }
            npc.toggle_active(true);
        });
        this.interactable_objects.forEach((interactable_object, index) => {
            if (previous_state?.previously_inactive_io.has(index)) {
                return;
            }
            interactable_object.toggle_active(true);
        });
    }

    load_map_assets(force_load: boolean, on_complete?: () => void) {
        const promises = [];

        let load_tilemap_promise_resolve;
        promises.push(new Promise(resolve => (load_tilemap_promise_resolve = resolve)));
        this.game.load
            .tilemap(this.key_name, this.tileset_json_url, null, Phaser.Tilemap.TILED_JSON)
            .onLoadComplete.addOnce(load_tilemap_promise_resolve);

        let load_image_promise_resolve;
        promises.push(new Promise(resolve => (load_image_promise_resolve = resolve)));
        this.game.load.image(this.key_name, this.tileset_image_url).onLoadComplete.addOnce(load_image_promise_resolve);

        if (this.bgm_key) {
            let load_bgm_promise_resolve;
            promises.push(new Promise(resolve => (load_bgm_promise_resolve = resolve)));
            this.game.load.audio(this.bgm_key, [this.bgm_url]).onLoadComplete.addOnce(load_bgm_promise_resolve);
        }

        for (let i = 0; i < this.physics_names.length; ++i) {
            let load_physics_promise_resolve;
            promises.push(new Promise(resolve => (load_physics_promise_resolve = resolve)));
            this.game.load
                .physics(this.physics_names[i], this.physics_jsons_url[i])
                .onLoadComplete.addOnce(load_physics_promise_resolve);
        }

        this.assets_loaded = true;

        if (force_load) {
            Promise.all(promises).then(on_complete);
            this.game.load.start();
        }
    }

    //create map collision bodies
    config_body(collision_layer: number) {
        if (this.collision_layer !== collision_layer) {
            this._collision_layer = collision_layer;
        }
        this.game.physics.p2.enable(this.collision_sprite, false);
        this.collision_sprite.body.clearShapes();
        if (this.collision_embedded) {
            //create collision bodies from object layer created on Tiled
            this.collision_sprite.width = this.sprite.widthInPixels;
            this.collision_sprite.height = this.sprite.heightInPixels;
            this.collision_sprite.anchor.setTo(0, 0);
            const collision_layer_objects = this.sprite.objects[this.collision_layer].objectsData;
            for (let i = 0; i < collision_layer_objects.length; ++i) {
                const collision_object = collision_layer_objects[i];
                let shape;
                if (collision_object.polygon) {
                    const new_polygon = collision_object.polygon.map((point: number[]) => {
                        const new_point = [
                            Math.round(collision_object.x + point[0]),
                            Math.round(collision_object.y + point[1]),
                        ];
                        return new_point;
                    });
                    shape = this.collision_sprite.body.addPolygon(
                        {
                            optimalDecomp: false,
                            skipSimpleCheck: false,
                            removeCollinearPoints: false,
                            remove: false,
                            adjustCenterOfMass: false,
                        },
                        new_polygon
                    );
                } else if (collision_object.rectangle) {
                    shape = this.collision_sprite.body.addRectangle(
                        Math.round(collision_object.width),
                        Math.round(collision_object.height),
                        Math.round(collision_object.x) + (Math.round(collision_object.width) >> 1),
                        Math.round(collision_object.y) + (Math.round(collision_object.height) >> 1)
                    );
                } else if (collision_object.ellipse) {
                    shape = this.collision_sprite.body.addCircle(
                        collision_object.width >> 1,
                        Math.round(collision_object.x) + (Math.round(collision_object.width) >> 1),
                        Math.round(collision_object.y) + (Math.round(collision_object.height) >> 1)
                    );
                }
                if (collision_object.properties) {
                    shape.properties = collision_object.properties;
                    if (collision_object.properties.affected_by_reveal && !collision_object.properties.show_on_reveal) {
                        //disable collision for this particular body
                        shape.sensor = true;
                    }
                }
            }
        } else {
            //load map physics data from json files
            this.collision_sprite.body.loadPolygon(
                this.physics_names[collision_layer],
                this.physics_names[collision_layer]
            );
        }
        this.collision_sprite.body.setCollisionGroup(this.data.collision.map_collision_group);
        this.collision_sprite.body.damping = numbers.MAP_DAMPING;
        this.collision_sprite.body.angularDamping = numbers.MAP_DAMPING;
        this.collision_sprite.body.setZeroRotation();
        this.collision_sprite.body.dynamic = false;
        this.collision_sprite.body.static = true;
    }

    //config map, npc and interactable objects collision bodies
    config_all_bodies(collision_layer: number) {
        if (!this.is_world_map) {
            this.npcs.forEach(npc => npc.config_body());
            this.interactable_objects.forEach(interactable_obj => interactable_obj.config_body());
        }
        this.config_body(collision_layer);
    }

    //returns a tile object (Phaser.Tile or Phaser.Tile[] if multiple layers) where the given ControllableChar is
    get_current_tile(controllable_char: ControllableChar, layer?) {
        if (layer !== undefined) {
            return this.sprite.getTile(controllable_char.tile_x_pos, controllable_char.tile_y_pos, layer);
        } else {
            return this.layers
                .map(layer =>
                    this.sprite.getTile(controllable_char.tile_x_pos, controllable_char.tile_y_pos, layer.name)
                )
                .filter(tile => tile);
        }
    }

    get_layer(name: string) {
        return _.find(this.layers, {name: name});
    }

    private create_tile_events(raw_property) {
        const property_info = JSON.parse(raw_property);
        const this_event_location_key = LocationKey.get_key(property_info.x, property_info.y);
        if (!(this_event_location_key in this.events)) {
            this.events[this_event_location_key] = [];
        }
        const event = this.data.tile_event_manager.get_event_instance(property_info);
        this.events[this_event_location_key].push(event);
    }

    private create_npcs(raw_property) {
        const property_info = JSON.parse(raw_property);
        const npc_db = this.data.dbs.npc_db[property_info.key_name];
        const initial_action = property_info.initial_action ?? npc_db.initial_action;
        const actual_action =
            (npc_db.actions && initial_action in npc_db.actions) || !npc_db.action_aliases
                ? initial_action
                : npc_db.action_aliases[initial_action];
        const initial_animation = property_info.animation_key ?? npc_db.actions[actual_action].initial_animation;
        const interaction_pattern = property_info.interaction_pattern ?? npc_db.interaction_pattern;
        const ignore_physics = property_info.ignore_physics ?? npc_db.ignore_physics;
        const voice_key = property_info.voice_key ?? npc_db.voice_key;
        const ignore_world_map_scale = property_info.ignore_world_map_scale ?? npc_db.ignore_world_map_scale;
        const enable_footsteps = property_info.enable_footsteps ?? this._show_footsteps;
        const npc = new NPC(
            this.game,
            this.data,
            property_info.key_name,
            property_info.active,
            property_info.initial_x,
            property_info.initial_y,
            property_info.storage_keys,
            initial_action,
            initial_animation,
            enable_footsteps,
            npc_db.walk_speed,
            npc_db.dash_speed,
            npc_db.climb_speed,
            property_info.npc_type,
            property_info.movement_type,
            property_info.message,
            property_info.thought_message,
            property_info.avatar,
            property_info.shop_key,
            property_info.inn_key,
            property_info.base_collision_layer,
            property_info.talk_range_factor,
            property_info.events,
            npc_db.no_shadow,
            ignore_world_map_scale,
            property_info.anchor_x,
            property_info.anchor_y,
            property_info.scale_x,
            property_info.scale_y,
            interaction_pattern,
            property_info.affected_by_reveal,
            property_info.sprite_misc_db_key,
            ignore_physics,
            property_info.visible,
            voice_key
        );
        this.npcs.push(npc);
    }

    private create_interactable_objects(raw_property) {
        const property_info = JSON.parse(raw_property);
        const interactable_object = new InteractableObjects(
            this.game,
            this.data,
            property_info.key_name,
            property_info.x,
            property_info.y,
            property_info.storage_keys,
            property_info.allowed_tiles,
            property_info.base_collision_layer,
            property_info.not_allowed_tiles,
            property_info.object_drop_tiles,
            property_info.anchor_x,
            property_info.anchor_y,
            property_info.scale_x,
            property_info.scale_y,
            property_info.block_climb_collision_layer_shift,
            property_info.events_info
        );
        this.interactable_objects.push(interactable_object);
    }

    private config_interactable_object() {
        for (let i = 0; i < this.interactable_objects.length; ++i) {
            const interactable_object = this.interactable_objects[i];
            interactable_object.initial_config(this);
            interactable_object.initialize_related_events(this.events, this);
        }
    }

    private config_npc() {
        for (let i = 0; i < this.npcs.length; ++i) {
            this.npcs[i].init_npc(this);
        }
    }

    //create layers and organize them by z index
    private config_layers() {
        for (let i = 0; i < this.layers.length; ++i) {
            const layer = this.sprite.createLayer(this.layers[i].name);
            this.layers[i].sprite = layer;
            layer.layer_z = this.layers[i].properties.z === undefined ? i : this.layers[i].properties.z;
            layer.resizeWorld();
            if (this.layers[i].properties.blendMode !== undefined) {
                layer.blendMode = (PIXI.blendModes[this.layers[i].properties.blendMode] as unknown) as PIXI.blendModes;
            }
            if (this.layers[i].alpha !== undefined) {
                layer.alpha = this.layers[i].alpha;
            }
            if (this.layers[i].properties.reveal_layer) {
                layer.visible = false;
            }

            let is_over = false;
            if (this.layers[i].properties.over !== undefined) {
                const is_over_prop = this.layers[i].properties.over
                    .toString()
                    .split(",")
                    .map(over => parseInt(over));
                if (is_over_prop.length > this.collision_layer) {
                    is_over = Boolean(is_over_prop[this.collision_layer]);
                } else {
                    is_over = Boolean(is_over_prop[0]);
                }
            }
            if (is_over) {
                this.data.overlayer_group.add(layer);
            } else {
                this.data.underlayer_group.add(layer);
            }
        }
    }

    //reorganize the existing layers. This can be called after changing the collision layer, for instance.
    reorganize_layers() {
        for (let i = 0; i < this.layers.length; ++i) {
            const layer = this.layers[i];
            if (layer.properties.over !== undefined) {
                const is_over_prop = layer.properties.over
                    .toString()
                    .split(",")
                    .map(over => parseInt(over));
                if (is_over_prop.length <= this.collision_layer) continue;
                const is_over = Boolean(is_over_prop[this.collision_layer]);
                if (is_over) {
                    this.data.underlayer_group.remove(layer.sprite, false, true);
                    let index = 0;
                    for (index = 0; index < this.data.overlayer_group.children.length; ++index) {
                        const child = this.data.overlayer_group.children[index] as Phaser.TilemapLayer;
                        if (child.layer_z > (layer.z === undefined ? i : layer.z)) {
                            this.data.overlayer_group.addAt(layer.sprite, index, true);
                            break;
                        }
                    }
                    if (index === this.data.overlayer_group.children.length) {
                        this.data.overlayer_group.add(layer.sprite, true);
                    }
                } else {
                    this.data.overlayer_group.remove(layer.sprite, false, true);
                    let index = 0;
                    for (index = 0; index < this.data.underlayer_group.children.length; ++index) {
                        const child = this.data.underlayer_group.children[index] as Phaser.TilemapLayer;
                        if (child.layer_z > layer.z) {
                            this.data.underlayer_group.addAt(layer.sprite, index, true);
                            break;
                        }
                    }
                    if (index === this.data.underlayer_group.children.length) {
                        this.data.underlayer_group.add(layer.sprite, true);
                    }
                }
            }
        }
    }

    private zone_check() {
        if (
            (this.data.hero.current_action as base_actions) !== base_actions.WALK &&
            (this.data.hero.current_action as base_actions) !== base_actions.DASH
        ) {
            return;
        }
        for (let i = 0; i < this.encounter_zones.length; ++i) {
            const zone = this.encounter_zones[i];
            if (zone.rectangle.contains(this.data.hero.sprite.x, this.data.hero.sprite.y)) {
                if (this.start_battle_encounter(zone.base_rate)) {
                    const party = _.sample(zone.parties);
                    const event = this.data.game_event_manager.get_event_instance({
                        type: event_types.BATTLE,
                        background_key: this.background_key,
                        enemy_party_key: party,
                    });
                    event.fire();
                }
                break;
            }
        }
    }

    //calculates whether it's time to start a battle
    private start_battle_encounter(zone_base_rate: number) {
        const a = (_.random(0xffff) - _.random(0xffff) + _.random(0xffff) - _.random(0xffff)) >> 1;
        const avg_level = this.data.info.party_data.avg_level;
        const expected_level = this.expected_party_level ?? avg_level;
        const b = _.clamp(avg_level - expected_level + 1, 0, 5);
        const c = 5 * b + zone_base_rate;
        const d = c * (0x10000 + a) - a;
        const e = 1 + this.data.info.party_data.random_battle_extra_rate;
        const speed_factor = this.data.hero.get_encounter_speed_factor();
        this.encounter_cumulator += 64 * ((0x4000000 / d) | 0) * speed_factor * e;
        if (this.encounter_cumulator >= 0x100000) {
            this.encounter_cumulator = 0;
            if (this.data.hero.avoid_encounter) {
                this.data.hero.avoid_encounter = false;
                return false;
            } else {
                return true;
            }
        } else {
            return false;
        }
    }

    //remove a tile event in a custom location
    remove_event(location_key: number, event_id: number) {
        this.events[location_key] = this.events[location_key].filter(event => event.id !== event_id);
        if (!this.events[location_key].length) {
            delete this.events[location_key];
        }
    }

    //this is the main function of this class. It mounts the map
    async mount_map(collision_layer: number) {
        if (!this.assets_loaded) {
            //lazy assets load
            let load_promise_resolve;
            const load_promise = new Promise(resolve => (load_promise_resolve = resolve));
            this.load_map_assets(true, load_promise_resolve);
            await load_promise;
        }
        this._events = {};
        TileEvent.reset();
        GameEvent.reset();
        this.encounter_cumulator = 0;

        this._collision_layer = collision_layer;
        this._sprite = this.game.add.tilemap(this.key_name);

        if (this.sprite.properties?.world_map) {
            this._is_world_map = true;
        }

        this.sprite.addTilesetImage(this.tileset_name, this.key_name);
        let collision_layers_counter = 0;
        this.sprite.objects = _.mapKeys(this.sprite.objects, (objs: any, collision_index: string) => {
            if (objs.properties?.encounter_zone) {
                objs.objectsData.forEach(obj => {
                    const zone = new Phaser.Rectangle(obj.x | 0, obj.y | 0, obj.width | 0, obj.height | 0);
                    this.encounter_zones.push({
                        rectangle: zone,
                        base_rate: obj.properties.base_rate ?? objs.properties.base_rate,
                        parties: JSON.parse(obj.properties.parties),
                    });
                });
                return collision_index;
            } else {
                ++collision_layers_counter;
                return parseInt(collision_index);
            }
        }) as any;
        if (this.collision_embedded) {
            this._collision_layers_number = collision_layers_counter;
        }

        for (let i = 0; i < this.sprite.tilesets.length; ++i) {
            const tileset = this.sprite.tilesets[i];
            for (let tile_index in tileset.tileProperties) {
                tileset.tileProperties[tile_index].index = tile_index;
            }
        }

        //read the map properties and creates events, npcs and interactable objects
        const sorted_props = Object.keys(this.sprite.properties)
            .flatMap(property => {
                if (
                    property.startsWith("event") ||
                    property.startsWith("npc") ||
                    property.startsWith("interactable_object")
                ) {
                    const underscore_index = property.lastIndexOf("_");
                    const type = property.substring(0, underscore_index);
                    const index = +property.substring(underscore_index + 1, property.length);
                    return [
                        {
                            type: type as "event" | "npc" | "interactable_object",
                            index: index,
                            key: property,
                        },
                    ];
                } else {
                    return [];
                }
            })
            .sort((a, b) => a.index - b.index);

        if (this.sprite.properties?.footprint) {
            this._show_footsteps = true;
        }

        for (let property of sorted_props) {
            const raw_property = this.sprite.properties[property.key];
            switch (property.type) {
                case "event":
                    this.create_tile_events(raw_property);
                    break;
                case "npc":
                    this.create_npcs(raw_property);
                    break;
                case "interactable_object":
                    this.create_interactable_objects(raw_property);
                    break;
            }
        }

        this.layers.sort((a, b) => {
            if (a.properties.over !== b.properties.over) return a - b;
            if (a.properties.z !== b.properties.z) return a - b;
        });

        this.config_layers();
        this.config_interactable_object();
        this.config_npc();

        this.config_world_map();

        this.data.audio.add_bgm(this.bgm_key, true);

        return this;
    }

    private config_world_map() {
        let next_body_radius = numbers.HERO_BODY_RADIUS;
        if (this.is_world_map) {
            this.layers.forEach(l => (l.sprite.filters = [this.mode7_filter, this.color_filter]));
            this.game.camera.bounds = null;
            this.npcs.forEach(npc => {
                if (!npc.ignore_world_map_scale) {
                    npc.sprite.scale.setTo(numbers.WORLD_MAP_SPRITE_SCALE_X, numbers.WORLD_MAP_SPRITE_SCALE_Y);
                }
                npc.sprite.data.mode7 = true;
                npc.sprite.data.map = this;
                if (npc.shadow) {
                    if (!npc.ignore_world_map_scale) {
                        npc.shadow.scale.setTo(numbers.WORLD_MAP_SPRITE_SCALE_X, numbers.WORLD_MAP_SPRITE_SCALE_Y);
                    }
                    npc.shadow.data.mode7 = true;
                    npc.shadow.data.map = this;
                }
            });
            this.interactable_objects.forEach(obj => (obj.sprite.data.mode7 = true));
            next_body_radius = numbers.HERO_BODY_RADIUS_M7;
        } else {
            this.layers.forEach(l => (l.sprite.filters = [this.color_filter]));
            this.game.camera.bounds = new Phaser.Rectangle();
            this.game.camera.bounds.copyFrom(this.game.world.bounds);
        }

        if (this.data.hero && next_body_radius !== this.data.hero.body_radius) {
            this.data.hero.config_body(this.is_world_map ? numbers.HERO_BODY_RADIUS_M7 : numbers.HERO_BODY_RADIUS);
            if (this.is_world_map) {
                this.data.hero.sprite.scale.setTo(numbers.WORLD_MAP_SPRITE_SCALE_X, numbers.WORLD_MAP_SPRITE_SCALE_Y);
                this.data.hero.shadow.scale.setTo(numbers.WORLD_MAP_SPRITE_SCALE_X, numbers.WORLD_MAP_SPRITE_SCALE_Y);
                this.data.hero.create_half_crop_mask(this.is_world_map);
            } else {
                this.data.hero.sprite.scale.setTo(1, 1);
                this.data.hero.shadow.scale.setTo(1, 1);
                this.data.hero.sprite.mask.destroy();
                this.data.hero.sprite.mask = null;
            }
        }
    }

    unset_map() {
        this.sprite.destroy();
        this.data.underlayer_group.removeAll();
        this.data.overlayer_group.removeAll();

        this.collision_sprite.body.clearShapes();

        this._npcs.forEach(npc => {
            npc.unset();
        });
        this._interactable_objects.forEach(interactable_object => {
            interactable_object.unset();
        });
        if (this.show_footsteps) {
            this.data.hero.footsteps.clean_all();
        }

        TileEvent.reset();
        GameEvent.reset();

        this._npcs = [];
        this._interactable_objects = [];
        this._events = {};
        this.data.npc_group.removeAll();
        this.data.npc_group.add(this.data.hero.shadow);
        this.data.npc_group.add(this.data.hero.sprite);
    }
}
