import { Window } from '../../Window.js';
import { kill_all_sprites } from '../../../utils.js';

const MAX_PER_PAGE = 7;

const WIN_X = 0;
const WIN_Y = 96;
const WIN_WIDTH = 236;
const WIN_HEIGHT = 28;

const ITEM_X = 16;
const ITEM_Y = 16+96;
const TAG_X = 24;
const TAG_Y = 104;

const TEXT_X = 39;
const TEXT_END_Y = 131;
const TEXT_BG_COLOR = 0xff7300;

const BG_SHIFT_X = -3;
const BG_SHIFT_Y = 1;

const LINE_SHIFT = 32;

const CURSOR_X = 0;
const CURSOR_Y = 112;

const SELECT_TWEEN_TIME = Phaser.Timer.QUARTER;

/*Displays a shopkeeper's wares to purchase
Supports multiple item pages

Input: game [Phaser:Game] - Reference to the running game object
       data [GoldenSun] - Reference to the main JS Class instance
       cursor_manager [CursorManager] - The manager class for cursor movement*/
export class BuySelectMenu{
    constructor(game, data, cursor_manager){
        this.game = game;
        this.data = data;
        this.cursor_manager = cursor_manager;
        this.close_callback = null;

        this.window = new Window(this.game, WIN_X, WIN_Y, WIN_WIDTH, WIN_HEIGHT);
        this.items = [];
        this.selected_index = null;
        this.current_page = 0;
        this.pages = [];
        this.tweens = {item: null, bg: null};
        this.is_open = false;

        this.sprite_group = this.game.add.group();
        this.sprite_group.x = ITEM_X;
        this.sprite_group.y = ITEM_Y;
        this.tag_group = this.game.add.group();
        this.tag_group.x = TAG_X;
        this.tag_group.y = TAG_Y;
        this.text_group = this.game.add.group();
        this.text_group.x = TEXT_X;
        this.text_group.y = TEXT_END_Y;
        this.bg_group = this.game.add.group();
        this.bg_group.x = TEXT_X + BG_SHIFT_X;
        this.bg_group.y = TEXT_END_Y + BG_SHIFT_Y;
    }

    /*Updates the groups' positions on screen*/
    update_group_pos(){
        this.sprite_group.x = ITEM_X + this.game.camera.x;
        this.sprite_group.y = ITEM_Y + this.game.camera.y;
        this.tag_group.x = TAG_X + this.game.camera.x;
        this.tag_group.y = TAG_Y + this.game.camera.y;
        this.text_group.x = TEXT_X + this.game.camera.x;
        this.text_group.y = TEXT_END_Y + this.game.camera.y;
        this.bg_group.x = TEXT_X + BG_SHIFT_X + this.game.camera.x;
        this.bg_group.y = TEXT_END_Y + BG_SHIFT_Y + this.game.camera.y;
    }

    /*Sets the price for a given item's tag

    Input: text [string] - Price of the item
           index [number] - Line index of the item*/
    set_text(text, index){
        let dead_texts = this.text_group.children.filter(t => { return (t.alive === false && t.tint !== 0); });
        let dead_shadows = this.text_group.children.filter(s => { return (s.alive === false && s.tint === 0); });

        let sprite = null;
        let shadow = null;

        if(dead_texts.length>0 && dead_shadows.length>0){
            dead_texts[0].text = text;
            dead_texts[0].reset(index*LINE_SHIFT, 0);
            dead_shadows[0].text = text;
            dead_shadows[0].reset(index*LINE_SHIFT, 0);
            sprite = dead_texts[0];
            shadow = dead_shadows[0];
        }
        else{
            shadow = this.game.add.bitmapText(index*LINE_SHIFT, 0, 'gs-shop-bmp-font', text);
            sprite = this.game.add.bitmapText(index*LINE_SHIFT, 0, 'gs-shop-bmp-font', text);
            shadow.rotation = Math.PI/2;
            sprite.rotation = Math.PI/2;
            shadow.tint = 0x0;
            this.text_group.add(shadow);
            this.text_group.add(sprite);
        }

        shadow.y -= (sprite.width-1);
        sprite.y -= sprite.width;
        shadow.x -= 1;
        
        let dead_text_bgs = this.bg_group.children.filter(bg => { return bg.alive === false; });

        if(dead_text_bgs.length>0){
            dead_text_bgs[0].clear();
            dead_text_bgs[0].beginFill(TEXT_BG_COLOR, 1);
            dead_text_bgs[0].drawRect(0, 0, -(sprite.height+1), -(sprite.width+1));
            dead_text_bgs[0].endFill();
            dead_text_bgs[0].reset(index*LINE_SHIFT, 0)
        }
        else{
            let bg = this.game.add.graphics(index*LINE_SHIFT, 0);
            bg.beginFill(TEXT_BG_COLOR, 1);
            bg.drawRect(0, 0, -(sprite.height+1), -(sprite.width+1));
            bg.endFill();
            this.bg_group.add(bg);
        }

        this.game.world.bringToTop(this.text_group);
    }

    /*Splits the shopkeeper's wares into pages*/
    make_pages(){
        let items_length = Object.keys(this.items).length;
        let keys = Array.from(Object.keys(this.items));
        let page_number = items_length%7===0 ? (items_length/7) | 0 : ((items_length/7) | 0) + 1;

        for(let i = 0; i<page_number; i++){
            let wares = [];
            for(let n=i*MAX_PER_PAGE; n<(i+1)*MAX_PER_PAGE; n++){
                if(!keys[n]) break;
                wares.push(this.items[keys[n]]);
            }
            this.pages[i] = wares;
        }
    }

    /*Displays the sprites for the window

    Input: page [number] - The item page index*/
    set_sprites(page){        
        for(let i = 0; i<this.pages[page].length; i++){

            let dead_items = this.sprite_group.children.filter(s => { return (s.alive === false && s.key === "items_icons"); });
            let dead_backgrounds = this.sprite_group.children.filter(s => { return (s.alive === false && s.key === "item_border"); });

            if(dead_items.length>0 && dead_backgrounds.length>0){
                dead_backgrounds[0].reset(i*LINE_SHIFT, 0);
                dead_backgrounds[0].scale.x = 1;
                dead_backgrounds[0].scale.y = 1;
                dead_items[0].frameName = this.pages[page][i].key_name;
                dead_items[0].scale.x = 1;
                dead_items[0].scale.y = 1;
                dead_items[0].reset(i*LINE_SHIFT, 0);
            }
            else{
                this.sprite_group.create(i*LINE_SHIFT, 0, "item_border").anchor.setTo(0.5, 0.5);
                this.sprite_group.create(i*LINE_SHIFT, 0, "items_icons", this.pages[page][i].key_name).anchor.setTo(0.5, 0.5);
            }

            let dead_tags = this.tag_group.children.filter(t => { return t.alive === false; });
            if(dead_tags.length>0) dead_tags[0].reset(i*LINE_SHIFT, 0); 
            else this.tag_group.create(i*LINE_SHIFT, 0, "price_tag");
            
            let price = this.data.info.items_list[this.pages[page][i].key_name].price;
            this.set_text(price.toString(), i);
        }
        this.set_item(this.selected_index%MAX_PER_PAGE);
    }

    /*Displays another page of items

    Input: index [number] - Index of the page to be displayed*/
    change_page(index){
        let items_length = Object.keys(this.items).length;
        if(items_length < MAX_PER_PAGE*index) return;

        this.current_page = index;
        if(this.selected_index !== null){
            let leftover = this.selected_index%MAX_PER_PAGE;
            
            this.selected_index = MAX_PER_PAGE*index + leftover < items_length ? MAX_PER_PAGE*index + leftover : items_length - 1;
        }

        kill_all_sprites(this.sprite_group);
        kill_all_sprites(this.tag_group);
        kill_all_sprites(this.text_group);
        kill_all_sprites(this.bg_group);
        this.unset_item(this.selected_index);
        this.set_sprites(index);
    }

    /*Selects a new item

    Input: step [number] - Step index for new item selection*/
    change_item(step){
        console.log("before selected_index = "+this.selected_index);
        
        this.unset_item(this.selected_index);

        if(this.selected_index + step >= MAX_PER_PAGE) this.selected_index = this.selected_index + step - MAX_PER_PAGE;
        else if(this.selected_index + step < 0) this.selected_index = MAX_PER_PAGE + step;
        else this.selected_index = this.selected_index + step;

        console.log("step = "+step);
        console.log("after selected_index = "+this.selected_index);
        
        this.set_item(this.selected_index);
        this.set_cursor(this.selected_index);
    }

    /*Sets the scaling animation for the selected item

    Input: index [number] - Item index (on screen)*/
    set_item(index) {
        this.game.world.bringToTop(this.sprite_group);
        this.game.world.bringToTop(this.cursor_manager.group);
        let itm_list = this.sprite_group.children.filter(s => { return (s.alive === true && s.key === "items_icons"); });
        let bg_list = this.sprite_group.children.filter(s => { return (s.alive === true && s.key === "item_border"); });
        
        let tweens = [this.tweens.item, this.tweens.bg];
        let lists = [itm_list, bg_list];

        for(let i=0; i<2; i++){
            tweens[i] = this.game.add.tween(lists[i][index].scale).to(
                { x: 1.55, y: 1.55 },
                SELECT_TWEEN_TIME,
                Phaser.Easing.Linear.None,
                true,
                0,
                -1,
                true
                )
            };
        this.tweens = {item: tweens[0], bg: tweens[1]};
    }

    /*Removes the scaling animation from the selected item

    Input: index [number] - Item index (on screen)*/
    unset_item(index) {
        let itm_list = this.sprite_group.children.filter(s => { return (s.alive === true && s.key === "items_icons"); });
        let bg_list = this.sprite_group.children.filter(s => { return (s.alive === true && s.key === "item_border"); });

        let tweens = [this.tweens.item, this.tweens.bg];
        let lists = [itm_list, bg_list];

        for(let i=0; i<2; i++){
            if (lists[i][index]) {
                lists[i][index].scale.setTo(1.0, 1.0);
            }
            if (tweens[i]) {
                this.game.tweens.remove(tweens[i]);
                tweens[i] = null;
            }
        }
    }

    /*Sets the cursor to the current item's index

    Input: index [number] - Selected item's index*/
    set_cursor(index){
        this.cursor_manager.move_to(CURSOR_X + index*LINE_SHIFT, CURSOR_Y, "point");
    }

    /*Opens this window at page 0

    Input: items [array] - The item list to display (array of Item)
           index [number] - Initial selected item index
           page [number] - Initial selected page index
           close_callback [function] - Callback function (Optional)
           open_callback [function] - Callback function (Optional)*/
    open(items, index=0, page=0, close_callback=undefined, open_callback=undefined){
        this.items = items;
        this.current_page = page
        this.selected_index = index;
        this.is_open = true;
        this.make_pages();

        this.set_sprites(this.current_page);
        this.set_cursor(this.selected_index);
        this.update_group_pos();

        this.close_callback = close_callback;
        this.window.show(open_callback, false);
    }

    /*Clears information and closes the window

    Input: destroy [boolean] - If true, sprites are destroyed*/
    close(destroy = false){
        kill_all_sprites(this.sprite_group, destroy);
        kill_all_sprites(this.tag_group, destroy);
        kill_all_sprites(this.text_group, destroy);
        kill_all_sprites(this.bg_group, destroy);

        this.items = [];
        this.selected_index = null;
        this.current_page = 0;
        this.is_open = false;

        this.window.close(this.close_callback, false);
        this.close_callback = null;
    }
}