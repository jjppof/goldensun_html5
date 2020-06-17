import { Window } from '../Window.js';
import * as numbers from '../../magic_numbers.js';
import { CursorControl } from '../utils/CursorControl.js';
import { party_data } from '../../initializers/main_chars.js';
import { DropItemWindow } from './DropItemWindow.js';
import { ItemQuantityManagerWindow } from './ItemQuantityManagerWindow.js';
import { GiveItemOptionsWindow } from './GiveItemOptionsWindow.js';

const WIN_WIDTH = 132;
const WIN_HEIGHT = 52;
const WIN_X = 104;
const WIN_Y = 0;
const OPTION_TEXT_HORIZONTAL_PADDING = 8;
const OPTION_TEXT_MAX_WIDHT = 40;
const OPTION_TEXT_Y_POS = 32;
const MAX_HORIZONTAL = 3;
const MAX_VERTICAL = 2;
const CURSOR_X_SHIFT = -15;
const CURSOR_Y_SHIFT = 4;
const CHAR_NAME_X = 27;
const CHAR_NAME_Y = 8;
const ITEM_NAME_X = 27;
const ITEM_NAME_Y = CHAR_NAME_Y + numbers.FONT_SIZE;
const ITEM_ICON_X = 8;
const ITEM_ICON_Y = 8;
const SUB_ICON_X = 7;
const SUB_ICON_Y = 8;
const DISABLE_COLOR = 0x606060;
const ENABLE_COLOR = 0xFFFFFF;
const ACTION_WINDOW_MSG_X = 122;
const ACTION_WINDOW_MSG_Y = 66;
const ACTION_WINDOW_MSG_WIDTH = 67;
const ACTION_WINDOW_MSG_HEIGHT = 20;

export class ItemOptionsWindow {
    constructor(game, data, esc_propagation_priority, enter_propagation_priority) {
        this.game = game;
        this.data = data;
        this.item_obj = null;
        this.item = null;
        this.char = null;
        this.window_open = false;
        this.window_active = false;
        this.x = WIN_X;
        this.y = WIN_Y;
        this.base_window = new Window(this.game, this.x, this.y, WIN_WIDTH, WIN_HEIGHT);
        this.group = this.game.add.group();
        this.text_sprites = {
            use: this.base_window.set_text_in_position("Use", OPTION_TEXT_HORIZONTAL_PADDING, OPTION_TEXT_Y_POS),
            equip: this.base_window.set_text_in_position("Equip", OPTION_TEXT_HORIZONTAL_PADDING + OPTION_TEXT_MAX_WIDHT, OPTION_TEXT_Y_POS),
            details: this.base_window.set_text_in_position("Details", OPTION_TEXT_HORIZONTAL_PADDING + 2 * OPTION_TEXT_MAX_WIDHT, OPTION_TEXT_Y_POS),
            give: this.base_window.set_text_in_position("Give", OPTION_TEXT_HORIZONTAL_PADDING, OPTION_TEXT_Y_POS + numbers.FONT_SIZE),
            remove: this.base_window.set_text_in_position("Remove", OPTION_TEXT_HORIZONTAL_PADDING + OPTION_TEXT_MAX_WIDHT, OPTION_TEXT_Y_POS + numbers.FONT_SIZE),
            drop: this.base_window.set_text_in_position("Drop", OPTION_TEXT_HORIZONTAL_PADDING + 2 * OPTION_TEXT_MAX_WIDHT, OPTION_TEXT_Y_POS + numbers.FONT_SIZE)
        };
        this.option_active = {
            use: true,
            equip: true,
            details: true,
            give: true,
            remove: true,
            drop: true
        };
        this.horizontal_index = 0;
        this.vertical_index = 0;
        this.esc_propagation_priority = esc_propagation_priority + 1;
        this.enter_propagation_priority = enter_propagation_priority + 1;
        this.cursor_control = new CursorControl(this.game, true, true, () => MAX_HORIZONTAL, () => MAX_VERTICAL, this.group,
            this.on_change.bind(this), this.on_change.bind(this), this.get_horizontal_index.bind(this), this.set_horizontal_index.bind(this),
            this.get_vertical_index.bind(this), this.set_vertical_index.bind(this), this.is_open.bind(this), this.is_active.bind(this),
            this.get_cursor_x.bind(this), this.get_cursor_y.bind(this));
        this.give_item_options_window = new GiveItemOptionsWindow(this.game, this.data, this.esc_propagation_priority + 2, this.enter_propagation_priority + 2);
        this.item_quantity_manager_window = new ItemQuantityManagerWindow(this.game, this.data, this.esc_propagation_priority, this.enter_propagation_priority);
        this.drop_item_window = new DropItemWindow(this.game, this.data, this.esc_propagation_priority + 1, this.enter_propagation_priority + 1);
        this.action_message_window = new Window(this.game, ACTION_WINDOW_MSG_X, ACTION_WINDOW_MSG_Y, ACTION_WINDOW_MSG_WIDTH, ACTION_WINDOW_MSG_HEIGHT);
        this.set_control();
    }

    hide() {
        this.base_window.group.alpha = 0;
    }

    show() {
        this.base_window.group.alpha = 1;
    }

    hide_text() {
        for (let key in this.text_sprites) {
            this.text_sprites[key].text.alpha = this.text_sprites[key].shadow.alpha = 0;
        }
    }

    show_text() {
        for (let key in this.text_sprites) {
            this.text_sprites[key].text.alpha = this.text_sprites[key].shadow.alpha = 1;
        }
    }

    is_open() {
        return this.window_open;
    }

    is_active() {
        return this.window_active;
    }

    get_cursor_x() {
        return OPTION_TEXT_HORIZONTAL_PADDING + this.horizontal_index * OPTION_TEXT_MAX_WIDHT + CURSOR_X_SHIFT;
    }

    get_cursor_y() {
        return OPTION_TEXT_Y_POS + numbers.FONT_SIZE * this.vertical_index + CURSOR_Y_SHIFT;
    }

    get_vertical_index() {
        return this.vertical_index;
    }

    set_vertical_index(index) {
        this.vertical_index = index;
    }

    get_horizontal_index() {
        return this.horizontal_index;
    }

    set_horizontal_index(index) {
        this.horizontal_index = index;
    }
    
    set_control() {
        game.input.keyboard.addKey(Phaser.Keyboard.ESC).onDown.add(() => {
            if (!this.window_open || !this.window_active) return;
            this.data.esc_input.getSignal().halt();
            if (this.action_message_window.open) {
                this.action_message_window.close();
            } else {
                this.close(this.close_callback);
            }
        }, this, this.esc_propagation_priority);
        game.input.keyboard.addKey(Phaser.Keyboard.ENTER).onDown.add(() => {
            if (!this.window_open || !this.window_active) return;
            this.data.enter_input.getSignal().halt();
            if (this.action_message_window.open) {
                this.action_message_window.close();
            } else {
                this.on_choose();
            }
        }, this, this.enter_propagation_priority);
    }

    set_available_options() {
        if (!this.item.use_ability || this.item.broken) {
            this.text_sprites.use.text.tint = DISABLE_COLOR;
            this.option_active.use = false;
        } else {
            this.text_sprites.use.text.tint = ENABLE_COLOR;
            this.option_active.use = true;
        }
        if (!this.item.equipable || this.item_obj.equipped || !this.item.equipable_chars.includes(this.char.key_name)) {
            this.text_sprites.equip.text.tint = DISABLE_COLOR;
            this.option_active.equip = false;
        } else {
            this.text_sprites.equip.text.tint = ENABLE_COLOR;
            this.option_active.equip = true;
        }
        if (party_data.members.length <= 1) {
            this.text_sprites.give.text.tint = DISABLE_COLOR;
            this.option_active.give = false;
        } else {
            this.text_sprites.give.text.tint = ENABLE_COLOR;
            this.option_active.give = true;
        }
        if (!this.item.equipable || !this.item_obj.equipped || !this.item.equipable_chars.includes(this.char.key_name)) {
            this.text_sprites.remove.text.tint = DISABLE_COLOR;
            this.option_active.remove = false;
        } else {
            this.text_sprites.remove.text.tint = ENABLE_COLOR;
            this.option_active.remove = true;
        }
        if (this.item.imporant_item) {
            this.text_sprites.drop.text.tint = DISABLE_COLOR;
            this.option_active.drop = false;
        } else {
            this.text_sprites.drop.text.tint = ENABLE_COLOR;
            this.option_active.drop = true;
        }
    }

    set_header() {
        this.icon_sprite = this.base_window.create_at_group(ITEM_ICON_X, ITEM_ICON_Y, "items_icons", undefined, this.item.key_name);
        this.char_name = this.base_window.set_text_in_position(this.char.name, CHAR_NAME_X, CHAR_NAME_Y);
        this.item_name = this.base_window.set_text_in_position(this.item.name, ITEM_NAME_X, ITEM_NAME_Y);
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
        this.base_window.remove_text(this.char_name);
        this.base_window.remove_text(this.item_name);
        if (this.equip_sprite) {
            this.base_window.remove_from_group(this.equip_sprite);
        }
        if (this.item_count_sprite) {
            this.base_window.remove_from_group(this.item_count_sprite);
        }
    }

    update_position() {
        this.group.x = this.game.camera.x + this.x;
        this.group.y = this.game.camera.y + this.y;
    }

    open_action_message_window(text, close_callback) {
        this.action_message_window.set_text([text]);
        this.cursor_control.deactivate();
        if (this.stats_update_callback !== undefined) {
            this.stats_update_callback();
        }
        this.action_message_window.show(undefined, true, () => {
            close_callback();
        });
    }

    on_choose() {
        if (this.horizontal_index === 0) {
            if (this.vertical_index === 1 && this.option_active.give) {
                this.deactivate();
                this.give_item_options_window.open(this.item_obj, this.item, this.char, true, false);
                this.give_item_options_window.deactive();
                this.on_give_callback((destination_char, after_choose_callback, unmount_give_window_set) => {
                    if (destination_char === null) {
                        this.give_item_options_window.close();
                        this.activate();
                    } else if (destination_char.key_name !== this.char.key_name) {
                        this.give_item_options_window.close();
                        let dest_item_obj = {
                            key_name: this.item_obj.key_name,
                            equipped: false,
                            quantity: this.item_obj.quantity
                        };
                        if (this.item.equipable_chars.includes(destination_char.key_name)) {
                            this.give_item_options_window.open(dest_item_obj, this.item, destination_char, false, true, (answer, equip) => {
                                if (answer) {
                                    this.activate();
                                    this.char.remove_item(this.item_obj, this.item_obj.quantity);
                                    destination_char.add_item(dest_item_obj.key_name, dest_item_obj.quantity, equip);
                                    unmount_give_window_set();
                                    this.open_action_message_window("Given.", () => {
                                        this.close(this.close_callback.bind(this, true));
                                    });
                                } else {
                                    this.close(this.close_callback.bind(this, true));
                                    unmount_give_window_set();
                                }
                            });
                        } else {
                            if (this.item_obj.quantity > 1) {
                                this.item_quantity_manager_window.open(dest_item_obj, this.item, this.char, quantity => {
                                    if (quantity > 0) {
                                        this.activate();
                                        dest_item_obj.quantity = quantity;
                                        this.char.remove_item(this.item_obj, quantity);
                                        destination_char.add_item(dest_item_obj.key_name, dest_item_obj.quantity, false);
                                        unmount_give_window_set();
                                        this.open_action_message_window("Given.", () => {
                                            this.close(this.close_callback.bind(this, true));
                                        });
                                    } else {
                                        this.close(this.close_callback.bind(this, true));
                                        unmount_give_window_set();
                                    }
                                }, destination_char);
                            } else {
                                this.activate();
                                this.char.remove_item(this.item_obj, this.item_obj.quantity);
                                destination_char.add_item(dest_item_obj.key_name, dest_item_obj.quantity, false);
                                unmount_give_window_set();
                                this.open_action_message_window("Given.", () => {
                                    this.close(this.close_callback.bind(this, true));
                                });
                            }
                        }
                        after_choose_callback();
                    }
                });
            }
        } else if (this.horizontal_index === 1) {
            if (this.vertical_index === 0 && this.option_active.equip) {
                this.char.equip_item(this.item_obj.index);
                this.open_action_message_window("Equipped.", () => {
                    this.close(this.close_callback);
                });
            }
            if (this.vertical_index === 1 && this.option_active.remove) {
                this.char.unequip_item(this.item_obj.index);
                this.open_action_message_window("Removed.", () => {
                    this.close(this.close_callback);
                });
            }
        } else if (this.horizontal_index === 2) {
            if (this.vertical_index === 1 && this.option_active.drop) {
                this.deactivate();
                let open_drop_window = (quantity = 1) => {
                    this.drop_item_window.open(this.item_obj, this.item, this.char, quantity, dropped => {
                        this.activate();
                        if (dropped) {
                            this.open_action_message_window("Dropped it.", () => {
                                this.close(this.close_callback);
                            });
                        }
                    });
                };
                if (this.item_obj.quantity > 1) {
                    this.item_quantity_manager_window.open(this.item_obj, this.item, this.char, quantity => {
                        if (quantity > 0) {
                            open_drop_window(quantity);
                        } else {
                            this.activate();
                        }
                    });
                } else {
                    open_drop_window();
                }
            }
        }
    }

    on_change() {
        this.stats_window.hide_arrows();
        this.stats_window.show();
        if (this.horizontal_index === 0) {
            if (this.vertical_index === 0 && this.option_active.use) {
                this.stats_window.hide();
            }
            if (this.vertical_index === 1 && this.option_active.give && this.item_obj.equipped) {
                this.stats_window.compare_items(true);
            }
        } else if (this.horizontal_index === 1) {
            if (this.vertical_index === 0 && this.option_active.equip) {
                this.stats_window.compare_items();
            }
            if (this.vertical_index === 1 && this.option_active.remove) {
                this.stats_window.compare_items(true);
            }
        } else if (this.horizontal_index === 2) {
            if (this.vertical_index === 1 && this.option_active.drop && this.item_obj.equipped) {
                this.stats_window.compare_items(true);
            }
        }
    }

    open(item_obj, item, char, stats_window, on_give_callback, close_callback, stats_update_callback, open_callback) {
        this.item_obj = item_obj;
        this.item = item;
        this.char = char;
        this.stats_window = stats_window;
        this.cursor_control.activate();
        this.on_give_callback = on_give_callback;
        this.close_callback = close_callback;
        this.stats_update_callback = stats_update_callback;
        this.update_position();
        this.set_header();
        this.set_available_options();
        this.on_change();
        this.base_window.show(() => {
            this.window_open = true;
            this.window_active = true;
            if (open_callback !== undefined) {
                open_callback();
            }
        }, false);
    }

    close(callback) {
        this.cursor_control.deactivate();
        this.unset_header();
        this.base_window.close(() => {
            this.window_open = false;
            this.window_active = false;
            if (callback !== undefined) {
                callback();
            }
        }, false);
    }

    activate() {
        this.set_header();
        this.set_available_options();
        this.on_change();
        this.cursor_control.activate();
        this.window_active = true;
    }

    deactivate() {
        this.unset_header();
        this.cursor_control.deactivate();
        this.window_active = false;
    }
}