import { HorizontalMenu } from '../base/menus/HorizontalMenu.js';
import { ShopkeepDialog } from '../base/windows/shop/ShopkeepDialog.js';
import { BuyArtifactsMenu } from '../base/windows/shop/BuyArtifactsMenu.js';
import { SellRepairMenu } from '../base/windows/shop/SellRepairMenu.js';
import { capitalize } from '../utils.js';

export class ShopMenuScreen{
    constructor(game, data, shop_key){
        this.game = game;
        this.data = data;
        this.shop_key = shop_key;
        let esc_propagation_priority = 0;
        let enter_propagation_priority = 0;

        this.buttons_keys = ["buy", "sell", "artifacts", "repair"];
        this.horizontal_menu = new HorizontalMenu(
            this.game,
            this.data,
            this.buttons_keys,
            this.buttons_keys.map(b => capitalize(b)),
            this.button_press.bind(this),
            enter_propagation_priority,
            this.close_menu.bind(this),
            esc_propagation_priority
        );
        ++esc_propagation_priority;
        ++enter_propagation_priority;

        this.npc_dialog = new ShopkeepDialog(this.game, this.data);
        this.buy_menu = new BuyArtifactsMenu(this.game, this.data);
        this.sell_menu = new SellRepairMenu(this.game, this.data);
        this.artifacts_menu = new BuyArtifactsMenu(this.game, this.data);
        this.repair_menu = new SellRepairMenu(this.game, this.data);
    }

    button_press(index) {
        switch (this.buttons_keys[index]) {
            case "buy":
                this.button_press_action(this.buy_menu);
                break;
            case "sell":
                this.button_press_action(this.sell_menu);
                break;
            case "artifacts":
                this.button_press_action(this.artifacts_menu);
                break;
            case "repair":
                this.button_press_action(this.repair_menu);
                break;
        }
    }

    button_press_action(menu) {
        /*
        this.horizontal_menu.deactivate();
        menu.open_menu(close_this_menu => {
            this.horizontal_menu.activate();
            if (close_this_menu) {
                this.close_menu();
            }
        });
        */
    }

    update_position() {
        this.npc_dialog.update_position();
        this.horizontal_menu.update_position();
    }

    is_active() {
        return this.horizontal_menu.menu_active;
    }

    open_menu() {
        this.data.in_dialog = true;
        this.npc_dialog.open(this.shop_key);

        this.data.menu_open = true;
        this.horizontal_menu.open();
        
    }

    close_menu() {
        if (!this.is_active()) return;
        this.data.menu_open = false;
        this.horizontal_menu.close();

        this.npc_dialog.current_message = this.npc_dialog.get_message("goodbye");
        this.npc_dialog.update_dialog(this.npc_dialog.current_message.text); 

        data.enter_input.add(() => {
            if (data.hero.in_action() || data.in_battle || !data.created) return;
            if (!data.menu_open) {
                data.menu_open = true;
                data.hero.stop_char();
                data.hero.update_shadow();
                data.menu_screen.open_menu();
            } else if (data.menu_screen.is_active()) {
                data.in_dialog = false;
                data.shop_screen.npc_dialog.close();
            }
        }, this);
    }
}