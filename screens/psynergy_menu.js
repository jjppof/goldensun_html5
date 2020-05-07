import { CharsMenu } from '../base/menus/CharsMenu.js';
import { BasicInfoWindow } from '../base/windows/BasicInfoWindow.js';
import { party, party_data } from '../chars/main_chars.js';
import { Window } from '../base/Window.js';

const GUIDE_WINDOW_X = 104;
const GUIDE_WINDOW_Y = 0;
const GUIDE_WINDOW_WIDTH = 132;
const GUIDE_WINDOW_HEIGHT = 20;
const DESCRIPTION_WINDOW_X = 0;
const DESCRIPTION_WINDOW_Y = 136;
const DESCRIPTION_WINDOW_WIDTH = 236;
const DESCRIPTION_WINDOW_HEIGHT = 20;

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
        this.guide_window = new Window(this.game, GUIDE_WINDOW_X, GUIDE_WINDOW_Y, GUIDE_WINDOW_WIDTH, GUIDE_WINDOW_HEIGHT);
        this.guide_window_text = this.guide_window.set_single_line_text("");
        this.choosing_psynergy = false;
        this.guide_window_msgs = {
            choosing_char: "Whose Psynergy?",
            choosing_psynergy: "Which Psynergy?",
        }
        this.description_window = new Window(this.game, DESCRIPTION_WINDOW_X, DESCRIPTION_WINDOW_Y, DESCRIPTION_WINDOW_WIDTH, DESCRIPTION_WINDOW_HEIGHT);
        this.description_window_text = this.description_window.set_single_line_text("");
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

    set_guide_window_text() {
        if (this.choosing_psynergy) {
            this.guide_window.update_text(this.guide_window_msgs.choosing_psynergy, this.guide_window_text);
        } else {
            this.guide_window.update_text(this.guide_window_msgs.choosing_char, this.guide_window_text);
        }
    }

    set_description_window_text() {
        if (this.choosing_psynergy) {

        } else {
            this.description_window.update_text(party_data.coins + "    Coins", this.description_window_text);
        }
    }

    open_menu(close_callback) {
        this.is_open = true;
        this.close_callback = close_callback;
        this.chars_menu.open(this.selected_char_index);
        this.basic_info_window.open(party[this.selected_char_index]);
        this.set_guide_window_text();
        this.set_description_window_text();
        this.guide_window.show(undefined, false);
        this.description_window.show(undefined, false);
    }

    close_menu() {
        this.chars_menu.close();
        this.basic_info_window.close();
        this.is_open = false;
        this.guide_window.close(undefined, false);
        this.description_window.close(undefined, false);
        if (this.close_callback !== null) {
            this.close_callback();
        }
    }
}