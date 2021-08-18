import { degree90 } from "../magic_numbers";
import {Map} from "../Map";
import {get_centered_pos_in_px, get_distance, range_360} from "../utils";
import {InteractableObjects} from "./InteractableObjects";

/**
 * The rope dock interactable object. The rope fragments and rope events are
 * created from this object.
 */
export class RopeDock extends InteractableObjects {
    private static readonly ROPE_DOCK_KEY = "rope_dock";
    private static readonly ROPE_DOCK_EMPTY = "dock_empty";
    private static readonly ROPE_DOCK_TIED = "dock_tied";
    private static readonly ROPE_FRAGMENT = "rope_fragment";
    private static readonly ROPE_FRAGMENT_WIDTH = 8;
    private static readonly ROPE_Y_SHIFT = 1;
    private static readonly SPIRAL_VELOCITY = 60;
    private static readonly SPIRAL_ANG_VELOCITY = 88;
    private static readonly SPIRAL_X_SHIFT = -2;
    private static readonly SPIRAL_Y_SHIFT = 4;
    private static readonly MAX_FRAG_SPIRAL = 20;

    /** The destiny dock x tile position. */
    private _dest_x: number;
    /** The destiny dock y tile position. */
    private _dest_y: number;
    /** Whether this event is the rope starting dock. */
    private _is_starting_dock: boolean;
    /** Whether the rope is tied or not. This variable is only used if it's a starting dock. */
    private _tied: boolean;
    /** Groups that holds the rope fragments. */
    private _rope_fragments_group: Phaser.Group;
    /** The rope width. Only x axis. */
    private _rope_width: number;
    /** The staring rope dock. null if it's the starting rope dock. */
    private _dest_rope_dock: RopeDock;
    /** Rope fragments base positions. */
    private _rope_frag_base_pos: {
        x: number;
        y: number;
    }[];
    /** The tween that controls the rope bounce. */
    public swing_tween: Phaser.Tween;
    /** The angle in which the rope fragments are. */
    private _fragment_angle: number;
    /** Not practical group. Holds a copy of the first OVERLAP_LIMIT frags to show over the dock. */
    private _frag_overlap_group: Phaser.Group;

    constructor(
        game,
        data,
        key_name,
        x,
        y,
        storage_keys,
        allowed_tiles,
        base_collision_layer,
        not_allowed_tiles,
        object_drop_tiles,
        anchor_x,
        anchor_y,
        scale_x,
        scale_y,
        block_climb_collision_layer_shift,
        events_info
    ) {
        super(
            game,
            data,
            key_name,
            x,
            y,
            storage_keys,
            allowed_tiles,
            base_collision_layer,
            not_allowed_tiles,
            object_drop_tiles,
            anchor_x,
            anchor_y,
            scale_x,
            scale_y,
            block_climb_collision_layer_shift,
            events_info
        );
        this._is_rope_dock = true;
        this._dest_rope_dock = null;
        this.swing_tween = null;
        this._rope_frag_base_pos = [];
    }

    /** Groups that holds the rope fragments. */
    get rope_fragments_group() {
        return this._is_starting_dock ? this._rope_fragments_group : this._dest_rope_dock.rope_fragments_group;
    }

    /** The rope width. Only x axis. */
    get rope_width() {
        return this._rope_width;
    }

    /** The staring rope dock. null if it's the starting rope dock. */
    get dest_rope_dock() {
        return this._dest_rope_dock;
    }

    /** Whether this event is the rope starting dock. */
    get is_starting_dock() {
        return this._is_starting_dock;
    }

    /** Rope fragments base positions. */
    get rope_frag_base_pos() {
        return this._rope_frag_base_pos;
    }

    /** The angle in which the rope fragments are. */
    get fragment_angle() {
        return this._fragment_angle;
    }

    /** Whether the rope is tied or not. This variable is only used if it's a starting dock. */
    get tied() {
        return this._tied;
    }

    /** The destiny dock x tile position. */
    get dest_x() {
        return this._dest_x;
    }

    /** The destiny dock y tile position. */
    get dest_y() {
        return this._dest_y;
    }

    /**
     * Initializes this rope dock properties.
     * @param dest_x The destiny dock x tile position.
     * @param dest_y The destiny dock y tile position.
     * @param starting_dock Whether this event is the rope starting dock.
     * @param tied Whether the rope is tied or not. This variable is only used if it's a starting dock.
     */
    intialize_dock_info(dest_x: number, dest_y: number, starting_dock: boolean, tied: boolean) {
        this._dest_x = dest_x;
        this._dest_y = dest_y;
        this._is_starting_dock = starting_dock ?? false;
        this._tied = tied ?? true;
    }

    /**
     * Initializes the dock and, if it's the starting dock, the rope fragments.
     * @param map the map is currently being mounted.
     */
    initialize_rope(map: Map) {
        if (this._tied) {
            this.play(RopeDock.ROPE_DOCK_KEY, RopeDock.ROPE_DOCK_TIED);
        } else {
            this.play(RopeDock.ROPE_DOCK_KEY, RopeDock.ROPE_DOCK_EMPTY);
        }

        if (this._is_starting_dock) {
            this.set_rope_fragments(map);
        }

        if (!this.dest_rope_dock) {
            this.find_dest_dock(map);
        }

        this.sprite.sort_function_end = () => {
            const back = this._tied ? this.sprite : this.rope_fragments_group;
            const front = this._tied ? this.rope_fragments_group : this.sprite;
            if (
                this.data.npc_group.getChildIndex(back) >
                this.data.npc_group.getChildIndex(front)
            ) {
                this.data.npc_group.setChildIndex(
                    front,
                    this.data.npc_group.getChildIndex(back)
                );
            }
        };
    }

    /**
     * Ties to rope into this dock.
     */
    tie() {
        this._tied = true;
        this.play(RopeDock.ROPE_DOCK_KEY, RopeDock.ROPE_DOCK_TIED);
        if (!this.dest_rope_dock.tied) {
            this.dest_rope_dock.tie();
        }
    }

    /**
     * Destroys overlapping rope frags when tying the rope.
     */
    destroy_overlapping_fragments() {
        this._frag_overlap_group.destroy();
        this._extra_sprites = this._extra_sprites.filter(obj => obj !== this._frag_overlap_group);
    }

    /**
     * Initializes the rope fragments by setting their position.
     * @param map the current map.
     */
    set_rope_fragments(map: Map) {
        const this_x_px = get_centered_pos_in_px(this.tile_x_pos, map.tile_width);
        const this_y_px = get_centered_pos_in_px(this.tile_y_pos, map.tile_height) + RopeDock.ROPE_Y_SHIFT;
        const dest_x_px = get_centered_pos_in_px(this._dest_x, map.tile_width);
        const dest_y_px = get_centered_pos_in_px(this._dest_y, map.tile_height) + RopeDock.ROPE_Y_SHIFT;
        const distance = get_distance(dest_x_px, this_x_px, dest_y_px, this_y_px);
        this._rope_width = Math.abs(dest_x_px - this_x_px) | 0;
        const actual_rope_width = RopeDock.ROPE_FRAGMENT_WIDTH - 2;
        const fragments_number = (distance / actual_rope_width) | 0;
        this._fragment_angle = range_360(Math.atan2(dest_y_px - this_y_px, dest_x_px - this_x_px));

        const base_x = Math.cos(this._fragment_angle) * actual_rope_width;
        const half_base_x = base_x >> 1;
        const base_y = Math.sin(this._fragment_angle) * actual_rope_width;
        const half_base_y = base_y >> 1;

        this._rope_fragments_group = this.game.add.group(this.data.npc_group);
        this._extra_sprites.push(this._rope_fragments_group);
        this._rope_fragments_group.x = this_x_px + half_base_x;
        this._rope_fragments_group.y = this_y_px + half_base_y;
        this._rope_fragments_group.base_collision_layer = this.base_collision_layer;
        if (dest_y_px > this_y_px) {
            this._rope_fragments_group.useHeightWhenSorting = true;
        }

        if (!this._tied) {
            this._frag_overlap_group = this.game.add.group(this.data.npc_group);
            this._frag_overlap_group.x = this._rope_fragments_group.x;
            this._frag_overlap_group.y = this._rope_fragments_group.y;
            this._frag_overlap_group.base_collision_layer = this._rope_fragments_group.base_collision_layer;
            this._frag_overlap_group.useHeightWhenSorting = this._rope_fragments_group.useHeightWhenSorting;
            this._frag_overlap_group.send_to_front = true;
            this._extra_sprites.push(this._frag_overlap_group);
        }

        for (let i = 0; i < fragments_number; ++i) {
            const sprite_key = this.sprite_info.getSpriteKey(RopeDock.ROPE_DOCK_KEY);
            const frame_name = this.sprite_info.getFrameName(RopeDock.ROPE_DOCK_KEY, RopeDock.ROPE_FRAGMENT);
            const sprite: Phaser.Sprite = this._rope_fragments_group.create(0, 0, sprite_key, frame_name);

            sprite.anchor.setTo(0.5, 0.5);
            const default_x = base_x * i;
            const default_y = base_y * i;
            this._rope_frag_base_pos.push({
                x: default_x,
                y: default_y,
            });

            if (this._tied) {
                sprite.x = default_x;
                sprite.y = default_y;
                sprite.rotation = this._fragment_angle;
            } else {
                const t = Math.log(i)/RopeDock.MAX_FRAG_SPIRAL;
                sprite.x = RopeDock.SPIRAL_VELOCITY * t * Math.cos(RopeDock.SPIRAL_ANG_VELOCITY * t);
                sprite.y = RopeDock.SPIRAL_VELOCITY * t * Math.sin(RopeDock.SPIRAL_ANG_VELOCITY * t);
                sprite.rotation = Math.atan2(sprite.y - RopeDock.SPIRAL_Y_SHIFT, sprite.x) + degree90;
                sprite.x += RopeDock.SPIRAL_X_SHIFT;

                if (sprite.y >= 3) {
                    const sprite_over: Phaser.Sprite = this._frag_overlap_group.create(0, 0, sprite_key, frame_name);
                    sprite_over.anchor.setTo(0.5, 0.5);
                    sprite_over.x = sprite.x;
                    sprite_over.y = sprite.y;
                    sprite_over.rotation = sprite.rotation;
                }
            }
        }
    }

    /**
     * If it's not a starting dock, finds the starting one.
     * @param map the current map.
     */
    find_dest_dock(map: Map) {
        for (let i = 0; i < map.interactable_objects.length; ++i) {
            const io = map.interactable_objects[i];
            if (io.is_rope_dock && io.tile_x_pos === this._dest_x && io.tile_y_pos === this._dest_y) {
                this._dest_rope_dock = io as RopeDock;
                break;
            }
        }
    }

    /**
     * Resets fragments position.
     */
    reset_fragments_pos() {
        for (let i = 0; i < this.rope_fragments_group.children.length; ++i) {
            const rope_frag = this.rope_fragments_group.children[i];
            rope_frag.x = this.rope_frag_base_pos[i].x;
            rope_frag.y = this.rope_frag_base_pos[i].y;
        }
    }

    /**
     * Sets the rope fragments z sorting order by sending them to back or not.
     * @param send_to_back if true, the rope fragments are sent to back.
     */
    set_sprites_z_sorting(send_to_back: boolean) {
        this.sprite.send_to_back = send_to_back;
        if (this._rope_fragments_group) {
            this._rope_fragments_group.send_to_back = send_to_back;
        }
    }

    /**
     * Unsets some objects of this rope dock.
     */
    custom_unset() {
        this._dest_rope_dock = null;
        if (this.swing_tween) {
            this.swing_tween.stop();
            this.swing_tween = null;
        }
    }
}
