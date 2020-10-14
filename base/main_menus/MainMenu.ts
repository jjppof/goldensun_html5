import { capitalize } from '../utils';
import { HorizontalMenu } from '../support_menus/HorizontalMenu';
import { MainPsynergyMenu } from './MainPsynergyMenu';
import { MainItemMenu } from './MainItemMenu';
import { MainDjinnMenu } from './MainDjinnMenu';
import { CharsStatusWindow } from '../windows/CharsStatusWindow';
import { GoldenSun } from '../GoldenSun';

export class MainMenu {
    public game: Phaser.Game;
    public data: GoldenSun;
    public chars_status_window: CharsStatusWindow;
    public buttons_keys: string[];
    public horizontal_menu: HorizontalMenu;
    public psynergy_menu: MainPsynergyMenu;
    public item_menu: MainItemMenu;
    public djinn_menu: MainDjinnMenu;

    constructor(game, data) {
        this.game = game;
        this.data = data;
        this.chars_status_window = new CharsStatusWindow(this.game, this.data);
        this.buttons_keys = ["psynergy", "djinni", "item", "status"];
        let esc_propagation_priority = 0;
        let enter_propagation_priority = 0;
        let shift_propagation_priority = 0;
        let spacebar_propagation_priority = 0;
        this.horizontal_menu = new HorizontalMenu(
            this.game,
            this.data,
            this.buttons_keys,
            this.buttons_keys.map(b => capitalize(b)),
            this.button_press.bind(this),
            enter_propagation_priority,
            this.close_menu.bind(this),
            esc_propagation_priority
        );
        ++esc_propagation_priority;
        ++enter_propagation_priority;
        this.psynergy_menu = new MainPsynergyMenu(this.game, this.data, esc_propagation_priority, enter_propagation_priority);
        this.item_menu = new MainItemMenu(this.game, this.data, esc_propagation_priority, enter_propagation_priority);
        this.djinn_menu = new MainDjinnMenu(this.game, this.data, esc_propagation_priority, enter_propagation_priority, shift_propagation_priority, spacebar_propagation_priority);
    }

    button_press(index) {
        switch (this.buttons_keys[index]) {
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

    button_press_action(menu) {
        this.horizontal_menu.deactivate();
        menu.open_menu(close_this_menu => {
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
    }
}

export function initialize_menu(game, data) {
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
