import {Window} from "../Window";
import * as utils from "../utils";
import {GoldenSun} from "../GoldenSun";
import {Button} from "../XGamepad";
import {MainChar} from "../MainChar";
import {CursorManager, PointVariants} from "../utils/CursorManager";
import {Control} from "../utils/ControlManager";
import { permanent_status } from "../Player";

const MAX_PER_LINE = 4;

const WIN_X = 0;
const WIN_Y = 112;
const WIN_WIDTH = 100;
const WIN_HEIGHT = 20;

const WIN_X2 = 0;
const WIN_Y2 = 0;
const WIN_WIDTH2 = 100;
const WIN_HEIGHT2 = 36;

const WIN_X3 = 8;
const WIN_Y3 = 96;

const CHAR_GROUP_X = 16;
const CHAR_GROUP_Y = 130;

const CHAR_GROUP_X2 = 16;
const CHAR_GROUP_Y2 = 28;

const CHAR_GROUP_X3 = 24;
const CHAR_GROUP_Y3 = 112;

const GAP_SIZE = 24;

const CURSOR_X = 0;
const CURSOR_Y = 118;

const CURSOR_X2 = 0;
const CURSOR_Y2 = 22;

const CURSOR_X3 = 8;
const CURSOR_Y3 = 102;

const ARROW_GROUP_X = 96;
const ARROW_GROUP_Y = 100;
const UP_ARROW_X = 16;
const UP_ARROW_Y = 20;
const DOWN_ARROW_X = 0;
const DOWN_ARROW_Y = 24;
const ARROW_Y_DIFF = 8;

const ARROW_GROUP_X2 = 92;
const ARROW_GROUP_Y2 = -4;

const ARROW_GROUP_X3 = 104;
const ARROW_GROUP_Y3 = 84;

const MENU_SELECTED_Y_SHIFT = 4;
const SEPARATOR_X = 4;
const SEPARATOR_Y = 27;
const SEPARATOR_LENGTH = 96;

export enum CharsMenuModes {
    SHOP,
    MENU,
    HEALER
}

const ARROW_TWEEN_TIME = Phaser.Timer.QUARTER >> 1;

export class CharsMenu {
    public game: Phaser.Game;
    public data: GoldenSun;
    public on_change: (char_key?: string, char_index?: number) => void;

    public window: Window;
    public char_group: Phaser.Group;
    public arrow_group: Phaser.Group;
    public up_arrow: Phaser.Sprite;
    public down_arrow: Phaser.Sprite;

    public arrow_tweens: Phaser.Tween[];
    public lines: MainChar[][];
    public char_sprites: Phaser.Sprite[];
    public current_line: number;
    public selected_index: number;
    public is_active: boolean;
    public is_open: boolean;
    public mode: CharsMenuModes;
    public selected_status: permanent_status;

    constructor(game: Phaser.Game, data: GoldenSun, on_change: CharsMenu["on_change"]) {
        this.game = game;
        this.data = data;
        this.on_change = on_change;

        this.window = new Window(this.game, WIN_X, WIN_Y, WIN_WIDTH, WIN_HEIGHT);
        this.char_group = this.game.add.group();
        this.char_group.x = CHAR_GROUP_X// - SHIFT_X;
        this.char_group.y = CHAR_GROUP_Y// - SHIFT_Y;
        this.char_group.visible = true;

        this.arrow_group = this.game.add.group();
        this.arrow_group.x = ARROW_GROUP_X;
        this.arrow_group.y = ARROW_GROUP_Y;

        this.up_arrow = this.arrow_group.create(UP_ARROW_X, UP_ARROW_Y, "menu", "green_arrow");
        this.up_arrow.rotation = Math.PI;
        this.down_arrow = this.arrow_group.create(DOWN_ARROW_X, DOWN_ARROW_Y, "menu", "green_arrow");
        this.up_arrow.visible = false;
        this.down_arrow.visible = false;

        this.arrow_tweens = [];

        this.lines = [];
        this.char_sprites = [];
        this.current_line = 0;
        this.selected_index = null;
        this.is_active = false;
        this.is_open = false;
        this.mode = null;
    }

    check_mode() {
        if (this.mode === CharsMenuModes.SHOP) {
            this.window.update_size({width: WIN_WIDTH, height: WIN_HEIGHT});
            this.window.update_position({x: WIN_X, y: WIN_Y});

            this.char_group.x = CHAR_GROUP_X + this.game.camera.x;
            this.char_group.y = CHAR_GROUP_Y + this.game.camera.y;
            this.arrow_group.x = ARROW_GROUP_X + this.game.camera.x;
            this.arrow_group.y = ARROW_GROUP_Y + this.game.camera.y;
        } else if (this.mode === CharsMenuModes.MENU) {
            this.window.update_size({width: WIN_WIDTH2, height: WIN_HEIGHT2});
            this.window.update_position({x: WIN_X2, y: WIN_Y2});

            this.char_group.x = CHAR_GROUP_X2 + this.game.camera.x;
            this.char_group.y = CHAR_GROUP_Y2 + this.game.camera.y;
            this.arrow_group.x = ARROW_GROUP_X2 + this.game.camera.x;
            this.arrow_group.y = ARROW_GROUP_Y2 + this.game.camera.y;

            this.window.draw_separator(SEPARATOR_X, SEPARATOR_Y, SEPARATOR_X + SEPARATOR_LENGTH, SEPARATOR_Y, false);
        } else if (this.mode === CharsMenuModes.HEALER) {
            this.window.update_size({width: WIN_WIDTH, height: WIN_HEIGHT});
            this.window.update_position({x: WIN_X3, y: WIN_Y3});

            this.char_group.x = CHAR_GROUP_X3 + this.game.camera.x;
            this.char_group.y = CHAR_GROUP_Y3 + this.game.camera.y;
            this.arrow_group.x = ARROW_GROUP_X3 + this.game.camera.x;
            this.arrow_group.y = ARROW_GROUP_Y3 + this.game.camera.y;
        }
    }

    /*Hides or shows specific arrows
    
    Input: up, down [boolean] - If true, shows up/down arrow*/
    set_arrows(up: boolean = false, down: boolean = false) {
        this.up_arrow.x = UP_ARROW_X;
        this.up_arrow.y = UP_ARROW_Y;
        this.down_arrow.x = DOWN_ARROW_X;
        this.down_arrow.y = DOWN_ARROW_Y;
        if (up) this.up_arrow.visible = true;
        else this.up_arrow.visible = false;

        if (down) this.down_arrow.visible = true;
        else this.down_arrow.visible = false;
    }

    /*Checks which arrows to show or hide*/
    check_arrows() {
        let up = false;
        let down = false;

        if (this.current_line < this.lines.length - 1) down = true;
        if (this.current_line > 0) up = true;

        this.set_arrows(up, down);
        this.init_arrow_tweens();
        this.game.world.bringToTop(this.arrow_group);
    }

    /*Starts the arrow animations*/
    init_arrow_tweens() {
        let up_tween = this.game.add
            .tween(this.up_arrow)
            .to({y: UP_ARROW_Y - ARROW_Y_DIFF}, ARROW_TWEEN_TIME, Phaser.Easing.Linear.None)
            .to({y: UP_ARROW_Y}, ARROW_TWEEN_TIME, Phaser.Easing.Linear.None)
            .loop();
        this.arrow_tweens.push(up_tween);

        let down_tween = this.game.add
            .tween(this.down_arrow)
            .to({y: DOWN_ARROW_Y + ARROW_Y_DIFF}, ARROW_TWEEN_TIME, Phaser.Easing.Linear.None)
            .to({y: DOWN_ARROW_Y}, ARROW_TWEEN_TIME, Phaser.Easing.Linear.None)
            .loop();
        this.arrow_tweens.push(down_tween);

        up_tween.start();
        down_tween.start();
    }

    /*Clears the arrow animations*/
    clear_arrow_tweens() {
        for (let i = 0; i < this.arrow_tweens.length; i++) {
            this.game.tweens.remove(this.arrow_tweens.pop());
        }
    }

    set_chars() {
        this.char_sprites = [];

        for (let i = 0; i < this.lines[this.current_line].length; ++i) {
            const char = this.lines[this.current_line][i];
            let sprite: Phaser.Sprite = null;

            const dead_idle = this.char_group.children.filter((s: Phaser.Sprite) => {
                return s.alive === false && s.key === char.sprite_base.getSpriteKey(utils.base_actions.IDLE);
            });

            if (dead_idle.length > 0) {
                sprite = (dead_idle[0] as Phaser.Sprite).reset(i * GAP_SIZE, 0);
            } else {
                sprite = this.char_group.create(
                    i * GAP_SIZE,
                    0,
                    char.sprite_base.getSpriteKey(utils.base_actions.IDLE)
                );
            }

            sprite.anchor.setTo(0.5, 1.0);

            char.sprite_base.setAnimation(sprite, utils.base_actions.IDLE);
            sprite.animations.play(
                char.sprite_base.getAnimationKey(
                    utils.base_actions.IDLE,
                    utils.reverse_directions[utils.directions.down]
                )
            );

            if (this.mode === CharsMenuModes.HEALER) {
                if (char.has_permanent_status(this.selected_status)) {
                    sprite.scale.setTo(1, 1);
                } else {
                    sprite.scale.setTo(0.75, 0.75);
                }
            }

            this.char_sprites.push(sprite);
        }
    }

    make_lines() {
        let party_length = this.data.info.party_data.members.length;
        let line_number =
            party_length % MAX_PER_LINE === 0
                ? (party_length / MAX_PER_LINE) | 0
                : ((party_length / MAX_PER_LINE) | 0) + 1;

        for (let i = 0; i < line_number; i++) {
            let chars = [];
            for (let n = i * MAX_PER_LINE; n < (i + 1) * MAX_PER_LINE; n++) {
                if (!this.data.info.party_data.members[n]) break;
                chars.push(this.data.info.party_data.members[n]);
            }
            this.lines[i] = chars;
        }
    }

    change_line(line: number, force_index?: number, no_cursor?: boolean) {
        if (this.data.info.party_data.members.length < MAX_PER_LINE * line) return;

        this.clear_arrow_tweens();
        this.unset_character(this.selected_index);

        this.current_line = line;

        if (force_index !== undefined) {
            this.selected_index = force_index;
        } else if (this.selected_index !== null && this.selected_index >= this.lines[this.current_line].length) {
            this.selected_index = this.lines[this.current_line].length - 1;
        }

        utils.kill_all_sprites(this.char_group);
        this.set_chars();
        this.check_arrows();
        this.select_char(this.selected_index, no_cursor);
    }

    next_line(force_index?: number, no_cursor?: boolean) {
        if (this.lines.length === 1 || this.current_line + 1 === this.lines.length) return;
        let index = this.current_line + 1;

        this.change_line(index, force_index, no_cursor);
    }

    previous_line(force_index?: number, no_cursor?: boolean) {
        if (this.lines.length === 1 || this.current_line - 1 < 0) return;
        let index = this.current_line - 1;

        this.change_line(index, force_index, no_cursor);
    }

    set_character(index: number) {
        if (this.mode === CharsMenuModes.SHOP) {
            //set run animation for new character;
        } else if (this.mode === CharsMenuModes.MENU) {
            this.char_sprites[index].y = MENU_SELECTED_Y_SHIFT;
        }
    }

    unset_character(index: number) {
        if (index === undefined || index === null) return;

        if (this.mode === CharsMenuModes.SHOP) {
            //unset run animation for new character;
        } else if (this.mode === CharsMenuModes.MENU) {
            this.char_sprites[index].y = 0;
        }
    }

    select_char(index?: number, no_cursor?: boolean, silent?: boolean) {
        if (index === undefined) {
            index = this.selected_index;
        }

        const on_move = () => {
            this.unset_character(this.selected_index);
            this.selected_index = index;
            this.set_character(this.selected_index);

            if (this.on_change && !silent) {
                const char = this.data.info.party_data.members[this.current_line * MAX_PER_LINE + this.selected_index];
                this.on_change(char.key_name, this.selected_index);
            }
        };

        if (!no_cursor) {
            this.move_cursor(index, on_move);
        } else {
            on_move();
        }
    }

    next_char(no_cursor?: boolean) {
        if (this.lines[this.current_line].length === 1 && this.lines.length === 1) return;

        if (this.selected_index + 1 === this.lines[this.current_line].length) {
            if (this.current_line + 1 === this.lines.length) {
                if (this.lines.length === 1) this.select_char(0, no_cursor);
                else this.change_line(0, 0, no_cursor);
            } else this.next_line(0, no_cursor);
        } else {
            this.select_char(this.selected_index + 1, no_cursor);
        }
    }

    previous_char(no_cursor?: boolean) {
        if (this.lines[this.current_line].length === 1 && this.lines.length === 1) return;

        if (this.selected_index - 1 < 0) {
            if (this.current_line - 1 < 0) {
                if (this.lines.length === 1) this.select_char(this.lines[this.current_line].length - 1, no_cursor);
                else this.change_line(this.lines.length - 1, this.lines[this.lines.length - 1].length - 1, no_cursor);
            } else this.previous_line(this.lines[this.current_line - 1].length - 1, no_cursor);
        } else {
            this.select_char(this.selected_index - 1, no_cursor);
        }
    }

    swap_next() {
        if (
            this.selected_index === this.lines[this.current_line].length - 1 &&
            this.current_line === this.lines.length - 1
        )
            return;

        const index = this.selected_index + this.current_line * MAX_PER_LINE;
        const this_char = this.data.info.party_data.members[index];

        this.data.info.party_data.members[index] = this.data.info.party_data.members[index + 1];
        this.data.info.party_data.members[index + 1] = this_char;

        const new_index = (this.selected_index + 1) % MAX_PER_LINE;
        const new_line = this.current_line + (new_index === 0 ? 1 : 0);

        this.make_lines();
        this.change_line(new_line, new_index);
    }

    swap_previous() {
        if (this.selected_index === 0 && this.current_line === 0) return;

        const index = this.selected_index + this.current_line * MAX_PER_LINE;
        const this_char = this.data.info.party_data.members[index];

        this.data.info.party_data.members[index] = this.data.info.party_data.members[index - 1];
        this.data.info.party_data.members[index - 1] = this_char;

        const new_index = (this.selected_index + MAX_PER_LINE - 1) % MAX_PER_LINE;
        const new_line = this.current_line - (new_index > this.selected_index ? 1 : 0);

        this.make_lines();
        this.change_line(new_line, new_index);
    }

    grant_control(on_cancel?: Function, on_select?: Function, enable_swap?: boolean, extra_controls?: Control[]) {
        const controls = [
            {buttons: Button.LEFT, on_down: this.previous_char.bind(this), sfx: {down: "menu/move"}},
            {buttons: Button.RIGHT, on_down: this.next_char.bind(this), sfx: {down: "menu/move"}},
            {buttons: Button.UP, on_down: this.previous_line.bind(this), sfx: {down: "menu/move"}},
            {buttons: Button.DOWN, on_down: this.next_line.bind(this), sfx: {down: "menu/move"}},
            ...(extra_controls ?? []),
            {
                buttons: Button.A,
                on_down: () => on_select?.(),
                params: {reset_controls: true},
                sfx: {down: "menu/positive"},
            },
            {
                buttons: Button.B,
                on_down: () => on_cancel?.(),
                params: {reset_controls: true},
                sfx: {down: "menu/negative"},
            },
        ];
        if (enable_swap) {
            controls.push(
                {buttons: Button.L, on_down: this.swap_previous.bind(this), sfx: {down: "menu/positive"}},
                {buttons: Button.R, on_down: this.swap_next.bind(this), sfx: {down: "menu/positive"}}
            );
        }
        this.data.control_manager.add_controls(controls, {loop_config: {horizontal: true}});
    }

    move_cursor(pos?: number, on_complete?: Function) {
        if (pos === undefined) pos = this.selected_index;

        let cursor_x = 0;
        let cursor_y = 0;
        let tween_config = {type: null, variant: null};

        if (this.mode === CharsMenuModes.SHOP) {
            cursor_x = CURSOR_X + pos * GAP_SIZE;
            cursor_y = CURSOR_Y;
            tween_config.type = CursorManager.CursorTweens.WIGGLE;
        } else if (this.mode === CharsMenuModes.MENU) {
            cursor_x = CURSOR_X2 + pos * GAP_SIZE;
            cursor_y = CURSOR_Y2;
            tween_config.type = CursorManager.CursorTweens.POINT;
            tween_config.variant = PointVariants.NORMAL;
        } else if (this.mode === CharsMenuModes.HEALER) {
            cursor_x = CURSOR_X3 + pos * GAP_SIZE;
            cursor_y = CURSOR_Y3;
            tween_config.type = CursorManager.CursorTweens.WIGGLE;
        }
        this.data.cursor_manager.move_to(
            {x: cursor_x, y: cursor_y},
            {animate: false, tween_config: tween_config},
            on_complete
        );
    }

    activate() {
        this.move_cursor();
        this.is_active = true;
    }

    deactivate() {
        this.data.cursor_manager.clear_tweens();
        this.is_active = false;
    }

    open(
        select_index: number = 0,
        mode: CharsMenuModes = CharsMenuModes.SHOP,
        open_callback?: () => void,
        silent?: boolean,
        selected_status?: permanent_status
    ) {
        this.current_line = 0;
        this.mode = mode;
        this.selected_status = selected_status;

        this.make_lines();
        this.check_mode();
        this.check_arrows();
        this.set_chars();
        this.select_char(select_index, undefined, silent);

        this.char_group.visible = true;
        this.is_open = true;

        this.activate();
        this.window.show(open_callback, false);
    }

    close(callback?: () => void, destroy: boolean = false, hide_cursor: boolean = false) {
        this.is_open = false;
        this.deactivate();
        utils.kill_all_sprites(this.char_group, destroy);

        this.lines = [];
        this.char_sprites = [];
        this.current_line = 0;
        this.selected_index = null;
        this.is_active = false;
        this.is_open = false;
        this.char_group.visible = false;
        this.mode = null;

        this.set_arrows(false, false);

        if (hide_cursor) {
            this.data.cursor_manager.hide();
        }

        this.window.clear_separators();
        this.window.close(callback, false);
    }
}
