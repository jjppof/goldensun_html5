import * as numbers from '../magic_numbers.js';
import { SpriteBase } from "../base/SpriteBase.js";
import { set_cast_direction, directions, reverse_directions, join_directions } from "../utils.js";

const FOOTSTEPS_TTL = Phaser.Timer.SECOND*2;
const FOOTSTEPS_FADE_TIME = Phaser.Timer.QUARTER/2;
const FOOTSTEPS_TIME_INTERVAL = 200;
const DEFAULT_FOOTSTEPS_ANCHOR_X = 0.50;
const DEFAULT_FOOTSTEPS_ANCHOR_Y = 0.50;
const INITIAL_ACTION = "idle";
const INITIAL_DIRECTION = directions.down;

const FOOTSTEPS_KEY_NAME = "footprints";
const FOOTSTEPS_ACTION_KEYS = ["single","double"]; 

export class Footsteps{
    constructor(game, data){
        this.game = game;
        this.data = data;
        this.x_pos = 0;
        this.y_pos = 0;
        this.current_action = INITIAL_ACTION;
        this.current_direction = INITIAL_DIRECTION;
        this.anchor_x = DEFAULT_FOOTSTEPS_ANCHOR_X;
        this.anchor_y = DEFAULT_FOOTSTEPS_ANCHOR_Y;

        this.active_steps = [];
        this.foot_forward = "None";
        this.can_make_footprint = true;
        this.new_step_timer = this.game.time.create(false);
        this.footsteps_type = 1;
        this.last_expiration_index = 0;
        this.expire_timer = this.game.time.create(false);

        this.footsteps_sprite_base = new SpriteBase(FOOTSTEPS_KEY_NAME, FOOTSTEPS_ACTION_KEYS);
        this.footsteps_sprite_base.setActionSpritesheet(FOOTSTEPS_ACTION_KEYS[0],"assets/images/misc/footprints.png","assets/images/misc/footprints.json");
        this.footsteps_sprite_base.setActionSpritesheet(FOOTSTEPS_ACTION_KEYS[1],"assets/images/misc/footprints.png","assets/images/misc/footprints.json");
        this.footsteps_sprite_base.setActionDirections(FOOTSTEPS_ACTION_KEYS[0],[reverse_directions[directions.up]],3);
        this.footsteps_sprite_base.setActionDirections(FOOTSTEPS_ACTION_KEYS[1],[reverse_directions[directions.up]],3);
        this.footsteps_sprite_base.setActionFrameRate(FOOTSTEPS_ACTION_KEYS[0], 3);
        this.footsteps_sprite_base.setActionFrameRate(FOOTSTEPS_ACTION_KEYS[1], 3);
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
        this.new_step_timer.add(FOOTSTEPS_TIME_INTERVAL,() => {this.can_make_footprint = true;})
        this.new_step_timer.start();
    }

    set_expire_timer(sprite){
        console.log("SETTING TIMER");
        this.expire_timer.add(FOOTSTEPS_TTL,()=>{
            sprite.animations.play(FOOTSTEPS_ACTION_KEYS[this.footsteps_type]+"_up");
        },this);
        this.expire_timer.start();
    }

    destroy_oldest_step(){
        console.log("DESTROYING");
        let expired = this.active_steps.shift();
        this.data.npc_group.remove(expired,true);
    }

    position_footsteps(sprite = this.footsteps_sprite){
        let angle = this.find_direction_angle(this.current_direction);
        this.foot_forward == "Right" ? sprite.scale.x = -1 : sprite.scale.x = 1; 
        sprite.body.angle = angle;
        this.foot_forward == "None" ? this.footsteps_type = 1 : this.footsteps_type = 0;
    }

    create_step(direction,action){
        console.log("CREATING STEP");
        this.current_direction = direction;
        this.current_action = action;
        this.update_foot();
        this.footsteps_sprite = this.data.npc_group.create(0,0,'footprints');
        
        this.game.physics.p2.enable(this.footsteps_sprite, false);
        this.footsteps_sprite.body.static = true;
        this.footsteps_sprite.body.x = this.data.hero.shadow.x;
        this.footsteps_sprite.body.y = this.data.hero.shadow.y;

        this.footsteps_sprite.anchor.setTo(this.anchor_x, this.anchor_y);
        this.footsteps_sprite.send_to_front = false;
        this.footsteps_sprite.base_collider_layer = this.data.map.collision_layer;
        this.footsteps_sprite.RoundPx = true;

        this.current_action == "idle" ?
        this.footsteps_sprite_base.setAnimation(this.footsteps_sprite,FOOTSTEPS_ACTION_KEYS[1]) :
        this.footsteps_sprite_base.setAnimation(this.footsteps_sprite,FOOTSTEPS_ACTION_KEYS[0]);

        this.footsteps_sprite.animations.currentAnim.loop = false;
        this.footsteps_sprite.animations.currentAnim.onComplete.add(this.destroy_oldest_step.bind(this),this);
        this.position_footsteps(this.footsteps_sprite);

        //console.log(this.footsteps_sprite.animations.currentAnim);

        this.footsteps_sprite.animations.frameName = `${FOOTSTEPS_ACTION_KEYS[this.footsteps_type]}/up/00`;
        this.data.npc_group.sendToBack(this.footsteps_sprite);
        this.active_steps.push(this.footsteps_sprite);
        this.set_expire_timer(this.footsteps_sprite);

        this.set_new_step_timer();
    }

    update_foot(){
        if(this.current_action == "idle"){
            this.foot_forward = "None";
        }
        else{
            this.foot_forward == "Left" ? this.foot_forward = "Right" : this.foot_forward = "Left";
        }
    }
}