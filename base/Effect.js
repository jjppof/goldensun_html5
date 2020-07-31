import { variation, elements } from "../utils.js"

export const effect_types = {
    MAX_HP: "max_hp",
    MAX_PP: "max_pp",
    ATTACK: "attack",
    DEFENSE: "defense",
    AGILITY: "agility",
    LUCK: "luck",
    POWER: "power",
    RESIST: "resist",
    CURRENT_HP: "current_hp",
    CURRENT_PP: "current_pp",
    HP_RECOVERY: "hp_recovery",
    PP_RECOVERY: "pp_recovery",
    CRITICALS: "criticals",
    COUNTER_STRIKE: "counter_strike",
    TEMPORARY_STATUS: "temporary_status",
    PERMANENT_STATUS: "permanent_status",
    TURNS: "turns",
    ENCOUNTERS: "encounters",
    FLEE: "flee",
    END_THE_ROUND: "end_the_round",
    ABILITY_POWER: "ability_power",
    SET_DJINN: "set_djinn",
    DAMAGE_MODIFIER: "damage_modifier"
};

export const effect_names = {
    [effect_types.MAX_HP]: "HP",
    [effect_types.MAX_PP]: "PP",
    [effect_types.ATTACK]: "Attack",
    [effect_types.DEFENSE]: "Defense",
    [effect_types.AGILITY]: "Agility",
    [effect_types.LUCK]: "Luck",
    [effect_types.POWER]: "Power",
    [effect_types.RESIST]: "Resist"
};

export const effect_operators = {
    PLUS: "plus",
    MINUS: "minus",
    TIMES: "times",
    DIVIDE: "divide"
};

export const effect_usages = {
    NOT_APPLY: "not_apply",
    ON_USE: "on_use",
    ON_TAKE: "on_take",
    BATTLE_ROUND_START: "battle_round_start",
    BATTLE_ROUND_END: "battle_round_end",
    PLAYER_TURN_START: "player_turn_start",
    PLAYER_TURN_END: "player_turn_end"
};

export const quantity_types = {
    VALUE: "value",
    TARGET: "target",
    CASTER: "caster"
};

export const effect_msg = {
    aura: target => `A protective aura encircles ${target.name}!`
};

export class Effect {
    constructor(
        type,
        quantity,
        operator,
        effect_owner_instance,
        quantity_is_absolute, //default: false
        rate, //default: 1.0
        chance, //default: 1.0
        attribute, //default: no_element
        add_status, //boolean. If false, remove status
        status_key_name,
        turns_quantity,
        variation_on_final_result,
        damage_formula_key_name, //instead of using the operator, uses a damage formula. Return value is not used.
        usage,
        on_caster, //boolean. default false. If true, the caster will take the effect.
        quantity_type, //default is "value". If it's target or caster, the "quantity" arg must be an effect_type instead of a value
        relative_to_property, //make the calculation based on a player property
        effect_msg,
        char
    ) {
        this.type = type;
        this.quantity = quantity;
        this.operator = operator;
        this.effect_owner_instance = effect_owner_instance;
        this.quantity_is_absolute = quantity_is_absolute === undefined ? false : quantity_is_absolute;
        this.rate = rate === undefined ? 1.0 : rate;
        this.chance = chance === undefined ? 1.0 : chance;
        this.attribute = attribute === undefined ? elements.NO_ELEMENT : attribute;
        this.add_status = add_status;
        this.status_key_name = status_key_name;
        this.turns_quantity = turns_quantity;
        this.turn_count = turns_quantity;
        this.variation_on_final_result = variation_on_final_result === undefined ? false : variation_on_final_result;
        this.damage_formula_key_name = damage_formula_key_name;
        this.usage = usage === undefined ? effect_usages.NOT_APPLY : usage;
        this.on_caster = on_caster === undefined ? false : on_caster;
        this.quantity_type = quantity_type === undefined ? quantity_types.VALUE : quantity_type;
        this.relative_to_property = relative_to_property;
        this.effect_msg = effect_msg;
        this.char = char;
    }

    static apply_operator(a, b, operator) {
        switch (operator) {
            case effect_operators.PLUS: return a + b;
            case effect_operators.MINUS: return a - b;
            case effect_operators.TIMES: return a * b;
            case effect_operators.DIVIDE: return a / b;
        }
    }

    apply_general_value(property, direct_value) {
        const before_value = property !== undefined ? this.char[property] : direct_value;
        if (Math.random() >= this.chance) {
            return {
                before: before_value,
                after: before_value
            };
        }
        let after_value;
        if (this.quantity_is_absolute) {
            if (property !== undefined) {
                this.char[property] = this.quantity;
            }
            after_value = this.quantity;
        } else {
            let value = this.quantity;
            value *= this.rate;
            if (this.variation_on_final_result) {
                value += variation();
            }
            let value_to_use;
            if (property !== undefined) {
                value_to_use = this.char[this.relative_to_property !== undefined ? this.relative_to_property : property];
            } else {
                value_to_use = direct_value;
            }
            const result = Effect.apply_operator(value_to_use, value, this.operator) | 0;
            if (property !== undefined) {
                this.char[property] = result;
            }
            after_value = result;
        }
        return {
            before: before_value,
            after: after_value
        };
    }

    static preview_value_applied(effect_obj, base_value) {
        if (effect_obj.quantity_is_absolute) {
            return effect_obj.quantity;
        } else {
            let value = effect_obj.quantity;
            if (!effect_obj.rate) {
                effect_obj.rate = 1.0;
            }
            value *= effect_obj.rate;
            value = parseInt(value);
            return Effect.apply_operator(base_value, value, effect_obj.operator);
        }
    }

    apply_effect(direct_value) {
        switch (this.type) {
            case effect_types.MAX_HP:
                return this.apply_general_value("max_hp");
            case effect_types.HP_RECOVERY:
                return this.apply_general_value("hp_recovery");
            case effect_types.MAX_PP:
                return this.apply_general_value("max_pp");
            case effect_types.PP_RECOVERY:
                return this.apply_general_value("pp_recovery");
            case effect_types.ATTACK:
                return this.apply_general_value("atk");
            case effect_types.DEFENSE:
                return this.apply_general_value("def");
            case effect_types.AGILITY:
                return this.apply_general_value("agi");
            case effect_types.LUCK:
                return this.apply_general_value("luk");
            case effect_types.CURRENT_HP:
                return this.apply_general_value("current_hp");
            case effect_types.CURRENT_PP:
                return this.apply_general_value("current_pp");
            case effect_types.POWER:
                return this.apply_general_value(this.attribute + "_power_current");
            case effect_types.RESIST:
                return this.apply_general_value(this.attribute + "_resist_current");
            case effect_types.TURNS:
                this.turn_count = 1;
                return this.apply_general_value("turns");
            case effect_types.PERMANENT_STATUS:
                if (this.add_status) {
                    this.char.add_permanent_status(this.status_key_name);
                } else {
                    this.char.remove_permanent_status(this.status_key_name);
                }
                return;
            case effect_types.TEMPORARY_STATUS:
                if (this.add_status) {
                    this.char.add_temporary_status(this.status_key_name);
                } else {
                    this.char.remove_temporary_status(this.status_key_name);
                }
                return;
            case effect_types.DAMAGE_MODIFIER:
                return this.apply_general_value(undefined, direct_value);
        }
    }
}