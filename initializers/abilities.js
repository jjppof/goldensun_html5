import { Ability } from '../base/Ability.js';
import { MoveFieldPsynergy } from '../field_abilities/move.js';
import { FrostFieldPsynergy } from '../field_abilities/frost.js';
import { GrowthFieldPsynergy } from '../field_abilities/growth.js';

export let abilities_list = {};
export let field_abilities_list = {};

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
            ability_data.is_battle_psynergy,
            ability_data.is_field_psynergy,
            ability_data.effects,
            ability_data.ability_type_key,
            ability_data.battle_animation_key,
            ability_data.icon_path
        );
    }
    const loader = game.load.atlasJSONHash('abilities_icons', 'assets/images/icons/abilities/abilities_icons.png', 'assets/images/icons/abilities/abilities_icons.json');
    loader.onLoadComplete.addOnce(load_promise_resolve);
    game.load.start();
}

export function initialize_field_abilities(game, data) {
    field_abilities_list.move = new MoveFieldPsynergy(game, data);
    field_abilities_list.frost = new FrostFieldPsynergy(game, data);
    field_abilities_list.growth = new GrowthFieldPsynergy(game, data);
}