import { CharsMenu } from '../../menus/CharsMenu.js';
import { Window } from '../../Window.js';
import { InventoryWindow } from './InventoryWindow.js';

export class BuyArtifactsMenu{
    constructor(game, data, esc_propagation_priority, enter_propagation_priority, parent){
        this.game = game;
        this.data = data;
        this.esc_propagation_priority = esc_propagation_priority + 1;
        this.enter_propagation_priority = enter_propagation_priority + 1;
        this.parent = parent;
        this.control_manager = this.parent.control_manager;
        
        this.item_desc_win = this.parent.item_desc_win;
        this.your_coins_win = this.parent.your_coins_win;
        this.item_price_win = this.parent.item_price_win;
        this.char_display = this.parent.char_display;
        this.inv_win = this.parent.inv_win;
        this.quant_win =  this.parent.quant_win;
        this.buy_select = this.parent.buy_select;

        this.current_state = 0;
        this.previous_state = 0;
        this.is_artifacts_menu = null;
        this.item_list = [];
        this.selected_item = null;

    }

    set_control(horizontal, vertical, horizontal_loop=true, vertical_loop=false, callbacks){
        if(horizontal){
            if(!horizontal_loop){
                this.control_manager.directions["left"].loop = false;
                this.control_manager.directions["right"].loop = false;
            } 
            this.control_manager.directions["left"].callback = callbacks.left;
            this.control_manager.directions["right"].callback = callbacks.right;
        }
        if(vertical){
            if(!vertical_loop){
                this.control_manager.directions["up"].loop = false;
                this.control_manager.directions["down"].loop = false;
            }
            this.control_manager.directions["up"].callback = callbacks.up;
            this.control_manager.directions["down"].callback = callbacks.down; 
        }
        this.control_manager.set_directions();
    }

    open_menu(is_artifacts_menu){
        this.is_artifacts_menu = is_artifacts_menu;
        this.item_list = this.is_artifacts_menu ? this.parent.artifact_lsit : this.parent.normal_item_list;

        if(!this.buy_select.is_open) this.buy_select.open(this.item_list);

        this.selected_item = Array.from(Object.keys(this.buy_select.items))[this.buy_select.selected_index];

        this.parent.update_item_info(this.selected_item);
        this.parent.update_your_coins();

        if(!this.item_desc_win.open) this.item_desc_win.show();
        if(!this.item_price_win.open) this.item_price_win.show();
        if(!this.your_coins_win.open) this.your_coins_win.show();

        this.set_control(true, false, true, false, {right: this.buy_select.change_item.bind(this.buy_select), left: this.buy_select.change_item.bind(this.buy_select)});
    }

}