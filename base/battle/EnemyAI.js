// Enemy target rolling: http://forum.goldensunhacking.net/index.php?topic=2793.0

export class EnemyAI {
    static get_targets(caster, allies, enemies) { //hard coded to attack only the first char always. WIP
        return {
            key_name: "attack",
            targets: allies.map((ally, index) => {
                return {
                    magnitude: !index ? 1 : null,
                    target: {
                        instance: !index ? ally : null
                    } 
                }
            })
        };
    }
}