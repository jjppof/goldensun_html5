import * as numbers from "./magic_numbers";
import {PageIndicator} from "./support_menus/PageIndicator";
import * as utils from "./utils";

/**
 * The type that holds some basic info about
 * any kind of text that is set in a window.
 */
export type TextObj = {
    text: Phaser.BitmapText;
    shadow: Phaser.BitmapText;
    right_align: boolean;
    initial_x: number;
    text_bg?: Phaser.Graphics;
};

/**
 * The type that holds info about an icon
 * that is on a window like the icon sprite by
 * itself, broken and equipped indication graphics
 * etc.
 */
export type ItemObj = {
    icon: Phaser.Sprite;
    background?: Phaser.Sprite;
    equipped?: Phaser.Sprite;
    broken?: Phaser.Sprite;
    quantity?: Phaser.BitmapText;
};

/**
 * A basic window template used in most menus.
 * Creates the background and borders.
 * Supports the addition of sprites, texts, and custom groups.
 * Supports pagination indication, text manipulation and also
 * icons positioning.
 */
export class Window {
    private static readonly TRANSITION_TIME = Phaser.Timer.QUARTER >> 2;
    private static readonly ITEM_OBJ = {
        EQUIPPED_X: 7,
        EQUIPPED_Y: 8,
        QUANTITY_END_X: 15,
        QUANTITY_Y: 8,
    };

    private game: Phaser.Game;
    private _group: Phaser.Group;
    private _x: number;
    private _y: number;
    private _width: number;
    private _height: number;
    private _color: number;
    private _font_color: number;
    private border_graphics: Phaser.Graphics;
    private bg_graphics: Phaser.Graphics;
    private separators_graphics: Phaser.Graphics;
    private _open: boolean;
    private extra_sprites: (Phaser.Sprite | Phaser.Graphics | Phaser.BitmapText | Phaser.Group)[];
    private internal_groups: {[key: string]: Phaser.Group};
    private close_callback: () => void;
    private _page_indicator: PageIndicator;

    constructor(
        game: Phaser.Game,
        x: number,
        y: number,
        width: number,
        height: number,
        color = numbers.DEFAULT_WINDOW_COLOR,
        font_color = numbers.DEFAULT_FONT_COLOR
    ) {
        this.game = game;
        this._group = game.add.group();

        this._x = x;
        this._y = y;
        this._width = width;
        this._height = height;

        this._color = color;
        this._font_color = font_color;

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

        this._open = false;
        this._page_indicator = new PageIndicator(this.game, this);
    }

    get color() {
        return this._color;
    }
    get font_color() {
        return this._font_color;
    }
    get x() {
        return this._x;
    }
    get y() {
        return this._y;
    }
    get width() {
        return this._width;
    }
    get height() {
        return this._height;
    }
    get group() {
        return this._group;
    }
    get page_indicator() {
        return this._page_indicator;
    }
    get open() {
        return this._open;
    }

    get real_x() {
        return this.group.x;
    }
    get real_y() {
        return this.group.y;
    }

    /**
     * Creates in this window an item object. An item object is a internal window group
     * that contains the item icon, the item quantity, the graphics for a broken item,
     * the equip graphics indication and the item background graphics (like in shops).
     * @param key_name the item key name.
     * @param pos the item object position.
     * @param params some optional parameters.
     * @returns returns the item object.
     */
    make_item_obj(
        key_name: string,
        pos?: {x: number; y: number},
        params?: {
            /** Whether this item obj. has a background graphics (like in shops). */
            bg?: boolean;
            /** Whether this item obj. should show the equipped indication graphics. */
            equipped?: boolean;
            /** Whether this item obj. should show the broken item graphics. */
            broken?: boolean;
            /** Shows the quatity indicator graphics if the given quantity is bigger than 1. */
            quantity?: number;
            /** The window internal group key. If using params arg, this key must be passed. */
            internal_group: string;
            /** Whether the icon positioning should be relative to item obj. center. */
            center?: boolean;
        }
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
            if (params.center) {
                obj.icon.anchor.setTo(0.5, 0.5);
            }

            if (params.broken) {
                obj.broken = this.create_at_group(base_x, base_y, "menu", undefined, "broken", params.internal_group);
                if (params.center) {
                    obj.broken.anchor.setTo(0.5, 0.5);
                }
            }
            const shift = params.center ? -(numbers.ICON_WIDTH >> 1) : 0;
            if (params.equipped) {
                obj.equipped = this.create_at_group(
                    base_x + Window.ITEM_OBJ.EQUIPPED_X + shift,
                    base_y + Window.ITEM_OBJ.EQUIPPED_Y + shift,
                    "menu",
                    undefined,
                    "equipped",
                    params.internal_group
                );
            }
            if (params.quantity && params.quantity > 1) {
                obj.quantity = this.game.add.bitmapText(
                    base_x + Window.ITEM_OBJ.QUANTITY_END_X + shift,
                    base_y + Window.ITEM_OBJ.QUANTITY_Y + shift,
                    "gs-item-bmp-font",
                    params.quantity.toString()
                );
                obj.quantity.x -= obj.quantity.width;

                if (params.internal_group) {
                    this.add_to_internal_group(params.internal_group, obj.quantity);
                } else {
                    this.group.add(obj.quantity);
                }
            }
        } else {
            obj.icon = this.create_at_group(base_x, base_y, "items_icons", undefined, key_name);
        }
        return obj;
    }

    /**
     * Moves an item object in the window.
     * @param item_obj The item object.
     * @param new_pos The coordinates of the new position.
     */
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

    /**
     * Brings the border graphics to top position in window group.
     */
    bring_border_to_top() {
        this.group.bringToTop(this.border_graphics);
    }

    /**
     * Removes existing separator graphics.
     */
    clear_separators() {
        this.separators_graphics.clear();
    }

    /**
     * Draws separator graphics in the window. These are created by changing the brightness of the background.
     * @param x_0 Initial x line separator position.
     * @param y_0 Initial y line separator position.
     * @param x_1 Final x line separator position.
     * @param y_1 Final y line separator position.
     * @param vertical if true, the separator is a vertical line, otherwise horizontal.
     */
    draw_separator(x_0: number, y_0: number, x_1: number, y_1: number, vertical = true) {
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

    /**
     * Creates the window background.
     * Fills the window's space with the window color.
     */
    private draw_background() {
        this.bg_graphics.beginFill(this.color, 1);
        this.bg_graphics.drawRect(2, 2, this.width, this.height);
        this.bg_graphics.endFill();
    }

    /**
     * Draws the window borders.
     * Lines are drawn to create the borders, including corners.
     * Colors used:
     * 0xFFFFFF = White,
     * 0xA5A5A5 = Gray (Lighter),
     * 0x525252 = Gray (Darker),
     * 0x111111 = Black.
     */
    private draw_borders() {
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

    /**
     * Changes the window's size and redraws it.
     * @param new_size The new width and height parameters.
     */
    update_size(new_size: {width?: number; height?: number}) {
        if (new_size.width !== undefined) {
            this._width = new_size.width;
        }
        if (new_size.height !== undefined) {
            this._height = new_size.height;
        }
        this.border_graphics.clear();
        this.bg_graphics.clear();
        this.draw_background();
        this.draw_borders();
    }

    /**
     * Changes the window's position.
     * @param new_position The position's parameters.
     * @param relative_to_camera_pos If true, moves the window by the x and y offset values.
     */
    update_position(new_position: {x?: number; y?: number}, relative_to_camera_pos = true) {
        if (new_position.x !== undefined) {
            this._x = new_position.x;
        }
        if (new_position.y !== undefined) {
            this._y = new_position.y;
        }
        this.group.x = (relative_to_camera_pos ? this.game.camera.x : 0) + this.x;
        this.group.y = (relative_to_camera_pos ? this.game.camera.y : 0) + this.y;
    }

    /**
     * Creates an internal group. A internal group is a Phaser.Group that can be
     * retrieved by a key and is used to attach other sprites to this window.
     * @param key The group's key.
     * @param position The position object of the internal group.
     * @returns Returns the internal group.
     */
    define_internal_group(key: string, position: {x?: number; y?: number} = {}) {
        const internal_group = this.game.add.group();
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

    /**
     * Returns an internal group.
     * @param key The internal group key.
     * @returns Returns an internal group.
     */
    get_internal_group(key: string) {
        return this.internal_groups[key];
    }

    /**
     * Adds a sprite to an internal group.
     * @param key The internal group key.
     * @param sprite The sprite to be added.
     * @returns True if the sprite was successfully added, false otherwise.
     */
    add_to_internal_group(key: string, sprite: Phaser.Sprite | Phaser.Graphics | Phaser.BitmapText | Phaser.Group) {
        if (key in this.internal_groups) {
            this.internal_groups[key].add(sprite);
            return true;
        }
        return false;
    }

    /**
     * Destroys an internal group and its elements.
     * @param key The internal group key.
     */
    destroy_internal_group(key: string) {
        if (key in this.internal_groups && this.internal_groups[key]) {
            this.internal_groups[key].destroy(true);
            delete this.internal_groups[key];
        }
    }

    /**
     * Destroy all internal groups of this window.
     */
    destroy_all_internal_groups() {
        const internal_group_keys = Object.keys(this.internal_groups);
        for (let key of internal_group_keys) {
            this.internal_groups[key].destroy(true);
            delete this.internal_groups[key];
        }
    }

    /**
     * Displays this window.
     * @param show_callback on window show callback.
     * @param animate If true, plays an opening animation.
     * @param close_callback on window close callback.
     */
    show(show_callback?: () => void, animate = true, close_callback?: () => void) {
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
                    this._open = true;
                    if (show_callback !== undefined) show_callback();
                });
        } else {
            this._open = true;
            this.group.width = this.border_graphics.width;
            this.group.height = this.border_graphics.height;
            if (show_callback !== undefined) show_callback();
        }
    }

    /**
     * Updates the window position if necessary.
     * @param force If true, forces an update.
     */
    update() {
        this.group.x = this.game.camera.x + this.x;
        this.group.y = this.game.camera.y + this.y;
    }

    /**
     * Adds a sprite to the main group of this window.
     * @param sprite The sprite to be added.
     */
    add_sprite_to_window_group(sprite: Phaser.Sprite | Phaser.Graphics | Phaser.BitmapText | Phaser.Group) {
        this.group.add(sprite);
        this.extra_sprites.push(sprite);
    }

    /**
     * Creates a new sprite in the main group of this window.
     * @param x the x position of the sprite.
     * @param y the y position of the sprite.
     * @param key the sprite key name.
     * @param color the color of the sprite (tint property).
     * @param frame the sprite frame name.
     * @param internal_group_key the internal group key in the case the sprite should be added in an internal group.
     * @returns Returns the added sprite.
     */
    create_at_group(x: number, y: number, key: string, color?: number, frame?: string, internal_group_key?: string) {
        let group = this.group;
        if (internal_group_key !== undefined) {
            const internal_group = this.get_internal_group(internal_group_key);
            if (internal_group) {
                group = internal_group;
            }
        }
        const sprite = group.create(x, y, key, frame);
        if (color !== undefined) {
            sprite.tint = color;
        }
        this.extra_sprites.push(sprite);
        return sprite;
    }

    /**
     * Sends this window to the front of the screen.
     */
    send_to_front() {
        (this.group.parent as Phaser.Group).bringToTop(this.group);
    }

    /**
     * Removes a sprite from the main group of this window.
     * @param sprite The sprite to be removed.
     * @param destroy If true, the sprite is destroyed.
     */
    remove_from_this_window(
        sprite?: Phaser.Sprite | Phaser.Graphics | Phaser.BitmapText | Phaser.Group,
        destroy = true
    ) {
        if (sprite !== undefined) {
            this.group.remove(sprite, destroy);
        } else {
            for (let i = 0; i < this.extra_sprites.length; ++i) {
                this.group.remove(this.extra_sprites[i], destroy);
            }
        }
    }

    /**
     * Sets a text in a dialog manner in this window.
     * @param lines The text lines (array of string).
     * @param options some optional parameters.
     * @returns Returns a promise that is resolved on animation finish.
     */
    set_dialog_text(
        lines: string[],
        options?: {
            /** The x internal padding text position. */
            padding_x?: number;
            /** The y internal padding text position. */
            padding_y?: number;
            /** A custom value for the space between text lines. */
            space_between_lines?: number;
            /** Whether the text is in italic. */
            italic?: boolean;
            /** Whether the text is displayed in a animated manner. */
            animate?: boolean;
            /** The font color. Can be an array of colors the indicates for each letter. */
            colors?: number | number[][];
            /** A callback the is called whenever a word is displayed in the window when animate is true. */
            word_callback?: (word?: string, current_text?: string) => void;
        }
    ) {
        const top_shift = options?.italic ? -2 : 0;
        const x_pos = options?.padding_x ?? numbers.WINDOW_PADDING_H + 4;
        let y_pos = options?.padding_y ?? numbers.WINDOW_PADDING_TOP + top_shift;
        const font_name = options?.italic ? utils.ITALIC_FONT_NAME : utils.FONT_NAME;

        const lines_promises = [];
        let anim_promise_resolve;
        const anim_promise = options?.animate ? new Promise<void>(resolve => (anim_promise_resolve = resolve)) : null;
        for (let i = 0; i < lines.length; ++i) {
            const line = lines[i];
            const text_sprite = this.game.add.bitmapText(
                x_pos,
                y_pos,
                font_name,
                options?.animate ? "" : line,
                numbers.FONT_SIZE
            );
            const text_sprite_shadow = this.game.add.bitmapText(
                x_pos + 1,
                y_pos + 1,
                font_name,
                options?.animate ? "" : line,
                numbers.FONT_SIZE
            );

            y_pos += numbers.FONT_SIZE + (options?.space_between_lines ?? numbers.SPACE_BETWEEN_LINES);

            text_sprite.tint =
                options?.colors !== undefined
                    ? Array.isArray(options.colors)
                        ? options.colors[i]
                        : options.colors
                    : this.font_color;
            text_sprite_shadow.tint = 0x0;

            if (options?.animate) {
                const words = line.split(" ");
                let words_index = 0;
                let line_promise_resolve;
                const repeater = () => {
                    this.game.time.events.repeat(30, words.length, () => {
                        text_sprite.text += words[words_index] + " ";
                        text_sprite_shadow.text += words[words_index] + " ";
                        ++words_index;
                        if (options?.word_callback) {
                            options.word_callback(words[words_index], text_sprite.text);
                        }
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
        }

        Promise.all(lines_promises).then(anim_promise_resolve);
        return anim_promise;
    }

    /**
     * Resets a text object to default position.
     * @param text_obj The text object.
     * @param italic Whether the text object is in italic.
     */
    reset_text_position(text_obj: TextObj, italic: boolean = false) {
        const x_pos = italic ? numbers.WINDOW_PADDING_H + 2 : numbers.WINDOW_PADDING_H + 4;
        const y_pos = italic ? numbers.WINDOW_PADDING_TOP - 2 : numbers.WINDOW_PADDING_TOP;
        text_obj.text.x = x_pos;
        text_obj.text.y = y_pos;
        text_obj.shadow.x = x_pos + 1;
        text_obj.shadow.y = y_pos + 1;
    }

    /**
     * Creates a sprite to represent a text at a given location.
     * @param text The text to display.
     * @param x_pos The desired x postion. If not passed, default value will be assumed.
     * @param y_pos The desired y postion. If not passed, default value will be assumed.
     * @param options Some optional parameters.
     * @returns Returns the resulting text object.
     */
    set_text_in_position(
        text: string,
        x_pos?: number,
        y_pos?: number,
        options?: {
            /** If true, the text will be right-aligned. */
            right_align?: boolean;
            /** If true, the text will be centered. */
            is_center_pos?: boolean;
            /** The text's desired color */
            color?: number;
            /** If true, gives the text a background shape. */
            with_bg?: boolean;
            /** If this exists, the text will belong to that group. */
            internal_group_key?: string;
            /** If true, the text will be italic. */
            italic?: boolean;
        }
    ): TextObj {
        x_pos = x_pos ?? (options?.italic ? numbers.WINDOW_PADDING_H + 2 : numbers.WINDOW_PADDING_H + 4);
        y_pos = y_pos ?? (options?.italic ? numbers.WINDOW_PADDING_TOP - 2 : numbers.WINDOW_PADDING_TOP);
        const font_name = options?.italic ? utils.ITALIC_FONT_NAME : utils.FONT_NAME;
        const text_sprite = this.game.add.bitmapText(x_pos, y_pos, font_name, text, numbers.FONT_SIZE);
        const text_sprite_shadow = this.game.add.bitmapText(x_pos + 1, y_pos + 1, font_name, text, numbers.FONT_SIZE);
        if (options?.is_center_pos) {
            text_sprite.centerX = x_pos;
            text_sprite.centerY = y_pos;
            text_sprite_shadow.centerX = x_pos + 1;
            text_sprite_shadow.centerY = y_pos + 1;
        }
        if (options?.right_align) {
            text_sprite.x -= text_sprite.width;
            text_sprite_shadow.x -= text_sprite_shadow.width;
        }
        let text_bg;
        if (options?.with_bg) {
            text_bg = this.game.add.graphics(text_sprite.x - 1, text_sprite.y);
            text_bg.beginFill(this.color, 1);
            text_bg.drawRect(0, 0, text_sprite.width + 3, numbers.FONT_SIZE);
            text_bg.endFill();
            if (
                options?.internal_group_key === undefined ||
                !this.add_to_internal_group(options?.internal_group_key, text_bg)
            ) {
                this.group.add(text_bg);
            }
        }

        text_sprite.tint = options?.color ?? this.font_color;
        text_sprite_shadow.tint = 0x0;

        let added_to_internal = false;
        if (options?.internal_group_key !== undefined) {
            added_to_internal =
                this.add_to_internal_group(options?.internal_group_key, text_sprite_shadow) &&
                this.add_to_internal_group(options?.internal_group_key, text_sprite);
        }
        if (!added_to_internal) {
            this.group.add(text_sprite_shadow);
            this.group.add(text_sprite);
        }

        return {
            text: text_sprite,
            shadow: text_sprite_shadow,
            right_align: options?.right_align,
            initial_x: x_pos,
            text_bg: text_bg,
        };
    }

    /**
     * Tweens the text horizontally back and forth. Use this when you expect
     * the text to be bigger than the window.
     * @param text_obj The text object to be tweened.
     * @param x the x postition destination.
     * @param duration The tween duration.
     * @returns Return the tween object.
     */
    tween_text_horizontally(text_obj: TextObj, x: number, duration: number = 3000) {
        const foo = {x: text_obj.text.x};
        const tween = this.game.add.tween(foo).to(
            {
                x: [text_obj.text.x, x, x],
            },
            duration,
            Phaser.Easing.Linear.None,
            true,
            0,
            -1,
            true
        );
        tween.onUpdateCallback(() => {
            text_obj.text.x = foo.x;
            text_obj.shadow.x = foo.x + 1;
        });
        return tween;
    }

    /**
     * Changes the text of a text object.
     * @param new_text The new text to show.
     * @param text_obj The text object to be updated.
     * @param new_x
     * @param new_y
     */
    update_text(new_text: string, text_obj: TextObj) {
        text_obj.text.setText(new_text);
        text_obj.shadow.setText(new_text);
        if (text_obj.right_align) {
            text_obj.text.x = text_obj.initial_x - text_obj.text.width;
            text_obj.shadow.x = text_obj.initial_x - text_obj.shadow.width + 1;
            if (text_obj.text_bg) {
                text_obj.text_bg.x = text_obj.text.x - 1;
            }
        }
    }

    /**
     * Changes the position of the given text object.
     * @param new_position The desired position object.
     * @param text_obj The text object to move repositioned.
     */
    update_text_position(new_position: {x?: number; y?: number}, text_obj: TextObj) {
        if (new_position.x !== undefined) {
            text_obj.text.x = new_position.x;
            text_obj.shadow.x = new_position.x + 1;
            text_obj.initial_x = new_position.x;
            if (text_obj.text_bg) {
                text_obj.text_bg.x = text_obj.text.x - 1;
            }
        }
        if (new_position.y !== undefined) {
            text_obj.text.y = new_position.y;
            text_obj.shadow.y = new_position.y + 1;
            if (text_obj.text_bg) {
                text_obj.text_bg.y = text_obj.text.y;
            }
        }
        if (text_obj.right_align) {
            text_obj.text.x = text_obj.initial_x - text_obj.text.width;
            text_obj.shadow.x = text_obj.initial_x - text_obj.shadow.width + 1;
            if (text_obj.text_bg) {
                text_obj.text_bg.x = text_obj.text.x - 1;
            }
        }
    }

    /**
     * Changes the color of the given text object.
     * @param color The new color to set.
     * @param text_obj The text obj.
     */
    update_text_color(color: number, text_obj: TextObj) {
        text_obj.text.tint = color;
    }

    /**
     * Destroys a given text object.
     * @param text_obj The text obj. to be destroyed.
     */
    destroy_text_obj(text_obj: TextObj) {
        text_obj.text.destroy();
        text_obj.shadow.destroy();
        if (text_obj.text_bg) {
            text_obj.text_bg.destroy();
        }
    }

    /**
     * Closes this window.
     * @param callback Callback function.
     * @param animate Plays a fading animation if true.
     */
    close(callback?: () => void, animate = true) {
        if (animate) {
            this.game.add
                .tween(this.group)
                .to({width: 0, height: 0}, Window.TRANSITION_TIME, Phaser.Easing.Linear.None, true)
                .onComplete.addOnce(() => {
                    this.group.alpha = 0;
                    this._open = false;
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
            this._open = false;
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

    /**
     * Destroys this window.
     * @param animate Plays a fading animation if true.
     * @param destroy_callback Callback function.
     */
    destroy(animate: boolean, destroy_callback?: () => void) {
        let on_destroy = () => {
            if (this.page_indicator.is_set) {
                this.page_indicator.terminante(true);
            }
            this.group.destroy(true);
            this.internal_groups = {};
            if (destroy_callback !== undefined) {
                destroy_callback();
            }
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
