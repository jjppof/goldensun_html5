import {StatusComponent} from "./StatusComponent";
import {Window} from "../Window";
import {GoldenSun} from "../GoldenSun";
import {CursorManager, PointVariants} from "../utils/CursorManager";
import {BattleStatusWindow} from "../windows/battle/BattleStatusWindow";
import {Djinn, djinn_status} from "../Djinn";
import {DEFAULT_FONT_COLOR, RED_FONT_COLOR, YELLOW_FONT_COLOR} from "../magic_numbers";

export class BattleStatusDjinn extends StatusComponent {
    private static readonly CURSOR = {
        X: 1,
        Y: 87,
    };
    private static readonly HIGHLIGHT = {
        X: 8,
        Y: 80,
        WIDTH: 56,
        HEIGHT: 8,
    };
    private static readonly DJINN = {
        STAR_X: 9,
        STAR_Y: 81,
        NAME_X: 16,
        NAME_Y: 80,
        RECOVERY_END_X: 58,
        RECOVERY_Y: 80,
    };

    private static readonly SHIFT_X = 56;
    private static readonly SHIFT_Y = 16;

    private static readonly MAX_LINES = 3;

    private char_djinn: Djinn[][];

    public constructor(
        game: Phaser.Game,
        data: GoldenSun,
        window: Window,
        manager: BattleStatusWindow,
        pos?: {line: number; col: number}
    ) {
        super(game, data, window, manager, pos);
    }

    public select_option() {
        const highlight = {
            x: BattleStatusDjinn.HIGHLIGHT.X + BattleStatusDjinn.SHIFT_X * this.current_col,
            y: BattleStatusDjinn.HIGHLIGHT.Y + BattleStatusDjinn.SHIFT_Y * this.current_line,
            width: BattleStatusDjinn.HIGHLIGHT.WIDTH,
            height: BattleStatusDjinn.HIGHLIGHT.HEIGHT,
        };
        this.update_highlight(highlight);

        const cursor_x = BattleStatusDjinn.CURSOR.X + BattleStatusDjinn.SHIFT_X * this.current_col;
        const cursor_y = BattleStatusDjinn.CURSOR.Y + BattleStatusDjinn.SHIFT_Y * this.current_line;

        const cursor_tween = {type: CursorManager.CursorTweens.POINT, variant: PointVariants.SHORT};
        this.data.cursor_manager.move_to({x: cursor_x, y: cursor_y}, {animate: false, tween_config: cursor_tween});

        this.window.page_indicator.select_page(this.current_col);
    }

    public on_change() {
        this.select_option();

        const chosen_djinn = this.char_djinn[this.current_col][this.current_line];
        const msg = chosen_djinn.status === djinn_status.STANDBY ? "Ready to summon." : chosen_djinn.description;

        this.update_description(msg);
    }

    public on_left() {
        if (this.char_djinn.length <= 1) return;

        const pages = this.char_djinn.length;
        this.current_col = (this.current_col + pages - 1) % pages;

        if (!this.char_djinn[this.current_col][this.current_line])
            this.current_line = this.char_djinn[this.current_col].length - 1;

        this.on_change();
    }

    public on_right() {
        if (this.char_djinn.length <= 1) return;

        const pages = this.char_djinn.length;
        this.current_col = (this.current_col + 1) % pages;

        if (!this.char_djinn[this.current_col][this.current_line])
            this.current_line = this.char_djinn[this.current_col].length - 1;

        this.on_change();
    }

    public on_up() {
        if (this.char_djinn[this.current_col].length <= 1) return;

        if (this.current_line === 0) {
            if (this.current_col === 0) {
                this.current_col = this.char_djinn.length - 1;
                this.current_line = this.char_djinn[this.char_djinn.length - 1].length - 1;
            } else {
                this.current_col = this.current_col - 1;
                this.current_line = this.char_djinn[this.current_col].length - 1;
            }
        } else {
            this.current_line--;
        }

        this.on_change();
    }

    public on_down() {
        if (this.char_djinn[this.current_col].length <= 1) return;

        if (this.current_line + 1 === this.char_djinn[this.current_col].length) {
            if (this.current_col === this.char_djinn.length - 1) {
                this.current_col = 0;
                this.current_line = 0;
            } else {
                this.current_col = this.current_col + 1;
                this.current_line = 0;
            }
        } else {
            this.current_line++;
        }

        this.on_change();
    }

    public initialize() {
        this.update_djinn();

        this.char_djinn.forEach((col, col_index) => {
            col.forEach((djinn, line_index) => {
                const name = djinn.name;
                const star_key = djinn.element + "_star";
                const recovery = djinn.recovery_turn + 1;
                const status = djinn.status;

                let x_pos = BattleStatusDjinn.DJINN.STAR_X + col_index * BattleStatusDjinn.SHIFT_X;
                let y_pos = BattleStatusDjinn.DJINN.STAR_Y + line_index * BattleStatusDjinn.SHIFT_Y;

                const star = this.window.create_at_group(
                    x_pos,
                    y_pos,
                    star_key,
                    undefined,
                    undefined,
                    BattleStatusDjinn.GROUP_KEY
                );
                this.state_sprites.push(star);

                let font_color = DEFAULT_FONT_COLOR;

                if (status === djinn_status.RECOVERY) {
                    font_color = YELLOW_FONT_COLOR;

                    x_pos = BattleStatusDjinn.DJINN.RECOVERY_END_X + col_index * BattleStatusDjinn.SHIFT_X;
                    y_pos = BattleStatusDjinn.DJINN.RECOVERY_Y + line_index * BattleStatusDjinn.SHIFT_Y;

                    const recovery_text = this.window.set_text_in_position(
                        recovery,
                        x_pos,
                        y_pos,
                        true,
                        false,
                        font_color,
                        false,
                        BattleStatusDjinn.GROUP_KEY
                    );
                    this.state_sprites.push(recovery_text.text, recovery_text.shadow);
                } else if (status === djinn_status.STANDBY) {
                    font_color = RED_FONT_COLOR;
                }

                x_pos = BattleStatusDjinn.DJINN.NAME_X + col_index * BattleStatusDjinn.SHIFT_X;
                y_pos = BattleStatusDjinn.DJINN.NAME_Y + line_index * BattleStatusDjinn.SHIFT_Y;

                const name_text = this.window.set_text_in_position(
                    name,
                    x_pos,
                    y_pos,
                    false,
                    false,
                    font_color,
                    false,
                    BattleStatusDjinn.GROUP_KEY
                );
                this.state_sprites.push(name_text.text, name_text.shadow);
            });
        });

        this.select_option();
    }

    private update_djinn() {
        const djinn_list = this.selected_char.djinni;

        let col_djinn = [];
        this.char_djinn = [];

        let count = 0;
        djinn_list.forEach(key_name => {
            if (count === BattleStatusDjinn.MAX_LINES) {
                this.char_djinn.push(col_djinn);
                col_djinn = [];
                count = 0;
            }
            col_djinn.push(this.data.info.djinni_list[key_name]);
            count++;
        });
        if (col_djinn.length > 0) this.char_djinn.push(col_djinn);
    }
}
