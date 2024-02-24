import * as numbers from "./magic_numbers";
import {
    reverse_directions,
    base_actions,
    directions,
    range_360,
    get_transition_directions,
    get_centered_pos_in_px,
    get_distance,
    get_tile_position,
    get_sqr_distance,
    engine_filters,
    promised_wait,
} from "./utils";
import {Footsteps} from "./utils/Footsteps";
import {GoldenSun} from "./GoldenSun";
import {SpriteBase} from "./SpriteBase";
import {Map} from "./Map";
import {Pushable} from "./interactable_objects/Pushable";
import {RollablePillar} from "./interactable_objects/RollingPillar";
import {StoragePosition} from "./Storage";
import {FieldAbilities} from "field_abilities/FieldAbilities";
import {climb_actions} from "./tile_events/ClimbEvent";
import {NPC} from "NPC";
import {SandFieldPsynergy} from "./field_abilities/SandFieldPsynergy";
import {TeleportEvent} from "./tile_events/TeleportEvent";
import * as _ from "lodash";

/**
 * All chars that can be controlled by human (Hero) or code/event procedures (NPC)
 * have this class as the parent class. This class gives a lot of resources to control
 * a char in the engine.
 */
export abstract class ControllableChar {
    private static readonly DEFAULT_SHADOW_KEYNAME = "shadow";
    private static readonly DEFAULT_SHADOW_ANCHOR_X = 0.45;
    private static readonly DEFAULT_SHADOW_ANCHOR_Y = 0.05;
    private static readonly DEFAULT_SPRITE_ANCHOR_X = 0.5;
    private static readonly DEFAULT_SPRITE_ANCHOR_Y = 0.8;
    private static readonly SLIDE_ICE_SPEED = 95;
    private static readonly SLIDE_ICE_WALK_FRAME_RATE = 20;
    private static readonly WALK_OVER_ROPE_SPEED = 30;
    private static readonly WALK_OVER_ROPE_FRAME_RATE = 5;
    private static readonly INTERACTION_RANGE_ANGLE = numbers.degree75;
    private static readonly TIME_PER_TILE = 40;
    private static readonly DUST_KEY = "dust";
    private static readonly DUST_ANIM_KEY = "spread";
    private static readonly DUST_COUNT_GROUND_HIT = 7;
    private static readonly DUST_RADIUS_GROUND_HIT = 18;
    private static readonly default_anchor = {
        x: ControllableChar.DEFAULT_SPRITE_ANCHOR_X,
        y: ControllableChar.DEFAULT_SPRITE_ANCHOR_Y,
    };

    protected game: Phaser.Game;
    protected data: GoldenSun;
    private _key_name: string;
    private _is_npc: boolean;

    /* properties the controls the movement speed */
    protected _current_speed: {x: number; y: number};
    protected _temp_speed: {x: number; y: number};
    protected _force_diagonal_speed: {x: number; y: number};
    protected _extra_speed: number;
    protected _extra_speed_force: {x: number; y: number};
    protected walk_speed: number;
    protected dash_speed: number;
    protected climb_speed: number;

    /** Whether the char is idle/stopped due to collision. */
    public stop_by_colliding: boolean;
    /** Whether the char had its direction changed due to side collision. */
    public force_direction: boolean;
    /** Whether this char is dashing. */
    public dashing: boolean;
    /** Whether this char is climbing. */
    public climbing: boolean;
    /** Whether this char is pushing an Interactable Object. */
    public pushing: boolean;
    /** Whether this char is jumping. */
    public jumping: boolean;
    /** Whether this char is cliff sliding. */
    public sliding: boolean;
    /** Whether this char is busy by any misc. reason. */
    public misc_busy: boolean;
    /** Whether this char is casting psynergy. */
    public casting_psynergy: boolean;
    /** Whether this char is under Reveal psynergy effect. */
    public on_reveal: boolean;
    /** Whether this char is under custom psynergy effect. */
    public on_custom_psynergy_effect: boolean;
    /** Whether this char is teleporting by the teleport TileEvent. */
    public teleporting: boolean;
    /** Whether this char is idle during climbing state. */
    public idle_climbing: boolean;
    /** Whether this char is under an ice sliding ground. */
    public ice_sliding_active: boolean;
    /** Whether this char is sliding/moving over an ice ground. */
    public sliding_on_ice: boolean;
    /** Whether thic char is trying to push an Interactable Object. */
    public trying_to_push: boolean;
    /** Whether this char is walking over a rope. */
    public walking_over_rope: boolean;
    /** Whether this char is climbing a rope. */
    public climbing_rope: boolean;
    /** Whether this char is melted in sand. */
    public sand_mode: boolean;
    /** If true, animation play will be ignored. */
    public ignore_play: boolean;

    protected storage_keys: {
        position?: string;
        action?: string;
        animation?: string;
        active?: string;
    };
    protected _sprite_info: SpriteBase;
    /** The char main sprite object. */
    public sprite: Phaser.Sprite;
    /** The shadow sprite object. */
    public shadow: Phaser.Sprite;
    protected _body_radius: number;
    protected _tile_x_pos: number;
    protected _tile_y_pos: number;

    protected _current_action: string | base_actions;
    protected _current_animation: string;

    /** The direction that the char is moving. */
    protected _current_direction: number;

    /** The direction determined by the input. */
    protected _required_direction: number;

    /** When changing directions, the char smoothly changes to the target direction. This var holds the intermediate directions. */
    protected _transition_direction: number;

    /** The direction of the ice sliding movement that can be different of char direction. */
    protected _ice_slide_direction: number;

    /** The direction that the char is trying to push an interactable object */
    protected _trying_to_push_direction: number;

    /** Whether the char will let footprints in the ground. */
    public enable_footsteps: boolean;
    /** Whether the char is prone to have it's texture halved when going through forests. */
    public crop_texture: boolean;
    /** Whether the shadow is following or not this char. */
    public shadow_following: boolean;

    /** Forces this char to stop while in game event. */
    public force_char_stop_in_event: boolean;
    /** Forces char to assume idle action if it's forced to stop while in a game event. */
    public force_idle_action_in_event: boolean;

    /** If true, it will assume that this char is walking over a stair. This will impact this char facing direction. */
    public on_stair: boolean;

    private _colorize_filter: Phaser.Filter.Colorize;
    private _levels_filter: Phaser.Filter.Levels;
    private _color_blend_filter: Phaser.Filter.ColorBlend;
    private _hue_filter: Phaser.Filter.Hue;
    private _tint_filter: Phaser.Filter.Tint;
    private _gray_filter: Phaser.Filter.Gray;
    private _flame_filter: Phaser.Filter.Flame;
    private _watery_filter: Phaser.Filter.Watery;
    private _outline_filter: Phaser.Filter.Outline;
    private _pixel_shift_filter: Phaser.Filter.PixelShift;
    private _active_filters: {[key in engine_filters]?: boolean};
    protected _push_timer: Phaser.Timer;
    private _footsteps: Footsteps;
    private _sweat_drops: Phaser.Sprite;
    protected look_target: ControllableChar = null;
    protected _active: boolean;
    protected _emoticon_sprite: Phaser.Sprite;
    /**
     * A mask that contains in which directions the hero is colliding. Example:
     *  - If the hero is colliding on left direction, which has 4 as value, then this variable will have this value: 00010000.
     *  - If the hero is colliding on right direction, which has 0 as value, then this variable will have this value: 00000001.
     *  - Colliding in both left and right direction: 00010001.
     * */
    public colliding_directions_mask: number;
    private _rotating: boolean;
    private _rotating_interval: number;
    private _rotating_elapsed: number;
    private _rotating_frame_index: number;
    private _default_scale: {x: number; y: number};
    protected _shapes_collision_active: boolean;
    /** The function used to stop this char casting aura. */
    public casting_aura_stop_function: ReturnType<typeof FieldAbilities.init_cast_aura>;

    constructor(
        game: Phaser.Game,
        data: GoldenSun,
        key_name: string,
        enable_footsteps: boolean,
        walk_speed: number,
        dash_speed: number,
        climb_speed: number,
        is_npc: boolean,
        initial_x?: number,
        initial_y?: number,
        initial_action?: string | base_actions,
        initial_animation?: string,
        storage_keys?: ControllableChar["storage_keys"],
        active?: boolean,
        force_char_stop_in_event?: boolean,
        force_idle_action_in_event?: boolean
    ) {
        this.game = game;
        this.data = data;
        this._key_name = key_name;
        this._current_speed = {x: 0, y: 0};
        this._temp_speed = {x: 0, y: 0};
        this._force_diagonal_speed = {x: 0, y: 0};
        this._extra_speed = 0;
        this._extra_speed_force = {x: 0, y: 0};
        this.walk_speed = walk_speed;
        this.dash_speed = dash_speed;
        this.climb_speed = climb_speed;
        this.stop_by_colliding = false;
        this.colliding_directions_mask = 0;
        this.force_direction = false;
        this.dashing = false;
        this.climbing = false;
        this.pushing = false;
        this.jumping = false;
        this.sliding = false;
        this.misc_busy = false;
        this.casting_psynergy = false;
        this.on_reveal = false;
        this.on_custom_psynergy_effect = false;
        this.teleporting = false;
        this.idle_climbing = false;
        this.ice_sliding_active = false;
        this.sliding_on_ice = false;
        this.walking_over_rope = false;
        this.climbing_rope = false;
        this._is_npc = is_npc;
        this._sprite_info = null;
        this.sprite = null;
        this.shadow = null;
        this._rotating = false;
        this._body_radius = 0;
        this.storage_keys = storage_keys ?? {};
        this._active = active ?? true;
        if (this.storage_keys.active !== undefined) {
            this._active = this.data.storage.get(this.storage_keys.active) as boolean;
        }
        if (this.storage_keys.position !== undefined) {
            const position = this.data.storage.get(this.storage_keys.position) as StoragePosition;
            initial_x = position.x;
            initial_y = position.y;
        }
        this._tile_x_pos = initial_x;
        this._tile_y_pos = initial_y;
        this._current_action =
            this.storage_keys.action !== undefined
                ? (this.data.storage.get(this.storage_keys.action) as string)
                : initial_action;
        initial_animation =
            this.storage_keys.animation !== undefined
                ? (this.data.storage.get(this.storage_keys.animation) as string)
                : initial_animation;
        this._current_direction = initial_animation in directions ? directions[initial_animation] : null;
        this._current_animation = initial_animation;
        this._required_direction = null;
        this._transition_direction = this.current_direction;
        this._ice_slide_direction = null;
        this._colorize_filter = this.game.add.filter("Colorize") as Phaser.Filter.Colorize;
        this._levels_filter = this.game.add.filter("Levels") as Phaser.Filter.Levels;
        this._color_blend_filter = this.game.add.filter("ColorBlend") as Phaser.Filter.ColorBlend;
        this._hue_filter = this.game.add.filter("Hue") as Phaser.Filter.Hue;
        this._tint_filter = this.game.add.filter("Tint") as Phaser.Filter.Tint;
        this._gray_filter = this.game.add.filter("Gray") as Phaser.Filter.Gray;
        this._flame_filter = this.game.add.filter("Flame") as Phaser.Filter.Flame;
        this._watery_filter = this.game.add.filter("Watery") as Phaser.Filter.Watery;
        this._outline_filter = this.game.add.filter("Outline") as Phaser.Filter.Outline;
        this._pixel_shift_filter = this.game.add.filter("PixelShift") as Phaser.Filter.PixelShift;
        this._active_filters = {
            [engine_filters.COLORIZE]: false,
            [engine_filters.OUTLINE]: false,
            [engine_filters.LEVELS]: false,
            [engine_filters.COLOR_BLEND]: false,
            [engine_filters.HUE]: false,
            [engine_filters.TINT]: false,
            [engine_filters.GRAY]: false,
            [engine_filters.FLAME]: false,
            [engine_filters.WATERY]: false,
        };
        this.trying_to_push = false;
        this._trying_to_push_direction = null;
        this._push_timer = null;
        this.enable_footsteps = enable_footsteps ?? false;
        this._footsteps = this.enable_footsteps ? new Footsteps(this.game, this.data, this) : null;
        this.crop_texture = false;
        this.shadow_following = true;
        this._shapes_collision_active = false;
        this.force_char_stop_in_event = force_char_stop_in_event ?? true;
        this.force_idle_action_in_event = force_idle_action_in_event ?? true;
        this._sweat_drops = null;
        this.on_stair = false;
        this._emoticon_sprite = null;
        this.sand_mode = false;
        this.ignore_play = false;
    }

    /** The char key. */
    get key_name() {
        return this._key_name;
    }
    /** Whether the char is npc or hero. */
    get is_npc() {
        return this._is_npc;
    }

    /** The current x tile position. */
    get tile_x_pos() {
        return this._tile_x_pos;
    }
    /** The current y tile position. */
    get tile_y_pos() {
        return this._tile_y_pos;
    }
    /** Gets the tile pos object for this char. */
    get tile_pos() {
        return {
            x: this._tile_x_pos,
            y: this._tile_y_pos,
        };
    }

    /** Gets the current x position in px. */
    get x(): number {
        return this.sprite.body ? this.sprite.body.x : this.sprite.x;
    }
    /** Gets the current y position in px. */
    get y(): number {
        return this.sprite.body ? this.sprite.body.y : this.sprite.y;
    }
    /** Sets the current x position in px. */
    set x(x: number) {
        if (this.sprite.body) {
            this.sprite.body.x = x;
        } else if (this.sprite) {
            this.sprite.x = x;
        }
    }
    /** Sets the current y position in px. */
    set y(y: number) {
        if (this.sprite.body) {
            this.sprite.body.y = y;
        } else if (this.sprite) {
            this.sprite.y = y;
        }
    }

    /** This char width. */
    get width() {
        return this.sprite.width;
    }
    /** This char height. */
    get height() {
        return this.sprite.height;
    }

    /** This char collision body radius. */
    get body_radius() {
        return this._body_radius;
    }
    /** Whether this char is active. */
    get active() {
        return this._active;
    }

    /** The current active direction of this char according to it movement. */
    get current_direction() {
        return this._current_direction;
    }
    /** The directing that's being requested to this char to go. */
    get required_direction() {
        return this._required_direction;
    }
    /**
     * When changing direction, the char doesn't face immediately the requested direction.
     * This property holds the transion directions till it reaches the requested direction.
     */
    get transition_direction() {
        return this._transition_direction;
    }
    /**
     * The direction in which this char is sliding in the ice.
     * It's not necessarily the direction that this char is facing.
     */
    get ice_slide_direction() {
        return this._ice_slide_direction;
    }
    /** The direction that this char is trying to push an Interactable Object. */
    get trying_to_push_direction() {
        return this._trying_to_push_direction;
    }

    /** The SpriteBase object of this char. */
    get sprite_info() {
        return this._sprite_info;
    }
    /** The Phaser.Filter that controls the colors of the texture of this char sprite. */
    get colorize_filter() {
        return this._colorize_filter;
    }
    /** The Phaser.Filter that controls the color levels of the texture of this char sprite. */
    get levels_filter() {
        return this._levels_filter;
    }
    /** The Phaser.Filter that controls the blend of colors of the texture of this char sprite. */
    get color_blend_filter() {
        return this._color_blend_filter;
    }
    /** The Phaser.Filter that controls the hue of the texture of this char sprite. */
    get hue_filter() {
        return this._hue_filter;
    }
    /** The Phaser.Filter that tints the texture of this char sprite. */
    get tint_filter() {
        return this._tint_filter;
    }
    /** The Phaser.Filter that controls the saturation of the texture of this char sprite. */
    get gray_filter() {
        return this._gray_filter;
    }
    /** The Phaser.Filter that sets flame colors into char sprite. */
    get flame_filter() {
        return this._flame_filter;
    }
    /** The Phaser.Filter that sets water colors into char sprite. */
    get watery_filter() {
        return this._watery_filter;
    }
    /** An object containing which filters are active in this char. */
    get active_filters() {
        return this._active_filters;
    }
    /** The Phaser.Filter that activates an outline in this char sprite. */
    get outline_filter() {
        return this._outline_filter;
    }
    /** The Phaser.Filter that ashifts the texture of this char sprite. */
    get pixel_shift_filter() {
        return this._pixel_shift_filter;
    }
    /** The Footsteps object (in the case this char is letting footprints in the ground). */
    get footsteps() {
        return this._footsteps;
    }
    /** The Phaser.TimerEvent used in the Interactable Object push process. */
    get push_timer() {
        return this._push_timer;
    }

    /** This char current speed normalized vector. This pretty much indicates the char direction. */
    get current_speed() {
        return this._current_speed;
    }
    /** This char pre-caculated speed. It might change due to collision. */
    get temp_speed() {
        return this._temp_speed;
    }
    /** This char speed according to the collision slope. */
    get force_diagonal_speed() {
        return this._force_diagonal_speed;
    }
    /** The extra char speed that might be applied to current speed. */
    get extra_speed() {
        return this._extra_speed;
    }
    /** The extra char speed that might be applied to current speed even if it's idle. */
    get extra_speed_force() {
        return this._extra_speed_force;
    }

    /** The char current action. */
    get current_action() {
        return this._current_action;
    }
    /** The char current animation. */
    get current_animation() {
        return this._current_animation;
    }

    /** This char body if available. */
    get body(): Phaser.Physics.P2.Body {
        return this.sprite?.body ?? null;
    }

    /** Returns whether it's an IO. Always returns false. */
    get is_interactable_object() {
        return false;
    }

    /** Whether the shapes of this char body are active (colliding) or not. */
    get shapes_collision_active() {
        return this._shapes_collision_active;
    }

    /** The collision layer that this NPC is. */
    abstract get collision_layer();

    /**
     * Returns whether this char is in action;
     * @param allow_climbing if true, climbing won't be considered.
     * @returns Returns whether this char is in action.
     */
    in_action(allow_climbing: boolean = false) {
        return (
            this.casting_psynergy ||
            this.pushing ||
            (this.climbing && !allow_climbing) ||
            this.jumping ||
            this.teleporting ||
            this.sliding ||
            this.misc_busy
        );
    }

    /**
     * Checks whether this char is in movement.
     * @param walk_dash_only if true, will check only dash and walk.
     * @returns returns true if in movement.
     */
    in_movement(walk_dash_only: boolean = false) {
        if (
            this._current_action === base_actions.WALK ||
            this._current_action === base_actions.DASH ||
            this._current_action === base_actions.SAND ||
            (!walk_dash_only &&
                ((this._current_action === base_actions.CLIMB && !this.idle_climbing) ||
                    (this._current_action === base_actions.ROPE && this.current_animation !== base_actions.IDLE)))
        ) {
            return true;
        }
        return false;
    }

    /**
     * Initializes the char sprite.
     * @param group the group that this is char is going to be inserted.
     * @param sprite_info the frames and animations information of this char.
     * @param layer the collision layer that this char is.
     * @param map the map where this char is going to be in.
     * @param anchor_x optional x anchor value of the sprite.
     * @param anchor_y optional y anchor value of the sprite.
     * @param scale_x optional x scale value of the sprite.
     * @param scale_y optional y scale value of the sprite.
     */
    set_sprite(
        group: Phaser.Group,
        sprite_info: SpriteBase,
        layer: number,
        map: Map,
        anchor_x?: number,
        anchor_y?: number,
        scale_x?: number,
        scale_y?: number,
        initial_x_px?: number,
        initial_y_px?: number
    ) {
        anchor_x = anchor_x ?? ControllableChar.default_anchor.x;
        anchor_y = anchor_y ?? ControllableChar.default_anchor.y;
        this._sprite_info = sprite_info;
        if (this.current_action) {
            const sprite_key = this.sprite_info.getSpriteKey(this.current_action);
            this.sprite = group.create(0, 0, sprite_key);
        } else {
            this.sprite = group.create(0, 0);
        }
        if (!this.active) {
            this.sprite.visible = false;
        }
        this.sprite.anchor.setTo(anchor_x, anchor_y);
        this.sprite.x = initial_x_px ?? get_centered_pos_in_px(this.tile_x_pos, map.tile_width);
        this.sprite.y = initial_y_px ?? get_centered_pos_in_px(this.tile_y_pos, map.tile_width);
        this.sprite.base_collision_layer = layer;
        this.sprite.roundPx = true;
        if (map.is_world_map) {
            scale_x = numbers.WORLD_MAP_SPRITE_SCALE_X;
        } else if (scale_x === undefined) {
            scale_x = 1;
        }
        if (map.is_world_map) {
            scale_y = numbers.WORLD_MAP_SPRITE_SCALE_Y;
        } else if (scale_y === undefined) {
            scale_y = 1;
        }
        this._default_scale = {x: scale_x, y: scale_y};
        this.sprite.scale.setTo(scale_x, scale_y);
    }

    /**
     * Reset anchor values to default.
     * @param property define whether it is y or x anchor property.
     */
    reset_anchor(property?: "x" | "y") {
        if (property !== undefined && ["x", "y"].includes(property)) {
            this.sprite.anchor[property] = ControllableChar.default_anchor[property];
        } else {
            this.sprite.anchor.x = ControllableChar.default_anchor.x;
            this.sprite.anchor.y = ControllableChar.default_anchor.y;
        }
    }

    /**
     * Resets the scale of this char to default values.
     */
    reset_scale() {
        this.sprite.scale.setTo(this._default_scale.x, this._default_scale.y);
    }

    /**
     * Initialize the shadow sprite of this char.
     * @param group the group where the shadow sprite is going to be inserted.
     * @param options options to be set like anchor values and whether it's a world map.
     */
    set_shadow(
        group: Phaser.Group,
        options?: {
            key_name?: string;
            shadow_anchor_x?: number;
            shadow_anchor_y?: number;
            is_world_map?: boolean;
        }
    ) {
        const key_name = options?.key_name ?? ControllableChar.DEFAULT_SHADOW_KEYNAME;
        const shadow_anchor_x = options?.shadow_anchor_x ?? ControllableChar.DEFAULT_SHADOW_ANCHOR_X;
        const shadow_anchor_y = options?.shadow_anchor_y ?? ControllableChar.DEFAULT_SHADOW_ANCHOR_Y;
        this.shadow = group.create(0, 0, key_name);
        this.shadow.sort_function = () => {
            if (
                this.data.middlelayer_group.getChildIndex(this.shadow) >
                this.data.middlelayer_group.getChildIndex(this.sprite)
            ) {
                this.data.middlelayer_group.setChildIndex(
                    this.shadow,
                    this.data.middlelayer_group.getChildIndex(this.sprite)
                );
            } else {
                this.data.middlelayer_group.setChildIndex(
                    this.shadow,
                    this.data.middlelayer_group.getChildIndex(this.sprite) - 1
                );
            }
        };
        if (!this.active) {
            this.shadow.visible = false;
        }
        this.shadow.blendMode = PIXI.blendModes.MULTIPLY;
        this.shadow.disableRoundPx = true;
        this.shadow.anchor.setTo(shadow_anchor_x, shadow_anchor_y);
        this.shadow.base_collision_layer = this.collision_layer;
        const scale_x = options?.is_world_map ? numbers.WORLD_MAP_SPRITE_SCALE_X : 1;
        const scale_y = options?.is_world_map ? numbers.WORLD_MAP_SPRITE_SCALE_Y : 1;
        this.shadow.scale.setTo(scale_x, scale_y);
    }

    /**
     * Activate or deactivate target looking.
     * @param active Whether you want to activate or deactivate.
     * @param target The target char whether this char is going keep looking.
     */
    set_look_to_target(active: boolean, target?: ControllableChar) {
        if (active) {
            this.look_target = target;
        } else {
            this.look_target = null;
        }
    }

    /**
     * If this char has look target set, this function make this look to it.
     */
    private look_to_target() {
        if (!this.look_target) return;
        const x = this.look_target.sprite.x - this.sprite.x;
        const y = this.look_target.sprite.y - this.sprite.y;
        const angle = range_360(Math.atan2(y, x));
        const direction = (1 + Math.floor((angle - numbers.degree45_half) / numbers.degree45)) & 7;
        this.set_direction(direction, true);
    }

    /**
     * Changes the collision layer of this char.
     * @param layer the collision layer index.
     */
    set_collision_layer(layer: number) {
        this.sprite.base_collision_layer = layer;
        if (this.shadow) {
            this.shadow.base_collision_layer = layer;
        }
    }

    /**
     * Plays an animation of this char.
     * @param action the action that this char is going to doing.
     * @param animation an specific animation of the given action that this char is going to be executing.
     * @param start whether you want the animation to start. Otherwise it will be stopped.
     * @param frame_rate a custom frame rate value.
     * @param loop whether the animation will be looping.
     * @param reset_before_start whether the animation will reset before start.
     * @param reversed whether the animation will be played on reverse sense.
     * @returns Returns the resulting Phaser.Animation object.
     */
    play(
        action?: string | base_actions,
        animation?: string,
        start: boolean = true,
        frame_rate?: number,
        loop?: boolean,
        reset_before_start?: boolean,
        reversed?: boolean
    ) {
        if (this.ignore_play) {
            return null;
        }
        action = action ?? this.current_action;
        if (!action) {
            return null;
        }
        if (animation === null || animation === undefined) {
            if (this.current_direction in reverse_directions) {
                animation = reverse_directions[this.current_direction];
            } else {
                animation = this.current_animation;
            }
        }
        if (SpriteBase.getSpriteAction(this.sprite) !== action) {
            const sprite_key = this.sprite_info.getSpriteKey(action);
            this.sprite.loadTexture(sprite_key);
        }
        const animation_key = this.sprite_info.getAnimationKey(action, animation);
        if (!this.sprite.animations.getAnimation(animation_key)) {
            this.sprite_info.setAnimation(this.sprite, action);
        }
        const animation_obj = this.sprite.animations.getAnimation(animation_key);
        if (!animation_obj) {
            this.data.logger.log_message("Invalid animation key:" + animation_key);
        }
        if (reversed !== undefined) {
            animation_obj.reversed = reversed;
        }
        if (start) {
            if (reset_before_start) {
                animation_obj.stop(true);
            }
            this.sprite.animations.play(animation_key, frame_rate, loop);
        } else {
            animation_obj.stop(true);
        }
        return animation_obj;
    }

    /**
     * Returns if this char is enough close to a target char.
     * @param target_char The target char.
     * @returns Returns whether it's close or not.
     */
    is_close(target_char: NPC) {
        const reference_angle = (8 - this.transition_direction) * numbers.degree45;
        let lower_limit = reference_angle - ControllableChar.INTERACTION_RANGE_ANGLE;
        let upper_limit = reference_angle + ControllableChar.INTERACTION_RANGE_ANGLE;
        const relative_point = {
            x: target_char.x - this.x,
            y: target_char.y - this.y,
        };
        let angle_shift = 0;
        if (lower_limit < 0) {
            angle_shift = ControllableChar.INTERACTION_RANGE_ANGLE;
        } else if (upper_limit >= numbers.degree360) {
            angle_shift = -ControllableChar.INTERACTION_RANGE_ANGLE;
        }
        lower_limit += angle_shift;
        upper_limit += angle_shift;
        const target_angle = range_360(-Math.atan2(relative_point.y, relative_point.x) + angle_shift);
        const angle_condition = target_angle >= lower_limit && target_angle <= upper_limit;
        const distance_condition =
            get_sqr_distance(0, relative_point.x, 0, relative_point.y) <=
            target_char.talk_range * target_char.talk_range;
        return angle_condition && distance_condition;
    }

    /**
     * Checks whether this char is interacting with another one from the back.
     * @param target_char the char that this char is interacting with.
     * @returns returns whether this char is interacting from the back or not.
     */
    interacting_from_back(target_char: ControllableChar) {
        const relative_point = {
            x: target_char.x - this.x,
            y: target_char.y - this.y,
        };
        const char_dir = target_char.current_direction;
        const angle_shift = numbers.degree45 * ((8 - ((char_dir + 6) % 8)) % 8);
        const interaction_angle = range_360(Math.atan2(relative_point.y, relative_point.x)) + angle_shift;
        if (interaction_angle < numbers.degree180) {
            return true;
        }
        return false;
    }

    /**
     * Sets this char direction from its speed values.
     */
    protected choose_direction_by_speed() {
        if (this.current_speed.x === 0 && this.current_speed.y === 0) {
            this._required_direction = null;
            return;
        }
        const angle = range_360(Math.atan2(this.current_speed.y, this.current_speed.x));
        this._required_direction = (1 + Math.floor((angle - numbers.degree45_half) / numbers.degree45)) & 7;
        this._transition_direction = this.required_direction;
    }

    /**
     * Makes this char to face a given direction.
     * @param direction the direction to be faced.
     * @param time_between_frames time interval between transition directions.
     */
    async face_direction(direction: number, time_between_frames: number = 40) {
        let transition_resolve;
        const transition_promise = new Promise(resolve => (transition_resolve = resolve));
        const timer_function = next_direction => {
            next_direction = get_transition_directions(this.current_direction, direction);
            this.set_direction(next_direction, true);
            if (direction !== next_direction) {
                this.game.time.events.add(time_between_frames, () => {
                    timer_function(next_direction);
                });
            } else {
                transition_resolve();
            }
        };
        timer_function(direction);
        await transition_promise;
    }

    /**
     * Makes this char to jump vertically or to a specific destination.
     */
    async jump(options: {
        /** A time to wait on jump finish in ms. */
        time_on_finish?: number;
        /** The height of the jump in px. */
        jump_height?: number;
        /** The duration of the jump in ms. */
        duration?: number;
        /** If this object is set, the char will perform a jump towards a given direction. */
        dest?: {
            /** The x tile position destination. If position in px is defined, this one won't be used. */
            tile_x?: number;
            /** The y tile position destination. If position in px is defined, this one won't be used. */
            tile_y?: number;
            /** The x position destination in px. This position has preference over tile position. */
            x?: number;
            /** The y position destination in px. This position has preference over tile position. */
            y?: number;
            /**
             * The jump distance that this char will perform. If not given,
             * this char will jump into the center of the destination.
             */
            distance?: number;
            /** The distance multiplier that will be applied to the final jump distance. */
            distance_multiplier?: number;
        };
        /** The direction that the char is going to be while jumping. */
        jump_direction?: directions;
        /** The sound effect to play while jumping. */
        sfx_key?: string;
        /** Whether the char will bounce on jump finish. Only for vertical jumps. */
        bounce?: boolean;
        /** Whether the char shadow will remain hidden after jump. */
        keep_shadow_hidden?: boolean;
    }) {
        const duration = options?.duration ?? 65;
        const jump_height = options?.jump_height ?? 12;
        const keep_shadow_hidden = options?.keep_shadow_hidden ?? false;
        let promise_resolve;
        const promise = new Promise(resolve => (promise_resolve = resolve));
        this.data.audio.play_se(options?.sfx_key ?? "actions/jump");
        if (options?.dest !== undefined) {
            //deals with jumps that have a different position from the current char position.
            const dest_char = {
                x: options.dest.x ?? get_centered_pos_in_px(options.dest.tile_x, this.data.map.tile_width) ?? this.x,
                y: options.dest.y ?? get_centered_pos_in_px(options.dest.tile_y, this.data.map.tile_height) ?? this.y,
            };
            const is_jump_over_x_axis =
                (options.dest.tile_x ?? get_tile_position(dest_char.x, this.data.map.tile_width)) === this.tile_x_pos;
            const axis: "x" | "y" = is_jump_over_x_axis ? "y" : "x";
            let distance: number;
            if (options.dest.distance !== undefined) {
                distance = options.dest.distance;
            } else {
                distance = get_distance(this.x, dest_char.x, this.y, dest_char.y);
                if (this.sprite[axis] > dest_char[axis]) {
                    distance *= -1;
                }
            }
            const distance_multiplier = options.dest.distance_multiplier ?? 1.0;
            const tween_obj: {x?: number; y?: number | number[]} = {
                [axis]: this.sprite[axis] + distance * distance_multiplier,
            };
            const jump_direction = options.jump_direction ?? this.current_direction;
            if (axis === "x") {
                const half_height = jump_height >> 1;
                const aux_height = dest_char.y - half_height;
                tween_obj.y = [aux_height, dest_char.y - jump_height, aux_height, dest_char.y];
            } else {
                tween_obj.x = dest_char.x;
            }
            this.toggle_collision(false);
            this.jumping = true;
            if (this.sprite_info.hasAction(base_actions.JUMP)) {
                let jump_init_resolve;
                const jump_init_promise = new Promise(resolve => (jump_init_resolve = resolve));
                this.play(base_actions.JUMP, reverse_directions[jump_direction]);
                this.sprite.animations.currentAnim.onComplete.addOnce(jump_init_resolve);
                await jump_init_promise;
            }
            if (this.shadow) {
                this.shadow.visible = false;
            }
            this.game.add
                .tween(this.sprite.body)
                .to(tween_obj, duration, Phaser.Easing.Linear.None, true)
                .onComplete.addOnce(() => {
                    if (this.shadow) {
                        this.update_shadow();
                        if (!keep_shadow_hidden) {
                            this.shadow.visible = true;
                        }
                    }
                    if (this.sprite_info.hasAction(base_actions.JUMP)) {
                        this.sprite.animations.currentAnim.reverseOnce();
                        this.play(base_actions.JUMP, reverse_directions[jump_direction]);
                        this.sprite.animations.currentAnim.onComplete.addOnce(() => {
                            this.toggle_collision(true);
                            this.jumping = false;
                            promise_resolve();
                        });
                    } else {
                        this.toggle_collision(true);
                        this.jumping = false;
                        promise_resolve();
                    }
                }, this);
        } else {
            //deals with jumps that happen in current char position.
            const bounce = options?.bounce ?? false;
            const yoyo = !bounce;
            const previous_shadow_state = this.shadow_following;
            this.shadow_following = false;
            const previous_pos = this.sprite.body.y;
            const tween = this.game.add
                .tween(this.sprite.body)
                .to({y: previous_pos - jump_height}, duration, Phaser.Easing.Quadratic.Out, false, 0, 0, yoyo);
            if (bounce) {
                const bounce_tween = this.game.add
                    .tween(this.sprite.body)
                    .to({y: previous_pos}, duration << 1, Phaser.Easing.Bounce.Out, false);
                tween.chain(bounce_tween);
                tween.start();
                bounce_tween.onComplete.addOnce(() => {
                    this.shadow_following = previous_shadow_state;
                    promise_resolve();
                });
            } else {
                tween.start();
                tween.onComplete.addOnce(() => {
                    this.shadow_following = previous_shadow_state;
                    promise_resolve();
                });
            }
        }
        await promise;
        if (options?.time_on_finish) {
            const time_promise = new Promise(resolve => (promise_resolve = resolve));
            this.game.time.events.add(options.time_on_finish, promise_resolve);
            await time_promise;
        }
    }

    /**
     * Shakes this char by changing its scale.
     */
    async shake(options?: {
        /** How many times the char should shake */
        repeats_number?: number;
        /** Duration of each shake */
        repeat_period?: number;
        /** If true, the char will shake horizontally */
        side_shake?: boolean;
        /** Max scale multiplier */
        max_scale_mult?: number;
    }) {
        const repeats_number = options?.repeats_number ?? 7;
        const repeat_period = options?.repeat_period ?? 40;
        const side_shake = options?.side_shake ?? false;
        const max_scale_mult = options?.max_scale_mult ?? 1.15;
        let promise_resolve;
        const promise = new Promise(resolve => (promise_resolve = resolve));
        const scales_mult = [max_scale_mult, (max_scale_mult + 1.0) / 2, 1.0];
        const total = scales_mult.length * repeats_number;
        let counter = 0;
        const prop: "x" | "y" = side_shake ? "x" : "y";
        const base_scale = this.sprite.scale[prop];
        this.game.time.events.repeat(repeat_period, total, () => {
            this.sprite.scale[prop] = base_scale * scales_mult[counter % scales_mult.length];
            ++counter;
            if (counter === total) {
                promise_resolve();
            }
        });
        await promise;
    }

    /**
     * Shows an emoticon above this char.
     * @param emoticon_key The emoticon key name.
     * @param options Some custom options.
     * @returns returns the emoticon sprite.
     */
    async show_emoticon(
        emoticon_key: string,
        options?: {
            /** The duration that this emoticon is going to be shown in ms. -1 for forever. */
            duration?: number;
            /** A custom location for the emoticon. */
            location?: {
                x?: number;
                y?: number;
            };
            /** Sound effect key to be played. */
            sound_effect?: string;
        }
    ) {
        const x = options?.location?.x ?? this.sprite.x;
        const y = options?.location?.y ?? this.sprite.y - this.sprite.height + 5;
        this._emoticon_sprite = this.game.add.sprite(x, y, "emoticons", emoticon_key);
        this._emoticon_sprite.anchor.setTo(0.5, 1);
        this._emoticon_sprite.scale.x = 0;

        const duration = options?.duration ?? 800;

        let promise_resolve;
        const promise = new Promise(resolve => (promise_resolve = resolve));
        if (duration === -1) {
            promise_resolve();
        }
        this.game.add
            .tween(this._emoticon_sprite.scale)
            .to(
                {
                    x: 1,
                },
                200,
                Phaser.Easing.Elastic.Out,
                true
            )
            .onComplete.addOnce(() => {
                if (options?.sound_effect) {
                    this.data.audio.play_se(options?.sound_effect);
                }
                if (duration !== -1) {
                    this.game.time.events.add(duration, () => {
                        this.destroy_emoticon();
                        promise_resolve();
                    });
                }
            });
        await promise;
        return this._emoticon_sprite;
    }

    /**
     * Destroys the emoticon of this char if there's one.
     */
    destroy_emoticon() {
        if (this._emoticon_sprite) {
            this._emoticon_sprite.destroy();
            this._emoticon_sprite = null;
        }
    }

    /**
     * Set a specific frame for this char.
     * @param animation the animation or direction of the target frame.
     * @param frame_index the frame index.
     * @param action the action of the target frame.
     */
    set_frame(animation: string | directions, frame_index: number = 0, action?: string) {
        const this_animation = typeof animation === "string" ? animation : reverse_directions[animation];
        action = action ?? this.current_action;
        const frame_name = this.sprite_info.getFrameName(action, this_animation, frame_index);
        this.sprite.frameName = frame_name;
    }

    /**
     * Activates or deactivates this char rotation on z-axis.
     * @param rotate if true, activates the rotation.
     * @param interframe_interval frame change rate interval in ms. -1 to change every frame.
     * @param frame_index optionally specifies a frame index to be in when rotating.
     */
    set_rotation(rotate: boolean, interframe_interval: number = -1, frame_index?: number) {
        this._rotating = rotate;
        if (this._rotating) {
            this._rotating_interval = interframe_interval;
            this._rotating_elapsed = 0;
            this._rotating_frame_index = frame_index;
        } else {
            this._rotating_frame_index = null;
        }
    }

    /**
     * Rotates the char on z-axis.
     */
    private rotate() {
        if (this._rotating) {
            if (this._rotating_interval === -1 || this._rotating_elapsed > this._rotating_interval) {
                if (this._rotating_frame_index) {
                    this.set_direction((this.current_direction + 1) & 7, false, true);
                    this.set_frame(this.current_animation, this._rotating_frame_index);
                } else {
                    this.set_direction((this.current_direction + 1) & 7, true, true);
                }
                this._rotating_elapsed = 0;
            } else {
                this._rotating_elapsed += this.game.time.elapsedMS;
            }
        }
    }

    /** Update function when the game is in event state. */
    update_on_event() {
        if (!this.active) return;
        this.look_to_target();
        this.rotate();
        this.update_sweat_drops_position();
    }

    /**
     * Updates the char movement.
     * @param ignore_collide_action_change if true, ignores the collision impact on movement
     */
    update_movement(ignore_collide_action_change: boolean = false) {
        if (!this.active) return;
        if (ignore_collide_action_change) {
            this.stop_by_colliding = false;
        }
        this.update_tile_position();
        this.choose_direction_by_speed();
        this.set_direction(this.transition_direction, false, false);
        this.choose_action_based_on_char_state();
        this.calculate_speed();
        this.play_current_action();
        this.apply_speed();
        this.update_shadow();
        this.update_sweat_drops_position();
    }

    /**
     * The update function for the shadow sprite.
     */
    update_shadow() {
        if (!this.shadow || !this.shadow_following || !this.active || !this.sprite) return;
        if (this.sprite.body) {
            this.shadow.x = this.sprite.body.x;
            this.shadow.y = this.sprite.body.y;
        } else {
            this.shadow.x = this.sprite.x;
            this.shadow.y = this.sprite.y;
        }
    }

    /**
     * Creates an cropping mask for the lower half of the char when it's in a tile
     * that has the half_crop property set to true.
     */
    create_half_crop_mask() {
        this.sprite.mask = this.game.add.graphics(
            this.sprite.centerX - (this.sprite.width >> 1),
            this.sprite.centerY - (this.sprite.height >> 1)
        );
        this.sprite.mask.beginFill(0xffffff, 1);
        this.sprite.mask.drawRect(0, 0, this.sprite.width, this.sprite.height);
        this.sprite.mask.endFill();
    }

    /**
     * Sets or unsets the the cropping mask.
     * @param crop if true, sets the cropping mask.
     * @param force forces the setting/unsetting action.
     */
    private set_half_crop_mask(crop: boolean, force: boolean = false) {
        if (crop && (!this.crop_texture || force)) {
            this.sprite.mask.clear();
            this.sprite.mask.beginFill(0xffffff, 1);
            this.sprite.mask.drawRect(0, 0, this.sprite.width, ((this.sprite.height * 3) | 0) >> 2);
            this.sprite.mask.endFill();
            this.shadow.visible = false;
            this.crop_texture = true;
        } else if (!crop && (this.crop_texture || force)) {
            this.sprite.mask.clear();
            this.sprite.mask.beginFill(0xffffff, 1);
            this.sprite.mask.drawRect(0, 0, this.sprite.width, this.sprite.height);
            this.sprite.mask.endFill();
            this.crop_texture = false;
            this.shadow.visible = true;
        }
    }

    /**
     * Checks whether is necessary to set or unset the cropping mask.
     * @param force if true, forces the setting/unsetting action.
     */
    private check_half_crop_tile(force: boolean = false) {
        const tiles = this.data.map.get_current_tile(this) as Phaser.Tile[];
        for (let i = 0; i < tiles.length; ++i) {
            const tile = tiles[i];
            if (tile.properties.half_crop) {
                this.set_half_crop_mask(true, force);
                return;
            }
        }
        this.set_half_crop_mask(false, force);
    }

    /**
     * The half cropping mask update function.
     * @param force if true, forces the mask appliance.
     */
    update_half_crop(force: boolean = false) {
        if (this.sprite.mask && this.active) {
            if (force) {
                this.sprite.update();
                this.sprite.postUpdate();
            }
            this.sprite.mask.x = this.sprite.centerX - (this.sprite.width >> 1);
            this.sprite.mask.y = this.sprite.centerY - (this.sprite.height >> 1);
            if (this.data.map.is_world_map) {
                this.check_half_crop_tile(force);
            }
        }
    }

    /**
     * Sets or unsets a Phaser.Filter in this char.
     * @param filter the filter you want to set.
     * @param set whether it's to set or unset the filter.
     */
    manage_filter(filter: Phaser.Filter, set: boolean) {
        this.active_filters[filter.key] = set;
        if (set) {
            if (this.sprite.filters && !this.sprite.filters.includes(filter)) {
                this.sprite.filters = [...this.sprite.filters, filter];
            } else if (!this.sprite.filters) {
                this.sprite.filters = [filter];
            }
        } else {
            if (this.sprite.filters?.includes(filter)) {
                if (this.sprite.filters.length === 1) {
                    this.sprite.filters = undefined;
                } else {
                    this.sprite.filters = this.sprite.filters.filter(f => f !== filter);
                }
            }
        }
    }

    /**
     * Sets or unsets the hue filter in this char.
     * @param activate whether you want to activate the hue filter or not.
     * @param angle the hue angle.
     */
    set_hue(activate: boolean, angle?: number) {
        if (activate) {
            this.manage_filter(this.hue_filter, true);
            this.hue_filter.angle = angle;
        } else {
            this.manage_filter(this.hue_filter, false);
        }
    }

    /**
     * Sets or unsets an outline in this char. You can also use this function to update options.
     * Otherwise, use ControllableChar.outline_filter directly.
     * @param activate whether you want to activate the outline or not.
     * @param options some options.
     */
    set_outline(
        activate: boolean,
        options?: {
            /** The red color component of the outline. 0 to 1. Default 1. */
            r?: number;
            /** The green color component of the outline. 0 to 1. Default 1. */
            g?: number;
            /** The blue color component of the outline. 0 to 1. Default 1. */
            b?: number;
            /** If this property is true, the char will be transparent excepting the outline. Default false. */
            keep_transparent?: boolean;
        }
    ) {
        if (activate) {
            this.manage_filter(this.outline_filter, true);
            this.outline_filter.texture_width = this.sprite.texture.baseTexture.width;
            this.outline_filter.texture_height = this.sprite.texture.baseTexture.height;
            this.outline_filter.r = options?.r ?? 1.0;
            this.outline_filter.g = options?.g ?? 1.0;
            this.outline_filter.b = options?.b ?? 1.0;
            if (options?.keep_transparent !== undefined) {
                this.outline_filter.keep_transparent = options.keep_transparent;
            }
        } else {
            this.manage_filter(this.outline_filter, false);
        }
    }

    /**
     * Blinks this char by tintint and untinting it or outlining it.
     * @param count how many times this char will blink.
     * @param interval the time interval between each blink.
     * @param options some options.
     */
    async blink(
        count: number,
        interval: number,
        options?: {
            /** If true, the char will be outlined instead of tinted. Default is false. */
            outline_blink?: boolean;
            /** If 'outline_blink' is true, whether the char will be transparent or not when outlined. Default is true. */
            transparent_outline?: boolean;
            /** The color to tint/outline the char. */
            color?: {
                /** The red color component to tint. 0 to 1. Default 1. */
                r: number;
                /** The green color component to tint. 0 to 1. Default 1. */
                g: number;
                /** The blue color component to tint. 0 to 1. Default 1. */
                b: number;
            };
            /** if true, will keep the color filter on blink finish. */
            keep_filter?: boolean;
        }
    ) {
        const outline = options?.outline_blink ?? false;
        const transparent_outline = options?.transparent_outline ?? true;
        if (!outline) {
            this.manage_filter(this.tint_filter, true);
        }
        let counter = count << 1;
        const blink_timer = this.game.time.create(false);
        let timer_resolve;
        const timer_promise = new Promise(resolve => (timer_resolve = resolve));
        const r = options?.color?.r ?? 1.0;
        const g = options?.color?.g ?? 1.0;
        const b = options?.color?.b ?? 1.0;
        blink_timer.loop(interval, () => {
            if (counter % 2 === 0) {
                if (outline) {
                    this.set_outline(true, {
                        keep_transparent: transparent_outline,
                        r: r,
                        g: g,
                        b: b,
                    });
                } else {
                    this.tint_filter.r = r;
                    this.tint_filter.g = g;
                    this.tint_filter.b = b;
                }
            } else {
                if (outline) {
                    this.set_outline(false);
                } else {
                    this.tint_filter.r = -1;
                    this.tint_filter.g = -1;
                    this.tint_filter.b = -1;
                }
            }
            --counter;
            if (counter === 0) {
                blink_timer.stop();
                timer_resolve();
            }
        });
        blink_timer.start();
        await timer_promise;
        blink_timer.destroy();
        if (!outline && !options?.keep_filter) {
            this.manage_filter(this.tint_filter, false);
        }
    }

    /**
     * Activates or deactivates this char.
     * @param active if true, activates it.
     */
    abstract toggle_active(active: boolean): void;

    /**
     * Stops the char movement.
     * @param change_sprite if true, sets idle animation.
     */
    stop_char(change_sprite: boolean = true) {
        this._current_speed.x = this._current_speed.y = 0;
        this.choose_direction_by_speed();
        if (this.sprite.body) {
            this.sprite.body.velocity.y = this.sprite.body.velocity.x = 0;
        }
        if (change_sprite && this.sprite_info) {
            if (this.climbing) {
                this.data.hero.idle_climbing = true;
                this.data.hero.play(base_actions.CLIMB, climb_actions.IDLE);
            } else if (this.sprite_info.hasAction(base_actions.IDLE)) {
                this._current_action = base_actions.IDLE;
                this.play_current_action();
            }
        }
    }

    /**
     * Stops the current animation of this char.
     * @param reset_frame Resets the current animation to the first frame.
     */
    stop_animation(reset_frame: boolean = true) {
        this.sprite.animations.currentAnim.stop(reset_frame);
    }

    /**
     * Changes the char current direction to the given direction.
     * @param direction the direction to change.
     * @param force_change plays this new direction.
     * @param transition_also also change the transition direction.
     */
    set_direction(direction?: directions, force_change: boolean = false, transition_also: boolean = true) {
        this._current_direction = direction ?? this.required_direction;
        if (transition_also) {
            this._transition_direction = this.current_direction;
        }
        this._current_animation = reverse_directions[this.current_direction];
        if (force_change) {
            this.play_current_action();
        }
    }

    /**
     * Changes the ice slide direction.
     * @param direction the direction to be set.
     */
    set_ice_slide_direction(direction: directions) {
        this._ice_slide_direction = direction;
    }

    /**
     * Changes the direction that the char is trying to push.
     * @param direction the direction to be set.
     */
    set_trying_to_push_direction(direction: directions) {
        this._trying_to_push_direction = direction;
    }

    /**
     * Sets the push timer for this char. This timer is used to start the object pushing.
     * The char must wait for this timer before pushing.
     * @param callback the timer callback.
     * @param delay the initial delay.
     */
    set_push_timer(callback: () => void, delay: number = Phaser.Timer.QUARTER) {
        this.unset_push_timer();
        this._push_timer = this.game.time.create(true);
        this._push_timer.add(delay, callback);
        this._push_timer.start();
    }

    /**
     * Unsets the push timer.
     */
    unset_push_timer() {
        if (this.push_timer) {
            this.push_timer.destroy();
        }
        this._push_timer = null;
    }

    /**
     * Changes this char action.
     * @param action the action to be changed.
     * @param play if true, plays the given action animation.
     */
    change_action(action: base_actions, play: boolean = false) {
        this._current_action = action;
        if (play) {
            this.play_current_action();
        }
    }

    /**
     * Plays the current action of this char.
     * @param check_on_event if true, will check whether the game has any event running.
     */
    play_current_action(check_on_event: boolean = false, force_squat: boolean = false) {
        if (check_on_event && this.data.tile_event_manager.on_event) {
            return;
        }
        let action = this.current_action;
        let idle_climbing = this.idle_climbing;
        if (this.stop_by_colliding && !this.pushing && !this.climbing && !this.climbing_rope && !this.sand_mode) {
            action = base_actions.IDLE;
        } else if (this.stop_by_colliding && !this.pushing && this.climbing) {
            idle_climbing = true;
        }
        let animation;
        if (idle_climbing) {
            animation = base_actions.IDLE;
        } else if (this.climbing_rope) {
            animation = this.stop_by_colliding ? base_actions.IDLE : this.current_animation;
        } else {
            animation = reverse_directions[this.transition_direction];
        }
        let frame_rate;
        if (action === base_actions.WALK) {
            if (this.ice_sliding_active) {
                frame_rate = ControllableChar.SLIDE_ICE_WALK_FRAME_RATE;
            } else if (this.walking_over_rope) {
                frame_rate = ControllableChar.WALK_OVER_ROPE_FRAME_RATE;
            } else {
                frame_rate = this.sprite_info.getFrameRate(base_actions.WALK, animation);
            }
        }
        if (force_squat && action === base_actions.IDLE) {
            action = base_actions.SQUAT;
        }
        this.play(action, animation, true, frame_rate);
    }

    /**
     * Checks whether the current tile forbids this char to don't show footprints.
     * @returns whether the footprint will be shown or not.
     */
    private tile_able_to_show_footprint() {
        const tiles = this.data.map.get_current_tile(this) as Phaser.Tile[];
        for (let i = 0; i < tiles.length; ++i) {
            const tile = tiles[i];
            if (tile.properties.hasOwnProperty("disable_footprint")) {
                const layers = tile.properties.disable_footprint.split(",").map(layer => parseInt(layer));
                if (layers.includes(this.data.map.collision_layer)) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Chooses this char action based on its states like climbing, walk, dash etc.
     * @param check_on_event if true, will check whether the game has any event running.
     */
    protected choose_action_based_on_char_state(check_on_event: boolean = false) {
        if (check_on_event && this.data.tile_event_manager.on_event) return;
        if (this.sand_mode) {
            this._current_action = base_actions.SAND;
        } else if (this.climbing_rope) {
            this._current_action = base_actions.ROPE;
            if (this.required_direction !== null) {
                this._current_animation = base_actions.CLIMB;
            } else {
                this._current_animation = base_actions.IDLE;
            }
        } else if (this.required_direction === null && this.current_action !== base_actions.IDLE && !this.climbing) {
            this._current_action = base_actions.IDLE;
        } else if (this.required_direction !== null && !this.climbing && !this.pushing) {
            this.check_footsteps();
            if (this.walking_over_rope) {
                this._current_action = base_actions.WALK;
            } else if (this.dashing && this.current_action !== base_actions.DASH) {
                this._current_action = base_actions.DASH;
            } else if (!this.dashing && this.current_action !== base_actions.WALK) {
                this._current_action = base_actions.WALK;
            }
        }
    }

    /**
     * Checks whether this char is able to show footsteps, if yes, show them.
     */
    private check_footsteps() {
        const footsteps =
            this.enable_footsteps &&
            !this.ice_sliding_active &&
            this.data.map.show_footsteps &&
            this.tile_able_to_show_footprint();
        if (this.footsteps?.can_make_footprint && footsteps) {
            this.footsteps.create_step(this.current_direction, this.current_action);
        }
    }

    /**
     * Updates sweat drops position.
     */
    protected update_sweat_drops_position() {
        if (this._sweat_drops) {
            this._sweat_drops.x = this.x;
            this._sweat_drops.y = this.y - 5;
        }
    }

    /**
     * Splashes sweat drops from this char. The drops will follow this char pos.
     * @param times how many times the sweat drops will splash.
     */
    async splash_sweat_drops(times: number = 2) {
        if (times < 1) {
            return;
        }
        const action = "sweat_drops";
        const sprite_base = this.data.info.misc_sprite_base_list["sweat_drops"];
        const sprite_key = sprite_base.getSpriteKey(action);
        this._sweat_drops = this.data.middlelayer_group.create(0, 0, sprite_key);
        this._sweat_drops.sort_function = () => {
            this.data.middlelayer_group.setChildIndex(
                this._sweat_drops,
                this.data.middlelayer_group.getChildIndex(this.sprite)
            );
        };
        this._sweat_drops.anchor.setTo(0.5, 1.0);
        this.update_sweat_drops_position();
        const animation = "splash";
        sprite_base.setAnimation(this._sweat_drops, action);
        const animation_key = sprite_base.getAnimationKey(action, animation);
        const anim = this._sweat_drops.animations.getAnimation(animation_key);
        for (let i = 0; i < times; ++i) {
            let promise_resolve;
            const promise = new Promise(resolve => (promise_resolve = resolve));
            anim.play();
            anim.onComplete.addOnce(promise_resolve);
            await promise;
        }
        if (this._sweat_drops) {
            this._sweat_drops.destroy();
            this._sweat_drops = null;
        }
    }

    /**
     * Gets the update callback that need to be fired under a loop in order to move this char to a specific position.
     * @param dest the desitiona position object.
     * @param on_position_reach_callback the callback that will be called when this char reaches the position.
     * @param minimal_distance the minimal distance to be regarded to when check whether this char is close enough to the destination.
     * @returns return the update callback to keep this char moving and checking whether it should stop.
     */
    get_move_callback(
        dest: {x: number; y: number},
        on_position_reach_callback: () => void,
        minimal_distance: number = 3
    ) {
        const direction = new Phaser.Point(dest.x - this.x, dest.y - this.y).normalize();
        this.set_speed(direction.x, direction.y, false);
        const minimal_distance_sqr = minimal_distance * minimal_distance;

        let previous_sqr_dist = Infinity;
        let stop_update_callback = false;
        const udpate_callback = () => {
            if (stop_update_callback) {
                return;
            }
            this.update_movement(true);
            this.data.map.sort_sprites();
            const this_sqr_dist = get_sqr_distance(this.x, dest.x, this.y, dest.y);
            if (this_sqr_dist < minimal_distance_sqr || this_sqr_dist > previous_sqr_dist) {
                this.stop_char();
                stop_update_callback = true;
                on_position_reach_callback();
            }
            previous_sqr_dist = this_sqr_dist;
        };
        return udpate_callback;
    }

    /**
     * Updates the tile positions.
     */
    update_tile_position() {
        this._tile_x_pos = get_tile_position(this.x, this.data.map.tile_width);
        this._tile_y_pos = get_tile_position(this.y, this.data.map.tile_height);
    }

    /**
     * Sets this char position.
     * @param position the x/y positions in px.
     */
    set_position(position: {x?: number; y?: number}, update_shadow: boolean = true) {
        const obj = this.sprite.body ?? this.sprite;
        obj.x = position.x ?? obj.x;
        obj.y = position.y ?? obj.y;
        if (update_shadow) {
            this.update_shadow();
        }
    }

    /**
     * Increments the char extra speed value.
     * @param delta_value the speed variation.
     */
    increase_extra_speed(delta_value: number) {
        this._extra_speed += delta_value | 0;
    }

    /**
     * Increments the char forced extra speed value.
     * @param delta_value the x and/or y speed variation object.
     */
    increase_forced_extra_speed(delta_value: {x?: number; y?: number}) {
        this._extra_speed_force.x += delta_value.x | 0 ?? 0;
        this._extra_speed_force.y += delta_value.y | 0 ?? 0;
    }

    /**
     * Calculates this char speed based on its states like walk, dash etc.
     */
    protected calculate_speed() {
        //when setting temp_speed.x or temp_speed.y, it means that these velocities will still be analyzed in Collision.check_char_collision function
        const delta_time = this.game.time.elapsedMS / numbers.DELTA_TIME_FACTOR;
        const apply_speed = (speed_factor: number) => {
            this.temp_speed.x = (delta_time * (this.current_speed.x * speed_factor + this.extra_speed_force.x)) | 0;
            this.temp_speed.y = (delta_time * (this.current_speed.y * speed_factor + this.extra_speed_force.y)) | 0;
        };
        if (this.ice_sliding_active && this.sliding_on_ice) {
            const speed_factor = ControllableChar.SLIDE_ICE_SPEED + this.extra_speed;
            apply_speed(speed_factor);
        } else if (this.walking_over_rope) {
            const speed_factor = ControllableChar.WALK_OVER_ROPE_SPEED + this.extra_speed;
            apply_speed(speed_factor);
        } else if (this.current_action === base_actions.DASH) {
            const speed_factor =
                this.dash_speed +
                this.extra_speed +
                (this.data.map.is_world_map ? numbers.WORLD_MAP_SPEED_DASH_REDUCE : 0);
            apply_speed(speed_factor);
        } else if (this.current_action === base_actions.WALK || this.current_action === base_actions.SAND) {
            const speed_factor =
                this.walk_speed +
                this.extra_speed +
                (this.data.map.is_world_map ? numbers.WORLD_MAP_SPEED_WALK_REDUCE : 0);
            apply_speed(speed_factor);
        } else if (this.current_action === base_actions.CLIMB) {
            apply_speed(this.climb_speed);
        } else if (this.current_action === base_actions.IDLE) {
            if (this.extra_speed_force.x !== 0) {
                const speed = (delta_time * this.extra_speed_force.x) | 0;
                this.sprite.body.velocity.x = this.temp_speed.x = speed;
            } else {
                this.sprite.body.velocity.x = 0;
            }
            if (this.extra_speed_force.y !== 0) {
                const speed = (delta_time * this.extra_speed_force.y) | 0;
                this.sprite.body.velocity.y = this.temp_speed.y = speed;
            } else {
                this.sprite.body.velocity.y = 0;
            }
        }
    }

    /**
     * Apply the calculated speed values.
     */
    protected apply_speed() {
        if (
            [base_actions.WALK, base_actions.DASH, base_actions.CLIMB, base_actions.SAND].includes(
                this.current_action as base_actions
            ) ||
            (this.sliding_on_ice && this.ice_sliding_active) ||
            this.walking_over_rope
        ) {
            //sets the final velocity
            this.sprite.body.velocity.x = this.temp_speed.x;
            this.sprite.body.velocity.y = this.temp_speed.y;
        }
    }

    /**
     * Sets some speed values.
     * @param x_speed the x speed value.
     * @param y_speed the y speed value.
     * @param apply_speed if true, the given speed will be applied.
     */
    set_speed(x_speed: number, y_speed: number, apply_speed: boolean = true) {
        this.current_speed.x = x_speed ?? this.current_speed.x;
        this.current_speed.y = y_speed ?? this.current_speed.y;
        this.calculate_speed();
        if (apply_speed) {
            this.apply_speed();
        }
    }

    /**
     * Sets some temporary speed values. These temporary values are set before
     * collision analysis and may suffer changes on it. After collision analysis, they
     * are indeed applied to actual speed values.
     * @param x_speed the x speed value.
     * @param y_speed the y speed value.
     */
    set_temporary_speed(x_speed?: number, y_speed?: number) {
        this.temp_speed.x = x_speed ?? this.temp_speed.x;
        this.temp_speed.y = y_speed ?? this.temp_speed.y;
    }

    /**
     * Make the char to fall to a given destination.
     * @param options fall options object.
     */
    async fall(options: {
        /** The final y-tile position that the char will reach after falling. */
        y_destination_position: number;
        /** The destination collision layer index. */
        dest_collision_layer?: number;
        /** Whether an exclamation emoticon will appear over the char before falling. */
        show_exclamation_emoticon?: boolean;
        /** The char will splash sweat drops before falling. */
        splash_sweat_drops?: boolean;
        /** Whether the char will performa a walking in the air animation before falling. */
        walking_in_the_air?: boolean;
        /** Whether the char will perform a ground hit animation. */
        ground_hit_animation?: boolean;
        /** Teleport info. If passed, the char will teleport to another map while falling. */
        teleport?: {
            /** The teleport map key name destination. */
            destination: string;
            /** The origin position that the char will be just after the teleport. */
            origin_position?: {
                /** The x tile position. */
                x: number;
                /** The y tile position. */
                y: number;
            };
            /** The destination position. */
            destination_position: {
                /** The x tile position. */
                x: number;
                /** The y tile position. */
                y: number;
            };
            /** The destination collision layer index in the dest map. */
            dest_collision_layer: number;
            /** If true, the char sprite will be brought to the top on z-index while falling. */
            send_to_front_on_teleport?: boolean;
            /** If true, the char will diminish instead of fall before teleport. */
            diminish_on_transition?: boolean;
            /** Callback to be called before teleport begin. */
            on_before_teleport?: () => void;
        };
        /** Callback to be called after hitting the ground. */
        on_fall_finish_callback?: () => void;
    }) {
        const prev_misc_busy = this.misc_busy;
        this.misc_busy = true;
        if (this.shadow) {
            this.shadow.visible = false;
        }
        if (options.show_exclamation_emoticon) {
            this.show_emoticon("exclamation", {duration: 400});
        }
        if (options.splash_sweat_drops) {
            this.splash_sweat_drops();
        }
        if (options.walking_in_the_air) {
            this.play(base_actions.WALK, undefined, true, 25);
        }
        await promised_wait(this.game, 600);
        this.set_direction(directions.down, true);
        this.play(base_actions.GRANT);
        await promised_wait(this.game, 200);
        this.data.audio.play_se("misc/fall");
        const y_target = get_centered_pos_in_px(options.y_destination_position, this.data.map.tile_height);
        let fall_time = Math.abs(options.y_destination_position - this.tile_pos.y) * ControllableChar.TIME_PER_TILE;
        const finish = () => {
            this.game.time.events.add(80, () => {
                this.misc_busy = prev_misc_busy;
                if (options.on_fall_finish_callback) {
                    options.on_fall_finish_callback();
                }
            });
        };
        let fall_tween: Phaser.Tween = null;
        let scale_tween: Phaser.Tween = null;
        if (options.teleport?.diminish_on_transition) {
            const transition_time = 700;
            fall_time = 400;
            fall_tween = this.game.add
                .tween(this.body ?? this.sprite)
                .to({y: this.y + 80}, transition_time, Phaser.Easing.Linear.None, true);
            scale_tween = this.game.add
                .tween(this.sprite.scale)
                .to({x: 0, y: 0}, transition_time, Phaser.Easing.Linear.None, true);
        } else {
            fall_tween = this.game.add
                .tween(this.body ?? this.sprite)
                .to({y: y_target}, fall_time, Phaser.Easing.Linear.None, true);
            fall_tween.onComplete.addOnce(() => {
                if (!options.teleport) {
                    if (options.ground_hit_animation) {
                        this.ground_hit_dust_animation(() => {
                            if (
                                options.dest_collision_layer &&
                                options.dest_collision_layer !== this.data.map.collision_layer
                            ) {
                                this.data.collision.change_map_body(options.dest_collision_layer, true);
                            }
                            finish();
                        });
                    } else {
                        this.update_shadow();
                        this.shadow.visible = true;
                        if (
                            options.dest_collision_layer &&
                            options.dest_collision_layer !== this.data.map.collision_layer
                        ) {
                            this.data.collision.change_map_body(options.dest_collision_layer, true);
                        }
                        finish();
                    }
                }
            });
        }
        if (options.teleport) {
            let teleport_init: {x: number; y: number};
            if (options.teleport.origin_position) {
                teleport_init = options.teleport.origin_position;
            } else {
                teleport_init = {
                    x: options.teleport.destination_position.x,
                    y: _.clamp(
                        options.teleport.destination_position.y -
                            ((numbers.GAME_HEIGHT / this.data.map.tile_height) >> 1),
                        0,
                        undefined
                    ),
                };
            }
            let teleport_time = fall_time - ControllableChar.TIME_PER_TILE * 5;
            if (teleport_time < 0) {
                teleport_time = fall_time;
            }
            this.game.time.events.add(teleport_time, () => {
                const event = new TeleportEvent(
                    this.game,
                    this.data,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    false,
                    undefined,
                    options.teleport.destination,
                    teleport_init.x,
                    teleport_init.y,
                    false,
                    false,
                    false,
                    options.teleport.dest_collision_layer,
                    reverse_directions[directions.down],
                    false,
                    true,
                    true,
                    true,
                    true,
                    300,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    true,
                    false,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined
                );
                event.set_fadein_callback(() => {
                    fall_tween.stop(false);
                    scale_tween?.stop(false);
                    this.reset_scale();
                    if (options.teleport.on_before_teleport) {
                        options.teleport.on_before_teleport();
                    }
                });
                event.set_finish_callback(() => {
                    event.destroy();
                    this.data.tile_event_manager.on_event = true;
                    const slide_time =
                        Math.abs(options.teleport.destination_position.y - teleport_init.y) *
                        ControllableChar.TIME_PER_TILE;
                    const target_x = get_centered_pos_in_px(
                        options.teleport.destination_position.x,
                        this.data.map.tile_width
                    );
                    const target_y = get_centered_pos_in_px(
                        options.teleport.destination_position.y,
                        this.data.map.tile_height
                    );
                    const prev_send_to_front = this.sprite.send_to_front;
                    if (options.teleport.send_to_front_on_teleport) {
                        this.sprite.send_to_front = true;
                    }
                    this.game.add
                        .tween(this.body ?? this.sprite)
                        .to({x: target_x, y: target_y}, slide_time, Phaser.Easing.Linear.None, true)
                        .onComplete.addOnce(() => {
                            this.sprite.send_to_front = prev_send_to_front;
                            if (options.ground_hit_animation) {
                                this.ground_hit_dust_animation(() => {
                                    this.data.tile_event_manager.on_event = false;
                                    finish();
                                });
                            } else {
                                this.data.tile_event_manager.on_event = false;
                                finish();
                            }
                        });
                });
                event.fire();
            });
        }
    }

    /**
     * Plays an animation for the char hitting the ground when falling.
     * @param on_animation_end calback to be called on animation end.
     */
    ground_hit_dust_animation(on_animation_end: () => void) {
        this.update_shadow();
        this.shadow.visible = true;
        this.play(base_actions.GROUND);
        this.data.audio.play_se("actions/ground_hit");
        this.data.camera.enable_shake();
        this.game.time.events.add(300, () => {
            this.play(base_actions.IDLE);
            this.data.camera.disable_shake();
        });
        const promises = new Array(ControllableChar.DUST_COUNT_GROUND_HIT);
        const sprites = new Array(ControllableChar.DUST_COUNT_GROUND_HIT);
        const origin_x = this.x;
        const origin_y = this.y;
        const dust_sprite_base = this.data.info.misc_sprite_base_list[ControllableChar.DUST_KEY];
        const dust_key = dust_sprite_base.getSpriteKey(ControllableChar.DUST_KEY);
        for (let i = 0; i < ControllableChar.DUST_COUNT_GROUND_HIT; ++i) {
            const this_angle =
                ((Math.PI + numbers.degree60) * i) / (ControllableChar.DUST_COUNT_GROUND_HIT - 1) - numbers.degree30;
            const x = origin_x + ControllableChar.DUST_RADIUS_GROUND_HIT * Math.cos(this_angle);
            const y = origin_y + ControllableChar.DUST_RADIUS_GROUND_HIT * Math.sin(this_angle);
            const dust_sprite = this.data.middlelayer_group.create(origin_x, origin_y, dust_key);
            if (this_angle < 0 || this_angle > Math.PI) {
                this.data.middlelayer_group.setChildIndex(
                    dust_sprite,
                    this.data.middlelayer_group.getChildIndex(this.sprite)
                );
            }
            dust_sprite.anchor.setTo(0.5, 0.5);
            this.game.add.tween(dust_sprite).to(
                {
                    x: x,
                    y: y,
                },
                400,
                Phaser.Easing.Linear.None,
                true
            );
            sprites[i] = dust_sprite;
            dust_sprite_base.setAnimation(dust_sprite, ControllableChar.DUST_KEY);
            const animation_key = dust_sprite_base.getAnimationKey(
                ControllableChar.DUST_KEY,
                ControllableChar.DUST_ANIM_KEY
            );
            let resolve_func;
            promises[i] = new Promise(resolve => (resolve_func = resolve));
            dust_sprite.animations.getAnimation(animation_key).onComplete.addOnce(resolve_func);
            dust_sprite.animations.play(animation_key);
        }
        Promise.all(promises).then(() => {
            sprites.forEach(sprite => {
                this.data.middlelayer_group.remove(sprite, true);
            });
            on_animation_end();
        });
    }

    /**
     * Sets whether the collision body of this char is enable or not.
     * @param enable if true, activates the collision.
     */
    toggle_collision(enable: boolean) {
        const prev_collision_state = this._shapes_collision_active;
        if (this.sprite?.body) {
            this.sprite.body.data.shapes.forEach(shape => (shape.sensor = !enable));
            this._shapes_collision_active = enable;
        }
        return prev_collision_state;
    }

    /**
     * Checks if this char is colliding with any interactable object and fire any possible interaction with it.
     * @param contact the p2.ContactEquation in order to check if a collision is happening.
     */
    check_interactable_objects(contacts: p2.ContactEquation[]) {
        contacts_check: {
            for (let i = 0; i < this.data.map.interactable_objects.length; ++i) {
                //check if hero is colliding with any interactable object
                const interactable_object = this.data.map.interactable_objects[i];
                const interactable_object_body = interactable_object.sprite?.body;
                if (!interactable_object_body || !interactable_object.enable) {
                    continue;
                }
                for (let j = 0; j < contacts.length; ++j) {
                    const contact = contacts[j];
                    if (
                        contact.bodyA === interactable_object_body.data ||
                        contact.bodyB === interactable_object_body.data
                    ) {
                        if (contact.bodyA === this.sprite.body.data || contact.bodyB === this.sprite.body.data) {
                            if (
                                interactable_object.pushable &&
                                (interactable_object as Pushable).check_and_start_push(this)
                            ) {
                                break contacts_check;
                            } else if (
                                interactable_object.rollable &&
                                (interactable_object as RollablePillar).check_and_start_rolling(this)
                            ) {
                                break contacts_check;
                            }
                        }
                    }
                }
            }
            this.trying_to_push = false;
        }
    }

    /**
     * Checks if this char will quit sand mode by colliding with a tile that has `quit_sand` property true.
     * @param contacts p2 contact equation array.
     * @returns returns true if it exited sand mode.
     */
    check_sand_quit(contacts: p2.ContactEquation[]) {
        if (this.data.hero.sand_mode && this.data.map.sand_collision_layer === this.data.map.collision_layer) {
            for (let contact of contacts) {
                if (contact.shapeB.properties?.quit_sand || contact.shapeA.properties?.quit_sand) {
                    (this.data.info.field_abilities_list.sand as SandFieldPsynergy).return_to_normal();
                    return true;
                }
            }
        }
        return false;
    }
}
