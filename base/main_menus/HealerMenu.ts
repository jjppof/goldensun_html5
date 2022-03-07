import { GoldenSun } from "../GoldenSun";
import { NPC } from "../NPC";
import { HorizontalMenu } from "../support_menus/HorizontalMenu";
import { DialogManager } from "../utils/DialogManager";
import { TextObj, Window } from "../Window";

enum DialogTypes {
    WELCOME
};

const dialog_msgs = {
    [DialogTypes.WELCOME]: "Welcome, weary wanderers. What aid do you seek?"
};

export class HealerMenu {
    private game: Phaser.Game;
    private data: GoldenSun;

    private npc: NPC;
    private dialog: DialogManager;

    private close_callback: () => void;

    private _horizontal_menu: HorizontalMenu;
    private horizontal_menu_index: number;

    private coins_window: Window;
    private coins_number: TextObj;

    constructor(game: Phaser.Game, data: GoldenSun) {
        this.game = game;
        this.data = data;

        this.npc = null;
        this.dialog = new DialogManager(this.game, this.data);

        this._horizontal_menu = new HorizontalMenu(this.game, this.data, [
            "revive",
            "cure_poison",
            "repel_evil",
            "remove_curse"
        ], [
            "Revive",
            "Cure Poison",
            "Repel Evil",
            "Remove Curse"
        ], {
            on_press: this.on_horizontal_menu_chose.bind(this),
            on_cancel: this.on_horizontal_menu_cancel.bind(this),
        });
        this.horizontal_menu_index = 0;

        this.setup_coins_window();
    }

    get horizontal_menu() {
        return this._horizontal_menu;
    }

    private setup_coins_window() {
        this.coins_window = new Window(this.game, 128, 88, 92, 28);
        this.coins_window.set_text_in_position("Your Coins: ", 8, 8);
        this.coins_number = this.coins_window.set_text_in_position("", 85, 18, {
            right_align: true,
        });
    }

    update_position() {
        this.coins_window.update();
        this.horizontal_menu.update_position();
    }

    private set_dialog(dialog_type: DialogTypes, callback: () => void = () => {}) {
        const msg = dialog_msgs[dialog_type];
        this.dialog.next_dialog(msg, callback, {
            avatar: this.npc.avatar,
            voice_key: this.npc.voice_key,
            custom_pos: {x: 40, y: 0},
            custom_avatar_pos: {x: 0, y: 0}
        });
    }

    private on_horizontal_menu_chose() {

    }

    private on_horizontal_menu_cancel() {
        this.close();
    }

    open_menu(npc: NPC, close_callback: HealerMenu["close_callback"]) {
        this.data.healer_open = true;
        this.npc = npc;
        this.close_callback = close_callback;
        this.horizontal_menu_index = 0;
        this.coins_window.update_text(this.data.info.party_data.coins.toString(), this.coins_number);
        this.set_dialog(DialogTypes.WELCOME, () => {
            this.coins_window.show();
            this.horizontal_menu.open(undefined, this.horizontal_menu_index);
        });
    }

    close() {
        this.npc = null;
        this.dialog.kill_dialog();
        this.coins_window.close();
        this.horizontal_menu.close(() => {
            this.data.healer_open = false;
            if (this.close_callback) {
                this.close_callback();
            }
        });
    }
}