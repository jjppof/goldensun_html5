import {Effect, effect_types} from "./Effect";
import {elements, ordered_elements} from "./utils";
import * as _ from "lodash";
import {Subject} from "rxjs";

export enum fighter_types {
    ALLY = 1,
    ENEMY = 2,
}

export enum temporary_status {
    DELUSION = "delusion",
    STUN = "stun",
    SLEEP = "sleep",
    SEAL = "seal",
    DEATH_CURSE = "death_curse",
}

export enum permanent_status {
    DOWNED = "downed",
    POISON = "poison",
    VENOM = "venom",
    EQUIP_CURSE = "equip_curse",
    HAUNT = "haunt",
}

export enum main_stats {
    MAX_HP = "max_hp",
    CURRENT_HP = "current_hp",
    MAX_PP = "max_pp",
    CURRENT_PP = "current_pp",
    ATTACK = "atk",
    DEFENSE = "def",
    AGILITY = "agi",
    LUCK = "luk",
}

export enum recovery_stats {
    HP_RECOVERY = "hp_recovery",
    PP_RECOVERY = "pp_recovery",
}

export const current_main_stat_map = {
    [main_stats.MAX_HP]: main_stats.CURRENT_HP,
    [main_stats.MAX_PP]: main_stats.CURRENT_PP,
};

export enum elemental_stats {
    CURRENT_POWER = "current_power",
    CURRENT_RESIST = "current_resist",
    CURRENT_LEVEL = "current_level",
}

export const effect_type_stat: {[effect_type in effect_types]?: main_stats} = {
    [effect_types.MAX_HP]: main_stats.MAX_HP,
    [effect_types.MAX_PP]: main_stats.MAX_PP,
    [effect_types.ATTACK]: main_stats.ATTACK,
    [effect_types.DEFENSE]: main_stats.DEFENSE,
    [effect_types.AGILITY]: main_stats.AGILITY,
    [effect_types.LUCK]: main_stats.LUCK,
    [effect_types.CURRENT_HP]: main_stats.CURRENT_HP,
    [effect_types.CURRENT_PP]: main_stats.CURRENT_PP,
};

export const effect_type_extra_stat: {[effect_type in effect_types]?: main_stats} = {
    [effect_types.EXTRA_MAX_HP]: main_stats.MAX_HP,
    [effect_types.EXTRA_MAX_PP]: main_stats.MAX_PP,
    [effect_types.EXTRA_ATTACK]: main_stats.ATTACK,
    [effect_types.EXTRA_DEFENSE]: main_stats.DEFENSE,
    [effect_types.EXTRA_AGILITY]: main_stats.AGILITY,
    [effect_types.EXTRA_LUCK]: main_stats.LUCK,
};

export const effect_type_elemental_stat: {[effect_type in effect_types]?: elemental_stats} = {
    [effect_types.POWER]: elemental_stats.CURRENT_POWER,
    [effect_types.RESIST]: elemental_stats.CURRENT_RESIST,
    [effect_types.ELEMENTAL_LEVEL]: elemental_stats.CURRENT_LEVEL,
};

export const on_catch_status_msg = {
    [temporary_status.DELUSION]: target => `${target.name} is wrapped in delusion!`,
    [temporary_status.STUN]: target => `${target.name} has been stunned!`,
    [temporary_status.SLEEP]: target => `${target.name} falls asleep!`,
    [temporary_status.SEAL]: target => `${target.name}'s Psynergy has been sealed!`,
    [temporary_status.DEATH_CURSE]: target => `The Spirit of Death embraces ${target.name}!`,
    [permanent_status.DOWNED]: target => {
        return target.fighter_type === fighter_types.ALLY
            ? `${target.name} was downed...`
            : `You felled ${target.name}!`;
    },
    [permanent_status.POISON]: target => `${target.name} is infected with poison!`,
    [permanent_status.VENOM]: target => `${target.name} is infected with deadly poison!`,
    [permanent_status.HAUNT]: target => `An evil spirit grips ${target.name}!`,
};

export const on_remove_status_msg = {
    [temporary_status.DELUSION]: target => `${target.name} sees clearly once again!`,
    [temporary_status.STUN]: target => `${target.name} is no longer stunned!`,
    [temporary_status.SLEEP]: target => `${target.name} wakes from slumber!`,
    [temporary_status.SEAL]: target => `${target.name}'s Psynergy seal is gone!`,
    [temporary_status.DEATH_CURSE]: target => `${target.name} shakes off the Grim Reaper!`,
    [permanent_status.DOWNED]: target => `${target.name}'s has been revived!`,
    [permanent_status.POISON]: target => `The poison is purged from ${target.name}!`,
    [permanent_status.VENOM]: target => `The venom is purged from ${target.name}!`,
};

export const ordered_status_battle = [
    permanent_status.DOWNED,
    permanent_status.EQUIP_CURSE,
    temporary_status.DEATH_CURSE,
    permanent_status.POISON,
    permanent_status.VENOM,
    temporary_status.SEAL,
    temporary_status.STUN,
    temporary_status.SLEEP,
    permanent_status.HAUNT,
    temporary_status.DELUSION,
];

export const ordered_status_menu = [
    permanent_status.DOWNED,
    permanent_status.POISON,
    permanent_status.VENOM,
    permanent_status.EQUIP_CURSE,
    permanent_status.HAUNT,
];

export const ordered_main_stats = [
    main_stats.MAX_HP,
    main_stats.MAX_PP,
    main_stats.ATTACK,
    main_stats.DEFENSE,
    main_stats.AGILITY,
    main_stats.LUCK,
];

export const ailment_recovery_base_chances = {
    [temporary_status.DELUSION]: 0.3,
    [temporary_status.STUN]: 0.2,
    [temporary_status.SLEEP]: 0.5,
    [temporary_status.SEAL]: 0.3,
};
export const debuff_recovery_base_chances = {
    [effect_types.ATTACK]: 0.3,
    [effect_types.DEFENSE]: 0.2,
    [effect_types.RESIST]: 0.2,
};

/** The base class of MainChar and Enemy. */
export abstract class Player {
    /** The player key name. */
    public key_name: string;
    /** The player name. */
    public name: string;
    /** The temporary status set. Use this property only to check whether the player has a given status. */
    public temporary_status: Set<temporary_status>;
    /** The permanent status set. Use this property only to check whether the player has a given status. */
    public permanent_status: Set<permanent_status>;
    /** The list of Effects that affect this player. */
    public effects: Effect[];
    /** The effect: remaining turns to vanish dictionary. */
    public effect_turns_count: {[effect: string]: number | {[element: string]: number}};
    /** The player battle scale. */
    public battle_scale: number;
    /** The player battle shadow sprite key. */
    public battle_shadow_key: string;
    /** The aditional shift added to status sprite in battle. */
    public status_sprite_shift: number;
    /** Whether it's an ally or enemy in the main party point of view.*/
    public fighter_type: fighter_types;
    /** The elemental level stats object. */
    public current_level: {[element in elements]?: number};
    /** The elemental power stats object. */
    public current_power: {[element in elements]?: number};
    /** The elemental resist stats object. */
    public current_resist: {[element in elements]?: number};
    /** The elemental level base value stats object. */
    public base_level: {[element in elements]?: number};
    /** The elemental power base value stats object. */
    public base_power: {[element in elements]?: number};
    /** The elemental resist base value stats object. */
    public base_resist: {[element in elements]?: number};
    /** The current amount of turns that this player has. */
    public turns: number;
    /** The base amount of turns that this player has. */
    public base_turns: number;
    /** The extra amount of turns that this player has. */
    public extra_turns: number;
    /** This maps a given ability key to a non-default ability animation key. */
    public battle_animations_variations: {[ability_key: string]: string};
    /** The player max HP. */
    public max_hp: number;
    /** The player current HP. */
    public current_hp: number;
    /** The player max PP. */
    public max_pp: number;
    /** The player current PP. */
    public current_pp: number;
    /** The player HP recovery points. */
    public hp_recovery: number;
    /** The player PP recovery points. */
    public pp_recovery: number;
    /** The player attack points. */
    public atk: number;
    /** The player defense points. */
    public def: number;
    /** The player agility points. */
    public agi: number;
    /** The player luck points. */
    public luk: number;
    /** The player current level. */
    public level: number;
    /** The player current experience points. */
    public current_exp: number;
    /** Whether the player is paralyzed by any Effect in battle. */
    public paralyzed_by_effect: boolean;
    /** The rxjs Subject that's triggered when this player suffers a status change. */
    public on_status_change: Subject<{
        status: permanent_status | temporary_status;
        added: boolean;
    }>;
    /** Any extra stats points added to the main stats of this player. */
    public extra_stats: {[main_stat in main_stats]?: number};

    constructor(key_name, name) {
        this.key_name = key_name;
        this.name = name;
        this.temporary_status = new Set();
        this.permanent_status = new Set();
        this.on_status_change = new Subject();
        this.effects = [];
        this.extra_stats = {};
        this.extra_stats[main_stats.MAX_HP] = 0;
        this.extra_stats[main_stats.MAX_PP] = 0;
        this.extra_stats[main_stats.ATTACK] = 0;
        this.extra_stats[main_stats.DEFENSE] = 0;
        this.extra_stats[main_stats.AGILITY] = 0;
        this.extra_stats[main_stats.LUCK] = 0;
        this.current_power = ordered_elements.reduce((obj, elem) => {
            obj[elem] = 0;
            return obj;
        }, {});
        this.current_resist = _.cloneDeep(this.current_power);
        this.current_level = _.cloneDeep(this.current_power);
        this.extra_turns = 0;
        this.paralyzed_by_effect = false;
        this.init_effect_turns_count();
    }

    /**
     * When starting a battle, resets all temporary status and buffers
     * turns count values.
     */
    init_effect_turns_count() {
        this.effect_turns_count = {
            [temporary_status.DELUSION]: 0,
            [temporary_status.STUN]: 0,
            [temporary_status.SLEEP]: 0,
            [temporary_status.SEAL]: 0,
            [temporary_status.DEATH_CURSE]: 0,
            [effect_types.MAX_HP]: 0,
            [effect_types.MAX_PP]: 0,
            [effect_types.ATTACK]: 0,
            [effect_types.DEFENSE]: 0,
            [effect_types.AGILITY]: 0,
            [effect_types.LUCK]: 0,
            [effect_types.TURNS]: 0,
            [effect_types.POWER]: {},
            [effect_types.RESIST]: {},
        };
        for (let i = 0; i < ordered_elements.length; ++i) {
            const element = ordered_elements[i];
            this.effect_turns_count[effect_types.POWER][element] = 0;
            this.effect_turns_count[effect_types.RESIST][element] = 0;
        }
    }

    /** Updates all stats, class info and abilities of this player. */
    abstract update_all();

    apply_turns_count_value() {
        this.turns = this.base_turns + this.extra_turns;
    }

    get_effect_turns_key(effect: Effect) {
        switch (effect.type) {
            case effect_types.TEMPORARY_STATUS:
                return effect.status_key_name;
            case effect_types.MAX_HP:
            case effect_types.MAX_PP:
            case effect_types.ATTACK:
            case effect_types.DEFENSE:
            case effect_types.AGILITY:
            case effect_types.LUCK:
                return effect.type;
            case effect_types.POWER:
            case effect_types.RESIST:
                return effect.type + "_" + effect.element;
        }
        return null;
    }

    get_effect_turns_count(effect: Effect) {
        switch (effect.type) {
            case effect_types.TEMPORARY_STATUS:
                return this.effect_turns_count[effect.status_key_name];
            case effect_types.MAX_HP:
            case effect_types.MAX_PP:
            case effect_types.ATTACK:
            case effect_types.DEFENSE:
            case effect_types.AGILITY:
            case effect_types.LUCK:
            case effect_types.TURNS:
                return this.effect_turns_count[effect.type];
            case effect_types.POWER:
            case effect_types.RESIST:
                return this.effect_turns_count[effect.type][effect.element];
        }
        return null;
    }

    set_effect_turns_count(effect, value = -1, relative = true) {
        switch (effect.type) {
            case effect_types.TEMPORARY_STATUS:
                return (this.effect_turns_count[effect.status_key_name] = relative
                    ? (this.effect_turns_count[effect.status_key_name] as number) + value
                    : value);
            case effect_types.MAX_HP:
            case effect_types.MAX_PP:
            case effect_types.ATTACK:
            case effect_types.DEFENSE:
            case effect_types.AGILITY:
            case effect_types.LUCK:
            case effect_types.TURNS:
                return (this.effect_turns_count[effect.type] = relative
                    ? (this.effect_turns_count[effect.type] as number) + value
                    : value);
            case effect_types.POWER:
            case effect_types.RESIST:
                return (this.effect_turns_count[effect.type][effect.element] = relative
                    ? this.effect_turns_count[effect.type][effect.element] + value
                    : value);
        }
    }

    add_effect(
        effect_obj: any,
        effect_owner_instance: Effect["effect_owner_instance"],
        apply = false
    ): {
        effect: Effect;
        changes: ReturnType<Effect["apply_effect"]>;
    } {
        const effect = new Effect(
            effect_obj.type,
            effect_obj.quantity,
            effect_obj.operator,
            effect_obj.expression,
            effect_owner_instance,
            effect_obj.quantity_is_absolute,
            effect_obj.rate,
            effect_obj.chance,
            effect_obj.element,
            effect_obj.add_status,
            effect_obj.remove_buff,
            effect_obj.status_key_name,
            effect_obj.turns_quantity,
            effect_obj.variation_on_final_result,
            effect_obj.usage,
            effect_obj.on_caster,
            effect_obj.relative_to_property,
            effect_obj.sub_effect,
            effect_obj.custom_msg,
            effect_obj.show_msg,
            this
        );
        this.effects.push(effect);
        let changes: ReturnType<Effect["apply_effect"]>;
        if (apply) {
            changes = effect.apply_effect();
        }
        return {
            effect: effect,
            changes: changes,
        };
    }

    remove_effect(effect_to_remove: Effect, apply: boolean = false) {
        this.effects = this.effects.filter(effect => {
            return effect !== effect_to_remove;
        });
        if (effect_to_remove.add_status) {
            if (effect_to_remove.type === effect_types.TEMPORARY_STATUS) {
                this.remove_temporary_status(effect_to_remove.status_key_name as temporary_status);
            } else if (effect_to_remove.type === effect_types.PERMANENT_STATUS) {
                this.remove_permanent_status(effect_to_remove.status_key_name as permanent_status);
            }
        }
        if (apply) {
            effect_to_remove.apply_effect();
        }
    }

    add_permanent_status(status: permanent_status) {
        this.permanent_status.add(status);
        this.on_status_change.next({status: status, added: true});
    }

    remove_permanent_status(status: permanent_status) {
        this.permanent_status.delete(status);
        this.on_status_change.next({status: status, added: false});
    }

    has_permanent_status(status: permanent_status) {
        return this.permanent_status.has(status);
    }

    add_temporary_status(status: temporary_status) {
        this.temporary_status.add(status);
        this.on_status_change.next({status: status, added: true});
    }

    remove_temporary_status(status: temporary_status) {
        this.temporary_status.delete(status);
        this.on_status_change.next({status: status, added: false});
    }

    has_temporary_status(status: temporary_status) {
        return this.temporary_status.has(status);
    }

    is_paralyzed(include_downed: boolean = false, exclude_no_downed_anim: boolean = false) {
        return (
            (!exclude_no_downed_anim && this.temporary_status.has(temporary_status.SLEEP)) ||
            this.temporary_status.has(temporary_status.STUN) ||
            (!exclude_no_downed_anim && this.paralyzed_by_effect) ||
            (include_downed && this.permanent_status.has(permanent_status.DOWNED))
        );
    }

    is_poisoned() {
        if (this.permanent_status.has(permanent_status.POISON)) {
            return permanent_status.POISON;
        } else if (this.permanent_status.has(permanent_status.VENOM)) {
            return permanent_status.VENOM;
        } else {
            return false;
        }
    }
}
