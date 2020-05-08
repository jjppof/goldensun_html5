import { Window } from "../Window.js";
import { party_data } from "../../chars/main_chars.js";

const PSY_OVERVIEW_WIN_X = 104;
const PSY_OVERVIEW_WIN_Y = 24;
const PSY_OVERVIEW_WIN_WIDTH = 132;
const PSY_OVERVIEW_WIN_HEIGHT = 108;

export class ItemPsynergyChooseWindow {
    constructor(game, data, is_psynergy_window, on_change, on_choose, esc_propagation_priority, enter_propagation_priority) {
        this.game = game;
        this.data = data;
        this.is_psynergy_window = is_psynergy_window;
        this.on_choose = on_choose === undefined ? () => {} : on_choose;
        this.on_change = on_change === undefined ? () => {} : on_change;
        this.esc_propagation_priority = esc_propagation_priority + 1;
        this.enter_propagation_priority = enter_propagation_priority + 1;
        this.window = new Window(this.game, PSY_OVERVIEW_WIN_X, PSY_OVERVIEW_WIN_Y, PSY_OVERVIEW_WIN_WIDTH, PSY_OVERVIEW_WIN_HEIGHT);
        this.set_control();
        this.window_open = false;
        this.close_callback = undefined;
        this.char = null;
        this.window.create_at_group(9, 97, "shift_keyboard", 0x0);
        this.window.create_at_group(8, 96, "shift_keyboard");
        this.window.create_at_group(32, 97, "tab_keyboard", 0x0);
        this.window.create_at_group(31, 96, "tab_keyboard");
        this.window.set_text_in_position(": Change Char", 49, 96);
    }

    set_control() {
        game.input.keyboard.addKey(Phaser.Keyboard.ESC).onDown.add(() => {
            if (!this.window_open) return;
            this.data.esc_input.getSignal().halt();
            this.close();
        }, this, this.esc_propagation_priority);
    }

    open(char_index, close_callback, open_callback) {
        this.char = party_data.members[char_index];
        this.close_callback = close_callback;
        this.window.show(open_callback, false);
        this.window_open = true;
    }

    close() {
        this.window.close(this.close_callback, false);
        this.window_open = false;
    }
}