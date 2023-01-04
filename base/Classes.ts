//reference: http://forum.goldensunhacking.net/index.php?topic=475.msg11653#msg11653

import {elements, ordered_elements} from "./utils";
import * as _ from "lodash";
import {GameInfo} from "./initializers/initialize_info";
import {elemental_stats, main_stats, permanent_status, Player, temporary_status} from "./Player";

export class Classes {
    public key_name: string;
    public name: string;
    public required_level: {[element in elements]?: number};
    public boost_stats: {[main_stat in main_stats]?: number};
    public ability_level_pairs: {
        ability: string;
        level: number;
    }[];
    public class_type: number;
    public vulnerabilities: {
        chance: number;
        status_key_name: permanent_status | temporary_status;
    }[];

    constructor(
        key_name,
        name,
        required_level,
        hp_boost,
        pp_boost,
        atk_boost,
        def_boost,
        agi_boost,
        luk_boost,
        ability_level_pairs,
        class_type,
        vulnerabilities
    ) {
        this.key_name = key_name;
        this.name = name;
        this.required_level = required_level;
        this.boost_stats = {};
        this.boost_stats[main_stats.MAX_HP] = hp_boost;
        this.boost_stats[main_stats.MAX_PP] = pp_boost;
        this.boost_stats[main_stats.ATTACK] = atk_boost;
        this.boost_stats[main_stats.DEFENSE] = def_boost;
        this.boost_stats[main_stats.AGILITY] = agi_boost;
        this.boost_stats[main_stats.LUCK] = luk_boost;
        this.ability_level_pairs = ability_level_pairs;
        this.class_type = class_type;
        this.vulnerabilities = vulnerabilities ?? [];
    }

    static choose_right_class(
        classes_list: GameInfo["classes_list"],
        class_table,
        element_afinity: elements,
        current_level: Player["elemental_current"][elemental_stats.LEVEL],
        granted_class_type: number,
        special_class_type: number
    ): Classes {
        const class_type = Classes.choose_class_type(
            class_table,
            element_afinity,
            current_level,
            granted_class_type,
            special_class_type
        );
        return Classes.choose_class_by_type(classes_list, current_level, class_type);
    }

    private static choose_class_by_type(
        classes_list: GameInfo["classes_list"],
        current_level: Player["elemental_current"][elemental_stats.LEVEL],
        class_type: number
    ): Classes {
        let classes = Object.values(classes_list).filter(this_class => this_class.class_type === class_type);
        classes = classes.filter(this_class => {
            return _.every(this_class.required_level, (level, element) => {
                return level <= current_level[element];
            });
        });
        return _.sortBy(classes, [this_class => _.sum(Object.values(this_class.required_level))]).reverse()[0];
    }

    private static choose_class_type(
        class_table,
        element_afinity: elements,
        current_level: Player["elemental_current"][elemental_stats.LEVEL],
        granted_class_type: number,
        special_class_type: number
    ): number {
        return granted_class_type > 0
            ? granted_class_type
            : Classes.choose_class_type_by_element_afinity(
                  class_table,
                  element_afinity,
                  current_level,
                  special_class_type
              );
    }

    static choose_class_type_by_element_afinity(
        class_table,
        element_afinity: elements,
        current_level: Player["elemental_current"][elemental_stats.LEVEL],
        special_class_type: number
    ): number {
        const secondary_elements = [
            ...ordered_elements.flatMap(element => {
                return element_afinity !== element
                    ? [
                          {
                              element: element,
                              level: current_level[element],
                          },
                      ]
                    : [];
            }),
        ];

        const no_secondary = secondary_elements.every(element => element.level === 0);
        let secondary_afinity;
        if (no_secondary) {
            secondary_afinity = element_afinity;
        } else {
            secondary_afinity = _.maxBy(secondary_elements, element => element.level).element;
        }

        if (special_class_type > 0 && element_afinity === secondary_afinity) {
            return special_class_type;
        } else {
            return class_table[element_afinity][secondary_afinity];
        }
    }
}
