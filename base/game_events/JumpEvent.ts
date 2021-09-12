import {event_types} from "./GameEvent";
import {NPC} from "../NPC";
import {directions} from "../utils";
import {CharControlEvent} from "./CharControlEvent";

export class JumpEvent extends CharControlEvent {
    private jump_height: number;
    private duration: number;
    private wait_after: number;
    private dest: {
        tile_x?: number;
        tile_y?: number;
        distance?: number;
    };
    private jump_direction: directions;
    private camera_follow_while_jumping: boolean;

    constructor(
        game,
        data,
        active,
        key_name,
        is_npc,
        npc_index,
        camera_follow,
        camera_follow_time,
        follow_hero_on_finish,
        finish_events,
        jump_height,
        duration,
        dest,
        jump_direction,
        keep_camera_follow,
        wait_after,
        camera_follow_while_jumping
    ) {
        super(
            game,
            data,
            event_types.JUMP,
            active,
            key_name,
            is_npc,
            npc_index,
            camera_follow,
            camera_follow_time,
            follow_hero_on_finish,
            finish_events,
            keep_camera_follow
        );
        this.jump_height = jump_height;
        this.duration = duration;
        this.wait_after = wait_after;
        this.camera_follow_while_jumping = camera_follow_while_jumping;
        this.dest = dest;
        this.jump_direction = jump_direction !== undefined ? directions[jump_direction as string] : undefined;
    }

    async _fire(oringin_npc: NPC) {
        if (!this.active) return;
        this.origin_npc = oringin_npc;
        ++this.data.game_event_manager.events_running_count;

        this.set_char();

        await this.camera_follow_char();

        await this.char.jump({
            jump_height: this.jump_height,
            duration: this.duration,
            jump_direction: this.jump_direction,
            dest: this.dest,
            time_on_finish: this.wait_after,
            camera_follow: this.camera_follow_while_jumping,
        });

        await this.camera_unfollow_char();

        this.finish();
    }

    finish() {
        if (!this.is_npc) {
            this.data.game_event_manager.allow_char_to_move = false;
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
