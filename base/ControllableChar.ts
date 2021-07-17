import * as numbers from "./magic_numbers";
import {reverse_directions, base_actions, directions, range_360, get_transition_directions, get_centered_pos_in_px, get_distance, get_tile_position} from "./utils";
import {Footsteps} from "./utils/Footsteps";
import {GoldenSun} from "./GoldenSun";
import {SpriteBase} from "./SpriteBase";
import {Map} from "./Map";
import {Camera} from "./Camera";

export abstract class ControllableChar {
    private static readonly DEFAULT_SHADOW_KEYNAME = "shadow";

    private static readonly DEFAULT_SHADOW_ANCHOR_X = 0.45;
    private static readonly DEFAULT_SHADOW_ANCHOR_Y = 0.05;
    private static readonly DEFAULT_SPRITE_ANCHOR_X = 0.5;
    private static readonly DEFAULT_SPRITE_ANCHOR_Y = 0.8;
    private static readonly SLIDE_ICE_SPEED = 95;
    private static readonly SLIDE_ICE_WALK_FRAME_RATE = 20;
    private static readonly WALK_OVER_ROPE_SPEED = 25;
    private static readonly WALK_OVER_ROPE_FRAME_RATE = 4;
    private static readonly INTERACTION_RANGE_ANGLE = numbers.degree75;

    private static readonly default_anchor = {
        x: ControllableChar.DEFAULT_SPRITE_ANCHOR_X,
        y: ControllableChar.DEFAULT_SPRITE_ANCHOR_Y,
    };

    protected game: Phaser.Game;
    protected data: GoldenSun;
    private _key_name: string;

    /* properties the controls the movement speed */
    protected _x_speed: number;
    protected _y_speed: number;
    private _extra_speed: number;
    private walk_speed: number;
    private dash_speed: number;
    private climb_speed: number;
    protected temp_velocity_x: number;
    protected temp_velocity_y: number;

    /* char states */
    public stop_by_colliding: boolean;
    public force_direction: boolean;
    public dashing: boolean;
    public climbing: boolean;
    public pushing: boolean;
    public jumping: boolean;
    public sliding: boolean;
    public casting_psynergy: boolean;
    public on_reveal: boolean;
    public teleporting: boolean;
    public idle_climbing: boolean;
    public ice_sliding_active: boolean;
    public sliding_on_ice: boolean;
    public trying_to_push: boolean;
    public walking_over_rope: boolean;

    protected storage_keys: {
        position?: string;
        action?: string;
        direction?: string;
        active?: string;
    };
    protected _sprite_info: SpriteBase;
    public sprite: Phaser.Sprite;
    public shadow: Phaser.Sprite;
    protected _body_radius: number;
    private _tile_x_pos: number;
    private _tile_y_pos: number;

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

    /* misc char states */
    public enable_footsteps: boolean;
    public crop_texture: boolean;
    public shadow_following: boolean;

    private _color_filter: Phaser.Filter;
    protected _push_timer: Phaser.TimerEvent;
    private _footsteps: Footsteps;
    protected look_target: ControllableChar = null;
    protected _active: boolean;
    /**
     * A mask that contains in which directions the hero is colliding. Example:
     *  - If the hero is colliding on left direction, which has 4 as value, then this variable will have this value: 00010000.
     *  - If the hero is colliding on right direction, which has 0 as value, then this variable will have this value: 00000001.
     *  - Colliding in both left and right direction: 00010001.
     * */
    protected colliding_directions_mask: number;
    private _rotating: boolean;
    private _rotating_interval: number;
    private _rotating_elapsed: number;

    constructor(
        game: Phaser.Game,
        data: GoldenSun,
        key_name: string,
        enable_footsteps: boolean,
        walk_speed: number,
        dash_speed: number,
        climb_speed: number,
        initial_x?: number,
        initial_y?: number,
        initial_action?: string | base_actions,
        initial_animation?: string,
        storage_keys?: ControllableChar["storage_keys"],
        active?: boolean
    ) {
        this.game = game;
        this.data = data;
        this._key_name = key_name;
        this._x_speed = 0;
        this._y_speed = 0;
        this._extra_speed = 0;
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
        this.casting_psynergy = false;
        this.on_reveal = false;
        this.teleporting = false;
        this.idle_climbing = false;
        this.ice_sliding_active = false;
        this.sliding_on_ice = false;
        this.walking_over_rope = false;
        this._sprite_info = null;
        this.sprite = null;
        this.shadow = null;
        this._rotating = false;
        this._body_radius = 0;
        this.storage_keys = storage_keys ?? {};
        this._active = active ?? true;
        if (this.storage_keys.active !== undefined) {
            this._active = this.data.storage.get(this.storage_keys.active);
        }
        if (this.storage_keys.position !== undefined) {
            const position = this.data.storage.get(this.storage_keys.position);
            initial_x = position.x;
            initial_y = position.y;
        }
        this._tile_x_pos = initial_x;
        this._tile_y_pos = initial_y;
        this._current_action =
            this.storage_keys.action !== undefined ? this.data.storage.get(this.storage_keys.action) : initial_action;
        initial_animation =
            this.storage_keys.direction !== undefined
                ? this.data.storage.get(this.storage_keys.direction)
                : initial_animation;
        this._current_direction = initial_animation in directions ? directions[initial_animation] : null;
        this._current_animation = initial_animation;
        this._required_direction = null;
        this._transition_direction = this.current_direction;
        this._ice_slide_direction = null;
        this._color_filter = this.game.add.filter("ColorFilters");
        this.trying_to_push = false;
        this._trying_to_push_direction = null;
        this._push_timer = null;
        this.enable_footsteps = enable_footsteps ?? false;
        this._footsteps = this.enable_footsteps ? new Footsteps(this.game, this.data, this) : null;
        this.crop_texture = false;
        this.shadow_following = true;
    }

    get key_name() {
        return this._key_name;
    }

    get tile_x_pos() {
        return this._tile_x_pos;
    }
    get tile_y_pos() {
        return this._tile_y_pos;
    }

    get x(): number {
        return this.sprite.body ? this.sprite.body.x : this.sprite.x;
    }
    get y(): number {
        return this.sprite.body ? this.sprite.body.y : this.sprite.y;
    }

    get width() {
        return this.sprite.width;
    }
    get height() {
        return this.sprite.height;
    }

    get body_radius() {
        return this._body_radius;
    }
    get active() {
        return this._active;
    }

    get current_direction() {
        return this._current_direction;
    }
    get required_direction() {
        return this._required_direction;
    }
    get transition_direction() {
        return this._transition_direction;
    }
    get ice_slide_direction() {
        return this._ice_slide_direction;
    }
    get trying_to_push_direction() {
        return this._trying_to_push_direction;
    }

    get sprite_info() {
        return this._sprite_info;
    }
    get color_filter() {
        return this._color_filter;
    }
    get footsteps() {
        return this._footsteps;
    }
    get push_timer() {
        return this._push_timer;
    }

    get x_speed() {
        return this._x_speed;
    }
    get y_speed() {
        return this._y_speed;
    }
    get extra_speed() {
        return this._extra_speed;
    }

    get current_action() {
        return this._current_action;
    }
    get current_animation() {
        return this._current_animation;
    }

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
            this.sliding
        );
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
        scale_y?: number
    ) {
        anchor_x = anchor_x ?? ControllableChar.default_anchor.x;
        anchor_y = anchor_y ?? ControllableChar.default_anchor.y;
        this._sprite_info = sprite_info;
        const sprite_key = this.sprite_info.getSpriteKey(this.current_action);
        this.sprite = group.create(0, 0, sprite_key);
        if (!this.active) {
            this.sprite.visible = false;
        }
        this.sprite.anchor.setTo(anchor_x, anchor_y);
        this.sprite.x = ((this.tile_x_pos + 0.5) * map.tile_width) | 0;
        this.sprite.y = ((this.tile_y_pos + 0.5) * map.tile_height) | 0;
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
        this.sprite.scale.setTo(scale_x, scale_y);
    }

    /**
     * Reset anchor values to default.
     * @param property define whether it is y or x anchor property.
     */
    protected reset_anchor(property?: "x" | "y") {
        if (property !== undefined && ["x", "y"].includes(property)) {
            this.sprite.anchor[property] = ControllableChar.default_anchor[property];
        } else {
            this.sprite.anchor.x = ControllableChar.default_anchor.x;
            this.sprite.anchor.y = ControllableChar.default_anchor.y;
        }
    }

    /**
     * Initialize the shadow sprite of this char.
     * @param key_name the shadow sprite key name.
     * @param group the group where the shadow sprite is going to be inserted.
     * @param layer the collision layer where the shadow is.
     * @param options optional options to be set like anchor values and whether it's a world map.
     */
    set_shadow(
        key_name: string,
        group: Phaser.Group,
        layer: number,
        options: {
            shadow_anchor_x?: number;
            shadow_anchor_y?: number;
            is_world_map?: boolean;
        }
    ) {
        key_name = key_name ?? ControllableChar.DEFAULT_SHADOW_KEYNAME;
        const shadow_anchor_x = options?.shadow_anchor_x ?? ControllableChar.DEFAULT_SHADOW_ANCHOR_X;
        const shadow_anchor_y = options?.shadow_anchor_y ?? ControllableChar.DEFAULT_SHADOW_ANCHOR_Y;
        this.shadow = group.create(0, 0, key_name);
        this.shadow.sort_function = () => {
            if (this.data.npc_group.getChildIndex(this.shadow) > this.data.npc_group.getChildIndex(this.sprite)) {
                this.data.npc_group.setChildIndex(this.shadow, this.data.npc_group.getChildIndex(this.sprite));
            } else {
                this.data.npc_group.setChildIndex(this.shadow, this.data.npc_group.getChildIndex(this.sprite) - 1);
            }
        };
        if (!this.active) {
            this.shadow.visible = false;
        }
        this.shadow.blendMode = PIXI.blendModes.MULTIPLY;
        this.shadow.disableRoundPx = true;
        this.shadow.anchor.setTo(shadow_anchor_x, shadow_anchor_y);
        this.shadow.base_collision_layer = layer;
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
        this.shadow.base_collision_layer = layer;
    }

    /**
     * Plays an animation of this char.
     * @param action the action that this char is going to doing.
     * @param animation an specific animation of the given action that this char is going to be executing.
     * @param start whether you want the animation to start. Otherwise it will be stopped.
     * @param frame_rate a custom frame rate value.
     * @returns Returns the resulting Phaser.Animation object.
     */
    play(action?: string | base_actions, animation?: string | number, start: boolean = true, frame_rate?: number) {
        action = action ?? this.current_action;
        if (animation === null || animation === undefined) {
            if (this.current_direction in reverse_directions) {
                animation = reverse_directions[this.current_direction];
            } else {
                animation = this.current_animation;
            }
        }
        if (this.sprite_info.getSpriteAction(this.sprite) !== action) {
            const sprite_key = this.sprite_info.getSpriteKey(action);
            this.sprite.loadTexture(sprite_key);
        }
        const animation_key = this.sprite_info.getAnimationKey(action, animation);
        if (!this.sprite.animations.getAnimation(animation_key)) {
            this.sprite_info.setAnimation(this.sprite, action);
        }
        const animation_obj = this.sprite.animations.getAnimation(animation_key);
        if (start) {
            this.sprite.animations.play(animation_key, frame_rate);
        } else {
            animation_obj.stop(true);
        }
        return animation_obj;
    }

    /**
     * Returns if this char is enough close to a target char.
     * @param target_char The target char.
     * @param distance the minimal distance to be considered as close.
     * @returns Returns whether it's close or not.
     */
    is_close(target_char: ControllableChar, distance: number) {
        const reference_angle = (8 - this.transition_direction) * numbers.degree45;
        let lower_limit = reference_angle - ControllableChar.INTERACTION_RANGE_ANGLE;
        let upper_limit = reference_angle + ControllableChar.INTERACTION_RANGE_ANGLE;
        const relative_point = {
            x: target_char.sprite.x - this.sprite.x,
            y: target_char.sprite.y - this.sprite.y,
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
        const distance_condition = Math.pow(relative_point.x, 2) + Math.pow(relative_point.y, 2) <= distance * distance;
        return angle_condition && distance_condition;
    }

    /**
     * Sets this char direction from its speed values.
     */
    private choose_direction_by_speed() {
        if (this.x_speed === 0 && this.y_speed === 0) {
            this._required_direction = null;
            return;
        }
        const angle = range_360(Math.atan2(this.y_speed, this.x_speed));
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
        /** Whether the camera should follow this char while jumping or not. */
        camera_follow?: boolean;
        /** Whether the char will bounce on jump finish. Only for vertical jumps. */
        bounce?: boolean;
        /** Whether the char shadow will remain hidden after jump. */
        keep_shadow_hidden?: boolean
    }) {
        const duration = options?.duration ?? 65;
        const jump_height = options?.jump_height ?? 12;
        const camera_follow = options?.camera_follow ?? true;
        const keep_shadow_hidden = options?.keep_shadow_hidden ?? false;
        let promise_resolve;
        const promise = new Promise(resolve => (promise_resolve = resolve));
        this.data.audio.play_se(options?.sfx_key ?? "actions/jump");
        let current_camera_target: Camera["target"];
        if (!camera_follow) {
            current_camera_target = this.data.camera.unfollow();
        }
        if (options?.dest !== undefined) {
            //deals with jumps that have a different position from the current char position.
            const dest_char = {
                x: options.dest.x ?? get_centered_pos_in_px(options.dest.tile_x, this.data.map.tile_width),
                y: options.dest.y ?? get_centered_pos_in_px(options.dest.tile_y, this.data.map.tile_height)
            };
            const is_jump_over_x_axis = (options.dest.tile_x ?? get_tile_position(dest_char.x, this.data.map.tile_width)) === this.tile_x_pos;
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
                [axis]: this.sprite[axis] + (distance * distance_multiplier),
            };
            const jump_direction = options.jump_direction ?? this.current_direction;
            if (axis === "x") {
                const half_height = jump_height >> 1;
                const aux_height = dest_char.y - half_height;
                tween_obj.y = [aux_height, dest_char.y - jump_height, aux_height, dest_char.y];
            } else {
                tween_obj.x = dest_char.x;
            }
            this.game.physics.p2.pause();
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
                        this.shadow.x = dest_char.x;
                        this.shadow.y = dest_char.y;
                        if (!keep_shadow_hidden) {
                            this.shadow.visible = true;
                        }
                    }
                    if (this.sprite_info.hasAction(base_actions.JUMP)) {
                        this.sprite.animations.currentAnim.reverseOnce();
                        this.play(base_actions.JUMP, reverse_directions[jump_direction]);
                        this.sprite.animations.currentAnim.onComplete.addOnce(() => {
                            this.game.physics.p2.resume();
                            this.jumping = false;
                            if (!camera_follow) {
                                this.data.camera.follow(current_camera_target);
                            }
                            promise_resolve();
                        });
                    } else {
                        this.game.physics.p2.resume();
                        this.jumping = false;
                        if (!camera_follow) {
                            this.data.camera.follow(current_camera_target);
                        }
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
                    if (!camera_follow) {
                        this.data.camera.follow(current_camera_target);
                    }
                    promise_resolve();
                });
            } else {
                tween.start();
                tween.onComplete.addOnce(() => {
                    this.shadow_following = previous_shadow_state;
                    if (!camera_follow) {
                        this.data.camera.follow(current_camera_target);
                    }
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
     */
    async show_emoticon(
        emoticon_key: string,
        options?: {
            /** The duration that this emoticon is going to be shown. */
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
        const emoticon_sprite = this.game.add.sprite(x, y, "emoticons", emoticon_key);
        emoticon_sprite.anchor.setTo(0.5, 1);
        emoticon_sprite.scale.x = 0;

        const duration = options?.duration ?? 800;

        let promise_resolve;
        const promise = new Promise(resolve => (promise_resolve = resolve));
        this.game.add
            .tween(emoticon_sprite.scale)
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
                this.game.time.events.add(duration, () => {
                    emoticon_sprite.destroy();
                    promise_resolve();
                });
            });
        await promise;
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
     */
    set_rotation(rotate: boolean, interframe_interval: number = -1) {
        this._rotating = rotate;
        if (this._rotating) {
            this._rotating_interval = interframe_interval;
            this._rotating_elapsed = 0;
        }
    }

    /**
     * Rotates the char on z-axis.
     */
    private rotate() {
        if (this._rotating) {
            if (this._rotating_interval === -1 || this._rotating_elapsed > this._rotating_interval) {
                this.set_direction((this.current_direction + 1) & 7, true, true);
                this._rotating_elapsed = 0;
            } else {
                this._rotating_elapsed += this.game.time.elapsedMS;
            }
        }
    }

    /** Update function in the game is in event state. */
    update_on_event() {
        if (!this.active) return;
        this.look_to_target();
        this.rotate();
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
    }

    /**
     * The update function for the shadow sprite.
     */
    update_shadow() {
        if (!this.shadow || !this.shadow_following || !this.active) return;
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
     * Activates or deactivates this char.
     * @param active if true, activates it.
     */
    abstract toggle_active(active: boolean): void;

    /**
     * Stops the char movement.
     * @param change_sprite if true, sets idle animation.
     */
    stop_char(change_sprite: boolean = true) {
        this._x_speed = this._y_speed = 0;
        this.choose_direction_by_speed();
        if (this.sprite.body) {
            this.sprite.body.velocity.y = this.sprite.body.velocity.x = 0;
        }
        if (change_sprite) {
            this._current_action = base_actions.IDLE;
            this.play_current_action();
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
    set_direction(direction: directions, force_change: boolean = false, transition_also: boolean = true) {
        this._current_direction = direction;
        if (transition_also) {
            this._transition_direction = direction;
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
     * @param start forces the timer start if true.
     */
    set_push_timer(callback: () => void, delay: number = Phaser.Timer.QUARTER, start: boolean = true) {
        this.unset_push_timer();
        this._push_timer = this.game.time.events.add(delay, callback);
        this._push_timer.timer.start();
    }

    /**
     * Unsets the push timer.
     */
    unset_push_timer() {
        if (this.push_timer?.timer) {
            this.push_timer.timer.destroy();
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
    play_current_action(check_on_event: boolean = false) {
        if (check_on_event && this.data.tile_event_manager.on_event) {
            return;
        }
        let action = this.current_action;
        let idle_climbing = this.idle_climbing;
        if (this.stop_by_colliding && !this.pushing && !this.climbing) {
            action = base_actions.IDLE;
        } else if (this.stop_by_colliding && !this.pushing && this.climbing) {
            idle_climbing = true;
        }
        const animation = idle_climbing ? base_actions.IDLE : reverse_directions[this.transition_direction];
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
        if (this.required_direction === null && this.current_action !== base_actions.IDLE && !this.climbing) {
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
     * Updates the tile positions.
     */
    update_tile_position() {
        this._tile_x_pos = get_tile_position(this.sprite.x, this.data.map.tile_width);
        this._tile_y_pos = get_tile_position(this.sprite.y, this.data.map.tile_height);
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
        this._extra_speed += delta_value;
    }

    /**
     * Calculates this char speed based on its states like walk, dash etc.
     */
    protected calculate_speed() {
        //when setting temp_velocity_x or temp_velocity_y, it means that these velocities will still be analyzed in collision_dealer function
        const delta_time = this.game.time.elapsedMS / numbers.DELTA_TIME_FACTOR;
        const apply_speed = (speed_factor: number) => {
            this.temp_velocity_x = (delta_time * this.x_speed * speed_factor) | 0;
            this.temp_velocity_y = (delta_time * this.y_speed * speed_factor) | 0;
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
        } else if (this.current_action === base_actions.WALK) {
            const speed_factor =
                this.walk_speed +
                this.extra_speed +
                (this.data.map.is_world_map ? numbers.WORLD_MAP_SPEED_WALK_REDUCE : 0);
            apply_speed(speed_factor);
        } else if (this.current_action === base_actions.CLIMB) {
            this.temp_velocity_x = (delta_time * this.x_speed * this.climb_speed) | 0;
            this.temp_velocity_y = (delta_time * this.y_speed * this.climb_speed) | 0;
        } else if (this.current_action === base_actions.IDLE) {
            this.sprite.body.velocity.y = this.sprite.body.velocity.x = 0;
        }
    }

    /**
     * Apply the calculated speed values.
     */
    protected apply_speed() {
        if (
            [base_actions.WALK, base_actions.DASH, base_actions.CLIMB].includes(this.current_action as base_actions) ||
            (this.sliding_on_ice && this.ice_sliding_active) || this.walking_over_rope
        ) {
            //sets the final velocity
            this.sprite.body.velocity.x = this.temp_velocity_x;
            this.sprite.body.velocity.y = this.temp_velocity_y;
        }
    }

    /**
     * Sets some speed values.
     * @param x_speed the x speed value.
     * @param y_speed the y speed value.
     * @param apply_speed if true, the given speed will be applied.
     */
    set_speed(x_speed: number, y_speed: number, apply_speed: boolean = true) {
        this._x_speed = x_speed ?? this.x_speed;
        this._y_speed = y_speed ?? this.y_speed;
        this.calculate_speed();
        if (apply_speed) {
            this.apply_speed();
        }
    }
}
