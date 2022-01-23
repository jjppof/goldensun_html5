import {GameEvent, event_types} from "./GameEvent";
import {Djinn, djinn_status} from "../Djinn";
import {MainChar} from "../MainChar";
import {NPC} from "../NPC";

export class DjinnSetStatusEvent extends GameEvent {
    /** INPUT. The key for the Djinn whose status we are setting */
    private djinn_key: string;
    /** The key for the Djinn whose status we are setting */
    private djinn: Djinn;
    /** INPUT. The key for the mainChar. */
    private character_key: string;
    /** The MainChar who has the Djinn. */
    private character: MainChar;
    /** INPUT. The key for the status to set */
    private status_key: string;
    /** The status to set */
    private status: djinn_status;
    /** INPUT. The list of game events to be fired on this event end. */
    private finish_events: GameEvent[] = [];

    constructor(game, data, active, key_name, djinn_key, character_key, status_key, finish_events) {
        super(game, data, event_types.DJINN_SET_STATUS, active, key_name);

        //djinn
        this.djinn_key = djinn_key;
        this.djinn = this.data.info.djinni_list[this.djinn_key];
        //character
        this.character_key = character_key;
        this.character = this.data.info.main_char_list[this.character_key];
        //status
        this.status_key = status_key;
        this.status = this.status_key as djinn_status;

        if (finish_events !== undefined) {
            finish_events.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info);
                this.finish_events.push(event);
            });
        }
    }

    protected _fire(oringin_npc: NPC): void {
        if (!this.active) return;
        this.origin_npc = oringin_npc;
        ++this.data.game_event_manager.events_running_count;

        if (this.status !== undefined && this.djinn !== undefined && this.character != undefined) {
            this.djinn.set_status(this.status, this.character);
        }
        this.finish();
    }
    /**
     * Finishes this event by reducing GameEventManager.events_running_count and firing final events.
     */
    finish() {
        --this.data.game_event_manager.events_running_count;
        this.finish_events.forEach(event => event.fire(this.origin_npc));
    }
    /**
     * Unsets this event.
     */
    destroy(): void {
        this.finish_events.forEach(event => event.destroy());
        this.origin_npc = null;
        this.character = null;
        this.active = false;
    }
}
