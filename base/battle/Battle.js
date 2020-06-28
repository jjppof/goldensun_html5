import { party_data } from "../../initializers/main_chars.js";
import { BattleStage } from "./BattleStage.js";
import { enemies_list } from "../../initializers/enemies.js";

const MAX_CHAR_AT_BATTLE = 4;

export class Battle {
    constructor(game, data, background_key, enemy_party_key) {
        this.game = game;
        this.data = data;
        this.allies_info = party_data.members.slice(0, MAX_CHAR_AT_BATTLE).map(char => {
            return {
                sprite_key: char.key_name + "_battle",
                scale: char.battle_scale
            };
        });
        const enemies_party_data = this.data.enemies_parties_db[enemy_party_key];
        this.enemies_info = [];
        enemies_party_data.members.forEach(member_info => {
            const qtd = _.random(member_info.min, member_info.max);
            for (let i = 0; i < qtd; ++i) {
                this.enemies_info.push({
                    sprite_key: member_info.key,
                    scale: enemies_list[member_info.key].battle_scale
                });
            }
        });
        this.battle_stage = new BattleStage(this.game, background_key, this.allies_info, this.enemies_info);
    }

    start_battle() {
        this.battle_stage.initialize_stage();
    }
}
