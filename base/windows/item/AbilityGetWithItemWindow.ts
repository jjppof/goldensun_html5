import {TextObj, Window} from "../../Window";
import {Item} from "../../Item";
import {GoldenSun} from "../../GoldenSun";
import {ItemSlot, MainChar} from "../../MainChar";
import * as _ from "lodash";
import {Classes} from "../../Classes";
import {elemental_stats} from "../../Player";
import {Ability} from "Ability";

const BASE_WIN_WIDTH = 100;
const BASE_WIN_HEIGHT = 92;
const BASE_WIN_X = 0;
const BASE_WIN_Y = 40;
const ARROW_X = 32;
const ARROW_Y = 49;

export class AbilityGetWithItemWindow {
    public game: Phaser.Game;
    public data: GoldenSun;
    public char: MainChar;
    public window_open: boolean;
    public x: number;
    public y: number;
    public base_window: Window;
    public avatar_group: Phaser.Group;
    public x_avatar: number;
    public y_avatar: number;
    public avatar: Phaser.Sprite;
    public name_text: TextObj;
    public lv_text: TextObj;
    public ability_text: TextObj;

    public ability_status: TextObj;

    public item: Item;
    public item_obj: ItemSlot;

    constructor(game, data) {
        this.game = game;
        this.data = data;
        this.char = null;
        this.window_open = false;
        this.x = BASE_WIN_X;
        this.y = BASE_WIN_Y;
        this.base_window = new Window(this.game, this.x, this.y, BASE_WIN_WIDTH, BASE_WIN_HEIGHT);
        this.avatar_group = game.add.group();
        this.avatar_group.visible = false;
        this.x_avatar = this.x + 8;
        this.y_avatar = this.y + 8;
        this.avatar = null;

        this.base_window.set_text_in_position("Lv", 48, 24);

        this.name_text = this.base_window.set_text_in_position("0", 40, 8);
        this.lv_text = this.base_window.set_text_in_position("0", 80, 24);

        this.ability_text = this.base_window.set_text_in_position("0", 8, 56);
        this.ability_status = this.base_window.set_text_in_position("0", 8, 64);
    }

    update_position() {
        this.avatar_group.x = this.game.camera.x + this.x_avatar;
        this.avatar_group.y = this.game.camera.y + this.y_avatar;
    }

    hide() {
        this.base_window.group.visible = false;
        this.avatar_group.visible = false;
    }

    show() {
        if (!this.window_open) return;
        this.base_window.group.visible = true;
        this.avatar_group.visible = true;
    }

    update_info() {
        this.base_window.update_text(this.char.name, this.name_text);
        this.base_window.update_text(this.char.level.toString(), this.lv_text);

        let ability_granted: Ability = this.data.info.abilities_list[this.item.granted_ability];
        this.base_window.update_text(ability_granted.name, this.ability_text);

        let has_ability: boolean = this.char.abilities.includes(this.item.granted_ability);

        this.base_window.update_text(has_ability ? "Learned" : "Will Learn", this.ability_status);
        if (this.avatar) {
            this.avatar.destroy();
        }
        this.avatar = this.avatar_group.create(0, 0, "avatars", this.char.key_name);
    }

    open(char, item, item_obj, callback?) {
        this.update_position();
        this.avatar_group.visible = true;
        this.char = char;
        this.item = item;
        this.item_obj = item_obj;
        this.update_info();
        this.base_window.show(() => {
            this.window_open = true;
            if (callback !== undefined) {
                callback();
            }
        }, false);
    }

    close(callback?) {
        this.avatar_group.visible = false;
        this.base_window.close(() => {
            this.window_open = false;
            if (callback !== undefined) {
                callback();
            }
        }, false);
    }
}
