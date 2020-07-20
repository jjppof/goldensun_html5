export const ability_types = {
    HEALING: "healing",
    EFFECT_ONLY: "effect_only",
    ADDED_DAMAGE: "added_damage",
    MULTIPLIER: "multiplier",
    BASE_DAMAGE: "base_damage",
    SUMMON: "summon",
    UTILITY: "utility",
    PSYNERGY_DRAIN: "psynergy_drain",
    PSYNERGY_RECOVERY: "psynergy_recovery"
}

export const ability_target_types = {
    NO_TARGET: "no_target",
    ALLY: "ally",
    ENEMY: "enemy"
}

export const diminishing_ratios = {
    STANDARD: [.1,.2,.4,.6,.8,1,.8,.6,.4,.2,.1],
    SUMMON: [.1,.2,.3,.4,.7,1,.7,.4,.3,.2,.1]
}

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
        effects,
        ability_type_key,
        battle_animation_key,
        priority_move,
        has_critical,
        crit_mult_factor,
        has_ability_unleash,
        can_be_evaded
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
        this.effects = effects;
        this.ability_type_key = ability_type_key;
        this.battle_animation_key = battle_animation_key;
        this.priority_move = priority_move ? priority_move : false;
        this.has_critical = has_critical ? has_critical : false;
        this.crit_mult_factor = crit_mult_factor !== undefined ? crit_mult_factor : 1;
        this.has_ability_unleash = has_ability_unleash ? has_ability_unleash : false;
        this.can_be_evaded = can_be_evaded ? can_be_evaded : false;
    }

    static get_diminishing_ratios(ability_type) {
        switch (ability_type) {
            case ability_types.SUMMON: return diminishing_ratios.SUMMON;
            default: return diminishing_ratios.STANDARD;
        }
    }
}