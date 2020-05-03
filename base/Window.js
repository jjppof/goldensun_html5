import * as numbers from '../magic_numbers.js';
import * as utils from '../utils.js';

export class Window {
    constructor(game, x, y, width, height, need_pos_update = true, color = numbers.DEFAULT_WINDOW_COLOR) {
        this.game = game;
        this.group = game.add.group();
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.graphics = this.game.add.graphics(0, 0);

        this.draw_background();
        this.draw_borders();
        this.group.add(this.graphics);

        this.group.alpha = 0;
        this.group.width = 0;
        this.group.height = 0;
        this.group.window_object = this;
        this.need_pos_update = need_pos_update;
        this.open = false;
    }

    draw_background() {
        this.graphics.beginFill(this.color, 1);
        this.graphics.drawRect(2, 2, this.width, this.height);
        this.graphics.endFill();
    }

    draw_borders() {
        //left
        this.graphics.lineStyle(1, 0x525252);
        this.graphics.moveTo(0, 1);
        this.graphics.lineTo(0, this.height + 1);

        this.graphics.lineStyle(1, 0xFFFFFF)
        this.graphics.moveTo(1, 1);
        this.graphics.lineTo(1, this.height + 1);

        this.graphics.lineStyle(1, 0xA5A5A5)
        this.graphics.moveTo(2, 1);
        this.graphics.lineTo(2, this.height);

        this.graphics.lineStyle(1, 0x111111)
        this.graphics.moveTo(3, 3);
        this.graphics.lineTo(3, this.height);

        //right
        this.graphics.lineStyle(1, 0x525252)
        this.graphics.moveTo(this.width, 2);
        this.graphics.lineTo(this.width, this.height);
        
        this.graphics.lineStyle(1, 0xA5A5A5)
        this.graphics.moveTo(this.width + 2, 1);
        this.graphics.lineTo(this.width + 2, this.height + 1);
        
        this.graphics.lineStyle(1, 0xFFFFFF)
        this.graphics.moveTo(this.width + 1, 1);
        this.graphics.lineTo(this.width + 1, this.height);
        
        this.graphics.lineStyle(1, 0x111111)
        this.graphics.moveTo(this.width + 3, 1);
        this.graphics.lineTo(this.width + 3, this.height + 1);

        //up
        this.graphics.lineStyle(1, 0x525252)
        this.graphics.moveTo(2, 0);
        this.graphics.lineTo(this.width + 2, 0);

        this.graphics.lineStyle(1, 0xFFFFFF)
        this.graphics.moveTo(2, 1);
        this.graphics.lineTo(this.width + 2, 1);

        this.graphics.lineStyle(1, 0xA5A5A5)
        this.graphics.moveTo(3, 2);
        this.graphics.lineTo(this.width + 1, 2);

        this.graphics.lineStyle(1, 0x111111)
        this.graphics.moveTo(3, 3);
        this.graphics.lineTo(this.width, 3);

        //down
        this.graphics.lineStyle(1, 0x525252)
        this.graphics.moveTo(4, this.height);
        this.graphics.lineTo(this.width, this.height);

        this.graphics.lineStyle(1, 0xFFFFFF)
        this.graphics.moveTo(2, this.height + 1);
        this.graphics.lineTo(this.width + 2, this.height + 1);

        this.graphics.lineStyle(1, 0xA5A5A5)
        this.graphics.moveTo(2, this.height + 2);
        this.graphics.lineTo(this.width + 2, this.height + 2);

        this.graphics.lineStyle(1, 0x111111)
        this.graphics.moveTo(2, this.height + 3);
        this.graphics.lineTo(this.width + 2, this.height + 3);

        //corners
        this.graphics.lineStyle(1, 0x525252);
        this.graphics.moveTo(1, 1);
        this.graphics.lineTo(2, 2);

        this.graphics.lineStyle(1, 0x525252);
        this.graphics.moveTo(1, this.height + 2);
        this.graphics.lineTo(2, this.height + 3);

        this.graphics.lineStyle(1, 0x525252);
        this.graphics.moveTo(this.width + 2, this.height + 2);
        this.graphics.lineTo(this.width + 3, this.height + 3);

        this.graphics.lineStyle(1, 0x525252);
        this.graphics.moveTo(this.width + 2, 1);
        this.graphics.lineTo(this.width + 3, 2);

        this.graphics.lineStyle(1, 0x111111);
        this.graphics.moveTo(4, 4);
        this.graphics.lineTo(5, 5);

        this.graphics.lineStyle(1, 0x525252);
        this.graphics.moveTo(3, 3);
        this.graphics.lineTo(4, 4);

        this.graphics.lineStyle(1, 0x525252);
        this.graphics.moveTo(this.width - 1, this.height - 1);
        this.graphics.lineTo(this.width, this.height);
    }

    update_size(new_size) {
        if (new_size.width !== undefined) {
            this.width = new_size.width;
        }
        if (new_size.height !== undefined) {
            this.height = new_size.height;
        }
        this.graphics.clear();
        this.draw_background();
        this.draw_borders();
    }

    update_position(new_position, relative = true) {
        if (new_position.x !== undefined) {
            this.x = new_position.x;
        }
        if (new_position.y !== undefined) {
            this.y = new_position.y;
        }
        this.group.x = (relative ? this.game.camera.x : 0) + this.x;
        this.group.y = (relative ? this.game.camera.y : 0) + this.y;
    }

    show(show_callback) {
        this.group.alpha = 1;
        this.group.x = this.game.camera.x + this.x;
        this.group.y = this.game.camera.y + this.y;
        this.transition_time = Phaser.Timer.QUARTER/4;
        this.open = true;
        this.game.add.tween(this.group).to(
            { width: this.graphics.width, height: this.graphics.height },
            this.transition_time,
            Phaser.Easing.Linear.None,
            true
        );
        this.game.time.events.add(this.transition_time + 50, () => {
            if (show_callback !== undefined) show_callback();
        });
    }

    update() { //updates the window position if necessary
        if (this.need_pos_update) {
            this.group.x = this.game.camera.x + this.x;
            this.group.y = this.game.camera.y + this.y;
        }
    }

    set_text(lines) {
        const x_pos = numbers.WINDOW_PADDING_H + 4;
        let y_pos = numbers.WINDOW_PADDING_TOP;
        for (let i = 0; i < lines.length; ++i) {
            let line = lines[i];
            let text_sprite = this.game.add.bitmapText(x_pos, y_pos, 'gs-bmp-font', line, numbers.FONT_SIZE);
            let text_sprite_shadow = this.game.add.bitmapText(x_pos+1, y_pos+1, 'gs-bmp-font', line, numbers.FONT_SIZE);

            y_pos += numbers.FONT_SIZE + numbers.SPACE_BETWEEN_LINES;

            text_sprite.smoothed = false;
            text_sprite.autoRound = true;
            text_sprite_shadow.smoothed = false;
            text_sprite_shadow.autoRound = true;
            text_sprite_shadow.tint = 0x0;

            this.group.add(text_sprite_shadow);
            this.group.add(text_sprite);
        }
    }

    set_text_in_position(text, x_pos, y_pos) {
        let text_sprite = this.game.add.bitmapText(x_pos, y_pos, 'gs-bmp-font', text, numbers.FONT_SIZE);
        let text_sprite_shadow = this.game.add.bitmapText(x_pos+1, y_pos+1, 'gs-bmp-font', text, numbers.FONT_SIZE);

        text_sprite.smoothed = false;
        text_sprite.autoRound = true;
        text_sprite_shadow.smoothed = false;
        text_sprite_shadow.autoRound = true;
        text_sprite_shadow.tint = 0x0;

        this.group.add(text_sprite_shadow);
        this.group.add(text_sprite);

        return {text: text_sprite, shadow: text_sprite_shadow};
    }

    update_text(new_text, text_shadow_pair, new_x, new_y) {
        text_shadow_pair.text.setText(new_text);
        text_shadow_pair.shadow.setText(new_text);
        if (new_x !== undefined) {
            text_shadow_pair.text.x = new_x;
            text_shadow_pair.shadow.x = new_x;
        }
        if (new_y !== undefined) {
            text_shadow_pair.text.y = new_y;
            text_shadow_pair.shadow.y = new_y;
        }
    }

    close(callback) {
        this.game.add.tween(this.group).to(
            { width: 0, height: 0 },
            this.transition_time,
            Phaser.Easing.Linear.None,
            true
        ).onComplete.addOnce(callback ? callback : () => {});
    }

    destroy(animate, destroy_callback) {
        let on_destroy = () => { 
            this.group.destroy();
            if (destroy_callback !== undefined) destroy_callback();
        }
        if (animate) {
            this.game.add.tween(this.group).to(
                { width: 0, height: 0 },
                this.transition_time,
                Phaser.Easing.Linear.None,
                true
            );
            this.game.time.events.add(this.transition_time + 50, on_destroy, this);
        } else {
            on_destroy();
        }
    }
}

export class DialogManager { //the dialog can be divided in n windows. Each division has a step index
    constructor(game, parts, hero_direction) {
        this.game = game;
        this.parts = parts; //parts of the dialog text
        this.step = 0; //step index
        this.finished = false;
        this.hero_direction = hero_direction;
    }

    next(callback) { //calls the next dialog window
        if (this.step >= this.parts.length) { //finishes the dialog
            this.finished = true;
            this.window.destroy(true, callback);
            return;
        }
        if (this.window) { //destroys the current window
            this.window.destroy(false);
        }
        const win_pos = get_dialog_window_position(this.parts[this.step].width, this.parts[this.step].height, this.hero_direction);
        this.window = new Window(this.game, win_pos.x, win_pos.y, this.parts[this.step].width, this.parts[this.step].height, false);
        this.window.set_text(this.parts[this.step].lines);
        this.window.show(callback);
        ++(this.step);
    }
}

export function get_dialog_window_position(width, height, hero_direction) {
    let x = Math.floor((numbers.GAME_WIDTH - width)/2);
    let y = Math.floor((numbers.MAX_DIAG_WIN_HEIGHT - height)/2);
    if (!hero_direction.includes('up')) {
        y = numbers.GAME_HEIGHT - (numbers.MAX_DIAG_WIN_HEIGHT + 4) + y;
    }
    return {x: x, y: y};
}

export function set_dialog(game, text) { //divides the text into windows and, for each window, into lines
    const max_efective_width = numbers.MAX_DIAG_WIN_WIDTH - 2 * numbers.WINDOW_PADDING_H - numbers.INSIDE_BORDER_WIDTH;
    let words = text.split(' ');
    let windows = []; //array of lines
    let lines = []; //array of strings
    let line = []; //array of words
    let line_width = 0; //in px
    let window_width = max_efective_width;
    for (let i = 0; i < words.length; ++i) {
        const word = words[i];
        line_width = utils.get_text_width(game, line.join(' ') + word);
        if (line_width >= window_width) { //check if it's the end of the line
            lines.push(line.join(' '));
            line = [];
            line.push(word);
            line_width = utils.get_text_width(game, word);
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
    return windows;
}
