import {YesNoMenu} from "../windows/YesNoMenu";
import {DialogManager} from "../utils/DialogManager";
import {GoldenSun} from "../GoldenSun";
import {TextObj, Window} from "../Window";
import * as _ from "lodash";

export class InnMenu {
    public game: Phaser.Game;
    public data: GoldenSun;
    public close_callback: Function;

    public choice_menu: YesNoMenu;
    public dialog_manager: DialogManager;
    public coin_window: Window;
    public coin_number: TextObj;
    public callback: Function;
    public mask: Phaser.Graphics;
    public circle: Phaser.Graphics;

    public inn_id: string;
    public avatar: string;
    public cost: number;
    public message: string;

    constructor(game: Phaser.Game, data: GoldenSun) {
        this.game = game;
        this.data = data;

        this.dialog_manager = new DialogManager(this.game, this.data);
        this.choice_menu = new YesNoMenu(this.game, this.data);
        this.coin_window = new Window(this.game, 0, 128, 92, 28);
        this.coin_window.set_text_in_position("Your Coins: ", 8, 8);
        this.coin_number = this.coin_window.set_text_in_position(this.data.info.party_data.coins, 85, 18, true);

        this.cost = 0;
        this.inn_id = null;
        this.avatar = null;
        this.message = null;
        this.callback = undefined;
        this.mask = undefined;
    }

    //Initial function, loads data from db, shows the welcome message, and opens an yes or no menu
    start(inn_id: string, close_callback?: Function) {
        this.data.inn_open = true;
        this.inn_id = inn_id;
        this.avatar = this.data.info.inn_list[this.inn_id].avatar_key;
        this.cost = this.data.info.inn_list[this.inn_id].cost;
        this.close_callback = close_callback;

        this.message = this.data.info.inn_list[this.inn_id].messages.welcome_message;
        this.update_dialogue();

        this.data.control_manager.simple_input(this.inn_price.bind(this));
    }

    //Dialogue function, replaces ${PRICE} with the inn cost and shows the message stored in this.message
    update_dialogue(callback?: Function) {
        if (this.message.includes("${PRICE}")) this.message = this.message.replace("${PRICE}", String(this.cost));

        this.dialog_manager.quick_next(
            this.message,
            callback,
            this.avatar,
            undefined,
            {x: 40, y: 0},
            {x: 0, y: 0},
            false
        );
    }

    //Show inn price dialogue
    inn_price() {
        this.data.control_manager.reset();
        this.message = this.data.info.inn_list[this.inn_id].messages.price_message;
        this.callback = () => {
            this.coin_window_update();
            this.coin_window.show();

            this.choice_menu.open(
                {
                    yes: this.inn_rest.bind(this),
                    no: this.inn_cancel.bind(this),
                },
                {
                    x: this.dialog_manager.window.width / 2 - this.choice_menu.menu.title_window_width / 2 - 2,
                    y: this.dialog_manager.parts[0].height + 4,
                }
            );
        };
        this.update_dialogue(this.callback);
    }
    //If player chooses to rest at the inn, close coin window, check if the player has enough coins
    //and change the message shown
    inn_rest() {
        this.data.control_manager.reset();
        this.coin_window.close();
        if (this.data.info.party_data.coins >= this.cost) {
            this.message = this.data.info.inn_list[this.inn_id].messages.stay_message;
            this.update_dialogue();

            this.data.info.party_data.coins -= this.cost;
            this.data.control_manager.simple_input(this.inn_fade.bind(this));
        } else {
            this.message = this.data.info.inn_list[this.inn_id].messages.not_enough_coins;
            this.update_dialogue();

            this.data.control_manager.simple_input(this.close.bind(this));
        }
    }

    //If player doesn't choose to stay at the inn, show the cancel message and return control to them
    inn_cancel() {
        this.data.control_manager.reset();
        this.coin_window.close();

        this.message = this.data.info.inn_list[this.inn_id].messages.cancel_message;
        this.update_dialogue();

        this.data.control_manager.simple_input(this.close.bind(this));
    }

    //Recover player's HP and PP, run circle animation, show goodbye message
    //and return control to the player
    inn_fade() {
        this.data.control_manager.reset();
        this.dialog_manager.kill_dialog(undefined, false);

        this.mask = this.data.game.add.graphics(this.data.hero.sprite.x, this.data.hero.sprite.y);
        this.data.game.world.mask = this.mask;

        this.inn_recovery();
        this.data.audio.stop_bgm();

        this.mask.clear();
        this.mask.beginFill(0xfffffff);
        this.circle = this.mask.drawCircle(0, 0, this.game.width);

        let fadein = this.game.add.tween(this.circle.scale).to({x: 0, y: 0}, 1000, Phaser.Easing.Linear.None);
        let fadeout = this.game.add.tween(this.circle.scale).to({x: 1, y: 1}, 1000, Phaser.Easing.Linear.None);
        let play_se = this.game.add.audio("inn_se");

        fadein.onComplete.addOnce(function () {
            play_se.play();
        }, this);

        play_se.onStop.addOnce(function () {
            fadeout.start();
        }, this);

        fadeout.onComplete.addOnce(function () {
            this.circle = null;
            this.mask.clear();
            fadein = null;
            fadeout = null;
            play_se = null;

            this.data.audio.play_bgm();
            this.message = this.data.info.inn_list[this.inn_id].messages.goodbye_message;
            this.update_dialogue();

            this.data.control_manager.simple_input(this.close.bind(this));
        }, this);

        fadein.start();
    }

    //Update coin text
    coin_window_update() {
        this.coin_window.update_text(String(this.data.info.party_data.coins), this.coin_number);
    }

    //Close the dialogue window, reset variables and return control to the player
    close() {
        this.dialog_manager.kill_dialog(undefined, false);
        this.data.inn_open = false;
        this.data.control_manager.reset();
        this.cost = 0;
        this.inn_id = null;
        this.avatar = null;
        this.message = null;
        this.callback = undefined;
        this.mask = null;

        if (this.close_callback) this.close_callback();
        this.close_callback = null;
    }

    //Totally recovers character's HP and PP
    inn_recovery() {
        this.data.info.party_data.members.forEach(member => {
            member.current_hp = member.max_hp;
            member.current_pp = member.max_pp;
        });
    }
}
