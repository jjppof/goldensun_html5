import { Effect } from "./Effect.js";
import { fighter_types } from "./battle/Battle.js";

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
}

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
}

export class Player {
    constructor(key_name, name) {
        this.key_name = key_name;
        this.name = name;
        this.temporary_status = new Set();
        this.permanent_status = new Set();
        this.effects = [];
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
            effect_obj.quantity_type,
            this
        );
        this.effects.push(effect);
        if (apply) {
            effect.apply_effect();
        }
        return effect;
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
}