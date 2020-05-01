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
        ability_level_pairs
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
    }
}