import * as numbers from '../magic_numbers.js';

const PAGE_NUMBER_WIDTH = 8;
const PAGE_NUMBER_HEIGHT = 8;
const PAGE_INDICATOR_ARROW_Y = 0;

export class Window {
    constructor(game, x, y, width, height, need_pos_update = true, color = numbers.DEFAULT_WINDOW_COLOR, font_color = numbers.DEFAULT_FONT_COLOR) {
        this.game = game;
        this.group = game.add.group();
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.font_color = font_color;
        this.graphics = this.game.add.graphics(0, 0);
        this.separators_graphics = this.game.add.graphics(0, 0);

        this.draw_background();
        this.draw_borders();
        this.group.add(this.graphics);
        this.group.add(this.separators_graphics);

        this.group.alpha = 0;
        this.group.width = 0;
        this.group.height = 0;
        this.group.window_object = this;
        this.need_pos_update = need_pos_update;
        this.open = false;
        this.lines_sprites = [];

        this.extra_sprites = [];
    }

    clear_separators() {
        this.separators_graphics.clear();
    }

    draw_separator(x_0, y_0, x_1, y_1, vertical = true) {
        const lighter = utils.change_brightness(this.color, 1.3);
        const darker = utils.change_brightness(this.color, 0.80);
        const medium = utils.change_brightness(this.color, 0.90);
        const colors = [medium, darker, lighter];
        for (let i = 0; i < colors.length; ++i) {
            const color = colors[i];
            const shift = i - 1;
            this.separators_graphics.lineStyle(1, color);
            this.separators_graphics.moveTo(x_0 + shift * +vertical, y_0 + shift * +(!vertical));
            this.separators_graphics.lineTo(x_1 + shift * +vertical, y_1 + shift * +(!vertical));
        }
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
        this.graphics.lineTo(3, this.height - 1);

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
        this.graphics.moveTo(3, this.height);
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

        this.graphics.lineStyle(1, 0x111111);
        this.graphics.moveTo(this.width - 1, 4);
        this.graphics.lineTo(this.width, 5);

        this.graphics.lineStyle(1, 0x111111);
        this.graphics.moveTo(4, this.height - 1);
        this.graphics.lineTo(5, this.height);
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

    show(show_callback, animate = true, close_callback = undefined) {
        this.group.alpha = 1;
        this.group.x = this.game.camera.x + this.x;
        this.group.y = this.game.camera.y + this.y;
        this.open = true;
        this.close_callback = close_callback;
        this.page_indicator_is_set = false;
        if (animate) {
            this.transition_time = Phaser.Timer.QUARTER/4;
            this.game.add.tween(this.group).to(
                { width: this.graphics.width, height: this.graphics.height },
                this.transition_time,
                Phaser.Easing.Linear.None,
                true
            ).onComplete.addOnce(() => {
                if (show_callback !== undefined) show_callback();
            });
        } else {
            this.group.width = this.graphics.width;
            this.group.height = this.graphics.height;
            if (show_callback !== undefined) show_callback();
        }
    }

    update(force = false) { //updates the window position if necessary
        if (this.need_pos_update || force) {
            this.group.x = this.game.camera.x + this.x;
            this.group.y = this.game.camera.y + this.y;
        }
    }

    add_sprite_to_group(sprite) {
        this.group.add(sprite);
        this.extra_sprites.push(sprite);
    }

    create_at_group(x, y, key, color, frame) {
        let sprite = this.group.create(x, y, key, frame);
        if (color !== undefined) {
            sprite.tint = color;
        }
        this.extra_sprites.push(sprite);
        return sprite;
    }

    remove_from_group(sprite, destroy = true) {
        if (sprite !== undefined) {
            this.group.remove(sprite, destroy);
        } else {
            for (let i = 0; i < this.extra_sprites.length; ++i) {
                this.group.remove(this.extra_sprites[i], destroy);
            }
        }
    }

    remove_smooth(text_sprite) {
        text_sprite.smoothed = false;
        text_sprite.autoRound = true;
    }

    set_text(lines, padding_x, padding_y, space_between_lines) {
        for (let i = 0; i < this.lines_sprites.length; ++i) {
            this.lines_sprites[i].text.destroy();
            this.lines_sprites[i].shadow.destroy();
        }
        this.lines_sprites = [];
        const x_pos = padding_x === undefined ? numbers.WINDOW_PADDING_H + 4 : padding_x;
        let y_pos = padding_y === undefined ? numbers.WINDOW_PADDING_TOP : padding_y;
        for (let i = 0; i < lines.length; ++i) {
            let line = lines[i];
            let text_sprite = this.game.add.bitmapText(x_pos, y_pos, 'gs-bmp-font', line, numbers.FONT_SIZE);
            let text_sprite_shadow = this.game.add.bitmapText(x_pos+1, y_pos+1, 'gs-bmp-font', line, numbers.FONT_SIZE);

            y_pos += numbers.FONT_SIZE + (space_between_lines === undefined ? numbers.SPACE_BETWEEN_LINES : space_between_lines);

            this.remove_smooth(text_sprite);
            text_sprite.tint = this.font_color;
            this.remove_smooth(text_sprite_shadow);
            text_sprite_shadow.tint = 0x0;

            this.group.add(text_sprite_shadow);
            this.group.add(text_sprite);
            this.lines_sprites.push({text: text_sprite, shadow: text_sprite_shadow});
        }
    }

    set_single_line_text(text, right_align = false) {
        const x_pos = numbers.WINDOW_PADDING_H + 4;
        let y_pos = numbers.WINDOW_PADDING_TOP;
        let text_sprite = this.game.add.bitmapText(x_pos, y_pos, 'gs-bmp-font', text, numbers.FONT_SIZE);
        let text_sprite_shadow = this.game.add.bitmapText(x_pos+1, y_pos+1, 'gs-bmp-font', text, numbers.FONT_SIZE);
        if (right_align) {
            text_sprite.x -= text_sprite.width;
            text_sprite_shadow.x -= text_sprite_shadow.width;
        }

        this.remove_smooth(text_sprite);
        text_sprite.tint = this.font_color;
        this.remove_smooth(text_sprite_shadow);
        text_sprite_shadow.tint = 0x0;

        this.group.add(text_sprite_shadow);
        this.group.add(text_sprite);

        return {text: text_sprite, shadow: text_sprite_shadow, right_align: right_align, initial_x: x_pos};
    }

    set_text_in_position(text, x_pos, y_pos, right_align = false, is_center_pos = false, color = this.font_color, with_bg = false) {
        let text_sprite = this.game.add.bitmapText(x_pos, y_pos, 'gs-bmp-font', text, numbers.FONT_SIZE);
        let text_sprite_shadow = this.game.add.bitmapText(x_pos+1, y_pos+1, 'gs-bmp-font', text, numbers.FONT_SIZE);
        if (is_center_pos) {
            text_sprite.centerX = x_pos;
            text_sprite.centerY = y_pos;
            text_sprite_shadow.centerX = x_pos + 1;
            text_sprite_shadow.centerY = y_pos + 1;
        }
        if (right_align) {
            text_sprite.x -= text_sprite.width;
            text_sprite_shadow.x -= text_sprite_shadow.width;
        }
        let text_bg;
        if (with_bg) {
            text_bg = this.game.add.graphics(text_sprite.x - 1, text_sprite.y);
            text_bg.beginFill(this.color, 1);
            text_bg.drawRect(0, 0, text_sprite.width + 3, numbers.FONT_SIZE);
            text_bg.endFill();
            this.group.add(text_bg);
        }

        this.remove_smooth(text_sprite);
        text_sprite.tint = color;
        this.remove_smooth(text_sprite_shadow);
        text_sprite_shadow.tint = 0x0;

        this.group.add(text_sprite_shadow);
        this.group.add(text_sprite);

        return {text: text_sprite, shadow: text_sprite_shadow, right_align: right_align, initial_x: x_pos, text_bg: text_bg};
    }

    update_text(new_text, text_shadow_pair, new_x, new_y) {
        text_shadow_pair.text.setText(new_text);
        text_shadow_pair.shadow.setText(new_text);
        this.update_text_position({x: new_x, y: new_y}, text_shadow_pair);
    }

    update_text_position(new_position, text_shadow_pair) {
        if (new_position.x !== undefined) {
            text_shadow_pair.text.x = new_position.x;
            text_shadow_pair.shadow.x = new_position.x + 1;
            text_shadow_pair.initial_x = new_position.x;
            if (text_shadow_pair.text_bg) {
                text_shadow_pair.text_bg.x = text_shadow_pair.text.x - 1;
            }
        }
        if (new_position.y !== undefined) {
            text_shadow_pair.text.y = new_position.y;
            text_shadow_pair.shadow.y = new_position.y + 1;
            if (text_shadow_pair.text_bg) {
                text_shadow_pair.text_bg.y = text_shadow_pair.text.y;
            }
        }
        if (text_shadow_pair.right_align) {
            text_shadow_pair.text.x = text_shadow_pair.initial_x - text_shadow_pair.text.width;
            text_shadow_pair.shadow.x = text_shadow_pair.initial_x - text_shadow_pair.shadow.width + 1;
            if (text_shadow_pair.text_bg) {
                text_shadow_pair.text_bg.x = text_shadow_pair.text.x - 1;
            }
        }
    }

    update_text_color(color, text_shadow_pair) {
        text_shadow_pair.text.tint = color;
    }

    remove_text(text_shadow_pair) {
        text_shadow_pair.text.destroy();
        text_shadow_pair.shadow.destroy();
        if (text_shadow_pair.text_bg) {
            text_shadow_pair.text_bg.destroy();
        }
    }

    close(callback, animate = true) {
        if (animate) {
            this.game.add.tween(this.group).to(
                { width: 0, height: 0 },
                this.transition_time,
                Phaser.Easing.Linear.None,
                true
            ).onComplete.addOnce(() => {
                this.group.alpha = 0;
                this.open = false;
                if (this.page_indicator_is_set) {
                    this.unset_page_indicator();
                }
                if (callback !== undefined) {
                    callback();
                }
                if (this.close_callback !== undefined) {
                    this.close_callback();
                }
            });
        } else {
            this.group.alpha = 0;
            this.open = false;
            if (this.page_indicator_is_set) {
                this.unset_page_indicator();
            }
            this.group.width = 0;
            this.group.height = 0;
            if (callback !== undefined) {
                callback();
            }
            if (this.close_callback !== undefined) {
                this.close_callback();
            }
        }
    }

    destroy(animate, destroy_callback) {
        let on_destroy = () => { 
            if (this.page_indicator_is_set) {
                this.unset_page_indicator();
            }
            this.group.destroy();
            if (destroy_callback !== undefined) destroy_callback();
        }
        if (animate) {
            this.game.add.tween(this.group).to(
                { width: 0, height: 0 },
                this.transition_time,
                Phaser.Easing.Linear.None,
                true
            ).onComplete.addOnce(on_destroy);
        } else {
            on_destroy();
        }
    }

    init_page_indicator_bar() {
        this.page_number_bar = this.game.add.graphics(0, 0);
        this.page_number_bar.alpha = 0;
        this.add_sprite_to_group(this.page_number_bar);
        this.page_number_bar.beginFill(this.color, 1);
        this.page_number_bar.drawRect(0, 0, PAGE_NUMBER_WIDTH, PAGE_NUMBER_HEIGHT);
        this.page_number_bar.endFill();
        this.page_number_bar_highlight = this.game.add.graphics(0, 0);
        this.page_number_bar_highlight.blendMode = PIXI.blendModes.SCREEN;
        this.page_number_bar_highlight.alpha = 0;
        this.add_sprite_to_group(this.page_number_bar_highlight);
        this.page_number_bar_highlight.beginFill(this.color, 1);
        this.page_number_bar_highlight.drawRect(0, 0, PAGE_NUMBER_WIDTH, PAGE_NUMBER_HEIGHT);
        this.page_number_bar_highlight.endFill();
        this.page_indicators = [];
        this.page_indicator_arrow_timer = this.game.time.create(false);
        this.page_indicator_right_arrow = this.create_at_group((this.width - 3), PAGE_INDICATOR_ARROW_Y, "page_arrow");
        this.page_indicator_right_arrow.scale.x = -1;
        this.page_indicator_right_arrow.x -= this.page_indicator_right_arrow.width;
        this.page_indicator_right_arrow.alpha = 0;
        this.page_indicator_left_arrow = this.create_at_group(0, PAGE_INDICATOR_ARROW_Y, "page_arrow");
        this.page_indicator_left_arrow.alpha = 0;
    }

    set_page_indicator(page_number, page_index) {
        if (page_number <= 1) return;
        this.page_number_bar.width = page_number * PAGE_NUMBER_WIDTH;
        this.page_number_bar.x = this.width - this.page_number_bar.width - 5;
        this.page_number_bar.alpha = 1;
        for (let i = 1; i <= page_number; ++i) {
            const x = this.page_number_bar.x + PAGE_NUMBER_WIDTH * (i - 1) + (PAGE_NUMBER_WIDTH >> 1);
            const y = PAGE_NUMBER_HEIGHT >> 1;
            this.page_indicators.push(this.set_text_in_position(i.toString(), x, y, false, true));
        }
        this.page_number_bar_highlight.alpha = 1;
        this.set_page_indicator_highlight(page_number, page_index);
        this.set_page_indicator_arrow(page_number);
    }

    set_page_indicator_highlight(page_number, page_index) {
        this.page_number_bar_highlight.x = this.width - 5 - (page_number - page_index) * PAGE_NUMBER_WIDTH;
    }

    set_page_indicator_arrow(page_number) {
        this.page_indicator_left_arrow.alpha = 1;
        this.page_indicator_right_arrow.alpha = 1;
        this.calculated_arrow_left_x = this.width - 5 - page_number * PAGE_NUMBER_WIDTH - this.page_indicator_left_arrow.width - 2;
        this.page_indicator_left_arrow.x = this.calculated_arrow_left_x;
        if (this.page_indicator_arrow_timer.running && this.page_indicator_arrow_timer.paused) {
            this.page_indicator_arrow_timer.resume();
        } else {
            this.page_indicator_arrow_timer.loop(Phaser.Timer.QUARTER >> 1, () => {
                this.page_indicator_left_arrow.x = this.calculated_arrow_left_x + ~(-this.page_indicator_left_arrow.x%2);
                this.page_indicator_right_arrow.x = (this.width - 3) - ~(-this.page_indicator_right_arrow.x%2);
                this.page_indicator_right_arrow.x -= this.page_indicator_right_arrow.width;
            });
            this.page_indicator_arrow_timer.start();
        }
    }

    unset_page_indicator() {
        this.page_number_bar.alpha = 0;
        this.page_number_bar_highlight.alpha = 0;
        this.page_indicator_left_arrow.alpha = 0;
        this.page_indicator_right_arrow.alpha = 0;
        for (let i = 0; i < this.page_indicators.length; ++i) {
            this.remove_text(this.page_indicators[i]);
        }
        this.page_indicators = [];
        this.page_indicator_arrow_timer.pause();
    }
}
