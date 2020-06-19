import { Window } from '../../Window.js';
import { djinn_status } from '../../Djinn.js';

const BASE_WIN_WIDTH = 132;
const BASE_WIN_HEIGHT = 36;
const BASE_WIN_X = 104;
const BASE_WIN_Y = 0;
const CHOOSE_A_DJ_X = 8;
const CHOOSE_A_DJ_Y = 8;
const SHIFT_KEY_X = 8;
const SHIFT_KEY_Y = 24;
const DJINN_ACTION_X = SHIFT_KEY_X + 23;
const DJINN_ACTION_Y = 24;

export class DjinnActionWindow {
    constructor(game) {
        this.game = game;
        this.window_open = false;
        this.base_window = new Window(this.game, BASE_WIN_X, BASE_WIN_Y, BASE_WIN_WIDTH, BASE_WIN_HEIGHT);
        this.choose_a_djinn_text = this.base_window.set_text_in_position("Choose a djinn.", CHOOSE_A_DJ_X, CHOOSE_A_DJ_Y);
        this.shift_key = {
            shadow: this.base_window.create_at_group(SHIFT_KEY_X + 1, SHIFT_KEY_Y + 1, "shift_keyboard", 0x0),
            text: this.base_window.create_at_group(SHIFT_KEY_X, SHIFT_KEY_Y, "shift_keyboard")
        };
        this.action_text = this.base_window.set_text_in_position("", DJINN_ACTION_X, DJINN_ACTION_Y);
    }

    set_action_text(status) {
        switch(status) {
            case djinn_status.SET: this.base_window.update_text(": Standby", this.action_text); break;
            case djinn_status.STANDBY: this.base_window.update_text(": Set", this.action_text); break;
        }
    }

    open(callback) {
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