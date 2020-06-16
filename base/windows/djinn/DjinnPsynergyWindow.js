import { Window } from '../../Window.js';
import { abilities_list } from '../../../initializers/abilities.js';
import * as numbers from '../../../magic_numbers.js';

const BASE_WIN_WIDTH = 116;
const BASE_WIN_HEIGHT = 116;
const BASE_WIN_X = 120;
const BASE_WIN_Y = 40;
const ELEM_PER_PAGE = 5;
const ELEM_PADDING_TOP = 12;
const ELEM_PADDING_LEFT = 8;
const SPACE_BETWEEN_ITEMS = 2;
const PSY_PP_X = 109;
const PSY_PP_COST_X = 86;
const PSY_PP_COST_Y = 8;
const ELEM_NAME_ICON_SHIFT = 4;
const FORWARD = 1;
const BACKWARD = -1;
const PSY_GAIN_COLOR = numbers.YELLOW_FONT_COLOR;
const PSY_LOST_COLOR = numbers.RED_FONT_COLOR;
const PSY_INFO_1_Y = 96;
const PSY_INFO_X = 8;
const PSY_INFO_2_Y = PSY_INFO_1_Y + 1 + numbers.FONT_SIZE;

export class DjinnPsynergyWindow {
    constructor(game, data, esc_propagation_priority, enter_propagation_priority) {
        this.game = game;
        this.data = data;
        this.window_open = false;
        this.text_sprites_in_window = [];
        this.icon_sprites_in_window = [];
        this.esc_propagation_priority = esc_propagation_priority + 1;
        this.enter_propagation_priority = enter_propagation_priority + 1;
        this.base_window = new Window(this.game, BASE_WIN_X, BASE_WIN_Y, BASE_WIN_WIDTH, BASE_WIN_HEIGHT);
        this.base_window.init_page_indicator_bar();
        this.base_window.set_text_in_position("PP", PSY_PP_COST_X, PSY_PP_COST_Y);
        this.psy_info_1_text = this.base_window.set_text_in_position("", PSY_INFO_X, PSY_INFO_1_Y);
        this.psy_info_2_text = this.base_window.set_text_in_position("", PSY_INFO_X, PSY_INFO_2_Y);
        this.set_control();
    }

    set_control() {
        this.game.input.keyboard.addKey(Phaser.Keyboard.ESC).onDown.add(() => {
            if (!this.window_open) return;
            this.data.esc_input.getSignal().halt();
            this.change_status = false;
            this.close(this.close_callback);
        }, this, this.esc_propagation_priority);
        this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER).onDown.add(() => {
            if (!this.window_open) return;
            this.data.enter_input.getSignal().halt();
            this.change_status = true;
            this.close(this.close_callback);
        }, this, this.enter_propagation_priority);
        this.game.input.keyboard.addKey(Phaser.Keyboard.RIGHT).onDown.add(() => {
            if (!this.window_open) return;
            this.change_page(FORWARD);
        });
        this.game.input.keyboard.addKey(Phaser.Keyboard.LEFT).onDown.add(() => {
            if (!this.window_open) return;
            this.change_page(BACKWARD);
        });
    }

    set_page_number() {
        const list_length = this.all_abilities.length;
        this.page_number = parseInt((list_length - 1)/ELEM_PER_PAGE) + 1;
        if (this.page_index >= this.page_number) {
            this.page_index = this.page_number - 1;
        }
    }

    change_page(page_shift) {
        this.page_index += page_shift;
        if (this.page_index === this.page_number) {
            this.page_index = 0;
        } else if (this.page_index < 0) {
            this.page_index = this.page_number - 1;
        }
        this.set_abilities_list();
        this.base_window.set_page_indicator_highlight(this.page_number, this.page_index);
    }

    set_abilities_list() {
        this.clear_sprites();
        this.abilities = this.all_abilities.slice(this.page_index * ELEM_PER_PAGE, (this.page_index + 1) * ELEM_PER_PAGE);
        for (let i = 0; i < this.abilities.length; ++i) {
            const key_name = this.abilities[i];
            const x = ELEM_PADDING_LEFT;
            const y = ELEM_PADDING_TOP + i * (numbers.ICON_HEIGHT + SPACE_BETWEEN_ITEMS);
            const icon_x = x + (numbers.ICON_WIDTH >> 1);
            const icon_y = y + (numbers.ICON_HEIGHT >> 1);
            const icon_key = key_name + "_ability_icon";
            const x_elem_name = ELEM_PADDING_LEFT + numbers.ICON_WIDTH + 2;
            const psynergy_name_sprite = this.base_window.set_text_in_position(abilities_list[key_name].name, x_elem_name, y + ELEM_NAME_ICON_SHIFT);
            this.text_sprites_in_window.push(psynergy_name_sprite);
            this.icon_sprites_in_window.push(this.base_window.create_at_group(icon_x, icon_y, icon_key));
            this.icon_sprites_in_window[i].anchor.setTo(0.5, 0.5);
            const psynergy_cost_sprite = this.base_window.set_text_in_position(abilities_list[key_name].pp_cost, PSY_PP_X, y + ELEM_NAME_ICON_SHIFT, true);
            this.text_sprites_in_window.push(psynergy_cost_sprite);
            if (this.gained_abilities.includes(key_name)) {
                this.base_window.update_text_color(PSY_GAIN_COLOR, psynergy_name_sprite);
                this.base_window.update_text_color(PSY_GAIN_COLOR, psynergy_cost_sprite);
            } else if (this.lost_abilities.includes(key_name)) {
                this.base_window.update_text_color(PSY_LOST_COLOR, psynergy_name_sprite);
                this.base_window.update_text_color(PSY_LOST_COLOR, psynergy_cost_sprite);
            }
        }
    }

    set_abilities() {
        this.current_abilities = this.char.abilities.filter(key_name => {
            return key_name in abilities_list;
        });
        const preview_values = this.char.preview_djinn_change([], this.djinn.key_name, this.next_djinn_status);
        this.next_abilities = preview_values.abilities.filter(key_name => {
            return key_name in abilities_list;
        });
        let current_set = new Set(this.current_abilities);
        let next_set = new Set(this.next_abilities);
        this.gained_abilities = [...next_set].filter(x => !current_set.has(x));
        this.lost_abilities = [...current_set].filter(x => !next_set.has(x));
        this.intersection_abilities = [...current_set].filter(x => next_set.has(x));
        this.all_abilities = this.gained_abilities.concat(this.intersection_abilities, this.lost_abilities);
        if (this.gained_abilities.length === 0 && this.lost_abilities.length === 0) {
            this.base_window.update_text("* No change", this.psy_info_1_text);
            this.base_window.update_text_color(numbers.DEFAULT_FONT_COLOR, this.psy_info_1_text);
            this.base_window.update_text("", this.psy_info_2_text);
        } else if (this.gained_abilities.length && this.lost_abilities.length === 0) {
            this.base_window.update_text("* Psynergy Gained", this.psy_info_1_text);
            this.base_window.update_text_color(PSY_GAIN_COLOR, this.psy_info_1_text);
            this.base_window.update_text("", this.psy_info_2_text);
        } else if (this.gained_abilities.length === 0 && this.lost_abilities.length) {
            this.base_window.update_text("* Psynergy Lost", this.psy_info_1_text);
            this.base_window.update_text_color(PSY_LOST_COLOR, this.psy_info_1_text);
            this.base_window.update_text("", this.psy_info_2_text);
        } else if (this.gained_abilities.length && this.lost_abilities.length) {
            this.base_window.update_text("* Psynergy Gained", this.psy_info_1_text);
            this.base_window.update_text_color(PSY_GAIN_COLOR, this.psy_info_1_text);
            this.base_window.update_text("* Psynergy Lost", this.psy_info_2_text);
            this.base_window.update_text_color(PSY_LOST_COLOR, this.psy_info_2_text);
        }
    }

    mount_window() {
        this.set_abilities();
        this.set_abilities_list();
        this.set_page_number();
        this.base_window.set_page_indicator(this.page_number, this.page_index);
    }

    clear_sprites() {
        for (let i = 0; i < this.icon_sprites_in_window.length; ++i) {
            this.base_window.remove_from_group(this.icon_sprites_in_window[i]);
        }
        this.icon_sprites_in_window = [];
        for (let i = 0; i < this.text_sprites_in_window.length; ++i) {
            this.base_window.remove_text(this.text_sprites_in_window[i]);
        }
        this.text_sprites_in_window = [];
    }

    open(char, djinn, next_djinn_status, close_callback, callback) {
        this.char = char;
        this.djinn = djinn;
        this.next_djinn_status = next_djinn_status;
        this.close_callback = close_callback;
        this.change_status = false;
        this.page_index = 0;
        this.mount_window();
        this.base_window.show(() => {
            this.window_open = true;
            if (callback !== undefined) {
                callback();
            }
        }, false);
    }

    close(callback) {
        this.clear_sprites();
        this.base_window.unset_page_indicator();
        this.base_window.close(() => {
            this.window_open = false;
            if (callback !== undefined) {
                callback(this.change_status);
            }
        }, false);
    }
}