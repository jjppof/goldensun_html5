import * as numbers from "../magic_numbers.js";
import { reverse_directions } from "../utils.js";
import { Footsteps } from "./Footsteps.js";

const DEFAULT_SHADOW_ANCHOR_X = 0.45;
const DEFAULT_SHADOW_ANCHOR_Y = 0.05;
const DEFAULT_SPRITE_ANCHOR_X = 0.50;
const DEFAULT_SPRITE_ANCHOR_Y = 0.80;

export class ControllableChar {
    constructor(game, data, key_name, initial_x, initial_y, initial_action, initial_direction, enable_footsteps) {
        this.game = game;
        this.data = data;
        this.key_name = key_name;
        this.x_speed = 0;
        this.y_speed = 0;
        this.extra_speed = 0;
        this.stop_by_colliding = false;
        this.force_direction = false;
        this.climbing = false;
        this.pushing = false;
        this.jumping = false;
        this.casting_psynergy = false;
        this.idle_climbing = false;
        this.sprite_info = null;
        this.sprite = null;
        this.shadow = null;
        this.tile_x_pos = initial_x;
        this.tile_y_pos = initial_y;
        this.current_action = initial_action;
        this.current_direction = initial_direction;
        this.required_direction = 0;
        this.color_filter = this.game.add.filter('ColorFilters');
        this.enable_footsteps = enable_footsteps === undefined ? false : enable_footsteps;
        this.footsteps = new Footsteps(this.game, this.data);
    }

    in_action() {
        return this.casting_psynergy || this.pushing || this.climbing || this.jumping;
    }

    set_sprite(group, sprite_info, map_sprite, layer, anchor_x = DEFAULT_SPRITE_ANCHOR_X, anchor_y = DEFAULT_SPRITE_ANCHOR_Y) {
        this.sprite = group.create(0, 0, this.key_name + "_" + this.current_action);
        this.sprite_info = sprite_info;
        this.sprite.centerX = ((this.tile_x_pos + 1.5) * map_sprite.tileWidth) | 0;
        this.sprite.centerY = ((this.tile_y_pos + 1.5) * map_sprite.tileHeight) | 0;
        this.sprite.base_collider_layer = layer;
        this.sprite.roundPx = true;
        this.sprite.anchor.setTo(anchor_x, anchor_y);
    }

    reset_anchor() {
        this.sprite.anchor.x = DEFAULT_SPRITE_ANCHOR_X;
        this.sprite.anchor.y = DEFAULT_SPRITE_ANCHOR_Y;
    }

    set_shadow(key_name, group, layer, shadow_anchor_x = DEFAULT_SHADOW_ANCHOR_X, shadow_anchor_y = DEFAULT_SHADOW_ANCHOR_Y) {
        this.shadow = group.create(0, 0, key_name);
        this.shadow.blendMode = PIXI.blendModes.MULTIPLY;
        this.shadow.disableRoundPx = true;
        this.shadow.anchor.setTo(shadow_anchor_x, shadow_anchor_y);
        this.shadow.base_collider_layer = layer;
    }

    camera_follow() {
        this.game.camera.follow(this.sprite, Phaser.Camera.FOLLOW_LOCKON, numbers.CAMERA_LERP, numbers.CAMERA_LERP);
        this.game.camera.focusOn(this.sprite);
    }

    set_collider_layer(layer) {
        this.sprite.base_collider_layer = layer;
        this.shadow.base_collider_layer = layer;
    }

    play(action, animation) {
        action = action === undefined ? this.current_action : action;
        animation = animation === undefined ? reverse_directions[this.current_direction] : animation;
        if (this.sprite.key.split("_")[1] !== action) {
            this.sprite.loadTexture(this.key_name + "_" + action);
        }
        const animation_key = action + "_" + animation;
        if (!this.sprite.animations.getAnimation(animation_key)) {
            this.sprite_info.setAnimation(this.sprite, action);
        }
        this.sprite.animations.play(animation_key);
        return this.sprite.animations.getAnimation(animation_key);
    }

    update_shadow() {
        this.shadow.x = this.sprite.body.x;
        this.shadow.y = this.sprite.body.y;
    }

    stop_char(change_sprite = true) {
        this.sprite.body.velocity.y = this.sprite.body.velocity.x = 0;
        if (change_sprite) {
            this.current_action = "idle";
            this.set_action();
        }
    }

    set_action(check_on_event = false) {
        if (check_on_event && this.data.tile_event_manager.on_event) {
            return;
        }
        let action = this.current_action;
        let idle_climbing = this.idle_climbing;
        if (this.stop_by_colliding && !this.pushing && !this.climbing) {
            action = "idle";
        } else if (this.stop_by_colliding && !this.pushing && this.climbing) {
            idle_climbing = true;
        }
        const animation = idle_climbing ? "idle" : reverse_directions[this.current_direction];
        this.play(action, animation);
    }

    tile_able_to_show_footprint() {
        const tiles = this.data.map.get_current_tile(this);
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
        if (this.data.tile_event_manager.on_event) {
            return;
        }
        if (this.required_direction === null && this.current_action !== "idle" && !this.climbing) {
            this.current_action = "idle";
        } else if (this.required_direction !== null && !this.climbing && !this.pushing) {
            const footsteps = this.enable_footsteps && this.data.map.show_footsteps && this.tile_able_to_show_footprint();
            if(this.footsteps.can_make_footprint && footsteps){
                this.footsteps.create_step(this.current_direction,this.current_action);
            }
            const shift_pressed = this.game.input.keyboard.isDown(Phaser.Keyboard.SHIFT);
            if (shift_pressed && this.current_action !== "dash") {
                this.current_action = "dash";
            } else if (!shift_pressed && this.current_action !== "walk") {
                this.current_action = "walk";
            }
        }
    }

    update_tile_position(map_sprite) {
        this.tile_x_pos = (this.sprite.x/map_sprite.tileWidth) | 0;
        this.tile_y_pos = (this.sprite.y/map_sprite.tileHeight) | 0;
    }

    calculate_speed() { //when setting temp_x or temp_y, it means that these velocities will still be analyzed in collision_dealer function
        const delta_time = this.game.time.elapsedMS / numbers.DELTA_TIME_FACTOR;
        if (this.current_action === "dash") {
            this.sprite.body.velocity.temp_x = (delta_time * this.x_speed * (this.sprite_info.dash_speed + this.extra_speed)) | 0;
            this.sprite.body.velocity.temp_y = (delta_time * this.y_speed * (this.sprite_info.dash_speed + this.extra_speed)) | 0;
        } else if(this.current_action === "walk") {
            this.sprite.body.velocity.temp_x = (delta_time * this.x_speed * (this.sprite_info.walk_speed + this.extra_speed)) | 0;
            this.sprite.body.velocity.temp_y = (delta_time * this.y_speed * (this.sprite_info.walk_speed + this.extra_speed)) | 0;
        } else if(this.current_action === "climb") {
            this.sprite.body.velocity.temp_x = (delta_time * this.x_speed * this.sprite_info.climb_speed) | 0;
            this.sprite.body.velocity.temp_y = (delta_time * this.y_speed * this.sprite_info.climb_speed) | 0;
        } else if(this.current_action === "idle") {
            this.sprite.body.velocity.y = this.sprite.body.velocity.x = 0;
        }
    }

    apply_speed() {
        if (["walk", "dash", "climb"].includes(this.current_action)) { //sets the final velocity
            this.sprite.body.velocity.x = this.sprite.body.velocity.temp_x;
            this.sprite.body.velocity.y = this.sprite.body.velocity.temp_y;
        }
    }

    set_speed(x_speed, y_speed) {
        this.x_speed = x_speed === undefined ? this.x_speed : x_speed;
        this.y_speed = y_speed === undefined ? this.y_speed : y_speed;
        this.calculate_speed();
        this.apply_speed();
    }
}
