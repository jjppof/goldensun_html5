import { TextObj, Window } from '../../Window';
import { base_actions, capitalize, directions, reverse_directions } from '../../utils';
import { Djinn, djinn_font_colors } from '../../Djinn';
import * as numbers from '../../magic_numbers';
import { GoldenSun } from '../../GoldenSun';
import { MainChar } from '../../MainChar';

const BASE_WIN_WIDTH = 236;
const BASE_WIN_HEIGHT = 36;
const BASE_WIN_X = 0;
const BASE_WIN_Y = 0;
const OK_MSG_X = 104;
const OK_MSG_X_2 = 132;
const OK_MSG_Y = 24;
const OK_MSG_Y_2 = 16;
const DJINN_STATUS_X = 104;
const DJINN_STATUS_X_2 = 132;
const DJINN_STATUS_Y = 8;
const STAR_BEFORE_X = 49;
const STAR_BEFORE_Y = 9;
const STAR_AFTER_X = 49;
const STAR_AFTER_Y = 25;
const DJINN_NAME_BEFORE_X = 56;
const DJINN_NAME_BEFORE_Y = 8;
const DJINN_NAME_AFTER_X = 56;
const DJINN_NAME_AFTER_Y = 24;
const DJINN_X = 32;
const DJINN_Y = 31;
const DJINN_MULT_X = [32, 99];
const DJINN_MULT_Y = [21, 37];
const CHARS_X = [16, 117];
const CHARS_Y = [34, 34];
const ARROW_CHANGE_DJINN_X = 64;
const ARROW_CHANGE_DJINN_Y = 16;
const SPACEBAR_KEY_X = 132;
const SPACEBAR_KEY_Y = 24;

export class DjinnModeHeaderWindow {
    public game: Phaser.Game;
    public data: GoldenSun;
    public window_open: boolean;
    public x: number;
    public y: number;
    public base_window: Window;
    public group: Phaser.Group;
    public ok_msg_text: TextObj;
    public djinn_status_text: TextObj;
    public djinn_name_before_text: TextObj;
    public djinn_name_after_text: TextObj;
    public sprites: Phaser.Sprite[];
    public djinn_sprites: Phaser.Sprite[];
    public tweens: Phaser.Tween[];
    public djinn_status_arrow: Phaser.Sprite;
    public spacebar_key: {
        shadow: Phaser.Sprite,
        text: Phaser.Sprite
    };
    public action_info_text: TextObj;
    public djinn_status_arrow_blink_timer: Phaser.Timer;
    public chars: MainChar[];
    public action_text: string;
    public djinni: Djinn[];
    public next_djinni_status: string[];

    constructor(game, data) {
        this.game = game;
        this.data = data;
        this.window_open = false;
        this.x = BASE_WIN_X;
        this.y = BASE_WIN_Y;
        this.base_window = new Window(this.game, this.x, this.y, BASE_WIN_WIDTH, BASE_WIN_HEIGHT);
        this.group = game.add.group();
        this.ok_msg_text = this.base_window.set_text_in_position("Is this OK?", OK_MSG_X, OK_MSG_Y);
        this.djinn_status_text = this.base_window.set_text_in_position("", DJINN_STATUS_X, DJINN_STATUS_Y);
        this.djinn_name_before_text = this.base_window.set_text_in_position("", DJINN_NAME_BEFORE_X, DJINN_NAME_BEFORE_Y);
        this.djinn_name_after_text = this.base_window.set_text_in_position("", DJINN_NAME_AFTER_X, DJINN_NAME_AFTER_Y);
        this.sprites = [];
        this.djinn_sprites = [];
        this.tweens = [];
        this.djinn_status_arrow = this.base_window.create_at_group(ARROW_CHANGE_DJINN_X, ARROW_CHANGE_DJINN_Y, "arrow_change");
        this.spacebar_key = {
            shadow: this.base_window.create_at_group(SPACEBAR_KEY_X + 1, SPACEBAR_KEY_Y + 1, "spacebar_keyboard", 0x0),
            text: this.base_window.create_at_group(SPACEBAR_KEY_X, SPACEBAR_KEY_Y, "spacebar_keyboard")
        };
        this.action_info_text = this.base_window.set_text_in_position("", this.spacebar_key.text.width + SPACEBAR_KEY_X + 2, SPACEBAR_KEY_Y);
        this.init_arrow_blinks();
    }

    update_position() {
        this.group.x = this.game.camera.x + BASE_WIN_X;
        this.group.y = this.game.camera.y + BASE_WIN_Y;
    }

    init_arrow_blinks() {
        this.djinn_status_arrow_blink_timer = this.game.time.create(false);
        this.djinn_status_arrow_blink_timer.loop(90, () => {
            this.djinn_status_arrow.alpha = this.djinn_status_arrow.alpha ? 0 : 1;
        });
        this.djinn_status_arrow_blink_timer.start();
        this.djinn_status_arrow_blink_timer.pause();
    }

    set_action_info_text(text) {
        this.base_window.update_text(text, this.action_info_text);
    }

    mount_window() {
        this.update_position();
        if (this.chars.length === 1) {
            this.action_text = capitalize(this.next_djinni_status[0]);
            this.base_window.update_text(this.action_text, this.djinn_status_text, DJINN_STATUS_X);
            this.spacebar_key.text.alpha = this.spacebar_key.shadow.alpha = 0;
            this.base_window.update_text("", this.action_info_text);
            this.base_window.update_text_position({x: OK_MSG_X, y: OK_MSG_Y}, this.ok_msg_text);
            this.base_window.update_text(this.djinni[0].name, this.djinn_name_before_text);
            this.base_window.update_text_color(djinn_font_colors[this.djinni[0].status], this.djinn_name_before_text);
            this.base_window.update_text_position({x: DJINN_NAME_BEFORE_X, y: DJINN_NAME_BEFORE_Y}, this.djinn_name_before_text);
            this.base_window.update_text_position({x: DJINN_NAME_AFTER_X}, this.djinn_name_after_text);
            this.base_window.update_text(this.djinni[0].name, this.djinn_name_after_text);
            this.base_window.update_text_color(djinn_font_colors[this.next_djinni_status[0]], this.djinn_name_after_text);
            this.sprites.push(this.base_window.create_at_group(STAR_BEFORE_X, STAR_BEFORE_Y, this.djinni[0].element + "_star"));
            this.sprites.push(this.base_window.create_at_group(STAR_AFTER_X, STAR_AFTER_Y, this.djinni[0].element + "_star"));
            this.djinn_status_arrow.alpha = 1;
            this.djinn_status_arrow_blink_timer.resume();
        } else {
            this.base_window.update_text(this.action_text, this.djinn_status_text, DJINN_STATUS_X_2);
            this.spacebar_key.text.alpha = this.spacebar_key.shadow.alpha = 1;
            this.base_window.update_text(`: ${this.chars[0].name}'s Psy`, this.action_info_text);
            this.base_window.update_text_position({x: OK_MSG_X_2, y: OK_MSG_Y_2}, this.ok_msg_text);
            this.base_window.update_text(this.djinni[0].name, this.djinn_name_before_text);
            this.base_window.update_text_color(djinn_font_colors[this.djinni[0].status], this.djinn_name_before_text);
            if (this.action_text === "Trade") {
                this.sprites.push(this.base_window.create_at_group(STAR_BEFORE_X - 5, STAR_BEFORE_Y, this.djinni[0].element + "_star"));
                this.base_window.update_text(this.djinni[1].name, this.djinn_name_after_text);
                this.base_window.update_text_color(djinn_font_colors[this.djinni[1].status], this.djinn_name_after_text);
                this.sprites.push(this.base_window.create_at_group(STAR_AFTER_X - 5, STAR_AFTER_Y, this.djinni[1].element + "_star"));
                this.base_window.update_text_position({x: DJINN_NAME_AFTER_X - 5}, this.djinn_name_after_text);
                this.base_window.update_text_position({x: DJINN_NAME_BEFORE_X - 5, y: DJINN_NAME_BEFORE_Y}, this.djinn_name_before_text);
            } else if (this.action_text === "Give") {
                this.base_window.update_text("", this.djinn_name_after_text);
                this.base_window.update_text_position({x: DJINN_NAME_BEFORE_X - 5, y: DJINN_NAME_BEFORE_Y + numbers.FONT_SIZE}, this.djinn_name_before_text);
                this.sprites.push(this.base_window.create_at_group(STAR_BEFORE_X - 5, STAR_BEFORE_Y + numbers.FONT_SIZE, this.djinni[0].element + "_star"));
            }
            this.djinn_status_arrow.alpha = 0;
        }
        this.set_char_and_djinn_sprite();
    }

    set_char_and_djinn_sprite() {
        for (let i = 0; i < this.chars.length; ++i) {
            const this_char = this.chars[i];
            const this_djinn = this.djinni[i];
            let djinn_x, djinn_y;
            if (["Trade", "Give"].includes(this.action_text)) {
                djinn_x = DJINN_MULT_X[i];
                djinn_y = DJINN_MULT_Y[i];
            } else {
                djinn_x = DJINN_X;
                djinn_y = DJINN_Y;
            }
            const action_key = this_char.sprite_base.getActionKey(base_actions.IDLE);
            const char_sprite = this.base_window.create_at_group(CHARS_X[i], CHARS_Y[i], action_key);
            char_sprite.anchor.setTo(0.5, 1.0);
            const animation_key = this_char.sprite_base.getAnimationKey(base_actions.IDLE, reverse_directions[directions.down]);
            char_sprite.animations.add(animation_key, this_char.sprite_base.animations.idle.down, this_char.sprite_base.actions.idle.frame_rate, true);
            char_sprite.animations.play(animation_key, this_char.sprite_base.actions.idle.frame_rate, true);
            this.sprites.push(char_sprite);

            if (this.action_text === "Give" && i === 1) break;

            const djinn_sprite = this.group.create(djinn_x, djinn_y, this_djinn.element + "_djinn_" + this_djinn.status);
            djinn_sprite.anchor.setTo(0.5, 1.0);
            djinn_sprite.scale.x = -0.8;
            djinn_sprite.scale.y = 0.8;
            this.data.info.djinni_sprites[this_djinn.element].setAnimation(djinn_sprite, this_djinn.status);
            djinn_sprite.animations.play(this_djinn.status + "_down");
            this.djinn_sprites.push(djinn_sprite);

            if (["Trade", "Give"].includes(this.action_text)) {
                const sign = i === 0 ? 1 : -1;
                const a = sign * 17, b = sign * 33;
                const y_shift = -sign * 5;
                const tween = this.game.add.tween(djinn_sprite).to(
                    {
                        y: [djinn_y, djinn_y + y_shift, djinn_y + y_shift, djinn_y],
                        x: [djinn_x, djinn_x+a, djinn_x+a+b, djinn_x+a+b+a]
                    },
                    700,
                    Phaser.Easing.Linear.None,
                    true,
                    0,
                    -1,
                    false
                );
                tween.repeatDelay(300);
                this.tweens.push(tween);
            }
        }
    }

    unmount_window() {
        this.sprites.forEach(sprite => {
            this.base_window.remove_from_group(sprite, true);
        });
        this.djinn_sprites.forEach(sprite => {
            sprite.destroy();
        });
        this.tweens.forEach(tween => {
            tween.stop();
        });
        this.sprites = [];
        this.djinn_sprites = [];
        this.tweens = [];
        this.djinn_status_arrow.alpha = 0;
        if (!this.djinn_status_arrow_blink_timer.paused) {
            this.djinn_status_arrow_blink_timer.pause();
        }
    }

    open(chars, djinni, next_djinni_status, action_text?, callback?) {
        this.chars = chars;
        this.djinni = djinni;
        this.next_djinni_status = next_djinni_status;
        this.action_text = action_text;
        this.mount_window();
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