import {TextObj, Window} from "../../Window";
import {Item} from "../../Item";
import {GoldenSun} from "../../GoldenSun";
import {ItemSlot, MainChar} from "../../MainChar";
import * as _ from "lodash";
import {Classes} from "../../Classes";
import {elemental_stats} from "../../Player";

const BASE_WIN_WIDTH = 100;
const BASE_WIN_HEIGHT = 92;
const BASE_WIN_X = 0;
const BASE_WIN_Y = 40;
const ARROW_X = 32;
const ARROW_Y = 49;

export class ClassChangeWithItemWindow {
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
    public class_text: TextObj;

    public preview_class_text: TextObj;
    public class_name_arrow: Phaser.Sprite;
    public class_name_arrow_blink_timer: Phaser.Timer;

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
        this.base_window.set_canvas_update();
        this.avatar_group = game.add.group();
        this.base_window.add_sprite_to_window_group(this.avatar_group);
        this.x_avatar = 8;
        this.y_avatar = 8;
        this.avatar_group.x = this.x_avatar;
        this.avatar_group.y = this.y_avatar;
        this.avatar = null;

        this.base_window.set_text_in_position("Lv", 48, 24);

        this.name_text = this.base_window.set_text_in_position("0", 40, 8);
        this.lv_text = this.base_window.set_text_in_position("0", 80, 24);
        this.class_text = this.base_window.set_text_in_position("0", 8, 40);

        this.preview_class_text = this.base_window.set_text_in_position("0", 8, 56);
        this.class_name_arrow = this.base_window.create_at_group(ARROW_X, ARROW_Y, "menu", {frame: "arrow_change"});
        this.init_arrow_blinks();
    }

    private init_arrow_blinks() {
        this.class_name_arrow_blink_timer = this.game.time.create(false);
        this.class_name_arrow_blink_timer.loop(90, () => {
            this.class_name_arrow.visible = this.class_name_arrow.visible ? false : true;
        });

        this.class_name_arrow_blink_timer.start();
        this.class_name_arrow_blink_timer.pause();
        this.class_name_arrow.visible = false;
    }

    hide() {
        this.base_window.group.visible = false;
    }

    show() {
        if (!this.window_open) return;
        this.class_name_arrow_blink_timer.resume();
        this.base_window.group.visible = true;
    }

    update_info() {
        this.base_window.update_text(this.char.name, this.name_text);
        this.base_window.update_text(this.char.level.toString(), this.lv_text);
        this.base_window.update_text(this.char.class.name, this.class_text);

        const preview_class = Classes.choose_right_class(
            this.data.info.classes_list,
            this.data.dbs.classes_db.class_table,
            this.char.element_afinity,
            this.char.elemental_current[elemental_stats.LEVEL],
            this.item_obj.equipped ? -1 : this.item.granted_class_type,
            this.char.special_class_type
        );

        this.base_window.update_text(preview_class ? preview_class.name : "", this.preview_class_text);
        if (this.avatar) {
            this.avatar.destroy();
        }
        this.avatar = this.avatar_group.create(0, 0, "avatars", this.char.key_name);
    }

    private unmount_window() {
        this.class_name_arrow.visible = false;
        if (!this.class_name_arrow_blink_timer.paused) {
            this.class_name_arrow_blink_timer.pause();
        }
    }

    open(char, item, item_obj, callback?) {
        this.char = char;
        this.item = item;
        this.item_obj = item_obj;
        this.update_info();
        this.class_name_arrow_blink_timer.resume();
        this.base_window.show(() => {
            this.window_open = true;
            if (callback !== undefined) {
                callback();
            }
        }, false);
    }

    close(callback?) {
        this.unmount_window();
        this.base_window.close(() => {
            this.window_open = false;
            if (callback !== undefined) {
                callback();
            }
        }, false);
    }
}
