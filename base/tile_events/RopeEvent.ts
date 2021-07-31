import {GoldenSun} from "../GoldenSun";
import {RopeDock} from "../interactable_objects/RopeDock";
import {base_actions, get_front_position} from "../utils";
import {event_types, TileEvent} from "./TileEvent";
import * as _ from "lodash";
import { degree90 } from "../magic_numbers";

/**
 * An event that deals with walking or climbing (depending on the rope angle)
 * over a rope.
 */
export class RopeEvent extends TileEvent {
    private static readonly SWING_SIZE = 6;
    private static readonly SWING_TIME = 175;
    private static readonly HERO_WALKING_DELTA = 0.015;
    private static readonly HERO_CLIMB_Y_SHIFT = -2;

    /** Whether the char will be walking over the rope. */
    private _walk_over_rope: boolean;
    /** Collision layer that the char will be on dock exit. */
    private _dock_exit_collision_layer: number;
    /** Collision layer that the char will be when walking over the rope. */
    private _rope_collision_layer: number;
    /** Factor that will increase rope bounce on hero walk. */
    private _hero_walking_factor: number;
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

        this.data.tile_event_manager.on_event = true;
        this.game.physics.p2.pause();

        if ((this.origin_interactable_object as RopeDock).is_starting_dock) {
            this._starting_rope_dock = this.origin_interactable_object;
        } else {
            this._starting_rope_dock = this.origin_interactable_object.starting_rope_dock;
        }

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
        await this.data.hero.jump({
            dest: {
                x: this.origin_interactable_object.sprite.centerX,
                y: this.origin_interactable_object.sprite.centerY - 5,
            },
            keep_shadow_hidden: true,
        });
        if (!this._walk_over_rope) {
            this.data.hero.climbing_rope = true;
            this.data.hero.sprite.rotation = this._starting_rope_dock.fragment_angle + degree90;
        }
        this.data.hero.sprite.bodyAttached = false;
        this.data.hero.walking_over_rope = true;
        this.intialize_swing();
    }

    async finish_walking() {
        this.data.hero.sprite.bodyAttached = true;
        this.data.collision.change_map_body(this._dock_exit_collision_layer);
        this.data.hero.climbing_rope = false;
        this.data.hero.sprite.rotation = 0;
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

    intialize_swing() {
        const half_height = RopeEvent.SWING_SIZE >> 1;
        const swing_object = {
            y: -half_height,
        };
        this._starting_rope_dock.swing_tween = this.game.add.tween(swing_object).to(
            {
                y: half_height,
            },
            RopeEvent.SWING_TIME,
            Phaser.Easing.Quadratic.InOut,
            true,
            0,
            -1,
            true
        );
        const position_ratio_formula = (relative_pos: number) => {
            return 4 * relative_pos * (-relative_pos + 1);
        };
        this._hero_walking_factor = 0;
        const y_shift = this.data.hero.climbing_rope ? RopeEvent.HERO_CLIMB_Y_SHIFT : 0;
        this._starting_rope_dock.swing_tween.onUpdateCallback(() => {
            this.data.hero.sprite.x = this.data.hero.sprite.body.x;

            if (this.data.hero.in_movement()) {
                this._hero_walking_factor = _.clamp(this._hero_walking_factor + RopeEvent.HERO_WALKING_DELTA, 0, 1);
            } else {
                this._hero_walking_factor = _.clamp(this._hero_walking_factor - RopeEvent.HERO_WALKING_DELTA, 0, 1);
            }

            const relative_pos =
                (this.data.hero.sprite.x - this._starting_rope_dock.x) / this._starting_rope_dock.rope_width;
            const position_ratio = position_ratio_formula(relative_pos) * this._hero_walking_factor;

            this.data.hero.sprite.y = (this.data.hero.sprite.body.y + y_shift) + swing_object.y * position_ratio;

            const rope_fragments_group = this._starting_rope_dock.rope_fragments_group;
            for (let i = 0; i < rope_fragments_group.children.length; ++i) {
                const rope_frag = rope_fragments_group.children[i];
                const rope_frag_x = rope_fragments_group.x + rope_frag.x;
                const hero_frag_dist = Math.abs(rope_frag_x - this.data.hero.sprite.x) | 0;
                const distance_ratio = 1 - hero_frag_dist / this._starting_rope_dock.rope_width;

                const relative_frag_pos =
                    (rope_frag_x - this._starting_rope_dock.x) / this._starting_rope_dock.rope_width;
                const position_penalty = position_ratio_formula(relative_frag_pos);

                const variation = swing_object.y * distance_ratio * position_ratio * position_penalty;
                rope_frag.y = this._starting_rope_dock.rope_frag_base_pos[i].y + variation;
            }
        });
    }

    destroy() {
        this._origin_interactable_object = null;
        this._starting_rope_dock = null;
    }
}
