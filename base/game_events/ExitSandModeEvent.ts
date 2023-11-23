import {SandFieldPsynergy} from "../field_abilities/SandFieldPsynergy";
import {GameEvent, event_types} from "./GameEvent";

export class ExitSandModeEvent extends GameEvent {
    private finish_events: GameEvent[];

    constructor(game, data, active, key_name, keep_reveal, finish_events) {
        super(game, data, event_types.EXIT_SAND_MODE, active, key_name, keep_reveal);
        this.finish_events = [];
        if (finish_events !== undefined) {
            finish_events.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info, this.type, this.origin_npc);
                this.finish_events.push(event);
            });
        }
    }

    _fire() {
        if (this.data.hero.sand_mode) {
            ++this.data.game_event_manager.events_running_count;
            (this.data.info.field_abilities_list.sand as SandFieldPsynergy).return_to_normal(() => {
                --this.data.game_event_manager.events_running_count;
                this.finish_events.forEach(event => event.fire(this.origin_npc));
            });
        }
    }

    _destroy() {
        this.finish_events.forEach(event => event?.destroy());
    }
}
