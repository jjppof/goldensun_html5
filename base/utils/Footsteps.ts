import {ControllableChar} from "../ControllableChar";
import {GoldenSun} from "../GoldenSun";
import {SpriteBase} from "../SpriteBase";
import {base_actions, directions} from "../utils";

const FOOTSTEPS_TTL = Phaser.Timer.SECOND << 1;
const WALKING_TIME_INTERVAL = Phaser.Timer.QUARTER;
const RUNNING_TIME_INTERVAL = Phaser.Timer.QUARTER;

const INITIAL_ACTION = base_actions.IDLE;
const INITIAL_DIRECTION = directions.down;

const FOOTSTEPS_KEY_NAME = "footprints";
const FOOTSTEPS_ANCHOR = 0.5;
const MAX_DEAD_SIZE = 20;

const foot_forward_types = {
    NONE: "none",
    RIGHT: "right",
    LEFT: "left",
};

/*Generates and manages footprints
Can be applied to any movable unit

Input: game [Phaser:Game] - Reference to the running game object
       data [GoldenSun] - Reference to the main JS Class instance*/
export class Footsteps {
    public game: Phaser.Game;
    public data: GoldenSun;
    public x_pos: number;
    public y_pos: number;
    public current_action: string;
    public current_direction: number;
    public anchor_x: number;
    public anchor_y: number;
    public group: Phaser.Group;
    public dead_steps: Phaser.Sprite[];
    public dead_index: number;
    public foot_forward: string;
    public can_make_footprint: boolean;
    public footsteps_time_interval: number;
    public new_step_timer: Phaser.Timer;
    public expire_timer: Phaser.Timer;
    public footsteps_sprite_base: SpriteBase;
    public char: ControllableChar;

    constructor(game, data, char) {
        this.game = game;
        this.data = data;
        this.x_pos = 0;
        this.y_pos = 0;
        this.current_action = INITIAL_ACTION;
        this.current_direction = INITIAL_DIRECTION;
        this.anchor_x = FOOTSTEPS_ANCHOR;
        this.anchor_y = FOOTSTEPS_ANCHOR;
        this.group = this.game.add.group();
        this.group.send_to_back = true;
        this.group.base_collision_layer = 0;

        this.dead_steps = new Array(MAX_DEAD_SIZE);
        this.dead_index = 0;
        this.foot_forward = foot_forward_types.NONE;
        this.can_make_footprint = true;
        this.footsteps_time_interval = WALKING_TIME_INTERVAL;

        this.new_step_timer = this.game.time.create(false);
        this.expire_timer = this.game.time.create(false);

        this.footsteps_sprite_base = this.data.info.misc_sprite_base_list[FOOTSTEPS_KEY_NAME];
        this.char = char;
    }

    /*Sets the footprint interval timer*/
    set_new_step_timer() {
        this.can_make_footprint = false;
        this.new_step_timer.add(this.footsteps_time_interval, () => {
            this.can_make_footprint = true;
        });
        this.new_step_timer.start();
    }

    /*Sets the footprint expiration timer*/
    set_expire_timer(sprite, animation) {
        this.expire_timer.add(
            FOOTSTEPS_TTL,
            () => {
                sprite.animations.play(animation);
            },
            this
        );
        this.expire_timer.start();
    }

    /*Either kills or destroys a given step
    Killing leaves the sprite in memory to be recycled

    Input: expired [Phaser:Sprite]: The step to be killed/destroyed*/
    kill_step(expired) {
        if (this.dead_index === MAX_DEAD_SIZE) {
            expired.destroy();
        } else {
            expired.kill();
            this.dead_steps[this.dead_index++] = expired;
        }
    }

    /*Rotates the step according the parent's direction
    Also flips the sprite horizontally if necessary
    
    Input: sprite [Phaser:Sprite] - The sprite to be affected*/
    position_footsteps(sprite) {
        sprite.scale.x = this.foot_forward === foot_forward_types.RIGHT ? -1 : 1;
        sprite.rotation = ((this.current_direction + 2) * Math.PI) / 4;
    }

    /*Displays a new step on screen
    Will recycle dead sprites if available

    Input: direction [number] = The parent's current direction
           action [string] = The parent's current action*/
    create_step(direction, action) {
        if (this.data.middlelayer_group.getIndex(this.group) < 0) {
            this.data.middlelayer_group.add(this.group);
        }
        this.current_direction = direction;
        this.current_action = action;
        this.update_foot();
        const footsteps_type = this.current_action === base_actions.IDLE ? "double" : "single";
        const animation_name = this.footsteps_sprite_base.getAnimationKey(FOOTSTEPS_KEY_NAME, footsteps_type);

        let footsteps_sprite;
        if (this.dead_index === 0) {
            const sprite_key = this.footsteps_sprite_base.getSpriteKey(FOOTSTEPS_KEY_NAME);
            footsteps_sprite = this.group.create(0, 0, sprite_key);
            footsteps_sprite.anchor.setTo(this.anchor_x, this.anchor_y);
            this.footsteps_sprite_base.setAnimation(footsteps_sprite, FOOTSTEPS_KEY_NAME);
        } else {
            footsteps_sprite = this.dead_steps[--this.dead_index];
            footsteps_sprite.reset(0, 0);
        }
        const animation_obj = footsteps_sprite.animations.getAnimation(animation_name);
        animation_obj.stop(true);
        this.group.base_collision_layer = this.data.map.collision_layer;
        footsteps_sprite.x = this.char.sprite.x;
        footsteps_sprite.y = this.char.sprite.y;
        this.position_footsteps(footsteps_sprite);

        animation_obj.onComplete.addOnce(() => {
            this.kill_step(footsteps_sprite);
        });
        this.set_expire_timer(footsteps_sprite, animation_name);

        this.set_new_step_timer();
    }

    /*Updates the "foot_forward" property*/
    update_foot() {
        this.footsteps_time_interval =
            this.current_action === base_actions.WALK ? WALKING_TIME_INTERVAL : RUNNING_TIME_INTERVAL;
        if (this.current_action === base_actions.IDLE) {
            this.foot_forward = foot_forward_types.NONE;
        } else {
            this.foot_forward =
                this.foot_forward === foot_forward_types.LEFT ? foot_forward_types.RIGHT : foot_forward_types.LEFT;
        }
    }

    /*Kills all sprites and resets the timers

    Input: force_destroy [boolean] - If true, destroys steps instead*/
    clean_all(force_destroy = false) {
        this.new_step_timer.stop(true);
        this.expire_timer.stop(true);
        this.group.children.forEach((sprite: Phaser.Sprite) => {
            if (force_destroy) {
                sprite.destroy();
            } else {
                sprite.animations.currentAnim.stop(true);
                sprite.animations.currentAnim.onComplete.removeAll();
                sprite.kill();
            }
        });
        this.dead_steps = this.group.children.slice() as Phaser.Sprite[];
        this.dead_index = this.group.children.length;
    }

    /*Destroys this object and its children*/
    destroy() {
        this.clean_all(true);
        this.new_step_timer.destroy();
        this.expire_timer.destroy();
    }
}
