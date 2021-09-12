import {event_types} from "./GameEvent";
import {NPC} from "../NPC";
import {directions} from "../utils";
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

    async _fire(oringin_npc: NPC) {
        if (!this.active) return;
        this.origin_npc = oringin_npc;
        ++this.data.game_event_manager.events_running_count;

        this.set_char();

        await this.camera_follow_char();

        await this.char.face_direction(this.direction, this.time_between_frames);

        if (this.wait_after) {
            await this.wait(this.wait_after);
        }

        await this.camera_unfollow_char();

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
