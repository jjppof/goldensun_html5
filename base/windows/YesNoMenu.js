import { ButtonSelectMenu } from '../menus/ButtonSelectMenu.js';
import { capitalize } from '../../utils.js';

const TITLE_WINDOW_WIDTH = 36

export class YesNoMenu{
    constructor(game, data, control_manager){
        this.game = game;
        this.data = data;
        this.control_manager = control_manager;

        this.yes_callback = null;
        this.no_callback = null;

        this.buttons_keys = ["yes", "no"];

        this.was_in_dialog = null;
        this.is_open = false;

        this.menu = new ButtonSelectMenu(this.game, this.data,
            this.buttons_keys,
            this.buttons_keys.map(b => capitalize(b)),
            {on_press: this.button_press.bind(this),
            on_cancel: this.close_menu.bind(this)},
            this.control_manager);
        this.menu.title_window.update_size({width: TITLE_WINDOW_WIDTH});
    }

    update_position(new_x=undefined, new_y=undefined) {
        if(new_x !== undefined){
            let diff = this.menu.title_window.x - this.menu.x;
            this.menu.x = new_x;
            this.menu.title_window.x = new_x + diff;
        } 
        if(new_y !== undefined){
            this.menu.y = new_y;
            this.menu.title_window.y = new_y;
        } 
        this.menu.update_position();
        this.menu.title_window.send_to_front();
    }

    button_press(){
        switch (this.buttons_keys[this.menu.selected_button_index]){
            case "yes":
                this.close_menu(this.yes_callback);
                break;
            case "no":
                this.close_menu(this.no_callback);
                break;
        }
    }

    is_active() {
        return this.menu.menu_active;
    }

    open_menu(callbacks){
        this.yes_callback = callbacks.yes;
        this.no_callback = callbacks.no;

        this.was_in_dialog = this.data.in_dialog;
        this.data.in_dialog = this.was_in_dialog === true ? this.was_in_dialog : true;
        if(this.data.hero.in_action()){
            this.data.hero.stop_char();
            this.data.hero.update_shadow();
        }
        this.is_open = true;
        this.menu.open();
        
    }

    close_menu(callback) {
        if(callback === undefined) callback = this.no_callback;
        if (!this.is_active()) return;
        this.menu.close();
        
        this.data.in_dialog = this.was_in_dialog;
        this.is_open = false;
        callback();
    }
}