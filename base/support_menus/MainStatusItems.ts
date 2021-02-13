import {StatusComponent} from "./StatusComponent";
import {Window} from "../Window";
import {GoldenSun} from "../GoldenSun";
import {CursorManager, PointVariants} from "../utils/CursorManager";
import {equip_slots, ItemSlot, item_equip_slot} from "../MainChar";
import {MainStatusMenu} from "../main_menus/MainStatusMenu";

export class MainStatusItems extends StatusComponent {
    private static readonly CURSOR = {
        X: 106,
        Y: 58,
    };
    private static readonly HIGHLIGHT = {
        X: 120,
        Y: 16,
        WIDTH: 112,
        HEIGHT: 8,
    };
    private static readonly ITEM = {
        ICON_X: 121,
        ICON_Y: 11,
        NAME_X: 144,
        NAME_Y: 16,
    };
    private static readonly STATS = {
        LABEL_X: 40,
        LABEL_Y: 24,
        VALUE_END_X: 109,
        VALUE_Y: 24,
        LINE_SHIFT: 8,
    };
    private static readonly EQ_HIGHLIGHT = {
        X: 16,
        Y: 16,
        WIDTH: 96,
        HEIGHT: 8,
        SHIFT: 16,
        POS: {
            [equip_slots.WEAPON]: 0,
            [equip_slots.HEAD]: 1,
            [equip_slots.CHEST]: 2,
            [equip_slots.BODY]: 3,
        },
    };

    private static readonly MAX_LINES = 5;
    private static readonly SHIFT = 16;

    private char_items: ItemSlot[][];

    public constructor(
        game: Phaser.Game,
        data: GoldenSun,
        window: Window,
        manager: MainStatusMenu,
        pos?: {line: number; col: number}
    ) {
        super(game, data, window, manager, pos);
    }

    public select_option() {
        const highlight = {
            x: MainStatusItems.HIGHLIGHT.X,
            y: MainStatusItems.HIGHLIGHT.Y + MainStatusItems.SHIFT * this.current_line,
            width: MainStatusItems.HIGHLIGHT.WIDTH,
            height: MainStatusItems.HIGHLIGHT.HEIGHT,
        };
        this.update_highlight(highlight);

        const cursor_x = MainStatusItems.CURSOR.X;
        const cursor_y = MainStatusItems.CURSOR.Y + MainStatusItems.SHIFT * this.current_line;

        const cursor_tween = {type: CursorManager.CursorTweens.POINT, variant: PointVariants.NORMAL};
        this.data.cursor_manager.move_to({x: cursor_x, y: cursor_y}, {animate: false, tween_config: cursor_tween});

        this.window.page_indicator.select_page(this.current_col);
    }

    public on_change() {
        if (!this.char_items[this.current_col][this.current_line])
            this.current_line = this.char_items[this.current_col].length - 1;

        const chosen_item = this.char_items[this.current_col][this.current_line];
        this.select_option();

        const eq_slot = item_equip_slot[this.data.info.items_list[chosen_item.key_name].type];
        const slots = [equip_slots.WEAPON, equip_slots.BODY, equip_slots.CHEST, equip_slots.HEAD];

        const eq_highlight = {x: 0, y: 0, width: 0, height: 0};

        if (slots.includes(eq_slot) && chosen_item.equipped) {
            const eq_highlight_shift = MainStatusItems.EQ_HIGHLIGHT.SHIFT * MainStatusItems.EQ_HIGHLIGHT.POS[eq_slot];

            eq_highlight.x = MainStatusItems.EQ_HIGHLIGHT.X;
            eq_highlight.y = MainStatusItems.EQ_HIGHLIGHT.Y + eq_highlight_shift;
            eq_highlight.width = MainStatusItems.EQ_HIGHLIGHT.WIDTH;
            eq_highlight.height = MainStatusItems.EQ_HIGHLIGHT.HEIGHT;
        }

        (this.manager as MainStatusMenu).update_eq_highlight(eq_highlight);
        this.update_description(this.data.info.items_list[chosen_item.key_name].description);
    }

    public on_left() {
        if (this.char_items.length <= 1) return;

        const pages = this.char_items.length;
        this.current_col = (this.current_col + pages - 1) % pages;

        if (!this.char_items[this.current_col][this.current_line])
            this.current_line = this.char_items[this.current_col].length - 1;

        this.reset();
    }

    public on_right() {
        if (this.char_items.length <= 1) return;

        const pages = this.char_items.length;
        this.current_col = (this.current_col + 1) % pages;

        if (!this.char_items[this.current_col][this.current_line])
            this.current_line = this.char_items[this.current_col].length - 1;

        this.reset();
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
            this.reset();
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
            this.reset();
        } else {
            this.current_line++;
            this.on_change();
        }
    }

    public initialize() {
        this.update_items();

        if (!this.char_items[this.current_col]) this.current_col = this.char_items.length - 1;

        const items = this.char_items[this.current_col];

        items.forEach((item, index) => {
            const item_key = item.key_name;
            const name = this.data.info.items_list[item.key_name].name;
            const broken = item.broken;
            const equipped = item.equipped;
            const quantity = item.quantity <= 1 ? undefined : item.quantity;

            let x_pos = MainStatusItems.ITEM.ICON_X;
            let y_pos = MainStatusItems.ITEM.ICON_Y + index * MainStatusItems.SHIFT;

            const item_obj = this.window.make_item_obj(
                item_key,
                {x: x_pos, y: y_pos},
                {
                    broken: broken,
                    equipped: equipped,
                    quantity: quantity,
                    internal_group: MainStatusItems.GROUP_KEY,
                }
            );
            for (let obj in item_obj) {
                if (item_obj[obj]) this.state_sprites.push(item_obj[obj]);
            }

            x_pos = MainStatusItems.ITEM.NAME_X;
            y_pos = MainStatusItems.ITEM.NAME_Y + index * MainStatusItems.SHIFT;

            const name_text = this.window.set_text_in_position(
                name,
                x_pos,
                y_pos,
                false,
                false,
                undefined,
                false,
                MainStatusItems.GROUP_KEY
            );
            this.state_sprites.push(name_text.text, name_text.shadow);
        });

        let txt = this.window.set_text_in_position(
            "Attack",
            MainStatusItems.STATS.LABEL_X,
            MainStatusItems.STATS.LABEL_Y,
            false,
            false,
            undefined,
            false,
            MainStatusItems.GROUP_KEY
        );
        this.state_sprites.push(txt.text, txt.shadow);

        txt = this.window.set_text_in_position(
            String(this.selected_char.atk),
            MainStatusItems.STATS.VALUE_END_X,
            MainStatusItems.STATS.VALUE_Y,
            true,
            false,
            undefined,
            false,
            MainStatusItems.GROUP_KEY
        );
        this.state_sprites.push(txt.text, txt.shadow);

        txt = this.window.set_text_in_position(
            "Defense",
            MainStatusItems.STATS.LABEL_X,
            MainStatusItems.STATS.LABEL_Y + MainStatusItems.STATS.LINE_SHIFT,
            false,
            false,
            undefined,
            false,
            MainStatusItems.GROUP_KEY
        );
        this.state_sprites.push(txt.text, txt.shadow);

        txt = this.window.set_text_in_position(
            String(this.selected_char.def),
            MainStatusItems.STATS.VALUE_END_X,
            MainStatusItems.STATS.VALUE_Y + MainStatusItems.STATS.LINE_SHIFT,
            true,
            false,
            undefined,
            false,
            MainStatusItems.GROUP_KEY
        );
        this.state_sprites.push(txt.text, txt.shadow);

        this.window.page_indicator.initialize(this.char_items.length, this.current_line);
        this.select_option();
    }

    private update_items() {
        const all_items = [...this.selected_char.items];
        this.char_items = [];

        let page_items = [];
        let count = 0;

        all_items.forEach(item_slot => {
            if (count === MainStatusItems.MAX_LINES) {
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
