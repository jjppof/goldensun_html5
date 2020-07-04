import { Window } from "../../Window.js";

const BASE_WIN_WIDTH = 236;
const BASE_WIN_HEIGHT = 137;
const BASE_WIN_X = 0;
const BASE_WIN_Y = 40;
const DESCRIPTION_X = 8;
const DESCRIPTION_Y = 12;

export class DescriptionWindow {
    constructor(game) {
        this.game = game;
        this.base_window = new Window(this.game, BASE_WIN_X, BASE_WIN_Y, BASE_WIN_WIDTH, BASE_WIN_HEIGHT);
        this.description = this.base_window.set_text_in_position("", DESCRIPTION_X, DESCRIPTION_Y);
    }

    update_position() {
        this.base_window.update();
    }

    set_description(description) {
        this.base_window.update_text(description, this.description);
    }

    open() {
        this.is_open = true;
        this.update_position();
        this.base_window.show(undefined, false);
    }

    close() {
        this.is_open = false;
        this.base_window.close(undefined, false);
    }

    destroy() {
        this.base_window.destroy(false);
    }
}