import * as _ from "lodash";
import { Gamepad } from '../Gamepad';

const DEFAULT_LOOP_TIME = Phaser.Timer.QUARTER >> 1;

export type ControlObj = {
    key:number,
    callback:Function,
    pressed?:boolean,
    loop?:boolean,
    loop_time?:number,
    reset?:boolean
}

export type LoopConfigs = {
    key:number,
    loop_time:boolean
}

export class ControlManager{
    public game:Phaser.Game;
    public gamepad:Gamepad;
    public disabled:boolean;

    public keys_list:number[];
    public keys:{[key:number] : ControlObj};

    public signal_bindings:Phaser.SignalBinding[];
    public loop_start_timer:Phaser.Timer;
    public loop_repeat_timer:Phaser.Timer;

    constructor(game:Phaser.Game, gamepad:Gamepad){
        this.game = game;
        this.gamepad = gamepad;
        this.disabled = false;

        this.keys_list = this.gamepad.keys;

        let keys_to_map = [];
        for(let i=0; i<this.keys_list.length; i++){
            keys_to_map.push({key: this.keys_list[i], callback: null, pressed: false, loop: false, loop_time: DEFAULT_LOOP_TIME, reset:false});
        }

        this.keys = _.mapKeys(keys_to_map, k => k.key) as {[key:number] : ControlObj};

        this.signal_bindings = [];
        this.loop_start_timer = this.game.time.create(false);
        this.loop_repeat_timer = this.game.time.create(false);
    }

    get initialized(){
        return this.signal_bindings.length !== 0;
    }

    simple_input(callback:Function, params?:{reset_control?:boolean, confirm_only?:boolean}){
        if(this.initialized) this.reset();
        
        this.keys[this.gamepad.A].callback = callback;

        if(params){
            this.keys[this.gamepad.A].reset = params.reset_control ? params.reset_control : false;

            if(!params.confirm_only) {
                this.keys[this.gamepad.B].callback = callback;
                this.keys[this.gamepad.B].reset = params.reset_control ? params.reset_control : false; 
            }
        }

        this.enable_keys();
    }
    
    add_fleeting_control(key:number, callbacks:{on_down?:Function, on_up?:Function}, params?:{persist?:boolean}){
        let control:ControlObj = this.keys[key];
        let bindings:Phaser.SignalBinding[] = [];
        
        let persist = params ? (params.persist ? params.persist : false) : false;

        if(callbacks.on_down){
            let b1 = this.game.input.keyboard.addKey(control.key).onDown.add(() => {
                if(this.disabled) return;
                callbacks.on_down();
            });
            if(!persist) this.signal_bindings.push(b1);
            bindings.push(b1);
        }
        if(callbacks.on_up){
            let b2 = this.game.input.keyboard.addKey(control.key).onUp.add(() => {
                if(this.disabled) return;
                callbacks.on_up();
            });
            if(!persist) this.signal_bindings.push(b2);
            bindings.push(b2);
        }

        this.reset(false);
        return bindings;
    }

    set_control(controls:{key:number, callback:Function, params?:{reset_control?:boolean}}[],
        configs?:{
            loop_configs?:{vertical?:boolean, vertical_time?:number,
                horizontal?:boolean, horizontal_time?:number,
                shoulder?:boolean, shoulder_time?:number},
            persist?:boolean, no_reset?:boolean
        }){
        let disable_reset:boolean = configs ? (configs.no_reset ? configs.no_reset : false) : false;
        if(this.initialized && !disable_reset) this.reset();

        for(let i=0; i<controls.length; i++){
            if(controls[i].callback)
                this.keys[controls[i].key].callback = controls[i].callback;
                if(controls[i].params)
                    this.keys[controls[i].key].reset = controls[i].params.reset_control ? controls[i].params.reset_control : false; 
        }
        
        if(configs){
            this.set_configs(configs);
            this.enable_keys(configs.persist);
        }
        else this.enable_keys();
    }

    set_configs(configs:any){
        if(configs.loop_configs){
            let options = configs.loop_configs;
            let controls = [];

            if(options.vertical){
                controls.push({key:this.gamepad.UP, loop_time:options.vertical_time});
                controls.push({key:this.gamepad.DOWN, loop_time:options.vertical_time});
            }
            if(options.horizontal){
                controls.push({key:this.gamepad.LEFT, loop_time:options.horizontal_time});
                controls.push({key:this.gamepad.RIGHT, loop_time:options.horizontal_time});
            }
            if(options.shoulder){
                controls.push({key:this.gamepad.L, loop_time:options.shoulder_time});
                controls.push({key:this.gamepad.R, loop_time:options.shoulder_time});
            }

            this.enable_loop(controls);
        }
    }

    enable_loop(controls:{key:number, loop_time?:number}[]){
        controls.forEach(obj => {
            this.keys[obj.key].loop = true;
            if(obj.loop_time) this.keys[obj.key].loop_time = obj.loop_time;
        })
    }

    enable_keys(persist?:boolean){
        let bindings:Phaser.SignalBinding[] = [];

        for(let i=0; i<this.keys_list.length; i++){
            if(this.keys[this.keys_list[i]].callback){
                let key_callback = this.keys[this.keys_list[i]].callback;
                let loop_time = this.keys[this.keys_list[i]].loop_time;
                let trigger_reset = this.keys[this.keys_list[i]].reset;

                if(this.keys[this.keys_list[i]].loop){
                    let b1 = this.game.input.keyboard.addKey(this.keys[this.keys_list[i]].key).onDown.add(() => {
                        if (this.keys[this.gamepad.opposite_key(this.keys_list[i])].pressed) {
                            if(this.disabled) return;

                            this.keys[this.gamepad.opposite_key(this.keys_list[i])].pressed = false;
                            this.stop_timers();
                        }

                        this.keys[this.keys_list[i]].pressed = true;
                        this.set_loop_timers(key_callback, loop_time);
                    });

                    let b2 = this.game.input.keyboard.addKey(this.keys[this.keys_list[i]].key).onUp.add(() => {
                        if(this.disabled) return;

                        this.keys[this.keys_list[i]].pressed = false;
                        this.stop_timers();
                    });

                    if(!persist) this.signal_bindings.push(b1, b2);
                    bindings.push(b1, b2);
                }
                else{
                    let b = this.game.input.keyboard.addKey(this.keys[this.keys_list[i]].key).onDown.add(() => {
                        if(this.disabled) return;
                        
                        if(trigger_reset) this.reset();
                        key_callback();
                    });

                    if(!persist) this.signal_bindings.push(b);
                    bindings.push(b);
                }
            };
        }
        this.reset(false);
    }

    set_loop_timers(callback:Function, loop_time:number) {
        callback();

        this.loop_start_timer.add(Phaser.Timer.QUARTER, () => {
            this.loop_repeat_timer.loop(loop_time, callback);
            this.loop_repeat_timer.start();
        });
        this.loop_start_timer.start();
    }

    stop_timers() {
        this.loop_start_timer.stop();
        this.loop_repeat_timer.stop();
    }

    reset(detach:boolean=true){
        this.loop_start_timer.stop();
        this.loop_repeat_timer.stop();

        for(let i=0; i<this.keys_list.length; i++){
            this.keys[this.keys_list[i]].pressed = false;
            this.keys[this.keys_list[i]].callback = null;
            this.keys[this.keys_list[i]].loop = false;
            this.keys[this.keys_list[i]].loop_time = DEFAULT_LOOP_TIME;
        }

        if(detach){
            this.signal_bindings.forEach(signal_binding => {
                signal_binding.detach();
            });
            this.signal_bindings = [];
        }
    }

}