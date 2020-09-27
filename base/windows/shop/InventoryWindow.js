import { Window } from '../../Window.js';
import { party_data } from "../../../initializers/main_chars.js";
import { items_list } from '../../../initializers/items.js';

const MAX_PER_LINE = 5;
const ICON_SIZE = 16;

const MESSAGE_HAVE_ITEM = "You have ";
const MESSAGE_NO_ITEM = "None in stock";

const BASE_X = 128;
const BASE_Y = 96;
const BASE_WIDTH = 108;
const BASE_HEIGHT = 60;
const EXPAND_DIFF = 8;

const ITEM_X = 16;
const ITEM_Y = 8;

const SUB_ICON_X = 7;
const SUB_ICON_Y = 8;

const TEXT_X = 8;
const TEXT_Y = 8;

/*Displays a character's inventory through icons
Used in shop menus. Can display the amout of an item in the inventory

Input: game [Phaser:Game] - Reference to the running game object*/
export class InventoryWindow{
    constructor(game){
        this.game = game;
        this.close_callback = null;
        this.expanded = false;

        this.window = new Window(this.game, BASE_X, BASE_Y, BASE_WIDTH, BASE_HEIGHT);
        this.text = this.window.set_text_in_position("", TEXT_X, TEXT_Y);
        this.text.text.alpha = 0;
        this.text.shadow.alpha = 0;
        
        this.char = null;
        this.char_items = [];
        this.selected_item = null;
        this.sprite_group = this.window.define_internal_group("sprites", {x: ITEM_X, y: ITEM_Y});
        this.icon_group = this.window.define_internal_group("icons", {x: ITEM_X + SUB_ICON_X, y: ITEM_Y + SUB_ICON_Y});
        this.sprites = [];
        this.icons = [];
    }

    /*Checks and manages the expanded state of the window

    Input: expand [boolean]: If true, the window be in expanded state*/
    check_expand(expand){
        if(expand) this.set_text();
        if(this.expanded === expand) return;

        let modifier = expand ? 1 : -1;

        this.window.update_size({height: BASE_HEIGHT + modifier * EXPAND_DIFF});
        this.window.update_position({y: BASE_Y - modifier * EXPAND_DIFF});
        this.sprite_group.y = this.sprite_group.y + modifier * EXPAND_DIFF;
        this.icon_group.y = this.icon_group.y + modifier * EXPAND_DIFF;
        this.window.update();

        this.expanded = expand;
    }

    /*Sets and displays the text relative to the selected item*/
    set_text(){
        let item_match = this.char_items.filter(item_obj => { return item_obj.key_name === this.selected_item; });

        if(item_match.length === 0) this.window.update_text(MESSAGE_NO_ITEM, this.text);
        else this.window.update_text(MESSAGE_HAVE_ITEM + item_match[0].quantity, this.text);

        this.text.text.alpha = 1;
        this.text.shadow.alpha = 1;
    }

    /*Changes the character whose inventory is being shown

    Input: index [number] - Party index of the character*/
    change_character(index){
        this.char = party_data.members[index];
        this.char_items = this.char.items.filter(item_obj => {return item_obj.key_name in items_list;});

        this.clean_sprites();
        if(this.expanded) this.set_text();
        this.set_sprites();
    }

    /*Displays the sprites for the window
    Includes icons and quantity text*/
    set_sprites(){
        for(let i=0; i<this.char_items.length; i++){
            let this_item = items_list[this.char_items[i].key_name];
            let col = i % MAX_PER_LINE;
            let line = (i / MAX_PER_LINE) | 0;

            let dead_items = this.sprites.filter(s => { return (s.alive === false && s.key === "items_icons"); });
            let dead_backgrounds = this.sprites.filter(s => { return (s.alive === false && s.key === "item_border"); });

            if(dead_items.length>0 && dead_backgrounds.length>0){
                let bg = dead_backgrounds[0];
                let itm = dead_items[0];
                itm.frameName = this_item.key_name;
                bg.reset(col*ICON_SIZE, line*ICON_SIZE);
                itm.reset(col*ICON_SIZE, line*ICON_SIZE);
            }
            else{
                this.sprites.push(this.window.create_at_group(col*ICON_SIZE, line*ICON_SIZE, "item_border", undefined, undefined, "sprites"));
                this.sprites.push(this.window.create_at_group(col*ICON_SIZE, line*ICON_SIZE, "items_icons", undefined, this_item.key_name, "sprites"));
            }

            if (this.char_items[i].equipped) {
                let dead_icons = this.icons.filter(e => { return (e.alive === false && e.text === undefined); });
                if(dead_icons.length>0){
                    let icn = dead_icons[0];
                    icn.reset(col*ICON_SIZE, line*ICON_SIZE);
                }
                else this.icons.push(this.window.create_at_group(col*ICON_SIZE, line*ICON_SIZE, "equipped", undefined,undefined, "icons"));
            }
            if (this.char_items[i].quantity > 1) {
                let dead_text = this.icons.filter(t => { return (t.alive === false && t.text !== undefined); });
                if(dead_text.length>0){
                    let txt = dead_text[0];
                    txt.text = this.char_items[i].quantity.toString();
                    txt.reset(col*ICON_SIZE, line*ICON_SIZE);
                }
                else{
                    let item_count = this.game.add.bitmapText(col*ICON_SIZE, line*ICON_SIZE, 'gs-item-bmp-font', this.char_items[i].quantity.toString());
                    this.icons.push(item_count);
                    this.window.add_to_internal_group("icons", item_count);
                }
            }
        }
        this.sprite_group.alpha = 1;
    }

    /*Opens this window for a given character

    Input: char_index [number] - The character's party index
           item [string] - The item to check against
           expand [boolean] - If true, the window will be in expanded state
           close_callback [function] - Callback function (Optional)
           open_callback [function] - Callback function (Optional)*/
    open(char_index, item, expand, close_callback, open_callback){
        this.char = party_data.members[char_index];
        this.selected_item = item;

        this.char_items = this.char.items.filter(item_obj => {return item_obj.key_name in items_list;});

        this.check_expand(expand);
        this.set_sprites();

        this.close_callback = close_callback;
        this.window.show(open_callback, false);
    }

    /*Kills or destroys all sprites

    Input: destroy [boolean] - Destroys sprites instead of killing*/
    clean_sprites(destroy = false){
        for(let i=0; i<this.sprites.length; i++){
            if(destroy) this.sprite_group.remove(this.sprites[i],true);
            else this.sprites[i].kill();
        }
        for(let i=0; i<this.icons.length; i++){
            if(destroy) this.icon_group.remove(this.icons[i],true);
            else this.icons[i].kill();
        }
        if(destroy){
            this.sprites = [];
            this.icons = [];
        }
    }

    /*Clears information and closes the window

    Input: destroy [boolean] - If true, sprites are destroyed*/
    close(destroy = false){
        this.clean_sprites(destroy);

        this.text.text.alpha = 0;
        this.text.shadow.alpha = 0;
        this.char = null;
        this.char_items = [];
        this.selected_item = null;

        this.window.close(this.close_callback, false);
        this.close_callback = null;
    }
}