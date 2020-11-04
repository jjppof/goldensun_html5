import { Window } from '../Window';
import * as utils from '../utils';
import { GoldenSun } from '../GoldenSun';
import { MainChar } from '../MainChar';

const MAX_PER_LINE = 4;

const WIN_X = 0;
const WIN_Y = 112;
const WIN_WIDTH = 100;
const WIN_HEIGHT = 20;

const WIN_X2 = 0;
const WIN_Y2 = 0;
const WIN_WIDTH2 = 100;
const WIN_HEIGHT2 = 36;

const CHAR_GROUP_X = 16;
const CHAR_GROUP_Y = 128;

const CHAR_GROUP_X2 = 16;
const CHAR_GROUP_Y2 = 28;

const GAP_SIZE = 24;
const SHIFT_X = 16;
const SHIFT_Y = 32;

const CURSOR_X = 0;
const CURSOR_Y = 118;

const CURSOR_X2 = 0;
const CURSOR_Y2 = 22;

const ARROW_GROUP_X = 96;
const ARROW_GROUP_Y = 100;
const UP_ARROW_X = 16;
const UP_ARROW_Y = 20;
const DOWN_ARROW_X = 0;
const DOWN_ARROW_Y = 24;
const ARROW_Y_DIFF = 8;

const ARROW_GROUP_X2 = 92;
const ARROW_GROUP_Y2 = -4;

const MENU_SELECTED_Y_SHIFT = 4;
const SEPARATOR_X = 4;
const SEPARATOR_Y = 27;
const SEPARATOR_LENGTH = 96;

const SHOP_MODE = "shop";
const MENU_MODE = "menu";

const ARROW_TWEEN_TIME = Phaser.Timer.QUARTER >> 1;

export class CharsMenu {
    public game:Phaser.Game;
    public data:GoldenSun;
    public on_change:Function;

    public window:Window;
    public char_group:Phaser.Group;
    public arrow_group:Phaser.Group;
    public up_arrow:Phaser.Sprite;
    public down_arrow:Phaser.Sprite;

    public arrow_tweens:Phaser.Tween[];
    public lines:MainChar[][];
    public current_line:number;
    public selected_index:number;
    public is_active:boolean;
    public is_open:boolean;
    public mode:string;

    constructor(game:Phaser.Game, data:GoldenSun, on_change:Function){
        this.game = game;
        this.data = data;
        this.on_change = on_change;

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
        this.mode = null;
    }

    check_mode(){
        if(this.mode === SHOP_MODE){
            this.window.update_size({width:WIN_WIDTH, height:WIN_HEIGHT});
            this.window.update_position({x:WIN_X, y:WIN_Y});

            this.char_group.x = CHAR_GROUP_X - SHIFT_X + this.game.camera.x;
            this.char_group.y = CHAR_GROUP_Y - SHIFT_Y + this.game.camera.y;
            this.arrow_group.x = ARROW_GROUP_X + this.game.camera.x;
            this.arrow_group.y = ARROW_GROUP_Y + this.game.camera.y;
        }
        else if(this.mode === MENU_MODE){
            this.window.update_size({width:WIN_WIDTH2, height:WIN_HEIGHT2});
            this.window.update_position({x:WIN_X2, y:WIN_Y2});

            this.char_group.x = CHAR_GROUP_X2 - SHIFT_X + this.game.camera.x;
            this.char_group.y = CHAR_GROUP_Y2 - SHIFT_Y + this.game.camera.y;
            this.arrow_group.x = ARROW_GROUP_X2 + this.game.camera.x;
            this.arrow_group.y = ARROW_GROUP_Y2 + this.game.camera.y;

            this.window.draw_separator(SEPARATOR_X, SEPARATOR_Y, SEPARATOR_X+SEPARATOR_LENGTH , SEPARATOR_Y, false);
        }
    }

    /*Hides or shows specific arrows
    
    Input: up, down [boolean] - If true, shows up/down arrow*/
    set_arrows(up:boolean=false, down:boolean=false){
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
            let sprite:Phaser.Sprite = null;

            let dead_idle = this.char_group.children.filter((s:Phaser.Sprite) => { 
                return (s.alive === false && s.key === char.sprite_base.getActionKey(utils.base_actions.IDLE));
            });

            if(dead_idle.length>0) sprite = (dead_idle[0] as Phaser.Sprite).reset(i*GAP_SIZE, 0);
            else sprite = this.char_group.create(i*GAP_SIZE, 0, char.sprite_base.getActionKey(utils.base_actions.IDLE));

            char.sprite_base.setAnimation(sprite, utils.base_actions.IDLE);
            sprite.animations.play(char.sprite_base.getAnimationKey(utils.base_actions.IDLE, utils.reverse_directions[utils.directions.down]));
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

    change_line(line:number, force_index?:number){
        this.clear_arrow_tweens();

        if(this.data.info.party_data.members.length < MAX_PER_LINE*line) return;

        this.current_line = line;
        
        if(force_index !== undefined){
            this.selected_index = force_index;
        }
        else if(this.selected_index !== null && this.selected_index >= this.lines[this.current_line].length){
                this.selected_index = this.lines[this.current_line].length - 1;
        }

        utils.kill_all_sprites(this.char_group);
        this.unset_character(this.selected_index);
        this.set_chars();
        this.check_arrows();
        this.select_char(this.selected_index);
    }

    next_line(force_index?:number){
        if(this.lines.length === 1 || this.current_line + 1 === this.lines.length) return;
        let index =  this.current_line + 1;

        this.change_line(index, force_index);
    }

    previous_line(force_index?:number){
        if(this.lines.length === 1 || this.current_line -1 < 0) return;
        let index = this.current_line - 1;

        this.change_line(index, force_index);
    }

    set_character(index:number){
        if(this.mode===SHOP_MODE){
            //set run animation for new character;
        }

        else if(this.mode===MENU_MODE){
            this.char_group.children[index].y = MENU_SELECTED_Y_SHIFT;
        }
    }

    unset_character(index:number){
        if(this.mode===SHOP_MODE){
            //unset run animation for new character;
        }

        else if(this.mode===MENU_MODE){
            this.char_group.children[index].y = 0;
        }
    }

    select_char(index:number){
        if(this.mode===SHOP_MODE) this.data.cursor_manager.move_to(CURSOR_X + index*GAP_SIZE, CURSOR_Y, "wiggle");
        else if (this.mode===MENU_MODE) this.data.cursor_manager.move_to(CURSOR_X2 + index*GAP_SIZE, CURSOR_Y2, "point", false);

        if(index !== this.selected_index){
            this.unset_character(this.selected_index);
            this.selected_index =  index;
            this.set_character(this.selected_index);
        }
        
        if(this.on_change){
            let c = this.data.info.party_data.members[this.current_line*MAX_PER_LINE + this.selected_index];
            this.on_change(c.key_name);
        }
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

    grant_control(on_cancel:Function, on_select:Function){
        let controls = [
            {key: this.data.gamepad.LEFT, on_down: this.previous_char.bind(this)},
            {key: this.data.gamepad.RIGHT, on_down: this.next_char.bind(this)},
            {key: this.data.gamepad.UP, on_down: this.previous_line.bind(this)},
            {key: this.data.gamepad.DOWN, on_down: this.next_line.bind(this)},
            {key: this.data.gamepad.A, on_down: on_select, params:{reset_control:true}},
            {key: this.data.gamepad.B, on_down: on_cancel, params:{reset_control:true}}
        ];
        this.data.control_manager.set_control(controls,{loop_configs: {horizontal:true}});
    }

    activate(){
        if(this.mode===SHOP_MODE) this.data.cursor_manager.move_to(CURSOR_X + this.selected_index*GAP_SIZE, CURSOR_Y, "wiggle");
        else if (this.mode===MENU_MODE) this.data.cursor_manager.move_to(CURSOR_X2 + this.selected_index*GAP_SIZE, CURSOR_Y2, "point", false);

        this.is_active = true;
    }
    
    deactivate(){
        this.data.cursor_manager.clear_tweens();
        this.is_active = false;
    }

    open(select_index:number=0, mode:string=SHOP_MODE, open_callback?:Function) {
        this.selected_index = select_index;
        this.current_line = 0;
        this.mode = mode;

        this.make_lines();
        this.check_mode();
        this.check_arrows();
        this.set_chars();
        this.select_char(this.selected_index);

        this.char_group.alpha = 1;
        this.is_open = true;

        this.activate();
        this.window.show(open_callback, false);
    }

    close(callback?:Function, destroy:boolean=false) {
        this.is_open = false;
        this.deactivate();
        utils.kill_all_sprites(this.char_group, destroy);

        this.lines = [];
        this.current_line = 0;
        this.selected_index = 0;
        this.is_active = false;
        this.is_open = false;
        this.char_group.alpha = 0;
        this.mode = null;

        this.set_arrows(false, false);

        this.window.clear_separators();
        this.window.close(callback, false);
    }

}