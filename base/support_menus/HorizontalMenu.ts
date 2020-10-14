import { get_text_width } from '../utils';
import * as numbers from '../magic_numbers';
import { Window } from '../Window';
import { GoldenSun } from '../GoldenSun';
import * as _ from "lodash";

const FORWARD = 1;
const BACKWARD = -1;
const BUTTON_WIDTH = 24;
const BUTTON_HEIGHT = 24;
const BUTTON_Y = numbers.GAME_HEIGHT - BUTTON_HEIGHT;
const TITLE_WINDOW_HEIGHT = BUTTON_HEIGHT - numbers.OUTSIDE_BORDER_WIDTH - numbers.INSIDE_BORDER_WIDTH;

/*A horizontal menu
Used in Battle Menus and the field Menu

Input: game [Phaser:Game] - Reference to the running game object
       data [GoldenSun] - Reference to the main JS Class instance
       buttons [array] - The button keys (array of string)
       titles [array] - The names of the buttons (array of string)
       on_choose [function] - Callback executed on "Choose" option
       enter_propagation_priority [number] - Counts parent-child status for Enter key (Choose/Select)
       on_cancel [function] - Callback executed on "Cancel" option
       esc_propagation_priority [number] - Counts parent-child status for ESC key (Cancel/Back)
       title_window_width [number] - The width of the title window
       dock_right [boolean] - If true, places the menu on the right side of the screen*/
export class HorizontalMenu {
    public game: Phaser.Game;
    public data: GoldenSun;
    public buttons_keys: string[];
    public titles: string[];
    public buttons_number: number;
    public enter_propagation_priority: number;
    public esc_propagation_priority: number;
    public title_window_width: number;
    public dock_right: boolean;
    public x: number;
    public y: number;
    public title_window: Window;
    public group: Phaser.Group;
    public selected_button_index: number;
    public menu_open: boolean;
    public menu_active: boolean;
    public selected_button_tween: Phaser.Tween;
    public choose_timer_repeat: Phaser.Timer;
    public choose_timer_start: Phaser.Timer;
    public on_choose: Function;
    public on_cancel: Function;
    public right_pressed: boolean;
    public left_pressed: boolean;
    public signal_bindings: Phaser.SignalBinding[];
    public buttons: {
        sprite: Phaser.Sprite,
        title: string
    }[];

    constructor(game, data, buttons, titles, on_choose, enter_propagation_priority, on_cancel, esc_propagation_priority, title_window_width?, dock_right = false) {
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
        this.signal_bindings = this.set_control();
    }

    /*Manages interaction with the parent menu
    Passes control over to the Choose/Cancel functions
    Manages the Left/Right interaction within the menu*/
    set_control() {
        return [
            this.data.enter_input.add(() => {
                if (!this.menu_open || !this.menu_active) return;
                this.data.enter_input.halt();
                this.on_choose(this.selected_button_index);
            }, this, this.enter_propagation_priority),
            this.data.esc_input.add(() => {
                if (!this.menu_open || !this.menu_active) return;
                this.data.esc_input.halt();
                this.on_cancel();
            }, this, this.esc_propagation_priority),
            this.game.input.keyboard.addKey(Phaser.Keyboard.RIGHT).onDown.add(() => {
                if (!this.menu_open || !this.menu_active) return;
                if (this.left_pressed) {
                    this.left_pressed = false;
                    this.stop_timers();
                }
                this.right_pressed = true;
                this.set_change_timers(FORWARD);
            }),
            this.game.input.keyboard.addKey(Phaser.Keyboard.RIGHT).onUp.add(() => {
                if (!this.menu_open || !this.menu_active || !this.right_pressed) return;
                this.right_pressed = false;
                this.stop_timers();
            }),
            this.game.input.keyboard.addKey(Phaser.Keyboard.LEFT).onDown.add(() => {
                if (!this.menu_open || !this.menu_active) return;
                if (this.right_pressed) {
                    this.right_pressed = false;
                    this.stop_timers();
                }
                this.left_pressed = true;
                this.set_change_timers(BACKWARD);
            }),
            this.game.input.keyboard.addKey(Phaser.Keyboard.LEFT).onUp.add(() => {
                if (!this.menu_open || !this.menu_active || !this.left_pressed) return;
                this.left_pressed = false;
                this.stop_timers();
            })
        ];
    }

    /*Creates the sprites for the buttons

    Input: filtered_buttons [array] - Buttons to mount*/
    mount_buttons(filtered_buttons = []) {
        const buttons = this.buttons_keys.filter(key => !filtered_buttons.includes(key));
        this.buttons_number = buttons.length;
        const total_width = BUTTON_WIDTH * this.buttons_number + this.title_window_width + (numbers.OUTSIDE_BORDER_WIDTH << 1) + 2;
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
            this.buttons[i].sprite.centerX = (BUTTON_WIDTH * (i + 0.5)) | 0;
            this.buttons[i].sprite.centerY = (BUTTON_HEIGHT >> 1) | 0;
        }
    }

    /*Sets the timer to trigger another menu button change
    If the input key is held down, multiple button changes will occur

    step=1, select the next button (right)
    step=-1, select the previous button (left)
    This selection will loop over if necessary

    Input: step [number] - The step increase/decrease*/
    set_change_timers(step) {
        this.change_button(step);
        this.choose_timer_start.add(Phaser.Timer.QUARTER, () => {
            this.choose_timer_repeat.loop(Phaser.Timer.QUARTER >> 1, this.change_button.bind(this, step));
            this.choose_timer_repeat.start();
        });
        this.choose_timer_start.start();
    }

    /*Stops the button change timers*/
    stop_timers() {
        this.choose_timer_start.stop();
        this.choose_timer_repeat.stop();
    }

    /*Moves the button selection by a given value
    
    step=1, select the next button (right)
    step=-1, select the previous button (left)
    This selection will loop over if necessary

    Input: step [number] - The step increase/decrease*/
    change_button(step) {
        this.reset_button();
        this.selected_button_index = (this.selected_button_index + step) % this.buttons_number;
        if (this.selected_button_index < 0) {
            this.selected_button_index = this.buttons_number - 1;
        }
        this.title_window.set_text([[this.buttons[this.selected_button_index].title]]);
        this.set_button();
    }

    /*Resets the current button and sets the new button
    Updates the text on the title window

    Input: index [number] - The new button's index*/
    set_to_position(index) {
        this.reset_button();
        this.selected_button_index = index;
        this.title_window.set_text([[this.buttons[this.selected_button_index].title]]);
        this.set_button();
    }

    /*Scales the button up and adds a gradual flicker effect
    Places the button on top of the remaining, layer-wise*/
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

    /*Scales the button to its original size
    Disables the flicker effect*/
    reset_button() {
        if (this.buttons[this.selected_button_index]) {
            this.buttons[this.selected_button_index].sprite.scale.setTo(1.0, 1.0);
        }
        if (this.selected_button_tween) {
            this.selected_button_tween.stop();
        }
    }

    /*Updates the menu's position*/
    update_position() {
        this.group.x = this.game.camera.x + this.x;
        this.group.y = this.game.camera.y + this.y;
        this.title_window.update(true);
    }

    /*Opens this window
    Input: callback [function] - Callback function (Optional)
           select_index [number] - Default selected button index
           start_active [boolean] - If true, sets this window to "active" mode*/
    open(callback?, select_index?, start_active = true) {
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

    /*Closes this window
    
    Input: callback [function] - Callback function (Optional)
           animate [boolean] - If true, will play an animation while closing*/
    close(callback?, animate = true) {
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

    /*Enables the "active" state for this window*/
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

    /*Disables the "active" state for this window
    
    Input: hide [boolean] - If true, hides the buttons*/
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

    /*Destroys this menu and its components*/
    destroy() {
        this.title_window.destroy(false);
        this.group.destroy();
        this.choose_timer_repeat.destroy();
        this.choose_timer_start.destroy();
        this.signal_bindings.forEach(signal_binding => {
            signal_binding.detach();
        });
    }
}