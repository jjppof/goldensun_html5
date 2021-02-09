import {NPC} from "./NPC";
import {InteractableObjects} from "./InteractableObjects";
import {TileEvent} from "./tile_events/TileEvent";
import * as numbers from "./magic_numbers";
import {GameEvent} from "./game_events/GameEvent";
import {GoldenSun} from "./GoldenSun";
import * as _ from "lodash";
import {ControllableChar} from "./ControllableChar";

export class Map {
    private static readonly MAX_CAMERA_ROTATION = 0.035;
    private static readonly CAMERA_ROTATION_STEP = 0.003;

    public game: Phaser.Game;
    public data: GoldenSun;
    public name: string;
    public key_name: string;
    public tileset_name: string;
    public physics_names: string;
    public tileset_image_url: string;
    public tileset_json_url: string;
    public physics_jsons_url: string;
    public sprite: Phaser.Tilemap;
    public events: {[location_key: string]: TileEvent[]};
    public npcs: NPC[];
    public interactable_objects: InteractableObjects[];
    public collision_layers_number: number;
    public collision_sprite: Phaser.Sprite;
    public color_filter: any;
    public mode7_filter: any;
    public collision_layer: number;
    public show_footsteps: boolean;
    public assets_loaded: boolean;
    public lazy_load: boolean;
    public layers: any[];
    public collision_embedded: boolean;
    public is_world_map: boolean;
    public bgm_key: string;
    public bgm_url: string;

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
        bgm_url
    ) {
        this.game = game;
        this.data = data;
        this.name = name;
        this.key_name = key_name;
        this.tileset_name = tileset_name;
        this.physics_names = physics_names === undefined ? [] : physics_names;
        this.tileset_image_url = tileset_image_url;
        this.tileset_json_url = tileset_json_url;
        this.physics_jsons_url = physics_jsons_url === undefined ? [] : physics_jsons_url;
        this.sprite = null;
        this.events = {};
        this.npcs = [];
        this.interactable_objects = [];
        this.collision_layers_number = this.physics_names.length;
        this.collision_sprite = this.game.add.sprite(0, 0);
        this.collision_sprite.width = this.collision_sprite.height = 0;
        this.color_filter = this.game.add.filter("ColorFilters");
        this.mode7_filter = this.game.add.filter("Mode7");
        this.collision_layer = null;
        this.show_footsteps = false;
        this.assets_loaded = false;
        this.lazy_load = lazy_load === undefined ? false : lazy_load;
        this.layers = [];
        this.collision_embedded = collision_embedded === undefined ? false : collision_embedded;
        this.is_world_map = false;
        this.bgm_key = bgm_key;
        this.bgm_url = bgm_url;
    }

    get tile_width() {
        return this.sprite.properties?.real_tile_width !== undefined
            ? this.sprite.properties.real_tile_width
            : this.sprite.tileWidth;
    }

    get tile_height() {
        return this.sprite.properties?.real_tile_height !== undefined
            ? this.sprite.properties.real_tile_height
            : this.sprite.tileHeight;
    }

    sort_sprites() {
        let send_to_back_list = new Array(this.data.npc_group.children.length);
        let send_to_front_list = new Array(this.data.npc_group.children.length);
        let has_sort_function = new Array(this.data.npc_group.children.length);
        this.data.npc_group.children.forEach((sprite: Phaser.Sprite, index) => {
            sprite.y_sort = parseInt(sprite.base_collision_layer.toString() + sprite.y.toString());
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
        let shadow_index = this.data.npc_group.getChildIndex(this.data.hero.sprite) - 1;
        if (shadow_index >= -1 && shadow_index < this.data.npc_group.children.length) {
            if (shadow_index === -1) {
                shadow_index = 0;
            }
            this.data.npc_group.setChildIndex(this.data.hero.shadow, shadow_index); //making sure that shadow is always behind the hero
        }
        send_to_back_list.forEach(sprite => {
            if (sprite) {
                this.data.npc_group.sendToBack(sprite);
            }
        });
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
    }

    freeze_body() {
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
    }

    update_map_rotation() {
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

    load_map_assets(force_load: boolean, on_complete: () => void) {
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
        if (force_load) {
            Promise.all(promises).then(() => {
                this.assets_loaded = true;
                on_complete();
            });
            this.game.load.start();
        }
    }

    config_body(collision_layer: number) {
        this.game.physics.p2.enable(this.collision_sprite, false);
        this.collision_sprite.body.clearShapes();
        if (this.collision_embedded) {
            this.collision_sprite.width = this.sprite.widthInPixels;
            this.collision_sprite.height = this.sprite.heightInPixels;
            this.collision_sprite.anchor.setTo(0, 0);
            const collision_layer_objects = this.sprite.objects[this.collision_layer];
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
                        shape.sensor = true;
                    }
                }
            }
        } else {
            this.collision_sprite.body.loadPolygon(
                //load map physics data json files
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

    config_all_bodies(collision_layer: number) {
        if (!this.is_world_map) {
            this.npcs.forEach(npc => npc.config_body());
            this.interactable_objects.forEach(interactable_obj => interactable_obj.config_body());
        }
        this.config_body(collision_layer);
    }

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

    create_tile_events(raw_property) {
        const property_info = JSON.parse(raw_property);
        const this_event_location_key = TileEvent.get_location_key(property_info.x, property_info.y);
        if (!(this_event_location_key in this.events)) {
            this.events[this_event_location_key] = [];
        }
        const event = this.data.tile_event_manager.get_event_instance(property_info);
        this.events[this_event_location_key].push(event);
    }

    create_npcs(raw_property) {
        const property_info = JSON.parse(raw_property);
        const npc_db = this.data.dbs.npc_db[property_info.key_name];
        const initial_action = property_info.initial_action ?? npc_db.initial_action;
        const initial_animation = property_info.animation_key ?? npc_db.actions[initial_action].initial_direction;
        const interaction_pattern = property_info.interaction_pattern ?? npc_db.interaction_pattern;
        const ignore_physics = property_info.ignore_physics ?? npc_db.ignore_physics;
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
            property_info.enable_footsteps,
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
            property_info.ignore_world_map_scale !== undefined
                ? property_info.ignore_world_map_scale
                : npc_db.ignore_world_map_scale,
            property_info.anchor_x,
            property_info.anchor_y,
            property_info.scale_x,
            property_info.scale_y,
            interaction_pattern,
            property_info.affected_by_reveal,
            property_info.sprite_misc_db_key,
            ignore_physics,
            property_info.visible
        );
        this.npcs.push(npc);
    }

    create_interactable_objects(raw_property) {
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

    config_interactable_object() {
        for (let i = 0; i < this.interactable_objects.length; ++i) {
            const interactable_object = this.interactable_objects[i];
            interactable_object.sprite_info = this.data.info.iter_objs_sprite_base_list[interactable_object.key_name];
            interactable_object.initial_config(this);
            interactable_object.initialize_related_events(this.events, this);
        }
    }

    async config_npc() {
        for (let i = 0; i < this.npcs.length; ++i) {
            const npc = this.npcs[i];
            await npc.init_npc(this);
        }
    }

    config_layers(overlayer_group: Phaser.Group, underlayer_group: Phaser.Group) {
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
                overlayer_group.add(layer);
            } else {
                underlayer_group.add(layer);
            }
        }
    }

    async mount_map(collision_layer: number) {
        if (!this.assets_loaded) {
            let load_promise_resolve;
            const load_promise = new Promise(resolve => (load_promise_resolve = resolve));
            this.load_map_assets(true, load_promise_resolve);
            await load_promise;
        }
        this.collision_layer = collision_layer;
        this.events = {};
        TileEvent.reset();
        GameEvent.reset();
        this.sprite = this.game.add.tilemap(this.key_name);
        if (this.sprite.properties?.world_map) {
            this.is_world_map = true;
        }

        this.sprite.addTilesetImage(this.tileset_name, this.key_name);
        this.sprite.objects = _.mapKeys(this.sprite.objects, (obj: any, collision_index: string) => {
            return parseInt(collision_index);
        }) as any;
        if (this.collision_embedded) {
            this.collision_layers_number = Object.keys(this.sprite.objects).length;
        }

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
            } else if (property.startsWith("npc")) {
                this.create_npcs(raw_property);
            } else if (property.startsWith("interactable_object")) {
                this.create_interactable_objects(raw_property);
            }
        }

        this.layers = this.sprite.layers.sort((a, b) => {
            if (a.properties.over !== b.properties.over) return a - b;
            if (a.properties.z !== b.properties.z) return a - b;
        });

        this.config_layers(this.data.overlayer_group, this.data.underlayer_group);
        this.config_interactable_object();
        await this.config_npc();

        if (this.sprite.properties?.footprint) {
            this.show_footsteps = true;
        }

        this.config_world_map();

        this.data.audio.add_bgm(this.bgm_key, true);

        return this;
    }

    config_world_map() {
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

        if (this.show_footsteps) {
            this.data.hero.footsteps.clean_all();
        }

        let sprites_to_remove = [];
        for (let i = 0; i < this.data.npc_group.children.length; ++i) {
            let sprite = this.data.npc_group.children[i] as Phaser.Sprite;
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
