import {GameEvent, event_types} from "./GameEvent";

export class IOAnimPlayEvent extends GameEvent {
    private finish_events: GameEvent[] = [];
    private io_label: string;
    private action: string;
    private animation: string;
    private frame_rate: number;
    private loop: boolean;
    private stop_animation: boolean;
    private reset_frame_on_stop: boolean;

    constructor(
        game,
        data,
        active,
        key_name,
        keep_reveal,
        io_label,
        action,
        animation,
        frame_rate,
        loop,
        stop_animation,
        reset_frame_on_stop,
        finish_events
    ) {
        super(game, data, event_types.IO_ANIM_PLAY, active, key_name, keep_reveal);
        this.io_label = io_label;
        this.action = action;
        this.animation = animation;
        this.frame_rate = frame_rate;
        this.loop = loop;
        this.stop_animation = stop_animation ?? false;
        this.reset_frame_on_stop = reset_frame_on_stop ?? false;
        if (finish_events !== undefined) {
            finish_events.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info, this.type, this.origin_npc);
                this.finish_events.push(event);
            });
        }
    }

    async _fire() {
        const interactable_object = this.data.map.interactable_objects_label_map[this.io_label];
        if (!(this.io_label in this.data.map.interactable_objects_label_map)) {
            this.data.logger.log_message(`Game Event [${this.type}]: IO with label "${this.io_label}" doesn't exist.`);
            return;
        }
        if (this.stop_animation) {
            interactable_object.sprite.animations.currentAnim.stop(this.reset_frame_on_stop);
        } else {
            const animation = interactable_object.play(this.animation, this.action, true, this.frame_rate, this.loop);
            if (!animation.loop) {
                ++this.data.game_event_manager.events_running_count;
                animation.onComplete.addOnce(() => {
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
