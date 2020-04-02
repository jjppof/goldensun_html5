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

    update() {
        this.group.x = this.game.camera.x + this.x;
        this.group.y = this.game.camera.y + this.y;
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

export class DialogManager {
    constructor(game, parts, hero_direction) {
        this.game = game;
        this.parts = parts;
        this.step = 0;
        this.finished = false;
        this.hero_direction = hero_direction;
    }

    next(callback) {
        if (this.step >= this.parts.length) {
            this.finished = true;
            this.window.destroy(true, callback);
            return;
        }
        if (this.window) {
            this.window.destroy(false);
        }
        let x = Math.floor((numbers.GAME_WIDTH - this.parts[this.step].width)/2);
        let y = Math.floor((numbers.MAX_DIAG_WIN_HEIGHT - this.parts[this.step].height)/2);
        if (!this.hero_direction.includes('up')) {
            y = numbers.GAME_HEIGHT - (numbers.MAX_DIAG_WIN_HEIGHT + 4) + y;
        } 
        this.window = new Window(this.game, x, y, this.parts[this.step].width, this.parts[this.step].height, false);
        this.window.set_text(this.parts[this.step].lines);
        this.window.show(callback);
        ++(this.step);
    }
}