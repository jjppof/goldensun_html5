import { directions, action_inputs, get_opposite_direction } from '../utils';
import * as _ from "lodash";

const DEFAULT_LOOP_TIME = Phaser.Timer.QUARTER >> 1;

const direction_keys = [directions.left, directions.right, directions.up, directions.down];
const action_keys = [action_inputs.SPACEBAR, action_inputs.ESC, action_inputs.ENTER,
    action_inputs.SHIFT, action_inputs.TAB];

export type ControlStatus = {
    key:string|number;
    pressed?:boolean;
    callback:Function;
    loop?:boolean;
    phaser_key:number;
}

export class ControlManager{
    public game:Phaser.Game;
    public disabled:boolean;
    public loop_time:number;

    public directions:{[key:number] : ControlStatus};
    public actions:{[key:string] : ControlStatus};

    public signal_bindings:Phaser.SignalBinding[];
    public loop_start_timer:Phaser.Timer;
    public loop_repeat_timer:Phaser.Timer;
    constructor(game){
        this.game = game;
        this.disabled = false;
        this.loop_time = DEFAULT_LOOP_TIME;

        let dirs = [{key: directions.left, pressed: false, callback: null, loop: false, phaser_key: Phaser.Keyboard.LEFT},
        {key: directions.right, pressed: false, callback: null, loop: false, phaser_key: Phaser.Keyboard.RIGHT},
        {key: directions.up, pressed: false, callback: null, loop: false, phaser_key: Phaser.Keyboard.UP},
        {key: directions.down, pressed: false, callback: null, loop: false, phaser_key: Phaser.Keyboard.DOWN}];

        let acts = [{key: action_inputs.SPACEBAR, callback: null, phaser_key: Phaser.Keyboard.SPACEBAR},
        {key: action_inputs.ESC, callback: null, phaser_key: Phaser.Keyboard.ESC},
        {key: action_inputs.ENTER, callback: null, phaser_key: Phaser.Keyboard.ENTER},
        {key: action_inputs.SHIFT, callback: null, phaser_key: Phaser.Keyboard.SHIFT},
        {key: action_inputs.TAB, callback: null, phaser_key: Phaser.Keyboard.TAB}];

        this.directions = _.mapKeys(dirs, dir => dir.key) as {[key:number] : ControlStatus};
        this.actions = _.mapKeys(acts, act => act.key) as {[key:string] : ControlStatus};

        this.signal_bindings = [];
        this.loop_start_timer = this.game.time.create(false);
        this.loop_repeat_timer = this.game.time.create(false);
    }

    get initialized(){
        return this.signal_bindings.length !== 0;
    }

    simple_input(callback:Function, enter_only:boolean=false){
        if(this.initialized) this.reset();
        
        this.actions[action_inputs.ENTER].callback = callback;
        if(!enter_only) this.actions[action_inputs.ESC].callback = callback;

        this.set_actions();
    }
    
    add_fleeting_control(key:number|string, callbacks:{on_down?:Function, on_up?:Function}, params?:{persist?:boolean}){
        let control:ControlStatus = null;
        let bindings = [];
        
        let persist = params ? (params.persist ? params.persist : false) : false;

        action_keys.forEach(k => {if(k === key) control = this.actions[k];});
        if(!control) direction_keys.forEach(k => {if(k === key) control = this.directions[k];});

        if(callbacks.on_down){
            let b1 = this.game.input.keyboard.addKey(control.phaser_key).onDown.add(() => {
                if (this.disabled) return;
                callbacks.on_down();
            });
            if(!persist) this.signal_bindings.push(b1);
            bindings.push(b1);
        }
        if(callbacks.on_up){
            let b2 = this.game.input.keyboard.addKey(control.phaser_key).onUp.add(() => {
                if (this.disabled) return;
                callbacks.on_up();
            });
            if(!persist) this.signal_bindings.push(b2);
            bindings.push(b2);
        }

        return bindings;
    }

    set_control(callbacks:{left?:Function, right?:Function, up?:Function, down?:Function,
        enter?:Function, esc?:Function, shift?:Function, spacebar?:Function, tab?:Function},
        params?:{custom_loop_time?:number, horizontal_loop?:boolean, vertical_loop?:boolean}){
        if(this.initialized) this.reset();

        if(callbacks.left) this.directions[directions.left].callback = callbacks.left;
        if(callbacks.right) this.directions[directions.right].callback = callbacks.right;
        if(callbacks.up) this.directions[directions.up].callback = callbacks.up;
        if(callbacks.down) this.directions[directions.down].callback = callbacks.down; 

        if(callbacks.enter) this.actions[action_inputs.ENTER].callback = callbacks.enter;
        if(callbacks.esc) this.actions[action_inputs.ESC].callback = callbacks.esc;
        if(callbacks.shift) this.actions[action_inputs.SHIFT].callback = callbacks.shift;
        if(callbacks.spacebar) this.actions[action_inputs.SPACEBAR].callback = callbacks.spacebar;
        if(callbacks.tab) this.actions[action_inputs.TAB].callback = callbacks.tab;

        if(params){
            if(params.custom_loop_time) this.loop_time = params.custom_loop_time;
            if(params.vertical_loop){
                this.directions[directions.up].loop = true;
                this.directions[directions.down].loop = true;
            }
            if(params.horizontal_loop){
                this.directions[directions.left].loop = true;
                this.directions[directions.right].loop = true;
            }
        }
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
                        if (this.directions[get_opposite_direction(direction_keys[i])].pressed) {
                            this.directions[get_opposite_direction(direction_keys[i])].pressed = false;
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
    }

    set_loop_timers(direction?:number) {
        this.change_index(direction);
        this.loop_start_timer.add(Phaser.Timer.QUARTER, () => {
            this.loop_repeat_timer.loop(this.loop_time, this.change_index.bind(this, direction));
            this.loop_repeat_timer.start();
        });
        this.loop_start_timer.start();
    }

    change_index(direction:number) {
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

        this.loop_start_timer.stop();
        this.loop_repeat_timer.stop();

        for(let i=0; i<directions_length; i++){
            this.directions[direction_keys[i]].pressed = false;
            this.directions[direction_keys[i]].loop = false;
            this.directions[direction_keys[i]].callback = null;
        }

        for(let i=0; i<actions_length; i++){
            this.actions[action_keys[i]].callback = null;
        }

        this.signal_bindings.forEach(signal_binding => {
            signal_binding.detach();
        });
        this.signal_bindings = [];

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