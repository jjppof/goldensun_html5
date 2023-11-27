import {GameEvent, event_types} from "./GameEvent";

export class CharBlendModeEvent extends GameEvent {
    private is_npc: boolean;
    private npc_label: string;
    private blend_mode: string;

    constructor(game, data, active, key_name, keep_reveal, is_npc, npc_label, blend_mode) {
        super(game, data, event_types.CHAR_BLEND_MODE, active, key_name, keep_reveal);
        this.blend_mode = blend_mode ?? "normal";
        this.is_npc = is_npc;
        this.npc_label = npc_label;
    }

    async _fire() {
        const target_char =
            GameEvent.get_char(this.data, {
                is_npc: this.is_npc,
                npc_label: this.npc_label,
            }) ?? this.origin_npc;

        if (target_char?.sprite) {
            switch (this.blend_mode) {
                case "normal":
                    target_char.sprite.blendMode = PIXI.blendModes.NORMAL;
                    return;
                case "multiply":
                    target_char.sprite.blendMode = PIXI.blendModes.MULTIPLY;
                    return;
                case "screen":
                    target_char.sprite.blendMode = PIXI.blendModes.SCREEN;
                    return;
            }
        }
    }

    _destroy() {}
}
