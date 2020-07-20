//please check http://forum.goldensunhacking.net/index.php?topic=2460

import { elements } from "../MainChar.js";

export const CRITICAL_CHANCE = 1/32;
export const EVASION_CHANCE = 1/32;
export const DELUSION_MISS_CHANCE = 66/100;

export class BattleFormulas {
    static player_turn_speed(agility, priority_move = false, multi_turn = false) {
        return (agility + ((agility * _.random(0, 65535)) >> 20)) * (multi_turn ? 0.5 : 1) + (priority_move ? 1e4 : 0);
    }

    static enemy_turn_speed(agility, turn_number, turn_quantity, priority_move = false) {
        const priority = priority_move ? 1e4 : 0;
        if (turn_number === 1) {
            return agility + priority;
        }
        if (turn_quantity === 2) {
            return (agility >> 1) + priority;
        }
        if (turn_quantity === 3) {
            switch (turn_number) {
                case 2: return agility * 3/4 + priority;
                case 3: return (agility >> 1) + priority;
            }
        }
        if (turn_quantity === 4) {
            switch (turn_number) {
                case 2: agility * 5/6 + priority;
                case 3: agility * 4/6 + priority;
                case 4: (agility >> 1) + priority;
            }
        }
        return (agility >> 1) + priority;
    }

    static base_damage(caster, target) {
        return (caster.current_atk - target.current_def)/2.0;
    }

    static physical_attack(caster, target) {
        return this.base_damage(caster, target);
    }

    static special_physical_attack(caster, target, mult_mod, add_mod) {
        return this.base_damage(caster, target) * mult_mod + add_mod;
    }

    static critical_damage(caster, target, mult_mod) {
        mult_mod = mult_mod === undefined ? 1.25 : mult_mod;
        const add_mod = 6.0 + target.level/5.0;
        return this.special_physical_attack(caster, target, mult_mod, add_mod)
    }

    static power_multiplier(caster, target, element, is_psynergy = true) {
        let caster_power = 100.0, target_resist = 100.0;
        if (element !== elements.NO_ELEMENT) {
            const resist_key = element + "_resist_current";
            target_resist = target[resist_key];
            if (caster !== undefined) {
                const power_key = element + "_power_current";
                caster_power = caster[power_key];
            }
        }
        const relative_power = _.clamp(caster_power - target_resist, -200.0, 200.0);
        return 1 + (relative_power)/(is_psynergy ? 200.0 : 400.0);
    }

    static elemental_physical_attack(caster, target, mult_mod, add_mod, element) {
        return this.special_physical_attack(caster, target, mult_mod, add_mod) * this.power_multiplier(caster, target, element, false);
    }

    static psynergy_damage(caster, target, power, element) {
        return power + this.power_multiplier(caster, target, element, true);
    }

    static item_damage(target, power, element) {
        return power + this.power_multiplier(undefined, target, element, true);
    }

    static heal_ability(caster, power, element) {
        let caster_power = 100.0;
        if (element !== elements.NO_ELEMENT) {
            const power_key = element + "_power_current";
            caster_power = caster[power_key];
        }
        return power * caster_power/100.0;
    }

    static summon_damage(target, power, djinni_used) {
        return power + target.max_hp * djinni_used * 0.03;
    }
}