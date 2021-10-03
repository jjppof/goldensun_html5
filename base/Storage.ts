import {GoldenSun} from "./GoldenSun";

export enum storage_types {
    BOOLEAN = "boolean",
    NUMBER = "number",
    STRING = "string",
    POSITION = "position",
}

export enum callback_call_type {
    ONCE = "once",
    MULTIPLE = "multiple",
}

type StorageRecord = {
    key_name: string;
    type: storage_types;
    value: any;
    callbacks?: {
        [id: number]: {
            callback: () => void;
            call_type: callback_call_type;
        };
    };
    callback_id_counter: number;
};

/**
 * The game storage system. This class holds the game custom states. States can hold
 * values of boolean, number, string and position (x and y) types. When setting a
 * state value, callbacks can be called in the there are some them associated.
 */
export class Storage {
    private data: GoldenSun;
    private internal_storage: {[key_name: string]: StorageRecord} = {};

    constructor(data) {
        this.data = data;
    }

    /**
     * Initializes the storage system.
     */
    init() {
        for (let key in this.data.dbs.storage_db) {
            const value = this.data.dbs.storage_db[key];
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
            }
            this.add(key, type, value);
        }
    }

    /**
     * Adds a new game state.
     * @param key_name the state unique key name.
     * @param type the type of the this state value.
     * @param initial_value the initial value of the state.
     */
    add(key_name: string, type: storage_types, initial_value: any = null) {
        this.internal_storage[key_name] = {
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
        return this.internal_storage[key_name].value;
    }

    /**
     * Sets a value of a state;
     * @param key_name the state unique key name.
     * @param value the new state value to be set.
     */
    set(key_name: string, value: any) {
        this.internal_storage[key_name].value = value;
        for (let id in this.internal_storage[key_name].callbacks) {
            const callback_obj = this.internal_storage[key_name].callbacks[id];
            callback_obj.callback();
            if (callback_obj.call_type === callback_call_type.ONCE) {
                this.remove_callback(key_name, id);
            }
        }
    }

    /**
     * Adds a callback to a state. It will be called when the value of this state change.
     * @param key_name the state unique key name.
     * @param callback the callback function.
     * @param call_type the call type of this callback. Can be "once" or "multiple".
     */
    add_callback(key_name: string, callback: () => void, call_type: callback_call_type) {
        const this_id = this.internal_storage[key_name].callback_id_counter;
        this.internal_storage[key_name].callbacks[this_id] = {
            call_type: call_type,
            callback: callback,
        };
        ++this.internal_storage[key_name].callback_id_counter;
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
