import { ItemCounter } from '../../utils/ItemsCounter.js';
import { Window } from '../../Window.js';

const QUANTITY_WIN_X = 56;
const QUANTITY_WIN_Y = 32;
const QUANTITY_WIN_WIDTH = 180;
const QUANTITY_WIN_HEIGHT = 20;

const ITEM_COUNTER_X = 8;
const ITEM_COUNTER_Y = 8;

const QUANTITY_TEXT_END_X = 93;
const QUANTITY_TEXT_Y = 8;

const COINS_VALUE_END_X = 141;
const COINS_VALUE_Y = 8;

const COINS_LABEL_X = 144;
const COINS_LABEL_Y = 8;

//MISSING CURSOR

export class ShopItemQuantityWindow {
    constructor(game, data) {
        this.game = game;
        this.data = data;

        this.window = new Window(this.game, QUANTITY_WIN_X, QUANTITY_WIN_Y, QUANTITY_WIN_WIDTH, QUANTITY_WIN_HEIGHT);
        this.item_counter = new ItemCounter(this.game, this.window.group, ITEM_COUNTER_X, ITEM_COUNTER_Y, this.on_change.bind(this));

    }

    on_change(){

    }
}