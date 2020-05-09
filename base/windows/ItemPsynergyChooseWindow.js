import { Window } from "../Window.js";
import { CursorControl } from "../CursorControl.js";
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
        this.element_list = this.is_psynergy_window ? abilities_list : [];
        this.element_sprite_sufix = this.is_psynergy_window ? "_ability_icon" : "";
        this.on_choose = on_choose === undefined ? () => {} : on_choose;
        this.on_change = on_change === undefined ? () => {} : on_change;
        this.esc_propagation_priority = esc_propagation_priority + 1;
        this.enter_propagation_priority = enter_propagation_priority + 1;
        this.window = new Window(this.game, PSY_OVERVIEW_WIN_X, PSY_OVERVIEW_WIN_Y, PSY_OVERVIEW_WIN_WIDTH, PSY_OVERVIEW_WIN_HEIGHT);
        this.group = game.add.group();
        this.group.alpha = 0;
        this.set_control();
        this.window_open = false;
        this.window_activated = false;
        this.close_callback = undefined;
        this.char = null;
        this.window.create_at_group(9, 97, "shift_keyboard", 0x0);
        this.window.create_at_group(8, 96, "shift_keyboard");
        this.window.create_at_group(32, 97, "tab_keyboard", 0x0);
        this.window.create_at_group(31, 96, "tab_keyboard");
        this.window.set_text_in_position(": Change Char", 49, 96);
        this.page_index = 0;
        this.text_sprites_in_window = [];
        this.icon_sprites_in_window = [];
        this.selected_element_index = 0;
        this.elements = [];
        this.cursor_control = new CursorControl(this.game, true, true, this.get_page_number.bind(this), this.get_elem_per_page.bind(this), this.group,
            this.page_change.bind(this), this.element_change.bind(this), this.get_page_index.bind(this), this.set_page_index.bind(this),
            this.get_element_index.bind(this), this.set_element_index.bind(this), this.is_open.bind(this), this.is_activated.bind(this),
            this.get_cursor_x.bind(this), this.get_cursor_y.bind(this)
        );
    }

    set_control() {
        game.input.keyboard.addKey(Phaser.Keyboard.ESC).onDown.add(() => {
            if (!this.window_open) return;
            this.data.esc_input.getSignal().halt();
            this.close();
        }, this, this.esc_propagation_priority);
    }

    is_open() {
        return this.window_open;
    }

    is_activated() {
        return this.window_activated;
    }

    get_element_index() {
        return this.selected_element_index;
    }

    set_element_index(index) {
        this.selected_element_index = index;
    }

    get_page_index() {
        return this.page_index;
    }

    set_page_index(index) {
        this.page_index = index;
    }

    get_cursor_x() {
        return -5;
    }

    get_cursor_y() {
        return ELEM_PADDING_TOP + parseInt(numbers.ICON_HEIGHT/2) + this.selected_element_index * (numbers.ICON_HEIGHT + SPACE_BETWEEN_ITEMS);
    }

    get_elem_per_page() {
        return this.elements.length;
    }

    get_page_number() {
        return parseInt(this.elements.length/ELEM_PER_PAGE) + 1;
    }

    update_position() {
        this.group.x = this.game.camera.x + PSY_OVERVIEW_WIN_X;
        this.group.y = this.game.camera.y + PSY_OVERVIEW_WIN_Y;
    }

    set_elements() {
        this.clear_sprites();
        let counter = 0;
        if (this.is_psynergy_window) {
            this.elements = this.char.abilities.filter(elem_key_name => {
                return (elem_key_name in this.element_list) && (!this.element_list[elem_key_name].in_battle || this.element_list[elem_key_name].effects_outside_battle);
            }).slice(this.page_index * ELEM_PER_PAGE, (this.page_index + 1) * ELEM_PER_PAGE);
        }
        for (let i = 0; i < this.elements.length; ++i) {
            const elem_key_name = this.elements[i];
            const y = ELEM_PADDING_TOP + counter * (numbers.ICON_HEIGHT + SPACE_BETWEEN_ITEMS);
            this.icon_sprites_in_window.push(this.window.create_at_group(ELEM_PADDING_LEFT, y, elem_key_name + this.element_sprite_sufix));
            const x_elem_name = ELEM_PADDING_LEFT + numbers.ICON_WIDTH + 2;
            this.text_sprites_in_window.push(this.window.set_text_in_position(this.element_list[elem_key_name].name, x_elem_name, y + ELEM_NAME_ICON_SHIFT));
            if (this.is_psynergy_window) {
                const x_elem_pp_cost = PSY_PP_X;
                this.text_sprites_in_window.push(this.window.set_text_in_position(this.element_list[elem_key_name].pp_cost, x_elem_pp_cost, y + ELEM_NAME_ICON_SHIFT, true));
            }
            ++counter;
        }
    }

    element_change(before_index, after_index) {

    }

    page_change(before_index, after_index) {
        this.set_elements();
    }

    clear_sprites() {
        for (let i = 0; i < this.icon_sprites_in_window.length; ++i) {
            this.window.remove_from_group(this.icon_sprites_in_window[i]);
        }
        this.icon_sprites_in_window = [];
        for (let i = 0; i < this.text_sprites_in_window.length; ++i) {
            this.window.remove_text(this.text_sprites_in_window[i]);
        }
        this.text_sprites_in_window = [];
    }

    open(char_index, close_callback, open_callback) {
        this.update_position();
        this.char = party_data.members[char_index];
        this.group.alpha = 1;
        this.close_callback = close_callback;
        this.window.show(open_callback, false);
        this.selected_element_index = 0;
        this.page_index = 0;
        this.set_elements();
        this.cursor_control.activate();
        this.window_open = true;
        this.window_activated = true;
    }

    close() {
        this.window.close(this.close_callback, false);
        this.group.alpha = 1;
        this.clear_sprites();
        this.cursor_control.deactivate();
        this.window_open = false;
        this.window_activated = false;
    }
}