import {event_types, IntegerPairKey, TileEvent} from "./TileEvent";
import {get_opposite_direction, directions, get_front_position, get_centered_pos_in_px} from "../utils";
import {Breakable} from "../interactable_objects/Breakable";
import {InteractableObjects} from "../interactable_objects/InteractableObjects";
import {RevealFieldPsynergy} from "../field_abilities/RevealFieldPsynergy";

export class JumpEvent extends TileEvent {
    private static readonly JUMP_OFFSET = 30;
    private static readonly JUMP_DURATION = 150;
    private static readonly JUMP_HEIGHT = 16;

    constructor(
        game,
        data,
        x,
        y,
        activation_directions,
        initial_disabled_directions,
        activation_collision_layers,
        active_storage_key,
        origin_interactable_object,
        affected_by_reveal,
        key_name: string
    ) {
        super(
            game,
            data,
            event_types.JUMP,
            x,
            y,
            activation_directions,
            initial_disabled_directions,
            activation_collision_layers,
            active_storage_key,
            origin_interactable_object,
            affected_by_reveal,
            key_name,
            false
        );
    }

    fire() {
        if (!this.data.hero.stop_by_colliding || !this.check_position() || !this.data.hero_movement_allowed(false)) {
            return;
        }

        const jump_direction = this.data.hero.current_direction;
        const side_position = get_front_position(this.x, this.y, jump_direction);
        if (side_position === null) {
            return;
        }
        const next_position = get_front_position(side_position.x, side_position.y, jump_direction);
        const jump_offset =
            ([directions.left, directions.up].includes(jump_direction) ? -1 : 1) * JumpEvent.JUMP_OFFSET;

        //cancels jumping if there's no collision in the next side position
        if (
            !this.data.map.is_tile_blocked(side_position.x, side_position.y) &&
            !this.data.map.get_tile_bodies(side_position.x, side_position.y).length
        ) {
            return;
        }

        //cancels jumping if there's collision in the jump target position
        if (
            this.data.map.is_tile_blocked(next_position.x, next_position.y) ||
            this.data.map.get_tile_bodies(next_position.x, next_position.y).length
        ) {
            const objs = this.data.map.get_tile_bodies(next_position.x, next_position.y);
            const can_jump_over_it = objs
                .filter(o => o.is_interactable_object)
                .every((io: InteractableObjects) => {
                    return io.allow_jumping_through_it || !io.shapes_collision_active;
                });
            const has_npc = Boolean(objs.find(o => !o.is_interactable_object));
            if (has_npc || !can_jump_over_it) {
                return;
            }
        }

        for (let i = 0; i < this.data.map.interactable_objects.length; ++i) {
            const interactable_object = this.data.map.interactable_objects[i];
            if (this.data.map.collision_layer === interactable_object.base_collision_layer) {
                //checks whether there's an IO in the jump way
                if (
                    interactable_object.tile_x_pos === side_position.x &&
                    interactable_object.tile_y_pos === side_position.y
                ) {
                    if (!interactable_object.allow_jumping_through_it) {
                        return;
                    }
                }

                //deals with the case whether we find an IO in the jump target position
                if (
                    interactable_object.tile_x_pos === next_position.x &&
                    interactable_object.tile_y_pos === next_position.y
                ) {
                    if (!interactable_object.allow_jumping_over_it) {
                        return;
                    }
                }
            }
        }

        //deals with the case whether we find a NPC in the jump target position
        for (let i = 0; i < this.data.map.npcs.length; ++i) {
            const next_npc = this.data.map.npcs[i];
            if (next_npc.tile_x_pos !== next_position.x || next_npc.tile_y_pos !== next_position.y) {
                continue;
            }
            if (this.data.map.collision_layer !== next_npc.base_collision_layer) {
                continue;
            }
            return;
        }

        //jump only happens if the jump target position also has an active jump event in the opposite direction
        const next_pos_key = IntegerPairKey.get_key(next_position.x, next_position.y);
        let active_jump_event_found = false;
        let breakable: Breakable = null;
        let found_at_least_one_jump_event_affected_by_reveal = false;
        if (next_pos_key in this.data.map.events) {
            for (let i = 0; i < this.data.map.events[next_pos_key].length; ++i) {
                const event = this.data.map.events[next_pos_key][i];
                if (
                    event.type === event_types.JUMP &&
                    event.is_active_at_direction(get_opposite_direction(jump_direction)) &&
                    event.activation_collision_layers.has(this.data.map.collision_layer)
                ) {
                    active_jump_event_found = true;
                    if (event.origin_interactable_object?.breakable) {
                        //ideally, we should see only one breakable in this loop...
                        breakable = event.origin_interactable_object as Breakable;
                    }
                    found_at_least_one_jump_event_affected_by_reveal ||= Boolean(event.affected_by_reveal.size);
                }
            }
        }
        if (!active_jump_event_found) {
            return;
        }

        //cancels jumping if target position is beyond reveal area
        if (this.data.hero.on_reveal && found_at_least_one_jump_event_affected_by_reveal) {
            const reveal_psynergy = this.data.info.field_abilities_list[
                RevealFieldPsynergy.ABILITY_KEY_NAME
            ] as RevealFieldPsynergy;
            const x_target = get_centered_pos_in_px(next_position.x, this.data.map.tile_width);
            const y_target = get_centered_pos_in_px(next_position.y, this.data.map.tile_height);
            if (reveal_psynergy.should_finish_reveal(x_target, y_target)) {
                return;
            }
        }

        //starts the jump event
        this.data.tile_event_manager.on_event = true;
        this.data.hero
            .jump({
                jump_height: JumpEvent.JUMP_HEIGHT,
                duration: JumpEvent.JUMP_DURATION,
                jump_direction: jump_direction,
                dest: {
                    tile_x: next_position.x,
                    tile_y: next_position.y,
                    distance: jump_offset,
                },
            })
            .then(() => {
                this.data.tile_event_manager.on_event = false;
                if (breakable) {
                    breakable.break(this.data.hero);
                }
            });
    }

    destroy() {
        this._origin_interactable_object = null;
        this.deactivate();
    }
}
