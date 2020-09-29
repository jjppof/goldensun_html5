import * as numbers from '../magic_numbers.js';
import * as utils from '../utils.js';
import { Window } from './Window.js';

//A dialog can be divided in N windows. Each division has a step index.
//To set a dialog, call the DialogManager.set_dialog function and pass the entire dialog text.
//To advance the dialog (call next window), call the DialogManager.next function.
export class DialogManager {
    constructor(game) {
        this.game = game;
        this.parts = null; //parts of the dialog text
        this.step = 0; //step index
        this.finished = false;
    }

    //Internal method. Try to calculate the position of the dialog window
    get_dialog_window_position(width, height, hero_direction) {
        const x = (numbers.GAME_WIDTH - width) >> 1;
        let y = (numbers.MAX_DIAG_WIN_HEIGHT - height) >> 1;
        if (![utils.directions.up, utils.directions.up_left, utils.directions.up_right].includes(hero_direction)) {
            y = numbers.GAME_HEIGHT - (numbers.MAX_DIAG_WIN_HEIGHT + 4) + y;
        }
        return {x: x, y: y};
    }

    //Calls the next dialog window. If the dialog is finished, this function returns true.
    next(callback, hero_direction, custom_pos) { 
        if (this.step >= this.parts.length) { //finishes the dialog
            this.finished = true;
            this.window.destroy(true, callback);
            return this.finished;
        }
        if (this.window) { //destroys the current window
            this.window.destroy(false);
        }
        if (hero_direction === undefined) {
            hero_direction = utils.directions.down;
        }
        let win_pos = this.get_dialog_window_position(this.parts[this.step].width, this.parts[this.step].height, hero_direction);
        if (custom_pos && custom_pos.x !== undefined) {
            win_pos.x = custom_pos.x;
        }
        if (custom_pos && custom_pos.y !== undefined) {
            win_pos.y = custom_pos.y;
        }
        this.window = new Window(this.game, win_pos.x, win_pos.y, this.parts[this.step].width, this.parts[this.step].height, false);
        this.window.set_text(this.parts[this.step].lines, undefined, undefined, undefined , true);
        this.window.show(callback);
        ++this.step;
        return this.finished;
    }

    //Receives a text string and mount the the dialog sections that will go to each window of the dialog
    set_dialog(text) {
        const max_efective_width = numbers.MAX_DIAG_WIN_WIDTH - 2 * numbers.WINDOW_PADDING_H - numbers.INSIDE_BORDER_WIDTH;
        let words = text.split(' ');
        let windows = []; //array of lines
        let lines = []; //array of strings
        let line = []; //array of words
        let line_width = 0; //in px
        let window_width = max_efective_width;
        for (let i = 0; i < words.length; ++i) {
            const word = words[i];
            line_width = utils.get_text_width(this.game, line.join(' ') + word, true);
            if (line_width >= window_width) { //check if it's the end of the line
                lines.push(line.join(' '));
                line = [];
                line.push(word);
                line_width = utils.get_text_width(this.game, word, true);
                if (lines.length === numbers.MAX_LINES_PER_DIAG_WIN) { //check if it's the end of the window
                    windows.push({
                        lines: lines.slice(),
                        width: window_width + 2 * numbers.WINDOW_PADDING_H + numbers.INSIDE_BORDER_WIDTH,
                        height: numbers.WINDOW_PADDING_TOP + numbers.WINDOW_PADDING_BOTTOM + lines.length * (numbers.FONT_SIZE + numbers.SPACE_BETWEEN_LINES) - numbers.SPACE_BETWEEN_LINES
                    });
                    lines = [];
                }
            } else {
                line.push(word);
            }
        }
        if (line.length) { //deal with the last window that does not have 3 lines
            let width_to_consider = line_width;
            if (lines.length) {
                width_to_consider = Math.max(window_width, line_width);
            }
            window_width = width_to_consider > max_efective_width ? max_efective_width : width_to_consider;
            lines.push(line.join(' '));
            windows.push({
                lines: lines.slice(),
                width: window_width + 2 * numbers.WINDOW_PADDING_H + numbers.INSIDE_BORDER_WIDTH + 2,
                height: numbers.WINDOW_PADDING_TOP + numbers.WINDOW_PADDING_BOTTOM + lines.length * (numbers.FONT_SIZE + numbers.SPACE_BETWEEN_LINES) - numbers.SPACE_BETWEEN_LINES
            });
        };
        this.parts = windows;
    }
}
