import { SpriteBase } from './SpriteBase.js';
import { choose_right_class } from './Classes.js';
import { djinni_list } from '../chars/djinni.js';
import { djinn_status } from './Djinn.js';

export const temporary_status = {
    DELUSION: "delusion",
    STUN: "stun",
    SLEEP: "sleep",
    SEAL: "seal",
    DEATH_CURSE: "death_curse"
};

export const permanent_status = {
    DOWNED: "downed",
    POISON: "poison",
    EQUIP_CURSE: "equip_curse",
    HAUNT: "haunt"
}

export const elements = {
    VENUS: "venus",
    MERCURY: "mercury",
    MARS: "mars",
    JUPITER: "jupiter",
    NO_ELEMENT: "no_element"
};

const ELEM_LV_DELTA = 1;
const ELEM_POWER_DELTA = 5;
const ELEM_RESIST_DELTA = 5;

export class MainChar extends SpriteBase {
    constructor (
        key_name,
        actions,
        index,
        walk_speed,
        dash_speed,
        climb_speed,
        push_speed,
        avatar_image_path,
        name,
        hp_curve,
        pp_curve,
        atk_curve,
        def_curve,
        agi_curve,
        luk_curve,
        exp_curve,
        starting_level,
        venus_level_base,
        mercury_level_base,
        mars_level_base,
        jupiter_level_base,
        venus_power_base,
        mercury_power_base,
        mars_power_base,
        jupiter_power_base,
        venus_resist_base,
        mercury_resist_base,
        mars_resist_base,
        jupiter_resist_base,
        innate_abilities,
        in_party,
        djinni
    ) {
        super(key_name, actions);
        this.index = index;
        this.walk_speed = walk_speed;
        this.dash_speed = dash_speed;
        this.climb_speed = climb_speed;
        this.push_speed = push_speed;
        this.avatar_image_path = avatar_image_path;
        this.name = name;
        this.temporary_status = new Set();
        this.permanent_status = new Set();
        this.starting_level = starting_level;
        this.level = this.starting_level;
        this.exp_curve = exp_curve;
        this.starting_exp = this.exp_curve[this.level];
        this.current_exp = this.starting_exp;
        this.venus_level_base = venus_level_base;
        this.mercury_level_base = mercury_level_base;
        this.mars_level_base = mars_level_base;
        this.jupiter_level_base = jupiter_level_base;
        this.venus_power_base = venus_power_base;
        this.mercury_power_base = mercury_power_base;
        this.mars_power_base = mars_power_base;
        this.jupiter_power_base = jupiter_power_base;
        this.venus_resist_base = venus_resist_base;
        this.mercury_resist_base = mercury_resist_base;
        this.mars_resist_base = mars_resist_base;
        this.jupiter_resist_base = jupiter_resist_base;
        this.init_elemental_attributes();
        this.element_afinity = _.max([
            {element: elements.VENUS, level: this.venus_level_base},
            {element: elements.MERCURY, level: this.mercury_level_base},
            {element: elements.MARS, level: this.mars_level_base},
            {element: elements.JUPITER, level: this.jupiter_level_base},
        ], element => element.level).element;
        this.venus_djinni = new Set();
        this.mercury_djinni = new Set();
        this.mars_djinni = new Set();
        this.jupiter_djinni = new Set();
        this.init_djinni(djinni);
        this.class = choose_right_class(this.element_afinity, this.venus_level_base, this.mercury_level_base, this.mars_level_base, this.jupiter_level_base);
        this.hp_curve = hp_curve;
        this.pp_curve = pp_curve;
        this.atk_curve = atk_curve;
        this.def_curve = def_curve;
        this.agi_curve = agi_curve;
        this.luk_curve = luk_curve;
        this.update_attributes();
        this.innate_abilities = innate_abilities;
        this.in_party = in_party;
        this.abilities = [];
        this.set_abilities();
    }

    get djinni() {
        return new Set([...this.venus_djinni, ...this.mercury_djinni, ...this.mercury_djinni, ...this.jupiter_djinni]);
    }

    load_assets(game, load_callback) {
        game.load.image(this.key_name + '_avatar', this.avatar_image_path).onLoadComplete.addOnce(load_callback);
        game.load.start();
    }

    init_djinni(djinni) {
        for (let i = 0; i < djinni.length; ++i) {
            let djinn = djinni_list[djinni[i]];
            switch (djinn.element) {
                case elements.VENUS:
                    this.venus_djinni.add(djinn.key_name);
                    break;
                case elements.MERCURY:
                    this.mercury_djinni.add(djinn.key_name);
                    break;
                case elements.MARS:
                    this.mars_djinni.add(djinn.key_name);
                    break;
                case elements.JUPITER:
                    this.jupiter_djinni.add(djinn.key_name);
                    break;
            }
        }
        this.update_elemental_attributes();
    }

    set_max_hp() {
        this.max_hp = parseInt(this.hp_curve[this.starting_level] * this.class.hp_boost);
        for (let djinn_key_name of this.djinni) {
            let djinn = djinni_list[djinn_key_name];
            if (djinn.status !== djinn_status.SET) continue;
            this.max_hp += djinn.hp_boost;
        }
        if (this.current_hp === undefined) {
            this.current_hp = this.max_hp;
        } else {
            this.current_hp *= parseInt(this.class.hp_boost);
        }
    }

    set_max_pp() {
        this.max_pp = parseInt(this.pp_curve[this.starting_level] * this.class.pp_boost);
        for (let djinn_key_name of this.djinni) {
            let djinn = djinni_list[djinn_key_name];
            if (djinn.status !== djinn_status.SET) continue;
            this.max_pp += djinn.pp_boost;
        }
        if (this.current_pp === undefined) {
            this.current_pp = this.max_pp;
        } else {
            this.current_pp *= parseInt(this.class.pp_boost);
        }
    }

    set_max_atk() {
        this.atk = parseInt(this.atk_curve[this.starting_level] * this.class.atk_boost);
        for (let djinn_key_name of this.djinni) {
            let djinn = djinni_list[djinn_key_name];
            if (djinn.status !== djinn_status.SET) continue;
            this.atk += djinn.atk_boost;
        }
        if (this.current_atk === undefined) {
            this.current_atk = this.atk;
        } else {
            this.current_atk *= parseInt(this.class.atk_boost);
        }
    }

    set_max_def() {
        this.def = parseInt(this.def_curve[this.starting_level] * this.class.def_boost);
        for (let djinn_key_name of this.djinni) {
            let djinn = djinni_list[djinn_key_name];
            if (djinn.status !== djinn_status.SET) continue;
            this.def += djinn.def_boost;
        }
        if (this.current_def === undefined) {
            this.current_def = this.def;
        } else {
            this.current_def *= parseInt(this.class.def_boost);
        }
    }

    set_max_agi() {
        this.agi = parseInt(this.agi_curve[this.starting_level] * this.class.agi_boost);
        for (let djinn_key_name of this.djinni) {
            let djinn = djinni_list[djinn_key_name];
            if (djinn.status !== djinn_status.SET) continue;
            this.agi += djinn.agi_boost;
        }
        if (this.current_agi === undefined) {
            this.current_agi = this.agi;
        } else {
            this.current_agi *= parseInt(this.class.agi_boost);
        }
    }

    set_max_luk() {
        this.luk = parseInt(this.luk_curve[this.starting_level] * this.class.luk_boost);
        for (let djinn_key_name of this.djinni) {
            let djinn = djinni_list[djinn_key_name];
            if (djinn.status !== djinn_status.SET) continue;
            this.luk += djinn.luk_boost;
        }
        if (this.current_luk === undefined) {
            this.current_luk = this.luk;
        } else {
            this.current_luk *= parseInt(this.class.luk_boost);
        }
    }

    update_attributes() {
        this.set_max_hp();
        this.set_max_pp();
        this.set_max_atk();
        this.set_max_def();
        this.set_max_agi();
        this.set_max_luk();
    }

    init_elemental_attributes() {
        this.venus_level_current = this.venus_level_base;
        this.mercury_level_current = this.mercury_level_base;
        this.mars_level_current = this.mars_level_base;
        this.jupiter_level_current = this.jupiter_level_base;
        this.venus_power_current = this.venus_power_base;
        this.mercury_power_current = this.mercury_power_base;
        this.mars_power_current = this.mars_power_base;
        this.jupiter_power_current = this.jupiter_power_base;
        this.venus_resist_current = this.venus_resist_base;
        this.mercury_resist_current = this.mercury_resist_base;
        this.mars_resist_current = this.mars_resist_base;
        this.jupiter_resist_current = this.jupiter_resist_base;
    }

    update_elemental_attributes() {
        for (let i = 0; i < this.djinni.length; ++i) {
            let djinn = djinni_list[djinni[i]];
            switch (djinn.element) {
                case elements.VENUS:
                    this.venus_level_current = this.venus_level_base + ELEM_LV_DELTA;
                    this.venus_power_current = this.venus_power_base + ELEM_POWER_DELTA;
                    this.venus_resist_current = this.venus_resist_base + ELEM_RESIST_DELTA;
                    break;
                case elements.MERCURY:
                    this.mercury_level_current = this.mercury_level_base + ELEM_LV_DELTA;
                    this.mercury_power_current = this.mercury_power_base + ELEM_POWER_DELTA;
                    this.mercury_resist_current = this.mercury_resist_base + ELEM_RESIST_DELTA;
                    break;
                case elements.MARS:
                    this.mars_level_current = this.mars_level_base + ELEM_LV_DELTA;
                    this.mars_power_current = this.mars_power_base + ELEM_POWER_DELTA;
                    this.mars_resist_current = this.mars_resist_base + ELEM_RESIST_DELTA;
                    break;
                case elements.JUPITER:
                    this.jupiter_level_current = this.jupiter_level_base + ELEM_LV_DELTA;
                    this.jupiter_power_current = this.jupiter_power_base + ELEM_POWER_DELTA;
                    this.jupiter_resist_current = this.jupiter_resist_base + ELEM_RESIST_DELTA;
                    break;
            }
        }
    }

    set_abilities() {
        this.abilities = this.innate_abilities.concat(this.class.ability_level_pairs.filter(pair => {
            return pair.level <= this.level;
        }).map(pair => pair.ability));
    }
}