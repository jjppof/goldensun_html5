import {GameEvent, event_types} from "./GameEvent";

enum fade_types {
    IN = "in",
    OUT = "out",
}

export class CameraFadeEvent extends GameEvent {
    private finish_events: GameEvent[];
    private fade_type: fade_types;
    private duration: number;
    private color: string;

    constructor(
        game,
        data,
        active,
        key_name,
        keep_reveal,
        keep_custom_psynergy,
        fade_type,
        duration,
        color,
        finish_events
    ) {
        super(game, data, event_types.CAMERA_FADE, active, key_name, keep_reveal, keep_custom_psynergy);
        this.fade_type = fade_type;
        this.duration = duration ?? 500;
        this.color = color;

        this.finish_events = [];
        if (finish_events !== undefined) {
            finish_events.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info, this.type, this.origin_npc);
                this.finish_events.push(event);
            });
        }
    }

    async _fire() {
        ++this.data.game_event_manager.events_running_count;

        let promise_resolve;
        const promise = new Promise(resolve => (promise_resolve = resolve));
        let color = this.color ? parseInt(this.color, 16) : 0x0;
        if (this.fade_type === fade_types.OUT) {
            this.game.camera.fade(color, this.duration, true);
            this.game.camera.onFadeComplete.addOnce(promise_resolve);
        } else if (this.fade_type === fade_types.IN) {
            this.game.camera.flash(color, this.duration, true);
            this.game.camera.onFlashComplete.addOnce(promise_resolve);
        }
        await promise;

        --this.data.game_event_manager.events_running_count;
        this.finish_events.forEach(event => event.fire(this.origin_npc));
    }

    _destroy() {
        this.finish_events.forEach(event => event?.destroy());
    }
}
