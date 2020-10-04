import { Window } from '../../Window.js';
import { kill_all_sprites } from '../../../utils.js';

const MAX_PER_LINE = 4;

const WIN_X = 0;
const WIN_Y = 112;
const WIN_WIDTH = 100;
const WIN_HEIGHT = 20;

const CHAR_GROUP_X = 16;
const CHAR_GROUP_Y = 128;

const GAP_SIZE = 24;
const SHIFT_X = 16;
const SHIFT_Y = 32;

const CURSOR_X = 0;
const CURSOR_Y = 118;

export class ShopCharDisplay {
    constructor(game, data, cursor_manager){
        this.game = game;
        this.data = data;
        this.cursor_manager = cursor_manager;
        this.close_callback = null;

        this.window = new Window(this.game, WIN_X, WIN_Y, WIN_WIDTH, WIN_HEIGHT);
        this.group = this.game.add.group();
        this.group.x = CHAR_GROUP_X - SHIFT_X;
        this.group.y = CHAR_GROUP_Y - SHIFT_Y;
        this.group.alpha = 1;

        this.char_buttons = {};
        this.buttons_number = 0;
        this.line_index = 0;
        this.is_active = false;
        this.is_open = false;
    }

    update_group_pos(){
        this.group.x = CHAR_GROUP_X - SHIFT_X + this.game.camera.x;
        this.group.y = CHAR_GROUP_Y - SHIFT_Y + this.game.camera.y;
    }

    set_chars() {
        this.char_buttons = {};
        for (let i = 0; i < _.clamp(this.data.info.party_data.members.length, 0, MAX_PER_LINE); ++i) {
            const char = this.data.info.party_data.members[i];

            let dead_idle = this.group.children.filter(s => { return (s.alive === false && s.key === char.key_name + "_idle"); });

            if(dead_idle.length>0) this.char_buttons[char.key_name] = dead_idle[0].reset(i*GAP_SIZE, 0);
            else this.char_buttons[char.key_name] = this.group.create(i*GAP_SIZE, 0, char.key_name + "_idle");

            this.data.info.party_data.members[i].sprite_base.setAnimation(this.char_buttons[char.key_name], "idle");
            this.char_buttons[char.key_name].animations.play("idle_down");
        }
    }

    select_char(index){
        //unset run animation for previous character;
        this.selected_button_index = index;
        //set run animation for new character;
        this.cursor_manager.move_to(CURSOR_X + index*GAP_SIZE, CURSOR_Y, "wiggle");
    }

    activate(){
        this.cursor_manager.move_to(CURSOR_X + this.selected_button_index*GAP_SIZE, CURSOR_Y, "wiggle");
        this.is_active = true;
    }
    
    deactivate(){
        this.cursor_manager.clear_tweens();
        this.is_active = false;
    }

    open(select_index, close_callback, open_callback) {
        this.set_chars();
        this.buttons_number = _.clamp(this.data.info.party_data.members.length, 0, MAX_PER_LINE);
        this.selected_button_index = select_index === undefined ? 0 : select_index;
        this.line_index = 0;
        this.update_group_pos();
        //set running animation for character

        this.group.alpha = 1;
        this.is_open = true;
        this.close_callback = close_callback;

        this.activate();
        this.window.show(open_callback, false);
    }

    close(destroy=false) {
        this.is_open = false;
        this.deactivate();
        kill_all_sprites(this.group, destroy);

        this.group.alpha = 0;
        this.window.close(this.close_callback, false);
        this.close_callback = null;
    }

}