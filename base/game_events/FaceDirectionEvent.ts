import {event_types, GameEvent} from "./GameEvent";
import {directions, promised_wait} from "../utils";

export class FaceDirectionEvent extends GameEvent {
    private direction: directions;
    private time_between_frames: number;
    private wait_after: number;
    private npc_index: number;
    private npc_label: string;
    private is_npc: boolean;
    private finish_events: GameEvent[];

    constructor(
        game,
        data,
        active,
        key_name,
        keep_reveal,
        direction,
        is_npc,
        npc_index,
        npc_label,
        time_between_frames,
        finish_events,
        wait_after
    ) {
        super(game, data, event_types.FACE_DIRECTION, active, key_name, keep_reveal);
        this.direction = directions[direction as string];
        this.time_between_frames = time_between_frames;
        this.is_npc = is_npc;
        this.npc_index = npc_index;
        this.npc_label = npc_label;
        this.wait_after = wait_after;
        this.finish_events = [];
        if (finish_events !== undefined) {
            finish_events.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info);
                this.finish_events.push(event);
            });
        }
    }

    async _fire() {
        ++this.data.game_event_manager.events_running_count;

        const char =
            GameEvent.get_char(this.data, {
                is_npc: this.is_npc,
                npc_index: this.npc_index,
                npc_label: this.npc_label,
            }) ?? this.origin_npc;

        await char.face_direction(this.direction, this.time_between_frames);

        if (this.wait_after) {
            await promised_wait(this.game, this.wait_after);
        }

        --this.data.game_event_manager.events_running_count;
        this.finish_events.forEach(event => event.fire(this.origin_npc));
    }

    _destroy() {
        this.finish_events.forEach(event => event?.destroy());
    }
}
