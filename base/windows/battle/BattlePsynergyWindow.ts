import { TextObj, Window } from '../../Window';
import * as numbers from '../../magic_numbers';
import { temporary_status } from '../../Player';
import { GoldenSun } from '../../GoldenSun';
import { MainChar } from '../../MainChar';
import { Djinn } from '../../Djinn';
import { CursorManager, PointVariants } from '../../utils/CursorManager';

const BASE_WIN_WIDTH = 164;
const BASE_WIN_HEIGHT = 84;
const BASE_WIN_EXPANDED_HEIGHT = 108;
const BASE_WIN_X = 72;
const BASE_WIN_Y = 72;

const BASE_WIN_EXPANDED_X = 0;
const BASE_WIN_EXPANDED_Y = 40;

const ELEM_PER_PAGE = 5;
const ELEM_PADDING_TOP = 5;
const ELEM_PADDING_LEFT = 10;
const SPACE_BETWEEN_ITEMS = 2;
const ELEM_NAME_ICON_SHIFT = 4;

const PP_X = 96;
const PSY_PP_END_X = 126;

const PSY_GAIN_COLOR = numbers.YELLOW_FONT_COLOR;
const PSY_LOST_COLOR = numbers.RED_FONT_COLOR;

const PSY_INFO_1_Y = 89;
const PSY_INFO_X = 40;
const PSY_INFO_2_Y = PSY_INFO_1_Y + 1 + numbers.FONT_SIZE;

const BUTTON_X = 48;
const BUTTON_Y = 136;

const CURSOR_X = 66;
const CURSOR_Y = 83;
const CURSOR_SHIFT = 16;

const START_X = 129;
const RANGE_X = 137;

const HIGHLIGHT_BAR_WIDTH = 152;
const HIGHLIGHT_BAR_HEIGHT = 8;
const HIGHLIGHT_BAR_X = 8;

export class BattlePsynergyWindow {
    public game: Phaser.Game;
    public data: GoldenSun;

    public text_sprites_in_window: TextObj[];
    public icon_sprites_in_window: Phaser.Sprite[];
    public misc_sprites_in_window: Phaser.Sprite[];

    public base_window: Window;
    public group: Phaser.Group;

    public button: Phaser.Sprite;
    public highlight_bar: Phaser.Graphics;

    public window_open: boolean;
    public window_active: boolean;

    public expanded: boolean;
    public ability_index: number;
    public page_index: number;
    public page_number: number;

    public abilities: string[];
    public all_abilities: string[];
    public close_callback: Function;

    public set_description: Function;

    public choosen_ability: string;
    public psy_sealed: boolean;
    public char: MainChar;

    public gained_abilities: string[];
    public lost_abilities: string[];
    public intersection_abilities: string[];
    public current_abilities: string[];
    public next_abilities: string[];

    public psy_info_1_text: TextObj;
    public psy_info_2_text: TextObj;

    public djinni: Djinn[];
    public next_djinni_status: string[];

    constructor(game:Phaser.Game, data:GoldenSun) {
        this.game = game;
        this.data = data;

        this.window_open = false;
        this.window_active = false;
        this.text_sprites_in_window = [];
        this.icon_sprites_in_window = [];
        this.misc_sprites_in_window = [];

        this.base_window = new Window(this.game, BASE_WIN_X, BASE_WIN_Y, BASE_WIN_WIDTH, BASE_WIN_HEIGHT);
        this.base_window.page_indicator.initialize();
        this.group = this.game.add.group();
        this.group.alpha = 0;

        this.button = this.group.create(BUTTON_X, BUTTON_Y, "buttons", "psynergy");
        this.highlight_bar = this.game.add.graphics(0, 0);
        this.highlight_bar.blendMode = PIXI.blendModes.SCREEN;
        this.highlight_bar.alpha = 0;

        this.base_window.add_sprite_to_group(this.highlight_bar);
        this.highlight_bar.beginFill(this.base_window.color, 1);
        this.highlight_bar.drawRect(HIGHLIGHT_BAR_X, 0, HIGHLIGHT_BAR_WIDTH, HIGHLIGHT_BAR_HEIGHT);
        this.highlight_bar.endFill();
    }

    select_ability(index:number){
        this.ability_index = index;

        let cursor_x = CURSOR_X;
        let cursor_y = CURSOR_Y + this.ability_index*CURSOR_SHIFT;
        
        let tween_config = {type: CursorManager.CursorTweens.POINT, variant: PointVariants.NORMAL};
        this.data.cursor_manager.move_to({x: cursor_x, y: cursor_y}, {animate: false, tween_config: tween_config});
        //this.data.cursor_manager.move_to(CURSOR_X, CURSOR_Y + this.ability_index*CURSOR_SHIFT, "point", false);
        this.change_ability();
    }

    next_ability(){
        if(this.abilities.length === 1) return;
        this.select_ability((this.ability_index+1)%this.abilities.length);
    }

    previous_ability(){
        if(this.abilities.length === 1) return;
        this.select_ability((this.ability_index+this.abilities.length-1)%this.abilities.length);
    }

    next_page(){
        if(this.page_number === 1) return;

        this.page_index = (this.page_index+1)%this.page_number;
        this.change_page();
    }

    previous_page(){
        if(this.page_number === 1) return;

        this.page_index = (this.page_index+this.page_number-1)%this.page_number;
        this.change_page();
    }

    update_position() {
        this.group.x = this.game.camera.x;
        this.group.y = this.game.camera.y;
    }

    set_page_number() {
        const list_length = this.all_abilities.length;
        this.page_number = (((list_length - 1)/ELEM_PER_PAGE) | 0) + 1;

        if (this.page_index >= this.page_number) {
            this.page_index = this.page_number - 1;
        }
    }

    change_page() {
        this.set_abilities_list();

        if (this.ability_index >= this.abilities.length) {
            this.ability_index = this.abilities.length - 1;
            this.select_ability(this.ability_index);
        }

        if (this.set_description) {
            this.set_description(this.data.info.abilities_list[this.abilities[this.ability_index]].description);
        }

        this.set_highlight_bar();
        this.base_window.page_indicator.set_highlight(this.page_number, this.page_index);
    }

    change_ability() {
        if (this.set_description) {
            this.set_description(this.data.info.abilities_list[this.abilities[this.ability_index]].description);
        }

        this.set_highlight_bar();
    }

    change_djinni(djinni:Djinn){
        this.djinni = [djinni];

        this.clear_sprites();
        this.base_window.page_indicator.terminante();

        this.mount_window();
        this.set_highlight_bar();
    }

    set_highlight_bar() {
        this.highlight_bar.y = ELEM_PADDING_TOP + this.ability_index * (numbers.ICON_HEIGHT + SPACE_BETWEEN_ITEMS) + 4;
    }

    set_abilities_list() {
        this.clear_sprites(false);
        this.abilities = this.all_abilities.slice(this.page_index * ELEM_PER_PAGE, (this.page_index + 1) * ELEM_PER_PAGE);

        for (let i = 0; i < this.abilities.length; ++i) {
            const key_name = this.abilities[i];
            const x = ELEM_PADDING_LEFT;
            const y = ELEM_PADDING_TOP + i * (numbers.ICON_HEIGHT + SPACE_BETWEEN_ITEMS);

            const icon_x = x + (numbers.ICON_WIDTH >> 1);
            const icon_y = y + (numbers.ICON_HEIGHT >> 1);
            const x_elem_name = ELEM_PADDING_LEFT + numbers.ICON_WIDTH + 2;
            let font_color = numbers.DEFAULT_FONT_COLOR;

            if (this.psy_sealed) {
                font_color = numbers.PURPLE_FONT_COLOR;
            } else if (this.char.current_pp < this.data.info.abilities_list[key_name].pp_cost) {
                font_color = numbers.RED_FONT_COLOR;
            }

            const psynergy_name_sprite = this.base_window.set_text_in_position(this.data.info.abilities_list[key_name].name, x_elem_name, y + ELEM_NAME_ICON_SHIFT, false, false, font_color);
            this.text_sprites_in_window.push(psynergy_name_sprite);

            const pp_sprite = this.base_window.set_text_in_position("PP", PP_X, y + ELEM_NAME_ICON_SHIFT, false, false, font_color);
            this.text_sprites_in_window.push(pp_sprite);

            this.icon_sprites_in_window.push(this.base_window.create_at_group(icon_x, icon_y, "abilities_icons", undefined, key_name));
            this.icon_sprites_in_window[i].anchor.setTo(0.5, 0.5);

            this.misc_sprites_in_window.push(this.base_window.create_at_group(START_X, y + 5, this.data.info.abilities_list[key_name].element + "_star"));
            this.misc_sprites_in_window.push(this.base_window.create_at_group(RANGE_X, y + 4, "ranges", undefined, this.data.info.abilities_list[key_name].range.toString()));

            const psynergy_cost_sprite = this.base_window.set_text_in_position(this.data.info.abilities_list[key_name].pp_cost, PSY_PP_END_X, y + ELEM_NAME_ICON_SHIFT,
                true, false, font_color);
            this.text_sprites_in_window.push(psynergy_cost_sprite);

            if (this.expanded) {
                if (this.gained_abilities.includes(key_name)) {
                    this.base_window.update_text_color(PSY_GAIN_COLOR, psynergy_name_sprite);
                    this.base_window.update_text_color(PSY_GAIN_COLOR, psynergy_cost_sprite);
                    this.base_window.update_text_color(PSY_GAIN_COLOR, pp_sprite);

                } else if (this.lost_abilities.includes(key_name)) {
                    this.base_window.update_text_color(PSY_LOST_COLOR, psynergy_name_sprite);
                    this.base_window.update_text_color(PSY_LOST_COLOR, psynergy_cost_sprite);
                    this.base_window.update_text_color(PSY_LOST_COLOR, pp_sprite);
                }
            }
        }
    }

    set_abilities() {
        this.current_abilities = this.char.abilities.filter(key_name => {
            return key_name in this.data.info.abilities_list && this.data.info.abilities_list[key_name].is_battle_ability;
        });
        this.all_abilities = this.current_abilities;
        if (this.expanded) {
            const preview_values = this.char.preview_djinn_change([], this.djinni.map(d => d.key_name), this.next_djinni_status);
            this.next_abilities = preview_values.abilities.filter(key_name => {
                return key_name in this.data.info.abilities_list && this.data.info.abilities_list[key_name].is_battle_ability;
            });
            let current_set = new Set(this.current_abilities);
            let next_set = new Set(this.next_abilities);
            this.gained_abilities = [...next_set].filter(x => !current_set.has(x));
            this.lost_abilities = [...current_set].filter(x => !next_set.has(x));
            this.intersection_abilities = [...current_set].filter(x => next_set.has(x));
            this.all_abilities = this.gained_abilities.concat(this.intersection_abilities, this.lost_abilities);
            this.psy_info_1_text = this.base_window.set_text_in_position("", PSY_INFO_X, PSY_INFO_1_Y);
            this.psy_info_2_text = this.base_window.set_text_in_position("", PSY_INFO_X, PSY_INFO_2_Y);
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
    }

    mount_window() {
        this.set_abilities();
        this.set_abilities_list();
        this.set_page_number();

        if (this.expanded) {
            this.base_window.update_size({height: BASE_WIN_EXPANDED_HEIGHT});
            this.base_window.update_position({x: BASE_WIN_EXPANDED_X, y: BASE_WIN_EXPANDED_Y});

        } else {
            this.base_window.update_size({height: BASE_WIN_HEIGHT});
            this.base_window.update_position({x: BASE_WIN_X, y: BASE_WIN_Y});
        }

        this.base_window.page_indicator.set_page(this.page_number, this.page_index);
    }

    clear_sprites(clear_psy_gain = true) {
        for (let i = 0; i < this.icon_sprites_in_window.length; ++i) {
            this.base_window.remove_from_group(this.icon_sprites_in_window[i]);
        }

        this.icon_sprites_in_window = [];
        for (let i = 0; i < this.misc_sprites_in_window.length; ++i) {
            this.base_window.remove_from_group(this.misc_sprites_in_window[i]);
        }

        this.misc_sprites_in_window = [];
        for (let i = 0; i < this.text_sprites_in_window.length; ++i) {
            this.base_window.remove_text(this.text_sprites_in_window[i]);
        }

        if (clear_psy_gain) {
            if (this.psy_info_1_text) {
                this.base_window.remove_text(this.psy_info_1_text);
                this.psy_info_1_text = null;
            }
            if (this.psy_info_2_text) {
                this.base_window.remove_text(this.psy_info_2_text);
                this.psy_info_2_text = null;
            }
        }

        this.text_sprites_in_window = [];
    }

    ability_choose(){
        let controls = [
            {key: this.data.gamepad.LEFT, on_down: this.previous_page.bind(this)},
            {key: this.data.gamepad.RIGHT, on_down: this.next_page.bind(this)},
            {key: this.data.gamepad.UP, on_down: this.previous_ability.bind(this)},
            {key: this.data.gamepad.DOWN, on_down: this.next_ability.bind(this)},
            {key: this.data.gamepad.A, on_down: () => {
                if(!this.expanded){
                    this.choosen_ability = this.abilities[this.ability_index];
                    this.hide(this.close_callback);
                }
            }},
            {key: this.data.gamepad.B, on_down: () => {
                if(!this.expanded){
                    this.choosen_ability = null;
                    this.close(this.close_callback);
                }
            }},
        ];

        this.data.control_manager.set_control(controls,{loop_configs: {vertical:true, horizontal:true}});
    }

    open(char, close_callback, set_description, expanded = false, djinn = null, next_djinn_status = null) {
        this.char = char;
        this.close_callback = close_callback;
        this.set_description = set_description;
        this.expanded = expanded;
        this.djinni = [djinn];
        this.next_djinni_status = [next_djinn_status];

        this.psy_sealed = this.char.has_temporary_status(temporary_status.SEAL);
        this.choosen_ability = null;

        this.page_index = 0;
        this.ability_index = 0;
        this.group.alpha = 1;

        this.update_position();
        this.mount_window();
        this.set_highlight_bar();

        if (!this.expanded) {
            this.select_ability(0);
            this.ability_choose();

            this.button.alpha = 1;
            this.highlight_bar.alpha = 1;
        } else {
            this.button.alpha = 0;
            this.highlight_bar.alpha = 0;
        }

        if (this.set_description) {
            this.set_description(this.data.info.abilities_list[this.abilities[this.ability_index]].description);
        }

        this.base_window.show(() => {
            this.window_open = true;
            this.window_active = true;
        }, false);
    }

    show() {
        this.group.alpha = 1;
        this.highlight_bar.alpha = 1;

        this.select_ability(this.ability_index);
        this.ability_choose();

        this.base_window.show(() => {
            this.window_active = true;
        }, false);
    }

    hide(callback?:Function) {
        this.group.alpha = 0;
        this.highlight_bar.alpha = 0;

        this.data.cursor_manager.hide();
        this.base_window.close(() => {
            this.window_active = false;
            if (callback !== undefined) {
                callback(this.choosen_ability);
            }
        }, false);
    }

    close(callback?:Function) {
        this.clear_sprites();
        this.base_window.page_indicator.terminante();

        this.group.alpha = 0;
        this.highlight_bar.alpha = 0;

        this.data.cursor_manager.hide();
        this.data.control_manager.reset();

        this.base_window.close(() => {
            this.window_open = false;
            this.window_active = false;
            if (callback !== undefined) {
                callback(this.choosen_ability);
            }
        }, false);
    }

    destroy() {
        this.base_window.destroy(false);
        this.group.destroy();

        this.data.cursor_manager.hide();
        this.data.control_manager.reset();
    }
}