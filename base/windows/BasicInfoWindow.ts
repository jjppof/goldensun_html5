import {MainChar} from "../MainChar";
import {TextObj, Window} from "../Window";
import {LOW_HP_THRESHOLD, RED_FONT_COLOR, YELLOW_FONT_COLOR, DEFAULT_FONT_COLOR} from "../magic_numbers";

const BASE_WIN_WIDTH = 100;
const BASE_WIN_HEIGHT = 92;
const BASE_WIN_X = 0;
const BASE_WIN_Y = 40;

/*A window template with character information
Used for Psynergy and Item menus

Input: game [Phaser:Game] - Reference to the running game object*/
export class BasicInfoWindow {
    private static readonly BASIC_STATS_GROUP_KEY = "basic_stats";
    private static readonly GEAR_STATS_GROUP_KEY = "gear_stats";

    public game: Phaser.Game;
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
    public hp_text: TextObj;
    public pp_text: TextObj;
    public max_hp_text: TextObj;
    public max_pp_text: TextObj;
    public exp_text: TextObj;
    public attack_text: TextObj;
    public defense_text: TextObj;
    public agility_text: TextObj;
    public luck_text: TextObj;
    public basic_stats_group: Phaser.Group;
    public gear_stats_group: Phaser.Group;

    constructor(game: Phaser.Game) {
        this.game = game;
        this.char = null;
        this.window_open = false;
        this.x = BASE_WIN_X;
        this.y = BASE_WIN_Y;
        this.base_window = new Window(this.game, this.x, this.y, BASE_WIN_WIDTH, BASE_WIN_HEIGHT);

        this.avatar_group = game.add.group();
        this.avatar_group.visible = false;
        this.x_avatar = this.x + 8;
        this.y_avatar = this.y + 8;
        this.avatar = this.avatar_group.create(0, 0, "avatars");

        this.basic_stats_group = this.base_window.define_internal_group(BasicInfoWindow.BASIC_STATS_GROUP_KEY);
        this.gear_stats_group = this.base_window.define_internal_group(BasicInfoWindow.GEAR_STATS_GROUP_KEY);

        this.base_window.set_text_in_position("Lv", 48, 24);
        this.lv_text = this.base_window.set_text_in_position("0", 80, 24);
        this.name_text = this.base_window.set_text_in_position("0", 40, 8);

        this.base_window.set_text_in_position("HP", 8, 48, {internal_group_key: BasicInfoWindow.BASIC_STATS_GROUP_KEY});
        this.base_window.set_text_in_position("PP", 8, 56, {internal_group_key: BasicInfoWindow.BASIC_STATS_GROUP_KEY});
        this.base_window.set_text_in_position("/", 56, 49, {internal_group_key: BasicInfoWindow.BASIC_STATS_GROUP_KEY});
        this.base_window.set_text_in_position("/", 56, 56, {internal_group_key: BasicInfoWindow.BASIC_STATS_GROUP_KEY});
        this.base_window.set_text_in_position("Exp", 8, 73, {
            internal_group_key: BasicInfoWindow.BASIC_STATS_GROUP_KEY,
        });

        this.class_text = this.base_window.set_text_in_position("0", 8, 40, {
            internal_group_key: BasicInfoWindow.BASIC_STATS_GROUP_KEY,
        });
        this.hp_text = this.base_window.set_text_in_position("0", 51, 48, {
            right_align: true,
            internal_group_key: BasicInfoWindow.BASIC_STATS_GROUP_KEY,
        });
        this.pp_text = this.base_window.set_text_in_position("0", 51, 56, {
            right_align: true,
            internal_group_key: BasicInfoWindow.BASIC_STATS_GROUP_KEY,
        });
        this.max_hp_text = this.base_window.set_text_in_position("0", 94, 48, {
            right_align: true,
            internal_group_key: BasicInfoWindow.BASIC_STATS_GROUP_KEY,
        });
        this.max_pp_text = this.base_window.set_text_in_position("0", 94, 56, {
            right_align: true,
            internal_group_key: BasicInfoWindow.BASIC_STATS_GROUP_KEY,
        });
        this.exp_text = this.base_window.set_text_in_position("0", 94, 80, {
            right_align: true,
            internal_group_key: BasicInfoWindow.BASIC_STATS_GROUP_KEY,
        });

        this.base_window.set_text_in_position("Attack", 8, 48, {
            internal_group_key: BasicInfoWindow.GEAR_STATS_GROUP_KEY,
        });
        this.base_window.set_text_in_position("Defense", 8, 56, {
            internal_group_key: BasicInfoWindow.GEAR_STATS_GROUP_KEY,
        });
        this.base_window.set_text_in_position("Agility", 8, 64, {
            internal_group_key: BasicInfoWindow.GEAR_STATS_GROUP_KEY,
        });
        this.base_window.set_text_in_position("Luck", 8, 72, {
            internal_group_key: BasicInfoWindow.GEAR_STATS_GROUP_KEY,
        });

        this.attack_text = this.base_window.set_text_in_position("0", 94, 48, {
            right_align: true,
            internal_group_key: BasicInfoWindow.GEAR_STATS_GROUP_KEY,
        });
        this.defense_text = this.base_window.set_text_in_position("0", 94, 56, {
            right_align: true,
            internal_group_key: BasicInfoWindow.GEAR_STATS_GROUP_KEY,
        });
        this.agility_text = this.base_window.set_text_in_position("0", 94, 64, {
            right_align: true,
            internal_group_key: BasicInfoWindow.GEAR_STATS_GROUP_KEY,
        });
        this.luck_text = this.base_window.set_text_in_position("0", 94, 72, {
            right_align: true,
            internal_group_key: BasicInfoWindow.GEAR_STATS_GROUP_KEY,
        });
    }

    /** Places the avatar group correctly on screen */
    update_position() {
        this.avatar_group.x = this.game.camera.x + this.x_avatar;
        this.avatar_group.y = this.game.camera.y + this.y_avatar;
    }

    /*Sets the selected character
    The character's avatar is loaded from cache

    Input: char [string] - The selected character's name*/
    set_char_basic_stats(char: MainChar) {
        if (char !== undefined) {
            this.char = char;
        }
        this.gear_stats_group.visible = false;
        this.basic_stats_group.visible = true;

        this.base_window.update_text(this.char.name, this.name_text);
        this.base_window.update_text(this.char.level.toString(), this.lv_text);
        this.base_window.update_text(this.char.class.name, this.class_text);
        this.base_window.update_text(this.char.current_hp.toString(), this.hp_text, this.get_hp_color());
        this.base_window.update_text(this.char.current_pp.toString(), this.pp_text);
        this.base_window.update_text(this.char.max_hp.toString(), this.max_hp_text);
        this.base_window.update_text(this.char.max_pp.toString(), this.max_pp_text);
        this.base_window.update_text(this.char.current_exp.toString(), this.exp_text);

        this.avatar.frameName = this.char.key_name;
    }

    set_char_gear_stats(char: MainChar) {
        if (char !== undefined) {
            this.char = char;
        }
        this.basic_stats_group.visible = false;
        this.gear_stats_group.visible = true;

        this.base_window.update_text(this.char.name, this.name_text);
        this.base_window.update_text(this.char.level.toString(), this.lv_text);
        this.base_window.update_text(this.char.atk.toString(), this.attack_text);
        this.base_window.update_text(this.char.def.toString(), this.defense_text);
        this.base_window.update_text(this.char.agi.toString(), this.agility_text);
        this.base_window.update_text(this.char.luk.toString(), this.luck_text);

        this.avatar.frameName = this.char.key_name;
    }

    /*Opens the window with the selected party member

    Input: char [string] - The character selected by default
           callback [function] - Callback function (Optional)
           basic_stats [boolean] - Whether it's basic stats or gear stats*/
    open(char: MainChar, callback?, basic_stats: boolean = true) {
        this.update_position();
        this.avatar_group.visible = true;
        if (basic_stats) {
            this.set_char_basic_stats(char);
        } else {
            this.set_char_gear_stats(char);
        }
        this.base_window.show(() => {
            this.window_open = true;
            if (callback !== undefined) {
                callback();
            }
        }, false);
    }

    /*Closes the window

    Input: callback [function] - Callback function (Optional)*/
    close(callback?) {
        this.avatar_group.visible = false;
        this.basic_stats_group.visible = false;
        this.gear_stats_group.visible = false;
        this.base_window.close(() => {
            this.window_open = false;
            if (callback !== undefined) {
                callback();
            }
        }, false);
    }

    get_hp_color() {
        let curr_char = this.char;
        if (curr_char.current_hp <= 0) return RED_FONT_COLOR;
        else if (curr_char.current_hp <= curr_char.max_hp * LOW_HP_THRESHOLD) return YELLOW_FONT_COLOR;
        else return DEFAULT_FONT_COLOR;
    }
}
