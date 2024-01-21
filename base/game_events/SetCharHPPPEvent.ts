import {MainChar} from "MainChar";
import {GameEvent, event_types} from "./GameEvent";
import * as _ from "lodash";

enum points_types {
    HP = "hp",
    PP = "pp",
}

export class SetCharHPPPEvent extends GameEvent {
    private char_key: string;
    private points_type: string;
    private value: number | "full";

    constructor(game, data, active, key_name, keep_reveal, char_key, points_type, value) {
        super(game, data, event_types.SET_CHAR_HP_PP, active, key_name, keep_reveal);
        this.char_key = char_key;
        this.points_type = points_type;
        this.value = value;
    }

    _fire() {
        let chars: MainChar[];
        if (this.char_key === "all") {
            chars = this.data.info.party_data.members;
        } else {
            const char = this.data.info.main_char_list[this.char_key];
            if (!char) {
                this.data.logger.log_message(
                    `[${event_types.SET_CHAR_HP_PP}]: Could not find '${this.char_key}' char. Check "char_key" property.`
                );
                return;
            }
            chars = [char];
        }
        chars.forEach(char => {
            if (this.points_type === points_types.HP) {
                if (this.value === "full") {
                    char.current_hp = char.max_hp;
                } else if (_.isNumber(this.value) && (this.value as number) >= 0) {
                    char.current_hp = _.clamp(this.value as number, 0, char.max_hp) | 0;
                }
            } else if (this.points_type === points_types.PP) {
                if (this.value === "full") {
                    char.current_pp = char.max_pp;
                } else if (_.isNumber(this.value) && (this.value as number) >= 0) {
                    char.current_pp = _.clamp(this.value as number, 0, char.max_pp) | 0;
                }
            }
        });
    }

    _destroy() {}
}
