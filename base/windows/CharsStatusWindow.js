import { Window } from '../Window.js';
import { get_text_width } from '../../utils.js';
import * as numbers from '../../magic_numbers.js';
import { party_data } from '../../initializers/main_chars.js';
import { djinni_list } from '../../initializers/djinni.js';
import { djinn_status } from '../Djinn.js';
import { ordered_elements } from '../MainChar.js';

const WIDTH_PER_CHAR = 47;
const STATUS_WIN_HEIGHT = 35;
const STATUS_WIN_HEIGHT_COMPACT = 24;
const STATUS_BAR_WIDTH = 43;
const STATUS_BAR_HEIGHT = 3;
const STATUS_BAR_COLOR_GOOD = numbers.BLUE_FONT_COLOR;
const STATUS_BAR_COLOR_BAD = numbers.RED_FONT_COLOR;
const MAX_CHARS_NUMBER = 4;
const STAT_X = 40;
const NAME_Y = 8;
const NAME_Y_COMPACT = 0;
const INITIAL_PADDING_X = 8;
const DJINN_INFO_WIDTH = 40;
const STARS_X = [0, 16];
const STARS_Y = [1, 9];
const STANDBY_COUNT_X = [21, 37];
const STANDBY_COUNT_SHIFT_Y = [8, 16];

export class CharsStatusWindow {
    constructor(game, data, djinni_info = false, compact = false) {
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
        const chars_number = _.clamp(party_data.members.length, MAX_CHARS_NUMBER);
        this.status_win_width = chars_number * WIDTH_PER_CHAR + INITIAL_PADDING_X;
        this.status_win_x = numbers.GAME_WIDTH - this.status_win_width - numbers.INSIDE_BORDER_WIDTH - numbers.OUTSIDE_BORDER_WIDTH;
        this.status_window = new Window(this.game, this.status_win_x, 0, this.status_win_width, this.status_win_height, false);
        this.status_header_width = get_text_width(this.game, "HP ");
        this.info_sprites = {};
        this.set_chars_info();
        if (this.djinni_info) {
            this.standby_count_text = {};
            this.stars_group = this.game.add.group();
            for (let i = 0; i < ordered_elements.length; ++i) {
                const element = ordered_elements[i];
                const x = i%2, y = +(i>1);
                this.stars_group.create(STARS_X[x], STARS_Y[y], element + "_star");
                this.standby_count_text[element] = this.status_window.set_text_in_position("", STANDBY_COUNT_X[x], this.name_y + STANDBY_COUNT_SHIFT_Y[y], true);
            }
            this.status_window.add_sprite_to_group(this.stars_group);
        }
    }

    update_position(force = false) {
        this.status_window.update(force);
    }

    set_chars_info() {
        const chars_list = party_data.members.slice(0, MAX_CHARS_NUMBER);
        for (let i = 0; i < chars_list.length; ++i) {
            let info_sprites_obj = {};
            const char = chars_list[i];
            const base_x_pos =  i * WIDTH_PER_CHAR + INITIAL_PADDING_X;
            info_sprites_obj.name = this.status_window.set_text_in_position(char.name, base_x_pos, this.name_y, false, false, this.status_window.font_color, this.compact);
            let y_pos = this.name_y + numbers.FONT_SIZE;

            let y_pos_bar = y_pos + numbers.FONT_SIZE - STATUS_BAR_HEIGHT;
            info_sprites_obj.hp_bar_graphics = this.game.add.graphics(base_x_pos, y_pos_bar);
            info_sprites_obj.hp_bar_graphics.beginFill(STATUS_BAR_COLOR_GOOD, 1);
            info_sprites_obj.hp_bar_graphics.drawRect(0, 0, STATUS_BAR_WIDTH, STATUS_BAR_HEIGHT);
            info_sprites_obj.hp_bar_graphics.endFill();
            this.status_window.group.add(info_sprites_obj.hp_bar_graphics);

            info_sprites_obj.hp_bar_damage_graphics = this.game.add.graphics(0, 0);
            info_sprites_obj.hp_bar_damage_graphics.default_y = y_pos_bar;
            this.status_window.group.add(info_sprites_obj.hp_bar_damage_graphics);

            info_sprites_obj.hp_header = this.status_window.set_text_in_position("HP", base_x_pos, y_pos);
            const x_number_pos = base_x_pos + STAT_X;
            info_sprites_obj.hp = this.status_window.set_text_in_position(char.current_hp.toString(), x_number_pos, y_pos, true);

            y_pos = this.name_y + 2 * numbers.FONT_SIZE;
            y_pos_bar = y_pos + numbers.FONT_SIZE - STATUS_BAR_HEIGHT;
            info_sprites_obj.pp_bar_graphics = this.game.add.graphics(base_x_pos, y_pos_bar);
            info_sprites_obj.pp_bar_graphics.beginFill(STATUS_BAR_COLOR_GOOD, 1);
            info_sprites_obj.pp_bar_graphics.drawRect(0, 0, STATUS_BAR_WIDTH, STATUS_BAR_HEIGHT);
            info_sprites_obj.pp_bar_graphics.endFill();
            this.status_window.group.add(info_sprites_obj.pp_bar_graphics);

            info_sprites_obj.pp_bar_damage_graphics = this.game.add.graphics(0, 0);
            info_sprites_obj.pp_bar_damage_graphics.default_y = y_pos_bar;
            this.status_window.group.add(info_sprites_obj.pp_bar_damage_graphics);

            info_sprites_obj.pp_header = this.status_window.set_text_in_position("PP", base_x_pos, y_pos);
            info_sprites_obj.pp = this.status_window.set_text_in_position(char.current_pp.toString(), x_number_pos, y_pos, true);

            info_sprites_obj.visible = true;
            this.info_sprites[char.key_name] = info_sprites_obj;
        }
    }

    update_chars_info() {
        let show_djinn_info = false;
        if (this.djinni_info) {
            this.standby_djinni = _.mapValues(_.groupBy(party_data.members.slice(0, MAX_CHARS_NUMBER).map(c => c.djinni).flat(), key => {
                return djinni_list[key].element;
            }), djinni_keys => djinni_keys.filter(key => djinni_list[key].status === djinn_status.STANDBY).length);
            show_djinn_info = _.some(this.standby_djinni, Boolean);
            if (show_djinn_info) {
                this.stars_group.alpha = 1;
                this.stars_group.x = INITIAL_PADDING_X;
                this.stars_group.y = this.name_y + numbers.FONT_SIZE;
                for (let i = 0; i < ordered_elements.length; ++i) {
                    const element = ordered_elements[i];
                    const text = element in this.standby_djinni ? this.standby_djinni[element].toString() : "0";
                    this.status_window.update_text(text, this.standby_count_text[element], undefined, this.name_y + STANDBY_COUNT_SHIFT_Y[+(i>1)]);
                }
            } else {
                for (let i = 0; i < ordered_elements.length; ++i) {
                    const element = ordered_elements[i];
                    this.status_window.update_text("", this.standby_count_text[element]);
                }
                this.stars_group.alpha = 0;
            }
        }
        const chars_number = _.clamp(party_data.members.length, MAX_CHARS_NUMBER);
        this.status_win_width = chars_number * WIDTH_PER_CHAR + INITIAL_PADDING_X + (show_djinn_info ? DJINN_INFO_WIDTH : 0);
        this.status_win_x = numbers.GAME_WIDTH - this.status_win_width - numbers.INSIDE_BORDER_WIDTH - numbers.OUTSIDE_BORDER_WIDTH;
        this.status_window.update_size({width: this.status_win_width});
        this.status_window.update_position({x: this.status_win_x});
        this.status_window.clear_separators();
        let current_chars = [];
        for (let i = 0; i < chars_number; ++i) {
            let char = party_data.members[i];
            current_chars.push(char.key_name);
            let info_sprite = this.info_sprites[char.key_name];
            if (!info_sprite.visible) {
                this.toggle_char_info(info_sprite);
                info_sprite.visible = true;
            }
            const base_x_pos =  i * WIDTH_PER_CHAR + INITIAL_PADDING_X + (show_djinn_info ? DJINN_INFO_WIDTH : 0);
            this.status_window.update_text(char.name, info_sprite.name, base_x_pos);
            const x_number_pos = base_x_pos + STAT_X;
            this.status_window.update_text(char.current_hp, info_sprite.hp, x_number_pos);
            this.status_window.update_text(char.current_pp, info_sprite.pp, x_number_pos);

            this.status_window.update_text_position({x: base_x_pos}, info_sprite.hp_header);
            this.status_window.update_text_position({x: base_x_pos}, info_sprite.pp_header);
            info_sprite.hp_bar_graphics.x = base_x_pos;
            info_sprite.pp_bar_graphics.x = base_x_pos;

            const hp_damage_bar_width = parseInt(STATUS_BAR_WIDTH * (1 - char.current_hp/char.max_hp));
            const hp_damage_bar_x = base_x_pos + STATUS_BAR_WIDTH - hp_damage_bar_width;
            info_sprite.hp_bar_damage_graphics.clear();
            info_sprite.hp_bar_damage_graphics.beginFill(STATUS_BAR_COLOR_BAD, 1);
            info_sprite.hp_bar_damage_graphics.drawRect(hp_damage_bar_x, info_sprite.hp_bar_damage_graphics.default_y, hp_damage_bar_width, STATUS_BAR_HEIGHT);
            info_sprite.hp_bar_damage_graphics.endFill();

            const pp_damage_bar_width = parseInt(STATUS_BAR_WIDTH * (1 - char.current_pp/char.max_pp));
            const pp_damage_bar_x = base_x_pos + STATUS_BAR_WIDTH - pp_damage_bar_width;
            info_sprite.pp_bar_damage_graphics.clear();
            info_sprite.pp_bar_damage_graphics.beginFill(STATUS_BAR_COLOR_BAD, 1);
            info_sprite.pp_bar_damage_graphics.drawRect(pp_damage_bar_x, info_sprite.pp_bar_damage_graphics.default_y, pp_damage_bar_width, STATUS_BAR_HEIGHT);
            info_sprite.pp_bar_damage_graphics.endFill();

            if (i !== 0) {
                this.status_window.draw_separator(base_x_pos - 3, 3, base_x_pos - 3, this.status_win_height - 1);
            }
        }
        for (let key_name in this.info_sprites) {
            if (current_chars.includes(key_name)) continue;
            let info_sprite = this.info_sprites[key_name];
            if (!info_sprite.visible) continue;
            this.toggle_char_info(info_sprite);
            info_sprite.visible = false;
        }
    }

    toggle_char_info(info_sprite) {
        info_sprite.name.text.visible = !info_sprite.name.text.visible;
        info_sprite.name.shadow.visible = !info_sprite.name.shadow.visible;
        info_sprite.hp.text.visible = !info_sprite.hp.text.visible;
        info_sprite.hp.shadow.visible = !info_sprite.hp.shadow.visible;
        info_sprite.pp.text.visible = !info_sprite.pp.text.visible;
        info_sprite.pp.shadow.visible = !info_sprite.pp.shadow.visible;
        info_sprite.hp_header.text.visible = !info_sprite.hp_header.text.visible;
        info_sprite.hp_header.shadow.visible = !info_sprite.hp_header.shadow.visible;
        info_sprite.pp_header.text.visible = !info_sprite.pp_header.text.visible;
        info_sprite.pp_header.shadow.visible = !info_sprite.pp_header.shadow.visible;
        info_sprite.hp_bar_graphics.visible = !info_sprite.hp_bar_graphics.visible;
        info_sprite.pp_bar_graphics.visible = !info_sprite.pp_bar_graphics.visible;
        info_sprite.hp_bar_damage_graphics.visible = !info_sprite.hp_bar_damage_graphics.visible;
        info_sprite.pp_bar_damage_graphics.visible = !info_sprite.pp_bar_damage_graphics.visible;
    }

    show() {
        this.status_window.show();
    }

    close() {
        this.status_window.close();
    }
}