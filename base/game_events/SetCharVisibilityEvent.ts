import {GameEvent, event_types} from "./GameEvent";

export class SetCharVisibilityEvent extends GameEvent {
    private is_npc: boolean;
    private npc_label: string;
    private visible: boolean;

    constructor(game, data, active, key_name, keep_reveal, keep_custom_psynergy, is_npc, npc_label, visible) {
        super(game, data, event_types.SET_CHAR_VISIBILITY, active, key_name, keep_reveal, keep_custom_psynergy);
        this.is_npc = is_npc;
        this.npc_label = npc_label;
        this.visible = visible;
    }

    _fire() {
        const target_char =
            GameEvent.get_char(this.data, {
                is_npc: this.is_npc,
                npc_label: this.npc_label,
            }) ?? this.origin_npc;
        target_char.set_visible(this.visible);
    }

    _destroy() {}
}
