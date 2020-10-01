import * as numbers from '../magic_numbers.js';
import * as utils from '../utils.js';
import { Window } from './Window.js';

const DIALOG_CRYSTAL_KEY = "dialog_crystal";

//A dialog can be divided in N windows. Each division has a step index.
//To set a dialog, call the DialogManager.set_dialog function and pass the entire dialog text.
//To advance the dialog (call next window), call the DialogManager.next function.
export class DialogManager {
    constructor(game, data, italic_font = true) {
        this.game = game;
        this.data = data;
        this.parts = null; //parts of the dialog text
        this.step = 0; //step index
        this.finished = false;
        this.avatar = null;
        this.window = null;
        this.avatar_window = null;
        this.italic_font = italic_font;
        this.dialog_crystal_sprite_base = this.data.info.misc_sprite_base_list[DIALOG_CRYSTAL_KEY];
        const sprite_key = this.dialog_crystal_sprite_base.getActionKey(DIALOG_CRYSTAL_KEY);
        this.dialog_crystal = this.game.add.sprite(0, 0, sprite_key);
        this.dialog_crystal_sprite_base.setAnimation(this.dialog_crystal, DIALOG_CRYSTAL_KEY);
        this.dialog_crystal_anim_key = this.dialog_crystal_sprite_base.getAnimationKey(DIALOG_CRYSTAL_KEY, "rotate");
        this.dialog_crystal.visible = false;
        this.dialog_crystal_tween = null;
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

    get_avatar_position(win_pos) {
        const x = ((this.parts[this.step].width >> 2) + win_pos.x) | 0;
        let y;
        if (win_pos.y >= numbers.GAME_HEIGHT >> 1) {
            y = win_pos.y - numbers.AVATAR_SIZE - 8;
        } else {
            y = win_pos.y + this.parts[this.step].height + 4;
        }
        return {x: x, y: y};
    }

    //Calls the next dialog window. If the dialog is finished, this function returns true.
    next(callback, hero_direction, custom_pos, avatar) {
        if (this.avatar_window) {
            this.avatar_window.destroy(false);
        }
        if (this.step >= this.parts.length) { //finishes the dialog
            this.finished = true;
            this.window.destroy(true, callback);
            this.dialog_crystal.destroy();
            return this.finished;
        }
        if (this.window) { //destroys the current window
            this.window.destroy(false);
        }
        this.dialog_crystal.visible = false;
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
        if (avatar) {
            this.avatar = avatar;
        }
        this.window = new Window(this.game, win_pos.x, win_pos.y, this.parts[this.step].width, this.parts[this.step].height, false);
        this.window.show(((step, italic_font, next_callback) => {
            this.window.set_text(this.parts[step].lines, undefined, undefined, undefined , italic_font, true).then(() => {
                if (step < this.parts.length - 1) {
                    this.dialog_crystal.visible = true;
                    this.dialog_crystal.x = this.window.real_x + this.parts[step].width - this.dialog_crystal.width;
                    this.dialog_crystal.y = this.window.real_y + this.parts[step].height;
                    const parent = this.dialog_crystal.parent;
                    parent.setChildIndex(this.dialog_crystal, parent.getChildIndex(this.window.group));
                    this.dialog_crystal.play(this.dialog_crystal_anim_key);
                    const tween_to_y = [this.dialog_crystal.y - (this.dialog_crystal.height >> 1), this.dialog_crystal.y];
                    if (this.dialog_crystal_tween && this.dialog_crystal_tween.isRunning) {
                        this.dialog_crystal_tween.stop();
                    }
                    this.dialog_crystal_tween = this.game.tweens.create(this.dialog_crystal).to({y: tween_to_y}, 1400, Phaser.Easing.Quadratic.InOut, true, 0, -1);
                } else {
                    if (this.dialog_crystal_tween && this.dialog_crystal_tween.isRunning) {
                        this.dialog_crystal_tween.stop();
                    }
                }
                next_callback();
            });
        }).bind(this, this.step, this.italic_font, callback));
        if (this.avatar) {
            const avatar_pos = this.get_avatar_position(win_pos);
            const window_size = numbers.AVATAR_SIZE + 4;
            this.avatar_window = new Window(this.game, avatar_pos.x, avatar_pos.y, window_size, window_size);
            this.avatar_window.create_at_group(4, 4, "avatars", undefined, this.avatar);
            this.avatar_window.show();
        }
        ++this.step;
        return this.finished;
    }

    //Receives a text string and mount the the dialog sections that will go to each window of the dialog.
    //Also receives an initial avatar
    set_dialog(text, avatar) {
        this.avatar = avatar;
        const max_efective_width = numbers.MAX_DIAG_WIN_WIDTH - 2 * numbers.WINDOW_PADDING_H - numbers.INSIDE_BORDER_WIDTH;
        let words = text.split(' ');
        let windows = []; //array of lines
        let lines = []; //array of strings
        let line = []; //array of words
        let line_width = 0; //in px
        let max_window_width = 0;
        for (let i = 0; i < words.length; ++i) {
            const word = words[i];
            line_width = utils.get_text_width(this.game, line.join(' ') + word, this.italic_font);
            if (line_width >= max_efective_width) { //check if it's the end of the line
                const line_text = line.join(' ');
                lines.push(line_text);
                max_window_width = Math.max(max_window_width, utils.get_text_width(this.game, line_text, this.italic_font));
                line = [];
                line.push(word);
                line_width = utils.get_text_width(this.game, word, this.italic_font);
                if (lines.length === numbers.MAX_LINES_PER_DIAG_WIN) { //check if it's the end of the window
                    windows.push({
                        lines: lines.slice(),
                        width: max_window_width + 2 * numbers.WINDOW_PADDING_H + numbers.INSIDE_BORDER_WIDTH,
                        height: numbers.WINDOW_PADDING_TOP + numbers.WINDOW_PADDING_BOTTOM + lines.length * (numbers.FONT_SIZE + numbers.SPACE_BETWEEN_LINES) - numbers.SPACE_BETWEEN_LINES
                    });
                    max_window_width = 0;
                    lines = [];
                }
            } else {
                line.push(word);
            }
        }
        if (line.length) { //deal with the last window that does not have 3 lines
            max_window_width = Math.max(max_window_width, utils.get_text_width(this.game, line.join(' '), this.italic_font), max_efective_width);
            lines.push(line.join(' '));
            windows.push({
                lines: lines.slice(),
                width: max_window_width + 2 * numbers.WINDOW_PADDING_H + numbers.INSIDE_BORDER_WIDTH + 2,
                height: numbers.WINDOW_PADDING_TOP + numbers.WINDOW_PADDING_BOTTOM + lines.length * (numbers.FONT_SIZE + numbers.SPACE_BETWEEN_LINES) - numbers.SPACE_BETWEEN_LINES
            });
        };
        this.parts = windows;
    }
}
