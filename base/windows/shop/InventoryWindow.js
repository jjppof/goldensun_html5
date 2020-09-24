import { Window } from '../../Window.js';

export class InventoryWindow{
    constructor(game, data, esc_propagation_priority, enter_propagation_priority){
        this.game = game;
        this.data = data;
        this.esc_propagation_priority = esc_propagation_priority + 1;
        this.enter_propagation_priority = enter_propagation_priority + 1;
    }
}