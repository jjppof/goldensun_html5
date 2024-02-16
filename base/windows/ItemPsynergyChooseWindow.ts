import {Window, TextObj} from "../Window";
import * as numbers from "../magic_numbers";
import {GoldenSun} from "../GoldenSun";
import {Button} from "../XGamepad";
import {ItemSlot, MainChar} from "../MainChar";
import {CursorManager, PointVariants} from "../utils/CursorManager";
import {Ability, ability_types} from "../Ability";
import {BattleFormulas} from "../battle/BattleFormulas";
import {main_stats, permanent_status} from "../Player";
import {Effect, effect_types} from "../Effect";
import * as _ from "lodash";
import {Item} from "../Item";

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

const CURSOR_X = 98;
const CURSOR_Y = 42;
const CURSOR_GAP = 16;

const HORIZONTAL_LOOP_TIME = 300;
const SHOULDER_LOOP_TIME = 200;

const SEPARATOR_X0 = 4;
const SEPARATOR_X1 = PSY_OVERVIEW_WIN_WIDTH;
const SEPARATOR_Y0 = 91;
const SEPARATOR_Y1 = 91;

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

    public element_list: {[key: string]: Ability | Item};
    public element_sprite_key: string;

    public window: Window;

    public window_open: boolean;
    public window_activated: boolean;
    public setting_shortcut: boolean;
    public close_callback: () => void;
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
        this.window.set_canvas_update();

        this.window_open = false;
        this.window_activated = false;
        this.close_callback = undefined;
        this.char = null;
        this.char_select_controls_sprites = [
            this.window.create_at_group(9, 97, "keyboard_buttons", {color: 0x0, frame: "l_button"}),
            this.window.create_at_group(8, 96, "keyboard_buttons", {frame: "l_button"}),
            this.window.create_at_group(24, 97, "keyboard_buttons", {color: 0x0, frame: "r_button"}),
            this.window.create_at_group(23, 96, "keyboard_buttons", {frame: "r_button"}),
        ];
        const sprite_pair = this.window.set_text_in_position(": Change Char", 40, 96);
        this.char_select_controls_sprites.push(sprite_pair.text, sprite_pair.shadow);

        this.window.draw_separator(SEPARATOR_X0, SEPARATOR_Y0, SEPARATOR_X1, SEPARATOR_Y1, false);

        this.page_index = 0;
        this.page_number = 0;

        this.text_sprites_in_window = [];
        this.icon_sprites_in_window = [];

        this.selected_element_index = 0;
        this.elements = [];
        this.selected_element_tween = null;

        this.highlight_bar = this.game.add.graphics(0, 0);
        this.highlight_bar.blendMode = PIXI.blendModes.SCREEN;
        this.window.add_sprite_to_window_group(this.highlight_bar);

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
        return this.is_psynergy_window ? (this.elements[index] as string) : (this.elements[index] as ItemSlot).key_name;
    }

    /*Sets the total page number*/
    set_page_number() {
        let list_length: number;
        if (this.is_psynergy_window) {
            list_length = this.char.abilities.filter(elem_key_name => {
                const ability = this.element_list[elem_key_name] as Ability;
                return (
                    elem_key_name in this.element_list &&
                    (ability.is_field_psynergy || (!this.setting_shortcut && ability.effects_outside_battle))
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

    /*Adds the items/psynergies to the window*/
    set_elements() {
        this.clear_sprites();
        this.item_objs = [];
        if (this.is_psynergy_window) {
            this.elements = this.char.abilities
                .filter(elem_key_name => {
                    const ability = this.element_list[elem_key_name] as Ability;
                    return (
                        elem_key_name in this.element_list &&
                        (ability.is_field_psynergy || (!this.setting_shortcut && ability.effects_outside_battle))
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
            const element = this.element_list[elem_key_name as string];
            const x = ELEM_PADDING_LEFT;
            const y = ELEM_PADDING_TOP + i * (numbers.ICON_HEIGHT + SPACE_BETWEEN_ITEMS);

            const icon_x = x + (numbers.ICON_WIDTH >> 1);
            const icon_y = y + (numbers.ICON_HEIGHT >> 1);

            const x_elem_name = ELEM_PADDING_LEFT + numbers.ICON_WIDTH + (this.is_psynergy_window ? 2 : 4);
            this.text_sprites_in_window.push(
                this.window.set_text_in_position(element.name, x_elem_name, y + ELEM_NAME_ICON_SHIFT, {
                    color:
                        this.is_psynergy_window && this.char.current_pp < (element as Ability).pp_cost
                            ? numbers.RED_FONT_COLOR
                            : undefined,
                })
            );

            if (this.is_psynergy_window) {
                this.icon_sprites_in_window.push(
                    this.window.create_at_group(icon_x, icon_y, this.element_sprite_key, {frame: elem_key_name})
                );
                (this.icon_sprites_in_window[i] as Phaser.Sprite).anchor.setTo(0.5, 0.5);
            } else {
                const internal_group_key = `${elem_key_name}/${this.item_objs[i].index}`;
                const group = this.window.define_internal_group(internal_group_key);
                group.data["internal_group_key"] = internal_group_key;
                this.icon_sprites_in_window.push(group);
                const item = this.data.info.items_list[this.item_objs[i].key_name];
                this.window.make_item_obj(
                    elem_key_name as string,
                    {x: 0, y: 0},
                    {
                        broken: this.item_objs[i].broken,
                        equipped: this.item_objs[i].equipped,
                        quantity: item.carry_up_to_30 ? this.item_objs[i].quantity : undefined,
                        internal_group: internal_group_key,
                        center: true,
                    }
                );
                group.x = icon_x;
                group.y = icon_y;
            }
            if (this.is_psynergy_window) {
                const x_elem_pp_cost = PSY_PP_X;
                this.text_sprites_in_window.push(
                    this.window.set_text_in_position(
                        (element as Ability).pp_cost.toString(),
                        x_elem_pp_cost,
                        y + ELEM_NAME_ICON_SHIFT,
                        {
                            right_align: true,
                            color:
                                this.char.current_pp < (element as Ability).pp_cost
                                    ? numbers.RED_FONT_COLOR
                                    : undefined,
                        }
                    )
                );
            }
        }
    }

    /** Shows and positions the highlight bar. */
    set_highlight_bar() {
        this.highlight_bar.visible = true;
        this.highlight_bar.y =
            ELEM_PADDING_TOP + this.selected_element_index * (numbers.ICON_HEIGHT + SPACE_BETWEEN_ITEMS) + 4;
    }

    /** Hides the highlight bar. */
    unset_highlight_bar() {
        this.highlight_bar.visible = false;
    }

    /** Sets the scaling effect for the selected item. */
    set_element_tween(index: number) {
        this.window.group.bringToTop(this.icon_sprites_in_window[index]);
        this.selected_element_tween = this.game.add
            .tween(this.icon_sprites_in_window[index].scale)
            .to({x: 1.6, y: 1.6}, Phaser.Timer.QUARTER, Phaser.Easing.Linear.None, true, 0, -1, true);
    }

    /** Stops the scaling effect. */
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
            if (this.is_psynergy_window) {
                this.window.remove_from_this_window(this.icon_sprites_in_window[i]);
            } else {
                this.window.destroy_internal_group(this.icon_sprites_in_window[i].data.internal_group_key);
            }
        }
        this.icon_sprites_in_window = [];
        for (let i = 0; i < this.text_sprites_in_window.length; ++i) {
            this.window.destroy_text_obj(this.text_sprites_in_window[i]);
        }
        this.text_sprites_in_window = [];
    }

    /*Enables control keys for this menu*/
    grant_control(
        on_cancel: Function,
        on_select: Function,
        next_char?: Function,
        previous_char?: Function,
        confirm_sfx?: string
    ) {
        const controls = [
            {buttons: Button.LEFT, on_down: this.previous_page.bind(this), sfx: {down: "menu/move"}},
            {buttons: Button.RIGHT, on_down: this.next_page.bind(this), sfx: {down: "menu/move"}},
            {buttons: Button.UP, on_down: this.previous_element.bind(this), sfx: {down: "menu/move"}},
            {buttons: Button.DOWN, on_down: this.next_element.bind(this), sfx: {down: "menu/move"}},
            {buttons: Button.A, on_down: on_select, sfx: {down: confirm_sfx ? confirm_sfx : "menu/positive"}},
            {buttons: Button.B, on_down: on_cancel, sfx: {down: "menu/negative"}},
            {buttons: Button.L, on_down: previous_char, sfx: {down: "menu/positive"}},
            {buttons: Button.R, on_down: next_char, sfx: {down: "menu/positive"}},
        ];

        this.data.control_manager.add_controls(controls, {
            loop_config: {
                vertical: true,
                horizontal: true,
                horizontal_time: HORIZONTAL_LOOP_TIME,
                shoulder: true,
                shoulder_time: SHOULDER_LOOP_TIME,
            },
        });
    }

    set_description_window_text(
        description_window: Window,
        description_window_text: TextObj,
        description: string,
        tween_if_necessary: boolean = false
    ) {
        if (description_window.text_tween) {
            description_window.clean_text_tween();
            description_window.reset_text_position(description_window_text);
        }
        description_window.update_text(description, description_window_text);
        const pratical_text_width =
            ((numbers.TOTAL_BORDER_WIDTH + numbers.WINDOW_PADDING_H) << 1) + description_window_text.text.width + 1;
        if (tween_if_necessary && pratical_text_width > numbers.GAME_WIDTH) {
            description_window.bring_border_to_top();
            const shift = -(
                description_window_text.text.width -
                numbers.GAME_WIDTH +
                numbers.TOTAL_BORDER_WIDTH +
                numbers.WINDOW_PADDING_H
            );
            description_window.tween_text_horizontally(description_window_text, shift);
        }
    }

    cast_ability(
        caster: MainChar,
        dest_char: MainChar,
        ability: Ability,
        description_window: Window,
        description_window_text: TextObj
    ) {
        if (ability.type === ability_types.HEALING) {
            const value = BattleFormulas.get_damage(ability, caster, dest_char, 1);
            const current_prop = ability.affects_pp ? main_stats.CURRENT_PP : main_stats.CURRENT_HP;
            const max_prop = ability.affects_pp ? main_stats.MAX_PP : main_stats.MAX_HP;
            if (dest_char.has_permanent_status(permanent_status.DOWNED)) {
                this.set_description_window_text(
                    description_window,
                    description_window_text,
                    `${dest_char.name} is downed!`
                );
                return false;
            } else if (dest_char[max_prop] > dest_char[current_prop]) {
                dest_char.current_hp = _.clamp(dest_char[current_prop] - value, 0, dest_char[max_prop]);
                if (dest_char[max_prop] === dest_char[current_prop]) {
                    this.set_description_window_text(
                        description_window,
                        description_window_text,
                        "You recovered all HP!"
                    );
                } else {
                    this.set_description_window_text(
                        description_window,
                        description_window_text,
                        `You recovered ${-value}HP!`
                    );
                }
                return true;
            } else {
                this.set_description_window_text(
                    description_window,
                    description_window_text,
                    `Your ${ability.affects_pp ? "PP" : "HP"} is maxed out!`
                );
                return false;
            }
        } else if (ability.type === ability_types.EFFECT_ONLY) {
            const extra_stat_label_map = {
                [effect_types.EXTRA_ATTACK]: "ATK",
                [effect_types.EXTRA_DEFENSE]: "DEF",
                [effect_types.EXTRA_AGILITY]: "AGI",
                [effect_types.EXTRA_LUCK]: "LUK",
                [effect_types.EXTRA_MAX_HP]: "HP",
                [effect_types.EXTRA_MAX_PP]: "PP",
            };
            const status_label_map = {
                [permanent_status.DOWNED]: "downed",
                [permanent_status.POISON]: "poisoned",
                [permanent_status.VENOM]: "poisoned",
                [permanent_status.EQUIP_CURSE]: "cursed",
                [permanent_status.HAUNT]: "haunted",
            };
            const stats_boosted = [];
            const status_removed = {removed: [], not_removed: []};
            for (let i = 0; i < ability.effects.length; ++i) {
                const effect_obj = ability.effects[i];
                switch (effect_obj.type) {
                    case effect_types.EXTRA_ATTACK:
                    case effect_types.EXTRA_DEFENSE:
                    case effect_types.EXTRA_AGILITY:
                    case effect_types.EXTRA_LUCK:
                    case effect_types.EXTRA_MAX_HP:
                    case effect_types.EXTRA_MAX_PP:
                        stats_boosted.push(extra_stat_label_map[effect_obj.type]);
                        this.data.audio.play_se_pausing_bgm("misc/stat_boost");
                    case effect_types.CURRENT_HP:
                    case effect_types.CURRENT_PP:
                        dest_char.add_effect(effect_obj, ability, true);
                        dest_char.update_attributes();
                        break;
                    case effect_types.PERMANENT_STATUS:
                        if (!effect_obj.add_status) {
                            if (dest_char.has_permanent_status(effect_obj.status_key_name)) {
                                Effect.remove_status_from_player(effect_obj, dest_char);
                                status_removed.removed.push(status_label_map[effect_obj.status_key_name]);
                                this.play_status_removed_sfx(effect_obj.status_key_name);
                            } else {
                                status_removed.not_removed.push(status_label_map[effect_obj.status_key_name]);
                            }
                        }
                        break;
                }
            }
            let stats_description = "";
            let status_description = "";
            if (stats_boosted.length) {
                stats_description = `Your ${stats_boosted.join("/")} increased!`;
            }
            if (status_removed.removed.length || status_removed.not_removed.length) {
                if (status_removed.removed.length) {
                    status_description = `${dest_char.name} is not ${_.uniq(status_removed.removed).join(
                        "/"
                    )} anymore!`;
                } else {
                    if (!stats_boosted.length) {
                        this.set_description_window_text(
                            description_window,
                            description_window_text,
                            `${dest_char.name} is not ${_.uniq(status_removed.not_removed).join("/")}.`
                        );
                        return false;
                    }
                }
            }
            const description = `${stats_description} ${status_description}`.trim();
            if (description) {
                this.set_description_window_text(description_window, description_window_text, description, true);
                return true;
            }
        }
        this.set_description_window_text(
            description_window,
            description_window_text,
            "This ability can't be used here."
        );
        return false;
    }

    play_status_removed_sfx(status: permanent_status) {
        switch (status) {
            case permanent_status.DOWNED:
                this.data.audio.play_se_pausing_bgm("psynergy/revive");
                break;
            case permanent_status.VENOM:
            case permanent_status.POISON:
                this.data.audio.play_se_pausing_bgm("psynergy/ply");
                break;
            default:
                this.data.audio.play_se("battle/heal_1");
        }
    }

    get_sfx_on_ability_cast(ability: Ability, dest_char: MainChar, positive_sfx: string, unsuccessful_sfx: string) {
        if (ability.type === ability_types.HEALING) {
            // check if HP/PP is full when using healing item. Healing sfx replaces menu/positive
            const current_prop = ability.affects_pp ? main_stats.CURRENT_PP : main_stats.CURRENT_HP;
            const max_prop = ability.affects_pp ? main_stats.MAX_PP : main_stats.MAX_HP;
            if (current_prop == main_stats.CURRENT_HP && dest_char[current_prop] <= 0) return unsuccessful_sfx;
            if (dest_char[max_prop] <= dest_char[current_prop]) return unsuccessful_sfx;
            else return "battle/heal_1";
        } else if (ability.type === ability_types.EFFECT_ONLY) {
            // check if any of the effects are being used
            // menu/positive is played on top of effect sfx
            var perm_status_remover = false;
            var status_removed = false;
            for (let i = 0; i < ability.effects.length; ++i) {
                const effect_obj = ability.effects[i];
                if (effect_obj.type == effect_types.PERMANENT_STATUS && !effect_obj.add_status) {
                    // check if char has permanent status when using permanent status removal item
                    perm_status_remover = true;
                    status_removed ||= dest_char.has_permanent_status(effect_obj.status_key_name);
                }
            }
            if (perm_status_remover) {
                return status_removed ? positive_sfx : unsuccessful_sfx;
            } else {
                // for other effect types like stat boosters
                return positive_sfx;
            }
        } else {
            // for un-implemented ability types
            return positive_sfx;
        }
    }

    set_cursor_previous_pos() {
        this.move_cursor(CURSOR_X, CURSOR_Y + this.selected_element_index * CURSOR_GAP);
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
        this.window.group.visible = false;
    }

    /*Shows this window*/
    show() {
        this.window.group.visible = true;
    }

    /*Opens this window

    Input: char_index [number] = The selected character's party index
           close_callback [function] = Closing callback (Optional)
           open_callback [function] = Opening callback (Optional)*/
    open(
        char_index: number,
        close_callback?: () => void,
        open_callback?: () => void,
        pos?: {page: number; index: number},
        setting_shortcut?: boolean
    ) {
        this.char_index = char_index;
        this.char = this.data.info.party_data.members[char_index];
        this.setting_shortcut = setting_shortcut;

        this.page_index = pos ? pos.page : 0;
        this.set_page_number();
        this.char_select_controls_sprites.forEach(sprite => {
            sprite.visible = true;
        });
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
            sprite.visible = true;
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
            sprite.visible = false;
        });
    }
}
