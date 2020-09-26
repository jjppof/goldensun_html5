import { Window } from '../../Window.js';
import { party_data } from "../../../initializers/main_chars.js";
import { items_list } from '../../../initializers/items.js';

const MAX_PER_LINE = 5;

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

export class InventoryWindow{
    constructor(game, data){
        this.game = game;
        this.data = data;
        
        this.close_callback = null;

        this.window = new Window(this.game, BASE_X, BASE_Y, BASE_WIDTH, BASE_HEIGHT);
        this.text = this.window.set_text_in_position("", TEXT_X, TEXT_Y);
        this.text.text.alpha = 0;
        this.text.shadow.alpha = 0;
        
        this.char = null;
        this.items = [];
        this.selected_item = null;
        this.sprite_group = this.window.define_internal_group("sprites", {x: ITEM_X, y: ITEM_Y});
        this.icon_group = this.window.define_internal_group("icons", {x: ITEM_X + SUB_ICON_X, y: ITEM_Y + SUB_ICON_Y});
        this.sprites = [];
        this.icons = [];
    }

    expand(){
        this.window.update_size({height: BASE_HEIGHT + EXPAND_DIFF});
        this.window.update_position({y: BASE_Y - EXPAND_DIFF});
        this.sprite_group.y = this.sprite_group.y + EXPAND_DIFF;
        this.icon_group.y = this.icon_group.y + EXPAND_DIFF;
        this.window.update();

        let item_match = this.items.filter(item_obj => { return item_obj.key_name === this.selected_item; });

        if(item_match.length === 0) this.window.update_text(MESSAGE_NO_ITEM, this.text);
        else this.window.update_text(MESSAGE_HAVE_ITEM + item_match[0].quantity, this.text);

        this.text.text.alpha = 1;
        this.text.shadow.alpha = 1;
    }

    get_sprites(){
        for(let i=0; i<this.items.length; i++){
            let this_item = items_list[this.items[i].key_name];
            let col = i % MAX_PER_LINE;
            let line = (i / MAX_PER_LINE) | 0;

            this.sprites.push(this.window.create_at_group(col*16, line*16, "item_border", undefined, undefined, "sprites"));
            this.sprites.push(this.window.create_at_group(col*16, line*16, "items_icons", undefined, this_item.key_name, "sprites"));

            if (this.items[i].equipped) {
                this.icons.push(this.window.create_at_group(col*16, line*16, "equipped", undefined,undefined, "icons"));
            }
            if (this.items[i].quantity > 1) {
                let item_count = this.game.add.bitmapText(col*16, line*16, 'gs-item-bmp-font', this.items[i].quantity.toString());
                this.icons.push(item_count);
                this.window.add_to_internal_group("icons", item_count);
            }
        }
        this.sprite_group.alpha = 1;
    }

    open(char_index, item, expand, close_callback, open_callback){
        this.char = party_data.members[char_index];
        this.selected_item = item;

        this.items = this.char.items.filter(item_obj => {return item_obj.key_name in items_list;});

        if(expand) this.expand();
        this.get_sprites();

        this.close_callback = close_callback;
        this.window.show(open_callback, false);
    }

    close(){
        for(let i=0; i<this.sprites.length; i++){
            this.sprite_group.remove(sprite[i],true);
        }
        for(let i=0; i<this.icons.length; i++){
            this.icon_group.remove(icon[i],true);
        }

        this.text.text.alpha = 0;
        this.text.shadow.alpha = 0;
        this.char = null;
        this.items = [];
        this.selected_item = null;
        this.sprites = [];
        this.icons = [];

        this.window.close(this.close_callback, false);
        this.close_callback = null;
    }
}