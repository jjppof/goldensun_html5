import {SpriteBase} from "../base/SpriteBase.js";
import {directions, reverse_directions, degrees_to_radians} from "../utils.js";

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

        this.active_steps = {};
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

    find_direction_angle(direction){
        switch(direction){
            case directions.right:
                return 90;
            case directions.down_right:
                return 135;
            case directions.down:
                return 180;
            case directions.down_left:
                return -135;
            case directions.left:
                return -90;
            case directions.up_left:
                return -45;
            case directions.up:
                return 0;
            case directions.up_right:
                return 45;
        }
    }

    set_new_step_timer(){
        this.can_make_footprint = false;
        this.new_step_timer.add(this.footsteps_time_interval,() => {this.can_make_footprint = true;})
        this.new_step_timer.start();
    }

    set_expire_timer(sprite, animation){
        this.expire_timer.add(FOOTSTEPS_TTL,()=>{
            sprite.animations.play(animation);
        },this);
        this.expire_timer.start();
    }

    kill_step(expired, key, force_destroy = false){
        delete this.active_steps[key];
        if(this.dead_index === MAX_DEAD_SIZE || force_destroy){
            expired.destroy();
        }
        else{
            expired.kill();
            this.dead_steps[this.dead_index++] = expired;
        }
    }

    position_footsteps(sprite){
        let angle = this.find_direction_angle(this.current_direction);
        sprite.scale.x = this.foot_forward === foot_forward_types.RIGHT ?  -1 : 1;
        sprite.rotation = degrees_to_radians(angle);
    }

    create_step(direction,action){
        this.current_direction = direction;
        this.current_action = action;
        this.update_foot();
        this.footsteps_type = this.current_action === "idle" ?  1 : 0;
        const animation_name = this.footsteps_sprite_base.getAnimationKey(FOOTSTEPS_KEY_NAME, this.animations[this.footsteps_type]);

        let footsteps_sprite;
        if(this.dead_index === 0){
            footsteps_sprite = this.data.npc_group.create(0, 0, FOOTSTEPS_KEY_NAME);
            footsteps_sprite.anchor.setTo(this.anchor_x, this.anchor_y);
            footsteps_sprite.send_to_back = true;
            this.footsteps_sprite_base.setAnimation(footsteps_sprite,FOOTSTEPS_KEY_NAME);
        }
        else{
            footsteps_sprite = this.dead_steps[--this.dead_index];
            footsteps_sprite.reset(0, 0);
        }
        const animation_obj = footsteps_sprite.animations.getAnimation(animation_name);
        footsteps_sprite.frame = animation_obj.frame;
        footsteps_sprite.base_collider_layer = this.data.map.collision_layer;
        footsteps_sprite.x = this.data.hero.shadow.x;
        footsteps_sprite.y = this.data.hero.shadow.y;
        this.position_footsteps(footsteps_sprite);

        const key = Object.keys(this.active_steps).length;
        animation_obj.onComplete.addOnce(this.kill_step.bind(this, footsteps_sprite, key));
        this.active_steps[key] = footsteps_sprite;
        this.set_expire_timer(footsteps_sprite, animation_name);

        this.set_new_step_timer();
    }

    update_foot(){
        this.footsteps_time_interval = this.current_action === "walk" ? WALKING_TIME_INTERVAL : RUNNING_TIME_INTERVAL;
        if(this.current_action === "idle"){
            this.foot_forward = foot_forward_types.NONE;
        }
        else{
            this.foot_forward = this.foot_forward === foot_forward_types.LEFT ? foot_forward_types.RIGHT : foot_forward_types.LEFT;
        }
    }

    clean_all(force_destroy){
        this.new_step_timer.stop(true);
        this.expire_timer.stop(true);
        this.dead_index = 0;
        Object.keys(this.active_steps).forEach(key => {
            this.kill_step(this.active_steps[key], key, force_destroy);
        });
    }

    destroy(){
        this.clean_all(this.active_steps);
        this.footsteps_sprite_base = null;
        this.animation_db = null;
        this.new_step_timer.destroy();
        this.expire_timer.destroy();
    }
}