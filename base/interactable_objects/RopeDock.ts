import { Map } from "../Map";
import { get_centered_pos_in_px, get_distance } from "../utils";
import { InteractableObjects } from "./InteractableObjects";

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
    /** The rope width */
    private _rope_width: number;
    /** The staring rope dock. null if it's the starting rope dock. */
    private _starting_rope_dock: RopeDock;
    /** Rope fragments base positions. */
    private _rope_frag_base_pos: {
        x: number,
        y: number
    }[];
    /** The tween that controls the rope bounce. */
    public swing_tween: Phaser.Tween;

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
            events_info,
        );
        this._is_rope_dock = true;
        this._starting_rope_dock = null;
        this.swing_tween = null;
        this._rope_frag_base_pos = [];
    }

    /** Groups that holds the rope fragments. */
    get rope_fragments_group() {
        return this._rope_fragments_group;
    }

    /** The rope width */
    get rope_width() {
        return this._rope_width;
    }

    /** The staring rope dock. null if it's the starting rope dock. */
    get starting_rope_dock() {
        return this._starting_rope_dock;
    }

    /** Whether this event is the rope starting dock. */
    get is_starting_dock() {
        return this._is_starting_dock;
    }

    /** Rope fragments base positions. */
    get rope_frag_base_pos() {
        return this._rope_frag_base_pos;
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

        let rope_fragments_group: Phaser.Group;
        if (this._is_starting_dock) {
            this.set_rope_fragments(map);
            rope_fragments_group = this.rope_fragments_group;
        } else {
            this.find_starting_dock(map);
            rope_fragments_group = this._starting_rope_dock.rope_fragments_group;
        }

        this.sprite.sort_function_end = () => {
            if (this.data.npc_group.getChildIndex(this.sprite) > this.data.npc_group.getChildIndex(rope_fragments_group)) {
                this.data.npc_group.setChildIndex(this.sprite, this.data.npc_group.getChildIndex(rope_fragments_group));
            } else {
                this.data.npc_group.setChildIndex(this.sprite, this.data.npc_group.getChildIndex(rope_fragments_group) - 1);
            }
        };
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
        this._rope_width = distance | 0;
        const actual_rope_width = RopeDock.ROPE_FRAGMENT_WIDTH - 2;
        const fragments_number = (distance / actual_rope_width) | 0;
        const fragment_angle = Math.atan2(dest_y_px - this_y_px, dest_x_px - this_x_px);

        const base_x = Math.cos(fragment_angle) * actual_rope_width;
        const half_base_x = base_x >> 1;
        const base_y = Math.sin(fragment_angle) * actual_rope_width;
        const half_base_y = base_y >> 1;

        this._rope_fragments_group = this.game.add.group(this.data.npc_group);
        this._rope_fragments_group.x = this_x_px + half_base_x;
        this._rope_fragments_group.y = this_y_px + half_base_y;
        this._rope_fragments_group.base_collision_layer = map.collision_layer;

        for (let i = 0; i < fragments_number; ++i) {
            const sprite_key = this.sprite_info.getSpriteKey(RopeDock.ROPE_DOCK_KEY);
            const frame_name = this.sprite_info.getFrameName(RopeDock.ROPE_DOCK_KEY, RopeDock.ROPE_FRAGMENT);
            const sprite: Phaser.Sprite = this._rope_fragments_group.create(0, 0, sprite_key, frame_name);

            sprite.anchor.setTo(0.5, 0.5);
            sprite.x = base_x * i;
            sprite.y = base_y * i;
            this._rope_frag_base_pos.push({
                x: sprite.x,
                y: sprite.y
            });
            sprite.rotation = fragment_angle;

            this._extra_sprites.push(sprite);
        }
    }

    /**
     * If it's not a starting dock, finds the starting one.
     * @param map the current map.
     */
    find_starting_dock(map: Map) {
        for (let i = 0; i < map.interactable_objects.length; ++i) {
            const io = map.interactable_objects[i];
            if (io.is_rope_dock && io.tile_x_pos === this._dest_x && io.tile_y_pos === this._dest_y) {
                this._starting_rope_dock = io as RopeDock;
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
        this._starting_rope_dock = null;
        if (this.swing_tween) {
            this.swing_tween.stop();
            this.swing_tween = null;
        }
    }
}