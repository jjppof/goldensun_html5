import { party_data } from '../../../initializers/main_chars.js';
import { CharsMenu } from '../../menus/CharsMenu.js';
import { Window } from '../../Window.js';
import { InventoryWindow } from './InventoryWindow.js';

//party_data.members[this.selected_character].name
const MAX_ITEMS_PER_PAGE = 7

export class BuyArtifactsMenu{
    constructor(game, data, esc_propagation_priority, enter_propagation_priority){
        this.game = game;
        this.data = data;
        this.esc_propagation_priority = esc_propagation_priority + 1;
        this.enter_propagation_priority = enter_propagation_priority + 1;
        
        this.description_window = new Window();
        this.coin_window = new Window();
        this.item_info_window = new Window();
        this.chars_window = new CharsMenu();
        this.inventory_window = new InventoryWindow();

    }
}