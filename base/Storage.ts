import {GoldenSun} from "./GoldenSun";

export enum storage_types {
    BOOLEAN = "boolean",
    NUMBER = "number",
    STRING = "string",
    POSITION = "position",
}

export enum callback_call_types {
    ONCE = "once",
    MULTIPLE = "multiple",
}

export type StoragePosition = {
    x: number;
    y: number;
};

export type RawStorageRecord = {
    key_name: string;
    type: storage_types;
    value: boolean | number | string | StoragePosition;
};

type StorageRecord = RawStorageRecord & {
    callbacks?: {
        [id: number]: {
            callback: () => void;
            call_type: callback_call_types;
        };
    };
    callback_id_counter: number;
};

/**
 * The game storage system. This class holds the game custom states. States can hold
 * values of boolean, number, string and position (x and y) types. When setting a
 * state value, callbacks can be called in the there are some them associated.
 * There's also in this class an engine storage for internal states management.
 * User can't control this last one.
 */
export class Storage {
    private data: GoldenSun;
    private _internal_storage: {[key_name: string]: StorageRecord} = {};
    private _engine_storage: {[key_name: string]: StorageRecord} = {};

    constructor(data) {
        this.data = data;
    }

    get internal_storage() {
        return this._internal_storage;
    }
    get engine_storage() {
        return this._engine_storage;
    }

    /**
     * Initializes the storage system.
     */
    init() {
        const snapshot = this.data.snapshot_manager.snapshot;
        for (let key in this.data.dbs.storage_db) {
            let value;
            if (snapshot?.storage_data.hasOwnProperty(key)) {
                value = snapshot.storage_data[key];
            } else if (snapshot?.engine_storage_data.hasOwnProperty(key)) {
                value = snapshot.engine_storage_data[key];
            } else {
                value = this.data.dbs.storage_db[key];
            }
            let type: storage_types;
            switch (typeof value) {
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
                    console.warn(`Invalid data type for "${key}" storage key.`);
                    continue;
            }
            this.add(key, type, value);
        }
    }

    /**
     * Adds a new game state.
     * @param key_name the state unique key name.
     * @param type the type of the this state value.
     * @param initial_value the initial value of the state.
     * @param engine_storage if true, will use engine storage instead of default storage.
     */
    add(key_name: string, type: storage_types, initial_value: RawStorageRecord["value"] = null, engine_storage: boolean = false) {
        const storage = engine_storage ? this.engine_storage : this.internal_storage;
        if (key_name in storage) {
            console.warn(`${key_name} already defined in game storage.`);
            return;
        }
        storage[key_name] = {
            key_name: key_name,
            type: type,
            value: initial_value,
            callbacks: {},
            callback_id_counter: 0,
        };
    }

    /**
     * Gets the storage object of a state.
     * @param key_name the state unique key name.
     * @returns returns the storage object
     */
    get_object(key_name: string) {
        return this.internal_storage[key_name];
    }

    /**
     * Gets the value of a state.
     * @param key_name the state unique key name.
     * @returns returns the state value.
     */
    get(key_name: string) {
        if (key_name in this.internal_storage) {
            return this.internal_storage[key_name].value;
        } else if (key_name in this.engine_storage) {
            return this.engine_storage[key_name].value;
        }
        return null;
    }

    /**
     * Sets a value of a state;
     * @param key_name the state unique key name.
     * @param value the new state value to be set.
     * @param engine_storage if true, will use engine storage instead of default storage.
     */
    set(key_name: string, value: RawStorageRecord["value"], engine_storage: boolean = false) {
        const storage = engine_storage ? this.engine_storage : this.internal_storage;
        storage[key_name].value = value;
        for (let id in storage[key_name].callbacks) {
            const callback_obj = storage[key_name].callbacks[id];
            callback_obj.callback();
            if (callback_obj.call_type === callback_call_types.ONCE) {
                this.remove_callback(key_name, id);
            }
        }
    }

    /**
     * Adds a callback to a state. It will be called when the value of this state change.
     * @param key_name the state unique key name.
     * @param callback the callback function.
     * @param call_type the call type of this callback. Can be "once" or "multiple".
     * @returns returns the binding id.
     */
    add_callback(key_name: string, callback: () => void, call_type: callback_call_types) {
        const this_id = this.internal_storage[key_name].callback_id_counter;
        this.internal_storage[key_name].callbacks[this_id] = {
            call_type: call_type,
            callback: callback,
        };
        ++this.internal_storage[key_name].callback_id_counter;
        return this_id;
    }

    /**
     * Removes a callback from a state.
     * @param key_name the state unique key name.
     * @param callback_id the callback id.
     */
    remove_callback(key_name: string, callback_id: number | string) {
        delete this.internal_storage[key_name].callbacks[callback_id];
    }

    /**
     * Removes a state from the internal storage.
     * @param key_name the state unique key name.
     */
    remove(key_name: string) {
        delete this.internal_storage[key_name];
    }
}
