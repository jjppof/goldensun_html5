import { TextObj, Window } from '../../Window';
import * as numbers from '../../magic_numbers';
import { ItemCounter } from '../../utils/ItemsCounter';
import { GoldenSun } from '../../GoldenSun';
import { ItemSlot, MainChar } from '../../MainChar';
import { Item } from '../../Item';

const WIN_WIDTH = 132;
const WIN_HEIGHT = 52;
const WIN_X = 104;
const WIN_Y = 0;
const QUESTION_TEXT_X = 40;
const QUESTION_TEXT_Y = 8;
const ITEM_NAME_X = 27;
const ITEM_NAME_Y = 16;
const CHAR_NAME_X = 27;
const DEST_CHAR_NAME_X = 84;
const CHAR_NAME_Y = ITEM_NAME_Y + numbers.FONT_SIZE;
const ITEM_ICON_X = 8;
const ITEM_ICON_Y = 8;
const SUB_ICON_X = 7;
const SUB_ICON_Y = 8;
const ITEM_COUNTER_X = 56;
const ITEM_COUNTER_Y = 40;
const REMAIN_TEXT_CHAR_COUNT_X = 37;
const REMAIN_TEXT_CHAR_COUNT_Y = CHAR_NAME_Y + numbers.FONT_SIZE;
const REMAIN_TEXT_DEST_CHAR_COUNT_X = 94;
const REMOVE_TEXT_COUNT_X = 53;
const REMOVE_TEXT_COUNT_Y = ITEM_COUNTER_Y;

export class ItemQuantityManagerWindow {
    public game: Phaser.Game;
    public data: GoldenSun;
    public item_obj: ItemSlot;
    public item: Item;
    public char: MainChar;
    public window_open: boolean;
    public window_active: boolean;
    public x: number;
    public y: number;
    public base_window: Window;
    public group: Phaser.Group;
    public esc_propagation_priority: number;
    public enter_propagation_priority: number;
    public choosen_quantity: number;
    public item_counter: ItemCounter;
    public remaining_with_char_count: TextObj;
    public new_amount_with_dest_char_count: TextObj;
    public to_remove_count: TextObj;
    public destination_char: MainChar;
    public icon_sprite: Phaser.Sprite;
    public char_name: TextObj;
    public item_name: TextObj;
    public equip_sprite: Phaser.Sprite;
    public item_count_sprite: Phaser.BitmapText;
    public close_callback: Function;
    public dest_item_obj: ItemSlot;
    public dest_char_name: TextObj;

    constructor(game, data, esc_propagation_priority, enter_propagation_priority) {
        this.game = game;
        this.data = data;
        this.item_obj = null;
        this.item = null;
        this.char = null;
        this.window_open = false;
        this.window_active = false;
        this.x = WIN_X;
        this.y = WIN_Y;
        this.base_window = new Window(this.game, this.x, this.y, WIN_WIDTH, WIN_HEIGHT);
        this.group = this.game.add.group();
        this.group.alpha = 0;
        this.base_window.set_text_in_position("How many?", QUESTION_TEXT_X, QUESTION_TEXT_Y);
        this.esc_propagation_priority = esc_propagation_priority + 1;
        this.enter_propagation_priority = enter_propagation_priority + 1;
        this.choosen_quantity = 1;
        this.item_counter = new ItemCounter(this.game, this.group, ITEM_COUNTER_X, ITEM_COUNTER_Y, this.on_change.bind(this));
        this.remaining_with_char_count = this.base_window.set_text_in_position("", REMAIN_TEXT_CHAR_COUNT_X, REMAIN_TEXT_CHAR_COUNT_Y, true);
        this.new_amount_with_dest_char_count = this.base_window.set_text_in_position("", REMAIN_TEXT_DEST_CHAR_COUNT_X, REMAIN_TEXT_CHAR_COUNT_Y, true);
        this.to_remove_count = this.base_window.set_text_in_position("", REMOVE_TEXT_COUNT_X, REMOVE_TEXT_COUNT_Y, true);
        this.set_control();
    }

    set_control() {
        this.data.esc_input.add(() => {
            if (!this.window_open || !this.window_active) return;
            this.data.esc_input.halt();
            this.choosen_quantity = 0;
            this.close(this.close_callback);
        }, this, this.esc_propagation_priority);
        this.data.enter_input.add(() => {
            if (!this.window_open || !this.window_active) return;
            this.data.enter_input.halt();
            this.close(this.close_callback);
        }, this, this.enter_propagation_priority);
    }

    on_change(quantity) {
        this.choosen_quantity = quantity;
        this.base_window.update_text(this.choosen_quantity.toString(), this.to_remove_count);
        this.base_window.update_text((this.item_obj.quantity - this.choosen_quantity).toString(), this.remaining_with_char_count);
        if (this.destination_char) {
            this.base_window.update_text((this.dest_item_obj.quantity + this.choosen_quantity).toString(), this.new_amount_with_dest_char_count);
        }
    }

    set_header() {
        this.icon_sprite = this.base_window.create_at_group(ITEM_ICON_X, ITEM_ICON_Y, "items_icons", undefined, this.item.key_name);
        this.char_name = this.base_window.set_text_in_position(this.char.name, CHAR_NAME_X, CHAR_NAME_Y);
        if (this.destination_char) {
            this.dest_char_name = this.base_window.set_text_in_position(this.destination_char.name, DEST_CHAR_NAME_X, CHAR_NAME_Y);
        }
        this.item_name = this.base_window.set_text_in_position(this.item.name, ITEM_NAME_X, ITEM_NAME_Y);
        this.equip_sprite = null;
        if (this.item_obj.equipped) {
            this.equip_sprite = this.base_window.create_at_group(ITEM_ICON_X + SUB_ICON_X, ITEM_ICON_Y + SUB_ICON_Y, "equipped");
        }
        this.item_count_sprite = null;
        if (this.item_obj.quantity > 1) {
            this.item_count_sprite = this.game.add.bitmapText(ITEM_ICON_X + SUB_ICON_X, ITEM_ICON_Y + SUB_ICON_Y, 'gs-item-bmp-font', this.item_obj.quantity.toString());
            this.base_window.add_sprite_to_group(this.item_count_sprite);
        }
    }

    unset_header() {
        this.base_window.remove_from_group(this.icon_sprite);
        this.base_window.remove_text(this.char_name);
        if (this.destination_char) {
            this.base_window.remove_text(this.dest_char_name);
            this.base_window.update_text("", this.new_amount_with_dest_char_count);
        }
        this.base_window.remove_text(this.item_name);
        if (this.equip_sprite) {
            this.base_window.remove_from_group(this.equip_sprite);
        }
        if (this.item_count_sprite) {
            this.base_window.remove_from_group(this.item_count_sprite);
        }
    }

    update_position() {
        this.group.x = this.game.camera.x + this.x;
        this.group.y = this.game.camera.y + this.y;
    }

    open(item_obj, item, char, close_callback, destination_char?, open_callback?) {
        this.item_obj = item_obj;
        this.item = item;
        this.char = char;
        this.destination_char = destination_char;
        if (this.destination_char) {
            const dest_item_obj = this.destination_char.items.filter(item => {
                return item.key_name === item_obj.key_name;
            });
            this.dest_item_obj = dest_item_obj.length ? dest_item_obj[0] : {
                key_name: null,
                index: null,
                quantity: 0
            };
        }
        this.choosen_quantity = 1;
        this.close_callback = close_callback;
        this.update_position();
        this.set_header();
        this.item_counter.config(this.item_obj.quantity, this.choosen_quantity);
        this.group.alpha = 1;
        this.on_change(this.choosen_quantity);
        this.base_window.show(() => {
            this.window_open = true;
            this.window_active = true;
            if (open_callback !== undefined) {
                open_callback();
            }
        }, false);
    }

    close(callback) {
        this.unset_header();
        this.item_counter.deactivate();
        this.group.alpha = 0;
        this.base_window.close(() => {
            this.window_open = false;
            this.window_active = false;
            if (callback !== undefined) {
                callback(this.choosen_quantity);
            }
        }, false);
    }

    activate() {
        this.set_header();
        this.item_counter.activate();
        this.on_change(this.choosen_quantity);
        this.window_active = true;
    }

    deactivate() {
        this.unset_header();
        this.item_counter.deactivate();
        this.window_active = false;
    }
}