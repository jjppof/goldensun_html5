import {ItemCounter} from "../../utils/ItemCounter";
import {Window, TextObj} from "../../Window";
import {GoldenSun} from "../../GoldenSun";
import {Button} from "../../XGamepad";
import {ItemSlot, MainChar} from "../../MainChar";
import {CursorManager} from "../../utils/CursorManager";
import {ShopItem} from "../../main_menus/ShopMenu";

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

const CURSOR_X = 132;
const CURSOR_Y = 46;

const ITEM_COUNTER_LOOP_TIME = 100;

export class ShopItemQuantityWindow {
    public game: Phaser.Game;
    public data: GoldenSun;

    public window: Window;
    public item_counter: ItemCounter;
    public chosen_quantity: number;
    public base_price: number;
    public is_open: boolean;

    public quantity_text: TextObj;
    public coins_val_text: TextObj;
    public coins_label_text: TextObj;

    constructor(game: Phaser.Game, data: GoldenSun) {
        this.game = game;
        this.data = data;

        this.window = new Window(this.game, QUANTITY_WIN_X, QUANTITY_WIN_Y, QUANTITY_WIN_WIDTH, QUANTITY_WIN_HEIGHT);
        this.item_counter = new ItemCounter(
            this.game,
            this.window.group,
            ITEM_COUNTER_X,
            ITEM_COUNTER_Y,
            this.on_change.bind(this)
        );

        this.chosen_quantity = 1;
        this.base_price = 0;
        this.is_open = false;

        this.quantity_text = this.window.set_text_in_position(
            String(this.chosen_quantity),
            QUANTITY_TEXT_END_X,
            QUANTITY_TEXT_Y,
            {right_align: true}
        );
        this.coins_val_text = this.window.set_text_in_position("", COINS_VALUE_END_X, COINS_VALUE_Y, {
            right_align: true,
        });
        this.coins_label_text = this.window.set_text_in_position("Coins", COINS_LABEL_X, COINS_LABEL_Y);
    }

    on_change(quantity: number) {
        this.chosen_quantity = quantity;
        this.window.update_text(String(this.chosen_quantity), this.quantity_text);
        this.window.update_text(String(this.base_price * this.chosen_quantity), this.coins_val_text);
    }

    grant_control(on_cancel: Function, on_select: Function) {
        //A Key sound is missing, using Menu/Positive4 instead
        const controls = [
            {buttons: Button.LEFT, on_down: this.decrease_amount.bind(this), sfx: {down: "menu/move"}},
            {buttons: Button.RIGHT, on_down: this.increase_amount.bind(this), sfx: {down: "menu/move"}},
            {buttons: Button.A, on_down: on_select, sfx: {down: "menu/positive_4"}},
            {buttons: Button.B, on_down: on_cancel, sfx: {down: "menu/negative"}},
        ];
        this.data.control_manager.add_controls(controls, {
            loop_config: {horizontal: true, horizontal_time: ITEM_COUNTER_LOOP_TIME},
        });
    }

    increase_amount() {
        this.item_counter.advance_step(1);
    }

    decrease_amount() {
        this.item_counter.advance_step(-1);
    }

    open(shop_item_obj: ShopItem, char_item_obj?: ItemSlot, use_coins: boolean = false, open_callback?: () => void) {
        this.data.cursor_manager.move_to(
            {x: CURSOR_X, y: CURSOR_Y},
            {tween_config: {type: CursorManager.CursorTweens.WIGGLE}},
            () => {
                this.base_price = this.data.info.items_list[shop_item_obj.key_name].price;
                this.window.update_text(String(this.base_price), this.coins_val_text);

                const count_limit = MainChar.MAX_GENERAL_ITEM_NUMBER;
                const owned = !char_item_obj ? 0 : char_item_obj.quantity;
                let available_quantity = shop_item_obj.quantity === -1 ? count_limit : shop_item_obj.quantity;
                if (available_quantity + owned > count_limit) available_quantity = count_limit - owned;
                if (use_coins && this.base_price * available_quantity > this.data.info.party_data.coins) {
                    available_quantity = (this.data.info.party_data.coins / this.base_price) | 0;
                }

                this.item_counter.config(available_quantity, this.chosen_quantity, owned);

                this.is_open = true;
                this.window.show(open_callback, false);
            }
        );
    }

    close(callback?: () => void) {
        this.item_counter.deactivate();
        this.item_counter.clear();
        this.data.cursor_manager.clear_tweens();

        this.chosen_quantity = 1;
        this.base_price = 0;

        this.is_open = false;
        this.window.close(callback, false);
    }
}
