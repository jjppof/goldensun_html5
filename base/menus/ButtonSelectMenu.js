import { get_text_width } from '../../utils.js';
import * as numbers from '../../magic_numbers.js';
import { Window } from '../Window.js';

const FORWARD = 1;
const BACKWARD = -1;
const BUTTON_WIDTH = 24;
const BUTTON_HEIGHT = 24;
const BUTTON_Y = numbers.GAME_HEIGHT - BUTTON_HEIGHT;
const TITLE_WINDOW_HEIGHT = BUTTON_HEIGHT - numbers.OUTSIDE_BORDER_WIDTH - numbers.INSIDE_BORDER_WIDTH;

export class ButtonSelectMenu {
    constructor(game, data, buttons, titles, callbacks, control_manager, title_window_width, dock_right=false) {
        this.game = game;
        this.data = data;
        this.buttons_keys = buttons;
        this.titles = titles;
        this.on_cancel = callbacks.on_cancel;
        this.on_press = callbacks.on_press;
        this.control_manager = control_manager;
        this.buttons_number = buttons.length;

        const max_title_width = get_text_width(this.game, _.maxBy(titles, title => title.length));
        this.title_window_width = title_window_width !== undefined ? title_window_width : max_title_width + 2 * (numbers.WINDOW_PADDING_H + numbers.INSIDE_BORDER_WIDTH);
        const total_width = BUTTON_WIDTH * this.buttons_number + this.title_window_width + 2 * numbers.OUTSIDE_BORDER_WIDTH + 2;
        this.dock_right = dock_right;

        this.x = numbers.GAME_WIDTH - total_width;
        if (!this.dock_right) {
            this.x = this.x >> 1;
        }
        this.y = BUTTON_Y;

        this.title_window = new Window(this.game, this.x + BUTTON_WIDTH * this.buttons_number, this.y, this.title_window_width, TITLE_WINDOW_HEIGHT);
        this.group = game.add.group();
        this.group.alpha = 0;
        this.mount_buttons();
        this.selected_button_index = 0;
        this.menu_open = false;
        this.menu_active = false;
        this.group.width = 0;
        this.group.height = 0;
        this.selected_button_tween = null;
    }

    set_control() {
        if(this.control_manager.initialized) this.control_manager.reset();
        this.control_manager.set_control(true, false, true, false, {right: this.next_button.bind(this), left: this.previous_button.bind(this),
            esc: this.on_cancel.bind(this), enter: this.on_press.bind(this)});
    }

    mount_buttons(filtered_buttons = []) {
        const buttons = this.buttons_keys.filter(key => !filtered_buttons.includes(key));
        this.buttons_number = buttons.length;
        const total_width = BUTTON_WIDTH * this.buttons_number + this.title_window_width + 2 * numbers.OUTSIDE_BORDER_WIDTH + 2;
        this.x = numbers.GAME_WIDTH - total_width;
        if (!this.dock_right) {
            this.x = this.x >> 1;
        }
        this.title_window.update_position({x: this.x + BUTTON_WIDTH * this.buttons_number});
        if (this.buttons) {
            this.buttons.forEach(obj => {
                obj.sprite.destroy();
            });
        }
        this.buttons = new Array(this.buttons_number);
        for (let i = 0; i < this.buttons_number; ++i) {
            this.buttons[i] = {
                sprite: this.group.create(0, 0, "buttons", buttons[i]),
                title: this.titles[i]
            }
            this.buttons[i].sprite.anchor.setTo(0.5, 1);
            this.buttons[i].sprite.centerX = parseInt(BUTTON_WIDTH * (i + 0.5));
            this.buttons[i].sprite.centerY = parseInt(BUTTON_HEIGHT * 0.5);
        }
    }

    change_button(step) {
        this.reset_button();
        this.selected_button_index = (this.selected_button_index + step) % this.buttons_number;
        if (this.selected_button_index < 0) {
            this.selected_button_index = this.buttons_number - 1;
        }
        this.title_window.set_text([[this.buttons[this.selected_button_index].title]]);
        this.set_button();
    }

    next_button(){
        this.change_button(FORWARD);
    }

    previous_button(){
        this.change_button(BACKWARD);
    }

    set_to_position(index) {
        this.reset_button();
        this.selected_button_index = index;
        this.title_window.set_text([[this.buttons[this.selected_button_index].title]]);
        this.set_button();
    }

    set_button() {
        this.buttons[this.selected_button_index].sprite.scale.setTo(1.2, 1.2);
        this.buttons[this.selected_button_index].sprite.bringToTop();
        this.selected_button_tween = this.game.add.tween(this.buttons[this.selected_button_index].sprite.scale).to(
            { x: 1.3, y: 1.3 },
            Phaser.Timer.QUARTER >> 1,
            Phaser.Easing.Linear.None,
            true,
            0,
            -1,
            true
        );
    }

    reset_button() {
        if (this.buttons[this.selected_button_index]) {
            this.buttons[this.selected_button_index].sprite.scale.setTo(1.0, 1.0);
        }
        if (this.selected_button_tween) {
            this.selected_button_tween.stop();
        }
    }

    update_position() {
        this.group.x = this.game.camera.x + this.x;
        this.group.y = this.game.camera.y + this.y;
        this.title_window.update(undefined, true);
    }

    open(callback, select_index=0, start_active = true) {
        this.reset_button();
        this.set_control();

        this.menu_active = start_active;
        this.group.alpha = 1;
        this.selected_button_index = select_index;

        this.update_position();
        this.title_window.set_text([[this.buttons[this.selected_button_index].title]]);

        let window_promise_resolve;
        let window_promise = new Promise(resolve => { window_promise_resolve = resolve; })
        this.title_window.show(window_promise_resolve);

        let buttons_resolve;
        let buttons_promise = new Promise(resolve => { buttons_resolve = resolve; })

        this.game.add.tween(this.group).to(
            { width: BUTTON_WIDTH * this.buttons_number, height: BUTTON_HEIGHT },
            Phaser.Timer.QUARTER >> 2,
            Phaser.Easing.Linear.None,
            true
        ).onComplete.addOnce(buttons_resolve);

        Promise.all([window_promise, buttons_promise]).then(() => {
            this.set_button();
            this.menu_open = true;
            if (callback) {
                callback();
            }
        });
    }

    close(callback, animate = true) {
        this.menu_open = false;
        this.reset_button();
        this.control_manager.reset();
        this.group.alpha = 0;
        if (animate) {
            let window_promise_resolve;
            let window_promise = new Promise(resolve => { window_promise_resolve = resolve; })
            this.title_window.close(window_promise_resolve);
            const transition_time = Phaser.Timer.QUARTER >> 2;
            let buttons_resolve;
            let buttons_promise = new Promise(resolve => { buttons_resolve = resolve; })
            this.game.add.tween(this.group).to(
                { width: 0, height: 0 },
                transition_time,
                Phaser.Easing.Linear.None,
                true
            ).onComplete.addOnce(buttons_resolve);
            Promise.all([window_promise, buttons_promise]).then(callback !== undefined ? callback : () => {});
        } else {
            this.title_window.close(undefined, false);
            this.group.width = this.group.height = 0;
            if (callback) {
                callback();
            }
        }
    }

    activate() {
        this.menu_active = true;
        this.set_control();
        this.buttons.forEach(obj => {
            obj.sprite.alpha = 1;
        });
        if (!this.title_window.open) {
            this.title_window.show(undefined, false);
        }
        this.title_window.set_text([[this.buttons[this.selected_button_index].title]]);
        this.set_button();
    }

    deactivate(hide = false) {
        this.menu_active = false;
        this.control_manager.reset();
        this.reset_button();
        if (hide) {
            this.buttons.forEach(obj => {
                obj.sprite.alpha = 0;
            });
            this.title_window.close(undefined, false);
        }
    }

    destroy() {
        this.title_window.destroy(false);
        this.group.destroy();
    }
}