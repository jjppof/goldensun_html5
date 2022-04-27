import {GameEvent, event_types} from "./GameEvent";

export class TintCharEvent extends GameEvent {
    private is_npc: boolean;
    private npc_label: string;
    private enable: boolean;
    private color: {
        r: number; //[0, 1]
        g: number; //[0, 1]
        b: number; //[0, 1]
    };

    constructor(game, data, active, key_name, is_npc, npc_label, enable, color) {
        super(game, data, event_types.TINT_CHAR, active, key_name);
        this.enable = enable ?? true;
        this.color = color ?? {r: -1, g: -1, b: -1};
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
            target_char.manage_filter(target_char.color_filter, true);
            target_char.color_filter.tint = [this.color.r, this.color.g, this.color.b];
        } else {
            target_char.color_filter.tint = [-1, -1, -1];
            target_char.manage_filter(target_char.color_filter, false);
        }
    }

    _destroy() {}
}
