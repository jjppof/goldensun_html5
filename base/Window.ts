import * as numbers from "./magic_numbers";
import {PageIndicator} from "./support_menus/PageIndicator";
import * as utils from "./utils";

export type TextObj = {
    text: Phaser.BitmapText;
    shadow: Phaser.BitmapText;
    right_align: boolean;
    initial_x: number;
    text_bg?: Phaser.Graphics;
};

export type ItemObj = {
    icon: Phaser.Sprite;
    background?: Phaser.Sprite;
    equipped?: Phaser.Sprite;
    broken?: Phaser.Sprite;
    quantity?: Phaser.BitmapText;
};

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
    private static readonly TRANSITION_TIME = Phaser.Timer.QUARTER >> 2;
    private static readonly ITEM_OBJ = {
        EQUIPPED_X: 7,
        EQUIPPED_Y: 8,
        QUANTITY_END_X: 15,
        QUANTITY_Y: 8,
    };

    public game: Phaser.Game;
    public group: Phaser.Group;
    public x: number;
    public y: number;
    public width: number;
    public height: number;
    public color: number;
    public font_color: number;
    public border_graphics: Phaser.Graphics;
    public bg_graphics: Phaser.Graphics;
    public separators_graphics: Phaser.Graphics;
    public need_pos_update: boolean;
    public open: boolean;
    public lines_sprites: {
        text: Phaser.BitmapText;
        shadow: Phaser.BitmapText;
    }[];
    public extra_sprites: Phaser.Sprite[];
    public internal_groups: {[key: string]: Phaser.Group};
    public close_callback: Function;
    public page_indicator: PageIndicator;

    constructor(
        game,
        x,
        y,
        width,
        height,
        need_pos_update = true,
        color = numbers.DEFAULT_WINDOW_COLOR,
        font_color = numbers.DEFAULT_FONT_COLOR
    ) {
        this.game = game;
        this.group = game.add.group();

        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.color = color;
        this.font_color = font_color;

        this.extra_sprites = [];
        this.internal_groups = {};

        this.border_graphics = this.game.add.graphics(0, 0);
        this.bg_graphics = this.game.add.graphics(0, 0);
        this.separators_graphics = this.game.add.graphics(0, 0);

        this.draw_background();
        this.draw_borders();
        this.group.add(this.bg_graphics);
        this.group.add(this.border_graphics);
        this.group.add(this.separators_graphics);

        this.group.alpha = 0;
        this.group.width = 0;
        this.group.height = 0;

        this.need_pos_update = need_pos_update;
        this.open = false;
        this.lines_sprites = [];
        this.page_indicator = new PageIndicator(this.game, this);
    }

    get real_x() {
        return this.group.x;
    }

    get real_y() {
        return this.group.y;
    }

    make_item_obj(
        key_name: string,
        pos?: {x: number; y: number},
        params?: {bg?: boolean; equipped?: boolean; broken?: boolean; quantity?: number; internal_group?: string}
    ) {
        const obj: ItemObj = {icon: null, background: null, equipped: null, broken: null, quantity: null};
        const base_x = pos ? pos.x : 0;
        const base_y = pos ? pos.y : 0;

        if (params) {
            if (params.bg) {
                obj.background = this.create_at_group(
                    base_x,
                    base_y,
                    "menu",
                    undefined,
                    "item_border",
                    params.internal_group
                );
            }

            obj.icon = this.create_at_group(base_x, base_y, "items_icons", undefined, key_name, params.internal_group);

            if (params.broken) {
                obj.broken = this.create_at_group(base_x, base_y, "menu", undefined, "broken", params.internal_group);
            }
            if (params.equipped) {
                obj.equipped = this.create_at_group(
                    base_x + Window.ITEM_OBJ.EQUIPPED_X,
                    base_y + Window.ITEM_OBJ.EQUIPPED_Y,
                    "menu",
                    undefined,
                    "equipped",
                    params.internal_group
                );
            }
            if (params.quantity) {
                obj.quantity = this.game.add.bitmapText(
                    base_x + Window.ITEM_OBJ.QUANTITY_END_X,
                    base_y + Window.ITEM_OBJ.QUANTITY_Y,
                    "gs-item-bmp-font",
                    params.quantity.toString()
                );
                obj.quantity.x -= obj.quantity.width;

                if (params.internal_group) this.add_to_internal_group(params.internal_group, obj.quantity);
                else this.group.add(obj.quantity);
            }
        } else {
            obj.icon = this.create_at_group(base_x, base_y, "items_icons", undefined, key_name);
        }
        return obj;
    }

    move_item_obj(item_obj: ItemObj, new_pos: {x: number; y: number}) {
        for (let obj in item_obj) {
            if (item_obj[obj]) {
                item_obj[obj].x = new_pos.x;
                item_obj[obj].y = new_pos.y;

                if (obj === "equipped") {
                    item_obj[obj].x += Window.ITEM_OBJ.EQUIPPED_X;
                    item_obj[obj].y += Window.ITEM_OBJ.EQUIPPED_Y;
                } else if (obj === "quantity") {
                    item_obj[obj].x += Window.ITEM_OBJ.QUANTITY_END_X - item_obj[obj].width;
                    item_obj[obj].y += Window.ITEM_OBJ.QUANTITY_Y;
                }
            }
        }
    }

    briging_border_to_top() {
        this.group.bringToTop(this.border_graphics);
    }

    /*Removes existing separator graphics*/
    clear_separators() {
        this.separators_graphics.clear();
    }

    /*Draws separator graphics
    These are created by changing the brightness of the background*/
    draw_separator(x_0, y_0, x_1, y_1, vertical = true) {
        const lighter = utils.change_brightness(this.color, 1.3);
        const darker = utils.change_brightness(this.color, 0.8);
        const medium = utils.change_brightness(this.color, 0.9);
        const colors = [medium, darker, lighter];
        for (let i = 0; i < colors.length; ++i) {
            const color = colors[i];
            const shift = i - 1;
            this.separators_graphics.lineStyle(1, color);
            this.separators_graphics.moveTo(x_0 + shift * +vertical, y_0 + shift * +!vertical);
            this.separators_graphics.lineTo(x_1 + shift * +vertical, y_1 + shift * +!vertical);
        }
    }

    /*Creates the background
    Fills the window's space with the default window color*/
    draw_background() {
        this.bg_graphics.beginFill(this.color, 1);
        this.bg_graphics.drawRect(2, 2, this.width, this.height);
        this.bg_graphics.endFill();
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
        this.border_graphics.lineStyle(1, 0x525252);
        this.border_graphics.moveTo(0, 1);
        this.border_graphics.lineTo(0, this.height + 1);

        this.border_graphics.lineStyle(1, 0xffffff);
        this.border_graphics.moveTo(1, 1);
        this.border_graphics.lineTo(1, this.height + 1);

        this.border_graphics.lineStyle(1, 0xa5a5a5);
        this.border_graphics.moveTo(2, 1);
        this.border_graphics.lineTo(2, this.height);

        this.border_graphics.lineStyle(1, 0x111111);
        this.border_graphics.moveTo(3, 3);
        this.border_graphics.lineTo(3, this.height - 1);

        //Right
        this.border_graphics.lineStyle(1, 0x525252);
        this.border_graphics.moveTo(this.width, 2);
        this.border_graphics.lineTo(this.width, this.height);

        this.border_graphics.lineStyle(1, 0xa5a5a5);
        this.border_graphics.moveTo(this.width + 2, 1);
        this.border_graphics.lineTo(this.width + 2, this.height + 1);

        this.border_graphics.lineStyle(1, 0xffffff);
        this.border_graphics.moveTo(this.width + 1, 1);
        this.border_graphics.lineTo(this.width + 1, this.height);

        this.border_graphics.lineStyle(1, 0x111111);
        this.border_graphics.moveTo(this.width + 3, 1);
        this.border_graphics.lineTo(this.width + 3, this.height + 1);

        //Up
        this.border_graphics.lineStyle(1, 0x525252);
        this.border_graphics.moveTo(2, 0);
        this.border_graphics.lineTo(this.width + 2, 0);

        this.border_graphics.lineStyle(1, 0xffffff);
        this.border_graphics.moveTo(2, 1);
        this.border_graphics.lineTo(this.width + 2, 1);

        this.border_graphics.lineStyle(1, 0xa5a5a5);
        this.border_graphics.moveTo(3, 2);
        this.border_graphics.lineTo(this.width + 1, 2);

        this.border_graphics.lineStyle(1, 0x111111);
        this.border_graphics.moveTo(3, 3);
        this.border_graphics.lineTo(this.width, 3);

        //Down
        this.border_graphics.lineStyle(1, 0x525252);
        this.border_graphics.moveTo(3, this.height);
        this.border_graphics.lineTo(this.width, this.height);

        this.border_graphics.lineStyle(1, 0xffffff);
        this.border_graphics.moveTo(2, this.height + 1);
        this.border_graphics.lineTo(this.width + 2, this.height + 1);

        this.border_graphics.lineStyle(1, 0xa5a5a5);
        this.border_graphics.moveTo(2, this.height + 2);
        this.border_graphics.lineTo(this.width + 2, this.height + 2);

        this.border_graphics.lineStyle(1, 0x111111);
        this.border_graphics.moveTo(2, this.height + 3);
        this.border_graphics.lineTo(this.width + 2, this.height + 3);

        //Corners
        this.border_graphics.lineStyle(1, 0x525252);
        this.border_graphics.moveTo(1, 1);
        this.border_graphics.lineTo(2, 2);

        this.border_graphics.lineStyle(1, 0x525252);
        this.border_graphics.moveTo(1, this.height + 2);
        this.border_graphics.lineTo(2, this.height + 3);

        this.border_graphics.lineStyle(1, 0x525252);
        this.border_graphics.moveTo(this.width + 2, this.height + 2);
        this.border_graphics.lineTo(this.width + 3, this.height + 3);

        this.border_graphics.lineStyle(1, 0x525252);
        this.border_graphics.moveTo(this.width + 2, 1);
        this.border_graphics.lineTo(this.width + 3, 2);

        this.border_graphics.lineStyle(1, 0x111111);
        this.border_graphics.moveTo(4, 4);
        this.border_graphics.lineTo(5, 5);

        this.border_graphics.lineStyle(1, 0x525252);
        this.border_graphics.moveTo(3, 3);
        this.border_graphics.lineTo(4, 4);

        this.border_graphics.lineStyle(1, 0x525252);
        this.border_graphics.moveTo(this.width - 1, this.height - 1);
        this.border_graphics.lineTo(this.width, this.height);

        this.border_graphics.lineStyle(1, 0x111111);
        this.border_graphics.moveTo(this.width - 1, 4);
        this.border_graphics.lineTo(this.width, 5);

        this.border_graphics.lineStyle(1, 0x111111);
        this.border_graphics.moveTo(4, this.height - 1);
        this.border_graphics.lineTo(5, this.height);
    }

    /*Changes the window's size and redraws it

    Input: new_size [object] - Contains the width and height parameters
                width [number] - The new width
                height [number] - The new height*/
    update_size(new_size) {
        if (new_size.width !== undefined) {
            this.width = new_size.width;
        }
        if (new_size.height !== undefined) {
            this.height = new_size.height;
        }
        this.border_graphics.clear();
        this.bg_graphics.clear();
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

    /*Creates an internal group
    This is used to attach other sprite groups to the window
    
    Input: key [string] - The group's key
           position [array] - Contains the new group's x and y (Optional)
                x [number] - The new group's x
                y [number] - The new group's y
    
    Output: [Phaser:Group]*/
    define_internal_group(key, position: {x?: number; y?: number} = {}) {
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
        return internal_group;
    }

    /*Returns the chosen internal group

    Input: key [string] - The group's key
    
    Output: [Phaser:Group]*/
    get_internal_group(key) {
        return this.internal_groups[key];
    }

    /*Adds a sprite to an internal group

    Input: key [string] - The group's key
           sprite [Phaser:Sprite] - The sprite to add
           
    Output: [boolean] - True if the group exists, false otherwise*/
    add_to_internal_group(key, sprite) {
        if (key in this.internal_groups) {
            this.internal_groups[key].add(sprite);
            return true;
        }
        return false;
    }

    /*Destroys an internal group and its elements
    
    Input: key [string] - The group's keys*/
    destroy_internal_group(key) {
        if (key in this.internal_groups && this.internal_groups[key]) {
            this.internal_groups[key].destroy();
        }
    }

    /*Displays this window

    Input: show_callback [function] - Callback function (Optional)
           animate [boolean] - If true, plays an animation
           close_callback [function] - Callback function (Optional)*/
    show(show_callback?, animate = true, close_callback = undefined) {
        this.group.alpha = 1;
        this.group.x = this.game.camera.x + this.x;
        this.group.y = this.game.camera.y + this.y;

        this.close_callback = close_callback;

        if (animate) {
            this.game.add
                .tween(this.group)
                .to(
                    {width: this.border_graphics.width, height: this.border_graphics.height},
                    Window.TRANSITION_TIME,
                    Phaser.Easing.Linear.None,
                    true
                )
                .onComplete.addOnce(() => {
                    this.open = true;
                    if (show_callback !== undefined) show_callback();
                });
        } else {
            this.open = true;
            this.group.width = this.border_graphics.width;
            this.group.height = this.border_graphics.height;
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
    add_sprite_to_group(sprite, internal_group_key?) {
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
    create_at_group(x, y, key, color?, frame?, internal_group_key?) {
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

    /*Sends this window to the front of the screen*/
    send_to_front() {
        (this.group.parent as Phaser.Group).bringToTop(this.group);
    }

    /*Removes a sprite from the group
    
    Input: sprite [Phaser:Sprite] - The sprite to be removed
           destroy [boolean] - If true, the sprite is destroyed*/
    remove_from_group(sprite?, destroy = true) {
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
    set_text(lines, padding_x?, padding_y?, space_between_lines?, italic = false, animate = false) {
        for (let i = 0; i < this.lines_sprites.length; ++i) {
            this.lines_sprites[i].text.destroy();
            this.lines_sprites[i].shadow.destroy();
        }
        this.lines_sprites = [];
        const top_shift = italic ? -2 : 0;
        const x_pos = padding_x === undefined ? numbers.WINDOW_PADDING_H + 4 : padding_x;
        let y_pos = padding_y === undefined ? numbers.WINDOW_PADDING_TOP + top_shift : padding_y;
        const font_name = italic ? "gs-italic-bmp-font" : "gs-bmp-font";

        let lines_promises = [];
        let anim_promise;
        let anim_promise_resolve;
        if (animate) {
            anim_promise = new Promise(resolve => (anim_promise_resolve = resolve));
        }
        for (let i = 0; i < lines.length; ++i) {
            let line = lines[i];
            let text_sprite = this.game.add.bitmapText(x_pos, y_pos, font_name, animate ? "" : line, numbers.FONT_SIZE);
            let text_sprite_shadow = this.game.add.bitmapText(
                x_pos + 1,
                y_pos + 1,
                font_name,
                animate ? "" : line,
                numbers.FONT_SIZE
            );

            y_pos +=
                numbers.FONT_SIZE +
                (space_between_lines === undefined ? numbers.SPACE_BETWEEN_LINES : space_between_lines);

            this.remove_smooth(text_sprite);
            text_sprite.tint = this.font_color;
            this.remove_smooth(text_sprite_shadow);
            text_sprite_shadow.tint = 0x0;

            if (animate) {
                const words = line.split(" ");
                let words_index = 0;
                let line_promise_resolve;
                const repeater = () => {
                    this.game.time.events.repeat(25, words.length, () => {
                        text_sprite.text += words[words_index] + " ";
                        text_sprite_shadow.text += words[words_index] + " ";
                        ++words_index;
                        if (words_index === words.length) {
                            line_promise_resolve();
                        }
                    });
                };
                if (!lines_promises.length) {
                    repeater();
                } else {
                    lines_promises.pop().then(repeater);
                }
                lines_promises.push(new Promise(resolve => (line_promise_resolve = resolve)));
            }

            this.group.add(text_sprite_shadow);
            this.group.add(text_sprite);
            this.lines_sprites.push({
                text: text_sprite,
                shadow: text_sprite_shadow,
            });
        }

        Promise.all(lines_promises).then(anim_promise_resolve);
        return anim_promise;
    }

    /*Creates a sprite to represent the given text
    This text is aligned to the left by default

    Input: text [string] - The text to display
           right_align - If true, align the text to the right instead
           
    Output: text [Phaser:Sprite] - The text sprite
            shadow [Phaser:Sprite] - The text's shadow
            right_align [boolean] - The input value
            initial_x [number] - The text's x value*/
    set_single_line_text(text, right_align = false, italic = false): TextObj {
        const x_pos = italic ? numbers.WINDOW_PADDING_H + 2 : numbers.WINDOW_PADDING_H + 4;
        const y_pos = italic ? numbers.WINDOW_PADDING_TOP - 2 : numbers.WINDOW_PADDING_TOP;
        const font_name = italic ? "gs-italic-bmp-font" : "gs-bmp-font";
        const text_sprite = this.game.add.bitmapText(x_pos, y_pos, font_name, text, numbers.FONT_SIZE);
        const text_sprite_shadow = this.game.add.bitmapText(x_pos + 1, y_pos + 1, font_name, text, numbers.FONT_SIZE);
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

        return {
            text: text_sprite,
            shadow: text_sprite_shadow,
            right_align: right_align,
            initial_x: x_pos,
        };
    }

    reset_text_position(text_shadow_pair: TextObj, italic: boolean = false) {
        const x_pos = italic ? numbers.WINDOW_PADDING_H + 2 : numbers.WINDOW_PADDING_H + 4;
        const y_pos = italic ? numbers.WINDOW_PADDING_TOP - 2 : numbers.WINDOW_PADDING_TOP;
        text_shadow_pair.text.x = x_pos;
        text_shadow_pair.text.y = y_pos;
        text_shadow_pair.shadow.x = x_pos + 1;
        text_shadow_pair.shadow.y = y_pos + 1;
    }

    /*Creates a sprite to represent a single line of text at a given location

    Input: text [string] - The text to display
           x_pos, y_pos [number] - The desired position's x and y
           right_align [boolean] - If true, the text will be right-aligned
           is_center_pos [boolean] - If true, the text will be centered
           color [number] - The text's desired color
           with_bg [boolean] - If true, gives the text a background
           internal_group_key [string] - If this exists, the text will belong to that group

    Output: text [Phaser:Sprite] - The text sprite
            shadow [Phaser:Sprite] - The text's shadow
            right_align [boolean] - The input value
            initial_x [number] - The text's x value
            text_bg [Phaser:Sprite] - The text's background*/
    set_text_in_position(
        text,
        x_pos,
        y_pos,
        right_align = false,
        is_center_pos = false,
        color = this.font_color,
        with_bg = false,
        internal_group_key = undefined,
        italic = false
    ): TextObj {
        const font_name = italic ? "gs-italic-bmp-font" : "gs-bmp-font";
        let text_sprite = this.game.add.bitmapText(x_pos, y_pos, font_name, text, numbers.FONT_SIZE);
        let text_sprite_shadow = this.game.add.bitmapText(x_pos + 1, y_pos + 1, font_name, text, numbers.FONT_SIZE);
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
            added_to_internal =
                this.add_to_internal_group(internal_group_key, text_sprite_shadow) &&
                this.add_to_internal_group(internal_group_key, text_sprite);
        }
        if (!added_to_internal) {
            this.group.add(text_sprite_shadow);
            this.group.add(text_sprite);
        }

        return {
            text: text_sprite,
            shadow: text_sprite_shadow,
            right_align: right_align,
            initial_x: x_pos,
            text_bg: text_bg,
        };
    }

    tween_text(text_shadow_pair: TextObj, x: number, duration: number = 2000) {
        const foo = {x: text_shadow_pair.text.x};
        const tween = this.game.add.tween(foo).to(
            {
                x: x,
            },
            duration,
            Phaser.Easing.Linear.None,
            true,
            0,
            -1,
            true
        );
        tween.onUpdateCallback(() => {
            text_shadow_pair.text.x = foo.x;
            text_shadow_pair.shadow.x = foo.x + 1;
        });
        return tween;
    }

    /*Changes the text and repositions it

    Input: new_text [array] - The new text to show (array of string)
           text_shadow_pair [array] - Contains the text and its shadow
                text - The text to change
                shadow - The shadow of the text
            new_x, new_y [number] - The x and y for the new position*/
    update_text(new_text, text_shadow_pair, new_x?, new_y?) {
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
    close(callback?, animate = true) {
        if (animate) {
            this.game.add
                .tween(this.group)
                .to({width: 0, height: 0}, Window.TRANSITION_TIME, Phaser.Easing.Linear.None, true)
                .onComplete.addOnce(() => {
                    this.group.alpha = 0;
                    this.open = false;
                    if (this.page_indicator.is_set) {
                        this.page_indicator.terminante();
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
            if (this.page_indicator.is_set) {
                this.page_indicator.terminante();
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
    destroy(animate, destroy_callback?) {
        let on_destroy = () => {
            if (this.page_indicator.is_set) {
                this.page_indicator.terminante();
            }
            this.group.destroy();
            this.internal_groups = {};
            if (destroy_callback !== undefined) destroy_callback();
        };
        if (animate) {
            this.game.add
                .tween(this.group)
                .to({width: 0, height: 0}, Window.TRANSITION_TIME, Phaser.Easing.Linear.None, true)
                .onComplete.addOnce(on_destroy);
        } else {
            on_destroy();
        }
    }
}
