import { Window } from '../../Window.js';
import { abilities_list } from '../../../initializers/abilities.js';
import * as numbers from '../../../magic_numbers.js';

const BASE_WIN_WIDTH = 164;
const BASE_WIN_HEIGHT = 84;
const BASE_WIN_EXPANDED_HEIGHT = 108;
const BASE_WIN_X = 72;
const BASE_WIN_Y = 72;
const BASE_WIN_EXPANDED_X = 0;
const BASE_WIN_EXPANDED_Y = 40;
const ELEM_PER_PAGE = 5;
const ELEM_PADDING_TOP = 5;
const ELEM_PADDING_LEFT = 10;
const SPACE_BETWEEN_ITEMS = 2;
const PSY_PP_X = 126; //right align
const ELEM_NAME_ICON_SHIFT = 4;
const FORWARD = 1;
const BACKWARD = -1;
const PSY_GAIN_COLOR = numbers.YELLOW_FONT_COLOR;
const PSY_LOST_COLOR = numbers.RED_FONT_COLOR;
const PSY_INFO_1_Y = 89;
const PSY_INFO_X = 40;
const PSY_INFO_2_Y = PSY_INFO_1_Y + 1 + numbers.FONT_SIZE;

export class PsynergyWindow {
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
        this.set_control();
    }

    set_control() {
        this.data.esc_input.add(() => {
            if (!this.window_open) return;
            this.data.esc_input.halt();
            this.close(this.close_callback);
        }, this, this.esc_propagation_priority);
        this.data.enter_input.add(() => {
            if (!this.window_open) return;
            this.data.enter_input.halt();
            this.choosen_ability = this.abilities[this.ability_index];
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
            const x_elem_name = ELEM_PADDING_LEFT + numbers.ICON_WIDTH + 2;
            const psynergy_name_sprite = this.base_window.set_text_in_position(abilities_list[key_name].name, x_elem_name, y + ELEM_NAME_ICON_SHIFT);
            this.text_sprites_in_window.push(psynergy_name_sprite);
            this.icon_sprites_in_window.push(this.base_window.create_at_group(icon_x, icon_y, "abilities_icons", undefined, key_name));
            this.icon_sprites_in_window[i].anchor.setTo(0.5, 0.5);
            const psynergy_cost_sprite = this.base_window.set_text_in_position(abilities_list[key_name].pp_cost, PSY_PP_X, y + ELEM_NAME_ICON_SHIFT, true);
            this.text_sprites_in_window.push(psynergy_cost_sprite);
            if (this.expanded) {
                if (this.gained_abilities.includes(key_name)) {
                    this.base_window.update_text_color(PSY_GAIN_COLOR, psynergy_name_sprite);
                    this.base_window.update_text_color(PSY_GAIN_COLOR, psynergy_cost_sprite);
                } else if (this.lost_abilities.includes(key_name)) {
                    this.base_window.update_text_color(PSY_LOST_COLOR, psynergy_name_sprite);
                    this.base_window.update_text_color(PSY_LOST_COLOR, psynergy_cost_sprite);
                }
            }
        }
    }

    set_abilities() {
        this.current_abilities = this.char.abilities.filter(key_name => {
            return key_name in abilities_list && abilities_list[key_name].is_battle_psynergy;
        });
        this.all_abilities= this.current_abilities;
        if (this.expanded) {
            const preview_values = this.char.preview_djinn_change([], this.djinni.map(d => d.key_name), this.next_djinni_status);
            this.next_abilities = preview_values.abilities.filter(key_name => {
                return key_name in abilities_list;
            });
            let current_set = new Set(this.current_abilities);
            let next_set = new Set(this.next_abilities);
            this.gained_abilities = [...next_set].filter(x => !current_set.has(x));
            this.lost_abilities = [...current_set].filter(x => !next_set.has(x));
            this.intersection_abilities = [...current_set].filter(x => next_set.has(x));
            this.all_abilities = this.gained_abilities.concat(this.intersection_abilities, this.lost_abilities);
            this.psy_info_1_text = this.base_window.set_text_in_position("", PSY_INFO_X, PSY_INFO_1_Y);
            this.psy_info_2_text = this.base_window.set_text_in_position("", PSY_INFO_X, PSY_INFO_2_Y);
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
    }

    mount_window() {
        this.set_abilities();
        this.set_abilities_list();
        this.set_page_number();
        if (this.expanded) {
            this.base_window.update_size({height: BASE_WIN_EXPANDED_HEIGHT});
            this.base_window.update_position({x: BASE_WIN_EXPANDED_X, y: BASE_WIN_EXPANDED_Y});
        } else {
            this.base_window.update_size({height: BASE_WIN_HEIGHT});
            this.base_window.update_position({x: BASE_WIN_X, y: BASE_WIN_Y});
        }
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
        if (this.psy_info_1_text) {
            this.base_window.remove_text(this.psy_info_1_text);
            this.psy_info_1_text = null;
        }
        if (this.psy_info_2_text) {
            this.base_window.remove_text(this.psy_info_2_text);
            this.psy_info_2_text = null;
        }
        this.text_sprites_in_window = [];
    }

    // update_info(char, djinni, next_djinni_status) {
    //     this.clear_sprites();
    //     this.base_window.unset_page_indicator();
    //     this.char = char;
    //     this.djinni = djinni;
    //     this.next_djinni_status = next_djinni_status;
    //     this.page_index = 0;
    //     this.mount_window();
    // }

    open(char, djinni, next_djinni_status, close_callback, expanded = false, hidden = false, callback = undefined) {
        this.char = char;
        this.djinni = djinni;
        this.next_djinni_status = next_djinni_status;
        this.close_callback = close_callback;
        this.choosen_ability = null;
        this.expanded = expanded;
        this.page_index = 0;
        this.ability_index = 0;
        this.mount_window();
        if (hidden) {
            this.window_open = true;
            return;
        }
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
                callback(this.choosen_ability);
            }
        }, false);
    }
}