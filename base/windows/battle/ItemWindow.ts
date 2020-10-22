import { TextObj, Window } from "../../Window";
import { CursorControl } from '../../utils/CursorControl';
import * as numbers from "../../magic_numbers";
import { use_types } from "../../Item";
import { GoldenSun } from "../../GoldenSun";
import { ItemSlot, MainChar } from "../../MainChar";
import * as _ from "lodash";

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
const ITEM_NAME_X = 26;
const CURSOR_X = 116;
const CURSOR_Y = 84;
const CURSOR_SHIFT = 16;
const ITEM_ICON_X = 8;
const SUB_ICON_X = 7;
const SUB_ICON_Y = 8;

export class ItemWindow {
    public game: Phaser.Game;
    public data: GoldenSun;
    public esc_propagation_priority: number;
    public enter_propagation_priority: number;
    public base_window: Window;
    public group: Phaser.Group;
    public button: Phaser.Sprite;
    public highlight_bar: Phaser.Graphics;
    public signal_bindings: Phaser.SignalBinding[];
    public item_names: TextObj[];
    public other_sprites: (Phaser.Sprite|Phaser.Group|Phaser.BitmapText)[];
    public cursor_control: CursorControl;
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

    constructor(game, data) {
        this.game = game;
        this.data = data;

        this.base_window = new Window(this.game, BASE_WINDOW_X, BASE_WINDOW_Y, BASE_WINDOW_WIDTH, BASE_WINDOW_HEIGHT);
        this.base_window.init_page_indicator_bar();
        this.group = this.game.add.group();
        this.button = this.group.create(BUTTON_X, BUTTON_Y, "buttons", "item");
        this.group.alpha = 0;
        this.highlight_bar = this.game.add.graphics(0, 0);
        this.highlight_bar.blendMode = PIXI.blendModes.SCREEN;
        this.highlight_bar.alpha = 0;
        this.base_window.add_sprite_to_group(this.highlight_bar);
        this.highlight_bar.beginFill(this.base_window.color, 1);
        this.highlight_bar.drawRect(HIGHLIGHT_BAR_X, 0, HIGHLIGHT_BAR_WIDTH, HIGHLIGHT_BAR_HEIGHT);
        this.highlight_bar.endFill();
        this.signal_bindings = this.set_control();
        this.item_names = [];
        this.other_sprites = [];
        this.cursor_control = new CursorControl(this.game, true, true, this.get_max_pages.bind(this), this.get_max_elem_on_page.bind(this),
            this.group, this.change_page.bind(this), this.change_item.bind(this), this.get_page_index.bind(this), this.set_page_index.bind(this),
            this.get_item_index.bind(this), this.set_item_index.bind(this), this.is_open.bind(this), this.is_active.bind(this),
            this.get_cursor_x.bind(this), this.get_cursor_y.bind(this));
    }

    set_control() {
        return [
            this.data.esc_input.add(() => {
                if (!this.window_open || !this.window_active) return;
                this.data.esc_input.halt();
                this.choosen_ability = null;
                this.item_obj = null;
                this.close(this.close_callback);
            }, this, this.esc_propagation_priority),
            this.data.enter_input.add(() => {
                if (!this.window_open || !this.window_active) return;
                this.data.enter_input.halt();
                const this_item = this.data.info.items_list[this.items[this.item_index].key_name];
                if (this_item.use_type !== use_types.NO_USE && this.data.info.abilities_list[this_item.use_ability].is_battle_ability) {
                    this.choosen_ability = this_item.use_ability;
                    this.item_obj = this.items[this.item_index];
                    this.hide(this.close_callback);
                }
            }, this, this.enter_propagation_priority)
        ];
    }

    get_cursor_x() {
        return CURSOR_X;
    }

    get_cursor_y() {
        return CURSOR_Y + (this.item_index * CURSOR_SHIFT);
    }

    is_open() {
        return this.window_open;
    }

    is_active() {
        return this.window_active;
    }

    get_page_index() {
        return this.page_index;
    }

    set_page_index(index) {
        this.page_index = index;
    }

    get_item_index() {
        return this.item_index;
    }

    set_item_index(index) {
        this.item_index = index;
    } 

    get_max_elem_on_page() {
        return this.items.length;
    }

    get_max_pages() {
        return this.page_number;
    }

    update_position() {
        this.group.x = this.game.camera.x;
        this.group.y = this.game.camera.y;
    }

    change_page(before_index, after_index) {
        this.config_page();
        if (this.item_index >= this.items.length) {
            this.item_index = this.items.length - 1;
            this.cursor_control.set_cursor_position();
        }
        if (this.set_description) {
            this.set_description(this.data.info.items_list[this.items[this.item_index].key_name].description);
        }
        this.set_highlight_bar();
        this.base_window.set_page_indicator_highlight(this.page_number, this.page_index);
    }

    change_item(before_index, after_index) {
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
            this.other_sprites.push(this.base_window.create_at_group(ITEM_ICON_X, item_y, "items_icons", undefined, this.items[i].key_name));
            if (this.items[i].equipped) {
                this.other_sprites.push(this.base_window.create_at_group(ITEM_ICON_X + SUB_ICON_X, item_y + SUB_ICON_Y, "equipped"));
            }
            if (this.items[i].quantity > 1) {
                let item_count = this.game.add.bitmapText(ITEM_ICON_X + SUB_ICON_X, item_y + SUB_ICON_Y, 'gs-item-bmp-font', this.items[i].quantity.toString());
                this.base_window.add_sprite_to_group(item_count);
                this.other_sprites.push(item_count);
            }
            let color = numbers.DEFAULT_FONT_COLOR;
            if (item.use_type === use_types.NO_USE || !this.data.info.abilities_list[item.use_ability].is_battle_ability) {
                color = numbers.YELLOW_FONT_COLOR;
            }
            const name = this.base_window.set_text_in_position(item.name, ITEM_NAME_X, base_y, false, false, color);
            this.item_names.push(name);
        }
    }

    set_page_number() {
        const list_length = this.all_items.length;
        this.page_number = (((list_length - 1)/ELEM_PER_PAGE) | 0) + 1;
        if (this.page_index >= this.page_number) {
            this.page_index = this.page_number - 1;
        }
    }

    mount_window() {
        this.all_items = this.char.items;
        this.all_items = _.sortBy(this.all_items, [item_obj => {
            return this.data.info.items_list[item_obj.key_name].use_type === use_types.NO_USE ||
                !this.data.info.abilities_list[this.data.info.items_list[item_obj.key_name].use_ability].is_battle_ability;
        }]);
        this.set_page_number();
        this.base_window.set_page_indicator(this.page_number, this.page_index);
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

    open(char, close_callback, set_description) {
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
        this.cursor_control.activate();
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
        this.cursor_control.activate();
        this.base_window.show(() => {
            this.window_active = true;
        }, false);
    }

    hide(callback) {
        this.group.alpha = 0;
        this.highlight_bar.alpha = 0;
        this.cursor_control.deactivate();
        this.base_window.close(() => {
            this.window_active = false;
            if (callback !== undefined) {
                callback(this.choosen_ability, this.item_obj);
            }
        }, false);
    }

    close(callback?:Function) {
        this.clear_sprites();
        this.base_window.unset_page_indicator();
        this.group.alpha = 0;
        this.highlight_bar.alpha = 0;
        this.cursor_control.deactivate();
        this.base_window.close(() => {
            this.window_open = false;
            this.window_active = false;
            if (callback !== undefined) {
                callback(this.choosen_ability, this.item_obj);
            }
        }, false);
    }

    destroy() {
        this.signal_bindings.forEach(signal_binding => {
            signal_binding.detach();
        });
        this.base_window.destroy(false);
        this.group.destroy();
        this.cursor_control.destroy();
    }
}