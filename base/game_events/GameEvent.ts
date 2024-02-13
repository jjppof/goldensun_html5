import {StoragePosition} from "Storage";
import {RevealFieldPsynergy} from "../field_abilities/RevealFieldPsynergy";
import {GoldenSun} from "../GoldenSun";
import {NPC} from "../NPC";

type BasicValues = string | number | boolean;

/** Event value detailed info. */
export type DetailedValues = {
    /** Storage or MainChar key name. */
    key_name: string;
    /** The target object type to has its value retrieved. */
    type: game_info_types;
    /** The property name of the target that you want to retrieve the value of. */
    property: string;
    /** NPC, IO or TileEvent unique label. */
    label: string;
    /** NPC, IO or TileEvent index. */
    index: number;
    /** The value to be set or used. */
    value: BasicValues | StoragePosition;
};

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
    value: BasicValues | DetailedValues;
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
    DJINN_SET_STATUS = "djinn_set_status",
    JUMP = "jump",
    FACE_DIRECTION = "face_direction",
    EMOTICON = "emoticon",
    TILE_EVENT_MANAGE = "tile_event_manage",
    DESTROYER = "destroyer",
    CHAR_LEVEL_CHANGE = "char_level_change",
    MAP_OPACITY = "map_opacity",
    MAP_BLEND_MODE = "map_blend_mode",
    IO_ANIM_PLAY = "io_animation_play",
    CHAR_ANIMATION_PLAY = "char_animation_play",
    SET_CHAR_ACTIVATION = "set_char_activation",
    AUDIO_PLAY = "audio_play",
    CONTROL_BGM = "control_bgm",
    SET_PARTY_COINS = "set_party_coins",
    CHAR_EXP = "char_exp",
    CHAR_ITEM_MANIPULATION = "char_item_manipulation",
    CAMERA_SHAKE = "camera_shake",
    CAMERA_MOVE = "camera_move",
    CAMERA_FADE = "camera_fade",
    COLORIZE_MAP = "colorize_map",
    COLORIZE_CHAR = "colorize_char",
    TINT_CHAR = "tint_char",
    OUTLINE_CHAR = "outline_char",
    CASTING_AURA = "casting_aura",
    CUSTOM_COLLISION_BODY = "custom_collision_body",
    SET_CHAR_COLLISION = "set_char_collision",
    SET_IO_COLLISION = "set_io_collision",
    GRANT_ABILITY = "grant_ability",
    STORAGE_CHANGE = "storage_change",
    CAMERA_FOLLOW = "camera_follow",
    PERMANENT_STATUS = "permanent_status",
    CHANGE_COLLISION_LAYER = "change_collision_layer",
    CREATE_STORAGE_VAR = "create_storage_var",
    ITEM_CHECKS = "item_checks",
    ADD_ITEM_TO_PARTY = "add_item_to_party",
    GENERIC_SPRITE = "generic_sprite",
    PARTICLES = "particles",
    CHAR_HUE = "char_hue",
    FLAME_CHAR = "flame_char",
    CHAR_BLEND_MODE = "char_blend_mode",
    EVENT_CALLER = "event_caller",
    EVENT_ACTIVATION = "event_activation",
    SET_CHAR_VISIBILITY = "set_char_visibility",
    EVENTS_HOLDER = "events_holder",
    EVENTS_LOOP = "events_loop",
    LAYER_TWEEN = "layer_tween",
    LAYER_VISIBILITY = "layer_visibility",
    MAIN_CHARS_JOIN_SPLIT = "main_chars_join_split",
    SET_IO_VISIBILITY = "set_io_visibility",
    SET_IO_ACTIVATION = "set_io_activation",
    TELEPORT = "teleport",
    SET_NPC_COLLISION = "set_npc_collision",
    CHAR_ROTATION = "char_rotation",
    CHAR_TWEEN_POSITION = "char_tween_position",
    CHAR_SHADOW_VISIBILITY = "char_shadow_visibility",
    IO_TWEEN_POSITION = "io_tween_position",
    EXIT_SAND_MODE = "exit_sand_mode",
    CHAR_FALL = "char_fall",
    SET_CHAR_HP_PP = "set_char_hp_pp",
    AUDIO_STOP = "audio_stop",
}

export enum game_event_misc_origin {
    INTERACTABLE_OBJECT_PUSH = "interactable_object_push",
    INTERACTABLE_OBJECT_BEFORE_PSYNERGY = "interactable_object_before_psynergy",
    INTERACTABLE_OBJECT_AFTER_PSYNERGY = "interactable_object_after_psynergy",
    INTERACTABLE_OBJECT_TOGGLE = "interactable_object_toggle",
    TILE_EVENT = "tile_event",
    NPC = "npc",
    NPC_PSYNERGY = "npc_psynergy",
    MAP = "map",
    MISC = "misc",
}

export const game_event_origin = {...event_types, ...game_event_misc_origin};
export type GameEventOrigin = event_types | game_event_misc_origin;

/**
 * This is the class reponsible for general events of the game.
 * Every game event class must inherit from this class. Whenever a game event is instantiated,
 * this event receives an unique id. These ids are reset whenever a map is destroyed. In order
 * to fire a GameEvent, calls GameEvent.fire. In order to destroy a game event, calls GameEvent.destroy.
 * Game events can be fired from TileEvents, NPC or Interactable Objects interaction, map changes or
 * other game events. For easy reference/example, check base/game_events/EmoticonEvent.ts.
 * Whenever an asynchronous game event is fired, increments the GameEventManager.events_running_count, so the
 * engine knows that there's an event going on. When the event is finished, decrements the same variable.
 * If your event has internal states, don't forget to reset them on finish.
 * When creating a new GameEvent class, add its instantiation in GameEventManager.get_event_instance factory
 * method.
 */
export abstract class GameEvent {
    public game: Phaser.Game;
    public data: GoldenSun;
    private _type: event_types;
    private _id: number;
    private _active: boolean;
    private _key_name: string;
    private _keep_reveal: boolean;
    private _origin_npc: NPC;

    /** The GameEvents id incrementer. */
    public static id_incrementer: number;
    /** The events object where the keys are the ids. */
    public static events: {[id: number]: GameEvent};
    /** The events object where the keys are the events labels. */
    public static labeled_events: {[key_name: number]: GameEvent};

    constructor(
        game: Phaser.Game,
        data: GoldenSun,
        type: event_types,
        active: boolean,
        key_name: string,
        keep_reveal: boolean
    ) {
        this.game = game;
        this.data = data;
        this._type = type;
        this._active = active ?? true;
        this._id = GameEvent.id_incrementer++;
        GameEvent.events[this.id] = this;
        this._key_name = key_name;
        if (this.key_name) {
            GameEvent.labeled_events[this.key_name] = this;
        }
        this._keep_reveal = keep_reveal ?? false;
        this._origin_npc = null;
    }

    /** The GameEvent type. */
    get type() {
        return this._type;
    }
    /** The GameEvent id number. */
    get id() {
        return this._id;
    }
    /** Whether this GameEvent is active or not. */
    get active() {
        return this._active;
    }
    /** An unique label that identifies this GameEvent. This is optional. */
    get key_name() {
        return this._key_name;
    }
    /** If true, Reveal Psynergy won't be stopped on this event fire. */
    get keep_reveal() {
        return this._keep_reveal;
    }
    /** If this GameEvent was originated by a NPC, this var holds this NPC reference. */
    get origin_npc() {
        return this._origin_npc;
    }

    /** Check if "Reveal" is currently active. If yes, then cancel it. */
    check_reveal() {
        if (this.data.hero?.on_reveal && !this.keep_reveal) {
            (this.data.info.field_abilities_list.reveal as RevealFieldPsynergy).finish(false, false);
        }
    }

    /**
     * This function is the one that should be called to start a event.
     * It should never be overriden.
     * Always before this function is called, it's checked whether Reveal psynergy
     * is being casted, if yes, it's stopped before this event start.
     * @param origin_npc the NPC that originated this game event.
     * @returns if the child class has an async fire function, returns its Promise.
     */
    fire(origin_npc?: NPC) {
        if (!this.active) {
            return;
        }
        this.check_reveal();
        this._origin_npc = origin_npc;
        this._fire();
    }

    /**
     * This abstract function is the one that GameEvent child classes should override.
     * It should never be called.
     */
    protected abstract _fire(): void;

    /**
     * This function is the one that should be called to destroy an event.
     * It should never be overriden. Call this function to destroy this event.
     * This can be called whenever an associated entity is destroyed, like maps, NPCs etc.
     */
    destroy() {
        this._destroy();
        this._active = false;
        this._origin_npc = null;
    }

    /**
     * This abstract function is the one that GameEvent child classes should override.
     * It should never be called.
     */
    protected abstract _destroy(): void;

    /**
     * Actives or deactives this event.
     * @param activate whether to active or not.
     */
    set_event_activation(activate: boolean) {
        this._active = activate;
    }

    /**
     * A helper function that defines the ControllableChar based on inputs.
     * The controllable char can be a hero or a npc.
     * @param data The GoldenSun instance.
     * @param options Some options to help defining the char.
     * @returns the defined char.
     */
    static get_char(
        data: GoldenSun,
        options: {
            /** Whether it's a npc or not. */
            is_npc?: boolean;
            /** The npc index number. */
            npc_index?: number;
            /** The npc unique label identifier. */
            npc_label?: string;
        }
    ) {
        if (options.is_npc === undefined && options.npc_index === undefined && options.npc_label === undefined) {
            return null;
        } else if (options.is_npc) {
            if (options.npc_index === undefined && options.npc_label === undefined) {
                return null;
            }
            if (options.npc_label) {
                if (options.npc_label in data.map.npcs_label_map) {
                    return data.map.npcs_label_map[options.npc_label];
                } else {
                    data.logger.log_message(`There's no NPC with '${options.npc_label}' label.`);
                    return null;
                }
            } else {
                if (options.npc_index in data.map.npcs) {
                    return data.map.npcs[options.npc_index];
                } else {
                    data.logger.log_message(`There's no NPC with '${options.npc_index}' index.`);
                    return null;
                }
            }
        } else {
            return data.hero;
        }
    }

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
