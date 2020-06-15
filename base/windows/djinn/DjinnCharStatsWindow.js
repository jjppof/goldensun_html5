import { Window } from '../../Window.js';
import { ordered_elements } from '../../MainChar.js';
import * as numbers from '../../../magic_numbers.js';

const BASE_WIN_WIDTH = 116;
const BASE_WIN_HEIGHT = 116;
const BASE_WIN_X = 0;
const BASE_WIN_Y = 40;
const AVATAR_X = 8;
const AVATAR_Y = 8;
const CHAR_NAME_X = 48;
const CHAR_NAME_Y = 8;
const LV_X = 48;
const LV_Y = 24;
const LV_NUMBER_X = 110;
const LV_NUMBER_Y = 24;
const CLASS_X = 8;
const CLASS_Y = 40;
const DJINN_NUMBER_SLOT_WIDTH = 17;
const DJINN_NUMBER_X = 8;
const DJINN_NUMBER_Y = 48;
const stats = ["HP", "PP", "Attack", "Defense", "Agility", "Luck"];
const stats_keys = ["hp", "pp", "atk", "def", "agi", "luk"];
const STATS_X = 8;
const STATS_BASE_Y = 64;
const STATS_CURRENT_X = 78;
const STATS_NEXT_X = 110;

export class DjinnCharStatsWindow {
    constructor(game) {
        this.game = game;
        this.window_open = false;
        this.sprites = [];
        this.base_window = new Window(this.game, BASE_WIN_X, BASE_WIN_Y, BASE_WIN_WIDTH, BASE_WIN_HEIGHT);
        this.char_name_text = this.base_window.set_text_in_position("", CHAR_NAME_X, CHAR_NAME_Y);
        this.base_window.set_text_in_position("Lv", LV_X, LV_Y);
        this.level_number_text = this.base_window.set_text_in_position("", LV_NUMBER_X, LV_NUMBER_Y, true);
        this.class_text = this.base_window.set_text_in_position("", CLASS_X, CLASS_Y);
        this.djinn_number_texts = {};
        ordered_elements.forEach((element, i) => {
            const star_width = 6;
            const x = DJINN_NUMBER_X + star_width + 3 + i * DJINN_NUMBER_SLOT_WIDTH;
            this.djinn_number_texts[element] = this.base_window.set_text_in_position("", x, DJINN_NUMBER_Y);
        });
        this.stats_current_texts = {};
        this.stats_next_texts = {};
        stats.forEach((stat, i) => {
            const y = STATS_BASE_Y + i * numbers.FONT_SIZE;
            this.base_window.set_text_in_position(stat, STATS_X, y);
            let shift = 0;
            if (["HP", "PP"].includes(stat)) {
                shift = -8;
            }
            this.stats_current_texts[stat] = this.base_window.set_text_in_position("", STATS_CURRENT_X + shift, y, true);
            this.stats_next_texts[stat] = this.base_window.set_text_in_position("", STATS_NEXT_X, y, true);
        });
    }

    mount_window() {
        const avatar_sprite = this.base_window.create_at_group(AVATAR_X, AVATAR_Y, this.char.key_name + "_avatar");
        this.sprites.push(avatar_sprite);
        this.base_window.update_text(this.char.name, this.char_name_text);
        this.base_window.update_text(this.char.level.toString(), this.level_number_text);
        this.base_window.update_text(this.char.class.name, this.class_text);
        ordered_elements.forEach((element, i) => {
            this.base_window.update_text(this.char[element + "_djinni"].length.toString(), this.djinn_number_texts[element]);
            const x = DJINN_NUMBER_X + 1 + i * DJINN_NUMBER_SLOT_WIDTH;
            const star_sprite = this.base_window.create_at_group(x, DJINN_NUMBER_Y + 1, element + "_star");
            this.sprites.push(star_sprite);
        });
        stats.forEach((stat, i) => {
            const current_stat = this.char["current_" + stats_keys[i]];
            const next_stat = this.char.preview_stats_by_djinn(stats_keys[i], this.djinn.key_name, this.next_djinn_status);
            this.base_window.update_text(current_stat.toString(), this.stats_current_texts[stat]);
            this.base_window.update_text(next_stat.toString(), this.stats_next_texts[stat]);
            const y = STATS_BASE_Y + i * numbers.FONT_SIZE - 3;
            let shift = 0;
            if (["HP", "PP"].includes(stat)) {
                shift = -8;
            }
            if (current_stat !== next_stat) {
                const arrow_sprite = this.base_window.create_at_group(STATS_CURRENT_X + shift, y, "stat_" + (next_stat > current_stat ? "up" : "down"));
                this.sprites.push(arrow_sprite);
            }
        });
        
    }

    unmount_window() {
        this.sprites.forEach(sprite => {
            sprite.destroy();
        });
    }

    open(char, djinn, next_djinn_status, callback) {
        this.char = char;
        this.djinn = djinn;
        this.next_djinn_status = next_djinn_status;
        this.mount_window();
        this.base_window.show(() => {
            this.window_open = true;
            if (callback !== undefined) {
                callback();
            }
        }, false);
    }

    close(callback) {
        this.unmount_window();
        this.base_window.close(() => {
            this.window_open = false;
            if (callback !== undefined) {
                callback();
            }
        }, false);
    }
}