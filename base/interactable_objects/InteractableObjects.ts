import {SpriteBase} from "../SpriteBase";
import {event_types, LocationKey, TileEvent} from "../tile_events/TileEvent";
import * as numbers from "../magic_numbers";
import {
    directions,
    get_centered_pos_in_px,
    get_directions,
    get_opposite_direction,
    get_px_position,
    get_surroundings,
    mount_collision_polygon,
    reverse_directions,
} from "../utils";
import {JumpEvent} from "../tile_events/JumpEvent";
import {ClimbEvent} from "../tile_events/ClimbEvent";
import {GoldenSun} from "../GoldenSun";
import {Map} from "../Map";
import {RopeEvent} from "../tile_events/RopeEvent";
import {GameEvent} from "../game_events/GameEvent";

export enum interactable_object_interaction_types {
    ONCE = "once",
    INFINITE = "infinite",
}

export enum interactable_object_event_types {
    JUMP = "jump",
    JUMP_AROUND = "jump_around",
    CLIMB = "climb",
    ROPE = "rope",
}

export class InteractableObjects {
    private static readonly BUSH_KEY = "bush";
    private static readonly BUSH_FRAME = "leaves/bush/00";

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
        enable?: string;
        entangled_by_bush?: string;
    };
    private tile_events_info: {
        [event_id: number]: {
            collision_layer_shift?: number;
            intermediate_collision_layer_shift?: number;
        };
    };
    private block_climb_collision_layer_shift: number;

    private _key_name: string;
    private _sprite_info: SpriteBase;
    private _base_collision_layer: number;
    private _tile_x_pos: number;
    private _tile_y_pos: number;
    private _collision_tiles_bodies: Phaser.Physics.P2.Body[];
    private _color_filter: any;
    private _enable: boolean;
    private _entangled_by_bush: boolean;
    private _sprite: Phaser.Sprite;
    private _psynergy_casted: {[field_psynergy_key: string]: boolean};
    private _blocking_stair_block: Phaser.Physics.P2.Body;
    private _active: boolean;
    private _label: string;
    private _object_drop_tiles: {
        x: number;
        y: number;
        dest_x: number;
        dest_y: number;
        destination_collision_layer: number;
        animation_duration: number;
        dust_animation: boolean;
    }[];
    private _bush_sprite: Phaser.Sprite;
    protected _pushable: boolean;
    protected _is_rope_dock: boolean;
    protected _rollable: boolean;
    protected _extra_sprites: (Phaser.Sprite | Phaser.Graphics | Phaser.Group)[];
    protected _allow_jumping_over_it: boolean;
    private toggle_enable_events: {
        event: GameEvent;
        on_enable: boolean;
    }[];

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
        events_info,
        enable,
        entangled_by_bush,
        toggle_enable_events,
        label
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
        this._tile_x_pos = x;
        this._tile_y_pos = y;
        this._sprite_info = null;
        this.allowed_tiles = allowed_tiles ?? [];
        if (this.storage_keys.base_collision_layer !== undefined) {
            base_collision_layer = this.data.storage.get(this.storage_keys.base_collision_layer);
        }
        this._base_collision_layer = base_collision_layer ?? 0;
        if (this.storage_keys.enable !== undefined) {
            enable = this.data.storage.get(this.storage_keys.enable);
        }
        this._enable = enable ?? true;
        if (this.storage_keys.entangled_by_bush !== undefined) {
            entangled_by_bush = this.data.storage.get(this.storage_keys.entangled_by_bush);
        }
        this._entangled_by_bush = entangled_by_bush ?? false;
        this.not_allowed_tiles = not_allowed_tiles ?? [];
        this._object_drop_tiles = object_drop_tiles ?? [];
        this.events_id = new Set();
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
        this._rollable = false;
        this.tile_events_info = {};
        for (let index in events_info) {
            this.tile_events_info[+index] = events_info[index];
        }
        this._extra_sprites = [];
        if (toggle_enable_events !== undefined) {
            this.toggle_enable_events = toggle_enable_events.map(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info.event);
                return {
                    event: event,
                    on_enable: event_info.on_enable,
                };
            });
        } else {
            this.toggle_enable_events = [];
        }
        this._label = label;
        this._allow_jumping_over_it = false;
    }

    get key_name() {
        return this._key_name;
    }
    /** Gets the current x tile position of this interactable object. */
    get tile_x_pos() {
        return this._tile_x_pos;
    }
    /** Gets the current y tile position of this interactable object. */
    get tile_y_pos() {
        return this._tile_y_pos;
    }
    /** Gets the x position in px. */
    get x(): number {
        return this.sprite.body ? this.sprite.body.x : this.sprite.x;
    }
    /** Gets the y position in px. */
    get y(): number {
        return this.sprite.body ? this.sprite.body.y : this.sprite.y;
    }
    /** The unique label that identifies this Interactable Object. */
    get label() {
        return this._label;
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
    get rollable() {
        return this._rollable;
    }
    get enable() {
        return this._enable;
    }
    get entangled_by_bush() {
        return this._entangled_by_bush;
    }
    get bush_sprite() {
        return this._bush_sprite;
    }
    get allow_jumping_over_it() {
        return this._allow_jumping_over_it;
    }

    position_allowed(x: number, y: number) {
        if (
            this.data.map.interactable_objects.filter(io => {
                return (
                    io.tile_x_pos === x && io.tile_y_pos === y && io.base_collision_layer === this.base_collision_layer
                );
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
        if (this._sprite) {
            const x = (this.sprite.x / map.tile_width) | 0;
            const y = (this.sprite.y / map.tile_height) | 0;
            return {x: x, y: y};
        } else {
            return {
                x: this.tile_x_pos,
                y: this.tile_y_pos,
            };
        }
    }

    set_tile_position(pos: {x?: number; y?: number}) {
        if (pos.x) {
            this._tile_x_pos = pos.x;
        }
        if (pos.y) {
            this._tile_y_pos = pos.y;
        }
    }

    set_enable(enable: boolean) {
        this._enable = enable;
        if (this.storage_keys.enable !== undefined) {
            this.data.storage.set(this.storage_keys.enable, enable);
        }
        this.toggle_enable_events.forEach(event_info => {
            if (enable === event_info.on_enable) {
                event_info.event.fire();
            }
        });
    }

    set_entangled_by_bush(entangled_by_bush: boolean) {
        this._entangled_by_bush = entangled_by_bush;
        if (this.storage_keys.entangled_by_bush !== undefined) {
            this.data.storage.set(this.storage_keys.entangled_by_bush, entangled_by_bush);
        }
    }

    destroy_bush() {
        if (this._bush_sprite) {
            this._bush_sprite.destroy();
            this._bush_sprite = null;
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
        //the below statement may change the events activation layers too
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
        const x_pos = (this.tile_x_pos + 0.5) * this.data.map.tile_width;
        const y_pos = (this.tile_y_pos + 1.5) * this.data.map.tile_height - 4;
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
        if (interactable_object_db.psynergy_keys) {
            for (let psynergy_key in interactable_object_db.psynergy_keys) {
                const psynergy_properties = interactable_object_db.psynergy_keys[psynergy_key];
                if (psynergy_properties.interaction_type === interactable_object_interaction_types.ONCE) {
                    this.psynergy_casted[psynergy_key] = false;
                }
            }
        }
        if (this.sprite_info) {
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
            //is this shift property necessary?
            const shift_x = interactable_object_db.shift_x ?? 0;
            const shift_y = interactable_object_db.shift_y ?? 0;
            this.sprite.x = get_centered_pos_in_px(this.tile_x_pos, map.tile_width) + shift_x;
            this.sprite.y = get_centered_pos_in_px(this.tile_y_pos, map.tile_height) + shift_y;
            this.sprite_info.setAnimation(this.sprite, this.key_name);
            const initial_animation = interactable_object_db.initial_animation;
            const anim_key = this.sprite_info.getAnimationKey(this.key_name, initial_animation);
            this.sprite.animations.play(anim_key);
            if (interactable_object_db.stop_animation_on_start) {
                //yes, is necessary to play before stopping it.
                this.sprite.animations.stop();
            }
        }
        if (this.entangled_by_bush) {
            this.init_bush(map);
        }
    }

    init_bush(map: Map) {
        this._bush_sprite = this.data.npc_group.create(0, 0, InteractableObjects.BUSH_KEY);
        this._bush_sprite.roundPx = true;
        this._bush_sprite.base_collision_layer = this.base_collision_layer;
        this._bush_sprite.anchor.setTo(0.5, 0.75);
        this._bush_sprite.frameName = InteractableObjects.BUSH_FRAME;
        if (this.sprite) {
            this._bush_sprite.x = this.sprite.x;
            this._bush_sprite.y = this.sprite.y;
            this._bush_sprite.sort_function = () => {
                this.data.npc_group.setChildIndex(
                    this._bush_sprite,
                    this.data.npc_group.getChildIndex(this.sprite) + 1
                );
            };
        } else {
            this._bush_sprite.x = get_px_position(this.tile_x_pos, map.tile_width) + (map.tile_width >> 1);
            this._bush_sprite.y = get_px_position(this.tile_y_pos, map.tile_height) + map.tile_height;
        }
        this._extra_sprites.push(this._bush_sprite);
    }

    toggle_collision(enable: boolean) {
        this.sprite.body.data.shapes.forEach(shape => (shape.sensor = !enable));
    }

    initialize_related_events(map: Map) {
        if (!this.data.dbs.interactable_objects_db[this.key_name].events) {
            return;
        }
        const position = this.get_current_position(map);
        for (let i = 0; i < this.data.dbs.interactable_objects_db[this.key_name].events.length; ++i) {
            let x_pos = position.x;
            let y_pos = position.y;
            const event_info = Object.assign(
                {},
                this.data.dbs.interactable_objects_db[this.key_name].events[i],
                this.tile_events_info[i] ?? {}
            );
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
                    this.set_rope_event(
                        event_info,
                        x_pos,
                        y_pos,
                        active_event,
                        target_layer,
                        map.events,
                        map.collision_layer
                    );
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
            undefined,
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
        const activation_directions =
            event_info.activation_directions ?? get_directions(false).map(dir => reverse_directions[dir]);
        [null, ...activation_directions].forEach((direction_label: string) => {
            let activation_collision_layer = target_layer;
            let activation_direction = direction_label;
            const direction = direction_label === null ? direction_label : directions[direction_label];
            let x = x_pos;
            let y = y_pos;
            switch (direction) {
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
                case null:
                    activation_direction = activation_directions.map(
                        dir => reverse_directions[get_opposite_direction(directions[dir as string])]
                    );
                    activation_collision_layer = event_info.rope_collision_layer;
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
                activation_directions: activation_direction,
                activation_collision_layers: activation_collision_layer,
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
                rope_collision_layer: event_info.rope_collision_layer,
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
                undefined,
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
                undefined,
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
        let polygon;
        if (db.custom_body_polygon) {
            polygon = db.custom_body_polygon.map(vertex => {
                return vertex.map(point => {
                    if (point === "sprite_width") {
                        point = this.sprite.width;
                    } else if (point === "sprite_height") {
                        point = this.sprite.height;
                    }
                    return point;
                });
            });
        } else {
            const width = db.body_radius << 1;
            polygon = mount_collision_polygon(width, -(width >> 1), db.collision_body_bevel);
        }
        const x = this.sprite.body.x;
        const y = this.sprite.body.y;
        this.sprite.body.addPolygon(
            {
                optimalDecomp: false,
                skipSimpleCheck: true,
                removeCollinearPoints: false,
            },
            polygon
        );
        this.sprite.body.x = x;
        this.sprite.body.y = y;
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

    /**
     * Shifts the related events of this interactable object.
     * @param event_shift_x the x shift amount.
     * @param event_shift_y the y shift amount.
     */
    shift_events(event_shift_x: number, event_shift_y: number) {
        const object_events = this.get_events();
        for (let i = 0; i < object_events.length; ++i) {
            const event = object_events[i];
            this.data.map.events[event.location_key] = this.data.map.events[event.location_key].filter(e => {
                return e.id !== event.id;
            });
            if (this.data.map.events[event.location_key].length === 0) {
                delete this.data.map.events[event.location_key];
            }
            let old_x = event.x;
            let old_y = event.y;
            let new_x = old_x + event_shift_x;
            let new_y = old_y + event_shift_y;
            event.set_position(new_x, new_y, true);

            //check for surrounding jump events, some of them may start working now.
            if (event.type === event_types.JUMP) {
                const new_surroundings = get_surroundings(new_x, new_y, false, 2);
                JumpEvent.active_jump_surroundings(
                    this.data,
                    new_surroundings,
                    event.collision_layer_shift_from_source + this.base_collision_layer
                );
                const old_surroundings = get_surroundings(old_x, old_y, false, 2);
                for (let j = 0; j < old_surroundings.length; ++j) {
                    const old_surrounding = old_surroundings[j];
                    const old_key = LocationKey.get_key(old_surrounding.x, old_surrounding.y);
                    if (old_key in this.data.map.events) {
                        for (let k = 0; k < this.data.map.events[old_key].length; ++k) {
                            const old_surr_event = this.data.map.events[old_key][k];
                            if (old_surr_event.type === event_types.JUMP) {
                                const target_layer =
                                    event.collision_layer_shift_from_source + this.base_collision_layer;
                                if (
                                    old_surr_event.activation_collision_layers.includes(target_layer) &&
                                    old_surr_event.dynamic === false
                                ) {
                                    old_surr_event.deactivate_at(get_opposite_direction(old_surrounding.direction));
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Method to be overriden.
     */
    custom_unset() {}

    unset(remove_from_npc_group: boolean = true) {
        if (this.sprite) {
            this.sprite.destroy();
        }
        this._extra_sprites.forEach(sprite => {
            if (sprite) {
                sprite.destroy(true);
            }
        });
        if (this.blocking_stair_block) {
            this.blocking_stair_block.destroy();
        }
        this.collision_tiles_bodies.forEach(body => {
            body.destroy();
        });
        this.toggle_enable_events.forEach(event_info => {
            event_info.event.destroy();
        });
        if (remove_from_npc_group) {
            this.data.npc_group.removeChild(this.sprite);
        }
        this.custom_unset();
    }
}
