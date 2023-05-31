import {Camera} from "../Camera";
import {GameEvent, event_types} from "./GameEvent";

export class CameraFollowEvent extends GameEvent {
    private follow: boolean;
    private is_hero: boolean;
    private npc_label: string;
    private io_label: string;
    private transition_duration: number;
    private transition_end_events: GameEvent[];

    constructor(
        game,
        data,
        active,
        key_name,
        keep_reveal,
        follow,
        is_hero,
        npc_label,
        io_label,
        transition_duration,
        transition_end_events
    ) {
        super(game, data, event_types.CAMERA_FOLLOW, active, key_name, keep_reveal);
        this.follow = follow ?? true;
        this.is_hero = is_hero ?? true;
        this.npc_label = npc_label;
        this.io_label = io_label;
        this.transition_duration = transition_duration ?? 0;
        this.transition_end_events = [];
        if (transition_end_events !== undefined) {
            transition_end_events.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info, this.type, this.origin_npc);
                this.transition_end_events.push(event);
            });
        }
    }

    async _fire() {
        ++this.data.game_event_manager.events_running_count;
        if (this.follow) {
            let target: Camera["target"];
            if (this.io_label) {
                target = this.data.map.interactable_objects_label_map[this.io_label];
            } else {
                target =
                    GameEvent.get_char(this.data, {
                        is_npc: !this.is_hero,
                        npc_label: this.npc_label,
                    }) ?? this.origin_npc;
            }
            await this.data.camera.follow(target, this.transition_duration);
            this.transition_end_events.forEach(event => event.fire(this.origin_npc));
        } else {
            this.data.camera.unfollow();
        }
        --this.data.game_event_manager.events_running_count;
    }

    _destroy() {
        this.transition_end_events.forEach(event => event?.destroy());
    }
}
