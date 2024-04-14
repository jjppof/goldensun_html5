import {NPC} from "NPC";
import {GameEvent, event_types} from "./GameEvent";

enum control_types {
    DISABLE = "disable",
    ENABLE = "enable",
    REMOVE = "remove",
}

export class SetCharCollisionEvent extends GameEvent {
    private is_npc: boolean;
    private npc_label: string;
    private control_type: control_types;

    constructor(game, data, active, key_name, keep_reveal, keep_custom_psynergy, is_npc, npc_label, control_type) {
        super(game, data, event_types.SET_CHAR_COLLISION, active, key_name, keep_reveal, keep_custom_psynergy);
        this.is_npc = is_npc;
        this.npc_label = npc_label;
        this.control_type = control_type;
    }

    _fire() {
        const target_char =
            GameEvent.get_char(this.data, {
                is_npc: this.is_npc,
                npc_label: this.npc_label,
            }) ?? this.origin_npc;

        switch (this.control_type) {
            case control_types.REMOVE:
                if (this.is_npc) {
                    (target_char as NPC).destroy_body(true);
                }
                break;
            case control_types.ENABLE:
                target_char.toggle_collision(true);
                break;
            case control_types.DISABLE:
                target_char.toggle_collision(false);
                break;
        }
    }

    _destroy() {}
}
