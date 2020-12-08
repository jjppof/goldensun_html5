import {capitalize} from "../utils";
import {MainPsynergyMenu} from "./MainPsynergyMenu";
import {MainItemMenu} from "./MainItemMenu";
import {MainDjinnMenu} from "./MainDjinnMenu";
import {MainStatusMenu} from "./MainStatusMenu";
import {CharsStatusWindow} from "../windows/CharsStatusWindow";
import {GoldenSun} from "../GoldenSun";
import {HorizontalMenu} from "../support_menus/HorizontalMenu";

export class MainMenu {
    private static readonly TITLE_WINDOW_WIDTH = 70;
    private game: Phaser.Game;
    private data: GoldenSun;

    private buttons_keys: string[];
    private current_index: number;

    private chars_status_window: CharsStatusWindow;
    private horizontal_menu: HorizontalMenu;
    private psynergy_menu: MainPsynergyMenu;
    private item_menu: MainItemMenu;
    private djinn_menu: MainDjinnMenu;
    private status_menu: MainStatusMenu;

    public constructor(game: Phaser.Game, data: GoldenSun) {
        this.game = game;
        this.data = data;

        this.buttons_keys = ["psynergy", "djinni", "item", "status"];
        this.current_index = 0;

        this.chars_status_window = new CharsStatusWindow(this.game, this.data);
        this.horizontal_menu = new HorizontalMenu(
            this.game,
            this.data,
            this.buttons_keys,
            this.buttons_keys.map(b => capitalize(b)),
            {
                on_press: this.button_press.bind(this),
                on_cancel: this.close_menu.bind(this),
            },
            MainMenu.TITLE_WINDOW_WIDTH
        );
        this.psynergy_menu = new MainPsynergyMenu(this.game, this.data);
        this.item_menu = new MainItemMenu(this.game, this.data);
        this.djinn_menu = new MainDjinnMenu(this.game, this.data);
        this.status_menu = new MainStatusMenu(this.game, this.data);
    }

    public get is_active() {
        return this.horizontal_menu.menu_active;
    }

    private button_press() {
        this.current_index = this.horizontal_menu.selected_button_index;

        switch (this.buttons_keys[this.horizontal_menu.selected_button_index]) {
            case "psynergy":
                this.button_press_action(this.psynergy_menu);
                break;
            case "djinni":
                this.button_press_action(this.djinn_menu);
                break;
            case "item":
                this.button_press_action(this.item_menu);
                break;
            case "status":
                this.button_press_action(this.status_menu);
                break;
        }
    }

    private button_press_action(menu: MainPsynergyMenu | MainDjinnMenu | MainItemMenu | MainStatusMenu) {
        this.horizontal_menu.close(() => {
            menu.open_menu((close_this_menu: boolean) => {
                if (close_this_menu) this.close_menu();
                else {
                    this.chars_status_window.update_chars_info();
                    this.horizontal_menu.open(undefined, this.current_index);
                }
            });
        }, false);
    }

    public update_position() {
        this.chars_status_window.update_position(true);
        this.horizontal_menu.update_position();
    }

    public open_menu() {
        this.chars_status_window.update_chars_info();
        this.chars_status_window.update_position();
        this.chars_status_window.show();
        this.horizontal_menu.open();
    }

    public close_menu() {
        if (!this.horizontal_menu.menu_active) return;
        this.data.control_manager.reset();
        this.data.cursor_manager.hide();

        let promises: Promise<void>[] = [];

        let closed: () => void;
        let promise = new Promise<void>(resolve => (closed = resolve));
        promises.push(promise);

        this.horizontal_menu.close(closed);
        this.chars_status_window.close(closed);

        Promise.all(promises).then(() => {
            this.data.menu_open = false;
            this.current_index = 0;
        });
    }
}

export function initialize_menu(game: Phaser.Game, data: GoldenSun) {
    let trigger_menu = () => {
        if (data.hero.in_action() || data.in_battle || !data.created || data.game_event_manager.on_event) return;
        if (!data.menu_open) {
            data.menu_open = true;
            data.hero.stop_char();
            data.hero.update_shadow();
            data.audio.play_se("menu_se", "menu_move");
            data.main_menu.open_menu();
        }
    };

    let controls = [
        {key: data.gamepad.A, on_down: trigger_menu},
        {key: data.gamepad.SELECT, on_down: trigger_menu},
    ];

    data.control_manager.set_control(controls, {persist: true});

    return new MainMenu(game, data);
}
