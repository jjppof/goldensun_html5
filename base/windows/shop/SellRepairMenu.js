import { ItemQuantityManagerWindow } from '../item/ItemQuantityManagerWindow.js';

const REPAIR_MULTIPLIER = 1/4;
const SELL_MULTIPLIER = 3/4;
const SELL_BROKEN_MULTIPLIER = SELL_MULTIPLIER - REPAIR_MULTIPLIER;

export class SellRepairMenu{
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
        this.item_quantity_window = new ItemQuantityManagerWindow();
    }
}
//party_data.members[this.selected_character].name