import {SpriteBase} from "../base/SpriteBase.js";
import {directions, reverse_directions, degrees_to_radians} from "../utils.js";

const FOOTSTEPS_TTL = Phaser.Timer.SECOND*2;
const WALKING_TIME_INTERVAL = Phaser.Timer.SECOND/3;
const RUNNING_TIME_INTERVAL = Phaser.Timer.SECOND/3;

const INITIAL_ACTION = "idle";
const INITIAL_DIRECTION = directions.down;

const FOOTSTEPS_KEY_NAME = "footprints";

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

        this.active_steps = [];
        this.dead_steps = [];
        this.foot_forward = "None";
        this.can_make_footprint = true;
        this.footsteps_type = 1;
        this.footsteps_time_interval = WALKING_TIME_INTERVAL;

        this.new_step_timer = this.game.time.create(false);
        this.expire_timer = this.game.time.create(false);

        this.footsteps_sprite_base = new SpriteBase(FOOTSTEPS_KEY_NAME, this.action_keys);

        for (let i = 0; i<this.action_keys.length; i++){
            this.footsteps_sprite_base.setActionSpritesheet(this.action_keys[i], "assets/images/misc/footprints.png", "assets/images/misc/footprints.json");
            this.footsteps_sprite_base.setActionDirections(this.action_keys[i], [reverse_directions[directions.up]], this.animation_db.actions.frames_count[i]);
            this.footsteps_sprite_base.setActionFrameRate(this.action_keys[i], this.animation_db.actions.frame_rate[i]);
        }

        this.footsteps_sprite_base.generateAllFrames();
        this.footsteps_sprite = null;
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

    kill_oldest_step(){
        let expired = this.active_steps.shift();
        expired.kill();
        this.dead_steps.push(expired);
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

        if(this.dead_steps.length == 0){
            this.footsteps_sprite = this.data.npc_group.create(0, 0, FOOTSTEPS_KEY_NAME);
        }
        else{
            this.footsteps_sprite = this.dead_steps.shift();
            this.footsteps_sprite.reset(0, 0);
        }

        this.footsteps_sprite.x = this.data.hero.shadow.x;
        this.footsteps_sprite.y = this.data.hero.shadow.y;
        this.footsteps_sprite.anchor.setTo(this.anchor_x, this.anchor_y);
        this.footsteps_sprite.send_to_front = false;
        this.footsteps_sprite.base_collider_layer = this.data.map.collision_layer;
        this.footsteps_sprite.RoundPx = true;

        this.footsteps_sprite_base.setAnimation(this.footsteps_sprite,this.action_keys[this.footsteps_type]);

        this.footsteps_sprite.animations.currentAnim.loop = false;
        this.footsteps_sprite.animations.currentAnim.onComplete.add(this.kill_oldest_step.bind(this),this);
        this.position_footsteps(this.footsteps_sprite);

        this.footsteps_sprite.animations.frameName = `${this.action_keys[this.footsteps_type]}/up/00`;
        this.footsteps_sprite.send_to_back = true;
        this.active_steps.push(this.footsteps_sprite);
        this.set_expire_timer(this.footsteps_sprite, this.footsteps_type);

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
        let steps = [].concat(this.active_steps,this.dead_steps);
        for(let i=0; i<steps.length; i++){
            this.data.npc_group.remove(steps[i],true);
        }
        this.new_step_timer.stop();
        this.expire_timer.stop();
        this.footsteps_sprite = null;
    }

    destroy(){
        this.clean_all();
        this.footsteps_sprite_base = null;
        this.animation_db = null;
        this.new_step_timer.destroy();
        this.expire_timer.destroy();
    }
}