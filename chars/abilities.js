import { Ability } from '../base/Ability.js';

export let abilities_list = {};

export function initialize_abilities(game, abilities_db, load_promise_resolve) {
    let load_promises = [];
    for (let i = 0; i < abilities_db.length; ++i) {
        const ability_data = abilities_db[i];
        abilities_list[ability_data.key_name] = new Ability(
            ability_data.key_name,
            ability_data.name,
            ability_data.description,
            ability_data.type,
            ability_data.element,
            ability_data.battle_target,
            ability_data.range,
            ability_data.pp_cost,
            ability_data.ability_power,
            ability_data.effects_outside_battle,
            ability_data.in_battle,
            ability_data.ability_effect_key,
            ability_data.ability_type_key,
            ability_data.battle_animation_key,
            ability_data.icon_path
        );

        let load_assets_promise_resolve;
        let load_assets_promise = new Promise(resolve => {
            load_assets_promise_resolve = resolve;
        });
        load_promises.push(load_assets_promise);
        abilities_list[ability_data.key_name].load_assets(game, load_assets_promise_resolve);
    }
    Promise.all(load_promises).then(load_promise_resolve);
}