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

export abstract class LocationKey {
    private static readonly X_MASK = 0b1111111111111100000000000000;
    private static readonly Y_MASK = 0b11111111111111;
    private static readonly POS_BITS_NUMBER = 14;

    static get_key(x: number, y: number) {
        return (x << LocationKey.POS_BITS_NUMBER) | y;
    }

    static get_pos(key: number) {
        return {
            x: (key & LocationKey.X_MASK) >> LocationKey.POS_BITS_NUMBER,
            y: key & LocationKey.Y_MASK,
        };
    }
}

export abstract class TileEvent {
    protected game: Phaser.Game;
    protected data: GoldenSun;
    protected _type: event_types;
    protected _x: number;
    protected _y: number;
    protected _location_key: number;
    protected _id: number;
    protected _key_name: string;
    protected _activation_collision_layers: number[];
    protected _activation_directions: number[];
    protected _dynamic: boolean;
    protected _active: boolean[];
    protected _affected_by_reveal: boolean[];
    protected _origin_interactable_object: InteractableObjects;
    public collision_layer_shift_from_source: number;
    private active_storage_key: string;

    protected static id_incrementer: number;
    protected static events: {[id: number]: TileEvent};
    protected static labeled_events: {[key_name: number]: TileEvent};

    constructor(
        game,
        data,
        type,
        x,
        y,
        activation_directions,
        activation_collision_layers,
        dynamic,
        active,
        active_storage_key,
        origin_interactable_object,
        affected_by_reveal,
        key_name
    ) {
        this.game = game;
        this.data = data;
        this._type = type;
        this._x = x;
        this._y = y;
        this._location_key = LocationKey.get_key(this.x, this.y);
        this._id = TileEvent.id_incrementer++;
        this._activation_collision_layers = Array.isArray(activation_collision_layers)
            ? activation_collision_layers
            : [activation_collision_layers ?? 0];
        this._activation_directions = TileEvent.format_activation_directions(activation_directions);
        this._dynamic = dynamic;
        this._active = Array.isArray(active)
            ? active
            : new Array(this._activation_directions.length).fill(active ?? true);
        this.active_storage_key = active_storage_key;
        if (this.active_storage_key !== undefined && !this.data.storage.get(this.active_storage_key)) {
            this._active = new Array(this._activation_directions.length).fill(active ?? false);
        }
        this._affected_by_reveal = Array.isArray(affected_by_reveal)
            ? affected_by_reveal
            : new Array(this._activation_directions.length).fill(affected_by_reveal ?? false);
        this._origin_interactable_object = origin_interactable_object ?? null;
        this.collision_layer_shift_from_source = 0;
        TileEvent.events[this.id] = this;
        this._key_name = key_name;
        if (this._key_name) {
            TileEvent.labeled_events[this._key_name] = this;
        }
    }

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
    get id() {
        return this._id;
    }
    get activation_directions() {
        return this._activation_directions;
    }
    get activation_collision_layers() {
        return this._activation_collision_layers;
    }
    get dynamic() {
        return this._dynamic;
    }
    get active() {
        return this._active;
    }
    get origin_interactable_object() {
        return this._origin_interactable_object;
    }
    get affected_by_reveal() {
        return this._affected_by_reveal;
    }
    get key_name() {
        return this._key_name;
    }

    abstract fire(): void;

    abstract destroy(): void;

    /**
     * Tests whether a given direction is available to active this event.
     * @param direction the direction to test if it's active.
     * @returns The resulting dicretion that actives this event.
     */
    is_active(direction: directions) {
        const possible_directions = split_direction(direction);
        for (let i = 0; i < possible_directions.length; ++i) {
            if (this.active[this.activation_directions.indexOf(possible_directions[i])]) {
                return possible_directions[i];
            }
        }
        return -1;
    }

    activate_at(direction: directions | "all") {
        if (direction === "all") {
            this.activate();
        } else {
            const index = this.activation_directions.indexOf(direction as directions);
            if (index >= 0) {
                this.active[index] = true;
            }
        }
    }

    deactivate_at(direction: directions | "all") {
        if (direction === "all") {
            this.deactivate();
        } else {
            const index = this.activation_directions.indexOf(direction as directions);
            if (index >= 0) {
                this.active[index] = false;
            }
        }
    }

    activate() {
        this._active = this.active.fill(true);
    }

    deactivate() {
        this._active = this.active.fill(false);
    }

    check_position() {
        return this.data.hero.tile_x_pos === this.x && this.data.hero.tile_y_pos === this.y;
    }

    set_position(x_tile?: number, y_tile?: number, change_in_map: boolean = false) {
        this._x = x_tile ?? this.x;
        this._y = y_tile ?? this.y;
        const previous_location_key: number = this._location_key;
        this._location_key = LocationKey.get_key(this.x, this.y);
        if (change_in_map && this.location_key !== previous_location_key) {
            if (!(this.location_key in this.data.map.events)) {
                this.data.map.events[this.location_key] = [];
            }
            this.data.map.events[this.location_key].push(this);
        }
    }

    set_activation_collision_layers(...collision_layers_indexes: number[]) {
        this._activation_collision_layers = [...collision_layers_indexes];
    }

    private static format_activation_directions(input) {
        if (input === undefined || input === "all") {
            return get_directions(true);
        }
        input = Array.isArray(input) ? input : [input];
        return input.map(key => directions[key]);
    }

    static get_event(id: number) {
        return TileEvent.events[id];
    }

    static get_labeled_event(key_name: string): TileEvent {
        return key_name in TileEvent.labeled_events ? TileEvent.labeled_events[key_name] : null;
    }

    static reset() {
        TileEvent.id_incrementer = 0;
        for (let id in TileEvent.events) {
            TileEvent.events[id].destroy();
        }
        TileEvent.events = {};
        TileEvent.labeled_events = {};
    }
}

TileEvent.reset();
