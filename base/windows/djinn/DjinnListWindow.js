import { Window } from '../../Window.js';
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

export class DjinnListWindow {
    constructor (game, data, esc_propagation_priority, enter_propagation_priority) {
        this.game = game;
        this.data = data;
        this.base_window = new Window(this.game, WIN_X, WIN_Y, WIN_WIDTH, WIN_HEIGHT);
        this.group = this.game.add.group();
        this.chars_sprites_group = this.game.add.group();
        this.group.add(this.chars_sprites_group);
        this.window_open = false;
        this.window_active = false;
        this.esc_propagation_priority = esc_propagation_priority + 1;
        this.enter_propagation_priority = enter_propagation_priority + 1;
        this.selected_char_index = 0;
        this.selected_djinn_index = 0;
        this.page_index = 0;
        this.close_callback = null;
        this.chars_sprites = {};
        this.set_control();
    }

    update_position() {
        this.group.x = this.game.camera.x + WIN_X;
        this.group.y = this.game.camera.y + WIN_Y;
    }

    set_control() {
        this.game.input.keyboard.addKey(Phaser.Keyboard.ESC).onDown.add(() => {
            if (!this.window_open || !this.window_active) return;
            this.data.esc_input.getSignal().halt();
            this.close(this.close_callback);
        }, this, this.esc_propagation_priority);
        this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER).onDown.add(() => {
            if (!this.window_open || !this.window_active) return;
            this.data.enter_input.getSignal().halt();
            this.on_choose();
        }, this, this.enter_propagation_priority);
    }

    load_page() {
        for (let i = 0; i < CHARS_PER_PAGE; ++i) {
            const party_index = this.page_index * CHARS_PER_PAGE + i;
            if (party_index >= party_data.members.length) continue;
            const this_char = party_data.members[party_index];
            const char_key_name = this_char.key_name;
            const x = CHAR_X_PADDING + i * CHAR_X_BETWEEN;
            this.chars_sprites[char_key_name] = this.chars_sprites_group.create(x, CHAR_Y_PADDING, char_key_name + "_idle");
            this.chars_sprites[char_key_name].anchor.setTo(0.5, 1.0);
            const animation_key = "idle_down";
            this.chars_sprites[char_key_name].animations.add(animation_key, this_char.animations.idle.down, this_char.actions.idle.frame_rate, true);
            this.chars_sprites[char_key_name].animations.play(animation_key, this_char.actions.idle.frame_rate, true);
            const char_djinni = this_char.djinni;
            for (let j = 0; j < char_djinni.length; ++j) {
                const this_djinn = djinni_list[char_djinni[j]];
                const star_x = STAR_X_PADDING + i * DJINN_NAME_BETWEEN;
                const star_y = STAR_Y_PADDING + j * numbers.FONT_SIZE;
                this.base_window.create_at_group(star_x, star_y, this_djinn.element + "_star");
                const djinn_x = DJINN_NAME_X_PADDING + i * DJINN_NAME_BETWEEN;
                const djinn_y = DJINN_NAME_Y_PADDING + j * numbers.FONT_SIZE;
                this.base_window.set_text_in_position(this_djinn.name, djinn_x, djinn_y);
            }
        }
    }

    on_choose() {

    }

    open(close_callback, open_callback) {
        this.selected_char_index = 0;
        this.selected_djinn_index = 0;
        this.page_index = 0;
        this.load_page();
        this.update_position();
        this.window_open = true;
        this.window_activated = true;
        this.close_callback = close_callback;
        this.base_window.show(undefined, false);
        if (open_callback) {
            open_callback();
        }
    }

    close(close_callback) {
        this.window_open = false;
        this.window_activated = false;
        this.base_window.close(undefined, false);
        if (close_callback) {
            close_callback();
        }
    }

    activate() {
        this.window_activated = true;
    }

    deactivate() {
        this.window_activated = false;
    }
}