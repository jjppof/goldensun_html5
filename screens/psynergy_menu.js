import { CharsMenu } from '../base/menus/CharsMenu.js';
import { BasicInfoWindow } from '../base/windows/BasicInfoWindow.js';
import { party } from '../chars/main_chars.js';

export class PsynergyMenuScreen {
    constructor(game, data, esc_propagation_priority) {
        this.game = game;
        this.data = data;
        this.chars_menu = new CharsMenu(this.game, undefined, this.char_change.bind(this));
        this.basic_info_window = new BasicInfoWindow(this.game);
        this.selected_char_index = 0;
        this.is_open = false;
        this.close_callback = null;
        this.esc_propagation_priority = esc_propagation_priority + 1;
        this.set_control();
    }

    set_control() {
        game.input.keyboard.addKey(Phaser.Keyboard.ESC).onDown.add(() => {
            if (!this.is_open) return;
            this.data.esc_input.getSignal().halt();
            this.close_menu();
        }, this, this.esc_propagation_priority);
    }

    char_change(party_index) {
        this.basic_info_window.set_char(party[party_index]);
    }

    open_menu(close_callback) {
        this.is_open = true;
        this.close_callback = close_callback;
        this.chars_menu.open(this.selected_char_index);
        this.basic_info_window.open(party[this.selected_char_index])
    }

    close_menu() {
        this.chars_menu.close();
        this.basic_info_window.close();
        this.is_open = false;
        if (this.close_callback !== null) {
            this.close_callback();
        }
    }
}