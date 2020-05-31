import { party_data } from '../chars/main_chars.js';
import { djinni_list } from '../chars/djinni.js';
import { Window } from '../base/Window.js';
import * as numbers from '../magic_numbers.js';
import { elements } from '../base/MainChar.js';
import { CharsQuickInfoDjinnWindow } from '../base/windows/djinn/CharsQuickInfoDjinnWindow.js';
import { DjinnListWindow } from '../base/windows/djinn/DjinnListWindow.js';
import { DjinnActionWindow } from '../base/windows/djinn/DjinnActionWindow.js';

export class DjinnMenuScreen {
    constructor(game, data, esc_propagation_priority, enter_propagation_priority, shift_propagation_priority) {
        this.game = game;
        this.data = data;
        this.esc_propagation_priority = esc_propagation_priority + 1;
        this.enter_propagation_priority = enter_propagation_priority + 1;
        this.shift_propagation_priority = shift_propagation_priority + 1;
        this.is_open = false;
        this.close_callback = null;
        this.selected_char_index = 0;
        this.set_control();
        this.chars_quick_info_window = new CharsQuickInfoDjinnWindow(this.game);
        this.djinn_action_window = new DjinnActionWindow(this.game);
        this.djinni_list_window = new DjinnListWindow(this.game, this.data, this.esc_propagation_priority, this.enter_propagation_priority, this.shift_propagation_priority);
    }

    set_control() {
        this.game.input.keyboard.addKey(Phaser.Keyboard.ESC).onDown.add(() => {
            if (!this.is_open) return;
            this.data.esc_input.getSignal().halt();
            this.close_menu();
        }, this, this.esc_propagation_priority);
    }

    open_menu(close_callback) {
        this.close_callback = close_callback;
        this.selected_char_index = 0;
        this.chars_quick_info_window.open(party_data.members[this.selected_char_index]);
        this.djinni_list_window.open(this.chars_quick_info_window, this.djinn_action_window);
        this.djinn_action_window.open();
        this.is_open = true;
    }

    close_menu(close_menu_below = false) {
        this.is_open = false;
        this.chars_quick_info_window.close();
        this.djinni_list_window.close();
        this.djinn_action_window.close();
        if (this.close_callback !== null) {
            this.close_callback(close_menu_below);
        }
    }
}