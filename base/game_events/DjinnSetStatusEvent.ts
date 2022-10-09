import {GameEvent, event_types} from "./GameEvent";
import {Djinn, djinn_status} from "../Djinn";

export class DjinnSetStatusEvent extends GameEvent {
    /** INPUT. The key for the Djinn whose status we are setting */
    private djinn_key: string;
    /** The key for the Djinn whose status we are setting */
    private djinn: Djinn;
    /** INPUT. The key for the status to set */
    private status_key: string;
    /** The status to set */
    private status: djinn_status;

    constructor(game, data, active, key_name, keep_reveal, djinn_key, status_key) {
        super(game, data, event_types.DJINN_SET_STATUS, active, key_name, keep_reveal);

        //djinn
        this.djinn_key = djinn_key;
        this.djinn = this.data.info.djinni_list[this.djinn_key];
        //status
        this.status_key = status_key;
        this.status = this.status_key as djinn_status;
    }

    protected _fire(): void {
        if (this.status !== undefined && this.djinn !== undefined) {
            this.djinn.set_status(this.status);
        }
    }

    /**
     * Unsets this event.
     */
    _destroy(): void {
        this.djinn = null;
    }
}
