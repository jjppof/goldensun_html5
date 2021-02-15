import {GameEvent, event_types} from "./GameEvent";
import {NPC} from "../NPC";

export class SummonEvent extends GameEvent {
    constructor(game, data, active) {
        super(game, data, event_types.SUMMON, active);
    }

    _fire(oringin_npc: NPC) {
        if (!this.active) return;
        ++this.data.game_event_manager.events_running_count;
        this.origin_npc = oringin_npc;
        --this.data.game_event_manager.events_running_count;
    }
}
