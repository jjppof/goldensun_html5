import {elements} from "./utils";

type Requirements = {[element in elements]: number};

export class Summon {
    public key_name: string;
    public index: number;
    public requirements: Requirements;
    public available: boolean;

    constructor(key_name: string, index: number, requirements: Requirements, available: boolean) {
        this.key_name = key_name;
        this.index = index;
        this.requirements = requirements;
        this.available = available;
    }
}
