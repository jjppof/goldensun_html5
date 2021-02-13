import {GoldenSun} from "../GoldenSun";
import {Button} from "../XGamepad";
import {equip_slots, MainChar} from "../MainChar";
import {ordered_status_menu} from "../Player";
import {CharsMenu, CharsMenuModes} from "../support_menus/CharsMenu";
import {TextObj, Window} from "../Window";
import {BattleStatusEffect} from "../windows/battle/BattleStatusWindow";
import * as _ from "lodash";
import {StatusComponent} from "../support_menus/StatusComponent";
import {MainStatusStatistics} from "../support_menus/MainStatusStatistics";
import {MainStatusDjinn} from "../support_menus/MainStatusDjinn";
import {MainStatusPsynergy} from "../support_menus/MainStatusPsynergy";
import {MainStatusItems} from "../support_menus/MainStatusItems";
import {FONT_NAME, ITALIC_FONT_NAME} from "../utils";

export enum MainStatusStates {
    CHARACTERS,
    DJINN,
    STATISTICS,
    PSYNERGY,
    ITEMS,
}

export class MainStatusMenu {
    private static readonly DESC_WIN = {
        X: 0,
        Y: 0,
        WIDTH: 236,
        HEIGHT: 36,
    };
    private static readonly EQUIP_WIN = {
        X: 0,
        Y: 80,
        WIDTH: 116,
        HEIGHT: 76,
    };
    private static readonly GUIDE_WIN = {
        X: 104,
        Y: 0,
        WIDTH: 132,
        HEIGHT: 36,
    };
    private static readonly MAIN_WIN = {
        X: 0,
        Y: 40,
        WIDTH: 236,
        HEIGHT: 116,
    };
    private static readonly NAME = {
        X: 48,
        Y: 8,
    };
    private static readonly CLASS_NAME = {
        X: 8,
        Y: 40,
    };
    private static readonly LEVEL = {
        LABEL_X1: 112,
        LABEL_Y1: 8,
        VALUE_END_X1: 149,
        VALUE_Y1: 8,
        LABEL_X2: 8,
        LABEL_Y2: 56,
        VALUE_END_X2: 45,
        VALUE_Y2: 56,
    };
    private static readonly AVATAR = {
        X: 8,
        Y: 8,
    };
    private static readonly GUIDE = {
        L: {X: 8, Y: 8},
        HIFEN: {X: 22, Y: 8},
        R: {X: 27, Y: 8},
        LR_TEXT: {X: 42, Y: 8},
        A: {X: 9, Y: 16},
        A_TEXT: {X: 19, Y: 16},
        SELECT: {X: 8, Y: 24},
        SELECT_TEXT: {X: 21, Y: 24},
    };
    private static readonly DESC = {
        LINE1: {X: 6, Y: 7},
        LINE2: {X: 6, Y: 21},
    };
    private static readonly DESC_GUIDE = {
        L: {X: 88, Y: 24},
        HIFEN: {X: 102, Y: 24},
        R: {X: 107, Y: 24},
        LR_TEXT: {X: 122, Y: 24},
        A: {X: 9, Y: 24},
        A_TEXT: {X: 19, Y: 24},
    };
    private static readonly EQUIP_TEXT = {
        LABEL: {X: 8, Y: 8},
        NAME: {X: 16, Y: 16},
        SHIFT: 16,
    };

    private static readonly StateComponent = {
        [MainStatusStates.CHARACTERS]: 0,
        [MainStatusStates.DJINN]: 2,
        [MainStatusStates.STATISTICS]: 0,
        [MainStatusStates.PSYNERGY]: 1,
        [MainStatusStates.ITEMS]: 3,
    };
    private static readonly AdvanceState = {
        [MainStatusStates.CHARACTERS]: MainStatusStates.STATISTICS,
        [MainStatusStates.STATISTICS]: MainStatusStates.PSYNERGY,
        [MainStatusStates.PSYNERGY]: MainStatusStates.ITEMS,
        [MainStatusStates.ITEMS]: MainStatusStates.STATISTICS,
    };
    private static readonly FONTS = {
        NORMAL: FONT_NAME,
        ITALIC: ITALIC_FONT_NAME,
    };

    private static readonly GROUP_KEY = "main_status";
    private static readonly DESC_GUIDE_KEY = "desc_guide";
    private static readonly MAX_EFFECTS_DISPLAYED = 4;

    private game: Phaser.Game;
    private data: GoldenSun;

    private chars_menu: CharsMenu;

    private main_window: Window;
    private guide_window: Window;
    private desc_window: Window;
    private equip_window: Window;

    private components: StatusComponent[];
    private current_state: MainStatusStates;
    private current_component: StatusComponent;
    private selected_char: MainChar;

    private menu_open: boolean;
    private close_callback: Function;

    private avatar: Phaser.Sprite;
    private name: TextObj;
    private level_label: TextObj;
    private level_value: TextObj;
    private class_name: TextObj;

    private l_button: {sprite: Phaser.Sprite; shadow: Phaser.Sprite};
    private r_button: {sprite: Phaser.Sprite; shadow: Phaser.Sprite};
    private a_button: {sprite: Phaser.Sprite; shadow: Phaser.Sprite};
    private select_button: {sprite: Phaser.Sprite; shadow: Phaser.Sprite};
    private hifen: TextObj;
    private lr_text: TextObj;
    private a_text: TextObj;
    private select_text: TextObj;

    private desc_line1: TextObj;
    private desc_line2: TextObj;
    private desc_guide_a_text: TextObj;

    private eq_weapon_name: TextObj;
    private eq_shield_name: TextObj;
    private eq_chest_name: TextObj;
    private eq_head_name: TextObj;

    private battle_effects: BattleStatusEffect[];
    private active_sprites: (Phaser.Sprite | Phaser.BitmapText)[];
    private eq_highlight: Phaser.Graphics;

    public constructor(game: Phaser.Game, data: GoldenSun) {
        this.game = game;
        this.data = data;

        this.chars_menu = new CharsMenu(this.game, this.data, this.on_character_change.bind(this));
        this.main_window = new Window(
            this.game,
            MainStatusMenu.MAIN_WIN.X,
            MainStatusMenu.MAIN_WIN.Y,
            MainStatusMenu.MAIN_WIN.WIDTH,
            MainStatusMenu.MAIN_WIN.HEIGHT
        );

        this.guide_window = new Window(
            this.game,
            MainStatusMenu.GUIDE_WIN.X,
            MainStatusMenu.GUIDE_WIN.Y,
            MainStatusMenu.GUIDE_WIN.WIDTH,
            MainStatusMenu.GUIDE_WIN.HEIGHT
        );
        this.desc_window = new Window(
            this.game,
            MainStatusMenu.DESC_WIN.X,
            MainStatusMenu.DESC_WIN.Y,
            MainStatusMenu.DESC_WIN.WIDTH,
            MainStatusMenu.DESC_WIN.HEIGHT
        );
        this.equip_window = new Window(
            this.game,
            MainStatusMenu.EQUIP_WIN.X,
            MainStatusMenu.EQUIP_WIN.Y,
            MainStatusMenu.EQUIP_WIN.WIDTH,
            MainStatusMenu.EQUIP_WIN.HEIGHT
        );

        this.desc_window.define_internal_group(MainStatusMenu.DESC_GUIDE_KEY);
        this.main_window.define_internal_group(MainStatusMenu.GROUP_KEY);
        this.guide_window.define_internal_group(MainStatusMenu.GROUP_KEY);
        this.equip_window.define_internal_group(MainStatusMenu.GROUP_KEY);

        this.components = [
            new MainStatusStatistics(this.game, this.data, this.main_window, this),
            new MainStatusPsynergy(this.game, this.data, this.main_window, this),
            new MainStatusDjinn(this.game, this.data, this.main_window, this),
            new MainStatusItems(this.game, this.data, this.main_window, this),
        ];

        this.eq_highlight = this.game.add.graphics(0, 0);
        this.eq_highlight.blendMode = PIXI.blendModes.SCREEN;
        this.equip_window.add_to_internal_group(MainStatusMenu.GROUP_KEY, this.eq_highlight);

        this.current_state = null;
        this.current_component = null;
        this.selected_char = null;
        this.menu_open = false;

        this.active_sprites = [];
    }

    public get selected_character() {
        return this.selected_char;
    }

    public get battle_effects_array() {
        return this.battle_effects;
    }

    public get state() {
        return this.current_state;
    }

    public get is_open() {
        return this.menu_open;
    }

    private set_battle_effects() {
        const effects = [];
        const status_effects = _.sortBy(
            [...this.data.info.main_char_list[this.selected_char.key_name].permanent_status],
            s => ordered_status_menu.indexOf(s)
        );

        for (let index in status_effects) {
            const effect: BattleStatusEffect = {key: null, properties: null};

            effect.key = status_effects[index];
            if (effects.length < MainStatusMenu.MAX_EFFECTS_DISPLAYED) effects.push(effect);
        }

        this.battle_effects = effects;
    }

    public update_description(line1: string, line2?: string) {
        if (!this.desc_window.open) return;
        const text2 = line2 !== undefined ? line2 : "";

        const desc_win_group = this.desc_window.get_internal_group(MainStatusMenu.DESC_GUIDE_KEY);
        const desc_guide_states = [MainStatusStates.STATISTICS, MainStatusStates.PSYNERGY, MainStatusStates.ITEMS];

        if (text2 === "" && desc_guide_states.includes(this.current_state)) {
            const next_state = MainStatusMenu.AdvanceState[this.current_state];
            let next_state_name = MainStatusStates[next_state].toLowerCase();
            next_state_name = next_state_name.charAt(0).toUpperCase() + next_state_name.slice(1);

            const guide_a_txt = ": " + next_state_name;
            this.desc_window.update_text(guide_a_txt, this.desc_guide_a_text);

            if (!desc_win_group.visible) desc_win_group.visible = true;
        } else {
            if (desc_win_group.visible) desc_win_group.visible = false;
        }

        let font = MainStatusMenu.FONTS.NORMAL;
        if (this.current_state === MainStatusStates.STATISTICS) {
            font = MainStatusMenu.FONTS.ITALIC;
        }

        this.desc_line1.text.font = font;
        this.desc_line1.shadow.font = font;
        this.desc_line2.text.font = font;
        this.desc_line2.shadow.font = font;

        this.desc_window.update_text(line1, this.desc_line1);
        this.desc_window.update_text(text2, this.desc_line2);
    }

    private toggle_guide_win() {
        this.l_button.shadow.visible = !this.l_button.shadow.visible;
        this.r_button.shadow.visible = !this.r_button.shadow.visible;
        this.a_button.shadow.visible = !this.a_button.shadow.visible;

        this.l_button.sprite.visible = !this.l_button.sprite.visible;
        this.r_button.sprite.visible = !this.r_button.sprite.visible;
        this.a_button.sprite.visible = !this.a_button.sprite.visible;

        this.hifen.shadow.visible = !this.hifen.shadow.visible;
        this.lr_text.shadow.visible = !this.lr_text.shadow.visible;
        this.a_text.shadow.visible = !this.a_text.shadow.visible;

        this.hifen.text.visible = !this.hifen.text.visible;
        this.lr_text.text.visible = !this.lr_text.text.visible;
        this.a_text.text.visible = !this.a_text.text.visible;

        const new_text = this.select_text.text.text === ": Return" ? ": Djinn  list" : ": Return";
        this.guide_window.update_text(new_text, this.select_text);
    }

    private check_main_components() {
        if (this.current_state === MainStatusStates.DJINN) {
            this.main_window.get_internal_group(MainStatusMenu.GROUP_KEY).visible = false;
        } else {
            let label_x = 0;
            let label_y = 0;

            let value_end_x = 0;
            let value_y = 0;

            let label = "";
            if ([MainStatusStates.CHARACTERS, MainStatusStates.STATISTICS].includes(this.current_state)) {
                label_x = MainStatusMenu.LEVEL.LABEL_X1;
                label_y = MainStatusMenu.LEVEL.LABEL_Y1;

                value_end_x = MainStatusMenu.LEVEL.VALUE_END_X1;
                value_y = MainStatusMenu.LEVEL.VALUE_Y1;

                label = "Lv";
            } else {
                label_x = MainStatusMenu.LEVEL.LABEL_X2;
                label_y = MainStatusMenu.LEVEL.LABEL_Y2;

                value_end_x = MainStatusMenu.LEVEL.VALUE_END_X2;
                value_y = MainStatusMenu.LEVEL.VALUE_Y2;

                label = "L v";
            }
            this.main_window.update_text_position({x: label_x, y: label_y}, this.level_label);
            this.main_window.update_text_position({x: value_end_x, y: value_y}, this.level_value);
            this.main_window.update_text(label, this.level_label);

            this.main_window.get_internal_group(MainStatusMenu.GROUP_KEY).visible = true;
        }
    }

    private init_desc_guide() {
        let sprite = this.desc_window.create_at_group(
            MainStatusMenu.DESC_GUIDE.L.X + 1,
            MainStatusMenu.DESC_GUIDE.L.Y + 1,
            "keyboard_buttons",
            0x0,
            "l_button",
            MainStatusMenu.DESC_GUIDE_KEY
        );
        this.active_sprites.push(sprite);

        sprite = this.desc_window.create_at_group(
            MainStatusMenu.DESC_GUIDE.L.X,
            MainStatusMenu.DESC_GUIDE.L.Y,
            "keyboard_buttons",
            undefined,
            "l_button",
            MainStatusMenu.DESC_GUIDE_KEY
        );
        this.active_sprites.push(sprite);

        sprite = this.desc_window.create_at_group(
            MainStatusMenu.DESC_GUIDE.R.X + 1,
            MainStatusMenu.DESC_GUIDE.R.Y + 1,
            "keyboard_buttons",
            0x0,
            "r_button",
            MainStatusMenu.DESC_GUIDE_KEY
        );
        this.active_sprites.push(sprite);

        sprite = this.desc_window.create_at_group(
            MainStatusMenu.DESC_GUIDE.R.X,
            MainStatusMenu.DESC_GUIDE.R.Y,
            "keyboard_buttons",
            undefined,
            "r_button",
            MainStatusMenu.DESC_GUIDE_KEY
        );
        this.active_sprites.push(sprite);

        sprite = this.desc_window.create_at_group(
            MainStatusMenu.DESC_GUIDE.A.X + 1,
            MainStatusMenu.DESC_GUIDE.A.Y + 1,
            "keyboard_buttons",
            0x0,
            "a_button",
            MainStatusMenu.DESC_GUIDE_KEY
        );
        this.active_sprites.push(sprite);

        sprite = this.desc_window.create_at_group(
            MainStatusMenu.DESC_GUIDE.A.X,
            MainStatusMenu.DESC_GUIDE.A.Y,
            "keyboard_buttons",
            undefined,
            "a_button",
            MainStatusMenu.DESC_GUIDE_KEY
        );
        this.active_sprites.push(sprite);

        let obj = this.desc_window.set_text_in_position(
            "-",
            MainStatusMenu.DESC_GUIDE.HIFEN.X,
            MainStatusMenu.DESC_GUIDE.HIFEN.Y,
            false,
            false,
            undefined,
            false,
            MainStatusMenu.DESC_GUIDE_KEY
        );
        this.active_sprites.push(obj.text, obj.shadow);

        obj = this.desc_window.set_text_in_position(
            ": Switch  characters",
            MainStatusMenu.DESC_GUIDE.LR_TEXT.X,
            MainStatusMenu.DESC_GUIDE.LR_TEXT.Y,
            false,
            false,
            undefined,
            false,
            MainStatusMenu.DESC_GUIDE_KEY
        );
        this.active_sprites.push(obj.text, obj.shadow);

        obj = this.desc_guide_a_text = this.desc_window.set_text_in_position(
            "",
            MainStatusMenu.DESC_GUIDE.A_TEXT.X,
            MainStatusMenu.DESC_GUIDE.A_TEXT.Y,
            false,
            false,
            undefined,
            false,
            MainStatusMenu.DESC_GUIDE_KEY
        );
        this.active_sprites.push(obj.text, obj.shadow);
    }

    private initialize() {
        this.avatar = this.main_window.create_at_group(
            MainStatusMenu.AVATAR.X,
            MainStatusMenu.AVATAR.Y,
            "avatars",
            undefined,
            this.selected_char.key_name,
            MainStatusMenu.GROUP_KEY
        );
        this.active_sprites.push(this.avatar);

        this.name = this.main_window.set_text_in_position(
            "",
            MainStatusMenu.NAME.X,
            MainStatusMenu.NAME.Y,
            false,
            false,
            undefined,
            false,
            MainStatusMenu.GROUP_KEY
        );
        this.active_sprites.push(this.name.text, this.name.shadow);

        this.level_label = this.main_window.set_text_in_position(
            "Lv",
            MainStatusMenu.LEVEL.LABEL_X1,
            MainStatusMenu.LEVEL.LABEL_Y1,
            false,
            false,
            undefined,
            false,
            MainStatusMenu.GROUP_KEY
        );
        this.active_sprites.push(this.level_label.text, this.level_label.shadow);

        this.level_value = this.main_window.set_text_in_position(
            "",
            MainStatusMenu.LEVEL.VALUE_END_X1,
            MainStatusMenu.LEVEL.VALUE_Y1,
            true,
            false,
            undefined,
            false,
            MainStatusMenu.GROUP_KEY
        );
        this.active_sprites.push(this.level_value.text, this.level_value.shadow);

        this.class_name = this.main_window.set_text_in_position(
            "",
            MainStatusMenu.CLASS_NAME.X,
            MainStatusMenu.CLASS_NAME.Y,
            false,
            false,
            undefined,
            false,
            MainStatusMenu.GROUP_KEY
        );
        this.active_sprites.push(this.class_name.text, this.class_name.shadow);

        this.l_button = {
            shadow: this.guide_window.create_at_group(
                MainStatusMenu.GUIDE.L.X + 1,
                MainStatusMenu.GUIDE.L.Y + 1,
                "keyboard_buttons",
                0x0,
                "l_button",
                MainStatusMenu.GROUP_KEY
            ),
            sprite: this.guide_window.create_at_group(
                MainStatusMenu.GUIDE.L.X,
                MainStatusMenu.GUIDE.L.Y,
                "keyboard_buttons",
                undefined,
                "l_button",
                MainStatusMenu.GROUP_KEY
            ),
        };
        this.active_sprites.push(this.l_button.sprite, this.l_button.shadow);

        this.r_button = {
            shadow: this.guide_window.create_at_group(
                MainStatusMenu.GUIDE.R.X + 1,
                MainStatusMenu.GUIDE.R.Y + 1,
                "keyboard_buttons",
                0x0,
                "r_button",
                MainStatusMenu.GROUP_KEY
            ),
            sprite: this.guide_window.create_at_group(
                MainStatusMenu.GUIDE.R.X,
                MainStatusMenu.GUIDE.R.Y,
                "keyboard_buttons",
                undefined,
                "r_button",
                MainStatusMenu.GROUP_KEY
            ),
        };
        this.active_sprites.push(this.r_button.sprite, this.r_button.shadow);

        this.a_button = {
            shadow: this.guide_window.create_at_group(
                MainStatusMenu.GUIDE.A.X + 1,
                MainStatusMenu.GUIDE.A.Y + 1,
                "keyboard_buttons",
                0x0,
                "a_button",
                MainStatusMenu.GROUP_KEY
            ),
            sprite: this.guide_window.create_at_group(
                MainStatusMenu.GUIDE.A.X,
                MainStatusMenu.GUIDE.A.Y,
                "keyboard_buttons",
                undefined,
                "a_button",
                MainStatusMenu.GROUP_KEY
            ),
        };
        this.active_sprites.push(this.a_button.sprite, this.a_button.shadow);

        this.select_button = {
            shadow: this.guide_window.create_at_group(
                MainStatusMenu.GUIDE.SELECT.X + 1,
                MainStatusMenu.GUIDE.SELECT.Y + 1,
                "keyboard_buttons",
                0x0,
                "select_button",
                MainStatusMenu.GROUP_KEY
            ),
            sprite: this.guide_window.create_at_group(
                MainStatusMenu.GUIDE.SELECT.X,
                MainStatusMenu.GUIDE.SELECT.Y,
                "keyboard_buttons",
                undefined,
                "select_button",
                MainStatusMenu.GROUP_KEY
            ),
        };
        this.active_sprites.push(this.select_button.sprite, this.select_button.shadow);

        this.hifen = this.guide_window.set_text_in_position(
            "-",
            MainStatusMenu.GUIDE.HIFEN.X,
            MainStatusMenu.GUIDE.HIFEN.Y,
            false,
            false,
            undefined,
            false,
            MainStatusMenu.GROUP_KEY
        );
        this.active_sprites.push(this.hifen.text, this.hifen.shadow);

        this.lr_text = this.guide_window.set_text_in_position(
            ": Rearrange",
            MainStatusMenu.GUIDE.LR_TEXT.X,
            MainStatusMenu.GUIDE.LR_TEXT.Y,
            false,
            false,
            undefined,
            false,
            MainStatusMenu.GROUP_KEY
        );
        this.active_sprites.push(this.lr_text.text, this.lr_text.shadow);

        this.a_text = this.guide_window.set_text_in_position(
            ": Details",
            MainStatusMenu.GUIDE.A_TEXT.X,
            MainStatusMenu.GUIDE.A_TEXT.Y,
            false,
            false,
            undefined,
            false,
            MainStatusMenu.GROUP_KEY
        );
        this.active_sprites.push(this.a_text.text, this.a_text.shadow);

        this.select_text = this.guide_window.set_text_in_position(
            ": Djinn  list",
            MainStatusMenu.GUIDE.SELECT_TEXT.X,
            MainStatusMenu.GUIDE.SELECT_TEXT.Y,
            false,
            false,
            undefined,
            false,
            MainStatusMenu.GROUP_KEY
        );
        this.active_sprites.push(this.select_text.text, this.select_text.shadow);

        this.desc_line1 = this.desc_window.set_text_in_position(
            "",
            MainStatusMenu.DESC.LINE1.X,
            MainStatusMenu.DESC.LINE1.Y,
            false,
            false,
            undefined,
            false,
            MainStatusMenu.GROUP_KEY,
            true
        );
        this.active_sprites.push(this.desc_line1.text, this.desc_line1.shadow);

        this.desc_line2 = this.desc_window.set_text_in_position(
            "",
            MainStatusMenu.DESC.LINE2.X,
            MainStatusMenu.DESC.LINE2.Y,
            false,
            false,
            undefined,
            false,
            MainStatusMenu.GROUP_KEY,
            true
        );
        this.active_sprites.push(this.desc_line2.text, this.desc_line2.shadow);

        let text = this.equip_window.set_text_in_position(
            "Weapon",
            MainStatusMenu.EQUIP_TEXT.LABEL.X,
            MainStatusMenu.EQUIP_TEXT.LABEL.Y,
            false,
            false,
            undefined,
            false,
            MainStatusMenu.GROUP_KEY
        );
        this.active_sprites.push(text.text, text.shadow);

        this.eq_weapon_name = this.equip_window.set_text_in_position(
            "",
            MainStatusMenu.EQUIP_TEXT.NAME.X,
            MainStatusMenu.EQUIP_TEXT.NAME.Y,
            false,
            false,
            undefined,
            false,
            MainStatusMenu.GROUP_KEY
        );
        this.active_sprites.push(this.eq_weapon_name.text, this.eq_weapon_name.shadow);

        let shift = MainStatusMenu.EQUIP_TEXT.SHIFT;

        text = this.equip_window.set_text_in_position(
            "Head",
            MainStatusMenu.EQUIP_TEXT.LABEL.X,
            MainStatusMenu.EQUIP_TEXT.LABEL.Y + shift,
            false,
            false,
            undefined,
            false,
            MainStatusMenu.GROUP_KEY
        );
        this.active_sprites.push(text.text, text.shadow);

        this.eq_head_name = this.equip_window.set_text_in_position(
            "",
            MainStatusMenu.EQUIP_TEXT.NAME.X,
            MainStatusMenu.EQUIP_TEXT.NAME.Y + shift,
            false,
            false,
            undefined,
            false,
            MainStatusMenu.GROUP_KEY
        );
        this.active_sprites.push(this.eq_head_name.text, this.eq_head_name.shadow);

        shift += MainStatusMenu.EQUIP_TEXT.SHIFT;

        text = this.equip_window.set_text_in_position(
            "Shield",
            MainStatusMenu.EQUIP_TEXT.LABEL.X,
            MainStatusMenu.EQUIP_TEXT.LABEL.Y + shift,
            false,
            false,
            undefined,
            false,
            MainStatusMenu.GROUP_KEY
        );
        this.active_sprites.push(text.text, text.shadow);

        this.eq_shield_name = this.equip_window.set_text_in_position(
            "",
            MainStatusMenu.EQUIP_TEXT.NAME.X,
            MainStatusMenu.EQUIP_TEXT.NAME.Y + shift,
            false,
            false,
            undefined,
            false,
            MainStatusMenu.GROUP_KEY
        );
        this.active_sprites.push(this.eq_shield_name.text, this.eq_shield_name.shadow);

        shift += MainStatusMenu.EQUIP_TEXT.SHIFT;

        text = this.equip_window.set_text_in_position(
            "Chest",
            MainStatusMenu.EQUIP_TEXT.LABEL.X,
            MainStatusMenu.EQUIP_TEXT.LABEL.Y + shift,
            false,
            false,
            undefined,
            false,
            MainStatusMenu.GROUP_KEY
        );
        this.active_sprites.push(text.text, text.shadow);

        this.eq_chest_name = this.equip_window.set_text_in_position(
            "",
            MainStatusMenu.EQUIP_TEXT.NAME.X,
            MainStatusMenu.EQUIP_TEXT.NAME.Y + shift,
            false,
            false,
            undefined,
            false,
            MainStatusMenu.GROUP_KEY
        );
        this.active_sprites.push(this.eq_chest_name.text, this.eq_chest_name.shadow);

        this.init_desc_guide();
    }

    private update_info() {
        if (this.avatar) this.avatar.destroy();

        const char = this.selected_char;
        this.set_battle_effects();

        this.avatar = this.main_window.create_at_group(
            MainStatusMenu.AVATAR.X,
            MainStatusMenu.AVATAR.Y,
            "avatars",
            undefined,
            char.key_name,
            MainStatusMenu.GROUP_KEY
        );

        this.main_window.update_text(char.name, this.name);
        this.main_window.update_text(String(char.level), this.level_value);
        this.main_window.update_text(char.class.name, this.class_name);

        const names = {
            [equip_slots.WEAPON]: "",
            [equip_slots.HEAD]: "",
            [equip_slots.CHEST]: "",
            [equip_slots.BODY]: "",
        };
        for (let property in names) {
            const item_slot = char.equip_slots[property];

            if (!item_slot) names[property] = "";
            else names[property] = this.data.info.items_list[item_slot.key_name].name;
        }

        this.equip_window.update_text(names[equip_slots.WEAPON], this.eq_weapon_name);
        this.equip_window.update_text(names[equip_slots.HEAD], this.eq_head_name);
        this.equip_window.update_text(names[equip_slots.CHEST], this.eq_shield_name);
        this.equip_window.update_text(names[equip_slots.BODY], this.eq_chest_name);
    }

    private trigger_state_change() {
        this.change_state(MainStatusMenu.AdvanceState[this.current_state], true);
    }

    private on_character_change(char?: MainChar | string) {
        if (char) {
            if (typeof char === "string") {
                this.selected_char = this.data.info.main_char_list[char as string];
            } else this.selected_char = char as MainChar;
        } else this.selected_char = this.chars_menu.lines[this.chars_menu.current_line][this.chars_menu.selected_index];

        let state = null;
        if (this.current_state === null || this.current_state === undefined) state = MainStatusStates.CHARACTERS;
        else state = this.current_state;

        this.update_info();
        this.change_state(state);

        this.data.cursor_manager.show();
    }

    public inner_control() {
        const controls = [
            {
                button: Button.LEFT,
                on_down: this.current_component.on_left.bind(this.current_component),
                sfx: {down: "menu/move"},
            },
            {
                button: Button.RIGHT,
                on_down: this.current_component.on_right.bind(this.current_component),
                sfx: {down: "menu/move"},
            },
            {
                button: Button.UP,
                on_down: this.current_component.on_up.bind(this.current_component),
                sfx: {down: "menu/move"},
            },
            {
                button: Button.DOWN,
                on_down: this.current_component.on_down.bind(this.current_component),
                sfx: {down: "menu/move"},
            },
        ];

        if (this.current_state !== MainStatusStates.DJINN) {
            controls.push(
                {button: Button.A, on_down: this.trigger_state_change.bind(this), sfx: {down: "menu/positive"}},
                {button: Button.B, on_down: this.selecting_char.bind(this), sfx: {down: "menu/negative"}},
                {
                    button: Button.L,
                    on_down: this.chars_menu.previous_char.bind(this.chars_menu, true),
                    sfx: {down: "menu/positive"},
                },
                {
                    button: Button.R,
                    on_down: this.chars_menu.next_char.bind(this.chars_menu, true),
                    sfx: {down: "menu/positive"},
                }
            );
        } else {
            controls.push(
                {button: Button.A, on_down: this.selecting_char.bind(this), sfx: {down: "menu/negative"}},
                {button: Button.B, on_down: this.selecting_char.bind(this), sfx: {down: "menu/negative"}},
                {button: Button.SELECT, on_down: this.selecting_char.bind(this), sfx: {down: "menu/negative"}}
            );
        }

        this.data.control_manager.add_controls(controls, {
            loop_config: {vertical: true, horizontal: true, shoulder: true},
        });
    }

    private change_state(new_state: MainStatusStates, reset_pos: boolean = false) {
        let pos = {line: 0, col: 0};

        if (new_state === MainStatusStates.DJINN || this.current_state === MainStatusStates.DJINN) {
            this.toggle_guide_win();

            if (new_state === MainStatusStates.DJINN) {
                this.chars_menu.unset_character(this.chars_menu.selected_index);
                this.chars_menu.arrow_group.visible = false;
            } else {
                this.chars_menu.set_character(this.chars_menu.selected_index);
                this.chars_menu.arrow_group.visible = true;
            }
        }

        if (![MainStatusStates.CHARACTERS, MainStatusStates.DJINN].includes(new_state) && !this.desc_window.open) {
            this.desc_window.show(undefined, false);
        } else if (new_state === MainStatusStates.CHARACTERS && this.desc_window.open) {
            this.desc_window.close(undefined, false);
        }

        if (new_state === MainStatusStates.ITEMS && !this.equip_window.open) {
            this.equip_window.show(undefined, false);
        } else if (!(new_state === MainStatusStates.ITEMS) && this.equip_window.open) {
            this.equip_window.close(undefined, false);
        }

        if (this.current_component) {
            if (!reset_pos) pos = this.current_component.current_pos;

            this.current_component.clear();
            this.current_component = null;
        }

        this.current_state = new_state;
        this.current_component = this.components[MainStatusMenu.StateComponent[this.current_state]];

        if (this.current_state === MainStatusStates.DJINN) this.current_component.initialize();
        else this.current_component.reset(pos);

        if (this.current_state !== MainStatusStates.CHARACTERS) this.inner_control();
        this.check_main_components();
    }

    private selecting_char() {
        this.update_info();
        this.change_state(MainStatusStates.CHARACTERS);
        this.chars_menu.select_char(this.chars_menu.selected_index, false, true);

        this.chars_menu.grant_control(
            this.close_menu.bind(this, this.close_callback),
            this.trigger_state_change.bind(this),
            true
        );

        this.data.control_manager.add_controls(
            [
                {
                    button: Button.SELECT,
                    on_down: this.change_state.bind(this, MainStatusStates.DJINN),
                    sfx: {down: "menu/positive"},
                },
            ],
            {
                no_initial_reset: true,
            }
        );

        this.data.cursor_manager.show();
    }

    public open_menu(close_callback?: Function, open_callback?: Function) {
        if (close_callback) this.close_callback = close_callback;

        this.selected_char = this.data.info.party_data.members[0];
        this.initialize();

        this.guide_window.show(undefined, false);
        this.main_window.show(undefined, false);
        this.chars_menu.open(0, CharsMenuModes.MENU, undefined, true);
        this.selecting_char();

        this.main_window.group.bringToTop(this.main_window.get_internal_group(MainStatusMenu.GROUP_KEY));
        if (open_callback) open_callback();

        this.menu_open = true;
    }

    public close_menu(callback?: Function) {
        this.menu_open = false;
        this.data.cursor_manager.hide();
        this.data.control_manager.reset();

        this.current_component.clear();
        this.current_component = null;
        this.current_state = null;

        if (!callback) callback = this.close_callback;

        this.chars_menu.close();
        this.main_window.close(undefined, false);
        this.guide_window.close(undefined, false);
        this.desc_window.close(undefined, false);
        this.equip_window.close(undefined, false);

        this.active_sprites.forEach((s: Phaser.Sprite | Phaser.BitmapText) => {
            s.destroy();
        });
        this.active_sprites = [];

        callback();
        this.close_callback = null;
    }

    public update_eq_highlight(highlight: {x: number; y: number; width: number; height: number}) {
        this.eq_highlight.clear();

        this.eq_highlight.beginFill(this.equip_window.color, 1);
        this.eq_highlight.drawRect(highlight.x, highlight.y, highlight.width, highlight.height);
        this.eq_highlight.endFill();
    }
}
