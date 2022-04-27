import {GameEvent, event_types} from "./GameEvent";

export class ColorizeCharEvent extends GameEvent {
    private is_npc: boolean;
    private npc_label: string;
    private color_key: number;
    private intensity: number;
    private gray: number;

    constructor(game, data, active, key_name, is_npc, npc_label, color_key, intensity, gray) {
        super(game, data, event_types.COLORIZE_CHAR, active, key_name);
        this.color_key = color_key;
        this.intensity = intensity;
        this.gray = gray;
        this.is_npc = is_npc;
        this.npc_label = npc_label;
    }

    async _fire() {
        const target_char =
            GameEvent.get_char(this.data, {
                is_npc: this.is_npc,
                npc_label: this.npc_label,
            }) ?? this.origin_npc;

        const color_key = this.color_key ?? target_char.color_filter.colorize;
        const intensity = this.intensity ?? target_char.color_filter.colorize_intensity;
        const gray = this.gray ?? target_char.color_filter.gray;

        if (this.intensity || this.gray) {
            target_char.manage_filter(target_char.color_filter, true);
            target_char.color_filter.colorize_intensity = intensity;
            target_char.color_filter.colorize = color_key;
            target_char.color_filter.gray = gray;
        } else {
            target_char.color_filter.colorize_intensity = 0;
            target_char.color_filter.colorize = -1;
            target_char.color_filter.gray = 0;
            target_char.manage_filter(target_char.color_filter, false);
        }
    }

    _destroy() {}
}
