import {Window, TextObj} from "../Window";
import * as numbers from "../magic_numbers";
import {GoldenSun} from "../GoldenSun";
import {ItemSlot, MainChar} from "../MainChar";
import {PageIndicator} from "../support_menus/PageIndicator";
import {CursorManager, PointVariants} from "../utils/CursorManager";

const PSY_OVERVIEW_WIN_X = 104;
const PSY_OVERVIEW_WIN_Y = 24;
const PSY_OVERVIEW_WIN_WIDTH = 132;
const PSY_OVERVIEW_WIN_HEIGHT = 108;

const SPACE_BETWEEN_ITEMS = 1;
const ELEM_NAME_ICON_SHIFT = 4;

const ELEM_PADDING_TOP = 12;
const ELEM_PADDING_LEFT = 8;
const ELEM_PER_PAGE = 5;

const PSY_PP_X = 125;
const PSY_PP_COST_X = 102;
const PSY_PP_COST_Y = 8;

const HIGHLIGHT_WIDTH = 114;
const HIGHLIGHT_HEIGHT = numbers.FONT_SIZE;

const SUB_ICON_X = 0;
const SUB_ICON_Y = 0;

const CURSOR_X = 98;
const CURSOR_Y = 42;
const CURSOR_GAP = 16;

const HORIZONTAL_LOOP_TIME = 300;
const SHOULDER_LOOP_TIME = 200;

/*Displays the character's Psynergy or Items
Used in a selection-type menu, referring to the above

Input: game [Phaser:Game] - Reference to the running game object
       data [GoldenSun] - Reference to the main JS Class instance
       is_psynergy_window [boolean] - Whether this window shows psynergy or items
       on_choose [function] - Callback executed on "Choose" option
       on_change [function] - Callback executed on a "Change" event
       esc_propagation_priority [number] - Counts parent-child status for ESC key (Cancel/Back)
       enter_propagation_priority [number] - Counts parent-child status for Enter key (Choose/Select)*/
export class ItemPsynergyChooseWindow {
    public game: Phaser.Game;
    public data: GoldenSun;
    public is_psynergy_window: boolean;
    public on_change: Function;

    public element_list: any;
    public element_sprite_key: string;

    public window: Window;
    public group: Phaser.Group;

    public window_open: boolean;
    public window_activated: boolean;
    public close_callback: Function;
    public char: MainChar;
    public char_select_controls_sprites: (Phaser.Sprite | Phaser.BitmapText)[];

    public page_index: number;
    public page_number: number;
    public text_sprites_in_window: TextObj[];
    public icon_sprites_in_window: (Phaser.Sprite | Phaser.Group)[];
    public selected_element_index: number;
    public elements: string[] | ItemSlot[];
    public selected_element_tween: Phaser.Tween;

    public highlight_bar: Phaser.Graphics;
    public char_index: number;
    public item_objs: ItemSlot[];

    constructor(game: Phaser.Game, data: GoldenSun, is_psynergy_window: boolean, on_change: Function) {
        this.game = game;
        this.data = data;
        this.is_psynergy_window = is_psynergy_window;
        this.on_change = on_change === undefined ? () => {} : on_change;

        this.element_list = this.is_psynergy_window ? this.data.info.abilities_list : this.data.info.items_list;
        this.element_sprite_key = this.is_psynergy_window ? "abilities_icons" : "items_icons";

        this.window = new Window(
            this.game,
            PSY_OVERVIEW_WIN_X,
            PSY_OVERVIEW_WIN_Y,
            PSY_OVERVIEW_WIN_WIDTH,
            PSY_OVERVIEW_WIN_HEIGHT
        );
        this.group = game.add.group();
        this.group.alpha = 0;

        this.window_open = false;
        this.window_activated = false;
        this.close_callback = undefined;
        this.char = null;
        this.char_select_controls_sprites = [
            this.window.create_at_group(9, 97, "shift_keyboard", 0x0),
            this.window.create_at_group(8, 96, "shift_keyboard"),
            this.window.create_at_group(32, 97, "tab_keyboard", 0x0),
            this.window.create_at_group(31, 96, "tab_keyboard"),
        ];
        const sprite_pair = this.window.set_text_in_position(": Change Char", 49, 96);
        this.char_select_controls_sprites.push(sprite_pair.text, sprite_pair.shadow);

        this.page_index = 0;
        this.page_number = 0;

        this.text_sprites_in_window = [];
        this.icon_sprites_in_window = [];

        this.selected_element_index = 0;
        this.elements = [];
        this.selected_element_tween = null;

        this.highlight_bar = this.game.add.graphics(0, 0);
        this.highlight_bar.blendMode = PIXI.blendModes.SCREEN;
        this.window.add_sprite_to_group(this.highlight_bar);

        this.highlight_bar.beginFill(this.window.color, 1);
        this.highlight_bar.drawRect(
            ELEM_PADDING_LEFT + (numbers.ICON_WIDTH >> 1),
            0,
            HIGHLIGHT_WIDTH,
            HIGHLIGHT_HEIGHT
        );
        this.highlight_bar.endFill();

        if (this.is_psynergy_window) {
            this.window.set_text_in_position("PP", PSY_PP_COST_X, PSY_PP_COST_Y);
        }
    }

    next_page() {
        if (this.page_number === 1) return;

        if (this.page_index < this.page_number - 1) this.page_change(this.page_index + 1);
        else this.page_change(0);
    }

    previous_page() {
        if (this.page_number === 1) return;

        if (this.page_index > 0) this.page_change(this.page_index - 1);
        else this.page_change(this.page_number - 1);
    }

    next_element() {
        if (this.elements.length === 1) return;

        if (this.selected_element_index < this.elements.length - 1)
            this.element_change(this.selected_element_index + 1);
        else this.element_change(0);
    }

    previous_element() {
        if (this.elements.length === 1) return;

        if (this.selected_element_index > 0) this.element_change(this.selected_element_index - 1);
        else this.element_change(this.elements.length - 1);
    }

    /*Returns the name of the Psynergy/Item

    Input: index [number] : The element's index

    Output: [string]*/
    get_element_key_name(index: number) {
        return this.is_psynergy_window ? this.elements[index] : (this.elements[index] as ItemSlot).key_name;
    }

    /*Sets the total page number*/
    set_page_number() {
        let list_length: number;
        if (this.is_psynergy_window) {
            list_length = this.char.abilities.filter(elem_key_name => {
                return (
                    elem_key_name in this.element_list &&
                    (this.element_list[elem_key_name].is_field_psynergy ||
                        this.element_list[elem_key_name].effects_outside_battle)
                );
            }).length;
        } else {
            list_length = this.char.items.filter(item_obj => {
                return item_obj.key_name in this.element_list;
            }).length;
        }
        this.page_number = (((list_length - 1) / ELEM_PER_PAGE) | 0) + 1;
        if (this.page_index >= this.page_number) {
            this.page_index = this.page_number - 1;
        }

        this.window.page_indicator.initialize(this.page_number, this.page_index);
    }

    /*Updates this window's position*/
    update_position() {
        this.group.x = this.game.camera.x + PSY_OVERVIEW_WIN_X;
        this.group.y = this.game.camera.y + PSY_OVERVIEW_WIN_Y;
    }

    /*Adds the items/psynergies to the window*/
    set_elements() {
        this.clear_sprites();
        this.item_objs = [];
        if (this.is_psynergy_window) {
            this.elements = this.char.abilities
                .filter(elem_key_name => {
                    return (
                        elem_key_name in this.element_list &&
                        (this.element_list[elem_key_name].is_field_psynergy ||
                            this.element_list[elem_key_name].effects_outside_battle)
                    );
                })
                .slice(this.page_index * ELEM_PER_PAGE, (this.page_index + 1) * ELEM_PER_PAGE);
        } else {
            this.elements = this.char.items
                .filter(item_obj => {
                    if (item_obj.key_name in this.element_list) {
                        this.item_objs.push(item_obj);
                        return true;
                    }
                    return false;
                })
                .slice(this.page_index * ELEM_PER_PAGE, (this.page_index + 1) * ELEM_PER_PAGE);
            this.item_objs = this.item_objs.slice(
                this.page_index * ELEM_PER_PAGE,
                (this.page_index + 1) * ELEM_PER_PAGE
            );
        }
        if (this.selected_element_index >= this.elements.length) {
            this.selected_element_index = this.elements.length - 1;
            this.move_cursor(CURSOR_X, CURSOR_Y + this.selected_element_index * CURSOR_GAP);
        }
        for (let i = 0; i < this.elements.length; ++i) {
            const elem_key_name = this.get_element_key_name(i);
            const x = ELEM_PADDING_LEFT;
            const y = ELEM_PADDING_TOP + i * (numbers.ICON_HEIGHT + SPACE_BETWEEN_ITEMS);

            const icon_x = x + (numbers.ICON_WIDTH >> 1);
            const icon_y = y + (numbers.ICON_HEIGHT >> 1);

            const x_elem_name = ELEM_PADDING_LEFT + numbers.ICON_WIDTH + (this.is_psynergy_window ? 2 : 4);
            this.text_sprites_in_window.push(
                this.window.set_text_in_position(
                    this.element_list[elem_key_name as string].name,
                    x_elem_name,
                    y + ELEM_NAME_ICON_SHIFT
                )
            );

            if (this.is_psynergy_window) {
                this.icon_sprites_in_window.push(
                    this.window.create_at_group(icon_x, icon_y, this.element_sprite_key, undefined, elem_key_name)
                );
                (this.icon_sprites_in_window[i] as Phaser.Sprite).anchor.setTo(0.5, 0.5);
            } else {
                let icon_group = this.game.add.group();
                let icon_sprite = icon_group.create(0, 0, this.element_sprite_key, elem_key_name as string);

                icon_sprite.anchor.setTo(0.5, 0.5);
                if (this.item_objs[i].equipped) {
                    icon_group.create(SUB_ICON_X, SUB_ICON_Y, "equipped");
                }

                if (this.item_objs[i].quantity > 1) {
                    let item_count = this.game.add.bitmapText(
                        SUB_ICON_X,
                        SUB_ICON_Y,
                        "gs-item-bmp-font",
                        this.item_objs[i].quantity.toString()
                    );
                    icon_group.add(item_count);
                }

                this.window.add_sprite_to_group(icon_group);
                icon_group.x = icon_x;
                icon_group.y = icon_y;
                this.icon_sprites_in_window.push(icon_group);
            }
            if (this.is_psynergy_window) {
                const x_elem_pp_cost = PSY_PP_X;
                this.text_sprites_in_window.push(
                    this.window.set_text_in_position(
                        this.element_list[elem_key_name as string].pp_cost,
                        x_elem_pp_cost,
                        y + ELEM_NAME_ICON_SHIFT,
                        true
                    )
                );
            }
        }
    }

    /*Shows and positions the highlight bar*/
    set_highlight_bar() {
        this.highlight_bar.alpha = 1;
        this.highlight_bar.y =
            ELEM_PADDING_TOP + this.selected_element_index * (numbers.ICON_HEIGHT + SPACE_BETWEEN_ITEMS) + 4;
    }

    /*Hides the highlight bar*/
    unset_highlight_bar() {
        this.highlight_bar.alpha = 0;
    }

    /*Sets the scaling effect for the selected item*/
    set_element_tween(index: number) {
        this.selected_element_tween = this.game.add
            .tween(this.icon_sprites_in_window[index].scale)
            .to({x: 1.6, y: 1.6}, Phaser.Timer.QUARTER, Phaser.Easing.Linear.None, true, 0, -1, true);
    }

    /*Stops the scaling effect*/
    unset_element_tween(index: number) {
        if (this.icon_sprites_in_window[index]) this.icon_sprites_in_window[index].scale.setTo(1, 1);

        if (this.selected_element_tween) {
            this.selected_element_tween.stop();
            this.selected_element_tween = null;
        }
    }

    /*Selects a new element
    
    Input: before_index [number] - Previous element
           after_index [number] - Next element*/
    element_change(index: number) {
        this.unset_element_tween(this.selected_element_index);
        this.selected_element_index = index;
        this.set_element_tween(this.selected_element_index);

        this.set_highlight_bar();
        this.on_change(
            this.element_list[this.get_element_key_name(index) as string],
            this.is_psynergy_window ? undefined : this.item_objs[index]
        );
        this.move_cursor(CURSOR_X, CURSOR_Y + this.selected_element_index * CURSOR_GAP);
    }

    /*Displays a new page*/
    page_change(page: number) {
        this.page_index = page;
        this.set_elements();
        this.set_element_tween(this.selected_element_index);
        this.set_highlight_bar();

        this.on_change(
            this.element_list[this.get_element_key_name(this.selected_element_index) as string],
            this.is_psynergy_window ? undefined : this.item_objs[this.selected_element_index]
        );
        this.window.page_indicator.select_page(this.page_index);
    }

    /*Removes all sprites from this window*/
    clear_sprites() {
        for (let i = 0; i < this.icon_sprites_in_window.length; ++i) {
            this.window.remove_from_group(this.icon_sprites_in_window[i]);
        }
        this.icon_sprites_in_window = [];
        for (let i = 0; i < this.text_sprites_in_window.length; ++i) {
            this.window.remove_text(this.text_sprites_in_window[i]);
        }
        this.text_sprites_in_window = [];
    }

    /*Enables control keys for this menu*/
    grant_control(on_cancel: Function, on_select: Function, next_char?: Function, previous_char?: Function) {
        let controls = [
            {key: this.data.gamepad.LEFT, on_down: this.previous_page.bind(this), sfx: {down: "menu/move"}},
            {key: this.data.gamepad.RIGHT, on_down: this.next_page.bind(this), sfx: {down: "menu/move"}},
            {key: this.data.gamepad.UP, on_down: this.previous_element.bind(this), sfx: {down: "menu/move"}},
            {key: this.data.gamepad.DOWN, on_down: this.next_element.bind(this), sfx: {down: "menu/move"}},
            {key: this.data.gamepad.A, on_down: on_select, sfx: {down: "menu/positive"}},
            {key: this.data.gamepad.B, on_down: on_cancel, sfx: {down: "menu/negative"}},
            {key: this.data.gamepad.L, on_down: previous_char, sfx: {down: "menu/positive"}},
            {key: this.data.gamepad.R, on_down: next_char, sfx: {down: "menu/positive"}},
        ];

        this.data.control_manager.set_control(controls, {
            loop_configs: {
                vertical: true,
                horizontal: true,
                shoulder: true,
                horizontal_time: HORIZONTAL_LOOP_TIME,
                shoulder_time: SHOULDER_LOOP_TIME,
            },
        });
    }

    move_cursor(x_pos: number, y_pos: number, on_complete?: Function) {
        let tween_config = {
            type: CursorManager.CursorTweens.POINT,
            variant: PointVariants.NORMAL,
        };
        this.data.cursor_manager.move_to(
            {x: x_pos, y: y_pos},
            {animate: false, tween_config: tween_config},
            on_complete
        );
    }

    /*Hides this window*/
    hide() {
        this.window.group.alpha = 0;
    }

    /*Shows this window*/
    show() {
        this.window.group.alpha = 1;
    }

    /*Opens this window

    Input: char_index [number] = The selected character's party index
           close_callback [function] = Closing callback (Optional)
           open_callback [function] = Opening callback (Optional)*/
    open(char_index: number, close_callback?: Function, open_callback?: Function, pos?: {page: number; index: number}) {
        this.update_position();
        this.char_index = char_index;
        this.char = this.data.info.party_data.members[char_index];

        this.page_index = pos ? pos.page : 0;
        this.set_page_number();
        this.group.alpha = 1;
        this.close_callback = close_callback;
        this.window.show(open_callback, false);

        this.selected_element_index = pos ? pos.index : 0;
        this.set_elements();

        this.set_element_tween(this.selected_element_index);
        this.set_highlight_bar();
        this.on_change(
            this.element_list[this.get_element_key_name(this.selected_element_index) as string],
            this.is_psynergy_window ? undefined : this.item_objs[this.selected_element_index]
        );

        this.move_cursor(CURSOR_X, CURSOR_Y + this.selected_element_index * CURSOR_GAP);

        this.window_open = true;
        this.window_activated = true;
    }

    /*Closes this window*/
    close() {
        this.window.close(this.close_callback, false);
        this.group.alpha = 1;
        this.clear_sprites();
        this.window.page_indicator.terminante();
        this.data.cursor_manager.hide();

        this.unset_element_tween(this.selected_element_index);
        this.window_open = false;
        this.window_activated = false;
    }

    /*Sets this window's state as "activated"
    Enables several UI elements*/
    activate() {
        this.set_page_number();
        this.set_elements();
        this.element_change(this.selected_element_index);

        this.window.page_indicator.initialize(this.page_number, this.page_index);
        this.set_element_tween(this.selected_element_index);
        this.set_highlight_bar();

        this.window_activated = true;
        this.char_select_controls_sprites.forEach(sprite => {
            sprite.alpha = 1;
        });
    }

    /*Disables this window's "activated" state
    Disables several UI elements*/
    deactivate() {
        this.clear_sprites();
        this.window.page_indicator.terminante();

        this.unset_element_tween(this.selected_element_index);
        this.unset_highlight_bar();

        this.window_activated = false;
        this.char_select_controls_sprites.forEach(sprite => {
            sprite.alpha = 0;
        });
    }
}
