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

        const color_key = this.color_key ?? target_char.colorize_filter.color;
        const intensity = this.intensity ?? target_char.colorize_filter.intensity;
        const gray = this.gray ?? target_char.gray_filter.intensity;

        if (this.intensity || this.gray) {
            if (gray) {
                target_char.manage_filter(target_char.gray_filter, true);
                target_char.gray_filter.intensity = gray;
            }
            target_char.manage_filter(target_char.colorize_filter, true);
            target_char.colorize_filter.intensity = intensity;
            target_char.colorize_filter.color = color_key;
        } else {
            target_char.colorize_filter.intensity = 0;
            target_char.colorize_filter.color = -1;
            target_char.gray_filter.intensity = 0;
            target_char.manage_filter(target_char.colorize_filter, false);
            target_char.manage_filter(target_char.gray_filter, false);
        }
    }

    _destroy() {}
}
