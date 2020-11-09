import { TextObj, Window } from "../../Window";
import * as numbers from "../../magic_numbers"
import { Djinn } from "../../Djinn";
import { SummonDjinnStandbyWindow } from "./SummonDjinnStandbyWindow";
import { Battle } from "../../battle/Battle";
import { MainChar } from "../../MainChar";
import { GoldenSun } from "../../GoldenSun";
import * as _ from "lodash";
import { CursorManager, PointVariants } from "../../utils/CursorManager";

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

export class BattleSummonWindow {
    public game: Phaser.Game;
    public data: GoldenSun;

    public base_window: Window;
    public djinn_numbers_window: SummonDjinnStandbyWindow;
    public group: Phaser.Group;

    public button: Phaser.Sprite;
    public highlight_bar: Phaser.Graphics;

    public summon_names: TextObj[];
    public other_sprites: (Phaser.Sprite|Phaser.Group|Phaser.BitmapText)[];

    public window_open: boolean;
    public window_active: boolean;
    public close_callback: Function;
    public set_description: Function;

    public summon_index: number;
    public page_index: number;
    public page_number: number;

    public choosen_ability: string;
    public summons: any[];
    public all_summons: any[];
    public char: MainChar;
    public djinni_already_used: {[element: string]: number};

    constructor(game:Phaser.Game, data:GoldenSun) {
        this.game = game;
        this.data = data;

        this.base_window = new Window(this.game, BASE_WINDOW_X, BASE_WINDOW_Y, BASE_WINDOW_WIDTH, BASE_WINDOW_HEIGHT);
        this.base_window.page_indicator.initialize();
        this.djinn_numbers_window = new SummonDjinnStandbyWindow(game);
        this.group = this.game.add.group();
        this.group.alpha = 0;

        this.button = this.group.create(BUTTON_X, BUTTON_Y, "buttons", "summon");
        this.highlight_bar = this.game.add.graphics(0, 0);
        this.highlight_bar.blendMode = PIXI.blendModes.SCREEN;
        this.highlight_bar.alpha = 0;

        this.base_window.add_sprite_to_group(this.highlight_bar);
        this.highlight_bar.beginFill(this.base_window.color, 1);
        this.highlight_bar.drawRect(HIGHLIGHT_BAR_X, 0, HIGHLIGHT_BAR_WIDTH, HIGHLIGHT_BAR_HEIGHT);
        this.highlight_bar.endFill();

        this.summon_names = [];
        this.other_sprites = [];
    }

    select_summon(index:number){
        this.summon_index = index;
        
        let cursor_x = CURSOR_X;
        let cursor_y = CURSOR_Y + this.summon_index*CURSOR_SHIFT;
        
        let tween_config = {type: CursorManager.CursorTweens.POINT, variant: PointVariants.NORMAL};
        this.data.cursor_manager.move_to({x: cursor_x, y: cursor_y}, {animate: false, tween_config: tween_config});
        this.change_summon();
    }

    next_summon(){
        if(this.summons.length === 1) return;
        this.select_summon((this.summon_index+1)%this.summons.length);
    }

    previous_summon(){
        if(this.summons.length === 1) return;
        this.select_summon((this.summon_index+this.summons.length-1)%this.summons.length);
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

    change_page() {
        this.config_page();

        if (this.summon_index >= this.summons.length) {
            this.summon_index = this.summons.length - 1;
            this.select_summon(this.summon_index);
        }

        if (this.set_description) {
            this.set_description(this.data.info.abilities_list[this.summons[this.summon_index].key_name].description);
        }

        this.set_highlight_bar();
        this.base_window.page_indicator.set_highlight(this.page_number, this.page_index);
        this.djinn_numbers_window.set_numbers(this.summons[this.summon_index].requirements);
    }

    change_summon() {
        if (this.set_description) {
            this.set_description(this.data.info.abilities_list[this.summons[this.summon_index].key_name].description);
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
            const ability = this.data.info.abilities_list[this.summons[i].key_name];
            const base_y = TOP_PADDING + i * (SPACE_BETWEEN_ITEMS + HIGHLIGHT_BAR_HEIGHT);
            const summon_y = base_y - 3;

            this.other_sprites.push(this.base_window.create_at_group(SUMMON_ICON_X, summon_y, "abilities_icons", undefined, this.summons[i].key_name));
            let color = numbers.DEFAULT_FONT_COLOR;
            if (!this.summons[i].can_be_summoned) {
                color = numbers.RED_FONT_COLOR;
            }

            const name = this.base_window.set_text_in_position(ability.name, SUMMON_NAME_X, base_y, false, false, color);
            this.summon_names.push(name);
        }
    }

    set_page_number() {
        const list_length = this.all_summons.length;
        this.page_number = (((list_length - 1)/ELEM_PER_PAGE) | 0) + 1;

        if (this.page_index >= this.page_number) {
            this.page_index = this.page_number - 1;
        }
    }

    mount_window() {
        const standby_djinni = Djinn.get_standby_djinni(this.data.info.djinni_list, MainChar.get_active_players(this.data.info.party_data, Battle.MAX_CHARS_IN_BATTLE));
        for (let elem in standby_djinni) {
            standby_djinni[elem] -= this.djinni_already_used[elem];
        }

        this.all_summons = _.flatMap(this.data.info.summons_list, summon => {
            if (!summon.available) return [];
            const can_be_summoned = _.every(summon.requirements, (value, elem) => value <= standby_djinni[elem]);
            return [Object.assign({}, summon, {
                can_be_summoned: can_be_summoned,
                index: can_be_summoned ? -summon.index : summon.index
            })];
        });

        this.all_summons = _.sortBy(this.all_summons, [summon => {
            return summon.index;
        }]);

        this.set_page_number();
        this.base_window.page_indicator.set_page(this.page_number, this.page_index);
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

    summon_choose(){
        let controls = [
            {key: this.data.gamepad.LEFT, on_down: this.previous_page.bind(this)},
            {key: this.data.gamepad.RIGHT, on_down: this.next_page.bind(this)},
            {key: this.data.gamepad.UP, on_down: this.previous_summon.bind(this)},
            {key: this.data.gamepad.DOWN, on_down: this.next_summon.bind(this)},
            {key: this.data.gamepad.A, on_down: () => {
                this.choosen_ability = this.summons[this.summon_index].key_name;
                this.hide(this.close_callback);
            }},
            {key: this.data.gamepad.B, on_down: () => {
                this.choosen_ability = null;
                this.close(this.close_callback);
            }},
        ];
        
        this.data.control_manager.set_control(controls, {loop_configs:{vertical:true, horizontal:true}});
    }

    open(char:MainChar, close_callback:Function, set_description:Function, djinni_already_used?:{[element: string]: number}) {
        this.char = char;
        this.close_callback = close_callback;
        this.set_description = set_description;
        this.djinni_already_used = djinni_already_used;
        
        this.summon_index = 0;
        this.page_index = 0;
        this.choosen_ability = null;

        this.highlight_bar.alpha = 1;
        this.group.alpha = 1;
        this.djinn_numbers_window.open();

        this.update_position();
        this.set_highlight_bar();
        this.mount_window();

        this.djinn_numbers_window.set_numbers(this.summons[this.summon_index].requirements);
        this.select_summon(0);
        this.summon_choose();

        if (this.set_description) {
            this.set_description(this.data.info.abilities_list[this.summons[this.summon_index].key_name].description);
        }
        this.base_window.show(() => {
            this.window_open = true;
            this.window_active = true;
        }, false);
    }

    show() {
        this.group.alpha = 1;
        this.highlight_bar.alpha = 1;

        this.djinn_numbers_window.open();
        this.djinn_numbers_window.set_numbers(this.summons[this.summon_index].requirements);
        this.select_summon(this.summon_index);
        this.summon_choose();

        this.base_window.show(() => {
            this.window_active = true;
        }, false);
    }

    hide(callback?:Function) {
        this.group.alpha = 0;
        this.highlight_bar.alpha = 0;
        this.data.cursor_manager.hide();

        this.djinn_numbers_window.close();
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
        this.base_window.destroy(false);
        this.group.destroy();
        this.djinn_numbers_window.destroy();

        this.data.cursor_manager.hide();
        this.data.control_manager.reset();
    }
}