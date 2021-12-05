import {GoldenSun} from "../GoldenSun";
import {HorizontalMenu} from "../support_menus/HorizontalMenu";
import * as _ from "lodash";

const TITLE_WINDOW_WIDTH = 36;
enum actions {
    YES_ACTION = "yes",
    NO_ACTION = "no",
}

export class YesNoMenu {
    public game: Phaser.Game;
    public data: GoldenSun;

    public yes_callback: Function;
    public no_callback: Function;

    public buttons_keys: string[];
    public is_open: boolean;
    public menu: HorizontalMenu;

    constructor(game: Phaser.Game, data: GoldenSun) {
        this.game = game;
        this.data = data;

        this.yes_callback = null;
        this.no_callback = null;

        this.buttons_keys = [actions.YES_ACTION, actions.NO_ACTION];

        this.is_open = false;

        this.menu = new HorizontalMenu(
            this.game,
            this.data,
            this.buttons_keys,
            this.buttons_keys.map(b => _.capitalize(b)),
            {on_press: this.button_press.bind(this), on_cancel: this.close.bind(this)}
        );
        this.menu.title_window.update_size({width: TITLE_WINDOW_WIDTH});
    }

    update_position(new_x?: number, new_y?: number) {
        if (new_x !== undefined) {
            const diff = this.menu.title_window.x - this.menu.x;
            this.menu.x = new_x;
            this.menu.title_window.update_position({x: new_x + diff});
        }
        if (new_y !== undefined) {
            this.menu.y = new_y;
            this.menu.title_window.update_position({y: new_y});
        }
        this.menu.update_position();
        this.menu.title_window.send_to_front();
    }

    button_press() {
        switch (this.buttons_keys[this.menu.selected_button_index]) {
            case actions.YES_ACTION:
                this.close(this.yes_callback);
                break;
            case actions.NO_ACTION:
                this.close(this.no_callback);
                break;
        }
    }

    is_active() {
        return this.menu.menu_active;
    }

    open(callbacks: {yes?: Function; no?: Function}, custom_pos?: {x: number; y: number}, open_callback?: Function) {
        this.yes_callback = callbacks.yes ?? (() => {});
        this.no_callback = callbacks.no ?? (() => {});

        if (this.data.hero.in_action()) {
            this.data.hero.stop_char();
            this.data.hero.update_shadow();
        }

        this.is_open = true;
        this.menu.open(open_callback, 0, true);

        if (custom_pos) {
            this.update_position(custom_pos.x, custom_pos.y);
        }
    }

    close(callback?: Function) {
        if (callback === undefined) callback = this.no_callback;
        if (!this.is_active()) return;

        this.menu.close(callback);
        this.is_open = false;
    }

    destroy() {
        this.menu.destroy();
    }
}
