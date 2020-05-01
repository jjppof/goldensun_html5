import { SpriteBase } from './SpriteBase.js';
import { choose_right_class } from './Classes.js';

export const STATUS = {
    NORMAL: {
        name: "Normal"
    }
};
export const elements = {
    VENUS: "venus",
    MERCURY: "mercury",
    MARS: "mars",
    JUPITER: "jupiter"
};

export class MainChar extends SpriteBase {
    constructor (
        key_name,
        actions,
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
        innate_abilities
    ) {
        super(key_name, actions);
        this.walk_speed = walk_speed;
        this.dash_speed = dash_speed;
        this.climb_speed = climb_speed;
        this.push_speed = push_speed;
        this.avatar_image_path = avatar_image_path;
        this.name = name;
        this.status = STATUS.NORMAL;
        this.starting_level = starting_level;
        this.level = this.starting_level;
        this.hp_curve = hp_curve;
        this.max_hp = this.hp_curve[this.starting_level];
        this.current_hp = this.max_hp;
        this.pp_curve = pp_curve;
        this.max_pp = this.pp_curve[this.starting_level];
        this.current_pp = this.max_pp;
        this.atk_curve = atk_curve;
        this.atk = this.atk_curve[this.starting_level];
        this.current_atk = this.atk;
        this.def_curve = def_curve;
        this.def = this.def_curve[this.starting_level];
        this.current_def = this.def;
        this.agi_curve = agi_curve;
        this.agi = this.agi_curve[this.starting_level];
        this.current_agi = this.agi;
        this.luk_curve = luk_curve;
        this.luk = this.luk_curve[this.starting_level];
        this.current_luk = this.luk;
        this.exp_curve = exp_curve;
        this.starting_exp = this.exp_curve[this.level];
        this.current_exp = this.starting_exp;
        this.venus_level_base = venus_level_base;
        this.mercury_level_base = mercury_level_base;
        this.mars_level_base = mars_level_base;
        this.jupiter_level_base = jupiter_level_base;
        this.element_afinity = _.max([
            {element: elements.VENUS, level: this.venus_level_base},
            {element: elements.MERCURY, level: this.mercury_level_base},
            {element: elements.MARS, level: this.mars_level_base},
            {element: elements.JUPITER, level: this.jupiter_level_base},
        ], element => element.level).element;
        this.class = choose_right_class(this.element_afinity, this.venus_level_base, this.mercury_level_base, this.mars_level_base, this.jupiter_level_base);
        this.venus_power_base = venus_power_base;
        this.mercury_power_base = mercury_power_base;
        this.mars_power_base = mars_power_base;
        this.jupiter_power_base = jupiter_power_base;
        this.venus_resist_base = venus_resist_base;
        this.mercury_resist_base = mercury_resist_base;
        this.mars_resist_base = mars_resist_base;
        this.jupiter_resist_base = jupiter_resist_base;
        this.innate_abilities = innate_abilities;
        this.venus_djinni = [];
        this.mercury_djinni = [];
        this.mars_djinni = [];
        this.jupiter_djinni = [];
    }

    load_assets(load_callback) {
        game.load.image(this.key_name + '_avatar', this.avatar_image_path).onLoadComplete.addOnce(load_callback);
        game.load.start();
    }
}