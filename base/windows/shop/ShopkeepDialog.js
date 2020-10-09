import { DialogManager } from '../../DialogManager.js';

const FRAME_SIZE = 36;

export class ShopkeepDialog{
    constructor(game, data, parent){
        this.game = game;
        this.data = data;
        this.parent = parent;
        this.shop_key = null;
        this.avatar_key = null;
        this.dialog_key = null;

        this.dialog_manager = new DialogManager(this.game, this.data);

        this.messages = null;
        this.current_message = null;
        this.is_active = false;
    }

    open(shop_key){
        this.shop_key = shop_key;
        this.avatar_key = this.parent.shops_db[shop_key].avatar_key;
        this.dialog_key = this.parent.shops_db[shop_key].dialog_key;
        this.messages = _.mapKeys(this.data.shop_screen.shopkeep_dialog_db[this.dialog_key].messages, messages => messages.key);

        this.update_dialog("welcome"); 
    }

    update_position(){
        this.dialog_manager.update_position(0,0,FRAME_SIZE+4,0);
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
        return this.messages[message_key].text;
    }

    update_dialog(message, show_crystal=false, is_key=true, callback=undefined){
        if(is_key) this.current_message = this.messages[message].text;
        else this.current_message = message;
        this.is_active = true;

        this.dialog_manager.quick_next(this.current_message,
        callback,
        this.avatar_key,
        undefined,
        {x: FRAME_SIZE+4, y:0},
        {x: 0, y: 0},
        show_crystal);
    }

    close_dialog(callback, dialog_only=true){
        this.is_active = false;
        this.dialog_manager.kill_dialog(callback, dialog_only);
    }

    close(){
        this.close_dialog(undefined, false);

        this.shop_key = null;
        this.avatar_key = null;
        this.dialog_key = null;

        this.messages = null;
        this.current_message = null;
    }
}