import { Window } from '../../Window.js';
import { kill_all_sprites } from '../../utils.js';

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

const ARROW_GROUP_X = 96;
const ARROW_GROUP_Y = 100;
const UP_ARROW_X = 16;
const UP_ARROW_Y = 20; //100-108
const DOWN_ARROW_X = 0;
const DOWN_ARROW_Y = 24; //124-132
const ARROW_Y_DIFF = 8;

const ARROW_TWEEN_TIME = Phaser.Timer.QUARTER >> 1;

export class ShopCharDisplay {
    constructor(game, data, parent){
        this.game = game;
        this.data = data;
        this.parent = parent;
        this.close_callback = null;

        this.window = new Window(this.game, WIN_X, WIN_Y, WIN_WIDTH, WIN_HEIGHT);
        this.char_group = this.game.add.group();
        this.char_group.x = CHAR_GROUP_X - SHIFT_X;
        this.char_group.y = CHAR_GROUP_Y - SHIFT_Y;
        this.char_group.alpha = 1;

        this.arrow_group = this.game.add.group();
        this.arrow_group.x = ARROW_GROUP_X;
        this.arrow_group.y = ARROW_GROUP_Y;

        this.up_arrow = this.arrow_group.create(UP_ARROW_X, UP_ARROW_Y, "green_arrow");
        this.up_arrow.rotation = Math.PI;
        this.down_arrow = this.arrow_group.create(DOWN_ARROW_X, DOWN_ARROW_Y, "green_arrow");
        this.up_arrow.alpha = 0;
        this.down_arrow.alpha = 0;

        this.arrow_tweens = [];

        this.lines = [];
        this.current_line = 0;
        this.selected_index = 0;
        this.is_active = false;
        this.is_open = false;
    }

    update_group_pos(){
        this.char_group.x = CHAR_GROUP_X - SHIFT_X + this.game.camera.x;
        this.char_group.y = CHAR_GROUP_Y - SHIFT_Y + this.game.camera.y;
        this.arrow_group.x = ARROW_GROUP_X + this.game.camera.x;
        this.arrow_group.y = ARROW_GROUP_Y + this.game.camera.y;
    }

    /*Hides or shows specific arrows
    
    Input: up, down [boolean] - If true, shows up/down arrow*/
    set_arrows(up=false, down=false){
        this.up_arrow.x = UP_ARROW_X;
        this.up_arrow.y = UP_ARROW_Y;
        this.down_arrow.x = DOWN_ARROW_X;
        this.down_arrow.y = DOWN_ARROW_Y;
        if(up) this.up_arrow.alpha = 1;
        else this.up_arrow.alpha = 0;

        if(down) this.down_arrow.alpha = 1;
        else this.down_arrow.alpha = 0;
    }

    /*Checks which arrows to show or hide*/
    check_arrows(){
        let up = false;
        let down = false;

        if(this.current_line < this.lines.length-1) down = true;
        if(this.current_line > 0) up = true;

        this.set_arrows(up, down);
        this.init_arrow_tweens();
        this.game.world.bringToTop(this.arrow_group);
    }

    /*Starts the arrow animations*/
    init_arrow_tweens(){
        let up_tween = this.game.add.tween(this.up_arrow)
                .to({y: UP_ARROW_Y - ARROW_Y_DIFF}, ARROW_TWEEN_TIME, Phaser.Easing.Linear.None)
                .to({y: UP_ARROW_Y}, ARROW_TWEEN_TIME, Phaser.Easing.Linear.None).loop();
        this.arrow_tweens.push(up_tween);

        let down_tween = this.game.add.tween(this.down_arrow)
                .to({y: DOWN_ARROW_Y + ARROW_Y_DIFF}, ARROW_TWEEN_TIME, Phaser.Easing.Linear.None)
                .to({y: DOWN_ARROW_Y}, ARROW_TWEEN_TIME, Phaser.Easing.Linear.None).loop();
        this.arrow_tweens.push(down_tween);

        up_tween.start();
        down_tween.start();
    }

    /*Clears the arrow animations*/
    clear_arrow_tweens(){
        for(let i=0; i<this.arrow_tweens.length; i++){
            this.game.tweens.remove(this.arrow_tweens.pop());
        }
    }

    set_chars() {
        for (let i = 0; i < this.lines[this.current_line].length; ++i) {
            let char = this.lines[this.current_line][i];
            let sprite = null;

            let dead_idle = this.char_group.children.filter(s => { return (s.alive === false && s.key === char.key_name + "_idle"); });

            if(dead_idle.length>0) sprite = dead_idle[0].reset(i*GAP_SIZE, 0);
            else sprite = this.char_group.create(i*GAP_SIZE, 0, char.key_name + "_idle");

            char.sprite_base.setAnimation(sprite, "idle");
            sprite.animations.play("idle_down");
        }
    }

    make_lines(){
        let party_length = this.data.info.party_data.members.length;
        let line_number = party_length%MAX_PER_LINE===0 ? (party_length/MAX_PER_LINE) | 0 : ((party_length/MAX_PER_LINE) | 0) + 1;

        for(let i = 0; i<line_number; i++){
            let chars = [];
            for(let n=i*MAX_PER_LINE; n<(i+1)*MAX_PER_LINE; n++){
                if(!this.data.info.party_data.members[n]) break;
                chars.push(this.data.info.party_data.members[n]);
            }
            this.lines[i] = chars;
        }
    }

    change_line(line, force_index=undefined){
        this.clear_arrow_tweens();

        if(this.data.info.party_data.members.length < MAX_PER_LINE*line) return;

        this.current_line = line;
        
        if(force_index !== undefined){
            this.selected_index = force_index;
        }
        else if(this.selected_index !== null && this.selected_index >= this.lines[this.current_line].length){
                this.selected_index = this.lines[this.current_line].length - 1;
        }

        kill_all_sprites(this.char_group);
        //unset run animation for previous character
        this.set_chars();
        this.check_arrows();
        this.select_char(this.selected_index);
    }

    next_line(force_index=undefined){
        if(this.lines.length === 1 || this.current_line + 1 === this.lines.length) return;
        let index =  this.current_line + 1;

        this.change_line(index, force_index);
    }

    previous_line(force_index=undefined){
        if(this.lines.length === 1 || this.current_line -1 < 0) return;
        let index = this.current_line - 1;

        this.change_line(index, force_index);
    }

    select_char(index){
        //unset run animation for previous character;
        this.selected_index = index;
        //set run animation for new character;
        
        this.parent.cursor_manager.move_to(CURSOR_X + index*GAP_SIZE, CURSOR_Y, "wiggle");
        if(this.parent.eq_compare.is_open) this.parent.eq_compare.change_character(this.current_line*MAX_PER_LINE + this.selected_index);
        if(this.parent.inv_win.is_open) this.parent.inv_win.change_character(this.current_line*MAX_PER_LINE + this.selected_index);
    }

    next_char(){
        if(this.lines[this.current_line].length === 1 && this.lines.length === 1) return;

        if(this.selected_index + 1 === this.lines[this.current_line].length){
            if(this.current_line + 1 === this.lines.length){
                if(this.lines.length === 1) this.select_char(0);
                else this.change_line(0, 0);
            }
            else this.next_line(0);
        }
        else{
            this.select_char(this.selected_index + 1);
        }
    }

    previous_char(){
        if(this.lines[this.current_line].length === 1 && this.lines.length === 1) return;

        if(this.selected_index -1 < 0){
            if(this.current_line -1 < 0){
                if(this.lines.length === 1) this.select_char(this.lines[this.current_line].length-1);
                else this.change_line(this.lines.length-1, this.lines[this.lines.length-1].length-1); 
            }
            else this.previous_line(this.lines[this.current_line -1].length-1);
        }
        else{
            this.select_char(this.selected_index - 1);
        }
    }

    activate(){
        this.parent.cursor_manager.move_to(CURSOR_X + this.selected_index*GAP_SIZE, CURSOR_Y, "wiggle");
        this.is_active = true;
    }
    
    deactivate(){
        this.parent.cursor_manager.clear_tweens();
        this.is_active = false;
    }

    open(select_index=0, close_callback, open_callback) {
        this.selected_index = select_index;
        this.current_line = 0;

        this.make_lines();
        this.update_group_pos();
        this.check_arrows();
        this.set_chars();
        //set running animation for character

        this.char_group.alpha = 1;
        this.is_open = true;
        this.close_callback = close_callback;

        this.activate();
        this.window.show(open_callback, false);
    }

    close(destroy=false) {
        this.is_open = false;
        this.deactivate();
        kill_all_sprites(this.char_group, destroy);

        this.lines = [];
        this.line_index = 0;
        this.selected_index = 0;
        this.is_active = false;
        this.is_open = false;
        this.char_group.alpha = 0;

        this.set_arrows(false, false);

        this.window.close(this.close_callback, false);
        this.close_callback = null;
    }

}