import { Window } from '../../Window.js';

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

export class ShopCharDisplay {
    constructor(game, data){
        this.game = game;
        this.data = data;

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
        for (let key_name in this.char_buttons) {
            this.char_buttons[key_name].destroy();
        }
        this.char_buttons = {};
        for (let i = 0; i < _.clamp(this.data.info.party_data.members.length, 0, MAX_PER_LINE); ++i) {
            const char = this.data.info.party_data.members[i];
            this.char_buttons[char.key_name] = this.group.create(i*GAP_SIZE, 0, char.key_name + "_idle");
            this.data.info.party_data.members[i].sprite_base.setAnimation(this.char_buttons[char.key_name], "idle");
            this.char_buttons[char.key_name].animations.play("idle_down");
        }
    }

    open(select_index, start_active = true) {
        if (Object.keys(this.char_buttons).length != _.clamp(this.data.info.party_data.members.length, 0, MAX_PER_LINE)) {
            this.set_chars();
        }
        this.buttons_number = _.clamp(this.data.info.party_data.members.length, 0, MAX_PER_LINE);
        this.selected_button_index = select_index === undefined ? 0 : select_index;
        this.line_index = 0;
        this.update_group_pos();
        //this.set_button(this.selected_button_index);

        this.window.show(undefined, false);
        this.group.alpha = 1;
        this.is_active = start_active;
        this.is_open = true;
    }

    close() {
        this.is_open = false;
        //this.reset_button(this.selected_button_index);
        this.group.alpha = 0;
        this.base_window.close(undefined, false);
    }

}