import {TextObj, Window} from "../../Window";
import {djinn_status, djinn_font_colors, Djinn} from "../../Djinn";
import * as numbers from "../../magic_numbers";
import {base_actions, change_brightness, directions, elements, reverse_directions} from "../../utils";
import {DjinnModeHeaderWindow} from "./DjinnModeHeaderWindow";
import {DjinnCharStatsWindow} from "./DjinnCharStatsWindow";
import {DjinnPsynergyWindow} from "./DjinnPsynergyWindow";
import {GoldenSun} from "../../GoldenSun";
import {Button} from "../../XGamepad";
import {DjinnActionWindow} from "./DjinnActionWindow";
import {CharsQuickInfoDjinnWindow} from "./CharsQuickInfoDjinnWindow";
import {djinn_actions} from "../../main_menus/MainDjinnMenu";
import * as _ from "lodash";
import {Control} from "utils/ControlManager";

const WIN_WIDTH = 236;
const WIN_HEIGHT = 116;
const WIN_X = 0;
const WIN_Y = 40;

const CHAR_X_PADDING = 32;
const CHAR_Y_PADDING = 23;
const CHAR_X_BETWEEN = 58;
const CHARS_PER_PAGE = 4;

const HIGHLIGHT_HEIGHT = 8;
const HIGHLIGHT_WIDTH = 48;
const HIGHLIGHT_X_PADDING = 16;
const HIGHLIGHT_Y_PADDING = 24;

const DJINN_NAME_X_PADDING = 24;
const DJINN_NAME_Y_PADDING = 24;
const STAR_X_PADDING = HIGHLIGHT_X_PADDING + 1;
const STAR_Y_PADDING = HIGHLIGHT_Y_PADDING + 1;

const DJINN_NAME_BETWEEN = 58;
const DJINN_DESCRIPTION_X = 8;
const DJINN_DESCRIPTION_Y = 104;
const DJINN_SPRITE_X = 50;
const DJINN_CHAR_WIN_STATS_RIGHT_X = 120;

const CURSOR_X = 0;
const CURSOR_Y = 68;
const CURSOR_TEXT_X = 0;
const CURSOR_TEXT_Y = 60;
const COL_GAP = 58;
const LINE_GAP = 8;

const VIEW_STATES = {
    STATS: 0,
    THIS_CHAR: 1,
    NEXT_CHAR: 2,
};

export class DjinnListWindow {
    public game: Phaser.Game;
    public data: GoldenSun;
    public close_callback: Function;

    public base_window: Window;
    public group: Phaser.Group;
    public chars_sprites_group: Phaser.Group;

    public window_open: boolean;
    public window_active: boolean;
    public selected_char_index: number;
    public selected_djinn_index: number;
    public action_text_selected: boolean;
    public page_index: number;

    public chars_sprites: {
        [char_key_name: string]: Phaser.Sprite;
    };
    public djinns_sprites: {
        [element: string]: Phaser.Sprite;
    }[];
    public djinn_description: TextObj;

    public page_number_bar_highlight: Phaser.Graphics;
    public on_action_bar_highlight: Phaser.Graphics;

    public sizes: number[];
    public djinn_names: TextObj[][];
    public active_djinn_sprite: Phaser.Sprite;

    public djinn_status_change_header_window: DjinnModeHeaderWindow;
    public djinn_char_stats_window_left: DjinnCharStatsWindow;
    public djinn_char_stats_window_right: DjinnCharStatsWindow;
    public djinn_psynergy_window: DjinnPsynergyWindow;
    public djinn_action_window: DjinnActionWindow;
    public chars_quick_info_window: CharsQuickInfoDjinnWindow;

    public setting_djinn_status: boolean;
    public setting_djinn_status_char_index: number;
    public setting_djinn_status_djinn_index: number;

    public djinni_status_texts: TextObj[];
    public stars: Phaser.Sprite[][];

    public view_state: number;
    public changing_djinn_status: boolean;

    constructor(game: Phaser.Game, data: GoldenSun) {
        this.game = game;
        this.data = data;
        this.close_callback = null;

        this.base_window = new Window(this.game, WIN_X, WIN_Y, WIN_WIDTH, WIN_HEIGHT);
        this.group = this.game.add.group();
        this.group.visible = false;
        this.chars_sprites_group = this.game.add.group();
        this.group.add(this.chars_sprites_group);

        this.window_open = false;
        this.window_active = false;
        this.selected_char_index = 0;
        this.selected_djinn_index = 0;
        this.action_text_selected = false;
        this.page_index = 0;

        this.chars_sprites = {};
        this.djinns_sprites = [];
        this.djinn_description = this.base_window.set_text_in_position("", DJINN_DESCRIPTION_X, DJINN_DESCRIPTION_Y);

        this.page_number_bar_highlight = this.get_highlight_bar();
        this.on_action_bar_highlight = this.get_highlight_bar();
        this.on_action_bar_highlight.visible = false;

        this.sizes = [];
        this.djinn_names = [];
        this.active_djinn_sprite = null;
        this.djinn_status_change_header_window = new DjinnModeHeaderWindow(this.game, this.data);
        this.djinn_char_stats_window_left = new DjinnCharStatsWindow(this.game);
        this.djinn_char_stats_window_right = new DjinnCharStatsWindow(this.game, DJINN_CHAR_WIN_STATS_RIGHT_X);
        this.djinn_psynergy_window = new DjinnPsynergyWindow(this.game, this.data);

        this.init_djinn_sprites();
        this.init_djinni_status_texts();
    }

    get_highlight_bar() {
        const bar_highlight = this.game.add.graphics(0, 0);
        bar_highlight.blendMode = PIXI.blendModes.SCREEN;
        this.group.add(bar_highlight);

        bar_highlight.beginFill(this.base_window.color, 1);
        bar_highlight.drawRect(0, 0, HIGHLIGHT_WIDTH, HIGHLIGHT_HEIGHT);
        bar_highlight.endFill();

        return bar_highlight;
    }

    update_position() {
        this.group.x = this.game.camera.x + WIN_X;
        this.group.y = this.game.camera.y + WIN_Y;
    }

    next_character() {
        if (this.selected_char_index === this.sizes.length - 1) return;

        if (
            this.setting_djinn_status &&
            (this.selected_char_index + 1 === this.setting_djinn_status_char_index ||
                (this.sizes[this.selected_char_index + 1] < this.sizes[this.setting_djinn_status_char_index] &&
                    this.action_text_selected))
        ) {
            this.selected_char_index = this.selected_char_index + 1;
            this.select_action_text();
            this.on_char_change();
        } else {
            if (this.action_text_selected) this.selected_djinn_index = 0;
            this.select_djinn(this.selected_char_index + 1, this.selected_djinn_index);
        }
    }

    previous_character() {
        if (this.selected_char_index === 0) return;

        if (
            this.setting_djinn_status &&
            (this.selected_char_index - 1 === this.setting_djinn_status_char_index ||
                (this.sizes[this.selected_char_index - 1] < this.sizes[this.setting_djinn_status_char_index] &&
                    this.action_text_selected))
        ) {
            this.selected_char_index = this.selected_char_index - 1;
            this.select_action_text();
            this.on_char_change();
        } else {
            if (this.action_text_selected) this.selected_djinn_index = 0;
            this.select_djinn(this.selected_char_index - 1, this.selected_djinn_index);
        }
    }

    next_djinni() {
        if (this.setting_djinn_status && this.selected_char_index === this.setting_djinn_status_char_index) return;
        if (this.sizes[this.selected_char_index] <= 1) return;

        if (
            this.setting_djinn_status &&
            this.selected_djinn_index === this.sizes[this.selected_char_index] - 1 &&
            !this.action_text_selected &&
            this.sizes[this.selected_char_index] < this.sizes[this.setting_djinn_status_char_index]
        )
            this.select_action_text();
        else {
            if (this.action_text_selected || this.selected_djinn_index === this.sizes[this.selected_char_index] - 1) {
                this.select_djinn(this.selected_char_index, 0, true);
            } else {
                this.select_djinn(this.selected_char_index, this.selected_djinn_index + 1);
            }
        }
    }

    previous_djinni() {
        if (this.setting_djinn_status && this.selected_char_index === this.setting_djinn_status_char_index) return;
        if (this.sizes[this.selected_char_index] <= 1) return;

        if (
            this.setting_djinn_status &&
            this.selected_djinn_index === 0 &&
            !this.action_text_selected &&
            this.sizes[this.selected_char_index] < this.sizes[this.setting_djinn_status_char_index]
        )
            this.select_action_text();
        else {
            if (this.action_text_selected || this.selected_djinn_index === 0) {
                this.select_djinn(this.selected_char_index, this.sizes[this.selected_char_index] - 1, true);
            } else {
                this.select_djinn(this.selected_char_index, this.selected_djinn_index - 1);
            }
        }
    }

    select_action_text() {
        this.action_text_selected = true;
        this.set_highlight_bar();
        if (this.selected_char_index === this.setting_djinn_status_char_index) {
            this.set_djinn_sprite();
        } else this.active_djinn_sprite.visible = false;

        this.data.cursor_manager.clear_tweens();
        this.move_cursor(CURSOR_TEXT_X + COL_GAP * this.selected_char_index, CURSOR_TEXT_Y);
    }

    select_djinn(char_index: number, djinn_index: number, force_change: boolean = false) {
        this.action_text_selected = false;
        if (this.selected_djinn_index !== djinn_index || force_change) {
            this.selected_djinn_index = djinn_index;
            this.on_djinn_change();
        }

        if (this.selected_char_index !== char_index || force_change) {
            this.selected_char_index = char_index;
            this.on_char_change(false);
        }

        this.data.cursor_manager.clear_tweens();
        this.move_cursor(
            CURSOR_X + this.selected_char_index * COL_GAP,
            CURSOR_Y + this.selected_djinn_index * LINE_GAP
        );
    }

    init_djinn_sprites() {
        for (let i = 0; i < CHARS_PER_PAGE; ++i) {
            this.djinns_sprites.push({});

            for (let key in elements) {
                const elem = elements[key];
                if (elem === elements.NO_ELEMENT || elem === elements.ALL_ELEMENTS) continue;

                const x = DJINN_SPRITE_X + i * CHAR_X_BETWEEN;
                const sprite_base_key = Djinn.sprite_base_key(elem);
                const sprite_key = this.data.info.npcs_sprite_base_list[sprite_base_key].getSpriteKey(djinn_status.SET);
                this.djinns_sprites[i][elem] = this.chars_sprites_group.create(x, CHAR_Y_PADDING, sprite_key);
                this.djinns_sprites[i][elem].anchor.setTo(0.5, 1.0);
                this.djinns_sprites[i][elem].scale.x = -1;
                this.djinns_sprites[i][elem].visible = false;
            }
        }
    }

    init_djinni_status_texts() {
        this.djinni_status_texts = [];
        for (let i = 0; i < CHARS_PER_PAGE; ++i) {
            const x = STAR_X_PADDING - 1 + i * DJINN_NAME_BETWEEN;
            const y = 16;
            this.djinni_status_texts.push(this.base_window.set_text_in_position("", x, y));
        }
    }

    set_djinn_sprite(tween: boolean = true) {
        const this_char = this.data.info.party_data.members[this.selected_char_index];
        if (this.setting_djinn_status && this.selected_djinn_index === this_char.djinni.length) return;

        const this_djinn = this.data.info.djinni_list[this_char.djinni[this.selected_djinn_index]];
        if (this.active_djinn_sprite !== null) {
            this.active_djinn_sprite.visible = false;
            this.active_djinn_sprite.animations.stop();
        }

        const this_sprite = this.djinns_sprites[this.selected_char_index][this_djinn.element];
        this.active_djinn_sprite = this_sprite;
        if (tween) {
            this_sprite.scale.setTo(0, 0);
            this.game.add
                .tween(this_sprite.scale)
                .to({x: -1, y: 1}, Phaser.Timer.QUARTER >> 1, Phaser.Easing.Linear.None, true);
        }

        this_sprite.visible = true;
        let direction: directions;
        switch (this_djinn.status) {
            case djinn_status.RECOVERY:
                direction = directions.left;
                break;
            case djinn_status.STANDBY:
                direction = directions.down;
                break;
            case djinn_status.SET:
                direction = directions.down;
        }

        const action = this_djinn.status === djinn_status.RECOVERY ? djinn_status.STANDBY : this_djinn.status;
        const djinn_sprite_base = this.data.info.npcs_sprite_base_list[Djinn.sprite_base_key(this_djinn.element)];
        djinn_sprite_base.setAnimation(this_sprite, action);
        const anim_key = djinn_sprite_base.getAnimationKey(action, reverse_directions[direction]);
        this_sprite.animations.play(anim_key);
    }

    load_page() {
        this.sizes = new Array(this.data.info.party_data.members.length);
        this.djinn_names = [];
        this.stars = [];

        for (let i = 0; i < CHARS_PER_PAGE; ++i) {
            const party_index = this.page_index * CHARS_PER_PAGE + i;

            if (party_index >= this.data.info.party_data.members.length) continue;
            const this_char = this.data.info.party_data.members[party_index];
            const char_key_name = this_char.key_name;

            if (!(char_key_name in this.chars_sprites)) {
                const action_key = this_char.sprite_base.getSpriteKey(base_actions.IDLE);
                this.chars_sprites[char_key_name] = this.chars_sprites_group.create(0, 0, action_key);
                this.chars_sprites[char_key_name].anchor.setTo(0.5, 1.0);
                this_char.sprite_base.setAnimation(this.chars_sprites[char_key_name], base_actions.IDLE);
            }

            const animation_key = this_char.sprite_base.getAnimationKey(
                base_actions.IDLE,
                reverse_directions[directions.down]
            );
            this.chars_sprites[char_key_name].animations.play(animation_key);
            const x = CHAR_X_PADDING + i * CHAR_X_BETWEEN;
            this.chars_sprites[char_key_name].x = x;
            this.chars_sprites[char_key_name].y = CHAR_Y_PADDING;
            this.chars_sprites[char_key_name].visible = true;

            this.djinn_names.push([]);
            this.stars.push([]);
            this.update_djinn_list(i);
        }
    }

    update_djinn_list(char_index: number) {
        this.djinn_names[char_index].forEach(sprite => {
            this.base_window.destroy_text_obj(sprite);
        });
        this.stars[char_index].forEach(sprite => {
            this.base_window.remove_from_this_window(sprite, true);
        });

        const this_char = this.data.info.party_data.members[char_index];
        const char_djinni = this_char.djinni;
        let this_djinn_names = [];
        let stars = [];

        for (let j = 0; j < char_djinni.length; ++j) {
            const this_djinn = this.data.info.djinni_list[char_djinni[j]];
            const star_x = STAR_X_PADDING + char_index * DJINN_NAME_BETWEEN;
            const star_y = STAR_Y_PADDING + j * numbers.FONT_SIZE;
            stars.push(this.base_window.create_at_group(star_x, star_y, "stars", {frame: this_djinn.element}));

            const djinn_x = DJINN_NAME_X_PADDING + char_index * DJINN_NAME_BETWEEN;
            const djinn_y = DJINN_NAME_Y_PADDING + j * numbers.FONT_SIZE;
            let color;

            switch (this_djinn.status) {
                case djinn_status.SET:
                    color = djinn_font_colors[djinn_status.SET];
                    break;
                case djinn_status.STANDBY:
                    color = djinn_font_colors[djinn_status.STANDBY];
                    break;
                case djinn_status.RECOVERY:
                    color = djinn_font_colors[djinn_status.RECOVERY];
                    break;
            }
            const djinn_name = this.base_window.set_text_in_position(this_djinn.name, djinn_x, djinn_y, {color: color});
            this_djinn_names.push(djinn_name);
        }

        this.sizes[char_index] = char_djinni.length;
        this.djinn_names[char_index] = this_djinn_names;
        this.stars[char_index] = stars;
    }

    unset_page() {
        for (let key in this.chars_sprites) {
            this.chars_sprites[key].animations.stop();
            this.chars_sprites[key].visible = false;
        }
        this.base_window.remove_from_this_window();
        for (let i = 0; i < this.djinn_names.length; ++i) {
            const names = this.djinn_names[i];
            for (let j = 0; j < names.length; ++j) {
                this.base_window.destroy_text_obj(names[j]);
            }
        }
    }

    set_highlight_bar() {
        if (this.setting_djinn_status && this.action_text_selected) {
            this.page_number_bar_highlight.visible = false;
        } else {
            this.page_number_bar_highlight.visible = true;
            this.page_number_bar_highlight.x = HIGHLIGHT_X_PADDING + this.selected_char_index * DJINN_NAME_BETWEEN;
            this.page_number_bar_highlight.y = HIGHLIGHT_Y_PADDING + this.selected_djinn_index * numbers.FONT_SIZE;
        }
        if (this.setting_djinn_status) {
            this.on_action_bar_highlight.visible = true;
            this.on_action_bar_highlight.x =
                HIGHLIGHT_X_PADDING + this.setting_djinn_status_char_index * DJINN_NAME_BETWEEN;
            this.on_action_bar_highlight.y =
                HIGHLIGHT_Y_PADDING + this.setting_djinn_status_djinn_index * numbers.FONT_SIZE;
        } else {
            this.on_action_bar_highlight.visible = false;
        }
    }

    update_djinn_description() {
        if (
            this.setting_djinn_status &&
            this.selected_djinn_index === this.data.info.party_data.members[this.selected_char_index].djinni.length
        ) {
            this.base_window.update_text("", this.djinn_description);
        } else {
            const this_char = this.data.info.party_data.members[this.selected_char_index];
            const this_djinn = this.data.info.djinni_list[this_char.djinni[this.selected_djinn_index]];
            this.base_window.update_text(this_djinn.description, this.djinn_description);
        }
    }

    set_action_text() {
        if (this.setting_djinn_status) {
        } else {
            const this_char = this.data.info.party_data.members[this.selected_char_index];
            const this_djinn = this.data.info.djinni_list[this_char.djinni[this.selected_djinn_index]];
            this.djinn_action_window.set_action_text(this_djinn.status);
        }
    }

    on_char_change(move_cursor: boolean = true) {
        if (this.setting_djinn_status && this.selected_char_index === this.setting_djinn_status_char_index) {
            this.selected_djinn_index = this.setting_djinn_status_djinn_index;
        } else {
            if (this.selected_djinn_index >= this.sizes[this.selected_char_index]) {
                this.selected_djinn_index = this.sizes[this.selected_char_index] - 1;
                if (move_cursor) {
                    this.move_cursor(
                        CURSOR_X + this.selected_char_index * COL_GAP,
                        CURSOR_Y + this.selected_djinn_index * LINE_GAP
                    );
                }
            }
        }

        this.set_highlight_bar();
        const this_char = this.data.info.party_data.members[this.selected_char_index];
        this.chars_quick_info_window.set_char(this_char);

        this.set_action_text();
        this.update_djinn_description();
        this.set_djinn_sprite();
    }

    on_djinn_change() {
        this.set_highlight_bar();
        this.set_action_text();
        this.update_djinn_description();
        this.set_djinn_sprite();
    }

    move_cursor(x_pos: number, y_pos: number, on_complete?: Function) {
        this.data.cursor_manager.move_to({x: x_pos, y: y_pos}, {animate: false}, on_complete);
    }

    /**
     * Grants user control on the current window.
     * @param {Function} on_cancel - Called when B is pressed
     * @param {Function} on_select - Called when A is pressed
     * @param {Function} [on_change_djinn_status] - Called when R is pressed
     */
    grant_control(
        on_cancel: Function,
        on_select: Function,
        on_change_djinn_status?: Function,
        view_char_status?: Function,
        on_change_all_djinn_status?: Function
    ) {
        const controls: Control[] = [
            {buttons: Button.LEFT, on_down: this.previous_character.bind(this), sfx: {down: "menu/move"}},
            {buttons: Button.RIGHT, on_down: this.next_character.bind(this), sfx: {down: "menu/move"}},
            {buttons: Button.UP, on_down: this.previous_djinni.bind(this), sfx: {down: "menu/move"}},
            {buttons: Button.DOWN, on_down: this.next_djinni.bind(this), sfx: {down: "menu/move"}},
            {buttons: Button.A, on_down: on_select, sfx: {down: "menu/positive"}},
            {buttons: Button.B, on_down: on_cancel, sfx: {down: "menu/negative"}},
            {
                // todo: change sfx based on different states when setting or unsetting all djinn
                buttons: [Button.R, Button.SELECT],
                halt: true,
                on_down: on_change_all_djinn_status,
                sfx: {down: "menu/positive"},
            },
            {
                buttons: Button.R,
                on_down: on_change_djinn_status,
                sfx: {
                    down: () => {
                        const this_char = this.data.info.party_data.members[this.selected_char_index];
                        const this_djinn = this.data.info.djinni_list[this_char.djinni[this.selected_djinn_index]];
                        return this_djinn.status === djinn_status.STANDBY ? "menu/djinn_set" : "menu/djinn_unset";
                    },
                },
            },
            {buttons: Button.L, on_down: view_char_status, sfx: {down: "menu/positive"}},
        ];
        this.data.control_manager.add_controls(controls, {
            loop_config: {vertical: true, horizontal: true},
        });
    }

    darken_font_color(darken = true) {
        const this_char = this.data.info.party_data.members[this.setting_djinn_status_char_index];

        for (let i = 0; i < this.djinn_names[this.setting_djinn_status_char_index].length; ++i) {
            const this_djinn = this.data.info.djinni_list[this_char.djinni[i]];
            const color = darken
                ? change_brightness(djinn_font_colors[this_djinn.status], 0.7)
                : djinn_font_colors[this_djinn.status];

            if (darken && i === this.setting_djinn_status_djinn_index) continue;
            this.base_window.update_text_color(color, this.djinn_names[this.setting_djinn_status_char_index][i]);
        }
    }

    set_djinn_operation() {
        const this_char = this.data.info.party_data.members[this.setting_djinn_status_char_index];
        const this_djinn = this.data.info.djinni_list[this_char.djinni[this.setting_djinn_status_djinn_index]];

        if (this.setting_djinn_status_char_index !== this.selected_char_index) {
            const next_char = this.data.info.party_data.members[this.selected_char_index];
            let this_statuses: djinn_status[],
                next_statuses: djinn_status[],
                this_djinni: Djinn[],
                next_djinni: Djinn[];
            let next_djinn: Djinn, djinn_action: djinn_actions;

            if (this.action_text_selected) {
                this_statuses = [this_djinn.status === djinn_status.STANDBY ? djinn_status.ANY : djinn_status.STANDBY];
                next_statuses = [this_djinn.status === djinn_status.STANDBY ? djinn_status.ANY : this_djinn.status];
                this_djinni = [this_djinn];
                next_djinni = [this_djinn];
                djinn_action = djinn_actions.GIVE;
            } else {
                next_djinn = this.data.info.djinni_list[next_char.djinni[this.selected_djinn_index]];
                this_statuses = [
                    next_djinn.status === djinn_status.STANDBY ? djinn_status.ANY : next_djinn.status,
                    this_djinn.status === djinn_status.STANDBY ? djinn_status.ANY : djinn_status.STANDBY,
                ];
                next_statuses = [
                    this_djinn.status === djinn_status.STANDBY ? djinn_status.ANY : this_djinn.status,
                    next_djinn.status === djinn_status.STANDBY ? djinn_status.ANY : djinn_status.STANDBY,
                ];
                this_djinni = [next_djinn, this_djinn];
                next_djinni = [this_djinn, next_djinn];
                djinn_action = djinn_actions.TRADE;
            }

            this.djinn_char_stats_window_left.open(this_char, this_djinni, this_statuses, djinn_action);
            this.djinn_char_stats_window_right.open(next_char, next_djinni, next_statuses, djinn_action);

            this.djinn_char_stats_window_right.base_window.update_position({x: DJINN_CHAR_WIN_STATS_RIGHT_X});
            this.djinn_status_change_header_window.open(
                [this_char, next_char],
                next_djinni,
                this_statuses,
                djinn_action
            );

            this.deactivate();
            this.view_state = VIEW_STATES.STATS;

            this.djinn_psynergy_window.open(
                this_char,
                this_djinni,
                this_statuses,
                (execute_operation: boolean) => {
                    this.djinn_status_change_header_window.close();
                    this.djinn_char_stats_window_left.close();
                    this.djinn_char_stats_window_right.close();

                    if (execute_operation) {
                        if (djinn_action === djinn_actions.TRADE) {
                            this_char.replace_djinn(this_djinn.key_name, next_djinn.key_name);
                            next_char.replace_djinn(next_djinn.key_name, this_djinn.key_name);
                        } else if (djinn_action === djinn_actions.GIVE) {
                            this_char.remove_djinn(this_djinn.key_name);
                            next_char.add_djinn(this_djinn.key_name);
                            this.selected_djinn_index = 0;
                        }

                        this.update_djinn_list(this.selected_char_index);
                        this.update_djinn_list(this.setting_djinn_status_char_index);
                        this.cancel_djinn_status_set();
                    } else {
                        this.grant_control(
                            this.cancel_djinn_status_set.bind(this, true),
                            this.set_djinn_operation.bind(this)
                        );
                    }
                    this.activate();
                },
                true,
                () => {
                    ++this.view_state;
                    if (this.view_state > VIEW_STATES.NEXT_CHAR) {
                        this.view_state = VIEW_STATES.STATS;
                    }

                    switch (this.view_state) {
                        case VIEW_STATES.STATS:
                            this.djinn_psynergy_window.base_window.close(undefined, false);
                            this.djinn_char_stats_window_left.base_window.show(undefined, false);
                            this.djinn_char_stats_window_right.base_window.update_position({
                                x: DJINN_CHAR_WIN_STATS_RIGHT_X,
                            });
                            this.djinn_status_change_header_window.set_action_info_text(`: ${this_char.name}'s Psy`);
                            break;
                        case VIEW_STATES.THIS_CHAR:
                            this.djinn_psynergy_window.update_info(this_char, this_djinni, this_statuses);
                            this.djinn_psynergy_window.base_window.show(undefined, false);
                            this.djinn_char_stats_window_right.base_window.close(undefined, false);
                            this.djinn_status_change_header_window.set_action_info_text(`: ${next_char.name}'s Psy`);
                            break;
                        case VIEW_STATES.NEXT_CHAR:
                            this.djinn_psynergy_window.update_info(next_char, next_djinni, next_statuses);
                            this.djinn_char_stats_window_left.base_window.close(undefined, false);
                            this.djinn_char_stats_window_right.base_window.show(undefined, false);
                            this.djinn_char_stats_window_right.base_window.update_position({x: 0});
                            this.djinn_status_change_header_window.set_action_info_text(": Status");
                            break;
                    }
                },
                djinn_action
            );
            this.djinn_psynergy_window.grant_control();
        } else {
            let next_status: djinn_status;
            switch (this_djinn.status) {
                case djinn_status.SET:
                    next_status = djinn_status.STANDBY;
                    break;
                case djinn_status.STANDBY:
                    next_status = djinn_status.SET;
                    break;
            }

            this.deactivate();
            this.djinn_status_change_header_window.open([this_char], [this_djinn], [next_status]);
            this.djinn_char_stats_window_left.open(this_char, [this_djinn], [next_status]);
            this.djinn_psynergy_window.open(this_char, [this_djinn], [next_status], (execute_operation: boolean) => {
                this.djinn_status_change_header_window.close();
                this.djinn_char_stats_window_left.close();

                if (execute_operation) {
                    this.change_djinn_status();
                    this.cancel_djinn_status_set(true);
                } else {
                    this.grant_control(
                        this.cancel_djinn_status_set.bind(this, true),
                        this.set_djinn_operation.bind(this)
                    );
                }

                this.activate();
            });
            this.djinn_psynergy_window.grant_control();
        }
    }

    change_all_djinn_status() {
        const djinn_index = this.setting_djinn_status
            ? this.setting_djinn_status_djinn_index
            : this.selected_djinn_index;
        const this_char = this.data.info.party_data.members[this.selected_char_index];
        const this_djinn = this.data.info.djinni_list[this_char.djinni[djinn_index]];

        let status: djinn_status = null;
        if (this_djinn.status === djinn_status.SET) {
            status = djinn_status.STANDBY;
        } else if (this_djinn.status === djinn_status.STANDBY) {
            status = djinn_status.SET;
        }

        if (status !== null) {
            for (let i = 0; i < this.data.info.party_data.members.length; ++i) {
                const member = this.data.info.party_data.members[i];
                const djinn = member.djinni;
                for (let j = 0; j < djinn.length; ++j) {
                    const djinni = this.data.info.djinni_list[djinn[j]];
                    djinni.set_status(status);
                    this.base_window.update_text_color(djinn_font_colors[status], this.djinn_names[i][j]);
                }
            }
            this.chars_quick_info_window.update_text();
            this.set_action_text();
            this.set_djinn_sprite(false);
        }
    }

    /**
     * Toggles the current djinn status (Set <> Standby).
     */
    change_djinn_status() {
        const djinn_index = this.setting_djinn_status
            ? this.setting_djinn_status_djinn_index
            : this.selected_djinn_index;
        const this_char = this.data.info.party_data.members[this.selected_char_index];
        const this_djinn = this.data.info.djinni_list[this_char.djinni[djinn_index]];

        let status: djinn_status = null;
        if (this_djinn.status === djinn_status.SET) {
            status = djinn_status.STANDBY;
        } else if (this_djinn.status === djinn_status.STANDBY) {
            status = djinn_status.SET;
        }

        if (status !== null) {
            this_djinn.set_status(status);
            this.base_window.update_text_color(
                djinn_font_colors[status],
                this.djinn_names[this.selected_char_index][this.selected_djinn_index]
            );
            this.chars_quick_info_window.update_text();
            this.set_action_text();
            this.set_djinn_sprite(false);
        }
    }

    cancel_djinn_status_set(reset_index: boolean = false) {
        if (!this.setting_djinn_status) return;
        for (let key in this.chars_sprites) {
            this.chars_sprites[key].y += numbers.FONT_SIZE;
        }

        for (let i = 0; i < CHARS_PER_PAGE; ++i) {
            for (let key in elements) {
                const elem = elements[key];
                if (elem === elements.NO_ELEMENT || elem === elements.ALL_ELEMENTS) continue;
                this.djinns_sprites[i][elem].y += numbers.FONT_SIZE;
            }
            this.base_window.update_text("", this.djinni_status_texts[i]);
            const this_char = this.data.info.party_data.members[i];
            if (this_char === undefined) continue;
            this.sizes[i] = this_char.djinni.length;
        }

        if (reset_index) {
            this.selected_char_index = this.setting_djinn_status_char_index;
            this.selected_djinn_index = this.setting_djinn_status_djinn_index;
            this.set_highlight_bar();
        }

        this.darken_font_color(false);
        this.setting_djinn_status_char_index = -1;
        this.setting_djinn_status_djinn_index = -1;
        this.setting_djinn_status = false;

        this.chars_quick_info_window.set_l_button_visibility(true);

        this.set_highlight_bar();
        this.set_action_text();
        this.update_djinn_description();
        this.set_djinn_sprite();

        this.select_djinn(this.selected_char_index, this.selected_djinn_index);
        this.grant_control(
            this.close.bind(this),
            this.on_choose.bind(this),
            this.change_djinn_status.bind(this),
            this.view_char_status.bind(this),
            this.change_all_djinn_status.bind(this)
        );
    }

    view_char_status() {
        const this_char = this.data.info.party_data.members[this.selected_char_index];
        this.chars_quick_info_window.set_char_info_visibililty(false);
        this.chars_quick_info_window.set_l_button_visibility(false);
        this.chars_sprites_group.visible = false;
        this.djinn_action_window.set_info_visibililty(false);
        this.chars_quick_info_window.set_return_info_visibility(true);
        this.data.cursor_manager.hide();
        this.djinn_char_stats_window_left.open(this_char);
        this.djinn_psynergy_window.open(
            this_char,
            undefined,
            undefined,
            () => {
                this.chars_quick_info_window.set_char_info_visibililty(true);
                this.chars_quick_info_window.set_l_button_visibility(true);
                this.chars_sprites_group.visible = true;
                this.djinn_action_window.set_info_visibililty(true);
                this.chars_quick_info_window.set_return_info_visibility(false);
                this.djinn_char_stats_window_left.close(() => {
                    this.data.cursor_manager.show();
                    this.grant_control(
                        this.close.bind(this),
                        this.on_choose.bind(this),
                        this.change_djinn_status.bind(this),
                        this.view_char_status.bind(this),
                        this.change_all_djinn_status.bind(this)
                    );
                });
            },
            undefined,
            undefined,
            undefined,
            () => {
                this.djinn_psynergy_window.grant_control();
            }
        );
    }

    on_choose() {
        const this_char = this.data.info.party_data.members[this.selected_char_index];
        const this_djinn = this.data.info.djinni_list[this_char.djinni[this.selected_djinn_index]];

        //make selected djinni's sprite stay on screen

        if (this.setting_djinn_status || this_djinn.status === djinn_status.RECOVERY) return;
        for (let key in this.chars_sprites) {
            this.chars_sprites[key].y -= numbers.FONT_SIZE;
        }
        for (let i = 0; i < CHARS_PER_PAGE; ++i) {
            for (let key in elements) {
                const elem = elements[key];
                if (elem === elements.NO_ELEMENT || elem === elements.ALL_ELEMENTS) continue;
                this.djinns_sprites[i][elem].y -= numbers.FONT_SIZE;
            }
        }
        for (let i = 0; i < CHARS_PER_PAGE; ++i) {
            let status_text;
            if (i === this.selected_char_index) {
                switch (this_djinn.status) {
                    case djinn_status.SET:
                        status_text = _.capitalize(djinn_status.STANDBY);
                        break;
                    case djinn_status.STANDBY:
                        status_text = _.capitalize(djinn_status.SET);
                        break;
                }
            } else {
                const other_char = this.data.info.party_data.members[i];
                if (other_char === undefined) continue;
                if (other_char.djinni.length < this_char.djinni.length) {
                    status_text = "Give";
                } else {
                    status_text = "Trade";
                }
            }
            this.base_window.update_text(status_text, this.djinni_status_texts[i]);
        }

        this.setting_djinn_status_char_index = this.selected_char_index;
        this.setting_djinn_status_djinn_index = this.selected_djinn_index;
        this.setting_djinn_status = true;
        this.djinn_action_window.set_action_for_specific_djinn(this_char, this_djinn);
        this.chars_quick_info_window.set_l_button_visibility(false);

        this.darken_font_color();
        this.select_action_text();
        this.selected_djinn_index = 0;

        this.grant_control(this.cancel_djinn_status_set.bind(this, true), this.set_djinn_operation.bind(this));
    }

    open(
        chars_quick_info_window: CharsQuickInfoDjinnWindow,
        djinn_action_window: DjinnActionWindow,
        close_callback?: Function,
        open_callback?: Function
    ) {
        this.selected_char_index = 0;
        this.selected_djinn_index = 0;
        this.page_index = 0;

        this.group.visible = true;
        this.setting_djinn_status_char_index = -1;
        this.setting_djinn_status_djinn_index = -1;
        this.setting_djinn_status = false;
        this.chars_quick_info_window = chars_quick_info_window;
        this.djinn_action_window = djinn_action_window;

        this.load_page();
        this.update_position();
        this.set_highlight_bar();
        this.set_action_text();
        this.update_djinn_description();
        this.set_djinn_sprite();

        this.select_djinn(0, 0);
        this.window_open = true;
        this.window_active = true;
        this.changing_djinn_status = false;
        this.close_callback = close_callback;

        this.grant_control(
            this.close.bind(this),
            this.on_choose.bind(this),
            this.change_djinn_status.bind(this),
            this.view_char_status.bind(this),
            this.change_all_djinn_status.bind(this)
        );

        this.base_window.show(undefined, false);
        if (open_callback) {
            open_callback();
        }
    }

    close() {
        this.window_open = false;
        this.window_active = false;
        this.data.cursor_manager.hide();

        this.unset_page();
        this.group.visible = false;

        this.base_window.close(undefined, false);
        if (this.close_callback) {
            this.close_callback();
        }
    }

    activate() {
        this.window_active = true;
        this.select_djinn(this.selected_char_index, this.selected_djinn_index);
    }

    deactivate() {
        this.window_active = false;
        this.data.cursor_manager.hide();
    }
}
