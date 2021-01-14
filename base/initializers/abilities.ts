import {Ability} from "../Ability";
import {MoveFieldPsynergy} from "../field_abilities/MoveFieldPsynergy";
import {FrostFieldPsynergy} from "../field_abilities/FrostFieldPsynergy";
import {GrowthFieldPsynergy} from "../field_abilities/GrowthFieldPsynergy";
import {PoundFieldPsynergy} from "../field_abilities/PoundFieldPsynergy";

export function initialize_abilities(game, abilities_db, load_promise_resolve) {
    let abilities_list = {};
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
            ability_data.is_battle_ability,
            ability_data.is_field_psynergy,
            ability_data.effects,
            ability_data.ability_category,
            ability_data.battle_animation_key,
            ability_data.priority_move,
            ability_data.has_critical,
            ability_data.crit_mult_factor,
            ability_data.can_switch_to_unleash,
            ability_data.can_be_evaded,
            ability_data.use_diminishing_ratio,
            ability_data.msg_type,
            ability_data.affects_pp,
            ability_data.has_animation_variation,
            ability_data.can_be_mirrored
        );
    }
    const loader = game.load.atlasJSONHash(
        "abilities_icons",
        "assets/images/icons/abilities/abilities_icons.png",
        "assets/images/icons/abilities/abilities_icons.json"
    );
    loader.onLoadComplete.addOnce(load_promise_resolve);
    game.load.start();
    return abilities_list;
}

export function initialize_field_abilities(game, data) {
    return {
        move: new MoveFieldPsynergy(game, data),
        frost: new FrostFieldPsynergy(game, data),
        growth: new GrowthFieldPsynergy(game, data),
        pound: new PoundFieldPsynergy(game, data),
    };
}
