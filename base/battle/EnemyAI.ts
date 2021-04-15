// Enemy target rolling: http://forum.goldensunhacking.net/index.php?topic=2793.0

import * as _ from "lodash";
import {Enemy} from "../Enemy";
import {GoldenSun} from "../GoldenSun";
import {MainChar} from "../MainChar";
import {PlayerAbility} from "../main_menus/MainBattleMenu";
import {permanent_status} from "../Player";
import {Target} from "./BattleStage";

export class EnemyAI {
    static roll_action(data: GoldenSun, caster: Enemy, allies: Enemy[], enemies: MainChar[]): PlayerAbility {
        //hard coded to attack only the first char always. WIP
        let char_chosen = false;
        const available_abilities = caster.abilities.filter(info => info.key_name in data.info.abilities_list);
        const ability = data.info.abilities_list[_.sample(available_abilities).key_name];
        return {
            key_name: ability.key_name,
            battle_animation_key: ability.battle_animation_key,
            targets: enemies.map((enemy, index) => {
                let available_target = enemy.has_permanent_status(permanent_status.DOWNED) ? false : true;
                const targets: Target = {
                    magnitude: available_target && !char_chosen ? 1 : null,
                    target: {
                        instance: available_target && !char_chosen ? enemy : null,
                        battle_key: enemy.key_name,
                    },
                };
                if (available_target && !char_chosen) {
                    char_chosen = true;
                }
                return targets;
            }),
        };
    }
}
