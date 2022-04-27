import {GameEvent, event_types} from "./GameEvent";

export class TintMapEvent extends GameEvent {
    private finish_events: GameEvent[];
    private color_key: number;
    private intensity: number;
    private gray: number;
    private duration: number;

    constructor(game, data, active, key_name, color_key, intensity, gray, duration, finish_events) {
        super(game, data, event_types.TINT_MAP, active, key_name);
        this.color_key = color_key;
        this.intensity = intensity;
        this.gray = gray;
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

        const color_key = this.color_key ?? this.data.map.color_filter.colorize;
        const intensity = this.intensity ?? this.data.map.color_filter.colorize_intensity;
        const gray = this.gray ?? this.data.map.color_filter.gray;

        this.data.map.color_filter.colorize = color_key;

        if (this.duration > 30) {
            let promise_resolve;
            const promise = new Promise(resolve => (promise_resolve = resolve));
            this.game.add
                .tween(this.data.map.color_filter)
                .to(
                    {
                        colorize_intensity: intensity,
                        gray: gray,
                    },
                    this.duration,
                    Phaser.Easing.Linear.None,
                    true
                )
                .onComplete.addOnce(promise_resolve);

            await promise;
        } else {
            this.data.map.color_filter.colorize_intensity = intensity;
            this.data.map.color_filter.gray = gray;
        }

        if (intensity === 0) {
            this.data.map.color_filter.colorize = -1;
        }

        --this.data.game_event_manager.events_running_count;
        this.finish_events.forEach(event => event.fire(this.origin_npc));
    }

    _destroy() {
        this.finish_events.forEach(event => event.destroy());
    }
}
