import {TextObj, Window} from "../../Window";
import * as numbers from "../../magic_numbers";
import {GoldenSun} from "../../GoldenSun";
import {Button} from "../../XGamepad";
import {MainChar} from "../../MainChar";
import {Djinn, djinn_status} from "../../Djinn";
import {djinn_actions} from "../../main_menus/MainDjinnMenu";

const BASE_WIN_WIDTH = 116;
const BASE_WIN_HEIGHT = 116;
const BASE_WIN_X = 120;
const BASE_WIN_Y = 40;

const ELEM_PER_PAGE = 5;
const ELEM_PADDING_TOP = 12;
const ELEM_PADDING_LEFT = 8;
const SPACE_BETWEEN_ITEMS = 2;

const PSY_PP_X = 109;
const PSY_PP_COST_X = 86;
const PSY_PP_COST_Y = 8;
const ELEM_NAME_ICON_SHIFT = 4;

const FORWARD = 1;
const BACKWARD = -1;

const PSY_GAIN_COLOR = numbers.YELLOW_FONT_COLOR;
const PSY_LOST_COLOR = numbers.RED_FONT_COLOR;

const PSY_INFO_1_Y = 96;
const PSY_INFO_X = 8;
const PSY_INFO_2_Y = PSY_INFO_1_Y + 1 + numbers.FONT_SIZE;

export class DjinnPsynergyWindow {
    public game: Phaser.Game;
    public data: GoldenSun;

    public window_open: boolean;
    public text_sprites_in_window: TextObj[];
    public icon_sprites_in_window: Phaser.Sprite[];

    public base_window: Window;
    public psy_info_1_text: TextObj;
    public psy_info_2_text: TextObj;

    public execute_operation: boolean;
    public close_callback: Function;
    public next_state_callback: Function;

    public page_number: number;
    public page_index: number;

    public all_abilities: string[];
    public abilities: string[];
    public gained_abilities: string[];
    public lost_abilities: string[];
    public intersection_abilities: string[];
    public current_abilities: string[];
    public next_abilities: string[];

    public char: MainChar;
    public djinni: Djinn[];
    public next_djinni_status: djinn_status[];
    public action: djinn_actions;

    constructor(game: Phaser.Game, data: GoldenSun) {
        this.game = game;
        this.data = data;

        this.window_open = false;
        this.text_sprites_in_window = [];
        this.icon_sprites_in_window = [];

        this.base_window = new Window(this.game, BASE_WIN_X, BASE_WIN_Y, BASE_WIN_WIDTH, BASE_WIN_HEIGHT);
        this.base_window.set_text_in_position("PP", PSY_PP_COST_X, PSY_PP_COST_Y);
        this.psy_info_1_text = this.base_window.set_text_in_position("", PSY_INFO_X, PSY_INFO_1_Y);
        this.psy_info_2_text = this.base_window.set_text_in_position("", PSY_INFO_X, PSY_INFO_2_Y);
    }

    previous_page() {
        this.change_page(BACKWARD);
    }

    next_page() {
        this.change_page(FORWARD);
    }

    /**
     * Grants user control on the current window.
     */
    grant_control() {
        //Missing check for different states on A Key. Using Set sound for all
        const close = execute_operation => {
            this.execute_operation = execute_operation;
            this.close(this.close_callback);
        };
        const controls = [
            {button: Button.LEFT, on_down: this.previous_page.bind(this), sfx: {down: "menu/move"}},
            {button: Button.RIGHT, on_down: this.next_page.bind(this), sfx: {down: "menu/move"}},
            {button: Button.R, on_down: this.next_state_callback, sfx: {down: "menu/move"}},
            {button: Button.A, on_down: () => close(true), sfx: {down: "menu/positive_3"}},
            {button: Button.B, on_down: () => close(false), sfx: {down: "menu/negative"}},
        ];
        this.data.control_manager.add_controls(controls, {loop_config: {horizontal: true}});
    }

    set_page_number() {
        const list_length = this.all_abilities.length;
        this.page_number = (((list_length - 1) / ELEM_PER_PAGE) | 0) + 1;
        if (this.page_index >= this.page_number) {
            this.page_index = this.page_number - 1;
        }
        this.base_window.page_indicator.initialize(this.page_number, this.page_index);
    }

    change_page(page_shift: number) {
        this.page_index += page_shift;
        if (this.page_index === this.page_number) {
            this.page_index = 0;
        } else if (this.page_index < 0) {
            this.page_index = this.page_number - 1;
        }
        this.set_abilities_list();
        this.base_window.page_indicator.select_page(this.page_index);
    }

    set_abilities_list() {
        this.clear_sprites();
        this.abilities = this.all_abilities.slice(
            this.page_index * ELEM_PER_PAGE,
            (this.page_index + 1) * ELEM_PER_PAGE
        );
        for (let i = 0; i < this.abilities.length; ++i) {
            const key_name = this.abilities[i];
            const x = ELEM_PADDING_LEFT;
            const y = ELEM_PADDING_TOP + i * (numbers.ICON_HEIGHT + SPACE_BETWEEN_ITEMS);
            const icon_x = x + (numbers.ICON_WIDTH >> 1);
            const icon_y = y + (numbers.ICON_HEIGHT >> 1);
            const x_elem_name = ELEM_PADDING_LEFT + numbers.ICON_WIDTH + 2;
            const psynergy_name_sprite = this.base_window.set_text_in_position(
                this.data.info.abilities_list[key_name].name,
                x_elem_name,
                y + ELEM_NAME_ICON_SHIFT
            );
            this.text_sprites_in_window.push(psynergy_name_sprite);
            this.icon_sprites_in_window.push(
                this.base_window.create_at_group(icon_x, icon_y, "abilities_icons", undefined, key_name)
            );
            this.icon_sprites_in_window[i].anchor.setTo(0.5, 0.5);
            const psynergy_cost_sprite = this.base_window.set_text_in_position(
                String(this.data.info.abilities_list[key_name].pp_cost),
                PSY_PP_X,
                y + ELEM_NAME_ICON_SHIFT,
                {right_align: true}
            );
            this.text_sprites_in_window.push(psynergy_cost_sprite);
            if (this.gained_abilities.includes(key_name)) {
                this.base_window.update_text_color(PSY_GAIN_COLOR, psynergy_name_sprite);
                this.base_window.update_text_color(PSY_GAIN_COLOR, psynergy_cost_sprite);
            } else if (this.lost_abilities.includes(key_name)) {
                this.base_window.update_text_color(PSY_LOST_COLOR, psynergy_name_sprite);
                this.base_window.update_text_color(PSY_LOST_COLOR, psynergy_cost_sprite);
            }
        }
    }

    set_abilities() {
        this.current_abilities = this.char.abilities.filter(key_name => {
            return key_name in this.data.info.abilities_list;
        });
        const preview_values = this.char.preview_djinn_change(
            [],
            this.djinni.map(d => d.key_name),
            this.next_djinni_status,
            this.action
        );
        this.next_abilities = preview_values.abilities.filter(key_name => {
            return key_name in this.data.info.abilities_list;
        });
        let current_set = new Set(this.current_abilities);
        let next_set = new Set(this.next_abilities);
        this.gained_abilities = [...next_set].filter(x => !current_set.has(x));
        this.lost_abilities = [...current_set].filter(x => !next_set.has(x));
        this.intersection_abilities = [...current_set].filter(x => next_set.has(x));
        this.all_abilities = this.gained_abilities.concat(this.intersection_abilities, this.lost_abilities);
        if (this.gained_abilities.length === 0 && this.lost_abilities.length === 0) {
            this.base_window.update_text("* No change", this.psy_info_1_text);
            this.base_window.update_text_color(numbers.DEFAULT_FONT_COLOR, this.psy_info_1_text);
            this.base_window.update_text("", this.psy_info_2_text);
        } else if (this.gained_abilities.length && this.lost_abilities.length === 0) {
            this.base_window.update_text("* Psynergy Gained", this.psy_info_1_text);
            this.base_window.update_text_color(PSY_GAIN_COLOR, this.psy_info_1_text);
            this.base_window.update_text("", this.psy_info_2_text);
        } else if (this.gained_abilities.length === 0 && this.lost_abilities.length) {
            this.base_window.update_text("* Psynergy Lost", this.psy_info_1_text);
            this.base_window.update_text_color(PSY_LOST_COLOR, this.psy_info_1_text);
            this.base_window.update_text("", this.psy_info_2_text);
        } else if (this.gained_abilities.length && this.lost_abilities.length) {
            this.base_window.update_text("* Psynergy Gained", this.psy_info_1_text);
            this.base_window.update_text_color(PSY_GAIN_COLOR, this.psy_info_1_text);
            this.base_window.update_text("* Psynergy Lost", this.psy_info_2_text);
            this.base_window.update_text_color(PSY_LOST_COLOR, this.psy_info_2_text);
        }
    }

    mount_window() {
        this.set_abilities();
        this.set_abilities_list();
        this.set_page_number();
    }

    clear_sprites() {
        for (let i = 0; i < this.icon_sprites_in_window.length; ++i) {
            this.base_window.remove_from_this_window(this.icon_sprites_in_window[i]);
        }
        this.icon_sprites_in_window = [];
        for (let i = 0; i < this.text_sprites_in_window.length; ++i) {
            this.base_window.destroy_text_obj(this.text_sprites_in_window[i]);
        }
        this.text_sprites_in_window = [];
    }

    update_info(char: MainChar, djinni: Djinn[], next_djinni_status: djinn_status[]) {
        this.clear_sprites();
        this.base_window.page_indicator.terminante();
        this.char = char;
        this.djinni = djinni;
        this.next_djinni_status = next_djinni_status;
        this.page_index = 0;
        this.mount_window();
    }

    open(
        char: MainChar,
        djinni: Djinn[],
        next_djinni_status: djinn_status[],
        close_callback: Function,
        hidden: boolean = false,
        next_state_callback?: Function,
        action?: djinn_actions,
        callback?: Function
    ) {
        this.char = char;
        this.djinni = djinni;
        this.next_djinni_status = next_djinni_status;
        this.close_callback = close_callback;
        this.execute_operation = false;
        this.page_index = 0;
        this.mount_window();
        this.next_state_callback = next_state_callback;
        this.action = action;
        if (hidden) {
            this.window_open = true;
            return;
        }
        this.base_window.show(() => {
            this.window_open = true;
            callback?.();
        }, false);
    }

    close(callback?: Function) {
        this.clear_sprites();
        this.base_window.page_indicator.terminante();
        this.base_window.close(() => {
            this.window_open = false;
            callback?.(this.execute_operation);
        }, false);
    }
}
