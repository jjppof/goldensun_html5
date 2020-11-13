import {GoldenSun} from "../GoldenSun";
import {CharsMenu} from "../support_menus/CharsMenu";
import {Window} from "../Window";
import {MainStatusWindow} from "./MainStatusWindow";

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

    private game: Phaser.Game;
    private data: GoldenSun;

    private chars_menu: CharsMenu;
    private main_window: MainStatusWindow;

    private guide_window: Window;
    private desc_window: Window;
    private equip_window: Window;

    private current_state: MainStatusStates;

    public constructor(game: Phaser.Game, data: GoldenSun) {
        this.game = game;
        this.data = data;

        this.chars_menu = new CharsMenu(this.game, this.data, this.on_character_change.bind(this));
        this.main_window = new MainStatusWindow(this.game, this.data);

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
    }

    private toggle_guide_win() {}

    private on_character_change() {}

    private on_character_swap() {}
}
