import { Window } from "../../Window.js";
import { CursorControl } from '../../utils/CursorControl.js';
import { abilities_list } from '../../../initializers/abilities.js';
import * as numbers from "../../../magic_numbers.js"
import { Djinn } from "../../Djinn.js";
import { SummonDjinnStandbyWindow } from "./SummonDjinnStandbyWindow.js";
import { MAX_CHARS_IN_BATTLE } from "../../battle/Battle.js";
import { MainChar } from "../../MainChar.js";

const BASE_WINDOW_X = 104;
const BASE_WINDOW_Y = 88;
const BASE_WINDOW_WIDTH = 132;
const BASE_WINDOW_HEIGHT = 68;
const ELEM_PER_PAGE = 4;
const TOP_PADDING = 8;
const SPACE_BETWEEN_ITEMS = 8;
const HIGHLIGHT_BAR_WIDTH = 120;
const HIGHLIGHT_BAR_HEIGHT = 8;
const HIGHLIGHT_BAR_X = 8;
const BUTTON_X = 80;
const BUTTON_Y = 136;
const SUMMON_NAME_X = 28;
const CURSOR_X = 98;
const CURSOR_Y = 100;
const CURSOR_SHIFT = 16;
const SUMMON_ICON_X = 10;

export class SummonWindow {
    constructor(game, data, esc_propagation_priority, enter_propagation_priority) {
        this.game = game;
        this.data = data;
        this.esc_propagation_priority = esc_propagation_priority + 1;
        this.enter_propagation_priority = enter_propagation_priority + 1;
        this.base_window = new Window(this.game, BASE_WINDOW_X, BASE_WINDOW_Y, BASE_WINDOW_WIDTH, BASE_WINDOW_HEIGHT);
        this.base_window.init_page_indicator_bar();
        this.group = this.game.add.group();
        this.button = this.group.create(BUTTON_X, BUTTON_Y, "buttons", "summon");
        this.group.alpha = 0;
        this.highlight_bar = this.game.add.graphics(0, 0);
        this.highlight_bar.blendMode = PIXI.blendModes.SCREEN;
        this.highlight_bar.alpha = 0;
        this.base_window.add_sprite_to_group(this.highlight_bar);
        this.highlight_bar.beginFill(this.base_window.color, 1);
        this.highlight_bar.drawRect(HIGHLIGHT_BAR_X, 0, HIGHLIGHT_BAR_WIDTH, HIGHLIGHT_BAR_HEIGHT);
        this.highlight_bar.endFill();
        this.signal_bindings = this.set_control();
        this.summon_names = [];
        this.other_sprites = [];
        this.cursor_control = new CursorControl(this.game, true, true, this.get_max_pages.bind(this), this.get_max_elem_on_page.bind(this),
            this.group, this.change_page.bind(this), this.change_summon.bind(this), this.get_page_index.bind(this), this.set_page_index.bind(this),
            this.get_summon_index.bind(this), this.set_summon_index.bind(this), this.is_open.bind(this), this.is_active.bind(this),
            this.get_cursor_x.bind(this), this.get_cursor_y.bind(this));
        this.djinn_numbers_window = new SummonDjinnStandbyWindow(game);
    }

    set_control() {
        return [
            this.data.esc_input.add(() => {
                if (!this.window_open || !this.window_active) return;
                this.data.esc_input.halt();
                this.choosen_ability = null;
                this.close(this.close_callback);
            }, this, this.esc_propagation_priority),
            this.data.enter_input.add(() => {
                if (!this.window_open || !this.window_active) return;
                this.data.enter_input.halt();
                this.choosen_ability = this.summons[this.summon_index].key_name;
                this.hide(this.close_callback);
            }, this, this.enter_propagation_priority)
        ];
    }

    get_cursor_x() {
        return CURSOR_X;
    }

    get_cursor_y() {
        return CURSOR_Y + (this.summon_index * CURSOR_SHIFT);
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

    get_summon_index() {
        return this.summon_index;
    }

    set_summon_index(index) {
        this.summon_index = index;
    } 

    get_max_elem_on_page() {
        return this.summons.length;
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
        if (this.summon_index >= this.summons.length) {
            this.summon_index = this.summons.length - 1;
            this.cursor_control.set_cursor_position();
        }
        if (this.set_description) {
            this.set_description(abilities_list[this.summons[this.summon_index].key_name].description);
        }
        this.set_highlight_bar();
        this.base_window.set_page_indicator_highlight(this.page_number, this.page_index);
        this.djinn_numbers_window.set_numbers(this.summons[this.summon_index].requirements);
    }

    change_summon(before_index, after_index) {
        if (this.set_description) {
            this.set_description(abilities_list[this.summons[this.summon_index].key_name].description);
        }
        this.set_highlight_bar();
        this.djinn_numbers_window.set_numbers(this.summons[this.summon_index].requirements);
    }

    set_highlight_bar() {
        this.highlight_bar.y = TOP_PADDING + this.summon_index * (SPACE_BETWEEN_ITEMS + HIGHLIGHT_BAR_HEIGHT);
    }

    config_page() {
        this.clear_sprites();
        this.summons = this.all_summons.slice(this.page_index * ELEM_PER_PAGE, (this.page_index + 1) * ELEM_PER_PAGE);
        for (let i = 0; i < this.summons.length; ++i) {
            const ability = abilities_list[this.summons[i].key_name];
            const base_y = TOP_PADDING + i * (SPACE_BETWEEN_ITEMS + HIGHLIGHT_BAR_HEIGHT);
            const summon_y = base_y - 3;
            this.other_sprites.push(this.base_window.create_at_group(SUMMON_ICON_X, summon_y, "abilities_icons", undefined, this.summons[i].key_name));
            let color = numbers.DEFAULT_FONT_COLOR;
            if (!this.summons[i].available) {
                color = numbers.RED_FONT_COLOR;
            }
            const name = this.base_window.set_text_in_position(ability.name, SUMMON_NAME_X, base_y, false, false, color);
            this.summon_names.push(name);
        }
    }

    set_page_number() {
        const list_length = this.all_summons.length;
        this.page_number = parseInt((list_length - 1)/ELEM_PER_PAGE) + 1;
        if (this.page_index >= this.page_number) {
            this.page_index = this.page_number - 1;
        }
    }

    mount_window() {
        this.standby_djinni = Djinn.get_standby_djinni(MainChar.get_active_players(MAX_CHARS_IN_BATTLE));
        for (let elem in this.standby_djinni) {
            this.standby_djinni[elem] -= this.djinni_already_used[elem];
        }
        this.all_summons = _.map(this.data.summons_db, summon => {
            const available = _.every(summon.requirements, (value, elem) => value <= this.standby_djinni[elem]);
            return Object.assign({}, summon, {
                available: available,
                index: available ? -summon.index : summon.index
            });
        });
        this.all_summons = _.sortBy(this.all_summons, [summon => {
            return summon.index;
        }]);
        this.set_page_number();
        this.base_window.set_page_indicator(this.page_number, this.page_index);
        this.config_page();
    }

    clear_sprites() {
        this.summon_names.forEach(text => {
            this.base_window.remove_text(text);
        });
        this.other_sprites.forEach(sprite => {
            this.base_window.remove_from_group(sprite, true);
        });
    }

    open(char, close_callback, set_description, djinni_already_used) {
        this.char = char;
        this.close_callback = close_callback;
        this.set_description = set_description;
        this.djinni_already_used = djinni_already_used;
        this.group.alpha = 1;
        this.summon_index = 0;
        this.page_index = 0;
        this.choosen_ability = null;
        this.highlight_bar.alpha = 1;
        this.djinn_numbers_window.open();
        this.update_position();
        this.set_highlight_bar();
        this.mount_window();
        this.djinn_numbers_window.set_numbers(this.summons[this.summon_index].requirements);
        this.cursor_control.activate();
        if (this.set_description) {
            this.set_description(abilities_list[this.summons[this.summon_index].key_name].description);
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
        this.djinn_numbers_window.open();
        this.base_window.show(() => {
            this.window_active = true;
        }, false);
    }

    hide(callback) {
        this.group.alpha = 0;
        this.highlight_bar.alpha = 0;
        this.cursor_control.deactivate();
        this.djinn_numbers_window.close();
        this.base_window.close(() => {
            this.window_active = false;
            if (callback !== undefined) {
                callback(this.choosen_ability);
            }
        }, false);
    }

    close(callback) {
        this.clear_sprites();
        this.base_window.unset_page_indicator();
        this.group.alpha = 0;
        this.highlight_bar.alpha = 0;
        this.cursor_control.deactivate();
        this.djinn_numbers_window.close();
        this.base_window.close(() => {
            this.window_open = false;
            this.window_active = false;
            if (callback !== undefined) {
                callback(this.choosen_ability);
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
        this.djinn_numbers_window.destroy();
    }
}