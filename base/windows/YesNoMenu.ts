import { GoldenSun } from '../GoldenSun';
import { ButtonSelectMenu } from '../support_menus/ButtonSelectMenu';
import { capitalize } from '../utils';
import { ControlManager } from '../utils/ControlManager';

const TITLE_WINDOW_WIDTH = 36
const YES_ACTION = "yes";
const NO_ACTION = "no";

export class YesNoMenu{
    public game:Phaser.Game;
    public data:GoldenSun;
    public control_manager:ControlManager;

    public yes_callback:Function;
    public no_callback:Function;
    
    public buttons_keys:string[];
    public is_open:boolean;
    public menu:ButtonSelectMenu;
    constructor(game:Phaser.Game, data:GoldenSun){
        this.game = game;
        this.data = data;
        this.control_manager = this.data.control_manager;

        this.yes_callback = null;
        this.no_callback = null;

        this.buttons_keys = [YES_ACTION, NO_ACTION];

        this.is_open = false;

        this.menu = new ButtonSelectMenu(this.game, this.data,
            this.buttons_keys,
            this.buttons_keys.map(b => capitalize(b)),
            {on_press: this.button_press.bind(this),
            on_cancel: this.close_menu.bind(this)});
        this.menu.title_window.update_size({width: TITLE_WINDOW_WIDTH});
    }

    update_position(new_x:number=undefined, new_y:number=undefined) {
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
            case YES_ACTION:
                this.close_menu(this.yes_callback);
                break;
            case NO_ACTION:
                this.close_menu(this.no_callback);
                break;
        }
    }

    is_active() {
        return this.menu.menu_active;
    }

    open_menu(callbacks:{yes:Function, no:Function}, custom_pos?:{x:number, y:number}){
        this.yes_callback = callbacks.yes;
        this.no_callback = callbacks.no;

        if(this.data.hero.in_action()){
            this.data.hero.stop_char();
            this.data.hero.update_shadow();
        }

        this.is_open = true;
        this.menu.open(undefined, 0, true, {active_default: 1.1, max_scale: 1.2});

        if(custom_pos){
            this.update_position(custom_pos.x, custom_pos.y);
        }
        
    }

    close_menu(callback?:Function) {
        if(callback === undefined) callback = this.no_callback;
        if (!this.is_active()) return;
        this.menu.close();
        
        this.is_open = false;
        callback();
    }
}