import {GoldenSun} from "../GoldenSun";
import {MainChar} from "../MainChar";
import {ordered_status_menu} from "../Player";
import {CharsMenu, CharsMenuModes} from "../support_menus/CharsMenu";
import {TextObj, Window} from "../Window";
import {BattleStatusEffect} from "../windows/battle/BattleStatusWindow";
import * as _ from "lodash";
import {StatusComponent} from "../support_menus/StatusComponent";
import {MainStatusStatistics} from "../support_menus/MainStatusStatistics";

export enum MainStatusStates {
    CHARACTERS,
    DJINN,
    STATISTICS,
    PSYNERGY,
    ITEMS,
}

const AdvanceState = {
    [MainStatusStates.CHARACTERS]: MainStatusStates.STATISTICS,
    [MainStatusStates.STATISTICS]: MainStatusStates.PSYNERGY,
    [MainStatusStates.PSYNERGY]: MainStatusStates.ITEMS,
    [MainStatusStates.ITEMS]: MainStatusStates.STATISTICS,
};

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
        LABEL_X: 112,
        LABEL_Y: 8,
        VALUE_END_X: 149,
        VALUE_Y: 8,
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
        LINE2: {X: 7, Y: 22},
    };

    private static readonly GROUP_KEY = "main_status";
    private static readonly MAX_EFFECTS_DISPLAYED = 5;

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

    private is_open: boolean;
    private close_callback: Function;

    private avatar: Phaser.Sprite;
    private name: TextObj;
    private level: TextObj;
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

    private battle_effects: BattleStatusEffect[];

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

        this.components = [
            new MainStatusStatistics(this.game, this.data, this.main_window, this),
            //new MainStatusPsynergy(this.game, this.data, this.window, this),
            //new MainStatusDjinn(this.game, this.data, this.window, this),
            //new MainStatusItems(this.game, this.data, this.window, this),
        ];

        this.current_state = null;
        this.current_component = null;
        this.selected_char = null;
        this.is_open = false;
    }

    public get selected_character() {
        return this.selected_char;
    }

    public get battle_effects_array() {
        return this.battle_effects;
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

        const new_text = this.select_text.text.text === ": Return" ? ": Djinn List" : ": Return";
        this.guide_window.update_text(new_text, this.select_text);
    }

    private initialize() {
        this.main_window.define_internal_group(MainStatusMenu.GROUP_KEY);
        this.guide_window.define_internal_group(MainStatusMenu.GROUP_KEY);

        this.avatar = this.main_window.create_at_group(
            MainStatusMenu.AVATAR.X,
            MainStatusMenu.AVATAR.Y,
            "avatars",
            undefined,
            this.selected_char.key_name,
            MainStatusMenu.GROUP_KEY
        );
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
        this.main_window.set_text_in_position(
            "Lv",
            MainStatusMenu.LEVEL.LABEL_X,
            MainStatusMenu.LEVEL.LABEL_Y,
            false,
            false,
            undefined,
            false,
            MainStatusMenu.GROUP_KEY
        );
        this.level_value = this.main_window.set_text_in_position(
            "",
            MainStatusMenu.LEVEL.VALUE_END_X,
            MainStatusMenu.LEVEL.VALUE_Y,
            true,
            false,
            undefined,
            false,
            MainStatusMenu.GROUP_KEY
        );

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

        this.l_button = {
            shadow: this.guide_window.create_at_group(
                MainStatusMenu.GUIDE.L.X + 1,
                MainStatusMenu.GUIDE.L.Y + 1,
                "l_button",
                0x0,
                undefined,
                MainStatusMenu.GROUP_KEY
            ),
            sprite: this.guide_window.create_at_group(
                MainStatusMenu.GUIDE.L.X,
                MainStatusMenu.GUIDE.L.Y,
                "l_button",
                undefined,
                undefined,
                MainStatusMenu.GROUP_KEY
            ),
        };

        this.r_button = {
            shadow: this.guide_window.create_at_group(
                MainStatusMenu.GUIDE.R.X + 1,
                MainStatusMenu.GUIDE.R.Y + 1,
                "r_button",
                0x0,
                undefined,
                MainStatusMenu.GROUP_KEY
            ),
            sprite: this.guide_window.create_at_group(
                MainStatusMenu.GUIDE.R.X,
                MainStatusMenu.GUIDE.R.Y,
                "r_button",
                undefined,
                undefined,
                MainStatusMenu.GROUP_KEY
            ),
        };

        this.a_button = {
            shadow: this.guide_window.create_at_group(
                MainStatusMenu.GUIDE.A.X + 1,
                MainStatusMenu.GUIDE.A.Y + 1,
                "a_button",
                0x0,
                undefined,
                MainStatusMenu.GROUP_KEY
            ),
            sprite: this.guide_window.create_at_group(
                MainStatusMenu.GUIDE.A.X,
                MainStatusMenu.GUIDE.A.Y,
                "a_button",
                undefined,
                undefined,
                MainStatusMenu.GROUP_KEY
            ),
        };

        this.select_button = {
            shadow: this.guide_window.create_at_group(
                MainStatusMenu.GUIDE.SELECT.X + 1,
                MainStatusMenu.GUIDE.SELECT.Y + 1,
                "select_button",
                0x0,
                undefined,
                MainStatusMenu.GROUP_KEY
            ),
            sprite: this.guide_window.create_at_group(
                MainStatusMenu.GUIDE.SELECT.X,
                MainStatusMenu.GUIDE.SELECT.Y,
                "select_button",
                undefined,
                undefined,
                MainStatusMenu.GROUP_KEY
            ),
        };

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

        this.select_text = this.guide_window.set_text_in_position(
            ": Djinn List",
            MainStatusMenu.GUIDE.SELECT_TEXT.X,
            MainStatusMenu.GUIDE.SELECT_TEXT.Y,
            false,
            false,
            undefined,
            false,
            MainStatusMenu.GROUP_KEY
        );

        this.desc_line1 = this.desc_window.set_text_in_position(
            "",
            MainStatusMenu.DESC.LINE1.X,
            MainStatusMenu.DESC.LINE1.Y,
            false,
            false,
            undefined,
            false,
            MainStatusMenu.GROUP_KEY
        );

        this.desc_line2 = this.desc_window.set_text_in_position(
            "",
            MainStatusMenu.DESC.LINE2.X,
            MainStatusMenu.DESC.LINE2.Y,
            false,
            false,
            undefined,
            false,
            MainStatusMenu.GROUP_KEY
        );
    }

    private update_info() {
        if (this.avatar) this.avatar.destroy();

        const char = this.selected_char;

        this.avatar = this.main_window.create_at_group(
            MainStatusMenu.AVATAR.X,
            MainStatusMenu.AVATAR.Y,
            "avatars",
            undefined,
            char.key_name,
            MainStatusMenu.GROUP_KEY
        );

        this.main_window.update_text(char.name, this.name);
        this.main_window.update_text(char.level, this.level_value);
        this.main_window.update_text(char.class.name, this.class_name);
    }

    private trigger_state_change() {}

    private cancel_inner_state() {}

    private next_char() {
        const party = this.data.info.party_data.members;
        let char_index = -1;

        for (let index in party) {
            if (party[index].key_name === this.selected_char.key_name) {
                char_index = parseInt(index);
                break;
            }
        }

        this.on_character_change(party[(char_index + 1) % party.length]);
    }

    private previous_char() {
        const party = this.data.info.party_data.members;
        let char_index = -1;

        for (let index in party) {
            if (party[index].key_name === this.selected_char.key_name) {
                char_index = parseInt(index);
                break;
            }
        }

        this.on_character_change(party[(char_index + party.length - 1) % party.length]);
    }

    private on_character_change(char?: MainChar) {
        if (char) this.selected_char = char;
        else this.selected_char = this.chars_menu.lines[this.chars_menu.current_line][this.chars_menu.selected_index];

        this.update_info();
        this.set_battle_effects();
    }

    public grant_control() {
        const controls = [
            {key: this.data.gamepad.A, on_down: this.trigger_state_change.bind(this)},
            {key: this.data.gamepad.B, on_down: this.cancel_inner_state.bind(this)},
            {key: this.data.gamepad.L, on_down: this.previous_char.bind(this)},
            {key: this.data.gamepad.R, on_down: this.next_char.bind(this)},
            {key: this.data.gamepad.LEFT, on_down: this.current_component.on_left.bind(this.current_component)},
            {key: this.data.gamepad.RIGHT, on_down: this.current_component.on_right.bind(this.current_component)},
            {key: this.data.gamepad.UP, on_down: this.current_component.on_up.bind(this.current_component)},
            {key: this.data.gamepad.DOWN, on_down: this.current_component.on_down.bind(this.current_component)},
        ];

        this.data.control_manager.set_control(controls, {
            loop_configs: {vertical: true, horizontal: true, shoulder: true},
        });
    }

    public open_menu(close_callback?: Function, open_callback?: Function) {
        if (close_callback) this.close_callback = close_callback;

        this.selected_char = this.data.info.party_data.members[0];
        this.initialize();

        this.guide_window.show(undefined, false);
        this.main_window.show(undefined, false);
        this.chars_menu.open(0, CharsMenuModes.MENU);

        if (open_callback) open_callback();
        this.is_open = true;
    }

    public close_menu(callback?: Function) {
        this.is_open = false;
        this.data.cursor_manager.hide();
        this.data.control_manager.reset();

        if (!callback) callback = this.close_callback;

        this.chars_menu.close();
        this.main_window.close(undefined, false);
        this.guide_window.close(undefined, false);
        this.guide_window.close(undefined, false);
        this.desc_window.close(undefined, false);
        this.equip_window.close(undefined, false);

        callback();
        this.close_callback = null;
    }
}
