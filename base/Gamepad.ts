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

    constructor(){
        this.initialize_gamepad();
    }

    initialize_gamepad(){
        let base = {
            LEFT: Phaser.Keyboard.LEFT,
            RIGHT: Phaser.Keyboard.RIGHT,
            UP: Phaser.Keyboard.UP,
            DOWN: Phaser.Keyboard.DOWN,
            A: Phaser.Keyboard.Z, //previously ENTER
            B: Phaser.Keyboard.X, //previously ESC
            L: Phaser.Keyboard.A, //previously SHIFT
            R: Phaser.Keyboard.S, //previously SPACEBAR
            SELECT: Phaser.Keyboard.BACKSPACE,
            START: Phaser.Keyboard.ENTER
        };

        let extra = [
            {label: extra_input_labels.PSY1, key: Phaser.Keyboard.Q},
            {label: extra_input_labels.PSY2, key: Phaser.Keyboard.W},
            {label: extra_input_labels.PSY3, key: Phaser.Keyboard.E},
            {label: extra_input_labels.ZOOM1, key: Phaser.Keyboard.ONE},
            {label: extra_input_labels.ZOOM2, key: Phaser.Keyboard.TWO},
            {label: extra_input_labels.ZOOM3, key: Phaser.Keyboard.THREE},
            {label: extra_input_labels.DEBUG_PHYS, key: Phaser.Keyboard.D},
            {label: extra_input_labels.GRID, key: Phaser.Keyboard.G},
            {label: extra_input_labels.KEYS, key: Phaser.Keyboard.K},
            {label: extra_input_labels.STATS, key: Phaser.Keyboard.S},
            {label: extra_input_labels.FPS, key: Phaser.Keyboard.F},
            {label: extra_input_labels.SLIDERS, key: Phaser.Keyboard.L},
            {label: extra_input_labels.BATTLE_CAM_MINUS, key: Phaser.Keyboard.PAGE_DOWN},
            {label: extra_input_labels.BATTLE_CAM_PLUS, key: Phaser.Keyboard.PAGE_UP},
        ];

        this.LEFT = base.LEFT;
        this.RIGHT = base.RIGHT;
        this.UP = base.UP;
        this.DOWN = base.DOWN;

        this.A = base.A;
        this.B = base.B;
        this.L = base.L;
        this.R = base.R;

        this.SELECT = base.SELECT;
        this.START= base.START;

        this.extra_inputs = extra ? extra : [];
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

        if(this.LEFT) keys.push(this.LEFT);
        if(this.RIGHT) keys.push(this.RIGHT);
        if(this.UP) keys.push(this.UP);
        if(this.DOWN) keys.push(this.DOWN);

        if(this.A) keys.push(this.A);
        if(this.B) keys.push(this.B);
        if(this.L) keys.push(this.L);
        if(this.R) keys.push(this.R);

        if(this.SELECT) keys.push(this.SELECT);
        if(this.START) keys.push(this.START);

        return keys;
    }

    get extra_keys(){
        let keys:number[] = [];

        this.extra_inputs.forEach(obj => {keys.push(obj.key)});

        return keys;
    }


}