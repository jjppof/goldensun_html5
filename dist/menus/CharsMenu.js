import { Window } from '../Window.js';
import * as numbers from '../../magic_numbers.js';
import { CursorControl } from '../utils/CursorControl.js';
import { base_actions, directions, reverse_directions } from '../utils.js';

const BASE_WIN_WIDTH = 100;
const BASE_WIN_HEIGHT = 36;
const MAX_PER_LINE = 4;
const WORKING_WIDTH = BASE_WIN_WIDTH - 2 * (numbers.OUTSIDE_BORDER_WIDTH + numbers.INSIDE_BORDER_WIDTH);
const SLOT_WIDTH = parseInt(WORKING_WIDTH/MAX_PER_LINE);
const SLOT_WIDTH_CENTER = parseInt(WORKING_WIDTH/MAX_PER_LINE/2);

/*A window template showing character sprites
Displays characters in line, using their idle animations
Used for Psynergy and Item menus

Input: game [Phaser:Game] - Reference to the running game object
       data [GoldenSun] - Reference to the main JS Class instance
       on_choose [function] - Callback executed on "Choose" option
       on_cancel [function] - Callback executed on "Cancel" option
       esc_propagation_priority [number] - Counts parent-child status for ESC key (Cancel/Back)
       enter_propagation_priority [number] - Counts parent-child status for Enter key (Choose/Select)*/
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

    /*Returns the cursor's x value
    
    Output: [number]*/
    get_cursor_x() {
        return this.char_buttons[this.data.info.party_data.members[this.selected_button_index].key_name].x;
    }

    /*Returns the cursor's y value
    
    Output: [number]*/
    get_cursor_y() {
        return 22;
    }

    /*Returns the maximum number of characters per line
    
    Output: [number]*/
    get_max_per_line() {
        return this.data.info.party_data.members.slice(this.line_index * MAX_PER_LINE, (this.line_index + 1) * MAX_PER_LINE).length;
    }

    /*Returns the index for the selected character button
    
    Output: [number]*/
    get_selected_button_index() {
        return this.selected_button_index;
    }

    /*Sets an index for the selected character button
    
    Output: [number]*/
    set_selected_button_index(index) {
        this.selected_button_index = index;
    }

    /*Checks the "open" state for this menu

    Output: [boolean]*/
    is_open() {
        return this.menu_open;
    }

    /*Checks the "active" state for this menu

    Output: [boolean]*/
    is_activated() {
        return this.menu_active;
    }

    /*Creates the character buttons from the party data
    Displays new sprites for each party member on screen with their idle animation*/
    set_chars() {
        for (let key_name in this.char_buttons) {
            this.char_buttons[key_name].destroy();
        }
        this.char_buttons = {};
        for (let i = 0; i < _.clamp(this.data.info.party_data.members.length, 0, MAX_PER_LINE); ++i) {
            const char = this.data.info.party_data.members[i];
            this.char_buttons[char.key_name] = this.group.create(0, 0, char.sprite_base.getActionKey(base_actions.IDLE));
            this.data.info.party_data.members[i].sprite_base.setAnimation(this.char_buttons[char.key_name], base_actions.IDLE);
            this.char_buttons[char.key_name].animations.play(char.sprite_base.getAnimationKey(base_actions.IDLE, reverse_directions[directions.down]));
        }
    }

    /*Manages interaction with the parent menu
    Passes control over to the Choose/Cancel functions*/
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

    /*Updates the position for the character menu*/
    update_position() {
        this.group.x = this.game.camera.x + this.x;
        this.group.y = this.game.camera.y + this.y;
        for (let i = 0; i < _.clamp(this.data.info.party_data.members.length, 0, MAX_PER_LINE); ++i) {
            const char = this.data.info.party_data.members[i];
            this.char_buttons[char.key_name].centerX = i * SLOT_WIDTH + SLOT_WIDTH_CENTER + numbers.OUTSIDE_BORDER_WIDTH + numbers.INSIDE_BORDER_WIDTH;
            this.char_buttons[char.key_name].y = this.unselected_y;
        }
    }

    /*Changes the selected character

    Input: old_index [number] - Previously selected index
           new_index [number] - New index to be selected*/
    change_button(old_index, new_index) {
        this.reset_button(old_index);
        this.on_change(new_index);
        this.set_button(new_index);
    }

    /*Shows the character as "selected"
    Moves the character down on scree n*/
    set_button(index) {
        let selected_char = this.char_buttons[this.data.info.party_data.members[index].key_name];
        selected_char.y = this.selected_y;
    }

    /*Resets the character's "selected" state
    Moves the character back in line with the remaining unselected members*/
    reset_button(index) {
        let selected_char = this.char_buttons[this.data.info.party_data.members[index].key_name];
        selected_char.y = this.unselected_y;
    }

    /*Sets the selected character index using the party index
    
    Input: party_index [number] - The character's party index*/
    set_char_by_index(party_index) {
        this.reset_button(this.selected_button_index);
        this.selected_button_index = party_index;
        this.set_button(this.selected_button_index);
    }

    /*Opens this window

    Input: select_index [number] - Default character selected index
           start_active [boolean] - If true, the menu starts in "active" state*/
    open(select_index, start_active = true) {
        if (Object.keys(this.char_buttons).length != _.clamp(this.data.info.party_data.members.length, 0, MAX_PER_LINE)) {
            this.set_chars();
        }
        this.buttons_number = _.clamp(this.data.info.party_data.members.length, 0, MAX_PER_LINE);
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

    /*Closes this window*/
    close() {
        this.menu_open = false;
        this.reset_button(this.selected_button_index);
        this.group.alpha = 0;
        this.cursor_control.deactivate();
        this.base_window.close(undefined, false);
    }

    /*Enables the "active" state for this window*/
    activate() {
        this.menu_active = true;
        this.cursor_control.activate();
    }

    /*Disables the "active" state for this window*/
    deactivate() {
        this.menu_active = false;
        this.cursor_control.deactivate();
    }
}
