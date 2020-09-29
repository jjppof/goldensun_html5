import { CharsMenu } from '../base/menus/CharsMenu.js';
import { BasicInfoWindow } from '../base/windows/BasicInfoWindow.js';
import { ItemPsynergyChooseWindow } from '../base/windows/ItemPsynergyChooseWindow.js';
import { Window } from '../base/Window.js';
import * as numbers from '../magic_numbers.js';

const GUIDE_WINDOW_X = 104;
const GUIDE_WINDOW_Y = 0;
const GUIDE_WINDOW_WIDTH = 132;
const GUIDE_WINDOW_HEIGHT = 20;
const DESCRIPTION_WINDOW_X = 0;
const DESCRIPTION_WINDOW_Y = 136;
const DESCRIPTION_WINDOW_WIDTH = 236;
const DESCRIPTION_WINDOW_HEIGHT = 20;
const PSY_OVERVIEW_WIN_X = 104;
const PSY_OVERVIEW_WIN_Y = 24;
const PSY_OVERVIEW_WIN_WIDTH = 132;
const PSY_OVERVIEW_WIN_HEIGHT = 76;
const SHORTCUTS_WINDOW_X = 104;
const SHORTCUTS_WINDOW_Y = 104;
const SHORTCUTS_WINDOW_WIDTH = 132;
const SHORTCUTS_WINDOW_HEIGHT = 28;

const TOTAL_BORDER = numbers.INSIDE_BORDER_WIDTH + numbers.OUTSIDE_BORDER_WIDTH;
const PSY_OVERVIEW_WIN_INSIDE_PADDING_H = 1;
const PSY_OVERVIEW_WIN_INSIDE_PADDING_V = 5;
const PSY_OVERVIEW_WIN_ICONS_PER_LINE = 8;
const PSY_OVERVIEW_WIN_SPACE_BETWN_LINE = 3;
const PSY_OVERVIEW_WIN_SPACE_BETWN_ICO = ((PSY_OVERVIEW_WIN_WIDTH - 2*(numbers.INSIDE_BORDER_WIDTH + PSY_OVERVIEW_WIN_INSIDE_PADDING_H)) -
    (PSY_OVERVIEW_WIN_ICONS_PER_LINE * numbers.ICON_WIDTH))/(PSY_OVERVIEW_WIN_ICONS_PER_LINE - 1);

export class PsynergyMenuScreen {
    constructor(game, data, esc_propagation_priority, enter_propagation_priority) {
        this.game = game;
        this.data = data;
        this.esc_propagation_priority = esc_propagation_priority + 1;
        this.enter_propagation_priority = enter_propagation_priority + 1;
        this.chars_menu = new CharsMenu(this.game, this.data, this.char_choose.bind(this), this.char_change.bind(this), this.enter_propagation_priority);
        this.basic_info_window = new BasicInfoWindow(this.game);
        this.selected_char_index = 0;
        this.is_open = false;
        this.close_callback = null;
        this.set_control();
        this.guide_window = new Window(this.game, GUIDE_WINDOW_X, GUIDE_WINDOW_Y, GUIDE_WINDOW_WIDTH, GUIDE_WINDOW_HEIGHT);
        this.guide_window_text = this.guide_window.set_single_line_text("");
        this.choosing_psynergy = false;
        this.guide_window_msgs = {
            choosing_char: "Whose Psynergy?",
            choosing_psynergy: "Which Psynergy?",
        }
        this.description_window = new Window(this.game, DESCRIPTION_WINDOW_X, DESCRIPTION_WINDOW_Y, DESCRIPTION_WINDOW_WIDTH, DESCRIPTION_WINDOW_HEIGHT);
        this.description_window_text = this.description_window.set_single_line_text("");
        this.psynergy_overview_window = new Window(this.game, PSY_OVERVIEW_WIN_X, PSY_OVERVIEW_WIN_Y, PSY_OVERVIEW_WIN_WIDTH, PSY_OVERVIEW_WIN_HEIGHT);
        this.shortcuts_window = new Window(this.game, SHORTCUTS_WINDOW_X, SHORTCUTS_WINDOW_Y, SHORTCUTS_WINDOW_WIDTH, SHORTCUTS_WINDOW_HEIGHT);
        this.shortcuts_window_text = this.shortcuts_window.set_text(["Use a keyboard number", "to set a shorcut."], undefined, 7, 3);
        this.psynergy_choose_window = new ItemPsynergyChooseWindow(
            this.game,
            this.data,
            true,
            this.psynergy_change.bind(this),
            this.psynergy_choose.bind(this),
            this.esc_propagation_priority
        );
    }

    set_control() {
        this.data.esc_input.add(() => {
            if (!this.is_open) return;
            this.data.esc_input.halt();
            this.close_menu();
        }, this, this.esc_propagation_priority);
    }

    char_change(party_index) {
        if (!this.is_open) return;
        this.selected_char_index = party_index;
        this.basic_info_window.set_char(this.data.info.party_data.members[party_index]);
        this.set_psynergy_icons();
    }

    char_choose(party_index) {
        if (!this.is_open) return;
        this.chars_menu.deactivate();
        this.choosing_psynergy = true;
        this.set_guide_window_text();
        this.psynergy_choose_window.open(party_index, () => {
            this.choosing_psynergy = false;
            this.chars_menu.activate();
            this.set_guide_window_text();
            this.set_description_window_text();
        });
    }

    psynergy_change(ability) {
        this.set_description_window_text(ability.description);
    }

    psynergy_choose(ability) {
        if (ability.key_name in this.data.info.field_abilities_list) {
            this.close_menu(true);
            this.data.info.field_abilities_list[ability.key_name].cast(this.data.hero, this.data.info.party_data.members[this.selected_char_index].key_name);
        }
    }

    set_guide_window_text() {
        if (this.choosing_psynergy) {
            this.guide_window.update_text(this.guide_window_msgs.choosing_psynergy, this.guide_window_text);
        } else {
            this.guide_window.update_text(this.guide_window_msgs.choosing_char, this.guide_window_text);
        }
    }

    set_description_window_text(description) {
        if (this.choosing_psynergy) {
            this.description_window.update_text(description, this.description_window_text);
        } else {
            this.description_window.update_text(this.data.info.party_data.coins + "    Coins", this.description_window_text);
        }
    }

    set_psynergy_icons() {
        this.psynergy_overview_window.remove_from_group();
        let counter = 0;
        for (let i = 0; i < this.data.info.party_data.members[this.selected_char_index].abilities.length; ++i) {
            const ability_key_name = this.data.info.party_data.members[this.selected_char_index].abilities[i];
            if (ability_key_name in this.data.info.abilities_list) {
                const ability = this.data.info.abilities_list[ability_key_name];
                if (ability.is_field_psynergy || ability.effects_outside_battle) {
                    const x = TOTAL_BORDER + PSY_OVERVIEW_WIN_INSIDE_PADDING_H + Math.ceil((counter%PSY_OVERVIEW_WIN_ICONS_PER_LINE) * (PSY_OVERVIEW_WIN_SPACE_BETWN_ICO + numbers.ICON_WIDTH));
                    const y = TOTAL_BORDER + PSY_OVERVIEW_WIN_INSIDE_PADDING_V + parseInt(counter/PSY_OVERVIEW_WIN_ICONS_PER_LINE) * (PSY_OVERVIEW_WIN_SPACE_BETWN_LINE + numbers.ICON_HEIGHT);
                    this.psynergy_overview_window.create_at_group(x, y, "abilities_icons", undefined, ability_key_name);
                    ++counter;
                }
            }
        }
    }

    open_menu(close_callback) {
        this.close_callback = close_callback;
        this.chars_menu.open(this.selected_char_index);
        this.basic_info_window.open(this.data.info.party_data.members[this.selected_char_index]);
        this.set_psynergy_icons();
        this.set_guide_window_text();
        this.set_description_window_text();
        this.guide_window.show(undefined, false);
        this.description_window.show(undefined, false);
        this.psynergy_overview_window.show(undefined, false);
        this.shortcuts_window.show(undefined, false);
        this.is_open = true;
    }

    close_menu(close_menu_below = false) {
        this.chars_menu.close();
        this.basic_info_window.close();
        this.is_open = false;
        this.guide_window.close(undefined, false);
        this.description_window.close(undefined, false);
        this.psynergy_overview_window.close(undefined, false);
        this.shortcuts_window.close(undefined, false);
        if (this.close_callback !== null) {
            this.close_callback(close_menu_below);
        }
    }
}