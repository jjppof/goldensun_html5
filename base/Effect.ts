import {Ability, diminishing_ratios} from "./Ability";
import {Item} from "./Item";
import {
    effect_type_elemental_stat,
    effect_type_extra_stat,
    effect_type_stat,
    main_stats,
    permanent_status,
    Player,
    recovery_stats,
    temporary_status,
} from "./Player";
import {variation, elements, ordered_elements} from "./utils";
import * as _ from "lodash";
import {BattleFormulas} from "./battle/BattleFormulas";
import {MainChar} from "./MainChar";
import {Enemy} from "./Enemy";
import * as mathjs from "mathjs";

export enum effect_types {
    MAX_HP = "max_hp",
    MAX_PP = "max_pp",
    ATTACK = "attack",
    DEFENSE = "defense",
    AGILITY = "agility",
    LUCK = "luck",
    POWER = "power",
    RESIST = "resist",
    ELEMENTAL_LEVEL = "elemental_level",
    CURRENT_HP = "current_hp",
    CURRENT_PP = "current_pp",
    HP_RECOVERY = "hp_recovery",
    PP_RECOVERY = "pp_recovery",
    CRITICALS = "criticals",
    COUNTER_STRIKE = "counter_strike",
    TEMPORARY_STATUS = "temporary_status",
    PERMANENT_STATUS = "permanent_status",
    TURNS = "turns",
    ENCOUNTERS = "encounters",
    FLEE = "flee",
    END_THE_ROUND = "end_the_round",
    ABILITY_POWER = "ability_power",
    SET_DJINN = "set_djinn",
    DAMAGE_MODIFIER = "damage_modifier",
    DAMAGE_INPUT = "damage_input",
    EXTRA_MAX_HP = "extra_max_hp",
    EXTRA_MAX_PP = "extra_max_pp",
    EXTRA_ATTACK = "extra_attack",
    EXTRA_DEFENSE = "extra_defense",
    EXTRA_AGILITY = "extra_agility",
    EXTRA_LUCK = "extra_luck",
    PARALYZE = "paralyze",
}

export const effect_names: {[effect_type in effect_types]?: string} = {
    [effect_types.MAX_HP]: "HP",
    [effect_types.MAX_PP]: "PP",
    [effect_types.ATTACK]: "Attack",
    [effect_types.DEFENSE]: "Defense",
    [effect_types.AGILITY]: "Agility",
    [effect_types.LUCK]: "Luck",
    [effect_types.POWER]: "Power",
    [effect_types.RESIST]: "Resist",
    [effect_types.HP_RECOVERY]: "HP recovery",
    [effect_types.PP_RECOVERY]: "PP recovery",
};

export enum effect_operators {
    PLUS = "plus",
    MINUS = "minus",
    TIMES = "times",
    DIVIDE = "divide",
}

export const effect_operators_symbols: {[effect_operator in effect_operators]: string} = {
    [effect_operators.PLUS]: "+",
    [effect_operators.MINUS]: "-",
    [effect_operators.TIMES]: "*",
    [effect_operators.DIVIDE]: "/",
};

export enum effect_usages {
    NOT_APPLY = "not_apply",
    ON_USE = "on_use",
    ON_TAKE = "on_take",
    BATTLE_ROUND_START = "battle_round_start",
    BATTLE_ROUND_END = "battle_round_end",
    PLAYER_TURN_START = "player_turn_start",
    PLAYER_TURN_END = "player_turn_end",
}

export const effect_msg = {
    aura: target => `A protective aura encircles ${target.name}!`,
    double: () => `And it got doubled!`,
};

export class Effect {
    public type: effect_types;
    public quantity: number;
    public operator: effect_operators;
    public expression: string;
    public effect_owner_instance: Ability | Item;
    public quantity_is_absolute: boolean;
    public rate: number;
    public chance: number;
    public element: elements;
    public add_status: boolean;
    public remove_buff: boolean;
    public status_key_name: permanent_status | temporary_status;
    public turns_quantity: number;
    public turn_count: number;
    public variation_on_final_result: boolean;
    public usage: string;
    public on_caster: boolean;
    public relative_to_property: string;
    public effect_msg: string;
    public show_msg: boolean;
    public char: Player;
    public sub_effect: {
        type: effect_types;
        quantity_is_absolute: boolean;
        rate: number;
        chance: number;
        element: elements;
        variation_on_final_result: boolean;
        usage: string;
        on_caster: boolean;
        operator: effect_operators;
        expression: string;
    };

    constructor(
        type,
        quantity,
        operator,
        expression, //Used instead of operator. x is the value involved, r is random number between 0 and 1
        effect_owner_instance,
        quantity_is_absolute, //default: false
        rate, //default: 1.0
        chance, //default: 1.0
        element, //default: no_element
        add_status, //boolean. If false, remove status
        remove_buff, //boolean. If true, remove buffs
        status_key_name,
        turns_quantity,
        variation_on_final_result,
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
        this.expression = expression;
        this.effect_owner_instance = effect_owner_instance;
        this.quantity_is_absolute = quantity_is_absolute ?? false;
        this.rate = rate ?? 1.0;
        this.chance = chance ?? 1.0;
        this.element = element ?? elements.NO_ELEMENT;
        this.add_status = add_status;
        this.remove_buff = remove_buff;
        this.status_key_name = status_key_name;
        this.turns_quantity = turns_quantity ?? -1;
        this.turn_count = turns_quantity;
        this.variation_on_final_result = variation_on_final_result ?? false;
        this.usage = usage ?? effect_usages.NOT_APPLY;
        this.on_caster = on_caster ?? false;
        this.relative_to_property = relative_to_property;
        this.effect_msg = effect_msg;
        this.show_msg = show_msg ?? true;
        this.char = char;
        this.sub_effect = sub_effect;
        if (this.sub_effect !== undefined) {
            this.init_sub_effect();
        }
    }

    static apply_operator(a: number, b: number, operator: effect_operators) {
        switch (operator) {
            case effect_operators.PLUS:
                return a + b;
            case effect_operators.MINUS:
                return a - b;
            case effect_operators.TIMES:
                return a * b;
            case effect_operators.DIVIDE:
                return a / b;
        }
    }

    private init_sub_effect() {
        this.sub_effect.quantity_is_absolute = this.sub_effect.quantity_is_absolute ?? false;
        this.sub_effect.rate = this.sub_effect.rate ?? 1.0;
        this.sub_effect.chance = this.sub_effect.chance ?? 1.0;
        this.sub_effect.element = this.sub_effect.element ?? elements.NO_ELEMENT;
        this.sub_effect.variation_on_final_result = this.sub_effect.variation_on_final_result ?? false;
        this.sub_effect.usage = this.sub_effect.usage ?? effect_usages.NOT_APPLY;
        this.sub_effect.on_caster = this.sub_effect.on_caster ?? false;
    }

    private apply_general_value(property: keyof Player, direct_value?: number, sub_property?: elements | main_stats) {
        let char = this.char;
        if (sub_property !== undefined) {
            char = this.char[this.relative_to_property ?? property];
            property = sub_property as any;
        }
        const before_value: number = property !== undefined ? (char[property] as number) : direct_value;
        if (Math.random() >= this.chance) {
            return {
                before: before_value,
                after: before_value,
            };
        }
        let after_value: number;
        const quantity = Array.isArray(this.quantity) ? _.random(this.quantity[0], this.quantity[1]) : this.quantity;
        if (this.quantity_is_absolute) {
            if (property !== undefined) {
                char[property as any] = quantity;
            }
            after_value = quantity;
        } else {
            let value = quantity;
            value *= this.rate;
            if (this.variation_on_final_result) {
                value += variation();
            }
            let value_to_use;
            if (property !== undefined) {
                value_to_use = char[property];
            } else {
                value_to_use = direct_value;
            }
            let result: number;
            if (this.expression) {
                const scope = {
                    x: value_to_use,
                    r: Math.random(),
                };
                result = mathjs.evaluate(this.expression, scope) | 0;
            } else {
                result = Effect.apply_operator(value_to_use, value, this.operator) | 0;
            }
            if (property !== undefined) {
                char[property as any] = result;
            }
            after_value = result;
        }
        return {
            before: before_value,
            after: after_value,
        };
    }

    private apply_subeffect(property: string, value: number) {
        if (Math.random() < this.sub_effect.chance) {
            if (this.sub_effect.quantity_is_absolute) {
                this.char[property] = value;
            } else {
                value *= this.sub_effect.rate;
                if (this.sub_effect.variation_on_final_result) {
                    value += variation();
                }
                if (this.sub_effect.expression) {
                    const scope = {
                        x: this.char[property],
                        r: Math.random(),
                    };
                    this.char[property] = mathjs.evaluate(this.expression, scope) | 0;
                } else {
                    this.char[property] =
                        Effect.apply_operator(this.char[property], value, this.sub_effect.operator) | 0;
                }
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
            if (effect_obj.expression) {
                const scope = {
                    x: base_value,
                    r: Math.random(),
                };
                return mathjs.evaluate(effect_obj.expression, scope) | 0;
            } else {
                return Effect.apply_operator(base_value, value, effect_obj.operator);
            }
        }
    }

    private check_caps(current_prop, max_prop, min_value, result_obj) {
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

    private remove_char_buffs(type: effect_types, element?: elements) {
        const removed_effects: Effect[] = [];
        this.char.effects.forEach(effect => {
            if (effect.type !== type || effect.turns_quantity === -1) return;
            if (element !== undefined && effect.element === element) return;
            if (Math.random() <= this.chance) return;
            effect.char.remove_effect(effect);
            effect.char.update_all();
            removed_effects.push(effect);
        });
        return {removed_effects: removed_effects};
    }

    apply_effect(
        direct_value?
    ): {
        before?: number;
        after?: number;
        removed_effects?: Effect[];
        all_elements?: boolean;
    } {
        switch (this.type) {
            case effect_types.ATTACK:
            case effect_types.DEFENSE:
            case effect_types.AGILITY:
            case effect_types.LUCK:
                if (this.remove_buff) {
                    return this.remove_char_buffs(this.type);
                }
            case effect_types.MAX_HP:
            case effect_types.MAX_PP:
                return this.apply_general_value(effect_type_stat[this.type]);
            case effect_types.HP_RECOVERY:
                return this.apply_general_value(recovery_stats.HP_RECOVERY);
            case effect_types.PP_RECOVERY:
                return this.apply_general_value(recovery_stats.PP_RECOVERY);
            case effect_types.CURRENT_HP:
                const result_current_hp = this.apply_general_value(main_stats.CURRENT_HP);
                this.check_caps(main_stats.CURRENT_HP, main_stats.MAX_HP, 0, result_current_hp);
                return result_current_hp;
            case effect_types.CURRENT_PP:
                const result_current_pp = this.apply_general_value(main_stats.CURRENT_PP);
                this.check_caps(main_stats.CURRENT_PP, main_stats.MAX_PP, 0, result_current_pp);
                return result_current_pp;
            case effect_types.POWER:
            case effect_types.RESIST:
                const property = effect_type_elemental_stat[this.type];
                if (this.remove_buff) {
                    if (this.element === elements.ALL_ELEMENTS) {
                        const removed_effects = new Array(ordered_elements.length);
                        ordered_elements.forEach((element, i) => {
                            removed_effects[i] = this.remove_char_buffs(this.type, element).removed_effects;
                        });
                        return {
                            removed_effects: removed_effects.flat(),
                            all_elements: true,
                        };
                    } else {
                        return this.remove_char_buffs(this.type, this.element);
                    }
                } else {
                    if (this.element === elements.ALL_ELEMENTS) {
                        const results: ReturnType<Effect["apply_general_value"]>[] = new Array(ordered_elements.length);
                        ordered_elements.forEach((element, i) => {
                            results[i] = this.apply_general_value(property, undefined, element);
                        });
                        return {
                            before: _.mean(results.map(r => r.before)) | 0,
                            after: _.mean(results.map(r => r.after)) | 0,
                            all_elements: true,
                        };
                    } else {
                        return this.apply_general_value(property, undefined, this.element);
                    }
                }
            case effect_types.TURNS:
                return this.apply_general_value("turns");
            case effect_types.PERMANENT_STATUS:
                if (this.add_status) {
                    this.char.add_permanent_status(this.status_key_name as permanent_status);
                } else {
                    this.char.remove_permanent_status(this.status_key_name as permanent_status);
                }
                return;
            case effect_types.TEMPORARY_STATUS:
                if (this.add_status) {
                    this.char.add_temporary_status(this.status_key_name as temporary_status);
                } else {
                    this.char.remove_temporary_status(this.status_key_name as temporary_status);
                }
                return;
            case effect_types.DAMAGE_MODIFIER:
                return this.apply_general_value(undefined, direct_value);
            case effect_types.DAMAGE_INPUT:
                let result = this.apply_general_value(undefined, direct_value);
                const stat = effect_type_stat[this.sub_effect.type];
                result.before = this.char[stat];
                result.after = this.apply_subeffect(stat, result.after);
                switch (this.sub_effect.type) {
                    case effect_types.CURRENT_HP:
                        this.check_caps(main_stats.CURRENT_HP, main_stats.MAX_HP, 0, result);
                        break;
                    case effect_types.CURRENT_PP:
                        this.check_caps(main_stats.CURRENT_PP, main_stats.MAX_PP, 0, result);
                        break;
                }
                return result;
            case effect_types.EXTRA_ATTACK:
            case effect_types.EXTRA_DEFENSE:
            case effect_types.EXTRA_AGILITY:
            case effect_types.EXTRA_LUCK:
            case effect_types.EXTRA_MAX_HP:
            case effect_types.EXTRA_MAX_PP:
                return this.apply_general_value("extra_stats", undefined, effect_type_extra_stat[this.type]);
            case effect_types.PARALYZE:
                if (Math.random() < this.chance) {
                    this.char.paralyzed_by_effect = true;
                }
                return;
        }
    }

    static add_status_to_player(
        effect_obj: any,
        caster: MainChar | Enemy,
        target: MainChar | Enemy,
        ability: Ability,
        magnitude: number
    ) {
        let vulnerability = _.find(target.class.vulnerabilities, {
            status_key_name: effect_obj.status_key_name,
        });
        vulnerability = vulnerability === undefined ? 0 : vulnerability.chance;
        const ratio = diminishing_ratios.STATUS[magnitude];

        let added_effect: Effect = null;
        if (BattleFormulas.ailment_success(caster, target, effect_obj.chance, ratio, ability.element, vulnerability)) {
            added_effect = target.add_effect(this, ability, true).effect;
            if (added_effect.type === effect_types.TEMPORARY_STATUS) {
                if (
                    added_effect.status_key_name === temporary_status.DEATH_CURSE &&
                    target.has_temporary_status(temporary_status.DEATH_CURSE)
                ) {
                    target.set_effect_turns_count(added_effect);
                } else {
                    target.set_effect_turns_count(added_effect, added_effect.turn_count, false);
                }
            } else if (
                added_effect.status_key_name === permanent_status.VENOM &&
                target.has_permanent_status(permanent_status.POISON)
            ) {
                const poison_effect = _.find(target.effects, {
                    status_key_name: permanent_status.POISON,
                });
                target.remove_effect(poison_effect, true);
            }
        }
        return added_effect;
    }

    static remove_status_from_player(effect_obj: any, target: Player) {
        if (![effect_types.TEMPORARY_STATUS, effect_types.PERMANENT_STATUS].includes(effect_obj.type)) return;

        const removed_effects: Effect[] = [];
        if (Math.random() < effect_obj.chance) {
            while (true) {
                const this_effect = _.find(target.effects, {
                    status_key_name: effect_obj.status_key_name,
                });
                if (this_effect) {
                    target.remove_effect(this_effect, true);

                    if (this_effect.status_key_name === permanent_status.DOWNED) {
                        target.init_effect_turns_count();
                    }

                    removed_effects.push(this_effect);
                } else break;
            }
        }
        return removed_effects;
    }
}
