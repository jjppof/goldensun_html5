import { GoldenSun } from "../GoldenSun";
import { RopeDock } from "../interactable_objects/RopeDock";
import { get_front_position } from "../utils";
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
    /** Collision layer that the hero will be when walking over the rope. */
    private _rope_collision_layer: number;
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
        rope_collision_layer: number,
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
        this._rope_collision_layer = rope_collision_layer;
    }

    get origin_interactable_object() {
        return this._origin_interactable_object;
    }

    async fire() {
        if (!this.data.hero.stop_by_colliding || !this.check_position() || !this.data.hero_movement_allowed()) {
            return;
        }

        this.data.tile_event_manager.on_event = true;
        this.game.physics.p2.pause();

        if (this.data.hero.walking_over_rope) {
            this.data.collision.change_map_body(this._dock_exit_collision_layer);
            const dest_pos = get_front_position(this.data.hero.tile_x_pos, this.data.hero.tile_y_pos, this.data.hero.current_direction);
            await this.data.hero.jump({
                dest: {
                    tile_x: dest_pos.x,
                    tile_y: dest_pos.y
                }
            });
            this.origin_interactable_object.set_sprites_z_sorting(false);
            this.data.map.sort_sprites();
            this.data.hero.walking_over_rope = false;
        } else {
            this.data.collision.change_map_body(this._rope_collision_layer);
            this.origin_interactable_object.set_sprites_z_sorting(true);
            this.data.map.sort_sprites();
            await this.data.hero.jump({
                dest: {
                    x: this.origin_interactable_object.sprite.centerX,
                    y: this.origin_interactable_object.sprite.centerY - 5,
                },
                keep_shadow_hidden: true
            });
            this.data.hero.walking_over_rope = true;
        }

        this.game.physics.p2.resume();
        this.data.tile_event_manager.on_event = false;
    }

    destroy() {
        this._origin_interactable_object = null;
    }
}