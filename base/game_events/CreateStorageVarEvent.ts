import {storage_types, RawStorageRecord} from "../Storage";
import {GameEvent, event_types} from "./GameEvent";

export class CreateStorageVarEvent extends GameEvent {
    private var_name: string;
    private initial_value: RawStorageRecord["value"];

    constructor(game, data, active, key_name, var_name, initial_value) {
        super(game, data, event_types.CREATE_STORAGE_VAR, active, key_name);
        this.var_name = var_name;
        this.initial_value = initial_value;
    }

    _fire() {
        let type: storage_types;
        switch (typeof this.initial_value) {
            case "boolean":
                type = storage_types.BOOLEAN;
                break;
            case "number":
                type = storage_types.NUMBER;
                break;
            case "string":
                type = storage_types.STRING;
                break;
            case "object":
                type = storage_types.POSITION;
                break;
            default:
                console.warn(`Invalid data type for "${this.var_name}" storage key.`);
                return;
        }
        this.data.storage.add(this.var_name, type, this.initial_value);
    }

    _destroy() {}
}
