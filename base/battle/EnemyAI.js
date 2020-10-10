// Enemy target rolling: http://forum.goldensunhacking.net/index.php?topic=2793.0

import { permanent_status } from "../Player";

export class EnemyAI {
    static roll_action(caster, allies, enemies) { //hard coded to attack only the first char always. WIP
        let char_chosen = false;
        return {
            key_name: "attack",
            targets: allies.map((ally, index) => {
                let available_target = ally.has_permanent_status(permanent_status.DOWNED) ? false : true;
                const targets = {
                    magnitude: available_target && !char_chosen ? 1 : null,
                    target: {
                        instance: available_target && !char_chosen ? ally : null
                    },
                    type: "attack"
                };
                if (available_target && !char_chosen) {
                    char_chosen = true;
                }
                return targets;
            })
        };
    }
}