import { djinn_status } from "./Djinn";
import { GoldenSun } from "./GoldenSun";
import { GameInfo } from "./initializers/initialize_info";
import { InteractableObjects } from "./interactable_objects/InteractableObjects";
import { ItemSlot } from "./MainChar";
import { npc_movement_types } from "./NPC";
import { permanent_status, Player } from "./Player";
import { RawStorageRecord } from "./Storage";

type SnapshotData = {
    storage_data: {[key_name: string]: RawStorageRecord["value"]},
    members: [{
        key_name: string,
        extra_stats: Player["extra_stats"],
        permanent_status: permanent_status[],
        learnt_abilities: string[],
        items: ItemSlot[],
        djinn: [{
            key_name: string,
            status: djinn_status,
            recovery_turn: number
        }]
    }];
    coins: number;
    random_battle_extra_rate: number;
    game_tickets: GameInfo["party_data"]["game_tickets"];
    visited_shops: string[];
    psynergies_shortcuts: {
        L: {main_char: string; ability: string};
        R: {main_char: string; ability: string};
    };
    summons: [{
        key_name: string,
        available: boolean
    }],
    artifacts_global_list: GameInfo["artifacts_global_list"],
    last_visited_town_with_sanctum: GameInfo["last_visited_town_with_sanctum"]
    map_data: {
        key_name: string,
        collision_layer: number,
        encounter_cumulator: number,
        pc: {
            direction: string,
            position: {
                x: number,
                y: number
            }
        },
        npcs: [{
            position: {
                x: number,
                y: number
            },
            action: string,
            animation: string,
            base_collision_layer: number,
            visible: boolean,
            movement_type: npc_movement_types
        }],
        ios: [{
            position: {
                x: number,
                y: number
            },
            action: string,
            animation: string,
            base_collision_layer: number;
            enable: boolean;
            entangled_by_bush: boolean;
            psynergy_casted: InteractableObjects["psynergy_casted"],
            allow_jumping_over_it: boolean,
            allow_jumping_through_it: boolean
        }],
        tile_events: [{}]
    }
};

export class Snapshot {
    private data: GoldenSun;

    constructor(data: GoldenSun) {
        this.data = data;
    }
}