import {TextObj, Window} from "../../Window";
import * as numbers from "../../magic_numbers";
import {ordered_elements} from "../../utils";
import {MainChar} from "../../MainChar";
import {Djinn, djinn_status} from "../../Djinn";
import {ordered_main_stats} from "../../Player";

const BASE_WIN_WIDTH = 116;
const BASE_WIN_HEIGHT = 116;
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
const DJINN_NUMBER_X = 110;
const DJINN_NUMBER_Y = 48;

const stats = ["HP", "PP", "Attack", "Defense", "Agility", "Luck"];

const STATS_X = 8;
const STATS_BASE_Y = 64;
const STATS_CURRENT_X = 78;
const STATS_NEXT_X = 110;

const NEW_CLASS_X = 8;
const NEW_CLASS_Y = 56;

const elements_list = ordered_elements.slice().reverse();

const ARROW_CHANGE_CLASS_X = 24;
const ARROW_CHANGE_CLASS_Y = 48;

export class DjinnCharStatsWindow {
    public game: Phaser.Game;

    public window_open: boolean;
    public sprites: Phaser.Sprite[];
    public djinn_number_texts: {[element: string]: TextObj};
    public stats_current_texts: {[stat: string]: TextObj};
    public stats_next_texts: {[stat: string]: TextObj};

    public base_window: Window;

    public char_name_text: TextObj;
    public level_number_text: TextObj;
    public class_text: TextObj;
    public new_class_text: TextObj;

    public class_name_arrow: Phaser.Sprite;
    public class_name_arrow_blink_timer: Phaser.Timer;

    public char: MainChar;
    public djinni: Djinn[];
    public next_djinni_status: djinn_status[];
    public action: string;

    constructor(game, win_x = 0) {
        this.game = game;

        this.window_open = false;
        this.sprites = [];
        this.djinn_number_texts = {};
        this.stats_current_texts = {};
        this.stats_next_texts = {};

        this.base_window = new Window(this.game, win_x, BASE_WIN_Y, BASE_WIN_WIDTH, BASE_WIN_HEIGHT);

        this.char_name_text = this.base_window.set_text_in_position("", CHAR_NAME_X, CHAR_NAME_Y);
        this.base_window.set_text_in_position("Lv", LV_X, LV_Y);
        this.level_number_text = this.base_window.set_text_in_position("", LV_NUMBER_X, LV_NUMBER_Y, true);
        this.class_text = this.base_window.set_text_in_position("", CLASS_X, CLASS_Y);
        this.new_class_text = this.base_window.set_text_in_position("", NEW_CLASS_X, NEW_CLASS_Y);

        elements_list.forEach((element, i) => {
            const x = DJINN_NUMBER_X - i * DJINN_NUMBER_SLOT_WIDTH;
            this.djinn_number_texts[element] = this.base_window.set_text_in_position("", x, DJINN_NUMBER_Y, true);
        });

        stats.forEach((stat, i) => {
            const y = STATS_BASE_Y + i * numbers.FONT_SIZE;
            this.base_window.set_text_in_position(stat, STATS_X, y);
            let shift = 0;
            if (["HP", "PP"].includes(stat)) {
                shift = -8;
            }
            this.stats_current_texts[stat] = this.base_window.set_text_in_position(
                "",
                STATS_CURRENT_X + shift,
                y,
                true
            );
            this.stats_next_texts[stat] = this.base_window.set_text_in_position("", STATS_NEXT_X, y, true);
        });

        this.class_name_arrow = this.base_window.create_at_group(
            ARROW_CHANGE_CLASS_X,
            ARROW_CHANGE_CLASS_Y,
            "menu",
            undefined,
            "arrow_change"
        );
        this.init_arrow_blinks();
    }

    init_arrow_blinks() {
        this.class_name_arrow_blink_timer = this.game.time.create(false);
        this.class_name_arrow_blink_timer.loop(90, () => {
            this.class_name_arrow.alpha = this.class_name_arrow.alpha ? 0 : 1;
        });

        this.class_name_arrow_blink_timer.start();
        this.class_name_arrow_blink_timer.pause();
        this.class_name_arrow.alpha = 0;
    }

    mount_window() {
        const avatar_sprite = this.base_window.create_at_group(
            AVATAR_X,
            AVATAR_Y,
            "avatars",
            undefined,
            this.char.key_name
        );
        this.sprites.push(avatar_sprite);

        this.base_window.update_text(this.char.name, this.char_name_text);
        this.base_window.update_text(this.char.level.toString(), this.level_number_text);
        this.base_window.update_text(this.char.class.name, this.class_text);

        elements_list.forEach((element, i) => {
            this.base_window.update_text(
                this.char[element + "_djinni"].length.toString(),
                this.djinn_number_texts[element]
            );
            const star_width = 6,
                char_width = 6;
            const x = DJINN_NUMBER_X - star_width - char_width - 1 - i * DJINN_NUMBER_SLOT_WIDTH;
            const star_sprite = this.base_window.create_at_group(x, DJINN_NUMBER_Y + 1, "stars", undefined, element);
            this.sprites.push(star_sprite);
        });

        const preview_values = this.char.preview_djinn_change(
            ordered_main_stats,
            this.djinni.map(d => d.key_name),
            this.next_djinni_status,
            this.action
        );
        if (preview_values.class_key_name !== this.char.class.key_name) {
            this.base_window.update_text(preview_values.class_name, this.new_class_text);
            this.class_name_arrow_blink_timer.resume();
        } else {
            this.base_window.update_text("", this.new_class_text);
        }

        stats.forEach((stat, i) => {
            const current_stat = this.char[ordered_main_stats[i]];
            const next_stat = preview_values[ordered_main_stats[i]];

            this.base_window.update_text(current_stat.toString(), this.stats_current_texts[stat]);
            this.base_window.update_text(next_stat.toString(), this.stats_next_texts[stat]);

            const y = STATS_BASE_Y + i * numbers.FONT_SIZE - 3;
            let shift = 0;

            if (["HP", "PP"].includes(stat)) {
                shift = -8;
            }
            if (current_stat !== next_stat) {
                const arrow_sprite = this.base_window.create_at_group(
                    STATS_CURRENT_X + shift,
                    y,
                    "menu",
                    undefined,
                    "stat_" + (next_stat > current_stat ? "up" : "down")
                );
                this.sprites.push(arrow_sprite);
            }
        });
    }

    unmount_window() {
        this.sprites.forEach(sprite => {
            sprite.destroy();
        });

        this.class_name_arrow.alpha = 0;
        if (!this.class_name_arrow_blink_timer.paused) {
            this.class_name_arrow_blink_timer.pause();
        }
    }

    open(char: MainChar, djinni: Djinn[], next_djinni_status: djinn_status[], action?: string, callback?: Function) {
        this.char = char;
        this.djinni = djinni;
        this.next_djinni_status = next_djinni_status;
        this.action = action;
        this.mount_window();

        this.base_window.show(() => {
            this.window_open = true;
            if (callback !== undefined) {
                callback();
            }
        }, false);
    }

    close(callback?: Function) {
        this.unmount_window();
        this.base_window.close(() => {
            this.window_open = false;
            if (callback !== undefined) {
                callback();
            }
        }, false);
    }
}
