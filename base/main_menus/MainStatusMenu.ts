import {GoldenSun} from "../GoldenSun";
import { MainChar } from "../MainChar";
import {CharsMenu, CharsMenuModes} from "../support_menus/CharsMenu";
import {TextObj, Window} from "../Window";

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
        HEIGHT: 36
    };
    private static readonly EQUIP_WIN = {
        X: 0,
        Y: 80,
        WIDTH: 116,
        HEIGHT: 76
    };
    private static readonly GUIDE_WIN = {
        X: 104,
        Y: 0,
        WIDTH: 132,
        HEIGHT: 36
    };
    private static readonly MAIN_WIN = {
        X: 0,
        Y: 39,
        WIDTH: 236,
        HEIGHT: 116,
    };
    private static readonly NAME = {
        X: 8,
        Y: 8
    };
    private static readonly CLASS_NAME = {
        X: 8,
        Y: 56
    };
    private static readonly EXP = {
        LABEL_X: 8,
        LABEL_Y: 16,
        VALUE_END_X: 109,
        VALUE_Y: 16
    };
    private static readonly LEVEL = {
        LABEL_X: 64,
        LABEL_Y: 8,
        VALUE_END_X: 93,
        VALUE_Y: 8
    };
    private static readonly AVATAR = {
        X: 8,
        Y: 24
    };
    private static readonly NORMAL_STATUS = {
        X: 120,
        Y: 8
    };
    private static readonly STATS = {
        LABEL_X: 144,
        LABEL_Y: 24,
        VALUE_END_X: 213,
        VALUE_Y: 24,
        LINE_SHIFT: 8,
    };
    private static readonly HP = {
        LABEL_X: 48,
        LABEL_Y: 32,
        MAX_END_X: 133,
        MAX_Y: 32,
        CURR_END_X: 100,
        CURR_Y: 32
    };
    private static readonly PP = {
        LABEL_X: 48,
        LABEL_Y: 40,
        MAX_END_X: 133,
        MAX_Y: 40,
        CURR_END_X: 100,
        CURR_Y: 40
    };
    private static readonly EFFECTS = {
        ICON_X: 112,
        ICON_Y: 8,
        NAME_X: 0,
        NAME_Y: 0,
        SHIFT: 16
    };

    private static readonly GROUP_KEY: "main_status";

    private game: Phaser.Game;
    private data: GoldenSun;

    private chars_menu: CharsMenu;

    private main_window: Window;
    private guide_window: Window;
    private desc_window: Window;
    private equip_window: Window;

    private current_state: MainStatusStates;
    private selected_char: MainChar;

    private is_open: boolean;
    private close_callback: Function;

    private avatar:Phaser.Sprite;
    private name:TextObj;
    private level:TextObj;
    private level_value:TextObj;

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

        this.current_state = null;
        this.selected_char = null;
        this.is_open = false;
    }

    private toggle_guide_win() {}

    private initialize(){
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
    }

    private update_info(){
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

    }

    private on_character_change() {
        this.update_info();
    }

    public open_menu(close_callback?:Function, open_callback?:Function){
        if(close_callback) this.close_callback = close_callback;

        this.initialize();

        this.guide_window.show(undefined, false);
        this.main_window.show(undefined, false);
        this.chars_menu.open(0, CharsMenuModes.MENU);

        open_callback();
        this.is_open = true;
    }

    public close_menu(callback?:Function){
        this.is_open = false;
        this.data.cursor_manager.hide();
        this.data.control_manager.reset();

        if(!callback) callback = this.close_callback;
        
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
