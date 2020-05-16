export const effect_types = {
    MAX_HP: "max_hp",
    HP_RECOVERY: "hp_recovery",
    MAX_PP: "max_pp",
    PP_RECOVERY: "pp_recovery",
    ATTACK: "attack",
    DEFENSE: "defense",
    AGILITY: "agility",
    LUCK: "luck",
    POWER: "power",
    RESIST: "resist",
    CRITICALS: "criticals",
    COUNTER_STRIKE: "counter_strike",
    TEMPORARY_STATUS: "temporary_status",
    PERMANENT_STATUS: "permanent_status",
    TURNS: "turns",
    ENCOUNTERS: "encounters",
    FLEE: "flee",
    SPEED: "speed",
    END_THE_ROUND: "end_the_round",
    ABILITY_POWER: "ability_power"
}

export const effect_operators = {
    PLUS: "plus",
    MINUS: "minus",
    TIMES: "times",
    DIVIDE: "divide"
}

export class Effect {
    constructor(
        type,
        quantity,
        quantity_is_absolute,
        operator,
        rate_or_chance,
        attribute,
        is_inflict_effect,
        status_key_name,
        turns_quantity,
    ) {
        this.type = type;
        this.quantity = quantity;
        this.quantity_is_absolute = quantity_is_absolute;
        this.operator = operator;
        this.rate_or_chance = rate_or_chance;
        this.attribute = attribute;
        this.is_inflict_effect = is_inflict_effect;
        this.status_key_name = status_key_name;
        this.turns_quantity = turns_quantity;
    }
}