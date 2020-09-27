import { Window } from '../../Window.js';
import { items_list } from '../../../initializers/items.js';
import { get_text_width } from '../../../utils.js';

const MAX_PER_PAGE = 7;

const WIN_X = 0;
const WIN_Y = 96;
const WIN_WIDTH = 236;
const WIN_HEIGHT = 28;

const ITEM_X = 8;
const ITEM_Y = 8;
const TAG_X = 24;
const TAG_Y = 104;

const TEXT_X = 35;
const TEXT_END_Y = 131;
const TEXT_BG_COLOR = 0xff7300;

const LINE_SHIFT = 32;

export class BuySelectMenu{
    constructor(game, data){
        this.game = game;
        this.data = data;
        this.close_callback = null;

        this.window = new Window(this.game, WIN_X, WIN_Y, WIN_WIDTH, WIN_HEIGHT);
        this.items = [];
        this.selected_item = null;
        this.current_page = 0;

        this.sprite_group = this.window.define_internal_group("sprites", {x: ITEM_X, y: ITEM_Y});
        this.tag_group = this.game.add.group();
        this.tag_group.x = TAG_X;
        this.tag_group.y = TAG_Y;
        this.text_group = this.game.add.group();
        this.text_group.x = TEXT_X;
        this.text_group.y = TEXT_END_Y;

        this.sprites = [];
        this.tags = [];
        this.texts = [];
    }

    update_group_pos(){
        this.tag_group.x = TAG_X + this.game.camera.x;
        this.tag_group.y = TAG_Y + this.game.camera.y;
        this.text_group.x = TEXT_X + this.game.camera.x;
        this.text_group.y = TEXT_END_Y + this.game.camera.y;
    }

    set_sprites(page){
        let items_length = Object.keys(this.items).length;
        if(items_length < MAX_PER_PAGE*page) return;
        let keys = Array.from(Object.keys(this.items));
        let display_items = [];

        for(let i = MAX_PER_PAGE*page; i<(items_length % MAX_PER_PAGE) + MAX_PER_PAGE*page; i++){
            display_items.push(this.items[keys[i]]);
        }
        
        for(let i = 0; i<display_items.length; i++){
            this.sprites.push(this.window.create_at_group(i*LINE_SHIFT, 0, "item_border", undefined, undefined, "sprites"));
            this.sprites.push(this.window.create_at_group(i*LINE_SHIFT, 0, "items_icons", undefined, display_items[i].key_name, "sprites"));

            this.tags.push(this.tag_group.create(i*LINE_SHIFT, 0, "price_tag"));
            

            let price = items_list[display_items[i].key_name].price;
            let price_sprite = this.game.add.bitmapText(i*LINE_SHIFT, 0, 'gs-item-bmp-font', price.toString());
            price_sprite.rotation = Math.PI/2;
            price_sprite.y -= price_sprite.width;
            this.texts.push(price_sprite);
            this.text_group.add(price_sprite);
        }
        this.update_group_pos();
    }

    open(items, close_callback, open_callback){
        this.items = items;

        this.set_sprites(0);

        this.close_callback = close_callback;
        this.window.show(open_callback, false);
    }
}