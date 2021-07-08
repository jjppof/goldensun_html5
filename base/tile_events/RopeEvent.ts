import { GoldenSun } from "../GoldenSun";
import { InteractableObjects } from "../InteractableObjects";
import { event_types, TileEvent } from "./TileEvent";

/**
 * An event that deals with walking or climbing (depending on the angle)
 * over a rope.
 */
export class RopeEvent extends TileEvent {
    /** The destiny dock x tile position. */
    private _dest_x: number;
    /** The destiny dock y tile position. */
    private _dest_y: number;
    /** Whether this event is the rope starting dock. */
    private _starting_dock: boolean;
    /** Whether the hero will be walking over the rope. */
    private _walk_over_rope: boolean;
    /** Collision layer that the hero will be on dock exit. */
    private _dock_exit_collision_layer: number;
    /** Whether the rope is tied or not. This variable is only used if it's a starting dock. */
    private _tied: boolean;

    constructor(
        game: Phaser.Game,
        data: GoldenSun,
        x: number,
        y: number,
        activation_directions,
        activation_collision_layers,
        dynamic,
        active,
        active_storage_key,
        affected_by_reveal,
        origin_interactable_object: InteractableObjects,
        dest_x: number,
        dest_y: number,
        starting_dock: boolean,
        walk_over_rope: boolean,
        dock_exit_collision_layer: number,
        tied: boolean
    ) {
        super(
            game,
            data,
            event_types.ROPE,
            x,
            y,
            activation_directions,
            activation_collision_layers,
            dynamic,
            active,
            active_storage_key,
            origin_interactable_object,
            affected_by_reveal
        );
        this._dest_x = dest_x;
        this._dest_y = dest_y;
        this._starting_dock = starting_dock ?? false;
        this._walk_over_rope = walk_over_rope ?? true;
        this._dock_exit_collision_layer = dock_exit_collision_layer ?? 0;
        this._tied = tied ?? true;
    }

    async fire() {
        if (!this.data.hero.stop_by_colliding || !this.check_position() || !this.data.hero_movement_allowed()) {
            return;
        }

        console.log(123)
        //await this.data.hero.jump({});
    }

    destroy() {
        this._origin_interactable_object = null;
    }
}