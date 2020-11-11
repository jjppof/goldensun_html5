import {CharsQuickInfoDjinnWindow} from "../windows/djinn/CharsQuickInfoDjinnWindow";
import {DjinnListWindow} from "../windows/djinn/DjinnListWindow";
import {DjinnActionWindow} from "../windows/djinn/DjinnActionWindow";
import {GoldenSun} from "../GoldenSun";

export class MainDjinnMenu {
    public game: Phaser.Game;
    public data: GoldenSun;
    public close_callback: Function;

    public is_open: boolean;
    public selected_char_index: number;

    public chars_quick_info_window: CharsQuickInfoDjinnWindow;
    public djinn_action_window: DjinnActionWindow;
    public djinni_list_window: DjinnListWindow;

    constructor(game: Phaser.Game, data: GoldenSun) {
        this.game = game;
        this.data = data;
        this.close_callback = null;

        this.is_open = false;
        this.selected_char_index = 0;

        this.chars_quick_info_window = new CharsQuickInfoDjinnWindow(this.game);
        this.djinn_action_window = new DjinnActionWindow(this.game);
        this.djinni_list_window = new DjinnListWindow(this.game, this.data);
    }

    open_menu(close_callback?: Function) {
        this.close_callback = close_callback;
        this.selected_char_index = 0;

        this.chars_quick_info_window.open(this.data.info.party_data.members[this.selected_char_index]);
        this.djinni_list_window.open(
            this.chars_quick_info_window,
            this.djinn_action_window,
            this.close_menu.bind(this)
        );
        this.djinn_action_window.open();

        this.is_open = true;
    }

    close_menu(close_menu_below: boolean = false) {
        this.data.cursor_manager.hide();
        this.data.control_manager.reset();
        this.is_open = false;

        this.chars_quick_info_window.close();
        if (this.djinni_list_window.window_open) this.djinni_list_window.close();
        this.djinn_action_window.close();

        if (this.close_callback !== null) {
            this.close_callback(close_menu_below);
        }
    }
}
