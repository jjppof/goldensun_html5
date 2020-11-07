import { TextObj, Window } from '../../Window';
import { GoldenSun } from '../../GoldenSun';
import { ItemSlot, MainChar } from '../../MainChar';
import { Item } from '../../Item';
import { MainItemMenu } from '../../main_menus/MainItemMenu';
import { ItemQuantityManagerWindow } from './ItemQuantityManagerWindow';
import { CursorManager, PointVariants } from '../../utils/CursorManager';

const WIN_WIDTH = 132;
const WIN_HEIGHT = 76;
const WIN_X = 104;
const WIN_Y = 26;

const INFO_X = 16;
const QUESTION_Y = 22;
const ANSWER_X = 32;
const YES_Y = 46;
const NO_Y = 62;

const ICON_Y = 4;
const ICON_NAME_X = 32;
const ICON_NAME_Y = 8;

const SUB_ICON_X = 7;
const SUB_ICON_Y = 8;

const CURSOR_X = 114;
const CURSOR_Y1 = 76;
const CURSOR_Y2 = 92;

export class DropItemWindow {
    public game: Phaser.Game;
    public data: GoldenSun;
    public item_menu: MainItemMenu;
    public item_quant_win: ItemQuantityManagerWindow;

    public base_window: Window;
    public item_obj: ItemSlot;
    public item: Item;
    public char: MainChar;

    public window_open: boolean;
    public window_active: boolean;
    public quantity_to_remove: number;
    public answer_index: number;

    public icon_name: TextObj;
    public icon: Phaser.Sprite;
    public item_count_sprite: Phaser.BitmapText;
    public group: Phaser.Group;
    public dropped: boolean;
    public close_callback: Function;
    public open_callback: Function;

    constructor(game:Phaser.Game, data:GoldenSun) {
        this.game = game;
        this.data = data;
        this.item_menu = null;
        this.item_quant_win = null;

        this.base_window = new Window(this.game, WIN_X, WIN_Y, WIN_WIDTH, WIN_HEIGHT);
        this.item_obj = null;
        this.item = null;
        this.char = null;

        this.window_open = false;
        this.window_active = false;
        this.quantity_to_remove = 0;
        this.answer_index = 0;

        this.base_window.set_text(["Are you sure you", "want to drop it?"], INFO_X, QUESTION_Y, 1);
        this.base_window.set_text_in_position("Yes", ANSWER_X, YES_Y);
        this.base_window.set_text_in_position("No", ANSWER_X, NO_Y);

        this.icon_name = this.base_window.set_text_in_position("", ICON_NAME_X, ICON_NAME_Y);
        this.icon = null;
        this.item_count_sprite = null;

        this.group = this.game.add.group();
        this.dropped = false;
    }

    change_answer(){
        if(this.answer_index === YES_Y) this.set_answer_index(NO_Y);
        else this.set_answer_index(YES_Y);
    }

    set_answer_index(index:number) {
        this.answer_index = index;

        let cursor_x = CURSOR_X;
        let cursor_y = (index === YES_Y ? CURSOR_Y1 : CURSOR_Y2);

        let tween_config = {type: CursorManager.CursorTweens.POINT, variant: PointVariants.NORMAL};
        this.data.cursor_manager.move_to({x: cursor_x, y: cursor_y}, {animate: false, tween_config: tween_config});
    }

    update_position() {
        this.group.x = this.game.camera.x + WIN_X;
        this.group.y = this.game.camera.y + WIN_Y;
    }

    set_info() {
        this.base_window.update_text(this.item.name, this.icon_name);
        this.icon = this.base_window.create_at_group(INFO_X, ICON_Y, "items_icons", undefined, this.item.key_name);
        if (this.quantity_to_remove > 1) {
            this.item_count_sprite = this.game.add.bitmapText(INFO_X + SUB_ICON_X, ICON_Y + SUB_ICON_Y, 'gs-item-bmp-font', this.quantity_to_remove.toString());
            this.base_window.add_sprite_to_group(this.item_count_sprite);
        }
    }

    unset_info() {
        this.base_window.remove_from_group(this.icon);
        if (this.item_count_sprite) {
            this.base_window.remove_from_group(this.item_count_sprite);
        }
    }

    on_drop() {
        if (this.answer_index === YES_Y) {
            this.char.remove_item(this.item_obj, this.quantity_to_remove);
            this.dropped = true;
        }
        this.close();
    }

    on_quantity_select(){
        this.quantity_to_remove = this.item_quant_win.window_open ? this.item_quant_win.choosen_quantity : this.item_obj.quantity;
        
        this.set_answer_index(YES_Y);
        this.base_window.show(() => {
            this.window_open = true;
            this.window_active = true;
            if (this.open_callback !== undefined) {
                this.open_callback();
            }
        }, false);

        let controls = [
            {key: this.data.gamepad.UP, on_down: this.change_answer.bind(this)},
            {key: this.data.gamepad.DOWN, on_down: this.change_answer.bind(this)},
            {key: this.data.gamepad.A, on_down: this.on_drop.bind(this)},
            {key: this.data.gamepad.B, on_down: this.close.bind(this)},
        ];
        this.data.control_manager.set_control(controls, {loop_configs:{vertical:true}});

    }

    on_item_select(){
        if (this.item_obj.quantity > 1) {
            this.item_quant_win.open(this.item_obj, this.item, this.char);
            this.item_quant_win.grant_control(this.close.bind(this), this.on_quantity_select.bind(this));
        } 
        else this.on_quantity_select();
    }

    open(item_obj:ItemSlot, item:Item, char:MainChar, item_menu:MainItemMenu,
        close_callback?:Function, open_callback?:Function) {
        this.item_obj = item_obj;
        this.item = item;
        this.char = char;
        this.item_menu = item_menu;
        this.close_callback = close_callback;
        this.open_callback = open_callback;

        this.quantity_to_remove = 0;
        this.item_quant_win = this.item_menu.item_options_window.item_quantity_manager_window;
        this.answer_index = 0;
        this.dropped = false;

        this.set_info();
        this.update_position();
        this.on_item_select();
    }

    close() {
        this.unset_info();
        if(this.item_quant_win.window_open) this.item_quant_win.close();
        this.base_window.close(() => {
            this.window_open = false;
            this.window_active = false;
            if (this.close_callback !== undefined) {
                this.close_callback();
            }
        }, false);
    }
}