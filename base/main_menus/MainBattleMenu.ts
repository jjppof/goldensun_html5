import {CharsStatusWindow} from "../windows/CharsStatusWindow";
import {capitalize, ordered_elements} from "../utils";
import * as numbers from "../magic_numbers";
import {djinn_status} from "../Djinn";
import {BattleDescriptionWindow} from "../windows/battle/BattleDescriptionWindow";
import {BattlePsynergyWindow} from "../windows/battle/BattlePsynergyWindow";
import {BattleDjinnWindow} from "../windows/battle/BattleDjinnWindow";
import {BattleItemWindow} from "../windows/battle/BattleItemWindow";
import {BattleSummonWindow} from "../windows/battle/BattleSummonWindow";
import {Battle} from "../battle/Battle";
import {permanent_status} from "../Player";
import {ItemSlot, MainChar} from "../MainChar";
import {GoldenSun} from "../GoldenSun";
import * as _ from "lodash";
import {Enemy} from "../Enemy";
import {HorizontalMenu} from "../support_menus/HorizontalMenu";
import {Target} from "../battle/BattleStage";
import {BattleStatusWindow} from "../windows/battle/BattleStatusWindow";
import {ability_categories} from "../Ability";

const START_TITLE_WINDOW_WIDTH = 76;
const INNER_TITLE_WINDOW_WIDTH = 60;

const FORWARD = 1;
const BACKWARD = -1;

export type PlayerAbility = {
    key_name: string;
    targets: Target[];
    djinn_key_name?: string;
    speed?: number;
    caster?: Enemy | MainChar;
    caster_battle_key?: string;
    battle_animation_key?: string;
    item_slot?: ItemSlot;
};

export type PlayerAbilities = {[char_key_name: string]: PlayerAbility[]};

export class MainBattleMenu {
    public game: Phaser.Game;
    public data: GoldenSun;
    public on_abilities_choose: Function;
    public choose_targets: Function;

    public start_buttons_keys: string[];
    public start_horizontal_menu: HorizontalMenu;

    public inner_buttons_keys: string[];
    public inner_horizontal_menu: HorizontalMenu;

    public chars_status_window: CharsStatusWindow;
    public description_window: BattleDescriptionWindow;
    public djinn_window: BattleDjinnWindow;
    public psynergy_window: BattlePsynergyWindow;
    public item_window: BattleItemWindow;
    public summon_window: BattleSummonWindow;
    public status_window: BattleStatusWindow;

    public group: Phaser.Group;
    public avatar_sprite: Phaser.Sprite;

    public abilities: PlayerAbilities;
    public current_char_index: number;
    public current_buttons: string[];
    public djinni_already_used: {[element: string]: number};

    constructor(
        game: Phaser.Game,
        data: GoldenSun,
        on_abilities_choose: Function,
        choose_targets: Function,
        can_escape: boolean
    ) {
        this.game = game;
        this.data = data;
        this.on_abilities_choose = on_abilities_choose;
        this.choose_targets = choose_targets;

        this.start_buttons_keys = ["fight", "flee", "status"];
        if (can_escape === false) {
            this.start_buttons_keys.splice(1, 1);
        }
        this.start_horizontal_menu = new HorizontalMenu(
            this.game,
            this.data,
            this.start_buttons_keys,
            this.start_buttons_keys.map(b => capitalize(b)),
            {on_press: this.start_button_press.bind(this)},
            START_TITLE_WINDOW_WIDTH,
            true
        );

        this.inner_buttons_keys = ["attack", "psynergy", "djinni", "summon", "item", "defend"];
        this.inner_horizontal_menu = new HorizontalMenu(
            this.game,
            this.data,
            this.inner_buttons_keys,
            this.inner_buttons_keys.map(b => capitalize(b)),
            {on_press: this.inner_button_press.bind(this), on_cancel: this.inner_menu_cancel.bind(this)},
            INNER_TITLE_WINDOW_WIDTH,
            true
        );

        this.chars_status_window = new CharsStatusWindow(this.game, this.data, true, true);
        this.description_window = new BattleDescriptionWindow(this.game);
        this.djinn_window = new BattleDjinnWindow(this.game, this.data);
        this.psynergy_window = new BattlePsynergyWindow(this.game, this.data);
        this.item_window = new BattleItemWindow(this.game, this.data);
        this.summon_window = new BattleSummonWindow(this.game, this.data);
        this.status_window = new BattleStatusWindow(this.game, this.data);

        this.group = this.game.add.group();
        this.avatar_sprite = this.group.create(0, numbers.GAME_HEIGHT - numbers.AVATAR_SIZE);
        this.avatar_sprite.alpha = 0;
    }

    start_button_press() {
        switch (this.start_buttons_keys[this.start_horizontal_menu.selected_button_index]) {
            case "fight":
                this.start_horizontal_menu.close(() => {
                    this.current_buttons = this.inner_buttons_keys;
                    this.abilities = {};
                    this.data.info.party_data.members.slice(0, Battle.MAX_CHARS_IN_BATTLE).forEach((char: MainChar) => {
                        this.abilities[char.key_name] = [];
                    });
                    this.djinni_already_used = ordered_elements.reduce((a, b) => ((a[b] = 0), a), {});
                    this.inner_horizontal_menu.open();
                    let this_char = this.data.info.party_data.members[this.current_char_index];
                    while (this_char.is_paralyzed() || this_char.has_permanent_status(permanent_status.DOWNED)) {
                        this.abilities[this.data.info.party_data.members[this.current_char_index].key_name].push({
                            key_name: "",
                            targets: [],
                        });
                        ++this.current_char_index;
                        this_char = this.data.info.party_data.members[this.current_char_index];
                        if (
                            this.current_char_index >= Battle.MAX_CHARS_IN_BATTLE ||
                            this.current_char_index >= this.data.info.party_data.members.length
                        ) {
                            this.current_char_index = 0;
                            this.on_abilities_choose(this.abilities);
                            break;
                        }
                    }
                    this.set_avatar();
                });
                break;
            case "status":
                this.start_horizontal_menu.close(() => {
                    this.status_window.open(this.data.info.party_data.members[0], () => {
                        this.start_horizontal_menu.open();
                    });
                });
        }
    }

    inner_button_press() {
        switch (this.current_buttons[this.inner_horizontal_menu.selected_button_index]) {
            case "attack":
                this.inner_horizontal_menu.deactivate(true);
                this.choose_targets(
                    "attack",
                    "attack",
                    (targets: Target[]) => {
                        if (targets) {
                            this.abilities[this.data.info.party_data.members[this.current_char_index].key_name].push({
                                key_name: "attack",
                                targets: targets,
                            });
                            this.inner_horizontal_menu.activate();
                            this.change_char(FORWARD);
                        } else {
                            this.inner_horizontal_menu.activate();
                        }
                    },
                    this.data.info.party_data.members[this.current_char_index]
                );
                break;
            case "psynergy":
                this.on_ability_choose(this.psynergy_window, false, "psynergy");
                break;
            case "djinni":
                this.on_ability_choose(this.djinn_window, true, "djinni", this.psynergy_window);
                break;
            case "summon":
                this.on_ability_choose(this.summon_window, true, "summon", this.djinni_already_used);
                break;
            case "item":
                this.on_ability_choose(this.item_window, false, "item");
                break;
            case "defend":
                this.inner_horizontal_menu.deactivate(true);
                this.choose_targets(
                    "defend",
                    "defend",
                    (targets: Target[]) => {
                        if (targets) {
                            this.abilities[this.data.info.party_data.members[this.current_char_index].key_name].push({
                                key_name: "defend",
                                targets: targets,
                            });
                            this.inner_horizontal_menu.activate();
                            this.change_char(FORWARD);
                        } else {
                            this.inner_horizontal_menu.activate();
                        }
                    },
                    this.data.info.party_data.members[this.current_char_index]
                );
                break;
        }
    }

    on_ability_choose(
        window: BattlePsynergyWindow | BattleDjinnWindow | BattleItemWindow | BattleSummonWindow,
        description_on_top: boolean,
        action_type: string,
        ...args: any[]
    ) {
        this.inner_horizontal_menu.deactivate(true);
        this.description_window.open(description_on_top);

        window.open(
            this.data.info.party_data.members[this.current_char_index],
            (ability: string, item_slot: ItemSlot) => {
                if (ability) {
                    let summon_used_djinn: {[element: string]: number} = null;
                    let djinn_key_name: string;

                    if (
                        action_type === "djinni" &&
                        this.data.info.djinni_list[ability].status === djinn_status.STANDBY
                    ) {
                        djinn_key_name = ability;
                        ability = "set_djinn";
                    } else if (action_type === "summon") {
                        const requirements = this.data.info.summons_list[ability].requirements;
                        summon_used_djinn = _.mapValues(this.djinni_already_used, (value, elem) => {
                            return value + requirements[elem];
                        });

                        this.djinni_already_used = summon_used_djinn;
                    }

                    this.description_window.hide();
                    this.choose_targets(
                        ability,
                        action_type,
                        (targets: Target[]) => {
                            if (targets) {
                                this.abilities[
                                    this.data.info.party_data.members[this.current_char_index].key_name
                                ].push({
                                    key_name: ability,
                                    targets: targets,
                                    djinn_key_name: djinn_key_name,
                                    item_slot: item_slot,
                                });

                                window.close();
                                this.description_window.close();
                                this.inner_horizontal_menu.activate();
                                this.change_char(FORWARD);
                            } else {
                                if (summon_used_djinn) {
                                    this.djinni_already_used = _.mapValues(this.djinni_already_used, (value, elem) => {
                                        return value - summon_used_djinn[elem];
                                    });
                                }

                                this.description_window.show();
                                window.show();
                            }
                        },
                        this.data.info.party_data.members[this.current_char_index],
                        item_slot
                    );
                } else {
                    if (window.window_open) {
                        window.close();
                    }

                    this.description_window.close();
                    this.inner_horizontal_menu.activate();
                }
            },
            this.description_window.set_description.bind(this.description_window),
            ...args
        );
    }

    change_char(step: number, pop_ability: boolean = false) {
        const before_char = this.data.info.party_data.members[this.current_char_index];
        const abilities_count = this.abilities[before_char.key_name].length;
        if (before_char.turns === abilities_count || !abilities_count) {
            this.current_char_index += step;
        }
        if (
            this.current_char_index >= Battle.MAX_CHARS_IN_BATTLE ||
            this.current_char_index >= this.data.info.party_data.members.length
        ) {
            this.current_char_index = 0;
            this.on_abilities_choose(this.abilities);
        } else if (this.current_char_index >= 0) {
            const next_char = this.data.info.party_data.members[this.current_char_index];
            if (pop_ability) {
                const ability_info = this.abilities[next_char.key_name].pop();
                if (
                    this.data.info.abilities_list[ability_info.key_name].ability_category === ability_categories.SUMMON
                ) {
                    const requirements = this.data.info.summons_list[ability_info.key_name].requirements;
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
        this.avatar_sprite.loadTexture("avatars", this.data.info.party_data.members[this.current_char_index].key_name);
    }

    hide_avatar() {
        this.avatar_sprite.alpha = 0;
    }

    inner_menu_cancel() {
        const char_key_name = this.data.info.party_data.members[this.current_char_index].key_name;
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
