import {TextObj, Window} from "../../Window";
import {base_actions, directions, reverse_directions} from "../../utils";
import {Djinn, djinn_font_colors, djinn_status} from "../../Djinn";
import * as numbers from "../../magic_numbers";
import {GoldenSun} from "../../GoldenSun";
import {MainChar} from "../../MainChar";
import {djinn_actions} from "../../main_menus/MainDjinnMenu";
import * as _ from "lodash";

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

const R_BUTTON_X = 132;
const R_BUTTON_Y = 24;

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
    public r_button: {
        shadow: Phaser.Sprite;
        text: Phaser.Sprite;
    };
    public action_info_text: TextObj;
    public djinn_status_arrow_blink_timer: Phaser.Timer;
    public chars: MainChar[];
    public action: djinn_actions;
    public djinni: Djinn[];
    public next_djinni_status: djinn_status[];

    constructor(game: Phaser.Game, data: GoldenSun) {
        this.game = game;
        this.data = data;

        this.sprites = [];
        this.djinn_sprites = [];
        this.tweens = [];
        this.window_open = false;
        this.x = BASE_WIN_X;
        this.y = BASE_WIN_Y;

        this.base_window = new Window(this.game, this.x, this.y, BASE_WIN_WIDTH, BASE_WIN_HEIGHT);
        this.base_window.set_canvas_update();
        this.group = game.add.group();
        this.base_window.add_sprite_to_window_group(this.group);

        this.ok_msg_text = this.base_window.set_text_in_position("Is this OK?", OK_MSG_X, OK_MSG_Y);
        this.djinn_status_text = this.base_window.set_text_in_position("", DJINN_STATUS_X, DJINN_STATUS_Y);
        this.djinn_name_before_text = this.base_window.set_text_in_position(
            "",
            DJINN_NAME_BEFORE_X,
            DJINN_NAME_BEFORE_Y
        );
        this.djinn_name_after_text = this.base_window.set_text_in_position("", DJINN_NAME_AFTER_X, DJINN_NAME_AFTER_Y);

        this.djinn_status_arrow = this.base_window.create_at_group(ARROW_CHANGE_DJINN_X, ARROW_CHANGE_DJINN_Y, "menu", {
            frame: "arrow_change",
        });
        this.r_button = {
            shadow: this.base_window.create_at_group(R_BUTTON_X + 1, R_BUTTON_Y + 1, "keyboard_buttons", {
                color: 0x0,
                frame: "r_button",
            }),
            text: this.base_window.create_at_group(R_BUTTON_X, R_BUTTON_Y, "keyboard_buttons", {
                frame: "r_button",
            }),
        };
        this.action_info_text = this.base_window.set_text_in_position(
            "",
            this.r_button.text.width + R_BUTTON_X + 2,
            R_BUTTON_Y
        );
        this.init_arrow_blinks();
    }

    init_arrow_blinks() {
        this.djinn_status_arrow_blink_timer = this.game.time.create(false);
        this.djinn_status_arrow_blink_timer.loop(90, () => {
            this.djinn_status_arrow.visible = this.djinn_status_arrow.visible ? false : true;
        });
        this.djinn_status_arrow_blink_timer.start();
        this.djinn_status_arrow_blink_timer.pause();
    }

    set_action_info_text(text: string) {
        this.base_window.update_text(text, this.action_info_text);
    }

    mount_window() {
        if (this.chars.length === 1) {
            const status_text = _.capitalize(this.next_djinni_status[0]);

            this.base_window.update_text(status_text, this.djinn_status_text);
            this.base_window.update_text_position({x: DJINN_STATUS_X}, this.djinn_status_text);
            this.r_button.text.visible = this.r_button.shadow.visible = false;

            this.base_window.update_text("", this.action_info_text);
            this.base_window.update_text_position({x: OK_MSG_X, y: OK_MSG_Y}, this.ok_msg_text);
            this.base_window.update_text(this.djinni[0].name, this.djinn_name_before_text);

            this.base_window.update_text_color(djinn_font_colors[this.djinni[0].status], this.djinn_name_before_text);
            this.base_window.update_text_position(
                {x: DJINN_NAME_BEFORE_X, y: DJINN_NAME_BEFORE_Y},
                this.djinn_name_before_text
            );
            this.base_window.update_text_position({x: DJINN_NAME_AFTER_X}, this.djinn_name_after_text);

            this.base_window.update_text(this.djinni[0].name, this.djinn_name_after_text);
            this.base_window.update_text_color(
                djinn_font_colors[this.next_djinni_status[0]],
                this.djinn_name_after_text
            );

            this.sprites.push(
                this.base_window.create_at_group(STAR_BEFORE_X, STAR_BEFORE_Y, "stars", {
                    frame: this.djinni[0].element,
                })
            );
            this.sprites.push(
                this.base_window.create_at_group(STAR_AFTER_X, STAR_AFTER_Y, "stars", {frame: this.djinni[0].element})
            );

            this.djinn_status_arrow.visible = true;
            this.djinn_status_arrow_blink_timer.resume();
        } else {
            let action_text = "";
            if (this.action === djinn_actions.GIVE) action_text = "Give";
            else if (this.action === djinn_actions.TRADE) action_text = "Trade";
            this.base_window.update_text(action_text, this.djinn_status_text);
            this.base_window.update_text_position({x: DJINN_STATUS_X_2}, this.djinn_status_text);
            this.r_button.text.visible = this.r_button.shadow.visible = true;

            this.base_window.update_text(`: ${this.chars[0].name}'s Psy`, this.action_info_text);
            this.base_window.update_text_position({x: OK_MSG_X_2, y: OK_MSG_Y_2}, this.ok_msg_text);
            this.base_window.update_text(this.djinni[0].name, this.djinn_name_before_text);
            this.base_window.update_text_color(djinn_font_colors[this.djinni[0].status], this.djinn_name_before_text);

            if (this.action === djinn_actions.TRADE) {
                this.sprites.push(
                    this.base_window.create_at_group(STAR_BEFORE_X - 5, STAR_BEFORE_Y, "stars", {
                        frame: this.djinni[0].element,
                    })
                );
                this.base_window.update_text(this.djinni[1].name, this.djinn_name_after_text);
                this.base_window.update_text_color(
                    djinn_font_colors[this.djinni[1].status],
                    this.djinn_name_after_text
                );

                this.sprites.push(
                    this.base_window.create_at_group(STAR_AFTER_X - 5, STAR_AFTER_Y, "stars", {
                        frame: this.djinni[1].element,
                    })
                );
                this.base_window.update_text_position({x: DJINN_NAME_AFTER_X - 5}, this.djinn_name_after_text);
                this.base_window.update_text_position(
                    {x: DJINN_NAME_BEFORE_X - 5, y: DJINN_NAME_BEFORE_Y},
                    this.djinn_name_before_text
                );
            } else if (this.action === djinn_actions.GIVE) {
                this.base_window.update_text("", this.djinn_name_after_text);
                this.base_window.update_text_position(
                    {x: DJINN_NAME_BEFORE_X - 5, y: DJINN_NAME_BEFORE_Y + numbers.FONT_SIZE},
                    this.djinn_name_before_text
                );
                this.sprites.push(
                    this.base_window.create_at_group(STAR_BEFORE_X - 5, STAR_BEFORE_Y + numbers.FONT_SIZE, "stars", {
                        frame: this.djinni[0].element,
                    })
                );
            }
            this.djinn_status_arrow.visible = false;
        }
        this.set_char_and_djinn_sprite();
    }

    set_char_and_djinn_sprite() {
        for (let i = 0; i < this.chars.length; ++i) {
            const this_char = this.chars[i];
            const this_djinn = this.djinni[i];
            let djinn_x: number, djinn_y: number;

            if ([djinn_actions.TRADE, djinn_actions.GIVE].includes(this.action)) {
                djinn_x = DJINN_MULT_X[i];
                djinn_y = DJINN_MULT_Y[i];
            } else {
                djinn_x = DJINN_X;
                djinn_y = DJINN_Y;
            }
            const action_key = this_char.sprite_base.getSpriteKey(base_actions.IDLE);
            const char_sprite = this.base_window.create_at_group(CHARS_X[i], CHARS_Y[i], action_key);
            char_sprite.anchor.setTo(0.5, 1.0);

            const animation_key = this_char.sprite_base.getAnimationKey(
                base_actions.IDLE,
                reverse_directions[directions.down]
            );
            this_char.sprite_base.setAnimation(char_sprite, base_actions.IDLE);
            char_sprite.animations.play(animation_key);
            this.sprites.push(char_sprite);

            if (this.action === djinn_actions.GIVE && i === 1) break;

            const djinn_sprite_base = this.data.info.npcs_sprite_base_list[Djinn.sprite_base_key(this_djinn.element)];
            const djinn_sprite: Phaser.Sprite = this.group.create(
                djinn_x,
                djinn_y,
                djinn_sprite_base.getSpriteKey(this_djinn.status)
            );
            djinn_sprite.anchor.setTo(0.5, 1.0);
            djinn_sprite.scale.x = -0.8;
            djinn_sprite.scale.y = 0.8;

            djinn_sprite_base.setAnimation(djinn_sprite, this_djinn.status);
            const anim_key = djinn_sprite_base.getAnimationKey(this_djinn.status, reverse_directions[directions.down]);
            djinn_sprite.animations.play(anim_key);
            this.djinn_sprites.push(djinn_sprite);

            if ([djinn_actions.TRADE, djinn_actions.GIVE].includes(this.action)) {
                const sign = i === 0 ? 1 : -1;
                const a = sign * 17,
                    b = sign * 33;
                const y_shift = -sign * 5;
                const tween = this.game.add.tween(djinn_sprite).to(
                    {
                        y: [djinn_y, djinn_y + y_shift, djinn_y + y_shift, djinn_y],
                        x: [djinn_x, djinn_x + a, djinn_x + a + b, djinn_x + a + b + a],
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
            this.base_window.remove_from_this_window(sprite, true);
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
        this.djinn_status_arrow.visible = false;

        if (!this.djinn_status_arrow_blink_timer.paused) {
            this.djinn_status_arrow_blink_timer.pause();
        }
    }

    open(
        chars: MainChar[],
        djinni: Djinn[],
        next_djinni_status: djinn_status[],
        action?: djinn_actions,
        callback?: Function
    ) {
        this.chars = chars;
        this.djinni = djinni;
        this.next_djinni_status = next_djinni_status;
        this.action = action;
        this.mount_window();
        (this.group.parent as Phaser.Group).bringToTop(this.group);
        this.base_window.show(() => {
            this.window_open = true;
            if (callback !== undefined) {
                callback();
            }
        }, false);
    }

    close(callback?: Function) {
        this.unmount_window();
        this.base_window.close(() => {
            this.window_open = false;
            if (callback !== undefined) {
                callback();
            }
        }, false);
    }
}
