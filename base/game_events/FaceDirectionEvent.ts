import {event_types, GameEvent} from "./GameEvent";
import {directions, promised_wait} from "../utils";
import {CharControlEvent} from "./CharControlEvent";

export class FaceDirectionEvent extends CharControlEvent {
    private direction: directions;
    private time_between_frames: number;
    private wait_after: number;

    constructor(
        game,
        data,
        active,
        key_name,
        direction,
        is_npc,
        npc_index,
        npc_label,
        time_between_frames,
        finish_events,
        camera_follow,
        camera_follow_time,
        follow_hero_on_finish,
        keep_camera_follow,
        wait_after
    ) {
        super(
            game,
            data,
            event_types.FACE_DIRECTION,
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
        this.direction = directions[direction as string];
        this.time_between_frames = time_between_frames;
        this.wait_after = wait_after;
    }

    async _fire() {
        ++this.data.game_event_manager.events_running_count;

        this.char = GameEvent.get_char(this.data, {
            is_npc: this.is_npc,
            npc_index: this.npc_index,
            npc_label: this.npc_label,
        });
        if (!this.char) {
            this.char = this.origin_npc;
            this.is_npc = true;
        }

        await this.camera_follow_char();

        await this.char.face_direction(this.direction, this.time_between_frames);

        if (this.wait_after) {
            await promised_wait(this.game, this.wait_after);
        }

        await this.camera_unfollow_char();

        this.is_npc = undefined;
        --this.data.game_event_manager.events_running_count;
        this.finish_events.forEach(event => event.fire(this.origin_npc));
    }

    _destroy() {
        this.finish_events.forEach(event => event.destroy());
        this.char = null;
    }
}
