import {event_types} from "./GameEvent";
import * as _ from "lodash";
import {directions} from "../utils";
import {NPC} from "../NPC";
import {CharControlEvent} from "./CharControlEvent";

export class MoveEvent extends CharControlEvent {
    private static readonly MINIMAL_DISTANCE = 3;
    private dash: boolean;
    private dest_unit_in_tile: boolean;
    private minimal_distance: number;
    private dest: {x: number | string; y: number | string};
    private final_direction: number;
    private keep_npc_collision_disable: boolean;
    private deactive_char_on_end: boolean;
    private wait_after: number;

    constructor(
        game,
        data,
        active,
        key_name,
        is_npc,
        dash,
        dest_unit_in_tile,
        dest,
        npc_index,
        npc_label,
        camera_follow,
        camera_follow_time,
        final_direction,
        follow_hero_on_finish,
        finish_events,
        minimal_distance,
        keep_npc_collision_disable,
        deactive_char_on_end,
        keep_camera_follow,
        wait_after
    ) {
        super(
            game,
            data,
            event_types.MOVE,
            active,
            key_name,
            is_npc,
            npc_index,
            npc_label,
            camera_follow,
            camera_follow_time,
            follow_hero_on_finish,
            finish_events,
            keep_camera_follow
        );
        this.dash = dash ?? false;
        this.dest = dest;
        this.dest_unit_in_tile = dest_unit_in_tile ?? true;
        this.minimal_distance = minimal_distance;
        this.wait_after = wait_after;
        this.keep_npc_collision_disable = keep_npc_collision_disable ?? false;
        this.deactive_char_on_end = deactive_char_on_end ?? false;
        this.final_direction = final_direction !== undefined ? directions[final_direction as string] : null;
    }

    on_position_reach() {
        this.char.stop_char();
        if (this.final_direction !== null) {
            this.char.set_direction(this.final_direction, true);
        }
        if (this.wait_after) {
            this.game.time.events.add(this.wait_after, this.go_to_finish, this);
        } else {
            this.go_to_finish();
        }
    }

    async go_to_finish() {
        await this.camera_unfollow_char();
        this.finish();
    }

    async _fire(origin_npc?: NPC) {
        if (!this.active) return;
        this.origin_npc = origin_npc;
        ++this.data.game_event_manager.events_running_count;
        this.data.collision.disable_npc_collision();
        this.set_char();
        this.char.dashing = this.dash;
        const dest_value = {
            x: typeof this.dest.x === "object" ? this.data.game_event_manager.get_value(this.dest.x) : this.dest.x,
            y: typeof this.dest.y === "object" ? this.data.game_event_manager.get_value(this.dest.y) : this.dest.y,
        };
        const dest = {
            x: this.dest_unit_in_tile ? (dest_value.x + 0.5) * this.data.map.tile_width : dest_value.x,
            y: this.dest_unit_in_tile ? (dest_value.y + 0.5) * this.data.map.tile_height : dest_value.y,
        };

        await this.camera_follow_char();

        const direction = new Phaser.Point(dest.x - this.char.sprite.x, dest.y - this.char.sprite.y).normalize();
        this.char.set_speed(direction.x, direction.y, false);
        const sqr = x => x * x;
        const minimal_distance_sqr = sqr(this.minimal_distance ?? MoveEvent.MINIMAL_DISTANCE);
        if (!this.is_npc) {
            this.data.game_event_manager.allow_char_to_move = true;
        }
        const udpate_callback = () => {
            this.char.update_movement(true);
            this.data.map.sort_sprites();
            if (sqr(dest.x - this.char.sprite.x) + sqr(dest.y - this.char.sprite.y) < minimal_distance_sqr) {
                this.data.game_event_manager.remove_callback(udpate_callback);
                this.on_position_reach();
            }
        };
        this.data.game_event_manager.add_callback(udpate_callback);
    }

    finish() {
        if (!this.is_npc) {
            this.data.game_event_manager.allow_char_to_move = false;
        }
        this.char.dashing = false;
        if (this.deactive_char_on_end) {
            this.char.toggle_active(false);
        }
        if (!this.keep_npc_collision_disable) {
            this.data.collision.enable_npc_collision(this.data.map.collision_layer);
        }
        this.is_npc = undefined;
        --this.data.game_event_manager.events_running_count;
        this.finish_events.forEach(event => event.fire(this.origin_npc));
    }

    destroy() {
        this.finish_events.forEach(event => event.destroy());
        this.origin_npc = null;
        this.char = null;
    }
}
