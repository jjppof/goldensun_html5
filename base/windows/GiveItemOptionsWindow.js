import { Window } from '../Window.js';
import * as numbers from '../../magic_numbers.js';
import { CursorControl } from '../utils/CursorControl.js';

const WIN_WIDTH = 132;
const WIN_HEIGHT = 36;
const WIN_X = 104;
const WIN_Y = 0;
const CHAR_NAME_X = 27;
const CHAR_NAME_Y = 8;
const ITEM_NAME_X = 27;
const ITEM_NAME_Y = CHAR_NAME_Y + numbers.FONT_SIZE;
const ACTION_TEXT_X = 8;
const ACTION_TEXT_Y = ITEM_NAME_Y + numbers.FONT_SIZE;
const ITEM_ICON_X = 8;
const ITEM_ICON_Y = 8;
const SUB_ICON_X = 7;
const SUB_ICON_Y = 8;
const POSSIBLE_ANSWERS_COUNT = 2;
const ANSWER_X = 112;
const YES_Y = 8;
const NO_Y = 24;
const CURSOR_X = 96;
const CURSOR_Y_SHIFT = 5;
const YES = 0;
const NO = 1;

export class GiveItemOptionsWindow {
    constructor(game, data, esc_propagation_priority, enter_propagation_priority) {
        this.game = game;
        this.data = data;
        this.esc_propagation_priority = esc_propagation_priority;
        this.enter_propagation_priority = enter_propagation_priority;
        this.base_window = new Window(this.game, WIN_X, WIN_Y, WIN_WIDTH, WIN_HEIGHT);
        this.item_obj = null;
        this.item = null;
        this.char = null;
        this.window_open = false;
        this.window_active = false;
        this.choosing_char = false;
        this.asking_for_equip = false;
        this.group = this.game.add.group();
        this.answer_index = 0;
        this.yes_text = this.base_window.set_text_in_position("Yes", ANSWER_X, YES_Y);
        this.no_text = this.base_window.set_text_in_position("No", ANSWER_X, NO_Y);
        this.yes_text.text.alpha = this.no_text.text.alpha = 0;
        this.yes_text.shadow.alpha = this.no_text.shadow.alpha = 0;
        this.cursor_control = new CursorControl(this.game, false, true, undefined, () => POSSIBLE_ANSWERS_COUNT,
            this.group, undefined, undefined, undefined, undefined, this.get_answer_index.bind(this),
            this.set_answer_index.bind(this), this.is_open.bind(this), this.is_active.bind(this),
            this.get_cursor_x.bind(this), this.get_cursor_y.bind(this));
        this.set_control();
    }

    set_control() {
        this.data.esc_input.add(() => {
            if (!this.window_open || !this.window_active) return;
            this.data.esc_input.halt();
            this.close(this.close_callback.bind(this, false, false));
        }, this, this.esc_propagation_priority);
        game.input.keyboard.addKey(Phaser.Keyboard.ENTER).onDown.add(() => {
            if (!this.window_open || !this.window_active) return;
            this.data.enter_input.getSignal().halt();
            this.close(this.close_callback.bind(this, true, this.answer_index === YES));
        }, this, this.enter_propagation_priority);
    }

    get_cursor_x() {
        return CURSOR_X;
    }

    get_cursor_y() {
        return (this.answer_index ? NO_Y : YES_Y) + CURSOR_Y_SHIFT;
    }

    is_active() {
        return this.window_active;
    }

    is_open() {
        return this.window_open;
    }

    get_answer_index() {
        return this.answer_index;
    }

    set_answer_index(index) {
        this.answer_index = index;
    }

    update_position() {
        this.group.x = this.game.camera.x + WIN_X;
        this.group.y = this.game.camera.y + WIN_Y;
    }

    set_header() {
        this.icon_sprite = this.base_window.create_at_group(ITEM_ICON_X, ITEM_ICON_Y, "items_icons", undefined, this.item.key_name);
        this.char_name = this.base_window.set_text_in_position(this.char.name, CHAR_NAME_X, CHAR_NAME_Y);
        this.item_name = this.base_window.set_text_in_position(this.item.name, ITEM_NAME_X, ITEM_NAME_Y);
        if (this.choosing_char) {
            this.action_text = this.base_window.set_text_in_position("Give it to whom?", ITEM_NAME_X, ACTION_TEXT_Y);
        } else if (this.asking_for_equip) {
            this.yes_text.text.alpha = this.no_text.text.alpha = 1;
            this.yes_text.shadow.alpha = this.no_text.shadow.alpha = 1;
            this.action_text = this.base_window.set_text_in_position("Equip this item?", ACTION_TEXT_X, ACTION_TEXT_Y);
        }
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
        this.base_window.remove_text(this.item_name);
        this.base_window.remove_text(this.action_text);
        this.yes_text.text.alpha = this.no_text.text.alpha = 0;
        this.yes_text.shadow.alpha = this.no_text.shadow.alpha = 0;
        if (this.equip_sprite) {
            this.base_window.remove_from_group(this.equip_sprite);
        }
        if (this.item_count_sprite) {
            this.base_window.remove_from_group(this.item_count_sprite);
        }
    }

    open(item_obj, item, char, choosing_char, asking_for_equip, close_callback, open_callback) {
        this.item_obj = item_obj;
        this.item = item;
        this.char = char;
        this.choosing_char = choosing_char;
        this.asking_for_equip = asking_for_equip;
        this.answer_index = 0;
        if (this.asking_for_equip) {
            this.cursor_control.activate();
        }
        this.set_header();
        this.update_position();
        this.close_callback = close_callback;
        this.base_window.show(() => {
            this.window_open = true;
            this.window_active = true;
            if (open_callback !== undefined) {
                open_callback();
            }
        }, false);
    }

    close(callback) {
        this.cursor_control.deactivate();
        this.unset_header();
        this.base_window.close(() => {
            this.window_open = false;
            this.window_active = false;
            if (callback !== undefined) {
                callback();
            }
        }, false);
    }

    active() {
        this.window_active = true;
        this.cursor_control.activate();
    }

    deactive() {
        this.window_active = false;
        this.cursor_control.deactivate();
    }
}