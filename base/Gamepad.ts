import {GoldenSun} from "./GoldenSun";

export const input_ids = [
    "LEFT",
    "RIGHT",
    "UP",
    "DOWN",
    "A",
    "B",
    "L",
    "R",
    "SELECT",
    "START",
    "PSY1",
    "PSY2",
    "PSY3",
    "ZOOM1",
    "ZOOM2",
    "ZOOM3",
    "DEBUG_PHYSICS",
    "DEBUG_GRID",
    "DEBUG_KEYS",
    "DEBUG_STATS",
    "DEBUG_FPS",
    "DEBUG_SLIDERS",
    "DEBUG_CAM_PLUS",
    "DEBUG_CAM_MINUS",
];

export class Gamepad {
    public data: GoldenSun;

    public LEFT: number;
    public RIGHT: number;
    public UP: number;
    public DOWN: number;

    public A: number;
    public B: number;
    public L: number;
    public R: number;

    public SELECT: number;
    public START: number;

    public PSY1: number;
    public PSY2: number;
    public PSY3: number;

    public ZOOM1: number;
    public ZOOM2: number;
    public ZOOM3: number;

    public DEBUG_PHYSICS: number;
    public DEBUG_GRID: number;
    public DEBUG_KEYS: number;
    public DEBUG_STATS: number;
    public DEBUG_FPS: number;
    public DEBUG_SLIDERS: number;
    public DEBUG_CAM_MINUS: number;
    public DEBUG_CAM_PLUS: number;

    constructor(data: GoldenSun) {
        this.data = data;
        this.initialize_gamepad();
    }

    initialize_gamepad() {
        for (let index in input_ids) {
            this[input_ids[index]] =
                Phaser.Keyboard[this.data.dbs.init_db.default_inputs[input_ids[index].toLowerCase()]];
        }
    }

    get_id_by_key(key: number) {
        for (let property in this) {
            let property_name = property as string;
            if (this[property_name] === key) return property_name;
        }
        return null;
    }

    opposite_key(key: number) {
        switch (key) {
            case this.LEFT:
                return this.RIGHT;
            case this.RIGHT:
                return this.LEFT;
            case this.UP:
                return this.DOWN;
            case this.DOWN:
                return this.UP;

            case this.A:
                return this.B;
            case this.B:
                return this.A;
            case this.L:
                return this.R;
            case this.R:
                return this.L;

            case this.SELECT:
                return this.START;
            case this.START:
                return this.SELECT;

            default:
                return null;
        }
    }

    get keys() {
        let keys: number[] = [];

        for (let property in this) {
            let property_name = property as string;
            if (input_ids.includes(property_name)) keys.push(this[property_name]);
        }

        return keys;
    }
}
