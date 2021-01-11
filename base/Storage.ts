import {GoldenSun} from "./GoldenSun";

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
    private data: GoldenSun;
    private internal_storage: {[key_name: string]: StorageRecord} = {};

    constructor(data) {
        this.data = data;
    }

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
            }
            this.add(key, type, value);
        }
    }

    add(key_name: string, type: storage_types, initial_value: any = null, callbacks: Function[] = []) {
        this.internal_storage[key_name] = {
            key_name: key_name,
            type: type,
            value: initial_value,
            callbacks: callbacks === undefined ? [] : callbacks,
        };
    }

    get(key_name: string) {
        return this.internal_storage[key_name].value;
    }

    set(key_name: string, value: any) {
        this.internal_storage[key_name].value = value;
        this.internal_storage[key_name].callbacks.forEach(callback => callback());
    }

    remove(key_name: string) {
        delete this.internal_storage[key_name];
    }
}
