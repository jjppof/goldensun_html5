import { CharsMenu } from '../../menus/CharsMenu.js';
import { Window } from '../../Window.js';
import { InventoryWindow } from './InventoryWindow.js';

const MAX_INVENTORY_SIZE = 15;
const MAX_STACK_SIZE = 30;

const SELL_MULTIPLIER = 3/4;

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
        this.npc_dialog = this.parent.npc_dialog;

        this.is_artifacts_menu = null;
        this.item_list = [];
        this.selected_item = null;
        this.selected_character = null;
    }

    check_game_ticket(){
        let chance = _.random(0, 1);
        if(chance === 1){
            this.npc_dialog.update_dialog("game_ticket", true);
            this.control_manager.set_control(false, false, false, false, {esc: this.open_inventory_view.bind(this, 0, true),
                enter: this.open_inventory_view.bind(this, 0, true)});
        }
        else this.open_buy_select();
    }

    sell_old_equip(old_item){
        this.npc_dialog.update_dialog("after_sell", true);

        if(this.selected_item.rare_item){
            let shop_list = this.data.info.shops_list[this.parent.shop_key].item_list;
            let exists = false;
            for(let i=0; i<shop_list.length; i++){
                if(shop_list[i].key_name = old_item.key_name){
                    exists = true;
                    this.data.info.shops_list[this.parent.shop_key].item_list[i].quantity += 1;
                }
            }
            if(!exists){
                this.data.info.shops_list[this.parent.shop_key].item_list.push({key_name: old_item.key_name, quantity: 1});
            }
        }

        for(let i=0; i<this.selected_character.items.length; i++){
            if(this.selected_character.items[i].key_name = old_item.key_name){
                this.selected_character.items.splice(i, 1);
            }
        }

        return;
    }

    equip_new_item(){
        let item_type = this.data.info.items_list[this.selected_item.key_name].type;
        let old_item = null;

        switch(item_type){
            case "weapons":
                if(this.selected_character.equip_slots.weapon) old_item = this.selected_character.equip_slots.weapon.key_name;        
            case "armor":
                if(this.selected_character.equip_slots.body) old_item = this.selected_character.equip_slots.body.key_name;
            case "chest_protector":
                if(this.selected_character.equip_slots.chest) old_item = this.selected_character.equip_slots.chest.key_name;
            case "head_protector":
                if(this.selected_character.equip_slots.head) old_item = this.selected_character.equip_slots.head.key_name;
            case "ring":
                if(this.selected_character.equip_slots.ring) old_item = this.selected_character.equip_slots.ring.key_name;
            case "boots":
                if(this.selected_character.equip_slots.boots) old_item = this.selected_character.equip_slots.boots.key_name;
            case "underwear":
                if(this.selected_character.equip_slots.underwear) old_item = this.selected_character.equip_slots.underwear.key_name;
        }

        for(let i=0; i<this.selected_character.items.length; i++){
            let itm = this.selected_character.items[i];
            if(itm.key_name === old_item){
                this.selected_character.unequip_item(i);
            }
            if(itm.key_name === this.selected_item.key_name){
                this.selected_character.equip_item(i);
            }
        }

        let text = this.npc_dialog.get_message("sell_current");
        text = this.npc_dialog.replace_text("price", text, (this.selected_item.price*SELL_MULTIPLIER) | 0);
        text = this.npc_dialog.replace_text("item", text, item_name);
        this.npc_dialog.update_dialog(text, false, false);

        this.yesno_action.open({yes: this.sell_old_equip.bind(this, old_item), no: () => {this.npc_dialog.update_dialog("decline_sell", true);;}});

        this.control_manager.set_control(false, false, false, false, {esc: this.check_game_ticket.bind(this),
            enter: this.check_game_ticket.bind(this)});
    }

    on_purchase_success(equip_ask=false, game_ticket=false){
        let quantity = 1;
        let item_to_add = game_ticket ? {key_name: "game_ticket"} : this.selected_item;

        if(this.quant_win.is_open && !game_ticket) quantity = this.quant_win.chosen_quantity;

        if(this.data.info.party_data.coins - this.selected_item.price*quantity < 0 && !game_ticket){
            this.npc_dialog.update_dialog("not_enough_coins", true);
            this.parent.cursor_manager.hide();

            if(this.quant_win.is_open) this.quant_win.close();
            this.control_manager.set_control(false, false, false, false, {esc: this.open_buy_select.bind(this),
            enter: this.open_buy_select.bind(this)});
        }
        else{
            this.npc_dialog.update_dialog("after_buy", true);
            this.parent.cursor_manager.hide();
        
            if(this.quant_win.is_open) this.quant_win.close();
            if(!game_ticket) this.data.info.party_data.coins -=  this.selected_item.price*quantity;

            let exists = false;
            for(let i=0; i<this.selected_character.items.length; i++){
                let itm = this.selected_character.items[i];
                if(itm.key_name === item_to_add.key_name && this.data.info.items_list[item_to_add.key_name].carry_up_to_30){
                    exists = true;
                    this.selected_character.items[i].quantity += quantity;
                }
            }

            let new_index = this.selected_character.items.length;
            if(!exists){
                if(item_to_add.equipable) this.selected_character.items.push({key_name: item_to_add.key_name, quantity: 1, equipped: false, index: new_index});
                else this.selected_character.items.push({key_name: item_to_add.key_name, quantity: 1, index: new_index});
            }

            if(!game_ticket){
                let shop_list = this.data.info.shops_list[this.parent.shop_key].item_list;
                for(let i=0; i<shop_list.length; i++){
                    if(shop_list[i].key_name === this.selected_item.key_name && shop_list[i].quantity !== -1){
                        this.data.info.shops_list[this.parent.shop_key].item_list[i].quantity -= quantity;
                    }
                }
                if(equip_ask){
                    let text = this.npc_dialog.get_message("equip_now");
                    text = this.npc_dialog.replace_text("hero", text, this.selected_character.name);
                    this.npc_dialog.update_dialog(text, false, false);
    
                    this.yesno_action.open_menu({yes: this.equip_new_item(), no: () => {return;}});     
                }
                this.control_manager.set_control(false, false, false, false, {esc: this.check_game_ticket.bind(this),
                    enter: this.check_game_ticket.bind(this)});
            }
            else{
                this.control_manager.set_control(false, false, false, false, {esc: this.open_buy_select.bind(this),
                    enter: this.open_buy_select.bind(this)});
            }
        }    
    }

    on_buy_equip_select(){
        console.log("Buy equip");
        this.selected_character = this.char_display.lines[this.char_display.current_line][this.char_display.selected_index];

        if(this.selected_character.items.length === MAX_INVENTORY_SIZE){
            let text = this.npc_dialog.get_message("inventory_full");
            text = this.npc_dialog.replace_text("hero", text, this.selected_character.name);
            this.npc_dialog.update_dialog(text, false, false);
        }
        else{
            if(!this.selected_item.equipable_chars.includes[this.selected_character.key_name]){
                let text = this.npc_dialog.get_message("cant_equip");
                text = this.npc_dialog.replace_text("hero", text, this.selected_character.name);
                this.npc_dialog.update_dialog(text, false, false);

                this.yesno_action.open_menu({yes: this.on_purchase_success.bind(this), no: this.open_equip_compare.bind(this)});
            }
            else{
                this.on_purchase_success(true);
            }
        }
    }

    on_buy_item_select(game_ticket=false){
        this.selected_character = this.char_display.lines[this.char_display.current_line][this.char_display.selected_index];
        let char_index = this.char_display.selected_index;
        let have_quant = 0;

        for(let i=0; i<this.selected_character.items.length; i++){
            let itm = this.selected_character.items[i];
            if(itm.key_name === this.selected_item.key_name){
                have_quant = itm.quantity;
            }
        }

        if(this.selected_character.items.length === MAX_INVENTORY_SIZE){
            let text = this.npc_dialog.get_message("inventory_full");
            text = this.npc_dialog.replace_text("hero", text, this.selected_character.name);
            this.npc_dialog.update_dialog(text, false, false);
        }
        
        else if(have_quant === MAX_STACK_SIZE){
            let item_name = this.data.info.items_list[this.selected_item.key_name].name;

            let text = this.npc_dialog.get_message("stack_full");
            text = this.npc_dialog.replace_text("hero", text, this.selected_character.name);
            text = this.npc_dialog.replace_text("item", text, item_name);
            this.npc_dialog.update_dialog(text, false, false);
        }
        else{
            if(game_ticket) this.on_purchase_success(false, game_ticket);
            else{
                this.npc_dialog.update_dialog("buy_quantity");
                let shop_items = this.data.info.shops_list[this.parent.shop_key].item_list;
                let this_item = shop_items.filter(i => { return (i.key_name === this.selected_item.key_name); })[0];
                this_item.quantity = this_item.quantity === -1 ? 30 : this_item.quantity;
        
                if(!this.quant_win.is_open) this.quant_win.open(this_item);
                this.control_manager.set_control(false, false, false, false, {esc: this.open_inventory_view.bind(this, char_index),
                    enter: this.on_purchase_success.bind(this)});
            }
        }
    }

    on_cancel_char_select(){
        if(this.inv_win.is_open) this.inv_win.close();
        if(this.eq_compare.is_open) this.eq_compare.close();
        if(this.char_display.is_open)this.char_display.close();
        this.open_buy_select();
    }

    on_cancel_game_ticket(){
        this.npc_dialog.update_dialog("game_ticket_decline", true);
        this.control_manager.set_control(false, false, false, false, {esc: this.on_cancel_char_select.bind(this),
            enter: this.on_cancel_char_select.bind(this)});
    }

    open_equip_compare(index=0){
        if(this.item_desc_win.open) this.item_desc_win.close();
        if(this.buy_select.is_open) this.buy_select.close();
        this.npc_dialog.update_dialog("character_select");

        if(!this.char_display.is_open) this.char_display.open(index);
        if(!this.eq_compare.is_open) this.eq_compare.open(index, this.selected_item.key_name);

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

        if(game_ticket) this.npc_dialog.update_dialog("game_ticket_select");
        else this.npc_dialog.update_dialog("character_select");

        let this_item = game_ticket ? "game_ticket" : this.selected_item.key_name;

        if(!this.char_display.is_open) this.char_display.open(index);
        else this.char_display.select_char(index);

        if(!this.inv_win.is_open) this.inv_win.open(index, this_item, true);

        this.control_manager.set_control(true, true, true, false, {right: this.char_display.next_char.bind(this.char_display),
            left: this.char_display.previous_char.bind(this.char_display),
            up: this.char_display.previous_line.bind(this.char_display),
            down: this.char_display.next_line.bind(this.char_display),
            esc: (game_ticket ? this.on_cancel_game_ticket.bind(this): this.on_cancel_char_select.bind(this)),
            enter: this.on_buy_item_select.bind(this, game_ticket)});
    }
    
    on_buy_select(){
        this.selected_item = this.buy_select.pages[this.buy_select.current_page][this.buy_select.selected_index];

        if(this.selected_item.equipable) this.open_equip_compare();
        else this.open_inventory_view();
    }

    open_buy_select(msg_key="sale_follow_up"){
        this.npc_dialog.update_dialog(msg_key);
        if(this.char_display.is_open) this.char_display.close();
        if(this.inv_win.is_open) this.inv_win.close();
        if(this.eq_compare.is_open) this.eq_compare.close();

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

        if(is_artifacts_menu){
            this.npc_dialog.update_dialog("artifacts_menu", true);

            this.control_manager.set_control(false, false, false, false, {esc: this.open_buy_select.bind(this, "buy_select"),
            enter: this.open_buy_select.bind(this, "buy_select")});
        }
        else this.open_buy_select("buy_select");
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

        this.is_artifacts_menu = null;
        this.item_list = [];
        this.selected_item = null;

        this.control_manager.reset();
        this.parent.horizontal_menu.activate();
        this.parent.open_horizontal_menu();
    }

}