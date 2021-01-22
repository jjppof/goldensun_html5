import {Window, TextObj} from "../../Window";
import {kill_all_sprites} from "../../utils";
import {GoldenSun} from "../../GoldenSun";
import {Button} from "../../XGamepad";
import {ShopMenu} from "../../main_menus/ShopMenu";
import {MainChar, ItemSlot} from "../../MainChar";
import {CursorManager, PointVariants} from "../../utils/CursorManager";

const MAX_PER_LINE = 5;
const MAX_LINES = 3;
const ICON_SIZE = 16;

const MESSAGE_HAVE_ITEM = "You have ";
const MESSAGE_NO_ITEM = "None in stock";

const BASE_X = 128;
const BASE_Y = 96;
const BASE_WIDTH = 108;
const BASE_HEIGHT = 60;
const EXPAND_DIFF = 8;

const ITEM_X = 16;
const ITEM_Y = 8;

const SUB_ICON_X = 7;
const SUB_ICON_Y = 8;

const SUB_TEXT_X_SHIFT = 8;

const TEXT_X = 8;
const TEXT_Y = 8;

const CURSOR_X = 136;
const CURSOR_Y = 112;

const SPRITE_GROUP_KEY = "sprites";
const ICON_GROUP_KEY = "icons";

const ITEMS_IMG_KEY = "items_icons";
const BACKGROUND_IMG_KEY = "item_border";
const EQUIPPED_IMG_KEY = "equipped";
const BROKEN_IMG_KEY = "broken";

/*Displays a character's inventory through icons
Used in shop menus. Can display the amout of an item in the inventory

Input: game [Phaser:Game] - Reference to the running game object
       data [GoldenSun] - Reference to the main JS Class instance*/
export class InventoryWindow {
    public game: Phaser.Game;
    public data: GoldenSun;
    public on_change: Function;

    public expanded: boolean;
    public is_open: boolean;
    public window: Window;
    public text: TextObj;

    public char: MainChar;
    public item_grid: ItemSlot[][];
    public selected_item: string;
    public cursor_pos: {line: number; col: number};
    public sprite_group: Phaser.Group;
    public icon_group: Phaser.Group;

    constructor(game: Phaser.Game, data: GoldenSun, on_change: Function) {
        this.game = game;
        this.data = data;
        this.on_change = on_change;

        this.expanded = false;
        this.is_open = false;

        this.window = new Window(this.game, BASE_X, BASE_Y, BASE_WIDTH, BASE_HEIGHT);
        this.text = this.window.set_text_in_position("", TEXT_X, TEXT_Y);
        this.text.text.alpha = 0;
        this.text.shadow.alpha = 0;

        this.char = null;
        this.item_grid = [];
        this.selected_item = null;
        this.cursor_pos = {line: 0, col: 0};
        this.sprite_group = this.window.define_internal_group(SPRITE_GROUP_KEY, {x: ITEM_X, y: ITEM_Y});
        this.icon_group = this.window.define_internal_group(ICON_GROUP_KEY, {
            x: ITEM_X + SUB_ICON_X,
            y: ITEM_Y + SUB_ICON_Y,
        });
    }

    /*Checks and manages the expanded state of the window

    Input: expand [boolean]: If true, the window be in expanded state*/
    check_expand(expand: boolean) {
        if (expand) this.set_text();
        if (this.expanded === expand) return;

        let modifier = expand ? 1 : -1;

        this.window.update_size({height: this.window.height + modifier * EXPAND_DIFF});
        this.window.update_position({y: this.window.y - modifier * EXPAND_DIFF});
        this.sprite_group.y = this.sprite_group.y + modifier * EXPAND_DIFF;
        this.icon_group.y = this.icon_group.y + modifier * EXPAND_DIFF;
        this.window.update();

        this.expanded = expand;
    }

    /*Sets and displays the text relative to the selected item*/
    set_text() {
        let item_match = null;
        let found = false;
        let finish = false;

        for (let line = 0; line < MAX_LINES; line++) {
            for (let col = 0; col < MAX_PER_LINE; col++) {
                if (!this.item_grid[line][col]) {
                    finish = true;
                    break;
                }
                if (this.item_grid[line][col].key_name === this.selected_item) {
                    item_match = this.item_grid[line][col];
                    found = true;
                    break;
                }
            }
            if (found || finish) break;
        }

        if (!found) this.window.update_text(MESSAGE_NO_ITEM, this.text);
        else this.window.update_text(MESSAGE_HAVE_ITEM + item_match.quantity, this.text);

        this.text.text.alpha = 1;
        this.text.shadow.alpha = 1;
    }

    /*Changes the character whose inventory is being shown

    Input: key_name [number] - The character's key name*/
    change_character(key_name: string) {
        this.char = this.data.info.party_data.members.filter(c => {
            return c.key_name === key_name;
        })[0];
        this.make_item_grid();

        kill_all_sprites(this.sprite_group);
        kill_all_sprites(this.icon_group);
        if (this.expanded) this.set_text();
        this.set_sprites();
    }

    make_item_grid() {
        this.item_grid = [];

        let char_items = this.char.items.filter(item_obj => {
            return item_obj.key_name in this.data.info.items_list;
        });

        let lines = [];
        for (let line = 0; line < ((char_items.length / MAX_PER_LINE) | 0) + 1; line++) {
            let this_line = [];
            for (let col = 0; col < MAX_PER_LINE; col++) {
                if (char_items[line * MAX_PER_LINE + col]) this_line.push(char_items[line * MAX_PER_LINE + col]);
            }
            lines.push(this_line);
        }
        this.item_grid = lines;
    }

    kill_item_at(line: number, col: number) {
        let item_icons = this.sprite_group.children.filter((s: Phaser.Sprite) => {
            return s.alive === true && s.key === ITEMS_IMG_KEY && s.x === col * ICON_SIZE && s.y === line * ICON_SIZE;
        });
        let bg_icons = this.sprite_group.children.filter((s: Phaser.Sprite) => {
            return (
                s.alive === true &&
                s.frameName === BACKGROUND_IMG_KEY &&
                s.x === col * ICON_SIZE &&
                s.y === line * ICON_SIZE
            );
        });

        (item_icons[0] as Phaser.Sprite).kill();
        (bg_icons[0] as Phaser.Sprite).kill();

        if (this.item_grid[line][col].broken) {
            let broken_icons = this.sprite_group.children.filter((b: Phaser.Sprite) => {
                return (
                    b.alive === true &&
                    b.frameName === BROKEN_IMG_KEY &&
                    b.x === col * ICON_SIZE &&
                    b.y === line * ICON_SIZE
                );
            });
            (broken_icons[0] as Phaser.Sprite).kill();
        }

        if (this.item_grid[line][col].equipped) {
            let equipped_icons = this.icon_group.children.filter((e: Phaser.Sprite) => {
                return (
                    e.alive === true &&
                    e.frameName === EQUIPPED_IMG_KEY &&
                    e.x === col * ICON_SIZE &&
                    e.y === line * ICON_SIZE
                );
            });
            (equipped_icons[0] as Phaser.Sprite).kill();
        }
    }

    /**
     * Grants user control on the current window.
     * @param {Function} on_cancel - Called when B is pressed
     * @param {Function} on_select - Called when A is pressed
     */
    grant_control(on_cancel: Function, on_select: Function) {
        const controls = [
            {button: Button.LEFT, on_down: this.previous_col.bind(this), sfx: {down: "menu/move"}},
            {button: Button.RIGHT, on_down: this.next_col.bind(this), sfx: {down: "menu/move"}},
            {button: Button.UP, on_down: this.previous_line.bind(this), sfx: {down: "menu/move"}},
            {button: Button.DOWN, on_down: this.next_line.bind(this), sfx: {down: "menu/move"}},
            {button: Button.A, on_down: on_select, sfx: {down: "menu/positive"}},
            {button: Button.B, on_down: on_cancel, sfx: {down: "menu/negative"}},
        ];
        this.data.control_manager.add_controls(controls, {
            loop_config: {vertical: true, horizontal: true},
        });
    }

    next_col() {
        if (this.item_grid.length === 1 && this.item_grid[this.cursor_pos.line].length === 1) return;

        if (this.cursor_pos.col < this.item_grid[this.cursor_pos.line].length - 1) {
            this.set_cursor(this.cursor_pos.line, this.cursor_pos.col + 1);
        } else {
            if (this.cursor_pos.line === this.item_grid.length - 1) {
                this.set_cursor(0, 0);
            } else {
                this.set_cursor(this.cursor_pos.line + 1, 0);
            }
        }
    }

    previous_col() {
        if (this.item_grid.length === 1 && this.item_grid[this.cursor_pos.line].length === 1) return;

        if (this.cursor_pos.col > 0) {
            this.set_cursor(this.cursor_pos.line, this.cursor_pos.col - 1);
        } else {
            if (this.cursor_pos.line === 0) {
                this.set_cursor(this.item_grid.length - 1, this.item_grid[this.item_grid.length - 1].length - 1);
            } else {
                this.set_cursor(this.cursor_pos.line - 1, MAX_PER_LINE - 1);
            }
        }
    }

    next_line() {
        if (this.item_grid.length === 1) return;

        if (this.cursor_pos.line === this.item_grid.length - 1) {
            this.set_cursor(0, this.cursor_pos.col);
        } else {
            if (this.cursor_pos.col > this.item_grid[this.cursor_pos.line + 1].length - 1)
                this.set_cursor(this.cursor_pos.line + 1, this.item_grid[this.cursor_pos.line + 1].length - 1);
            else this.set_cursor(this.cursor_pos.line + 1, this.cursor_pos.col);
        }
    }

    previous_line() {
        if (this.item_grid.length === 1) return;

        if (this.cursor_pos.line === 0) {
            if (this.cursor_pos.col > this.item_grid[this.item_grid.length - 1].length - 1)
                this.set_cursor(this.item_grid.length - 1, this.item_grid[this.item_grid.length - 1].length - 1);
            else this.set_cursor(this.item_grid.length - 1, this.cursor_pos.col);
        } else {
            this.set_cursor(this.cursor_pos.line - 1, this.cursor_pos.col);
        }
    }

    /*Moves the cursor to the given column and line*/
    set_cursor(line: number, col: number) {
        this.cursor_pos = {line: line, col: col};
        let cursor_x = CURSOR_X + col * ICON_SIZE;
        let cursor_y = CURSOR_Y + line * ICON_SIZE;
        this.data.cursor_manager.move_to(
            {x: cursor_x, y: cursor_y},
            {
                tween_config: {type: CursorManager.CursorTweens.POINT, variant: PointVariants.LONG},
            },
            () => {
                this.on_change(line, col);
            }
        );
    }

    /*Displays the sprites for the window
    Includes icons and quantity text*/
    set_sprites() {
        let finish = false;

        for (let line = 0; line < MAX_LINES; line++) {
            for (let col = 0; col < MAX_PER_LINE; col++) {
                if (!this.item_grid[line][col]) {
                    finish = true;
                    break;
                }

                let this_item = this.data.info.items_list[this.item_grid[line][col].key_name];

                let dead_items = this.sprite_group.children.filter((s: Phaser.Sprite) => {
                    return s.alive === false && s.key === ITEMS_IMG_KEY;
                });
                let dead_backgrounds = this.sprite_group.children.filter((s: Phaser.Sprite) => {
                    return s.alive === false && s.frameName === BACKGROUND_IMG_KEY;
                });

                if (dead_items.length > 0 && dead_backgrounds.length > 0) {
                    (dead_backgrounds[0] as Phaser.Sprite).reset(col * ICON_SIZE, line * ICON_SIZE);
                    (dead_items[0] as Phaser.Sprite).reset(col * ICON_SIZE, line * ICON_SIZE);
                    (dead_items[0] as Phaser.Sprite).frameName = this_item.key_name;
                } else {
                    this.window.create_at_group(
                        col * ICON_SIZE,
                        line * ICON_SIZE,
                        "menu",
                        undefined,
                        BACKGROUND_IMG_KEY,
                        SPRITE_GROUP_KEY
                    );
                    this.window.create_at_group(
                        col * ICON_SIZE,
                        line * ICON_SIZE,
                        ITEMS_IMG_KEY,
                        undefined,
                        this_item.key_name,
                        SPRITE_GROUP_KEY
                    );
                }

                if (this.item_grid[line][col].broken) {
                    let dead_broken = this.sprite_group.children.filter((b: Phaser.Sprite) => {
                        return b.alive === false && b.frameName === BROKEN_IMG_KEY;
                    });
                    if (dead_broken.length > 0)
                        (dead_broken[0] as Phaser.Sprite).reset(col * ICON_SIZE, line * ICON_SIZE);
                    else
                        this.window.create_at_group(
                            col * ICON_SIZE,
                            line * ICON_SIZE,
                            "menu",
                            undefined,
                            BROKEN_IMG_KEY,
                            SPRITE_GROUP_KEY
                        );
                }

                if (this.item_grid[line][col].equipped) {
                    let dead_icons = this.icon_group.children.filter((e: Phaser.Sprite) => {
                        return e.alive === false && e.frameName === EQUIPPED_IMG_KEY;
                    });
                    if (dead_icons.length > 0)
                        (dead_icons[0] as Phaser.Sprite).reset(col * ICON_SIZE, line * ICON_SIZE);
                    else
                        this.window.create_at_group(
                            col * ICON_SIZE,
                            line * ICON_SIZE,
                            "menu",
                            undefined,
                            EQUIPPED_IMG_KEY,
                            ICON_GROUP_KEY
                        );
                }

                if (this.item_grid[line][col].quantity > 1) {
                    let dead_text = this.icon_group.children.filter((t: Phaser.BitmapText) => {
                        return t.alive === false && t.text !== undefined;
                    });
                    if (dead_text.length > 0) {
                        (dead_text[0] as Phaser.BitmapText).text = this.item_grid[line][col].quantity.toString();
                        (dead_text[0] as Phaser.BitmapText).reset(col * ICON_SIZE, line * ICON_SIZE);
                        dead_text[0].x += SUB_TEXT_X_SHIFT - (dead_text[0] as Phaser.BitmapText).width;
                    } else {
                        let item_count = this.game.add.bitmapText(
                            col * ICON_SIZE,
                            line * ICON_SIZE,
                            "gs-item-bmp-font",
                            this.item_grid[line][col].quantity.toString()
                        );
                        item_count.x += SUB_TEXT_X_SHIFT - item_count.width;
                        this.window.add_to_internal_group(ICON_GROUP_KEY, item_count);
                    }
                }
            }
            if (finish) break;
        }
        this.sprite_group.alpha = 1;
    }

    refresh(char_key: string, item?: string) {
        this.char = this.data.info.party_data.members.filter(c => {
            return c.key_name === char_key;
        })[0];
        this.selected_item = item;

        kill_all_sprites(this.sprite_group);
        kill_all_sprites(this.icon_group);

        this.make_item_grid();
        this.set_sprites();
    }

    /*Opens this window for a given character

    Input: char_key [string] - The character's key name
           item [string] - The item to check against
           expand [boolean] - If true, the window will be in expanded state
           open_callback [function] - Callback function (Optional)*/
    open(char_key: string, item?: string, expand: boolean = false, open_callback?: Function) {
        this.char = this.data.info.party_data.members.filter(c => {
            return c.key_name === char_key;
        })[0];
        this.selected_item = item;

        this.make_item_grid();
        this.check_expand(expand);
        this.set_sprites();

        this.is_open = true;
        this.window.show(open_callback, false);
    }

    /*Clears information and closes the window

    Input: destroy [boolean] - If true, sprites are destroyed*/
    close(callback?: Function, destroy = false) {
        kill_all_sprites(this.sprite_group, destroy);
        kill_all_sprites(this.icon_group, destroy);

        this.text.text.alpha = 0;
        this.text.shadow.alpha = 0;
        this.char = null;
        this.selected_item = null;
        this.cursor_pos = {line: 0, col: 0};
        this.item_grid = [];
        this.check_expand(false);

        this.is_open = false;
        this.window.close(callback, false);
    }
}
