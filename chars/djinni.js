import { Djinn } from '../base/Djinn.js';

export let djinni_list = {};

export function initialize_djinni(djinni_db) {
    for (let i = 0; i < djinni_db.length; ++i) {
        const djinn_data = djinni_db[i];
        djinni_list[djinn_data.key_name] = new Djinn(
            djinn_data.key_name,
            djinn_data.name,
            djinn_data.description,
            djinn_data.element,
            djinn_data.ability_key_name,
            djinn_data.hp_boost,
            djinn_data.pp_boost,
            djinn_data.atk_boost,
            djinn_data.def_boost,
            djinn_data.agi_boost,
            djinn_data.luk_boost,
            i
        );
    }
}