import {GoldenSun} from "../GoldenSun";
import {degree360} from "../magic_numbers";
import {equip_slots, MainChar} from "../MainChar";
import {NPC} from "../NPC";
import {permanent_status} from "../Player";
import {CharsMenu, CharsMenuModes} from "../support_menus/CharsMenu";
import {HorizontalMenu} from "../support_menus/HorizontalMenu";
import {promised_wait} from "../utils";
import {DialogManager} from "../utils/DialogManager";
import {TextObj, Window} from "../Window";
import {YesNoMenu} from "../windows/YesNoMenu";
import {Button} from "../XGamepad";
import * as _ from "lodash";

enum DialogTypes {
    WELCOME,
    MORE_AID,
    BEGIN,
    LEAVE,
    RECUSE_DONATION,

    REVIVE_INIT,
    NO_DOWNED,
    SELECT_REVIVE,
    DONATION_REVIVE,
    NO_COIN_REVIVE,
    ACCEPT_REVIVE,
    SUCCESS_REVIVE,

    POISON_INIT,
    NO_POISON,
    SELECT_POISON,
    DONATION_POISON,
    NO_COIN_POISON,
    ACCEPT_POISON,
    SUCCESS_POISON,

    HAUNT_INIT,
    NO_HAUNT,
    SELECT_HAUNT,
    DONATION_HAUNT,
    NO_COIN_HAUNT,
    ACCEPT_HAUNT,
    SUCCESS_HAUNT,

    CURSE_INIT,
    NO_CURSE,
    SELECT_CURSE,
    DONATION_CURSE,
    NO_COIN_CURSE,
    ACCEPT_CURSE,
    SUCCESS_CURSE,
}

const dialog_msgs = {
    [DialogTypes.WELCOME]: "Welcome, weary wanderers. What aid do you seek?",
    [DialogTypes.MORE_AID]: "Do you wish for more aid?",
    [DialogTypes.BEGIN]: "Shall I begin?",
    [DialogTypes.RECUSE_DONATION]: "The donation is too much? Then weary wanderers you shall remain.",
    [DialogTypes.LEAVE]: "Visit us again anytime you need healing.",

    [DialogTypes.REVIVE_INIT]: "Hmm, you were downed in battle and need reviving, do you?",
    [DialogTypes.NO_DOWNED]: "Fear not, none of your companions is down.",
    [DialogTypes.SELECT_REVIVE]: "Who shall I revive?",
    [DialogTypes.DONATION_REVIVE]: (price, char) => `Reviving ${char} requires a donation of ${price} coins. OK?`,
    [DialogTypes.NO_COIN_REVIVE]: "I'm sorry, but you must be able to pay the donation.",
    [DialogTypes.ACCEPT_REVIVE]: "Then I call upon my healing powers.",
    [DialogTypes.SUCCESS_REVIVE]: char => `${char} has been revived!`,

    [DialogTypes.POISON_INIT]: "Hmm, so you need an antidote to poison or deadly poison?",
    [DialogTypes.NO_POISON]: "Fear not! None of your companions has been poisoned!",
    [DialogTypes.SELECT_POISON]: "Whom shall I cure?",
    [DialogTypes.DONATION_POISON]: (price, char) => `I require a donation of ${price} coins to cure ${char}, OK?`,
    [DialogTypes.NO_COIN_POISON]: "You cannot cover the required donation, so I cannot provide a cure.",
    [DialogTypes.ACCEPT_POISON]: "I shall apply the cure.",
    [DialogTypes.SUCCESS_POISON]: char => `The poison has left ${char}.`,

    [DialogTypes.HAUNT_INIT]: "You wish me to drive evil spirits away?",
    [DialogTypes.NO_HAUNT]: "Fear not! None of your companions is being haunted!",
    [DialogTypes.SELECT_HAUNT]: "From whom shall I drive the spirits away?",
    [DialogTypes.DONATION_HAUNT]: (price, char) =>
        `A donation of ${price} coins is needed to drive spirits from ${char}.`,
    [DialogTypes.NO_COIN_HAUNT]: "You cannot cover the required donation, so I cannot aid you.",
    [DialogTypes.ACCEPT_HAUNT]: "Then I shall drive the spirits away.",
    [DialogTypes.SUCCESS_HAUNT]: char => `The spirits no longer haunt ${char}.`,

    [DialogTypes.CURSE_INIT]: "Hmm, so you wish to have the cursed equipment removed, do you?",
    [DialogTypes.NO_CURSE]: "Fear not! None of your companions has any cursed gear!",
    [DialogTypes.SELECT_CURSE]: "From whom shall I remove the curse?",
    [DialogTypes.DONATION_CURSE]: (price, char) =>
        `Donate ${price} coins for me to remove ${char}${char.endsWith("s") ? "'" : "'s"} curse.`,
    [DialogTypes.NO_COIN_CURSE]: "You cannot cover the required donation, so I cannot aid you.",
    [DialogTypes.ACCEPT_CURSE]: "Then I shall remove the curse.",
    [DialogTypes.SUCCESS_CURSE]: char => `The curse has been removed from ${char}.`,
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
    },
    donation: {
        [permanent_status.DOWNED]: DialogTypes.DONATION_REVIVE,
        [permanent_status.POISON]: DialogTypes.DONATION_POISON,
        [permanent_status.HAUNT]: DialogTypes.DONATION_HAUNT,
        [permanent_status.EQUIP_CURSE]: DialogTypes.DONATION_CURSE,
    },
    no_coin: {
        [permanent_status.DOWNED]: DialogTypes.NO_COIN_REVIVE,
        [permanent_status.POISON]: DialogTypes.NO_COIN_POISON,
        [permanent_status.HAUNT]: DialogTypes.NO_COIN_HAUNT,
        [permanent_status.EQUIP_CURSE]: DialogTypes.NO_COIN_CURSE,
    },
    accept: {
        [permanent_status.DOWNED]: DialogTypes.ACCEPT_REVIVE,
        [permanent_status.POISON]: DialogTypes.ACCEPT_POISON,
        [permanent_status.HAUNT]: DialogTypes.ACCEPT_HAUNT,
        [permanent_status.EQUIP_CURSE]: DialogTypes.ACCEPT_CURSE,
    },
    success: {
        [permanent_status.DOWNED]: DialogTypes.SUCCESS_REVIVE,
        [permanent_status.POISON]: DialogTypes.SUCCESS_POISON,
        [permanent_status.HAUNT]: DialogTypes.SUCCESS_HAUNT,
        [permanent_status.EQUIP_CURSE]: DialogTypes.SUCCESS_CURSE,
    },
};

export class HealerMenu {
    private static readonly BUTTONS = ["revive", "cure_poison", "repel_evil", "remove_curse"];
    private static readonly EMITTER_NAME = "cure_emitter";

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

    private yes_no_menu: YesNoMenu;

    constructor(game: Phaser.Game, data: GoldenSun) {
        this.game = game;
        this.data = data;

        this.npc = null;
        this.dialog = new DialogManager(this.game, this.data);
        this.selected_perm_status = null;

        this._horizontal_menu = new HorizontalMenu(
            this.game,
            this.data,
            HealerMenu.BUTTONS,
            ["Revive", "Cure Poison", "Repel Evil", "Remove Curse"],
            {
                on_press: this.on_horizontal_menu_chose.bind(this),
                on_cancel: this.on_horizontal_menu_cancel.bind(this),
            }
        );
        this.horizontal_menu_index = 0;

        this.chars_menu = new CharsMenu(this.game, this.data, this.char_change.bind(this));

        this.yes_no_menu = new YesNoMenu(this.game, this.data);

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
        this.info_window = new Window(this.game, 8, 128, 200, 20);
        this.info_text = this.info_window.set_text_in_position("", 6, 6, {italic: true});
    }

    update_position() {
        this.coins_window.update();
        this.horizontal_menu.update_position();
    }

    private set_dialog(options: {
        ask_for_input: boolean;
        dialog_type?: DialogTypes;
        callback?: () => void;
        show_crystal?: boolean;
        custom_msg?: string;
    }) {
        const msg = options?.custom_msg ?? (dialog_msgs[options?.dialog_type] as string);
        this.dialog.next_dialog(
            msg,
            () => {
                if (options?.ask_for_input) {
                    this.data.control_manager.add_controls(
                        [
                            {
                                buttons: Button.A,
                                on_down: options?.callback,
                                params: {
                                    reset_controls: true,
                                },
                            },
                        ],
                        {persist: false}
                    );
                } else {
                    options?.callback();
                }
            },
            {
                avatar: this.npc.avatar,
                voice_key: this.npc.voice_key,
                custom_pos: {x: 40, y: 0},
                custom_avatar_pos: {x: 0, y: 0},
                show_crystal: options?.show_crystal,
            }
        );
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
        this.set_dialog({
            dialog_type: status_dialogs_map.init[perm_status],
            ask_for_input: true,
            show_crystal: true,
            callback: () => {
                const has_status = this.data.info.party_data.members.some(c => c.has_permanent_status(perm_status));
                if (has_status) {
                    this.party_has_status(perm_status);
                } else {
                    this.set_dialog({
                        dialog_type: status_dialogs_map.no_status[perm_status],
                        ask_for_input: true,
                        show_crystal: false,
                        callback: () => {
                            this.set_dialog({
                                dialog_type: DialogTypes.MORE_AID,
                                ask_for_input: false,
                                callback: () => {
                                    this.horizontal_menu.open(undefined, this.horizontal_menu_index);
                                },
                            });
                        },
                    });
                }
            },
        });
    }

    private party_has_status(perm_status: permanent_status) {
        this.horizontal_menu.close();
        this.set_dialog({
            dialog_type: status_dialogs_map.select[perm_status],
            ask_for_input: false,
            show_crystal: false,
            callback: () => {
                this.selected_perm_status = perm_status;
                const first_char_index = this.data.info.party_data.members.findIndex(c =>
                    c.has_permanent_status(perm_status)
                );
                this.char_change(this.data.info.party_data.members[first_char_index].key_name);
                this.info_window.show();
                this.chars_menu.open(
                    first_char_index,
                    CharsMenuModes.HEALER,
                    () => {
                        this.enable_chars_menu_control();
                    },
                    undefined,
                    this.selected_perm_status
                );
            },
        });
    }

    private on_horizontal_menu_cancel() {
        this.horizontal_menu.close(() => {
            this.set_dialog({
                dialog_type: DialogTypes.LEAVE,
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
                },
            });
        });
    }

    private enable_chars_menu_control() {
        this.chars_menu.grant_control(() => {
            this.info_window.close();
            this.chars_menu.close(undefined, true);
            this.set_dialog({
                dialog_type: DialogTypes.MORE_AID,
                ask_for_input: false,
                callback: () => {
                    this.horizontal_menu.open(undefined, this.horizontal_menu_index);
                },
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
                case permanent_status.VENOM:
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
                    info_msg = "This ally needs no healing.";
                    break;
                case permanent_status.POISON:
                case permanent_status.VENOM:
                    info_msg = "This ally is not poisoned.";
                    break;
                case permanent_status.HAUNT:
                    info_msg = "This ally is not haunted.";
                    break;
                case permanent_status.EQUIP_CURSE:
                    info_msg = "This ally is not cursed.";
                    break;
            }
            this.info_window.update_text(info_msg, this.info_text);
        }
    }

    private char_select() {
        const char_index = this.chars_menu.selected_index;
        const char = this.data.info.party_data.members[char_index];
        if (char.has_permanent_status(this.selected_perm_status)) {
            const input_and_crystal = [permanent_status.HAUNT, permanent_status.EQUIP_CURSE].includes(
                this.selected_perm_status
            );
            const price = this.get_price(char, this.selected_perm_status);
            const donation_msg = dialog_msgs[status_dialogs_map.donation[this.selected_perm_status]](price, char.name);
            this.set_dialog({
                ask_for_input: input_and_crystal,
                show_crystal: input_and_crystal,
                custom_msg: donation_msg,
                callback: () => {
                    if (input_and_crystal) {
                        this.set_dialog({
                            dialog_type: DialogTypes.BEGIN,
                            ask_for_input: false,
                            show_crystal: false,
                            callback: () => {
                                this.invoke_yes_no_to_confirm(price, char);
                            },
                        });
                    } else {
                        this.invoke_yes_no_to_confirm(price, char);
                    }
                },
            });
        } else {
            this.enable_chars_menu_control();
        }
    }

    private invoke_yes_no_to_confirm(price: number, char: MainChar) {
        this.yes_no_menu.open(
            {
                yes: () => {
                    if (price > this.data.info.party_data.coins) {
                        this.set_dialog({
                            dialog_type: status_dialogs_map.no_coin[this.selected_perm_status],
                            ask_for_input: true,
                            show_crystal: true,
                            callback: () => {
                                this.party_has_status(this.selected_perm_status);
                            },
                        });
                    } else {
                        this.data.info.party_data.coins -= price;
                        this.set_dialog({
                            dialog_type: status_dialogs_map.accept[this.selected_perm_status],
                            ask_for_input: true,
                            show_crystal: true,
                            callback: () => {
                                this.remove_status(char);
                            },
                        });
                    }
                },
                no: () => {
                    this.set_dialog({
                        dialog_type: DialogTypes.RECUSE_DONATION,
                        ask_for_input: true,
                        show_crystal: true,
                        callback: () => {
                            this.party_has_status(this.selected_perm_status);
                        },
                    });
                },
            },
            {
                x: 56,
                y: 56,
            }
        );
    }

    private async remove_status(char: MainChar) {
        this.data.cursor_manager.hide();
        await this.cure_animation();
        this.data.cursor_manager.show();
        char.remove_permanent_status(this.selected_perm_status);
        if (this.selected_perm_status === permanent_status.DOWNED) {
            char.current_hp = char.max_hp;
        } else if (this.selected_perm_status === permanent_status.EQUIP_CURSE) {
            for (let slot_type in char.equip_slots) {
                const slot = char.equip_slots[slot_type as equip_slots];
                if (slot) {
                    const item = this.data.info.items_list[slot.key_name];
                    if (item.curses_when_equipped) {
                        char.unequip_item(slot.index);
                    }
                }
            }
        }
        this.coins_window.update_text(this.data.info.party_data.coins.toString(), this.coins_number);
        this.set_dialog({
            ask_for_input: true,
            show_crystal: false,
            custom_msg: dialog_msgs[status_dialogs_map.success[this.selected_perm_status]](char.name),
            callback: () => {
                const has_status = this.data.info.party_data.members.some(c =>
                    c.has_permanent_status(this.selected_perm_status)
                );
                if (has_status) {
                    this.party_has_status(this.selected_perm_status);
                } else {
                    this.selected_perm_status = null;
                    this.info_window.close();
                    this.chars_menu.close(undefined, true);
                    this.set_dialog({
                        dialog_type: DialogTypes.MORE_AID,
                        ask_for_input: false,
                        callback: () => {
                            this.horizontal_menu.open(undefined, this.horizontal_menu_index);
                        },
                    });
                }
            },
        });
    }

    private async cure_animation() {
        let cure_sfx = this.get_cure_sfx();
        this.data.audio.pause_bgm();
        this.data.audio.play_se(cure_sfx);
        const char_sprite = this.chars_menu.selected_char_sprite;
        char_sprite.animations.stop(char_sprite.animations.currentAnim.name, false);
        const hue_filter = this.game.add.filter("Hue") as Phaser.Filter.Hue;
        char_sprite.filters = [hue_filter];
        const hueshift_timer = this.game.time.create(false);
        hueshift_timer.loop(10, () => {
            hue_filter.angle = Math.random() * degree360;
        });
        hueshift_timer.start();
        const emitter = this.start_particles_emitter(char_sprite);

        await promised_wait(this.game, 4000);

        char_sprite.animations.currentAnim.play();

        char_sprite.filters = undefined;
        hueshift_timer.stop();

        this.data.particle_manager.removeEmitter(emitter);
        emitter.destroy();
        this.data.particle_manager.clearData(HealerMenu.EMITTER_NAME);
        this.data.audio.play_se("battle/heal_1");
        this.data.audio.resume_bgm();
    }

    private get_cure_sfx() {
        switch (this.selected_perm_status) {
            case permanent_status.DOWNED:
                return "psynergy/revive";
            case permanent_status.VENOM:
            case permanent_status.POISON:
                return "psynergy/ply";
            case permanent_status.EQUIP_CURSE:
                return "misc/remove_curse";
            case permanent_status.HAUNT:
                return "misc/repel_evil";
        }
    }

    private start_particles_emitter(char_sprite: Phaser.Sprite) {
        const out_data = {
            image: "psynergy_ball",
            alpha: 0.9,
            lifespan: 500,
            frame: "ball/03",
            scale: {min: 0.3, max: 0.4},
            target: {
                x: char_sprite.centerX,
                y: char_sprite.centerY,
            },
        };
        this.data.particle_manager.addData(HealerMenu.EMITTER_NAME, out_data);
        const circle_zone = this.data.particle_manager.createCircleZone(char_sprite.height << 1);
        const emitter = this.data.particle_manager.createEmitter(Phaser.ParticleStorm.SPRITE);
        const displays = emitter.addToWorld(this.chars_menu.char_group);
        displays.forEach(display => {
            if (display) {
                this.chars_menu.char_group.sendToBack(display);
            }
        });
        emitter.emit(HealerMenu.EMITTER_NAME, char_sprite.centerX, char_sprite.centerY, {
            zone: circle_zone,
            total: 3,
            repeat: 32,
            frequency: 60,
            random: true,
        });
        emitter.onEmit = new Phaser.Signal();
        emitter.onEmit.add((emitter: Phaser.ParticleStorm.Emitter, particle: Phaser.ParticleStorm.Particle) => {
            particle.sprite.tint = _.sample([16776470, 190960, 16777215, 5700990]);
        });
        return emitter;
    }

    private get_price(char: MainChar, status: permanent_status) {
        const level = char.level;
        switch (status) {
            case permanent_status.DOWNED:
                return level * 20;
            case permanent_status.POISON:
            case permanent_status.VENOM:
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
        this.set_dialog({
            dialog_type: DialogTypes.WELCOME,
            ask_for_input: false,
            callback: () => {
                this.coins_window.show();
                this.horizontal_menu.open(undefined, this.horizontal_menu_index);
            },
        });
    }
}
