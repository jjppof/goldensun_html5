import { Window } from '../base/Window.js';
import { main_char_list } from '../chars/main_chars.js';
import * as numbers from '../magic_numbers.js';
import { get_text_width } from '../utils.js';

const WIDTH_PER_CHAR = 50;
const STATUS_WIN_HEIGHT = 35;
const STATUS_NUMBER_MAX_WIDTH = 26;

export class MenuScreen {
    constructor(game) {
        this.game = game;
        this.status_win_width = Object.keys(main_char_list).length * WIDTH_PER_CHAR;
        this.status_win_x = numbers.GAME_WIDTH - this.status_win_width - numbers.INSIDE_BORDER_WIDTH - numbers.OUTSIDE_BORDER_WIDTH;
        this.status_window = new Window(this.game, this.status_win_x, 0, this.status_win_width, STATUS_WIN_HEIGHT, false);
        this.status_header_width = get_text_width(this.game, "HP ");
    }

    set_chars_info() {
        let sorted_chars_list = _.sortBy(Object.values(main_char_list), char => {
            return char.index;
        });
        for (let i = 0; i < sorted_chars_list.length; ++i) {
            const char = sorted_chars_list[i];
            const base_x_pos =  i * WIDTH_PER_CHAR + numbers.WINDOW_PADDING_H + numbers.INSIDE_BORDER_WIDTH + numbers.OUTSIDE_BORDER_WIDTH;
            this.status_window.set_text_in_position(char.name, base_x_pos, numbers.WINDOW_PADDING_TOP);
            let y_pos = numbers.WINDOW_PADDING_TOP + numbers.FONT_SIZE;
            this.status_window.set_text_in_position("HP", base_x_pos, y_pos);
            let x_number_pos = parseInt(base_x_pos + this.status_header_width + (4 - char.current_hp.toString().length) * STATUS_NUMBER_MAX_WIDTH/8);
            this.status_window.set_text_in_position(char.current_hp.toString(), x_number_pos, y_pos);
            y_pos = numbers.WINDOW_PADDING_TOP + 2 * numbers.FONT_SIZE;
            this.status_window.set_text_in_position("PP", base_x_pos, y_pos);
            x_number_pos = parseInt(base_x_pos + this.status_header_width + (4 - char.current_pp.toString().length) * STATUS_NUMBER_MAX_WIDTH/8);
            this.status_window.set_text_in_position(char.current_pp.toString(), x_number_pos, y_pos);
        }
    }

    open_menu() {
        this.status_window.update();
        this.set_chars_info();
        this.status_window.show();
    }
}
