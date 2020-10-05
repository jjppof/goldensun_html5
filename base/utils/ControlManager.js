const BACKWARD = -1;
const FORWARD = 1;

const INDEX_CHANGE_TIME = Phaser.Timer.QUARTER >> 1;

const direction_keys = ["left", "right", "up", "down"];
const action_keys = ["spacebar", "esc", "enter", "shift"];

export class ControlManager{
    constructor(game){
        this.game = game;
        this.disabled = false;
        this.initialized = false;

        this.directions = [{key: "left", pressed: false, callback: null, loop: true, phaser_key: Phaser.Keyboard.LEFT},
        {key: "right", pressed: false, callback: null, loop: true, phaser_key: Phaser.Keyboard.RIGHT},
        {key: "up", pressed: false, callback: null, loop: true, phaser_key: Phaser.Keyboard.UP},
        {key: "down", pressed: false, callback: null, loop: true, phaser_key: Phaser.Keyboard.DOWN}];

        this.actions = [{key: "spacebar", callback: null, phaser_key: Phaser.Keyboard.SPACEBAR},
        {key: "esc", callback: null, phaser_key: Phaser.Keyboard.ESC},
        {key: "enter", callback: null, phaser_key: Phaser.Keyboard.ENTER},
        {key: "shift", callback: null, phaser_key: Phaser.Keyboard.SHIFT}];

        this.directions = _.mapKeys(this.directions, dir => dir.key);
        this.actions = _.mapKeys(this.actions, act => act.key);

        this.signal_bindings = [];
        this.loop_start_timer = this.game.time.create(false);
        this.loop_repeat_timer = this.game.time.create(false);
    }

    get_opposite_dir(dir){
        switch(dir){
            case "right":
                return "left";
            case "left":
                return "right";
            case "up":
                return "down";
            case "down":
                return "up";
        }
    }

    set_control(horizontal, vertical, horizontal_loop=true, vertical_loop=false, callbacks){
        if(this.initialized) this.reset();

        if(horizontal){
            if(!horizontal_loop){
                this.directions["left"].loop = false;
                this.directions["right"].loop = false;
            } 
            this.directions["left"].callback = callbacks.left;
            this.directions["right"].callback = callbacks.right;
        }
        if(vertical){
            if(!vertical_loop){
                this.directions["up"].loop = false;
                this.directions["down"].loop = false;
            }
            this.directions["up"].callback = callbacks.up;
            this.directions["down"].callback = callbacks.down; 
        }
        if(callbacks.enter) this.actions["enter"].callback = callbacks.enter;
        if(callbacks.esc) this.actions["esc"].callback = callbacks.esc;
        if(callbacks.shift) this.actions["shift"].callback = callbacks.shift;
        if(callbacks.spacebar) this.actions["spacebar"].callback = callbacks.spacebar;

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

    set_loop_timers(direction) {
        this.change_index(direction);
        this.loop_start_timer.add(Phaser.Timer.QUARTER, () => {
            this.loop_repeat_timer.loop(INDEX_CHANGE_TIME, this.change_index.bind(this, direction));
            this.loop_repeat_timer.start();
        });
        this.loop_start_timer.start();
    }

    change_index(direction) {
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
    }

    destroy() {
        this.loop_start_timer.destroy();
        this.loop_repeat_timer.destroy();

        this.signal_bindings.forEach(signal_binding => {
            signal_binding.detach();
        });
    }

}