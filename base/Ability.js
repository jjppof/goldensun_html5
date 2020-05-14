export class Ability {
    constructor(
        key_name,
        name,
        description,
        type,
        element,
        battle_target,
        range,
        pp_cost,
        ability_power,
        effects_outside_battle,
        is_battle_psynergy,
        is_field_psynergy,
        ability_effect_key,
        ability_type_key,
        battle_animation_key,
        icon_path
    ) {
        this.key_name = key_name;
        this.name = name;
        this.description = description;
        this.type = type;
        this.element = element;
        this.battle_target = battle_target;
        this.range = range;
        this.pp_cost = pp_cost;
        this.ability_power = ability_power;
        this.effects_outside_battle = effects_outside_battle;
        this.is_battle_psynergy = is_battle_psynergy;
        this.is_field_psynergy = is_field_psynergy;
        this.ability_effect_key = ability_effect_key;
        this.ability_type_key = ability_type_key;
        this.battle_animation_key = battle_animation_key;
        this.icon_path = icon_path;
    }

    load_assets(game, load_callback) {
        game.load.image(this.key_name + '_ability_icon', this.icon_path).onLoadComplete.addOnce(load_callback);
        game.load.start();
    }
}