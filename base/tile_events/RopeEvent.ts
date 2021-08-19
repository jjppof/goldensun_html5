import {GoldenSun} from "../GoldenSun";
import {RopeDock} from "../interactable_objects/RopeDock";
import {get_front_position} from "../utils";
import {event_types, TileEvent} from "./TileEvent";
import {degree180, degree270, degree90} from "../magic_numbers";

/**
 * An event that deals with walking or climbing (depending on the rope angle)
 * over a rope.
 */
export class RopeEvent extends TileEvent {
    /** Whether the char will be walking over the rope. */
    private _walk_over_rope: boolean;
    /** Collision layer that the char will be on dock exit. */
    private _dock_exit_collision_layer: number;
    /** Collision layer that the char will be when walking over the rope. */
    private _rope_collision_layer: number;
    /** The interactable object that originated this event. Overriding with appropriate inheritance. */
    protected _origin_interactable_object: RopeDock;
    /** The staring rope dock. */
    private _starting_rope_dock: RopeDock;

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
        rope_collision_layer: number
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

        if ((this.origin_interactable_object as RopeDock).is_starting_dock) {
            this._starting_rope_dock = this.origin_interactable_object;
        } else {
            this._starting_rope_dock = this.origin_interactable_object.dest_rope_dock;
        }

        if (!this._starting_rope_dock.tied) {
            return;
        }

        this.data.tile_event_manager.on_event = true;
        this.game.physics.p2.pause();

        if (this._starting_rope_dock) {
            if (this.data.hero.walking_over_rope) {
                await this.finish_walking();
            } else {
                await this.start_walking();
            }
        }

        this.game.physics.p2.resume();
        this.data.tile_event_manager.on_event = false;
    }

    async start_walking() {
        this.data.collision.change_map_body(this._rope_collision_layer);
        this._starting_rope_dock.set_sprites_z_sorting(true);
        this.data.map.sort_sprites();
        const jump_direction = this.is_active(this.data.hero.current_direction);
        await this.data.hero.jump({
            dest: {
                x: this.origin_interactable_object.sprite.centerX,
                y: this.origin_interactable_object.sprite.centerY - 5,
            },
            keep_shadow_hidden: true,
            jump_direction: jump_direction,
        });
        if (!this._walk_over_rope) {
            this.data.hero.climbing_rope = true;
            let rope_angle = this._starting_rope_dock.fragment_angle;
            rope_angle = rope_angle < degree180 ? rope_angle + degree180 : rope_angle;
            if (rope_angle < degree270) {
                this.data.hero.sprite.scale.x *= -1;
            }
            this.data.hero.sprite.rotation = rope_angle + degree90;
        }
        this.data.hero.sprite.bodyAttached = false;
        this.data.hero.walking_over_rope = true;
        this._starting_rope_dock.intialize_swing();
    }

    async finish_walking() {
        this.data.hero.sprite.bodyAttached = true;
        this.data.collision.change_map_body(this._dock_exit_collision_layer);
        this.data.hero.climbing_rope = false;
        this.data.hero.sprite.rotation = 0;
        this.data.hero.sprite.scale.x = Math.abs(this.data.hero.sprite.scale.x);
        const dest_pos = get_front_position(
            this.data.hero.tile_x_pos,
            this.data.hero.tile_y_pos,
            this.data.hero.current_direction
        );
        await this.data.hero.jump({
            dest: {
                tile_x: dest_pos.x,
                tile_y: dest_pos.y,
            },
        });
        this._starting_rope_dock.swing_tween.stop();
        this._starting_rope_dock.swing_tween = null;
        this._starting_rope_dock.reset_fragments_pos();
        this._starting_rope_dock.set_sprites_z_sorting(false);
        this.data.map.sort_sprites();
        this.data.hero.walking_over_rope = false;
    }

    destroy() {
        this._origin_interactable_object = null;
        this._starting_rope_dock = null;
    }
}
