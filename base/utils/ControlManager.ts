import { directions, reverse_directions, action_inputs } from '../utils';
import * as _ from "lodash";
const DEFAULT_LOOP_TIME = Phaser.Timer.QUARTER >> 1;

const direction_keys = ["left", "right", "up", "down"];
const action_keys = ["spacebar", "esc", "enter", "shift", "tab"];

export type ControlStatus = {
    key:string;
    pressed?:boolean;
    callback:Function;
    loop?:boolean;
    phaser_key:number;
}

export class ControlManager{
    public game:Phaser.Game;
    public disabled:boolean;
    public initialized:boolean;
    public loop_time:number;

    public directions:{[key:string] : ControlStatus};
    public actions:{[key:string] : ControlStatus};

    public signal_bindings:Phaser.SignalBinding[];
    public loop_start_timer:Phaser.Timer;
    public loop_repeat_timer:Phaser.Timer;
    constructor(game){
        this.game = game;
        this.disabled = false;
        this.initialized = false;
        this.loop_time = DEFAULT_LOOP_TIME;

        let dirs = [{key: reverse_directions[directions.left], pressed: false, callback: null, loop: true, phaser_key: Phaser.Keyboard.LEFT},
        {key: reverse_directions[directions.right], pressed: false, callback: null, loop: true, phaser_key: Phaser.Keyboard.RIGHT},
        {key: reverse_directions[directions.up], pressed: false, callback: null, loop: true, phaser_key: Phaser.Keyboard.UP},
        {key: reverse_directions[directions.down], pressed: false, callback: null, loop: true, phaser_key: Phaser.Keyboard.DOWN}];

        let acts = [{key: action_inputs.SPACEBAR, callback: null, phaser_key: Phaser.Keyboard.SPACEBAR},
        {key: action_inputs.ESC, callback: null, phaser_key: Phaser.Keyboard.ESC},
        {key: action_inputs.ENTER, callback: null, phaser_key: Phaser.Keyboard.ENTER},
        {key: action_inputs.SHIFT, callback: null, phaser_key: Phaser.Keyboard.SHIFT},
        {key: action_inputs.TAB, callback: null, phaser_key: Phaser.Keyboard.TAB}];

        this.directions = _.mapKeys(dirs, dir => dir.key) as {[key:string] : ControlStatus};
        this.actions = _.mapKeys(acts, act => act.key) as {[key:string] : ControlStatus};

        this.signal_bindings = [];
        this.loop_start_timer = this.game.time.create(false);
        this.loop_repeat_timer = this.game.time.create(false);
    }

    get_opposite_dir(dir:string){
        switch(dir){
            case reverse_directions[directions.right]:
                return reverse_directions[directions.left];
            case reverse_directions[directions.left]:
                return reverse_directions[directions.right];
            case reverse_directions[directions.up]:
                return reverse_directions[directions.down];
            case reverse_directions[directions.down]:
                return reverse_directions[directions.up];
        }
    }

    simple_control(esc?:Function, enter?:Function){
        if(this.initialized) this.reset();

        if(enter) this.actions[action_inputs.ENTER].callback = enter;
        if(esc) this.actions[action_inputs.ESC].callback = esc;

        this.set_actions();
    }

    set_control(horizontal:boolean, vertical:boolean, horizontal_loop:boolean=true, vertical_loop:boolean=false,
        callbacks:{
            left?:Function, right?:Function, up?:Function, down?:Function,
            enter?:Function, esc?:Function, shift?:Function, spacebar?:Function,
            tab?:Function
        }, custom_loop_time?:number){
        if(this.initialized) this.reset();

        if(horizontal){
            if(!horizontal_loop){
                this.directions[reverse_directions[directions.left]].loop = false;
                this.directions[reverse_directions[directions.right]].loop = false;
            } 
            this.directions[reverse_directions[directions.left]].callback = callbacks.left;
            this.directions[reverse_directions[directions.right]].callback = callbacks.right;
        }
        if(vertical){
            if(!vertical_loop){
                this.directions[reverse_directions[directions.up]].loop = false;
                this.directions[reverse_directions[directions.down]].loop = false;
            }
            this.directions[reverse_directions[directions.up]].callback = callbacks.up;
            this.directions[reverse_directions[directions.down]].callback = callbacks.down; 
        }
        if(callbacks.enter) this.actions[action_inputs.ENTER].callback = callbacks.enter;
        if(callbacks.esc) this.actions[action_inputs.ESC].callback = callbacks.esc;
        if(callbacks.shift) this.actions[action_inputs.SHIFT].callback = callbacks.shift;
        if(callbacks.spacebar) this.actions[action_inputs.SPACEBAR].callback = callbacks.spacebar;
        if(callbacks.tab) this.actions[action_inputs.TAB].callback = callbacks.tab;

        if(custom_loop_time) this.loop_time = custom_loop_time;
        this.set_directions();
        this.set_actions();
    }

    set_directions(){
        let directions_length = Object.keys(this.directions).length;
        for(let i=0; i<directions_length; i++){
            if(this.directions[direction_keys[i]].callback){
                if(this.directions[direction_keys[i]].loop){
                    let b1 = this.game.input.keyboard.addKey(this.directions[direction_keys[i]].phaser_key).onDown.add(() => {
                        if (this.disabled) return;
                        if (this.directions[this.get_opposite_dir(direction_keys[i])].pressed) {
                            this.directions[this.get_opposite_dir(direction_keys[i])].pressed = false;
                            this.stop_timers();
                        }
                        this.directions[direction_keys[i]].pressed = true;
                        this.set_loop_timers(direction_keys[i]);
                    });
                    let b2 = this.game.input.keyboard.addKey(this.directions[direction_keys[i]].phaser_key).onUp.add(() => {
                        if (this.disabled) return;
                        this.directions[direction_keys[i]].pressed = false;
                        this.stop_timers();
                    });
                    this.signal_bindings.push(b1);
                    this.signal_bindings.push(b2);
                }
                else{
                    let b = this.game.input.keyboard.addKey(this.directions[direction_keys[i]].phaser_key).onDown.add(() => {
                        if (this.disabled) return;
                        this.directions[direction_keys[i]].callback();
                    });
                    this.signal_bindings.push(b);
                }
            };
        }
        if(!this.initialized) this.initialized = true;
    }

    set_actions(){
        let actions_length = Object.keys(this.actions).length;
        for(let i=0; i<actions_length; i++){
            if(this.actions[action_keys[i]].callback){
                let b = this.game.input.keyboard.addKey(this.actions[action_keys[i]].phaser_key).onDown.add(() => {
                    if (this.disabled) return;
                    this.actions[action_keys[i]].callback();
                });
                this.signal_bindings.push(b);
            }
        }
        if(!this.initialized) this.initialized = true;
    }

    set_loop_timers(direction?:string) {
        this.change_index(direction);
        this.loop_start_timer.add(Phaser.Timer.QUARTER, () => {
            this.loop_repeat_timer.loop(this.loop_time, this.change_index.bind(this, direction));
            this.loop_repeat_timer.start();
        });
        this.loop_start_timer.start();
    }

    change_index(direction:string) {
        this.directions[direction].callback();
    }

    stop_timers() {
        this.loop_start_timer.stop();
        this.loop_repeat_timer.stop();
    }

    disable(){
        this.disabled = true;
        this.stop_timers();
    }
    
    enable(){
        this.disabled = false;
    }

    reset(){
        let directions_length = Object.keys(this.directions).length;
        let actions_length = Object.keys(this.actions).length;

        for(let i=0; i<directions_length; i++){
            this.directions[direction_keys[i]].pressed = false;
            this.directions[direction_keys[i]].loop = true;
            this.directions[direction_keys[i]].callback = null;
        }

        for(let i=0; i<actions_length; i++){
            this.actions[action_keys[i]].callback = null;
        }

        this.signal_bindings.forEach(signal_binding => {
            signal_binding.detach();
        });
        this.signal_bindings = [];
        if(this.initialized) this.initialized = false;
        if(this.loop_time !== DEFAULT_LOOP_TIME) this.loop_time = DEFAULT_LOOP_TIME;
    }

    destroy() {
        this.loop_start_timer.destroy();
        this.loop_repeat_timer.destroy();

        this.signal_bindings.forEach(signal_binding => {
            signal_binding.detach();
        });
    }

}