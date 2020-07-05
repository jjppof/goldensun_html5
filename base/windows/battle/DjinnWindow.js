import { Window } from "../../Window.js";

const BASE_WINDOW_X = 160;
const BASE_WINDOW_Y = 72;
const BASE_WINDOW_WIDTH = 76;
const BASE_WINDOW_HEIGHT = 84;
const ELEM_PER_PAGE = 5;
const ELEM_PADDING_TOP = 5;
const ELEM_PADDING_LEFT = 10;
const SPACE_BETWEEN_ITEMS = 2;
const HIGHLIGHT_BAR_WIDTH = 64;
const HIGHLIGHT_BAR_HEIGHT = 8;
const HIGHLIGHT_BAR_X = 8;
const BUTTON_X = 140;
const BUTTON_Y = 136;

export class DjinnWindow {
    constructor(game, data, esc_propagation_priority, enter_propagation_priority) {
        this.game = game;
        this.data = data;
        this.esc_propagation_priority = esc_propagation_priority + 1;
        this.enter_propagation_priority = enter_propagation_priority + 1;
        this.base_window = new Window(this.game, BASE_WINDOW_X, BASE_WINDOW_Y, BASE_WINDOW_WIDTH, BASE_WINDOW_HEIGHT);
        this.base_window.init_page_indicator_bar();
        this.group = this.game.add.group();
        this.button = this.group.create(BUTTON_X, BUTTON_Y, "buttons", "djinn");
        this.group.alpha = 0;
        this.highlight_bar = this.game.add.graphics(0, 0);
        this.highlight_bar.blendMode = PIXI.blendModes.SCREEN;
        this.highlight_bar.alpha = 0;
        this.base_window.add_sprite_to_group(this.highlight_bar);
        this.highlight_bar.beginFill(this.base_window.color, 1);
        this.highlight_bar.drawRect(HIGHLIGHT_BAR_X, 0, HIGHLIGHT_BAR_WIDTH, HIGHLIGHT_BAR_HEIGHT);
        this.highlight_bar.endFill();
        this.set_control();
    }

    set_control() {
        this.data.esc_input.add(() => {
            if (!this.window_open) return;
            this.data.esc_input.halt();
            this.close(this.close_callback);
        }, this, this.esc_propagation_priority);
        this.data.enter_input.add(() => {
            if (!this.window_open) return;
            this.data.enter_input.halt();
            this.choosen_djinn = this.djinni[this.djinn_index];
            this.close(this.close_callback);
        }, this, this.enter_propagation_priority);
    }

    update_position() {
        this.group.x = this.game.camera.x;
        this.group.y = this.game.camera.y;
    }
    set_highlight_bar() {
        this.highlight_bar.y = ELEM_PADDING_TOP + this.ability_index * (numbers.ICON_HEIGHT + SPACE_BETWEEN_ITEMS) + 4;
    }

    open(char, close_callback, set_description, callback = undefined) {
        this.char = char;
        this.close_callback = close_callback;
        this.set_description = set_description;
        this.group.alpha = 1;
        this.djinn_index = 0;
        this.page_index = 0;
        this.choosen_djinn = null;
        this.update_position();
        this.set_highlight_bar();
        this.base_window.show(() => {
            this.window_open = true;
            if (callback !== undefined) {
                callback();
            }
        }, false);
    }
}