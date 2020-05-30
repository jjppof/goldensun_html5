import { Window } from '../../Window.js';
import { CursorControl } from '../../utils/CursorControl.js';
import * as numbers from '../../../magic_numbers.js';

const WIN_WIDTH = 236;
const WIN_HEIGHT = 116;
const WIN_X = 0;
const WIN_Y = 40;

export class DjinnListWindow {
    constructor (game, data, esc_propagation_priority, enter_propagation_priority) {
        this.game = game;
        this.data = data;
        this.base_window = new Window(this.game, WIN_X, WIN_Y, WIN_WIDTH, WIN_HEIGHT);
        this.window_open = false;
        this.window_active = false;
        this.esc_propagation_priority = esc_propagation_priority + 1;
        this.enter_propagation_priority = enter_propagation_priority + 1;
        this.selected_char_index = 0;
        this.selected_djinn_index = 0;
        this.page_index = 0;
        this.close_callback = null;
        this.set_control();
    }

    set_control() {
        this.game.input.keyboard.addKey(Phaser.Keyboard.ESC).onDown.add(() => {
            if (!this.window_open || !this.window_active) return;
            this.data.esc_input.getSignal().halt();
            this.close(this.close_callback);
        }, this, this.esc_propagation_priority);
        this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER).onDown.add(() => {
            if (!this.window_open || !this.window_active) return;
            this.data.enter_input.getSignal().halt();
            this.on_choose();
        }, this, this.enter_propagation_priority);
    }

    on_choose() {

    }

    open(close_callback, open_callback) {
        this.selected_char_index = 0;
        this.selected_djinn_index = 0;
        this.page_index = 0;
        this.window_open = true;
        this.window_activated = true;
        this.close_callback = close_callback;
        this.base_window.show(undefined, false);
        if (open_callback) {
            open_callback();
        }
    }

    close(close_callback) {
        this.window_open = false;
        this.window_activated = false;
        this.base_window.close(undefined, false);
        if (close_callback) {
            close_callback();
        }
    }

    activate() {
        this.window_activated = true;
    }

    deactivate() {
        this.window_activated = false;
    }
}