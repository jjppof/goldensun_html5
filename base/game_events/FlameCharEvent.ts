import {GameEvent, event_types} from "./GameEvent";

export class FlameCharEvent extends GameEvent {
    private is_npc: boolean;
    private npc_label: string;
    private enable: boolean;

    constructor(game, data, active, key_name, keep_reveal, keep_custom_psynergy, is_npc, npc_label, enable) {
        super(game, data, event_types.FLAME_CHAR, active, key_name, keep_reveal, keep_custom_psynergy);
        this.enable = enable ?? true;
        this.is_npc = is_npc;
        this.npc_label = npc_label;
    }

    async _fire() {
        const target_char =
            GameEvent.get_char(this.data, {
                is_npc: this.is_npc,
                npc_label: this.npc_label,
            }) ?? this.origin_npc;

        if (this.enable) {
            target_char.manage_filter(target_char.flame_filter, true);
        } else {
            target_char.manage_filter(target_char.flame_filter, false);
        }
    }

    _destroy() {}
}
