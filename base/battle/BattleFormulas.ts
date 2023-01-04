//please check http://forum.goldensunhacking.net/index.php?topic=2460

/*
080B0660 - 70% (12/13 - Def debuffs)
080B0664 - 75% (16/17 - eRes debuffs)
080B0668 - 30% (22 - Charm)
080B066C - 45% (24 - Sleep)
080B0670 - 55% (18/19 - Poison/Venom, 25 - Seal)
080B0674 - 25% (26 - Haunt)
080B0678 - 20% (27 - Instant Death)
080B067C - 65% (20 - Delusion, HP Drain)
080B0680 - 35% (21 - Confuse, 34 - HP to 1)
080B0684 - Flat 60% (56 - Revive to 50%)
080B0688 - Flat 90% (57 - Revive to 80%)
080B068C - Flat 70% (73 - Revive to 60%)
080B0690 - 60% (8/9 - Attack debuffs, 28 - Curse, 32 - PP Drain, 80 - Curse)
080B0694 - 50% (35 - May ignore 50% of Def)
080B0698 - 40% (23 - Stun, 85 - Stun)
080B069C - Flat 100% (Def buffs, eRes buffs, Regen, Reflect, Break... seems to be the default for anything that either shouldn't fail or has its success rate calculated differently)

[by Salanewt]
*/

import {elements, variation} from "../utils";
import {elemental_stats, permanent_status, Player} from "../Player";
import {ELEM_ATTR_MAX, ELEM_ATTR_MIN} from "../magic_numbers";
import * as _ from "lodash";
import {Ability, ability_types} from "../Ability";

export const CRITICAL_CHANCE = 1 / 32;

// 1/32 chance to miss with a standard attack, or a roughly 66% chance to miss with Delusion.
export const EVASION_CHANCE = 1 / 32;
export const DELUSION_MISS_CHANCE = 66 / 100;

export const DEATH_CURSE_TURNS_COUNT = 7;

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
                case 2:
                    return (agility * 3) / 4 + priority;
                case 3:
                    return (agility >> 1) + priority;
            }
        }
        if (turn_quantity === 4) {
            switch (turn_number) {
                case 2:
                    return (agility * 5) / 6 + priority;
                case 3:
                    return (agility * 4) / 6 + priority;
                case 4:
                    return (agility >> 1) + priority;
            }
        }
        return (agility >> 1) + priority;
    }

    static base_damage(caster, target) {
        const relative_atk = caster.atk - target.def;
        return (relative_atk < 0 ? 0 : relative_atk) / 2.0;
    }

    static special_physical_attack(caster, target, mult_mod, add_mod) {
        return this.base_damage(caster, target) * mult_mod + add_mod;
    }

    static power_multiplier(caster: Player, target: Player, element: elements, is_psynergy = true) {
        let caster_power = 100.0,
            target_resist = 100.0;
        if (element !== elements.NO_ELEMENT && element !== elements.ALL_ELEMENTS) {
            target_resist = target.elemental_current[elemental_stats.RESIST][element];
            if (caster !== undefined) {
                caster_power = caster.elemental_current[elemental_stats.POWER][element];
            }
        }
        const relative_power = _.clamp(caster_power - target_resist, ELEM_ATTR_MIN, ELEM_ATTR_MAX);
        return 1 + relative_power / (is_psynergy ? 200.0 : 400.0);
    }

    static physical_attack(caster, target, mult_mod, add_mod, element) {
        return (
            this.special_physical_attack(caster, target, mult_mod, add_mod) *
            this.power_multiplier(caster, target, element, false)
        );
    }

    static psynergy_damage(caster, target, power, element) {
        return power + this.power_multiplier(caster, target, element, true);
    }

    static item_damage(target, power, element) {
        return power + this.power_multiplier(undefined, target, element, true);
    }

    static heal_ability(caster: Player, power: number, element: elements) {
        let caster_power = 100.0;
        if (element !== elements.NO_ELEMENT && element !== elements.ALL_ELEMENTS) {
            caster_power = caster.elemental_current[elemental_stats.POWER][element];
        }
        return (power * caster_power) / 100.0;
    }

    static summon_damage(target, power, djinni_used) {
        return power + target.max_hp * djinni_used * 0.03;
    }

    static ailment_success(
        caster: Player,
        target: Player,
        base_chance: number,
        magnitude: number,
        element: elements,
        vulnerabity: number
    ) {
        const relative_level =
            caster.elemental_current[elemental_stats.LEVEL][element] -
            target.elemental_current[elemental_stats.LEVEL][element];
        const luck_factor = target.luk >> 1;
        vulnerabity = vulnerabity === undefined ? 0 : vulnerabity;
        const chance = ((relative_level - luck_factor) * 3) / 100 + base_chance + vulnerabity * magnitude;
        return chance >= Math.random();
    }

    static ailment_recovery(player: Player, turn_number: number, base_chance: number) {
        return (player.luk * 3 - turn_number * 5 + base_chance * 100) * 655 >= _.random(0, 0xffff);
    }

    static battle_poison_damage(player, poison_type) {
        let poison_factor = 0;
        switch (poison_type) {
            case permanent_status.POISON:
                poison_factor = 1;
                break;
            case permanent_status.VENOM:
                poison_factor = 2;
                break;
        }
        return ((poison_factor * player.max_hp) / 10) | 0;
    }

    static summon_power(djinn_number) {
        djinn_number = _.clamp(djinn_number, 0, 4);
        return (djinn_number * djinn_number + djinn_number) * 5;
    }

    static get_damage(
        ability: Ability,
        caster: Player,
        target: Player,
        magnitude: number,
        djinn_used?: number,
        increased_critical?: number
    ) {
        let damage = 0;
        if (ability.has_critical && (Math.random() < CRITICAL_CHANCE || Math.random() < increased_critical / 2)) {
            const mult_mod = ability.crit_mult_factor === undefined ? 1.25 : ability.crit_mult_factor;
            const add_mod = 6.0 + target.level / 5.0;

            damage = BattleFormulas.physical_attack(caster, target, mult_mod, add_mod, ability.element);
        } else {
            switch (ability.type) {
                case ability_types.ADDED_DAMAGE:
                    damage = BattleFormulas.physical_attack(
                        caster,
                        target,
                        1.0,
                        ability.ability_power,
                        ability.element
                    );
                    break;
                case ability_types.MULTIPLIER:
                    damage = BattleFormulas.physical_attack(
                        caster,
                        target,
                        ability.ability_power / 10.0,
                        0,
                        ability.element
                    );
                    break;
                case ability_types.BASE_DAMAGE:
                    damage = BattleFormulas.psynergy_damage(caster, target, ability.ability_power, ability.element);
                    break;
                case ability_types.HEALING:
                    damage = -BattleFormulas.heal_ability(caster, ability.ability_power, ability.element);
                    break;
                case ability_types.SUMMON:
                    damage = BattleFormulas.summon_damage(target, ability.ability_power, djinn_used);
                    break;
                case ability_types.DIRECT_DAMAGE:
                    damage = ability.ability_power;
                    break;
            }
        }

        const ratios = Ability.get_diminishing_ratios(ability.type, ability.range, ability.use_diminishing_ratio);
        damage = (damage * ratios[magnitude]) | 0;
        damage += variation();
        return damage;
    }
}
