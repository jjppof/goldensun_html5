import { Window } from '../../Window.js';
import { capitalize } from '../../../utils.js';
import { djinn_font_colors } from '../../Djinn.js';
import { djinni_sprites } from '../../../initializers/djinni.js';

const BASE_WIN_WIDTH = 236;
const BASE_WIN_HEIGHT = 36;
const BASE_WIN_X = 0;
const BASE_WIN_Y = 0;
const OK_MSG_X = 104;
const OK_MSG_Y = 24;
const DJINN_STATUS_X = 104;
const DJINN_STATUS_Y = 8;
const STAR_BEFORE_X = 49;
const STAR_BEFORE_Y = 9;
const STAR_AFTER_X = 49;
const STAR_AFTER_Y = 25;
const DJINN_NAME_BEFORE_X = 56;
const DJINN_NAME_BEFORE_Y = 8;
const DJINN_NAME_AFTER_X = 56;
const DJINN_NAME_AFTER_Y = 24;
const DJINN_X = 32;
const DJINN_Y = 31;
const CHAR_X = 16;
const CHAR_Y = 34;

export class DjinnModeHeaderWindow {
    constructor(game) {
        this.game = game;
        this.window_open = false;
        this.x = BASE_WIN_X;
        this.y = BASE_WIN_Y;
        this.base_window = new Window(this.game, this.x, this.y, BASE_WIN_WIDTH, BASE_WIN_HEIGHT);
        this.base_window.set_text_in_position("Is this OK?", OK_MSG_X, OK_MSG_Y);
        this.djinn_status_text = this.base_window.set_text_in_position("", DJINN_STATUS_X, DJINN_STATUS_Y);
        this.djinn_name_before_text = this.base_window.set_text_in_position("", DJINN_NAME_BEFORE_X, DJINN_NAME_BEFORE_Y);
        this.djinn_name_after_text = this.base_window.set_text_in_position("", DJINN_NAME_AFTER_X, DJINN_NAME_AFTER_Y);
        this.sprites = [];
    }

    mount_window() {
        const status = capitalize(this.next_djinn_status);
        this.base_window.update_text(status, this.djinn_status_text);
        this.base_window.update_text(this.djinn.name, this.djinn_name_before_text);
        this.base_window.update_text_color(djinn_font_colors[this.djinn.status], this.djinn_name_before_text);
        this.base_window.update_text(this.djinn.name, this.djinn_name_after_text);
        this.base_window.update_text_color(djinn_font_colors[this.next_djinn_status], this.djinn_name_after_text);
        this.sprites.push(this.base_window.create_at_group(STAR_BEFORE_X, STAR_BEFORE_Y, this.djinn.element + "_star"));
        this.sprites.push(this.base_window.create_at_group(STAR_AFTER_X, STAR_AFTER_Y, this.djinn.element + "_star"));
        this.set_char_and_djinn_sprite();
    }

    set_char_and_djinn_sprite() {
        const djinn_sprite = this.base_window.create_at_group(DJINN_X, DJINN_Y, this.djinn.element + "_djinn_" + this.djinn.status);
        djinn_sprite.anchor.setTo(0.5, 1.0);
        djinn_sprite.scale.x = -0.8;
        djinn_sprite.scale.y = 0.8;
        djinni_sprites[this.djinn.element].setAnimation(djinn_sprite, this.djinn.status);
        djinn_sprite.animations.play(this.djinn.status + "_down");
        this.sprites.push(djinn_sprite);

        const char_sprite = this.base_window.create_at_group(CHAR_X, CHAR_Y, this.char.key_name + "_idle");
        char_sprite.anchor.setTo(0.5, 1.0);
        char_sprite.animations.add("idle_down", this.char.animations.idle.down, this.char.actions.idle.frame_rate, true);
        char_sprite.animations.play("idle_down", this.char.actions.idle.frame_rate, true);
        this.sprites.push(char_sprite);
    }

    unmount_window() {
        this.sprites.forEach(sprite => {
            sprite.destroy();
        });
    }

    open(char, djinn, next_djinn_status, callback) {
        this.char = char;
        this.djinn = djinn;
        this.next_djinn_status = next_djinn_status;
        this.mount_window();
        this.base_window.show(() => {
            this.window_open = true;
            if (callback !== undefined) {
                callback();
            }
        }, false);
    }

    close(callback) {
        this.unmount_window();
        this.base_window.close(() => {
            this.window_open = false;
            if (callback !== undefined) {
                callback();
            }
        }, false);
    }
}