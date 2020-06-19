import { Window } from '../../Window.js';
import { djinn_status, djinn_font_colors } from '../../Djinn.js';
import { CursorControl } from '../../utils/CursorControl.js';
import * as numbers from '../../../magic_numbers.js';
import { party_data } from '../../../initializers/main_chars.js';
import { djinni_list, djinni_sprites } from '../../../initializers/djinni.js';
import { elements } from '../../MainChar.js';
import { capitalize } from '../../../utils.js';
import { DjinnModeHeaderWindow } from './DjinnModeHeaderWindow.js';
import { DjinnCharStatsWindow } from './DjinnCharStatsWindow.js';
import { DjinnPsynergyWindow } from './DjinnPsynergyWindow.js';

const WIN_WIDTH = 236;
const WIN_HEIGHT = 116;
const WIN_X = 0;
const WIN_Y = 40;
const CHAR_X_PADDING = 32;
const CHAR_Y_PADDING = 23;
const CHAR_X_BETWEEN = 56;
const CHARS_PER_PAGE = 4;
const HIGHLIGHT_HEIGHT = 8;
const HIGHLIGHT_WIDTH = 48;
const HIGHLIGHT_X_PADDING = 16;
const HIGHLIGHT_Y_PADDING = 24;
const DJINN_NAME_X_PADDING = 24;
const DJINN_NAME_Y_PADDING = 24;
const STAR_X_PADDING = HIGHLIGHT_X_PADDING + 1;
const STAR_Y_PADDING = HIGHLIGHT_Y_PADDING + 1;
const DJINN_NAME_BETWEEN = 56;
const DJINN_DESCRIPTION_X = 8;
const DJINN_DESCRIPTION_Y = 104;
const DJINN_SPRITE_X = 50;
const DJINN_CHAR_WIN_STATS_RIGHT_X = 120;
const VIEW_STATES = {
    STATS: 0,
    THIS_CHAR: 1,
    NEXT_CHAR: 2
}

export class DjinnListWindow {
    constructor (game, data, esc_propagation_priority, enter_propagation_priority, shift_propagation_priority, spacebar_propagation_priority) {
        this.game = game;
        this.data = data;
        this.base_window = new Window(this.game, WIN_X, WIN_Y, WIN_WIDTH, WIN_HEIGHT);
        this.group = this.game.add.group();
        this.group.alpha = 0;
        this.chars_sprites_group = this.game.add.group();
        this.group.add(this.chars_sprites_group);
        this.window_open = false;
        this.window_active = false;
        this.esc_propagation_priority = esc_propagation_priority + 1;
        this.enter_propagation_priority = enter_propagation_priority + 1;
        this.shift_propagation_priority = shift_propagation_priority + 1;
        this.spacebar_propagation_priority = spacebar_propagation_priority + 1;
        this.selected_char_index = 0;
        this.selected_djinn_index = 0;
        this.page_index = 0;
        this.close_callback = null;
        this.chars_sprites = {};
        this.djinns_sprites = [];
        this.djinn_description = this.base_window.set_text_in_position("", DJINN_DESCRIPTION_X, DJINN_DESCRIPTION_Y);
        this.page_number_bar_highlight = this.game.add.graphics(0, 0);
        this.page_number_bar_highlight.blendMode = PIXI.blendModes.SCREEN;
        this.group.add(this.page_number_bar_highlight);
        this.page_number_bar_highlight.beginFill(this.base_window.color, 1);
        this.page_number_bar_highlight.drawRect(0, 0, HIGHLIGHT_WIDTH, HIGHLIGHT_HEIGHT);
        this.page_number_bar_highlight.endFill();
        this.cursor_control = new CursorControl(this.game, true, true, this.get_max_chars.bind(this),
            this.get_max_djinn.bind(this), this.group, this.on_char_change.bind(this), this.on_djinn_change.bind(this),
            this.get_char_index.bind(this), this.set_char_index.bind(this), this.get_djinn_index.bind(this),
            this.set_djinn_index.bind(this), this.is_open.bind(this), this.is_active.bind(this),
            this.get_x_cursor.bind(this), this.get_y_cursor.bind(this)
        );
        this.sizes = [];
        this.djinn_names = [];
        this.active_djinn_sprite = null;
        this.djinn_status_change_header_window = new DjinnModeHeaderWindow(this.game);
        this.djinn_char_stats_window_left = new DjinnCharStatsWindow(this.game);
        this.djinn_char_stats_window_right = new DjinnCharStatsWindow(this.game, DJINN_CHAR_WIN_STATS_RIGHT_X);
        this.djinn_psynergy_window = new DjinnPsynergyWindow(this.game, this.data, this.esc_propagation_priority, this.enter_propagation_priority, this.spacebar_propagation_priority);
        this.init_djinn_sprites();
        this.init_djinni_status_texts();
        this.set_control();
    }

    update_position() {
        this.group.x = this.game.camera.x + WIN_X;
        this.group.y = this.game.camera.y + WIN_Y;
    }

    set_control() {
        this.game.input.keyboard.addKey(Phaser.Keyboard.ESC).onDown.add(() => {
            if (!this.window_open || !this.window_active) return;
            if (this.setting_djinn_status) {
                this.data.esc_input.getSignal().halt();
                this.cancel_djinn_status_set(true);
            }
        }, this, this.esc_propagation_priority);
        this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER).onDown.add(() => {
            if (!this.window_open || !this.window_active) return;
            this.data.enter_input.getSignal().halt();
            if (this.setting_djinn_status) {
                this.set_djinn_operation();
            } else {
                this.on_choose();
            }
        }, this, this.enter_propagation_priority);
        data.shift_input.add(() => {
            if (!this.window_open || !this.window_active) return;
            this.data.shift_input.halt();
            this.change_djinn_status(this.selected_char_index, this.selected_djinn_index);
        }, this, this.shift_propagation_priority);
    }

    get_x_cursor() {
        return HIGHLIGHT_X_PADDING + this.selected_char_index * DJINN_NAME_BETWEEN - 14;
    }

    get_y_cursor() {
        if (this.setting_djinn_status && this.selected_char_index === this.setting_djinn_status_char_index) {
            return HIGHLIGHT_Y_PADDING - numbers.FONT_SIZE;
        } else if (this.setting_djinn_status && this.selected_djinn_index === party_data.members[this.selected_char_index].djinni.length) {
            return HIGHLIGHT_Y_PADDING - numbers.FONT_SIZE;
        } else {
            return HIGHLIGHT_Y_PADDING + this.selected_djinn_index * numbers.FONT_SIZE + 3;
        }
    }

    is_open() {
        return this.window_open;
    }

    is_active() {
        return this.window_active;
    }

    get_char_index() {
        return this.selected_char_index;
    }

    set_char_index(index) {
        this.selected_char_index = index;
    }

    get_djinn_index() {
        if (this.setting_djinn_status && this.selected_char_index === this.setting_djinn_status_char_index) {
            return this.setting_djinn_status_djinn_index;
        } else { 
            return this.selected_djinn_index;
        }
    }

    set_djinn_index(index) {
        this.selected_djinn_index = index;
    }

    get_max_chars() {
        return this.sizes.length;
    }

    get_max_djinn() {
        if (this.setting_djinn_status && this.selected_char_index === this.setting_djinn_status_char_index) {
            return 1;
        } else {
            return this.sizes[this.selected_char_index];
        }
    }

    init_djinn_sprites() {
        for (let i = 0; i < CHARS_PER_PAGE; ++i) {
            this.djinns_sprites.push({});
            for (let key in elements) {
                const elem = elements[key];
                if (elem === elements.NO_ELEMENT) continue;
                const x = DJINN_SPRITE_X + i * CHAR_X_BETWEEN;
                this.djinns_sprites[i][elem] = this.chars_sprites_group.create(x, CHAR_Y_PADDING, elem + "_djinn_set");
                this.djinns_sprites[i][elem].anchor.setTo(0.5, 1.0);
                this.djinns_sprites[i][elem].scale.x = -1;
                this.djinns_sprites[i][elem].alpha = 0;
            }
        }
    }

    init_djinni_status_texts() {
        this.djinni_status_texts = [];
        for (let i = 0; i < CHARS_PER_PAGE; ++i) {
            const x = STAR_X_PADDING - 1 + i * DJINN_NAME_BETWEEN;
            const y = 16
            this.djinni_status_texts.push(this.base_window.set_text_in_position("", x, y));
        }
    }

    set_djinn_sprite(tween = true) {
        const this_char = party_data.members[this.selected_char_index];
        if (this.setting_djinn_status && this.selected_djinn_index === this_char.djinni.length) return;
        const this_djinn = djinni_list[this_char.djinni[this.selected_djinn_index]];
        if (this.active_djinn_sprite !== null) {
            this.active_djinn_sprite.alpha = 0;
            this.active_djinn_sprite.animations.stop();
        }
        const this_sprite = this.djinns_sprites[this.selected_char_index][this_djinn.element];
        this.active_djinn_sprite = this_sprite;
        if (tween) {
            this_sprite.scale.setTo(0, 0);
            this.game.add.tween(this_sprite.scale).to(
                { x: -1, y: 1 },
                Phaser.Timer.QUARTER >> 1,
                Phaser.Easing.Linear.None,
                true
            );
        }
        this_sprite.alpha = 1;
        let action, direction;
        switch (this_djinn.status) {
            case djinn_status.RECOVERY:
                direction = "left";
            case djinn_status.STANDBY:
                direction = "down";
                action = "standby";
                break;
            case djinn_status.SET:
                direction = "down";
                action = "set";
        }
        djinni_sprites[this_djinn.element].setAnimation(this_sprite, action);
        this_sprite.animations.play(action + "_" + direction);
    }

    load_page() {
        this.sizes = new Array(party_data.members.length);
        this.djinn_names = [];
        this.stars = [];
        for (let i = 0; i < CHARS_PER_PAGE; ++i) {
            const party_index = this.page_index * CHARS_PER_PAGE + i;
            if (party_index >= party_data.members.length) continue;
            const this_char = party_data.members[party_index];
            const char_key_name = this_char.key_name;
            if (!(char_key_name in this.chars_sprites)) {
                this.chars_sprites[char_key_name] = this.chars_sprites_group.create(0, 0, char_key_name + "_idle");
                this.chars_sprites[char_key_name].anchor.setTo(0.5, 1.0);
                this.chars_sprites[char_key_name].animations.add("idle_down", this_char.animations.idle.down, this_char.actions.idle.frame_rate, true);
            }
            this.chars_sprites[char_key_name].animations.play("idle_down", this_char.actions.idle.frame_rate, true);
            const x = CHAR_X_PADDING + i * CHAR_X_BETWEEN;
            this.chars_sprites[char_key_name].x = x;
            this.chars_sprites[char_key_name].y = CHAR_Y_PADDING;
            this.chars_sprites[char_key_name].alpha = 1;
            this.djinn_names.push([]);
            this.stars.push([]);
            this.update_djinn_list(i);
        }
    }

    update_djinn_list(char_index) {
        this.djinn_names[char_index].forEach(sprite => {
            this.base_window.remove_text(sprite);
        });
        this.stars[char_index].forEach(sprite => {
            this.base_window.remove_from_group(sprite, true);
        });
        const this_char = party_data.members[char_index];
        const char_djinni = this_char.djinni;
        let this_djinn_names = [];
        let stars = [];
        for (let j = 0; j < char_djinni.length; ++j) {
            const this_djinn = djinni_list[char_djinni[j]];
            const star_x = STAR_X_PADDING + char_index * DJINN_NAME_BETWEEN;
            const star_y = STAR_Y_PADDING + j * numbers.FONT_SIZE;
            stars.push(this.base_window.create_at_group(star_x, star_y, this_djinn.element + "_star"));
            const djinn_x = DJINN_NAME_X_PADDING + char_index * DJINN_NAME_BETWEEN;
            const djinn_y = DJINN_NAME_Y_PADDING + j * numbers.FONT_SIZE;
            let color;
            switch (this_djinn.status) {
                case djinn_status.SET: color = djinn_font_colors[djinn_status.SET]; break;
                case djinn_status.STANDBY: color = djinn_font_colors[djinn_status.STANDBY]; break;
                case djinn_status.RECOVERY: color = djinn_font_colors[djinn_status.RECOVERY]; break;
            }
            const djinn_name = this.base_window.set_text_in_position(this_djinn.name, djinn_x, djinn_y, false, false, color);
            this_djinn_names.push(djinn_name);
        }
        this.sizes[char_index] = char_djinni.length;
        this.djinn_names[char_index] = this_djinn_names;
        this.stars[char_index] = stars;
    }

    unset_page() {
        for (let key in this.chars_sprites) {
            this.chars_sprites[key].animations.stop();
            this.chars_sprites[key].alpha = 0;
        }
        this.base_window.remove_from_group();
        for (let i = 0; i < this.djinn_names.length; ++i) {
            const names = this.djinn_names[i];
            for (let j = 0; j < names.length; ++j) {
                this.base_window.remove_text(names[j]);
            }
        }
    }

    set_highlight_bar() {
        if (this.setting_djinn_status && this.selected_djinn_index === party_data.members[this.selected_char_index].djinni.length) {
            this.page_number_bar_highlight.alpha = 0;
        } else {
            this.page_number_bar_highlight.alpha = 1;
            this.page_number_bar_highlight.x = HIGHLIGHT_X_PADDING + this.selected_char_index * DJINN_NAME_BETWEEN;
            this.page_number_bar_highlight.y = HIGHLIGHT_Y_PADDING + this.selected_djinn_index * numbers.FONT_SIZE;
        }
    }

    update_djinn_description() {
        if (this.setting_djinn_status && this.selected_djinn_index === party_data.members[this.selected_char_index].djinni.length) {
            this.base_window.update_text("", this.djinn_description);
        } else {
            const this_char = party_data.members[this.selected_char_index];
            const this_djinn = djinni_list[this_char.djinni[this.selected_djinn_index]];
            this.base_window.update_text(this_djinn.description, this.djinn_description);
        }
    }

    set_action_text() {
        if (this.setting_djinn_status) {

        } else {
            const this_char = party_data.members[this.selected_char_index];
            const this_djinn = djinni_list[this_char.djinni[this.selected_djinn_index]];
            this.djinn_action_window.set_action_text(this_djinn.status);
        }
    }

    on_char_change(before_index, after_index) {
        this.selected_char_index = after_index;
        if (this.setting_djinn_status && this.selected_char_index === this.setting_djinn_status_char_index) {
            this.selected_djinn_index = this.setting_djinn_status_djinn_index;
        } else {
            if (this.selected_djinn_index >= this.sizes[this.selected_char_index]) {
                this.selected_djinn_index = this.sizes[this.selected_char_index] - 1;
                this.cursor_control.set_cursor_position();
            }
        }
        this.set_highlight_bar();
        const this_char = party_data.members[this.selected_char_index];
        this.chars_quick_info_window.set_char(this_char);
        this.set_action_text();
        this.update_djinn_description();
        this.set_djinn_sprite();
    }

    on_djinn_change(before_index, after_index) {
        this.selected_djinn_index = after_index;
        this.set_highlight_bar();
        this.set_action_text();
        this.update_djinn_description();
        this.set_djinn_sprite();
    }

    on_choose() {
        const this_char = party_data.members[this.selected_char_index];
        const this_djinn = djinni_list[this_char.djinni[this.selected_djinn_index]];
        if (this.setting_djinn_status || this_djinn.status === djinn_status.RECOVERY) return; 
        for (let key in this.chars_sprites) {
            this.chars_sprites[key].y -= numbers.FONT_SIZE;
        }
        for (let i = 0; i < CHARS_PER_PAGE; ++i) {
            for (let key in elements) {
                const elem = elements[key];
                if (elem === elements.NO_ELEMENT) continue;
                this.djinns_sprites[i][elem].y -= numbers.FONT_SIZE;
            }
        }
        for (let i = 0; i < CHARS_PER_PAGE; ++i) {
            let status_text;
            if (i === this.selected_char_index) {
                switch (this_djinn.status) {
                    case djinn_status.SET: status_text = capitalize(djinn_status.STANDBY); break;
                    case djinn_status.STANDBY: status_text = capitalize(djinn_status.SET); break;
                }
            } else {
                const other_char = party_data.members[i];
                if (other_char === undefined) continue;
                if (other_char.djinni.length < this_char.djinni.length) {
                    status_text = "Give";
                    ++this.sizes[i];
                } else {
                    status_text = "Trade";
                }
            }
            this.base_window.update_text(status_text, this.djinni_status_texts[i]);
        }
        this.setting_djinn_status_char_index = this.selected_char_index;
        this.setting_djinn_status_djinn_index = this.selected_djinn_index;
        this.setting_djinn_status = true;
        this.cursor_control.set_cursor_position();
    }

    cancel_djinn_status_set(reset_index = false) {
        if (!this.setting_djinn_status) return;
        for (let key in this.chars_sprites) {
            this.chars_sprites[key].y += numbers.FONT_SIZE;
        }
        for (let i = 0; i < CHARS_PER_PAGE; ++i) {
            for (let key in elements) {
                const elem = elements[key];
                if (elem === elements.NO_ELEMENT) continue;
                this.djinns_sprites[i][elem].y += numbers.FONT_SIZE;
            }
            this.base_window.update_text("", this.djinni_status_texts[i]);
            const this_char = party_data.members[i];
            if (this_char === undefined) continue;
            this.sizes[i] = this_char.djinni.length;
        }
        if (reset_index) {
            this.selected_char_index = this.setting_djinn_status_char_index;
            this.selected_djinn_index = this.setting_djinn_status_djinn_index;
            this.set_highlight_bar();
        }
        this.setting_djinn_status_char_index = -1;
        this.setting_djinn_status_djinn_index = -1;
        this.setting_djinn_status = false;
        this.set_action_text();
        this.update_djinn_description();
        this.set_djinn_sprite();
        this.cursor_control.set_cursor_position();
    }

    set_djinn_operation() {
        const this_char = party_data.members[this.setting_djinn_status_char_index];
        const this_djinn = djinni_list[this_char.djinni[this.setting_djinn_status_djinn_index]];
        if (this.setting_djinn_status_char_index !== this.selected_char_index) {
            const next_char = party_data.members[this.selected_char_index];
            let this_statuses, next_statuses, this_djinni, next_djinni, action_text, next_djinn;
            if (this.selected_djinn_index === next_char.djinni.length) {
                this_statuses = [this_djinn.status === djinn_status.STANDBY ? "irrelevant" : djinn_status.STANDBY];
                next_statuses = [this_djinn.status === djinn_status.STANDBY ? "irrelevant" : this_djinn.status];
                this_djinni = [this_djinn];
                next_djinni = [this_djinn];
                action_text = "Give";
            } else {
                next_djinn = djinni_list[next_char.djinni[this.selected_djinn_index]];
                this_statuses = [
                    next_djinn.status === djinn_status.STANDBY ? "irrelevant" : next_djinn.status,
                    this_djinn.status === djinn_status.STANDBY ? "irrelevant" : djinn_status.STANDBY
                ];
                next_statuses = [
                    this_djinn.status === djinn_status.STANDBY ? "irrelevant" : this_djinn.status,
                    next_djinn.status === djinn_status.STANDBY ? "irrelevant" : djinn_status.STANDBY
                ];
                this_djinni = [next_djinn, this_djinn];
                next_djinni = [this_djinn, next_djinn];
                action_text = "Trade";
            }
            this.djinn_char_stats_window_left.open(
                this_char,
                this_djinni,
                this_statuses,
                action_text
            );
            this.djinn_char_stats_window_right.open(
                next_char,
                next_djinni,
                next_statuses,
                action_text
            );
            this.djinn_char_stats_window_right.base_window.update_position({x: DJINN_CHAR_WIN_STATS_RIGHT_X});
            this.djinn_status_change_header_window.open(
                [this_char, next_char],
                next_djinni,
                this_statuses,
                action_text
            );
            this.deactivate();
            this.view_state = VIEW_STATES.STATS;
            this.djinn_psynergy_window.open(this_char, this_djinni, this_statuses, (execute_operation) => {
                this.djinn_status_change_header_window.close();
                this.djinn_char_stats_window_left.close();
                this.djinn_char_stats_window_right.close();
                if (execute_operation) {
                    if (action_text === "Trade") {
                        this_char.replace_djinn(this_djinn.key_name, next_djinn.key_name);
                        next_char.replace_djinn(next_djinn.key_name, this_djinn.key_name);
                    } else if (action_text === "Give") {
                        this_char.remove_djinn(this_djinn.key_name);
                        next_char.add_djinn(this_djinn.key_name);
                        this.selected_djinn_index = 0;
                    }
                    this.update_djinn_list(this.selected_char_index);
                    this.update_djinn_list(this.setting_djinn_status_char_index);
                    this.cancel_djinn_status_set();
                }
                this.activate();
            }, true, () => {
                ++this.view_state;
                if (this.view_state > VIEW_STATES.NEXT_CHAR) {
                    this.view_state = VIEW_STATES.STATS;
                }
                switch (this.view_state) {
                    case VIEW_STATES.STATS:
                        this.djinn_psynergy_window.base_window.close(undefined, false);
                        this.djinn_char_stats_window_left.base_window.show(undefined, false);
                        this.djinn_char_stats_window_right.base_window.update_position({x: DJINN_CHAR_WIN_STATS_RIGHT_X});
                        this.djinn_status_change_header_window.set_action_info_text(`: ${this_char.name}'s Psy`);
                        break;
                    case VIEW_STATES.THIS_CHAR:
                        this.djinn_psynergy_window.update_info(this_char, [next_djinn, this_djinn], this_statuses);
                        this.djinn_psynergy_window.base_window.show(undefined, false);
                        this.djinn_char_stats_window_right.base_window.close(undefined, false);
                        this.djinn_status_change_header_window.set_action_info_text(`: ${next_char.name}'s Psy`);
                        break;
                    case VIEW_STATES.NEXT_CHAR:
                        this.djinn_psynergy_window.update_info(next_char, [this_djinn, next_djinn], next_statuses);
                        this.djinn_char_stats_window_left.base_window.close(undefined, false);
                        this.djinn_char_stats_window_right.base_window.show(undefined, false);
                        this.djinn_char_stats_window_right.base_window.update_position({x: 0});
                        this.djinn_status_change_header_window.set_action_info_text(": Status");
                        break;
                }
            }, action_text);
        } else {
            let next_status;
            switch (this_djinn.status) {
                case djinn_status.SET: next_status = djinn_status.STANDBY; break;
                case djinn_status.STANDBY: next_status = djinn_status.SET; break;
            }
            this.deactivate();
            this.djinn_status_change_header_window.open([this_char], [this_djinn], [next_status]);
            this.djinn_char_stats_window_left.open(this_char, [this_djinn], [next_status]);
            this.djinn_psynergy_window.open(this_char, [this_djinn], [next_status], (execute_operation) => {
                this.djinn_status_change_header_window.close();
                this.djinn_char_stats_window_left.close();
                if (execute_operation) {
                    this.change_djinn_status(this.setting_djinn_status_char_index, this.setting_djinn_status_djinn_index);
                    this.cancel_djinn_status_set();
                }
                this.activate();
            });
        }
    }

    change_djinn_status(char_index, djinn_index) {
        const this_char = party_data.members[char_index];
        const this_djinn = djinni_list[this_char.djinni[djinn_index]];
        if (this_djinn.status === djinn_status.SET) {
            this_djinn.set_status(djinn_status.STANDBY, this_char);
            this.base_window.update_text_color(djinn_font_colors[djinn_status.STANDBY], this.djinn_names[char_index][djinn_index]);
            this.chars_quick_info_window.update_text();
            this.set_action_text();
            this.set_djinn_sprite(false);
        } else if (this_djinn.status === djinn_status.STANDBY) {
            this_djinn.set_status(djinn_status.SET, this_char);
            this.base_window.update_text_color(djinn_font_colors[djinn_status.SET], this.djinn_names[char_index][djinn_index]);
            this.chars_quick_info_window.update_text();
            this.set_action_text();
            this.set_djinn_sprite(false);
        }
    }

    open(chars_quick_info_window, djinn_action_window, close_callback, open_callback) {
        this.selected_char_index = 0;
        this.selected_djinn_index = 0;
        this.page_index = 0;
        this.group.alpha = 1;
        this.setting_djinn_status_char_index = -1;
        this.setting_djinn_status_djinn_index = -1;
        this.setting_djinn_status = false;
        this.chars_quick_info_window = chars_quick_info_window;
        this.djinn_action_window = djinn_action_window;
        this.load_page();
        this.update_position();
        this.set_highlight_bar();
        this.set_action_text();
        this.update_djinn_description();
        this.set_djinn_sprite();
        this.cursor_control.activate();
        this.window_open = true;
        this.window_active = true;
        this.changing_djinn_status = false;
        this.close_callback = close_callback;
        this.base_window.show(undefined, false);
        if (open_callback) {
            open_callback();
        }
    }

    close(close_callback) {
        this.window_open = false;
        this.window_active = false;
        this.cursor_control.deactivate();
        this.unset_page();
        this.group.alpha = 0;
        this.base_window.close(undefined, false);
        if (close_callback) {
            close_callback();
        }
    }

    activate() {
        this.window_active = true;
        this.cursor_control.activate();
    }

    deactivate() {
        this.window_active = false;
        this.cursor_control.deactivate();
    }
}