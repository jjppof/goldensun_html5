import { Window } from '../../Window.js';
import { djinn_status } from '../../Djinn.js';
import { CursorControl } from '../../utils/CursorControl.js';
import * as numbers from '../../../magic_numbers.js';
import { party_data } from '../../../chars/main_chars.js';
import { djinni_list } from '../../../chars/djinni.js';

const WIN_WIDTH = 236;
const WIN_HEIGHT = 116;
const WIN_X = 0;
const WIN_Y = 40;
const CHAR_X_PADDING = 32;
const CHAR_Y_PADDING = 23;
const CHAR_X_BETWEEN = 56;
const CHARS_PER_PAGE = 4;
const HIGHLIGHT_HEIGHT = 8;
const HIGHLIGHT_WIDTH = 48;
const HIGHLIGHT_X_PADDING = 16;
const HIGHLIGHT_Y_PADDING = 24;
const DJINN_NAME_X_PADDING = 24;
const DJINN_NAME_Y_PADDING = 24;
const STAR_X_PADDING = HIGHLIGHT_X_PADDING + 1;
const STAR_Y_PADDING = HIGHLIGHT_Y_PADDING + 1;
const DJINN_NAME_BETWEEN = 56;
const RECOVERY_COLOR = 0xF8F840;
const STANDBY_COLOR = 0xF80000;
const SET_COLOR = numbers.DEFAULT_FONT_COLOR;

export class DjinnListWindow {
    constructor (game, data, esc_propagation_priority, enter_propagation_priority, shift_propagation_priority) {
        this.game = game;
        this.data = data;
        this.base_window = new Window(this.game, WIN_X, WIN_Y, WIN_WIDTH, WIN_HEIGHT);
        this.group = this.game.add.group();
        this.chars_sprites_group = this.game.add.group();
        this.group.add(this.chars_sprites_group);
        this.window_open = false;
        this.window_active = false;
        this.changing_djinn_status = false;
        this.esc_propagation_priority = esc_propagation_priority + 1;
        this.enter_propagation_priority = enter_propagation_priority + 1;
        this.shift_propagation_priority = shift_propagation_priority + 1;
        this.selected_char_index = 0;
        this.selected_djinn_index = 0;
        this.page_index = 0;
        this.close_callback = null;
        this.chars_sprites = {};
        this.page_number_bar_highlight = this.game.add.graphics(0, 0);
        this.page_number_bar_highlight.blendMode = PIXI.blendModes.SCREEN;
        this.base_window.add_sprite_to_group(this.page_number_bar_highlight);
        this.page_number_bar_highlight.beginFill(this.base_window.color, 1);
        this.page_number_bar_highlight.drawRect(0, 0, HIGHLIGHT_WIDTH, HIGHLIGHT_HEIGHT);
        this.page_number_bar_highlight.endFill();
        this.cursor_control = new CursorControl(this.game, true, true, this.get_max_chars.bind(this),
            this.get_max_djinn.bind(this), this.group, this.on_char_change.bind(this), this.on_djinn_change.bind(this),
            this.get_char_index.bind(this), this.set_char_index.bind(this), this.get_djinn_index.bind(this),
            this.set_djinn_index.bind(this), this.is_open.bind(this), this.is_active.bind(this),
            this.get_x_cursor.bind(this), this.get_y_cursor.bind(this)
        );
        this.sizes = [];
        this.djinn_names = [];
        this.set_control();
    }

    update_position() {
        this.group.x = this.game.camera.x + WIN_X;
        this.group.y = this.game.camera.y + WIN_Y;
    }

    set_control() {
        this.game.input.keyboard.addKey(Phaser.Keyboard.ESC).onDown.add(() => {
            if (!this.window_open || !this.window_active || !this.changing_djinn_status) return;
            this.data.esc_input.getSignal().halt();
        }, this, this.esc_propagation_priority);
        this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER).onDown.add(() => {
            if (!this.window_open || !this.window_active) return;
            this.data.enter_input.getSignal().halt();
            this.on_choose();
        }, this, this.enter_propagation_priority);
        data.shift_input.add(() => {
            if (!this.window_open || !this.window_active) return;
            this.data.shift_input.halt();
            this.change_djinn_status();
        }, this, this.shift_propagation_priority);
    }

    get_x_cursor() {
        return HIGHLIGHT_X_PADDING + this.selected_char_index * DJINN_NAME_BETWEEN - 14;
    }

    get_y_cursor() {
        return HIGHLIGHT_Y_PADDING + this.selected_djinn_index * numbers.FONT_SIZE + 3;
    }

    is_open() {
        return this.window_open;
    }

    is_active() {
        return this.window_active;
    }

    get_char_index() {
        return this.selected_char_index;
    }

    set_char_index(index) {
        this.selected_char_index = index;
    }

    get_djinn_index() {
        return this.selected_djinn_index;
    }

    set_djinn_index(index) {
        this.selected_djinn_index = index;
    }

    get_max_chars() {
        return this.sizes.length;
    }

    get_max_djinn() {
        return this.sizes[this.selected_char_index];
    }

    load_page() {
        this.sizes = [];
        this.djinn_names = [];
        for (let i = 0; i < CHARS_PER_PAGE; ++i) {
            const party_index = this.page_index * CHARS_PER_PAGE + i;
            if (party_index >= party_data.members.length) continue;
            const this_char = party_data.members[party_index];
            const char_key_name = this_char.key_name;
            if (!(char_key_name in this.chars_sprites)) {
                this.chars_sprites[char_key_name] = this.chars_sprites_group.create(0, 0, char_key_name + "_idle");
                this.chars_sprites[char_key_name].anchor.setTo(0.5, 1.0);
                this.chars_sprites[char_key_name].animations.add("idle_down", this_char.animations.idle.down, this_char.actions.idle.frame_rate, true);
            }
            this.chars_sprites[char_key_name].animations.play("idle_down", this_char.actions.idle.frame_rate, true);
            const x = CHAR_X_PADDING + i * CHAR_X_BETWEEN;
            this.chars_sprites[char_key_name].x = x;
            this.chars_sprites[char_key_name].y = CHAR_Y_PADDING;
            this.chars_sprites[char_key_name].alpha = 1;
            const char_djinni = this_char.djinni;
            this.sizes.push(char_djinni.length);
            let this_djinn_names = [];
            for (let j = 0; j < char_djinni.length; ++j) {
                const this_djinn = djinni_list[char_djinni[j]];
                const star_x = STAR_X_PADDING + i * DJINN_NAME_BETWEEN;
                const star_y = STAR_Y_PADDING + j * numbers.FONT_SIZE;
                this.base_window.create_at_group(star_x, star_y, this_djinn.element + "_star");
                const djinn_x = DJINN_NAME_X_PADDING + i * DJINN_NAME_BETWEEN;
                const djinn_y = DJINN_NAME_Y_PADDING + j * numbers.FONT_SIZE;
                let color;
                switch (this_djinn.status) {
                    case djinn_status.SET: color = SET_COLOR; break;
                    case djinn_status.STANDBY: color = STANDBY_COLOR; break;
                    case djinn_status.RECOVERY: color = RECOVERY_COLOR; break;
                }
                const djinn_name = this.base_window.set_text_in_position(this_djinn.name, djinn_x, djinn_y, false, false, color);
                this_djinn_names.push(djinn_name);
            }
            this.djinn_names.push(this_djinn_names);
        }
    }

    unset_char_sprites() {
        for (let key in this.chars_sprites) {
            this.chars_sprites[key].animations.stop();
            this.chars_sprites[key].alpha = 0;
        }
    }

    set_highlight_bar() {
        this.page_number_bar_highlight.x = HIGHLIGHT_X_PADDING + this.selected_char_index * DJINN_NAME_BETWEEN;
        this.page_number_bar_highlight.y = HIGHLIGHT_Y_PADDING + this.selected_djinn_index * numbers.FONT_SIZE;
    }

    on_char_change(before_index, after_index) {
        this.selected_char_index = after_index;
        if (this.selected_djinn_index >= this.sizes[this.selected_char_index]) {
            this.selected_djinn_index = this.sizes[this.selected_char_index] - 1;
            this.cursor_control.set_cursor_position();
        }
        this.set_highlight_bar();
    }

    on_djinn_change(before_index, after_index) {
        this.selected_djinn_index = after_index;
        this.set_highlight_bar();
    }

    on_choose() {

    }

    change_djinn_status() {
        const this_char = party_data.members[this.selected_char_index];
        const this_djinn = djinni_list[this_char.djinni[this.selected_djinn_index]];
        if (this_djinn.status === djinn_status.SET) {
            this_djinn.set_status(djinn_status.STANDBY, this_char);
            this.base_window.update_text_color(STANDBY_COLOR, this.djinn_names[this.selected_char_index][this.selected_djinn_index]);
            this.chars_quick_info_window.update_text();
        } else if (this_djinn.status === djinn_status.STANDBY) {
            this_djinn.set_status(djinn_status.SET, this_char);
            this.base_window.update_text_color(SET_COLOR, this.djinn_names[this.selected_char_index][this.selected_djinn_index]);
            this.chars_quick_info_window.update_text();
        }
    }

    open(chars_quick_info_window, close_callback, open_callback) {
        this.selected_char_index = 0;
        this.selected_djinn_index = 0;
        this.page_index = 0;
        this.chars_quick_info_window = chars_quick_info_window;
        this.load_page();
        this.update_position();
        this.set_highlight_bar();
        this.cursor_control.activate();
        this.window_open = true;
        this.window_active = true;
        this.changing_djinn_status = false;
        this.close_callback = close_callback;
        this.base_window.show(undefined, false);
        if (open_callback) {
            open_callback();
        }
    }

    close(close_callback) {
        this.window_open = false;
        this.window_active = false;
        this.cursor_control.deactivate();
        this.unset_char_sprites();
        this.base_window.close(undefined, false);
        if (close_callback) {
            close_callback();
        }
    }

    activate() {
        this.window_active = true;
        this.cursor_control.activate();
    }

    deactivate() {
        this.window_active = false;
        this.cursor_control.deactivate();
    }
}