import {GoldenSun} from "../GoldenSun";

export enum game_info_types {
    CHAR = "char",
    HERO = "hero",
    NPC = "npc",
    EVENT = "event",
    INTERACTABLE_OBJECT = "interactable_object",
}

export enum event_value_types {
    VALUE = "value",
    STORAGE = "storage",
    GAME_INFO = "game_info",
}

export type EventValue = {
    type: event_value_types;
    value: any;
};

export enum event_types {
    BATTLE = "battle",
    BRANCH = "branch",
    SET_VALUE = "set_value",
    MOVE = "move",
}

export abstract class GameEvent {
    public game: Phaser.Game;
    public data: GoldenSun;
    public type: event_types;
    public id: number;
    public active: boolean;

    public static id_incrementer: number;
    public static events: {[id: number]: GameEvent};

    constructor(game, data, type, active) {
        this.game = game;
        this.data = data;
        this.type = type;
        this.active = active !== undefined ? active : true;
        this.id = GameEvent.id_incrementer++;
        GameEvent.events[this.id] = this;
    }

    abstract fire(): void;

    static get_event(id) {
        return GameEvent.events[id];
    }

    static reset() {
        GameEvent.id_incrementer = 0;
        GameEvent.events = {};
    }
}

GameEvent.reset();
