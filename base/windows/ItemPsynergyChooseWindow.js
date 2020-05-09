import { Window } from "../Window.js";
import { party_data } from "../../chars/main_chars.js";
import { abilities_list } from '../../chars/abilities.js';
import * as numbers from '../../magic_numbers.js';

const PSY_OVERVIEW_WIN_X = 104;
const PSY_OVERVIEW_WIN_Y = 24;
const PSY_OVERVIEW_WIN_WIDTH = 132;
const PSY_OVERVIEW_WIN_HEIGHT = 108;
const SPACE_BETWEEN_ITEMS = 2;
const ELEM_PADDING_TOP = 10;
const ELEM_PADDING_LEFT = 8;
const ELEM_PER_PAGE = 5;
const PSY_PP_X = 125;
const ELEM_NAME_ICON_SHIFT = 4;

export class ItemPsynergyChooseWindow {
    constructor(game, data, is_psynergy_window, on_change, on_choose, esc_propagation_priority, enter_propagation_priority) {
        this.game = game;
        this.data = data;
        this.is_psynergy_window = is_psynergy_window;
        this.on_choose = on_choose === undefined ? () => {} : on_choose;
        this.on_change = on_change === undefined ? () => {} : on_change;
        this.esc_propagation_priority = esc_propagation_priority + 1;
        this.enter_propagation_priority = enter_propagation_priority + 1;
        this.window = new Window(this.game, PSY_OVERVIEW_WIN_X, PSY_OVERVIEW_WIN_Y, PSY_OVERVIEW_WIN_WIDTH, PSY_OVERVIEW_WIN_HEIGHT);
        this.set_control();
        this.window_open = false;
        this.close_callback = undefined;
        this.char = null;
        this.window.create_at_group(9, 97, "shift_keyboard", 0x0);
        this.window.create_at_group(8, 96, "shift_keyboard");
        this.window.create_at_group(32, 97, "tab_keyboard", 0x0);
        this.window.create_at_group(31, 96, "tab_keyboard");
        this.window.set_text_in_position(": Change Char", 49, 96);
        this.page_index = 0;
        this.text_sprites_in_window = [];
        this.other_sprites_in_window = [];
    }

    set_control() {
        game.input.keyboard.addKey(Phaser.Keyboard.ESC).onDown.add(() => {
            if (!this.window_open) return;
            this.data.esc_input.getSignal().halt();
            this.close();
        }, this, this.esc_propagation_priority);
    }

    set_elements() {
        let counter = 0;
        const abilities = this.char.abilities.filter(ability_key_name => {
            return (ability_key_name in abilities_list) && (!abilities_list[ability_key_name].in_battle || abilities_list[ability_key_name].effects_outside_battle);
        }).slice(this.page_index * ELEM_PER_PAGE, (this.page_index + 1) * ELEM_PER_PAGE);
        for (let i = 0; i < abilities.length; ++i) {
            const ability_key_name = abilities[i];
            const y = ELEM_PADDING_TOP + counter * (numbers.ICON_HEIGHT + SPACE_BETWEEN_ITEMS);
            this.other_sprites_in_window.push(this.window.create_at_group(ELEM_PADDING_LEFT, y, ability_key_name + "_ability_icon"));
            const x_elem_name = ELEM_PADDING_LEFT + numbers.ICON_WIDTH + 2;
            this.text_sprites_in_window.push(this.window.set_text_in_position(abilities_list[ability_key_name].name, x_elem_name, y + ELEM_NAME_ICON_SHIFT));
            if (this.is_psynergy_window) {
                const x_elem_pp_cost = PSY_PP_X;
                this.text_sprites_in_window.push(this.window.set_text_in_position(abilities_list[ability_key_name].pp_cost, x_elem_pp_cost, y + ELEM_NAME_ICON_SHIFT, true));
            }
            ++counter;
        }
    }

    open(char_index, close_callback, open_callback) {
        this.char = party_data.members[char_index];
        this.close_callback = close_callback;
        this.window.show(open_callback, false);
        this.set_elements();
        this.window_open = true;
    }

    close() {
        this.window.close(this.close_callback, false);
        for (let i = 0; i < this.other_sprites_in_window.length; ++i) {
            this.window.remove_from_group(this.other_sprites_in_window[i]);
        }
        this.other_sprites_in_window = [];
        for (let i = 0; i < this.text_sprites_in_window.length; ++i) {
            this.window.remove_text(this.text_sprites_in_window[i]);
        }
        this.text_sprites_in_window = [];
        this.window_open = false;
    }
}