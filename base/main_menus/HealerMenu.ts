import { GoldenSun } from "../GoldenSun";
import { NPC } from "../NPC";
import { permanent_status } from "../Player";
import { HorizontalMenu } from "../support_menus/HorizontalMenu";
import { DialogManager } from "../utils/DialogManager";
import { TextObj, Window } from "../Window";
import { Button } from "../XGamepad";

enum DialogTypes {
    WELCOME,
    MORE_AID,
    REVIVE_INIT,
    NO_DOWNED,
    LEAVE,
};

const dialog_msgs = {
    [DialogTypes.WELCOME]: "Welcome, weary wanderers. What aid do you seek?",
    [DialogTypes.MORE_AID]: "Do you wish for more aid?",
    [DialogTypes.REVIVE_INIT]: "Hmm, you were downed in battle and need reviving, do you?",
    [DialogTypes.NO_DOWNED]: "Fear not, none of your companions is down.",
    [DialogTypes.LEAVE]: "Visit us again anytime you need healing.",
};

export class HealerMenu {
    private static readonly BUTTONS = [
        "revive",
        "cure_poison",
        "repel_evil",
        "remove_curse"
    ];

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

        this._horizontal_menu = new HorizontalMenu(this.game, this.data, HealerMenu.BUTTONS, [
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

    private set_dialog(dialog_type: DialogTypes, options: {
        ask_for_input: boolean,
        callback?: () => void,
        show_crystal?: boolean
    }) {
        const msg = dialog_msgs[dialog_type];
        this.dialog.next_dialog(msg, () => {
            if (options?.ask_for_input) {
                this.data.control_manager.add_controls([{
                    buttons: Button.A,
                    on_down: options?.callback,
                    params: {
                        reset_controls: true
                    }
                }], {persist: false});
            } else {
                options?.callback();
            }
        }, {
            avatar: this.npc.avatar,
            voice_key: this.npc.voice_key,
            custom_pos: {x: 40, y: 0},
            custom_avatar_pos: {x: 0, y: 0},
            show_crystal: options?.show_crystal
        });
    }

    private on_horizontal_menu_chose() {
        this.horizontal_menu_index = this.horizontal_menu.selected_button_index;
        switch (HealerMenu.BUTTONS[this.horizontal_menu.selected_button_index]) {
            case "revive":
                this.revive_selected();
                break;
            case "cure_poison":
                break;
            case "repel_evil":
                break;
            case "remove_curse":
                break;
        }
    }

    private revive_selected() {
        this.horizontal_menu.close();
        this.set_dialog(DialogTypes.REVIVE_INIT, {
            ask_for_input: true,
            show_crystal: true,
            callback: () => {
                const has_downed = this.data.info.party_data.members.some(c => c.has_permanent_status(permanent_status.DOWNED));
                if (has_downed) {

                } else {
                    this.set_dialog(DialogTypes.NO_DOWNED, {
                        ask_for_input: true,
                        show_crystal: false,
                        callback: () => {
                            this.set_dialog(DialogTypes.MORE_AID, {
                                ask_for_input: false,
                                callback: () => {
                                    this.horizontal_menu.open(undefined, this.horizontal_menu_index);
                                }
                            });
                        }
                    });
                }
            }
        });
    }

    private on_horizontal_menu_cancel() {
        this.horizontal_menu.close(() => {
            this.set_dialog(DialogTypes.LEAVE, {
                ask_for_input: true,
                callback: () => {
                    this.npc = null;
                    this.dialog.close_dialog();
                    this.coins_window.close(() => {
                        this.data.healer_open = false;
                        if (this.close_callback) {
                            this.close_callback();
                        }
                    });
                }
            });
        });
    }

    open_menu(npc: NPC, close_callback: HealerMenu["close_callback"]) {
        this.data.healer_open = true;
        this.npc = npc;
        this.close_callback = close_callback;
        this.horizontal_menu_index = 0;
        this.coins_window.update_text(this.data.info.party_data.coins.toString(), this.coins_number);
        this.set_dialog(DialogTypes.WELCOME, {
            ask_for_input: false,
            callback: () => {
                this.coins_window.show();
                this.horizontal_menu.open(undefined, this.horizontal_menu_index);
            }
        });
    }
}