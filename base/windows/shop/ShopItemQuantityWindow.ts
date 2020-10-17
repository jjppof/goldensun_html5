import { ItemCounter } from '../../utils/ItemCounter';
import { Window, TextObj } from '../../Window';
import { GoldenSun } from '../../GoldenSun';
import { CursorManager } from '../../utils/CursorManager';
import { ShopItem } from '../../Shop';
import { ItemSlot } from '../../MainChar';

const QUANTITY_WIN_X = 56;
const QUANTITY_WIN_Y = 32;
const QUANTITY_WIN_WIDTH = 180;
const QUANTITY_WIN_HEIGHT = 20;

const ITEM_COUNTER_X = 8;
const ITEM_COUNTER_Y = 8;

const QUANTITY_TEXT_END_X = 93;
const QUANTITY_TEXT_Y = 8;

const COINS_VALUE_END_X = 141;
const COINS_VALUE_Y = 8;

const COINS_LABEL_X = 144;
const COINS_LABEL_Y = 8;

const CURSOR_X = 132;
const CURSOR_Y = 46;

export class ShopItemQuantityWindow {
    public game:Phaser.Game;
    public data:GoldenSun;
    public close_callback:Function;

    public window:Window;
    public item_counter:ItemCounter;
    public chosen_quantity:number;
    public base_price:number;
    public is_open:boolean;

    public quantity_text:TextObj;
    public coins_val_text:TextObj;
    public coins_label_text:TextObj;

    constructor(game:Phaser.Game, data:GoldenSun) {
        this.game = game;
        this.data = data;
        this.close_callback = null;

        this.window = new Window(this.game, QUANTITY_WIN_X, QUANTITY_WIN_Y, QUANTITY_WIN_WIDTH, QUANTITY_WIN_HEIGHT);
        this.item_counter = new ItemCounter(this.game, this.window.group, ITEM_COUNTER_X, ITEM_COUNTER_Y, this.on_change.bind(this));

        this.chosen_quantity = 1;
        this.base_price = 0;
        this.is_open = false;

        this.quantity_text = this.window.set_text_in_position(String(this.chosen_quantity), QUANTITY_TEXT_END_X, QUANTITY_TEXT_Y, true);
        this.coins_val_text = this.window.set_text_in_position("", COINS_VALUE_END_X, COINS_VALUE_Y, true);
        this.coins_label_text = this.window.set_text_in_position("Coins", COINS_LABEL_X, COINS_LABEL_Y);

    }

    on_change(quantity:number) {
        this.chosen_quantity = quantity;
        this.window.update_text(String(this.chosen_quantity), this.quantity_text);
        this.window.update_text(String(this.base_price*this.chosen_quantity), this.coins_val_text);
    }

    increase_amount(){
        this.item_counter.advance_step(1);
    }

    decrease_amount(){
        this.item_counter.advance_step(-1);
    }

    open(shop_item_obj:ShopItem, char_item_obj?:ItemSlot, use_coins:boolean=false,
        close_callback?:Function, open_callback?:Function){
        this.data.cursor_manager.move_to(CURSOR_X, CURSOR_Y, "wiggle");

        this.base_price = this.data.info.items_list[shop_item_obj.key_name].price;
        this.window.update_text(String(this.base_price), this.coins_val_text);

        let owned = !char_item_obj ? 0 : char_item_obj.quantity;
        let available_quantity = (shop_item_obj.quantity === -1 ? 30 : shop_item_obj.quantity);
        if(available_quantity + owned > 30) available_quantity = 30 - owned;
        if(use_coins && this.base_price*available_quantity > this.data.info.party_data.coins){
            available_quantity = (this.data.info.party_data.coins/this.base_price) | 0;
        }

        this.item_counter.config(available_quantity, this.chosen_quantity, owned);

        this.is_open = true;
        this.close_callback = close_callback;
        this.window.show(open_callback, false);

    }

    close(){
        this.item_counter.deactivate();
        this.item_counter.clear();
        this.data.cursor_manager.clear_tweens();

        this.chosen_quantity = 1;
        this.base_price = 0;

        this.is_open = false;
        this.window.close(this.close_callback, false);
        this.close_callback = null;
    }
}