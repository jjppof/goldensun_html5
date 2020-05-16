import { SpriteBase } from './SpriteBase.js';
import { choose_right_class } from './Classes.js';
import { djinni_list } from '../chars/djinni.js';
import { djinn_status } from './Djinn.js';
import { Effect } from './Effect.js';
import { item_types } from './Item.js';
import { items_list } from '../chars/items.js';

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
        djinni,
        items
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
        this.element_afinity = _.max([
            {element: elements.VENUS, level: this.venus_level_base},
            {element: elements.MERCURY, level: this.mercury_level_base},
            {element: elements.MARS, level: this.mars_level_base},
            {element: elements.JUPITER, level: this.jupiter_level_base},
        ], element => element.level).element;
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
        this.update_attributes();
        this.innate_abilities = innate_abilities;
        this.in_party = in_party;
        this.abilities = [];
        this.equipped_abilities = [];
        this.update_abilities();
        this.items = items;
        this.effects = [];
        this.init_items();
    }

    get djinni() {
        let this_djinni_list = this.venus_djinni.concat(this.mercury_djinni, this.mars_djinni, this.jupiter_djinni);
        return this_djinni_list.sort((a, b) => {
            return djinni_list[a].index - djinni_list[b].index;
        })
    }

    load_assets(game, load_callback) {
        game.load.image(this.key_name + '_avatar', this.avatar_image_path).onLoadComplete.addOnce(load_callback);
        game.load.start();
    }

    update_class() {
        this.class = choose_right_class(this.element_afinity, this.venus_level_current, this.mercury_level_current, this.mars_level_current, this.jupiter_level_current);
    }

    init_items() {
        this.items.forEach(item_obj => {
            if (item_obj.equipped) {
                this.equip_item(items_list[item_obj.key_name]);
            }
        });
    }

    add_item(item_key_name, quantity, equip) {
        this.items.push({
            key_name: item_key_name,
            quantity: quantity,
            equipped: equip
        });
        if (equip) {
            this.equip_item(items_list[item_key_name]);
        }
    }

    remove_item(item_key_name, quantity) {
        this.items = this.items.filter(item_obj => {
            if (item_key_name === item_obj.key_name && item_obj.equipped) {
                this.unequip_item(items_list[item_key_name]);
            }
            if (item_obj.quantity - quantity >= 1) {
                item_obj.quantity = item_obj.quantity - quantity;
                return true;
            }
            return item_key_name !== item_obj.key_name;
        });
    }

    equip_item(item) {
        for (let i = 0; i < item.effects.length; ++i) {
            this.add_effect(item.effects[i], item);
        }
        if (item.type === item_types.ABILITY_GRANTOR) {
            this.equipped_abilities.push(item.granted_ability);
            this.update_abilities();
        }
    }

    unequip_item(item) {
        this.effects.forEach(effect => {
            if (effect.effect_owner_instance === item) {
                this.remove_effect(effect);
            }
        });
        if (item.type === item_types.ABILITY_GRANTOR) {
            this.equipped_abilities = this.equipped_abilities.filter(ability => {
                return ability !== item.granted_ability;
            });
            this.update_abilities();
        }
    }

    add_effect(effect_obj, effect_owner_instance) {
        let effect = new Effect(
            effect_obj.type,
            effect_obj.quantity,
            effect_obj.operator,
            effect_owner_instance,
            effect_obj.quantity_is_absolute,
            effect_obj.rate,
            effect_obj.chance,
            effect_obj.attribute,
            effect_obj.add_status,
            effect_obj.status_key_name,
            effect_obj.turns_quantity,
            effect_obj.variation_on_final_result,
            effect_obj.damage_formula_key_name,
            this
        );
        effect.apply_effect();
        this.effects.push(effect);
    }

    remove_effect(effect_to_remove) {
        this.effects = this.effects.filter(effect => {
            effect.remove_effect();
            return effect !== effect_to_remove;
        });
    }

    init_djinni(djinni) {
        for (let i = 0; i < djinni.length; ++i) {
            let djinn = djinni_list[djinni[i]];
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

    add_djinn(djinn_key_name) {
        let djinn = djinni_list[djinn_key_name];
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
        this.update_elemental_attributes();
        this.update_class();
        this.update_attributes();
        this.update_abilities();
    }

    remove_djinn(djinn_key_name) {
        let djinn = djinni_list[djinn_key_name];
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
        this.update_elemental_attributes();
        this.update_class();
        this.update_attributes();
        this.update_abilities();
    }

    replace_djinn(old_djinn_key_name, new_djinn_key_name) {
        this.remove_djinn(old_djinn_key_name);
        this.add_djinn(new_djinn_key_name);
    }

    set_max_hp() {
        this.max_hp = parseInt(this.hp_curve[this.starting_level] * this.class.hp_boost + this.hp_extra);
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
        this.max_pp = parseInt(this.pp_curve[this.starting_level] * this.class.pp_boost + this.pp_extra);
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
        this.atk = parseInt(this.atk_curve[this.starting_level] * this.class.atk_boost + this.atk_extra);
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
        this.def = parseInt(this.def_curve[this.starting_level] * this.class.def_boost + this.def_extra);
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
        this.agi = parseInt(this.agi_curve[this.starting_level] * this.class.agi_boost + this.agi_extra);
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
        this.luk = parseInt(this.luk_curve[this.starting_level] * this.class.luk_boost + this.luk_extra);
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

    add_extra_max_hp(amount) {
        this.hp_extra += amount;
    }

    add_extra_max_pp(amount) {
        this.pp_extra += amount;
    }

    add_extra_max_atk(amount) {
        this.atk_extra += amount;
    }

    add_extra_max_def(amount) {
        this.def_extra += amount;
    }

    add_extra_max_agi(amount) {
        this.agi_extra += amount;
    }

    add_extra_max_luk(amount) {
        this.luk_extra += amount;
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
        this.init_elemental_attributes();
        for (let i = 0; i < this.djinni.length; ++i) {
            let djinn = djinni_list[this.djinni[i]];
            switch (djinn.element) {
                case elements.VENUS:
                    this.venus_level_current += ELEM_LV_DELTA;
                    this.venus_power_current += ELEM_POWER_DELTA;
                    this.venus_resist_current += ELEM_RESIST_DELTA;
                    break;
                case elements.MERCURY:
                    this.mercury_level_current += ELEM_LV_DELTA;
                    this.mercury_power_current += ELEM_POWER_DELTA;
                    this.mercury_resist_current += ELEM_RESIST_DELTA;
                    break;
                case elements.MARS:
                    this.mars_level_current += ELEM_LV_DELTA;
                    this.mars_power_current += ELEM_POWER_DELTA;
                    this.mars_resist_current += ELEM_RESIST_DELTA;
                    break;
                case elements.JUPITER:
                    this.jupiter_level_current += ELEM_LV_DELTA;
                    this.jupiter_power_current += ELEM_POWER_DELTA;
                    this.jupiter_resist_current += ELEM_RESIST_DELTA;
                    break;
            }
        }
    }

    update_abilities() {
        this.abilities = this.innate_abilities.concat(this.class.ability_level_pairs.filter(pair => {
            return pair.level <= this.level;
        }).map(pair => pair.ability), this.equipped_abilities);
    }

    add_permanent_status(status) {
        this.permanent_status.add(status);
    }

    remove_permanent_status(status) {
        this.permanent_status.delete(status);
    }

    add_temporary_status(status) {
        this.temporary_status.add(status);
    }

    remove_temporary_status(status) {
        this.temporary_status.delete(status);
    }
}