import {GameEvent, event_types} from "./GameEvent";

export class LookEvent extends GameEvent {
    private look: boolean;
    private looker_is_npc: boolean;
    private looker_npc_label: string;
    private target_is_npc: boolean;
    private target_npc_label: string;

    constructor(
        game,
        data,
        active,
        key_name,
        keep_reveal,
        look,
        looker_is_npc,
        looker_npc_label,
        target_is_npc,
        target_npc_label
    ) {
        super(game, data, event_types.LOOK, active, key_name, keep_reveal);
        this.look = look;
        this.looker_is_npc = looker_is_npc;
        this.looker_npc_label = looker_npc_label;
        this.target_is_npc = target_is_npc;
        this.target_npc_label = target_npc_label;
    }

    _fire() {
        const looker =
            GameEvent.get_char(this.data, {
                is_npc: this.looker_is_npc,
                npc_label: this.looker_npc_label,
            }) ?? this.origin_npc;

        const target =
            GameEvent.get_char(this.data, {
                is_npc: this.target_is_npc,
                npc_label: this.target_npc_label,
            }) ?? this.origin_npc;

        looker.set_look_to_target(this.look, target);
    }

    _destroy() {}
}
