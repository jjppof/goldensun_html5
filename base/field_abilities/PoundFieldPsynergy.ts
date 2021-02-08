import * as numbers from "../magic_numbers";
import {directions, reverse_directions, get_surroundings} from "../utils";
import {JumpEvent} from "../tile_events/JumpEvent";
import {FieldAbilities} from "./FieldAbilities";
import {SpriteBase} from "../SpriteBase";
import {Wave} from "./Wave";
import * as _ from "lodash";

export class PoundFieldPsynergy extends FieldAbilities {
    private static readonly ABILITY_KEY_NAME = "pound";
    private static readonly ACTION_KEY_NAME = "cast";
    private static readonly POUND_MAX_RANGE = 26;
    private static readonly STAR_MAX_COUNT = 12;
    private static readonly POUND_HAND_KEY_NAME = "pound_hand";
    private static readonly POUND_FIELD_COLOR = 1.0;
    private static readonly POUND_FIELD_INTENSITY = 1.0;

    public hand_sprite_base: SpriteBase;
    public hand_sprite: Phaser.Sprite;
    public emitter: Phaser.Particles.Arcade.Emitter;
    public final_emitter: Phaser.Particles.Arcade.Emitter;
    public hand_translate_x: number;
    public hand_translate_y: number;

    constructor(game, data) {
        super(
            game,
            data,
            PoundFieldPsynergy.ABILITY_KEY_NAME,
            PoundFieldPsynergy.ACTION_KEY_NAME,
            true,
            true,
            PoundFieldPsynergy.POUND_MAX_RANGE,
            PoundFieldPsynergy.POUND_FIELD_COLOR,
            PoundFieldPsynergy.POUND_FIELD_INTENSITY
        );
        this.set_bootstrap_method(this.init_hand.bind(this));
        this.hand_sprite_base = this.data.info.misc_sprite_base_list[PoundFieldPsynergy.POUND_HAND_KEY_NAME];
        const sprite_key = this.hand_sprite_base.getActionKey(PoundFieldPsynergy.POUND_HAND_KEY_NAME);
        this.hand_sprite = this.game.add.sprite(0, 0, sprite_key);
        this.hand_sprite.visible = false;
        this.hand_sprite_base.setAnimation(this.hand_sprite, PoundFieldPsynergy.POUND_HAND_KEY_NAME);
        this.hand_translate_x = 0;
        this.hand_translate_y = 0;
    }

    update() {}

    init_hand() {
        this.field_psynergy_window.close();
        this.data.overlayer_group.add(this.hand_sprite);
        this.data.overlayer_group.bringToTop(this.hand_sprite);
        this.hand_sprite.visible = true;
        this.hand_sprite.scale.setTo(1, 1);
        this.hand_sprite.send_to_front = true;
        this.hand_sprite.base_collision_layer = this.data.map.collision_layer;
        this.hand_sprite.animations.currentAnim.stop(true);
        this.hand_sprite.frameName = this.hand_sprite_base.getFrameName(
            PoundFieldPsynergy.POUND_HAND_KEY_NAME,
            reverse_directions[this.cast_direction],
            0
        );
        this.hand_sprite.anchor.x = 0.5;
        this.hand_sprite.centerX = this.controllable_char.sprite.centerX;
        this.hand_sprite.centerY = this.controllable_char.sprite.centerY;
        this.hand_translate_x = this.hand_sprite.centerX;
        this.hand_translate_y = this.hand_sprite.centerY;
        let initial_x_pos = 16;
        let initial_y_pos = -24;
        if (this.target_found) {
            if (this.cast_direction === directions.down) {
                initial_y_pos = -(this.target_object.sprite.y - this.data.hero.sprite.y + 5);
            } else if (this.cast_direction === directions.up) {
                initial_y_pos = this.target_object.sprite.y - this.data.hero.sprite.y - 5;
            } else if (this.cast_direction === directions.right) {
                initial_x_pos = this.target_object.sprite.x - this.data.hero.sprite.x;
            } else {
                initial_x_pos = -(this.target_object.sprite.x - this.data.hero.sprite.x);
            }
        } else {
            if (this.cast_direction === directions.down) {
                initial_y_pos = PoundFieldPsynergy.POUND_MAX_RANGE - 4;
            } else if (this.cast_direction === directions.up) {
                initial_y_pos = -PoundFieldPsynergy.POUND_MAX_RANGE - 10;
            } else {
                initial_x_pos = PoundFieldPsynergy.POUND_MAX_RANGE + 4;
            }
        }
        this.move_hand_by_dir(initial_x_pos, initial_y_pos);
        this.data.audio.play_se("psynergy/1");
        this.hand_tween(this.hand_translate_x, this.hand_translate_y, 150, this.change_hand_frame.bind(this));
    }

    change_hand_frame() {
        this.hand_sprite.frameName = this.hand_sprite_base.getFrameName(
            PoundFieldPsynergy.POUND_HAND_KEY_NAME,
            reverse_directions[this.cast_direction],
            1
        );
        let timer = this.game.time.create(true);
        timer.add(200, () => {
            this.hand_sprite.frameName = this.hand_sprite_base.getFrameName(
                PoundFieldPsynergy.POUND_HAND_KEY_NAME,
                reverse_directions[this.cast_direction],
                2
            );
            this.hand_hit_ground();
        });
        timer.start();
    }

    hand_hit_ground() {
        const timer = this.game.time.create(true);
        timer.add(200, () => {
            this.hand_translate_x = this.hand_sprite.centerX;
            this.hand_translate_y = this.hand_sprite.centerY;
            if (this.cast_direction === directions.down) {
                this.move_hand_by_dir(0, -26);
            } else {
                this.move_hand_by_dir(0, -13);
            }
            this.hand_tween(this.hand_translate_x, this.hand_translate_y, 400, () => {
                const timer2 = this.game.time.create(true);
                timer2.add(200, () => {
                    if (this.cast_direction === directions.up || this.cast_direction === directions.down) {
                        this.move_hand_by_dir(0, this.controllable_char.sprite.height + 15);
                    } else {
                        this.move_hand_by_dir(0, this.controllable_char.sprite.height + 7);
                    }
                    if (this.target_found) {
                        this.game.add
                            .tween(this.target_object.sprite.scale)
                            .to({y: 0.1}, 150, Phaser.Easing.Linear.None, true);
                    }
                    this.hand_tween(
                        this.hand_translate_x,
                        this.target_found ? this.target_object.sprite.y - 4 : this.hand_translate_y,
                        150,
                        this.finish_hand_movement.bind(this)
                    );
                });
                timer2.start();
            });
        });
        timer.start();
    }

    finish_hand_movement() {
        this.data.audio.play_se("psynergy/8");
        if (this.target_found) {
            this.target_object.sprite.scale.y = 1;
            const key_name = this.target_object.sprite_info.key_name;
            const anim_key = this.target_object.sprite_info.getAnimationKey(key_name, "down");
            this.target_object.sprite.animations.play(anim_key);
            this.target_object.get_events().forEach((event: JumpEvent) => {
                if (event.is_set) {
                    event.deactivate();
                    event.is_set = false;
                } else {
                    event.activate();
                    event.is_set = true;
                    JumpEvent.active_jump_surroundings(
                        this.data,
                        get_surroundings(event.x, event.y, false, 2),
                        event.collision_layer_shift_from_source + this.target_object.base_collision_layer
                    );
                }
            });
            this.target_object.sprite.send_to_back = true;
            this.target_object.sprite.body.destroy();
        }
        this.init_shake();
        this.init_stars();
        this.init_wave(this.hand_sprite.centerX, this.hand_sprite.centerY + 8);
        this.hand_translate_x = this.hand_sprite.centerX;
        this.hand_translate_y = this.controllable_char.sprite.centerY;
        this.move_hand_by_dir(0, -12);
        const timer = this.game.time.create(true);
        timer.add(850, () => {
            this.data.audio.play_se("psynergy/9");
            this.hand_tween(this.hand_translate_x, this.hand_translate_y, 300, () => {
                this.game.add.tween(this.hand_sprite).to({width: 0, height: 0}, 300, Phaser.Easing.Linear.None, true);
                this.hand_translate_x = this.controllable_char.sprite.centerX;
                this.hand_translate_y = this.controllable_char.sprite.centerY;
                this.hand_tween(this.hand_translate_x, this.hand_translate_y, 350, () => {
                    this.unset_hero_cast_anim();
                    this.stop_casting();
                    this.data.overlayer_group.remove(this.hand_sprite, false);
                });
            });
        });
        timer.start();
    }

    //Change hand movement depending on the cast direction
    move_hand_by_dir(final_x, final_y) {
        switch (this.cast_direction) {
            case directions.up:
                final_y -= 8;
                final_x = 0;
                break;
            case directions.down:
                final_y /= 2;
                final_y += 4;
                final_x = 0;
                break;
            case directions.left:
                final_x *= -1;
                break;
        }
        this.hand_translate_x += final_x;
        this.hand_translate_y += final_y;
    }

    hand_tween(var_x, var_y, time, complete_action) {
        this.game.add
            .tween(this.hand_sprite)
            .to({centerX: var_x, centerY: var_y}, time, Phaser.Easing.Linear.None, true)
            .onComplete.addOnce(complete_action);
    }

    init_stars() {
        for (let i = 0; i < PoundFieldPsynergy.STAR_MAX_COUNT; ++i) {
            const initial_x = this.hand_sprite.centerX + Math.cos((Math.PI + numbers.degree60) * i);
            const initial_y = this.hand_sprite.centerY + Math.sin((Math.PI + numbers.degree60) * i);
            const star_sprite = this.data.overlayer_group.create(initial_x, initial_y, "star");
            star_sprite.scale.x = 0.75;
            star_sprite.scale.y = 0.75;
            const this_angle = ((Math.PI + numbers.degree90) * i) / (12 - 1) + numbers.degree30;
            const rand_x = 1 + this.game.rnd.integerInRange(-20, 20) / 100;
            const rand_y = 1 + this.game.rnd.integerInRange(-20, 20) / 100;
            const final_x = initial_x + Math.cos(this_angle) * (63 * rand_x);
            const final_y = initial_y + Math.sin(this_angle) * (48 * rand_y);
            const tween = this.game.add
                .tween(star_sprite)
                .to({x: final_x, y: final_y}, 350, Phaser.Easing.Linear.None, true, i * (Phaser.Timer.QUARTER / 25));
            tween.onComplete.addOnce(() => {
                star_sprite.destroy();
            });
        }
    }

    init_wave(x_pos, y_pos) {
        const size = 64;
        const wave = new Wave(this.game, x_pos, y_pos, 0, 0);
        wave.phase = 0;
        wave.transparent_radius = 0;
        this.data.npc_group.add(wave.sprite);
        const wave_index = this.data.npc_group.getChildIndex(this.data.hero.sprite) - 1;
        this.data.npc_group.setChildIndex(wave.sprite, wave_index);
        wave.update();

        const wave_animation = this.game.add.tween(wave).to({size: size}, 400, Phaser.Easing.Linear.None);
        const wave_phase = this.game.add
            .tween(wave)
            .to({phase: -3.26, transparent_radius: 30}, 400, Phaser.Easing.Linear.None);

        wave_phase.onUpdateCallback(() => {
            wave.update();
        }, this);

        wave_animation.onComplete.addOnce(() => {
            wave_phase.start();
        });
        wave_phase.onComplete.addOnce(() => {
            wave.destroy();
        });

        wave_animation.start();
    }

    init_shake() {
        this.data.camera_shake_enable = true;
        const shake_timer = this.game.time.create(true);
        shake_timer.add(1000, () => {
            this.data.camera_shake_enable = false;
        });
        shake_timer.start();
    }
}
