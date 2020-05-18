import { CharsMenu } from '../base/menus/CharsMenu.js';
import { BasicInfoWindow } from '../base/windows/BasicInfoWindow.js';
import { ItemPsynergyChooseWindow } from '../base/windows/ItemPsynergyChooseWindow.js';
import { party_data } from '../chars/main_chars.js';
import { items_list } from '../chars/items.js';
import { Window } from '../base/Window.js';
import * as numbers from '../magic_numbers.js';
import { ItemOptionsWindow } from '../base/windows/ItemOptions.js';
import { StatsCheckWithItemWindow } from '../base/windows/StatsCheckWithItemWindow.js';
import { item_types } from '../base/Item.js';

const GUIDE_WINDOW_X = 104;
const GUIDE_WINDOW_Y = 0;
const GUIDE_WINDOW_WIDTH = 132;
const GUIDE_WINDOW_HEIGHT = 20;
const DESCRIPTION_WINDOW_X = 0;
const DESCRIPTION_WINDOW_Y = 136;
const DESCRIPTION_WINDOW_WIDTH = 236;
const DESCRIPTION_WINDOW_HEIGHT = 20;
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
const ITEM_OVERVIEW_WIN_SPACE_BETWN_ICO = ((ITEM_OVERVIEW_WIN_WIDTH - 2*(numbers.INSIDE_BORDER_WIDTH + ITEM_OVERVIEW_WIN_INSIDE_PADDING_H)) -
    (ITEM_OVERVIEW_WIN_ICONS_PER_LINE * numbers.ICON_WIDTH))/(ITEM_OVERVIEW_WIN_ICONS_PER_LINE - 1);
const SUB_ICON_X = 7;
const SUB_ICON_Y = 8;

export class ItemMenuScreen {
    constructor(game, data, esc_propagation_priority, enter_propagation_priority) {
        this.game = game;
        this.data = data;
        this.esc_propagation_priority = esc_propagation_priority + 1;
        this.enter_propagation_priority = enter_propagation_priority + 1;
        this.chars_menu = new CharsMenu(this.game, this.data, this.char_choose.bind(this), this.char_change.bind(this), this.enter_propagation_priority);
        this.basic_info_window = new BasicInfoWindow(this.game);
        this.item_change_stats_window = new StatsCheckWithItemWindow(this.game);
        this.selected_char_index = 0;
        this.is_open = false;
        this.close_callback = null;
        this.set_control();
        this.guide_window = new Window(this.game, GUIDE_WINDOW_X, GUIDE_WINDOW_Y, GUIDE_WINDOW_WIDTH, GUIDE_WINDOW_HEIGHT);
        this.guide_window_text = this.guide_window.set_single_line_text("");
        this.choosing_item = false;
        this.guide_window_msgs = {
            choosing_char: "Whose item?",
            choosing_item: "Which item?",
        }
        this.description_window = new Window(this.game, DESCRIPTION_WINDOW_X, DESCRIPTION_WINDOW_Y, DESCRIPTION_WINDOW_WIDTH, DESCRIPTION_WINDOW_HEIGHT);
        this.description_window_text = this.description_window.set_single_line_text("");
        this.item_overview_window = new Window(this.game, ITEM_OVERVIEW_WIN_X, ITEM_OVERVIEW_WIN_Y, ITEM_OVERVIEW_WIN_WIDTH, ITEM_OVERVIEW_WIN_HEIGHT);
        this.arrange_window = new Window(this.game, ARRANGE_WINDOW_X, ARRANGE_WINDOW_Y, ARRANGE_WINDOW_WIDTH, ARRANGE_WINDOW_HEIGHT);
        this.arrange_window_text = this.arrange_window.set_text(["Arrange info here..."], undefined, 7, 3);
        this.item_choose_window = new ItemPsynergyChooseWindow(
            this.game,
            this.data,
            false,
            this.item_change.bind(this),
            this.item_choose.bind(this),
            this.esc_propagation_priority
        );
        this.item_options_window = new ItemOptionsWindow(this.game, this.data, this.esc_propagation_priority, this.enter_propagation_priority);
    }

    set_control() {
        game.input.keyboard.addKey(Phaser.Keyboard.ESC).onDown.add(() => {
            if (!this.is_open) return;
            this.data.esc_input.getSignal().halt();
            this.close_menu();
        }, this, this.esc_propagation_priority);
    }

    char_change(party_index) {
        if (!this.is_open) return;
        this.selected_char_index = party_index;
        this.basic_info_window.set_char(party_data.members[party_index]);
        this.set_item_icons();
    }

    char_choose(party_index) {
        if (!this.is_open) return;
        this.chars_menu.deactivate();
        this.choosing_item = true;
        this.set_guide_window_text();
        this.item_choose_window.open(party_index, () => {
            this.choosing_item = false;
            this.chars_menu.activate();
            this.set_guide_window_text();
            this.set_description_window_text();
            this.set_item_icons();
            if (this.item_change_stats_window.window_open) {
                this.item_change_stats_window.close();
            }
        });
    }

    item_change(item) {
        this.set_description_window_text(item.description);
        if (this.item_change_stats_window.window_open) {
            this.item_change_stats_window.close();
        }
        if (item.type === item_types.ABILITY_GRANTOR) {

        } else if (item.type !== item_types.GENERAL_ITEM) {
            this.item_change_stats_window.open(party_data.members[this.selected_char_index], item);
        }
    }

    item_choose(item, item_obj) {
        this.item_options_window.open(item_obj, item, party_data.members[this.selected_char_index],
            this.item_choose_window.activate.bind(this.item_choose_window),
            this.item_change_stats_window.update_info.bind(this.item_change_stats_window)
        );
    }

    set_guide_window_text() {
        if (this.choosing_item) {
            this.guide_window.update_text(this.guide_window_msgs.choosing_item, this.guide_window_text);
        } else {
            this.guide_window.update_text(this.guide_window_msgs.choosing_char, this.guide_window_text);
        }
    }

    set_description_window_text(description) {
        if (this.choosing_item) {
            this.description_window.update_text(description, this.description_window_text);
        } else {
            this.description_window.update_text(party_data.coins + "    Coins", this.description_window_text);
        }
    }

    set_item_icons() {
        this.item_overview_window.remove_from_group();
        let counter = 0;
        for (let i = 0; i < party_data.members[this.selected_char_index].items.length; ++i) {
            const item_obj = party_data.members[this.selected_char_index].items[i];
            const item_key_name = item_obj.key_name;
            if (item_key_name in items_list) {
                const item = items_list[item_key_name];
                const x = TOTAL_BORDER + ITEM_OVERVIEW_WIN_INSIDE_PADDING_H + Math.ceil((counter%ITEM_OVERVIEW_WIN_ICONS_PER_LINE) * (ITEM_OVERVIEW_WIN_SPACE_BETWN_ICO + numbers.ICON_WIDTH));
                const y = TOTAL_BORDER + ITEM_OVERVIEW_WIN_INSIDE_PADDING_V + parseInt(counter/ITEM_OVERVIEW_WIN_ICONS_PER_LINE) * (ITEM_OVERVIEW_WIN_SPACE_BETWN_LINE + numbers.ICON_HEIGHT);
                this.item_overview_window.create_at_group(x, y, item_key_name + "_item_icon");
                if (item_obj.equipped) {
                    this.item_overview_window.create_at_group(x + SUB_ICON_X, y + SUB_ICON_Y, "equipped");
                }
                ++counter;
            }
        }
    }

    open_menu(close_callback) {
        this.close_callback = close_callback;
        this.chars_menu.open(this.selected_char_index);
        this.basic_info_window.open(party_data.members[this.selected_char_index]);
        this.set_item_icons();
        this.set_guide_window_text();
        this.set_description_window_text();
        this.guide_window.show(undefined, false);
        this.description_window.show(undefined, false);
        this.item_overview_window.show(undefined, false);
        this.arrange_window.show(undefined, false);
        this.is_open = true;
    }

    close_menu(close_menu_below = false) {
        this.chars_menu.close();
        this.basic_info_window.close();
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