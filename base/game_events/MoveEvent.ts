import {EventValue, event_types, GameEvent} from "./GameEvent";
import * as _ from "lodash";
import {directions, get_centered_pos_in_px, get_sqr_distance} from "../utils";
import {NPC} from "../NPC";
import {Camera} from "../Camera";
import {ControllableChar} from "../ControllableChar";
import {StoragePosition} from "Storage";

export class MoveEvent extends GameEvent {
    private static readonly MINIMAL_DISTANCE = 3;
    private static readonly CAMERA_TRANSITION_DURATION = 400;
    private dash: boolean;
    private dest_unit_in_tile: boolean;
    private minimal_distance: number;
    private dest: {x: number | EventValue; y: number | EventValue} | EventValue;
    private final_direction: number;
    private keep_npc_collision_disable: boolean;
    private deactive_char_on_end: boolean;
    private wait_after: number;
    private is_npc: boolean;
    private npc_label: string;
    private finish_events: GameEvent[];
    private previous_dash_value: boolean;
    private camera_follow: boolean;
    private camera_follow_duration: number;
    private camera_unfollow_char_on_finish: boolean;
    private reset_previous_camera_target: boolean;
    private previous_camera_target: Camera["target"];
    private follow_hero_on_finish: boolean;

    constructor(
        game,
        data,
        active,
        key_name,
        keep_reveal,
        is_npc,
        dash,
        dest_unit_in_tile,
        dest,
        npc_label,
        camera_follow,
        camera_follow_duration,
        final_direction,
        follow_hero_on_finish,
        finish_events,
        minimal_distance,
        keep_npc_collision_disable,
        deactive_char_on_end,
        camera_unfollow_char_on_finish,
        wait_after,
        reset_previous_camera_target
    ) {
        super(game, data, event_types.MOVE, active, key_name, keep_reveal);
        this.dash = dash ?? false;
        this.dest = dest;
        this.dest_unit_in_tile = dest_unit_in_tile ?? true;
        this.minimal_distance = minimal_distance ?? MoveEvent.MINIMAL_DISTANCE;
        this.wait_after = wait_after;
        this.keep_npc_collision_disable = keep_npc_collision_disable ?? false;
        this.deactive_char_on_end = deactive_char_on_end ?? false;
        this.final_direction = final_direction !== undefined ? directions[final_direction as string] : null;
        this.is_npc = is_npc;
        this.npc_label = npc_label;
        this.previous_dash_value = null;
        this.camera_follow = camera_follow ?? false;
        this.camera_follow_duration = camera_follow_duration ?? MoveEvent.CAMERA_TRANSITION_DURATION;
        this.camera_unfollow_char_on_finish = camera_unfollow_char_on_finish ?? false;
        this.follow_hero_on_finish = follow_hero_on_finish ?? false;
        this.reset_previous_camera_target = reset_previous_camera_target ?? false;
        this.previous_camera_target = null;
        this.finish_events = [];
        if (finish_events !== undefined) {
            finish_events.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info, this.type, this.origin_npc);
                this.finish_events.push(event);
            });
        }
    }

    async on_position_reach(
        char: ControllableChar,
        previous_force_char_stop_in_event: boolean,
        previous_move_freely_in_event: boolean
    ) {
        if (this.final_direction !== null) {
            await char.face_direction(this.final_direction);
        }
        if (this.wait_after) {
            this.game.time.events.add(this.wait_after, this.go_to_finish, this, char);
        } else {
            this.go_to_finish(char, previous_force_char_stop_in_event, previous_move_freely_in_event);
        }
    }

    async go_to_finish(
        char: ControllableChar,
        previous_force_char_stop_in_event: boolean,
        previous_move_freely_in_event: boolean
    ) {
        if (this.camera_follow) {
            if (this.reset_previous_camera_target) {
                await this.data.camera.follow(this.previous_camera_target, this.camera_follow_duration);
            } else if (this.camera_unfollow_char_on_finish) {
                this.data.camera.unfollow();
            }
        }
        if (this.follow_hero_on_finish) {
            await this.data.camera.follow(this.data.hero, this.camera_follow_duration);
        }
        this.finish(char, previous_force_char_stop_in_event, previous_move_freely_in_event);
    }

    async _fire() {
        ++this.data.game_event_manager.events_running_count;

        this.data.collision.disable_npc_collision();
        const char =
            GameEvent.get_char(this.data, {
                is_npc: this.is_npc,
                npc_label: this.npc_label,
            }) ?? this.origin_npc;
        const previous_force_char_stop_in_event = char.force_char_stop_in_event;
        char.force_char_stop_in_event = false;
        let previous_move_freely_in_event: boolean;
        if (char.is_npc) {
            previous_move_freely_in_event = (char as NPC).move_freely_in_event;
            (char as NPC).move_freely_in_event = false;
        }

        if (this.is_npc && (char as NPC).ignore_physics) {
            this.data.logger.log_message(
                `NPC ${char.key_name} needs to have a collision body to move. Please set "ignore_physics" to true.`
            );
        }

        this.previous_dash_value = char.dashing;
        char.dashing = this.dash;
        let dest_value: {x: number; y: number};

        if (this.dest.hasOwnProperty("type")) {
            dest_value = this.data.game_event_manager.get_value(this.dest as EventValue) as StoragePosition;
        } else {
            const dest_pos = this.dest as typeof dest_value;
            dest_value = {
                x:
                    typeof dest_pos.x === "object"
                        ? (this.data.game_event_manager.get_value(dest_pos.x) as number)
                        : dest_pos.x,
                y:
                    typeof dest_pos.y === "object"
                        ? (this.data.game_event_manager.get_value(dest_pos.y) as number)
                        : dest_pos.y,
            };
        }
        const dest = {
            x: this.dest_unit_in_tile ? get_centered_pos_in_px(dest_value.x, this.data.map.tile_width) : dest_value.x,
            y: this.dest_unit_in_tile ? get_centered_pos_in_px(dest_value.y, this.data.map.tile_height) : dest_value.y,
        };

        if (this.camera_follow) {
            this.previous_camera_target = this.data.camera.target;
            await this.data.camera.follow(char, this.camera_follow_duration);
        }

        const udpate_callback = char.get_move_callback(
            dest,
            () => {
                this.data.game_event_manager.remove_callback(udpate_callback);
                this.on_position_reach(char, previous_force_char_stop_in_event, previous_move_freely_in_event);
            },
            this.minimal_distance
        );
        this.data.game_event_manager.add_callback(udpate_callback);
    }

    finish(char: ControllableChar, previous_force_char_stop_in_event: boolean, previous_move_freely_in_event: boolean) {
        char.force_char_stop_in_event = previous_force_char_stop_in_event;
        if (char.is_npc) {
            (char as NPC).move_freely_in_event = previous_move_freely_in_event;
        }
        char.dashing = this.previous_dash_value;
        if (this.deactive_char_on_end) {
            char.toggle_active(false);
        }
        if (char.is_npc) {
            (char as NPC).update_initial_position(char.x, char.y);
        }
        if (!this.keep_npc_collision_disable) {
            this.data.collision.enable_npc_collision(this.data.map.collision_layer);
        }
        --this.data.game_event_manager.events_running_count;
        this.finish_events.forEach(event => event.fire(this.origin_npc));
    }

    _destroy() {
        this.previous_camera_target = null;
        this.finish_events.forEach(event => event?.destroy());
    }
}
