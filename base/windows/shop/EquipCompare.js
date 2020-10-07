import { Window } from '../../Window.js';
import { kill_all_sprites } from '../../utils.js';

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
    constructor(game, data) {
        this.game = game;
        this.data = data;
        this.close_callback = null;

        this.selected_item = null;
        this.selected_char = null;
        this.is_open = false;

        this.window = new Window(this.game, BASE_X, BASE_Y, BASE_WIDTH, BASE_HEIGHT);

        this.text_group = this.window.define_internal_group("texts", {x: TXT_GROUP_X, y: TXT_GROUP_Y});
        this.arrow_group = this.window.define_internal_group("arrows", {x: ARROW_X, y: ARROW_Y});

        this.cant_equip_text = this.window.set_text_in_position("Can't equip", CANT_EQUIP_X, CANT_EQUIP_Y, false, false, this.window.font_color, false, undefined, true);
        this.cant_equip_text.text.alpha = 0;
        this.cant_equip_text.shadow.alpha = 0;

        this.atk_label_text = this.init_text_sprite("ATK",0,0,false); 
        this.def_label_text = this.init_text_sprite("DEF",0,LINE_SHIFT,false);  
        this.agi_label_text = this.init_text_sprite("AGL",0,2*LINE_SHIFT,false); 
        this.item_name_text = this.init_text_sprite("",0,3*LINE_SHIFT,false); 

        this.curr_atk_text = this.init_text_sprite("",CURR_STAT_END_X, 0, true);
        this.curr_def_text = this.init_text_sprite("",CURR_STAT_END_X, LINE_SHIFT, true);
        this.curr_agi_text = this.init_text_sprite("",CURR_STAT_END_X, 2*LINE_SHIFT, true);

        this.new_atk_text = this.init_text_sprite("",NEW_STAT_END_X, 0, true);
        this.new_def_text = this.init_text_sprite("",NEW_STAT_END_X, LINE_SHIFT, true);
        this.new_agi_text = this.init_text_sprite("",NEW_STAT_END_X, 2*LINE_SHIFT, true);

        this.text_group.alpha = 0;
        this.arrow_group.alpha = 0;
    }

    /*Initializes a text-shadow pair

    Input: text [string] - The text to display
           x, y [number] - The text position
           right_align - If true, the text will be right-aligned*/
    init_text_sprite(text, x, y, right_align){
        let txt = this.window.set_text_in_position(text, x, y, right_align);
        this.window.add_to_internal_group("texts",txt.shadow);
        this.window.add_to_internal_group("texts",txt.text);
        return txt;
    }

    /*Creates or recycles an arrow sprite

    Input: diff [number] - Stat difference, affects the arrow type
           line [number] - Line index for displaying purposes*/
    make_arrow(diff, line){
        if(diff === 0) return;

        let arrow_x = 0;
        let arrow_y = LINE_SHIFT*line + (diff>0 ? UP_ARROW_Y_SHIFT : 0);
        let key = diff>0 ? "up_arrow" : "down_arrow";

        let dead_arrows = this.arrow_group.children.filter(a => { return (a.alive === false && a.key === key); });
        if(dead_arrows.length>0) dead_arrows[0].reset(arrow_x, arrow_y);
        else this.window.create_at_group(arrow_x, arrow_y, key, undefined, undefined, "arrows");
    }

    /*Finds the statistical difference in a stat for two items

    Input: equipped [string] - Key name for the equipped item
           new_item [string] - Key name for the item being compared
           stat [string] - Stat to compare*/
    compare_items(equipped, new_item, stat){
        let eq_effects = _.mapKeys(this.data.info.items_list[equipped].effects, effect => effect.type);
        let nitem_effects = _.mapKeys(this.data.info.items_list[new_item].effects, effect => effect.type);

        let eq_stat = 0;
        let nitem_stat = 0;

        if(eq_effects[stat]) eq_stat = eq_effects[stat].quantity * (eq_effects[stat].operator === "minus" ? -1 : 1);
        if(nitem_effects[stat]) nitem_stat = nitem_effects[stat].quantity * (nitem_effects[stat].operator === "minus" ? -1 : 1);

        return (nitem_stat - eq_stat);
    }

    /*Updates the text and creates arrows if necessary
    
    Input: stat [string] - "attack", "defense", "agility"
           curr_stat_text [object] - The text-shadow pair displaying the current stat
           line [number] - Line index for displaying purposes*/
    display_stat(stat, curr_val, stat_diff){
        let new_stat_text = null;
        let curr_stat_text = null;
        let line = 0;

        switch(stat){
            case "attack":
                new_stat_text = this.new_atk_text;
                curr_stat_text = this.curr_atk_text;
                line = 0;
                break;
            case "defense":
                new_stat_text = this.new_def_text;
                curr_stat_text = this.curr_def_text;
                line = 1;
                break;
            case "agility":
                new_stat_text = this.new_agi_text;
                curr_stat_text = this.curr_agi_text;
                line = 2;
                break;
        }
        
        new_stat_text.text.alpha = stat_diff===0 ? 0 : 1;
        new_stat_text.shadow.alpha = stat_diff===0 ? 0 : 1;
        this.window.update_text(String(curr_val), curr_stat_text);
        if(stat_diff === 0) return;
        
        this.window.update_text(String(curr_val + stat_diff), new_stat_text);
        this.make_arrow(stat_diff, line);
    }

    /*Compare the same item for a different character*/
    change_character(key_name){
        this.selected_char = key_name;
        kill_all_sprites(this.arrow_group);

        this.show_stat_compare();
    }

    /*Displays the stat comparison*/
    show_stat_compare(){
        let this_char = this.data.info.party_data.members[this.selected_char];
        if(!this.data.info.items_list[this.selected_item].equipable_chars.includes(this_char.key_name)){
            this.show_cant_equip();
            return;
        }

        this.cant_equip_text.text.alpha = 0;
        this.cant_equip_text.shadow.alpha = 0;

        let selected_item_type = this.data.info.items_list[this.selected_item].type;
        let char_current_item = null;
        let eq_slots = this.data.info.party_data.members[this.selected_char].equip_slots;

        switch(selected_item_type){
            case "weapons":
                if(eq_slots.weapon) char_current_item = this.data.info.items_list[eq_slots.weapon.key_name].key_name;
                break;        
            case "armor":
                if(eq_slots.body) char_current_item = this.data.info.items_list[eq_slots.body.key_name].key_name;
                break;
            case "chest_protector":
                if(eq_slots.chest) char_current_item = this.data.info.items_list[eq_slots.chest.key_name].key_name;
                break;
            case "head_protector":
                if(eq_slots.head) char_current_item = this.data.info.items_list[eq_slots.head.key_name].key_name;
                break;
            case "ring":
                if(eq_slots.ring) char_current_item = this.data.info.items_list[eq_slots.ring.key_name].key_name;
                break;
            case "boots":
                if(eq_slots.boots) char_current_item = this.data.info.items_list[eq_slots.boots.key_name].key_name;
                break;
            case "underwear":
                if(eq_slots.underwear) char_current_item = this.data.info.items_list[eq_slots.underwear.key_name].key_name;
                break;
        }

        //this_char.items.filter(itm => {return (itm.equipped === true && this.data.info.items_list[itm.key_name].type === selected_item_type)})[0].key_name; 

        let atk_diff = this.compare_items(char_current_item, this.selected_item, "attack");
        let def_diff = this.compare_items(char_current_item, this.selected_item, "defense");
        let agi_diff = this.compare_items(char_current_item, this.selected_item, "agility");

        this.display_stat("attack", this_char.current_atk, atk_diff);
        this.display_stat("defense", this_char.current_def, def_diff);
        this.display_stat("agility", this_char.current_agi, agi_diff);

        this.window.update_text(this.data.info.items_list[char_current_item].name, this.item_name_text);

        for(let i=0; i<SEPARATOR_COUNT; i++){
            this.window.draw_separator(SEPARATOR_X, SEPARATOR_Y+LINE_SHIFT*i, SEPARATOR_X+SEPARATOR_LENGTH , SEPARATOR_Y+LINE_SHIFT*i, false);
        }

        this.text_group.alpha = 1;
        this.arrow_group.alpha = 1;
    }

    /*Displays the "Can't equip" message*/
    show_cant_equip(){
        this.text_group.alpha = 0;
        this.arrow_group.alpha = 0;
        this.window.clear_separators();

        this.cant_equip_text.text.alpha = 1;
        this.cant_equip_text.shadow.alpha = 1;
    }

    /*Opens this window with the selected member

    Input: char [number] - Party index of the character
           item [string] - Key name of the item to compare
           close_callback [function] - Callback function (Optional)
           open_callback [function] - Callback function (Optional)*/
    open(char=0, item, close_callback, open_callback){
        this.selected_char = char;
        this.selected_item = item;

        this.show_stat_compare();

        this.is_open = true;
        this.close_callback = close_callback;
        this.window.show(open_callback, false);
    }

    /*Clears information and closes the window

    Input: destroy [boolean] - If true, sprites are destroyed*/
    close(destroy = false){
        kill_all_sprites(this.arrow_group, destroy);
        if(destroy) kill_all_sprites(this.text_group, destroy);

        this.selected_item = null;
        this.selected_char = null;

        this.is_open = false;
        this.window.close(this.close_callback, false);
        this.close_callback = null;
    }
}