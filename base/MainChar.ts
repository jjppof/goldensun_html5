import {SpriteBase} from "./SpriteBase";
import {Classes} from "./Classes";
import {Djinn, djinn_status} from "./Djinn";
import {Effect, effect_types} from "./Effect";
import {Item, item_types, item_types_sort_priority} from "./Item";
import {Player, fighter_types, permanent_status, main_stats, effect_type_stat} from "./Player";
import {elements, ordered_elements} from "./utils";
import {ELEM_ATTR_MIN, ELEM_ATTR_MAX} from "./magic_numbers";
import * as _ from "lodash";
import {GameInfo, PartyData} from "./initializers/initialize_info";
import {Ability} from "./Ability";
import {djinn_actions} from "./main_menus/MainDjinnMenu";
import {Button} from "./XGamepad";

export type ItemSlot = {
    key_name: string;
    quantity: number;
    index?: number;
    equipped?: boolean;
    broken?: boolean;
    additional_details?: {[detail_key: string]: string};
};

export enum equip_slots {
    WEAPON = "weapon",
    HEAD = "head",
    CHEST = "chest",
    BODY = "body",
    RING = "ring",
    BOOTS = "boots",
    UNDERWEAR = "underwear",
    CLASS_CHANGER = "class_changer",
}

export const item_equip_slot = {
    [item_types.WEAPONS]: equip_slots.WEAPON,
    [item_types.ARMOR]: equip_slots.BODY,
    [item_types.CHEST_PROTECTOR]: equip_slots.CHEST,
    [item_types.HEAD_PROTECTOR]: equip_slots.HEAD,
    [item_types.LEG_PROTECTOR]: equip_slots.BOOTS,
    [item_types.RING]: equip_slots.RING,
    [item_types.UNDERWEAR]: equip_slots.UNDERWEAR,
    [item_types.CLASS_CHANGER]: equip_slots.CLASS_CHANGER,
};

/**
 * This class represents a main char of the game, the ones that can be integrated
 * into the party like Isaac, Felix, Jenna, Mia, Garet etc.
 */
export class MainChar extends Player {
    private static readonly ELEM_LV_DELTA = 1;
    private static readonly ELEM_POWER_DELTA = 5;
    private static readonly ELEM_RESIST_DELTA = 5;
    public static readonly MAX_GENERAL_ITEM_NUMBER = 30;
    public static readonly MAX_ITEMS_PER_CHAR = 15;

    private info: GameInfo;
    private starting_level: number;
    private class_table: any;
    private main_stats_curve: {[main_stat in main_stats]?: number[]};
    private equipped_abilities: string[];
    private _learnt_abilities: string[];
    private innate_abilities: string[];

    private _class: Classes;
    private _abilities: string[];
    private _equip_slots: {[slot in equip_slots]: ItemSlot};
    private _items: ItemSlot[];
    private _sprite_base: SpriteBase;
    private _exp_curve: number[];
    private _weapons_sprite_base: SpriteBase;
    private _djinn_by_element: {[element in elements]?: string[]};
    private _weapon_sprite_shift: number;
    private _special_class_type: number;
    private _element_afinity: elements;

    /** Returns whether this char is in the party or not. */
    public in_party: boolean;

    constructor(
        key_name,
        info,
        sprite_base,
        weapons_sprite_base,
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
        base_level,
        base_power,
        base_resist,
        innate_abilities,
        in_party,
        djinni,
        items,
        battle_animations_variations,
        battle_shadow_key,
        status_sprite_shift,
        special_class_type,
        weapon_sprite_shift
    ) {
        super(key_name, name);
        this.info = info;
        this._sprite_base = sprite_base;
        this._weapons_sprite_base = weapons_sprite_base;
        this.starting_level = starting_level;
        this.level = this.starting_level;
        this._special_class_type = special_class_type ?? -1;
        this.class_table = class_table;
        this.battle_scale = battle_scale;
        this._exp_curve = exp_curve;
        this.current_exp = this.exp_curve[this.level - 1];
        this.base_level = _.cloneDeep(base_level);
        this.base_power = _.cloneDeep(base_power);
        this.base_resist = _.cloneDeep(base_resist);
        this._element_afinity = _.maxBy(_.toPairs(this.base_level), pair => pair[1])[0] as elements;
        this._djinn_by_element = {};
        ordered_elements.forEach(element => {
            this.djinn_by_element[element] = [];
        });
        this.init_djinni(djinni);
        this._equip_slots = _.transform(equip_slots, (obj, value) => {
            obj[value] = null;
        });
        this.update_class();
        this.main_stats_curve = {};
        this.main_stats_curve[main_stats.MAX_HP] = hp_curve;
        this.main_stats_curve[main_stats.MAX_PP] = pp_curve;
        this.main_stats_curve[main_stats.ATTACK] = atk_curve;
        this.main_stats_curve[main_stats.DEFENSE] = def_curve;
        this.main_stats_curve[main_stats.AGILITY] = agi_curve;
        this.main_stats_curve[main_stats.LUCK] = luk_curve;
        this.hp_recovery = 0;
        this.pp_recovery = 0;
        this._items = items;
        this.equipped_abilities = [];
        this._learnt_abilities = [];
        this.innate_abilities = innate_abilities;
        this.init_items();
        this.update_attributes();
        this.update_elemental_attributes();
        this.in_party = in_party;
        this._abilities = [];
        this.update_abilities();
        this.turns = 1;
        this.base_turns = this.turns;
        this.fighter_type = fighter_types.ALLY;
        this.battle_animations_variations = Object.assign({}, battle_animations_variations);
        this.battle_shadow_key = battle_shadow_key;
        this.status_sprite_shift = status_sprite_shift ?? 0;
        this._weapon_sprite_shift = weapon_sprite_shift ?? 0;
    }

    /**
     * Returns the element afinity of this char.
     */
    get element_afinity() {
        return this._element_afinity;
    }

    /**
     * Returns the special class family type of this char. Returns -1 of no special type.
     */
    get special_class_type() {
        return this._special_class_type;
    }

    /**
     * Returns the y-adjusment value that is used to fit the weapon sprite on char battle sprite.
     */
    get weapon_sprite_shift() {
        return this._weapon_sprite_shift;
    }

    /**
     * Returns a list of djinn separated by element type.
     */
    get djinn_by_element() {
        return this._djinn_by_element;
    }

    /**
     * Returns the experience curve points of this char.
     */
    get exp_curve() {
        return this._exp_curve;
    }

    /**
     * Returns the SpriteBase object of the weapons sprites of this char.
     */
    get weapons_sprite_base() {
        return this._weapons_sprite_base;
    }

    /**
     * Returns the SpriteBase object of this char.
     */
    get sprite_base() {
        return this._sprite_base;
    }

    /**
     * Returns the list of items of this char.
     */
    get items() {
        return this._items;
    }

    /**
     * Returns the equip slots of this char, like weapon slot, chest protect slot etc.
     */
    get equip_slots() {
        return this._equip_slots;
    }

    /**
     * Returns the class of this char.
     */
    get class() {
        return this._class;
    }

    /**
     * Returns a list of abilities of this char. This abilities can be of any nature.
     */
    get abilities() {
        return this._abilities;
    }

    /**
     * Return the list of abities that this char learnt during the game.
     */
    get learnt_abilities() {
        return this._learnt_abilities;
    }

    /**
     * Returns a list of djinn sorted by djinn index that this char owns.
     */
    get djinni() {
        const this_djinni_list = ordered_elements.map(elem => this.djinn_by_element[elem]).flat();
        return this_djinni_list.sort((a, b) => {
            return this.info.djinni_list[a].index - this.info.djinni_list[b].index;
        });
    }

    /**
     * If this char is equipping an item that changes his class, this function returns the class
     * type of the class that this item grants. If no class changer item is equipped, returns -1.
     */
    get granted_class_type() {
        const equiped_class_changer = this.equip_slots[equip_slots.CLASS_CHANGER];
        if (equiped_class_changer) {
            return this.info.items_list[equiped_class_changer.key_name].granted_class_type;
        }
        return -1;
    }

    /**
     * Checks if this char inventory is full.
     */
    get inventory_is_full() {
        return this.items.length >= MainChar.MAX_ITEMS_PER_CHAR;
    }

    /**
     * Updates this char class.
     */
    update_class() {
        this._class = Classes.choose_right_class(
            this.info.classes_list,
            this.class_table,
            this.element_afinity,
            this.current_level,
            this.granted_class_type,
            this.special_class_type
        );
    }

    /**
     * Adds an amount of experience to this char. This char level, class, abilities and attributes
     * are also updated if needed.
     * @param value the amount of experience to add.
     * @returns returns the before and after exp add char status, like level, abilities and stats.
     */
    add_exp(value: number) {
        type StatusType = {
            level: MainChar["level"];
            abilities: MainChar["abilities"];
            stats: {[main_stat in main_stats]?: number}[];
        };
        const return_data: {
            before: StatusType;
            after: StatusType;
        } = {
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
                ] as {[main_stat in main_stats]?: number}[],
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
            ] as {[main_stat in main_stats]?: number}[],
        };
        return return_data;
    }

    /**
     * Initializes this char items by equipping them.
     */
    private init_items() {
        this.items.forEach((item_slot, index) => {
            item_slot.index = index;
            if (!item_slot.quantity) {
                item_slot.quantity = 1;
            }
            if (item_slot.equipped) {
                this.equip_item(index, true);
            }
        });
    }

    /**
     * Adds an item to this char. If this char already has the given item, this function will just
     * increase this item quantity.
     * @param item_key_name The item key name.
     * @param quantity The amount of this item to add.
     * @param equip if true, this item will be equipped.
     * @returns return true if the item was added.
     */
    add_item(item_key_name: string, quantity: number, equip: boolean) {
        if (quantity > MainChar.MAX_GENERAL_ITEM_NUMBER) {
            return false;
        }
        if (this.info.items_list[item_key_name].carry_up_to_30) {
            const found_item_slot = this.items.find(item_slot => item_slot.key_name === item_key_name);
            if (found_item_slot && found_item_slot.quantity + quantity <= MainChar.MAX_GENERAL_ITEM_NUMBER) {
                found_item_slot.quantity += quantity;
                return true;
            }
        }
        if (this.items.length === MainChar.MAX_ITEMS_PER_CHAR) {
            return false;
        }
        this.items.push({
            key_name: item_key_name,
            quantity: quantity,
            equipped: false,
            index: this.items.length,
        });
        if (equip) {
            this.equip_item(this.items.length - 1);
        }
        return true;
    }

    /**
     * Removes/drops an item from this char. If the item is equipped, it will be
     * unequipped. If the given quantity is smaller than the current quantity, the item slot
     * for the given item will be kept, otherwise, it will be removed.
     * @param item_slot_to_remove this char item slot you wish to remove.
     * @param quantity the quantity to be removed. Default is 1.
     * @param remove_curse if removing a cursed item, removes the curse too.
     */
    remove_item(item_slot_to_remove: ItemSlot, quantity: number = 1, remove_curse: boolean = false) {
        let adjust_index = false;
        this._items = this.items.filter((this_item_slot, index) => {
            if (item_slot_to_remove === this_item_slot) {
                if (this_item_slot.equipped) {
                    this.unequip_item(index, remove_curse);
                }
                if (this_item_slot.quantity - quantity >= 1) {
                    this_item_slot.quantity = this_item_slot.quantity - quantity;
                    return true;
                }
                adjust_index = true;
                return false;
            }
            if (adjust_index) {
                --this_item_slot.index;
            }
            return true;
        });
    }

    /**
     * Equips an item to this char. This char must already own the item. After equipping,
     * all relevant updates are done like abilities, class, attributes, effects etc.
     * @param index the item slot index of this char.
     * @param initialize only sets this to true if constructing this char.
     */
    equip_item(index: number, initialize: boolean = false) {
        const item_slot = this.items[index];
        if (item_slot.equipped && !initialize) return;
        const item = this.info.items_list[item_slot.key_name];

        if (item.type in item_equip_slot && this.equip_slots[item_equip_slot[item.type]] !== null) {
            this.unequip_item(this.equip_slots[item_equip_slot[item.type]].index);
        }
        if (item.type in item_equip_slot) {
            this.equip_slots[item_equip_slot[item.type]] = item_slot;
        }

        item_slot.equipped = true;
        for (let i = 0; i < item.effects.length; ++i) {
            this.add_effect(item.effects[i], item);
        }
        if (item.curses_when_equipped) {
            this.add_permanent_status(permanent_status.EQUIP_CURSE);
        }

        this.update_elemental_attributes();
        if (item.type === item_types.ABILITY_GRANTOR) {
            this.equipped_abilities.push(item.granted_ability);
            this.update_abilities();
        } else if (item.type === item_types.CLASS_CHANGER) {
            this.update_class();
            this.update_abilities();
        }
        this.update_attributes();
    }

    /**
     * Unequips an item to this char. After unequipping, all relevant updates are done
     * like abilities, class, attributes, effects etc.
     * @param index the item slot index of this char.
     * @param remove_curse if unequipping a cursed item, removes the curse too.
     */
    unequip_item(index: number, remove_curse: boolean = false) {
        const item_slot = this.items[index];
        if (!item_slot.equipped) return;
        const item = this.info.items_list[item_slot.key_name];
        if (item.type in item_equip_slot && this.equip_slots[item_equip_slot[item.type]] !== null) {
            this.equip_slots[item_equip_slot[item.type]] = null;
        }
        item_slot.equipped = false;
        this.effects.forEach(effect => {
            if (effect.effect_owner_instance === item) {
                this.remove_effect(effect);
            }
        });

        if (item.curses_when_equipped && remove_curse) {
            this.remove_permanent_status(permanent_status.EQUIP_CURSE);
        }

        this.update_elemental_attributes();
        if (item.type === item_types.ABILITY_GRANTOR) {
            this.equipped_abilities = this.equipped_abilities.filter(ability => {
                return ability !== item.granted_ability;
            });
            this.update_abilities();
        } else if (item.type === item_types.CLASS_CHANGER) {
            this.update_class();
            this.update_abilities();
        }
        this.update_attributes();
    }

    /**
     * Sorts this char items inventory.
     */
    sort_items() {
        this.items.sort((b, a) => {
            if (a.equipped && !b.equipped) return 1;
            if (!a.equipped && b.equipped) return -1;
            const item_a = this.info.items_list[a.key_name];
            const item_b = this.info.items_list[b.key_name];
            if (item_types_sort_priority[item_a.type] > item_types_sort_priority[item_b.type]) return 1;
            if (item_types_sort_priority[item_a.type] < item_types_sort_priority[item_b.type]) return -1;
            if (item_a.index > item_b.index) return 1;
            if (item_a.index < item_b.index) return -1;
            return 1;
        });
        this.items.forEach((item_slot, i) => (item_slot.index = i));
    }

    /**
     * Initializes this char djinn list and updates this char elemental attributes.
     * Call this function when constructing a char.
     * @param djinni list of initial djinn key names.
     */
    private init_djinni(djinni: string[]) {
        for (let i = 0; i < djinni.length; ++i) {
            const djinn = this.info.djinni_list[djinni[i]];
            this.djinn_by_element[djinn.element].push(djinn.key_name);
            djinn.owner = this;
        }
        this.update_elemental_attributes();
    }

    /**
     * Adds a specific djinn to this char and do all the necessary attribute updates.
     * @param djinn_key_name The djinn key name.
     */
    add_djinn(djinn_key_name: string) {
        const djinn = this.info.djinni_list[djinn_key_name];
        this.djinn_by_element[djinn.element].push(djinn.key_name);
        djinn.owner = this;
        this.update_all();
    }

    /**
     * Removes a specific djinn to this char and do all the necessary attribute updates.
     * @param djinn_key_name The djinn key name.
     */
    remove_djinn(djinn_key_name: string) {
        const djinn = this.info.djinni_list[djinn_key_name];
        const this_djinni_list = this.djinn_by_element[djinn.element];
        const index = this_djinni_list.indexOf(djinn_key_name);
        if (index !== -1) this_djinni_list.splice(index, 1);
        this.update_all();
        djinn.owner = null;
    }

    /**
     * Removes a specific djinni, then adds another specific djinni.
     * @param old_djinn_key_name The key name of the djinni to be removed.
     * @param new_djinn_key_name The key name of the djinni to be addeed.
     */
    replace_djinn(old_djinn_key_name: string, new_djinn_key_name: string) {
        this.remove_djinn(old_djinn_key_name);
        this.add_djinn(new_djinn_key_name);
    }

    /**
     * Previews the changes of trading, giving, receiving and/or changing the status of a list of djinn.
     * These changes are in class, abilities and stats.
     * @param stats The stats the you want to analyze.
     * @param djinni_key_names The djinn key names.
     * @param djinni_next_status The next djinn status. Must match with djinni_key_names size.
     * @param action Whether it's trading or giving a djinn.
     * @returns Returns an object with the changes info.
     */
    preview_djinn_change(
        stats: main_stats[],
        djinni_key_names: string[],
        djinni_next_status: djinn_status[],
        action?: djinn_actions
    ) {
        const previous_class = this.class;
        const lvls: Player["current_level"] = _.cloneDeep(this.current_level);
        for (let i = 0; i < djinni_key_names.length; ++i) {
            const djinn = this.info.djinni_list[djinni_key_names[i]];
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
            lvls[djinn.element] += lv_shift;
        }
        this._class = Classes.choose_right_class(
            this.info.classes_list,
            this.class_table,
            this.element_afinity,
            lvls,
            this.granted_class_type,
            this.special_class_type
        );
        const return_obj: {
            class_name: string;
            class_key_name: string;
            abilities?: string[];
        } & {
            [stat in main_stats]?: ReturnType<MainChar["set_main_stat"]>;
        } = {
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
            this.equipped_abilities,
            this.learnt_abilities
        );
        djinni_next_status = djinni_next_status.map(status =>
            status === djinn_status.ANY ? djinn_status.STANDBY : status
        );
        stats.forEach(stat => {
            const preview_obj = {
                djinni_key_names: djinni_key_names,
                djinni_next_status: djinni_next_status,
                action: action,
            };
            return_obj[stat] = this.set_main_stat(stat, true, preview_obj);
        });
        this._class = previous_class;
        return return_obj;
    }

    /**
     * Previews a stat value without the given effect of an item.
     * @param effect_type the effect type.
     * @param effect_obj the item effect object.
     * @param item_key_name the item key name.
     * @returns returns the corresponding stat preview value of the given effect.
     */
    preview_stats_without_item_effect(effect_type: effect_types, effect_obj: any, item_key_name: string) {
        const preview_obj = {
            effect_obj: effect_obj,
            item_key_name: item_key_name,
        };
        return this.set_main_stat(effect_type_stat[effect_type], true, preview_obj);
    }

    /**
     * Previews a stat value by ignoring all abilities effects.
     * @param stat the stat to be previewed.
     * @returns returns the stat preview value.
     */
    preview_stat_without_abilities_effect(stat: main_stats) {
        return this.set_main_stat(stat, true, {ignore_ability_effect: true});
    }

    private set_main_stat(
        stat: main_stats,
        preview = false,
        preview_obj: {
            action?: djinn_actions;
            djinni_key_names?: string[];
            item_key_name?: string;
            ignore_ability_effect?: boolean;
            effect_obj?: any;
            djinni_next_status?: djinn_status[];
        } = {}
    ): number {
        const previous_value = this[stat];

        //setting stats by current level, current class and extra values
        this[stat] =
            (this.main_stats_curve[stat][this.level] * this.class.boost_stats[stat] + this.extra_stats[stat]) | 0;

        const this_djinni = this.djinni;
        if (preview) {
            if (preview_obj.action === djinn_actions.TRADE) {
                const first_index = this_djinni.indexOf(preview_obj.djinni_key_names[0]);
                if (first_index >= 0) {
                    this_djinni[first_index] = preview_obj.djinni_key_names[1];
                } else {
                    this_djinni[this_djinni.indexOf(preview_obj.djinni_key_names[1])] = preview_obj.djinni_key_names[0];
                }
            } else if (preview_obj.action === djinn_actions.GIVE) {
                this_djinni.push(preview_obj.djinni_key_names[0]);
            }
        }
        for (let i = 0; i < this_djinni.length; ++i) {
            const djinn_key_name = this_djinni[i];
            const djinn = this.info.djinni_list[djinn_key_name];
            let status = djinn.status;
            if (preview && preview_obj.djinni_key_names && preview_obj.djinni_key_names.includes(djinn_key_name)) {
                status = preview_obj.djinni_next_status[preview_obj.djinni_key_names.indexOf(djinn_key_name)];
            }
            if (status !== djinn_status.SET) continue;
            this[stat] += djinn.boost_stats[stat];
        }

        const effects_group = _.groupBy(this.effects, effect => effect.effect_owner_instance.constructor.name);
        const apply_effect = (effect: Effect) => {
            if (
                preview &&
                effect.effect_owner_instance &&
                preview_obj.item_key_name === effect.effect_owner_instance.key_name
            ) {
                return;
            }
            if (preview && preview_obj.ignore_ability_effect && effect.effect_owner_instance instanceof Ability) {
                return;
            }
            const effect_type = _.invert(effect_type_stat)[stat];
            if (effect.type === effect_type) {
                effect.apply_effect();
            }
        };
        if ("Item" in effects_group) {
            effects_group["Item"].forEach(apply_effect);
        }
        this.before_buff_stats[stat] = this[stat];
        this.buff_stats[stat] = 0;
        if ("Ability" in effects_group) {
            effects_group["Ability"].forEach(apply_effect);
        }
        this[stat] += this.buff_stats[stat];
        if (preview) {
            const preview_value = preview_obj.effect_obj
                ? Effect.preview_value_applied(preview_obj.effect_obj, this[stat])
                : this[stat];
            this[stat] = previous_value;
            return preview_value;
        }
        if ([main_stats.MAX_HP, main_stats.MAX_PP].includes(stat)) {
            const current_key = stat === main_stats.MAX_HP ? main_stats.CURRENT_HP : main_stats.CURRENT_PP;
            if (this[current_key] === undefined) {
                this[current_key] = this[stat];
            } else {
                this[current_key] = Math.round((this[current_key] * this[stat]) / previous_value);
            }
        }
        return 0;
    }

    /**
     * Updates all main stats of this char.
     */
    update_attributes() {
        this.set_main_stat(main_stats.MAX_HP);
        this.set_main_stat(main_stats.MAX_PP);
        this.set_main_stat(main_stats.ATTACK);
        this.set_main_stat(main_stats.DEFENSE);
        this.set_main_stat(main_stats.AGILITY);
        this.set_main_stat(main_stats.LUCK);
    }

    /**
     * Increments by a value a given extra main stat of this char.
     * @param stat the extra main stat.
     * @param amount the quantity to increment.
     * @param update whether the char correspondent main stat should be updated.
     */
    add_extra_stat(stat: main_stats, amount: number, update: boolean = true) {
        this.extra_stats[stat] += amount;
        if (update) {
            this.set_main_stat(stat);
        }
    }

    /**
     * Previews the elemental stats values without abilities effects.
     * @returns returns the preview values for power, resist and level for each element.
     */
    preview_elemental_stats_without_abilities_effect() {
        return this.update_elemental_attributes(true, true);
    }

    /**
     * Updates all elemental stats of this char.
     * @param preview if true, the stats won't be updated and the calculated values returned.
     * @param ignore_ability_effects if true, abilities effects won't be considered.
     * @returns if preview is true, it returns the calculated stats.
     */
    update_elemental_attributes(
        preview: boolean = false,
        ignore_ability_effects: boolean = false
    ): {
        [element in elements]?: {
            power: number;
            resist: number;
            level: number;
        };
    } {
        const previous_stats = {};
        ordered_elements.forEach(element => {
            if (preview) {
                previous_stats[element] = {
                    power: this.current_power[element],
                    resist: this.current_resist[element],
                    level: this.current_level[element],
                };
            }
            this.current_power[element] = this.base_power[element];
            this.current_resist[element] = this.base_resist[element];
            this.current_level[element] = this.base_level[element];
        });

        for (let i = 0; i < this.djinni.length; ++i) {
            const djinn = this.info.djinni_list[this.djinni[i]];
            if (djinn.status !== djinn_status.SET) continue;
            this.current_power[djinn.element] += MainChar.ELEM_POWER_DELTA;
            this.current_resist[djinn.element] += MainChar.ELEM_RESIST_DELTA;
            this.current_level[djinn.element] += MainChar.ELEM_LV_DELTA;
        }

        this.effects.forEach(effect => {
            if (effect.type === effect_types.POWER || effect.type === effect_types.RESIST) {
                if (ignore_ability_effects && effect.effect_owner_instance instanceof Ability) return;
                effect.apply_effect();
            }
        });

        for (let i = 0; i < ordered_elements.length; ++i) {
            const element = ordered_elements[i];
            this.current_power[element] = _.clamp(this.current_power[element], ELEM_ATTR_MIN, ELEM_ATTR_MAX);
            this.current_resist[element] = _.clamp(this.current_resist[element], ELEM_ATTR_MIN, ELEM_ATTR_MAX);
        }

        if (preview) {
            const elemental_stats = Object.fromEntries(
                ordered_elements.map(element => {
                    const return_data = [
                        element,
                        {
                            power: this.current_power[element],
                            resist: this.current_resist[element],
                            level: this.current_level[element],
                        },
                    ];
                    this.current_power[element] = previous_stats[element].power;
                    this.current_resist[element] = previous_stats[element].resist;
                    this.current_level[element] = previous_stats[element].level;
                    return return_data;
                })
            );
            return elemental_stats;
        } else {
            return null;
        }
    }

    /**
     * Updates the abilities list of this char reggarding class, innate abilities
     * and equipped items that grant abilities.
     */
    update_abilities() {
        this._abilities = this.innate_abilities.concat(
            this.class.ability_level_pairs
                .filter(pair => {
                    return pair.level <= this.level && !this.innate_abilities.includes(pair.ability);
                })
                .map(pair => pair.ability),
            this.equipped_abilities,
            this.learnt_abilities
        );

        if (this.info.party_data.psynergies_shortcuts[Button.L]?.main_char === this.key_name) {
            if (!this.abilities.includes(this.info.party_data.psynergies_shortcuts[Button.L].ability)) {
                this.info.party_data.psynergies_shortcuts[Button.L] = null;
            }
        }
        if (this.info.party_data.psynergies_shortcuts[Button.R]?.main_char === this.key_name) {
            if (!this.abilities.includes(this.info.party_data.psynergies_shortcuts[Button.R].ability)) {
                this.info.party_data.psynergies_shortcuts[Button.R] = null;
            }
        }
    }

    /**
     * Adds a new ability to this char.
     * @param ability_key the ability key
     * @param update whether it should update the final abilities list of this char.
     */
    learn_ability(ability_key: string, update: boolean) {
        if (!this.learnt_abilities.includes(ability_key)) {
            this.learnt_abilities.push(ability_key);
            if (update) {
                this.update_abilities();
            }
        }
    }

    /**
     * Updates all important attributes of this char like stats, class, abilities etc.
     */
    update_all() {
        this.update_elemental_attributes();
        this.update_class();
        this.update_attributes();
        this.update_abilities();
        this.update_turns_count();
    }

    /** Updates the amount of turns that this char has in battle. */
    update_turns_count() {
        this.extra_turns = 0;
        this.effects.forEach(effect => {
            if (effect.type === effect_types.TURNS) {
                effect.apply_effect();
            }
        });
        this.apply_turns_count_value();
    }

    /**
     * Returns all the chars that are not downed.
     * @param party_data the party data object.
     * @param max the max char to be returned.
     * @returns return the chars list that are not downed.
     */
    static get_active_players(party_data: PartyData, max: number) {
        return party_data.members.slice(0, max).filter(char => {
            return !char.has_permanent_status(permanent_status.DOWNED);
        });
    }

    /**
     * Adds an item to the first item slot available among all party members.
     * @param party_data the party data object.
     * @param item the item to be added.
     * @param quantity the amount of the given item to be added.
     * @returns returns true if the item was added to a char.
     */
    static add_item_to_party(party_data: PartyData, item: Item, quantity: number) {
        for (let i = 0; i < party_data.members.length; ++i) {
            const char = party_data.members[i];
            if (char.add_item(item.key_name, quantity, false)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Adds a djinni to the first available position among all party members.
     * @param party_data the party data object.
     * @param djinn the djinn to be added.
     * @returns returns the char that received the djinni.
     */
    static add_djinn_to_party(party_data: PartyData, djinn: Djinn) {
        let this_char = party_data.members[0];
        for (let i = 0; i < party_data.members.length; ++i) {
            if (party_data.members[i].djinni.length < this_char.djinni.length) {
                this_char = party_data.members[i];
                break;
            }
        }
        this_char.add_djinn(djinn.key_name);
        return this_char;
    }

    /**
     * Adds a char to the party.
     * @param party_data the party data object.
     * @param char the char to be added.
     */
    static add_member_to_party(party_data: PartyData, char: MainChar) {
        const members = party_data.members;
        char.in_party = true;
        members.push(char);

        //updates party avg level
        party_data.avg_level = _.meanBy(members, char => char.level) | 0;

        //if necessary, distribute djinn among chars equally
        MainChar.distribute_djinn(party_data);
    }

    /**
     * Distributes djinn among chars equally.
     * @param party_data the party data object.
     */
    static distribute_djinn(party_data: PartyData) {
        const members = party_data.members;
        const djinn_per_char_min = _.meanBy(members, char => char.djinni.length) | 0;
        const need_djinn: MainChar[] = [];
        const djinn_buffer: string[] = [];
        _.sortBy(members, c => c.djinni.length).forEach(char => {
            if (char.djinni.length < djinn_per_char_min) {
                need_djinn.push(char);
            } else if (char.djinni.length > djinn_per_char_min + 1) {
                const last_djinni = _.last(char.djinni);
                char.remove_djinn(last_djinni);
                djinn_buffer.push(last_djinni);
            } else if (need_djinn.length && char.djinni.length > djinn_per_char_min) {
                const last_djinni = _.last(char.djinni);
                char.remove_djinn(last_djinni);
                const char_to_grant_djinni = need_djinn.pop();
                char_to_grant_djinni.add_djinn(last_djinni);
            } else if (djinn_buffer.length && char.djinni.length < djinn_per_char_min) {
                const djinni_to_add = djinn_buffer.pop();
                char.add_djinn(djinni_to_add);
            }
        });
    }

    /**
     * Removes a char from the party.
     * @param party_data the party data object.
     * @param char the char to be removed.
     */
    static remove_member_from_party(party_data: PartyData, char: MainChar) {
        char.in_party = false;
        party_data.members = party_data.members.filter(member => {
            return member.key_name !== char.key_name;
        });

        party_data.avg_level = _.mean(party_data.members.map(char => char.level)) | 0;

        if (party_data.psynergies_shortcuts[Button.L]?.main_char === char.key_name) {
            party_data.psynergies_shortcuts[Button.L] = null;
        }
        if (party_data.psynergies_shortcuts[Button.R]?.main_char === char.key_name) {
            party_data.psynergies_shortcuts[Button.R] = null;
        }
    }

    /**
     * Changes level of a character. borrowed the implementation of MainChar.add_exp.
     * @param value the target level value we want to set.
     * @return returns the before and after exp add char status,
     * like level, abilities and stats.
     */
    change_level(value: number): void {
        if (value >= 1 && value < this.exp_curve.length) {
            this.level = value;
            this.current_exp = this.exp_curve[value - 1];
            this.update_all();
        } else {
            console.warn("Target level out of range");
        }
    }
}
