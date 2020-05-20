import { Window } from '../Window.js';
import { CursorControl } from '../CursorControl.js';

const WIN_WIDTH = 132;
const WIN_HEIGHT = 76;
const WIN_X = 104;
const WIN_Y = 26;
const INFO_X = 16;
const QUESTION_Y = 22;
const ANSWER_X = 32;
const YES_Y = 46;
const NO_Y = 62;
const ICON_Y = 4;
const ICON_NAME_X = 32;
const ICON_NAME_Y = 7;
const POSSIBLE_ANSWERS_COUNT = 2;
const CURSOR_X = 16;
const CURSOR_Y_SHIFT = 5;

export class DropItemWindow {
    constructor(game, data, esc_propagation_priority, enter_propagation_priority) {
        this.game = game;
        this.data = data;
        this.base_window = new Window(this.game, WIN_X, WIN_Y, WIN_WIDTH, WIN_HEIGHT);
        this.item_obj = null;
        this.item = null;
        this.char = null;
        this.window_open = false;
        this.window_active = false;
        this.esc_propagation_priority = esc_propagation_priority + 1;
        this.enter_propagation_priority = enter_propagation_priority + 1;
        this.base_window.set_text(["Are you sure you", "want to drop it?"], INFO_X, QUESTION_Y, 1);
        this.base_window.set_text_in_position("Yes", ANSWER_X, YES_Y);
        this.base_window.set_text_in_position("No", ANSWER_X, NO_Y);
        this.icon_name = this.base_window.set_text_in_position("", ICON_NAME_X, ICON_NAME_Y);
        this.icon = null;
        this.group = this.game.add.group();
        this.answer_index = 0;
        this.dropped = false;
        this.cursor_control = new CursorControl(this.game, false, true, undefined, () => POSSIBLE_ANSWERS_COUNT,
            this.group, undefined, undefined, undefined, undefined, this.get_answer_index.bind(this),
            this.set_answer_index.bind(this), this.is_open.bind(this), this.is_active.bind(this),
            this.get_cursor_x.bind(this), this.get_cursor_y.bind(this));
        this.set_control();
    }

    set_control() {
        game.input.keyboard.addKey(Phaser.Keyboard.ESC).onDown.add(() => {
            if (!this.window_open) return;
            this.data.esc_input.getSignal().halt();
            this.close(this.close_callback.bind(this, this.dropped));
        }, this, this.esc_propagation_priority);
        game.input.keyboard.addKey(Phaser.Keyboard.ENTER).onDown.add(() => {
            if (!this.window_open) return;
            this.data.enter_input.getSignal().halt();
            this.on_choose();
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

    set_info() {
        this.base_window.update_text(this.item.name, this.icon_name);
        this.icon = this.base_window.create_at_group(INFO_X, ICON_Y, this.item.key_name + "_item_icon");
    }

    unset_info() {
        this.base_window.remove_from_group(this.icon);
    }

    on_choose() {
        if (this.answer_index === 0) {
            this.char.remove_item(this.item_obj, 1);
            this.dropped = true;
        }
        this.close(this.close_callback.bind(this, this.dropped));
    }

    open(item_obj, item, char, close_callback, open_callback) {
        this.item_obj = item_obj;
        this.item = item;
        this.char = char;
        this.answer_index = 0;
        this.cursor_control.activate();
        this.set_info();
        this.update_position();
        this.dropped = false;
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
        this.unset_info();
        this.base_window.close(() => {
            this.window_open = false;
            this.window_active = false;
            if (callback !== undefined) {
                callback();
            }
        }, false);
    }
}