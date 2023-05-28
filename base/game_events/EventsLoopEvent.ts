import {GameEvent, event_types} from "./GameEvent";

export class EventsLoopEvent extends GameEvent {
    private interval: number;
    private events: GameEvent[];
    private loop_timer: Phaser.Timer;

    constructor(game, data, active, key_name, keep_reveal, interval, events) {
        super(game, data, event_types.EVENTS_LOOP, active, key_name, keep_reveal);
        this.interval = interval;
        this.loop_timer = this.game.time.create(false);
        this.events = [];
        if (events !== undefined) {
            events.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info, this.type, this.origin_npc);
                this.events.push(event);
            });
        }
    }

    _fire() {
        if (this.loop_timer.running) {
            this.loop_timer.stop();
        }
        this.loop_timer.loop(this.interval, () => {
            if (this.active) {
                this.events.forEach(event => event.fire(this.origin_npc));
            } else {
                this.loop_timer.stop();
            }
        });
        this.loop_timer.start();
    }

    _destroy() {
        this.loop_timer.stop();
        this.loop_timer.destroy();
        this.events.forEach(event => event?.destroy());
    }
}
