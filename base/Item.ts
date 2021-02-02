import {elements} from "./utils";

export enum item_types {
    WEAPONS = "weapons",
    ARMOR = "armor",
    CHEST_PROTECTOR = "chest_protector",
    HEAD_PROTECTOR = "head_protector",
    LEG_PROTECTOR = "leg_protector",
    ABILITY_GRANTOR = "ability_grantor",
    CLASS_CHANGER = "class_changer",
    RING = "ring",
    UNDERWEAR = "underwear",
    GENERAL_ITEM = "general_item",
}

export enum use_types {
    MULTIPLE_USES = "multiple_uses",
    SINGLE_USE = "single_use",
    BREAKS_WHEN_USE = "breaks_when_use",
    NO_USE = "no_use",
}

export enum weapon_types {
    NOT_A_WEAPON = "not_a_weapon",
    LONG_SWORD = "sword",
    LIGHT_BLADE = "light_blade",
    AXE = "axe",
    MACE = "mace",
    STAFF = "staff",
}

export class Item {
    public static readonly BREAKS_CHANCE = 1 / 8;

    public key_name: string;
    public name: string;
    public type: item_types;
    public description: string;
    public use_type: use_types;
    public curses_when_equipped: boolean;
    public cant_be_removed: boolean;
    public rare_item: boolean;
    public important_item: boolean;
    public carry_up_to_30: boolean;
    public effects: any;
    public element: elements;
    public unleash_ability: string;
    public unleash_rate: number;
    public use_ability: string;
    public equipable_chars: string[];
    public price: number;
    public granted_ability: string;
    public equipable: boolean;
    public granted_class_type: number;

    constructor(
        key_name,
        name,
        type,
        description,
        use_type,
        curses_when_equipped,
        cant_be_removed,
        rare_item,
        important_item,
        carry_up_to_30,
        effects,
        element,
        unleash_ability,
        unleash_rate,
        use_ability,
        equipable_chars,
        price,
        granted_ability,
        granted_class_type
    ) {
        this.key_name = key_name;
        this.name = name;
        this.type = type;
        this.description = description;
        this.use_type = use_type;
        this.curses_when_equipped = curses_when_equipped;
        this.cant_be_removed = cant_be_removed;
        this.rare_item = rare_item;
        this.important_item = important_item;
        this.carry_up_to_30 = carry_up_to_30;
        this.effects = effects;
        this.element = element;
        this.unleash_ability = unleash_ability;
        this.unleash_rate = unleash_rate;
        this.use_ability = use_ability;
        this.equipable_chars = equipable_chars;
        this.price = price;
        this.granted_ability = granted_ability;
        this.equipable = this.type === item_types.GENERAL_ITEM ? false : true;
        this.granted_class_type = granted_class_type;
    }
}
