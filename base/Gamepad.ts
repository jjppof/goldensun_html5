import { GoldenSun } from "./GoldenSun";

export const main_input_labels = {
    LEFT: "left",
    RIGHT: "right",
    UP: "up",
    DOWN: "down",
    A: "a",
    B: "b",
    L: "l",
    R: "r",
    SELECT: "select",
    START: "start"
}

export const extra_input_labels = {
    PSY1: "psy1",
    PSY2: "psy2",
    PSY3: "psy3",
    ZOOM1: "zoom1",
    ZOOM2: "zoom2",
    ZOOM3: "zoom3",
    DEBUG_PHYS: "debug_phys",
    GRID: "grid",
    KEYS: "keys",
    STATS: "stats",
    FPS: "fps",
    SLIDERS: "sliders",
    BATTLE_CAM_PLUS: "battle_cam_plus",
    BATTLE_CAM_MINUS: "battle_cam_minus"
}

export class Gamepad{
    public data:GoldenSun;
    
    public LEFT:number;
    public RIGHT:number;
    public UP:number;
    public DOWN:number;

    public A:number;
    public B:number;
    public L:number;
    public R:number;

    public SELECT:number;
    public START:number;

    public extra_inputs:{label:string, key:number}[];

    constructor(data:GoldenSun){
        this.data = data;
        this.initialize_gamepad();
    }

    initialize_gamepad(){
        for (let label in main_input_labels){
            this[label] = Phaser.Keyboard[this.data.dbs.init_db.default_inputs[main_input_labels[label]]];
        }

        let extra = [];
        for (let label in extra_input_labels){
            extra.push({label: extra_input_labels[label], key: Phaser.Keyboard[this.data.dbs.init_db.default_inputs[extra_input_labels[label]]]});
        }

        this.extra_inputs = extra;
    }

    opposite_key(key:number){
        switch(key){
            case this.LEFT: return this.RIGHT;
            case this.RIGHT: return this.LEFT;
            case this.UP: return this.DOWN;
            case this.DOWN: return this.UP;

            case this.A: return this.B;
            case this.B: return this.A;
            case this.L: return this.R;
            case this.R: return this.L;
            
            case this.SELECT: return this.START;
            case this.START: return this.SELECT;

            default: return null;
        }
    }

    get_key_by_label(label:string){
        for(let i=0; i<this.extra_inputs.length; i++){
            if(this.extra_inputs[i].label === label)
                return this.extra_inputs[i].key; 
        }
        return null;
    }

    get_label_by_key(key:number){
        for(let i=0; i<this.extra_inputs.length; i++){
            if(this.extra_inputs[i].key === key)
                return this.extra_inputs[i].label; 
        }
        return null;
    }

    get main_keys(){
        let keys:number[] = [];

        for(let label in this){
            let str_label = label as string;
            if(main_input_labels[str_label])
                keys.push(this[str_label]);
        }

        return keys;
    }

    get extra_keys(){
        let keys:number[] = [];

        this.extra_inputs.forEach(obj => {keys.push(obj.key)});

        return keys;
    }

}