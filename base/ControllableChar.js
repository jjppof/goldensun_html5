import * as numbers from "../magic_numbers.js";
import { reverse_directions } from "../utils.js";

const DEFAULT_SHADOW_ANCHOR_X = 0.45;
const DEFAULT_SHADOW_ANCHOR_Y = 0.05;
const DEFAULT_SPRITE_ANCHOR_X = 0;
const DEFAULT_SPRITE_ANCHOR_Y = 0.8;

export class ControllableChar {
    constructor(game, data, key_name, initial_x, initial_y, initial_action, initial_direction) {
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
        this.idle_climbing = false;
        this.sprite_info = null;
        this.sprite = null;
        this.shadow = null;
        this.tile_x_pos = initial_x;
        this.tile_y_pos = initial_y;
        this.current_action = initial_action;
        this.current_direction = initial_direction;
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

    set_shadow(key_name, group, layer, shadow_anchor_x = DEFAULT_SHADOW_ANCHOR_X, shadow_anchor_y = DEFAULT_SHADOW_ANCHOR_Y) {
        this.shadow = group.create(0, 0, key_name);
        this.shadow.blendMode = PIXI.blendModes.MULTIPLY;
        this.shadow.disableRoundPx = true;
        this.shadow.anchor.setTo(shadow_anchor_x, shadow_anchor_y);
        this.shadow.base_collider_layer = layer;
    }

    follow() {
        this.game.camera.follow(this.sprite, Phaser.Camera.FOLLOW_LOCKON, numbers.CAMERA_LERP, numbers.CAMERA_LERP);
        this.game.camera.focusOn(this.sprite);
    }

    set_collider_layer(layer) {
        this.sprite.base_collider_layer = layer;
        this.shadow.base_collider_layer = layer;
    }

    play(action, direction) {
        action = action === undefined ? this.current_action : action;
        direction = direction === undefined ? this.current_direction : direction;
        this.sprite_info.setAnimation(this.sprite, action);
        this.sprite.animations.play(action + "_" + reverse_directions[direction]);
    }

    update_shadow() {
        this.shadow.x = this.sprite.body.x;
        this.shadow.y = this.sprite.body.y;
    }

    stop_char(change_sprite = true) {
        this.sprite.body.velocity.y = this.sprite.body.velocity.x = 0;
        if (change_sprite) {
            this.current_action = "idle";
            this.change_sprite();
        }
    }

    change_sprite(check_on_event = false) {
        if (check_on_event && this.data.on_event) {
            return;
        }
        let action = this.current_action;
        let direction = this.current_direction;
        let idle_climbing = this.idle_climbing;
        if (this.stop_by_colliding && !this.pushing && !this.climbing) {
            action = "idle";
        } else if (this.stop_by_colliding && !this.pushing && this.climbing) {
            idle_climbing = true;
        }
        const key = this.key_name + "_" + action;
        const animation = action + "_" + (idle_climbing ? "idle" : reverse_directions[direction]);
        if (this.sprite.key !== key) {
            this.sprite.loadTexture(key);
            this.sprite_info.setAnimation(this.sprite, action);
            this.sprite.animations.play(animation);
        }
        if (this.sprite.animations.currentAnim.name !== animation) {
            this.sprite.animations.play(animation);
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

    set_speed() {
        if (["walk", "dash", "climb"].includes(this.current_action)) { //sets the final velocity
            this.sprite.body.velocity.x = this.sprite.body.velocity.temp_x;
            this.sprite.body.velocity.y = this.sprite.body.velocity.temp_y;
        }
    }
}
