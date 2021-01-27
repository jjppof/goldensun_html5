import {GameEvent, event_types} from "./GameEvent";

export class TimerEvent extends GameEvent {
    private duration: number;
    private time_finish_events: GameEvent[] = [];

    constructor(game, data, active, duration, time_finish_events) {
        super(game, data, event_types.TIMER, active);
        this.duration = duration;
        if (time_finish_events !== undefined) {
            time_finish_events.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info);
                this.time_finish_events.push(event);
            });
        }
    }

    fire() {
        if (!this.active) return;
        ++this.data.game_event_manager.events_running_count;
        this.game.time.events.add(this.duration, () => {
            --this.data.game_event_manager.events_running_count;
            this.time_finish_events.forEach(event => event.fire());
        });
    }
}
