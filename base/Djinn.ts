import * as numbers from "./magic_numbers";
import {elements, ordered_elements} from "./utils";
import * as _ from "lodash";
import {MainChar} from "./MainChar";
import {Summon} from "./Summon";
import {main_stats} from "./Player";
import {GameInfo} from "./initializers/initialize_info";

export enum djinn_status {
    SET = "set",
    STANDBY = "standby",
    RECOVERY = "recovery",
    ANY = "any",
}

export const djinn_font_colors: {[status in djinn_status]?: number} = {
    [djinn_status.RECOVERY]: numbers.YELLOW_FONT_COLOR,
    [djinn_status.STANDBY]: numbers.RED_FONT_COLOR,
    [djinn_status.SET]: numbers.DEFAULT_FONT_COLOR,
};

export class Djinn {
    public key_name: string;
    public name: string;
    public description: string;
    public element: elements;
    public ability_key_name: string;
    public boost_stats: {[main_stat in main_stats]?: number};
    public status: djinn_status;
    public index: number;
    public owner: MainChar;
    public recovery_turn: number;

    public static djinn_in_recover: string[] = [];

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
        this.boost_stats = {};
        this.boost_stats[main_stats.MAX_HP] = hp_boost;
        this.boost_stats[main_stats.MAX_PP] = pp_boost;
        this.boost_stats[main_stats.ATTACK] = atk_boost;
        this.boost_stats[main_stats.DEFENSE] = def_boost;
        this.boost_stats[main_stats.AGILITY] = agi_boost;
        this.boost_stats[main_stats.LUCK] = luk_boost;
        this.status = djinn_status.SET;
        this.index = index;
        this.recovery_turn = 0;
        this.owner = null;
    }

    set_status(status: djinn_status) {
        if (status === djinn_status.RECOVERY) {
            if (!Djinn.djinn_in_recover.includes(this.key_name)) {
                Djinn.djinn_in_recover.push(this.key_name);
            }
        } else if (this.status === djinn_status.RECOVERY) {
            Djinn.djinn_in_recover = Djinn.djinn_in_recover.filter(key_name => key_name !== this.key_name);
            this.recovery_turn = 0;
        }

        this.status = status;

        if (this.owner) {
            this.owner.update_elemental_attributes();
            this.owner.update_class();
            this.owner.update_attributes();
            this.owner.update_abilities();
        }
    }

    static sprite_base_key(element?: elements) {
        return `${element}_djinn`;
    }

    static has_standby_djinn(djinni_list, members) {
        return _.some(
            members
                .map(char => char.djinni)
                .map(djinn_keys => {
                    return djinn_keys.filter(key => djinni_list[key].status === djinn_status.STANDBY).length;
                })
        );
    }

    static get_standby_djinni(djinni_list: {[key: string]: Djinn}, members: MainChar[]) {
        const standby_djinni = _.mapValues(
            _.groupBy(members.map(c => c.djinni).flat(), key => {
                return djinni_list[key].element;
            }),
            djinni_keys => djinni_keys.filter(key => djinni_list[key].status === djinn_status.STANDBY).length
        );
        for (let i = 0; i < ordered_elements.length; ++i) {
            const element = ordered_elements[i];
            if (!(element in standby_djinni)) {
                standby_djinni[element] = 0;
            }
        }
        return standby_djinni;
    }

    static set_to_recovery(
        djinni_list: GameInfo["djinni_list"],
        members: MainChar[],
        requirements: Summon["requirements"]
    ) {
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
                    djinn.set_status(djinn_status.RECOVERY);
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
