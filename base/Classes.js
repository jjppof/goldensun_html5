import { classes_list, class_table } from '../initializers/main_chars.js';
import { elements } from '../utils.js';

export class Classes {
    constructor(
        key_name,
        name,
        required_venus_level,
        required_mercury_level,
        required_mars_level,
        required_jupiter_level,
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
        this.required_venus_level = required_venus_level;
        this.required_mercury_level = required_mercury_level;
        this.required_mars_level = required_mars_level;
        this.required_jupiter_level = required_jupiter_level;
        this.hp_boost = hp_boost;
        this.pp_boost = pp_boost;
        this.atk_boost = atk_boost;
        this.def_boost = def_boost;
        this.agi_boost = agi_boost;
        this.luk_boost = luk_boost;
        this.ability_level_pairs = ability_level_pairs;
        this.class_type = class_type;
        this.vulnerabilities = vulnerabilities === undefined ? [] : vulnerabilities;
    }
}

export function choose_right_class(element_afinity, venus_lvl, mercury_lvl, mars_lvl, jupiter_lvl) {
    let secondary_elements = [
        ...element_afinity !== elements.VENUS ? [{element: elements.VENUS, level: venus_lvl}] : [],
        ...element_afinity !== elements.MERCURY ? [{element: elements.MERCURY, level: mercury_lvl}] : [],
        ...element_afinity !== elements.MARS ? [{element: elements.MARS, level: mars_lvl}] : [],
        ...element_afinity !== elements.JUPITER ? [{element: elements.JUPITER, level: jupiter_lvl}] : []
    ];
    const no_secondary = secondary_elements.every(element => element.level === 0);
    let secondary_afinity;
    if (no_secondary) {
        secondary_afinity = element_afinity;
    } else {
        secondary_afinity = _.maxBy(secondary_elements, element => element.level).element;
    }
    const class_type = class_table[element_afinity][secondary_afinity];
    let classes = Object.values(classes_list).filter(this_class => this_class.class_type === class_type);
    classes = classes.filter(this_class => {
        return this_class.required_venus_level <= venus_lvl &&
        this_class.required_mercury_level <= mercury_lvl &&
        this_class.required_mars_level <= mars_lvl &&
        this_class.required_jupiter_level <= jupiter_lvl;
    });
    return _.sortBy(classes, [this_class => {
        return this_class.required_venus_level + this_class.required_mercury_level + this_class.required_mars_level + this_class.required_jupiter_level;
    }]).reverse()[0];
}
