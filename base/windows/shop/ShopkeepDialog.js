import { DialogManager } from '../../DialogManager.js';
import { Window } from '../../Window.js';

const FRAME_SIZE = 36;
const DIALOG_WINDOW_WIDTH = 136;
const AVATAR_SHIFT = 4;

const DIALOG_X = 8;
const DIALOG_Y = 8;

export class ShopkeepDialog{
    constructor(game, data, parent){
        this.game = game;
        this.data = data;
        this.parent = parent;
        this.shop_key = null;
        this.avatar_key = null;
        this.dialog_key = null;

        //this.avatar_group = game.add.group();
        //this.avatar_group.alpha = 0;
        //this.x_avatar = AVATAR_SHIFT;
        //this.y_avatar = AVATAR_SHIFT;
        //this.avatar = null;

        this.dialog_manager = new DialogManager(this.game, this.data);
        //this.dialog_window = new Window(this.game,FRAME_SIZE+4,0,DIALOG_WINDOW_WIDTH,FRAME_SIZE);
        //this.avatar_frame = new Window(this.game,0,0,FRAME_SIZE,FRAME_SIZE);

        this.messages = null;
        this.current_message = null;
        //this.text = this.dialog_window.set_text_in_position("", DIALOG_X, DIALOG_Y);
    }

    is_active(){
        return (this.dialog_manager.window ? true : false);
    }

    open(shop_key){
        this.shop_key = shop_key;
        this.avatar_key = this.parent.shops_db[shop_key].avatar_key;
        this.dialog_key = this.parent.shops_db[shop_key].dialog_key;
        this.messages = _.mapKeys(this.data.shop_screen.shopkeep_dialog_db[this.dialog_key].messages, messages => messages.key);

        //this.avatar = this.avatar_group.create(0, 0, "avatars", this.avatar_key);

        //this.dialog_window.show();
        //this.avatar_group.x = this.game.camera.x + this.x_avatar;
        //this.avatar_group.y = this.game.camera.y + this.y_avatar;
        //this.avatar_group.parent.bringToTop(this.avatar_group);
        //this.avatar_frame.show();
        //this.avatar_group.alpha = 1;

        this.current_message = this.get_message("welcome");
        this.update_dialog(this.current_message.text); 
    }

    update_position() {
        this.avatar_group.x = this.game.camera.x + this.x_avatar;
        this.avatar_group.y = this.game.camera.y + this.y_avatar;
        //this.dialog_window.update_position();
        //this.avatar_frame.update_position();
    }
    
    replace_text(type, message, input){
        if (type == "hero"){
            return message.replace("${HERO}", input);
        }
        else if (type == "item"){
            return message.replace("${ITEM}", input);
        }
        else if (type = "price"){
            return message.replace("${PRICE}", input);
        }
    }

    get_message(message_key){
        this.current_message_key = message_key;

        return this.messages[message_key];
    }

    update_dialog(message){
        this.current_message = message;
        //this.dialog_window.update_text(this.current_message,this.text);
        //if(!this.dialog_window.open) this.dialog_window.show();
        this.dialog_manager.set_dialog(this.current_message, this.avatar_key);
        this.dialog_manager.next(undefined, {x: FRAME_SIZE+4, y:0}, {x: 0, y: 0});
    }

    close_dialog(){
        //this.dialog_window.close();
        //if(this.dialog_manager.window.open) this.dialog_manager.window.close();
    }

    hide(dialog_only=true){
        this.dialog_manager.hide(dialog_only);
        //this.close_dialog();
        //this.avatar_frame.close();
        //this.avatar_group.alpha = 0;
    }

    close(){
        //this.close_dialog();
        this.hide(false);
        //this.avatar_frame.close();
        //this.avatar_group.alpha = 0;

        this.shop_key = null;
        this.avatar_key = null;
        this.dialog_key = null;
        //this.avatar = null;

        this.messages = null;
        this.current_message = null;
    }
}