import { Effect, effect_types } from "./Effect";
import { ordered_elements } from "./utils";

export const fighter_types = {
    ALLY: 1,
    ENEMY: 2,
};

export const temporary_status = {
    DELUSION: "delusion",
    STUN: "stun",
    SLEEP: "sleep",
    SEAL: "seal",
    DEATH_CURSE: "death_curse"
};

export const permanent_status = {
    DOWNED: "downed",
    POISON: "poison",
    VENOM: "venom",
    EQUIP_CURSE: "equip_curse",
    HAUNT: "haunt"
};

export const main_stats = {
    MAX_HP: "max_hp",
    CURRENT_HP: "current_hp",
    MAX_PP: "max_pp",
    CURRENT_PP: "current_pp",
    ATTACK: "atk",
    DEFENSE: "def",
    AGILITY: "agi",
    LUCK: "luk"
};

export const ordered_main_stats = [
    main_stats.MAX_HP,
    main_stats.MAX_PP,
    main_stats.ATTACK,
    main_stats.DEFENSE,
    main_stats.AGILITY,
    main_stats.LUCK
];

export const on_catch_status_msg = {
    [temporary_status.DELUSION]: target => `${target.name} is wrapped in delusion!`,
    [temporary_status.STUN]: target => `${target.name} has been stunned!`,
    [temporary_status.SLEEP]: target => `${target.name} falls asleep!`,
    [temporary_status.SEAL]: target => `${target.name}'s Psynergy has been sealed!`,
    [temporary_status.DEATH_CURSE]: target => `The Spirit of Death embraces ${target.name}!`,
    [permanent_status.DOWNED]: target => {
        return target.fighter_type === fighter_types.ALLY ? `${target.name} was downed...` : `You felled ${target.name}!`;
    },
    [permanent_status.POISON]: target => `${target.name} is infected with poison!`,
    [permanent_status.VENOM]: target => `${target.name} is infected with deadly poison!`,
    [permanent_status.HAUNT]: target => `An evil spirit grips ${target.name}!`
};

export const on_remove_status_msg = {
    [temporary_status.DELUSION]: target => `${target.name} sees clearly once again!`,
    [temporary_status.STUN]: target => `${target.name} is no longer stunned!`,
    [temporary_status.SLEEP]: target => `${target.name} wakes from slumber!`,
    [temporary_status.SEAL]: target => `${target.name}'s Psynergy seal is gone!`,
    [permanent_status.DOWNED]: target => `${target.name}'s has been revived!`,
    [permanent_status.POISON]: target => `The poison is purged from ${target.name}!`,
    [permanent_status.VENOM]: target => `The venom is purged from ${target.name}!`
};

export class Player {
    public key_name: string;
    public name: string;
    public temporary_status: Set<string>;
    public permanent_status: Set<string>;
    public effects: Effect[];
    public effect_turns_count: {[effect: string]: number|{[element: string]: number}};
    public battle_scale: number;
    public fighter_type: number;
    public venus_level_current: number;
    public mercury_level_current: number;
    public mars_level_current: number;
    public jupiter_level_current: number;
    public venus_power_current: number;
    public mercury_power_current: number;
    public mars_power_current: number;
    public jupiter_power_current: number;
    public venus_resist_current: number;
    public mercury_resist_current: number;
    public mars_resist_current: number;
    public jupiter_resist_current: number;
    public turns: number;
    public battle_animations_variations: {[ability_key: string]: string};
    public max_hp: number;
    public current_hp: number;
    public max_pp: number;
    public hp_recovery: number;
    public pp_recovery: number;
    public current_pp: number;
    public atk: number;
    public def: number;
    public agi: number;
    public luk: number;
    public level: number;
    public current_exp: number;

    constructor(key_name, name) {
        this.key_name = key_name;
        this.name = name;
        this.temporary_status = new Set();
        this.permanent_status = new Set();
        this.effects = [];
        this.init_effect_turns_count();
    }

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
            [effect_types.POWER]: {},
            [effect_types.RESIST]: {},
        };
        for (let i = 0; i < ordered_elements.length; ++i) {
            const element = ordered_elements[i];
            this.effect_turns_count[effect_types.POWER][element] = 0;
            this.effect_turns_count[effect_types.RESIST][element] = 0;
        }
    }

    get_effect_turns_key(effect) {
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
                return effect.type + "_" + effect.attribute;
        }
        return null;
    }

    get_effect_turns_count(effect) {
        switch (effect.type) {
            case effect_types.TEMPORARY_STATUS:
                return this.effect_turns_count[effect.status_key_name];
            case effect_types.MAX_HP:
            case effect_types.MAX_PP:
            case effect_types.ATTACK:
            case effect_types.DEFENSE:
            case effect_types.AGILITY:
            case effect_types.LUCK:
                return this.effect_turns_count[effect.type];
            case effect_types.POWER:
            case effect_types.RESIST:
                return this.effect_turns_count[effect.type][effect.attribute];
        }
        return null;
    }

    set_effect_turns_count(effect, value = -1, relative = true) {
        switch (effect.type) {
            case effect_types.TEMPORARY_STATUS:
                this.effect_turns_count[effect.status_key_name] = relative ? (this.effect_turns_count[effect.status_key_name] as number) + value : value;
            case effect_types.MAX_HP:
            case effect_types.MAX_PP:
            case effect_types.ATTACK:
            case effect_types.DEFENSE:
            case effect_types.AGILITY:
            case effect_types.LUCK:
                return this.effect_turns_count[effect.type] = relative ? (this.effect_turns_count[effect.type] as number) + value : value;;
            case effect_types.POWER:
            case effect_types.RESIST:
                return this.effect_turns_count[effect.type][effect.attribute] = relative ? this.effect_turns_count[effect.type][effect.attribute] + value : value;;
        }
    }

    add_effect(effect_obj, effect_owner_instance, apply = false) {
        let effect = new Effect(
            effect_obj.type,
            effect_obj.quantity,
            effect_obj.operator,
            effect_owner_instance,
            effect_obj.quantity_is_absolute,
            effect_obj.rate,
            effect_obj.chance,
            effect_obj.attribute,
            effect_obj.add_status,
            effect_obj.status_key_name,
            effect_obj.turns_quantity,
            effect_obj.variation_on_final_result,
            effect_obj.damage_formula_key_name,
            effect_obj.usage,
            effect_obj.on_caster,
            effect_obj.relative_to_property,
            effect_obj.sub_effect,
            effect_obj.effect_msg,
            effect_obj.show_msg,
            this
        );
        this.effects.push(effect);
        let changes;
        if (apply) {
            changes = effect.apply_effect();
        }
        return {
            effect: effect,
            changes: changes
        };
    }

    remove_effect(effect_to_remove, apply = false) {
        this.effects = this.effects.filter(effect => {
            return effect !== effect_to_remove;
        });
        if (apply) {
            effect_to_remove.apply_effect();
        }
    }

    add_permanent_status(status) {
        this.permanent_status.add(status);
    }

    remove_permanent_status(status) {
        this.permanent_status.delete(status);
    }

    has_permanent_status(status) {
        return this.permanent_status.has(status);
    }

    add_temporary_status(status) {
        this.temporary_status.add(status);
    }

    remove_temporary_status(status) {
        this.temporary_status.delete(status);
    }

    has_temporary_status(status) {
        return this.temporary_status.has(status);
    }

    is_paralyzed() {
        return this.temporary_status.has(temporary_status.SLEEP) || this.temporary_status.has(temporary_status.STUN);
    }

    is_poisoned() {
        if (this.permanent_status.has(permanent_status.POISON)) {
            return permanent_status.POISON;
        } else if (this.permanent_status.has(permanent_status.VENOM)) {
            return permanent_status.VENOM
        } else {
            return false;
        }
    }
}