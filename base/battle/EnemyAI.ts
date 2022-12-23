// Enemy target rolling: http://forum.goldensunhacking.net/index.php?topic=2793.0

import {ability_types, ability_target_types, ability_ranges, Ability} from "../Ability";
import * as _ from "lodash";
import {weighted_random_pick} from "../utils";
import {Enemy} from "../Enemy";
import {GoldenSun} from "../GoldenSun";
import {ItemSlot, MainChar} from "../MainChar";
import {PlayerAbility} from "../main_menus/MainBattleMenu";
import {permanent_status, temporary_status} from "../Player";
import {Target} from "./BattleStage";
import {effect_types} from "../Effect";
import {BattleCursorManager} from "./BattleCursorManager";

enum abilities_options {
    RANDOM_ABILITY,
    RECOVER_HP,
    RECOVER_AILMENT,
}

const HEALING_THRESHOLD = 0.25;

type PlayerInfo = {
    battle_key: string;
    instance: Enemy | MainChar;
};

export class EnemyAI {
    static roll_action(
        data: GoldenSun,
        caster: PlayerInfo,
        allies: PlayerInfo[],
        enemies: PlayerInfo[]
    ): PlayerAbility {
        const caster_abilities = caster.instance.abilities.map(ability => {
            return {
                key_name: ability.key_name,
                use_weight: ability.use_weight,
                item_obj: null,
            };
        });

        //mounts list of abilities that can be casted from items
        const item_abilities = caster.instance.items.flatMap((item: Enemy["items"][0]) => {
            if (item.quantity === 0) {
                return [];
            }
            return data.info.items_list[item.key_name].use_ability
                ? [
                      {
                          key_name: data.info.items_list[item.key_name].use_ability,
                          use_weight: item.use_weight,
                          item_obj: item,
                      },
                  ]
                : [];
        });

        const all_abilities = item_abilities
            .concat(caster_abilities)
            .filter(ability => caster.instance.current_pp >= data.info.abilities_list[ability.key_name].pp_cost);

        const can_recover_hp = all_abilities.some(ability => {
            return data.info.abilities_list[ability.key_name].type === ability_types.HEALING;
        });
        const healing_is_needed = allies.some(
            ally => ally.instance.current_hp < ally.instance.max_hp * HEALING_THRESHOLD
        );

        const ailments_that_can_be_healed: (permanent_status | temporary_status)[] = all_abilities.flatMap(ability => {
            const ability_obj = data.info.abilities_list[ability.key_name];
            if (ability_obj.type === ability_types.EFFECT_ONLY) {
                for (let effect of ability_obj.effects) {
                    if (
                        effect.type === effect_types.TEMPORARY_STATUS ||
                        effect.type === effect_types.PERMANENT_STATUS
                    ) {
                        if (effect.status_key_name === permanent_status.DOWNED) {
                            //enemy revive is not supported curently
                            continue;
                        }
                        if (!effect.add_status) {
                            return [effect.status_key_name];
                        }
                    }
                }
            }
            return [];
        });
        const can_recover_ailment = Boolean(ailments_that_can_be_healed.length);
        const ally_has_ailment = allies.some(ally => {
            for (let status of ailments_that_can_be_healed) {
                return (
                    ally.instance.has_permanent_status(status as permanent_status) ||
                    ally.instance.has_temporary_status(status as temporary_status)
                );
            }
            return false;
        });

        const what_to_do = weighted_random_pick(
            [abilities_options.RANDOM_ABILITY, abilities_options.RECOVER_HP, abilities_options.RECOVER_AILMENT],
            [
                (caster.instance as Enemy).weight_pick_random_ability,
                can_recover_hp && healing_is_needed ? (caster.instance as Enemy).weight_recover_hp : 0.0,
                can_recover_ailment && ally_has_ailment ? (caster.instance as Enemy).weight_recover_ailment : 0.0,
            ]
        );

        if (what_to_do === abilities_options.RANDOM_ABILITY) {
            return EnemyAI.pick_random_ability(data, caster, allies, enemies, all_abilities);
        } else if (what_to_do === abilities_options.RECOVER_HP) {
            return EnemyAI.pick_hp_recover_ability(data, caster, allies, all_abilities);
        } else {
            return EnemyAI.pick_ailment_recover_ability(
                data,
                caster,
                allies,
                all_abilities,
                ailments_that_can_be_healed
            );
        }
    }

    static get_targets(ability: Ability, main_target_index: number, players: PlayerInfo[]): Target[] {
        const range_center = BattleCursorManager.RANGES.length >> 1;
        const ability_range: number = ability.range === ability_ranges.ALL ? ability_ranges.ELEVEN : ability.range;
        const range_start = range_center - (ability_range >> 1);
        const start_target_index = main_target_index - (ability_range >> 1);
        let range_counter = 0;
        return players.flatMap((player, index) => {
            if (index < start_target_index || index >= start_target_index + ability_range) {
                return [
                    {
                        magnitude: null,
                        target: {
                            instance: null,
                            battle_key: player.battle_key,
                        },
                    },
                ];
            }
            const this_range_index = range_start + range_counter;
            ++range_counter;
            return [
                {
                    magnitude: BattleCursorManager.RANGES[this_range_index],
                    target: {
                        instance: player.instance,
                        battle_key: player.battle_key,
                    },
                },
            ];
        });
    }

    static pick_random_ability(
        data: GoldenSun,
        caster: PlayerInfo,
        allies: PlayerInfo[],
        enemies: PlayerInfo[],
        all_abilities: {
            key_name: string;
            use_weight: number;
            item_obj: ItemSlot;
        }[]
    ) {
        const available_abilities = all_abilities.filter(ability => {
            const ability_obj = data.info.abilities_list[ability.key_name];
            if (ability_obj.type === ability_types.HEALING) {
                return false;
            }
            for (let effect of ability_obj.effects) {
                if (effect.type === effect_types.TEMPORARY_STATUS || effect.type === effect_types.PERMANENT_STATUS) {
                    if (effect.status_key_name === permanent_status.DOWNED) {
                        continue;
                    }
                    if (!effect.add_status) {
                        return false;
                    }
                }
            }
            return true;
        });
        let chosen_ability: typeof all_abilities[0];
        if (available_abilities.length) {
            const weights = available_abilities.map(ability => ability.use_weight);
            chosen_ability = weighted_random_pick(available_abilities, weights);
        } else if (all_abilities.length) {
            const weights = all_abilities.map(ability => ability.use_weight);
            chosen_ability = weighted_random_pick(all_abilities, weights);
        } else {
            return {
                key_name: null,
                battle_animation_key: null,
                item_slot: null,
                targets: null,
            };
        }
        const ability_obj = data.info.abilities_list[chosen_ability.key_name];
        let targets: Target[];
        if (ability_obj.battle_target === ability_target_types.NO_TARGET) {
            targets = [];
        } else if (ability_obj.battle_target === ability_target_types.USER) {
            targets = [
                {
                    magnitude: 1,
                    target: {
                        instance: caster.instance,
                        battle_key: caster.battle_key,
                    },
                },
            ];
        } else if (
            ability_obj.battle_target === ability_target_types.ALLY ||
            ability_obj.battle_target === ability_target_types.ENEMY
        ) {
            const players = ability_obj.battle_target === ability_target_types.ALLY ? allies : enemies;
            const available_indexes = players.flatMap((player, index) =>
                player.instance.has_permanent_status(permanent_status.DOWNED) ? [] : [index]
            );
            let main_target_index: number;
            main_target_index = _.sample(available_indexes);
            if (
                [
                    ability_types.ADDED_DAMAGE,
                    ability_types.MULTIPLIER,
                    ability_types.BASE_DAMAGE,
                    ability_types.SUMMON,
                    ability_types.DIRECT_DAMAGE,
                ].includes(ability_obj.type)
            ) {
                if (Math.random() < (caster.instance as Enemy).change_target_weaker) {
                    const biggest_hp = Math.max(...enemies.map(enemy => enemy.instance.max_hp));
                    const weights = enemies.map(enemy => (biggest_hp - enemy.instance.current_hp) / biggest_hp);
                    main_target_index = weighted_random_pick(
                        available_indexes,
                        available_indexes.map(index => weights[index])
                    );
                }
            }
            targets = EnemyAI.get_targets(ability_obj, main_target_index, players);
        }
        return {
            key_name: chosen_ability.key_name,
            battle_animation_key:
                ability_obj.battle_animation_key in caster.instance.battle_animations_variations
                    ? caster.instance.battle_animations_variations[ability_obj.battle_animation_key]
                    : ability_obj.battle_animation_key,
            item_slot: chosen_ability.item_obj,
            targets: targets,
        };
    }

    static pick_hp_recover_ability(
        data: GoldenSun,
        caster: PlayerInfo,
        allies: PlayerInfo[],
        all_abilities: {
            key_name: string;
            use_weight: number;
            item_obj: ItemSlot;
        }[]
    ) {
        const available_abilities = all_abilities.filter(ability => {
            const ability_obj = data.info.abilities_list[ability.key_name];
            if (ability_obj.type === ability_types.HEALING) {
                return true;
            }
            return false;
        });

        const abilities_weights = available_abilities.map(ability => ability.use_weight);
        const chosen_ability = weighted_random_pick(available_abilities, abilities_weights);
        const ability_obj = data.info.abilities_list[chosen_ability.key_name];

        const biggest_hp = Math.max(...allies.map(ally => ally.instance.max_hp));
        const allies_weights = allies.map(ally => (biggest_hp - ally.instance.current_hp) / biggest_hp);
        const available_indexes = allies.flatMap((ally, index) =>
            ally.instance.has_permanent_status(permanent_status.DOWNED) ? [] : [index]
        );
        const main_target_index = weighted_random_pick(
            available_indexes,
            available_indexes.map(index => allies_weights[index])
        );

        const targets = EnemyAI.get_targets(ability_obj, main_target_index, allies);

        return {
            key_name: chosen_ability.key_name,
            battle_animation_key:
                ability_obj.battle_animation_key in caster.instance.battle_animations_variations
                    ? caster.instance.battle_animations_variations[ability_obj.battle_animation_key]
                    : ability_obj.battle_animation_key,
            item_slot: chosen_ability.item_obj,
            targets: targets,
        };
    }

    static pick_ailment_recover_ability(
        data: GoldenSun,
        caster: PlayerInfo,
        allies: PlayerInfo[],
        all_abilities: {
            key_name: string;
            use_weight: number;
            item_obj: ItemSlot;
        }[],
        ailments_that_can_be_healed: (permanent_status | temporary_status)[]
    ) {
        const main_target_index = allies.findIndex(ally => {
            if (ally.instance.has_permanent_status(permanent_status.DOWNED)) {
                return false;
            }
            for (let status of ailments_that_can_be_healed) {
                return (
                    ally.instance.has_permanent_status(status as permanent_status) ||
                    ally.instance.has_temporary_status(status as temporary_status)
                );
            }
            return false;
        });

        let ailment_to_be_healed = ailments_that_can_be_healed.find(ailment =>
            allies[main_target_index].instance.has_permanent_status(ailment as permanent_status)
        );
        if (!ailment_to_be_healed) {
            ailment_to_be_healed = ailments_that_can_be_healed.find(ailment =>
                allies[main_target_index].instance.has_temporary_status(ailment as temporary_status)
            );
        }

        const available_abilities = all_abilities.filter(ability => {
            const ability_obj = data.info.abilities_list[ability.key_name];
            for (let effect of ability_obj.effects) {
                if (effect.type === effect_types.TEMPORARY_STATUS || effect.type === effect_types.PERMANENT_STATUS) {
                    if (!effect.add_status && effect.status_key_name === ailment_to_be_healed) {
                        return true;
                    }
                }
            }
            return false;
        });

        const abilities_weights = available_abilities.map(ability => ability.use_weight);
        const chosen_ability = weighted_random_pick(available_abilities, abilities_weights);
        const ability_obj = data.info.abilities_list[chosen_ability.key_name];

        const targets = EnemyAI.get_targets(ability_obj, main_target_index, allies);

        return {
            key_name: chosen_ability.key_name,
            battle_animation_key:
                ability_obj.battle_animation_key in caster.instance.battle_animations_variations
                    ? caster.instance.battle_animations_variations[ability_obj.battle_animation_key]
                    : ability_obj.battle_animation_key,
            item_slot: chosen_ability.item_obj,
            targets: targets,
        };
    }
}
