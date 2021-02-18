import {StatusComponent} from "./StatusComponent";
import {Window} from "../Window";
import {GoldenSun} from "../GoldenSun";
import {CursorManager, PointVariants} from "../utils/CursorManager";
import {BattleStatusWindow} from "../windows/battle/BattleStatusWindow";
import {PageIndicatorModes} from "./PageIndicator";
import {ItemSlot} from "../MainChar";
import {DEFAULT_FONT_COLOR, RED_FONT_COLOR, YELLOW_FONT_COLOR} from "../magic_numbers";

export class BattleStatusItems extends StatusComponent {
    private static readonly CURSOR = {
        X: 10,
        Y: 79,
    };
    private static readonly HIGHLIGHT = {
        X: 8,
        Y: 72,
        WIDTH: 160,
        HEIGHT: 8,
    };
    private static readonly ITEM = {
        ICON_X: 23,
        ICON_Y: 68,
        NAME_X: 40,
        NAME_Y: 72,
    };
    private static readonly PAGE_INDICATOR_ANCHOR = {
        X: 171,
        Y: 64,
    };

    private static readonly MAX_LINES = 4;
    private static readonly SHIFT = 16;

    private char_items: ItemSlot[][];

    public constructor(
        game: Phaser.Game,
        data: GoldenSun,
        window: Window,
        manager: BattleStatusWindow,
        pos?: {line: number; col: number}
    ) {
        super(game, data, window, manager, pos);
    }

    public select_option() {
        const highlight = {
            x: BattleStatusItems.HIGHLIGHT.X,
            y: BattleStatusItems.HIGHLIGHT.Y + BattleStatusItems.SHIFT * this.current_line,
            width: BattleStatusItems.HIGHLIGHT.WIDTH,
            height: BattleStatusItems.HIGHLIGHT.HEIGHT,
        };
        this.update_highlight(highlight);

        const cursor_x = BattleStatusItems.CURSOR.X;
        const cursor_y = BattleStatusItems.CURSOR.Y + BattleStatusItems.SHIFT * this.current_line;

        const cursor_tween = {type: CursorManager.CursorTweens.POINT, variant: PointVariants.SHORT};
        this.data.cursor_manager.move_to({x: cursor_x, y: cursor_y}, {animate: false, tween_config: cursor_tween});

        this.window.page_indicator.select_page(this.current_col);
    }

    public on_change() {
        if (!this.char_items[this.current_col][this.current_line])
            this.current_line = this.char_items[this.current_col].length - 1;

        this.select_option();

        const chosen_item = this.char_items[this.current_col][this.current_line];
        this.update_description(this.data.info.items_list[chosen_item.key_name].description);
    }

    public on_left() {
        if (this.char_items.length <= 1) return;

        const pages = this.char_items.length;
        this.current_col = (this.current_col + pages - 1) % pages;

        if (!this.char_items[this.current_col][this.current_line])
            this.current_line = this.char_items[this.current_col].length - 1;

        this.reset(undefined, true);
    }

    public on_right() {
        if (this.char_items.length <= 1) return;

        const pages = this.char_items.length;
        this.current_col = (this.current_col + 1) % pages;

        if (!this.char_items[this.current_col][this.current_line])
            this.current_line = this.char_items[this.current_col].length - 1;

        this.reset(undefined, true);
    }

    public on_up() {
        if (this.char_items[this.current_col].length <= 1) return;

        if (this.current_line === 0) {
            if (this.current_col === 0) {
                this.current_col = this.char_items.length - 1;
                this.current_line = this.char_items[this.char_items.length - 1].length - 1;
            } else {
                this.current_col = this.current_col - 1;
                this.current_line = this.char_items[this.current_col].length - 1;
            }
            this.reset(undefined, true);
        } else {
            this.current_line--;
            this.on_change();
        }
    }

    public on_down() {
        if (this.char_items[this.current_col].length <= 1) return;

        if (this.current_line + 1 === this.char_items[this.current_col].length) {
            if (this.current_col === this.char_items.length - 1) {
                this.current_col = 0;
                this.current_line = 0;
            } else {
                this.current_col = this.current_col + 1;
                this.current_line = 0;
            }
            this.reset(undefined, true);
        } else {
            this.current_line++;
            this.on_change();
        }
    }

    public initialize() {
        const page_indicator_anchor = {
            x: BattleStatusItems.PAGE_INDICATOR_ANCHOR.X,
            y: BattleStatusItems.PAGE_INDICATOR_ANCHOR.Y,
        };

        this.update_items();

        if (!this.char_items[this.current_col]) this.current_col = this.char_items.length - 1;
        const items = this.char_items[this.current_col];

        items.forEach((item_slot, index) => {
            const item_key = item_slot.key_name;
            const item = this.data.info.items_list[item_slot.key_name];
            const name = item.name;
            const broken = item_slot.broken;
            const equipped = item_slot.equipped;
            const quantity = item_slot.quantity <= 1 ? undefined : item_slot.quantity;

            let x_pos = BattleStatusItems.ITEM.ICON_X;
            let y_pos = BattleStatusItems.ITEM.ICON_Y + index * BattleStatusItems.SHIFT;

            const item_obj = this.window.make_item_obj(
                item_key,
                {x: x_pos, y: y_pos},
                {
                    broken: broken,
                    equipped: equipped,
                    quantity: quantity,
                    internal_group: BattleStatusItems.GROUP_KEY,
                }
            );
            for (let obj in item_obj) {
                if (item_obj[obj]) this.state_sprites.push(item_obj[obj]);
            }

            x_pos = BattleStatusItems.ITEM.NAME_X;
            y_pos = BattleStatusItems.ITEM.NAME_Y + index * BattleStatusItems.SHIFT;

            let font_color = YELLOW_FONT_COLOR;
            if (item_slot.broken) {
                font_color = RED_FONT_COLOR;
            } else if (item.use_ability && this.data.info.abilities_list[item.use_ability].is_battle_ability) {
                font_color = DEFAULT_FONT_COLOR;
            }

            const name_text = this.window.set_text_in_position(name, x_pos, y_pos, {
                color: font_color,
                internal_group_key: BattleStatusItems.GROUP_KEY,
            });
            this.state_sprites.push(name_text.text, name_text.shadow);
        });

        this.window.page_indicator.position = page_indicator_anchor;
        this.window.page_indicator.initialize(this.char_items.length, this.current_line, PageIndicatorModes.FLASH);
        this.select_option();
    }

    private update_items() {
        const all_items = [...this.selected_char.items];

        this.char_items = [];
        let sorted_items = [];

        all_items.forEach((item_slot, index) => {
            const item = this.data.info.items_list[item_slot.key_name];
            if (item.use_ability && this.data.info.abilities_list[item.use_ability].is_battle_ability) {
                sorted_items.push(all_items.splice(index, 1)[0]);
            }
        });

        let page_items = [];
        let count = 0;

        sorted_items = sorted_items.concat(all_items);
        sorted_items.forEach(item_slot => {
            if (count === BattleStatusItems.MAX_LINES) {
                this.char_items.push(page_items);
                page_items = [];
                count = 0;
            }

            page_items.push(item_slot);
            count++;
        });
        if (page_items.length > 0) this.char_items.push(page_items);
    }
}
