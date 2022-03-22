import { GoldenSun } from "./GoldenSun";
import { RawStorageRecord } from "./Storage";

type SnapshotData = {
    storage_data: {[key_name: string]: RawStorageRecord["value"]},
    members: [{
        
    }];
    coins: number;
    random_battle_extra_rate: number;
    game_tickets: {
        coins_remaining: number;
        tickets_bought: number;
    };
    visited_shops: string[];
    psynergies_shortcuts: {
        L: {main_char: string; ability: string};
        R: {main_char: string; ability: string};
    };
};

export class Snapshot {
    private data: GoldenSun;

    constructor(data: GoldenSun) {
        this.data = data;
    }
}