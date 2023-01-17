import {TextObj, Window} from "../../Window";
import * as numbers from "../../magic_numbers";
import {GoldenSun} from "../../GoldenSun";
import {Button} from "../../XGamepad";
import {ItemSlot, MainChar} from "../../MainChar";
import {Item} from "../../Item";
import {ItemQuantityManagerWindow} from "./ItemQuantityManagerWindow";
import {MainItemMenu} from "../../main_menus/MainItemMenu";
import {CursorManager, PointVariants} from "../../utils/CursorManager";
import * as _ from "lodash";

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

const ANSWER_X = 112;
const YES_Y = 8;
const NO_Y = 24;

const CURSOR_X = 194;
const CURSOR_Y1 = 12;
const CURSOR_Y2 = 28;

export class UseGiveItemWindow {
    private static readonly ICON_GROUP_KEY = "item_icon";

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
    public giving: boolean;
    public trade_item: ItemSlot;

    public base_window: Window;
    public item_quantity_manager_window: ItemQuantityManagerWindow;
    public group: Phaser.Group;

    public action_text: TextObj;
    public yes_text: TextObj;
    public no_text: TextObj;

    public char_name: TextObj;
    public item_name: TextObj;

    constructor(game: Phaser.Game, data: GoldenSun) {
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
        this.giving = false;
        this.trade_item = null;

        this.base_window = new Window(this.game, WIN_X, WIN_Y, WIN_WIDTH, WIN_HEIGHT);
        this.item_quantity_manager_window = null;
        this.group = this.game.add.group();

        this.char_name = this.base_window.set_text_in_position("", CHAR_NAME_X, CHAR_NAME_Y);
        this.item_name = this.base_window.set_text_in_position("", ITEM_NAME_X, ITEM_NAME_Y);
        this.action_text = this.base_window.set_text_in_position("", ACTION_TEXT_X, ACTION_TEXT_Y);

        this.yes_text = this.base_window.set_text_in_position("Yes", ANSWER_X, YES_Y);
        this.no_text = this.base_window.set_text_in_position("No", ANSWER_X, NO_Y);
        this.yes_text.text.visible = this.no_text.text.visible = false;
        this.yes_text.shadow.visible = this.no_text.shadow.visible = false;
    }

    change_answer() {
        if (this.answer_index === YES_Y) this.set_answer_index(NO_Y);
        else this.set_answer_index(YES_Y);
    }

    set_answer_index(index: number) {
        this.answer_index = index;

        const cursor_x = CURSOR_X;
        const cursor_y = index === YES_Y ? CURSOR_Y1 : CURSOR_Y2;

        const tween_config = {type: CursorManager.CursorTweens.POINT, variant: PointVariants.NORMAL};
        this.data.cursor_manager.move_to({x: cursor_x, y: cursor_y}, {animate: false, tween_config: tween_config});
    }

    update_position() {
        this.group.x = this.game.camera.x + WIN_X;
        this.group.y = this.game.camera.y + WIN_Y;
    }

    set_header() {
        this.unset_header();
        this.base_window.update_text(this.char.name, this.char_name);
        this.base_window.update_text_position(
            {
                x: CHAR_NAME_X,
                y: CHAR_NAME_Y,
            },
            this.char_name
        );
        this.base_window.update_text(this.item.name, this.item_name);
        this.base_window.update_text_position(
            {
                x: ITEM_NAME_X,
                y: ITEM_NAME_Y,
            },
            this.item_name
        );
        if (this.choosing_char && this.giving) {
            this.base_window.update_text("Give it to whom?", this.action_text);
            this.base_window.update_text_position(
                {
                    x: ITEM_NAME_X,
                    y: ACTION_TEXT_Y,
                },
                this.action_text
            );
        } else if (this.choosing_char && !this.giving) {
            this.base_window.update_text("Use it on whom?", this.action_text);
            this.base_window.update_text_position(
                {
                    x: ITEM_NAME_X,
                    y: ACTION_TEXT_Y,
                },
                this.action_text
            );
        } else if (this.asking_for_equip) {
            this.yes_text.text.visible = this.no_text.text.visible = true;
            this.yes_text.shadow.visible = this.no_text.shadow.visible = true;
            this.base_window.update_text("Equip this item?", this.action_text);
            this.base_window.update_text_position(
                {
                    x: ACTION_TEXT_X,
                    y: ACTION_TEXT_Y,
                },
                this.action_text
            );
        }

        this.base_window.define_internal_group(UseGiveItemWindow.ICON_GROUP_KEY);
        const item = this.data.info.items_list[this.item.key_name];
        this.base_window.make_item_obj(
            this.item.key_name,
            {x: ITEM_ICON_X, y: ITEM_ICON_Y},
            {
                broken: this.item_obj.broken,
                equipped: this.item_obj.equipped,
                quantity: item.carry_up_to_30 ? this.item_obj.quantity : undefined,
                internal_group: UseGiveItemWindow.ICON_GROUP_KEY,
            }
        );
    }

    unset_header() {
        this.base_window.update_text("", this.char_name);
        this.base_window.update_text_position(
            {
                x: CHAR_NAME_X,
                y: CHAR_NAME_Y,
            },
            this.char_name
        );
        this.base_window.update_text("", this.item_name);
        this.base_window.update_text_position(
            {
                x: ITEM_NAME_X,
                y: ITEM_NAME_Y,
            },
            this.item_name
        );
        this.base_window.update_text("", this.action_text);
        this.base_window.update_text_position(
            {
                x: ACTION_TEXT_X,
                y: ACTION_TEXT_Y,
            },
            this.action_text
        );
        this.yes_text.text.visible = this.no_text.text.visible = false;
        this.yes_text.shadow.visible = this.no_text.shadow.visible = false;
        this.base_window.destroy_internal_group(UseGiveItemWindow.ICON_GROUP_KEY);
    }

    on_give(equip?: boolean) {
        if (equip === undefined) {
            equip = this.answer_index === YES_Y ? true : false;
        }

        const chars_menu = this.item_menu.chars_menu;
        const dest_char = chars_menu.lines[chars_menu.current_line][chars_menu.selected_index];
        const dest_item_obj = {
            key_name: this.item_obj.key_name,
            equipped: equip,
            quantity: this.item_quantity_manager_window.window_open
                ? this.item_quantity_manager_window.choosen_quantity
                : this.item_obj.quantity,
        };

        if (this.item_quantity_manager_window.window_open) {
            this.item_quantity_manager_window.close();
        }

        this.char.remove_item(this.item_obj, dest_item_obj.quantity);
        if (this.trade_item) {
            this.char.add_item(this.trade_item.key_name, this.trade_item.quantity, false);
        }
        dest_char.add_item(dest_item_obj.key_name, dest_item_obj.quantity, equip);

        this.base_window.update_text("", this.action_text);
        this.base_window.update_text_position(
            {
                x: ACTION_TEXT_X,
                y: ACTION_TEXT_Y,
            },
            this.action_text
        );
        this.yes_text.text.visible = this.no_text.text.visible = false;
        this.yes_text.shadow.visible = this.no_text.shadow.visible = false;

        const action_window_text = equip ? "Equipped it." : "Given.";
        this.item_menu.item_options_window.open_action_message_window(action_window_text, () => {
            if (equip && this.item.curses_when_equipped) {
                this.data.audio.play_se("misc/on_equip_curse");
                this.item_menu.item_options_window.open_action_message_window("You were cursed!", () => {
                    this.finish_give();
                });
            } else {
                this.finish_give();
            }
        });
    }

    finish_give() {
        this.item_menu.item_choose_window.close();
        const char_index = this.data.info.party_data.members.indexOf(this.char);
        this.item_menu.item_options_window.close(() => {
            this.item_menu.item_options_window.close_callback(true, char_index);
        });
        this.close();
        this.item_menu.set_guide_window_text();
    }

    init_give(dest_char: MainChar) {
        this.trade_item = null;
        const chars_menu = this.item_menu.chars_menu;
        let will_swap_general_item = true;
        if (this.item.carry_up_to_30) {
            const target_slot_candidate = dest_char.items.find(item_slot => item_slot.key_name === this.item.key_name);
            if (target_slot_candidate) {
                if (target_slot_candidate.quantity >= MainChar.MAX_GENERAL_ITEM_NUMBER) {
                    this.item_menu.item_options_window.open_action_message_window("Can't hold more!", () => {
                        this.finish_give();
                    });
                    return;
                } else if (
                    dest_char.inventory_is_full &&
                    target_slot_candidate.quantity < MainChar.MAX_GENERAL_ITEM_NUMBER
                ) {
                    will_swap_general_item = false;
                }
            }
        }
        if (dest_char.inventory_is_full && will_swap_general_item) {
            this.base_window.close(undefined, false);
            this.item_menu.set_guide_window_text("Swap it for what?");
            this.item_menu.item_choose_window.open(
                chars_menu.selected_index,
                undefined, //close callback
                () => {
                    //open callback
                    this.item_menu.item_choose_window.grant_control(
                        () => {
                            //on cancel
                            this.item_menu.item_choose_window.close();
                            this.base_window.show(undefined, false);
                            this.choosing_character();
                        },
                        () => {
                            //on select
                            const item_win = this.item_menu.item_choose_window;
                            const selected_item_obj = item_win.item_objs[item_win.selected_element_index];
                            const selected_item = this.data.info.items_list[selected_item_obj.key_name];
                            if (selected_item.carry_up_to_30) {
                                const this_char_same_item = this.char.items.find(
                                    item_slot => item_slot.key_name === selected_item.key_name
                                );
                                if (
                                    this_char_same_item &&
                                    this_char_same_item.quantity + selected_item_obj.quantity >
                                        MainChar.MAX_GENERAL_ITEM_NUMBER
                                ) {
                                    this.item_menu.item_options_window.open_action_message_window(
                                        "Can't trade it!",
                                        () => {
                                            this.finish_give();
                                        }
                                    );
                                    return;
                                }
                            }
                            this.trade_item = selected_item_obj;
                            dest_char.remove_item(selected_item_obj, selected_item_obj.quantity);
                            this.give_check_if_equip(dest_char);
                        }
                    );
                },
                {
                    page: 0,
                    index: 0,
                }
            );
        } else {
            this.give_check_if_equip(dest_char);
        }
    }

    give_check_if_equip(dest_char: MainChar) {
        if (this.trade_item) {
            this.base_window.show(undefined, false);
        }
        this.asking_for_equip = this.item.equipable_chars.includes(dest_char.key_name);
        if (this.asking_for_equip) {
            this.set_header();
            this.set_answer_index(YES_Y);

            const controls = [
                {buttons: Button.UP, on_down: this.change_answer.bind(this), sfx: {down: "menu/move"}},
                {buttons: Button.DOWN, on_down: this.change_answer.bind(this), sfx: {down: "menu/move"}},
                // in the original games, the item equip sfx is played whether or not the item is actually equipped
                {buttons: Button.A, on_down: this.on_give.bind(this), sfx: {down: "menu/item_equip"}},
                {buttons: Button.B, on_down: this.on_give.bind(this, false), sfx: {down: "menu/negative"}},
            ];
            this.data.control_manager.add_controls(controls, {
                loop_config: {vertical: true},
            });
        } else {
            if (this.item_obj.quantity > 1 && this.trade_item === null) {
                let disable_count = 0;
                const dest_char_same_item = dest_char.items.find(
                    item_slot => item_slot.key_name === this.item.key_name
                );
                if (
                    dest_char_same_item &&
                    this.item_obj.quantity + dest_char_same_item.quantity > MainChar.MAX_GENERAL_ITEM_NUMBER
                ) {
                    disable_count = _.clamp(
                        MainChar.MAX_GENERAL_ITEM_NUMBER - dest_char_same_item.quantity,
                        0,
                        MainChar.MAX_GENERAL_ITEM_NUMBER
                    );
                }
                this.item_quantity_manager_window.open(
                    this.item_obj,
                    this.item,
                    this.char,
                    undefined,
                    dest_char,
                    undefined,
                    disable_count
                );
                this.item_quantity_manager_window.grant_control(() => {
                    this.item_quantity_manager_window.close();
                    this.choosing_character();
                }, this.on_give.bind(this));
            } else {
                this.on_give(false);
            }
        }
    }

    init_use(dest_char: MainChar) {
        const ability = this.data.info.abilities_list[this.item.use_ability];
        const ability_used = this.item_menu.item_choose_window.cast_ability(
            this.char,
            dest_char,
            ability,
            this.item_menu.description_window,
            this.item_menu.description_window_text
        );
        if (ability_used) {
            this.char.remove_item(this.item_obj, 1);

            this.data.cursor_manager.hide();
            this.data.control_manager.add_controls([
                {
                    buttons: Button.A,
                    on_down: () => {
                        this.item_menu.set_description_window_text();
                        const char_index = this.data.info.party_data.members.indexOf(this.char);
                        this.item_menu.item_options_window.close(() => {
                            this.item_menu.item_options_window.close_callback(true, char_index);
                        });
                        this.close();
                    },
                    sfx: {down: "menu/positive_3"},
                },
            ]);
        } else {
            this.choosing_character(false);
        }
    }

    on_character_select() {
        this.choosing_char = false;
        this.item_menu.choosing_destination = false;

        const chars_menu = this.item_menu.chars_menu;
        const dest_char = chars_menu.lines[chars_menu.current_line][chars_menu.selected_index];

        if (this.giving) {
            if (this.char.key_name !== dest_char.key_name) {
                this.init_give(dest_char);
            } else {
                this.choosing_character();
            }
        } else {
            this.init_use(dest_char);
        }
    }

    choosing_character(select_char: boolean = true) {
        this.choosing_char = true;
        this.set_header();

        this.item_menu.choosing_destination = true;
        if (select_char) {
            this.item_menu.chars_menu.select_char(this.item_menu.chars_menu.selected_index);
        }
        this.item_menu.chars_menu.grant_control(this.close.bind(this), this.on_character_select.bind(this));

        this.item_menu.item_overview_window.show(undefined, false);
        this.item_menu.shift_item_overview(true);
    }

    open(
        item_obj: ItemSlot,
        item: Item,
        char: MainChar,
        item_menu: MainItemMenu,
        giving: boolean,
        close_callback?: Function,
        open_callback?: Function
    ) {
        this.item_obj = item_obj;
        this.item = item;
        this.char = char;

        this.choosing_char = false;
        this.asking_for_equip = false;
        this.giving = giving;
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
