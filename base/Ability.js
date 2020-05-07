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
        in_battle,
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
        this.in_battle = in_battle;
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