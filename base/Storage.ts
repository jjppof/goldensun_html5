export enum storage_types {
    BOOLEAN = "boolean",
    NUMBER = "number",
    STRING = "string",
}

type StorageRecord = {
    key_name: string;
    type: storage_types;
    value: any;
    callbacks?: Function[];
};

export class Storage {
    private internal_storage: {[key_name: string]: StorageRecord} = {};

    add(key_name: string, type: storage_types, initial_value: any = null, callbacks: Function[] = []) {
        this.internal_storage[key_name] = {
            key_name: key_name,
            type: type,
            value: initial_value,
            callbacks: callbacks === undefined ? [] : callbacks,
        };
    }

    get(key_name: string) {
        return this.internal_storage[key_name];
    }

    set(key_name: string, value: any) {
        this.internal_storage[key_name] = value;
        this.internal_storage[key_name].callbacks.forEach(callback => callback());
    }

    remove(key_name: string) {
        delete this.internal_storage[key_name];
    }
}
