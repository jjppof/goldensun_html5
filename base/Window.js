import * as numbers from '../magic_numbers.js';
import * as utils from '../utils.js';

const PAGE_NUMBER_WIDTH = 8;
const PAGE_NUMBER_HEIGHT = 8;
const PAGE_INDICATOR_ARROW_Y = 0;

/*A basic window template used in most menus
Creates the background and borders
Supports the addition of sprites and text

Input: game [Phaser:Game] - Reference to the running game object
       x,y [number] - The window's position
       width, height [number] - The window's width & height
       need_pos_update [boolean] - Flag to enable an automatic position update
       color [number] - The window's background color
       font_color [number] - The window's default font color*/
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
        this.internal_groups = {};
    }

    /*Removes existing separator graphics*/
    clear_separators() {
        this.separators_graphics.clear();
    }

    /*Draws separator graphics
    These are created by changing the brightness of the background*/
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

    /*Creates the background
    Fills the window's space with the default window color*/
    draw_background() {
        this.graphics.beginFill(this.color, 1);
        this.graphics.drawRect(2, 2, this.width, this.height);
        this.graphics.endFill();
    }

    /*Draws the window borders
    Lines are drawn to create the borders, including corners
    
    Colors used:
    0xFFFFFF = White
    0xA5A5A5 = Gray (Lighter)
    0x525252 = Gray (Darker)
    0x111111 = Black
    */
    draw_borders() {
        //Left
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

        //Right
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

        //Up
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

        //Down
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

        //Corners
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

    /*Changes the window's size and redraws it

    Input: new_size [array] - Contains the width and height parameters
                width [number] - The new width
                height [number] - The new height*/
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

    /*Changes the window's position

    Input: new_position [array] - Contains the position's parameters
                x [number] - The new x value
                x [number] - The new y value
           relative [boolean] - If true, moves the window by the x and y offset values*/
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

    define_internal_group(key, position = {}) {
        let internal_group = this.game.add.group();
        this.destroy_internal_group(key);
        this.internal_groups[key] = internal_group;
        if (position.x !== undefined) {
            internal_group.x = position.x;
        }
        if (position.y !== undefined) {
            internal_group.y = position.y;
        }
        this.group.add(internal_group);
    }

    get_internal_group(key) {
        return this.internal_groups[key];
    }

    add_to_internal_group(key, sprite) {
        if (key in this.internal_groups) {
            this.internal_groups[key].add(sprite);
            return true;
        }
        return false;
    }

    destroy_internal_group(key) {
        if (key in this.internal_groups && this.internal_groups[key]) {
            this.internal_groups[key].destroy();
        }
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

    /*Updates the window position if necessary
    
    Input: force [boolean] - If true, forces an update*/
    update(force = false) {
        if (this.need_pos_update || force) {
            this.group.x = this.game.camera.x + this.x;
            this.group.y = this.game.camera.y + this.y;
        }
    }

    /*Adds a sprite to the group
    
    Input: sprite [Phaser:Sprite] - The sprite to be added*/
    add_sprite_to_group(sprite, internal_group_key) {
        let group = this.group;
        if (internal_group_key !== undefined) {
            const internal_group = this.get_internal_group(internal_group_key);
            if (internal_group) {
                group = internal_group;
            }
        }
        group.add(sprite);
        this.extra_sprites.push(sprite);
    }

    /*Creates a new sprite at the group
    
    Input: x, y [number] = The sprite's position
           key [string] = The key for the sprite
           color [number] = The color palette to be used
           frame [string|number] = The frame value (spritesheets only)*/
    create_at_group(x, y, key, color, frame, internal_group_key) {
        let group = this.group;
        if (internal_group_key !== undefined) {
            const internal_group = this.get_internal_group(internal_group_key);
            if (internal_group) {
                group = internal_group;
            }
        }
        let sprite = group.create(x, y, key, frame);
        if (color !== undefined) {
            sprite.tint = color;
        }
        this.extra_sprites.push(sprite);
        return sprite;
    }

    /*Removes a sprite from the group
    
    Input: sprite [Phaser:Sprite] - The sprite to be removed
           destroy [boolean] - If true, the sprite is destroyed*/
    remove_from_group(sprite, destroy = true) {
        if (sprite !== undefined) {
            this.group.remove(sprite, destroy);
        } else {
            for (let i = 0; i < this.extra_sprites.length; ++i) {
                this.group.remove(this.extra_sprites[i], destroy);
            }
        }
    }

    /*Removes smoothing effect from a text sprite

    Input: text_sprite [Phaser:Sprite] - Text sprite to remove the effect from*/
    remove_smooth(text_sprite) {
        text_sprite.smoothed = false;
        text_sprite.autoRound = true;
    }

    /*Creates a sprite to represent the given lines of text

    Input: lines [array] - The text lines (array of string)
           padding_x [number] - Padding on the x axis
           padding_y [number] - Padding on the y axis
           space_bewteen lines [number] - Offset between lines*/
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

    /*Creates a sprite to represent the given text
    This text is aligned to the left by default

    Input: text [string] - The text to display
           right_align - If true, align the text to the right instead
           
    Output: text [Phaser:Sprite] - The text sprite
            shadow [Phaser:Sprite] - The text's shadow
            right_align [boolean] - The input value
            initial_x [number] - The text's x value*/
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

    /*Creates a sprite to represent a single line of text at a given location

    Input: text [string] - The text to display
           x_pos, y_pos [number] - The desired position's x and y
           right_align [boolean] - If true, the text will be right-aligned
           is_center_pos [boolean] - If true, the text will be centered
           color [number] - The text's desired color
           with_bg [boolean] - If true, gives the text a background

    Output: text [Phaser:Sprite] - The text sprite
            shadow [Phaser:Sprite] - The text's shadow
            right_align [boolean] - The input value
            initial_x [number] - The text's x value
            text_bg [Phaser:Sprite] - The text's background*/
    set_text_in_position(text, x_pos, y_pos, right_align = false, is_center_pos = false, color = this.font_color, with_bg = false, internal_group_key = undefined) {
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
            if (internal_group_key === undefined || !this.add_to_internal_group(internal_group_key, text_bg)) {
                this.group.add(text_bg);
            }
        }

        this.remove_smooth(text_sprite);
        text_sprite.tint = color;
        this.remove_smooth(text_sprite_shadow);
        text_sprite_shadow.tint = 0x0;

        let added_to_internal = false;
        if (internal_group_key !== undefined) {
            added_to_internal = this.add_to_internal_group(internal_group_key, text_sprite_shadow) && this.add_to_internal_group(internal_group_key, text_sprite);
        }
        if (!added_to_internal) {
            this.group.add(text_sprite_shadow);
            this.group.add(text_sprite);
        }

        return {text: text_sprite, shadow: text_sprite_shadow, right_align: right_align, initial_x: x_pos, text_bg: text_bg};
    }

    /*Changes the text and repositions it

    Input: new_text [array] - The new text to show (array of string)
           text_shadow_pair [array] - Contains the text and its shadow
                text - The text to change
                shadow - The shadow of the text
            new_x, new_y [number] - The x and y for the new position*/
    update_text(new_text, text_shadow_pair, new_x, new_y) {
        text_shadow_pair.text.setText(new_text);
        text_shadow_pair.shadow.setText(new_text);
        this.update_text_position({x: new_x, y: new_y}, text_shadow_pair);
    }

    /*Changes the position of the given text

    Input: new_position [array] - The desired position
                x - The new x
                y - The new y
           text_shadow_pair [array] - Contains the text and its shadow
                text - The text to change
                shadow - The shadow of the text*/
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

    /*Changes the color of the given text

    Input: color [number] - The new color to set
           text_shadow_pair [array] - Contains the text and its shadow
                text - The text to change
                shadow - The shadow of the text*/
    update_text_color(color, text_shadow_pair) {
        text_shadow_pair.text.tint = color;
    }

    /*Removes a text and its shadow

    Input: text_shadow_pair [array] - Contains the text and its shadow
                text - The text to remove
                shadow - The shadow of the text*/
    remove_text(text_shadow_pair) {
        text_shadow_pair.text.destroy();
        text_shadow_pair.shadow.destroy();
        if (text_shadow_pair.text_bg) {
            text_shadow_pair.text_bg.destroy();
        }
    }

    /*Closes the window

    Input: callback [function] - Callback function (Optional)
           animate [boolean] - Plays a fading animation if true*/
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

    /*Destroys the main group of the window

    Input: animate [boolean] - Plays a fading animation if true
           destroy_callbcak [function] - Callback function (Optional)*/
    destroy(animate, destroy_callback) {
        let on_destroy = () => { 
            if (this.page_indicator_is_set) {
                this.unset_page_indicator();
            }
            this.group.destroy();
            this.internal_groups = {};
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

    /*Enables the page indicators to be shown and prepares the space accordingly
    Used in the Psynergy and Items menu*/
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

    /*Sets the current page in the window
    
    Input: page_number [number] - The number of pages
           page_index [number] - The current page being shown*/
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

    /*Sets the page indicator highlight in the window
    
    Input: page_number [number] - The number of pages
           page_index [number] - The current page being shown*/
    set_page_indicator_highlight(page_number, page_index) {
        this.page_number_bar_highlight.x = this.width - 5 - (page_number - page_index) * PAGE_NUMBER_WIDTH;
    }

    /*Sets the page indicator arrows in the window

    Input: page_number [number] - The number of pages*/
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

    /*Removes the page indicator from the window*/
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
