import {GoldenSun} from "../GoldenSun";

export enum game_info_types {
    CHAR = "char",
    HERO = "hero",
    NPC = "npc",
    EVENT = "event",
    INTERACTABLE_OBJECT = "interactable_object",
}

export enum event_types {
    BATTLE = "battle",
    BRANCH = "branch",
}

export abstract class GameEvent {
    public game: Phaser.Game;
    public data: GoldenSun;
    public type: event_types;
    public id: number;
    public static id_incrementer: number;
    public static events: {[id: number]: GameEvent};

    constructor(game, data, type) {
        this.game = game;
        this.data = data;
        this.type = type;
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
