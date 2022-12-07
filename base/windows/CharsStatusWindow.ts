import {TextObj, Window} from "../Window";
import {ordered_elements} from "../utils";
import * as numbers from "../magic_numbers";
import {Djinn} from "../Djinn";
import {MainChar} from "../MainChar";
import {GoldenSun} from "../GoldenSun";
import * as _ from "lodash";

const WIDTH_PER_CHAR = 48;
const STATUS_WIN_HEIGHT = 35;
const STATUS_WIN_HEIGHT_COMPACT = 24;
const STATUS_BAR_WIDTH = 40;
const STATUS_BAR_HEIGHT = 3;

const STATUS_BAR_COLOR_GOOD = numbers.BLUE_FONT_COLOR;
const STATUS_BAR_COLOR_BAD = numbers.RED_FONT_COLOR;

const MAX_CHARS_NUMBER = 4;
const STAT_X = 26;
const NAME_Y = 8;
const NAME_Y_COMPACT = 0;

const INITIAL_PADDING_X = 8;
const DJINN_INFO_WIDTH = 40;

const STARS_X = [0, 16];
const STARS_Y = [0, 8];

const STANDBY_COUNT_X = [16 + 5, 32 + 5];
const STANDBY_COUNT_SHIFT_Y = [8, 16];

const INITIAL_PADDING__DJINNI_X = 9;
const INITIAL_PADDING__DJINNI_Y = 9;

const LOW_HP_THRESHOLD = 0.25;

type InfoSprite = {
    group: Phaser.Group;
    name: TextObj;
    hp_bar_graphics: Phaser.Graphics;
    hp_bar_damage_graphics: Phaser.Graphics;
    hp_header: TextObj;
    hp: TextObj;
    pp_bar_graphics: Phaser.Graphics;
    pp_bar_damage_graphics: Phaser.Graphics;
    pp_header: TextObj;
    pp: TextObj;
};

/*A window displaying the character's name and HP/PP
The normal version is used in the field menu
The compacted version and Djinn information are displayed in battle

Input: game [Phaser:Game] - Reference to the running game object
       data [GoldenSun] - Reference to the main JS Class instance
       djinn_info [boolean] - If true, will display Djinn on standby
       compact [boolean] - If true, displays the compacted version*/
export class CharsStatusWindow {
    public game: Phaser.Game;
    public data: GoldenSun;

    public djinni_info: boolean;
    public compact: boolean;
    public name_y: number;

    public status_win_height: number;
    public status_win_width: number;
    public status_win_x: number;
    public status_window: Window;

    public info_sprites: {[char_key: string]: InfoSprite};
    public stars_group: Phaser.Group;
    public standby_count_text: {[element: string]: TextObj};
    public standby_djinni: {[element: string]: number};

    constructor(game: Phaser.Game, data: GoldenSun, djinni_info: boolean = false, compact: boolean = false) {
        this.game = game;
        this.data = data;

        this.djinni_info = djinni_info;
        this.compact = compact;
        this.name_y = NAME_Y;

        if (this.compact) {
            this.name_y = NAME_Y_COMPACT;
        }
        this.status_win_height = STATUS_WIN_HEIGHT;
        if (this.compact) {
            this.status_win_height = STATUS_WIN_HEIGHT_COMPACT;
        }

        const chars_number = _.clamp(this.data.info.party_data.members.length, MAX_CHARS_NUMBER);
        this.status_win_width = chars_number * WIDTH_PER_CHAR + (INITIAL_PADDING_X >> 1);
        this.status_win_x =
            numbers.GAME_WIDTH - this.status_win_width - numbers.INSIDE_BORDER_WIDTH - numbers.OUTSIDE_BORDER_WIDTH;
        this.status_window = new Window(this.game, this.status_win_x, 0, this.status_win_width, this.status_win_height);
        this.info_sprites = {};

        this.set_chars_info();

        if (this.djinni_info) {
            this.standby_count_text = {};
            this.stars_group = this.game.add.group();
            for (let i = 0; i < ordered_elements.length; ++i) {
                const element = ordered_elements[i];
                const x = i % 2,
                    y = +(i > 1);

                this.stars_group.create(STARS_X[x], STARS_Y[y], "stars", element);
                this.standby_count_text[element] = this.status_window.set_text_in_position(
                    "",
                    STANDBY_COUNT_X[x],
                    STANDBY_COUNT_SHIFT_Y[y],
                    {right_align: true}
                );
            }
            this.status_window.add_sprite_to_window_group(this.stars_group);
        }
    }

    /*Updates the window's position

    Input: force [boolean] = If true, forces an update*/
    update_position() {
        this.status_window.update();
    }

    /*Sets the characters' information and creates the graphics
    Removes sprites from the Window group and gives them to the internal group*/
    set_chars_info() {
        const chars_list = this.data.info.party_data.members.slice(0, MAX_CHARS_NUMBER);
        for (let i = 0; i < chars_list.length; ++i) {
            const char = chars_list[i];
            if (char.key_name in this.info_sprites) continue;

            let info_sprites_obj: InfoSprite = {
                group: null,
                name: null,
                hp_bar_graphics: null,
                hp_bar_damage_graphics: null,
                hp_header: null,
                hp: null,
                pp_bar_graphics: null,
                pp_bar_damage_graphics: null,
                pp_header: null,
                pp: null,
            };

            const base_x_pos = i * WIDTH_PER_CHAR + INITIAL_PADDING_X;
            const group_key = char.key_name + "_status";
            const hp_color = this.get_char_hp_color(char);

            info_sprites_obj.group = this.status_window.define_internal_group(group_key);
            info_sprites_obj.name = this.status_window.set_text_in_position(char.name, base_x_pos, this.name_y, {
                color: hp_color,
                with_bg: this.compact,
                internal_group_key: group_key,
            });

            let y_pos = this.name_y + numbers.FONT_SIZE;
            let y_pos_bar = y_pos + numbers.FONT_SIZE - STATUS_BAR_HEIGHT;

            info_sprites_obj.hp_bar_graphics = this.game.add.graphics(base_x_pos, y_pos_bar);
            info_sprites_obj.hp_bar_graphics.beginFill(STATUS_BAR_COLOR_GOOD, 1);
            info_sprites_obj.hp_bar_graphics.drawRect(0, 0, STATUS_BAR_WIDTH, STATUS_BAR_HEIGHT);
            info_sprites_obj.hp_bar_graphics.endFill();
            info_sprites_obj.group.add(info_sprites_obj.hp_bar_graphics);

            info_sprites_obj.hp_bar_damage_graphics = this.game.add.graphics(0, 0);
            info_sprites_obj.hp_bar_damage_graphics.data.default_y = y_pos_bar;
            info_sprites_obj.group.add(info_sprites_obj.hp_bar_damage_graphics);

            const x_number_pos = base_x_pos + STAT_X;

            info_sprites_obj.hp_header = this.status_window.set_text_in_position("HP", base_x_pos, y_pos, {
                color: hp_color,
                internal_group_key: group_key,
            });
            info_sprites_obj.hp = this.status_window.set_text_in_position(
                char.current_hp.toString(),
                x_number_pos,
                y_pos,
                {
                    right_align: true,
                    color: hp_color,
                    internal_group_key: group_key,
                }
            );

            y_pos = this.name_y + 2 * numbers.FONT_SIZE;
            y_pos_bar = y_pos + numbers.FONT_SIZE - STATUS_BAR_HEIGHT;

            info_sprites_obj.pp_bar_graphics = this.game.add.graphics(base_x_pos, y_pos_bar);
            info_sprites_obj.pp_bar_graphics.beginFill(STATUS_BAR_COLOR_GOOD, 1);
            info_sprites_obj.pp_bar_graphics.drawRect(0, 0, STATUS_BAR_WIDTH, STATUS_BAR_HEIGHT);
            info_sprites_obj.pp_bar_graphics.endFill();

            info_sprites_obj.group.add(info_sprites_obj.pp_bar_graphics);

            info_sprites_obj.pp_bar_damage_graphics = this.game.add.graphics(0, 0);
            info_sprites_obj.pp_bar_damage_graphics.data.default_y = y_pos_bar;

            info_sprites_obj.group.add(info_sprites_obj.pp_bar_damage_graphics);

            info_sprites_obj.pp_header = this.status_window.set_text_in_position("PP", base_x_pos, y_pos, {
                color: this.status_window.font_color,
                internal_group_key: group_key,
            });
            info_sprites_obj.pp = this.status_window.set_text_in_position(
                char.current_pp.toString(),
                x_number_pos,
                y_pos,
                {
                    right_align: true,
                    color: this.status_window.font_color,
                    internal_group_key: group_key,
                }
            );

            this.info_sprites[char.key_name] = info_sprites_obj;
        }
    }

    check_chars_in_party() {
        const current_members = new Set(this.data.info.party_data.members.map(m => m.key_name));
        const current_info = new Set(Object.keys(this.info_sprites));
        [...current_members]
            .filter(m => !current_info.has(m))
            .forEach(char_key => {
                const group_key = char_key + "_status";
                this.status_window.destroy_internal_group(group_key);
                delete this.info_sprites[char_key];
            });
        const add_chars = [...current_members].filter(m => !current_info.has(m)).length;
        if (add_chars) {
            this.set_chars_info();
        }
    }

    /*Updates the information displayed*/
    update_chars_info() {
        this.check_chars_in_party();
        let show_djinn_info = false;
        if (this.djinni_info) {
            this.standby_djinni = Djinn.get_standby_djinni(
                this.data.info.djinni_list,
                MainChar.get_active_players(this.data.info.party_data, MAX_CHARS_NUMBER)
            );
            show_djinn_info = _.some(this.standby_djinni, Boolean);

            if (show_djinn_info) {
                this.stars_group.visible = true;
                this.stars_group.x = INITIAL_PADDING__DJINNI_X;
                this.stars_group.y = INITIAL_PADDING__DJINNI_Y;

                for (let i = 0; i < ordered_elements.length; ++i) {
                    const element = ordered_elements[i];
                    const text = element in this.standby_djinni ? this.standby_djinni[element].toString() : "0";
                    this.status_window.update_text(text, this.standby_count_text[element]);
                    this.status_window.update_text_position(
                        {
                            y: this.name_y + STANDBY_COUNT_SHIFT_Y[+(i > 1)],
                        },
                        this.standby_count_text[element]
                    );
                }
            } else {
                for (let i = 0; i < ordered_elements.length; ++i) {
                    const element = ordered_elements[i];
                    this.status_window.update_text("", this.standby_count_text[element]);
                }
                this.stars_group.visible = false;
            }
        }

        const chars_number = _.clamp(this.data.info.party_data.members.length, MAX_CHARS_NUMBER);
        this.status_win_width =
            chars_number * WIDTH_PER_CHAR + (INITIAL_PADDING_X >> 1) + (show_djinn_info ? DJINN_INFO_WIDTH : 0);
        this.status_win_x =
            numbers.GAME_WIDTH - this.status_win_width - numbers.INSIDE_BORDER_WIDTH - numbers.OUTSIDE_BORDER_WIDTH;

        this.status_window.update_size({width: this.status_win_width});
        this.status_window.update_position({x: this.status_win_x});
        this.status_window.clear_separators();

        let current_chars = [];
        for (let i = 0; i < chars_number; ++i) {
            let char = this.data.info.party_data.members[i];
            current_chars.push(char.key_name);

            let info_sprite = this.info_sprites[char.key_name];
            info_sprite.group.visible = true;

            const base_x_pos = i * WIDTH_PER_CHAR + INITIAL_PADDING_X + (show_djinn_info ? DJINN_INFO_WIDTH : 0);
            const x_number_pos = base_x_pos + STAT_X;

            const hp_color = this.get_char_hp_color(char);

            this.status_window.update_text_color(hp_color, info_sprite.hp_header);
            this.status_window.update_text(char.name, info_sprite.name);
            this.status_window.update_text_position({x: base_x_pos}, info_sprite.name);
            this.status_window.update_text_color(hp_color, info_sprite.name);
            this.status_window.update_text(String(char.current_hp), info_sprite.hp);
            this.status_window.update_text_position({x: x_number_pos}, info_sprite.hp);
            this.status_window.update_text_color(hp_color, info_sprite.hp);
            this.status_window.update_text(String(char.current_pp), info_sprite.pp);
            this.status_window.update_text_position({x: x_number_pos}, info_sprite.pp);

            let hp_width = info_sprite.hp.text.textWidth;
            info_sprite.hp.text.x += hp_width / 2;
            info_sprite.hp.shadow.x += hp_width / 2;

            let pp_width = info_sprite.pp.text.textWidth;
            info_sprite.pp.text.x += pp_width / 2;
            info_sprite.pp.shadow.x += pp_width / 2;

            this.status_window.update_text_position({x: base_x_pos}, info_sprite.hp_header);
            this.status_window.update_text_position({x: base_x_pos}, info_sprite.pp_header);

            info_sprite.hp_bar_graphics.x = base_x_pos;
            info_sprite.pp_bar_graphics.x = base_x_pos;

            const hp_damage_bar_width = (STATUS_BAR_WIDTH * (1 - char.current_hp / char.max_hp)) | 0;
            const hp_damage_bar_x = base_x_pos + STATUS_BAR_WIDTH - hp_damage_bar_width;

            info_sprite.hp_bar_damage_graphics.clear();
            info_sprite.hp_bar_damage_graphics.beginFill(STATUS_BAR_COLOR_BAD, 1);
            info_sprite.hp_bar_damage_graphics.drawRect(
                hp_damage_bar_x,
                info_sprite.hp_bar_damage_graphics.data.default_y,
                hp_damage_bar_width,
                STATUS_BAR_HEIGHT
            );
            info_sprite.hp_bar_damage_graphics.endFill();

            const pp_damage_bar_width = (STATUS_BAR_WIDTH * (1 - char.current_pp / char.max_pp)) | 0;
            const pp_damage_bar_x = base_x_pos + STATUS_BAR_WIDTH - pp_damage_bar_width;

            info_sprite.pp_bar_damage_graphics.clear();
            info_sprite.pp_bar_damage_graphics.beginFill(STATUS_BAR_COLOR_BAD, 1);
            info_sprite.pp_bar_damage_graphics.drawRect(
                pp_damage_bar_x,
                info_sprite.pp_bar_damage_graphics.data.default_y,
                pp_damage_bar_width,
                STATUS_BAR_HEIGHT
            );
            info_sprite.pp_bar_damage_graphics.endFill();

            if (i !== 0 || show_djinn_info) {
                this.status_window.draw_separator(base_x_pos - 5, 3, base_x_pos - 5, this.status_win_height - 1);
            }
        }

        for (let key_name in this.info_sprites) {
            if (current_chars.includes(key_name)) continue;

            let info_sprite = this.info_sprites[key_name];
            info_sprite.group.visible = false;
        }
    }

    /*Displays this window*/
    show() {
        this.status_window.show();
    }

    /*Closes this window*/
    close(callback?: () => void) {
        this.status_window.close(callback);
    }

    /*Destroys this window*/
    destroy() {
        this.status_window.destroy(false);
    }

    get_char_hp_color(curr_char: MainChar) {
        if (curr_char.current_hp <= 0) return numbers.RED_FONT_COLOR;
        else if (curr_char.current_hp <= curr_char.max_hp * LOW_HP_THRESHOLD) return numbers.YELLOW_FONT_COLOR;
        else return this.status_window.font_color;
    }
}
