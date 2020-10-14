import { TextObj, Window } from "../../Window";
import * as numbers from "../../magic_numbers";
import { GoldenSun } from "../../GoldenSun";
import { MainChar } from "../../MainChar";
import { Djinn } from "../../Djinn";

const BASE_WIN_X = 0;
const BASE_WIN_Y = 64;
const BASE_WIN_WIDTH = 156;
const BASE_WIN_HEIGHT = 84;
const HP_LABEL_X = 8;
const HP_LABEL_Y = 16;
const CLASS_NAME_Y = 8;
const AFTER_CLASS_X = 88;
const BEFORE_STAT_X = 78;
const AFTER_STAT_X = 126;
const CLASS_ARROW_X = 80;
const CLASS_ARROW_Y = 16;
const stats_keys = ["max_hp", "max_pp", "atk", "def", "agi", "luk"];
const STAT_ARROW_X = 80;
const STAT_ARROW_Y = 15;
const SHIFT_BUTTON_X = 32;
const SHIFT_BUTTON_Y = 72;
const SHIFT_DESCRIPTION_X = 55;
const SHIFT_DESCRIPTION_Y = 72;

export class DjinnStatsWindow {
    public game: Phaser.Game;
    public data: GoldenSun;
    public base_window: Window;
    public before_stats: {[stat: string]: TextObj};
    public after_stats: {[stat: string]: TextObj};
    public up_arrows: {[stat: string]: Phaser.Sprite};
    public down_arrows: {[stat: string]: Phaser.Sprite};
    public before_class_text: TextObj;
    public after_class_text: TextObj;
    public window_open: boolean;
    public char: MainChar;
    public next_djinni_status: string;
    public djinn: Djinn;

    constructor(game, data) {
        this.game = game;
        this.data = data;
        this.base_window = new Window(this.game, BASE_WIN_X, BASE_WIN_Y, BASE_WIN_WIDTH, BASE_WIN_HEIGHT);
        const labels = ["HP", "PP", "Attack", "Defense", "Agility", "Luck"];
        this.before_stats = {};
        this.after_stats = {};
        this.up_arrows = {};
        this.down_arrows = {};
        for (let i = 0; i < stats_keys.length; ++i) {
            this.base_window.set_text_in_position(labels[i], HP_LABEL_X, HP_LABEL_Y + i * numbers.FONT_SIZE);
            this.before_stats[stats_keys[i]] = this.base_window.set_text_in_position("", BEFORE_STAT_X, HP_LABEL_Y + i * numbers.FONT_SIZE, true);
            this.after_stats[stats_keys[i]] = this.base_window.set_text_in_position("", AFTER_STAT_X, HP_LABEL_Y + i * numbers.FONT_SIZE, true);
            this.up_arrows[stats_keys[i]] = this.base_window.create_at_group(STAT_ARROW_X, STAT_ARROW_Y + i * numbers.FONT_SIZE, "stat_up");
            this.down_arrows[stats_keys[i]] = this.base_window.create_at_group(STAT_ARROW_X, STAT_ARROW_Y + i * numbers.FONT_SIZE, "stat_down");
        }
        this.hide_arrows();
        this.before_class_text = this.base_window.set_text_in_position("", HP_LABEL_X, CLASS_NAME_Y);
        this.after_class_text = this.base_window.set_text_in_position("", AFTER_CLASS_X, CLASS_NAME_Y);
        let arrow_change = this.base_window.create_at_group(CLASS_ARROW_X, CLASS_ARROW_Y, "arrow_change");
        arrow_change.rotation = -numbers.degree90;
        this.base_window.create_at_group(SHIFT_BUTTON_X + 1, SHIFT_BUTTON_Y + 1, "shift_keyboard", 0x0);
        this.base_window.create_at_group(SHIFT_BUTTON_X, SHIFT_BUTTON_Y, "shift_keyboard");
        this.base_window.set_text_in_position(": Psy. Gained", SHIFT_DESCRIPTION_X, SHIFT_DESCRIPTION_Y);
        this.window_open = false;
    }

    hide_arrows() {
        for (let i = 0; i < stats_keys.length; ++i) {
            this.down_arrows[stats_keys[i]].alpha = 0;
            this.up_arrows[stats_keys[i]].alpha = 0;
        }
    }

    set_stats() {
        this.base_window.update_text(this.char.class.name, this.before_class_text);
        const preview_values = this.char.preview_djinn_change(stats_keys, [this.djinn.key_name], [this.next_djinni_status]);
        this.base_window.update_text(preview_values.class_name, this.after_class_text);
        for (let i = 0; i < stats_keys.length; ++i) {
            const stat_key = stats_keys[i];
            const current_stat = this.char[stat_key];
            const next_stat = preview_values[stat_key];
            this.base_window.update_text(current_stat.toString(), this.before_stats[stat_key]);
            this.base_window.update_text(next_stat.toString(), this.after_stats[stat_key]);
            if (current_stat > next_stat) {
                this.down_arrows[stat_key].alpha = 1;
            } else if (current_stat < next_stat) {
                this.up_arrows[stat_key].alpha = 1;
            }
        }
    }

    set_djinn(djinn, next_djinni_status) {
        this.djinn = djinn;
        this.next_djinni_status = next_djinni_status;
        this.hide_arrows();
        this.set_stats();
    }

    open(char) {
        this.char = char;
        this.djinn = null;
        this.next_djinni_status = null;
        this.hide_arrows();
        this.base_window.show(() => {
            this.window_open = true;
        }, false);
    }

    close() {
        this.base_window.close(() => {
            this.window_open = false;
        }, false);
    }

    destroy() {
        this.base_window.destroy(false);
    }
}