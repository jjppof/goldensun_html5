import {TextObj, Window} from "../../Window";
import * as numbers from "../../magic_numbers";
import {use_types} from "../../Item";
import {GoldenSun} from "../../GoldenSun";
import {Button} from "../../XGamepad";
import {ItemSlot, MainChar} from "../../MainChar";
import * as _ from "lodash";
import {CursorManager, PointVariants} from "../../utils/CursorManager";
import {PageIndicatorModes} from "../../support_menus/PageIndicator";

//TO DO: use item sprite instead of ability sprite for items (Spirit Ring)
//TO DO: show broken icon on broken items

const BASE_WINDOW_X = 120;
const BASE_WINDOW_Y = 72;
const BASE_WINDOW_WIDTH = 116;
const BASE_WINDOW_HEIGHT = 84;

const ELEM_PER_PAGE = 5;
const TOP_PADDING = 8;
const SPACE_BETWEEN_ITEMS = 8;

const HIGHLIGHT_BAR_WIDTH = 104;
const HIGHLIGHT_BAR_HEIGHT = 8;
const HIGHLIGHT_BAR_X = 8;

const BUTTON_X = 96;
const BUTTON_Y = 136;

const CURSOR_X = 116;
const CURSOR_Y = 84;
const CURSOR_SHIFT = 16;

const ITEM_NAME_X = 26;
const ITEM_ICON_X = 8;
const SUB_ICON_X = 7;
const SUB_ICON_Y = 8;

export class BattleItemWindow {
    public game: Phaser.Game;
    public data: GoldenSun;

    public base_window: Window;
    public group: Phaser.Group;

    public button: Phaser.Sprite;
    public highlight_bar: Phaser.Graphics;

    public item_names: TextObj[];
    public other_sprites: (Phaser.Sprite | Phaser.Group | Phaser.BitmapText)[];

    public window_open: boolean;
    public window_active: boolean;

    public item_index: number;
    public page_index: number;
    public page_number: number;

    public close_callback: Function;
    public set_description: Function;
    public choosen_ability: string;

    public item_obj: ItemSlot;
    public items: ItemSlot[];
    public all_items: ItemSlot[];
    public char: MainChar;

    constructor(game: Phaser.Game, data: GoldenSun) {
        this.game = game;
        this.data = data;

        this.base_window = new Window(this.game, BASE_WINDOW_X, BASE_WINDOW_Y, BASE_WINDOW_WIDTH, BASE_WINDOW_HEIGHT);
        this.group = this.game.add.group();
        this.group.alpha = 0;

        this.button = this.group.create(BUTTON_X, BUTTON_Y, "buttons", "item");
        this.highlight_bar = this.game.add.graphics(0, 0);
        this.highlight_bar.blendMode = PIXI.blendModes.SCREEN;
        this.highlight_bar.alpha = 0;

        this.base_window.add_sprite_to_group(this.highlight_bar);
        this.highlight_bar.beginFill(this.base_window.color, 1);
        this.highlight_bar.drawRect(HIGHLIGHT_BAR_X, 0, HIGHLIGHT_BAR_WIDTH, HIGHLIGHT_BAR_HEIGHT);
        this.highlight_bar.endFill();

        this.item_names = [];
        this.other_sprites = [];
    }

    select_item(index: number) {
        this.item_index = index;

        let cursor_x = CURSOR_X;
        let cursor_y = CURSOR_Y + this.item_index * CURSOR_SHIFT;

        let tween_config = {
            type: CursorManager.CursorTweens.POINT,
            variant: PointVariants.NORMAL,
        };
        this.data.cursor_manager.move_to({x: cursor_x, y: cursor_y}, {animate: false, tween_config: tween_config});
        this.change_item();
    }

    next_item() {
        if (this.items.length === 1) return;
        this.select_item((this.item_index + 1) % this.items.length);
    }

    previous_item() {
        if (this.items.length === 1) return;
        this.select_item((this.item_index + this.items.length - 1) % this.items.length);
    }

    next_page() {
        if (this.page_number === 1) return;

        this.page_index = (this.page_index + 1) % this.page_number;
        this.change_page();
    }

    previous_page() {
        if (this.page_number === 1) return;

        this.page_index = (this.page_index + this.page_number - 1) % this.page_number;
        this.change_page();
    }

    update_position() {
        this.group.x = this.game.camera.x;
        this.group.y = this.game.camera.y;
    }

    change_page() {
        this.config_page();

        if (this.item_index >= this.items.length) {
            this.item_index = this.items.length - 1;
            this.select_item(this.item_index);
        }

        if (this.set_description) {
            this.set_description(this.data.info.items_list[this.items[this.item_index].key_name].description);
        }

        this.set_highlight_bar();
        this.base_window.page_indicator.select_page(this.page_index);
    }

    change_item() {
        if (this.set_description) {
            this.set_description(this.data.info.items_list[this.items[this.item_index].key_name].description);
        }
        this.set_highlight_bar();
    }

    set_highlight_bar() {
        this.highlight_bar.y = TOP_PADDING + this.item_index * (SPACE_BETWEEN_ITEMS + HIGHLIGHT_BAR_HEIGHT);
    }

    config_page() {
        this.clear_sprites();
        this.items = this.all_items.slice(this.page_index * ELEM_PER_PAGE, (this.page_index + 1) * ELEM_PER_PAGE);

        for (let i = 0; i < this.items.length; ++i) {
            const item = this.data.info.items_list[this.items[i].key_name];
            const base_y = TOP_PADDING + i * (SPACE_BETWEEN_ITEMS + HIGHLIGHT_BAR_HEIGHT);
            const item_y = base_y - 4;

            this.other_sprites.push(
                this.base_window.create_at_group(ITEM_ICON_X, item_y, "items_icons", undefined, this.items[i].key_name)
            );
            if (this.items[i].equipped) {
                this.other_sprites.push(
                    this.base_window.create_at_group(
                        ITEM_ICON_X + SUB_ICON_X,
                        item_y + SUB_ICON_Y,
                        "menu",
                        undefined,
                        "equipped"
                    )
                );
            }
            if (this.items[i].quantity > 1) {
                let item_count = this.game.add.bitmapText(
                    ITEM_ICON_X + SUB_ICON_X,
                    item_y + SUB_ICON_Y,
                    "gs-item-bmp-font",
                    this.items[i].quantity.toString()
                );
                this.base_window.add_sprite_to_group(item_count);
                this.other_sprites.push(item_count);
            }

            let color = numbers.DEFAULT_FONT_COLOR;
            if (
                item.use_type === use_types.NO_USE ||
                !this.data.info.abilities_list[item.use_ability].is_battle_ability
            ) {
                color = numbers.YELLOW_FONT_COLOR;
            }

            const name = this.base_window.set_text_in_position(item.name, ITEM_NAME_X, base_y, false, false, color);
            this.item_names.push(name);
        }
    }

    set_page_number() {
        const list_length = this.all_items.length;
        this.page_number = (((list_length - 1) / ELEM_PER_PAGE) | 0) + 1;

        if (this.page_index >= this.page_number) {
            this.page_index = this.page_number - 1;
        }
        this.base_window.page_indicator.initialize(this.page_number, this.page_index, PageIndicatorModes.FLASH);
    }

    mount_window() {
        this.all_items = this.char.items;
        this.all_items = _.sortBy(this.all_items, [
            item_obj => {
                return (
                    this.data.info.items_list[item_obj.key_name].use_type === use_types.NO_USE ||
                    !this.data.info.abilities_list[this.data.info.items_list[item_obj.key_name].use_ability]
                        .is_battle_ability
                );
            },
        ]);

        this.set_page_number();
        this.config_page();
    }

    clear_sprites() {
        this.item_names.forEach(text => {
            this.base_window.remove_text(text);
        });
        this.other_sprites.forEach(sprite => {
            this.base_window.remove_from_group(sprite, true);
        });
    }

    item_choose() {
        const controls = [
            {button: Button.LEFT, on_down: this.previous_page.bind(this), sfx: {down: "menu/move"}},
            {button: Button.RIGHT, on_down: this.next_page.bind(this), sfx: {down: "menu/move"}},
            {button: Button.UP, on_down: this.previous_item.bind(this), sfx: {down: "menu/move"}},
            {button: Button.DOWN, on_down: this.next_item.bind(this), sfx: {down: "menu/move"}},
            {
                button: Button.A,
                on_down: () => {
                    const this_item = this.data.info.items_list[this.items[this.item_index].key_name];
                    if (
                        this_item.use_type !== use_types.NO_USE &&
                        this.data.info.abilities_list[this_item.use_ability].is_battle_ability
                    ) {
                        this.choosen_ability = this_item.use_ability;
                        this.item_obj = this.items[this.item_index];
                        this.hide(this.close_callback);
                    }
                },
                sfx: {down: "menu/positive"},
            },
            {
                button: Button.B,
                on_down: () => {
                    this.choosen_ability = null;
                    this.item_obj = null;
                    this.close(this.close_callback);
                },
                sfx: {down: "menu/negative"},
            },
        ];

        this.data.control_manager.add_controls(controls, {
            loop_config: {vertical: true, horizontal: true},
        });
    }

    open(char: MainChar, close_callback: Function, set_description: Function, ...args: any[]) {
        this.char = char;
        this.close_callback = close_callback;
        this.set_description = set_description;

        this.group.alpha = 1;
        this.item_index = 0;
        this.page_index = 0;
        this.choosen_ability = null;
        this.highlight_bar.alpha = 1;

        this.update_position();
        this.set_highlight_bar();
        this.mount_window();

        this.select_item(0);
        this.item_choose();

        if (this.set_description) {
            this.set_description(this.data.info.items_list[this.items[this.item_index].key_name].description);
        }

        this.base_window.show(() => {
            this.window_open = true;
            this.window_active = true;
        }, false);
    }

    show() {
        this.group.alpha = 1;
        this.highlight_bar.alpha = 1;

        this.select_item(this.item_index);
        this.item_choose();

        this.base_window.show(() => {
            this.window_active = true;
        }, false);
    }

    hide(callback?: Function) {
        this.group.alpha = 0;
        this.highlight_bar.alpha = 0;
        this.data.cursor_manager.hide();

        this.base_window.close(() => {
            this.window_active = false;
            if (callback !== undefined) {
                callback(this.choosen_ability, this.item_obj);
            }
        }, false);
    }

    close(callback?: Function) {
        this.clear_sprites();
        this.base_window.page_indicator.terminante();

        this.group.alpha = 0;
        this.highlight_bar.alpha = 0;
        this.data.cursor_manager.hide();
        this.data.control_manager.reset();

        this.base_window.close(() => {
            this.window_open = false;
            this.window_active = false;
            if (callback !== undefined) {
                callback(this.choosen_ability, this.item_obj);
            }
        }, false);
    }

    destroy() {
        this.base_window.destroy(false);
        this.group.destroy();
        this.data.cursor_manager.hide();
        this.data.control_manager.reset();
    }
}
