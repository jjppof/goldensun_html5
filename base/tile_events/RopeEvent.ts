import { GoldenSun } from "../GoldenSun";
import { RopeDock } from "../interactable_objects/RopeDock";
import { degree360 } from "../magic_numbers";
import { get_front_position } from "../utils";
import { event_types, TileEvent } from "./TileEvent";

/**
 * An event that deals with walking or climbing (depending on the angle)
 * over a rope.
 */
export class RopeEvent extends TileEvent {
    private static readonly SWING_SIZE = 2;

    /** Whether the char will be walking over the rope. */
    private _walk_over_rope: boolean;
    /** Collision layer that the char will be on dock exit. */
    private _dock_exit_collision_layer: number;
    /** Collision layer that the char will be when walking over the rope. */
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
            this.data.hero.sprite.bodyAttached = true;
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
            this.data.hero.sprite.bodyAttached = false;
            this.data.hero.walking_over_rope = true;
            this.intialize_swing();
        }

        this.game.physics.p2.resume();
        this.data.tile_event_manager.on_event = false;
    }

    intialize_swing() {
        const half_height = RopeEvent.SWING_SIZE >> 1;
        const swing_object = {
            y: -half_height
        };
        const swing_tween = this.game.add.tween(swing_object).to({
            y: half_height
        }, 300, Phaser.Easing.Quadratic.InOut, true, 0, -1, true);
        const position_ratio_formula = (relative_pos : number) => {
            return 4 * relative_pos * (-relative_pos + 1);
        };
        swing_tween.onUpdateCallback(() => {
            this.data.hero.sprite.x = this.data.hero.sprite.body.x;

            const relative_pos = (this.data.hero.sprite.x - this.origin_interactable_object.x)/this.origin_interactable_object.rope_width;
            const position_ratio = position_ratio_formula(relative_pos);
            this.data.hero.sprite.y += swing_object.y * position_ratio

            const rope_fragments_group = this.origin_interactable_object.rope_fragments_group;
            for (let i = 0; i < rope_fragments_group.children.length; ++i) {
                const rope_frag = rope_fragments_group.children[i];
                const rope_frag_x = rope_fragments_group.x + rope_frag.x;
                const hero_frag_dist = Math.abs(rope_frag_x - this.data.hero.sprite.x) | 0;
                const distance_ratio = 1 - hero_frag_dist / this.origin_interactable_object.rope_width;

                const relative_frag_pos = (rope_frag_x - this.origin_interactable_object.x)/this.origin_interactable_object.rope_width;
                const position_penalty = position_ratio_formula(relative_frag_pos);

                rope_frag.y += swing_object.y * distance_ratio * position_ratio * position_penalty;
            }
        });
    }

    destroy() {
        this._origin_interactable_object = null;
    }
}