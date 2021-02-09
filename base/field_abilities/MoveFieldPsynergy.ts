import * as numbers from "../magic_numbers";
import {target_only_push} from "../interactable_objects/push";
import {directions, reverse_directions, join_directions, base_actions} from "../utils";
import {FieldAbilities} from "./FieldAbilities";
import {SpriteBase} from "../SpriteBase";
import {Button} from "../XGamepad";

export class MoveFieldPsynergy extends FieldAbilities {
    private static readonly ABILITY_KEY_NAME = "move";
    private static readonly ACTION_KEY_NAME = "cast";
    private static readonly MAX_HAND_TRANSLATE = 16;
    private static readonly MOVE_MAX_RANGE = 26;
    private static readonly MOVE_HAND_KEY_NAME = "move_hand";

    private hand_sprite_base: SpriteBase;
    private hand_sprite: Phaser.Sprite;
    private emitter: Phaser.Particles.Arcade.Emitter;
    private final_emitter: Phaser.Particles.Arcade.Emitter;
    private target_hueshift_timer: Phaser.Timer;
    private final_emitter_particles_count: number;
    private psynergy_particle_base: SpriteBase;

    constructor(game, data) {
        super(
            game,
            data,
            MoveFieldPsynergy.ABILITY_KEY_NAME,
            MoveFieldPsynergy.ACTION_KEY_NAME,
            true,
            true,
            MoveFieldPsynergy.MOVE_MAX_RANGE
        );
        this.set_bootstrap_method(this.init_move.bind(this));
        this.set_cast_finisher_method(this.unset_hue_shifter.bind(this));
        this.hand_sprite_base = this.data.info.misc_sprite_base_list[MoveFieldPsynergy.MOVE_HAND_KEY_NAME];
        const sprite_key = this.hand_sprite_base.getSpriteKey(MoveFieldPsynergy.MOVE_HAND_KEY_NAME);
        this.hand_sprite = this.game.add.sprite(0, 0, sprite_key);
        this.hand_sprite.visible = false;
        this.hand_sprite_base.setAnimation(this.hand_sprite, MoveFieldPsynergy.MOVE_HAND_KEY_NAME);
        this.psynergy_particle_base = this.data.info.misc_sprite_base_list["psynergy_particle"];
        this.emitter = null;
        this.final_emitter = null;
    }

    update() {}

    set_controls() {
        const turn_then_fire_push = direction => {
            this.controllable_char.trying_to_push_direction = direction;
            this.fire_push();
        };

        const controls = [
            {button: Button.LEFT, on_down: () => turn_then_fire_push(directions.left)},
            {button: Button.RIGHT, on_down: () => turn_then_fire_push(directions.right)},
            {button: Button.UP, on_down: () => turn_then_fire_push(directions.up)},
            {button: Button.DOWN, on_down: () => turn_then_fire_push(directions.down)},
            {
                button: Button.B,
                on_down: () => {
                    this.finish_hand();
                    this.unset_hero_cast_anim();
                },
            },
        ];

        this.data.control_manager.add_controls(controls);
    }

    fire_push() {
        if (this.data.map.collision_layer === this.target_object.base_collision_layer) {
            let item_position = this.target_object.get_current_position(this.data.map);
            switch (this.controllable_char.trying_to_push_direction) {
                case directions.up:
                    item_position.y -= 1;
                    break;
                case directions.down:
                    item_position.y += 1;
                    break;
                case directions.left:
                    item_position.x -= 1;
                    break;
                case directions.right:
                    item_position.x += 1;
                    break;
            }
            let position_allowed = this.target_object.position_allowed(item_position.x, item_position.y);
            if (
                position_allowed &&
                !(
                    this.controllable_char.tile_x_pos === item_position.x &&
                    this.controllable_char.tile_y_pos === item_position.y
                )
            ) {
                this.data.control_manager.reset();
                target_only_push(
                    this.game,
                    this.data,
                    this.target_object,
                    (x_shift, y_shift) => {
                        const x_target = this.hand_sprite.x + x_shift;
                        const y_target = this.hand_sprite.y + y_shift;
                        this.game.add
                            .tween(this.hand_sprite)
                            .to({x: x_target, y: y_target}, numbers.PUSH_TIME, Phaser.Easing.Linear.None, true);
                        this.game.time.events.add(numbers.PUSH_TIME >> 1, () => {
                            let need_change = false;
                            if (
                                [directions.up, directions.down].includes(this.cast_direction) &&
                                [directions.left, directions.right].includes(
                                    this.controllable_char.trying_to_push_direction
                                )
                            ) {
                                this.cast_direction = join_directions(
                                    this.cast_direction,
                                    this.controllable_char.trying_to_push_direction
                                );
                                need_change = true;
                            } else if (
                                [directions.up, directions.down].includes(
                                    this.controllable_char.trying_to_push_direction
                                ) &&
                                [directions.left, directions.right].includes(this.cast_direction)
                            ) {
                                this.cast_direction = join_directions(
                                    this.controllable_char.trying_to_push_direction,
                                    this.cast_direction
                                );
                                need_change = true;
                            }
                            if (!need_change) return;
                            this.controllable_char.set_direction(this.cast_direction);
                            this.controllable_char.sprite.animations.stop();
                            const dest_direction = reverse_directions[this.cast_direction];
                            const anim_key = this.controllable_char.sprite_info.getAnimationKey(
                                base_actions.CAST,
                                dest_direction
                            );
                            this.controllable_char.sprite.animations.play(anim_key);
                            this.controllable_char.sprite.animations.currentAnim.stop();
                            const frame_name = this.controllable_char.sprite_info.getFrameName(
                                base_actions.CAST,
                                dest_direction,
                                1
                            );
                            this.controllable_char.sprite.animations.frameName = frame_name;
                        });
                    },
                    () => {
                        const pos_sqr_distance =
                            Math.pow(this.controllable_char.sprite.body.x - this.target_object.sprite.body.x, 2) +
                            Math.pow(this.controllable_char.sprite.body.y - this.target_object.sprite.body.y, 2);
                        const rad_sqr_distance = Math.pow(
                            numbers.HERO_BODY_RADIUS +
                                this.data.dbs.interactable_objects_db[this.target_object.key_name].body_radius,
                            2
                        );
                        if (pos_sqr_distance <= rad_sqr_distance) {
                            this.controllable_char.sprite.body.x =
                                (this.controllable_char.tile_x_pos + 0.5) * this.data.map.tile_width;
                            this.controllable_char.sprite.body.y =
                                (this.controllable_char.tile_y_pos + 0.5) * this.data.map.tile_height;
                            this.controllable_char.shadow.x = this.controllable_char.sprite.body.x;
                            this.controllable_char.shadow.y = this.controllable_char.sprite.body.y;
                        }
                        this.controllable_char.sprite.body.velocity.x = this.controllable_char.sprite.body.velocity.y = 0;
                        this.finish_hand();
                        this.unset_hero_cast_anim();
                    },
                    false,
                    () => {
                        this.data.map.sort_sprites();
                    }
                );
            }
        }
    }

    set_hand() {
        this.data.overlayer_group.add(this.hand_sprite);
        this.data.overlayer_group.bringToTop(this.hand_sprite);
        this.hand_sprite.visible = true;
        this.hand_sprite.scale.setTo(1, 1);
        this.hand_sprite.send_to_front = true;
        this.hand_sprite.base_collision_layer = this.data.map.collision_layer;
        this.hand_sprite.animations.currentAnim.stop(true);
        this.hand_sprite.frameName = this.hand_sprite_base.getFrameName(
            MoveFieldPsynergy.MOVE_HAND_KEY_NAME,
            reverse_directions[this.cast_direction],
            0
        );
        this.hand_sprite.anchor.x = 0.5;
        this.hand_sprite.centerX = this.controllable_char.sprite.centerX;
        this.hand_sprite.centerY = this.controllable_char.sprite.centerY;
    }

    translate_hand() {
        let translate_x = this.hand_sprite.centerX;
        let translate_y = this.hand_sprite.centerY;
        switch (this.cast_direction) {
            case directions.up:
                if (this.target_found) {
                    translate_x = this.target_object.sprite.centerX;
                    translate_y = this.target_object.sprite.y;
                } else {
                    translate_y -= MoveFieldPsynergy.MAX_HAND_TRANSLATE;
                }
                break;
            case directions.down:
                if (this.target_found) {
                    translate_x = this.target_object.sprite.centerX;
                    translate_y =
                        this.target_object.sprite.y -
                        this.target_object.sprite.height +
                        this.data.dbs.interactable_objects_db[this.target_object.key_name].body_radius;
                } else {
                    translate_y += MoveFieldPsynergy.MAX_HAND_TRANSLATE;
                }
                break;
            case directions.right:
                if (this.target_found) {
                    translate_x =
                        this.target_object.sprite.x -
                        2 * this.data.dbs.interactable_objects_db[this.target_object.key_name].body_radius;
                    translate_y = this.target_object.sprite.centerY;
                } else {
                    translate_x += MoveFieldPsynergy.MAX_HAND_TRANSLATE;
                }
                break;
            case directions.left:
                if (this.target_found) {
                    translate_x =
                        this.target_object.sprite.x +
                        2 * this.data.dbs.interactable_objects_db[this.target_object.key_name].body_radius;
                    translate_y = this.target_object.sprite.centerY;
                } else {
                    translate_x -= MoveFieldPsynergy.MAX_HAND_TRANSLATE;
                }
                break;
        }
        this.data.audio.play_se("psynergy/1");
        this.game.add
            .tween(this.hand_sprite)
            .to({centerX: translate_x, centerY: translate_y}, 200, Phaser.Easing.Linear.None, true)
            .onComplete.addOnce(() => {
                const anim_key = this.hand_sprite_base.getAnimationKey(
                    MoveFieldPsynergy.MOVE_HAND_KEY_NAME,
                    reverse_directions[this.cast_direction]
                );
                this.hand_sprite.animations.play(anim_key);
                if (this.target_found) {
                    this.target_object.sprite.filters = [this.target_object.color_filter];
                    this.target_hueshift_timer = this.game.time.create(false);
                    this.target_hueshift_timer.loop(5, () => {
                        this.target_object.color_filter.hue_adjust = Math.random() * 2 * Math.PI;
                    });
                    this.target_hueshift_timer.start();
                    this.set_controls();
                } else {
                    this.game.time.events.add(700, () => {
                        this.finish_hand();
                        this.unset_hero_cast_anim();
                    });
                }
            });
    }

    finish_hand() {
        this.data.control_manager.reset();
        this.data.audio.play_se("psynergy/4");
        let flip_timer = this.game.time.create(false);
        let fake_hand_scale = {x: 1};
        flip_timer.loop(40, () => {
            this.hand_sprite.scale.x = this.hand_sprite.scale.x > 0 ? -fake_hand_scale.x : fake_hand_scale.x;
        });
        flip_timer.start();
        const y_shift = this.hand_sprite.y - 10;
        const time_value = 500;
        this.game.add.tween(this.hand_sprite).to({y: y_shift}, time_value, Phaser.Easing.Linear.None, true);
        this.game.add.tween(fake_hand_scale).to({x: 0}, time_value, Phaser.Easing.Linear.None, true);
        this.game.add
            .tween(this.hand_sprite.scale)
            .to({y: 0}, time_value, Phaser.Easing.Linear.None, true)
            .onComplete.addOnce(() => {
                this.start_final_emitter(this.hand_sprite.x, this.hand_sprite.y);
                this.stop_casting();
                flip_timer.stop();
                this.data.overlayer_group.remove(this.hand_sprite, false);
                this.unset_emitter();
            });
    }

    set_emitter() {
        let x_shift = 0;
        let y_shift = 0;
        switch (this.cast_direction) {
            case directions.up:
                y_shift = -MoveFieldPsynergy.MAX_HAND_TRANSLATE;
                break;
            case directions.down:
                y_shift = MoveFieldPsynergy.MAX_HAND_TRANSLATE;
                break;
            case directions.left:
                x_shift = -MoveFieldPsynergy.MAX_HAND_TRANSLATE;
                break;
            case directions.right:
                x_shift = MoveFieldPsynergy.MAX_HAND_TRANSLATE;
                break;
        }
        this.emitter = this.game.add.emitter(
            this.controllable_char.sprite.centerX + x_shift,
            this.controllable_char.sprite.centerY + y_shift,
            150
        );
        const sprite_key = this.psynergy_particle_base.getSpriteKey("psynergy_particle");
        this.emitter.makeParticles(sprite_key);
        this.emitter.minParticleSpeed.setTo(-15, -15);
        this.emitter.maxParticleSpeed.setTo(15, 15);
        this.emitter.gravity = 0;
        this.emitter.width = 2 * MoveFieldPsynergy.MOVE_MAX_RANGE;
        this.emitter.height = 2 * MoveFieldPsynergy.MOVE_MAX_RANGE;
        this.emitter.forEach((particle: Phaser.Sprite) => {
            this.psynergy_particle_base.setAnimation(particle, "psynergy_particle");
        });
    }

    start_emitter() {
        this.emitter.start(false, Phaser.Timer.QUARTER, 15, 0);
        const anim_key = this.psynergy_particle_base.getAnimationKey("psynergy_particle", "vanish");
        this.emitter.forEach((particle: Phaser.Sprite) => {
            particle.animations.play(anim_key);
            particle.animations.currentAnim.setFrame((Math.random() * particle.animations.frameTotal) | 0);
        });
    }

    unset_emitter() {
        this.emitter.destroy();
    }

    set_final_emitter() {
        const sprite_key = this.psynergy_particle_base.getSpriteKey("psynergy_particle");
        this.final_emitter_particles_count = 8;
        this.final_emitter = this.game.add.emitter(0, 0, this.final_emitter_particles_count);
        this.final_emitter.makeParticles(sprite_key);
        this.final_emitter.gravity = 300;
        this.final_emitter.forEach((particle: Phaser.Sprite) => {
            this.psynergy_particle_base.setAnimation(particle, "psynergy_particle");
        });
    }

    start_final_emitter(x, y) {
        this.data.audio.play_se("psynergy/6");
        this.final_emitter.x = x;
        this.final_emitter.y = y;
        const lifetime = Phaser.Timer.QUARTER;
        this.final_emitter.start(true, lifetime, null, this.final_emitter_particles_count);
        const anim_key = this.psynergy_particle_base.getAnimationKey("psynergy_particle", "vanish");
        this.final_emitter.forEach((particle: Phaser.Sprite) => {
            particle.animations.play(anim_key);
            particle.animations.currentAnim.setFrame((Math.random() * particle.animations.frameTotal) | 0);
        });
        this.game.time.events.add(lifetime, () => {
            this.unset_final_emitter();
        });
    }

    unset_final_emitter() {
        this.final_emitter.destroy();
    }

    unset_hue_shifter() {
        if (this.target_found) {
            this.target_object.sprite.filters = undefined;
            this.target_hueshift_timer.stop();
        }
    }

    init_move() {
        this.set_emitter();
        this.set_final_emitter();
        this.search_for_target();
        this.set_hand();
        this.field_psynergy_window.close();
        this.translate_hand();
        this.start_emitter();
    }
}
