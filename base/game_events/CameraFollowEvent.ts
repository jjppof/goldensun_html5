import {Camera} from "../Camera";
import {GameEvent, event_types} from "./GameEvent";

export class CameraFollowEvent extends GameEvent {
    private follow: boolean;
    private is_hero: boolean;
    private npc_label: string;
    private io_label: string;
    private transition_duration: number;

    constructor(game, data, active, key_name, follow, is_hero, npc_label, io_label, transition_duration) {
        super(game, data, event_types.CAMERA_FOLLOW, active, key_name);
        this.follow = follow ?? true;
        this.is_hero = is_hero ?? true;
        this.npc_label = npc_label;
        this.io_label = io_label;
        this.transition_duration = transition_duration ?? 0;
    }

    _fire() {
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
            this.data.camera.follow(target, this.transition_duration);
        } else {
            this.data.camera.unfollow();
        }
    }

    _destroy() {}
}
