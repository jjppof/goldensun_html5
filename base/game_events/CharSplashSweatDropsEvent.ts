import {GameEvent, event_types} from "./GameEvent";

export class CharSplashSweatDropsEvent extends GameEvent {
    private is_npc: boolean;
    private npc_label: string;
    private times: number;
    private finish_events: GameEvent[];

    constructor(
        game,
        data,
        active,
        key_name,
        keep_reveal,
        keep_custom_psynergy,
        is_npc,
        npc_label,
        times,
        finish_events
    ) {
        super(game, data, event_types.SPLASH_SWEAT_DROPS, active, key_name, keep_reveal, keep_custom_psynergy);
        this.times = times;
        this.is_npc = is_npc;
        this.npc_label = npc_label;
        this.finish_events = [];
        if (finish_events !== undefined) {
            finish_events.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info, this.type, this.origin_npc);
                this.finish_events.push(event);
            });
        }
    }

    async _fire() {
        const target_char =
            GameEvent.get_char(this.data, {
                is_npc: this.is_npc,
                npc_label: this.npc_label,
            }) ?? this.origin_npc;
        if (target_char) {
            await target_char.splash_sweat_drops(this.times);
            this.finish_events.forEach(event => event.fire(this.origin_npc));
        }
    }

    _destroy() {
        this.finish_events.forEach(event => event?.destroy());
    }
}
