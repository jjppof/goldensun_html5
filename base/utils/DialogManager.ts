import {GoldenSun} from "../GoldenSun";
import * as numbers from "../magic_numbers";
import {SpriteBase} from "../SpriteBase";
import * as utils from "../utils";
import {Window} from "../Window";
import * as _ from "lodash";

/**
 * A dialog can be divided in N windows depending on the dialog text size.
 * To set a dialog, call the DialogManager.set_dialog function and pass the entire dialog text.
 * To advance the dialog (call next window), call the DialogManager.next function.
 * Optionallly, if you know that the given text fits in one window, you can use DialogManager.next_dialog.
 */
export class DialogManager {
    private static readonly DIALOG_CRYSTAL_KEY = "dialog_crystal";
    private static readonly VOICE_MIN_INTERVAL: number = 50;
    private static readonly COLOR_START = /\${COLOR:(\w+)}/;
    private static readonly COLOR_START_G = /\${COLOR:(\w+)}/g;
    private static readonly COLOR_START_GLOB = /\${COLOR:(\w+)}/g;
    private static readonly COLOR_END = /\${COLOR:\/}/;
    private static readonly COLOR_END_G = /\${COLOR:\/}/g;
    private static readonly PAUSE_PATTERN = /\$\{PAUSE:(\d+)\}/;
    private static readonly PAUSE_PATTERN_G = /\$\{PAUSE:(\d+)\}/g;

    private game: Phaser.Game;
    private data: GoldenSun;
    private parts: {
        lines: string[];
        colors: number[][];
        pauses: {
            [letter_index: number]: number;
        }[];
        width: number;
        height: number;
    }[];
    private _step: number;
    private finished: boolean;
    private avatar: string;
    private voice_key: string;
    private window: Window;
    private avatar_window: Window;
    private italic_font: boolean;
    private hero_direction: utils.directions;
    private dialog_crystal_sprite_base: SpriteBase;
    private dialog_crystal: Phaser.Sprite;
    private dialog_crystal_anim_key: string;
    private dialog_crystal_tween: Phaser.Tween;
    private show_crystal: boolean;
    private avatar_inside_window: boolean;
    private mind_read_window: boolean;
    private pos_relative_to_canvas: boolean;
    private font_color: number;

    constructor(
        game: Phaser.Game,
        data: GoldenSun,
        italic_font: boolean = true,
        mind_read_window: boolean = false,
        pos_relative_to_canvas: boolean = false
    ) {
        this.game = game;
        this.data = data;
        this.italic_font = italic_font;

        this.parts = null; //parts of the dialog text
        this._step = 0; //step index
        this.finished = false;

        this.avatar = null;
        this.voice_key = "";
        this.window = null;
        this.avatar_window = null;
        this.hero_direction = utils.directions.down;

        this.dialog_crystal_sprite_base = this.data.info.misc_sprite_base_list[DialogManager.DIALOG_CRYSTAL_KEY];
        this.show_crystal = false;
        this.mind_read_window = mind_read_window ?? false;
        this.pos_relative_to_canvas = pos_relative_to_canvas ?? false;
        this.font_color = this.mind_read_window ? Window.MIND_READ_FONT_COLOR : numbers.DEFAULT_FONT_COLOR;
    }

    get window_x() {
        if (this.window) {
            return this.window.x;
        }
        return null;
    }

    get window_y() {
        if (this.window) {
            return this.window.y;
        }
        return null;
    }

    get current_width() {
        if (this.window) {
            return this.window.width;
        }
        return null;
    }

    get current_height() {
        if (this.window) {
            return this.window.height;
        }
        return null;
    }

    get is_finished() {
        return this.finished;
    }

    get step() {
        return this._step;
    }

    get size() {
        return this.parts?.length ?? 0;
    }

    /**
     * Creates and configs the dialog crystal sprite.
     */
    private set_dialog_crystal() {
        const sprite_key = this.dialog_crystal_sprite_base.getSpriteKey(DialogManager.DIALOG_CRYSTAL_KEY);
        this.dialog_crystal = this.game.add.sprite(0, 0, sprite_key);
        this.dialog_crystal_sprite_base.setAnimation(this.dialog_crystal, DialogManager.DIALOG_CRYSTAL_KEY);
        this.dialog_crystal_anim_key = this.dialog_crystal_sprite_base.getAnimationKey(
            DialogManager.DIALOG_CRYSTAL_KEY,
            "rotate"
        );
        this.dialog_crystal.visible = false;
        this.dialog_crystal_tween = null;
    }

    /**
     * Updates the dialog and avatar windows.
     */
    update_position() {
        if (this.avatar && this.avatar_window) {
            this.avatar_window.update();
        }
        if (this.window) {
            this.window.update();
        }
    }

    /**
     * Updates the borders in the case of a Mind Read window.
     */
    update_borders() {
        if (this.mind_read_window) {
            this.window?.update_mind_read_borders();
            this.avatar_window?.update_mind_read_borders();
        }
    }

    /**
     * Tries to calculate the position of the dialog window.
     * @param width the window width.
     * @param height the window height.
     * @returns Returns the window position.
     */
    private get_dialog_window_position(width: number, height: number) {
        const x = (numbers.GAME_WIDTH - width) >> 1;
        let y = (numbers.MAX_DIAG_WIN_HEIGHT - height) >> 1;
        if (![utils.directions.up, utils.directions.up_left, utils.directions.up_right].includes(this.hero_direction)) {
            y = numbers.GAME_HEIGHT - (numbers.MAX_DIAG_WIN_HEIGHT + 4) + y;
        }
        return {x: x, y: y};
    }

    /**
     * Tries to calculate the position of the avatar window
     * @param win_pos the window position object.
     * @returns Returns the avatar position.
     */
    private get_avatar_position(win_pos: {x?: number; y?: number}) {
        const x = ((this.parts[this.step].width >> 2) + win_pos.x) | 0;
        let y;
        if (win_pos.y >= numbers.GAME_HEIGHT >> 1) {
            y = win_pos.y - numbers.AVATAR_SIZE - (this.mind_read_window ? 10 : 8);
        } else {
            y = win_pos.y + this.parts[this.step].height + 4;
        }
        return {x: x, y: y};
    }

    /**
     * Sets current hero direction.
     * @param hero_direction the hero direction.
     */
    private set_hero_direction(hero_direction: utils.directions) {
        if (hero_direction !== undefined) {
            this.hero_direction = hero_direction;
        }
    }

    /**
     * Calls the next dialog window. If the dialog is finished, this function passes true to the callback.
     * @param callback Every time a dialog section is shown, this function is called. If it's the last section, passes true to it.
     * @param custom_pos Custom dialog window position object.
     * @param custom_avatar_pos Custom avatar window position.
     */
    next(
        callback: (finished: boolean) => void,
        custom_pos?: {x?: number; y?: number},
        custom_avatar_pos?: {x?: number; y?: number}
    ) {
        if (this.avatar_window) {
            this.avatar_window.destroy(false);
            this.avatar_window = null;
        }
        if (this.step >= this.parts.length) {
            //finishes the dialog
            this.finished = true;
            this.window.destroy(true, () => {
                this.window = null;
                if (callback) {
                    callback(this.finished);
                }
            });
            this.dialog_crystal.destroy();
            this.dialog_crystal = null;
            return;
        }
        if (this.window) {
            //destroys the current window
            this.window.destroy(false);
            this.window = null;
        }
        this.mount_window(callback, custom_pos, custom_avatar_pos);
        ++this._step;
    }

    /**
     * Mounts and shows the dialog.
     * @param callback On window mount callback
     * @param custom_pos Custom dialog window position object.
     * @param custom_avatar_pos Custom avatar window position object.
     */
    private mount_window(
        callback: (finished: boolean) => void,
        custom_pos: {x?: number; y?: number},
        custom_avatar_pos: {x?: number; y?: number}
    ) {
        this.dialog_crystal.visible = false;
        let width = this.parts[this.step].width;
        let height = this.parts[this.step].height;
        if (this.avatar_inside_window) {
            width += numbers.AVATAR_SIZE + 2;
            if (height < numbers.AVATAR_SIZE + 4) {
                height = numbers.AVATAR_SIZE + 4;
            }
        }
        const win_pos = this.get_dialog_window_position(width, height);
        if (custom_pos?.x !== undefined) {
            win_pos.x = custom_pos.x;
        }
        if (custom_pos?.y !== undefined) {
            win_pos.y = custom_pos.y;
        }
        this.window = new Window(
            this.game,
            win_pos.x,
            win_pos.y,
            width,
            height,
            undefined,
            undefined,
            this.mind_read_window
        );
        if (this.pos_relative_to_canvas) {
            this.window.set_canvas_update();
        }
        this.window.show(
            ((step, italic_font, next_callback) => {
                if (this.avatar_inside_window) {
                    this.window.create_at_group(4, 4, "avatars", {frame: this.avatar});
                }
                const padding_x = this.avatar_inside_window ? numbers.AVATAR_SIZE + 10 : undefined;
                let now = this.game.time.now;
                const play_voice = (word: string, current_text: string, word_index: number) => {
                    if (
                        this.voice_key &&
                        (word_index === 1 || this.game.time.now - now > DialogManager.VOICE_MIN_INTERVAL)
                    ) {
                        now = this.game.time.now;
                        this.data.audio.play_se(`voices/${this.voice_key}`);
                    }
                };
                this.window
                    .set_dialog_text(this.parts[step].lines, {
                        padding_x: padding_x,
                        italic: italic_font,
                        animate: true,
                        colors: this.parts[step].colors,
                        word_callback: play_voice,
                        pauses: this.parts[step].pauses,
                    })
                    .then(() => {
                        if (step < this.parts.length - 1 || this.show_crystal) {
                            this.dialog_crystal.visible = true;
                            let width = this.parts[step].width;
                            let height = this.parts[step].height;
                            if (this.avatar_inside_window) {
                                width += numbers.AVATAR_SIZE + 2;
                                if (height < numbers.AVATAR_SIZE + 4) {
                                    height = numbers.AVATAR_SIZE + 4;
                                }
                            }
                            this.dialog_crystal.x = this.window.real_x + width - this.dialog_crystal.width;
                            this.dialog_crystal.y = this.window.real_y + height;
                            const parent = this.dialog_crystal.parent;
                            parent.setChildIndex(this.dialog_crystal, parent.getChildIndex(this.window.group));
                            this.dialog_crystal.play(this.dialog_crystal_anim_key);
                            const tween_to_y = [
                                this.dialog_crystal.y - (this.dialog_crystal.height >> 1),
                                this.dialog_crystal.y,
                            ];
                            if (this.dialog_crystal_tween && this.dialog_crystal_tween.isRunning) {
                                this.dialog_crystal_tween.stop();
                            }
                            this.dialog_crystal_tween = this.game.tweens
                                .create(this.dialog_crystal)
                                .to({y: tween_to_y}, 1400, Phaser.Easing.Quadratic.InOut, true, 0, -1);
                        } else {
                            if (this.dialog_crystal_tween && this.dialog_crystal_tween.isRunning) {
                                this.dialog_crystal_tween.stop();
                            }
                        }
                        if (next_callback) next_callback(this.finished);
                    });
            }).bind(this, this.step, this.italic_font, callback)
        );
        if (this.avatar && !this.avatar_inside_window) {
            let avatar_pos = this.get_avatar_position(win_pos);
            if (custom_avatar_pos && custom_avatar_pos.x !== undefined) {
                avatar_pos.x = custom_avatar_pos.x;
            }
            if (custom_avatar_pos && custom_avatar_pos.y !== undefined) {
                avatar_pos.y = custom_avatar_pos.y;
            }
            const window_size = numbers.AVATAR_SIZE + (this.mind_read_window ? 10 : 4);
            this.avatar_window = new Window(
                this.game,
                avatar_pos.x,
                avatar_pos.y,
                window_size,
                window_size,
                undefined,
                undefined,
                this.mind_read_window
            );
            if (this.pos_relative_to_canvas) {
                this.avatar_window.set_canvas_update();
            }
            const base_pos = this.mind_read_window ? 8 : 4;
            this.avatar_window.create_at_group(base_pos, base_pos, "avatars", {frame: this.avatar});
            this.avatar_window.show();
        }
    }

    /**
     * Replaces custom tokens in text with their actual values.
     * Use ${HERO} to replace by hero name.
     * Use ${BREAK} to start a new window.
     * Use ${BREAK_LINE} to break line.
     * Use ${PAUSE:duration_ms} to delay the dialog for the given duration value in ms.
     * Use ${STORAGE:storage_key} to replace by by a storage value with the given key.
     * Place your text between ${COLOR:hex_value} and ${COLOR:/} to change its color.
     * @param text The text to be formatted.
     * @returns Returns the text formetted.
     */
    private format_text(text: string) {
        let storage_match = /(?: )?\${STORAGE:(\w+)}(?: )?/g.exec(text);
        while (storage_match !== null) {
            const storage_key = storage_match[1];
            const re = new RegExp(`( )?\\\${STORAGE:${_.escapeRegExp(storage_key)}}( )?`, "g");
            text = text.replace(re, `$1${this.data.storage.get(storage_key)}$2`);
            storage_match = /(?: )?\${STORAGE:(\w+)}(?: )?/g.exec(text);
        }
        text = text.replace(/\${HERO}/g, this.data.info.main_char_list[this.data.hero.key_name].name);
        text = text.replace(/( )?\${BREAK}( )?/g, " ${BREAK} ");
        text = text.replace(/( )?\${BREAK_LINE}( )?/g, " ${BREAK_LINE} ");
        return text;
    }

    /**
     * Receives a text string and mounts the the dialog sections that will go to each window of the dialog.
     * @param text the dialog text.
     * @param options the dialog options.
     */
    set_dialog(
        text: string,
        options?: {
            /** The avatar key name. */
            avatar?: string;
            /** The current hero direction in order to better calculate window position. */
            hero_direction?: utils.directions;
            /** Whether the avatar is going to be inside the dialog window or not. */
            avatar_inside_window?: boolean;
            /** A custom max dialog width. */
            custom_max_dialog_width?: number;
            /** The voice key sfx in order to be played while the text is shown. */
            voice_key?: string;
        }
    ) {
        this._step = 0;
        this.avatar = options?.avatar;
        this.voice_key = options?.voice_key;
        this.set_hero_direction(options?.hero_direction);
        this.avatar_inside_window = options?.avatar_inside_window ?? false;
        if (!this.dialog_crystal) {
            this.set_dialog_crystal();
        }
        text = this.format_text(text);
        const max_dialog_width = options?.custom_max_dialog_width ?? numbers.MAX_DIAG_WIN_WIDTH;
        const max_efective_width = max_dialog_width - 2 * numbers.WINDOW_PADDING_H - numbers.INSIDE_BORDER_WIDTH;
        const words = text.split(" ");
        const windows: DialogManager["parts"] = []; //array of lines
        let lines = []; //array of strings
        let line = []; //array of words
        let line_width = 0; //in px
        let line_length = 0;
        let max_window_width = 0;
        let line_color = [];
        let lines_color = [];
        let line_pauses = {};
        let lines_pauses = [];
        let this_color = this.font_color;
        const push_window = () => {
            windows.push({
                lines: lines.slice(),
                colors: lines_color.slice(),
                pauses: _.cloneDeep(lines_pauses),
                width: max_window_width + 2 * numbers.WINDOW_PADDING_H + numbers.INSIDE_BORDER_WIDTH,
                height:
                    numbers.WINDOW_PADDING_TOP +
                    numbers.WINDOW_PADDING_BOTTOM +
                    lines.length * (numbers.FONT_SIZE + numbers.SPACE_BETWEEN_LINES) -
                    numbers.SPACE_BETWEEN_LINES,
            });
        };
        const push_line = () => {
            line_length = 0;
            const line_text = line.filter(Boolean).join(" ");
            lines.push(line_text);
            for (let i = 0; i < line_text.length; ++i) {
                if (line_text.charAt(i) === " ") {
                    line_color.splice(i, 0, 0x0);
                }
            }
            lines_color.push(line_color);
            lines_pauses.push(Object.keys(line_pauses).length ? line_pauses : null);
            max_window_width = Math.max(max_window_width, utils.get_text_width(this.game, line_text, this.italic_font));
        };
        for (let i = 0; i < words.length; ++i) {
            let word = words[i];

            let temp_word = word.replaceAll(DialogManager.COLOR_START_G, "").replaceAll(DialogManager.COLOR_END_G, "");
            let pause_match = DialogManager.PAUSE_PATTERN.exec(temp_word);
            while (pause_match) {
                const index_in_word = pause_match.index;
                const pause_duration = parseInt(pause_match[1]);
                temp_word = temp_word.replace(DialogManager.PAUSE_PATTERN, "");
                line_pauses[line_length + index_in_word] = pause_duration;
                pause_match = DialogManager.PAUSE_PATTERN.exec(temp_word);
            }
            word = word.replaceAll(DialogManager.PAUSE_PATTERN_G, "");

            const color_match = word.match(/\${COLOR:(?:(\w+)|(\/))}/);
            let letter_colors: number[];
            if (color_match) {
                const colors_seq = [];
                let current_start_idx = 0;
                do {
                    const start_matches = [...word.matchAll(DialogManager.COLOR_START_GLOB)];
                    const start_match = start_matches.length ? start_matches[0] : null;
                    const end_match = word.match(DialogManager.COLOR_END);

                    const matched_color = start_match ? parseInt(start_match[1], 16) : this_color;

                    const start_idx = start_match ? start_match.index : 0;
                    const end_idx = start_matches.length > 1 ? start_matches[1].index : word.length;
                    const before_coloring_idx = start_match ? start_match.index + start_match[0].length : 0;
                    const after_coloring_idx = end_match ? end_match.index : end_idx;
                    const after_color_end_idx = end_match ? end_match.index + end_match[0].length : end_idx;

                    const before_color_arr = new Array(start_idx - current_start_idx).fill(this_color);
                    const after_color_init_arr = new Array(after_coloring_idx - before_coloring_idx).fill(
                        matched_color
                    );
                    const after_color_end_arr = new Array(end_idx - after_color_end_idx).fill(this.font_color);
                    colors_seq.push(before_color_arr.concat(after_color_init_arr, after_color_end_arr));

                    current_start_idx =
                        end_idx - (start_match ? start_match[0].length : 0) - (end_match ? end_match[0].length : 0);

                    this_color = end_match ? this.font_color : matched_color;

                    word = word.replace(DialogManager.COLOR_START, "").replace(DialogManager.COLOR_END, "");
                } while (DialogManager.COLOR_START.test(word) || DialogManager.COLOR_END.test(word));

                if (!word.length) {
                    continue;
                }
                letter_colors = colors_seq.flat();
            } else {
                letter_colors = new Array(word.length).fill(this_color);
            }

            line_width = utils.get_text_width(this.game, line.filter(Boolean).join(" ") + word, this.italic_font);
            if (line_width >= max_efective_width || word === "${BREAK}" || word === "${BREAK_LINE}") {
                //check if it's the end of the line
                push_line();
                line = [];
                line_color = [];
                line_pauses = {};
                if (word !== "${BREAK}" && word !== "${BREAK_LINE}") {
                    line_length += word.length + 1;
                    line.push(word);
                    line_color.push(...letter_colors);
                }
                if (lines.length === numbers.MAX_LINES_PER_DIAG_WIN || word === "${BREAK}") {
                    //check if it's the end of the window
                    push_window();
                    max_window_width = 0;
                    lines = [];
                    lines_color = [];
                    lines_pauses = [];
                }
            } else {
                line_length += word.length + 1;
                line.push(word);
                line_color.push(...letter_colors);
            }
        }
        if (line.length) {
            //deal with the last window that does not have 3 lines
            push_line();
            push_window();
        }
        this.parts = windows;
    }

    /**
     * This is an optional way to invoke a dialog instead of set_dialog.
     * It calls a window and let it open till you call next_dialog again or call kill_dialog.
     * It's expected that the given text fits in one window.
     * @param text The text to be shown.
     * @param callback The on window ready callback.
     * @param options The dialog options.
     */
    next_dialog(
        text: string,
        callback: (finished: boolean) => void,
        options?: {
            /** The avatar key name. */
            avatar?: string;
            /** The voice key sfx in order to be played while the text is shown. */
            voice_key?: string;
            /** The current hero direction in order to better calculate window position. */
            hero_direction?: utils.directions;
            /** Custom dialog window position object. */
            custom_pos?: {x?: number; y?: number};
            /** Custom avatar window position object. */
            custom_avatar_pos?: {x?: number; y?: number};
            /** Whether the dialog crystall will be shown or not. */
            show_crystal?: boolean;
        }
    ) {
        this.parts = null;
        if (this.window) {
            this.window.destroy(false);
            this.window = null;
        }
        if (this.avatar_window) {
            this.avatar_window.destroy(false);
            this.avatar_window = null;
        }
        this.show_crystal = options?.show_crystal;
        this.set_dialog(text, {
            avatar: options?.avatar,
            hero_direction: options?.hero_direction,
            voice_key: options?.voice_key,
        });
        this.mount_window(callback, options?.custom_pos, options?.custom_avatar_pos);
    }

    close_dialog(callback?: () => void) {
        if (this.dialog_crystal) {
            this.dialog_crystal.visible = false;
        }
        if (this.avatar_window) {
            this.avatar_window.close();
        }
        this.window.close(callback);
    }

    /**
     * If you started a dialog with next_dialog, calls this function to kill it.
     * @param callback on dialog kill callback.
     * @param dialog_only if true, destroys only the dialog window and keeps the avatar window.
     * @param destroy_crystal if true, destroys the dialog crystal.
     */
    kill_dialog(callback?: () => void, dialog_only = false, destroy_crystal = false) {
        if (!dialog_only && this.avatar_window) {
            this.avatar_window.destroy(false);
            this.avatar_window = null;
        }
        if (this.window) {
            this.finished = true;
            this.window.destroy(true, () => {
                this.window = null;
                if (callback) {
                    callback();
                }
            });
            if (destroy_crystal && this.dialog_crystal) {
                this.dialog_crystal.destroy();
                this.dialog_crystal = null;
            }
        }
    }

    /**
     * Unsets the everything related to a initialized dialog.
     */
    destroy() {
        if (this.avatar_window) {
            this.avatar_window.destroy(false);
            this.avatar_window = null;
        }
        if (this.window) {
            this.window.destroy(false);
            this.window = null;
        }
        if (this.dialog_crystal) {
            this.dialog_crystal.destroy();
            this.dialog_crystal = null;
        }
    }
}
