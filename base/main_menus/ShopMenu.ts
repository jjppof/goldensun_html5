import { DialogData, ShopkeepDialog } from '../windows/shop/ShopkeepDialog';
import { BuyArtifactsMenu } from '../windows/shop/BuyArtifactsMenu';
import { SellRepairMenu } from '../windows/shop/SellRepairMenu';
import { capitalize } from '../utils';
import { InventoryWindow } from '../windows/shop/InventoryWindow';
import { BuySelectMenu } from '../windows/shop/BuySelectMenu';
import { EquipCompare } from '../windows/shop/EquipCompare';
import { YesNoMenu } from '../windows/YesNoMenu';
import { ShopItemQuantityWindow } from '../windows/shop/ShopItemQuantityWindow';
import { Window, TextObj } from '../Window';
import { CharsMenu } from '../support_menus/CharsMenu';
import { HorizontalMenu } from '../support_menus/HorizontalMenu';
import { GoldenSun } from '../GoldenSun';
import { ShopItem } from '../Shop';
import * as _ from "lodash";
import { Shop } from '../Shop';
import { Item } from '../Item';

const ITEM_PRICE_WIN_X = 0;
const ITEM_PRICE_WIN_Y = 64;
const ITEM_PRICE_WIN_WIDTH = 116;
const ITEM_PRICE_WIN_HEIGHT = 28;
const ITEM_PRICE_NAME_X = 8;
const ITEM_PRICE_NAME_Y = 8;
const ITEM_PRICE_LABEL_X = 8;
const ITEM_PRICE_LABEL_Y = 16;
const ITEM_PRICE_VAL_END_X = 77;
const ITEM_PRICE_VAL_Y = 16;
const ITEM_PRICE_COINS_X = 80;
const ITEM_PRICE_COINS_Y = 16;

const ITEM_PRICE_WIN_X2 = 120;
const ITEM_PRICE_WIN_Y2 = 64;

const YOUR_COINS_WIN_X = 144;
const YOUR_COINS_WIN_Y = 56;
const YOUR_COINS_WIN_WIDTH = 92;
const YOUR_COINS_WIN_HEIGHT = 28;
const YOUR_COINS_LABEL_X = 8;
const YOUR_COINS_LABEL_Y = 8;
const YOUR_COINS_VAL_END_X = 85;
const YOUR_COINS_VAL_Y = 16;

const YOUR_COINS_WIN_X2 = 0;
const YOUR_COINS_WIN_Y2 = 72;

const ITEM_DESC_WIN_X = 0;
const ITEM_DESC_WIN_Y = 136;
const ITEM_DESC_WIN_WIDTH = 236;
const ITEM_DESC_WIN_HEIGHT = 20;
const ITEM_DESC_TEXT_X = 8;
const ITEM_DESC_TEXT_Y = 8;

const ITEM_DESC_WIN_X2 = 0;
const ITEM_DESC_WIN_Y2 = 40;

const SELL_MULTIPLIER = 3/4;
const REPAIR_MULTIPLIER = 1/4;
const SELL_BROKEN_MULTIPLIER = SELL_MULTIPLIER - REPAIR_MULTIPLIER;

const BUY_MODE = "buy"
const SELL_MODE = "sell"

export class ShopMenu{
    public game: Phaser.Game;
    public data: GoldenSun;
    public shop_key: string;
    public close_callback: Function;
    public items_db:{[key_name:string] : Item};
    public shops_db:{[key_name:string] : Shop};
    public shopkeep_dialog_db:{[key_name:string] : DialogData};

    public normal_item_list: {[key_name:string] : ShopItem};
    public artifact_list: {[key_name:string] : ShopItem};

    public buttons_keys: string[];
    public windows_mode: string;
    public current_index: number;
    
    public horizontal_menu: HorizontalMenu;
    public npc_dialog: ShopkeepDialog;
    public yesno_action: YesNoMenu;
    public inv_win: InventoryWindow;
    public buy_select: BuySelectMenu;
    public eq_compare: EquipCompare;
    public quant_win: ShopItemQuantityWindow;
    public char_display: CharsMenu;

    public item_price_win: Window;
    public item_desc_win: Window;
    public your_coins_win: Window;

    public buy_menu: BuyArtifactsMenu;
    public sell_menu: SellRepairMenu;

    public your_coins_label: TextObj;
    public your_coins_text: TextObj;
    public item_name_text: TextObj;
    public item_price_coins_label: TextObj;
    public item_price_label: TextObj;
    public item_price_val_text: TextObj;
    public item_desc_text: TextObj;

    constructor(game:Phaser.Game, data:GoldenSun){
        this.game = game;
        this.data = data;
        this.shop_key = null;
        this.close_callback = null;

        this.items_db = this.data.info.items_list as any;
        this.shops_db = _.mapKeys(this.data.dbs.shops_db, shop => shop.key_name) as {[key_name:string] : Shop};
        this.shopkeep_dialog_db = this.data.dbs.shopkeep_dialog_db;

        this.normal_item_list = {};
        this.artifact_list = {};

        this.buttons_keys = ["buy", "sell", "artifacts", "repair"];
        this.windows_mode = BUY_MODE;
        this.current_index= 0;
        
        this.horizontal_menu = new HorizontalMenu(this.game, this.data,
            this.buttons_keys,
            this.buttons_keys.map(b => capitalize(b)),
            {on_press: this.button_press.bind(this), on_cancel: this.close_menu.bind(this)});

        this.npc_dialog = new ShopkeepDialog(this.game, this.data);

        this.yesno_action = new YesNoMenu(this.game, this.data);
        this.inv_win = new InventoryWindow(this.game, this.data, this.on_inv_win_change.bind(this));
        this.buy_select = new BuySelectMenu(this.game, this.data, this.on_buy_select_change.bind(this));
        this.eq_compare = new EquipCompare(this.game, this.data);
        this.quant_win = new ShopItemQuantityWindow(this.game, this.data);
        this.char_display = new CharsMenu(this.game, this.data, this.on_char_display_change.bind(this));

        this.item_price_win = new Window(this.game, ITEM_PRICE_WIN_X, ITEM_PRICE_WIN_Y, ITEM_PRICE_WIN_WIDTH, ITEM_PRICE_WIN_HEIGHT);
        this.your_coins_win = new Window(this.game, YOUR_COINS_WIN_X, YOUR_COINS_WIN_Y, YOUR_COINS_WIN_WIDTH, YOUR_COINS_WIN_HEIGHT);
        this.item_desc_win = new Window(this.game, ITEM_DESC_WIN_X, ITEM_DESC_WIN_Y, ITEM_DESC_WIN_WIDTH, ITEM_DESC_WIN_HEIGHT);
       
        
        this.buy_menu = new BuyArtifactsMenu(this.game, this.data, this);
        this.sell_menu = new SellRepairMenu(this.game, this.data, this);

        this.your_coins_label = this.your_coins_win.set_text_in_position("Your Coins: ", YOUR_COINS_LABEL_X, YOUR_COINS_LABEL_Y);
        this.your_coins_text = this.your_coins_win.set_text_in_position("", YOUR_COINS_VAL_END_X, YOUR_COINS_VAL_Y, true);

        this.item_name_text = this.item_price_win.set_text_in_position("", ITEM_PRICE_NAME_X, ITEM_PRICE_NAME_Y);
        this.item_price_label = this.item_price_win.set_text_in_position("Price", ITEM_PRICE_LABEL_X, ITEM_PRICE_LABEL_Y);
        this.item_price_val_text = this.item_price_win.set_text_in_position("", ITEM_PRICE_VAL_END_X, ITEM_PRICE_VAL_Y, true);
        this.item_price_coins_label = this.item_price_win.set_text_in_position("Coins", ITEM_PRICE_COINS_X, ITEM_PRICE_COINS_Y);

        this.item_desc_text = this.item_desc_win.set_text_in_position("", ITEM_DESC_TEXT_X, ITEM_DESC_TEXT_Y);
    }
    on_submenu_close(){
        this.open_horizontal_menu();
    }

    on_char_display_change(key_name:string){
        if(this.eq_compare.is_open) this.eq_compare.change_character(key_name);
        if(this.inv_win.is_open) this.inv_win.change_character(key_name);
    }

    on_inv_win_change(line:number, col:number){
        if(this.item_price_win.open && this.sell_menu.active){
            let is_repair = this.sell_menu.is_repair_menu;
            let itm = this.inv_win.item_grid[line][col];

            if(itm){
                let item_price = this.data.info.items_list[itm.key_name].price;
                let important_item = this.data.info.items_list[itm.key_name].important_item;
                let price_val = item_price;

                if(is_repair) price_val = item_price*REPAIR_MULTIPLIER | 0;
                else price_val = item_price * (itm.broken ? SELL_BROKEN_MULTIPLIER : SELL_MULTIPLIER) | 0;

                this.update_item_info(itm.key_name, price_val, is_repair ? !itm.broken : important_item, is_repair ? itm.broken : true, important_item);
            }
        }
    }

    on_buy_select_change(key_name:string){
        this.update_item_info(key_name);
    }

    set_item_lists(){
        let normal_list:ShopItem[] = [];
        let artifact_list:ShopItem[] = [];

        let item_list = this.shops_db[this.shop_key].item_list;
        for(let i=0; i<item_list.length; i++){
            let item = this.items_db[item_list[i].key_name];
            if(item_list[i].quantity === 0) continue;

            if(item.rare_item === true) artifact_list.push(item_list[i]);
            else normal_list.push(item_list[i]);
        }

        this.normal_item_list = _.mapKeys(normal_list, item => item.key_name) as {[key_name:string] : ShopItem};
        this.artifact_list = _.mapKeys(artifact_list, item => item.key_name) as {[key_name:string] : ShopItem};
    }

    update_your_coins(){
        this.your_coins_win.update_text(String(this.data.info.party_data.coins), this.your_coins_text);
    }

    update_item_info(key:string, custom_price?:number, custom_msg:boolean=false,
        broken:boolean=false, cant_sell:boolean=false){
        let this_item = this.data.info.items_list[key];

        this.item_desc_win.update_text(this_item.description, this.item_desc_text);
        this.item_price_win.update_text(this_item.name, this.item_name_text);

        let coins_label = (custom_msg) ? "" : "Coins";
        this.item_price_win.update_text(coins_label, this.item_price_coins_label);

        let price_label = "Price";
        if(custom_msg && !broken) price_label = "It's not broken.";
        else if(custom_msg && cant_sell) price_label = "We can't buy that.";
        this.item_price_win.update_text(price_label, this.item_price_label);

        let price_val = custom_price ? custom_price : this_item.price;
        let price_text = (custom_msg) ? "" : price_val;
        this.item_price_win.update_text(price_text, this.item_price_val_text);
    }

    alternate_window_pos(mode:string){
        if(this.windows_mode === mode) return;
        if(mode===BUY_MODE){
            this.item_price_win.update_position({x: ITEM_PRICE_WIN_X, y: ITEM_PRICE_WIN_Y});
            this.item_desc_win.update_position({x: ITEM_DESC_WIN_X, y: ITEM_DESC_WIN_Y});
            this.your_coins_win.update_position({x: YOUR_COINS_WIN_X, y: YOUR_COINS_WIN_Y});
            this.windows_mode = BUY_MODE;
        }
        else{
            this.item_price_win.update_position({x: ITEM_PRICE_WIN_X2, y: ITEM_PRICE_WIN_Y2});
            this.item_desc_win.update_position({x: ITEM_DESC_WIN_X2, y: ITEM_DESC_WIN_Y2});
            this.your_coins_win.update_position({x: YOUR_COINS_WIN_X2, y: YOUR_COINS_WIN_Y2});
            this.windows_mode = SELL_MODE;
        }
    }

    button_press() {
        this.horizontal_menu.close(() => {
            this.current_index = this.horizontal_menu.selected_button_index;
        
            switch (this.buttons_keys[this.horizontal_menu.selected_button_index]){
                case "buy":
                    this.alternate_window_pos(BUY_MODE);
                    this.buy_menu.open_menu(false, this.on_submenu_close.bind(this));
                    break;
                case "sell":
                    this.alternate_window_pos(SELL_MODE);
                    this.sell_menu.open_menu(false, this.on_submenu_close.bind(this));
                    break;
                case "artifacts":
                    this.alternate_window_pos(BUY_MODE);
                    this.buy_menu.open_menu(true, this.on_submenu_close.bind(this));
                    break;
                case "repair":
                    this.alternate_window_pos(SELL_MODE);
                    this.sell_menu.open_menu(true, this.on_submenu_close.bind(this));
                    break;
            }
            if(!this.npc_dialog.is_active){
                this.npc_dialog.close_dialog()
            }
        });
    }

    update_items(){
        let active_menu = (this.buy_menu.active ? this.buy_menu : (this.sell_menu.active ? this.sell_menu : null));

        this.set_item_lists();
        if(active_menu === this.buy_menu){
            this.buy_menu.item_list = this.buy_menu.is_artifacts_menu ? this.artifact_list : this.normal_item_list;
            this.buy_select.items = this.buy_menu.item_list;    
        }
    }

    update_position(){
        this.npc_dialog.update_position();
        this.horizontal_menu.update_position();
    }

    open_horizontal_menu(message_key="cancel_option"){
        if(!this.npc_dialog.is_active){
            this.npc_dialog.open(this.shop_key, this.data.info.shops_list[this.shop_key].avatar_key, this.data.info.shops_list[this.shop_key].dialog_key);
        }
        else{
            this.npc_dialog.update_dialog(message_key);
        }
        this.horizontal_menu.open(undefined, this.current_index);

    }

    open_menu(shop_key:string, close_callback?:Function) {
        this.shop_key = shop_key;
        this.close_callback = close_callback;

        if(this.data.hero.in_action()){
            this.data.hero.stop_char();
            this.data.hero.update_shadow();
        }

        this.set_item_lists();
        this.data.shop_open = true;
        this.open_horizontal_menu();
    }

    end_dialog() {
        this.shop_key = null;
        this.npc_dialog.close();
        this.data.shop_open = false;
        this.data.control_manager.reset();

        if(this.close_callback) this.close_callback();
        this.close_callback = null;
    }

    close_menu() {
        if (!this.horizontal_menu.menu_active) return;
        this.horizontal_menu.close();

        this.npc_dialog.update_dialog("goodbye"); 

        this.normal_item_list = {};
        this.artifact_list = {};
        this.current_index = 0;

        this.data.control_manager.simple_input(this.end_dialog.bind(this));
    }
}