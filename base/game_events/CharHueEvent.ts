import {GameEvent, event_types} from "./GameEvent";

export class CharHueEvent extends GameEvent {
    private is_npc: boolean;
    private npc_label: string;
    private enable: boolean;
    private angle: number;

    constructor(game, data, active, key_name, keep_reveal, keep_custom_psynergy, is_npc, npc_label, enable, angle) {
        super(game, data, event_types.CHAR_HUE, active, key_name, keep_reveal, keep_custom_psynergy);
        this.enable = enable ?? true;
        this.angle = angle ?? -1.0;
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
            target_char.set_hue(true, this.angle);
        } else {
            target_char.set_hue(false);
        }
    }

    _destroy() {}
}
