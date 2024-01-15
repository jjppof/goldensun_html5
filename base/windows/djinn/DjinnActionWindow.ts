import {TextObj, Window} from "../../Window";
import {Djinn, djinn_status} from "../../Djinn";
import {MainChar} from "../../MainChar";

const BASE_WIN_WIDTH = 132;
const BASE_WIN_HEIGHT = 36;
const BASE_WIN_X = 104;
const BASE_WIN_Y = 0;

const CHOOSE_A_DJ_X = 8;
const CHOOSE_A_DJ_Y = 8;

const SET_ALL_X = 22;
const SET_ALL_Y = 8;

const CHAR_NAME_X = 8;
const CHAR_NAME_Y = 16;

const DJINN_NAME_X = 64;
const DJINN_NAME_Y = 16;

const R_BUTTON_KEY_X = 8;
const R_BUTTON_KEY_Y = 24;

const SEL_BUTTON_KEY_X = 8;
const SEL_BUTTON_KEY_Y = 8;

const DJINN_ACTION_X = R_BUTTON_KEY_X + 15;
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
    public set_all_text: TextObj;

    public r_button_key: {
        shadow: Phaser.Sprite;
        text: Phaser.Sprite;
    };
    public se_button_key: {
        shadow: Phaser.Sprite;
        text: Phaser.Sprite;
    };

    constructor(game: Phaser.Game) {
        this.game = game;

        this.window_open = false;
        this.star_sprite = null;

        this.base_window = new Window(this.game, BASE_WIN_X, BASE_WIN_Y, BASE_WIN_WIDTH, BASE_WIN_HEIGHT);
        this.base_window.set_canvas_update();

        this.action_description_text = this.base_window.set_text_in_position("", CHOOSE_A_DJ_X, CHOOSE_A_DJ_Y);
        this.char_name_text = this.base_window.set_text_in_position("", CHAR_NAME_X, CHAR_NAME_Y);
        this.djinn_name_text = this.base_window.set_text_in_position("", DJINN_NAME_X, DJINN_NAME_Y);
        this.action_text = this.base_window.set_text_in_position("", DJINN_ACTION_X, DJINN_ACTION_Y);

        this.r_button_key = {
            shadow: this.base_window.create_at_group(R_BUTTON_KEY_X + 1, R_BUTTON_KEY_Y + 1, "keyboard_buttons", {
                color: 0x0,
                frame: "r_button",
            }),
            text: this.base_window.create_at_group(R_BUTTON_KEY_X, R_BUTTON_KEY_Y, "keyboard_buttons", {
                frame: "r_button",
            }),
        };

        this.set_all_text = this.base_window.set_text_in_position("", SET_ALL_X, SET_ALL_Y);
        this.se_button_key = {
            shadow: this.base_window.create_at_group(SEL_BUTTON_KEY_X + 1, SEL_BUTTON_KEY_Y + 1, "keyboard_buttons", {
                color: 0x0,
                frame: "select_button",
            }),
            text: this.base_window.create_at_group(SEL_BUTTON_KEY_X, SEL_BUTTON_KEY_Y, "keyboard_buttons", {
                frame: "select_button",
            }),
        };

        this.unset_while_holding_r_view();
    }

    set_info_visibililty(visible: boolean) {
        this.r_button_key.text.visible = visible;
        this.r_button_key.shadow.visible = visible;
        this.action_text.text.visible = visible;
        this.action_text.shadow.visible = visible;
        this.action_description_text.text.visible = visible;
        this.action_description_text.shadow.visible = visible;
    }

    set_action_text(status: string) {
        this.base_window.update_text("Choose a djinn.", this.action_description_text);
        this.base_window.update_text("", this.char_name_text);
        this.base_window.update_text("", this.djinn_name_text);

        this.r_button_key.text.visible = this.r_button_key.shadow.visible = true;

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

    set_while_holding_r_view(set: boolean) {
        this.set_info_visibililty(false);

        this.base_window.update_text(set ? ": Set All" : ": All Standby", this.set_all_text);

        this.se_button_key.text.visible = true;
        this.se_button_key.shadow.visible = true;
        this.set_all_text.text.visible = true;
        this.set_all_text.shadow.visible = true;
    }

    unset_while_holding_r_view() {
        this.se_button_key.text.visible = false;
        this.se_button_key.shadow.visible = false;
        this.set_all_text.text.visible = false;
        this.set_all_text.shadow.visible = false;

        this.set_info_visibililty(true);
    }

    set_action_for_specific_djinn(this_char: MainChar, this_djinn: Djinn) {
        this.star_sprite = this.base_window.create_at_group(DJINN_NAME_X - 7, DJINN_NAME_Y + 1, "stars", {
            frame: this_djinn.element,
        });

        this.base_window.update_text("What will you do?", this.action_description_text);
        this.base_window.update_text(this_char.name + "'s", this.char_name_text);
        this.base_window.update_text(this_djinn.name, this.djinn_name_text);
        this.base_window.update_text("", this.action_text);

        this.r_button_key.text.visible = this.r_button_key.shadow.visible = false;
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
