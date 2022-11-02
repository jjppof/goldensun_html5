import {BasicInfoWindow} from "../windows/BasicInfoWindow";
import {ItemPsynergyChooseWindow} from "../windows/ItemPsynergyChooseWindow";
import {ItemObj, TextObj, Window} from "../Window";
import * as numbers from "../magic_numbers";
import {ItemOptionsWindow} from "../windows/item/ItemOptionsWindow";
import {Item, item_types} from "../Item";
import {GoldenSun} from "../GoldenSun";
import {CharsMenu, CharsMenuModes} from "../support_menus/CharsMenu";
import {ItemSlot} from "../MainChar";
import {ItemQuantityManagerWindow} from "../windows/item/ItemQuantityManagerWindow";
import {StatsOrClassCheckWithItemWindow} from "../windows/item/StatsOrClassCheckWithItemWindow";
import {effect_names, effect_operators_symbols, effect_types} from "../Effect";
import {Button} from "../XGamepad";
import {element_names} from "../utils";

const GUIDE_WINDOW_X = 104;
const GUIDE_WINDOW_Y = 0;
const GUIDE_WINDOW_WIDTH = 132;
const GUIDE_WINDOW_HEIGHT = 20;

const DESCRIPTION_WINDOW_X = 0;
const DESCRIPTION_WINDOW_Y = 136;
const DESCRIPTION_WINDOW_WIDTH = 236;
const DESCRIPTION_WINDOW_HEIGHT = 20;

const DETAILS_WINDOW_X = 0;
const DETAILS_WINDOW_Y = 0;
const DETAILS_WINDOW_WIDTH = 236;
const DETAILS_WINDOW_HEIGHT = ((numbers.GAME_HEIGHT * 2) / 3) | 0;

const ITEM_OVERVIEW_WIN_X = 104;
const ITEM_OVERVIEW_WIN_Y = 24;
const ITEM_OVERVIEW_WIN_WIDTH = 132;
const ITEM_OVERVIEW_WIN_HEIGHT = 76;

const ARRANGE_WINDOW_X = 104;
const ARRANGE_WINDOW_Y = 104;
const ARRANGE_WINDOW_WIDTH = 132;
const ARRANGE_WINDOW_HEIGHT = 28;

const TOTAL_BORDER = numbers.INSIDE_BORDER_WIDTH + numbers.OUTSIDE_BORDER_WIDTH;
const ITEM_OVERVIEW_WIN_INSIDE_PADDING_H = 11;
const ITEM_OVERVIEW_WIN_INSIDE_PADDING_V = 12;
const ITEM_OVERVIEW_WIN_ICONS_PER_LINE = 5;
const ITEM_OVERVIEW_WIN_SPACE_BETWN_LINE = 3;
const ITEM_OVERVIEW_WIN_SPACE_BETWN_ICO =
    (ITEM_OVERVIEW_WIN_WIDTH -
        2 * (numbers.INSIDE_BORDER_WIDTH + ITEM_OVERVIEW_WIN_INSIDE_PADDING_H) -
        ITEM_OVERVIEW_WIN_ICONS_PER_LINE * numbers.ICON_WIDTH) /
    (ITEM_OVERVIEW_WIN_ICONS_PER_LINE - 1);

const ITEM_OVERVIEW_Y_SHIFT = 16;
const ITEM_OVERVIEW_HEIGHT_SHIFT = 16;

export class MainItemMenu {
    public game: Phaser.Game;
    public data: GoldenSun;

    public chars_menu: CharsMenu;
    public basic_info_window: BasicInfoWindow;
    public item_change_stats_window: StatsOrClassCheckWithItemWindow;

    public selected_char_index: number;
    public selected_item_pos: {page: number; index: number};
    public is_open: boolean;
    public choosing_destination: boolean;
    public overview_shifted: boolean;
    public close_callback: (close_this_menu: boolean) => void;

    public guide_window: Window;
    public guide_window_text: TextObj;
    public choosing_item: boolean;
    public guide_window_msgs: {
        choosing_char: string;
        choosing_item: string;
    };
    public description_window: Window;
    public description_window_text: TextObj;
    public details_window: Window;
    public arrange_window: Window;
    public item_overview_window: Window;
    public gear_overview_window: Window;
    public gear_overview_items: {
        weapon: {item_obj: ItemObj; text_obj: TextObj};
        head: {item_obj: ItemObj; text_obj: TextObj};
        body: {item_obj: ItemObj; text_obj: TextObj};
        chest: {item_obj: ItemObj; text_obj: TextObj};
    };
    public item_choose_window: ItemPsynergyChooseWindow;
    public item_options_window: ItemOptionsWindow;
    public item_quant_win: ItemQuantityManagerWindow;

    constructor(game: Phaser.Game, data: GoldenSun) {
        this.game = game;
        this.data = data;

        this.chars_menu = new CharsMenu(this.game, this.data, this.char_change.bind(this));
        this.basic_info_window = new BasicInfoWindow(this.game);
        this.item_change_stats_window = new StatsOrClassCheckWithItemWindow(this.game, this.data);

        this.selected_char_index = 0;
        this.selected_item_pos = {page: 0, index: 0};
        this.is_open = false;
        this.choosing_destination = false;
        this.overview_shifted = false;
        this.close_callback = null;

        this.guide_window = new Window(
            this.game,
            GUIDE_WINDOW_X,
            GUIDE_WINDOW_Y,
            GUIDE_WINDOW_WIDTH,
            GUIDE_WINDOW_HEIGHT
        );
        this.guide_window_text = this.guide_window.set_text_in_position("");
        this.choosing_item = false;
        this.guide_window_msgs = {
            choosing_char: "Whose item?",
            choosing_item: "Which item?",
        };
        this.description_window = new Window(
            this.game,
            DESCRIPTION_WINDOW_X,
            DESCRIPTION_WINDOW_Y,
            DESCRIPTION_WINDOW_WIDTH,
            DESCRIPTION_WINDOW_HEIGHT
        );
        this.description_window_text = this.description_window.set_text_in_position("");
        this.arrange_window = new Window(
            this.game,
            ARRANGE_WINDOW_X,
            ARRANGE_WINDOW_Y,
            ARRANGE_WINDOW_WIDTH,
            ARRANGE_WINDOW_HEIGHT
        );
        this.config_arrange_window();
        this.item_overview_window = new Window(
            this.game,
            ITEM_OVERVIEW_WIN_X,
            ITEM_OVERVIEW_WIN_Y,
            ITEM_OVERVIEW_WIN_WIDTH,
            ITEM_OVERVIEW_WIN_HEIGHT
        );
        this.gear_overview_window = new Window(
            this.game,
            ITEM_OVERVIEW_WIN_X,
            ITEM_OVERVIEW_WIN_Y,
            ITEM_OVERVIEW_WIN_WIDTH,
            ITEM_OVERVIEW_WIN_HEIGHT
        );
        this.config_gear_window();
        this.item_choose_window = new ItemPsynergyChooseWindow(
            this.game,
            this.data,
            false,
            this.item_change.bind(this)
        );
        this.item_options_window = new ItemOptionsWindow(this.game, this.data);
        this.item_quant_win = new ItemQuantityManagerWindow(this.game, this.data);

        this.details_window = new Window(
            this.game,
            DETAILS_WINDOW_X,
            DETAILS_WINDOW_Y,
            DETAILS_WINDOW_WIDTH,
            DETAILS_WINDOW_HEIGHT
        );
    }

    config_arrange_window() {
        this.arrange_window.create_at_group(9, 9, "keyboard_buttons", {frame: "l_button", color: 0x0});
        this.arrange_window.create_at_group(8, 8, "keyboard_buttons", {frame: "l_button"});
        this.arrange_window.set_text_in_position("+", 23, 9);
        this.arrange_window.create_at_group(30, 9, "keyboard_buttons", {frame: "a_button", color: 0x0});
        this.arrange_window.create_at_group(29, 8, "keyboard_buttons", {frame: "a_button"});
        this.arrange_window.set_text_in_position(": Arrange items", 38, 8);

        this.arrange_window.create_at_group(9, 17, "keyboard_buttons", {frame: "r_button", color: 0x0});
        this.arrange_window.create_at_group(8, 16, "keyboard_buttons", {frame: "r_button"});
        this.arrange_window.set_text_in_position(": View equipment", 23, 16);
    }

    config_gear_window() {
        this.gear_overview_window.set_text_in_position("Weapon", 8, 8);
        this.gear_overview_window.set_text_in_position("Head", 8, 24);
        this.gear_overview_window.set_text_in_position("Shield", 8, 40);
        this.gear_overview_window.set_text_in_position("Chest", 8, 56);
        this.gear_overview_items = {
            weapon: {
                text_obj: this.gear_overview_window.set_text_in_position("", 24, 16),
                item_obj: this.gear_overview_window.make_item_obj("", {x: 112, y: 8}),
            },
            head: {
                text_obj: this.gear_overview_window.set_text_in_position("", 24, 32),
                item_obj: this.gear_overview_window.make_item_obj("", {x: 112, y: 24}),
            },
            chest: {
                text_obj: this.gear_overview_window.set_text_in_position("", 24, 48),
                item_obj: this.gear_overview_window.make_item_obj("", {x: 112, y: 40}),
            },
            body: {
                text_obj: this.gear_overview_window.set_text_in_position("", 24, 64),
                item_obj: this.gear_overview_window.make_item_obj("", {x: 112, y: 56}),
            },
        };
    }

    shift_item_overview(down: boolean, hide_sub_menus: boolean = true) {
        if (this.overview_shifted === down) return;

        if (hide_sub_menus) {
            if (down) {
                this.item_choose_window.hide();
                this.item_options_window.hide();
            } else {
                this.item_choose_window.show();
                this.item_options_window.show();
            }
        }

        this.item_overview_window.update_position({y: ITEM_OVERVIEW_WIN_Y + (down ? ITEM_OVERVIEW_Y_SHIFT : 0)});
        this.item_overview_window.update_size({
            height: ITEM_OVERVIEW_WIN_HEIGHT + (down ? ITEM_OVERVIEW_HEIGHT_SHIFT : 0),
        });
        this.overview_shifted = down;
    }

    char_change() {
        this.selected_char_index = this.chars_menu.selected_index;
        this.basic_info_window.set_char_basic_stats(this.data.info.party_data.members[this.selected_char_index]);
        this.set_item_icons();
        if (this.gear_overview_window.open) {
            this.set_gear_window(false);
        }

        if (this.choosing_destination) {
            if (this.item_options_window.item.type === item_types.ABILITY_GRANTOR) {
            } else if (this.item_options_window.item.type !== item_types.GENERAL_ITEM) {
                const preview_obj = Object.assign({}, this.item_options_window.item_obj, {equipped: false});
                this.item_change_stats_window.open(
                    this.data.info.party_data.members[this.selected_char_index],
                    this.item_options_window.item,
                    preview_obj
                );
                this.item_change_stats_window.compare_items();
            }
            this.set_description_window_text(this.item_options_window.item.description, true);
        } else {
            if (this.item_choose_window.window_open && !this.item_options_window.window_open) {
                this.item_choose_window.close();
                this.item_choose_window.open(this.chars_menu.selected_index);
            }
        }
    }

    char_choose() {
        if (this.data.info.party_data.members[this.selected_char_index].items.length === 0) {
            this.open_char_select();
            return;
        }
        if (this.gear_overview_window.open) {
            this.close_gear_window();
        }
        if (this.choosing_destination) {
            if (
                this.data.info.party_data.members[this.selected_char_index].key_name ===
                this.item_options_window.char.key_name
            ) {
                return;
            }
            this.chars_menu.deactivate();
        } else {
            this.chars_menu.deactivate();
            this.choosing_item = true;
            this.set_guide_window_text();
            this.item_choose_window.open(
                this.selected_char_index,
                () => {
                    this.on_item_choose_close();
                },
                undefined,
                this.selected_item_pos
            );
        }

        this.item_choose_window.grant_control(
            this.open_char_select.bind(this),
            () => {
                const item_win = this.item_choose_window;
                this.selected_item_pos = {page: item_win.page_index, index: item_win.selected_element_index};

                const selected_item =
                    item_win.element_list[(item_win.elements[item_win.selected_element_index] as ItemSlot).key_name];
                const selected_item_obj = item_win.item_objs[item_win.selected_element_index];

                this.item_choose(selected_item as Item, selected_item_obj);
            },
            this.chars_menu.next_char.bind(this.chars_menu),
            this.chars_menu.previous_char.bind(this.chars_menu)
        );
    }

    on_item_choose_close() {
        this.choosing_item = false;
        this.chars_menu.activate();
        this.set_guide_window_text();
        this.set_description_window_text();
        this.set_item_icons();
        if (this.item_change_stats_window.window_open) {
            this.item_change_stats_window.close();
        }
    }

    item_change(item: Item, item_obj: ItemSlot) {
        this.set_description_window_text(item.description);

        if (this.item_change_stats_window.window_open) {
            this.item_change_stats_window.close();
        }

        if (item.type === item_types.ABILITY_GRANTOR) {
        } else if (item.type !== item_types.GENERAL_ITEM) {
            this.item_change_stats_window.open(
                this.data.info.party_data.members[this.selected_char_index],
                item,
                item_obj
            );
        }
    }

    item_choose(item: Item, item_obj: ItemSlot) {
        this.data.control_manager.reset();

        this.item_options_window.open(
            item_obj,
            item,
            this.data.info.party_data.members[this.selected_char_index],
            this.item_change_stats_window,
            this,
            (item_given?: boolean, char_index?: number) => {
                this.shift_item_overview(false);
                if (item_given) {
                    this.selected_char_index = char_index;
                    this.open_char_select();
                } else this.char_choose();
            },
            () => {
                if (item.type === item_types.ABILITY_GRANTOR) {
                } else if (item.type !== item_types.GENERAL_ITEM) {
                    this.item_change_stats_window.update_info(false);
                    this.item_change_stats_window.hide_arrows();
                }
            }
        );

        this.item_choose_window.deactivate();
    }

    set_guide_window_text() {
        if (this.choosing_item) {
            this.guide_window.update_text(this.guide_window_msgs.choosing_item, this.guide_window_text);
        } else {
            this.guide_window.update_text(this.guide_window_msgs.choosing_char, this.guide_window_text);
        }
    }

    set_description_window_text(description?: string, force: boolean = false, tween_if_necessary: boolean = false) {
        if (this.description_window.text_tween) {
            this.description_window.clean_text_tween();
            this.description_window.reset_text_position(this.description_window_text);
        }
        if (this.choosing_item || force) {
            this.item_choose_window.set_description_window_text(
                this.description_window,
                this.description_window_text,
                description,
                tween_if_necessary
            );
        } else {
            this.description_window.update_text(
                this.data.info.party_data.coins + "    Coins",
                this.description_window_text
            );
        }
    }

    set_item_icons() {
        this.item_overview_window.destroy_all_internal_groups();
        let counter = 0;
        for (let i = 0; i < this.data.info.party_data.members[this.selected_char_index].items.length; ++i) {
            const item_obj = this.data.info.party_data.members[this.selected_char_index].items[i];
            const item_key_name = item_obj.key_name;
            if (item_key_name in this.data.info.items_list) {
                const x =
                    TOTAL_BORDER +
                    ITEM_OVERVIEW_WIN_INSIDE_PADDING_H +
                    Math.ceil(
                        (counter % ITEM_OVERVIEW_WIN_ICONS_PER_LINE) *
                            (ITEM_OVERVIEW_WIN_SPACE_BETWN_ICO + numbers.ICON_WIDTH)
                    );
                const y =
                    TOTAL_BORDER +
                    ITEM_OVERVIEW_WIN_INSIDE_PADDING_V +
                    ((counter / ITEM_OVERVIEW_WIN_ICONS_PER_LINE) | 0) *
                        (ITEM_OVERVIEW_WIN_SPACE_BETWN_LINE + numbers.ICON_HEIGHT);

                const internal_group_key = `${item_key_name}/${item_obj.index}`;
                this.item_overview_window.define_internal_group(internal_group_key);
                const item = this.data.info.items_list[item_key_name];
                this.item_overview_window.make_item_obj(
                    item_key_name,
                    {x: x, y: y},
                    {
                        broken: item_obj.broken,
                        equipped: item_obj.equipped,
                        quantity: item.carry_up_to_30 ? item_obj.quantity : undefined,
                        internal_group: internal_group_key,
                    }
                );
                ++counter;
            }
        }
    }

    open_char_select() {
        if (this.item_choose_window.window_open) this.item_choose_window.close();
        if (this.item_change_stats_window.window_open) this.item_change_stats_window.close();

        if (!this.item_overview_window.open) this.item_overview_window.show(undefined, false);
        if (!this.arrange_window.open) this.arrange_window.show(undefined, false);
        if (!this.chars_menu.is_open) this.chars_menu.open(this.selected_char_index, CharsMenuModes.MENU);

        this.shift_item_overview(false);

        this.chars_menu.select_char(this.selected_char_index);
        this.chars_menu.grant_control(this.close_menu.bind(this), this.char_choose.bind(this), false, [
            {
                buttons: [Button.L, Button.A],
                on_down: this.sort_items.bind(this),
                halt: true,
                sfx: {down: "menu/positive"},
            },
            {
                buttons: [Button.R],
                on_down: this.set_gear_window.bind(this),
                on_up: this.close_gear_window.bind(this),
            },
        ]);
    }

    sort_items() {
        const char = this.data.info.party_data.members[this.selected_char_index];
        char.sort_items();
        this.set_item_icons();
    }

    set_gear_window(show_window: boolean = true) {
        const char = this.data.info.party_data.members[this.selected_char_index];
        for (let slot_type in this.gear_overview_items) {
            const slot = char.equip_slots[slot_type] as ItemSlot;
            if (slot) {
                const name = this.data.info.items_list[slot.key_name].name;
                this.gear_overview_window.update_text(name, this.gear_overview_items[slot_type].text_obj);
                this.gear_overview_window.set_text_obj_visibility(true, this.gear_overview_items[slot_type].text_obj);
                this.gear_overview_items[slot_type].item_obj.icon.frameName = slot.key_name;
                this.gear_overview_items[slot_type].item_obj.icon.visible = true;
            } else {
                this.gear_overview_window.set_text_obj_visibility(false, this.gear_overview_items[slot_type].text_obj);
                this.gear_overview_items[slot_type].item_obj.icon.visible = false;
            }
        }
        this.basic_info_window.set_char_gear_stats(char);
        if (show_window) {
            this.gear_overview_window.show(undefined, false);
        }
    }

    close_gear_window() {
        const char = this.data.info.party_data.members[this.selected_char_index];
        this.basic_info_window.set_char_basic_stats(char);
        this.gear_overview_window.close(undefined, false);
    }

    show_details(item: Item, item_slot: ItemSlot, callback?: () => void) {
        const details_misc = [];
        const details_equip = [];
        const details_use = [];
        if (item.type === item_types.ABILITY_GRANTOR) {
            const ability_name = this.data.info.abilities_list[item.granted_ability].name;
            details_equip.push(`  Bestows ${ability_name}.`);
        }
        if (item.use_ability) {
            const ability_desciption = this.data.info.abilities_list[item.use_ability].description;
            details_use.push(`  ${ability_desciption ? ability_desciption : item.description}`);
        }
        if (item.curses_when_equipped) {
            details_equip.push("  It's cursed.");
        }
        if (item.granted_class_type) {
            details_equip.push(" Changes class when equipped.");
        }
        if (item.unleash_ability) {
            const ability_name = this.data.info.abilities_list[item.unleash_ability].name;
            details_misc.push(`Unleashes ${ability_name}.`);
        }
        if (item.important_item) {
            details_misc.push("An important item.");
        }
        if (item_slot.broken) {
            details_misc.push("It's broken.");
        }
        if (item.carry_up_to_30) {
            details_misc.push(`You have ${item_slot.quantity}.`);
        }
        if (item.items_after_forge.length) {
            details_misc.push(`Forgeable.`);
        }
        if (item_slot.additional_details !== undefined && Object.keys(item_slot.additional_details).length) {
            for (let key in item_slot.additional_details) {
                details_misc.push(item_slot.additional_details[key]);
            }
        }
        item.effects.forEach(effect => {
            switch (effect.type) {
                case effect_types.MAX_HP:
                case effect_types.MAX_PP:
                case effect_types.ATTACK:
                case effect_types.DEFENSE:
                case effect_types.AGILITY:
                case effect_types.LUCK:
                case effect_types.HP_RECOVERY:
                case effect_types.PP_RECOVERY:
                    details_equip.push(
                        `  ${effect_operators_symbols[effect.operator]}${effect.quantity} ${effect_names[effect.type]}`
                    );
                    break;
                case effect_types.POWER:
                case effect_types.RESIST:
                    details_equip.push(
                        `  ${effect_operators_symbols[effect.operator]}${effect.quantity} ${
                            element_names[effect.element]
                        } ${effect_names[effect.type]}`
                    );
                    break;
                case effect_types.CRITICALS:
                    details_equip.push(`  Impacts criticals chance.`);
                    break;
            }
        });
        if (details_equip.length) {
            details_equip.unshift("Effects of equipping:");
        }
        if (details_use.length) {
            details_use.unshift("Effects of using:");
        }

        const lines = details_equip.concat(details_use, details_misc);
        const text_objs = this.details_window.set_lines_of_text(lines, {space_between_lines: 2});
        this.data.control_manager.add_controls([
            {
                buttons: Button.B,
                on_down: () => {
                    text_objs.forEach(obj => this.details_window.destroy_text_obj(obj));
                    this.details_window.close(callback);
                },
            },
        ]);
        this.details_window.show();
    }

    open_menu(close_callback?: (close_this_menu: boolean) => void) {
        this.basic_info_window.open(this.data.info.party_data.members[this.selected_char_index]);

        this.close_callback = close_callback;
        this.is_open = true;

        this.set_item_icons();
        this.set_guide_window_text();
        this.set_description_window_text();

        this.guide_window.show(undefined, false);
        this.description_window.show(undefined, false);
        this.item_overview_window.show(undefined, false);
        this.arrange_window.show(undefined, false);

        this.open_char_select();
    }

    close_menu(close_menu_below: boolean = false) {
        this.data.cursor_manager.hide();
        this.data.control_manager.reset();

        this.chars_menu.close();
        this.basic_info_window.close();
        this.item_change_stats_window.close();
        if (this.gear_overview_window.open) {
            this.close_gear_window();
        }

        this.is_open = false;

        this.guide_window.close(undefined, false);
        this.description_window.close(undefined, false);
        this.item_overview_window.close(undefined, false);
        this.arrange_window.close(undefined, false);

        if (this.close_callback !== null) {
            this.close_callback(close_menu_below);
        }
    }
}
