import { GoldenSun } from "../GoldenSun";
import { RopeDock } from "../interactable_objects/RopeDock";
import { event_types, TileEvent } from "./TileEvent";

/**
 * An event that deals with walking or climbing (depending on the angle)
 * over a rope.
 */
export class RopeEvent extends TileEvent {
    /** Whether the hero will be walking over the rope. */
    private _walk_over_rope: boolean;
    /** Collision layer that the hero will be on dock exit. */
    private _dock_exit_collision_layer: number;
    /** The interactable object that originated this event. Overriding with appropriate inheritance. */
    protected _origin_interactable_object: RopeDock;

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
        origin_interactable_object: RopeDock,
        walk_over_rope: boolean,
        dock_exit_collision_layer: number,
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
        this._walk_over_rope = walk_over_rope ?? true;
        this._dock_exit_collision_layer = dock_exit_collision_layer ?? 0;
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