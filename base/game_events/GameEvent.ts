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
    TILE_EVENT_MANAGE = "tile_event_manage",
}

/**
 * Everytime a game event is fired, it's checked whether reveal is casted, if yes, it stops the reveal psynergy effect.
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
 * This is the class reponsible for general events of the game.
 * Every game event class must inherit from this class. Whenever a game event is instantiated,
 * this event receives an unique id. These ids are reset whenever a map is destroyed. In order
 * to fire a GameEvent, calls GameEvent.fire. In order to destroy a game event, calls GameEvent.destroy.
 * Game events can be fired from TileEvents, NPC or Interactable Objects interaction, map changes or
 * other game events. For easy reference/example, check base/game_events/EmoriconEvent.ts.
 * Whenever an asynchronous game event is fired, increments the GameEventManager.events_running_count, so the
 * engine knows that there's an event going on. When the event is finished, decrements the same variable.
 * If your event has internal states, don't forget to reset them on finish.
 */
export abstract class GameEvent {
    public game: Phaser.Game;
    public data: GoldenSun;
    /** The GameEvent type. */
    public type: event_types;
    /** The GameEvent id number. */
    public id: number;
    /** Whether this GameEvent is active or not. */
    public active: boolean;
    /** An unique label that identifies this GameEvent. This is optional. */
    public key_name: string;
    /** If this GameEvent was originated by a NPC, this var holds this NPC reference. */
    public origin_npc: NPC = null;

    /** The GameEvents id incrementer. */
    public static id_incrementer: number;
    /** The events object where the keys are the ids. */
    public static events: {[id: number]: GameEvent};
    /** The events object where the keys are the events labels. */
    public static labeled_events: {[key_name: number]: GameEvent};

    constructor(game: Phaser.Game, data: GoldenSun, type: event_types, active: boolean, key_name: string) {
        this.game = game;
        this.data = data;
        this.type = type;
        this.active = active ?? true;
        this.id = GameEvent.id_incrementer++;
        GameEvent.events[this.id] = this;
        this.key_name = key_name;
        if (this.key_name) {
            GameEvent.labeled_events[this.key_name] = this;
        }
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
     * Gets an event that was labeled.
     * @param key_name The event key.
     * @returns Returns the labeled event, if the given key wasn't found, returns null.
     */
    static get_labeled_event(key_name: string): GameEvent {
        return key_name in GameEvent.labeled_events ? GameEvent.labeled_events[key_name] : null;
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
        GameEvent.labeled_events = {};
    }
}

GameEvent.reset();
