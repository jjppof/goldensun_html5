import {callback_call_types} from "../Storage";
import {GameEvent, event_types} from "./GameEvent";

export class StorageChangeEvent extends GameEvent {
    private keys: string[];
    private change_events: GameEvent[];
    private callback_call_type: callback_call_types;
    private callback_ids: {[state_key: string]: number[]};

    constructor(
        game,
        data,
        active,
        key_name,
        keep_reveal,
        keep_custom_psynergy,
        keys,
        callback_call_type,
        change_events
    ) {
        super(game, data, event_types.STORAGE_CHANGE, active, key_name, keep_reveal, keep_custom_psynergy);
        this.keys = Array.isArray(keys) ? keys : [keys];
        this.callback_call_type = callback_call_type ?? callback_call_types.ONCE;
        this.change_events = [];
        change_events.forEach(event_info => {
            const event = this.data.game_event_manager.get_event_instance(event_info, this.type, this.origin_npc);
            this.change_events.push(event);
        });
        this.callback_ids = this.keys.reduce((acc, this_key) => {
            acc[this_key] = [];
            return acc;
        }, {});
    }

    _fire() {
        this.keys.forEach(key => {
            const id = this.data.storage.add_callback(
                key,
                () => {
                    this.change_events.forEach(event => event.fire(this.origin_npc));
                },
                this.callback_call_type
            );
            this.callback_ids[key].push(id);
        });
    }

    _destroy() {
        for (let state_key in this.callback_ids) {
            const ids = this.callback_ids[state_key];
            ids.forEach(id => this.data.storage.remove_callback(state_key, id));
        }
        this.callback_ids = null;
        this.change_events.forEach(event => event?.destroy());
    }
}
