import {GameEvent, event_types} from "./GameEvent";

export class CharAnimPlayEvent extends GameEvent {
    private finish_events: GameEvent[] = [];
    private is_npc: boolean;
    private npc_label: string;
    private action: string;
    private animation: string;
    private frame_rate: number;
    private loop: boolean;
    private stop_animation: boolean;

    constructor(
        game,
        data,
        active,
        key_name,
        is_npc,
        npc_label,
        action,
        animation,
        frame_rate,
        loop,
        stop_animation,
        finish_events
    ) {
        super(game, data, event_types.CHAR_ANIM_PLAY, active, key_name);
        this.npc_label = npc_label;
        this.is_npc = is_npc;
        this.action = action;
        this.animation = animation;
        this.frame_rate = frame_rate;
        this.loop = loop;
        this.stop_animation = stop_animation ?? false;
        if (finish_events !== undefined) {
            finish_events.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info);
                this.finish_events.push(event);
            });
        }
    }

    _fire() {
        const target_char =
            GameEvent.get_char(this.data, {
                is_npc: this.is_npc,
                npc_label: this.npc_label,
            }) ?? this.origin_npc;

        const animation = target_char.play(
            this.animation,
            this.action,
            !this.stop_animation,
            this.frame_rate,
            this.loop
        );
        if (!animation.loop) {
            ++this.data.game_event_manager.events_running_count;
            animation.onComplete.addOnce(() => {
                if (!this.is_npc) {
                    this.data.game_event_manager.force_idle_action = true;
                }
                --this.data.game_event_manager.events_running_count;
                this.finish_events.forEach(event => event.fire(this.origin_npc));
            });
        }
    }

    _destroy() {
        this.finish_events.forEach(event => event.destroy());
    }
}
