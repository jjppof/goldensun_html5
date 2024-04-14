import {FieldAbilities} from "../field_abilities/FieldAbilities";
import {GameEvent, event_types} from "./GameEvent";

export class CastingAuraEvent extends GameEvent {
    private is_npc: boolean;
    private npc_label: string;
    private enable: boolean;

    constructor(game, data, active, key_name, keep_reveal, keep_custom_psynergy, is_npc, npc_label, enable) {
        super(game, data, event_types.CASTING_AURA, active, key_name, keep_reveal, keep_custom_psynergy);
        this.npc_label = npc_label;
        this.is_npc = is_npc;
        this.enable = enable;
    }

    _fire() {
        const target_char =
            GameEvent.get_char(this.data, {
                is_npc: this.is_npc,
                npc_label: this.npc_label,
            }) ?? this.origin_npc;
        if (this.enable) {
            FieldAbilities.init_cast_aura(this.game, this.data, target_char);
        } else {
            if (target_char.casting_aura_stop_function) {
                target_char.casting_aura_stop_function();
            }
        }
    }

    _destroy() {}
}
