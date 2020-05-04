import { get_text_width } from '../utils.js';
import * as numbers from '../magic_numbers.js';
import { Window } from './Window.js';

export class HorizontalMenu {
    constructor(game, buttons, titles, on_choose) {
        this.game = game;
        this.buttons_number = buttons.length;
        this.max_title_width = get_text_width(this.game, _.max(titles, title => title.length));
        const total_width = numbers.BUTTON_WIDTH * this.buttons_number + this.max_title_width +
            2 * (numbers.INSIDE_BORDER_WIDTH + numbers.OUTSIDE_BORDER_WIDTH + numbers.WINDOW_PADDING_H);
        this.x = parseInt((numbers.GAME_WIDTH - total_width)/2);
        this.y = numbers.GAME_HEIGHT - numbers.BUTTON_HEIGHT;
        this.title_window = new Window(this.game, this.x + numbers.BUTTON_WIDTH * this.buttons_number, this.y,
            this.max_title_width + 2 * (numbers.WINDOW_PADDING_H + numbers.INSIDE_BORDER_WIDTH),
            numbers.BUTTON_HEIGHT - numbers.OUTSIDE_BORDER_WIDTH - numbers.INSIDE_BORDER_WIDTH);
        this.group = game.add.group();
        this.group.alpha = 0;
        this.buttons = new Array(this.buttons_number);
        for (let i = 0; i < this.buttons_number; ++i) {
            this.buttons[i] = {
                sprite: this.group.create(0, 0, buttons[i] + "_button"),
                title: titles[i]
            }
            this.buttons[i].sprite.anchor.x = 0.5;
            this.buttons[i].sprite.anchor.y = 1;
            this.buttons[i].sprite.centerX = parseInt(numbers.BUTTON_WIDTH * (i + 0.5));
            this.buttons[i].sprite.centerY = parseInt(numbers.BUTTON_HEIGHT * 0.5);
        }
        this.selected_button_index = 0;
        this.menu_open = false;
        this.group.width = 0;
        this.group.height = 0;
        this.selected_button_tween = null;
        this.open_transition_time = Phaser.Timer.QUARTER/4;
        this.button_selected_repeat_time = Phaser.Timer.QUARTER/2;
        this.button_change_time = Phaser.Timer.QUARTER/2;
        this.choose_timer_repeat = this.game.time.create(false);
        this.choose_timer_start = this.game.time.create(false);
        this.on_choose = on_choose === undefined ? () => {} : on_choose;
        this.right_pressed = false;
        this.left_pressed = false;
        this.set_control();
    }

    set_control() {
        game.input.keyboard.addKey(Phaser.Keyboard.ENTER).onUp.add(() => {
            if (!this.menu_open) return;
            this.on_choose(this.selected_button_index);
        });
        game.input.keyboard.addKey(Phaser.Keyboard.RIGHT).onDown.add(() => {
            if (!this.menu_open) return;
            if (this.left_pressed) {
                this.left_pressed = false;
                this.stop_timers();
            }
            this.right_pressed = true;
            this.set_change_timers(1);
        });
        game.input.keyboard.addKey(Phaser.Keyboard.RIGHT).onUp.add(() => {
            if (!this.menu_open || !this.right_pressed) return;
            this.right_pressed = false;
            this.stop_timers();
        });
        game.input.keyboard.addKey(Phaser.Keyboard.LEFT).onDown.add(() => {
            if (!this.menu_open) return;
            if (this.right_pressed) {
                this.right_pressed = false;
                this.stop_timers();
            }
            this.left_pressed = true;
            this.set_change_timers(-1);
        });
        game.input.keyboard.addKey(Phaser.Keyboard.LEFT).onUp.add(() => {
            if (!this.menu_open || !this.left_pressed) return;
            this.left_pressed = false;
            this.stop_timers();
        });
    }

    set_change_timers(step) {
        this.change_button(step);
        this.choose_timer_start.add(Phaser.Timer.QUARTER, () => {
            this.choose_timer_repeat.loop(this.button_change_time, this.change_button.bind(this, step));
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

    set_button() {
        this.buttons[this.selected_button_index].sprite.scale.x = 1.2;
        this.buttons[this.selected_button_index].sprite.scale.y = 1.2;
        this.buttons[this.selected_button_index].sprite.bringToTop();
        this.selected_button_tween = this.game.add.tween(this.buttons[this.selected_button_index].sprite.scale).to(
            { x: 1.3, y: 1.3 },
            this.button_selected_repeat_time,
            Phaser.Easing.Linear.None,
            true,
            0,
            -1,
            true
        );
    }

    reset_button() {
        this.buttons[this.selected_button_index].sprite.scale.x = 1.0;
        this.buttons[this.selected_button_index].sprite.scale.y = 1.0;
        this.selected_button_tween.stop();
    }

    update_position() {
        this.group.x = this.game.camera.x + this.x;
        this.group.y = this.game.camera.y + this.y;
    }

    open(callback, select_index) {
        this.right_pressed = false;
        this.left_pressed = false;
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
            { width: numbers.BUTTON_WIDTH * this.buttons_number, height: numbers.BUTTON_HEIGHT },
            this.open_transition_time,
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

    close(callback) {
        this.menu_open = false;
        this.stop_timers();
        this.reset_button();
        this.group.alpha = 0;
        let window_promise_resolve;
        let window_promise = new Promise(resolve => { window_promise_resolve = resolve; })
        this.title_window.close(window_promise_resolve);
        const transition_time = Phaser.Timer.QUARTER/4;
        let buttons_resolve;
        let buttons_promise = new Promise(resolve => { buttons_resolve = resolve; })
        this.game.add.tween(this.group).to(
            { width: 0, height: 0 },
            transition_time,
            Phaser.Easing.Linear.None,
            true
        ).onComplete.addOnce(buttons_resolve);
        Promise.all([window_promise, buttons_promise]).then(callback !== undefined ? callback : () => {});
    }
}