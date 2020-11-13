import {SpriteBase} from "./SpriteBase";
import {choose_right_class, Classes} from "./Classes";
import {djinn_status} from "./Djinn";
import {Effect, effect_types} from "./Effect";
import {Item, item_types} from "./Item";
import {Player, fighter_types, permanent_status, main_stats, effect_type_stat} from "./Player";
import {elements, ordered_elements} from "./utils";
import {ELEM_ATTR_MIN, ELEM_ATTR_MAX} from "./magic_numbers";
import * as _ from "lodash";
import {GameInfo, PartyData} from "./initializers/initialize_info";
import {Ability} from "./Ability";

export type ItemSlot = {
    key_name: string;
    quantity: number;
    index?: number;
    equipped?: boolean;
    broken?: boolean;
};

export enum equip_slots {
    WEAPON = "weapon",
    HEAD = "head",
    CHEST = "chest",
    BODY = "body",
    RING = "ring",
    BOOTS = "boots",
    UNDERWEAR = "underwear",
}

export const item_equip_slot = {
    [item_types.WEAPONS]: equip_slots.WEAPON,
    [item_types.ARMOR]: equip_slots.BODY,
    [item_types.CHEST_PROTECTOR]: equip_slots.CHEST,
    [item_types.HEAD_PROTECTOR]: equip_slots.HEAD,
    [item_types.LEG_PROTECTOR]: equip_slots.BOOTS,
    [item_types.RING]: equip_slots.RING,
    [item_types.UNDERWEAR]: equip_slots.UNDERWEAR,
};

export class MainChar extends Player {
    private static readonly ELEM_LV_DELTA = 1;
    private static readonly ELEM_POWER_DELTA = 5;
    private static readonly ELEM_RESIST_DELTA = 5;
    public static readonly MAX_ITEMS_PER_CHAR = 30;

    public info: GameInfo;
    public sprite_base: SpriteBase;
    public walk_speed: number;
    public dash_speed: number;
    public climb_speed: number;
    public starting_level: number;
    public class_table: any;
    public class: Classes;
    public exp_curve: number[];
    public venus_level_base: number;
    public mercury_level_base: number;
    public mars_level_base: number;
    public jupiter_level_base: number;
    public venus_power_base: number;
    public mercury_power_base: number;
    public mars_power_base: number;
    public jupiter_power_base: number;
    public venus_resist_base: number;
    public mercury_resist_base: number;
    public mars_resist_base: number;
    public jupiter_resist_base: number;
    public element_afinity: elements;
    public venus_djinni: string[];
    public mercury_djinni: string[];
    public mars_djinni: string[];
    public jupiter_djinni: string[];
    public hp_curve: number[];
    public pp_curve: number[];
    public atk_curve: number[];
    public def_curve: number[];
    public agi_curve: number[];
    public luk_curve: number[];
    public hp_extra: number;
    public pp_extra: number;
    public atk_extra: number;
    public def_extra: number;
    public agi_extra: number;
    public luk_extra: number;
    public items: ItemSlot[];
    public equip_slots: {[slot in equip_slots]: ItemSlot};
    public equipped_abilities: string[];
    public innate_abilities: string[];
    public in_party: boolean;
    public abilities: string[];

    constructor(
        key_name,
        info,
        sprite_base,
        walk_speed,
        dash_speed,
        climb_speed,
        name,
        hp_curve,
        pp_curve,
        atk_curve,
        def_curve,
        agi_curve,
        luk_curve,
        exp_curve,
        starting_level,
        class_table,
        battle_scale,
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
        djinni,
        items,
        battle_animations_variations
    ) {
        super(key_name, name);
        this.info = info;
        this.sprite_base = sprite_base;
        this.walk_speed = walk_speed;
        this.dash_speed = dash_speed;
        this.climb_speed = climb_speed;
        this.starting_level = starting_level;
        this.level = this.starting_level;
        this.class_table = class_table;
        this.battle_scale = battle_scale;
        this.exp_curve = exp_curve;
        this.current_exp = this.exp_curve[this.level - 1];
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
        this.element_afinity = _.maxBy(
            [
                {element: elements.VENUS, level: this.venus_level_base},
                {element: elements.MERCURY, level: this.mercury_level_base},
                {element: elements.MARS, level: this.mars_level_base},
                {element: elements.JUPITER, level: this.jupiter_level_base},
            ],
            element => element.level
        ).element;
        this.venus_djinni = [];
        this.mercury_djinni = [];
        this.mars_djinni = [];
        this.jupiter_djinni = [];
        this.init_djinni(djinni);
        this.update_class();
        this.hp_curve = hp_curve;
        this.pp_curve = pp_curve;
        this.atk_curve = atk_curve;
        this.def_curve = def_curve;
        this.agi_curve = agi_curve;
        this.luk_curve = luk_curve;
        this.hp_extra = 0;
        this.pp_extra = 0;
        this.atk_extra = 0;
        this.def_extra = 0;
        this.agi_extra = 0;
        this.luk_extra = 0;
        this.hp_recovery = 0;
        this.pp_recovery = 0;
        this.items = items;
        this.equip_slots = {
            [equip_slots.WEAPON]: null,
            [equip_slots.HEAD]: null,
            [equip_slots.CHEST]: null,
            [equip_slots.BODY]: null,
            [equip_slots.RING]: null,
            [equip_slots.BOOTS]: null,
            [equip_slots.UNDERWEAR]: null,
        };
        this.equipped_abilities = [];
        this.innate_abilities = innate_abilities;
        this.init_items();
        this.update_attributes();
        this.update_elemental_attributes();
        this.in_party = in_party;
        this.abilities = [];
        this.update_abilities();
        this.turns = 1;
        this.fighter_type = fighter_types.ALLY;
        this.battle_animations_variations = Object.assign({}, battle_animations_variations);
    }

    get djinni() {
        let this_djinni_list = this.venus_djinni.concat(this.mercury_djinni, this.mars_djinni, this.jupiter_djinni);
        return this_djinni_list.sort((a, b) => {
            return this.info.djinni_list[a].index - this.info.djinni_list[b].index;
        });
    }

    update_class() {
        this.class = choose_right_class(
            this.info.classes_list,
            this.class_table,
            this.element_afinity,
            this.venus_level_current,
            this.mercury_level_current,
            this.mars_level_current,
            this.jupiter_level_current
        );
    }

    add_exp(value: number) {
        let return_data = {
            before: {
                level: this.level,
                abilities: this.abilities.slice(),
                stats: [
                    {max_hp: this.max_hp},
                    {max_pp: this.max_pp},
                    {atk: this.atk},
                    {def: this.def},
                    {agi: this.agi},
                    {luk: this.luk},
                ],
            },
            after: null,
        };
        this.current_exp += value;
        this.level = _.findIndex(this.exp_curve, exp => exp > this.current_exp);
        this.update_all();
        return_data.after = {
            level: this.level,
            abilities: this.abilities.slice(),
            stats: [
                {max_hp: this.max_hp},
                {max_pp: this.max_pp},
                {atk: this.atk},
                {def: this.def},
                {agi: this.agi},
                {luk: this.luk},
            ],
        };
        return return_data;
    }

    init_items() {
        this.items.forEach((item_obj, index) => {
            item_obj.index = index;
            if (item_obj.equipped) {
                this.equip_item(index, true);
            }
        });
    }

    add_item(item_key_name: string, quantity: number, equip: boolean) {
        let found = false;
        if (this.info.items_list[item_key_name].type === item_types.GENERAL_ITEM) {
            this.items.forEach(item_obj => {
                if (item_obj.key_name === item_key_name) {
                    found = true;
                    item_obj.quantity += quantity;
                }
            });
        }
        if (found) return;
        this.items.push({
            key_name: item_key_name,
            quantity: quantity,
            equipped: false,
            index: this.items.length,
        });
        if (equip) {
            this.equip_item(this.items.length - 1);
        }
    }

    remove_item(item_obj_to_remove: ItemSlot, quantity: number) {
        let adjust_index = false;
        this.items = this.items.filter((item_obj, index) => {
            if (item_obj_to_remove.key_name === item_obj.key_name) {
                if (item_obj.equipped) {
                    this.unequip_item(index);
                }
                if (item_obj.quantity - quantity >= 1) {
                    item_obj.quantity = item_obj.quantity - quantity;
                    return true;
                }
                adjust_index = true;
                return false;
            }
            if (adjust_index) {
                --item_obj.index;
            }
            return true;
        });
    }

    equip_item(index: number, initialize: boolean = false) {
        const item_obj = this.items[index];
        if (item_obj.equipped && !initialize) return;
        const item = this.info.items_list[item_obj.key_name];
        if (item.type in item_equip_slot && this.equip_slots[item_equip_slot[item.type]] !== null) {
            this.unequip_item(this.equip_slots[item_equip_slot[item.type]].index);
        }
        this.equip_slots[item_equip_slot[item.type]] = item_obj;
        item_obj.equipped = true;
        for (let i = 0; i < item.effects.length; ++i) {
            this.add_effect(item.effects[i], item);
        }
        this.update_attributes();
        this.update_elemental_attributes();
        if (item.type === item_types.ABILITY_GRANTOR) {
            this.equipped_abilities.push(item.granted_ability);
            this.update_abilities();
        }
    }

    unequip_item(index: number) {
        const item_obj = this.items[index];
        if (!item_obj.equipped) return;
        const item = this.info.items_list[item_obj.key_name];
        if (item.type in item_equip_slot && this.equip_slots[item_equip_slot[item.type]] !== null) {
            this.equip_slots[item_equip_slot[item.type]] = null;
        }
        item_obj.equipped = false;
        this.effects.forEach(effect => {
            if (effect.effect_owner_instance === item) {
                this.remove_effect(effect);
            }
        });
        this.update_attributes();
        this.update_elemental_attributes();
        if (item.type === item_types.ABILITY_GRANTOR) {
            this.equipped_abilities = this.equipped_abilities.filter(ability => {
                return ability !== item.granted_ability;
            });
            this.update_abilities();
        }
    }

    init_djinni(djinni: string[]) {
        for (let i = 0; i < djinni.length; ++i) {
            const djinn = this.info.djinni_list[djinni[i]];
            switch (djinn.element) {
                case elements.VENUS:
                    this.venus_djinni.push(djinn.key_name);
                    break;
                case elements.MERCURY:
                    this.mercury_djinni.push(djinn.key_name);
                    break;
                case elements.MARS:
                    this.mars_djinni.push(djinn.key_name);
                    break;
                case elements.JUPITER:
                    this.jupiter_djinni.push(djinn.key_name);
                    break;
            }
        }
        this.update_elemental_attributes();
    }

    add_djinn(djinn_key_name: string) {
        const djinn = this.info.djinni_list[djinn_key_name];
        switch (djinn.element) {
            case elements.VENUS:
                this.venus_djinni.push(djinn.key_name);
                break;
            case elements.MERCURY:
                this.mercury_djinni.push(djinn.key_name);
                break;
            case elements.MARS:
                this.mars_djinni.push(djinn.key_name);
                break;
            case elements.JUPITER:
                this.jupiter_djinni.push(djinn.key_name);
                break;
        }
        this.update_all();
    }

    remove_djinn(djinn_key_name: string) {
        const djinn = this.info.djinni_list[djinn_key_name];
        let this_djinni_list;
        switch (djinn.element) {
            case elements.VENUS:
                this_djinni_list = this.venus_djinni;
                break;
            case elements.MERCURY:
                this_djinni_list = this.mercury_djinni;
                break;
            case elements.MARS:
                this_djinni_list = this.mars_djinni;
                break;
            case elements.JUPITER:
                this_djinni_list = this.jupiter_djinni;
                break;
        }
        const index = this_djinni_list.indexOf(djinn_key_name);
        if (index !== -1) this_djinni_list.splice(index, 1);
        this.update_all();
    }

    replace_djinn(old_djinn_key_name: string, new_djinn_key_name: string) {
        this.remove_djinn(old_djinn_key_name);
        this.add_djinn(new_djinn_key_name);
    }

    preview_djinn_change(stats: main_stats[], djinni_key_name: string[], djinni_next_status: djinn_status[], action?) {
        const previous_class = this.class;
        let venus_lv = this.venus_level_current;
        let mercury_lv = this.mercury_level_current;
        let mars_lv = this.mars_level_current;
        let jupiter_lv = this.jupiter_level_current;
        for (let i = 0; i < djinni_key_name.length; ++i) {
            const djinn = this.info.djinni_list[djinni_key_name[i]];
            let lv_shift;
            switch (djinni_next_status[i]) {
                case djinn_status.SET:
                    lv_shift = MainChar.ELEM_LV_DELTA;
                    break;
                case djinn_status.RECOVERY:
                case djinn_status.ANY:
                    lv_shift = 0;
                    break;
                default:
                    lv_shift = -MainChar.ELEM_LV_DELTA;
            }
            switch (djinn.element) {
                case elements.VENUS:
                    venus_lv += lv_shift;
                    break;
                case elements.MERCURY:
                    mercury_lv += lv_shift;
                    break;
                case elements.MARS:
                    mars_lv += lv_shift;
                    break;
                case elements.JUPITER:
                    jupiter_lv += lv_shift;
                    break;
            }
        }
        this.class = choose_right_class(
            this.info.classes_list,
            this.class_table,
            this.element_afinity,
            venus_lv,
            mercury_lv,
            mars_lv,
            jupiter_lv
        );
        let return_obj = {
            class_name: this.class.name,
            class_key_name: this.class.key_name,
            abilities: null,
        };
        return_obj.abilities = this.innate_abilities.concat(
            this.class.ability_level_pairs
                .filter(pair => {
                    return pair.level <= this.level && !this.innate_abilities.includes(pair.ability);
                })
                .map(pair => pair.ability),
            this.equipped_abilities
        );
        djinni_next_status = djinni_next_status.map(status =>
            status === djinn_status.ANY ? djinn_status.STANDBY : status
        );
        stats.forEach(stat => {
            return_obj[stat] = this.preview_stats_by_djinn(stat, djinni_key_name, djinni_next_status, action);
        });
        this.class = previous_class;
        return return_obj;
    }

    preview_stats_by_djinn(stat: main_stats, djinni_key_name: string[], djinni_next_status: djinn_status[], action) {
        const preview_obj = {
            djinni_key_name: djinni_key_name,
            djinni_next_status: djinni_next_status,
            action: action,
        };
        return this.set_max_stat(stat, true, preview_obj);
    }

    preview_stats_by_effect(effect_type: effect_types, effect_obj, item_key_name: string) {
        const preview_obj = {
            effect_obj: effect_obj,
            item_key_name: item_key_name,
        };
        return this.set_max_stat(effect_type_stat[effect_type], true, preview_obj);
    }

    preview_stat_without_abilities_effect(stat: main_stats) {
        return this.set_max_stat(stat, true, {ignore_ability_effect: true});
    }

    set_max_stat(stat: main_stats, preview = false, preview_obj: any = {}) {
        const stat_prefix = [main_stats.MAX_HP, main_stats.MAX_PP].includes(stat) ? stat.split("_")[1] : stat;
        const stat_key = stat;
        const boost_key = stat_prefix + "_boost";
        const curve_key = stat_prefix + "_curve";
        const extra_key = stat_prefix + "_extra";
        const previous_value = this[stat_key];

        //setting stats by current level and extra values
        this[stat_key] = (this[curve_key][this.level] * this.class[boost_key] + this[extra_key]) | 0;

        let this_djinni = this.djinni;
        if (preview) {
            if (preview_obj.action === "Trade") {
                const first_index = this_djinni.indexOf(preview_obj.djinni_key_name[0]);
                if (first_index >= 0) {
                    this_djinni[first_index] = preview_obj.djinni_key_name[1];
                } else {
                    this_djinni[this_djinni.indexOf(preview_obj.djinni_key_name[1])] = preview_obj.djinni_key_name[0];
                }
            } else if (preview_obj.action === "Give") {
                this_djinni.push(preview_obj.djinni_key_name[0]);
            }
        }
        for (let i = 0; i < this_djinni.length; ++i) {
            let djinn_key_name = this_djinni[i];
            let djinn = this.info.djinni_list[djinn_key_name];
            let status = djinn.status;
            if (preview && preview_obj.djinni_key_name && preview_obj.djinni_key_name.includes(djinn_key_name)) {
                status = preview_obj.djinni_next_status[preview_obj.djinni_key_name.indexOf(djinn_key_name)];
            }
            if (status !== djinn_status.SET) continue;
            this[stat_key] += djinn[boost_key];
        }
        this.effects.forEach(effect => {
            if (
                preview &&
                effect.effect_owner_instance &&
                preview_obj.item_key_name === effect.effect_owner_instance.key_name
            )
                return;
            if (preview && preview_obj.ignore_ability_effect && effect.effect_owner_instance instanceof Ability) return;
            let effect_type;
            switch (stat) {
                case main_stats.MAX_HP:
                    effect_type = effect_types.MAX_HP;
                    break;
                case main_stats.MAX_PP:
                    effect_type = effect_types.MAX_PP;
                    break;
                case main_stats.ATTACK:
                    effect_type = effect_types.ATTACK;
                    break;
                case main_stats.DEFENSE:
                    effect_type = effect_types.DEFENSE;
                    break;
                case main_stats.AGILITY:
                    effect_type = effect_types.AGILITY;
                    break;
                case main_stats.LUCK:
                    effect_type = effect_types.LUCK;
                    break;
            }
            if (effect.type === effect_type) {
                effect.apply_effect();
            }
        });
        if (preview) {
            const preview_value = preview_obj.effect_obj
                ? Effect.preview_value_applied(preview_obj.effect_obj, this[stat_key])
                : this[stat_key];
            this[stat_key] = previous_value;
            return preview_value;
        }
        if ([main_stats.MAX_HP, main_stats.MAX_PP].includes(stat)) {
            const current_key = stat === main_stats.MAX_HP ? main_stats.CURRENT_HP : main_stats.CURRENT_PP;
            if (this[current_key] === undefined) {
                this[current_key] = this[stat_key];
            } else {
                this[current_key] = Math.round((this[current_key] * this[stat_key]) / previous_value);
            }
        }
    }

    update_attributes() {
        this.set_max_stat(main_stats.MAX_HP);
        this.set_max_stat(main_stats.MAX_PP);
        this.set_max_stat(main_stats.ATTACK);
        this.set_max_stat(main_stats.DEFENSE);
        this.set_max_stat(main_stats.AGILITY);
        this.set_max_stat(main_stats.LUCK);
    }

    add_extra_max_hp(amount: number) {
        this.hp_extra += amount;
    }

    add_extra_max_pp(amount: number) {
        this.pp_extra += amount;
    }

    add_extra_max_atk(amount: number) {
        this.atk_extra += amount;
    }

    add_extra_max_def(amount: number) {
        this.def_extra += amount;
    }

    add_extra_max_agi(amount: number) {
        this.agi_extra += amount;
    }

    add_extra_max_luk(amount: number) {
        this.luk_extra += amount;
    }

    preview_elemental_stats_without_abilities_effect() {
        return this.update_elemental_attributes(true, true);
    }

    update_elemental_attributes(preview: boolean = false, ignore_ability_effects: boolean = false) {
        const previous_stats = {};
        ordered_elements.forEach(element => {
            if (preview) {
                previous_stats[element] = {
                    power: this[element + "_power_current"],
                    resist: this[element + "_resist_current"],
                    level: this[element + "_level_current"],
                };
            }
            this[element + "_power_current"] = this[element + "_power_base"];
            this[element + "_resist_current"] = this[element + "_resist_base"];
            this[element + "_level_current"] = this[element + "_level_base"];
        });

        for (let i = 0; i < this.djinni.length; ++i) {
            let djinn = this.info.djinni_list[this.djinni[i]];
            if (djinn.status !== djinn_status.SET) continue;
            this[djinn.element + "_power_current"] += MainChar.ELEM_POWER_DELTA;
            this[djinn.element + "_resist_current"] += MainChar.ELEM_RESIST_DELTA;
            this[djinn.element + "_level_current"] += MainChar.ELEM_LV_DELTA;
        }

        this.effects.forEach(effect => {
            if (effect.type === effect_types.POWER || effect.type === effect_types.RESIST) {
                if (ignore_ability_effects && effect.effect_owner_instance instanceof Ability) return;
                effect.apply_effect();
            }
        });

        for (let i = 0; i < ordered_elements.length; ++i) {
            const element = ordered_elements[i];
            const power_key = element + "_power_current";
            const resist_key = element + "_resist_current";
            this[power_key] = _.clamp(this[power_key], ELEM_ATTR_MIN, ELEM_ATTR_MAX);
            this[resist_key] = _.clamp(this[resist_key], ELEM_ATTR_MIN, ELEM_ATTR_MAX);
        }

        if (preview) {
            const elemental_stats = Object.fromEntries(
                ordered_elements.map(element => {
                    const return_data = [
                        element,
                        {
                            power: this[element + "_power_current"],
                            resist: this[element + "_resist_current"],
                            level: this[element + "_level_current"],
                        },
                    ];
                    this[element + "_power_current"] = previous_stats[element].power;
                    this[element + "_resist_current"] = previous_stats[element].resist;
                    this[element + "_level_current"] = previous_stats[element].level;
                    return return_data;
                })
            );
            return elemental_stats;
        } else {
            return null;
        }
    }

    update_abilities() {
        this.abilities = this.innate_abilities.concat(
            this.class.ability_level_pairs
                .filter(pair => {
                    return pair.level <= this.level && !this.innate_abilities.includes(pair.ability);
                })
                .map(pair => pair.ability),
            this.equipped_abilities
        );
    }

    update_all() {
        this.update_elemental_attributes();
        this.update_class();
        this.update_attributes();
        this.update_abilities();
    }

    static get_active_players(party_data: PartyData, max: number) {
        return party_data.members.slice(0, max).filter(char => {
            return !char.has_permanent_status(permanent_status.DOWNED);
        });
    }

    static add_item_to_party(party_data: PartyData, item: Item, quantity: number) {
        for (let i = 0; i < party_data.members.length; ++i) {
            const char = party_data.members[i];
            if (char.items.length < MainChar.MAX_ITEMS_PER_CHAR) {
                char.add_item(item.key_name, quantity, false);
                return true;
            }
        }
        return false;
    }
}
