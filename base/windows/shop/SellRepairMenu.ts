import {GoldenSun} from "../../GoldenSun";
import {ItemSlot, MainChar} from "../../MainChar";
import {ShopMenu} from "../../main_menus/ShopMenu";
import {Window} from "../../Window";
import {YesNoMenu} from "../YesNoMenu";
import {InventoryWindow} from "./InventoryWindow";
import {CharsMenu, CharsMenuModes} from "../../support_menus/CharsMenu";
import {ShopItemQuantityWindow} from "./ShopItemQuantityWindow";
import {ShopkeepDialog} from "./ShopkeepDialog";

const SELL_MULTIPLIER = 3 / 4;
const REPAIR_MULTIPLIER = 1 / 4;
const SELL_BROKEN_MULTIPLIER = SELL_MULTIPLIER - REPAIR_MULTIPLIER;

const REPAIR_WAIT_TIME = Phaser.Timer.SECOND * 6;

const YESNO_X = 56;
const YESNO_Y = 40;

export const WindowNames = {
    ITEM_DESC_WIN: "item_desc_win",
    ITEM_PRICE_WIN: "item_price_win",
    YOUR_COINS_WIN: "your_coins_win",
    CHAR_DISPLAY: "char_display",
    INV_WIN: "inv_win",
    YESNO_ACTION: "yesno_action",
    QUANT_WIN: "quant_win",
};

export class SellRepairMenu {
    public game: Phaser.Game;
    public data: GoldenSun;
    public parent: ShopMenu;
    public close_callback: Function;

    public item_desc_win: Window;
    public your_coins_win: Window;
    public item_price_win: Window;
    public char_display: CharsMenu;
    public inv_win: InventoryWindow;
    public quant_win: ShopItemQuantityWindow;
    public yesno_action: YesNoMenu;
    public npc_dialog: ShopkeepDialog;

    public is_repair_menu: boolean;
    public active: boolean;

    public selected_item: ItemSlot;
    public inv_win_pos: {line: number; col: number};

    public selected_character: MainChar;
    public selected_char_index: number;

    constructor(game: Phaser.Game, data: GoldenSun, parent: ShopMenu) {
        this.game = game;
        this.data = data;
        this.parent = parent;
        this.close_callback = null;

        this.item_desc_win = this.parent.item_desc_win;
        this.your_coins_win = this.parent.your_coins_win;
        this.item_price_win = this.parent.item_price_win;
        this.char_display = this.parent.char_display;
        this.inv_win = this.parent.inv_win;
        this.quant_win = this.parent.quant_win;
        this.yesno_action = this.parent.yesno_action;
        this.npc_dialog = this.parent.npc_dialog;

        this.is_repair_menu = null;
        this.active = false;

        this.selected_item = null;
        this.inv_win_pos = {line: 0, col: 0};

        this.selected_character = null;
        this.selected_char_index = 0;
    }

    get_selected_item() {
        if (this.inv_win.item_grid.length < this.inv_win_pos.line + 1 ||
            this.inv_win.item_grid[this.inv_win_pos.line].length < this.inv_win_pos.col + 1) {
            return null;
        }
        return this.inv_win.item_grid[this.inv_win_pos.line][this.inv_win_pos.col];
    }

    on_item_repair() {
        let exec = () => {
            this.inv_win.kill_item_at(this.inv_win_pos.line, this.inv_win_pos.col);
            this.data.control_manager.reset();

            this.game.time.events.add(
                REPAIR_WAIT_TIME,
                () => {
                    this.selected_item.broken = false;
                    this.data.info.party_data.coins -=
                        (this.data.info.items_list[this.selected_item.key_name].price * REPAIR_MULTIPLIER) | 0;

                    this.npc_dialog.update_dialog("repair_done", true);
                    this.parent.update_your_coins();

                    this.data.control_manager.add_simple_controls(
                        this.on_character_select.bind(this, "repair_follow_up", this.inv_win_pos)
                    );
                },
                this
            );
        };

        if (!this.npc_dialog.dialog_manager.is_finished) {
            this.npc_dialog.dialog_manager.kill_dialog(exec, false, true);
        } else {
            exec();
        }
    }

    on_repair_item_select() {
        this.data.control_manager.reset();
        let exec = () => {
            this.inv_win_pos = this.inv_win.cursor_pos;
            this.selected_item = this.get_selected_item();

            if (this.selected_item === null) {
                return;
            }

            if (!this.selected_item.broken) {
                let item_breakable =
                    this.data.info.items_list[this.selected_item.key_name].use_type === "breaks_when_use";
                let msg_key = item_breakable ? "cant_repair" : "repair_decline";

                let text = this.npc_dialog.get_message(msg_key);
                text = this.npc_dialog.replace_text(
                    text,
                    undefined,
                    this.data.info.items_list[this.selected_item.key_name].name
                );
                this.npc_dialog.update_dialog(text, true, false);

                this.data.control_manager.add_simple_controls(
                    this.on_character_select.bind(this, "repair_follow_up", this.inv_win_pos)
                );
            } else {
                let price = (this.data.info.items_list[this.selected_item.key_name].price * REPAIR_MULTIPLIER) | 0;
                let text = this.npc_dialog.get_message("repair_deal");
                text = this.npc_dialog.replace_text(
                    text,
                    undefined,
                    this.data.info.items_list[this.selected_item.key_name].name,
                    String(price)
                );
                this.npc_dialog.update_dialog(text, false, false);

                this.yesno_action.open(
                    {
                        yes: () => {
                            this.npc_dialog.update_dialog("repair_deal_accept", true);
                            this.data.control_manager.add_simple_controls(this.on_item_repair.bind(this));
                        },
                        no: () => {
                            this.npc_dialog.update_dialog("repair_deal_decline", true);
                            this.data.control_manager.add_simple_controls(
                                this.on_character_select.bind(this, "repair_follow_up", this.inv_win_pos)
                            );
                        },
                    },
                    {x: YESNO_X, y: YESNO_Y}
                );
            }
        };

        if (this.item_desc_win.open) this.item_desc_win.close(exec);
        else exec();
    }

    on_sale_success(quantity = 1) {
        let exec = () => {
            const item = this.data.info.items_list[this.selected_item.key_name];
            const msg_key = item.rare_item ? "after_sell_artifact" : "after_sell_normal";
            this.npc_dialog.update_dialog(msg_key, true);

            const item_price =
                (item.price * (this.selected_item.broken ? SELL_BROKEN_MULTIPLIER : SELL_MULTIPLIER)) | 0;
            this.data.info.party_data.coins += item_price * quantity;
            this.parent.update_your_coins();

            this.selected_character.remove_item(this.selected_item, quantity);

            if (item.rare_item) {
                const shop_item = this.data.info.artifacts_global_list.find(item_data => {
                    return item_data.key_name === item.key_name;
                });
                if (shop_item) {
                    shop_item.quantity += quantity;
                } else {
                    this.data.info.artifacts_global_list.push({
                        key_name: item.key_name,
                        quantity: quantity,
                        global_artifact: true,
                    });
                }
            }

            this.parent.set_item_lists();
            this.data.control_manager.add_simple_controls(
                this.on_character_select.bind(this, "sell_follow_up", this.inv_win_pos)
            );
        };

        if (this.inv_win.is_open) {
            this.inv_win.refresh(this.selected_character.key_name, undefined);
            exec();
        } else this.inv_win.open(this.selected_character.key_name, undefined, false, exec);
    }

    on_sell_item_select() {
        let exec = () => {
            this.inv_win_pos = this.inv_win.cursor_pos;
            this.selected_item = this.get_selected_item();

            if (this.selected_item === null) {
                return;
            }

            const item = this.data.info.items_list[this.selected_item.key_name];
            if (item.important_item) {
                this.npc_dialog.update_dialog("cant_sell_important", true);

                this.data.control_manager.add_simple_controls(
                    this.on_character_select.bind(this, "sell_follow_up", this.inv_win_pos)
                );
            } else if (item.curses_when_equipped && this.selected_item.equipped) {
                let text = this.npc_dialog.get_message("cant_sell_equipped_cursed");
                text = this.npc_dialog.replace_text(text, undefined, item.name);
                this.npc_dialog.update_dialog(text, true, false);

                this.data.control_manager.add_simple_controls(
                    this.on_character_select.bind(this, "sell_follow_up", this.inv_win_pos)
                );
            } else if (this.selected_item.quantity === 1) {
                let msg_key = item.rare_item ? "sell_artifact" : "sell_normal";

                let text = this.npc_dialog.get_message(msg_key);
                let item_name = msg_key === "sell_normal" ? item.name : undefined;
                let item_price =
                    (item.price * (this.selected_item.broken ? SELL_BROKEN_MULTIPLIER : SELL_MULTIPLIER)) | 0;
                text = this.npc_dialog.replace_text(text, undefined, item_name, String(item_price));
                this.npc_dialog.update_dialog(text, false, false);

                this.yesno_action.open(
                    {
                        yes: this.on_sale_success.bind(this, 1),
                        no: () => {
                            let decline_msg = item.rare_item ? "decline_sell_artifact" : "decline_sell_normal";
                            this.npc_dialog.update_dialog(decline_msg, true);
                            this.data.control_manager.add_simple_controls(
                                this.on_character_select.bind(this, "sell_follow_up", this.inv_win_pos)
                            );
                        },
                    },
                    {x: YESNO_X, y: YESNO_Y}
                );
            } else {
                this.npc_dialog.update_dialog("sell_quantity_select");

                let char_item_match = this.selected_character.items.filter(i => {
                    return i.key_name === this.selected_item.key_name;
                });
                let char_item = char_item_match.length !== 0 ? char_item_match[0] : null;

                let quant_control = () => {
                    this.quant_win.grant_control(
                        this.on_character_select.bind(this, "sell_follow_up", this.inv_win_pos),
                        () => {
                            let quant = 1;
                            quant = this.quant_win.chosen_quantity;
                            this.quant_win.close();
                            this.data.cursor_manager.hide();

                            let text = this.npc_dialog.get_message("sell_quantity_confirm");
                            let item_price =
                                (item.price * (this.selected_item.broken ? SELL_BROKEN_MULTIPLIER : SELL_MULTIPLIER)) |
                                0;
                            text = this.npc_dialog.replace_text(text, undefined, undefined, String(item_price * quant));
                            this.npc_dialog.update_dialog(text, false, false);

                            this.yesno_action.open(
                                {
                                    yes: this.on_sale_success.bind(this, quant),
                                    no: () => {
                                        let decline_msg = item.rare_item
                                            ? "decline_sell_artifact"
                                            : "decline_sell_normal";
                                        this.npc_dialog.update_dialog(decline_msg, true);
                                        this.data.control_manager.add_simple_controls(
                                            this.on_character_select.bind(this, "sell_follow_up", this.inv_win_pos)
                                        );
                                    },
                                },
                                {x: YESNO_X, y: YESNO_Y}
                            );
                        }
                    );
                };

                if (!this.quant_win.is_open) {
                    this.quant_win.open(char_item, undefined, false, quant_control);
                } else {
                    quant_control();
                }
            }
        };

        if (this.item_desc_win.open) this.item_desc_win.close(exec);
        else exec();
    }

    on_character_select(msg_key = "sell_follow_up", item_pos = {line: 0, col: 0}) {
        let start = () => {
            let open_windows = [{name: WindowNames.ITEM_DESC_WIN}, {name: WindowNames.ITEM_PRICE_WIN}];
            this.show_windows(open_windows, () => {
                if (msg_key) this.npc_dialog.update_dialog(msg_key);

                this.selected_character =
                    this.char_display.lines[this.char_display.current_line][this.char_display.selected_index];
                this.selected_char_index = this.char_display.selected_index;

                let finish = () => {
                    this.inv_win.set_cursor(item_pos.line, item_pos.col);
                    if (!this.inv_win.item_grid?.[item_pos.line]?.[item_pos.col]) this.inv_win.previous_col();

                    this.inv_win.grant_control(
                        this.open_inventory_view.bind(this),
                        this.is_repair_menu
                            ? this.on_repair_item_select.bind(this)
                            : this.on_sell_item_select.bind(this)
                    );
                };

                if (this.inv_win.is_open) {
                    this.inv_win.refresh(this.selected_character.key_name, undefined);
                    finish();
                } else this.inv_win.open(this.selected_character.key_name, undefined, false, finish);
            });
        };

        if (this.quant_win.is_open)
            this.quant_win.close(() => {
                start;
            });
        else start();
    }

    open_inventory_view(msg_key = "sell_follow_up") {
        let close_windows = [WindowNames.ITEM_DESC_WIN, WindowNames.ITEM_PRICE_WIN, WindowNames.QUANT_WIN];

        this.close_windows(close_windows, () => {
            this.npc_dialog.update_dialog(msg_key);

            let next_step = () => {
                this.game.world.bringToTop(this.char_display.char_group);
                this.data.cursor_manager.bring_to_top();

                let char_key = this.selected_character
                    ? this.selected_character.key_name
                    : this.data.info.party_data.members[0].key_name;

                let finish = () => {
                    if (!this.your_coins_win.open) this.your_coins_win.show();
                    this.parent.update_your_coins();

                    this.char_display.grant_control(this.close_menu.bind(this), this.on_character_select.bind(this));
                };

                if (this.inv_win.is_open) {
                    this.inv_win.refresh(char_key);
                    finish();
                } else this.inv_win.open(char_key, undefined, false, finish);
            };

            if (!this.char_display.is_open)
                this.char_display.open(this.selected_char_index, CharsMenuModes.SHOP, next_step);
            else {
                this.char_display.select_char(this.selected_char_index);
                next_step();
            }
        });
    }

    open_menu(is_repair_menu: boolean, close_callback?: Function) {
        this.is_repair_menu = is_repair_menu;
        this.close_callback = close_callback;
        this.active = true;

        if (is_repair_menu) {
            this.npc_dialog.update_dialog("repair_menu", true);

            this.data.control_manager.add_simple_controls(this.open_inventory_view.bind(this, "repair_select"));
        } else this.open_inventory_view("sell_select");
    }

    close_menu() {
        this.data.cursor_manager.hide();
        this.data.control_manager.reset();

        this.is_repair_menu = null;
        this.selected_item = null;
        this.inv_win_pos = {line: 0, col: 0};
        this.selected_character = null;
        this.selected_char_index = 0;
        this.active = false;

        let close_windows = [
            WindowNames.ITEM_DESC_WIN,
            WindowNames.ITEM_PRICE_WIN,
            WindowNames.YOUR_COINS_WIN,
            WindowNames.CHAR_DISPLAY,
            WindowNames.INV_WIN,
            WindowNames.YESNO_ACTION,
            WindowNames.QUANT_WIN,
        ];

        this.close_windows(close_windows, () => {
            this.close_callback();
            this.close_callback = null;
        });
    }

    show_windows(properties: {name: string; arguments?: any[]}[], on_complete: Function) {
        let promises: Promise<void>[] = [];

        let window_count = Object.keys(properties).length;
        for (let i = 0; i < window_count; i++) {
            let args: any[] = properties[i].arguments ? properties[i].arguments : [];
            let is_window = this[properties[i].name] instanceof Window;

            if (is_window ? this[properties[i].name].open : this[properties[i].name].is_open) continue;
            else {
                let opened: () => void;
                let promise = new Promise<void>(resolve => (opened = resolve));
                promises.push(promise);

                args.push(opened);
                is_window
                    ? this[properties[i].name].show.apply(this[properties[i].name], args)
                    : this[properties[i].name].open.apply(this[properties[i].name], args);
            }
        }

        Promise.all(promises).then(() => {
            on_complete();
        });
    }

    close_windows(properties: string[], on_complete: Function) {
        let promises: Promise<void>[] = [];

        for (let i in properties) {
            let is_window = this[properties[i]] instanceof Window;
            if (!(is_window ? this[properties[i]].open : this[properties[i]].is_open)) continue;
            else {
                let closed: () => void;
                let promise = new Promise<void>(resolve => (closed = resolve));
                promises.push(promise);

                this[properties[i]].close(closed);
            }
        }

        Promise.all(promises).then(() => {
            on_complete();
        });
    }
}
