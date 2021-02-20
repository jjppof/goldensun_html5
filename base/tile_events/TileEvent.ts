import {GoldenSun} from "../GoldenSun";
import {InteractableObjects} from "../InteractableObjects";
import {directions, get_directions, map_directions, split_direction} from "../utils";
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
}

export class LocationKey {
    private static readonly X_MASK = 0b1111111111111100000000000000;
    private static readonly Y_MASK = 0b11111111111111;
    private static readonly POS_BITS_NUMBER = 14;

    private constructor() {}

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
    public game: Phaser.Game;
    public data: GoldenSun;
    public type: event_types;
    public x: number;
    public y: number;
    public location_key: number;
    public id: number;
    public activation_collision_layers: number[];
    public activation_directions: number[];
    public dynamic: boolean;
    public active: boolean[];
    public affected_by_reveal: boolean[];
    public origin_interactable_object: InteractableObjects;
    public collision_layer_shift_from_source: number;
    public static id_incrementer: number;
    public static events: {[id: number]: TileEvent};

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
        origin_interactable_object,
        affected_by_reveal
    ) {
        this.game = game;
        this.data = data;
        this.type = type;
        this.x = x;
        this.y = y;
        this.location_key = LocationKey.get_key(this.x, this.y);
        this.id = TileEvent.id_incrementer++;
        (activation_collision_layers = activation_collision_layers ? activation_collision_layers : [0]),
            (this.activation_collision_layers = Array.isArray(activation_collision_layers)
                ? activation_collision_layers
                : [activation_collision_layers]);
        activation_directions = map_directions(activation_directions);
        if (activation_directions === undefined || activation_directions === "all") {
            activation_directions = get_directions(true);
        }
        this.activation_directions = Array.isArray(activation_directions)
            ? activation_directions
            : [activation_directions];
        this.dynamic = dynamic;
        this.active = Array.isArray(active)
            ? active
            : new Array(this.activation_directions.length).fill(active ?? true);
        this.affected_by_reveal = Array.isArray(affected_by_reveal)
            ? affected_by_reveal
            : new Array(this.activation_directions.length).fill(affected_by_reveal ?? false);
        this.origin_interactable_object = origin_interactable_object ?? null;
        this.collision_layer_shift_from_source = 0;
        TileEvent.events[this.id] = this;
    }

    abstract fire(): void;

    is_active(direction: directions) {
        const possible_directions = split_direction(direction);
        for (let i = 0; i < possible_directions.length; ++i) {
            if (this.active[this.activation_directions.indexOf(possible_directions[i])]) {
                return true;
            }
        }
        return false;
    }

    activate_at(direction: directions) {
        this.active[this.activation_directions.indexOf(direction)] = true;
    }

    deactivate_at(direction: directions) {
        this.active[this.activation_directions.indexOf(direction)] = false;
    }

    activate() {
        this.active = this.active.map(() => true);
    }

    deactivate() {
        this.active = this.active.map(() => false);
    }

    check_position() {
        return this.data.hero.tile_x_pos === this.x && this.data.hero.tile_y_pos === this.y;
    }

    static get_event(id: number) {
        return TileEvent.events[id];
    }

    static reset() {
        TileEvent.id_incrementer = 0;
        TileEvent.events = {};
    }
}

TileEvent.reset();
