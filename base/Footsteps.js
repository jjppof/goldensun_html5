import {SpriteBase} from "../base/SpriteBase.js";
import {directions} from "../utils.js";

const FOOTSTEPS_TTL = Phaser.Timer.SECOND << 1;
const WALKING_TIME_INTERVAL = Phaser.Timer.QUARTER;
const RUNNING_TIME_INTERVAL = Phaser.Timer.QUARTER;

const INITIAL_ACTION = "idle";
const INITIAL_DIRECTION = directions.down;

const FOOTSTEPS_KEY_NAME = "footprints";
const MAX_DEAD_SIZE = 20;

const foot_forward_types = {
    NONE: "none",
    RIGHT: "right",
    LEFT: "left"
};

/*Generates and manages footprints
Can be applied to any movable unit

Input: game [Phaser:Game] - Reference to the running game object
       data [GoldenSun] - Reference to the main JS Class instance*/
export class Footsteps{
    constructor(game, data){
        this.game = game;
        this.data = data;
        this.x_pos = 0;
        this.y_pos = 0;
        this.current_action = INITIAL_ACTION;
        this.current_direction = INITIAL_DIRECTION;
        this.animation_db = this.data.misc_animations_db[FOOTSTEPS_KEY_NAME];
        this.anchor_x = this.animation_db.anchor_x;
        this.anchor_y = this.animation_db.anchor_y;
        this.animations = this.animation_db.actions.animations;
        this.group = this.game.add.group();
        this.group.send_to_back = true;
        this.group.base_collider_layer = 0;

        this.dead_steps = new Array(MAX_DEAD_SIZE);
        this.dead_index = 0;
        this.foot_forward = foot_forward_types.NONE;
        this.can_make_footprint = true;
        this.footsteps_type = 1;
        this.footsteps_time_interval = WALKING_TIME_INTERVAL;

        this.new_step_timer = this.game.time.create(false);
        this.expire_timer = this.game.time.create(false);

        this.footsteps_sprite_base = new SpriteBase(FOOTSTEPS_KEY_NAME, [FOOTSTEPS_KEY_NAME]);
        this.footsteps_sprite_base.setActionDirections(FOOTSTEPS_KEY_NAME, this.animation_db.actions.animations, this.animation_db.actions.frames_count);
        this.footsteps_sprite_base.setActionFrameRate(FOOTSTEPS_KEY_NAME, this.animation_db.actions.frame_rate);
        this.footsteps_sprite_base.setActionLoop(FOOTSTEPS_KEY_NAME, this.animation_db.actions.loop);
        this.footsteps_sprite_base.generateAllFrames();
    }

    /*Sets the footprint interval timer*/
    set_new_step_timer(){
        this.can_make_footprint = false;
        this.new_step_timer.add(this.footsteps_time_interval,() => {this.can_make_footprint = true;})
        this.new_step_timer.start();
    }

    /*Sets the footprint expiration timer*/
    set_expire_timer(sprite, animation){
        this.expire_timer.add(FOOTSTEPS_TTL,()=>{
            sprite.animations.play(animation);
        },this);
        this.expire_timer.start();
    }

    /*Either kills or destroys a given step
    Killing leaves the sprite in memory to be recycled

    Input: expired [Phaser:Sprite]: The step to be killed/destroyed*/
    kill_step(expired){
        if(this.dead_index === MAX_DEAD_SIZE){
            expired.destroy();
        }
        else{
            expired.kill();
            this.dead_steps[this.dead_index++] = expired;
        }
    }

    /*Rotates the step according the parent's direction
    Also flips the sprite horizontally if necessary
    
    Input: sprite [Phaser:Sprite] - The sprite to be affected*/
    position_footsteps(sprite){
        sprite.scale.x = this.foot_forward === foot_forward_types.RIGHT ?  -1 : 1;
        sprite.rotation = (this.current_direction + 2)*Math.PI/4;
    }

    /*Displays a new step on screen
    Will recycle dead sprites if available

    Input: direction [number] = The parent's current direction
           action [string] = The parent's current action*/
    create_step(direction,action){
        if (this.data.npc_group.getIndex(this.group) < 0) {
            this.data.npc_group.add(this.group);
        }
        this.current_direction = direction;
        this.current_action = action;
        this.update_foot();
        this.footsteps_type = this.current_action === "idle" ?  1 : 0;
        const animation_name = this.footsteps_sprite_base.getAnimationKey(FOOTSTEPS_KEY_NAME, this.animations[this.footsteps_type]);

        let footsteps_sprite;
        if(this.dead_index === 0){
            footsteps_sprite = this.group.create(0, 0, FOOTSTEPS_KEY_NAME);
            footsteps_sprite.anchor.setTo(this.anchor_x, this.anchor_y);
            this.footsteps_sprite_base.setAnimation(footsteps_sprite,FOOTSTEPS_KEY_NAME);
        }
        else{
            footsteps_sprite = this.dead_steps[--this.dead_index];
            footsteps_sprite.reset(0, 0);
        }
        const animation_obj = footsteps_sprite.animations.getAnimation(animation_name);
        animation_obj.stop(true);
        this.group.base_collider_layer = this.data.map.collision_layer;
        footsteps_sprite.x = this.data.hero.shadow.x;
        footsteps_sprite.y = this.data.hero.shadow.y;
        this.position_footsteps(footsteps_sprite);

        animation_obj.onComplete.addOnce(() => {
            this.kill_step(footsteps_sprite);
        });
        this.set_expire_timer(footsteps_sprite, animation_name);

        this.set_new_step_timer();
    }

    /*Updates the "foot_forward" property*/
    update_foot(){
        this.footsteps_time_interval = this.current_action === "walk" ? WALKING_TIME_INTERVAL : RUNNING_TIME_INTERVAL;
        if(this.current_action === "idle"){
            this.foot_forward = foot_forward_types.NONE;
        }
        else{
            this.foot_forward = this.foot_forward === foot_forward_types.LEFT ? foot_forward_types.RIGHT : foot_forward_types.LEFT;
        }
    }

    /*Kills all sprites and resets the timers

    Input: force_destroy [boolean] - If true, destroys steps instead*/
    clean_all(force_destroy){
        this.new_step_timer.stop(true);
        this.expire_timer.stop(true);
        this.group.children.forEach(sprite => {
            if (force_destroy) {
                sprite.destroy();
            } else {
                sprite.animations.currentAnim.stop(true);
                sprite.animations.currentAnim.onComplete.removeAll();
                sprite.kill();
            }
        });
        this.dead_steps = this.group.children.slice();
        this.dead_index = this.group.children.length;
    }

    /*Destroys this object and its children*/
    destroy(){
        this.clean_all(true);
        this.footsteps_sprite_base = null;
        this.animation_db = null;
        this.new_step_timer.destroy();
        this.expire_timer.destroy();
    }
}