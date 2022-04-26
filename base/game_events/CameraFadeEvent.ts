import {GameEvent, event_types} from "./GameEvent";

enum fade_types {
    IN = "in",
    OUT = "out",
}

export class CameraFadeEvent extends GameEvent {
    private finish_events: GameEvent[];
    private fade_type: fade_types;
    private duration: number;

    constructor(game, data, active, key_name, fade_type, duration, finish_events) {
        super(game, data, event_types.CAMERA_FADE, active, key_name);
        this.fade_type = fade_type;
        this.duration = duration ?? 500;

        this.finish_events = [];
        if (finish_events !== undefined) {
            finish_events.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info);
                this.finish_events.push(event);
            });
        }
    }

    async _fire() {
        ++this.data.game_event_manager.events_running_count;

        let promise_resolve;
        const promise = new Promise(resolve => (promise_resolve = resolve));
        if (this.fade_type === fade_types.IN) {
            this.game.camera.fade(undefined, this.duration, true);
            this.game.camera.onFadeComplete.addOnce(promise_resolve);
        } else if (this.fade_type === fade_types.OUT) {
            this.game.camera.flash(0x0, this.duration, true);
            this.game.camera.onFlashComplete.addOnce(promise_resolve);
        }
        await promise;

        --this.data.game_event_manager.events_running_count;
        this.finish_events.forEach(event => event.fire(this.origin_npc));
    }

    _destroy() {
        this.finish_events.forEach(event => event.destroy());
    }
}
