import {GoldenSun} from "../../GoldenSun";
import {Item, item_types} from "../../Item";
import {ShopItem, ShopMenu} from "../../main_menus/ShopMenu";
import {InventoryWindow} from "./InventoryWindow";
import {CharsMenu, CharsMenuModes} from "../../support_menus/CharsMenu";
import {Window} from "../../Window";
import {ShopItemQuantityWindow} from "./ShopItemQuantityWindow";
import {BuySelectMenu} from "./BuySelectMenu";
import {EquipCompare} from "./EquipCompare";
import {YesNoMenu} from "../YesNoMenu";
import {ShopkeepDialog} from "./ShopkeepDialog";
import {ItemSlot, item_equip_slot, MainChar} from "../../MainChar";

const MAX_ITEMS_PER_PAGE = 7;

const SELL_MULTIPLIER = 3 / 4;
const REPAIR_MULTIPLIER = 1 / 4;
const SELL_BROKEN_MULTIPLIER = SELL_MULTIPLIER - REPAIR_MULTIPLIER;

const YESNO_X = 56;
const YESNO_Y = 40;

const GAME_TICKET_KEY_NAME = "game_ticket";

export const WindowNames = {
    ITEM_DESC_WIN: "item_desc_win",
    ITEM_PRICE_WIN: "item_price_win",
    YOUR_COINS_WIN: "your_coins_win",
    CHAR_DISPLAY: "char_display",
    INV_WIN: "inv_win",
    YESNO_ACTION: "yesno_action",
    QUANT_WIN: "quant_win",
    BUY_SELECT: "buy_select",
    EQ_COMPARE: "eq_compare",
};

export class BuyArtifactsMenu {
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
    public buy_select: BuySelectMenu;
    public eq_compare: EquipCompare;
    public yesno_action: YesNoMenu;
    public npc_dialog: ShopkeepDialog;

    public is_artifacts_menu: boolean;
    public active: boolean;

    public item_list: {[key_name: string]: ShopItem};
    public selected_item: ShopItem;
    public buy_select_pos: {page: number; index: number; is_last: boolean; should_change: boolean};
    public old_item: Item;

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
        this.buy_select = this.parent.buy_select;
        this.eq_compare = this.parent.eq_compare;
        this.yesno_action = this.parent.yesno_action;
        this.npc_dialog = this.parent.npc_dialog;

        this.is_artifacts_menu = null;
        this.active = false;

        this.item_list = {};
        this.selected_item = null;
        this.buy_select_pos = {page: 0, index: 0, is_last: false, should_change: false};
        this.old_item = null;

        this.selected_character = null;
        this.selected_char_index = 0;
    }

    update_game_ticket_step() {
        const bought = this.data.info.party_data.game_tickets.tickets_bought;
        if (bought <= 0) return 0;
        return Math.round(125 * Math.pow(2, bought / 5));
    }

    check_game_ticket() {
        let game_ticket = false;
        this.data.info.party_data.game_tickets.coins_remaining -=
            this.data.info.items_list[this.selected_item.key_name].price;
        if (this.data.info.party_data.game_tickets.coins_remaining <= 0) {
            game_ticket = true;
            this.data.info.party_data.game_tickets.tickets_bought += 1;
            this.data.info.party_data.game_tickets.coins_remaining += this.update_game_ticket_step();
        }

        if (game_ticket) {
            this.npc_dialog.update_dialog("game_ticket", true);
            this.data.control_manager.add_simple_controls(this.open_inventory_view.bind(this, true));
        } else this.open_buy_select();
    }

    sell_old_equip(old_item: Item, slot: ItemSlot) {
        let msg_key = old_item.rare_item ? "after_sell_artifact" : "after_sell_normal";
        this.npc_dialog.update_dialog(msg_key, true);

        if (old_item.rare_item) {
            let shop_list = this.data.info.shops_list[this.parent.shop_key].item_list;
            let exists = false;
            for (let i = 0; i < shop_list.length; i++) {
                if (shop_list[i].key_name === old_item.key_name) {
                    exists = true;
                    this.data.info.shops_list[this.parent.shop_key].item_list[i].quantity += 1;
                }
            }
            if (!exists) {
                this.data.info.shops_list[this.parent.shop_key].item_list.push({
                    key_name: old_item.key_name,
                    quantity: 1,
                });
            }

            if (this.buy_select_pos.should_change) this.buy_select_pos.should_change = false;
        }

        for (let i = 0; i < this.selected_character.items.length; i++) {
            if (this.selected_character.items[i].key_name === old_item.key_name) {
                this.selected_character.items.splice(i, 1);
            }
        }

        let sell_price = slot.broken
            ? this.old_item.price * SELL_BROKEN_MULTIPLIER
            : this.old_item.price * SELL_MULTIPLIER;

        this.data.info.party_data.coins += sell_price | 0;
        this.parent.update_your_coins();
        this.parent.update_items();

        this.data.control_manager.add_simple_controls(this.check_game_ticket.bind(this));
    }

    async show_cursed_msg() {
        let promise_resolve;
        const promise = new Promise(resolve => (promise_resolve = resolve));
        const cursed_msg_win = new Window(this.game, 64, 32, 140, 20);
        cursed_msg_win.set_text_in_position("You've been cursed!", undefined, undefined, {italic: true});
        cursed_msg_win.show(() => {
            this.data.control_manager.add_simple_controls(() => {
                cursed_msg_win.close(() => {
                    cursed_msg_win.destroy(false);
                    promise_resolve();
                });
            });
        });
        await promise;
    }

    async equip_new_item() {
        const item_type = this.data.info.items_list[this.selected_item.key_name].type;
        const char_slots = this.selected_character.equip_slots;

        if (this.data.info.items_list[this.selected_item.key_name].curses_when_equipped) {
            this.npc_dialog.close_dialog();
            await this.show_cursed_msg();
        }

        this.npc_dialog.update_dialog("equip_compliment", true);

        this.old_item = null;
        const slot: ItemSlot = char_slots[item_equip_slot[item_type]];

        if (slot) {
            this.old_item = this.data.info.items_list[slot.key_name];
        }

        if (this.old_item) {
            for (let i = 0; i < this.selected_character.items.length; i++) {
                let itm = this.selected_character.items[i];
                if (itm.key_name === this.old_item.key_name && itm.equipped) {
                    this.selected_character.unequip_item(i);
                    break;
                }
            }
        }

        for (let i = this.selected_character.items.length - 1; i > 0; i--) {
            let itm = this.selected_character.items[i];
            if (itm.key_name === this.selected_item.key_name) {
                this.selected_character.equip_item(i);
                break;
            }
        }

        if (!this.old_item) {
            this.data.control_manager.add_simple_controls(this.check_game_ticket.bind(this));
        } else {
            let after_compliment = () => {
                let sell_price = slot.broken
                    ? this.old_item.price * SELL_BROKEN_MULTIPLIER
                    : this.old_item.price * SELL_MULTIPLIER;

                let text = this.npc_dialog.get_message("sell_current");
                text = this.npc_dialog.replace_text(text, undefined, this.old_item.name, String(sell_price | 0));
                this.npc_dialog.update_dialog(text, false, false);

                this.yesno_action.open(
                    {
                        yes: this.sell_old_equip.bind(this, this.old_item, slot),
                        no: () => {
                            let msg_key = this.old_item.rare_item ? "decline_sell_artifact" : "decline_sell_normal";
                            this.npc_dialog.update_dialog(msg_key, true);
                            this.data.control_manager.add_simple_controls(this.check_game_ticket.bind(this));
                        },
                    },
                    {x: YESNO_X, y: YESNO_Y},
                    undefined,
                    "menu/shop_sell"
                );
            };

            this.data.control_manager.add_simple_controls(after_compliment.bind(this));
        }
    }

    on_purchase_success(equip_ask: boolean = false, game_ticket: boolean = false, play_sfx: boolean = false) {
        let quantity = 1;
        let key_name = game_ticket ? GAME_TICKET_KEY_NAME : this.selected_item.key_name;
        let item_to_add = this.data.info.items_list[key_name];

        if (this.quant_win.is_open && !game_ticket) quantity = this.quant_win.chosen_quantity;

        if (
            this.data.info.party_data.coins - this.data.info.items_list[this.selected_item.key_name].price * quantity <
                0 &&
            !game_ticket
        ) {
            this.npc_dialog.update_dialog("not_enough_coins", true);
            this.data.cursor_manager.hide();

            let exec = () => {
                this.data.control_manager.add_simple_controls(this.open_buy_select.bind(this));
            };
            if (this.quant_win.is_open) this.quant_win.close(exec);
            else exec();
        } else {
            this.npc_dialog.update_dialog("after_buy", true);
            this.data.cursor_manager.hide();
            if (play_sfx) this.data.audio.play_se("menu/shop_buy");

            let process_purchase = () => {
                const item = this.data.info.items_list[this.selected_item.key_name];
                if (!game_ticket) {
                    this.data.info.party_data.coins -= item.price * quantity;
                }

                if (this.selected_item.global_artifact) {
                    const global_item = this.data.info.artifacts_global_list.find(item_data => {
                        return item_data.key_name === item.key_name;
                    });
                    if (global_item) {
                        if (global_item.quantity > quantity) {
                            global_item.quantity -= quantity;
                        } else {
                            this.data.info.artifacts_global_list = this.data.info.artifacts_global_list.filter(
                                item_data => {
                                    return item_data.key_name !== item.key_name;
                                }
                            );
                        }
                    }
                }

                let exists = false;
                for (let i = 0; i < this.selected_character.items.length; i++) {
                    const item_obj = this.selected_character.items[i];
                    if (
                        item_obj.key_name === item_to_add.key_name &&
                        this.data.info.items_list[item_to_add.key_name].carry_up_to_30
                    ) {
                        exists = true;
                        item_obj.quantity += quantity;
                    }
                }

                let new_index = this.selected_character.items.length;
                if (!exists) {
                    if (item_to_add.equipable)
                        this.selected_character.items.push({
                            key_name: item_to_add.key_name,
                            quantity: 1,
                            equipped: false,
                            index: new_index,
                        });
                    else
                        this.selected_character.items.push({
                            key_name: item_to_add.key_name,
                            quantity: quantity,
                            index: new_index,
                        });
                }

                if (!game_ticket) {
                    let shop_list = this.data.info.shops_list[this.parent.shop_key].item_list;

                    let cursor_back = false;
                    for (let i = 0; i < shop_list.length; i++) {
                        if (shop_list[i].key_name === this.selected_item.key_name && shop_list[i].quantity !== -1) {
                            this.data.info.shops_list[this.parent.shop_key].item_list[i].quantity -= quantity;
                            if (this.data.info.shops_list[this.parent.shop_key].item_list[i].quantity === 0)
                                cursor_back = true;
                        }
                    }

                    if (this.buy_select_pos.is_last && cursor_back) {
                        this.buy_select_pos.should_change = true;
                    }

                    this.parent.update_items();

                    const slot_type = item_to_add.equipable ? item_equip_slot[item_to_add.type] : null;
                    const slot_key_name = slot_type ? this.selected_character.equip_slots[slot_type]?.key_name : null;
                    const has_cursed_slot = slot_key_name
                        ? this.data.info.items_list[slot_key_name].curses_when_equipped
                        : false;
                    if (equip_ask && !has_cursed_slot) {
                        let equip_now = () => {
                            let text = this.npc_dialog.get_message("equip_now");
                            text = this.npc_dialog.replace_text(text, this.selected_character.name);
                            this.npc_dialog.update_dialog(text, false, false);

                            this.yesno_action.open(
                                {yes: this.equip_new_item.bind(this), no: this.check_game_ticket.bind(this)},
                                {x: YESNO_X, y: YESNO_Y}
                            );
                        };
                        this.data.control_manager.add_simple_controls(equip_now.bind(this));
                    } else {
                        this.data.control_manager.add_simple_controls(this.check_game_ticket.bind(this));
                    }
                } else {
                    this.data.control_manager.add_simple_controls(this.open_buy_select.bind(this));
                }
            };

            if (this.quant_win.is_open)
                this.quant_win.close(() => {
                    process_purchase();
                });
            else process_purchase();
        }
    }

    on_buy_equip_select() {
        this.selected_character =
            this.char_display.lines[this.char_display.current_line][this.char_display.selected_index];
        this.selected_char_index = this.char_display.selected_index;

        if (this.selected_character.items.length === MainChar.MAX_ITEMS_PER_CHAR) {
            let text = this.npc_dialog.get_message("inventory_full");
            text = this.npc_dialog.replace_text(text, this.selected_character.name);
            this.npc_dialog.update_dialog(text, false, false);

            this.char_display.grant_control(this.on_cancel_char_select.bind(this), this.on_buy_equip_select.bind(this));
        } else {
            if (
                !this.data.info.items_list[this.selected_item.key_name].equipable_chars.includes(
                    this.selected_character.key_name
                )
            ) {
                let text = this.npc_dialog.get_message("cant_equip");
                text = this.npc_dialog.replace_text(text, this.selected_character.name);
                this.npc_dialog.update_dialog(text, false, false);

                this.yesno_action.open(
                    {yes: this.on_purchase_success.bind(this, false, false), no: this.open_equip_compare.bind(this)},
                    {x: YESNO_X, y: YESNO_Y},
                    undefined,
                    "menu/shop_buy"
                );
            } else {
                this.on_purchase_success(true, undefined, true);
            }
        }
    }

    on_buy_item_select(game_ticket: boolean = false) {
        this.selected_character =
            this.char_display.lines[this.char_display.current_line][this.char_display.selected_index];
        this.selected_char_index = this.char_display.selected_index;
        let item_to_receive = game_ticket ? GAME_TICKET_KEY_NAME : this.selected_item.key_name;
        let have_quant = 0;

        for (let i = 0; i < this.selected_character.items.length; i++) {
            let itm = this.selected_character.items[i];
            if (itm.key_name === item_to_receive) {
                have_quant = itm.quantity;
            }
        }

        if (
            this.selected_character.items.length === MainChar.MAX_ITEMS_PER_CHAR &&
            !(0 < have_quant && have_quant < MainChar.MAX_ITEMS_PER_CHAR)
        ) {
            let text = this.npc_dialog.get_message("inventory_full");
            text = this.npc_dialog.replace_text(text, this.selected_character.name);
            this.npc_dialog.update_dialog(text, false, false);

            this.char_display.grant_control(
                game_ticket ? this.on_cancel_game_ticket.bind(this) : this.on_cancel_char_select.bind(this),
                this.on_buy_item_select.bind(this, game_ticket)
            );
        } else if (have_quant === MainChar.MAX_GENERAL_ITEM_NUMBER) {
            let item_name = game_ticket
                ? this.data.info.items_list[GAME_TICKET_KEY_NAME].name
                : this.data.info.items_list[this.selected_item.key_name].name;

            let text = this.npc_dialog.get_message("stack_full");
            text = this.npc_dialog.replace_text(text, this.selected_character.name, item_name);
            this.npc_dialog.update_dialog(text, false, false);

            this.char_display.grant_control(
                game_ticket ? this.on_cancel_game_ticket.bind(this) : this.on_cancel_char_select.bind(this),
                this.on_buy_item_select.bind(this, game_ticket)
            );
        } else {
            if (game_ticket) this.on_purchase_success(false, game_ticket, true);
            else {
                if (
                    this.data.info.party_data.coins - this.data.info.items_list[this.selected_item.key_name].price <
                        0 &&
                    !game_ticket
                ) {
                    this.npc_dialog.update_dialog("not_enough_coins", true);
                    this.data.cursor_manager.hide();

                    let finish = () => {
                        this.data.control_manager.add_simple_controls(this.open_buy_select.bind(this));
                    };

                    if (this.quant_win.is_open) this.quant_win.close(finish);
                    else finish();
                } else {
                    this.npc_dialog.update_dialog("buy_quantity");
                    let shop_items = this.data.info.shops_list[this.parent.shop_key].item_list;
                    let shop_item_match = shop_items.filter(i => {
                        return i.key_name === this.selected_item.key_name;
                    })[0];
                    let shop_item = {
                        key_name: shop_item_match.key_name,
                        quantity: shop_item_match.quantity === -1 ? 30 : shop_item_match.quantity,
                    };

                    let char_item_match = this.selected_character.items.filter(i => {
                        return i.key_name === this.selected_item.key_name;
                    });
                    let char_item = char_item_match.length !== 0 ? char_item_match[0] : null;

                    if (!this.quant_win.is_open) this.quant_win.open(shop_item, char_item, true);
                    this.quant_win.grant_control(
                        this.open_inventory_view.bind(this),
                        this.on_purchase_success.bind(this),
                        "menu/shop_buy"
                    );
                }
            }
        }
    }

    on_cancel_char_select() {
        if (this.inv_win.is_open) this.inv_win.close();
        if (this.eq_compare.is_open) this.eq_compare.close();
        if (this.char_display.is_open) this.char_display.close();

        let close_windows = [WindowNames.INV_WIN, WindowNames.EQ_COMPARE, WindowNames.CHAR_DISPLAY];
        this.close_windows(close_windows, this.open_buy_select.bind(this));
    }

    on_cancel_game_ticket() {
        this.npc_dialog.update_dialog("game_ticket_decline", true);
        this.data.control_manager.add_simple_controls(this.on_cancel_char_select.bind(this));
    }

    open_equip_compare() {
        this.buy_select_pos = {
            page: this.buy_select.current_page,
            index: this.buy_select.selected_index,
            is_last: this.buy_select.is_last(this.buy_select.current_page, this.buy_select.selected_index),
            should_change: false,
        };

        let close_windows = [WindowNames.BUY_SELECT, WindowNames.ITEM_DESC_WIN];
        this.close_windows(close_windows, () => {
            this.npc_dialog.update_dialog("character_select");

            let char_key = this.selected_character
                ? this.selected_character.key_name
                : this.data.info.party_data.members[0].key_name;

            let open_windows = [
                {name: WindowNames.CHAR_DISPLAY, arguments: [this.selected_char_index, CharsMenuModes.SHOP]},
                {name: WindowNames.EQ_COMPARE, arguments: [char_key, this.selected_item.key_name]},
            ];
            this.show_windows(open_windows, () => {
                this.char_display.grant_control(
                    this.on_cancel_char_select.bind(this),
                    this.on_buy_equip_select.bind(this)
                );
            });
        });
    }

    open_inventory_view(game_ticket: boolean = false) {
        if (!game_ticket && this.buy_select.is_open) {
            this.buy_select_pos = {
                page: this.buy_select.current_page,
                index: this.buy_select.selected_index,
                is_last: this.buy_select.is_last(this.buy_select.current_page, this.buy_select.selected_index),
                should_change: false,
            };
        }

        let close_windows = [
            WindowNames.ITEM_DESC_WIN,
            WindowNames.BUY_SELECT,
            WindowNames.QUANT_WIN,
            WindowNames.EQ_COMPARE,
        ];
        this.close_windows(close_windows, () => {
            if (game_ticket) this.npc_dialog.update_dialog("game_ticket_select");
            else this.npc_dialog.update_dialog("character_select");

            let this_item = game_ticket ? GAME_TICKET_KEY_NAME : this.selected_item.key_name;

            let on_char_display_open = () => {
                let char_key = this.selected_character
                    ? this.selected_character.key_name
                    : this.data.info.party_data.members[0].key_name;

                let give_control = () => {
                    this.char_display.grant_control(
                        game_ticket ? this.on_cancel_game_ticket.bind(this) : this.on_cancel_char_select.bind(this),
                        this.on_buy_item_select.bind(this, game_ticket)
                    );
                };

                if (this.inv_win.is_open) {
                    this.inv_win.refresh(char_key, this_item);
                    give_control();
                } else this.inv_win.open(char_key, this_item, true, give_control);
            };

            if (this.char_display.is_open) {
                this.char_display.select_char(this.selected_char_index);
                on_char_display_open();
            } else this.char_display.open(this.selected_char_index, CharsMenuModes.SHOP, on_char_display_open);
        });
    }

    on_buy_select() {
        this.selected_item = this.buy_select.pages[this.buy_select.current_page][this.buy_select.selected_index];
        this.data.control_manager.reset();

        if (this.data.info.items_list[this.selected_item.key_name].equipable) this.open_equip_compare();
        else this.open_inventory_view();
    }

    open_buy_select(msg_key: string = "sell_follow_up") {
        if (Object.keys(this.item_list).length === 0) this.close_menu();
        else {
            if (this.buy_select_pos.should_change) {
                if (this.buy_select_pos.index === 0) {
                    this.buy_select_pos.page -= 1;
                    this.buy_select_pos.index = MAX_ITEMS_PER_PAGE - 1;
                } else this.buy_select_pos.index -= 1;
            }

            this.npc_dialog.update_dialog(msg_key);

            let close_windows = [WindowNames.CHAR_DISPLAY, WindowNames.INV_WIN, WindowNames.EQ_COMPARE];
            this.close_windows(close_windows, () => {
                let open_windows = [
                    {
                        name: WindowNames.BUY_SELECT,
                        arguments: [this.item_list, this.buy_select_pos.index, this.buy_select_pos.page],
                    },
                    {name: WindowNames.YOUR_COINS_WIN, arguments: []},
                    {name: WindowNames.ITEM_PRICE_WIN, arguments: []},
                    {name: WindowNames.ITEM_DESC_WIN, arguments: []},
                ];
                this.show_windows(open_windows, () => {
                    this.selected_item =
                        this.buy_select.pages[this.buy_select.current_page][this.buy_select.selected_index];
                    this.parent.update_item_info(this.selected_item.key_name);
                    this.parent.update_your_coins();

                    this.buy_select.grant_control(this.close_menu.bind(this), this.on_buy_select.bind(this));
                });
            });
        }
    }

    open_menu(is_artifacts_menu: boolean, close_callback?: Function) {
        this.is_artifacts_menu = is_artifacts_menu;
        this.close_callback = close_callback;
        this.active = true;
        this.item_list = this.is_artifacts_menu ? this.parent.artifact_list : this.parent.normal_item_list;

        if (is_artifacts_menu) {
            if (Object.keys(this.item_list).length === 0) {
                this.npc_dialog.update_dialog("no_artifacts", true);
                this.data.control_manager.add_simple_controls(this.close_menu.bind(this), {reset_on_press: true});
            } else {
                this.npc_dialog.update_dialog("artifacts_menu", true);
                this.data.control_manager.add_simple_controls(this.open_buy_select.bind(this, "buy_select"), {
                    reset_on_press: true,
                });
            }
        } else this.open_buy_select("buy_select");
    }

    close_menu() {
        this.data.cursor_manager.hide();
        this.data.control_manager.reset();

        this.is_artifacts_menu = null;
        this.item_list = {};
        this.selected_item = null;
        this.selected_character = null;
        this.selected_char_index = 0;
        this.old_item = null;
        this.buy_select_pos = {page: 0, index: 0, is_last: false, should_change: false};
        this.active = false;

        let windows = [
            WindowNames.ITEM_DESC_WIN,
            WindowNames.ITEM_PRICE_WIN,
            WindowNames.YOUR_COINS_WIN,
            WindowNames.CHAR_DISPLAY,
            WindowNames.INV_WIN,
            WindowNames.YESNO_ACTION,
            WindowNames.QUANT_WIN,
            WindowNames.BUY_SELECT,
            WindowNames.EQ_COMPARE,
        ];

        this.close_windows(windows, () => {
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
