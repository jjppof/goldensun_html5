import {NPC, npc_movement_types, npc_types} from "./NPC";
import {InteractableObjects} from "./interactable_objects/InteractableObjects";
import {IntegerPairKey, TileEvent} from "./tile_events/TileEvent";
import * as numbers from "./magic_numbers";
import {event_types, GameEvent, game_event_origin} from "./game_events/GameEvent";
import {GoldenSun} from "./GoldenSun";
import * as _ from "lodash";
import {ControllableChar} from "./ControllableChar";
import {
    base_actions,
    directions,
    get_px_position,
    get_text_width,
    parse_blend_mode,
    weighted_random_pick,
    engine_filters,
    get_sqr_distance,
} from "./utils";
import {BattleEvent} from "./game_events/BattleEvent";
import {Djinn} from "./Djinn";
import {Pushable} from "./interactable_objects/Pushable";
import {RopeDock} from "./interactable_objects/RopeDock";
import {RollablePillar} from "./interactable_objects/RollingPillar";
import {Collision} from "./Collision";
import {DjinnGetEvent} from "./game_events/DjinnGetEvent";
import {Breakable} from "./interactable_objects/Breakable";
import {Window} from "./Window";
import {GAME_HEIGHT, GAME_WIDTH} from "./magic_numbers";
import {WhirlwindSource} from "./interactable_objects/WhirlwindSource";

/** The class reponsible for the maps of the engine. */
export class Map {
    private static readonly MAX_CAMERA_ROTATION = 0.035;
    private static readonly CAMERA_ROTATION_STEP = 0.003;

    private game: Phaser.Game;
    private data: GoldenSun;
    private _name: string;
    private _key_name: string;
    private physics_names: string;
    private tileset_image_url: string;
    private tileset_json_url: string;
    private physics_jsons_url: string;
    private _sprite: Phaser.Tilemap;
    private _events: {[location_key: number]: TileEvent[]};
    private _shapes: {[collision_index: number]: {[location_key: number]: p2.Convex[]}};
    private _big_shapes_tiles: {[collision_index: number]: Set<number>};
    private _npcs: NPC[];
    private _npcs_label_map: {[label: string]: NPC};
    private _interactable_objects: InteractableObjects[];
    private _interactable_objects_label_map: {[label: string]: InteractableObjects};
    private _bodies_positions: {[collision_index: number]: {[location_key: number]: (NPC | InteractableObjects)[]}};
    private _collision_layers_number: number;
    private _collision_sprite: Phaser.Sprite;
    private _colorize_filter: Phaser.Filter.Colorize;
    private _gray_filter: Phaser.Filter.Gray;
    private _mode7_filter: Phaser.Filter.Mode7;
    private _collision_layer: number;
    private _show_footsteps: boolean;
    private assets_loaded: boolean;
    private _lazy_load: boolean;
    private collision_embedded: boolean;
    private _is_world_map: boolean;
    private bgm_key: string;
    private bgm_url: string;
    private _background_key: string;
    private expected_party_level: number;
    private _encounter_cumulator: number;
    private encounter_zones: {
        base_rate: number;
        parties: string[];
        rectangle: Phaser.Rectangle;
        background_key: string;
    }[];
    private _sand_collision_layer: number;
    private processed_polygons: {
        [collision_layer: number]: Array<{
            polygon: Array<Array<number>>;
            sensor_active: boolean;
            readonly sensor_active_original: boolean;
            location_key?: number;
            split_polygon: boolean;
            properties: any;
        }>;
    };
    private polygons_processed: boolean;
    private bounding_boxes: Phaser.Rectangle[];
    private game_events: GameEvent[];
    private before_config_game_events: GameEvent[];
    private other_game_events: GameEvent[];
    private _retreat_data: {
        x: number;
        y: number;
        collision_layer: number;
        direction: directions;
    };
    private _paused: boolean;
    private _generic_sprites: {[key_name: string]: Phaser.Sprite};
    private _active_filters: {[key in engine_filters]?: boolean};

    private _map_name_window: Window;
    private _show_map_name: boolean;

    private _internal_map_objs_storage_keys: {
        npcs: {[map_index: string]: NPC["storage_keys"]};
        interactable_objects: {[map_index: string]: InteractableObjects["storage_keys"]};
    };

    /** If true, sprites in middlelayer_group won't be sorted. */
    public sprites_sort_paused: boolean;

    constructor(
        game,
        data,
        name,
        key_name,
        physics_names,
        tileset_image_url,
        tileset_json_url,
        physics_jsons_url,
        lazy_load,
        collision_embedded,
        bgm_key,
        bgm_url,
        expected_party_level,
        background_key,
        show_map_name
    ) {
        this.game = game;
        this.data = data;
        this._name = name;
        this._key_name = key_name;
        this.physics_names = physics_names ?? [];
        this.tileset_image_url = tileset_image_url;
        this.tileset_json_url = tileset_json_url;
        this.physics_jsons_url = physics_jsons_url ?? [];
        this._sprite = null;
        this._events = {};
        this._shapes = {};
        this._big_shapes_tiles = {};
        this.processed_polygons = {};
        this._npcs = [];
        this._npcs_label_map = {};
        this._interactable_objects = [];
        this._interactable_objects_label_map = {};
        this._bodies_positions = {};
        this._collision_layers_number = this.physics_names.length;
        this._collision_sprite = this.game.add.sprite(0, 0);
        this._collision_sprite.width = this.collision_sprite.height = 0;
        this._colorize_filter = this.game.add.filter("Colorize") as Phaser.Filter.Colorize;
        this._gray_filter = this.game.add.filter("Gray") as Phaser.Filter.Gray;
        this._mode7_filter = this.game.add.filter("Mode7") as Phaser.Filter.Mode7;
        this._collision_layer = null;
        this._show_footsteps = false;
        this.assets_loaded = false;
        this._lazy_load = lazy_load ?? true;
        this.collision_embedded = collision_embedded ?? true;
        this._is_world_map = false;
        this.bgm_key = bgm_key;
        this.bgm_url = bgm_url;
        this.expected_party_level = expected_party_level;
        this._encounter_cumulator = 0;
        this.encounter_zones = [];
        this._background_key = background_key;
        this.polygons_processed = false;
        this.bounding_boxes = [];
        this.game_events = [];
        this.before_config_game_events = [];
        this.other_game_events = [];
        this._retreat_data = null;
        this._paused = false;
        this.sprites_sort_paused = false;
        this._generic_sprites = {};
        this._active_filters = {
            [engine_filters.COLORIZE]: false,
            [engine_filters.GRAY]: false,
            [engine_filters.MODE7]: false,
        };
        this._map_name_window = null;
        this._show_map_name = show_map_name ?? true;
        this._internal_map_objs_storage_keys = {
            npcs: {},
            interactable_objects: {},
        };
        this._sand_collision_layer = -1;
    }

    /** The list of TileEvents of this map. */
    get events() {
        return this._events;
    }
    /** The list of NPCs of this map. */
    get npcs() {
        return this._npcs;
    }
    /** The object that holds the NPCs of this map that have a label. */
    get npcs_label_map() {
        return this._npcs_label_map;
    }
    /** The object that holds the Interactable Objects of this map that have a label. */
    get interactable_objects_label_map() {
        return this._interactable_objects_label_map;
    }
    /** The list of Interactable Objects of this map. */
    get interactable_objects() {
        return this._interactable_objects;
    }
    /** The current active collision layer. */
    get collision_layer() {
        return this._collision_layer;
    }
    /** The sprite without texture just responsible to enable the map collision body. */
    get collision_sprite() {
        return this._collision_sprite;
    }
    /** The number of collision layers of this map. */
    get collision_layers_number() {
        return this._collision_layers_number;
    }
    /** Whether this map will load its assets only when the hero reaches it. */
    get lazy_load() {
        return this._lazy_load;
    }
    /** Whether this map is world map or not. */
    get is_world_map() {
        return this._is_world_map;
    }
    /** The map main sprite. */
    get sprite() {
        return this._sprite;
    }
    /** Whether this map has chars footprint system enabled. */
    get show_footsteps() {
        return this._show_footsteps;
    }
    /** The Phaser.Filter object responsible for this map texture color control. */
    get colorize_filter() {
        return this._colorize_filter;
    }
    /** The Phaser.Filter object responsible for this map saturation control. */
    get gray_filter() {
        return this._gray_filter;
    }
    /** The Phaser.Filter object responsible for this map mode7. */
    get mode7_filter() {
        return this._mode7_filter;
    }
    /** The map name. */
    get name() {
        return this._name;
    }
    /** The map key name. */
    get key_name() {
        return this._key_name;
    }
    /** The list of layers of this map. */
    get layers() {
        return this.sprite.layers;
    }
    /** The battle background key of this map. */
    get background_key() {
        return this._background_key;
    }
    /** The tile width of this map. */
    get tile_width() {
        return this.sprite.properties?.real_tile_width ?? this.sprite.tileWidth;
    }
    /** The tile height of this map. */
    get tile_height() {
        return this.sprite.properties?.real_tile_height ?? this.sprite.tileHeight;
    }
    /** Gets the map collision body for current collision layer. */
    get body(): Phaser.Physics.P2.Body {
        return this.collision_sprite.body;
    }
    /** Gets the enemy party encounter cumulator value. */
    get encounter_cumulator() {
        return this._encounter_cumulator;
    }
    /** Whether the map is paused or not. */
    get paused() {
        return this._paused;
    }
    /** An object of generic sprites that can be created by Game Events. */
    get generic_sprites() {
        return this._generic_sprites;
    }
    /** An object containing which filters are active in this char. */
    get active_filters() {
        return this._active_filters;
    }

    /** Gets the window object that shows this map's name. */
    get map_name_window() {
        return this._map_name_window;
    }
    /** Whether this map will show its name on teleport. */
    get show_map_name() {
        return this._show_map_name;
    }

    /** The internal storage keys created for objects of this map. */
    get internal_map_objs_storage_keys() {
        return this._internal_map_objs_storage_keys;
    }

    /** Gets Retreat psynergy info. Returns the x and y tile posoition to retreat and the destination collision index and direction. */
    get retreat_data() {
        return this._retreat_data;
    }

    /** Gets the collision layer index that sand psynergy will use. */
    get sand_collision_layer() {
        return this._sand_collision_layer;
    }

    /**
     * Sorts the sprites in the GoldenSun.middlelayer_group by y position and base_collision_layer
     * properties. After this first sort, send_to_front [boolean], sort_function [callable],
     * send_to_back [boolean] and sort_function_end [callable] Phaser.DisplayObject properties
     * are checked in this order.
     */
    sort_sprites() {
        if (this.sprites_sort_paused) {
            return;
        }
        //these arrays initializations need a better performative approach...
        const send_to_back_list = new Array(this.data.middlelayer_group.children.length);
        const send_to_front_list = new Array(this.data.middlelayer_group.children.length);
        const has_sort_function = new Array(this.data.middlelayer_group.children.length);
        const has_sort_end_function = new Array(this.data.middlelayer_group.children.length);
        this.data.middlelayer_group.children.forEach((sprite: PIXI.DisplayObjectContainer, index) => {
            if (sprite.sort_function) {
                has_sort_function[index] = sprite;
                return;
            } else if (sprite.sort_function_end) {
                has_sort_end_function[index] = sprite;
                return;
            } else if (sprite.send_to_back) {
                send_to_back_list[index] = sprite;
                return;
            } else if (sprite.send_to_front) {
                send_to_front_list[index] = sprite;
                return;
            }
        });
        this.data.middlelayer_group.customSort((a: PIXI.DisplayObjectContainer, b: PIXI.DisplayObjectContainer) => {
            if (a.base_collision_layer < b.base_collision_layer) return -1;
            if (a.base_collision_layer > b.base_collision_layer) return 1;
            if (a.is_tilemap_layer && b.is_tilemap_layer) {
                const a_layer = a as Phaser.TilemapLayer;
                const b_layer = b as Phaser.TilemapLayer;
                if (a_layer.layer_z < b_layer.layer_z) return -1;
                if (a_layer.layer_z > b_layer.layer_z) return 1;
            }
            if (a.is_tilemap_layer) return -1;
            if (b.is_tilemap_layer) return 1;
            const a_y = a.useHeightWhenSorting ? a.y + a.height : a.y;
            const b_y = b.useHeightWhenSorting ? b.y + b.height : b.y;
            if (a_y < b_y) return -1;
            if (a_y > b_y) return 1;
            return 1;
        });
        send_to_front_list.forEach(sprite => {
            if (sprite) {
                this.data.middlelayer_group.bringToTop(sprite);
            }
        });
        has_sort_function.forEach(sprite => {
            if (sprite) {
                sprite.sort_function();
            }
        });
        send_to_back_list.forEach(sprite => {
            if (sprite) {
                this.data.middlelayer_group.sendToBack(sprite);
            }
        });
        has_sort_end_function.forEach(sprite => {
            if (sprite) {
                sprite.sort_function_end();
            }
        });
    }

    /**
     * The map update function.
     */
    update() {
        if (this.paused || this.data.game_event_manager.on_event) {
            return;
        }
        this.collision_sprite.body.velocity.y = this.collision_sprite.body.velocity.x = 0;
        this.npcs.forEach(npc => npc.update());
        this.interactable_objects.forEach(io => io.update());
        for (let key in this.events) {
            this.events[key].forEach(event => event.update());
        }
        this.sort_sprites();
        this.update_map_rotation();
        this.zone_check();
    }

    /**
     * If it's a world map, rotates the map on hero movement start.
     */
    private update_map_rotation() {
        if (this.is_world_map) {
            const value_check =
                Math.abs(this.mode7_filter.angle) < Map.MAX_CAMERA_ROTATION * Math.abs(this.data.hero.current_speed.x);
            const sign_check = Math.sign(this.mode7_filter.angle) === this.data.hero.current_speed.x;
            if (this.data.hero.current_speed.x && (value_check || sign_check)) {
                this.mode7_filter.angle -= Math.sign(this.data.hero.current_speed.x) * Map.CAMERA_ROTATION_STEP;
            } else if (!this.data.hero.current_speed.x && Math.abs(this.mode7_filter.angle) > 0) {
                this.mode7_filter.angle -= Math.sign(this.mode7_filter.angle) * Map.CAMERA_ROTATION_STEP;
            }
        }
    }

    /**
     * Pauses map activity, like collisions, npc and interactable objects animation etc.
     * @returns return the current map state.
     */
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
        this._paused = true;
        return {
            previously_inactive_npc: previously_inactive_npc,
            previously_inactive_io: previously_inactive_io,
            previously_not_visible_layers: previously_not_visible_layers,
        };
    }

    /**
     * Resumes map activity, like collisions, npc and interactable objects animation etc.
     * @param previous_state the map state when it was paused.
     */
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
        this._paused = false;
    }

    /**
     * Loads the map assets like tileset and background music.
     * @param force_load if true, forces the loading process to start.
     * @param on_complete on load complete callback.
     */
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

    /**
     * Creates and setups the map collision bodies. Collision bodies for maps may come from
     * physics json file or object layers from a Tiled map.
     * @param collision_layer the collsion layer index.
     */
    config_body(collision_layer: number) {
        this._collision_layer = collision_layer;
        this.game.physics.p2.enable(this.collision_sprite, false);
        this.collision_sprite.body.clearShapes();
        if (this.collision_embedded) {
            //create collision bodies from object layer created on Tiled
            this.collision_sprite.width = this.sprite.widthInPixels;
            this.collision_sprite.height = this.sprite.heightInPixels;
            this.collision_sprite.anchor.setTo(0, 0);

            if (this.processed_polygons[this.collision_layer]) {
                for (let i = 0; i < this.processed_polygons[this.collision_layer].length; ++i) {
                    const polygon_data = this.processed_polygons[this.collision_layer][i];
                    const prev_length = this.collision_sprite.body.data.shapes.length;
                    //addPollygon modifies the polygon input
                    this.body.addPolygon(
                        {
                            optimalDecomp: false,
                            skipSimpleCheck: true,
                            removeCollinearPoints: false,
                            remove: false,
                            adjustCenterOfMass: false,
                        },
                        _.cloneDeep(polygon_data.polygon)
                    );
                    const shapes: p2.Convex[] = this.collision_sprite.body.data.shapes.slice(prev_length);
                    shapes.forEach(shape => {
                        if (polygon_data.split_polygon) {
                            this._shapes[collision_layer][polygon_data.location_key][i] = shape;
                        }
                        shape.properties = polygon_data.properties;
                        shape.sensor = polygon_data.sensor_active;
                    });
                }
            }

            const collision_layer_objects = this.sprite.objects[this.collision_layer]?.objectsData ?? [];
            for (let i = 0; i < collision_layer_objects.length; ++i) {
                const collision_object = collision_layer_objects[i];
                let sensor_active = false;
                if (collision_object.properties) {
                    sensor_active =
                        Boolean(collision_object.properties.affected_by_reveal) &&
                        Boolean(collision_object.properties.collide_on_reveal);
                    if (collision_object.properties.controller_variable) {
                        const is_sensor_by_controller = !(this.data.storage.get(
                            collision_object.properties.controller_variable
                        ) as boolean);
                        sensor_active = is_sensor_by_controller ? true : sensor_active;
                    }
                }
                if (collision_object.rectangle) {
                    const width = Math.round(collision_object.width);
                    const height = Math.round(collision_object.height);
                    const x = Math.round(collision_object.x);
                    const y = Math.round(collision_object.y);
                    const shape = this.body.addRectangle(width, height, x + (width >> 1), y + (height >> 1));
                    if (collision_object.properties) {
                        shape.properties = collision_object.properties;
                        shape.sensor = sensor_active;
                    }
                } else if (collision_object.ellipse) {
                    //even though this is an ellipse, gshtml5 only supports circles
                    const shape = this.collision_sprite.body.addCircle(
                        collision_object.width >> 1,
                        Math.round(collision_object.x) + (Math.round(collision_object.width) >> 1),
                        Math.round(collision_object.y) + (Math.round(collision_object.height) >> 1)
                    );
                    if (collision_object.properties) {
                        shape.properties = collision_object.properties;
                        shape.sensor = sensor_active;
                    }
                }
            }
        } else {
            //[DEPRECATED] load map physics data from json files.
            //will remove this after migrating all maps to new system
            this.collision_sprite.body.loadPolygon(
                this.physics_names[collision_layer],
                this.physics_names[collision_layer]
            );
        }
        this.collision_sprite.body.setCollisionGroup(this.data.collision.map_collision_group);
        this.collision_sprite.body.damping = numbers.MAP_DAMPING;
        this.collision_sprite.body.angularDamping = numbers.MAP_DAMPING;
        this.collision_sprite.body.setZeroRotation();
        this.collision_sprite.body.static = true;
        this.collision_sprite.body.data.ccdIterations = 1;
    }

    /**
     * Pre processor the map collision polygons in order to limit their
     * size to a tile size.
     */
    private pre_processor_polygons() {
        if (this.polygons_processed) {
            for (let collision_layer in this.processed_polygons) {
                for (let i = 0; i < this.processed_polygons[collision_layer].length; ++i) {
                    const polygon_data = this.processed_polygons[collision_layer][i];
                    polygon_data.sensor_active = polygon_data.sensor_active_original;
                }
            }
            return;
        }
        for (let j = 0; j < this.collision_layers_number; ++j) {
            const collision_layer = j;
            this._shapes[collision_layer] = {};
            this._big_shapes_tiles[collision_layer] = new Set<number>();
            this._bodies_positions[collision_layer] = {};
            const collision_layer_objects = this.sprite.objects[collision_layer]?.objectsData ?? [];
            this.processed_polygons[collision_layer] = [];
            collision_layer_objects.processed_polygons = [];
            for (let i = 0; i < collision_layer_objects.length; ++i) {
                const collision_object = collision_layer_objects[i];
                let sensor_active = false;
                let split_polygon = false;
                if (collision_object.properties) {
                    sensor_active =
                        Boolean(collision_object.properties.affected_by_reveal) &&
                        Boolean(collision_object.properties.collide_on_reveal);
                    if (collision_object.properties.controller_variable) {
                        const is_sensor_by_controller = !(this.data.storage.get(
                            collision_object.properties.controller_variable
                        ) as boolean);
                        sensor_active = is_sensor_by_controller ? true : sensor_active;
                    }
                    split_polygon = collision_object.properties.split_polygon ?? false;
                }
                let max_x = -Infinity,
                    max_y = -Infinity;
                let min_x = Infinity,
                    min_y = Infinity;
                let parsed_polygon;
                if (collision_object.polygon) {
                    parsed_polygon = collision_object.polygon.map((point: number[]) => {
                        const x = Math.round(collision_object.x + point[0]);
                        const y = Math.round(collision_object.y + point[1]);
                        max_x = Math.max(max_x, x);
                        max_y = Math.max(max_y, y);
                        min_x = Math.min(min_x, x);
                        min_y = Math.min(min_y, y);
                        const new_point = [x, y];
                        return new_point;
                    });
                    if (!split_polygon) {
                        this.processed_polygons[collision_layer].push({
                            polygon: parsed_polygon as number[][],
                            sensor_active: sensor_active,
                            sensor_active_original: sensor_active,
                            split_polygon: split_polygon,
                            properties: collision_object.properties,
                        });
                    }
                    parsed_polygon.push(parsed_polygon[0]);
                } else if (collision_object.rectangle) {
                    const width = Math.round(collision_object.width);
                    const height = Math.round(collision_object.height);
                    const x = Math.round(collision_object.x);
                    const y = Math.round(collision_object.y);
                    min_x = x;
                    max_x = x + width;
                    min_y = y;
                    max_y = y + height;
                    if (split_polygon) {
                        this.data.logger.log_message(
                            "'split_polygon' property doesn't work for objects of 'rectangle' type. It works only for polygons."
                        );
                    }
                } else if (collision_object.ellipse) {
                    //even though this is an ellipse, gshtml5 only supports circles
                    const width = Math.round(collision_object.width);
                    const x = Math.round(collision_object.x);
                    const y = Math.round(collision_object.y);
                    min_x = x;
                    max_x = x + width;
                    min_y = y;
                    max_y = y + width;
                    if (split_polygon) {
                        this.data.logger.log_message(
                            "'split_polygon' property doesn't work for objects of 'ellipse' type. It works only for polygons."
                        );
                    }
                }
                if (collision_object.polygon || collision_object.rectangle || collision_object.ellipse) {
                    const intersections = Collision.get_polygon_tile_intersection(
                        this,
                        min_x,
                        max_x,
                        min_y,
                        max_y,
                        parsed_polygon
                    );
                    for (const [location_key, polygons] of intersections) {
                        if (!split_polygon) {
                            this._big_shapes_tiles[collision_layer].add(location_key);
                        } else {
                            this._shapes[collision_layer][location_key] = new Array(polygons.length);
                            for (let k = 0; k < polygons.length; ++k) {
                                const polygon_section = polygons[k];
                                this.processed_polygons[collision_layer].push({
                                    polygon: polygon_section,
                                    sensor_active: sensor_active,
                                    sensor_active_original: sensor_active,
                                    location_key: location_key,
                                    split_polygon: split_polygon,
                                    properties: collision_object.properties,
                                });
                            }
                        }
                    }
                }
            }
        }
        this.polygons_processed = true;
    }

    /**
     * Sets whether a tile should collide or not. Only works if there's at least
     * on collision body in the given tile position.
     * @param tile_x_pos the x tile position.
     * @param tile_y_pos the y tile position.
     * @param collide whether it should collide or not.
     * @param collision_layer the collision layer of tile. If not passed, gets the current one.
     */
    set_collision_in_tile(tile_x_pos: number, tile_y_pos: number, collide: boolean, collision_layer?: number) {
        const location_key = IntegerPairKey.get_key(tile_x_pos, tile_y_pos);
        collision_layer = collision_layer ?? this.collision_layer;
        if (collision_layer in this.processed_polygons) {
            this.processed_polygons[collision_layer].forEach(polygon_data => {
                if (polygon_data.location_key === location_key) {
                    polygon_data.sensor_active = !collide;
                }
            });
            if (this.collision_layer === collision_layer) {
                if (this.collision_layer in this._shapes && location_key in this._shapes[this.collision_layer]) {
                    this._shapes[this.collision_layer][location_key].forEach(shape => {
                        shape.sensor = !collide;
                    });
                }
            }
        }
    }

    /**
     * Checks if a given tile position is blocked by a collision object.
     * @param tile_x_pos the x tile position.
     * @param tile_y_pos the y tile position.
     * @param collision_layer the collision layer of tile. If not passed, gets the current one.
     * @param also_check_npc_io if true, will also check for NPCs and IOs.
     * @returns Returns whether the given position is blocked or not.
     */
    is_tile_blocked(
        tile_x_pos: number,
        tile_y_pos: number,
        collision_layer?: number,
        also_check_npc_io: boolean = false
    ) {
        const location_key = IntegerPairKey.get_key(tile_x_pos, tile_y_pos);
        collision_layer = collision_layer ?? this.collision_layer;
        if (location_key in this._shapes[collision_layer]) {
            const shapes = this._shapes[collision_layer][location_key];
            if (shapes.some(s => !s.sensor)) {
                return true;
            }
        }
        const tile_has_big_shape = this._big_shapes_tiles[collision_layer].has(location_key);
        if (also_check_npc_io) {
            if (collision_layer in this._bodies_positions && location_key in this._bodies_positions[collision_layer]) {
                const bodies = this._bodies_positions[collision_layer][location_key];
                if (bodies.some(b => b.shapes_collision_active)) {
                    return true;
                }
            }
        }
        return tile_has_big_shape;
    }

    /**
     * Checks if a given tile position has IOs or NPCs, if yes return a list of them.
     * @param tile_x_pos the x tile position.
     * @param tile_y_pos the y tile position.
     * @param collision_layer the collision layer of tile. If not passed, gets the current one.
     * @returns Returns a list of NPCs and IOs based on constraints given.
     */
    get_tile_bodies(tile_x_pos: number, tile_y_pos: number, collision_layer?: number) {
        const location_key = IntegerPairKey.get_key(tile_x_pos, tile_y_pos);
        collision_layer = collision_layer ?? this.collision_layer;
        let objects: (NPC | InteractableObjects)[] = [];
        if (collision_layer in this._bodies_positions) {
            if (location_key in this._bodies_positions[collision_layer]) {
                objects = this._bodies_positions[collision_layer][location_key];
            }
        }
        return objects;
    }

    /**
     * Checks whether a NPC or Interactable object has its body on map.
     * @param instance the NPC or Interactable Object instance.
     * @returns whether the body is in the map or not.
     */
    body_in_map(instance: NPC | InteractableObjects) {
        if (!instance.body) {
            return false;
        }
        const location_key = IntegerPairKey.get_key(instance.tile_x_pos, instance.tile_y_pos);
        if (instance.base_collision_layer >= 0) {
            const instances = this._bodies_positions[instance.base_collision_layer][location_key];
            return instances.includes(instance);
        }
        return false;
    }

    /**
     * Updates the new position of an IO or NPC in this map structure.
     * @param old_x the old x tile position.
     * @param old_y the old y tile position.
     * @param new_x the new x tile position.
     * @param new_y the new y tile position.
     * @param old_col_index the old collision index.
     * @param new_col_index the new collision index.
     * @param instance the NPC or IO instance.
     */
    update_body_tile(
        old_x: number,
        old_y: number,
        new_x: number,
        new_y: number,
        old_col_index: number,
        new_col_index: number,
        instance: NPC | InteractableObjects
    ) {
        this.remove_body_tile(instance, old_x, old_y, old_col_index);
        if (new_col_index >= 0 && new_col_index in this._bodies_positions) {
            const new_location_key = IntegerPairKey.get_key(new_x, new_y);
            if (new_location_key in this._bodies_positions[new_col_index]) {
                this._bodies_positions[new_col_index][new_location_key].push(instance);
            } else {
                this._bodies_positions[new_col_index][new_location_key] = [instance];
            }
        }
    }

    /**
     * Removes a NPC or an IO collision track from this map.
     * @param x_tile the x tile position.
     * @param y_tile the y tile position.
     * @param collision_layer the collision index.
     * @param instance the NPC or IO instance.
     */
    remove_body_tile(instance: NPC | InteractableObjects, x_tile?: number, y_tile?: number, collision_layer?: number) {
        x_tile = x_tile ?? instance.tile_x_pos;
        y_tile = y_tile ?? instance.tile_y_pos;
        collision_layer = collision_layer ?? instance.base_collision_layer;
        if (collision_layer in this._bodies_positions) {
            const location_key = IntegerPairKey.get_key(x_tile, y_tile);
            this._bodies_positions[collision_layer][location_key] = this._bodies_positions[collision_layer][
                location_key
            ].filter(inst => inst !== instance);
            if (!this._bodies_positions[collision_layer][location_key].length) {
                delete this._bodies_positions[collision_layer][location_key];
            }
        }
    }

    /**
     * Configs map, npc and interactable objects collision bodies.
     * @param collision_layer the collsion layer index.
     */
    config_all_bodies(collision_layer: number) {
        if (!this.is_world_map) {
            this.npcs.forEach(npc => npc.config_body());
            this.interactable_objects.forEach(interactable_obj => {
                interactable_obj.config_body();
                interactable_obj.check_psynergy_casted_on_restore();
            });
        }
        this.config_body(collision_layer);
    }

    /**
     * Get the tiles that a ControllableChar is over.
     * @param controllable_char the ControllableChar.
     * @param layer if this is not specified, it's returned all tiles for the char position.
     * @returns returns a tile object: Phaser.Tile or Phaser.Tile[] if multiple layers.
     */
    get_current_tile(controllable_char: ControllableChar, layer?: Map["layers"]) {
        const x = Math.round(controllable_char.x / this.sprite.tileWidth);
        const y = Math.round(controllable_char.y / this.sprite.tileHeight);
        if (layer !== undefined) {
            return this.sprite.getTile(x, y, layer);
        } else {
            return this.layers.map(layer => this.sprite.getTile(x, y, layer.name)).filter(tile => tile);
        }
    }

    /**
     * Get a specific layer.
     * @param name the layer name.
     * @returns return the layer.
     */
    get_layer(name: string) {
        return _.find(this.layers, {name: name});
    }

    /**
     * Creates a tile event.
     * @param property_key the property name.
     * @param raw_property the properties of this event still not parsed.
     * @returns returns the created event.
     */
    private create_tile_event(property_key: string, raw_property: string) {
        try {
            const property_info = JSON.parse(raw_property);
            const event = this.data.tile_event_manager.get_event_instance(property_info);
            const this_event_location_key = IntegerPairKey.get_key(event.x, event.y);
            if (event.in_map) {
                if (!(this_event_location_key in this.events)) {
                    this.events[this_event_location_key] = [];
                }
                this.events[this_event_location_key].push(event);
            }
        } catch {
            this.data.logger.log_message(`Tile Event "${property_key}" is not a valid JSON.`);
        }
    }

    /**
     * Removes a NPC from this map.
     * @param npc the npc to be removed.
     * @param unset if true, will also unset the npc.
     */
    remove_npc(npc: NPC, unset: boolean = true) {
        this.remove_body_tile(npc);
        if (npc.label in this.npcs_label_map) {
            delete this.npcs_label_map[npc.label];
        }
        this._npcs = this._npcs.filter(n => n !== npc);
        if (unset) {
            npc.unset();
        }
    }

    /**
     * Creates a NPC.
     * @param property_key the property name.
     * @param properties the properties of this NPC, parsed or not.
     * @param not_parsed whether the properties are parsed or not.
     * @param map_index the map unique index of this NPC.
     * @returns returns the created npc.
     */
    create_npc(property_key: string, properties: any, not_parsed: boolean = true, map_index: number) {
        try {
            const npc_index = this.npcs.length;
            const snapshot_info = this.data.snapshot_manager.snapshot?.map_data.npcs[npc_index];
            const property_info = not_parsed ? JSON.parse(properties) : properties;
            const npc_db = this.data.dbs.npc_db[property_info.key_name];
            if (!npc_db) {
                this.data.logger.log_message(
                    `Could not find NPC db with '${property_info.key_name}' key. Please double-check if you registered this NPC.`
                );
            }
            let initial_action = property_info.action ?? npc_db.initial_action;
            initial_action =
                (npc_db.actions && initial_action in npc_db.actions) || !npc_db.action_aliases
                    ? initial_action
                    : npc_db.action_aliases[initial_action];
            initial_action = snapshot_info?.action ?? initial_action;
            let initial_animation;
            if (npc_db.actions && initial_action in npc_db.actions) {
                initial_animation = npc_db.actions[initial_action].initial_animation;
            } else if (initial_action && !property_info.sprite_misc_db_key) {
                this.data.logger.log_message(
                    `NPC with '${property_info.key_name}' key seems not to have '${initial_action}' action registered. Please double-check the db.`
                );
            }
            initial_animation = property_info.animation ?? initial_animation;
            initial_animation = snapshot_info?.animation ?? initial_animation;
            if (
                npc_db.actions &&
                initial_action in npc_db.actions &&
                !npc_db.actions[initial_action].animations.includes(initial_animation)
            ) {
                this.data.logger.log_message(
                    `NPC with '${property_info.key_name}' key seems not to have '${initial_animation}' animation registered. Please double-check the db.`
                );
            }
            const interaction_pattern = property_info.interaction_pattern ?? npc_db.interaction_pattern;
            const ignore_physics = property_info.ignore_physics ?? npc_db.ignore_physics;
            const voice_key = property_info.voice_key ?? npc_db.voice_key;
            const ignore_world_map_scale = property_info.ignore_world_map_scale ?? npc_db.ignore_world_map_scale;
            const enable_footsteps = property_info.enable_footsteps ?? this._show_footsteps;
            const max_distance = property_info.max_distance ?? npc_db.max_distance;
            const step_duration = property_info.step_duration ?? npc_db.step_duration;
            const wait_duration = property_info.wait_duration ?? npc_db.wait_duration;
            const base_step = property_info.base_step ?? npc_db.base_step;
            const step_max_variation = property_info.step_max_variation ?? npc_db.step_max_variation;
            const walk_speed = property_info.walk_speed ?? npc_db.walk_speed;
            const dash_speed = property_info.dash_speed ?? npc_db.dash_speed;
            const climb_speed = property_info.climb_speed ?? npc_db.climb_speed;
            const avatar = property_info.avatar ?? npc_db.avatar;
            const talk_range = property_info.talk_range ?? npc_db.talk_range;
            const anchor_x = snapshot_info?.anchor.x ?? property_info.anchor_x ?? npc_db.anchor_x;
            const anchor_y = snapshot_info?.anchor.y ?? property_info.anchor_y ?? npc_db.anchor_y;
            const scale_x = snapshot_info?.scale.x ?? property_info.scale_x ?? npc_db.scale_x;
            const scale_y = snapshot_info?.scale.y ?? property_info.scale_y ?? npc_db.scale_y;
            const base_collision_layer = snapshot_info?.base_collision_layer ?? property_info.base_collision_layer;
            const visible = snapshot_info?.visible ?? property_info.visible;
            const movement_type = snapshot_info?.movement_type ?? property_info.movement_type;
            const x = snapshot_info?.position.x ?? property_info.x;
            const y = snapshot_info?.position.y ?? property_info.y;
            const move_freely_in_event =
                snapshot_info?.move_freely_in_event ??
                property_info.move_freely_in_event ??
                npc_db.move_freely_in_event;
            const internal_storage_keys = this._internal_map_objs_storage_keys.npcs[map_index] ?? {};
            const storage_keys = Object.assign(internal_storage_keys, property_info.storage_keys);
            const npc = new NPC(
                this.game,
                this.data,
                property_info.key_name,
                property_info.label,
                map_index,
                property_info.active,
                x,
                y,
                storage_keys,
                initial_action,
                initial_animation,
                enable_footsteps,
                walk_speed,
                dash_speed,
                climb_speed,
                property_info.npc_type,
                movement_type,
                property_info.message,
                property_info.thought_message,
                property_info.back_interaction_message,
                avatar,
                property_info.shop_key,
                property_info.inn_key,
                property_info.healer_key,
                base_collision_layer,
                talk_range,
                property_info.events,
                npc_db.no_shadow,
                ignore_world_map_scale,
                anchor_x,
                anchor_y,
                scale_x,
                scale_y,
                interaction_pattern,
                property_info.affected_by_reveal,
                property_info.sprite_misc_db_key,
                ignore_physics,
                visible,
                voice_key,
                max_distance,
                step_duration,
                wait_duration,
                base_step,
                step_max_variation,
                move_freely_in_event,
                property_info.allow_interaction_when_inactive,
                property_info.after_psynergy_cast_events
            );
            this.npcs.push(npc);
            if (npc.label) {
                if (npc.label in this._npcs_label_map) {
                    this.data.logger.log_message(`NPC with '${npc.label}' label is already set in this map.`);
                } else {
                    this._npcs_label_map[npc.label] = npc;
                }
            }
            return npc;
        } catch {
            this.data.logger.log_message(`NPC "${property_key}" is not a valid JSON or does not exist in db file.`);
            return null;
        }
    }

    /**
     * Creates an interactable object.
     * @param property_key the property name.
     * @param raw_property the properties of this interactable object still not parsed.
     * @param map_index the map unique index of this interactable object.
     * @returns returns the created interactable object.
     */
    private create_interactable_object(property_key: string, raw_property: string, map_index: number) {
        try {
            const property_info = JSON.parse(raw_property);
            const io_index = this.interactable_objects.length;
            const snapshot_info = this.data.snapshot_manager.snapshot?.map_data.interactable_objects[io_index];
            const interactable_object_db = this.data.dbs.interactable_objects_db[property_info.key_name];
            if (!interactable_object_db) {
                this.data.logger.log_message(
                    `Could not find IO db with '${property_info.key_name}' key. Please double-check if you registered this IO.`
                );
            }
            let io_class: typeof InteractableObjects = InteractableObjects;
            if (interactable_object_db.pushable) {
                io_class = Pushable;
            } else if (interactable_object_db.is_rope_dock) {
                io_class = RopeDock;
            } else if (interactable_object_db.rollable) {
                io_class = RollablePillar;
            } else if (interactable_object_db.breakable) {
                io_class = Breakable;
            } else if (interactable_object_db.whirlwind_source) {
                io_class = WhirlwindSource;
            }
            const allow_jumping_over_it =
                snapshot_info?.allow_jumping_over_it ??
                property_info.allow_jumping_over_it ??
                interactable_object_db.allow_jumping_over_it;
            const allow_jumping_through_it =
                snapshot_info?.allow_jumping_through_it ??
                property_info.allow_jumping_through_it ??
                interactable_object_db.allow_jumping_through_it;
            const anchor_x = snapshot_info?.anchor?.x ?? property_info.anchor_x ?? interactable_object_db.anchor_x;
            const anchor_y = snapshot_info?.anchor?.y ?? property_info.anchor_y ?? interactable_object_db.anchor_y;
            const scale_x = snapshot_info?.scale?.x ?? property_info.scale_x ?? interactable_object_db.scale_x;
            const scale_y = snapshot_info?.scale?.y ?? property_info.scale_y ?? interactable_object_db.scale_y;
            const has_shadow = property_info.has_shadow ?? interactable_object_db.has_shadow;
            const psynergies_info = _.merge(
                {},
                interactable_object_db.psynergies_info ?? {},
                property_info.psynergies_info ?? {}
            );
            const action = snapshot_info?.action ?? property_info.action ?? interactable_object_db.initial_action;
            let animation;
            if (interactable_object_db.actions) {
                if (property_info.animation) {
                    animation = property_info.animation;
                } else {
                    if ("same_as" in interactable_object_db.actions[action]) {
                        const same_as_key = interactable_object_db.actions[action].same_as;
                        animation = interactable_object_db.actions[same_as_key].initial_animation;
                    } else {
                        animation = interactable_object_db.actions[action].initial_animation;
                    }
                }
            }
            animation = snapshot_info?.animation ?? animation;
            const x = snapshot_info?.position.x ?? property_info.x;
            const y = snapshot_info?.position.y ?? property_info.y;
            const base_collision_layer = snapshot_info?.base_collision_layer ?? property_info.base_collision_layer;
            const enable = snapshot_info?.enable ?? property_info.enable;
            const entangled_by_bush = snapshot_info?.entangled_by_bush ?? property_info.entangled_by_bush;
            const internal_storage_keys = this._internal_map_objs_storage_keys.interactable_objects[map_index] ?? {};
            const storage_keys = Object.assign(internal_storage_keys, property_info.storage_keys);
            const interactable_object = new io_class(
                this.game,
                this.data,
                property_info.key_name,
                map_index,
                x,
                y,
                storage_keys,
                property_info.allowed_tiles,
                base_collision_layer,
                property_info.not_allowed_tiles,
                property_info.object_drop_tiles,
                anchor_x,
                anchor_y,
                scale_x,
                scale_y,
                property_info.block_climb_collision_layer_shift,
                property_info.events_info,
                enable,
                entangled_by_bush,
                property_info.toggle_enable_events,
                property_info.label,
                allow_jumping_over_it,
                allow_jumping_through_it,
                psynergies_info,
                has_shadow,
                animation,
                action,
                snapshot_info,
                property_info.affected_by_reveal,
                property_info.active,
                property_info.visible
            );
            if (interactable_object.pushable) {
                (interactable_object as Pushable).initialize_pushable(
                    property_info.dock_tile_position,
                    property_info.after_push_events
                );
            } else if (interactable_object.is_rope_dock) {
                (interactable_object as RopeDock).intialize_dock_info(
                    property_info.dest_x,
                    property_info.dest_y,
                    property_info.starting_dock,
                    snapshot_info?.state_by_type.rope_dock?.tied ?? property_info.tied
                );
            } else if (interactable_object.rollable) {
                (interactable_object as RollablePillar).initialize_rolling_pillar(
                    property_info.falling_pos,
                    property_info.contact_points,
                    property_info.pillar_direction,
                    property_info.dest_pos_after_fall,
                    property_info.dest_collision_layer
                );
            } else if (interactable_object.whirlwind_source) {
                (interactable_object as WhirlwindSource).intialize_whirlwind_source(
                    property_info.dest_point,
                    property_info.emission_interval,
                    property_info.speed_factor
                );
            }
            this.interactable_objects.push(interactable_object);
            if (interactable_object.label) {
                if (interactable_object.label in this.interactable_objects_label_map) {
                    this.data.logger.log_message(
                        `Interactable Object with '${interactable_object.label}' label is already set in this map.`
                    );
                } else {
                    this.interactable_objects_label_map[interactable_object.label] = interactable_object;
                }
            }
        } catch {
            this.data.logger.log_message(
                `Interactable Object "${property_key}" is not a valid JSON or does not exist in db file.`
            );
        }
    }

    /**
     * Initializes all the interactable objects of this map.
     */
    private config_interactable_object() {
        for (let i = 0; i < this.interactable_objects.length; ++i) {
            const snapshot_info = this.data.snapshot_manager.snapshot?.map_data.interactable_objects[i];
            const interactable_object = this.interactable_objects[i];
            interactable_object.initial_config(this, snapshot_info);
            interactable_object.initialize_related_events(this);
            if (interactable_object.is_rope_dock) {
                (interactable_object as RopeDock).initialize_rope(this);
            } else if (interactable_object.breakable) {
                (interactable_object as Breakable).intialize_breakable();
            } else if (interactable_object.rollable) {
                (interactable_object as RollablePillar).config_rolling_pillar(this);
            } else if (interactable_object.whirlwind_source) {
                (interactable_object as WhirlwindSource).config_whirlwind_source();
            }
            if (
                (!snapshot_info && interactable_object.base_collision_layer in this._bodies_positions) ||
                snapshot_info?.body_in_map
            ) {
                const bodies_positions = this._bodies_positions[interactable_object.base_collision_layer];
                const location_key = IntegerPairKey.get_key(
                    interactable_object.tile_x_pos,
                    interactable_object.tile_y_pos
                );
                if (location_key in bodies_positions) {
                    bodies_positions[location_key].push(interactable_object);
                } else {
                    bodies_positions[location_key] = [interactable_object];
                }
            }
        }
    }

    /**
     * Initializes all the NPCs of this map.
     * @param custom_pos an initial custom position for this npc in px.
     */
    private config_npc() {
        for (let i = 0; i < this.npcs.length; ++i) {
            const npc = this.npcs[i];
            this.config_single_npc(npc, i);
        }
    }

    /**
     * Initializes a single NPC in this map.
     * @param npc the npc to be initialized.
     * @param map_index the map unique index of this interactable object.
     * @param custom_pos an initial custom position for this npc in px.
     */
    config_single_npc(npc: NPC, map_index: number, custom_pos?: {x?: number; y?: number}) {
        const snapshot_info = this.data.snapshot_manager.snapshot?.map_data.npcs[map_index];
        npc.init_npc(this, snapshot_info, custom_pos);
        if ((!snapshot_info && npc.base_collision_layer in this._bodies_positions) || snapshot_info?.body_in_map) {
            const bodies_positions = this._bodies_positions[npc.base_collision_layer];
            const location_key = IntegerPairKey.get_key(npc.tile_x_pos, npc.tile_y_pos);
            if (location_key in bodies_positions) {
                bodies_positions[location_key].push(npc);
            } else {
                bodies_positions[location_key] = [npc];
            }
        }
    }

    /**
     * Checks what is the suitable bounding box for the given position.
     * If no bounding box found, will fit map bounds to world size.
     * @param tile_x_pos the x tile position.
     * @param tile_y_pos the y tile position.
     */
    set_map_bounds(tile_x_pos: number, tile_y_pos: number) {
        const x = get_px_position(tile_x_pos, this.tile_width);
        const y = get_px_position(tile_y_pos, this.tile_height);
        let bound_set = false;
        for (let i = 0; i < this.bounding_boxes.length; ++i) {
            const bounding_box = this.bounding_boxes[i];
            if (bounding_box.contains(x, y)) {
                this.game.camera.bounds.setTo(bounding_box.x, bounding_box.y, bounding_box.width, bounding_box.height);
                bound_set = true;
                break;
            }
        }
        if (!bound_set) {
            this.game.camera.setBoundsToWorld();
        }
        if (this.game.camera.bounds?.width < numbers.GAME_WIDTH) {
            this.game.camera.bounds.width = numbers.GAME_WIDTH;
        }
        if (this.game.camera.bounds?.height < numbers.GAME_HEIGHT) {
            this.game.camera.bounds.height = numbers.GAME_HEIGHT;
        }
    }

    /**
     * Processes Tiled layers to check whether they have configs related to collision,
     * encounter zones and bounding boxes.
     */
    private process_tiled_layers() {
        let collision_layers_counter = 0;
        const layers_to_join: {[layer: number]: Array<any>} = {};
        this.sprite.objects = _.mapKeys(this.sprite.objects, (objs: any, layer_name: string) => {
            if (objs.properties?.encounter_zone) {
                //creates encounter zones
                objs.objectsData.forEach(this_obj => {
                    const zone = new Phaser.Rectangle(
                        this_obj.x | 0,
                        this_obj.y | 0,
                        this_obj.width | 0,
                        this_obj.height | 0
                    );
                    try {
                        this.encounter_zones.push({
                            rectangle: zone,
                            base_rate: this_obj.properties?.base_rate ?? objs.properties?.base_rate ?? 0,
                            parties: this_obj.properties?.parties ? JSON.parse(this_obj.properties.parties) : [],
                            background_key: this_obj.properties?.background_key ?? null,
                        });
                    } catch {
                        this.data.logger.log_message(`Parties data is not a valid JSON in ${layer_name} layer.`);
                    }
                });
                return layer_name;
            } else if (objs.properties?.join_with_layer !== undefined) {
                //checks if this layer is going to be joined with another one
                if (objs.properties.join_with_layer in layers_to_join) {
                    layers_to_join[objs.properties.join_with_layer] = layers_to_join[
                        objs.properties.join_with_layer
                    ].concat(objs.objectsData);
                } else {
                    layers_to_join[objs.properties.join_with_layer] = objs.objectsData;
                }
                objs.objectsData = null;
                return layer_name;
            } else if (objs.properties?.layer_index !== undefined) {
                //checks if this layer has the collision layer index specified
                ++collision_layers_counter;
                return objs.properties.layer_index;
            } else if (objs.properties?.bounding_box) {
                //checks if this layer has bounding boxes
                objs.objectsData.forEach(this_obj => {
                    const bounding_box = new Phaser.Rectangle(
                        this_obj.x | 0,
                        this_obj.y | 0,
                        this_obj.width | 0,
                        this_obj.height | 0
                    );
                    this.bounding_boxes.push(bounding_box);
                });
                return layer_name;
            } else {
                //the default behavior is to treat the layer name as a collision index.
                ++collision_layers_counter;
                return parseInt(layer_name);
            }
        }) as any;
        if (this.collision_embedded) {
            this._collision_layers_number = collision_layers_counter;
        }
        for (let layer in layers_to_join) {
            //joins collision layers
            this.sprite.objects[layer].objectsData = this.sprite.objects[layer].objectsData.concat(
                layers_to_join[layer]
            );
        }
    }

    /**
     * Parses the over property of a given layer.
     * @param property_value the over property value.
     * @returns returns -1 if under the hero or the threshold collision layer to be under.
     */
    private parse_over_prop(property_value: any): number {
        const property_type = typeof property_value;
        switch (property_type) {
            case "boolean":
                return property_value ? this.collision_layers_number : -1;
            case "number":
                return property_value;
            default:
                this.data.logger.log_message(`'${property_type}' is not a valid type for 'over'.`);
                return -1;
        }
    }

    /**
     * Creates, initializes and organize the map layers sprites.
     * @param reorganize if true, it will only reorganize the layers. It's expected that the layers were already created.
     */
    config_layers(reorganize: boolean = false) {
        this.data.underlayer_group.removeAll(false, true, false);
        this.data.overlayer_group.removeAll(false, true, false);
        for (let i = 0; i < this.layers.length; ++i) {
            const layer_obj = this.layers[i];
            let layer_sprite: Phaser.TilemapLayer = null;
            if (!reorganize) {
                layer_sprite = this.sprite.createLayer(layer_obj.name);
                layer_sprite.layer_z = i;
                layer_sprite.is_tilemap_layer = true;
                layer_obj.sprite = layer_sprite;
                layer_sprite.resizeWorld();
                if (layer_obj.properties.blend_mode !== undefined) {
                    layer_sprite.blendMode = parse_blend_mode(layer_obj.properties.blend_mode);
                }
                if (layer_obj.alpha !== undefined) {
                    layer_sprite.alpha = layer_obj.alpha;
                }
                const hidden =
                    typeof layer_obj.properties.hidden === "string"
                        ? this.data.storage.get(layer_obj.properties.hidden)
                        : layer_obj.properties.hidden;
                if (layer_obj.properties.reveal_layer || hidden) {
                    layer_sprite.visible = false;
                }
            } else {
                layer_sprite = layer_obj.sprite;
            }

            let target_collision_layer = -1;
            if (layer_obj.properties.over !== undefined) {
                target_collision_layer = this.parse_over_prop(layer_obj.properties.over);
            }
            if (target_collision_layer > -1) {
                layer_sprite.base_collision_layer = target_collision_layer;
                this.data.middlelayer_group.add(layer_sprite);
            } else {
                this.data.underlayer_group.add(layer_sprite);
            }
        }
    }

    /**
     * Gets the zones that the hero is in. Zones are only available if hero is moving.
     * @returns a Set of zones.
     */
    public get_current_zones() {
        if (this.data.hero.in_movement(true) && this.encounter_zones.length) {
            const zones = new Set<Map["encounter_zones"][0]>();
            for (let i = 0; i < this.encounter_zones.length; ++i) {
                const zone = this.encounter_zones[i];
                if (zone.rectangle.contains(this.data.hero.x, this.data.hero.y)) {
                    zones.add(zone);
                }
            }
            return zones.size ? zones : null;
        } else {
            return null;
        }
    }

    /**
     * Checks whether it's time to start a random battle.
     */
    private zone_check() {
        const zones = this.get_current_zones();
        if (!zones) {
            return;
        }
        const zones_list = [...zones];
        const base_rate = _.mean(zones_list.map(zone => zone.base_rate)) | 0;
        if (this.start_battle_encounter(base_rate)) {
            const parties = zones_list
                .map(zone => zone.parties)
                .flat()
                .filter(party => {
                    if (this.data.dbs.enemies_parties_db[party].active_storage_key) {
                        return this.data.storage.get(this.data.dbs.enemies_parties_db[party].active_storage_key);
                    } else {
                        return true;
                    }
                });

            let tile_bg_key = null;
            const current_tiles = this.get_current_tile(this.data.hero) as Phaser.Tile[];
            for (let i = 0; i < current_tiles.length; ++i) {
                const tile = current_tiles[i];
                if (tile.properties.background_key) {
                    tile_bg_key = tile.properties.background_key;
                    break;
                }
            }
            const zone_bg_key = zones_list[zones_list.length - 1].background_key;
            const background_key = zone_bg_key ?? tile_bg_key ?? this.background_key;

            if (parties.length) {
                const bgm =
                    this.data.info.party_data.members[0].key_name in this.data.info.battle_bgms
                        ? this.data.info.battle_bgms[this.data.info.party_data.members[0].key_name]
                        : this.data.info.battle_bgms.default;
                const weights = parties.map(party => this.data.dbs.enemies_parties_db[party].weight ?? 1);
                const party = weighted_random_pick(parties, weights);
                const event = this.data.game_event_manager.get_event_instance(
                    {
                        type: event_types.BATTLE,
                        background_key: background_key,
                        enemy_party_key: party,
                        bgm: bgm,
                        reset_previous_bgm: true,
                    },
                    game_event_origin.MISC
                ) as BattleEvent;
                let get_djinn_fire_event;
                event.assign_before_fade_finish_callback((victory, all_party_fled) => {
                    if (victory && !all_party_fled) {
                        if (this.data.dbs.enemies_parties_db[party].djinn) {
                            get_djinn_fire_event = this.get_djinn_on_world_map(
                                this.data.dbs.enemies_parties_db[party].djinn
                            );
                        }
                    }
                });
                event.assign_finish_callback((victory, all_party_fled) => {
                    if (victory && !all_party_fled) {
                        if (this.data.dbs.enemies_parties_db[party].active_storage_key) {
                            this.data.storage.set(this.data.dbs.enemies_parties_db[party].active_storage_key, false);
                        }
                        if (get_djinn_fire_event !== undefined) {
                            get_djinn_fire_event();
                        }
                    }
                });
                event.fire();
            }
        }
    }

    /**
     * Calculates whether it's time to start a random battle.
     * @param zone_base_rate the encounter finding rate of the current battle zone.
     * @returns returns true if it's time to start a random battle.
     */
    private start_battle_encounter(zone_base_rate: number) {
        const a = (_.random(0xffff) - _.random(0xffff) + _.random(0xffff) - _.random(0xffff)) >> 1;
        const avg_level = this.data.info.party_data.avg_level;
        const expected_level = this.expected_party_level ?? avg_level;
        const b = _.clamp(avg_level - expected_level + 1, 0, 5);
        const c = 5 * b + zone_base_rate;
        const d = c * (0x10000 + a) - a;
        const e = 1 + this.data.info.party_data.random_battle_extra_rate;
        const speed_factor = this.data.hero.get_encounter_speed_factor();
        this._encounter_cumulator += 64 * ((0x4000000 / d) | 0) * speed_factor * e;
        if (this.encounter_cumulator >= 0x100000) {
            this._encounter_cumulator = 0;
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

    /**
     * Creates a NPC representing the djinn to be gotten and a game event to get this djinn.
     * @param djinn_key the djinn key to be gotten.
     * @returns return the fire event function of the DjinnEvent instance created in this function.
     */
    private get_djinn_on_world_map(djinn_key: string) {
        const djinn = this.data.info.djinni_list[djinn_key];
        const npc = this.create_npc(
            null,
            {
                key_name: Djinn.sprite_base_key(djinn.element),
                x: this.data.hero.tile_x_pos - 2,
                y: this.data.hero.tile_y_pos - 2,
                npc_type: npc_types.NORMAL,
                initial_action: base_actions.IDLE,
                movement_type: npc_movement_types.IDLE,
                base_collision_layer: this.collision_layer,
                events: [
                    {
                        type: event_types.DJINN_GET,
                        djinn_key: djinn_key,
                    },
                ],
            },
            false,
            this.npcs.length
        );
        if (npc) {
            npc.init_npc(this);
            return () => {
                const event = npc.events[0] as DjinnGetEvent;
                event.set_on_event_finish(() => {
                    this._npcs = this.npcs.filter(n => n !== npc);
                    npc.unset();
                });
                event.fire(npc);
            };
        } else {
            this.data.logger.log_message("Null NPC gotten...");
            return () => {};
        }
    }

    /**
     * Adds a generic sprite to this map.
     * @param key_name the generic sprite key name.
     * @param sprite_key the sprite key name.
     * @param x the x position in px.
     * @param y the y position in px.
     * @param group the Phaser.Group to be in.
     * @param options some options.
     * @returns returns the generated sprite.
     */
    add_generic_sprite(
        key_name: string,
        misc_sprite_key: string,
        x: number,
        y: number,
        group: Phaser.Group,
        options?: {
            /** The frame key name to be set for this sprite. */
            frame?: string;
            /** The sprite alpha value. */
            alpha?: number;
            /** The sprite ancho x value. */
            anchor_x?: number;
            /** The sprite ancho y value. */
            anchor_y?: number;
            /** The sprite scale x value. */
            scale_x?: number;
            /** The sprite scale y value. */
            scale_y?: number;
            /** The sprite rotation value. */
            rotation?: number;
            /** If true, an animation of this sprite will be started. */
            play?: boolean;
            /** The frame rate of the animation. */
            frame_rate?: number;
            /** Whether the animation will loop. */
            loop?: boolean;
            /** The animation action key. */
            action?: string;
            /** The animation key. */
            animation?: string;
            /** The collision layer that the sprite will be. Important when sorting sprites. */
            collision_layer?: number;
        }
    ) {
        if (key_name in this.generic_sprites) {
            this.data.logger.log_message(`Generic sprite "${key_name}" already exists.`);
            return null;
        }
        const sprite_base = this.data.info.misc_sprite_base_list[misc_sprite_key];
        const action = options?.action ?? sprite_base.all_actions[0];
        const sprite_key = sprite_base.getSpriteKey(action);
        const generic_sprite = this.game.add.sprite(x, y, sprite_key, options?.frame, group);
        this.generic_sprites[key_name] = generic_sprite;
        generic_sprite.roundPx = true;
        generic_sprite.alpha = options?.alpha ?? generic_sprite.alpha;
        generic_sprite.anchor.x = options?.anchor_x ?? generic_sprite.anchor.x;
        generic_sprite.anchor.y = options?.anchor_y ?? generic_sprite.anchor.y;
        generic_sprite.scale.x = options?.scale_x ?? generic_sprite.scale.x;
        generic_sprite.scale.y = options?.scale_y ?? generic_sprite.scale.y;
        generic_sprite.rotation = options?.rotation ?? generic_sprite.rotation;
        generic_sprite.base_collision_layer = options?.collision_layer ?? this.collision_layer;
        if (options?.play) {
            const anim_key = sprite_base.getAnimationKey(action, options.animation);
            const anim = generic_sprite.animations.getAnimation(anim_key);
            anim.play(options?.frame_rate, options?.loop);
        }
        return generic_sprite;
    }

    /**
     * Removes a generic sprite from this map.
     * @param key_name the generic sprite key name.
     * @returns return true if the sprite was removed.
     */
    remove_generic_sprite(key_name: string) {
        if (key_name in this.generic_sprites) {
            this.generic_sprites[key_name].destroy();
            delete this._generic_sprites[key_name];
            return true;
        }
        return false;
    }

    /**
     * Initializes game events of this map.
     * @param events list of input events before parse.
     * @param event_type the type of game event that's being intialized.
     * @param property_key the property key name in case of "options_list" game event type.
     */
    init_game_events(
        events: string,
        event_type: "regular" | "before_config" | "options_list" = "regular",
        property_key?: string
    ) {
        try {
            let events_arr = JSON.parse(events);
            if (event_type !== "options_list" && !Array.isArray(events_arr)) {
                this.data.logger.log_message("Map Game Events list is not an Array type.");
                return;
            }
            if (event_type === "options_list") {
                events_arr = [events_arr];
            }
            events_arr.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info, game_event_origin.MAP);
                if (event_type === "regular") {
                    this.game_events.push(event);
                } else if (event_type === "before_config") {
                    this.before_config_game_events.push(event);
                } else if (event_type === "options_list") {
                    this.other_game_events.push(event);
                }
            });
        } catch {
            if (event_type !== "options_list") {
                this.data.logger.log_message("Map Game Events list is not a valid JSON.");
            } else if (property_key) {
                this.data.logger.log_message(`Game event '${property_key}' is not a valid JSON.`);
            }
        }
    }

    /**
     * Fires this map game events.
     * @param before_config if true, it will fire before config events instead.
     */
    fire_game_events(before_config: boolean = false) {
        if (before_config) {
            this.before_config_game_events.forEach(event => event.fire());
        } else {
            this.game_events.forEach(event => event.fire());
        }
    }

    /**
     * Checks whether this map has the given tile event placed somewhere.
     * @param event_id the id of the tile event.
     * @returns whether the given tile event is on the map.
     */
    has_event(event_id: number) {
        const event = TileEvent.get_event(event_id);
        return event.in_map;
    }

    /**
     * Removes a tile event in a custom location.
     * @param location_key the LocationKey of the event.
     * @param event_id the id of the event.
     */
    remove_event(location_key: number, event_id: number) {
        this.events[location_key] = this.events[location_key].filter(event => event.id !== event_id);
        if (!this.events[location_key].length) {
            delete this.events[location_key];
        }
        TileEvent.get_event(event_id).in_map = false;
    }

    /**
     * Initializes the window that shows the map name when entering on it.
     */
    initialize_map_name_window() {
        const window_width = get_text_width(this.game, this.name, true) + 14;
        const window_height = 20;
        const window_x = (GAME_WIDTH >> 1) - (window_width >> 1);
        const window_y = GAME_HEIGHT >> 2;
        this._map_name_window = new Window(this.game, window_x, window_y, window_width, window_height);
        this.map_name_window.set_lines_of_text([this.name], {italic: true});
        this.map_name_window.group.transformCallback = () => {
            if (this.map_name_window.open) {
                this.map_name_window.group.x += this.map_name_window.x - this.map_name_window.group.worldPosition.x;
                this.map_name_window.group.y += this.map_name_window.y - this.map_name_window.group.worldPosition.y;
            }
        };
    }

    /**
     * This is the main function of this class. It mounts the map.
     * @param collision_layer the initial collision layer.
     * @param encounter_cumulator the initial encounter cumulator. If not passed, it's reset.
     * @param hero_dest an object that holds the x and y tile positions that the hero will be.
     * @param retreat_data retreat data that can be propagated from previous map if it has the same key name.
     * @returns returns the mounted map.
     */
    async mount_map(
        collision_layer: number = 0,
        encounter_cumulator?: number,
        hero_dest?: {x: number; y: number},
        retreat_data?: Map["retreat_data"]
    ) {
        if (!this.assets_loaded) {
            //lazy load assets
            let load_promise_resolve;
            const load_promise = new Promise(resolve => (load_promise_resolve = resolve));
            this.load_map_assets(true, load_promise_resolve);
            await load_promise;
        }

        //resets all events
        this._events = {};
        TileEvent.reset();
        GameEvent.reset();

        this.initialize_map_name_window();

        this._encounter_cumulator = encounter_cumulator ?? 0;

        this._collision_layer = collision_layer;
        this._sprite = this.game.add.tilemap(this.key_name);

        if (this.sprite.properties?.real_tile_width) {
            if (typeof this.sprite.properties.real_tile_width === "number") {
                this.sprite.properties.real_tile_width = parseInt(this.sprite.properties.real_tile_width);
            } else {
                this.data.logger.log_message("Map real_tile_width property must be an integer.");
            }
        }
        if (this.sprite.properties?.real_tile_height) {
            if (typeof this.sprite.properties.real_tile_height === "number") {
                this.sprite.properties.real_tile_height = parseInt(this.sprite.properties.real_tile_height);
            } else {
                this.data.logger.log_message("Map real_tile_height property must be an integer.");
            }
        }

        if (this.sprite.properties?.world_map) {
            this._is_world_map = true;
        }

        if (this.sprite.properties?.sand_collision_layer !== undefined) {
            this._sand_collision_layer = this.sprite.properties.sand_collision_layer;
        }

        if (this.sprite.properties?.sanctum) {
            try {
                const parsed_data = JSON.parse(this.sprite.properties.sanctum);
                this.data.info.last_visited_town_with_sanctum = {
                    map_key: parsed_data.map_key,
                    collision_layer: parsed_data.collision_layer,
                    tile_position: {
                        x: parsed_data.tile_position.x,
                        y: parsed_data.tile_position.y,
                    },
                };
            } catch {
                this.data.logger.log_message("The sanctum data is not a valid JSON.");
            }
        }

        const tileset_name = this.sprite.tilesets[0].name;
        this.sprite.addTilesetImage(tileset_name, this.key_name);

        this.process_tiled_layers();
        this.pre_processor_polygons();

        for (let i = 0; i < this.sprite.tilesets.length; ++i) {
            const tileset = this.sprite.tilesets[i];
            for (let tile_index in tileset.tileProperties) {
                tileset.tileProperties[tile_index].index = tile_index;
            }
        }

        if (this.sprite.properties?.footprint) {
            this._show_footsteps = true;
        }

        if (this.sprite.properties?.background_key) {
            if (typeof this.sprite.properties.background_key === "string") {
                this._background_key = this.sprite.properties.background_key;
            } else {
                this.data.logger.log_message("Map background_key property must be 'string'.");
            }
        }

        if (this.sprite.properties?.expected_party_level) {
            if (typeof this.sprite.properties.background_key === "number") {
                this.expected_party_level = parseInt(this.sprite.properties.expected_party_level);
            } else {
                this.data.logger.log_message("Map background_key property must be an integer.");
            }
        }

        if (retreat_data) {
            this._retreat_data = retreat_data;
        } else if (this.data.snapshot_manager.snapshot?.map_data.retreat_data) {
            this._retreat_data = this.data.snapshot_manager.snapshot?.map_data.retreat_data;
        } else if (this.sprite.properties?.retreat_data) {
            try {
                const parsed_data = JSON.parse(this.sprite.properties.retreat_data);
                const closest_retreat_point = parsed_data.reduce((acc, cur) => {
                    const prev_dist = acc ? get_sqr_distance(hero_dest.x, acc.x, hero_dest.y, acc.y) : Infinity;
                    const cur_dist = get_sqr_distance(hero_dest.x, cur.x, hero_dest.y, cur.y);
                    return cur_dist < prev_dist ? cur : acc;
                }, null);
                this._retreat_data = closest_retreat_point;
                this._retreat_data.direction = directions[closest_retreat_point.direction as string];
            } catch {
                this.data.logger.log_message("The Retreat data is not a valid JSON.");
            }
        }

        if (this.sprite.properties?.game_events) {
            this.init_game_events(this.sprite.properties.game_events);
        }

        if (this.sprite.properties?.before_config_game_events) {
            this.init_game_events(this.sprite.properties.game_events, "before_config");
        }

        //read the map properties and creates tile events, npcs and interactable objects
        if (this.sprite.properties) {
            let map_index = 0;
            for (let property_key in this.sprite.properties) {
                const property = this.sprite.properties[property_key];
                if (property_key.startsWith("tile_event/")) {
                    this.create_tile_event(property_key, property);
                } else if (property_key.startsWith("npc/")) {
                    this.create_npc(property_key, property, true, map_index);
                } else if (property_key.startsWith("interactable_object/")) {
                    this.create_interactable_object(property_key, property, map_index);
                } else if (property_key.startsWith("game_event/")) {
                    this.init_game_events(property, "options_list", property_key);
                }
                ++map_index;
            }
        }

        //call before config events list. Meant to be fired before npc, IO and layers config.
        this.fire_game_events(true);

        this.config_layers();
        this.config_interactable_object();
        this.config_npc();

        this.config_world_map();

        this.data.audio.set_bgm(this.bgm_key, true);

        return this;
    }

    /**
     * Initializes some world map custom features of this map in the case it's a world map.
     */
    private config_world_map() {
        let next_body_radius = numbers.HERO_BODY_RADIUS;
        if (this.is_world_map) {
            this.manage_filter(this.mode7_filter, true);
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
            this.game.camera.bounds = new Phaser.Rectangle();
            this.game.camera.bounds.copyFrom(this.game.world.bounds);
        }

        if (this.data.hero && next_body_radius !== this.data.hero.body_radius) {
            this.data.hero.config_body(this.is_world_map ? numbers.HERO_BODY_RADIUS_M7 : numbers.HERO_BODY_RADIUS);
            if (this.is_world_map) {
                this.data.hero.sprite.scale.setTo(numbers.WORLD_MAP_SPRITE_SCALE_X, numbers.WORLD_MAP_SPRITE_SCALE_Y);
                this.data.hero.shadow.scale.setTo(numbers.WORLD_MAP_SPRITE_SCALE_X, numbers.WORLD_MAP_SPRITE_SCALE_Y);
                if (this.is_world_map) {
                    this.data.hero.create_half_crop_mask();
                }
            } else {
                this.data.hero.sprite.scale.setTo(1, 1);
                this.data.hero.shadow.scale.setTo(1, 1);
                this.data.hero.shadow.visible = true;
                this.data.hero.sprite.mask.destroy();
                this.data.hero.sprite.mask = null;
            }
        }
    }

    /**
     * Sets a storage key identifier for a NPC or Interactable Object in order to hold values internally
     * if this map is unmounted.
     * @param is_npc is true, will set the key for a NPC, otherwise for an Interactable Object.
     * @param property the storage key type.
     * @param storage_key the storage key.
     * @param obj_index the NPC or Interactable Object index in this map.
     */
    set_internal_storage_key(
        is_npc: boolean,
        property: keyof (InteractableObjects["storage_keys"] & NPC["storage_keys"]),
        storage_key: string,
        obj_index: number
    ) {
        if (is_npc) {
            if (!this._internal_map_objs_storage_keys.npcs[obj_index]) {
                this._internal_map_objs_storage_keys.npcs[obj_index] = {};
            }
            this._internal_map_objs_storage_keys.npcs[obj_index][property] = storage_key;
        } else {
            if (!this._internal_map_objs_storage_keys.interactable_objects[obj_index]) {
                this._internal_map_objs_storage_keys.interactable_objects[obj_index] = {};
            }
            this._internal_map_objs_storage_keys.interactable_objects[obj_index][property] = storage_key;
        }
    }

    /**
     * Initializes internal storage keys with snapshot info.
     * @param internal_map_objs_storage_keys the snapshot init object.
     */
    initialize_internal_storage_key(internal_map_objs_storage_keys: Map["internal_map_objs_storage_keys"]) {
        if (internal_map_objs_storage_keys) {
            this._internal_map_objs_storage_keys = internal_map_objs_storage_keys;
        }
    }

    /**
     * Sets or unsets a Phaser.Filter in this map.
     * @param filter the filter you want to set.
     * @param set whether it's to set or unset the filter.
     * @param layer specify a layer if you want that this filter management should be only for the given layer.
     */
    manage_filter(filter: Phaser.Filter, set: boolean, layer?: string) {
        this.active_filters[filter.key] = set;
        const test_sprite = this.layers[0].sprite;
        if (set) {
            if (test_sprite.filters && !test_sprite.filters.includes(filter)) {
                this.layers.forEach(l => {
                    if (layer && l.name !== layer) {
                        return;
                    }
                    l.sprite.filters = [...l.sprite.filters, filter];
                });
            } else if (!test_sprite.filters) {
                this.layers.forEach(l => {
                    if (layer && l.name !== layer) {
                        return;
                    }
                    l.sprite.filters = [filter];
                });
            }
        } else {
            if (test_sprite.filters?.includes(filter)) {
                if (test_sprite.filters.length === 1) {
                    this.layers.forEach(l => {
                        if (layer && l.name !== layer) {
                            return;
                        }
                        l.sprite.filters = undefined;
                    });
                } else {
                    this.layers.forEach(l => {
                        if (layer && l.name !== layer) {
                            return;
                        }
                        l.sprite.filters = l.sprite.filters.filter(f => f !== filter);
                    });
                }
            }
        }
    }

    /**
     * Unsets all filters in this map.
     */
    unset_all_filters() {
        for (let key in this.active_filters) {
            this.active_filters[key] = false;
        }
        this.layers.forEach(l => (l.sprite.filters = undefined));
    }

    /**
     * Unsets this map.
     */
    unset_map() {
        this.unset_all_filters();
        this.layers.forEach(layer => layer.sprite.destroy());
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
        this.game_events.forEach(event => event?.destroy());
        this.before_config_game_events.forEach(event => event?.destroy());
        this.other_game_events.forEach(event => event?.destroy());

        this.data.collision.clear_custom_bodies();

        for (let key in this.generic_sprites) {
            this.generic_sprites[key].destroy();
        }
        this._generic_sprites = {};

        TileEvent.reset();
        GameEvent.reset();

        for (let collision_layer in this._bodies_positions) {
            this._bodies_positions[collision_layer] = {};
        }

        this._npcs = [];
        this._npcs_label_map = {};
        this._interactable_objects = [];
        this._interactable_objects_label_map = {};
        this._events = {};
        this.data.middlelayer_group.removeAll();
        this.encounter_zones = [];
        this.bounding_boxes = [];
        this.game_events = [];
        this.before_config_game_events = [];
        this.other_game_events = [];
        this.data.middlelayer_group.add(this.data.hero.shadow);
        this.data.middlelayer_group.add(this.data.hero.sprite);

        if (this.map_name_window) this.map_name_window.destroy(false);
    }
}
