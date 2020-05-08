import { Window } from '../Window.js';
import { party_data } from '../../chars/main_chars.js';
import * as numbers from '../../magic_numbers.js';

const BASE_WIN_WIDTH = 100;
const BASE_WIN_HEIGHT = 36;
const WORKING_WIDTH = BASE_WIN_WIDTH - 2 * (numbers.OUTSIDE_BORDER_WIDTH + numbers.INSIDE_BORDER_WIDTH);
const SLOT_WIDTH = parseInt(WORKING_WIDTH/4);
const SLOT_WIDTH_CENTER = parseInt(WORKING_WIDTH/8);

export class CharsMenu {
    constructor(game, data, on_choose, on_change, enter_propagation_priority) {
        this.game = game;
        this.data = data;
        this.enter_propagation_priority = enter_propagation_priority;
        this.on_choose = on_choose === undefined ? () => {} : on_choose;
        this.on_change = on_change === undefined ? () => {} : on_change;
        this.base_window = new Window(this.game, 0, 0, BASE_WIN_WIDTH, BASE_WIN_HEIGHT);
        this.group = game.add.group();
        this.group.alpha = 0;
        this.x = 0;
        this.y = 0;
        this.selected_y = 0;
        this.unselected_y = -4;
        this.cursor_base_y = 22;
        this.set_chars();
        this.cursor_group = game.add.group();
        this.cursor = this.cursor_group.create(0, 0, "cursor"),
        this.group.add(this.cursor_group);
        this.cursor.y = this.cursor_base_y;
        this.selected_button_index = 0;
        this.menu_open = false;
        this.menu_active = false;
        this.right_pressed = false;
        this.left_pressed = false;
        this.choose_timer_repeat = this.game.time.create(false);
        this.choose_timer_start = this.game.time.create(false);
        this.button_change_time = Phaser.Timer.QUARTER/2;
        this.set_control();
        this.cursor_tween = game.tweens.create(this.cursor);
        this.cursor_tween_time = Phaser.Timer.QUARTER/2;
        this.init_cursor_tween();
    }

    set_chars() {
        for (let key_name in this.char_buttons) {
            this.char_buttons[key_name].destroy();
        }
        this.char_buttons = {};
        for (let i = 0; i < party_data.members.length; ++i) {
            const char = party_data.members[i];
            this.char_buttons[char.key_name] = this.group.create(0, 0, char.key_name + "_idle");
            party_data.members[i].setAnimation(this.char_buttons[char.key_name], "idle");
            this.char_buttons[char.key_name].animations.play("idle_down");
        }
    }

    set_control() {
        game.input.keyboard.addKey(Phaser.Keyboard.ENTER).onUp.add(() => {
            if (!this.menu_open || !this.menu_active) return;
            this.data.enter_input.getSignal().halt();
            this.on_choose(this.selected_button_index);
        }, this, this.enter_propagation_priority);
        game.input.keyboard.addKey(Phaser.Keyboard.RIGHT).onDown.add(() => {
            if (!this.menu_open || !this.menu_active) return;
            if (this.left_pressed) {
                this.left_pressed = false;
                this.stop_timers();
            }
            this.right_pressed = true;
            this.set_change_timers(1);
        });
        game.input.keyboard.addKey(Phaser.Keyboard.RIGHT).onUp.add(() => {
            if (!this.menu_open || !this.menu_active || !this.right_pressed) return;
            this.right_pressed = false;
            this.stop_timers();
        });
        game.input.keyboard.addKey(Phaser.Keyboard.LEFT).onDown.add(() => {
            if (!this.menu_open || !this.menu_active) return;
            if (this.right_pressed) {
                this.right_pressed = false;
                this.stop_timers();
            }
            this.left_pressed = true;
            this.set_change_timers(-1);
        });
        game.input.keyboard.addKey(Phaser.Keyboard.LEFT).onUp.add(() => {
            if (!this.menu_open || !this.menu_active || !this.left_pressed) return;
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

    update_position() {
        this.group.x = this.game.camera.x + this.x;
        this.group.y = this.game.camera.y + this.y;
        for (let i = 0; i < party_data.members.length; ++i) {
            const char = party_data.members[i];
            this.char_buttons[char.key_name].centerX = i * SLOT_WIDTH + SLOT_WIDTH_CENTER + numbers.OUTSIDE_BORDER_WIDTH + numbers.INSIDE_BORDER_WIDTH;
            this.char_buttons[char.key_name].y = this.unselected_y;
        }
    }

    init_cursor_tween() {
        const cursor_delta = 4;
        const selected_char = this.char_buttons[party_data.members[this.selected_button_index].key_name];
        this.cursor_tween.to(
            { x: selected_char.x - cursor_delta, y: this.cursor_base_y + cursor_delta},
            this.cursor_tween_time,
            Phaser.Easing.Linear.None,
            false,
            0,
            -1,
            true
        );
    }

    set_cursor_tween() {
        const selected_char = this.char_buttons[party_data.members[this.selected_button_index].key_name];
        if (this.cursor_tween.isRunning && this.cursor_tween.isPaused) {
            this.cursor_tween.resume();
        } else if (!this.cursor_tween.isRunning) {
            this.cursor_tween.start();
            return;
        }
        this.cursor_group.x = selected_char.x;
    }

    change_button(step) {
        this.reset_button();
        this.selected_button_index = (this.selected_button_index + step) % this.buttons_number;
        if (this.selected_button_index < 0) {
            this.selected_button_index = this.buttons_number - 1;
        }
        this.on_change(this.selected_button_index);
        this.set_button();
    }

    set_button() {
        let selected_char = this.char_buttons[party_data.members[this.selected_button_index].key_name];
        selected_char.y = this.selected_y;
        this.cursor_group.x = selected_char.x;
        this.set_cursor_tween();
    }

    reset_button() {
        let selected_char = this.char_buttons[party_data.members[this.selected_button_index].key_name];
        selected_char.y = this.unselected_y;
        this.cursor_tween.pause();
    }

    open(select_index, start_active = true) {
        this.right_pressed = false;
        this.left_pressed = false;
        if (Object.keys(this.char_buttons).length != party_data.members.length) {
            this.set_chars();
        }
        this.buttons_number = party_data.members.length;
        this.selected_button_index = select_index === undefined ? 0 : select_index;
        this.update_position();
        this.set_button();
        this.base_window.show(undefined, false);
        this.group.alpha = 1;
        this.menu_active = start_active;
        this.menu_open = true;
    }

    close() {
        this.menu_open = false;
        this.stop_timers();
        this.reset_button();
        this.group.alpha = 0;
        this.base_window.close(undefined, false);
    }

    activate() {
        this.right_pressed = false;
        this.left_pressed = false;
        this.menu_active = true;
        this.set_button();
        this.cursor.alpha = 1;
        this.cursor_tween.resume();
    }

    deactivate() {
        this.menu_active = false;
        this.stop_timers();
        this.reset_button();
        this.cursor.alpha = 0;
        this.cursor_tween.pause();
    }
}
