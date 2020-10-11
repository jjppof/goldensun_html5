import { GoldenSun } from "../../GoldenSun";
import { ItemSlot, MainChar } from "../../MainChar";
import { ShopMenu } from "../../main_menus/ShopMenu";
import { ControlManager } from "../../utils/ControlManager";
import { Window } from "../../Window";
import { YesNoMenu } from "../YesNoMenu";
import { InventoryWindow } from "./InventoryWindow";
import { ShopCharDisplay } from "./ShopCharDisplay";
import { ShopItemQuantityWindow } from "./ShopItemQuantityWindow";
import { ShopkeepDialog } from "./ShopkeepDialog";

const SELL_MULTIPLIER = 3/4;
const REPAIR_MULTIPLIER = 1/4;
const SELL_BROKEN_MULTIPLIER = SELL_MULTIPLIER - REPAIR_MULTIPLIER;

const REPAIR_WAIT_TIME = Phaser.Timer.SECOND*6;

const YESNO_X = 56;
const YESNO_Y = 40;

export class SellRepairMenu{
    public game:Phaser.Game;
    public data:GoldenSun;
    public parent:ShopMenu;
    public control_manager:ControlManager;

    public item_desc_win:Window;
    public your_coins_win:Window;
    public item_price_win:Window;
    public char_display:ShopCharDisplay;
    public inv_win:InventoryWindow;
    public quant_win:ShopItemQuantityWindow;
    public yesno_action:YesNoMenu;
    public npc_dialog:ShopkeepDialog;

    public is_repair_menu:boolean;
    public selected_item:ItemSlot;
    public inv_win_pos:{line:number, col:number};
    public selected_character:MainChar;
    public selected_char_index:number;
    public active:boolean;

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
        this.yesno_action = this.parent.yesno_action;
        this.npc_dialog = this.parent.npc_dialog;

        this.is_repair_menu = null;
        this.selected_item = null;
        this.inv_win_pos = {line: 0, col: 0};
        this.selected_character = null;
        this.selected_char_index = 0;
        this.active = false;
    }

    on_item_repair(){
        if(this.npc_dialog.dialog_manager.window.open){
            this.npc_dialog.dialog_manager.window.close();
            let crystal = this.npc_dialog.dialog_manager.dialog_crystal;
            if(crystal.visible = true) crystal.visible = false;
        }

        this.inv_win.kill_item_at(this.inv_win_pos.line,this.inv_win_pos.col);
        this.control_manager.reset();

        this.game.time.events.add(REPAIR_WAIT_TIME, ()=>{
            this.selected_item.broken = false;
            this.data.info.party_data.coins -= (this.data.info.items_list[this.selected_item.key_name].price*REPAIR_MULTIPLIER | 0);

            this.npc_dialog.update_dialog("repair_done", true);
            this.parent.update_your_coins();

            this.control_manager.set_control(false, false, false, false, {esc: this.on_character_select.bind(this, "repair_follow_up", this.inv_win_pos),
                enter: this.on_character_select.bind(this, "repair_follow_up", this.inv_win_pos)});
        }, this);
    }

    on_repair_item_select(){
        this.inv_win_pos = this.inv_win.cursor_pos;

        if(this.item_desc_win.open) this.item_desc_win.close();
        
        this.selected_item = this.inv_win.item_grid[this.inv_win_pos.line][this.inv_win_pos.col];

        if(!this.selected_item.broken){
            let item_breakable = this.data.info.items_list[this.selected_item.key_name].use_type === "breaks_when_use";
            let msg_key = item_breakable ? "cant_repair" : "repair_decline";

            let text = this.npc_dialog.get_message(msg_key);
            text = this.npc_dialog.replace_text(text, undefined, this.data.info.items_list[this.selected_item.key_name].name);
            this.npc_dialog.update_dialog(text, true, false);

            this.control_manager.set_control(false, false, false, false, {esc: this.on_character_select.bind(this, "repair_follow_up", this.inv_win_pos),
                enter: this.on_character_select.bind(this, "repair_follow_up", this.inv_win_pos)});
        }
        
        else{
            let price = (this.data.info.items_list[this.selected_item.key_name].price * REPAIR_MULTIPLIER) | 0;
            let text = this.npc_dialog.get_message("repair_deal");
            text = this.npc_dialog.replace_text(text, undefined, this.data.info.items_list[this.selected_item.key_name].name, String(price));
            this.npc_dialog.update_dialog(text, false, false);

            this.yesno_action.open_menu({yes: () => {
                this.npc_dialog.update_dialog("repair_deal_accept", true);
                this.control_manager.set_control(false, false, false, false, {esc: this.on_item_repair.bind(this),
                    enter: this.on_item_repair.bind(this)})
                }, no: () => {
                this.npc_dialog.update_dialog("repair_deal_decline", true);
                this.control_manager.set_control(false, false, false, false, {esc: this.on_character_select.bind(this, "repair_follow_up", this.inv_win_pos),
                    enter: this.on_character_select.bind(this, "repair_follow_up", this.inv_win_pos)})
                }},
                {x: YESNO_X, y: YESNO_Y});
        }
    }

    on_sale_success(quantity = 1){
        let msg_key = this.data.info.items_list[this.selected_item.key_name].rare_item ? "after_sell_artifact" : "after_sell_normal";
        this.npc_dialog.update_dialog(msg_key, true);

        let item_price = (this.data.info.items_list[this.selected_item.key_name].price * (this.selected_item.broken ? SELL_BROKEN_MULTIPLIER : SELL_MULTIPLIER)) | 0;
        this.data.info.party_data.coins += item_price*quantity;
        this.parent.update_your_coins();

        for(let i=0; i<this.selected_character.items.length; i++){
            let itm = this.selected_character.items[i];
            if(itm.key_name === this.selected_item.key_name){
                this.selected_character.items[i].quantity -= quantity;
                if(this.selected_character.items[i].quantity === 0){
                    this.selected_character.items.splice(i, 1);
                }
            }
        }

        if(this.data.info.items_list[this.selected_item.key_name].rare_item){ 
            let exists = false;
            let shop_list = this.data.info.shops_list[this.parent.shop_key].item_list;
            for(let i=0; i<shop_list.length; i++){
                if(shop_list[i].key_name === this.selected_item.key_name){
                    exists = true;
                    this.data.info.shops_list[this.parent.shop_key].item_list[i].quantity += quantity;
                }
            }
            if(!exists) shop_list.push({key_name: this.selected_item.key_name, quantity: quantity});
        }

        if(this.inv_win.is_open) this.inv_win.close();
        if(!this.inv_win.is_open) this.inv_win.open(this.selected_character.key_name, undefined, false);

        this.control_manager.set_control(false, false, false, false, {esc: this.on_character_select.bind(this, "sell_follow_up", this.inv_win_pos),
            enter: this.on_character_select.bind(this, "sell_follow_up", this.inv_win_pos)});
    }

    on_sell_item_select(){
        this.inv_win_pos = this.inv_win.cursor_pos;

        if(this.item_desc_win.open) this.item_desc_win.close();
        
        this.selected_item = this.inv_win.item_grid[this.inv_win_pos.line][this.inv_win_pos.col];

        if(this.data.info.items_list[this.selected_item.key_name].important_item){
            this.npc_dialog.update_dialog("cant_sell", true);

            this.control_manager.set_control(false, false, false, false, {esc: this.on_character_select.bind(this, "sell_follow_up", this.inv_win_pos),
            enter: this.on_character_select.bind(this, "sell_follow_up", this.inv_win_pos)})
        }

        else if(this.selected_item.quantity === 1){
            let msg_key = this.data.info.items_list[this.selected_item.key_name].rare_item ? "sell_artifact" : "sell_normal";

            let text = this.npc_dialog.get_message(msg_key);
            let item_name = msg_key === "sell_normal" ? this.data.info.items_list[this.selected_item.key_name].name : undefined;
            let item_price = (this.data.info.items_list[this.selected_item.key_name].price * (this.selected_item.broken ? SELL_BROKEN_MULTIPLIER : SELL_MULTIPLIER)) | 0; 
            text = this.npc_dialog.replace_text(text, undefined, item_name, String(item_price));
            this.npc_dialog.update_dialog(text, false, false);

            this.yesno_action.open_menu({yes: this.on_sale_success.bind(this), no: () => {
                let decline_msg = this.data.info.items_list[this.selected_item.key_name].rare_item ? "decline_sell_artifact" : "decline_sell_normal";
                this.npc_dialog.update_dialog(decline_msg, true);
                this.control_manager.set_control(false, false, false, false, {esc: this.on_character_select.bind(this, "sale_follow_up", this.inv_win_pos),
                    enter: this.on_character_select.bind(this, "sell_follow_up", this.inv_win_pos)})
                }},
                {x: YESNO_X, y: YESNO_Y});
        }
        
        else{
            this.npc_dialog.update_dialog("sell_quantity_select");

            let char_item_match = this.selected_character.items.filter(i => { return (i.key_name === this.selected_item.key_name); });
            let char_item = char_item_match.length !== 0 ? char_item_match[0] : null;

            if(!this.quant_win.is_open) this.quant_win.open(char_item);
            this.control_manager.set_control(true, false, true, false, {right: this.quant_win.increase_amount.bind(this.quant_win),
                left: this.quant_win.decrease_amount.bind(this.quant_win),
                esc: this.on_character_select.bind(this, "sell_follow_up", this.selected_char_index, this.inv_win_pos),
                enter: () => {
                    let quant = 1;
                    quant = this.quant_win.chosen_quantity;
                    this.quant_win.close();
                    this.parent.cursor_manager.hide();

                    let text = this.npc_dialog.get_message("sell_quantity_confirm");
                    let item_price = (this.data.info.items_list[this.selected_item.key_name].price * (this.selected_item.broken ? SELL_BROKEN_MULTIPLIER : SELL_MULTIPLIER)) | 0; 
                    text = this.npc_dialog.replace_text(text, undefined, undefined, String(item_price*quant));
                    this.npc_dialog.update_dialog(text, false, false);

                    this.yesno_action.open_menu({yes: this.on_sale_success.bind(this, quant),
                        no: () => {
                        let decline_msg = this.data.info.items_list[this.selected_item.key_name].rare_item ? "decline_sell_artifact" : "decline_sell_normal";
                        this.npc_dialog.update_dialog(decline_msg, true);
                        this.control_manager.set_control(false, false, false, false, {esc: this.on_character_select.bind(this, "sell_follow_up", this.inv_win_pos),
                            enter: this.on_character_select.bind(this, "sell_follow_up", this.inv_win_pos)});}
                        },
                        {x: YESNO_X, y: YESNO_Y})
                }}
            );
        }
    }

    on_character_select(msg_key="sell_follow_up", item_pos = {line: 0, col: 0}){
        if(this.quant_win.is_open) this.quant_win.close();
        if(!this.item_desc_win.open) this.item_desc_win.show();
        if(!this.item_price_win.open) this.item_price_win.show();

        if(msg_key) this.npc_dialog.update_dialog(msg_key);

        this.selected_character = this.char_display.lines[this.char_display.current_line][this.char_display.selected_index];
        this.selected_char_index = this.char_display.selected_index;
        
        if(this.inv_win.is_open) this.inv_win.close();
        if(!this.inv_win.is_open) this.inv_win.open(this.selected_character.key_name, undefined, false);
        this.inv_win.set_cursor(item_pos.line,item_pos.col);
        if(!this.inv_win.item_grid[item_pos.line][item_pos.col]) this.inv_win.previous_col();

        this.control_manager.set_control(true, true, true, true, {right: this.inv_win.next_col.bind(this.inv_win),
            left: this.inv_win.previous_col.bind(this.inv_win),
            up: this.inv_win.previous_line.bind(this.inv_win),
            down: this.inv_win.next_line.bind(this.inv_win),
            esc: this.open_inventory_view.bind(this),
            enter: (this.is_repair_menu ? this.on_repair_item_select.bind(this) : this.on_sell_item_select.bind(this))});
    }

    open_inventory_view(msg_key="sell_follow_up"){
        if(this.item_desc_win.open) this.item_desc_win.close();
        if(this.item_price_win.open) this.item_price_win.close();
        if(this.quant_win.is_open) this.quant_win.close();

        this.npc_dialog.update_dialog(msg_key);

        if(!this.your_coins_win.open) this.your_coins_win.show();
        this.parent.update_your_coins();

        if(!this.char_display.is_open) this.char_display.open(this.selected_char_index);
        else this.char_display.select_char(this.selected_char_index);
        this.game.world.bringToTop(this.char_display.char_group);

        let char_key = (this.selected_character) ? this.selected_character.key_name : this.data.info.party_data.members[0].key_name;
        if(this.inv_win.is_open) this.inv_win.close();
        if(!this.inv_win.is_open) this.inv_win.open(char_key, undefined, false); 

        this.control_manager.set_control(true, true, true, false, {right: this.char_display.next_char.bind(this.char_display),
            left: this.char_display.previous_char.bind(this.char_display),
            up: this.char_display.previous_line.bind(this.char_display),
            down: this.char_display.next_line.bind(this.char_display),
            esc: this.close_menu.bind(this),
            enter: this.on_character_select.bind(this)});
    }

    open_menu(is_repair_menu){
        this.is_repair_menu = is_repair_menu;
        this.active = true;

        if(is_repair_menu){
            this.npc_dialog.update_dialog("repair_menu", true);

            this.control_manager.set_control(false, false, false, false, {esc: this.open_inventory_view.bind(this, "repair_select"),
            enter: this.open_inventory_view.bind(this, "repair_select")});
        }
        else this.open_inventory_view("sell_select");
    }

    close_menu(){
        if(this.item_desc_win.open) this.item_desc_win.close();
        if(this.item_price_win.open) this.item_price_win.close();
        if(this.your_coins_win.open) this.your_coins_win.close();
        if(this.char_display.is_open) this.char_display.close();
        if(this.inv_win.is_open) this.inv_win.close();
        if(this.yesno_action.is_open) this.yesno_action.close_menu();
        if(this.quant_win.is_open) this.quant_win.close();

        this.parent.cursor_manager.hide();

        this.is_repair_menu = null;
        this.selected_item = null;
        this.inv_win_pos = {line: 0, col: 0};
        this.selected_character = null;
        this.active = false;

        this.control_manager.reset();
        this.parent.horizontal_menu.activate();
        this.parent.open_horizontal_menu();
    }

}