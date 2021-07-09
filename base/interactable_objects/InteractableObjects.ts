import {SpriteBase} from "../SpriteBase";
import {event_types, LocationKey, TileEvent} from "../tile_events/TileEvent";
import * as numbers from "../magic_numbers";
import {directions, get_directions, get_surroundings, mount_collision_polygon, reverse_directions} from "../utils";
import {JumpEvent} from "../tile_events/JumpEvent";
import {ClimbEvent} from "../tile_events/ClimbEvent";
import {GoldenSun} from "../GoldenSun";
import {Map} from "../Map";
import { RopeEvent } from "../tile_events/RopeEvent";

export enum interactable_object_interaction_types {
    ONCE = "once",
    INFINITE = "infinite",
}

export enum interactable_object_event_types {
    JUMP = "jump",
    JUMP_AROUND = "jump_around",
    CLIMB = "climb",
    ROPE = "rope"
}

export class InteractableObjects {
    protected game: Phaser.Game;
    protected data: GoldenSun;

    private allowed_tiles: {x: number; y: number; collision_layer: number}[];
    private not_allowed_tiles: {x: number; y: number}[];
    private events_id: Set<TileEvent["id"]>;
    private collision_change_functions: Function[];
    private anchor_x: number;
    private anchor_y: number;
    private scale_x: number;
    private scale_y: number;
    private storage_keys: {
        position?: string;
        base_collision_layer?: string;
    };
    private tile_events_info: {
        [event_id: number]: {
            collision_layer_shift?: number;
            intermediate_collision_layer_shift?: number;
        };
    };
    private block_climb_collision_layer_shift: number;

    private _key_name: string;
    private _x: number;
    private _y: number;
    private _sprite_info: SpriteBase;
    private _base_collision_layer: number;
    private _current_x: number;
    private _current_y: number;
    private _collision_tiles_bodies: Phaser.Physics.P2.Body[];
    private _color_filter: any;
    private _sprite: Phaser.Sprite;
    private _psynergy_casted: {[field_psynergy_key: string]: boolean};
    private _blocking_stair_block: Phaser.Physics.P2.Body;
    private _active: boolean;
    private _object_drop_tiles: {
        x: number;
        y: number;
        dest_x: number;
        dest_y: number;
        destination_collision_layer: number;
        animation_duration: number;
        dust_animation: boolean;
    }[];
    protected _pushable: boolean;
    protected _is_rope_dock: boolean;
    protected _extra_sprites: (Phaser.Sprite | Phaser.Graphics | Phaser.Group)[];

    constructor(
        game,
        data,
        key_name,
        x,
        y,
        storage_keys,
        allowed_tiles,
        base_collision_layer,
        not_allowed_tiles,
        object_drop_tiles,
        anchor_x,
        anchor_y,
        scale_x,
        scale_y,
        block_climb_collision_layer_shift,
        events_info
    ) {
        this.game = game;
        this.data = data;
        this._key_name = key_name;
        this.storage_keys = storage_keys ?? {};
        if (this.storage_keys.position !== undefined) {
            const position = this.data.storage.get(this.storage_keys.position);
            x = position.x;
            y = position.y;
        }
        this._x = x;
        this._y = y;
        this._sprite_info = null;
        this.allowed_tiles = allowed_tiles ?? [];
        if (this.storage_keys.base_collision_layer !== undefined) {
            base_collision_layer = this.data.storage.get(this.storage_keys.base_collision_layer);
        }
        this._base_collision_layer = base_collision_layer ?? 0;
        this.not_allowed_tiles = not_allowed_tiles ?? [];
        this._object_drop_tiles = object_drop_tiles ?? [];
        this.events_id = new Set();
        this._current_x = this.x;
        this._current_y = this.y;
        this._collision_tiles_bodies = [];
        this.collision_change_functions = [];
        this._color_filter = this.game.add.filter("ColorFilters");
        this.anchor_x = anchor_x;
        this.anchor_y = anchor_y;
        this.scale_x = scale_x;
        this.scale_y = scale_y;
        this._psynergy_casted = {};
        this.block_climb_collision_layer_shift = block_climb_collision_layer_shift;
        this._active = true;
        this._pushable = false;
        this._is_rope_dock = false;
        this.tile_events_info = {};
        for (let index in events_info) {
            this.tile_events_info[+index] = events_info[index];
        }
        this._extra_sprites = [];
    }

    get key_name() {
        return this._key_name;
    }
    get x() {
        return this._x;
    }
    get y() {
        return this._y;
    }
    get current_x() {
        return this._current_x;
    }
    get current_y() {
        return this._current_y;
    }
    get base_collision_layer() {
        return this._base_collision_layer;
    }
    get sprite() {
        return this._sprite;
    }
    get sprite_info() {
        return this._sprite_info;
    }
    get object_drop_tiles() {
        return this._object_drop_tiles;
    }
    get blocking_stair_block() {
        return this._blocking_stair_block;
    }
    get psynergy_casted() {
        return this._psynergy_casted;
    }
    get color_filter() {
        return this._color_filter;
    }
    get collision_tiles_bodies() {
        return this._collision_tiles_bodies;
    }
    get active() {
        return this._active;
    }
    get pushable() {
        return this._pushable;
    }
    get is_rope_dock() {
        return this._is_rope_dock;
    }

    position_allowed(x: number, y: number) {
        if (
            this.data.map.interactable_objects.filter(io => {
                return io.current_x === x && io.current_y === y;
            }).length
        ) {
            return false;
        }
        for (let i = 0; i < this.allowed_tiles.length; ++i) {
            const tile = this.allowed_tiles[i];
            if (tile.x === x && tile.y === y && tile.collision_layer === this.data.map.collision_layer) {
                return true;
            }
        }
        return false;
    }

    get_current_position(map: Map) {
        const x = (this.sprite.x / map.tile_width) | 0;
        const y = (this.sprite.y / map.tile_height) | 0;
        return {x: x, y: y};
    }

    set_tile_position(pos: {x?: number; y?: number}) {
        if (pos.x) {
            this._current_x = pos.x;
        }
        if (pos.y) {
            this._current_y = pos.y;
        }
    }

    change_collision_layer(destination_collision_layer: number) {
        this.sprite.body.removeCollisionGroup(
            this.data.collision.interactable_objs_collision_groups[this.base_collision_layer]
        );
        this.sprite.body.setCollisionGroup(
            this.data.collision.interactable_objs_collision_groups[destination_collision_layer]
        );
        this._base_collision_layer = destination_collision_layer;
        this.sprite.base_collision_layer = destination_collision_layer;
        this.collision_change_functions.forEach(f => f());
    }

    insert_event(id: number) {
        this.events_id.add(id);
    }

    get_events() {
        return [...this.events_id].map(id => TileEvent.get_event(id));
    }

    remove_event(id: number) {
        this.events_id.delete(id);
    }

    destroy_collision_tiles_bodies() {
        this._collision_tiles_bodies.forEach(body => {
            body.destroy();
        });
        this._collision_tiles_bodies = [];
    }

    private set_anchor() {
        const interactable_object_db = this.data.dbs.interactable_objects_db[this.key_name];
        if (this.anchor_x !== undefined) {
            this.sprite.anchor.x = interactable_object_db.anchor_x;
        } else if (interactable_object_db.anchor_x !== undefined) {
            this.sprite.anchor.x = interactable_object_db.anchor_x;
        }
        if (this.anchor_y !== undefined) {
            this.sprite.anchor.y = interactable_object_db.anchor_y;
        } else if (interactable_object_db.anchor_y !== undefined) {
            this.sprite.anchor.y = interactable_object_db.anchor_y;
        }
    }

    private set_scale() {
        const interactable_object_db = this.data.dbs.interactable_objects_db[this.key_name];
        if (this.scale_x !== undefined) {
            this.sprite.scale.x = interactable_object_db.scale_x;
        } else if (interactable_object_db.scale_x !== undefined) {
            this.sprite.scale.x = interactable_object_db.scale_x;
        }
        if (this.scale_y !== undefined) {
            this.sprite.scale.y = interactable_object_db.scale_y;
        } else if (interactable_object_db.scale_y !== undefined) {
            this.sprite.scale.y = interactable_object_db.scale_y;
        }
    }

    private creating_blocking_stair_block() {
        const target_layer = this.base_collision_layer + this.block_climb_collision_layer_shift;
        const x_pos = (this.current_x + 0.5) * this.data.map.tile_width;
        const y_pos = (this.current_y + 1.5) * this.data.map.tile_height - 4;
        const body = this.game.physics.p2.createBody(x_pos, y_pos, 0, true);
        body.clearShapes();
        const width = this.data.dbs.interactable_objects_db[this.key_name].body_radius * 2;
        body.setRectangle(width, width, 0, 0);
        if (!(target_layer in this.data.collision.interactable_objs_collision_groups)) {
            this.data.collision.interactable_objs_collision_groups[
                target_layer
            ] = this.game.physics.p2.createCollisionGroup();
        }
        body.setCollisionGroup(this.data.collision.interactable_objs_collision_groups[target_layer]);
        body.damping = numbers.MAP_DAMPING;
        body.angularDamping = numbers.MAP_DAMPING;
        body.setZeroRotation();
        body.fixedRotation = true;
        body.dynamic = false;
        body.static = true;
        body.debug = this.data.hero.sprite.body.debug;
        body.collides(this.data.collision.hero_collision_group);
        this._blocking_stair_block = body;
    }

    initial_config(map: Map) {
        this._sprite_info = this.data.info.iter_objs_sprite_base_list[this.key_name];
        const interactable_object_db = this.data.dbs.interactable_objects_db[this.key_name];
        for (let psynergy_key in interactable_object_db.psynergy_keys) {
            const psynergy_properties = interactable_object_db.psynergy_keys[psynergy_key];
            if (psynergy_properties.interaction_type === interactable_object_interaction_types.ONCE) {
                this.psynergy_casted[psynergy_key] = false;
            }
        }
        const interactable_object_key = this.sprite_info.getSpriteKey(this.key_name);
        const interactable_object_sprite = this.data.npc_group.create(0, 0, interactable_object_key);
        this._sprite = interactable_object_sprite;
        this.sprite.is_interactable_object = true;
        this.sprite.roundPx = true;
        this.sprite.base_collision_layer = this.base_collision_layer;
        this.sprite.filters = [this.color_filter];
        if (interactable_object_db.send_to_back !== undefined) {
            this.sprite.send_to_back = interactable_object_db.send_to_back;
        }
        this.set_anchor();
        this.set_scale();
        const shift_x = interactable_object_db.shift_x ?? 0;
        const shift_y = interactable_object_db.shift_y ?? 0;
        this.sprite.x = (this.x + 0.5) * map.tile_width + shift_x;
        this.sprite.y = (this.y + 0.5) * map.tile_height + shift_y;
        this.sprite_info.setAnimation(this.sprite, this.key_name);
        const initial_animation = interactable_object_db.initial_animation;
        const anim_key = this.sprite_info.getAnimationKey(this.key_name, initial_animation);
        this.sprite.animations.play(anim_key);
    }

    initialize_related_events(map: Map) {
        const position = this.get_current_position(map);
        let x_pos = position.x;
        let y_pos = position.y;
        for (let i = 0; i < this.data.dbs.interactable_objects_db[this.key_name].events.length; ++i) {
            const event_info = Object.assign(this.data.dbs.interactable_objects_db[this.key_name].events[i], this.tile_events_info[i] ?? {});
            x_pos += event_info.x_shift ?? 0;
            y_pos += event_info.y_shift ?? 0;
            const collision_layer_shift = this.tile_events_info[i]?.collision_layer_shift ?? 0;
            const active_event = event_info.active ?? true;
            const target_layer = this.base_collision_layer + collision_layer_shift;
            switch (event_info.type) {
                case interactable_object_event_types.JUMP:
                    this.set_jump_type_event(i, event_info, x_pos, y_pos, active_event, target_layer, map.events);
                    break;
                case interactable_object_event_types.JUMP_AROUND:
                    this.set_jump_around_event(event_info, x_pos, y_pos, active_event, target_layer, map.events);
                    break;
                case interactable_object_event_types.CLIMB:
                    this.set_stair_event(i, event_info, x_pos, y_pos, active_event, target_layer, map.events);
                    break;
                case interactable_object_event_types.ROPE:
                    this.set_rope_event(event_info, x_pos, y_pos, active_event, target_layer, map.events, map.collision_layer);
                    break;
            }
        }
    }

    play(action: string, animation: string, frame_rate?: number, loop?: boolean) {
        const anim_key = this.sprite_info.getAnimationKey(action, animation);
        return this.sprite.animations.play(anim_key, frame_rate, loop);
    }

    private not_allowed_tile_test(x: number, y: number) {
        for (let i = 0; i < this.not_allowed_tiles.length; ++i) {
            const not_allowed_tile = this.not_allowed_tiles[i];
            if (not_allowed_tile.x === x && not_allowed_tile.y === y) {
                return true;
            }
        }
        return false;
    }

    private set_jump_type_event(
        event_index: number,
        event_info: any,
        x_pos: number,
        y_pos: number,
        active_event: boolean,
        target_layer: number,
        map_events: Map["events"]
    ) {
        if (this.not_allowed_tile_test(x_pos, y_pos)) return;
        const this_event_location_key = LocationKey.get_key(x_pos, y_pos);
        if (!(this_event_location_key in map_events)) {
            map_events[this_event_location_key] = [];
        }
        const new_event = new JumpEvent(
            this.game,
            this.data,
            x_pos,
            y_pos,
            [
                reverse_directions[directions.right],
                reverse_directions[directions.left],
                reverse_directions[directions.down],
                reverse_directions[directions.up],
            ],
            [target_layer],
            event_info.dynamic,
            active_event,
            undefined,
            false,
            event_info.is_set ?? true
        );
        map_events[this_event_location_key].push(new_event);
        this.insert_event(new_event.id);
        const collision_layer_shift = this.tile_events_info[event_index]?.collision_layer_shift ?? 0;
        new_event.collision_layer_shift_from_source = collision_layer_shift;
        this.collision_change_functions.push(() => {
            new_event.set_activation_collision_layers(this.base_collision_layer + collision_layer_shift);
        });
    }

    private set_rope_event(
        event_info: any,
        x_pos: number,
        y_pos: number,
        active_event: boolean,
        target_layer: number,
        map_events: Map["events"],
        collision_layer: number
    ) {
        const activation_directions = event_info.activation_directions ?? get_directions(false).map(dir => reverse_directions[dir]);
        activation_directions.forEach((direction_label: string) => {
            const direction = directions[direction_label];
            let x = x_pos;
            let y = y_pos;
            switch(direction) {
                case directions.up:
                    ++y;
                    break;
                case directions.down:
                    --y;
                    break;
                case directions.right:
                    --x;
                    break;
                case directions.left:
                    ++x;
                    break;
                default:
                    return;
            }
            if (this.not_allowed_tile_test(x, y)) return;
            const this_event_location_key = LocationKey.get_key(x, y);
            if (!(this_event_location_key in map_events)) {
                map_events[this_event_location_key] = [];
            }
            const new_event: RopeEvent = this.data.tile_event_manager.get_event_instance({
                x: x,
                y: y,
                type: event_types.ROPE,
                activation_directions: direction_label,
                activation_collision_layers: [target_layer],
                dynamic: event_info.dynamic,
                active: active_event,
                active_storage_key: undefined,
                affected_by_reveal: false,
                origin_interactable_object: this,
                dest_x: event_info.dest_x,
                dest_y: event_info.dest_y,
                starting_dock: event_info.starting_dock,
                walk_over_rope: event_info.walk_over_rope,
                dock_exit_collision_layer: event_info.dock_exit_collision_layer ?? collision_layer,
                tied: event_info.tied,
            }) as RopeEvent;
            map_events[this_event_location_key].push(new_event);
            this.insert_event(new_event.id);
        });
    }

    private set_jump_around_event(
        event_info: any,
        x_pos: number,
        y_pos: number,
        active_event: boolean,
        target_layer: number,
        map_events: Map["events"]
    ) {
        const is_set = event_info.is_set ?? true;
        get_surroundings(x_pos, y_pos).forEach((pos, index) => {
            if (this.not_allowed_tile_test(pos.x, pos.y)) return;
            const this_event_location_key = LocationKey.get_key(pos.x, pos.y);
            if (!(this_event_location_key in map_events)) {
                map_events[this_event_location_key] = [];
            }
            const new_event = new JumpEvent(
                this.game,
                this.data,
                pos.x,
                pos.y,
                [
                    reverse_directions[directions.right],
                    reverse_directions[directions.left],
                    reverse_directions[directions.down],
                    reverse_directions[directions.up],
                ][index],
                [target_layer],
                event_info.dynamic,
                active_event,
                undefined,
                false,
                is_set
            );
            map_events[this_event_location_key].push(new_event);
            this.insert_event(new_event.id);
            this.collision_change_functions.push(() => {
                new_event.set_activation_collision_layers(this.base_collision_layer);
            });
        });
    }

    private set_stair_event(
        event_index: number,
        event_info: any,
        x_pos: number,
        y_pos: number,
        active_event: boolean,
        target_layer: number,
        map_events: Map["events"]
    ) {
        const collision_layer_shift = this.tile_events_info[event_index]?.collision_layer_shift ?? 0;
        const intermediate_collision_layer_shift =
            this.tile_events_info[event_index]?.intermediate_collision_layer_shift ?? 0;
        const events_data = [
            {
                x: x_pos,
                y: y_pos + 1,
                activation_directions: [reverse_directions[directions.up]],
                activation_collision_layers: [this.base_collision_layer],
                change_to_collision_layer: this.base_collision_layer + intermediate_collision_layer_shift,
                climbing_only: false,
                collision_change_function: (event: ClimbEvent) => {
                    event.set_activation_collision_layers(this.base_collision_layer);
                    event.change_collision_layer_destination(
                        this.base_collision_layer + intermediate_collision_layer_shift
                    );
                },
                collision_layer_shift_from_source: 0,
            },
            {
                x: x_pos,
                y: y_pos,
                activation_directions: [reverse_directions[directions.down]],
                activation_collision_layers: [this.base_collision_layer + intermediate_collision_layer_shift],
                change_to_collision_layer: this.base_collision_layer,
                climbing_only: true,
                collision_change_function: (event: ClimbEvent) => {
                    event.set_activation_collision_layers(
                        this.base_collision_layer + intermediate_collision_layer_shift
                    );
                    event.change_collision_layer_destination(this.base_collision_layer);
                },
                collision_layer_shift_from_source: 0,
            },
            {
                x: x_pos,
                y: y_pos + event_info.top_event_y_shift + 1,
                activation_directions: [reverse_directions[directions.up]],
                activation_collision_layers: [this.base_collision_layer + intermediate_collision_layer_shift],
                change_to_collision_layer: target_layer,
                climbing_only: true,
                collision_change_function: (event: ClimbEvent) => {
                    event.set_activation_collision_layers(
                        this.base_collision_layer + intermediate_collision_layer_shift
                    );
                    event.change_collision_layer_destination(this.base_collision_layer + collision_layer_shift);
                },
                collision_layer_shift_from_source: collision_layer_shift,
            },
            {
                x: x_pos,
                y: y_pos + event_info.top_event_y_shift,
                activation_directions: [reverse_directions[directions.down]],
                activation_collision_layers: [target_layer],
                change_to_collision_layer: this.base_collision_layer + intermediate_collision_layer_shift,
                climbing_only: false,
                collision_change_function: (event: ClimbEvent) => {
                    event.set_activation_collision_layers(this.base_collision_layer + collision_layer_shift);
                    event.change_collision_layer_destination(
                        this.base_collision_layer + intermediate_collision_layer_shift
                    );
                },
                collision_layer_shift_from_source: collision_layer_shift,
            },
        ];
        events_data.forEach(event_data => {
            const this_location_key = LocationKey.get_key(event_data.x, event_data.y);
            if (!(this_location_key in map_events)) {
                map_events[this_location_key] = [];
            }
            const new_event = new ClimbEvent(
                this.game,
                this.data,
                event_data.x,
                event_data.y,
                event_data.activation_directions,
                event_data.activation_collision_layers,
                event_info.dynamic,
                active_event,
                undefined,
                false,
                event_data.change_to_collision_layer,
                event_info.is_set,
                this,
                event_data.climbing_only
            );
            map_events[this_location_key].push(new_event);
            this.insert_event(new_event.id);
            new_event.collision_layer_shift_from_source = event_data.collision_layer_shift_from_source;
            this.collision_change_functions.push(event_data.collision_change_function.bind(null, new_event));
        });
    }

    toggle_active(active: boolean) {
        if (active) {
            this.sprite.body?.collides(this.data.collision.hero_collision_group);
            this._collision_tiles_bodies.forEach(body => {
                body.collides(this.data.collision.hero_collision_group);
            });
            if (this._blocking_stair_block) {
                this._blocking_stair_block.collides(this.data.collision.hero_collision_group);
            }
            this.sprite.visible = true;
            this._active = true;
        } else {
            this.sprite.body?.removeCollisionGroup(this.data.collision.hero_collision_group);
            this._collision_tiles_bodies.forEach(body => {
                body.removeCollisionGroup(this.data.collision.hero_collision_group);
            });
            if (this._blocking_stair_block) {
                this._blocking_stair_block.removeCollisionGroup(this.data.collision.hero_collision_group);
            }
            this.sprite.visible = false;
            this._active = false;
        }
    }

    config_body() {
        const db = this.data.dbs.interactable_objects_db[this.key_name];
        if (db.body_radius === 0 || this.base_collision_layer < 0) return;
        const collision_groups = this.data.collision.interactable_objs_collision_groups;
        this.game.physics.p2.enable(this.sprite, false);
        this.set_anchor(); //Important to be after the previous command
        this.sprite.body.clearShapes();
        const width = db.body_radius << 1;
        const polygon = mount_collision_polygon(width, -(width >> 1), db.collision_body_bevel);
        this.sprite.body.addPolygon(
            {
                optimalDecomp: false,
                skipSimpleCheck: true,
                removeCollinearPoints: false,
            },
            polygon
        );
        this.sprite.body.setCollisionGroup(collision_groups[this.base_collision_layer]);
        this.sprite.body.damping = 1;
        this.sprite.body.angularDamping = 1;
        this.sprite.body.setZeroRotation();
        this.sprite.body.fixedRotation = true;
        this.sprite.body.dynamic = false;
        this.sprite.body.static = true;
        if (this.block_climb_collision_layer_shift !== undefined) {
            this.creating_blocking_stair_block();
        }
    }

    unset(remove_from_npc_group: boolean = true) {
        if (this.sprite) {
            this.sprite.destroy();
        }
        this._extra_sprites.forEach(sprite => sprite.destroy());
        if (this.blocking_stair_block) {
            this.blocking_stair_block.destroy();
        }
        this.collision_tiles_bodies.forEach(body => {
            body.destroy();
        });
        if (remove_from_npc_group) {
            this.data.npc_group.removeChild(this.sprite);
        }
    }
}
