import { Window } from "../../Window.js";

const BASE_WIN_WIDTH = 236;
const BASE_WIN_HEIGHT = 28;
const BASE_WIN_X = 0;
const BASE_WIN_Y = 40;
const BASE_WIN_TOP_Y = 32;
const DESCRIPTION_X = 8;
const DESCRIPTION_Y = 12;

export class DescriptionWindow {
    constructor(game) {
        this.game = game;
        this.base_window = new Window(this.game, BASE_WIN_X, BASE_WIN_Y, BASE_WIN_WIDTH, BASE_WIN_HEIGHT);
        this.description = this.base_window.set_text_in_position("", DESCRIPTION_X, DESCRIPTION_Y);
    }

    update_position(on_top) {
        if (on_top) {
            this.base_window.update_position({y: BASE_WIN_TOP_Y});
        } else {
            this.base_window.update_position({y: BASE_WIN_Y});
        }
    }

    set_description(description) {
        this.base_window.update_text(description, this.description);
    }

    open(on_top = false) {
        this.is_open = true;
        this.update_position(on_top);
        this.base_window.show(undefined, false);
    }

    show() {
        this.base_window.show(undefined, false);
    }

    hide() {
        this.base_window.close(undefined, false);
    }

    close() {
        this.is_open = false;
        this.base_window.close(undefined, false);
    }

    destroy() {
        this.base_window.destroy(false);
    }
}