import {TextObj, Window} from "../../Window";
import {Djinn, djinn_status} from "../../Djinn";
import {MainChar} from "../../MainChar";

const BASE_WIN_WIDTH = 132;
const BASE_WIN_HEIGHT = 36;
const BASE_WIN_X = 104;
const BASE_WIN_Y = 0;

const CHOOSE_A_DJ_X = 8;
const CHOOSE_A_DJ_Y = 8;

const CHAR_NAME_X = 8;
const CHAR_NAME_Y = 16;

const DJINN_NAME_X = 64;
const DJINN_NAME_Y = 16;

const SHIFT_KEY_X = 8;
const SHIFT_KEY_Y = 24;

const DJINN_ACTION_X = SHIFT_KEY_X + 23;
const DJINN_ACTION_Y = 24;

export class DjinnActionWindow {
    public game: Phaser.Game;

    public window_open: boolean;
    public star_sprite: Phaser.Sprite;

    public base_window: Window;

    public action_description_text: TextObj;
    public char_name_text: TextObj;
    public djinn_name_text: TextObj;
    public action_text: TextObj;

    public shift_key: {
        shadow: Phaser.Sprite;
        text: Phaser.Sprite;
    };

    constructor(game: Phaser.Game) {
        this.game = game;

        this.window_open = false;
        this.star_sprite = null;

        this.base_window = new Window(this.game, BASE_WIN_X, BASE_WIN_Y, BASE_WIN_WIDTH, BASE_WIN_HEIGHT);

        this.action_description_text = this.base_window.set_text_in_position("", CHOOSE_A_DJ_X, CHOOSE_A_DJ_Y);
        this.char_name_text = this.base_window.set_text_in_position("", CHAR_NAME_X, CHAR_NAME_Y);
        this.djinn_name_text = this.base_window.set_text_in_position("", DJINN_NAME_X, DJINN_NAME_Y);
        this.action_text = this.base_window.set_text_in_position("", DJINN_ACTION_X, DJINN_ACTION_Y);

        this.shift_key = {
            shadow: this.base_window.create_at_group(SHIFT_KEY_X + 1, SHIFT_KEY_Y + 1, "shift_keyboard", 0x0),
            text: this.base_window.create_at_group(SHIFT_KEY_X, SHIFT_KEY_Y, "shift_keyboard"),
        };
    }

    set_action_text(status: string) {
        this.base_window.update_text("Choose a djinn.", this.action_description_text);
        this.base_window.update_text("", this.char_name_text);
        this.base_window.update_text("", this.djinn_name_text);

        this.shift_key.text.alpha = this.shift_key.shadow.alpha = 1;
        if (this.star_sprite) {
            this.star_sprite.destroy();
            this.star_sprite = null;
        }

        switch (status) {
            case djinn_status.SET:
                this.base_window.update_text(": Standby", this.action_text);
                break;
            case djinn_status.STANDBY:
                this.base_window.update_text(": Set", this.action_text);
                break;
        }
    }

    set_action_for_specific_djinn(this_char: MainChar, this_djinn: Djinn) {
        this.star_sprite = this.base_window.create_at_group(
            DJINN_NAME_X - 7,
            DJINN_NAME_Y + 1,
            "stars",
            undefined,
            this_djinn.element
        );

        this.base_window.update_text("What will you do?", this.action_description_text);
        this.base_window.update_text(this_char.name + "'s", this.char_name_text);
        this.base_window.update_text(this_djinn.name, this.djinn_name_text);
        this.base_window.update_text("", this.action_text);

        this.shift_key.text.alpha = this.shift_key.shadow.alpha = 0;
    }

    open(callback?: Function) {
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
