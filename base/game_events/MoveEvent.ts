import {EventValue, event_types, event_value_types, GameEvent} from "./GameEvent";
import * as _ from "lodash";
import {directions, get_centered_pos_in_px, get_sqr_distance} from "../utils";
import {NPC} from "../NPC";
import {ControllableChar} from "ControllableChar";

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
    private update_initial_position: boolean;
    private is_npc: boolean;
    private npc_label: string;
    private finish_events: GameEvent[];
    private previous_dash_value: boolean;
    private previous_allow_char_to_move: boolean;
    private camera_follow: boolean;
    private camera_follow_duration: number;
    private keep_camera_follow: boolean;
    private follow_hero_on_finish: boolean;

    constructor(
        game,
        data,
        active,
        key_name,
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
        keep_camera_follow,
        wait_after,
        update_initial_position
    ) {
        super(game, data, event_types.MOVE, active, key_name);
        this.dash = dash ?? false;
        this.dest = dest;
        this.dest_unit_in_tile = dest_unit_in_tile ?? true;
        this.minimal_distance = minimal_distance ?? MoveEvent.MINIMAL_DISTANCE;
        this.wait_after = wait_after;
        this.keep_npc_collision_disable = keep_npc_collision_disable ?? false;
        this.deactive_char_on_end = deactive_char_on_end ?? false;
        this.final_direction = final_direction !== undefined ? directions[final_direction as string] : null;
        this.update_initial_position = update_initial_position ?? false;
        this.is_npc = is_npc;
        this.npc_label = npc_label;
        this.previous_dash_value = null;
        this.previous_allow_char_to_move = null;
        this.camera_follow = camera_follow ?? false;
        this.camera_follow_duration = camera_follow_duration ?? MoveEvent.CAMERA_TRANSITION_DURATION;
        this.keep_camera_follow = keep_camera_follow ?? true;
        this.follow_hero_on_finish = follow_hero_on_finish ?? false;
        this.finish_events = [];
        if (finish_events !== undefined) {
            finish_events.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info);
                this.finish_events.push(event);
            });
        }
    }

    on_position_reach(char: ControllableChar) {
        char.stop_char();
        if (this.final_direction !== null) {
            char.set_direction(this.final_direction, true);
        }
        if (this.wait_after) {
            this.game.time.events.add(this.wait_after, this.go_to_finish, this, char);
        } else {
            this.go_to_finish(char);
        }
    }

    async go_to_finish(char: ControllableChar) {
        if (this.camera_follow && !this.keep_camera_follow) {
            this.data.camera.unfollow();
        }
        if (this.follow_hero_on_finish) {
            await this.data.camera.follow(this.data.hero, this.camera_follow_duration);
        }
        this.finish(char);
    }

    async _fire() {
        ++this.data.game_event_manager.events_running_count;

        this.data.collision.disable_npc_collision();
        const char =
            GameEvent.get_char(this.data, {
                is_npc: this.is_npc,
                npc_label: this.npc_label,
            }) ?? this.origin_npc;
        if (!char.is_npc) {
            this.previous_allow_char_to_move = this.data.game_event_manager.allow_char_to_move;
            this.data.game_event_manager.allow_char_to_move = true;
        }
        this.previous_dash_value = char.dashing;
        char.dashing = this.dash;
        let dest_value: {x: number; y: number};

        if (this.dest.hasOwnProperty("type")) {
            dest_value = this.data.game_event_manager.get_value(this.dest as EventValue);
        } else {
            const dest_pos = this.dest as typeof dest_value;
            dest_value = {
                x: typeof dest_pos.x === "object" ? this.data.game_event_manager.get_value(dest_pos.x) : dest_pos.x,
                y: typeof dest_pos.y === "object" ? this.data.game_event_manager.get_value(dest_pos.y) : dest_pos.y,
            };
        }
        const dest = {
            x: this.dest_unit_in_tile ? get_centered_pos_in_px(dest_value.x, this.data.map.tile_width) : dest_value.x,
            y: this.dest_unit_in_tile ? get_centered_pos_in_px(dest_value.y, this.data.map.tile_height) : dest_value.y,
        };

        if (this.camera_follow) {
            await this.data.camera.follow(char, this.camera_follow_duration);
        }

        const direction = new Phaser.Point(dest.x - char.x, dest.y - char.y).normalize();
        char.set_speed(direction.x, direction.y, false);
        const minimal_distance_sqr = this.minimal_distance * this.minimal_distance;

        let previous_sqr_dist = Infinity;
        const udpate_callback = () => {
            char.update_movement(true);
            this.data.map.sort_sprites();
            const this_sqr_dist = get_sqr_distance(char.x, dest.x, char.y, dest.y);
            if (this_sqr_dist < minimal_distance_sqr || this_sqr_dist > previous_sqr_dist) {
                this.data.game_event_manager.remove_callback(udpate_callback);
                this.on_position_reach(char);
            }
            previous_sqr_dist = this_sqr_dist;
        };
        this.data.game_event_manager.add_callback(udpate_callback);
    }

    finish(char: ControllableChar) {
        if (!char.is_npc) {
            this.data.game_event_manager.allow_char_to_move = this.previous_allow_char_to_move;
        }
        char.dashing = this.previous_dash_value;
        if (this.deactive_char_on_end) {
            char.toggle_active(false);
        }
        if (this.update_initial_position && char.is_npc) {
            (char as NPC).update_initial_position(char.x, char.y);
        }
        if (!this.keep_npc_collision_disable) {
            this.data.collision.enable_npc_collision(this.data.map.collision_layer);
        }
        --this.data.game_event_manager.events_running_count;
        this.finish_events.forEach(event => event.fire(this.origin_npc));
    }

    _destroy() {
        this.finish_events.forEach(event => event.destroy());
    }
}
