import { Window } from '../../Window.js';
import { kill_all_sprites } from '../../../utils.js';

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

const CURSOR_X = 136;
const CURSOR_Y = 112;

/*Displays a character's inventory through icons
Used in shop menus. Can display the amout of an item in the inventory

Input: game [Phaser:Game] - Reference to the running game object
       data [GoldenSun] - Reference to the main JS Class instance*/
export class InventoryWindow{
    constructor(game, data, cursor_manager){
        this.game = game;
        this.data = data;
        this.cursor_manager = cursor_manager;
        this.close_callback = null;

        this.expanded = false;
        this.is_open = false;

        this.window = new Window(this.game, BASE_X, BASE_Y, BASE_WIDTH, BASE_HEIGHT);
        this.text = this.window.set_text_in_position("", TEXT_X, TEXT_Y);
        this.text.text.alpha = 0;
        this.text.shadow.alpha = 0;
        
        this.char = null;
        this.char_items = [];
        this.selected_item = null;
        this.sprite_group = this.window.define_internal_group("sprites", {x: ITEM_X, y: ITEM_Y});
        this.icon_group = this.window.define_internal_group("icons", {x: ITEM_X + SUB_ICON_X, y: ITEM_Y + SUB_ICON_Y});
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
        this.char = this.data.info.party_data.members[index];
        this.char_items = this.char.items.filter(item_obj => {return item_obj.key_name in this.data.info.items_list;});

        kill_all_sprites(this.sprite_group);
        kill_all_sprites(this.icon_group);
        if(this.expanded) this.set_text();
        this.set_sprites();
    }

    /*Moves the cursor to the given column and line*/
    set_cursor(col, line){
        this.cursor_manager.move_to(CURSOR_X + col*ICON_SIZE, CURSOR_Y + line*ICON_SIZE, "point", true);
    }

    /*Displays the sprites for the window
    Includes icons and quantity text*/
    set_sprites(){
        for(let i=0; i<this.char_items.length; i++){
            let this_item = this.data.info.items_list[this.char_items[i].key_name];
            let col = i % MAX_PER_LINE;
            let line = (i / MAX_PER_LINE) | 0;

            let dead_items = this.sprite_group.children.filter(s => { return (s.alive === false && s.key === "items_icons"); });
            let dead_backgrounds = this.sprite_group.children.filter(s => { return (s.alive === false && s.key === "item_border"); });

            if(dead_items.length>0 && dead_backgrounds.length>0){
                dead_backgrounds[0].reset(col*ICON_SIZE, line*ICON_SIZE);
                dead_items[0].reset(col*ICON_SIZE, line*ICON_SIZE);
                dead_items[0].frameName = this_item.key_name;
            }
            else{
                this.window.create_at_group(col*ICON_SIZE, line*ICON_SIZE, "item_border", undefined, undefined, "sprites");
                this.window.create_at_group(col*ICON_SIZE, line*ICON_SIZE, "items_icons", undefined, this_item.key_name, "sprites");
            }

            if (this.char_items[i].broken) {
                let dead_broken = this.sprite_group.children.filter(b => { return (b.alive === false && b.key === "broken"); });
                if(dead_broken.length>0) dead_broken[0].reset(col*ICON_SIZE, line*ICON_SIZE);
                else this.window.create_at_group(col*ICON_SIZE, line*ICON_SIZE, "broken", undefined,undefined, "sprites");
            }

            if (this.char_items[i].equipped) {
                let dead_icons = this.icon_group.children.filter(e => { return (e.alive === false && e.text === undefined); });
                if(dead_icons.length>0) dead_icons[0].reset(col*ICON_SIZE, line*ICON_SIZE);
                else this.window.create_at_group(col*ICON_SIZE, line*ICON_SIZE, "equipped", undefined,undefined, "icons");
            }

            if (this.char_items[i].quantity > 1) {
                let dead_text = this.icon_group.children.filter(t => { return (t.alive === false && t.text !== undefined); });
                if(dead_text.length>0){
                    dead_text[0].text = this.char_items[i].quantity.toString();
                    dead_text[0].reset(col*ICON_SIZE, line*ICON_SIZE);
                }
                else{
                    let item_count = this.game.add.bitmapText(col*ICON_SIZE, line*ICON_SIZE, 'gs-item-bmp-font', this.char_items[i].quantity.toString());
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
    open(char_index, item, expand=false, close_callback, open_callback){
        this.char = this.data.info.party_data.members[char_index];
        this.selected_item = item;

        this.char_items = this.char.items.filter(item_obj => {return item_obj.key_name in this.data.info.items_list;});

        this.check_expand(expand);
        this.set_sprites();

        this.is_open = true;
        this.close_callback = close_callback;
        this.window.show(open_callback, false);
    }

    /*Clears information and closes the window

    Input: destroy [boolean] - If true, sprites are destroyed*/
    close(destroy = false){
        kill_all_sprites(this.sprite_group, destroy);
        kill_all_sprites(this.icon_group, destroy);

        this.text.text.alpha = 0;
        this.text.shadow.alpha = 0;
        this.char = null;
        this.char_items = [];
        this.selected_item = null;

        this.is_open = false;
        this.window.close(this.close_callback, false);
        this.close_callback = null;
    }
}