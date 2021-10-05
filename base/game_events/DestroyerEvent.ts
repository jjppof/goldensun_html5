import {GameEvent, event_types} from "./GameEvent";

export class DestroyerEvent extends GameEvent {
    private target_event_key: string;

    //these were the basic things that every child class had, so I took it.
    //though the destroyer is just like a trigger, press it and it kills an event.
    //it only needs target_event_key imo.
    constructor(game, data, active, key_name, target_event_key) {
        super(game, data, event_types.DESTROYER, active, key_name);
        this.target_event_key = target_event_key;
    }

    _fire() {
        if (!this.active) return;
        if (this.target_event_key !== undefined) {
            let target_event = GameEvent.get_labeled_event(this.target_event_key);
            target_event.destroy();
            this.destroy();
            //destroying cause it served the purpose, can now DIE. *flatlines*
        } else {
            console.warn("The Target event is undefined.");
        }
    }

    destroy() {
        this.origin_npc = null;
        this.active = false;
        this.target_event_key = null;
    }
}
