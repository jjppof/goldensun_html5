import { Map } from "../base/Map.js";

export let maps = {};

export function initialize_maps(maps_db) {
    for (let i = 0; i < maps_db.length; ++i) {
        const map_data = maps_db[i];
        maps[map_data.key_name] = new Map(
            map_data.name,
            map_data.key_name,
            map_data.tileset_key_name,
            map_data.collision_key_names,
            map_data.tileset_files.image,
            map_data.tileset_files.json,
            map_data.collision_files
        );
    }
}

export function load_maps(game, resolve){
    for (let map in maps) {
        maps[map].load_map_assets(game, true, resolve);
    }
}