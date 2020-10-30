import { capitalize } from '../utils';
import { MainPsynergyMenu } from './MainPsynergyMenu';
import { MainItemMenu } from './MainItemMenu';
import { MainDjinnMenu } from './MainDjinnMenu';
import { CharsStatusWindow } from '../windows/CharsStatusWindow';
import { GoldenSun } from '../GoldenSun';
import { HorizontalMenu } from '../support_menus/HorizontalMenu';

const TITLE_WINDOW_WIDTH = 70;

export class MainMenu {
    public game: Phaser.Game;
    public data: GoldenSun;

    public buttons_keys: string[];
    public current_index: number;

    public chars_status_window: CharsStatusWindow;
    public horizontal_menu: HorizontalMenu;
    public psynergy_menu: MainPsynergyMenu;
    public item_menu: MainItemMenu;
    public djinn_menu: MainDjinnMenu;

    constructor(game, data) {
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
                on_cancel:  this.close_menu.bind(this),
            }
        , TITLE_WINDOW_WIDTH);
        this.psynergy_menu = new MainPsynergyMenu(this.game, this.data);
        this.item_menu = new MainItemMenu(this.game, this.data);
        this.djinn_menu = new MainDjinnMenu(this.game, this.data);
    }

    button_press() {
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
        }
    }

    button_press_action(menu:any) {      
        this.horizontal_menu.close(() => {
            menu.open_menu((close_this_menu:boolean) => {
                this.horizontal_menu.open(() => {
                    this.chars_status_window.update_chars_info();
                    if (close_this_menu) {
                        this.close_menu();
                    }
                }, this.current_index);
            });
        });
    }

    update_position() {
        this.chars_status_window.update_position(true);
        this.horizontal_menu.update_position();
    }

    open_menu() {
        this.horizontal_menu.open(() => {
            this.chars_status_window.update_position();
            this.chars_status_window.update_chars_info();
            this.chars_status_window.show();
        }, this.current_index);
    }

    close_menu() {
        if (!this.horizontal_menu.menu_active) return;
        this.data.control_manager.reset();

        let promises:Promise<void>[] = [];

        let closed:() => void;
        let promise = new Promise<void>(resolve => closed = resolve);
        promises.push(promise);
            
        this.horizontal_menu.close(closed);
        this.chars_status_window.close(closed);

        Promise.all(promises).then(() =>{
            this.data.menu_open = false;
            this.current_index = 0;
        });
    }
}

export function initialize_menu(game:Phaser.Game, data:GoldenSun) {
    let trigger_menu = () => {
        if (data.hero.in_action() || data.in_battle || !data.created || data.game_event_manager.on_event) return;
        if (!data.menu_open) {
            data.menu_open = true;
            data.hero.stop_char();
            data.hero.update_shadow();
            data.main_menu.open_menu();
        };
    }

    let controls = [
        {key: data.gamepad.A, callback: trigger_menu},
        {key: data.gamepad.SELECT, callback: trigger_menu}
    ];
    
    data.control_manager.set_control(controls, {persist:true});

    return new MainMenu(game, data);
}
