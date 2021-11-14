import {event_types, LocationKey, TileEvent} from "./TileEvent";
import {get_opposite_direction, directions, get_front_position} from "../utils";

export class JumpEvent extends TileEvent {
    private static readonly JUMP_OFFSET = 30;
    private static readonly JUMP_DURATION = 150;

    constructor(
        game,
        data,
        x,
        y,
        activation_directions,
        activation_collision_layers,
        active,
        active_storage_key,
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
            activation_collision_layers,
            active,
            active_storage_key,
            null,
            affected_by_reveal,
            key_name
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

        const side_pos_key = LocationKey.get_key(side_position.x, side_position.y);
        if (side_pos_key in this.data.map.shapes[this.data.map.collision_layer]) {
            const shapes = this.data.map.shapes[this.data.map.collision_layer][side_pos_key];
            //cancels jumping if there's no collision in the next side position
            if (shapes.every(s => s.sensor)) {
                return;
            }
        }

        const next_pos_key = LocationKey.get_key(next_position.x, next_position.y);
        if (next_pos_key in this.data.map.shapes[this.data.map.collision_layer]) {
            const shapes = this.data.map.shapes[this.data.map.collision_layer][next_pos_key];
            //cancels jumping if there's collision in the jump target position
            if (shapes.some(s => !s.sensor)) {
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
        let active_jump_event_found = false;
        if (next_pos_key in this.data.map.events) {
            for (let i = 0; i < this.data.map.events[next_pos_key].length; ++i) {
                const event = this.data.map.events[next_pos_key][i];
                if (
                    event.type === event_types.JUMP &&
                    event.is_active(get_opposite_direction(jump_direction)) >= 0 &&
                    event.activation_collision_layers.includes(this.data.map.collision_layer)
                ) {
                    active_jump_event_found = true;
                    break;
                }
            }
        }
        if (!active_jump_event_found) {
            return;
        }

        //starts the jump event
        this.data.tile_event_manager.on_event = true;
        this.data.hero
            .jump({
                jump_height: 16,
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
            });
    }

    destroy() {
        this._origin_interactable_object = null;
        this.deactivate();
    }
}
