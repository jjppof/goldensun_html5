const MAX_INVENTORY_SIZE = 15;
const MAX_STACK_SIZE = 30;

const SELL_MULTIPLIER = 3/4;
const REPAIR_MULTIPLIER = 1/4;
const SELL_BROKEN_MULTIPLIER = SELL_MULTIPLIER - REPAIR_MULTIPLIER;

const YESNO_X = 56;
const YESNO_Y = 40;

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
        this.buy_select_index = 0;
        this.old_item = null;
        this.selected_character = null;
    }

    update_game_ticket_step(){
        let bought = this.data.info.party_data.game_tickets.tickets_bought
        if(bought >= 1 && bought < 6) return 300;
        if(bought >= 6 && bought < 11) return 500;
        if(bought >= 11 && bought < 16) return 1000;
        if(bought >= 16 && bought < 21) return 2000;
        if(bought >= 21 && bought < 26) return 4000;
        if(bought >= 26) return 8000;
    }

    check_game_ticket(){
        let game_ticket = false;
        this.data.info.party_data.game_tickets.coins_remaining -= this.selected_item.price;
        if(this.data.info.party_data.game_tickets.coins_remaining <= 0){
            game_ticket = true;
            this.data.info.party_data.game_tickets.tickets_bought += 1;
            this.data.info.party_data.game_tickets.coins_remaining += this.update_game_ticket_step();
        }

        if(game_ticket){
            this.npc_dialog.update_dialog("game_ticket", true);
            this.control_manager.set_control(false, false, false, false, {esc: this.open_inventory_view.bind(this, 0, true),
                enter: this.open_inventory_view.bind(this, 0, true)});
        }
        else this.open_buy_select();
    }

    sell_old_equip(old_item){
        let msg_key = old_item.rare_item ? "after_sell_artifact" : "after_sell_normal";
        this.npc_dialog.update_dialog(msg_key, true);

        if(old_item.rare_item){
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
            if(this.selected_character.items[i].key_name === old_item.key_name){
                this.selected_character.items.splice(i, 1);
            }
        }

        let sell_price = this.old_item.broken ? this.old_item.price*SELL_BROKEN_MULTIPLIER : this.old_item.price*SELL_MULTIPLIER;

        this.data.info.party_data.coins += sell_price | 0;
        this.parent.update_your_coins();

        this.control_manager.set_control(false, false, false, false, {esc: this.check_game_ticket.bind(this),
            enter: this.check_game_ticket.bind(this)});
    }

    equip_new_item(){
        let item_type = this.data.info.items_list[this.selected_item.key_name].type;
        let eq_slots = this.selected_character.equip_slots;

        this.npc_dialog.update_dialog("equip_compliment", true);

        switch(item_type){
            case "weapons":
                if(eq_slots.weapon) this.old_item = this.data.info.items_list[eq_slots.weapon.key_name];
                break;        
            case "armor":
                if(eq_slots.body) this.old_item = this.data.info.items_list[eq_slots.body.key_name];
                break;
            case "chest_protector":
                if(eq_slots.chest) this.old_item = this.data.info.items_list[eq_slots.chest.key_name];
                break;
            case "head_protector":
                if(eq_slots.head) this.old_item = this.data.info.items_list[eq_slots.head.key_name];
                break;
            case "ring":
                if(eq_slots.ring) this.old_item = this.data.info.items_list[eq_slots.ring.key_name];
                break;
            case "boots":
                if(eq_slots.boots) this.old_item = this.data.info.items_list[eq_slots.boots.key_name];
                break;
            case "underwear":
                if(eq_slots.underwear) this.old_item = this.data.info.items_list[eq_slots.underwear.key_name];
                break;
        }
        
        for(let i=0; i<this.selected_character.items.length; i++){
            let itm = this.selected_character.items[i];
            if(itm.key_name === this.old_item.key_name){
                this.selected_character.unequip_item(i);
                break;
            }
        }

        for(let i=this.selected_character.items.length-1; i>0; i--){
            let itm = this.selected_character.items[i];
            if(itm.key_name === this.selected_item.key_name){
                this.selected_character.equip_item(i);
                break;
            }
        }

        let after_compliment = () =>{
            let sell_price = this.old_item.broken ? this.old_item.price*SELL_BROKEN_MULTIPLIER : this.old_item.price*SELL_MULTIPLIER;

            let text = this.npc_dialog.get_message("sell_current");
            text = this.npc_dialog.replace_text("price", text, sell_price | 0);
            text = this.npc_dialog.replace_text("item", text, this.old_item.name);
            this.npc_dialog.update_dialog(text, false, false);

            this.yesno_action.open_menu({yes: this.sell_old_equip.bind(this, this.old_item), no: () => {
                let msg_key = this.old_item.rare_item ? "decline_sell_artifact" : "decline_sell_normal";
                this.npc_dialog.update_dialog(msg_key, true);
                this.control_manager.set_control(false, false, false, false, {esc: this.check_game_ticket.bind(this),
                    enter: this.check_game_ticket.bind(this)});
            }},{x: YESNO_X, y: YESNO_Y});
        } 

        this.control_manager.set_control(false, false, false, false, {esc: after_compliment.bind(this),
            enter: after_compliment.bind(this)});
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
                else this.selected_character.items.push({key_name: item_to_add.key_name, quantity: quantity, index: new_index});
            }

            if(!game_ticket){
                let shop_list = this.data.info.shops_list[this.parent.shop_key].item_list;

                for(let i=0; i<shop_list.length; i++){
                    if(shop_list[i].key_name === this.selected_item.key_name && shop_list[i].quantity !== -1){
                        this.data.info.shops_list[this.parent.shop_key].item_list[i].quantity -= quantity;
                    }
                }
                this.parent.set_item_lists();
                this.item_list = this.is_artifacts_menu ? this.parent.artifact_list : this.parent.normal_item_list;
                this.buy_select.items = this.item_list;

                if(equip_ask){
                    let equip_now = () => {
                        let text = this.npc_dialog.get_message("equip_now");
                        text = this.npc_dialog.replace_text("hero", text, this.selected_character.name);
                        this.npc_dialog.update_dialog(text, false, false);

                        this.yesno_action.open_menu({yes: this.equip_new_item.bind(this), no: () => {
                            this.control_manager.set_control(false, false, false, false, {esc: this.check_game_ticket.bind(this),
                                enter: this.check_game_ticket.bind(this)});
                        }},{x: YESNO_X, y: YESNO_Y})
                    }
                    this.control_manager.set_control(false, false, false, false, {esc: equip_now.bind(this),
                        enter: equip_now.bind(this)});  
                }
                else{
                    this.control_manager.set_control(false, false, false, false, {esc: this.check_game_ticket.bind(this),
                        enter: this.check_game_ticket.bind(this)});
                }
            }
            else{
                this.control_manager.set_control(false, false, false, false, {esc: this.open_buy_select.bind(this),
                    enter: this.open_buy_select.bind(this)});
            }
        }    
    }

    on_buy_equip_select(){
        this.selected_character = this.char_display.lines[this.char_display.current_line][this.char_display.selected_index];

        if(this.selected_character.items.length === MAX_INVENTORY_SIZE){
            let text = this.npc_dialog.get_message("inventory_full");
            text = this.npc_dialog.replace_text("hero", text, this.selected_character.name);
            this.npc_dialog.update_dialog(text, false, false);
        }
        else{
            if(!this.selected_item.equipable_chars.includes(this.selected_character.key_name)){
                let text = this.npc_dialog.get_message("cant_equip");
                text = this.npc_dialog.replace_text("hero", text, this.selected_character.name);
                this.npc_dialog.update_dialog(text, false, false);

                this.yesno_action.open_menu({yes: this.on_purchase_success.bind(this), no: this.open_equip_compare.bind(this)},
                {x: YESNO_X, y: YESNO_Y});
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
                let shop_item_match = shop_items.filter(i => { return (i.key_name === this.selected_item.key_name); })[0];
                let shop_item = {key_name: shop_item_match.key_name, quantity: shop_item_match.quantity === -1 ? 30 : shop_item_match.quantity};

                let char_item_match = this.selected_character.items.filter(i => { return (i.key_name === this.selected_item.key_name); });
                let char_item = char_item_match.length !== 0 ? char_item_match[0] : null;

                if(!this.quant_win.is_open) this.quant_win.open(shop_item, char_item);
                this.control_manager.set_control(true, false, true, false, {right: this.quant_win.increase_amount.bind(this.quant_win),
                    left: this.quant_win.decrease_amount.bind(this.quant_win),
                    esc: this.open_inventory_view.bind(this, char_index),
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
        this.buy_select_index = this.buy_select.selected_index;
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
        if(!game_ticket)this.buy_select_index = this.buy_select.selected_index;
        
        if(this.item_desc_win.open) this.item_desc_win.close();
        if(this.buy_select.is_open) this.buy_select.close();
        if(this.quant_win.is_open) this.quant_win.close();

        if(game_ticket) this.npc_dialog.update_dialog("game_ticket_select");
        else this.npc_dialog.update_dialog("character_select");

        let this_item = game_ticket ? "game_ticket" : this.selected_item.key_name;

        if(!this.char_display.is_open) this.char_display.open(index);
        else this.char_display.select_char(index);

        if(this.inv_win.is_open && this.inv_win.selected_item !== this_item) this.inv_win.close();
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

        if(!this.buy_select.is_open) this.buy_select.open(this.item_list, this.buy_select_index);
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
        this.old_item = null;

        this.control_manager.reset();
        this.parent.horizontal_menu.activate();
        this.parent.open_horizontal_menu();
    }

}