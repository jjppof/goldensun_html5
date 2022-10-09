import {GameEvent, event_types} from "./GameEvent";

export class TimerEvent extends GameEvent {
    private duration: number;
    private finish_events: GameEvent[];

    constructor(game, data, active, key_name, keep_reveal, duration, finish_events) {
        super(game, data, event_types.TIMER, active, key_name, keep_reveal);
        this.duration = duration;
        this.finish_events = [];
        if (finish_events !== undefined) {
            finish_events.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info);
                this.finish_events.push(event);
            });
        }
    }

    _fire() {
        ++this.data.game_event_manager.events_running_count;
        this.game.time.events.add(this.duration, () => {
            --this.data.game_event_manager.events_running_count;
            this.finish_events.forEach(event => event.fire(this.origin_npc));
        });
    }

    _destroy() {
        this.finish_events.forEach(event => event.destroy());
    }
}
