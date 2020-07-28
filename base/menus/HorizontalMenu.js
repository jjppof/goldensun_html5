import { get_text_width } from '../../utils.js';
import * as numbers from '../../magic_numbers.js';
import { Window } from '../Window.js';

const FORWARD = 1;
const BACKWARD = -1;
const BUTTON_WIDTH = 24;
const BUTTON_HEIGHT = 24;
const BUTTON_Y = numbers.GAME_HEIGHT - BUTTON_HEIGHT;
const TITLE_WINDOW_HEIGHT = BUTTON_HEIGHT - numbers.OUTSIDE_BORDER_WIDTH - numbers.INSIDE_BORDER_WIDTH;

export class HorizontalMenu {
    constructor(game, data, buttons, titles, on_choose, enter_propagation_priority, on_cancel, esc_propagation_priority, title_window_width, dock_right = false) {
        this.game = game;
        this.data = data;
        this.buttons_keys = buttons;
        this.titles = titles;
        this.buttons_number = buttons.length;
        this.enter_propagation_priority = enter_propagation_priority;
        this.esc_propagation_priority = esc_propagation_priority;
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
        this.choose_timer_repeat = this.game.time.create(false);
        this.choose_timer_start = this.game.time.create(false);
        this.on_choose = on_choose === undefined ? () => {} : on_choose;
        this.on_cancel = on_cancel === undefined ? () => {} : on_cancel;
        this.right_pressed = false;
        this.left_pressed = false;
        this.set_control();
    }

    set_control() {
        this.data.enter_input.add(() => {
            if (!this.menu_open || !this.menu_active) return;
            this.data.enter_input.halt();
            this.on_choose(this.selected_button_index);
        }, this, this.enter_propagation_priority);
        this.data.esc_input.add(() => {
            if (!this.menu_open || !this.menu_active) return;
            this.data.esc_input.halt();
            this.on_cancel();
        }, this, this.esc_propagation_priority);
        this.game.input.keyboard.addKey(Phaser.Keyboard.RIGHT).onDown.add(() => {
            if (!this.menu_open || !this.menu_active) return;
            if (this.left_pressed) {
                this.left_pressed = false;
                this.stop_timers();
            }
            this.right_pressed = true;
            this.set_change_timers(FORWARD);
        });
        this.game.input.keyboard.addKey(Phaser.Keyboard.RIGHT).onUp.add(() => {
            if (!this.menu_open || !this.menu_active || !this.right_pressed) return;
            this.right_pressed = false;
            this.stop_timers();
        });
        this.game.input.keyboard.addKey(Phaser.Keyboard.LEFT).onDown.add(() => {
            if (!this.menu_open || !this.menu_active) return;
            if (this.right_pressed) {
                this.right_pressed = false;
                this.stop_timers();
            }
            this.left_pressed = true;
            this.set_change_timers(BACKWARD);
        });
        this.game.input.keyboard.addKey(Phaser.Keyboard.LEFT).onUp.add(() => {
            if (!this.menu_open || !this.menu_active || !this.left_pressed) return;
            this.left_pressed = false;
            this.stop_timers();
        });
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

    set_change_timers(step) {
        this.change_button(step);
        this.choose_timer_start.add(Phaser.Timer.QUARTER, () => {
            this.choose_timer_repeat.loop(Phaser.Timer.QUARTER >> 1, this.change_button.bind(this, step));
            this.choose_timer_repeat.start();
        });
        this.choose_timer_start.start();
    }

    stop_timers() {
        this.choose_timer_start.stop();
        this.choose_timer_repeat.stop();
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
        this.title_window.update(true);
    }

    open(callback, select_index, start_active = true) {
        this.reset_button();
        this.right_pressed = false;
        this.left_pressed = false;
        this.menu_active = start_active;
        this.group.alpha = 1;
        this.selected_button_index = select_index === undefined ? 0 : select_index;
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
        this.stop_timers();
        this.reset_button();
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
        this.right_pressed = false;
        this.left_pressed = false;
        this.menu_active = true;
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
        this.stop_timers();
        this.reset_button();
        if (hide) {
            this.buttons.forEach(obj => {
                obj.sprite.alpha = 0;
            });
            this.title_window.close(undefined, false);
        }
    }
}