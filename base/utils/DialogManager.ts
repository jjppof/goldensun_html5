import {GoldenSun} from "../GoldenSun";
import * as numbers from "../magic_numbers";
import {SpriteBase} from "../SpriteBase";
import * as utils from "../utils";
import {Window} from "../Window";
import * as _ from "lodash";

//A dialog can be divided in N windows. Each division has a step index.
//To set a dialog, call the DialogManager.set_dialog function and pass the entire dialog text.
//To advance the dialog (call next window), call the DialogManager.next function.
export class DialogManager {
    private static readonly DIALOG_CRYSTAL_KEY = "dialog_crystal";
    private static readonly VOICE_MIN_INTERVAL: number = 50;

    private game: Phaser.Game;
    private data: GoldenSun;
    private parts: {
        lines: string[];
        colors: number[][];
        width: number;
        height: number;
    }[];
    private step: number;
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

    constructor(game, data, italic_font = true) {
        this.game = game;
        this.data = data;
        this.italic_font = italic_font;

        this.parts = null; //parts of the dialog text
        this.step = 0; //step index
        this.finished = false;

        this.avatar = null;
        this.voice_key = "";
        this.window = null;
        this.avatar_window = null;
        this.hero_direction = utils.directions.down;

        this.dialog_crystal_sprite_base = this.data.info.misc_sprite_base_list[DialogManager.DIALOG_CRYSTAL_KEY];
        this.show_crystal = false;
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

    update_position() {
        if (this.avatar && this.avatar_window) {
            this.avatar_window.update(true);
        }
        if (this.window) {
            this.window.update(true);
        }
    }

    //Internal method. Try to calculate the position of the dialog window
    private get_dialog_window_position(width: number, height: number) {
        const x = (numbers.GAME_WIDTH - width) >> 1;
        let y = (numbers.MAX_DIAG_WIN_HEIGHT - height) >> 1;
        if (![utils.directions.up, utils.directions.up_left, utils.directions.up_right].includes(this.hero_direction)) {
            y = numbers.GAME_HEIGHT - (numbers.MAX_DIAG_WIN_HEIGHT + 4) + y;
        }
        return {x: x, y: y};
    }

    //Internal method. Try to calculate the position of the avatar window
    private get_avatar_position(win_pos: {x?: number; y?: number}) {
        const x = ((this.parts[this.step].width >> 2) + win_pos.x) | 0;
        let y;
        if (win_pos.y >= numbers.GAME_HEIGHT >> 1) {
            y = win_pos.y - numbers.AVATAR_SIZE - 8;
        } else {
            y = win_pos.y + this.parts[this.step].height + 4;
        }
        return {x: x, y: y};
    }

    //set current hero direction
    private set_hero_direction(hero_direction: utils.directions) {
        if (hero_direction !== undefined) {
            this.hero_direction = hero_direction;
        }
    }

    //Calls the next dialog window. If the dialog is finished, this function passes true to the callback.
    next(callback, custom_pos?: {x?: number; y?: number}, custom_avatar_pos?: {x?: number; y?: number}) {
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
        ++this.step;
    }

    private mount_window(callback, custom_pos: {x?: number; y?: number}, custom_avatar_pos: {x?: number; y?: number}) {
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
        this.window = new Window(this.game, win_pos.x, win_pos.y, width, height, false);
        this.window.show(
            ((step, italic_font, next_callback) => {
                if (this.avatar_inside_window) {
                    this.window.create_at_group(4, 4, "avatars", undefined, this.avatar);
                }
                const padding_x = this.avatar_inside_window ? numbers.AVATAR_SIZE + 10 : undefined;
                let now = this.game.time.now;
                const play_voice = () => {
                    if (this.voice_key && this.game.time.now - now > DialogManager.VOICE_MIN_INTERVAL) {
                        now = this.game.time.now;
                        this.data.audio.play_se(`voices/${this.voice_key}`);
                    }
                };
                this.window
                    .set_text(
                        this.parts[step].lines,
                        padding_x,
                        undefined,
                        undefined,
                        italic_font,
                        true,
                        this.parts[step].colors,
                        play_voice
                    )
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
            const window_size = numbers.AVATAR_SIZE + 4;
            this.avatar_window = new Window(this.game, avatar_pos.x, avatar_pos.y, window_size, window_size);
            this.avatar_window.create_at_group(4, 4, "avatars", undefined, this.avatar);
            this.avatar_window.show();
        }
    }

    private format_text(text: string) {
        text = text.replace(/\${HERO}/g, this.data.info.main_char_list[this.data.hero.key_name].name);
        text = text.replace(/( )?\${BREAK}( )?/g, " ${BREAK} ");
        text = text.replace(/( )?\${BREAK_LINE}( )?/g, " ${BREAK_LINE} ");
        text = text.replace(/(?: )?(\${COLOR:(?:\w+|\/)})(?: )?/g, " $1 ");
        let storage_match = /(?: )?\${STORAGE:(\w+)}(?: )?/g.exec(text);
        while (storage_match !== null) {
            const storage_key = storage_match[1];
            const re = new RegExp(`( )?\\\${STORAGE:${_.escapeRegExp(storage_key)}}( )?`, "g");
            text = text.replace(re, `$1${this.data.storage.get(storage_key)}$2`);
            storage_match = /(?: )?\${STORAGE:(\w+)}(?: )?/g.exec(text);
        }
        return text;
    }

    //Receives a text string and mount the the dialog sections that will go to each window of the dialog.
    //Optionally, also receives an initial avatar and the hero talking direction.
    //Use ${HERO} to replace by hero name. Use ${BREAK} to start a new window. Use ${BREAK_LINE} to break line.
    //Use ${STORAGE:storage_key} to replace by by a storage value with the given key.
    //Place your text between ${COLOR:hex_value} and ${COLOR:/} to change it color.
    set_dialog(
        text: string,
        options?: {
            avatar?: string;
            hero_direction?: utils.directions;
            avatar_inside_window?: boolean;
            custom_max_dialog_width?: number;
            voice_key?: string;
        }
    ) {
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
        let max_window_width = 0;
        let line_color = [];
        let lines_color = [];
        let this_color = numbers.DEFAULT_FONT_COLOR;
        const push_window = () => {
            windows.push({
                lines: lines.slice(),
                colors: lines_color.slice(),
                width: max_window_width + 2 * numbers.WINDOW_PADDING_H + numbers.INSIDE_BORDER_WIDTH,
                height:
                    numbers.WINDOW_PADDING_TOP +
                    numbers.WINDOW_PADDING_BOTTOM +
                    lines.length * (numbers.FONT_SIZE + numbers.SPACE_BETWEEN_LINES) -
                    numbers.SPACE_BETWEEN_LINES,
            });
        };
        const push_line = () => {
            const line_text = line.filter(Boolean).join(" ");
            lines.push(line_text);
            for (let i = 0; i < line_text.length; ++i) {
                if (line_text.charAt(i) === " ") {
                    line_color.splice(i, 0, 0x0);
                }
            }
            lines_color.push(line_color);
            max_window_width = Math.max(max_window_width, utils.get_text_width(this.game, line_text, this.italic_font));
        };
        for (let i = 0; i < words.length; ++i) {
            const word = words[i];
            const match = word.match(/\${COLOR:(?:(\w+)|(\/))}/);
            if (match) {
                if (match[2]) {
                    this_color = numbers.DEFAULT_FONT_COLOR;
                } else {
                    this_color = parseInt(match[1], 16);
                }
                continue;
            }
            line_width = utils.get_text_width(this.game, line.filter(Boolean).join(" ") + word, this.italic_font);
            if (line_width >= max_efective_width || word === "${BREAK}" || word === "${BREAK_LINE}") {
                //check if it's the end of the line
                push_line();
                line = [];
                line_color = [];
                if (word !== "${BREAK}" && word !== "${BREAK_LINE}") {
                    line.push(word);
                    line_color.push(...new Array(word.length).fill(this_color));
                }
                if (lines.length === numbers.MAX_LINES_PER_DIAG_WIN || word === "${BREAK}") {
                    //check if it's the end of the window
                    push_window();
                    max_window_width = 0;
                    lines = [];
                    lines_color = [];
                }
            } else {
                line.push(word);
                line_color.push(...new Array(word.length).fill(this_color));
            }
        }
        if (line.length) {
            //deal with the last window that does not have 3 lines
            push_line();
            push_window();
        }
        this.parts = windows;
    }

    //Calls a window and let it open till you call quick_next again or call kill_dialog. Is expected that text fits in one window.
    quick_next(
        text: string,
        callback: Function, //on window ready callback
        options?: {
            avatar?: string;
            voice_key?: string;
            hero_direction?: utils.directions;
            custom_pos?: {x?: number; y?: number};
            custom_avatar_pos?: {x?: number; y?: number};
            show_crystal?: boolean;
        }
    ) {
        this.parts = null;
        this.step = 0;
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

    kill_dialog(callback, dialog_only = false, destroy_crystal = false) {
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
