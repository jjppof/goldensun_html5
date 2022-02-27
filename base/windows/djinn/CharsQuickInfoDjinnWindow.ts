import {TextObj, Window} from "../../Window";
import * as numbers from "../../magic_numbers";
import {MainChar} from "../../MainChar";

const BASE_WIN_WIDTH = 100;
const BASE_WIN_HEIGHT = 36;
const BASE_WIN_X = 0;
const BASE_WIN_Y = 0;
const NAME_X = 8;
const NAME_Y = 8;
const CLASS_Y = NAME_Y + numbers.FONT_SIZE;
const LV_X = 56;
const LV_Y = 8;
const LV_NUMBER_RIGHT_X = 94;
const L_BUTTON_X = NAME_X;
const L_BUTTON_Y = CLASS_Y + numbers.FONT_SIZE;

export class CharsQuickInfoDjinnWindow {
    public game: Phaser.Game;

    public char: MainChar;
    public window_open: boolean;
    public x: number;
    public y: number;

    public base_window: Window;
    public char_name: TextObj;
    public char_class: TextObj;
    public level_number: TextObj;
    public char_status_text: TextObj;
    public l_button: {
        shadow: Phaser.Sprite;
        main: Phaser.Sprite;
    };

    constructor(game) {
        this.game = game;

        this.char = null;
        this.window_open = false;
        this.x = BASE_WIN_X;
        this.y = BASE_WIN_Y;

        this.base_window = new Window(this.game, this.x, this.y, BASE_WIN_WIDTH, BASE_WIN_HEIGHT);
        this.char_name = this.base_window.set_text_in_position("", NAME_X, NAME_Y);
        this.char_class = this.base_window.set_text_in_position("", NAME_X, CLASS_Y);
        this.base_window.set_text_in_position("Lv", LV_X, LV_Y);
        this.level_number = this.base_window.set_text_in_position("", LV_NUMBER_RIGHT_X, LV_Y, {right_align: true});

        this.l_button = {
            shadow: this.base_window.create_at_group(L_BUTTON_X + 1, L_BUTTON_Y + 1, "keyboard_buttons", {
                color: 0x0,
                frame: "l_button",
            }),
            main: this.base_window.create_at_group(L_BUTTON_X, L_BUTTON_Y, "keyboard_buttons", {
                frame: "l_button",
            }),
        };
        this.char_status_text = this.base_window.set_text_in_position(
            ": Char. Status",
            this.l_button.main.x + this.l_button.main.width + 2,
            this.l_button.main.y
        );
    }

    set_l_button_visibility(visible: boolean) {
        this.l_button.main.visible = visible;
        this.l_button.shadow.visible = visible;
        this.char_status_text.text.visible = visible;
        this.char_status_text.shadow.visible = visible;
    }

    update_text() {
        this.base_window.update_text(this.char.name, this.char_name);
        this.base_window.update_text(this.char.class.name, this.char_class);
        this.base_window.update_text(this.char.level.toString(), this.level_number);
    }

    set_char(char: MainChar) {
        this.char = char;
        this.update_text();
    }

    open(char: MainChar, callback?: Function) {
        this.char = char;
        this.update_text();

        this.base_window.show(() => {
            this.window_open = true;
            if (callback !== undefined) {
                callback();
            }
        }, false);
    }

    close(callback?: Function) {
        this.base_window.close(() => {
            this.window_open = false;
            if (callback !== undefined) {
                callback();
            }
        }, false);
    }
}
