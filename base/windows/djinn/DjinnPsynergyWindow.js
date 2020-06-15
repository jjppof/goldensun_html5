import { Window } from '../../Window.js';
import { ordered_elements } from '../../MainChar.js';
import * as numbers from '../../../magic_numbers.js';

const BASE_WIN_WIDTH = 116;
const BASE_WIN_HEIGHT = 116;
const BASE_WIN_X = 120;
const BASE_WIN_Y = 40;

export class DjinnPsynergyWindow {
    constructor(game, data, esc_propagation_priority, enter_propagation_priority) {
        this.game = game;
        this.data = data;
        this.window_open = false;
        this.sprites = [];
        this.esc_propagation_priority = esc_propagation_priority + 1;
        this.enter_propagation_priority = enter_propagation_priority + 1;
        this.base_window = new Window(this.game, BASE_WIN_X, BASE_WIN_Y, BASE_WIN_WIDTH, BASE_WIN_HEIGHT);
        this.set_control();
    }

    set_control() {
        this.game.input.keyboard.addKey(Phaser.Keyboard.ESC).onDown.add(() => {
            if (!this.window_open) return;
            if (this.setting_djinn_status) {
                this.data.esc_input.getSignal().halt();
                this.change_status = false;
                this.close(this.close_callback);
            }
        }, this, this.esc_propagation_priority);
        this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER).onDown.add(() => {
            if (!this.window_open) return;
            this.data.enter_input.getSignal().halt();
            this.change_status = true;
            this.close(this.close_callback);
        }, this, this.enter_propagation_priority);
    }

    mount_window() {

    }

    unmount_window() {
        this.sprites.forEach(sprite => {
            sprite.destroy();
        });
    }

    open(char, djinn, next_djinn_status, close_callback, callback) {
        this.char = char;
        this.djinn = djinn;
        this.next_djinn_status = next_djinn_status;
        this.close_callback = close_callback;
        this.change_status = false;
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
                callback(this.change_status);
            }
        }, false);
    }
}