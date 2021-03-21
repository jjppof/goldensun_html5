import {GameEvent, event_types, EventValue} from "./GameEvent";
import * as _ from "lodash";
import {NPC} from "../NPC";
import {Djinn} from "../Djinn";
import {base_actions} from "../utils";
import {MainChar} from "../MainChar";

export class DjinnGetEvent extends GameEvent {
    private djinn: Djinn;
    private finish_events: GameEvent[] = [];

    constructor(game, data, active, djinn_key, finish_events) {
        super(game, data, event_types.DJINN_GET, active);
        this.djinn = this.data.info.djinni_list[djinn_key];

        finish_events?.forEach(event_info => {
            const event = this.data.game_event_manager.get_event_instance(event_info);
            this.finish_events.push(event);
        });
    }

    finish() {
        this.origin_npc.toggle_active(false);
        MainChar.add_djinn_to_party(this.data.info.party_data, this.djinn);
        this.data.game_event_manager.force_idle_action = true;
        this.data.hero.play(base_actions.IDLE);
        --this.data.game_event_manager.events_running_count;
        this.finish_events.forEach(event => event.fire(this.origin_npc));
    }

    _fire(oringin_npc: NPC) {
        if (!this.active) return;
        ++this.data.game_event_manager.events_running_count;
        this.origin_npc = oringin_npc;
        this.data.game_event_manager.force_idle_action = false;
        this.finish();
    }
}
