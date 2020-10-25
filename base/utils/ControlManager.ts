import * as _ from "lodash";
import { Gamepad } from '../Gamepad';

const DEFAULT_LOOP_TIME = Phaser.Timer.QUARTER >> 1;

export type ControlObj = {
    key:number,
    callback:Function,
    pressed?:boolean,
    loop?:boolean,
    loop_time?:number,
}

export type LoopConfigs = {
    key:number,
    loop_time:boolean
}

export class ControlManager{
    public game:Phaser.Game;
    public gamepad:Gamepad;

    public main_keys_list:number[];
    public extra_keys_list:number[];

    public main_keys:{[key:number] : ControlObj};
    public extra_keys:{[key:number] : ControlObj};

    public signal_bindings:Phaser.SignalBinding[];
    public loop_start_timer:Phaser.Timer;
    public loop_repeat_timer:Phaser.Timer;

    constructor(game:Phaser.Game, gamepad:Gamepad){
        this.game = game;
        this.gamepad = gamepad;

        this.main_keys_list = this.gamepad.main_keys;
        this.extra_keys_list = this.gamepad.extra_keys;

        let main_to_map = [];
        for(let i=0; i<this.main_keys_list.length; i++){
            main_to_map.push({key: this.main_keys_list[i], callback: null, pressed: false, loop: false, loop_time: DEFAULT_LOOP_TIME});
        }

        let extra_to_map = [];
        for(let i=0; i<this.extra_keys_list.length; i++){
            extra_to_map.push({key: this.extra_keys_list[i], callback: null});
        }

        this.main_keys = _.mapKeys(main_to_map, k => k.key) as {[key:number] : ControlObj};
        this.extra_keys = _.mapKeys(extra_to_map, k => k.key) as {[key:number] : ControlObj};

        this.signal_bindings = [];
        this.loop_start_timer = this.game.time.create(false);
        this.loop_repeat_timer = this.game.time.create(false);
    }

    get initialized(){
        return this.signal_bindings.length !== 0;
    }

    simple_input(callback:Function, confirm_only:boolean=false){
        if(this.initialized) this.reset();
        
        this.main_keys[this.gamepad.A].callback = callback;
        if(!confirm_only) this.main_keys[this.gamepad.B].callback = callback;

        this.enable_main_keys();
    }
    
    add_fleeting_control(key:number, callbacks:{on_down?:Function, on_up?:Function}, params?:{persist?:boolean}){
        let control:ControlObj = this.main_keys[key] ? this.main_keys[key] : this.extra_keys[key];
        let bindings:Phaser.SignalBinding[] = [];
        
        let persist = params ? (params.persist ? params.persist : false) : false;

        if(callbacks.on_down){
            let b1 = this.game.input.keyboard.addKey(control.key).onDown.add(() => {
                callbacks.on_down();
            });
            if(!persist) this.signal_bindings.push(b1);
            bindings.push(b1);
        }
        if(callbacks.on_up){
            let b2 = this.game.input.keyboard.addKey(control.key).onUp.add(() => {
                callbacks.on_up();
            });
            if(!persist) this.signal_bindings.push(b2);
            bindings.push(b2);
        }

        return bindings;
    }

    set_main_control(callbacks:{left?:Function, right?:Function, up?:Function, down?:Function,
        a?:Function, b?:Function, l?:Function, r?:Function, select?:Function, start?:Function},
        params?:{
            loop_configs?:{vertical?:boolean, vertical_time?:number,
                horizontal?:boolean, horizontal_time?:number,
                shoulder?:boolean, shoulder_time?:number},
            persist?:boolean
        }){
        if(this.initialized) this.reset();

        if(callbacks.left) this.main_keys[this.gamepad.LEFT].callback = callbacks.left;
        if(callbacks.right) this.main_keys[this.gamepad.RIGHT].callback = callbacks.right;
        if(callbacks.up) this.main_keys[this.gamepad.UP].callback = callbacks.up;
        if(callbacks.down) this.main_keys[this.gamepad.DOWN].callback = callbacks.down; 

        if(callbacks.a) this.main_keys[this.gamepad.A].callback = callbacks.a;
        if(callbacks.b) this.main_keys[this.gamepad.B].callback = callbacks.b;
        if(callbacks.l) this.main_keys[this.gamepad.L].callback = callbacks.l;
        if(callbacks.r) this.main_keys[this.gamepad.R].callback = callbacks.r;

        if(callbacks.select) this.main_keys[this.gamepad.SELECT].callback = callbacks.select;
        if(callbacks.start) this.main_keys[this.gamepad.START].callback = callbacks.start;
        
        if(params) this.set_params(params);
        this.enable_main_keys();
    }

    set_extra_control(control_objects:{label:string, callback:Function}[], params?:{persist?:boolean}){
        control_objects.forEach(obj => {
            let key = this.gamepad.get_key_by_label(obj.label);
            this.extra_keys[key].callback = obj.callback;
        });

        this.enable_extra_keys();
    }

    set_params(params:any){
        if(params.loop_configs){
            let configs = params.loop_configs;
            let controls = [];

            if(configs.vertical){
                controls.push({key:this.gamepad.UP, loop_time:configs.vertical_time});
                controls.push({key:this.gamepad.DOWN, loop_time:configs.vertical_time});
            }
            if(configs.horizontal){
                controls.push({key:this.gamepad.LEFT, loop_time:configs.horizontal_time});
                controls.push({key:this.gamepad.RIGHT, loop_time:configs.horizontal_time});
            }
            if(configs.shoulder){
                controls.push({key:this.gamepad.L, loop_time:configs.shoulder_time});
                controls.push({key:this.gamepad.R, loop_time:configs.shoulder_time});
            }

            this.enable_loop(controls);
        }
    }

    enable_loop(controls:{key:number, loop_time?:number}[]){
        controls.forEach(obj => {
            this.main_keys[obj.key].loop = true;
            if(obj.loop_time) this.main_keys[obj.key].loop_time = obj.loop_time;
        })
    }

    enable_main_keys(){
        for(let i=0; i<this.main_keys_list.length; i++){
            if(this.main_keys[this.main_keys_list[i]].callback){
                if(this.main_keys[this.main_keys_list[i]].loop){
                    let b1 = this.game.input.keyboard.addKey(this.main_keys[this.main_keys_list[i]].key).onDown.add(() => {
                        if (this.main_keys[this.gamepad.opposite_key(this.main_keys_list[i])].pressed) {
                            this.main_keys[this.gamepad.opposite_key(this.main_keys_list[i])].pressed = false;
                            this.stop_timers();
                        }
                        this.main_keys[this.main_keys_list[i]].pressed = true;
                        this.set_loop_timers(this.main_keys_list[i]);
                    });
                    let b2 = this.game.input.keyboard.addKey(this.main_keys[this.main_keys_list[i]].key).onUp.add(() => {
                        this.main_keys[this.main_keys_list[i]].pressed = false;
                        this.stop_timers();
                    });
                    this.signal_bindings.push(b1);
                    this.signal_bindings.push(b2);
                }
                else{
                    let b = this.game.input.keyboard.addKey(this.main_keys[this.main_keys_list[i]].key).onDown.add(() => {
                        this.main_keys[this.main_keys_list[i]].callback();
                    });
                    this.signal_bindings.push(b);
                }
            };
        }
    }

    enable_extra_keys(){
        for(let i=0; i<this.extra_keys_list.length; i++){
            if(this.extra_keys[this.extra_keys_list[i]].callback){
                let b = this.game.input.keyboard.addKey(this.extra_keys[this.extra_keys_list[i]].key).onDown.add(() => {
                    this.extra_keys[this.extra_keys_list[i]].callback();
                });
                this.signal_bindings.push(b);
            }
        }
    }

    set_loop_timers(key?:number) {
        this.change_index(key);

        this.loop_start_timer.add(Phaser.Timer.QUARTER, () => {
            this.loop_repeat_timer.loop(this.main_keys[key].loop_time, this.change_index.bind(this, key));
            this.loop_repeat_timer.start();
        });
        this.loop_start_timer.start();
    }

    change_index(key:number) {
        this.main_keys[key].callback();
    }

    stop_timers() {
        this.loop_start_timer.stop();
        this.loop_repeat_timer.stop();
    }

    reset(){
        this.loop_start_timer.stop();
        this.loop_repeat_timer.stop();

        for(let i=0; i<this.main_keys_list.length; i++){
            this.main_keys[this.main_keys_list[i]].pressed = false;
            this.main_keys[this.main_keys_list[i]].callback = null;
            this.main_keys[this.main_keys_list[i]].loop = false;
            this.main_keys[this.main_keys_list[i]].loop_time = DEFAULT_LOOP_TIME;
        }

        for(let i=0; i<this.extra_keys_list.length; i++){
            this.extra_keys[this.extra_keys_list[i]].callback = null;
        }

        this.signal_bindings.forEach(signal_binding => {
            signal_binding.detach();
        });
        this.signal_bindings = [];
    }

}