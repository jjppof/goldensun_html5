import * as numbers from "./magic_numbers";
import {reverse_directions, base_actions} from "./utils";
import {Footsteps} from "./utils/Footsteps";
import {GoldenSun} from "./GoldenSun";
import {SpriteBase} from "./SpriteBase";
import {Map} from "./Map";

export class ControllableChar {
    private static readonly DEFAULT_SHADOW_KEYNAME = "shadow";

    private static readonly DEFAULT_SHADOW_ANCHOR_X = 0.45;
    private static readonly DEFAULT_SHADOW_ANCHOR_Y = 0.05;
    private static readonly DEFAULT_SPRITE_ANCHOR_X = 0.5;
    private static readonly DEFAULT_SPRITE_ANCHOR_Y = 0.8;

    private static readonly default_anchor = {
        x: ControllableChar.DEFAULT_SPRITE_ANCHOR_X,
        y: ControllableChar.DEFAULT_SPRITE_ANCHOR_Y,
    };

    public game: Phaser.Game;
    public data: GoldenSun;
    public key_name: string;
    public x_speed: number;
    public y_speed: number;
    public extra_speed: number;
    public walk_speed: number;
    public dash_speed: number;
    public climb_speed: number;
    public stop_by_colliding: boolean;
    public force_direction: boolean;
    public dashing: boolean;
    public climbing: boolean;
    public pushing: boolean;
    public jumping: boolean;
    public sliding: boolean;
    public casting_psynergy: boolean;
    public teleporting: boolean;
    public idle_climbing: boolean;
    public sprite_info: SpriteBase;
    public sprite: Phaser.Sprite;
    public shadow: Phaser.Sprite;
    public body_radius: number;
    public tile_x_pos: number;
    public tile_y_pos: number;
    public current_action: string | base_actions;
    public current_direction: number;
    public required_direction: number;
    public desired_direction: number;
    public color_filter: Phaser.Filter;
    public enable_footsteps: boolean;
    public footsteps: Footsteps;
    public trying_to_push: boolean;
    public trying_to_push_direction: number;
    public push_timer: Phaser.TimerEvent;
    public crop_texture: boolean;
    public shadow_following: boolean;

    constructor(
        game: Phaser.Game,
        data: GoldenSun,
        key_name: string,
        initial_x: number,
        initial_y: number,
        initial_action: string | base_actions,
        initial_direction: number,
        enable_footsteps: boolean,
        walk_speed: number,
        dash_speed: number,
        climb_speed: number
    ) {
        this.game = game;
        this.data = data;
        this.key_name = key_name;
        this.x_speed = 0;
        this.y_speed = 0;
        this.extra_speed = 0;
        this.walk_speed = walk_speed;
        this.dash_speed = dash_speed;
        this.climb_speed = climb_speed;
        this.stop_by_colliding = false;
        this.force_direction = false;
        this.dashing = false;
        this.climbing = false;
        this.pushing = false;
        this.jumping = false;
        this.sliding = false;
        this.casting_psynergy = false;
        this.teleporting = false;
        this.idle_climbing = false;
        this.sprite_info = null;
        this.sprite = null;
        this.shadow = null;
        this.body_radius = 0;
        this.tile_x_pos = initial_x;
        this.tile_y_pos = initial_y;
        this.current_action = initial_action;
        this.current_direction = initial_direction;
        this.required_direction = 0;
        this.desired_direction = initial_direction;
        this.color_filter = this.game.add.filter("ColorFilters");
        this.trying_to_push = false;
        this.trying_to_push_direction = null;
        this.push_timer = null;
        this.enable_footsteps = enable_footsteps === undefined ? false : enable_footsteps;
        this.footsteps = new Footsteps(this.game, this.data);
        this.crop_texture = false;
        this.shadow_following = true;
    }

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

    set_sprite(
        group: Phaser.Group,
        sprite_info: SpriteBase,
        layer: number,
        map: Map,
        anchor_x?: number,
        anchor_y?: number,
        is_world_map: boolean = false
    ) {
        anchor_x = anchor_x === undefined ? ControllableChar.default_anchor.x : anchor_x;
        anchor_y = anchor_y === undefined ? ControllableChar.default_anchor.y : anchor_y;
        this.sprite_info = sprite_info;
        const action_key = this.sprite_info.getActionKey(this.current_action);
        this.sprite = group.create(0, 0, action_key);
        this.sprite.anchor.setTo(anchor_x, anchor_y);
        this.sprite.x = ((this.tile_x_pos + 0.5) * map.tile_width) | 0;
        this.sprite.y = ((this.tile_y_pos + 0.5) * map.tile_height) | 0;
        this.sprite.base_collision_layer = layer;
        this.sprite.roundPx = true;
        const scale_x = is_world_map ? numbers.WORLD_MAP_SPRITE_SCALE_X : 1;
        const scale_y = is_world_map ? numbers.WORLD_MAP_SPRITE_SCALE_Y : 1;
        this.sprite.scale.setTo(scale_x, scale_y);
    }

    reset_anchor(property?: "x" | "y") {
        if (property !== undefined && ["x", "y"].includes(property)) {
            this.sprite.anchor[property] = ControllableChar.default_anchor[property];
        } else {
            this.sprite.anchor.x = ControllableChar.default_anchor.x;
            this.sprite.anchor.y = ControllableChar.default_anchor.y;
        }
    }

    set_shadow(
        key_name: string,
        group: Phaser.Group,
        layer: number,
        shadow_anchor_x?: number,
        shadow_anchor_y?: number,
        is_world_map: boolean = false
    ) {
        key_name = key_name === undefined ? ControllableChar.DEFAULT_SHADOW_KEYNAME : key_name;
        shadow_anchor_x = shadow_anchor_x === undefined ? ControllableChar.DEFAULT_SHADOW_ANCHOR_X : shadow_anchor_x;
        shadow_anchor_y = shadow_anchor_y === undefined ? ControllableChar.DEFAULT_SHADOW_ANCHOR_Y : shadow_anchor_y;
        this.shadow = group.create(0, 0, key_name);
        this.shadow.blendMode = PIXI.blendModes.MULTIPLY;
        this.shadow.disableRoundPx = true;
        this.shadow.anchor.setTo(shadow_anchor_x, shadow_anchor_y);
        this.shadow.base_collision_layer = layer;
        const scale_x = is_world_map ? numbers.WORLD_MAP_SPRITE_SCALE_X : 1;
        const scale_y = is_world_map ? numbers.WORLD_MAP_SPRITE_SCALE_Y : 1;
        this.shadow.scale.setTo(scale_x, scale_y);
    }

    camera_follow() {
        this.game.camera.follow(this.sprite, Phaser.Camera.FOLLOW_LOCKON, numbers.CAMERA_LERP, numbers.CAMERA_LERP);
        this.game.camera.focusOn(this.sprite);
    }

    set_collision_layer(layer: number) {
        this.sprite.base_collision_layer = layer;
        this.shadow.base_collision_layer = layer;
    }

    play(action?: string | base_actions, animation?: string | number, start: boolean = true) {
        action = action === undefined ? this.current_action : action;
        animation = animation === undefined ? reverse_directions[this.current_direction] : animation;
        if (this.sprite_info.getSpriteAction(this.sprite) !== action) {
            const action_key = this.sprite_info.getActionKey(action);
            this.sprite.loadTexture(action_key);
        }
        const animation_key = this.sprite_info.getAnimationKey(action, animation);
        if (!this.sprite.animations.getAnimation(animation_key)) {
            this.sprite_info.setAnimation(this.sprite, action);
        }
        const animation_obj = this.sprite.animations.getAnimation(animation_key);
        if (start) {
            this.sprite.animations.play(animation_key);
        } else {
            animation_obj.stop(true);
        }
        return animation_obj;
    }

    set_frame(direction: number, frame_index: number = 0) {
        const frame_name = this.sprite_info.getFrameName(
            this.current_action,
            reverse_directions[direction],
            frame_index
        );
        this.sprite.frameName = frame_name;
    }

    update_shadow() {
        if (!this.shadow || !this.shadow_following) return;
        if (this.sprite.body) {
            this.shadow.x = this.sprite.body.x;
            this.shadow.y = this.sprite.body.y;
        } else {
            this.shadow.x = this.sprite.x;
            this.shadow.y = this.sprite.y;
        }
    }

    create_half_crop_mask(is_world_map: boolean = false) {
        if (is_world_map) {
            this.sprite.mask = this.game.add.graphics(
                this.sprite.centerX - (this.sprite.width >> 1),
                this.sprite.centerY - (this.sprite.height >> 1)
            );
            this.sprite.mask.beginFill(0xffffff, 1);
            this.sprite.mask.drawRect(0, 0, this.sprite.width, this.sprite.height);
            this.sprite.mask.endFill();
        }
    }

    set_half_crop_mask(crop: boolean, force: boolean = false) {
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

    check_half_crop_tile(force: boolean = false) {
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

    update_half_crop(force: boolean = false) {
        if (this.sprite.mask) {
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

    stop_char(change_sprite: boolean = true) {
        if (this.sprite.body) {
            this.sprite.body.velocity.y = this.sprite.body.velocity.x = 0;
        }
        if (change_sprite) {
            this.current_action = base_actions.IDLE;
            this.set_action();
        }
    }

    set_direction(direction: number) {
        this.current_direction = this.desired_direction = direction;
    }

    set_action(check_on_event: boolean = false) {
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
        const animation = idle_climbing ? base_actions.IDLE : reverse_directions[this.desired_direction];
        this.play(action, animation);
    }

    tile_able_to_show_footprint() {
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

    set_current_action() {
        if (this.data.tile_event_manager.on_event) return;
        if (this.required_direction === null && this.current_action !== base_actions.IDLE && !this.climbing) {
            this.current_action = base_actions.IDLE;
        } else if (this.required_direction !== null && !this.climbing && !this.pushing) {
            const footsteps =
                this.enable_footsteps && this.data.map.show_footsteps && this.tile_able_to_show_footprint();
            if (this.footsteps.can_make_footprint && footsteps) {
                this.footsteps.create_step(this.current_direction, this.current_action);
            }
            if (this.dashing && this.current_action !== base_actions.DASH) {
                this.current_action = base_actions.DASH;
            } else if (!this.dashing && this.current_action !== base_actions.WALK) {
                this.current_action = base_actions.WALK;
            }
        }
    }

    update_tile_position() {
        this.tile_x_pos = (this.sprite.x / this.data.map.tile_width) | 0;
        this.tile_y_pos = (this.sprite.y / this.data.map.tile_height) | 0;
    }

    calculate_speed() {
        //when setting temp_x or temp_y, it means that these velocities will still be analyzed in collision_dealer function
        const delta_time = this.game.time.elapsedMS / numbers.DELTA_TIME_FACTOR;
        if (this.current_action === base_actions.DASH) {
            const speed_factor =
                this.dash_speed +
                this.extra_speed +
                (this.data.map.is_world_map ? numbers.WORLD_MAP_SPEED_DASH_REDUCE : 0);
            this.sprite.body.velocity.temp_x = (delta_time * this.x_speed * speed_factor) | 0;
            this.sprite.body.velocity.temp_y = (delta_time * this.y_speed * speed_factor) | 0;
        } else if (this.current_action === base_actions.WALK) {
            const speed_factor =
                this.walk_speed +
                this.extra_speed +
                (this.data.map.is_world_map ? numbers.WORLD_MAP_SPEED_WALK_REDUCE : 0);
            this.sprite.body.velocity.temp_x = (delta_time * this.x_speed * speed_factor) | 0;
            this.sprite.body.velocity.temp_y = (delta_time * this.y_speed * speed_factor) | 0;
        } else if (this.current_action === base_actions.CLIMB) {
            this.sprite.body.velocity.temp_x = (delta_time * this.x_speed * this.climb_speed) | 0;
            this.sprite.body.velocity.temp_y = (delta_time * this.y_speed * this.climb_speed) | 0;
        } else if (this.current_action === base_actions.IDLE) {
            this.sprite.body.velocity.y = this.sprite.body.velocity.x = 0;
        }
    }

    apply_speed() {
        if ([base_actions.WALK, base_actions.DASH, base_actions.CLIMB].includes(this.current_action as base_actions)) {
            //sets the final velocity
            this.sprite.body.velocity.x = this.sprite.body.velocity.temp_x;
            this.sprite.body.velocity.y = this.sprite.body.velocity.temp_y;
        }
    }

    set_speed(x_speed: number, y_speed: number) {
        this.x_speed = x_speed === undefined ? this.x_speed : x_speed;
        this.y_speed = y_speed === undefined ? this.y_speed : y_speed;
        this.calculate_speed();
        this.apply_speed();
    }
}
