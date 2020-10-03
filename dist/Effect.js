import { variation, elements } from "./utils.js"

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
    DAMAGE_MODIFIER: "damage_modifier",
    DAMAGE_INPUT: "damage_input"
};

export const effect_type_stat = {
    [effect_types.MAX_HP]: "max_hp",
    [effect_types.MAX_PP]: "max_pp",
    [effect_types.ATTACK]: "atk",
    [effect_types.DEFENSE]: "def",
    [effect_types.AGILITY]: "agi",
    [effect_types.LUCK]: "luk",
    [effect_types.CURRENT_HP]: "current_hp",
    [effect_types.CURRENT_PP]: "current_pp"
}

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

export const effect_msg = {
    aura: target => `A protective aura encircles ${target.name}!`,
    double: () => `And it got doubled!`,
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
        relative_to_property, //make the calculation based on a player property
        sub_effect,
        effect_msg,
        show_msg,
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
        this.relative_to_property = relative_to_property;
        this.effect_msg = effect_msg;
        this.show_msg = show_msg === undefined ? true : show_msg;
        this.char = char;
        this.sub_effect = sub_effect;
        if (this.sub_effect !== undefined) {
            this.init_sub_effect();
        }
    }

    static apply_operator(a, b, operator) {
        switch (operator) {
            case effect_operators.PLUS: return a + b;
            case effect_operators.MINUS: return a - b;
            case effect_operators.TIMES: return a * b;
            case effect_operators.DIVIDE: return a / b;
        }
    }

    init_sub_effect() {
        this.sub_effect.quantity_is_absolute = this.sub_effect.quantity_is_absolute === undefined ? false : this.sub_effect.quantity_is_absolute;
        this.sub_effect.rate = this.sub_effect.rate === undefined ? 1.0 : this.sub_effect.rate;
        this.sub_effect.chance = this.sub_effect.chance === undefined ? 1.0 : this.sub_effect.chance;
        this.sub_effect.attribute = this.sub_effect.attribute === undefined ? elements.NO_ELEMENT : this.sub_effect.attribute;
        this.sub_effect.variation_on_final_result = this.sub_effect.variation_on_final_result === undefined ? false : this.sub_effect.variation_on_final_result;
        this.sub_effect.usage = this.sub_effect.usage === undefined ? effect_usages.NOT_APPLY : this.sub_effect.usage;
        this.sub_effect.on_caster = this.sub_effect.on_caster === undefined ? false : this.sub_effect.on_caster;
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

    apply_subeffect(property, value) {
        if (Math.random() < this.sub_effect.chance) {
            if (this.sub_effect.quantity_is_absolute) {
                this.char[property] = value;
            } else {
                value *= this.sub_effect.rate;
                if (this.sub_effect.variation_on_final_result) {
                    value += variation();
                }
                this.char[property] = Effect.apply_operator(this.char[property], value, this.sub_effect.operator) | 0;
            }
        }
        return this.char[property];
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
            value = value | 0;
            return Effect.apply_operator(base_value, value, effect_obj.operator);
        }
    }

    check_caps(current_prop, max_prop, min_value, result_obj) {
        if (this.char[current_prop] > this.char[max_prop]) {
            if (result_obj) {
                result_obj.after = this.char[max_prop];
            }
            this.char[current_prop] = this.char[max_prop];
        } else if (this.char[current_prop] < min_value) {
            if (result_obj) {
                result_obj.after = min_value;
            }
            this.char[current_prop] = min_value;
        }
    }

    apply_effect(direct_value) {
        switch (this.type) {
            case effect_types.MAX_HP:
            case effect_types.MAX_PP:
            case effect_types.ATTACK:
            case effect_types.DEFENSE:
            case effect_types.AGILITY:
            case effect_types.LUCK:
                return this.apply_general_value(effect_type_stat[this.type]);
            case effect_types.HP_RECOVERY:
                return this.apply_general_value("hp_recovery");
            case effect_types.PP_RECOVERY:
                return this.apply_general_value("pp_recovery");
            case effect_types.CURRENT_HP:
                const result_current_hp = this.apply_general_value("current_hp");
                this.check_caps("current_hp", "max_hp", 0, result_current_hp);
                return result_current_hp
            case effect_types.CURRENT_PP:
                const result_current_pp = this.apply_general_value("current_pp");
                this.check_caps("current_pp", "max_pp", 0, result_current_pp);
                return result_current_pp
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
            case effect_types.DAMAGE_INPUT:
                let result = this.apply_general_value(undefined, direct_value);
                const stat = effect_type_stat[this.sub_effect.type];
                result.before = this.char[stat];
                result.after = this.apply_subeffect(stat, result.after);
                switch(this.sub_effect.type) {
                    case effect_types.CURRENT_HP:
                        this.check_caps("current_hp", "max_hp", 0, result);
                        break;
                    case effect_types.CURRENT_PP:
                        this.check_caps("current_pp", "max_pp", 0, result);
                        break;
                }
                return result;
        }
    }
}