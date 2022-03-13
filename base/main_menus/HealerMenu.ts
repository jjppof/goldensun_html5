import { GoldenSun } from "../GoldenSun";
import { MainChar } from "../MainChar";
import { NPC } from "../NPC";
import { permanent_status } from "../Player";
import { CharsMenu, CharsMenuModes } from "../support_menus/CharsMenu";
import { HorizontalMenu } from "../support_menus/HorizontalMenu";
import { DialogManager } from "../utils/DialogManager";
import { TextObj, Window } from "../Window";
import { Button } from "../XGamepad";

enum DialogTypes {
    WELCOME,
    MORE_AID,
    REVIVE_INIT,
    NO_DOWNED,
    SELECT_REVIVE,
    POISON_INIT,
    NO_POISON,
    SELECT_POISON,
    HAUNT_INIT,
    NO_HAUNT,
    SELECT_HAUNT,
    CURSE_INIT,
    NO_CURSE,
    SELECT_CURSE,
    LEAVE,
};

const dialog_msgs = {
    [DialogTypes.WELCOME]: "Welcome, weary wanderers. What aid do you seek?",
    [DialogTypes.MORE_AID]: "Do you wish for more aid?",
    [DialogTypes.LEAVE]: "Visit us again anytime you need healing.",

    [DialogTypes.REVIVE_INIT]: "Hmm, you were downed in battle and need reviving, do you?",
    [DialogTypes.NO_DOWNED]: "Fear not, none of your companions is down.",
    [DialogTypes.SELECT_REVIVE]: "Who shall I revive?",

    [DialogTypes.POISON_INIT]: "Hmm, so you need an antidote to poison or deadly poison?",
    [DialogTypes.NO_POISON]: "Fear not! None of your companions has been poisoned!",
    [DialogTypes.SELECT_POISON]: "Whom shall I cure?",

    [DialogTypes.HAUNT_INIT]: "You wish me to drive evil spirits away?",
    [DialogTypes.NO_HAUNT]: "Fear not! None of your companions is being haunted!",
    [DialogTypes.SELECT_HAUNT]: "From whom shall I drive the spirits away?",

    [DialogTypes.CURSE_INIT]: "Hmm, so you wish to have the cursed equipment removed, do you?",
    [DialogTypes.NO_CURSE]: "Fear not! None of your companions has any cursed gear!",
    [DialogTypes.SELECT_CURSE]: "From whom shall I remove the curse?",
};

const status_dialogs_map = {
    init: {
        [permanent_status.DOWNED]: DialogTypes.REVIVE_INIT,
        [permanent_status.POISON]: DialogTypes.POISON_INIT,
        [permanent_status.HAUNT]: DialogTypes.HAUNT_INIT,
        [permanent_status.EQUIP_CURSE]: DialogTypes.CURSE_INIT,
    },
    no_status: {
        [permanent_status.DOWNED]: DialogTypes.NO_DOWNED,
        [permanent_status.POISON]: DialogTypes.NO_POISON,
        [permanent_status.HAUNT]: DialogTypes.NO_HAUNT,
        [permanent_status.EQUIP_CURSE]: DialogTypes.NO_CURSE,
    },
    select: {
        [permanent_status.DOWNED]: DialogTypes.SELECT_REVIVE,
        [permanent_status.POISON]: DialogTypes.SELECT_POISON,
        [permanent_status.HAUNT]: DialogTypes.SELECT_HAUNT,
        [permanent_status.EQUIP_CURSE]: DialogTypes.SELECT_CURSE,
    }
}

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

    private chars_menu: CharsMenu;

    private coins_window: Window;
    private coins_number: TextObj;

    private info_window: Window;
    private info_text: TextObj;

    private selected_perm_status: permanent_status;

    constructor(game: Phaser.Game, data: GoldenSun) {
        this.game = game;
        this.data = data;

        this.npc = null;
        this.dialog = new DialogManager(this.game, this.data);
        this.selected_perm_status = null;

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

        this.chars_menu = new CharsMenu(this.game, this.data, this.char_change.bind(this));

        this.setup_coins_window();
        this.setup_info_window();
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

    private setup_info_window() {
        this.info_window = new Window(this.game, 8, 128, 180, 20);
        this.info_text = this.info_window.set_text_in_position("", 6, 6, {italic: true});
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
                this.check_party_status(permanent_status.DOWNED);
                break;
            case "cure_poison":
                this.check_party_status(permanent_status.POISON);
                break;
            case "repel_evil":
                this.check_party_status(permanent_status.HAUNT);
                break;
            case "remove_curse":
                this.check_party_status(permanent_status.EQUIP_CURSE);
                break;
        }
    }

    private check_party_status(perm_status: permanent_status) {
        this.horizontal_menu.close();
        this.set_dialog(status_dialogs_map.init[perm_status], {
            ask_for_input: true,
            show_crystal: true,
            callback: () => {
                const has_downed = this.data.info.party_data.members.some(c => c.has_permanent_status(perm_status));
                if (has_downed) {
                    this.party_has_status(perm_status);
                } else {
                    this.set_dialog(status_dialogs_map.no_status[perm_status], {
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

    private party_has_status(perm_status: permanent_status) {
        this.horizontal_menu.close();
        this.set_dialog(status_dialogs_map.select[perm_status], {
            ask_for_input: false,
            show_crystal: false,
            callback: () => {
                this.selected_perm_status = perm_status;
                const first_char_index = this.data.info.party_data.members.findIndex(c => c.has_permanent_status(perm_status));
                this.char_change(this.data.info.party_data.members[first_char_index].key_name);
                this.info_window.show();
                this.chars_menu.open(first_char_index, CharsMenuModes.HEALER, () => {
                    this.enable_chars_menu_control();
                }, undefined, this.selected_perm_status);
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

    private enable_chars_menu_control() {
        this.chars_menu.grant_control(() => {
            this.info_window.close();
            this.chars_menu.close(undefined, false, true);
            this.set_dialog(DialogTypes.MORE_AID, {
                ask_for_input: false,
                callback: () => {
                    this.horizontal_menu.open(undefined, this.horizontal_menu_index);
                }
            });
        }, this.char_select.bind(this));
    }

    private char_change(char_key: string) {
        const char = this.data.info.main_char_list[char_key];
        if (char.has_permanent_status(this.selected_perm_status)) {
            const price = this.get_price(char, this.selected_perm_status);
            let info_msg: string;
            switch (this.selected_perm_status) {
                case permanent_status.DOWNED:
                    info_msg = `Revive for ${price} coins`;
                    break;
                case permanent_status.POISON:
                    info_msg = `Cure for ${price} coins`;
                    break;
                case permanent_status.HAUNT:
                    info_msg = `Remove spirits for ${price} coins`;
                    break;
                case permanent_status.EQUIP_CURSE:
                    info_msg = `Remove curse for ${price} coins`;
                    break;
            }
            this.info_window.update_text(info_msg, this.info_text);
        } else {
            let info_msg: string;
            switch (this.selected_perm_status) {
                case permanent_status.DOWNED:
                    info_msg = `This ally needs no healing.`;
                    break;
                case permanent_status.POISON:
                    info_msg = `This ally is not poisoned.`;
                    break;
                case permanent_status.HAUNT:
                    info_msg = `This ally is not haunted.`;
                    break;
                case permanent_status.EQUIP_CURSE:
                    info_msg = `This ally is not cursed.`;
                    break;
            }
            this.info_window.update_text(info_msg, this.info_text);
        }
    }

    private char_select() {
        const char_index = this.chars_menu.selected_index;
        const char = this.data.info.party_data.members[char_index];
        if (char.has_permanent_status(this.selected_perm_status)) {

        } else {
            this.enable_chars_menu_control();
        }
    }

    private get_price(char: MainChar, status: permanent_status) {
        const level = char.level;
        switch (status) {
            case permanent_status.DOWNED:
                return level * 20;
            case permanent_status.POISON:
                return 10;
            case permanent_status.HAUNT:
                return 50;
            case permanent_status.EQUIP_CURSE:
                return level * 10;
        }
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