import { Window, TextObj } from "../Window";
import { CursorControl } from "../utils/CursorControl.js";
import * as numbers from '../magic_numbers.js';
import { GoldenSun } from "../GoldenSun";
import { ItemSlot, MainChar } from "../MainChar";

const PSY_OVERVIEW_WIN_X = 104;
const PSY_OVERVIEW_WIN_Y = 24;
const PSY_OVERVIEW_WIN_WIDTH = 132;
const PSY_OVERVIEW_WIN_HEIGHT = 108;
const SPACE_BETWEEN_ITEMS = 1;
const ELEM_PADDING_TOP = 12;
const ELEM_PADDING_LEFT = 8;
const ELEM_PER_PAGE = 5;
const PSY_PP_X = 125;
const PSY_PP_COST_X = 102;
const PSY_PP_COST_Y = 8;
const ELEM_NAME_ICON_SHIFT = 4;
const HIGHLIGHT_WIDTH = 114;
const HIGHLIGHT_HEIGHT = numbers.FONT_SIZE;
const SUB_ICON_X = 0;
const SUB_ICON_Y = 0;

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
    public element_list: any;
    public element_sprite_key: string;
    public on_choose: Function;
    public on_change: Function;
    public esc_propagation_priority: number;
    public enter_propagation_priority: number;
    public window: Window;
    public group: Phaser.Group;
    public window_open: boolean;
    public window_activated: boolean;
    public close_callback: Function;
    public char: MainChar;
    public char_select_controls_sprites: (Phaser.Sprite|Phaser.BitmapText)[];
    public page_index: number;
    public page_number: number;
    public text_sprites_in_window: TextObj[];
    public icon_sprites_in_window: (Phaser.Sprite|Phaser.Group)[];
    public selected_element_index: number;
    public elements: string[]|ItemSlot[];
    public cursor_control: CursorControl;
    public selected_element_tween: Phaser.Tween;
    public highlight_bar: Phaser.Graphics;
    public char_index: number;
    public item_objs: ItemSlot[];

    constructor(game, data, is_psynergy_window, on_change, on_choose, esc_propagation_priority, enter_propagation_priority?) {
        this.game = game;
        this.data = data;
        this.is_psynergy_window = is_psynergy_window;
        this.element_list = this.is_psynergy_window ? this.data.info.abilities_list : this.data.info.items_list;
        this.element_sprite_key = this.is_psynergy_window ? "abilities_icons" : "items_icons";
        this.on_choose = on_choose === undefined ? () => {} : on_choose;
        this.on_change = on_change === undefined ? () => {} : on_change;
        this.esc_propagation_priority = esc_propagation_priority + 1;
        this.enter_propagation_priority = enter_propagation_priority + 1;
        this.window = new Window(this.game, PSY_OVERVIEW_WIN_X, PSY_OVERVIEW_WIN_Y, PSY_OVERVIEW_WIN_WIDTH, PSY_OVERVIEW_WIN_HEIGHT);
        this.group = game.add.group();
        this.group.alpha = 0;
        this.set_control();
        this.window_open = false;
        this.window_activated = false;
        this.close_callback = undefined;
        this.char = null;
        this.char_select_controls_sprites = [
            this.window.create_at_group(9, 97, "shift_keyboard", 0x0),
            this.window.create_at_group(8, 96, "shift_keyboard"),
            this.window.create_at_group(32, 97, "tab_keyboard", 0x0),
            this.window.create_at_group(31, 96, "tab_keyboard")
        ];
        const sprite_pair = this.window.set_text_in_position(": Change Char", 49, 96);
        this.char_select_controls_sprites.push(sprite_pair.text, sprite_pair.shadow);
        this.page_index = 0;
        this.text_sprites_in_window = [];
        this.icon_sprites_in_window = [];
        this.selected_element_index = 0;
        this.elements = [];
        this.cursor_control = new CursorControl(this.game, true, true, this.get_page_number.bind(this), this.get_elem_per_page.bind(this), this.group,
            this.page_change.bind(this), this.element_change.bind(this), this.get_page_index.bind(this), this.set_page_index.bind(this),
            this.get_element_index.bind(this), this.set_element_index.bind(this), this.is_open.bind(this), this.is_activated.bind(this),
            this.get_cursor_x.bind(this), this.get_cursor_y.bind(this)
        );
        this.selected_element_tween = null;
        this.highlight_bar = this.game.add.graphics(0, 0);
        this.highlight_bar.blendMode = PIXI.blendModes.SCREEN;
        this.window.add_sprite_to_group(this.highlight_bar);
        this.highlight_bar.beginFill(this.window.color, 1);
        this.highlight_bar.drawRect(ELEM_PADDING_LEFT + (numbers.ICON_WIDTH >> 1), 0, HIGHLIGHT_WIDTH, HIGHLIGHT_HEIGHT);
        this.highlight_bar.endFill();
        if (this.is_psynergy_window) {
            this.window.set_text_in_position("PP", PSY_PP_COST_X, PSY_PP_COST_Y);
        }
        this.window.init_page_indicator_bar();
    }

    /*Returns the name of the Psynergy/Item

    Input: index [number] : The element's index

    Output: [string]*/
    get_element_key_name(index) {
        return this.is_psynergy_window ? this.elements[index] : (this.elements[index] as ItemSlot).key_name;
    }

    set_control() {
        this.data.esc_input.add(() => {
            if (!this.window_open || !this.window_activated) return;
            this.data.esc_input.halt();
            this.close();
        }, this, this.esc_propagation_priority);
        this.data.enter_input.add(() => {
            if (!this.window_open || !this.window_activated) return;
            this.data.enter_input.halt();
            if (this.is_psynergy_window && this.element_list[this.elements[this.selected_element_index] as string].is_field_psynergy) {
                this.close();
            }
            if (!this.is_psynergy_window) {
                this.deactivate();
            }
            this.on_choose(
                this.element_list[this.get_element_key_name(this.selected_element_index) as string],
                this.is_psynergy_window ? undefined : this.item_objs[this.selected_element_index]
            );
        }, this, this.enter_propagation_priority);
    }

    /*Checks "open" state

    Output: [boolean] - True if "open"*/
    is_open() {
        return this.window_open;
    }

    /*Checks "activated" state

    Output: [boolean] - True if "activated"*/
    is_activated() {
        return this.window_activated;
    }

    /*Returns the currently selected element's index

    Output: [number]*/
    get_element_index() {
        return this.selected_element_index;
    }

    /*Selects a new element

    Input: index [number] - The new element's index*/
    set_element_index(index) {
        this.selected_element_index = index;
    }

    /*Returns the current page's index

    Output: [number]*/
    get_page_index() {
        return this.page_index;
    }

    /*Selects a new page

    Input: index [number] - The new page's index*/
    set_page_index(index) {
        this.page_index = index;
    }

    /*Returns the cursor's x value

    Output: [number]*/
    get_cursor_x() {
        return -5;
    }

    /*Returns the cursor's y value

    Output: [number]*/
    get_cursor_y() {
        return ELEM_PADDING_TOP + ((numbers.ICON_HEIGHT >> 1)|0) + this.selected_element_index * (numbers.ICON_HEIGHT + SPACE_BETWEEN_ITEMS);
    }

    /*Returns the number of elements in this page
    
    Output: [number]*/
    get_elem_per_page() {
        return this.elements.length;
    }

    /*Sets the total page number*/
    set_page_number() {
        let list_length: number;
        if (this.is_psynergy_window) {
            list_length = this.char.abilities.filter(elem_key_name => {
                return (elem_key_name in this.element_list) && (this.element_list[elem_key_name].is_field_psynergy || this.element_list[elem_key_name].effects_outside_battle);
            }).length;
        } else {
            list_length = this.char.items.filter(item_obj => {
                return item_obj.key_name in this.element_list;
            }).length;
        }
        this.page_number = (((list_length - 1)/ELEM_PER_PAGE) | 0) + 1;
        if (this.page_index >= this.page_number) {
            this.page_index = this.page_number - 1;
        }
    }

    /*Returns the total page number
    
    Output: [number]*/
    get_page_number() {
        return this.page_number;
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
            this.elements = this.char.abilities.filter(elem_key_name => {
                return (elem_key_name in this.element_list) && (this.element_list[elem_key_name].is_field_psynergy || this.element_list[elem_key_name].effects_outside_battle);
            }).slice(this.page_index * ELEM_PER_PAGE, (this.page_index + 1) * ELEM_PER_PAGE);
        } else {
            this.elements = this.char.items.filter(item_obj => {
                if (item_obj.key_name in this.element_list) {
                    this.item_objs.push(item_obj);
                    return true;
                }
                return false;
            }).slice(this.page_index * ELEM_PER_PAGE, (this.page_index + 1) * ELEM_PER_PAGE);
            this.item_objs = this.item_objs.slice(this.page_index * ELEM_PER_PAGE, (this.page_index + 1) * ELEM_PER_PAGE);
        }
        if (this.selected_element_index >= this.elements.length) {
            this.selected_element_index = this.elements.length - 1;
            this.cursor_control.set_cursor_position();
        }
        for (let i = 0; i < this.elements.length; ++i) {
            const elem_key_name = this.get_element_key_name(i);
            const x = ELEM_PADDING_LEFT;
            const y = ELEM_PADDING_TOP + i * (numbers.ICON_HEIGHT + SPACE_BETWEEN_ITEMS);
            const icon_x = x + (numbers.ICON_WIDTH >> 1);
            const icon_y = y + (numbers.ICON_HEIGHT >> 1);
            const x_elem_name = ELEM_PADDING_LEFT + numbers.ICON_WIDTH + (this.is_psynergy_window ? 2 : 4);
            this.text_sprites_in_window.push(this.window.set_text_in_position(this.element_list[elem_key_name as string].name, x_elem_name, y + ELEM_NAME_ICON_SHIFT));
            if (this.is_psynergy_window) {
                this.icon_sprites_in_window.push(this.window.create_at_group(icon_x, icon_y, this.element_sprite_key, undefined, elem_key_name));
                (this.icon_sprites_in_window[i] as Phaser.Sprite).anchor.setTo(0.5, 0.5);
            } else {
                let icon_group = this.game.add.group();
                let icon_sprite = icon_group.create(0, 0, this.element_sprite_key, elem_key_name as string);
                icon_sprite.anchor.setTo(0.5, 0.5);
                if (this.item_objs[i].equipped) {
                    icon_group.create(SUB_ICON_X, SUB_ICON_Y, "equipped");
                }
                if (this.item_objs[i].quantity > 1) {
                    let item_count = this.game.add.bitmapText(SUB_ICON_X, SUB_ICON_Y, 'gs-item-bmp-font', this.item_objs[i].quantity.toString());
                    icon_group.add(item_count);
                }
                this.window.add_sprite_to_group(icon_group);
                icon_group.x = icon_x;
                icon_group.y = icon_y;
                this.icon_sprites_in_window.push(icon_group);
            }
            if (this.is_psynergy_window) {
                const x_elem_pp_cost = PSY_PP_X;
                this.text_sprites_in_window.push(this.window.set_text_in_position(this.element_list[elem_key_name as string].pp_cost, x_elem_pp_cost, y + ELEM_NAME_ICON_SHIFT, true));
            }
        }
    }

    /*Shows and positions the highlight bar*/
    set_highlight_bar() {
        this.highlight_bar.alpha = 1;
        this.highlight_bar.y = ELEM_PADDING_TOP + this.selected_element_index * (numbers.ICON_HEIGHT + SPACE_BETWEEN_ITEMS) + 4;
    }

    /*Hides the highlight bar*/
    unset_highlight_bar() {
        this.highlight_bar.alpha = 0;
    }

    /*Sets the scaling effect for the selected item*/
    set_element_tween(before_index?) {
        if (this.selected_element_tween) {
            this.selected_element_tween.stop();
            this.icon_sprites_in_window[before_index].scale.setTo(1, 1);
        }
        this.selected_element_tween = this.game.add.tween(this.icon_sprites_in_window[this.selected_element_index].scale).to(
            { x: 1.6, y: 1.6 },
            Phaser.Timer.QUARTER,
            Phaser.Easing.Linear.None,
            true,
            0,
            -1,
            true
        );
    }

    /*Stops the scaling effect*/
    unset_element_tween() {
        this.selected_element_tween.stop();
        this.selected_element_tween = null;
    }

    /*Selects a new element
    
    Input: before_index [number] - Previous element
           after_index [number] - Next element*/
    element_change(before_index, after_index) {
        this.set_element_tween(before_index);
        this.set_highlight_bar();
        this.on_change(
            this.element_list[this.get_element_key_name(after_index) as string],
            this.is_psynergy_window ? undefined : this.item_objs[after_index]
        );
    }

    /*Displays a new page*/
    page_change() {
        this.set_elements();
        this.set_element_tween(this.selected_element_index);
        this.set_highlight_bar();
        this.on_change(
            this.element_list[this.get_element_key_name(this.selected_element_index) as string],
            this.is_psynergy_window ? undefined : this.item_objs[this.selected_element_index]
        );
        this.window.set_page_indicator_highlight(this.page_number, this.page_index);
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
    open(char_index, close_callback, open_callback?) {
        this.update_position();
        this.char_index = char_index;
        this.char = this.data.info.party_data.members[char_index];
        this.set_page_number();
        this.group.alpha = 1;
        this.close_callback = close_callback;
        this.window.show(open_callback, false);
        this.selected_element_index = 0;
        this.page_index = 0;
        this.set_elements();
        this.window.set_page_indicator(this.page_number, this.page_index);
        this.cursor_control.activate();
        this.set_element_tween();
        this.set_highlight_bar();
        this.on_change(
            this.element_list[this.get_element_key_name(this.selected_element_index) as string],
            this.is_psynergy_window ? undefined : this.item_objs[this.selected_element_index]
        );
        this.window_open = true;
        this.window_activated = true;
    }

    /*Closes this window*/
    close() {
        this.window.close(this.close_callback, false);
        this.group.alpha = 1;
        this.clear_sprites();
        this.window.unset_page_indicator();
        this.cursor_control.deactivate();
        this.unset_element_tween();
        this.window_open = false;
        this.window_activated = false;
    }

    /*Sets this window's state as "activated"
    Enables several UI elements*/
    activate() {
        this.set_page_number();
        this.set_elements();
        this.on_change(
            this.element_list[this.get_element_key_name(this.selected_element_index) as string],
            this.is_psynergy_window ? undefined : this.item_objs[this.selected_element_index]
        );
        this.window.set_page_indicator(this.page_number, this.page_index);
        this.cursor_control.activate();
        this.set_element_tween();
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
        this.window.unset_page_indicator();
        this.cursor_control.deactivate();
        this.unset_element_tween();
        this.unset_highlight_bar();
        this.window_activated = false;
        this.char_select_controls_sprites.forEach(sprite => {
            sprite.alpha = 0;
        });
    }
}