import { ShopkeepDialog } from '../windows/shop/ShopkeepDialog.js';
import { BuyArtifactsMenu } from '../windows/shop/BuyArtifactsMenu.js';
import { SellRepairMenu } from '../windows/shop/SellRepairMenu.js';
import { capitalize } from '../utils.js';
import { InventoryWindow } from '../windows/shop/InventoryWindow.js';
import { BuySelectMenu } from '../windows/shop/BuySelectMenu.js';
import { EquipCompare } from '../windows/shop/EquipCompare.js';
import { YesNoMenu } from '../windows/YesNoMenu.js';
import { ShopItemQuantityWindow } from '../windows/shop/ShopItemQuantityWindow.js';
import { Window } from '../Window.js';
import { ShopCharDisplay } from '../windows/shop/ShopCharDisplay.js';
import { CursorManager } from '../utils/CursorManager.js';
import { ControlManager } from '../utils/ControlManager.js';
import { ButtonSelectMenu } from '../menus/ButtonSelectMenu.js';

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

export class ShopMenuScreen{
    constructor(game, data){
        this.game = game;
        this.data = data;
        this.shop_key = null;

        this.items_db = this.data.info.items_list;
        this.shops_db = _.mapKeys(this.data.dbs.shops_db, shop => shop.key_name);
        this.shopkeep_dialog_db = this.data.dbs.shopkeep_dialog_db;

        this.normal_item_list = [];
        this.artifact_list = [];

        this.buttons_keys = ["buy", "sell", "artifacts", "repair"];
        this.windows_mode = "buy";

        this.cursor_manager = new CursorManager(this.game);
        this.control_manager = new ControlManager(this.game);
        
        this.horizontal_menu = new ButtonSelectMenu(this.game, this.data,
            this.buttons_keys,
            this.buttons_keys.map(b => capitalize(b)),
            {on_press: this.button_press.bind(this), on_cancel: this.close_menu.bind(this)},
            this.control_manager);

        this.npc_dialog = new ShopkeepDialog(this.game, this.data, this);

        this.yesno_action = new YesNoMenu(this.game, this.data, this.control_manager);
        this.inv_win = new InventoryWindow(this.game, this.data, this);
        this.buy_select = new BuySelectMenu(this.game, this.data, this);
        this.eq_compare = new EquipCompare(this.game, this.data);
        this.quant_win = new ShopItemQuantityWindow(this.game, this.data, this.cursor_manager);
        this.char_display = new ShopCharDisplay(this.game, this.data, this);

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

    set_item_lists(){
        this.normal_item_list = [];
        this.artifact_list = [];

        let item_list = this.shops_db[this.shop_key].item_list;
        for(let i=0; i<item_list.length; i++){
            let item = this.items_db[item_list[i].key_name];
            if(item_list[i].quantity === 0) continue;

            if(item.rare_item === true) this.artifact_list.push(item);
            else this.normal_item_list.push(item);
        }

        this.normal_item_list = _.mapKeys(this.normal_item_list, item => item.key_name);
        this.artifact_list = _.mapKeys(this.artifact_list, item => item.key_name);
    }

    update_your_coins(){
        this.your_coins_win.update_text(String(this.data.info.party_data.coins), this.your_coins_text);
    }

    update_item_info(key, custom_price, custom_msg=false, broken=false, cant_sell=false){
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

    alternate_window_pos(mode="buy"){
        if(this.windows_mode === mode) return;
        if(mode==="buy"){
            this.item_price_win.update_position({x: ITEM_PRICE_WIN_X, y: ITEM_PRICE_WIN_Y});
            this.item_desc_win.update_position({x: ITEM_DESC_WIN_X, y: ITEM_DESC_WIN_Y});
            this.your_coins_win.update_position({x: YOUR_COINS_WIN_X, y: YOUR_COINS_WIN_Y});
            this.windows_mode = "buy";
        }
        else{
            this.item_price_win.update_position({x: ITEM_PRICE_WIN_X2, y: ITEM_PRICE_WIN_Y2});
            this.item_desc_win.update_position({x: ITEM_DESC_WIN_X2, y: ITEM_DESC_WIN_Y2});
            this.your_coins_win.update_position({x: YOUR_COINS_WIN_X2, y: YOUR_COINS_WIN_Y2});
            this.windows_mode = "sell";
        }
    }

    button_press() {
        this.horizontal_menu.deactivate(true);
        
        switch (this.buttons_keys[this.horizontal_menu.selected_button_index]){
            case "buy":
                this.alternate_window_pos("buy");
                this.buy_menu.open_menu(false);
                break;
            case "sell":
                this.alternate_window_pos("sell");
                this.sell_menu.open_menu(false);
                break;
            case "artifacts":
                this.alternate_window_pos("buy");
                this.buy_menu.open_menu(true);
                break;
            case "repair":
                this.alternate_window_pos("sell");
                this.sell_menu.open_menu(true);
                break;
        }
        if(!this.npc_dialog.is_active){
            this.npc_dialog.close_dialog()
        }
    }

    update_position() {
        this.npc_dialog.update_position();
        this.horizontal_menu.update_position();
    }

    is_active() {
        return this.horizontal_menu.menu_active;
    }

    open_horizontal_menu(message_key="cancel_option"){
        if(!this.npc_dialog.is_active){
            this.npc_dialog.open(this.shop_key);
        }
        else{
            this.npc_dialog.update_dialog(message_key);
        }
        this.horizontal_menu.open();

    }

    open_menu(shop_key) {
        this.shop_key = shop_key;

        if(this.data.hero.in_action()){
            this.data.hero.stop_char();
            this.data.hero.update_shadow();
        }

        this.set_item_lists();
        this.data.menu_open = true;
        this.open_horizontal_menu();
    }

    end_dialog() {
        this.shop_key = null;
        this.npc_dialog.close();
        this.data.menu_open = false;
        this.control_manager.reset();
    }

    close_menu() {
        if (!this.is_active()) return;
        this.horizontal_menu.close();

        this.npc_dialog.update_dialog("goodbye"); 

        this.normal_item_list = [];
        this.artifact_list = [];

        this.control_manager.reset();
        this.control_manager.actions["enter"].callback = this.end_dialog.bind(this);
        this.control_manager.set_actions();
    }
}