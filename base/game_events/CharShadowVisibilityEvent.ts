import {GameEvent, event_types} from "./GameEvent";

export class CharShadowVisibilityEvent extends GameEvent {
    private is_npc: boolean;
    private npc_label: string;
    private visible: boolean;

    constructor(game, data, active, key_name, keep_reveal, is_npc, npc_label, visible) {
        super(game, data, event_types.CHAR_SHADOW_VISIBILITY, active, key_name, keep_reveal);
        this.is_npc = is_npc;
        this.npc_label = npc_label;
        this.visible = visible;
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
        if (target_char?.shadow) {
            target_char.shadow.visible = this.visible;
        }
    }

    _destroy() {}
}
