import { CharsStatusWindow } from "../base/windows/CharsStatusWindow.js";
import { HorizontalMenu } from "../base/menus/HorizontalMenu.js";
import { capitalize, ordered_elements } from "../utils.js";
import * as numbers from "../magic_numbers.js";
import { party_data } from "../initializers/main_chars.js";
import { Djinn, djinn_status } from "../base/Djinn.js";
import { DescriptionWindow } from "../base/windows/battle/DescriptionWindow.js"
import { PsynergyWindow } from "../base/windows/battle/PsynergyWindow.js"
import { DjinnWindow } from "../base/windows/battle/DjinnWindow.js";
import { ItemWindow } from "../base/windows/battle/ItemWindow.js";
import { SummonWindow } from "../base/windows/battle/SummonWindow.js";
import { MAX_CHARS_IN_BATTLE } from "../base/battle/Battle.js";
import { permanent_status } from "../base/Player.js";
import { djinni_list } from "../initializers/djinni.js";
import { MainChar } from "../base/MainChar.js";

const START_TITLE_WINDOW_WIDTH = 76;
const INNER_TITLE_WINDOW_WIDTH = 60;
const AVATAR_SIZE = 32;
const FORWARD = 1;
const BACKWARD = -1;

export class BattleMenuScreen {
    constructor(game, data, enter_propagation_priority, esc_propagation_priority, on_abilities_choose, choose_targets) {
        this.game = game;
        this.data = data;
        this.on_abilities_choose = on_abilities_choose;
        this.choose_targets = choose_targets;
        this.chars_status_window = new CharsStatusWindow(this.game, this.data, true, true);
        this.start_buttons_keys = ["fight", "flee", "status"];
        this.shift_propagation_priority = 0;
        this.esc_propagation_priority = esc_propagation_priority;
        this.enter_propagation_priority = enter_propagation_priority;
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
        this.description_window = new DescriptionWindow(this.game);
        this.djinn_window = new DjinnWindow(this.game, this.data, this.esc_propagation_priority + 1, this.enter_propagation_priority + 1, this.shift_propagation_priority);
        this.psynergy_window = new PsynergyWindow(this.game, this.data, this.esc_propagation_priority + 1, this.enter_propagation_priority + 1);
        this.item_window = new ItemWindow(this.game, this.data, this.esc_propagation_priority + 1, this.enter_propagation_priority + 1);
        this.summon_window = new SummonWindow(this.game, this.data, this.esc_propagation_priority + 1, this.enter_propagation_priority + 1);
        this.group = this.game.add.group();
        this.avatar_sprite = this.group.create(0, numbers.GAME_HEIGHT - AVATAR_SIZE);
        this.avatar_sprite.alpha = 0;
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
    }

    start_button_press(index) {
        switch (this.start_buttons_keys[index]) {
            case "fight":
                this.start_horizontal_menu.close();
                let filtered_buttons = [];
                if (!Djinn.has_standby_djinn(MainChar.get_active_players(MAX_CHARS_IN_BATTLE))) {
                    filtered_buttons.push("summon");
                }
                this.current_buttons = this.inner_buttons_keys.filter(key => !filtered_buttons.includes(key));
                this.inner_horizontal_menu.mount_buttons(filtered_buttons);
                this.abilities = {};
                party_data.members.slice(0, MAX_CHARS_IN_BATTLE).forEach(char => {
                    this.abilities[char.key_name] = [];
                });
                this.djinni_already_used = ordered_elements.reduce((a,b) => (a[b] = 0, a), {});
                this.inner_horizontal_menu.open();
                let this_char = party_data.members[this.current_char_index];
                while (this_char.is_paralyzed() || this_char.has_permanent_status(permanent_status.DOWNED)) {
                    this.abilities[party_data.members[this.current_char_index].key_name].push({
                        key_name: "",
                        targets: []
                    });
                    ++this.current_char_index;
                    this_char = party_data.members[this.current_char_index];
                    if (this.current_char_index >= MAX_CHARS_IN_BATTLE || this.current_char_index >= party_data.members.length) {
                        this.current_char_index = 0;
                        this.on_abilities_choose(this.abilities);
                        break;
                    }
                }
                this.set_avatar();
        }
    }

    inner_button_press(index) {
        switch (this.current_buttons[index]) {
            case "attack":
                this.inner_horizontal_menu.deactivate(true);
                this.choose_targets("attack", "attack", targets => {
                    if (targets) {
                        this.abilities[party_data.members[this.current_char_index].key_name].push({
                            key_name: "attack",
                            targets: targets,
                            type: "attack"
                        });
                        this.inner_horizontal_menu.activate();
                        this.change_char(FORWARD);
                    } else {
                        this.inner_horizontal_menu.activate();
                    }
                }, party_data.members[this.current_char_index]);
                break;
            case "psynergy":
                this.on_ability_choose(this.psynergy_window, false, "psynergy");
                break;
            case "djinni":
                this.on_ability_choose(this.djinn_window, true, "djinni", this.psynergy_window);
                break
            case "summon":
                this.on_ability_choose(this.summon_window, true, "summon", this.djinni_already_used);
                break
            case "item":
                this.on_ability_choose(this.item_window, false, "item");
                break
            case "defend":
                this.inner_horizontal_menu.deactivate(true);
                this.choose_targets("defend", "defend", targets => {
                    if (targets) {
                        this.abilities[party_data.members[this.current_char_index].key_name].push({
                            key_name: "defend",
                            targets: targets,
                            type: "defend"
                        });
                        this.inner_horizontal_menu.activate();
                        this.change_char(FORWARD);
                    } else {
                        this.inner_horizontal_menu.activate();
                    }
                }, party_data.members[this.current_char_index]);
                break
        }
    }

    on_ability_choose(window, description_on_top, action_type, ...args) {
        this.inner_horizontal_menu.deactivate(true);
        this.description_window.open(description_on_top);
        window.open(party_data.members[this.current_char_index], (ability, item_obj) => {
            if (ability) {
                let djinn_key_name;
                if (action_type === "djinni" && djinni_list[ability].status === djinn_status.STANDBY) {
                    djinn_key_name = ability;
                    ability = "set_djinn";
                } else if (action_type === "summon") {
                    const requirements = _.find(this.data.summons_db, {key_name: ability}).requirements;
                    this.djinni_already_used = _.mapValues(this.djinni_already_used, (value, elem) => {
                        return value + requirements[elem];
                    });
                }
                this.description_window.hide();
                this.choose_targets(ability, action_type, targets => {
                    if (targets) {
                        this.abilities[party_data.members[this.current_char_index].key_name].push({
                            key_name: ability,
                            targets: targets,
                            type: action_type,
                            djinn_key_name: djinn_key_name
                        });
                        window.close();
                        this.description_window.close();
                        this.inner_horizontal_menu.activate();
                        this.change_char(FORWARD);
                    } else {
                        this.description_window.show();
                        window.show();
                    }
                }, party_data.members[this.current_char_index], item_obj);
            } else {
                if (window.is_open()) {
                    window.close();
                }
                this.description_window.close();
                this.inner_horizontal_menu.activate();
            }
        }, this.description_window.set_description.bind(this.description_window), ...args);
    }

    change_char(step, pop_ability = false) {
        const before_char = party_data.members[this.current_char_index];
        const abilities_count = this.abilities[before_char.key_name].length;
        if (before_char.turns === abilities_count || !abilities_count) {
            this.current_char_index += step;
        }
        if (this.current_char_index >= MAX_CHARS_IN_BATTLE || this.current_char_index >= party_data.members.length) {
            this.current_char_index = 0;
            this.on_abilities_choose(this.abilities);
        } else if (this.current_char_index >= 0) {
            const next_char = party_data.members[this.current_char_index];
            if (pop_ability) {
                const ability_info = this.abilities[next_char.key_name].pop();
                if (ability_info.type === "summon") {
                    const requirements = _.find(this.data.summons_db, {key_name: ability_info.key_name}).requirements;
                    this.djinni_already_used = _.mapValues(this.djinni_already_used, (value, elem) => {
                        return value - requirements[elem];
                    });
                }
            }
            if (next_char.is_paralyzed() || next_char.has_permanent_status(permanent_status.DOWNED)) {
                this.change_char(step, pop_ability);
            } else {
                this.set_avatar();
                this.inner_horizontal_menu.close(undefined, false);
                this.inner_horizontal_menu.open();
            }
        } else {
            this.current_char_index = 0;
            this.inner_menu_cancel();
        }
    }

    set_avatar() {
        this.avatar_sprite.alpha = 1;
        this.avatar_sprite.loadTexture("avatars", party_data.members[this.current_char_index].key_name);
    }

    hide_avatar() {
        this.avatar_sprite.alpha = 0;
    }

    inner_menu_cancel() {
        const char_key_name = party_data.members[this.current_char_index].key_name;
        if (this.current_char_index > 0 || this.abilities[char_key_name].length === 1) {
            this.change_char(BACKWARD, true);
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
        this.hide_avatar();
        this.start_horizontal_menu.close();
        this.inner_horizontal_menu.close();
    }

    destroy_menu() {
        this.chars_status_window.destroy();
        this.inner_horizontal_menu.destroy();
        this.start_horizontal_menu.destroy();
        this.description_window.destroy();
        this.djinn_window.destroy();
        this.psynergy_window.destroy();
        this.item_window.destroy();
        this.summon_window.destroy();
        this.group.destroy();
    }
}
