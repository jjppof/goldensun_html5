import { elements } from "./MainChar.js";
import { variation } from "../utils.js"

export const effect_types = {
    MAX_HP: "max_hp",
    CURRENT_HP: "current_hp",
    HP_RECOVERY: "hp_recovery",
    MAX_PP: "max_pp",
    CURRENT_PP: "current_pp",
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

export const usages = {
    NOT_APPLY: "not_apply",
    ON_USE: "on_use",
    ON_TAKE: "on_take",
    BATTLE_PHASE_START: "battle_phase_start",
    BATTLE_PHASE_END: "battle_phase_end",
    TURN_START: "turn_start",
    TURN_END: "turn_end"
}

export const quantity_types = {
    VALUE: "value",
    TARGET: "target",
    CASTER: "caster"
}

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
        quantity_type, //default is value. If it's target or caster, the quantity arg must be an effect_type instead of a value
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
        this.variation_on_final_result = variation_on_final_result === undefined ? false : variation_on_final_result;
        this.damage_formula_key_name = damage_formula_key_name;
        this.usage = usage === undefined ? usages.NOT_APPLY : usage;
        this.on_caster = on_caster === undefined ? false : on_caster;
        this.quantity_type = quantity_type === undefined ? quantity_types.VALUE : quantity_type;
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

    apply_general_value(property) {
        if (this.quantity_is_absolute) {
            this.value = this.char[property];
            this.char[property] = this.quantity;
        } else {
            let value = this.quantity;
            value *= this.rate;
            if (this.variation_on_final_result) {
                value += variation();
            }
            value = parseInt(value);
            this.value = Effect.apply_operator(this.char[property], value, this.operator) - this.char[property];
            this.char[property] += this.value;
        }
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

    apply_effect() {
        switch (this.type) {
            case effect_types.MAX_HP:
                this.apply_general_value("max_hp");
                break;
            case effect_types.HP_RECOVERY:
                this.apply_general_value("hp_recovery");
                break;
            case effect_types.MAX_PP:
                this.apply_general_value("max_pp");
                break;
            case effect_types.PP_RECOVERY:
                this.apply_general_value("pp_recovery");
                break;
            case effect_types.ATTACK:
                this.apply_general_value("atk");
                break;
            case effect_types.DEFENSE:
                this.apply_general_value("def");
                break;
            case effect_types.AGILITY:
                this.apply_general_value("agi");
                break;
            case effect_types.LUCK:
                this.apply_general_value("luk");
                break;
            case effect_types.POWER:
                this.apply_general_value(this.attribute + "_power_current");
                break;
            case effect_types.RESIST:
                this.apply_general_value(this.attribute + "_resist_current");
                break;
        }
    }
}