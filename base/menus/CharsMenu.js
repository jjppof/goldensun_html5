import { Window } from '../Window.js';
import { party_data } from '../../initializers/main_chars.js';
import * as numbers from '../../magic_numbers.js';
import { CursorControl } from '../utils/CursorControl.js';

const BASE_WIN_WIDTH = 100;
const BASE_WIN_HEIGHT = 36;
const MAX_PER_LINE = 4;
const WORKING_WIDTH = BASE_WIN_WIDTH - 2 * (numbers.OUTSIDE_BORDER_WIDTH + numbers.INSIDE_BORDER_WIDTH);
const SLOT_WIDTH = parseInt(WORKING_WIDTH/MAX_PER_LINE);
const SLOT_WIDTH_CENTER = parseInt(WORKING_WIDTH/MAX_PER_LINE/2);

export class CharsMenu {
    constructor(game, data, on_choose, on_change, on_cancel, esc_propagation_priority, enter_propagation_priority) {
        this.game = game;
        this.data = data;
        this.enter_propagation_priority = enter_propagation_priority;
        this.esc_propagation_priority = esc_propagation_priority;
        this.on_choose = on_choose === undefined ? () => {} : on_choose;
        this.on_change = on_change === undefined ? () => {} : on_change;
        this.on_cancel = on_cancel === undefined ? () => {} : on_cancel;
        this.base_window = new Window(this.game, 0, 0, BASE_WIN_WIDTH, BASE_WIN_HEIGHT);
        this.group = game.add.group();
        this.group.alpha = 0;
        this.x = 0;
        this.y = 0;
        this.selected_y = 0;
        this.unselected_y = -4;
        this.set_chars();
        this.selected_button_index = 0;
        this.line_index = 0;
        this.menu_open = false;
        this.menu_active = false;
        this.set_control();
        this.cursor_control = new CursorControl(this.game, true, false, this.get_max_per_line.bind(this), undefined, this.group,
            this.change_button.bind(this), undefined, this.get_selected_button_index.bind(this), this.set_selected_button_index.bind(this),
            undefined, undefined, this.is_open.bind(this), this.is_activated.bind(this), this.get_cursor_x.bind(this),
            this.get_cursor_y.bind(this)
        );
    }

    get_cursor_x() {
        return this.char_buttons[party_data.members[this.selected_button_index].key_name].x;
    }

    get_cursor_y() {
        return 22;
    }

    get_max_per_line() {
        return party_data.members.slice(this.line_index * MAX_PER_LINE, (this.line_index + 1) * MAX_PER_LINE).length;
    }

    get_selected_button_index() {
        return this.selected_button_index;
    }

    set_selected_button_index(index) {
        this.selected_button_index = index;
    }

    is_open() {
        return this.menu_open;
    }

    is_activated() {
        return this.menu_active;
    }

    set_chars() {
        for (let key_name in this.char_buttons) {
            this.char_buttons[key_name].destroy();
        }
        this.char_buttons = {};
        for (let i = 0; i < party_data.members.length; ++i) {
            const char = party_data.members[i];
            this.char_buttons[char.key_name] = this.group.create(0, 0, char.key_name + "_idle");
            party_data.members[i].sprite_base.setAnimation(this.char_buttons[char.key_name], "idle");
            this.char_buttons[char.key_name].animations.play("idle_down");
        }
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

    change_button(old_index, new_index) {
        this.reset_button(old_index);
        this.on_change(new_index);
        this.set_button(new_index);
    }

    set_button(index) {
        let selected_char = this.char_buttons[party_data.members[index].key_name];
        selected_char.y = this.selected_y;
    }

    reset_button(index) {
        let selected_char = this.char_buttons[party_data.members[index].key_name];
        selected_char.y = this.unselected_y;
    }

    set_char_by_index(party_index) {
        this.reset_button(this.selected_button_index);
        this.selected_button_index = party_index;
        this.set_button(this.selected_button_index);
    }

    open(select_index, start_active = true) {
        if (Object.keys(this.char_buttons).length != party_data.members.length) {
            this.set_chars();
        }
        this.buttons_number = party_data.members.length;
        this.selected_button_index = select_index === undefined ? 0 : select_index;
        this.line_index = 0;
        this.update_position();
        this.set_button(this.selected_button_index);
        this.base_window.show(undefined, false);
        this.group.alpha = 1;
        this.menu_active = start_active;
        this.cursor_control.activate();
        this.menu_open = true;
    }

    close() {
        this.menu_open = false;
        this.reset_button(this.selected_button_index);
        this.group.alpha = 0;
        this.cursor_control.deactivate();
        this.base_window.close(undefined, false);
    }

    activate() {
        this.menu_active = true;
        this.cursor_control.activate();
    }

    deactivate() {
        this.menu_active = false;
        this.cursor_control.deactivate();
    }
}
