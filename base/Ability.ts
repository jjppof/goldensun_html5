export enum ability_types {
    HEALING = "healing",
    EFFECT_ONLY = "effect_only",
    ADDED_DAMAGE = "added_damage",
    MULTIPLIER = "multiplier",
    BASE_DAMAGE = "base_damage",
    SUMMON = "summon",
    UTILITY = "utility",
    DIRECT_DAMAGE = "direct_damage",
}

export enum ability_msg_types {
    CAST = "cast",
    ATTACK = "attack",
    USE = "use",
    SUMMON = "summon",
    UNLEASH = "unleash",
    DEFEND = "defend",
    ITEM_UNLEASH = "item_unleash",
    SET_DJINN = "set_djinn",
    NO_MSG = "no_msg",
}

export enum ability_target_types {
    NO_TARGET = "no_target",
    ALLY = "ally",
    ENEMY = "enemy",
    USER = "user",
}

export enum ability_categories {
    PSYNERGY = "psynergy",
    DJINN = "djinn",
    SUMMON = "summon",
    ITEM = "item",
    WEAPON_UNLEASH = "weapon_unleash",
    NORMAL = "normal",
}

export const diminishing_ratios = {
    STANDARD: {
        11: 0.1,
        9: 0.2,
        7: 0.4,
        5: 0.6,
        3: 0.8,
        1: 1,
    },
    SUMMON: {
        11: 0.1,
        9: 0.2,
        7: 0.3,
        5: 0.4,
        3: 0.7,
        1: 1,
    },
    DIMINISH: {
        11: 0.1,
        9: 0.1,
        7: 0.1,
        5: 0.3,
        3: 0.5,
        1: 1,
    },
    STATUS: {
        11: 0.3,
        9: 0.3,
        7: 0.3,
        5: 0.3,
        3: 0.6,
        1: 1,
    },
};

export class Ability {
    public key_name: string;
    public name: string;
    public description: string;
    public type: ability_types;
    public element: string;
    public battle_target: string;
    public range: number;
    public pp_cost: number;
    public ability_power: number;
    public effects_outside_battle: boolean;
    public is_battle_ability: boolean;
    public is_field_psynergy: boolean;
    public effects: any;
    public ability_category: ability_categories;
    public battle_animation_key: string;
    public priority_move: boolean;
    public has_critical: boolean;
    public crit_mult_factor: number;
    public can_switch_to_unleash: boolean;
    public can_be_evaded: boolean;
    public use_diminishing_ratio: boolean;
    public msg_type: ability_msg_types;
    public affects_pp: boolean;
    public has_animation_variation: boolean;

    constructor(
        key_name,
        name,
        description,
        type,
        element,
        battle_target,
        range,
        pp_cost,
        ability_power,
        effects_outside_battle,
        is_battle_ability,
        is_field_psynergy,
        effects,
        ability_category,
        battle_animation_key,
        priority_move,
        has_critical,
        crit_mult_factor,
        can_switch_to_unleash,
        can_be_evaded,
        use_diminishing_ratio,
        msg_type,
        affects_pp,
        has_animation_variation
    ) {
        this.key_name = key_name;
        this.name = name;
        this.description = description;
        this.type = type;
        this.element = element;
        this.battle_target = battle_target;
        this.range = range;
        this.pp_cost = pp_cost;
        this.ability_power = ability_power;
        this.effects_outside_battle = effects_outside_battle;
        this.is_battle_ability = is_battle_ability;
        this.is_field_psynergy = is_field_psynergy;
        this.effects = effects;
        this.ability_category = ability_category;
        this.battle_animation_key = battle_animation_key;
        this.priority_move = priority_move ? priority_move : false;
        this.has_critical = has_critical ? has_critical : false;
        this.crit_mult_factor = crit_mult_factor !== undefined ? crit_mult_factor : 1;
        this.can_switch_to_unleash = can_switch_to_unleash ? can_switch_to_unleash : false;
        this.can_be_evaded = can_be_evaded ? can_be_evaded : false;
        this.use_diminishing_ratio = use_diminishing_ratio ? use_diminishing_ratio : false;
        this.msg_type = msg_type === undefined ? ability_msg_types.CAST : msg_type;
        this.affects_pp = affects_pp === undefined ? false : affects_pp;
        this.has_animation_variation = has_animation_variation === undefined ? false : has_animation_variation;
    }

    static get_diminishing_ratios(ability_type, use_diminishing_ratio) {
        if (use_diminishing_ratio) {
            return diminishing_ratios.DIMINISH;
        }
        switch (ability_type) {
            case ability_types.SUMMON:
                return diminishing_ratios.SUMMON;
            default:
                return diminishing_ratios.STANDARD;
        }
    }
}
