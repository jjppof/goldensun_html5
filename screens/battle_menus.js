import { CharsStatusWindow } from "../base/windows/CharsStatusWindow.js";
import { HorizontalMenu } from "../base/menus/HorizontalMenu.js";
import { capitalize } from "../utils.js";

const TITLE_WINDOW_WIDTH = 76;

export class BattleMenuScreen {
    constructor(game, data) {
        this.game = game;
        this.data = data;
        this.chars_status_window = new CharsStatusWindow(this.game, this.data, true, true);
        this.buttons_keys = ["fight", "flee", "status"];
        let esc_propagation_priority = 0;
        let enter_propagation_priority = 0;
        this.horizontal_menu = new HorizontalMenu(
            this.game,
            this.data,
            this.buttons_keys,
            this.buttons_keys.map(b => capitalize(b)),
            this.button_press.bind(this),
            enter_propagation_priority,
            TITLE_WINDOW_WIDTH,
            true
        );
    }

    button_press(index) {
        switch (this.buttons_keys[index]) {

        }
    }

    update_position() {
        this.chars_status_window.update_position(true);
        this.horizontal_menu.update_position();
    }

    is_active() {
        return this.horizontal_menu.menu_active;
    }

    open_menu() {
        this.horizontal_menu.open();
        this.chars_status_window.update_position();
        this.chars_status_window.update_chars_info();
        this.chars_status_window.show();
    }

    close_menu() {
        if (!this.is_active()) return;
        this.horizontal_menu.close();
        this.chars_status_window.close();
    }

    destroy_menu() {

    }
}
