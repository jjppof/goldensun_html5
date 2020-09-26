import { HorizontalMenu } from '../menus/HorizontalMenu.js';
import { capitalize } from '../../utils.js';

const TITLE_WINDOW_WIDTH = 36

export class YesNoMenu{
    constructor(game, data, esc_propagation_priority, enter_propagation_priority, yes_callback, no_callback){
        this.game = game;
        this.data = data;
        this.esc_propagation_priority = esc_propagation_priority + 1;
        this.enter_propagation_priority = enter_propagation_priority + 1;
        this.yes_callback = yes_callback;
        this.no_callback = no_callback;

        this.callback = no_callback;
        this.buttons_keys = ["yes", "no"];

        this.was_in_dialog = null;

        this.menu = new HorizontalMenu(
            this.game,
            this.data,
            this.buttons_keys,
            this.buttons_keys.map(b => capitalize(b)),
            this.button_press.bind(this),
            enter_propagation_priority,
            this.close_menu.bind(this),
            esc_propagation_priority
        );
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

    button_press(index){
        switch (this.buttons_keys[index]) {
            case "yes":
                this.callback = this.yes_callback;
                this.close_menu();
                break;
            case "no":
                this.callback = this.no_callback;
                this.close_menu();
                break;
        }
    }

    is_active() {
        return this.menu.menu_active;
    }

    open_menu(){
        this.was_in_dialog = this.data.in_dialog;
        this.data.in_dialog = this.was_in_dialog === true ? this.was_in_dialog : true;
        if(this.data.hero.in_action()){
            this.data.hero.stop_char();
            this.data.hero.update_shadow();
        }
        this.menu.open();
        
    }

    close_menu() {
        if (!this.is_active()) return;
        this.menu.close();
        this.data.in_dialog = this.was_in_dialog;
        this.callback();
    }
}