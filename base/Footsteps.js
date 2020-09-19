import {SpriteBase} from "../base/SpriteBase.js";
import {directions, reverse_directions} from "../utils.js";

const FOOTSTEPS_TTL = Phaser.Timer.SECOND*2;
const FOOTSTEPS_TIME_INTERVAL = Phaser.Timer.SECOND/5;

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
        this.footsteps_type = 1;

        this.new_step_timer = this.game.time.create(false);
        this.expire_timer = this.game.time.create(false);

        this.footsteps_single_base = new SpriteBase(FOOTSTEPS_KEY_NAME+"_"+FOOTSTEPS_ACTION_KEYS[0], [FOOTSTEPS_ACTION_KEYS[0]]);
        this.footsteps_single_base.setActionSpritesheet(FOOTSTEPS_ACTION_KEYS[0], "assets/images/misc/footprints_single.png", "assets/images/misc/footprints_single.json");
        this.footsteps_single_base.setActionDirections(FOOTSTEPS_ACTION_KEYS[0], [reverse_directions[directions.up]], 3);
        this.footsteps_single_base.setActionFrameRate(FOOTSTEPS_ACTION_KEYS[0], 3);
        this.footsteps_single_base.generateAllFrames();

        this.footsteps_double_base = new SpriteBase(FOOTSTEPS_KEY_NAME+"_"+FOOTSTEPS_ACTION_KEYS[1], [FOOTSTEPS_ACTION_KEYS[1]]);
        this.footsteps_double_base.setActionSpritesheet(FOOTSTEPS_ACTION_KEYS[1], "assets/images/misc/footprints_double.png", "assets/images/misc/footprints_double.json");
        this.footsteps_double_base.setActionDirections(FOOTSTEPS_ACTION_KEYS[1], [reverse_directions[directions.up]], 3);
        this.footsteps_double_base.setActionFrameRate(FOOTSTEPS_ACTION_KEYS[1], 3);
        this.footsteps_double_base.generateAllFrames();

        this.footsteps_single_sprite = null;
        this.footsteps_double_sprite = null;
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

    set_expire_timer(sprite, footsteps_type){
        console.log("SETTING TIMER");
        this.expire_timer.add(FOOTSTEPS_TTL,()=>{
            sprite.animations.play(FOOTSTEPS_ACTION_KEYS[footsteps_type]+"_up");
        },this);
        this.expire_timer.start();
    }

    destroy_oldest_step(){
        console.log("DESTROYING");
        let expired = this.active_steps.shift();
        this.data.npc_group.remove(expired,true);
    }

    position_footsteps(sprite){
        let angle = this.find_direction_angle(this.current_direction);
        this.foot_forward == "Right" ? sprite.scale.x = -1 : sprite.scale.x = 1; 
        sprite.body.angle = angle;
    }

    create_step(direction,action){
        console.log("CREATING STEP");
        this.current_direction = direction;
        this.current_action = action;
        this.update_foot();
        this.current_action == "idle" ? this.footsteps_type = 1 : this.footsteps_type = 0;

        let sprite = null;

        if(this.footsteps_type == 0){
            this.footsteps_single_sprite = this.data.npc_group.create(0,0,FOOTSTEPS_KEY_NAME+"_"+FOOTSTEPS_ACTION_KEYS[this.footsteps_type]);
            sprite = this.footsteps_single_sprite;
        }
        else{
            this.footsteps_double_sprite = this.data.npc_group.create(0,0,FOOTSTEPS_KEY_NAME+"_"+FOOTSTEPS_ACTION_KEYS[this.footsteps_type]);
            sprite = this.footsteps_double_sprite;
        }
        
        this.game.physics.p2.enable(sprite, false);
        sprite.body.static = true;
        sprite.body.x = this.data.hero.shadow.x;
        sprite.body.y = this.data.hero.shadow.y;

        sprite.anchor.setTo(this.anchor_x, this.anchor_y);
        sprite.send_to_front = false;
        sprite.base_collider_layer = this.data.map.collision_layer;
        sprite.RoundPx = true;

        if(this.footsteps_type == 0){
            this.footsteps_single_base.setAnimation(sprite,FOOTSTEPS_ACTION_KEYS[this.footsteps_type]);
        }
        else{
            this.footsteps_double_base.setAnimation(sprite,FOOTSTEPS_ACTION_KEYS[this.footsteps_type]);
        }

        sprite.animations.currentAnim.loop = false;
        sprite.animations.currentAnim.onComplete.add(this.destroy_oldest_step.bind(this),this);
        this.position_footsteps(sprite);

        console.log(sprite.animations.currentAnim);

        sprite.animations.frameName = `${FOOTSTEPS_ACTION_KEYS[this.footsteps_type]}/up/00`;
        this.data.npc_group.sendToBack(sprite);
        this.active_steps.push(sprite);
        this.set_expire_timer(sprite, this.footsteps_type);

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