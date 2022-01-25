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

    constructor(game, data, active, key_name, djinn_key, character_key, status_key) {
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
    }

    protected _fire(oringin_npc: NPC): void {
        if (!this.active) return;
        this.origin_npc = oringin_npc;

        if (this.status !== undefined && this.djinn !== undefined && this.character != undefined) {
            this.djinn.set_status(this.status, this.character);
        }
    }

    /**
     * Unsets this event.
     */
    destroy(): void {
        this.origin_npc = null;
        this.character = null;
        this.active = false;
    }
}
