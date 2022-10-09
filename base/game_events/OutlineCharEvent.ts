import {GameEvent, event_types} from "./GameEvent";

export class OutlineCharEvent extends GameEvent {
    private is_npc: boolean;
    private npc_label: string;
    private enable: boolean;
    private keep_transparent: boolean;
    private color: {
        r: number; //[0, 1]
        g: number; //[0, 1]
        b: number; //[0, 1]
    };

    constructor(game, data, active, key_name, keep_reveal, is_npc, npc_label, enable, color, keep_transparent) {
        super(game, data, event_types.OUTLINE_CHAR, active, key_name, keep_reveal);
        this.enable = enable ?? true;
        this.keep_transparent = keep_transparent ?? true;
        this.color = color ?? {r: 1, g: 1, b: 1};
        this.is_npc = is_npc;
        this.npc_label = npc_label;
    }

    async _fire() {
        const target_char =
            GameEvent.get_char(this.data, {
                is_npc: this.is_npc,
                npc_label: this.npc_label,
            }) ?? this.origin_npc;

        target_char.set_outline(this.enable, {
            r: this.color.r,
            g: this.color.g,
            b: this.color.b,
            keep_transparent: this.keep_transparent,
        });
    }

    _destroy() {}
}
