import {SpriteBase} from "../base/SpriteBase.js";
import {directions, reverse_directions, degrees_to_radians} from "../utils.js";

const FOOTSTEPS_TTL = Phaser.Timer.SECOND << 1;
const WALKING_TIME_INTERVAL = Phaser.Timer.QUARTER;
const RUNNING_TIME_INTERVAL = Phaser.Timer.QUARTER;

const INITIAL_ACTION = "idle";
const INITIAL_DIRECTION = directions.down;

const FOOTSTEPS_KEY_NAME = "footprints";
const MAX_DEAD_SIZE = 20;

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
        this.action_keys = this.animation_db.actions.animations;

        this.active_steps = {};
        this.dead_steps = new Array(MAX_DEAD_SIZE);
        this.dead_index = 0;
        this.foot_forward = "None";
        this.can_make_footprint = true;
        this.footsteps_type = 1;
        this.footsteps_time_interval = WALKING_TIME_INTERVAL;

        this.new_step_timer = this.game.time.create(false);
        this.expire_timer = this.game.time.create(false);

        this.footsteps_sprite_base = new SpriteBase(FOOTSTEPS_KEY_NAME, this.action_keys);

        for (let i = 0; i<this.action_keys.length; ++i){
            this.footsteps_sprite_base.setActionSpritesheet(this.action_keys[i], "assets/images/misc/footprints.png", "assets/images/misc/footprints.json");
            this.footsteps_sprite_base.setActionDirections(this.action_keys[i], [reverse_directions[directions.up]], this.animation_db.actions.frames_count[i]);
            this.footsteps_sprite_base.setActionFrameRate(this.action_keys[i], this.animation_db.actions.frame_rate[i]);
        }

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

    set_expire_timer(sprite, footsteps_type){
        this.expire_timer.add(FOOTSTEPS_TTL,()=>{
            sprite.animations.play(this.action_keys[footsteps_type]+"_up");
        },this);
        this.expire_timer.start();
    }

    kill_step(expired, key){
        delete this.active_steps[key];
        if(this.dead_index === MAX_DEAD_SIZE){
            expired.destroy();
        }
        else{
            expired.kill();
            this.dead_steps[this.dead_index++] = expired;
        }
    }

    position_footsteps(sprite){
        let angle = this.find_direction_angle(this.current_direction);
        sprite.scale.x = this.foot_forward == "Right" ?  -1 : 1; 
        sprite.rotation = degrees_to_radians(angle);
    }

    create_step(direction,action){
        this.current_direction = direction;
        this.current_action = action;
        this.update_foot();
        this.footsteps_type = this.current_action == "idle" ?  1 : 0;

        let footsteps_sprite;
        if(this.dead_index === 0){
            footsteps_sprite = this.data.npc_group.create(0, 0, FOOTSTEPS_KEY_NAME);
            footsteps_sprite.anchor.setTo(this.anchor_x, this.anchor_y);
            footsteps_sprite.send_to_back = true;
        }
        else{
            footsteps_sprite = this.dead_steps[--this.dead_index];
            footsteps_sprite.reset(0, 0);
        }

        footsteps_sprite.base_collider_layer = this.data.map.collision_layer;
        footsteps_sprite.x = this.data.hero.shadow.x;
        footsteps_sprite.y = this.data.hero.shadow.y;
        this.position_footsteps(footsteps_sprite);

        this.footsteps_sprite_base.setAnimation(footsteps_sprite,this.action_keys[this.footsteps_type]);
        footsteps_sprite.animations.currentAnim.loop = false;
        const key = Object.keys(this.active_steps).length;
        footsteps_sprite.animations.currentAnim.onComplete.addOnce(this.kill_step.bind(this, footsteps_sprite, key));
        this.active_steps[key] = footsteps_sprite;
        footsteps_sprite.animations.currentAnim.stop(true);
        this.set_expire_timer(footsteps_sprite, this.footsteps_type);

        this.set_new_step_timer();
    }

    update_foot(){
        this.footsteps_time_interval = this.current_action == "walk" ? WALKING_TIME_INTERVAL : RUNNING_TIME_INTERVAL;
        if(this.current_action == "idle"){
            this.foot_forward = "None";
        }
        else{
            this.foot_forward == "Left" ? this.foot_forward = "Right" : this.foot_forward = "Left";
        }
    }

    clean_all(){
        this.new_step_timer.stop(true);
        this.expire_timer.stop(true);
        this.dead_index = 0;
        Object.keys(this.active_steps).forEach(key => {
            this.kill_step(this.active_steps[key], key);
        });
    }

    destroy(){
        this.clean_all();
        for(let i=0; i<this.dead_steps.length; i++){
            this.data.npc_group.remove(this.dead_steps[i],true);
        }
        this.footsteps_sprite_base = null;
        this.animation_db = null;
        this.new_step_timer.destroy();
        this.expire_timer.destroy();
    }
}