import { Window } from '../Window.js';

const BASE_WIN_WIDTH = 100;
const BASE_WIN_HEIGHT = 92;
const BASE_WIN_X = 0;
const BASE_WIN_Y = 40;

export class BasicInfoWindow {
    constructor(game) {
        this.game = game;
        this.char = null;
        this.window_open = false;
        this.x = BASE_WIN_X;
        this.y = BASE_WIN_Y;
        this.base_window = new Window(this.game, this.x, this.y, BASE_WIN_WIDTH, BASE_WIN_HEIGHT);
        this.avatar_group = game.add.group();
        this.avatar_group.alpha = 0;
        this.x_avatar = this.x + 8;
        this.y_avatar = this.y + 8;
        this.avatar = null;

        this.base_window.set_text_in_position("Lv", 48, 24);
        this.base_window.set_text_in_position("HP", 8, 48);
        this.base_window.set_text_in_position("PP", 8, 56);
        this.base_window.set_text_in_position("/", 56, 49);
        this.base_window.set_text_in_position("/", 56, 56);
        this.base_window.set_text_in_position("Exp", 8, 73);

        this.name_text = this.base_window.set_text_in_position("0", 40, 8);
        this.lv_text = this.base_window.set_text_in_position("0", 80, 24);
        this.class_text = this.base_window.set_text_in_position("0", 8, 40);
        this.hp_text = this.base_window.set_text_in_position("0", 51, 48, true);
        this.pp_text = this.base_window.set_text_in_position("0", 51, 56, true);
        this.max_hp_text = this.base_window.set_text_in_position("0", 94, 48, true);
        this.max_pp_text = this.base_window.set_text_in_position("0", 94, 56, true);
        this.exp_text = this.base_window.set_text_in_position("0", 94, 80, true);
    }

    update_position() {
        this.avatar_group.x = this.game.camera.x + this.x_avatar;
        this.avatar_group.y = this.game.camera.y + this.y_avatar;
    }

    set_char(char) {
        if (char !== undefined) {
            this.char = char;
        }
        this.base_window.update_text(this.char.name, this.name_text);
        this.base_window.update_text(this.char.level.toString(), this.lv_text);
        this.base_window.update_text(this.char.class.name, this.class_text);
        this.base_window.update_text(this.char.current_hp.toString(), this.hp_text);
        this.base_window.update_text(this.char.current_pp.toString(), this.pp_text);
        this.base_window.update_text(this.char.max_hp.toString(), this.max_hp_text);
        this.base_window.update_text(this.char.max_pp.toString(), this.max_pp_text);
        this.base_window.update_text(this.char.current_exp.toString(), this.exp_text);
        if (this.avatar) {
            this.avatar.destroy();
        }
        this.avatar = this.avatar_group.create(0, 0, this.char.key_name + "_avatar");
    }

    open(initial_char, callback) {
        this.update_position();
        this.avatar_group.alpha = 1;
        this.set_char(initial_char);
        this.base_window.show(() => {
            this.window_open = true;
            if (callback !== undefined) {
                callback();
            }
        }, false);
    }

    close(callback) {
        this.avatar_group.alpha = 0;
        this.base_window.close(() => {
            this.window_open = false;
            if (callback !== undefined) {
                callback();
            }
        }, false);
    }
}
