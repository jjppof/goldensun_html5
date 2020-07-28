import { Window } from "../../Window.js";
import { CursorControl } from '../../utils/CursorControl.js';
import { djinni_list } from "../../../initializers/djinni.js";
import { djinn_status, djinn_font_colors } from "../../Djinn.js";
import { DjinnStatsWindow } from "./DjinnStatsWindow.js";

const BASE_WINDOW_X = 160;
const BASE_WINDOW_Y = 72;
const BASE_WINDOW_WIDTH = 76;
const BASE_WINDOW_HEIGHT = 84;
const ELEM_PER_PAGE = 5;
const TOP_PADDING = 8;
const SPACE_BETWEEN_ITEMS = 8;
const HIGHLIGHT_BAR_WIDTH = 64;
const HIGHLIGHT_BAR_HEIGHT = 8;
const HIGHLIGHT_BAR_X = 8;
const BUTTON_X = 140;
const BUTTON_Y = 136;
const STAR_X = 9;
const DJINN_NAME_X = 17;
const CURSOR_X = 154;
const CURSOR_Y = 84;
const CURSOR_SHIFT = 16;
const RECOVERY_NUMBER_X = 67;

export class DjinnWindow {
    constructor(game, data, esc_propagation_priority, enter_propagation_priority, shift_propagation_priority) {
        this.game = game;
        this.data = data;
        this.esc_propagation_priority = esc_propagation_priority + 1;
        this.enter_propagation_priority = enter_propagation_priority + 1;
        this.shift_propagation_priority = shift_propagation_priority + 1;
        this.base_window = new Window(this.game, BASE_WINDOW_X, BASE_WINDOW_Y, BASE_WINDOW_WIDTH, BASE_WINDOW_HEIGHT);
        this.base_window.init_page_indicator_bar();
        this.stats_window = new DjinnStatsWindow(this.game, this.data);
        this.group = this.game.add.group();
        this.button = this.group.create(BUTTON_X, BUTTON_Y, "buttons", "djinni");
        this.group.alpha = 0;
        this.highlight_bar = this.game.add.graphics(0, 0);
        this.highlight_bar.blendMode = PIXI.blendModes.SCREEN;
        this.highlight_bar.alpha = 0;
        this.base_window.add_sprite_to_group(this.highlight_bar);
        this.highlight_bar.beginFill(this.base_window.color, 1);
        this.highlight_bar.drawRect(HIGHLIGHT_BAR_X, 0, HIGHLIGHT_BAR_WIDTH, HIGHLIGHT_BAR_HEIGHT);
        this.highlight_bar.endFill();
        this.set_control();
        this.djinn_names = [];
        this.stars_sprites = [];
        this.cursor_control = new CursorControl(this.game, true, true, this.get_max_pages.bind(this), this.get_max_elem_on_page.bind(this),
            this.group, this.change_page.bind(this), this.change_djinn.bind(this), this.get_page_index.bind(this), this.set_page_index.bind(this),
            this.get_djinn_index.bind(this), this.set_djinn_index.bind(this), this.is_open.bind(this), this.is_active.bind(this),
            this.get_cursor_x.bind(this), this.get_cursor_y.bind(this));
    }

    set_control() {
        this.data.esc_input.add(() => {
            if (!this.window_open || !this.window_active || this.psynergy_window_open) return;
            this.data.esc_input.halt();
            this.choosen_ability = null;
            this.close(this.close_callback);
        }, this, this.esc_propagation_priority);
        this.data.enter_input.add(() => {
            if (!this.window_open || !this.window_active || this.psynergy_window_open) return;
            this.data.enter_input.halt();
            const this_djinn = djinni_list[this.djinni[this.djinn_index]];
            if (this_djinn.status !== djinn_status.RECOVERY) {
                this.choosen_ability = this_djinn.ability_key_name;
                this.hide(this.close_callback);
            }
        }, this, this.enter_propagation_priority);
        this.data.shift_input.add(() => {
            if (!this.window_open || !this.window_active || this.psynergy_window_open) return;
            this.data.shift_input.halt();
            this.cursor_control.deactivate();
            this.psynergy_window.open(this.char, undefined, undefined, true, djinni_list[this.djinni[this.djinn_index]], this.get_next_status());
            this.psynergy_window_open = true;
        }, this, this.shift_propagation_priority);
        this.game.input.keyboard.addKey(Phaser.Keyboard.SHIFT).onUp.add(() => {
            if (!this.window_open || !this.window_active || !this.psynergy_window_open) return;
            this.cursor_control.activate();
            this.psynergy_window.close();
            this.psynergy_window_open = false;
        });
    }

    get_cursor_x() {
        return CURSOR_X;
    }

    get_cursor_y() {
        return CURSOR_Y + (this.djinn_index * CURSOR_SHIFT);
    }

    is_open() {
        return this.window_open;
    }

    is_active() {
        return this.window_active && !this.psynergy_window_open;
    }

    get_page_index() {
        return this.page_index;
    }

    set_page_index(index) {
        this.page_index = index;
    }

    get_djinn_index() {
        return this.djinn_index;
    }

    set_djinn_index(index) {
        this.djinn_index = index;
    } 

    get_max_elem_on_page() {
        return this.djinni.length;
    }

    get_max_pages() {
        return this.page_number;
    }

    update_position() {
        this.group.x = this.game.camera.x;
        this.group.y = this.game.camera.y;
    }

    call_set_description() {
        const this_djinn = djinni_list[this.djinni[this.djinn_index]];
        if (this.set_description) {
            switch (this_djinn.status) {
                case djinn_status.SET:
                    this.set_description(this_djinn.description);
                    break;
                case djinn_status.STANDBY:
                    this.set_description("Ready to summon. Choose to set it again.");
                    break;
                case djinn_status.RECOVERY:
                    this.set_description("This Djinn is still recovering.");
                    break;
            }
        }
    }

    change_page(before_index, after_index) {
        this.config_page();
        if (this.djinn_index >= this.djinni.length) {
            this.djinn_index = this.djinni.length - 1;
            this.cursor_control.set_cursor_position();
        }
        this.call_set_description();
        this.set_highlight_bar();
        this.base_window.set_page_indicator_highlight(this.page_number, this.page_index);
        this.update_stats();
    }

    change_djinn(before_index, after_index) {
        this.call_set_description();
        this.set_highlight_bar();
        this.update_stats();
    }

    set_highlight_bar() {
        this.highlight_bar.y = TOP_PADDING + this.djinn_index * (SPACE_BETWEEN_ITEMS + HIGHLIGHT_BAR_HEIGHT);
    }

    config_page() {
        this.clear_sprites();
        this.djinni = this.all_djinni.slice(this.page_index * ELEM_PER_PAGE, (this.page_index + 1) * ELEM_PER_PAGE);
        for (let i = 0; i < this.djinni.length; ++i) {
            const djinn = djinni_list[this.djinni[i]];
            const base_y = TOP_PADDING + i * (SPACE_BETWEEN_ITEMS + HIGHLIGHT_BAR_HEIGHT);
            const star = this.base_window.create_at_group(STAR_X, base_y + 1, djinn.element + "_star");
            this.stars_sprites.push(star);
            let color;
            switch (djinn.status) {
                case djinn_status.SET: color = djinn_font_colors[djinn_status.SET]; break;
                case djinn_status.STANDBY: color = djinn_font_colors[djinn_status.STANDBY]; break;
                case djinn_status.RECOVERY: color = djinn_font_colors[djinn_status.RECOVERY]; break;
            }
            const name = this.base_window.set_text_in_position(djinn.name, DJINN_NAME_X, base_y, false, false, color);
            this.djinn_names.push(name);
            if (djinn.status === djinn_status.RECOVERY) {
                const rec_number = this.base_window.set_text_in_position(
                    (djinn.recovery_turn + 1).toString(), RECOVERY_NUMBER_X, base_y, true, false, djinn_font_colors[djinn_status.RECOVERY]);
                this.djinn_names.push(rec_number);
            }
        }
    }

    set_page_number() {
        const list_length = this.all_djinni.length;
        this.page_number = parseInt((list_length - 1)/ELEM_PER_PAGE) + 1;
        if (this.page_index >= this.page_number) {
            this.page_index = this.page_number - 1;
        }
    }

    get_next_status() {
        const this_djinn = djinni_list[this.djinni[this.djinn_index]];
        let next_status;
        switch (this_djinn.status) {
            case djinn_status.SET: next_status = djinn_status.STANDBY; break;
            case djinn_status.STANDBY: next_status = djinn_status.SET; break;
            case djinn_status.RECOVERY: next_status = djinn_status.RECOVERY; break;
        }
        return next_status;
    }
    
    update_stats() {
        const this_djinn = djinni_list[this.djinni[this.djinn_index]];
        this.stats_window.set_djinn(this_djinn, this.get_next_status());
    }

    mount_window() {
        this.all_djinni = this.char.djinni;
        this.set_page_number();
        this.base_window.set_page_indicator(this.page_number, this.page_index);
        this.config_page();
        this.update_stats();
    }

    clear_sprites() {
        this.stars_sprites.forEach(sprite => {
            this.base_window.remove_from_group(sprite, true);
        });
        this.djinn_names.forEach(text => {
            this.base_window.remove_text(text);
        });
    }

    open(char, close_callback, set_description, psynergy_window) {
        this.char = char;
        this.close_callback = close_callback;
        this.set_description = set_description;
        this.psynergy_window = psynergy_window;
        this.psynergy_window_open = false;
        this.group.alpha = 1;
        this.djinn_index = 0;
        this.page_index = 0;
        this.choosen_ability = null;
        this.highlight_bar.alpha = 1;
        this.stats_window.open(this.char);
        this.update_position();
        this.set_highlight_bar();
        this.mount_window();
        this.cursor_control.activate();
        this.call_set_description();
        this.base_window.show(() => {
            this.window_open = true;
            this.window_active = true;
        }, false);
    }

    show() {
        this.group.alpha = 1;
        this.highlight_bar.alpha = 1;
        this.cursor_control.activate();
        this.stats_window.open(this.char);
        this.update_stats();
        this.base_window.show(() => {
            this.window_active = true;
        }, false);
    }

    hide(callback) {
        this.group.alpha = 0;
        this.highlight_bar.alpha = 0;
        this.stats_window.close();
        this.cursor_control.deactivate();
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
        this.stats_window.close();
        this.base_window.close(() => {
            this.window_open = false;
            this.window_active = false;
            if (callback !== undefined) {
                callback(this.choosen_ability);
            }
        }, false);
    }
}