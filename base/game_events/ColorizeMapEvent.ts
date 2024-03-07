import {GameEvent, event_types} from "./GameEvent";

export class ColorizeMapEvent extends GameEvent {
    private finish_events: GameEvent[];
    private color_key: number;
    private intensity: number;
    private gray: number;
    private duration: number;
    private layer: string;
    private detach_transition: boolean;
    private _prev_sig_binding: Phaser.SignalBinding;

    constructor(
        game,
        data,
        active,
        key_name,
        keep_reveal,
        keep_custom_psynergy,
        color_key,
        intensity,
        gray,
        duration,
        finish_events,
        layer,
        detach_transition
    ) {
        super(game, data, event_types.COLORIZE_MAP, active, key_name, keep_reveal, keep_custom_psynergy);
        this.color_key = color_key;
        this.intensity = intensity;
        this.gray = gray;
        this.duration = duration ?? 500;
        this.layer = layer ?? null;
        this.finish_events = [];
        this.detach_transition = detach_transition ?? false;
        this._prev_sig_binding = null;
        if (finish_events !== undefined) {
            finish_events.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info, this.type, this.origin_npc);
                this.finish_events.push(event);
            });
        }
    }

    async _fire() {
        if (!this.detach_transition) {
            ++this.data.game_event_manager.events_running_count;
        }

        const color_key = this.color_key ?? this.data.map.colorize_filter.color;
        const intensity = this.intensity ?? this.data.map.colorize_filter.intensity;
        const gray = this.gray ?? this.data.map.gray_filter.intensity;

        this.data.map.colorize_filter.color = color_key;

        if (gray) {
            this.data.map.manage_filter(this.data.map.gray_filter, true, this.layer);
        }
        if (intensity) {
            this.data.map.manage_filter(this.data.map.colorize_filter, true, this.layer);
        }

        const reset_gray_filter = () => {
            if (this.data.map.gray_filter.intensity === 0) {
                this.data.map.manage_filter(this.data.map.gray_filter, false, this.layer);
            }
        };

        const reset_colorize_filter = () => {
            if (this.data.map.colorize_filter.intensity === 0) {
                this.data.map.colorize_filter.color = -1;
                this.data.map.manage_filter(this.data.map.colorize_filter, false, this.layer);
            }
        };

        if (this.duration > 30) {
            let promise_resolve;
            const promise = new Promise(resolve => (promise_resolve = resolve));
            if (Math.abs(this.data.map.gray_filter.intensity - gray) > 1e-3) {
                if (this.data.map.filter_tween.gray) {
                    this.data.map.filter_tween.gray.stop(false);
                    this.data.map.filter_tween.gray = null;
                }
                this.data.map.filter_tween.gray = this.game.add.tween(this.data.map.gray_filter).to(
                    {
                        intensity: gray,
                    },
                    this.duration,
                    Phaser.Easing.Linear.None,
                    true
                );
                this.data.map.filter_tween.gray.onComplete.addOnce(() => {
                    this.data.map.filter_tween.gray = null;
                    reset_gray_filter();
                });
            }
            if (this.data.map.filter_tween.colorize) {
                this.data.map.filter_tween.colorize.stop(false);
                const listener = this._prev_sig_binding?.getListener();
                if (listener) {
                    listener();
                }
                this.data.map.filter_tween.colorize = null;
                this._prev_sig_binding = null;
            }
            if (Math.abs(this.data.map.colorize_filter.intensity - intensity) > 1e-3) {
                this.data.map.filter_tween.colorize = this.game.add.tween(this.data.map.colorize_filter).to(
                    {
                        intensity: intensity,
                    },
                    this.duration,
                    Phaser.Easing.Linear.None,
                    true
                );
                this._prev_sig_binding = this.data.map.filter_tween.colorize.onComplete.addOnce(() => {
                    this.data.map.filter_tween.colorize = null;
                    this._prev_sig_binding = null;
                    reset_colorize_filter();
                    promise_resolve();
                });
            } else {
                promise_resolve();
            }

            await promise;
        } else {
            this.data.map.colorize_filter.intensity = intensity;
            reset_colorize_filter();
            this.data.map.gray_filter.intensity = gray;
            reset_gray_filter();
        }

        if (!this.detach_transition) {
            --this.data.game_event_manager.events_running_count;
            this.finish_events.forEach(event => event.fire(this.origin_npc));
        }
    }

    _destroy() {
        this.finish_events.forEach(event => event?.destroy());
    }
}
