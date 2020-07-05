import { CharsStatusWindow } from "../base/windows/CharsStatusWindow.js";
import { HorizontalMenu } from "../base/menus/HorizontalMenu.js";
import { capitalize } from "../utils.js";
import * as numbers from "../magic_numbers.js";
import { party_data } from "../initializers/main_chars.js";
import { Djinn } from "../base/Djinn.js";
import { DescriptionWindow } from "../base/windows/battle/DescriptionWindow.js"
import { PsynergyWindow } from "../base/windows/battle/PsynergyWindow.js"
import { DjinnWindow } from "../base/windows/battle/DjinnWindow.js";

const START_TITLE_WINDOW_WIDTH = 76;
const INNER_TITLE_WINDOW_WIDTH = 60;
const AVATAR_SIZE = 32;
const MAX_CHARS_IN_BATTLE = 4;
const FORWARD = 1;
const BACKWARD = -1;

export class BattleMenuScreen {
    constructor(game, data, enter_propagation_priority, on_abilities_choose, choose_targets) {
        this.game = game;
        this.data = data;
        this.on_abilities_choose = on_abilities_choose;
        this.choose_targets = choose_targets;
        this.chars_status_window = new CharsStatusWindow(this.game, this.data, true, true);
        this.start_buttons_keys = ["fight", "flee", "status"];
        this.esc_propagation_priority = 0;
        this.enter_propagation_priority = enter_propagation_priority;
        this.group = this.game.add.group();
        this.avatar_sprite = this.group.create(0, numbers.GAME_HEIGHT - AVATAR_SIZE);
        this.avatar_sprite.alpha = 0;
        this.start_horizontal_menu = new HorizontalMenu(
            this.game,
            this.data,
            this.start_buttons_keys,
            this.start_buttons_keys.map(b => capitalize(b)),
            this.start_button_press.bind(this),
            this.enter_propagation_priority,
            undefined,
            undefined,
            START_TITLE_WINDOW_WIDTH,
            true
        );
        this.inner_buttons_keys = ["attack", "psynergy", "djinni", "summon", "item", "defend"];
        ++this.esc_propagation_priority;
        ++this.enter_propagation_priority;
        this.inner_horizontal_menu = new HorizontalMenu(
            this.game,
            this.data,
            this.inner_buttons_keys,
            this.inner_buttons_keys.map(b => capitalize(b)),
            this.inner_button_press.bind(this),
            this.enter_propagation_priority,
            this.inner_menu_cancel.bind(this),
            this.esc_propagation_priority,
            INNER_TITLE_WINDOW_WIDTH,
            true
        );
        this.description_window = new DescriptionWindow(this.game);
        this.psynergy_window = new PsynergyWindow(this.game, this.data, this.esc_propagation_priority, this.enter_propagation_priority);
        this.djinn_window = new DjinnWindow(this.game, this.data, this.esc_propagation_priority, this.enter_propagation_priority);
    }

    start_button_press(index) {
        switch (this.start_buttons_keys[index]) {
            case "fight":
                this.start_horizontal_menu.close();
                this.set_avatar();
                let filtered_buttons = [];
                if (!Djinn.has_standby_djinn(MAX_CHARS_IN_BATTLE)) {
                    filtered_buttons.push("summon");
                }
                this.current_buttons = this.inner_buttons_keys.filter(key => !filtered_buttons.includes(key));
                this.inner_horizontal_menu.mount_buttons(filtered_buttons);
                this.abilities = {};
                this.inner_horizontal_menu.open();
        }
    }

    inner_button_press(index) {
        switch (this.current_buttons[index]) {
            case "attack":
                this.choose_targets("attack", targets => {
                    if (targets) {
                        this.abilities[party_data.members[this.current_char_index].key_name] = {
                            key_name: "attack",
                            targets: targets
                        };
                        this.change_char(FORWARD);
                    }
                });
                break;
            case "psynergy":
                this.on_ability_choose(this.psynergy_window);
                break;
            case "djinni":
                this.on_ability_choose(this.djinn_window);
                break
            case "defend":
                this.abilities[party_data.members[this.current_char_index].key_name] = {
                    key_name: "defend",
                    targets: null
                };
                this.change_char(FORWARD);
                break
        }
    }

    on_ability_choose(window) {
        this.inner_horizontal_menu.deactivate();
        this.description_window.open();
        window.open(party_data.members[this.current_char_index], ability => {
            this.description_window.close();
            this.inner_horizontal_menu.activate();
            this.choose_targets(ability, targets => {
                if (targets) {
                    this.abilities[party_data.members[this.current_char_index].key_name] = {
                        key_name: ability,
                        targets: targets
                    };
                    this.change_char(FORWARD);
                }
            });
        }, this.description_window.set_description.bind(this.description_window));
    }

    change_char(step) {
        this.current_char_index += step;
        this.set_avatar();
        this.inner_horizontal_menu.close(undefined, false);
        this.inner_horizontal_menu.open();
    }

    set_avatar() {
        this.avatar_sprite.alpha = 1;
        this.avatar_sprite.loadTexture(party_data.members[this.current_char_index].key_name + "_avatar");
    }

    hide_avatar() {
        this.avatar_sprite.alpha = 0;
    }

    inner_menu_cancel() {
        if (this.current_char_index > 0) {
            this.change_char(BACKWARD);
        } else {
            this.inner_horizontal_menu.close();
            this.hide_avatar();
            this.start_horizontal_menu.open();
        }
    }

    update_position() {
        this.chars_status_window.update_position(true);
        this.start_horizontal_menu.update_position();
        this.inner_horizontal_menu.update_position();
        this.group.x = this.game.camera.x;
        this.group.y = this.game.camera.y;
    }

    is_active() {
        return this.start_horizontal_menu.menu_active || this.inner_horizontal_menu.menu_active;
    }

    open_menu() {
        this.current_char_index = 0;
        this.start_horizontal_menu.open();
        this.update_position();
        this.chars_status_window.update_chars_info();
        this.chars_status_window.show();
    }

    close_menu() {
        if (!this.is_active()) return;
        this.start_horizontal_menu.close();
        this.inner_horizontal_menu.close();
        this.chars_status_window.close();
    }

    destroy_menu() {

    }
}
