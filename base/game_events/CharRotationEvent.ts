import {GameEvent, event_types} from "./GameEvent";

export class CharRotationEvent extends GameEvent {
    private is_npc: boolean;
    private npc_label: string;
    private rotate: boolean;
    private interframe_interval: number;
    private frame_index: number;

    constructor(
        game,
        data,
        active,
        key_name,
        keep_reveal,
        is_npc,
        npc_label,
        rotate,
        interframe_interval,
        frame_index
    ) {
        super(game, data, event_types.CHAR_ROTATION, active, key_name, keep_reveal);
        this.is_npc = is_npc;
        this.npc_label = npc_label;
        this.rotate = rotate;
        this.interframe_interval = interframe_interval;
        this.frame_index = frame_index;
    }

    async _fire() {
        const target_char =
            GameEvent.get_char(this.data, {
                is_npc: this.is_npc,
                npc_label: this.npc_label,
            }) ?? this.origin_npc;
        if (!target_char) {
            return;
        }
        target_char.set_rotation(this.rotate, this.interframe_interval, this.frame_index);
    }

    _destroy() {}
}
