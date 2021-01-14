import {Window, TextObj} from "../../Window";
import {kill_all_sprites} from "../../utils";
import {item_types} from "../../Item";
import {effect_operators, effect_types} from "../../Effect";
import {GoldenSun} from "../../GoldenSun";
import {MainChar} from "../../MainChar";
import {effect_type_stat, main_stats} from "../../Player";
import * as _ from "lodash";

const BASE_X = 128;
const BASE_Y = 88;
const BASE_WIDTH = 108;
const BASE_HEIGHT = 68;

const CANT_EQUIP_X = 14;
const CANT_EQUIP_Y = 32;

const TXT_GROUP_X = 8;
const TXT_GROUP_Y = 8;

const LINE_SHIFT = 16;

const CURR_STAT_END_X = 53;
const NEW_STAT_END_X = CURR_STAT_END_X + 40;

const ARROW_X = 65;
const ARROW_Y = 7;
const UP_ARROW_Y_SHIFT = -1;

const SEPARATOR_X = 4;
const SEPARATOR_Y = 19;
const SEPARATOR_LENGTH = 104;

const SEPARATOR_COUNT = 3;

/*Compares the character's equipped item with another item
Used in shop menus. Will show stat differences

Input: game [Phaser:Game] - Reference to the running game object
       data [GoldenSun] - Reference to the main JS Class instance*/
export class EquipCompare {
    public game: Phaser.Game;
    public data: GoldenSun;

    public selected_item: string;
    public selected_char: MainChar;
    public is_open: boolean;
    public window: Window;
    public text_group: Phaser.Group;
    public arrow_group: Phaser.Group;

    public cant_equip_text: TextObj;
    public atk_label_text: TextObj;
    public def_label_text: TextObj;
    public agi_label_text: TextObj;
    public item_name_text: TextObj;

    public curr_atk_text: TextObj;
    public curr_def_text: TextObj;
    public curr_agi_text: TextObj;

    public new_atk_text: TextObj;
    public new_def_text: TextObj;
    public new_agi_text: TextObj;

    constructor(game: Phaser.Game, data: GoldenSun) {
        this.game = game;
        this.data = data;

        this.selected_item = null;
        this.selected_char = null;
        this.is_open = false;

        this.window = new Window(this.game, BASE_X, BASE_Y, BASE_WIDTH, BASE_HEIGHT);

        this.text_group = this.window.define_internal_group("texts", {x: TXT_GROUP_X, y: TXT_GROUP_Y});
        this.arrow_group = this.window.define_internal_group("arrows", {x: ARROW_X, y: ARROW_Y});

        this.cant_equip_text = this.window.set_text_in_position(
            "Can't equip",
            CANT_EQUIP_X,
            CANT_EQUIP_Y,
            false,
            false,
            this.window.font_color,
            false,
            undefined,
            true
        );
        this.cant_equip_text.text.alpha = 0;
        this.cant_equip_text.shadow.alpha = 0;

        this.atk_label_text = this.init_text_sprite("ATK", 0, 0, false);
        this.def_label_text = this.init_text_sprite("DEF", 0, LINE_SHIFT, false);
        this.agi_label_text = this.init_text_sprite("AGL", 0, 2 * LINE_SHIFT, false);
        this.item_name_text = this.init_text_sprite("", 0, 3 * LINE_SHIFT, false);

        this.curr_atk_text = this.init_text_sprite("", CURR_STAT_END_X, 0, true);
        this.curr_def_text = this.init_text_sprite("", CURR_STAT_END_X, LINE_SHIFT, true);
        this.curr_agi_text = this.init_text_sprite("", CURR_STAT_END_X, 2 * LINE_SHIFT, true);

        this.new_atk_text = this.init_text_sprite("", NEW_STAT_END_X, 0, true);
        this.new_def_text = this.init_text_sprite("", NEW_STAT_END_X, LINE_SHIFT, true);
        this.new_agi_text = this.init_text_sprite("", NEW_STAT_END_X, 2 * LINE_SHIFT, true);

        this.text_group.alpha = 0;
        this.arrow_group.alpha = 0;
    }

    /*Initializes a text-shadow pair

    Input: text [string] - The text to display
           x, y [number] - The text position
           right_align - If true, the text will be right-aligned*/
    init_text_sprite(text: string, x: number, y: number, right_align: boolean) {
        let txt = this.window.set_text_in_position(text, x, y, right_align);
        this.window.add_to_internal_group("texts", txt.shadow);
        this.window.add_to_internal_group("texts", txt.text);
        return txt;
    }

    /*Creates or recycles an arrow sprite

    Input: diff [number] - Stat difference, affects the arrow type
           line [number] - Line index for displaying purposes*/
    make_arrow(diff: number, line: number) {
        if (diff === 0) return;

        let arrow_x = 0;
        let arrow_y = LINE_SHIFT * line + (diff > 0 ? UP_ARROW_Y_SHIFT : 0);
        let key = diff > 0 ? "up_arrow" : "down_arrow";

        let dead_arrows = this.arrow_group.children.filter((a: Phaser.Sprite) => {
            return a.alive === false && a.frameName === key;
        });
        if (dead_arrows.length > 0) (dead_arrows[0] as Phaser.Sprite).reset(arrow_x, arrow_y);
        else this.window.create_at_group(arrow_x, arrow_y, "menu", undefined, key, "arrows");
    }

    /*Finds the statistical difference in a stat for two items

    Input: equipped [string] - Key name for the equipped item
           new_item [string] - Key name for the item being compared
           stat [string] - Stat to compare
           current_val [number] - Current value of the stat*/
    compare_items(equipped: string, new_item: string, stat: string, current_val: number) {
        let eq_effects = {};
        if (equipped) {
            eq_effects = _.mapKeys(this.data.info.items_list[equipped].effects, effect => effect.type);
        }
        let nitem_effects = _.mapKeys(this.data.info.items_list[new_item].effects, effect => effect.type);

        let eq_stat = 0;
        let nitem_stat = 0;

        if (eq_effects[stat]) {
            switch (eq_effects[stat].operator) {
                case effect_operators.PLUS:
                    eq_stat = eq_effects[stat].quantity;
                    break;
                case effect_operators.MINUS:
                    eq_stat = -1 * eq_effects[stat].quantity;
                    break;
                case effect_operators.TIMES:
                    eq_stat = eq_effects[stat].quantity * current_val;
                    break;
                case effect_operators.DIVIDE:
                    eq_stat = (eq_effects[stat].quantity / current_val) | 0;
                    break;
            }
        }
        if (nitem_effects[stat]) {
            switch (nitem_effects[stat].operator) {
                case effect_operators.PLUS:
                    nitem_stat = nitem_effects[stat].quantity;
                    break;
                case effect_operators.MINUS:
                    nitem_stat = -1 * nitem_effects[stat].quantity;
                    break;
                case effect_operators.TIMES:
                    nitem_stat = nitem_effects[stat].quantity * current_val;
                    break;
                case effect_operators.DIVIDE:
                    nitem_stat = -(current_val / nitem_effects[stat].quantity) | 0;
                    break;
            }
        }

        return nitem_stat - eq_stat;
    }

    /*Updates the text and creates arrows if necessary
    
    Input: stat [string] - "attack", "defense", "agility"
           curr_val [number] - The current stat
           stat_diff [number] - Stat difference*/
    display_stat(stat: string, curr_val: number, stat_diff: number) {
        let new_stat_text = null;
        let curr_stat_text = null;
        let line = 0;

        switch (stat) {
            case effect_types.ATTACK:
                new_stat_text = this.new_atk_text;
                curr_stat_text = this.curr_atk_text;
                line = 0;
                break;
            case effect_types.DEFENSE:
                new_stat_text = this.new_def_text;
                curr_stat_text = this.curr_def_text;
                line = 1;
                break;
            case effect_types.AGILITY:
                new_stat_text = this.new_agi_text;
                curr_stat_text = this.curr_agi_text;
                line = 2;
                break;
        }

        new_stat_text.text.alpha = stat_diff === 0 ? 0 : 1;
        new_stat_text.shadow.alpha = stat_diff === 0 ? 0 : 1;
        this.window.update_text(String(curr_val), curr_stat_text);
        if (stat_diff === 0) return;

        this.window.update_text(String(curr_val + stat_diff), new_stat_text);
        this.make_arrow(stat_diff, line);
    }

    /*Compare the same item for a different character*/
    change_character(key_name: string) {
        this.selected_char = this.data.info.party_data.members.filter(c => {
            return c.key_name === key_name;
        })[0];
        kill_all_sprites(this.arrow_group);

        this.show_stat_compare();
    }

    /*Displays the stat comparison*/
    show_stat_compare() {
        if (!this.data.info.items_list[this.selected_item].equipable_chars.includes(this.selected_char.key_name)) {
            this.show_cant_equip();
            return;
        }

        this.cant_equip_text.text.alpha = 0;
        this.cant_equip_text.shadow.alpha = 0;

        let selected_item_type = this.data.info.items_list[this.selected_item].type;
        let char_current_item = null;
        let eq_slots = this.selected_char.equip_slots;

        let eq_types = ["WEAPONS", "ARMOR", "CHEST_PROTECTOR", "HEAD_PROTECTOR", "RING", "LEG_PROTECTOR", "UNDERWEAR"];
        let slot_types = ["weapon", "body", "chest", "head", "ring", "boots", "underwear"];

        for (let i = 0; i < eq_types.length; i++) {
            if (selected_item_type === item_types[eq_types[i]] && eq_slots[slot_types[i]])
                char_current_item = this.data.info.items_list[eq_slots[slot_types[i]].key_name].key_name;
        }

        let diffs = {
            [main_stats.ATTACK]: 0,
            [main_stats.DEFENSE]: 0,
            [main_stats.AGILITY]: 0,
        };
        let labels = [effect_types.ATTACK, effect_types.DEFENSE, effect_types.AGILITY];

        for (let i = 0; i < labels.length; i++) {
            diffs[effect_type_stat[labels[i]]] = this.compare_items(
                char_current_item,
                this.selected_item,
                labels[i],
                this.selected_char[effect_type_stat[labels[i]]]
            );

            this.display_stat(
                labels[i],
                this.selected_char[effect_type_stat[labels[i]]],
                diffs[effect_type_stat[labels[i]]]
            );
        }

        let name = this.data.info.items_list[char_current_item]
            ? this.data.info.items_list[char_current_item].name
            : "";
        this.window.update_text(name, this.item_name_text);

        for (let i = 0; i < SEPARATOR_COUNT; i++) {
            this.window.draw_separator(
                SEPARATOR_X,
                SEPARATOR_Y + LINE_SHIFT * i,
                SEPARATOR_X + SEPARATOR_LENGTH,
                SEPARATOR_Y + LINE_SHIFT * i,
                false
            );
        }

        this.text_group.alpha = 1;
        this.arrow_group.alpha = 1;
    }

    /*Displays the "Can't equip" message*/
    show_cant_equip() {
        this.text_group.alpha = 0;
        this.arrow_group.alpha = 0;
        this.window.clear_separators();

        this.cant_equip_text.text.alpha = 1;
        this.cant_equip_text.shadow.alpha = 1;
    }

    /*Opens this window with the selected member

    Input: char_key [string] - The character's key name
           item [string] - Key name of the item to compare
           open_callback [function] - Callback function (Optional)*/
    open(char_key: string, item: string, open_callback?: Function) {
        this.selected_char = this.data.info.party_data.members.filter((c: MainChar) => {
            return c.key_name === char_key;
        })[0];
        this.selected_item = item;

        this.show_stat_compare();

        this.is_open = true;
        this.window.show(open_callback, false);
    }

    /*Clears information and closes the window

    Input: destroy [boolean] - If true, sprites are destroyed*/
    close(callback?: Function, destroy: boolean = false) {
        kill_all_sprites(this.arrow_group, destroy);
        if (destroy) kill_all_sprites(this.text_group, destroy);

        this.selected_item = null;
        this.selected_char = null;

        this.is_open = false;
        this.window.close(callback, false);
    }
}
