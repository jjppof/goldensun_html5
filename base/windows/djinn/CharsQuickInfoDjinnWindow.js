import { Window } from '../../Window.js';
import * as numbers from '../../magic_numbers.js';

const BASE_WIN_WIDTH = 100;
const BASE_WIN_HEIGHT = 36;
const BASE_WIN_X = 0;
const BASE_WIN_Y = 0;
const NAME_X = 8;
const NAME_Y = 8
const CLASS_Y = NAME_Y + numbers.FONT_SIZE;
const LV_X = 56;
const LV_Y = 8;
const LV_NUMBER_RIGHT_X = 94;

export class CharsQuickInfoDjinnWindow {
    constructor(game) {
        this.game = game;
        this.char = null;
        this.window_open = false;
        this.x = BASE_WIN_X;
        this.y = BASE_WIN_Y;
        this.char = null;
        this.base_window = new Window(this.game, this.x, this.y, BASE_WIN_WIDTH, BASE_WIN_HEIGHT);
        this.char_name = this.base_window.set_text_in_position("", NAME_X, NAME_Y);
        this.char_class = this.base_window.set_text_in_position("", NAME_X, CLASS_Y);
        this.base_window.set_text_in_position("Lv", LV_X, LV_Y);
        this.level_number = this.base_window.set_text_in_position("", LV_NUMBER_RIGHT_X, LV_Y, true);
    }

    update_text() {
        this.base_window.update_text(this.char.name, this.char_name);
        this.base_window.update_text(this.char.class.name, this.char_class);
        this.base_window.update_text(this.char.level.toString(), this.level_number);
    }

    set_char(char) {
        this.char = char;
        this.update_text();
    }

    open(char, callback) {
        this.char = char;
        this.update_text();
        this.base_window.show(() => {
            this.window_open = true;
            if (callback !== undefined) {
                callback();
            }
        }, false);
    }

    close(callback) {
        this.base_window.close(() => {
            this.window_open = false;
            if (callback !== undefined) {
                callback();
            }
        }, false);
    }
}