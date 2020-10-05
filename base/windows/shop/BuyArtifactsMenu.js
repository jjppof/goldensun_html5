import { CharsMenu } from '../../menus/CharsMenu.js';
import { Window } from '../../Window.js';
import { InventoryWindow } from './InventoryWindow.js';

export class BuyArtifactsMenu{
    constructor(game, data, parent){
        this.game = game;
        this.data = data;
        this.parent = parent;
        this.control_manager = this.parent.control_manager;
        
        this.item_desc_win = this.parent.item_desc_win;
        this.your_coins_win = this.parent.your_coins_win;
        this.item_price_win = this.parent.item_price_win;
        this.char_display = this.parent.char_display;
        this.inv_win = this.parent.inv_win;
        this.quant_win =  this.parent.quant_win;
        this.buy_select = this.parent.buy_select;
        this.eq_compare = this.parent.eq_compare;
        this.yesno_action = this.parent.yesno_action;

        this.current_state = 0;
        this.previous_state = 0;
        this.is_artifacts_menu = null;
        this.item_list = [];
        this.selected_item = null;
        this.selected_character = null;
    }

    on_purchase_success(){
        let quantity = this.quant_win.chosen_quantity
        if(this.data.info.party_data.coins - this.selected_item.price*quantity < 0){
            //display insuficient coins message
            return;
        }
        
        this.data.info.party_data.coins -=  this.selected_item.price*quantity;

        let exists = false;
        for(let i=0; i<this.selected_character.items.length; i++){
            let itm = this.selected_character.items[i];
            if(itm.key_name === this.selected_item.key_name && this.data.info.items_list[itm.key_name].carry_up_to_30){
                exists = true;
                this.selected_character.items[i].quantity += quantity;
            }
        }

        let new_index = this.selected_character.items.length;
        if(!exists){
            if(this.selected_item.equipable) this.selected_character.items.push({key_name: this.selected_item.key_name, quantity: 1, equipped: false, index: new_index});
            else this.selected_character.items.push({key_name: this.selected_item.key_name, quantity: 1, index: new_index});
        }

        let shop_list = this.data.info.shops_list[this.parent.shop_key].item_list;
        for(let i=0; i<shop_list.length; i++){
            if(shop_list[i].key_name === this.selected_item.key_name && shop_list[i].quantity !== -1){
                this.data.info.shops_list[this.parent.shop_key].item_list[i].quantity -= quantity;
            }
        }

        if(this.quant_win.is_open) this.quant_win.close();
        if(this.char_display.is_open) this.char_display.close();
        if(this.inv_win.is_open) this.inv_win.close();

        this.open_buy_select();
    }

    on_buy_equip_select(){
        console.log("Buy equip");
        this.selected_character = this.char_display.lines[this.char_display.current_line][this.char_display.selected_index];
        //if inventory full, display message

        //if can't equip, open yes/no action

        //if can equip, add to inventory, remove gold, ask if equip now

        //check for game ticket chance
    }

    on_buy_item_select(){
        console.log(this.parent);
        this.selected_character = this.char_display.lines[this.char_display.current_line][this.char_display.selected_index];
        let char_index = this.char_display.selected_index;

        let shop_items = this.data.info.shops_list[this.parent.shop_key].item_list;
        let this_item = shop_items.filter(i => { return (i.key_name === this.selected_item.key_name); })[0];
        this_item.quantity = this_item.quantity === -1 ? 30 : this_item.quantity;

        if(!this.quant_win.is_open) this.quant_win.open(this_item);
        this.control_manager.set_control(false, false, false, false, {esc: this.open_inventory_view.bind(this, char_index),
            enter: this.on_purchase_success.bind(this)});
    }

    on_cancel_char_select(){
        if(this.inv_win.is_open) this.inv_win.close();
        if(this.eq_compare.is_open) this.eq_compare.close();
        this.char_display.close();
        this.open_buy_select();
    }

    open_equip_compare(){
        if(this.item_desc_win.open) this.item_desc_win.close();
        if(this.buy_select.is_open) this.buy_select.close();

        let default_char_index = 0;

        if(!this.char_display.is_open) this.char_display.open(default_char_index);
        if(!this.eq_compare.is_open) this.eq_compare.open(default_char_index, this.selected_item.key_name);

        this.control_manager.set_control(true, true, true, false, {right: this.char_display.next_char.bind(this.char_display),
            left: this.char_display.previous_char.bind(this.char_display),
            up: this.char_display.previous_line.bind(this.char_display),
            down: this.char_display.next_line.bind(this.char_display),
            esc: this.on_cancel_char_select.bind(this),
            enter: this.on_buy_equip_select.bind(this)});
    }

    open_inventory_view(index=0, game_ticket=false){
        if(this.item_desc_win.open) this.item_desc_win.close();
        if(this.buy_select.is_open) this.buy_select.close();

        let this_item = game_ticket ? "game_ticket" : this.selected_item.key_name;

        if(!this.char_display.is_open) this.char_display.open(index);
        if(!this.inv_win.is_open) this.inv_win.open(index, this_item, true);

        this.control_manager.set_control(true, true, true, false, {right: this.char_display.next_char.bind(this.char_display),
            left: this.char_display.previous_char.bind(this.char_display),
            up: this.char_display.previous_line.bind(this.char_display),
            down: this.char_display.next_line.bind(this.char_display),
            esc: this.on_cancel_char_select.bind(this),
            enter: this.on_buy_item_select.bind(this)});
    }
    
    on_buy_select(){
        this.selected_item = this.buy_select.pages[this.buy_select.current_page][this.buy_select.selected_index];

        if(this.selected_item.equipable) this.open_equip_compare();
        else this.open_inventory_view();
    }

    open_buy_select(){
        if(!this.buy_select.is_open) this.buy_select.open(this.item_list);
        this.control_manager.reset();

        this.selected_item = this.buy_select.pages[this.buy_select.current_page][this.buy_select.selected_index].key_name;

        this.parent.update_item_info(this.selected_item);
        this.parent.update_your_coins();

        if(!this.item_desc_win.open) this.item_desc_win.show();
        if(!this.item_price_win.open) this.item_price_win.show();
        if(!this.your_coins_win.open) this.your_coins_win.show();

        this.control_manager.set_control(true, true, true, false, {right: this.buy_select.next_item.bind(this.buy_select),
            left: this.buy_select.previous_item.bind(this.buy_select),
            up: this.buy_select.previous_page.bind(this.buy_select),
            down: this.buy_select.next_page.bind(this.buy_select),
            esc: this.close_menu.bind(this),
            enter: this.on_buy_select.bind(this)});
    }

    open_menu(is_artifacts_menu){
        this.is_artifacts_menu = is_artifacts_menu;
        this.item_list = this.is_artifacts_menu ? this.parent.artifact_list : this.parent.normal_item_list;

        this.open_buy_select();
    }

    close_menu(){
        if(this.item_desc_win.open) this.item_desc_win.close();
        if(this.item_price_win.open) this.item_price_win.close();
        if(this.your_coins_win.open) this.your_coins_win.close();
        if(this.char_display.is_open) this.char_display.close();
        if(this.inv_win.is_open) this.inv_win.close();
        if(this.yesno_action.is_open) this.yesno_action.close();
        if(this.quant_win.is_open) this.quant_win.close();
        if(this.buy_select.is_open) this.buy_select.close();
        if(this.eq_compare.is_open) this.eq_compare.close();

        this.parent.cursor_manager.hide();

        this.current_state = 0;
        this.previous_state = 0;
        this.is_artifacts_menu = null;
        this.item_list = [];
        this.selected_item = null;

        this.control_manager.reset();
        this.parent.horizontal_menu.activate();
        this.parent.open_horizontal_menu();
    }

}