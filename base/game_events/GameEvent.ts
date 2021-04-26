import {RevealFieldPsynergy} from "../field_abilities/RevealFieldPsynergy";
import {GoldenSun} from "../GoldenSun";
import {NPC} from "../NPC";

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
    DIALOG = "dialog",
    LOOK = "look",
    CHEST = "chest",
    PSYNERGY_STONE = "psynergy_stone",
    TIMER = "timer",
    PARTY_JOIN = "party_join",
    SUMMON = "summon",
    DJINN_GET = "djinn_get",
    JUMP = "jump",
    FACE_DIRECTION = "face_direction",
    EMOTICON = "emoticon",
}

/**
 * Everytime a game event is fired, it's checked whether reveal is casted, if yes, it stops the reveal psynergy.
 * @param target not used.
 * @param property_key not used.
 * @param descriptor the function descriptor.
 * @returns returns a new descriptor.
 */
function check_reveal(target: Object, property_key: string, descriptor: PropertyDescriptor) {
    const original_method = descriptor.value;
    descriptor.value = function (...args) {
        const data: GoldenSun = this.data;
        if (data.hero.on_reveal) {
            (this.data.info.field_abilities_list.reveal as RevealFieldPsynergy).finish(false, false);
        }
        return original_method.apply(this, args);
    };
    return descriptor;
}

/**
 * Every game event class must inherit from this class. Whenever a game event is instantiated,
 * this event receives an unique id. These ids are reset whenever a map is destroyed. In order
 * to fire a GameEvent, calls GameEvent.fire. In order to destroy a game event, calls GameEvent.destroy.
 * Game events can be fired from TileEvents, NPC or Interactable Objects interaction, map changes or
 * other game events.
 * Whenever an asynchronous game event is fired, increments the GamEventManager.events_running_count, so the
 * engine knows that there's an event going on. When the event is finished, decrements the same variable.
 * If your event has internal states, does not forget to reset them on finish.
 */
export abstract class GameEvent {
    public game: Phaser.Game;
    public data: GoldenSun;
    public type: event_types;
    public id: number;
    public active: boolean;
    public origin_npc: NPC = null;

    public static id_incrementer: number;
    public static events: {[id: number]: GameEvent};

    constructor(game, data, type, active) {
        this.game = game;
        this.data = data;
        this.type = type;
        this.active = active ?? true;
        this.id = GameEvent.id_incrementer++;
        GameEvent.events[this.id] = this;
    }

    /**
     * Promised way to create and wait a Phaser.Timer. Waits for the amount of time given.
     * @param time the time in ms.
     */
    async wait(time: number) {
        let this_resolve;
        const promise = new Promise(resolve => (this_resolve = resolve));
        this.game.time.events.add(time, this_resolve);
        await promise;
    }

    /**
     * This function is the one that should be called to start a event.
     * It should never be overriden.
     * Always before this function is called, it's checked whether Reveal psynergy
     * is being casted, if yes, it's stopped before this event start.
     * @param origin_npc the NPC that originated this game event.
     */
    @check_reveal
    fire(origin_npc?: NPC) {
        this._fire(origin_npc);
    }

    /**
     * This abstract function is the one that GameEvent child classes should override.
     * It should never be called.
     * @param origin_npc the NPC that originated this game event.
     */
    protected abstract _fire(origin_npc?: NPC): void;

    /**
     * A child event should implement it in order to destroy the event instance.
     * This is called whenever an associated entity is destroyed, like maps, NPCs etc.
     */
    abstract destroy(): void;

    /**
     * Get a specific event by its id.
     * @param id The event id.
     * @returns Returns the event.
     */
    static get_event(id) {
        return GameEvent.events[id];
    }

    /**
     * Destroys all game events and resets the id counter.
     */
    static reset() {
        GameEvent.id_incrementer = 0;
        for (let id in GameEvent.events) {
            GameEvent.events[id].destroy();
        }
        GameEvent.events = {};
    }
}

GameEvent.reset();
