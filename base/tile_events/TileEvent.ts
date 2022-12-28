import {GoldenSun} from "../GoldenSun";
import {InteractableObjects} from "../interactable_objects/InteractableObjects";
import {directions, get_directions, split_direction} from "../utils";
import * as _ from "lodash";

export enum event_types {
    CLIMB = "climb",
    SPEED = "speed",
    TELEPORT = "teleport",
    JUMP = "jump",
    STEP = "step",
    COLLISION = "collision",
    SLIDER = "slider",
    EVENT_TRIGGER = "event_trigger",
    ICE_SLIDE = "ice_slide",
    ROPE = "rope",
}

export abstract class IntegerPairKey {
    private static readonly X_MASK = 0b1111111111111100000000000000;
    private static readonly Y_MASK = 0b11111111111111;
    private static readonly POS_BITS_NUMBER = 14;

    static get_key(a: number, b: number) {
        return (a << IntegerPairKey.POS_BITS_NUMBER) | b;
    }

    static get_value(key: number) {
        return {
            a: (key & IntegerPairKey.X_MASK) >> IntegerPairKey.POS_BITS_NUMBER,
            b: key & IntegerPairKey.Y_MASK,
        };
    }
}

/**
 * This class is responsible for the class of events that are placed on the map.
 * Generally, this kind of event is fired when the hero reaches the position where
 * an event of this type is placed. Use these events to make the hero jump, slide, climb,
 * teleport, etc. Tile Events are set as map properties (and sometimes, Interactable
 * Objects can also create some Tile Events automatically).
 */
export abstract class TileEvent {
    protected game: Phaser.Game;
    protected data: GoldenSun;
    protected _type: event_types;
    protected _x: number;
    protected _y: number;
    protected _location_key: number;
    protected _id: number;
    protected _key_name: string;
    protected _activation_collision_layers: Set<number>;
    protected _initial_activation_directions: Set<directions>;
    protected _activation_directions: Set<directions>;
    protected _initial_disabled_directions: Set<directions>;
    protected _affected_by_reveal: Set<directions>;
    protected _origin_interactable_object: InteractableObjects;
    protected _allow_active_in_diagonal: boolean;

    /** The collision layer shift value from origin Inter. Obj. base collision layer that will be
     * summed up to it which will form the activation collision layer of this event. */
    public collision_layer_shift_from_source: number;
    /** Whether this event is in the map. */
    public in_map: boolean;

    protected static id_incrementer: number;
    protected static _events: {[id: number]: TileEvent};
    protected static labeled_events: {[key_name: number]: TileEvent};

    private active_storage_key: string;

    constructor(
        game,
        data,
        type,
        x,
        y,
        activation_directions,
        initial_disabled_directions,
        activation_collision_layers,
        active_storage_key,
        origin_interactable_object,
        affected_by_reveal,
        key_name,
        allow_active_in_diagonal = true
    ) {
        this.game = game;
        this.data = data;
        this._type = type;
        this._id = TileEvent.id_incrementer++;
        const snapshot_info = this.data.snapshot_manager.snapshot?.map_data.tile_events[this._id];
        this._x = snapshot_info?.position.x ?? x;
        this._y = snapshot_info?.position.y ?? y;
        this._location_key = IntegerPairKey.get_key(this.x, this.y);
        this.in_map = snapshot_info?.in_map ?? true;

        activation_collision_layers = snapshot_info?.activation_collision_layers ?? activation_collision_layers;
        activation_collision_layers = Array.isArray(activation_collision_layers)
            ? activation_collision_layers
            : [activation_collision_layers ?? 0];
        this._activation_collision_layers = new Set(activation_collision_layers);

        this.active_storage_key = active_storage_key;

        this._initial_disabled_directions = new Set(
            TileEvent.format_activation_directions(initial_disabled_directions, false)
        );
        this._initial_activation_directions = new Set(TileEvent.format_activation_directions(activation_directions));
        if (snapshot_info?.activation_directions) {
            activation_directions = new Set(snapshot_info?.activation_directions);
        } else if (this.active_storage_key && !this.data.storage.get(this.active_storage_key)) {
            activation_directions = new Set();
        } else {
            activation_directions = new Set(
                [...this._initial_activation_directions].filter(x => !this._initial_disabled_directions.has(x))
            );
        }
        this._activation_directions = activation_directions;

        affected_by_reveal = Array.isArray(affected_by_reveal)
            ? TileEvent.format_activation_directions(affected_by_reveal)
            : affected_by_reveal
            ? Array.from(this._initial_activation_directions)
            : [];
        this._affected_by_reveal = new Set(affected_by_reveal);

        this._origin_interactable_object = origin_interactable_object ?? null;
        this.collision_layer_shift_from_source = 0;
        TileEvent.events[this.id] = this;
        this._key_name = key_name;
        if (this._key_name) {
            TileEvent.labeled_events[this._key_name] = this;
        }
        this._allow_active_in_diagonal = allow_active_in_diagonal ?? true;
    }

    /** Returns the tile event type. */
    get type() {
        return this._type;
    }
    /** The x tile position. */
    get x() {
        return this._x;
    }
    /** The y tile position. */
    get y() {
        return this._y;
    }
    get location_key() {
        return this._location_key;
    }
    /** This event id number. */
    get id() {
        return this._id;
    }
    /** The set of directions that this event can be fired. */
    get activation_directions() {
        return this._activation_directions;
    }
    /** The set of collision layers that this event can be fired. */
    get activation_collision_layers() {
        return this._activation_collision_layers;
    }
    /** The interactable object that created this event (in the case of it has been created from it). */
    get origin_interactable_object() {
        return this._origin_interactable_object;
    }
    /** The set of directions that cause this event to have its activation toggled when reveal is casted. */
    get affected_by_reveal() {
        return this._affected_by_reveal;
    }
    /** This event unique label/key name. */
    get key_name() {
        return this._key_name;
    }
    /**
     * When activating this event in diagonal, and if this var is not true, the diagonal direction whether
     * the hero is trying to activate this event won't be splitted.
     */
    get allow_active_in_diagonal() {
        return this._allow_active_in_diagonal;
    }

    /**
     * Fires this tile event.
     */
    abstract fire(): void;

    /**
     * Destroys this tile event.
     */
    abstract destroy(): void;

    /**
     * Tests whether a given direction is available to active this event. If no directions given,
     * tests if at least one direction is active.
     * @param direction the direction to test if it's active.
     * @returns Returns whether it's active or not.
     */
    is_active_at_direction(direction?: directions) {
        if (direction === undefined) {
            return Boolean(this.activation_directions.size);
        } else {
            const possible_directions = this.allow_active_in_diagonal ? split_direction(direction) : [direction];
            for (let i = 0; i < possible_directions.length; ++i) {
                const dir = possible_directions[i];
                if (this.activation_directions.has(dir)) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Checks whether this event is active in any direction.
     * @returns returns true if active.
     */
    is_active() {
        return this.is_active_at_direction();
    }

    /**
     * Activates this event in a given direction.
     * @param direction the direction to activate this event. If "all" is passed, all directions will be activated.
     */
    activate_at(direction: directions | "all") {
        if (direction === "all") {
            this.activate();
        } else {
            this.activation_directions.add(direction);
        }
    }

    /**
     * Deactivates this event in a given direction.
     * @param direction the direction to deactivate this event.  If "all" is passed, all directions will be deactivated.
     */
    deactivate_at(direction: directions | "all") {
        if (direction === "all") {
            this.deactivate();
        } else {
            this.activation_directions.delete(direction);
        }
    }

    /**
     * Activates this event in all initial directions.
     */
    activate() {
        this._activation_directions = new Set(this._initial_activation_directions);
    }

    /**
     * Deactivates this event in all directions.
     */
    deactivate() {
        this.activation_directions.clear();
    }

    /**
     * Checks whether the hero is over this tile event.
     * @returns whether the hero position is correct or not.
     */
    check_position() {
        return this.data.hero.tile_x_pos === this.x && this.data.hero.tile_y_pos === this.y;
    }

    /**
     * Checks whether this event is disabled due to a storage value.
     * @returns whether its disabled by storage value.
     */
    check_if_disabled_by_storage() {
        if (this.active_storage_key && !this.data.storage.get(this.active_storage_key)) {
            return true;
        }
        return false;
    }

    /**
     * Gets an activation direction of this event.
     * @returns returns an direction.
     */
    get_activation_direction(): directions {
        return this._initial_activation_directions.values().next().value;
    }

    /**
     * Updates the position of this event.
     * @param x_tile the new x tile position.
     * @param y_tile the new y tile position
     * @param change_in_map folow the position change up to map events list.
     */
    set_position(x_tile?: number, y_tile?: number, change_in_map: boolean = false) {
        this._x = x_tile ?? this.x;
        this._y = y_tile ?? this.y;
        const previous_location_key: number = this._location_key;
        this._location_key = IntegerPairKey.get_key(this.x, this.y);
        if (change_in_map && this.location_key !== previous_location_key) {
            if (!(this.location_key in this.data.map.events)) {
                this.data.map.events[this.location_key] = [];
            }
            this.data.map.events[this.location_key].push(this);
        }
    }

    /**
     * Sets new collision layers that this event can active.
     * @param collision_layers_indexes the collision layers indexes.
     */
    set_activation_collision_layers(...collision_layers_indexes: number[]) {
        this.activation_collision_layers.clear();
        collision_layers_indexes.forEach(this.activation_collision_layers.add, this.activation_collision_layers);
    }

    /**
     * This method will be called on map update. If necessary, overrides it.
     */
    update() {}

    private static format_activation_directions(
        input: string | string[],
        undefined_is_all: boolean = true
    ): directions[] {
        if (input === undefined && !undefined_is_all) {
            return [];
        }
        if (input === undefined || input === "all") {
            return get_directions(true);
        }
        input = Array.isArray(input) ? input : [input];
        return input.map(key => directions[key]);
    }

    /** Gets all active/available events. */
    static get events() {
        return TileEvent._events;
    }

    /**
     * Gets an event by its id number.
     * @param id the event id.
     * @returns returns the TileEvent instance.
     */
    static get_event(id: number) {
        return TileEvent.events[id];
    }

    /**
     * Gets an event by its unique label/key name.
     * @param key_name the event unique label/key name.
     * @returns returns the TileEvent instance.
     */
    static get_labeled_event(key_name: string): TileEvent {
        return key_name in TileEvent.labeled_events ? TileEvent.labeled_events[key_name] : null;
    }

    /**
     * Destroys and resets all tile events that are instantiated currently.
     */
    static reset() {
        TileEvent.id_incrementer = 0;
        for (let id in TileEvent.events) {
            TileEvent.events[id].destroy();
        }
        TileEvent._events = {};
        TileEvent.labeled_events = {};
    }
}

TileEvent.reset();
