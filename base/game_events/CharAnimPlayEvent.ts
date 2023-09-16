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
    private reset_frame_on_stop: boolean;
    private reset_before_start: boolean;

    constructor(
        game,
        data,
        active,
        key_name,
        keep_reveal,
        is_npc,
        npc_label,
        action,
        animation,
        frame_rate,
        loop,
        stop_animation,
        reset_frame_on_stop,
        reset_before_start,
        finish_events
    ) {
        super(game, data, event_types.CHAR_ANIMATION_PLAY, active, key_name, keep_reveal);
        this.npc_label = npc_label;
        this.is_npc = is_npc;
        this.action = action;
        this.animation = animation;
        this.frame_rate = frame_rate;
        this.loop = loop;
        this.stop_animation = stop_animation ?? false;
        this.reset_frame_on_stop = reset_frame_on_stop ?? false;
        this.reset_before_start = reset_before_start ?? true;
        if (finish_events !== undefined) {
            finish_events.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info, this.type, this.origin_npc);
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

        if (this.stop_animation) {
            target_char.sprite.animations.currentAnim.stop(this.reset_frame_on_stop);
        } else {
            const animation = target_char.play(
                this.action,
                this.animation,
                true,
                this.frame_rate,
                this.loop,
                this.reset_before_start
            );
            if (!animation) {
                this.data.logger.log_message(
                    `'char_animation_play' event: Animation name '${animation.name}' is not valid or doesn't exist.`
                );
                return;
            }
            if (!animation.loop) {
                ++this.data.game_event_manager.events_running_count;
                const previous_force_idle_action_in_event = target_char.force_idle_action_in_event;
                target_char.force_idle_action_in_event = false;
                animation.onComplete.addOnce(() => {
                    target_char.force_idle_action_in_event = previous_force_idle_action_in_event;
                    --this.data.game_event_manager.events_running_count;
                    this.finish_events.forEach(event => event.fire(this.origin_npc));
                });
            }
        }
    }

    _destroy() {
        this.finish_events.forEach(event => event?.destroy());
    }
}
