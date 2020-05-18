import { Window } from '../Window.js';

const BASE_WIN_WIDTH = 100;
const BASE_WIN_HEIGHT = 92;
const BASE_WIN_X = 0;
const BASE_WIN_Y = 40;

export class StatsCheckWithItemWindow {
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
        this.base_window.set_text_in_position("Attack", 8, 40);
        this.base_window.set_text_in_position("Defense", 8, 56);
        this.base_window.set_text_in_position("Agility", 8, 72);

        this.name_text = this.base_window.set_text_in_position("0", 40, 8);
        this.lv_text = this.base_window.set_text_in_position("0", 80, 24);
        this.attack_text = this.base_window.set_text_in_position("0", 40, 48, true);
        this.defense_text = this.base_window.set_text_in_position("0", 40, 64, true);
        this.agility_text = this.base_window.set_text_in_position("0", 40, 80, true);
    }

    update_position() {
        this.avatar_group.x = this.game.camera.x + this.x_avatar;
        this.avatar_group.y = this.game.camera.y + this.y_avatar;
    }

    update_info() {
        this.base_window.update_text(this.char.name, this.name_text);
        this.base_window.update_text(this.char.level.toString(), this.lv_text);
        this.base_window.update_text(this.char.current_atk.toString(), this.attack_text);
        this.base_window.update_text(this.char.current_def.toString(), this.defense_text);
        this.base_window.update_text(this.char.current_agi.toString(), this.agility_text);
        if (this.avatar) {
            this.avatar.destroy();
        }
        this.avatar = this.avatar_group.create(0, 0, this.char.key_name + "_avatar");
    }

    check_item_change() {

    }

    open(char, item, callback) {
        this.update_position();
        this.avatar_group.alpha = 1;
        this.char = char;
        this.item = item;
        this.update_info();
        this.check_item_change();
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
