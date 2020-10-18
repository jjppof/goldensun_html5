import { TextObj, Window } from '../../Window';
import * as numbers from '../../magic_numbers';
import { GoldenSun } from '../../GoldenSun';
import { ItemSlot, MainChar } from '../../MainChar';
import { Item } from '../../Item';
import { ItemQuantityManagerWindow } from './ItemQuantityManagerWindow';
import { MainItemMenu } from '../../main_menus/MainItemMenu';

const WIN_WIDTH = 132;
const WIN_HEIGHT = 36;
const WIN_X = 104;
const WIN_Y = 0;

const CHAR_NAME_X = 27;
const CHAR_NAME_Y = 8;
const ITEM_NAME_X = 27;
const ITEM_NAME_Y = CHAR_NAME_Y + numbers.FONT_SIZE;

const ACTION_TEXT_X = 8;
const ACTION_TEXT_Y = ITEM_NAME_Y + numbers.FONT_SIZE;

const ITEM_ICON_X = 8;
const ITEM_ICON_Y = 8;
const SUB_ICON_X = 7;
const SUB_ICON_Y = 8;

const ANSWER_X = 112;
const YES_Y = 8;
const NO_Y = 24;

const CURSOR_X = 194;
const CURSOR_Y1 = 12;
const CURSOR_Y2 = 28;

const ITEM_COUNTER_LOOP_TIME = 100;

export class GiveItemWindow {
    public game: Phaser.Game;
    public data: GoldenSun;
    public close_callback: Function;
    public item_menu: MainItemMenu;

    public item_obj: ItemSlot;
    public item: Item;
    public char: MainChar;
    public answer_index: number;

    public window_open: boolean;
    public window_active: boolean;
    public choosing_char: boolean;
    public asking_for_equip: boolean;

    public base_window: Window;
    public item_quantity_manager_window: ItemQuantityManagerWindow;
    public group: Phaser.Group;

    public action_text: TextObj;
    public yes_text: TextObj;
    public no_text: TextObj;

    public icon_sprite: Phaser.Sprite;
    public char_name: TextObj;
    public item_name: TextObj;
    public equip_sprite: Phaser.Sprite;
    public item_count_sprite: Phaser.BitmapText;

    constructor(game:Phaser.Game, data:GoldenSun) {
        this.game = game;
        this.data = data;
        this.close_callback = null;
        this.item_menu = null;

        this.item_obj = null;
        this.item = null;
        this.char = null;
        this.answer_index = 0;

        this.window_open = false;
        this.window_active = false;
        this.choosing_char = false;
        this.asking_for_equip = false;

        this.base_window = new Window(this.game, WIN_X, WIN_Y, WIN_WIDTH, WIN_HEIGHT);
        this.item_quantity_manager_window = null;
        this.group = this.game.add.group();

        this.char_name = this.base_window.set_text_in_position("", CHAR_NAME_X, CHAR_NAME_Y);
        this.item_name = this.base_window.set_text_in_position("", ITEM_NAME_X, ITEM_NAME_Y);
        this.action_text = this.base_window.set_text_in_position("", ACTION_TEXT_X, ACTION_TEXT_Y);

        this.yes_text = this.base_window.set_text_in_position("Yes", ANSWER_X, YES_Y);
        this.no_text = this.base_window.set_text_in_position("No", ANSWER_X, NO_Y);
        this.yes_text.text.alpha = this.no_text.text.alpha = 0;
        this.yes_text.shadow.alpha = this.no_text.shadow.alpha = 0;

        this.icon_sprite = null;
        this.equip_sprite = null;
        this.item_count_sprite = null;
    }

    change_answer(){
        if(this.answer_index === YES_Y) this.set_answer_index(NO_Y);
        else this.set_answer_index(YES_Y);
    }

    set_answer_index(index:number) {
        this.answer_index = index;
        this.data.cursor_manager.move_to(CURSOR_X, (index === YES_Y ? CURSOR_Y1 : CURSOR_Y2), "point", false);
    }

    update_position() {
        this.group.x = this.game.camera.x + WIN_X;
        this.group.y = this.game.camera.y + WIN_Y;
    }

    set_header() {
        this.unset_header();
        this.icon_sprite = this.base_window.create_at_group(ITEM_ICON_X, ITEM_ICON_Y, "items_icons", undefined, this.item.key_name);
        this.base_window.update_text(this.char.name, this.char_name, CHAR_NAME_X, CHAR_NAME_Y);
        this.base_window.update_text(this.item.name, this.item_name, ITEM_NAME_X, ITEM_NAME_Y);
        if (this.choosing_char) {
            this.base_window.update_text("Give it to whom?", this.action_text, ITEM_NAME_X, ACTION_TEXT_Y);
        } else if (this.asking_for_equip) {
            this.yes_text.text.alpha = this.no_text.text.alpha = 1;
            this.yes_text.shadow.alpha = this.no_text.shadow.alpha = 1;
            this.base_window.update_text("Equip this item?", this.action_text, ACTION_TEXT_X, ACTION_TEXT_Y);
        }
        this.equip_sprite = null;
        if (this.item_obj.equipped) {
            this.equip_sprite = this.base_window.create_at_group(ITEM_ICON_X + SUB_ICON_X, ITEM_ICON_Y + SUB_ICON_Y, "equipped");
        }
        this.item_count_sprite = null;
        if (this.item_obj.quantity > 1) {
            this.item_count_sprite = this.game.add.bitmapText(ITEM_ICON_X + SUB_ICON_X, ITEM_ICON_Y + SUB_ICON_Y, 'gs-item-bmp-font', this.item_obj.quantity.toString());
            this.base_window.add_sprite_to_group(this.item_count_sprite);
        }
    }

    unset_header() {
        this.base_window.remove_from_group(this.icon_sprite);
        this.base_window.update_text("", this.char_name, CHAR_NAME_X, CHAR_NAME_Y);
        this.base_window.update_text("", this.item_name, ITEM_NAME_X, ITEM_NAME_Y);
        this.base_window.update_text("", this.action_text, ACTION_TEXT_X, ACTION_TEXT_Y);
        this.yes_text.text.alpha = this.no_text.text.alpha = 0;
        this.yes_text.shadow.alpha = this.no_text.shadow.alpha = 0;
        if (this.equip_sprite) {
            this.base_window.remove_from_group(this.equip_sprite);
        }
        if (this.item_count_sprite) {
            this.base_window.remove_from_group(this.item_count_sprite);
        }
    }

    on_give(equip?:boolean){
        if(!equip) equip = this.answer_index === YES_Y ? true : false;

        let chars_menu = this.item_menu.chars_menu;
        let dest_char = chars_menu.lines[chars_menu.current_line][chars_menu.selected_index];
        let dest_item_obj = {
            key_name: this.item_obj.key_name,
            equipped: equip,
            quantity: (this.item_quantity_manager_window.window_open ? this.item_quantity_manager_window.choosen_quantity : this.item_obj.quantity),
        };

        if(this.item_quantity_manager_window.window_open) this.item_quantity_manager_window.close();

        this.char.remove_item(this.item_obj, dest_item_obj.quantity);
        dest_char.add_item(dest_item_obj.key_name, dest_item_obj.quantity, equip);

        this.base_window.update_text("", this.action_text, ACTION_TEXT_X, ACTION_TEXT_Y);
        this.yes_text.text.alpha = this.no_text.text.alpha = 0;
        this.yes_text.shadow.alpha = this.no_text.shadow.alpha = 0;

        this.item_menu.item_options_window.open_action_message_window("Given.", () => {
            this.item_menu.item_options_window.close(this.item_menu.item_options_window.close_callback);
            this.close();
        });
    }

    on_character_select(){
        this.choosing_char = false;
        this.item_menu.choosing_give_destination = false;

        let chars_menu = this.item_menu.chars_menu;
        let dest_char = chars_menu.lines[chars_menu.current_line][chars_menu.selected_index];
        this.asking_for_equip = this.item.equipable_chars.includes(dest_char.key_name);

        if(this.asking_for_equip){
            this.set_header();
            this.set_answer_index(YES_Y);
            this.data.control_manager.set_control({
                up: this.change_answer.bind(this),
                down: this.change_answer.bind(this),
                esc: this.on_give.bind(this, false),
                enter: this.on_give.bind(this)
            },{vertical_loop:true});
        }
        else{
            if (this.item_obj.quantity > 1) {
                let dest_char = chars_menu.lines[chars_menu.current_line][chars_menu.selected_index];
      
                this.item_quantity_manager_window.open(this.item_obj, this.item, this.char, undefined, dest_char);
                this.item_quantity_manager_window.grant_control(() => {
                    this.item_quantity_manager_window.close();
                    this.choosing_character();
                }, this.on_give.bind(this));
            } 
            else this.on_give(false);
        }
    }

    choosing_character(){
        this.choosing_char = true;
        this.set_header();

        this.item_menu.choosing_give_destination = true;
        this.item_menu.chars_menu.select_char(this.item_menu.chars_menu.selected_index);
        this.item_menu.chars_menu.grant_control(this.close.bind(this), this.on_character_select.bind(this));

        this.item_menu.item_overview_window.show(undefined, false);
        this.item_menu.shift_item_overview(true);
    }

    open(item_obj:ItemSlot, item:Item, char:MainChar, item_menu:MainItemMenu,
        close_callback?:Function, open_callback?:Function) {
        this.item_obj = item_obj;
        this.item = item;
        this.char = char;

        this.choosing_char = false;
        this.asking_for_equip = false;
        this.item_menu = item_menu;
        this.item_quantity_manager_window = this.item_menu.item_quant_win;

        this.answer_index = 0;
        if (this.asking_for_equip) {
            this.set_answer_index(YES_Y);
        }
        this.set_header();
        this.update_position();
        this.close_callback = close_callback;
        this.base_window.show(() => {
            this.window_open = true;
            this.window_active = true;
            if (open_callback) {
                open_callback();
            }
        }, false);

        this.choosing_character();
    }

    close() {
        this.data.cursor_manager.hide();
        this.unset_header();
        this.base_window.close(() => {
            this.window_open = false;
            this.window_active = false;
            if (this.close_callback) {
                this.close_callback();
            }
        }, false);
    }

    active() {
        this.window_active = true;
        this.data.cursor_manager.hide();
    }

    deactive() {
        this.window_active = false;
        this.data.cursor_manager.hide();
    }
}