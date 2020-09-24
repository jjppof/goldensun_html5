import { Window } from '../../Window.js';

const FRAME_SIZE = 36;
const DIALOG_WINDOW_WIDTH = 136;
const AVATAR_SHIFT = 4;

const DIALOG_X = 8;
const DIALOG_Y = 12;

export class ShopkeepDialog{
    constructor(game, data){
        this.game = game;
        this.data = data;
        this.shop_key = null;
        this.avatar_key = null;
        this.dialog_key = null;

        this.items_db = _.mapKeys(this.data.items_db, item_data => item_data.key_name);
        this.shops_db = this.data.shops_db;
        this.shopkeep_dialog_db = this.data.shopkeep_dialog_db;

        this.avatar_group = game.add.group();
        this.avatar_group.alpha = 0;
        this.x_avatar = AVATAR_SHIFT;
        this.y_avatar = AVATAR_SHIFT;
        this.avatar = null;

        this.dialog_window = new Window(this.game,FRAME_SIZE+4,0,DIALOG_WINDOW_WIDTH,FRAME_SIZE);
        this.avatar_frame = new Window(this.game,0,0,FRAME_SIZE,FRAME_SIZE);

        this.normal_item_list = [];
        this.artifact_list = [];

        this.messages = null;
        this.current_message = null;
        this.text = this.dialog_window.set_text_in_position("", DIALOG_X, DIALOG_Y);
    }

    set_item_lists(){
        this.normal_item_list = [];
        this.artifact_list = [];

        let item_list = this.shops_db[this.shop_key].item_list;
        for(let i=0; i<item_list.length; i++){
            let item = this.items_db[item_list[i]];

            if(item.rare_item === true) this.artifact_list.push(item);
            else this.normal_item_list.push(item);
        }

        this.normal_item_list = _.mapKeys(this.normal_item_list, item => item.key_name);
        this.artifact_list = _.mapKeys(this.artifact_list, item => item.key_name);
    }

    open(shop_key){
        this.shop_key = shop_key;
        this.avatar_key = this.shops_db[shop_key].avatar_key;
        this.dialog_key = this.shops_db[shop_key].dialog_key;
        this.messages = _.mapKeys(this.shopkeep_dialog_db[this.dialog_key].messages, messages => messages.key);

        this.avatar = this.avatar_group.create(0, 0, "avatars", this.avatar_key);
        this.set_item_lists();

        this.dialog_window.show();
        this.avatar_group.x = this.game.camera.x + this.x_avatar;
        this.avatar_group.y = this.game.camera.y + this.y_avatar;
        this.avatar_group.parent.bringToTop(this.avatar_group);
        this.avatar_frame.show();
        this.avatar_group.alpha = 1;

        this.current_message = this.get_message("welcome");
        this.update_dialog(this.current_message.text); 
    }

    update_position() {
        this.avatar_group.x = this.game.camera.x + this.x_avatar;
        this.avatar_group.y = this.game.camera.y + this.y_avatar;
        this.dialog_window.update_position();
        this.avatar_frame.update_position();
    }
    
    replace_text(type, message, hero=undefined, item=undefined, price=undefined){
        if (type == "hero"){
            return message.replace("{HERO}", hero);
        }
        else if (type == "item"){
            return message.replace("{ITEM}", item);
        }
        else if (type = "price"){
            return message.replace("{PRICE}", price);
        }
    }

    get_message(message_key){
        this.message_key = message_key;

        return this.messages[message_key];
    }

    update_dialog(message){
        this.current_message = message;
        this.dialog_window.update_text(this.current_message,this.text);
        if(!this.dialog_window.open) this.dialog_window.show();
    }

    close_dialog(){
        this.dialog_window.close();
    }

    hide(){
        this.close_dialog();
        this.avatar_frame.close();
        this.avatar_group.alpha = 0;
    }

    close(){
        this.close_dialog();
        this.avatar_frame.close();
        this.avatar_group.alpha = 0;

        this.shop_key = null;
        this.avatar_key = null;
        this.dialog_key = null;
        this.avatar = null;
        
        this.normal_item_list = [];
        this.artifact_list = [];

        this.messages = null;
        this.current_message = null;
    }
}