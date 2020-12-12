import {Map} from "../Map";

export function initialize_maps(game, data, maps_db, load_promise_resolve) {
    let maps = {};
    for (let i = 0; i < maps_db.length; ++i) {
        const map_data = maps_db[i];
        maps[map_data.key_name] = new Map(
            game,
            data,
            map_data.name,
            map_data.key_name,
            map_data.tileset_key_name,
            map_data.collision_key_names,
            map_data.tileset_files.image,
            map_data.tileset_files.json,
            map_data.collision_files,
            map_data.lazy_load,
            map_data.collision_embedded,
            map_data.bgm?.key,
            map_data.bgm?.path
        );
    }
    let load_promises = [];
    for (let map in maps) {
        if (maps[map].lazy_load) continue;
        let load_map_promise_resolve;
        const load_map_promise = new Promise(resolve => {
            load_map_promise_resolve = resolve;
        });
        load_promises.push(load_map_promise);
        maps[map].load_map_assets(true, load_map_promise_resolve);
    }
    Promise.all(load_promises).then(load_promise_resolve);
    return maps;
}
