<<<<<<< HEAD
import { capitalize } from '../utils.js';
=======
import { capitalize } from '../utils';
import { HorizontalMenu } from '../support_menus/HorizontalMenu';
>>>>>>> master
import { MainPsynergyMenu } from './MainPsynergyMenu';
import { MainItemMenu } from './MainItemMenu';
import { MainDjinnMenu } from './MainDjinnMenu';
import { CharsStatusWindow } from '../windows/CharsStatusWindow';
import { GoldenSun } from '../GoldenSun';
import { ButtonSelectMenu } from '../support_menus/ButtonSelectMenu';

export class MainMenu {
    public game: Phaser.Game;
    public data: GoldenSun;
    public chars_status_window: CharsStatusWindow;
    public buttons_keys: string[];
    public horizontal_menu: ButtonSelectMenu;
    public psynergy_menu: MainPsynergyMenu;
    public item_menu: MainItemMenu;
    public djinn_menu: MainDjinnMenu;

    constructor(game, data) {
        this.game = game;
        this.data = data;
        this.chars_status_window = new CharsStatusWindow(this.game, this.data);
        this.buttons_keys = ["psynergy", "djinni", "item", "status"];
        this.horizontal_menu = new ButtonSelectMenu(
            this.game,
            this.data,
            this.buttons_keys,
            this.buttons_keys.map(b => capitalize(b)),
            {
                on_press: this.button_press.bind(this),
                on_cancel:  this.close_menu.bind(this),
            }
        );
        this.psynergy_menu = new MainPsynergyMenu(this.game, this.data);
        this.item_menu = new MainItemMenu(this.game, this.data);
        this.djinn_menu = new MainDjinnMenu(this.game, this.data);
    }

    button_press() {
        this.horizontal_menu.deactivate(true);
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
        }
    }

    button_press_action(menu:any) {
        this.horizontal_menu.deactivate();
        menu.open_menu((close_this_menu:boolean) => {
            this.horizontal_menu.activate();
            this.chars_status_window.update_chars_info();
            if (close_this_menu) {
                this.close_menu();
            }
        });
    }

    update_position() {
        this.chars_status_window.update_position(true);
        this.horizontal_menu.update_position();
    }

    is_active() {
        return this.horizontal_menu.menu_active;
    }

    open_menu() {
        this.horizontal_menu.open();
        this.chars_status_window.update_position();
        this.chars_status_window.update_chars_info();
        this.chars_status_window.show();
    }

    close_menu() {
        if (!this.is_active()) return;
        this.data.menu_open = false;
        this.horizontal_menu.close();
        this.chars_status_window.close();
        this.data.control_manager.reset();
    }
}

export function initialize_menu(game:Phaser.Game, data:GoldenSun) {
    data.spacebar_input.add(() => {
        if (data.hero.in_action() || data.in_battle || !data.created || data.game_event_manager.on_event) return;
        if (!data.menu_open) {
            data.menu_open = true;
            data.hero.stop_char();
            data.hero.update_shadow();
            data.main_menu.open_menu();
        } else if (data.main_menu.is_active()) {
            data.main_menu.close_menu();
        }
    }, this);
    return new MainMenu(game, data);
}
