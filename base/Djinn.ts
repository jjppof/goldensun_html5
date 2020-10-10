import * as numbers from './magic_numbers.js';
import { ordered_elements } from './utils.js';
import * as _ from "lodash";

export const djinn_status = {
    SET: "set",
    STANDBY: "standby",
    RECOVERY: "recovery"
};

export const djinn_font_colors= {
    [djinn_status.RECOVERY]: numbers.YELLOW_FONT_COLOR,
    [djinn_status.STANDBY]: numbers.RED_FONT_COLOR,
    [djinn_status.SET]: numbers.DEFAULT_FONT_COLOR
};

export class Djinn {
    public key_name: string;
    public name: string;
    public description: string;
    public element: string;
    public ability_key_name: string;
    public hp_boost: number;
    public pp_boost: number;
    public atk_boost: number;
    public def_boost: number;
    public agi_boost: number;
    public luk_boost: number;
    public status: string;
    public index: number;
    public recovery_turn: number;

    constructor(
        key_name,
        name,
        description,
        element,
        ability_key_name,
        hp_boost,
        pp_boost,
        atk_boost,
        def_boost,
        agi_boost,
        luk_boost,
        index
    ) {
        this.key_name = key_name;
        this.name = name;
        this.description = description;
        this.element = element;
        this.ability_key_name = ability_key_name;
        this.hp_boost = hp_boost;
        this.pp_boost = pp_boost;
        this.atk_boost = atk_boost;
        this.def_boost = def_boost;
        this.agi_boost = agi_boost;
        this.luk_boost = luk_boost;
        this.status = djinn_status.SET;
        this.index = index;
        this.recovery_turn = 0;
    }

    set_status(status, char) {
        this.status = status;
        char.update_elemental_attributes();
        char.update_class();
        char.update_attributes();
        char.update_abilities();
    }

    static has_standby_djinn(djinni_list, members) {
        return _.some(members.map(char => char.djinni).map(djinn_keys => {
            return djinn_keys.filter(key => djinni_list[key].status === djinn_status.STANDBY).length;
        }));
    }

    static get_standby_djinni(djinni_list, members) {
        let standby_djinni = _.mapValues(_.groupBy(members.map(c => c.djinni).flat(), key => {
            return djinni_list[key].element;
        }), djinni_keys => djinni_keys.filter(key => djinni_list[key].status === djinn_status.STANDBY).length);
        for (let i = 0; i < ordered_elements.length; ++i) {
            const element = ordered_elements[i];
            if (!(element in standby_djinni)) {
                standby_djinni[element] = 0;
            }
        }
        return standby_djinni;
    }

    static set_to_recovery(djinni_list, members, requirements) {
        let req_counter = Object.assign({}, requirements);
        let done = false;
        for (let i = 0; i < members.length; ++i) {
            const player = members[i];
            const player_djinni = player.djinni;
            let recovery_counter = 1;
            for (let j = 0; j < player_djinni.length; ++j) {
                const djinn = djinni_list[player_djinni[j]];
                if (djinn.status !== djinn_status.STANDBY) continue;
                if (req_counter[djinn.element] > 0) {
                    djinn.recovery_turn = recovery_counter;
                    ++recovery_counter;
                    djinn.set_status(djinn_status.RECOVERY, player);
                    --req_counter[djinn.element];
                    if (!_.some(req_counter, Boolean)) {
                        done = true;
                        break;
                    }
                }
            }
            if (done) break;
        }
    }
}