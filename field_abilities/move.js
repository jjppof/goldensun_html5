import { SpriteBase } from "../base/SpriteBase.js";
import { main_char_list } from "../initializers/main_chars.js";
import { abilities_list } from "../initializers/abilities.js";
import { init_cast_aura, tint_map_layers } from  '../initializers/psynergy_cast.js';
import { maps } from  '../initializers/maps.js';
import * as numbers from '../magic_numbers.js';
import { target_only_push } from '../interactable_objects/push.js';
import { set_cast_direction, directions, reverse_directions, join_directions } from "../utils.js";

const KEY_NAME = "move_psynergy";
const ACTION_KEY_NAME = "cast";
const MAX_HAND_TRANSLATE = 16;
const MOVE_MAX_RANGE = 26;

export class MoveFieldPsynergy extends SpriteBase {
    constructor(game, data) {
        super(KEY_NAME, [ACTION_KEY_NAME]);
        this.game = game;
        this.data = data;
        this.ability_key_name = "move";
        this.action_key_name = ACTION_KEY_NAME;
        this.setActionSpritesheet(
            this.action_key_name,
            "assets/images/interactable_objects/move_psynergy_hand.png",
            "assets/images/interactable_objects/move_psynergy_hand.json"
        );
        this.setActionDirections(
            this.action_key_name, 
            [reverse_directions[directions.up], reverse_directions[directions.down], reverse_directions[directions.left], reverse_directions[directions.right]],
            [2, 2, 2, 2]
        );
        this.setActionFrameRate(this.action_key_name, 10);
        this.addAnimations();
        this.loadSpritesheets(this.game);
        this.hand_sprite = null;
        this.target_found = false;
        this.target_object = null;
        this.stop_casting = null;
        this.emitter = null;
        this.final_emitter = null;
        this.set_controls();
        this.controls_active = false;
    }

    set_controls() {
        game.input.keyboard.addKey(Phaser.Keyboard.RIGHT).onDown.add(() => {
            if (!this.controls_active) return;
            this.data.trying_to_push_direction = directions.right;
            this.fire_push();
        });
        game.input.keyboard.addKey(Phaser.Keyboard.LEFT).onDown.add(() => {
            if (!this.controls_active) return;
            this.data.trying_to_push_direction = directions.left;
            this.fire_push();
        });
        game.input.keyboard.addKey(Phaser.Keyboard.UP).onDown.add(() => {
            if (!this.controls_active) return;
            this.data.trying_to_push_direction = directions.up;
            this.fire_push();
        });
        game.input.keyboard.addKey(Phaser.Keyboard.DOWN).onDown.add(() => {
            if (!this.controls_active) return;
            this.data.trying_to_push_direction = directions.down;
            this.fire_push();
        });
        this.data.esc_input.add(() => {
            if (!this.controls_active) return;
            this.controls_active = false;
            this.finish_hand();
            this.unset_hero_cast_anim();
        });
    }

    fire_push() {
        if (this.data.map_collider_layer === this.target_object.base_collider_layer) {
            let item_position = this.target_object.get_current_position();
            switch (this.data.trying_to_push_direction) {
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
            let position_allowed = this.target_object.position_allowed(this.data, item_position.x, item_position.y);
            if (position_allowed && !(this.data.hero_tile_pos_x === item_position.x && this.data.hero_tile_pos_y === item_position.y)) {
                this.controls_active = false;
                target_only_push(this.game, this.data, this.target_object, (x_shift, y_shift) => {
                    const x_target = this.hand_sprite.x + x_shift;
                    const y_target = this.hand_sprite.y + y_shift;
                    game.add.tween(this.hand_sprite).to(
                        {x: x_target, y: y_target},
                        numbers.PUSH_TIME,
                        Phaser.Easing.Linear.None,
                        true
                    );
                    this.game.time.events.add(numbers.PUSH_TIME >> 1, () => {
                        let need_change = false;
                        if ([directions.up, directions.down].includes(this.cast_direction) && [directions.left, directions.right].includes(this.data.trying_to_push_direction)) {
                            this.cast_direction = join_directions(this.cast_direction, this.data.trying_to_push_direction);
                            need_change = true;
                        } else if ([directions.up, directions.down].includes(this.data.trying_to_push_direction) && [directions.left, directions.right].includes(this.cast_direction)) {
                            this.cast_direction = join_directions(this.data.trying_to_push_direction, this.cast_direction);
                            need_change = true;
                        }
                        if (!need_change) return;
                        this.data.current_direction = this.cast_direction;
                        this.data.hero.animations.stop();
                        const dest_direction = reverse_directions[this.cast_direction];
                        this.data.hero.animations.play("cast_" + dest_direction, 0);
                        this.data.hero.animations.frame = `cast/${dest_direction}/01`;
                    });
                }, () => {
                    const pos_sqr_distance = Math.pow(this.data.hero.body.x - this.target_object.interactable_object_sprite.body.x, 2) + Math.pow(this.data.hero.body.y - this.target_object.interactable_object_sprite.body.y, 2);
                    const rad_sqr_distance = Math.pow(numbers.HERO_BODY_RADIUS + this.data.interactable_objects_db[this.target_object.key_name].body_radius, 2);
                    if (pos_sqr_distance <= rad_sqr_distance) {
                        this.data.hero.body.x = (this.data.hero_tile_pos_x + 0.5) * maps[this.data.map_name].sprite.tileWidth;
                        this.data.hero.body.y = (this.data.hero_tile_pos_y + 0.5) * maps[this.data.map_name].sprite.tileHeight;
                        this.data.shadow.x = this.data.hero.body.x;
                        this.data.shadow.y = this.data.hero.body.y;
                    }
                    this.data.hero.body.velocity.x = this.data.hero.body.velocity.y = 0;
                    this.finish_hand();
                    this.unset_hero_cast_anim();
                }, false, () => {
                    maps[data.map_name].sort_sprites(this.data);
                });
            }
        }
    }

    set_hero_cast_anim() {
        this.data.hero.loadTexture(this.data.hero_name + "_" + this.action_key_name);
        main_char_list[this.data.hero_name].sprite_base.setAnimation(this.data.hero, this.action_key_name);
        this.data.hero.animations.play(this.action_key_name + "_" + reverse_directions[this.cast_direction], main_char_list[this.data.hero_name].sprite_base.actions[this.action_key_name].frame_rate, false);
    }

    unset_hero_cast_anim() {
        data.hero.animations.currentAnim.reverseOnce();
        data.hero.animations.currentAnim.onComplete.addOnce(() => {
            this.data.hero.loadTexture(this.data.hero_name + "_idle");
            main_char_list[this.data.hero_name].sprite_base.setAnimation(this.data.hero, "idle");
            this.data.hero.animations.frameName = `idle/${reverse_directions[this.cast_direction]}/00`;
        });
        this.data.hero.animations.play(this.action_key_name + "_" + reverse_directions[this.cast_direction], main_char_list[this.data.hero_name].sprite_base.actions[this.action_key_name].frame_rate, false);
    }

    set_hand() {
        this.hand_sprite = this.data.npc_group.create(0, 0, this.key_name + "_" + this.action_key_name);
        this.hand_sprite.send_to_front = true;
        this.hand_sprite.base_collider_layer = this.data.map_collider_layer;
        this.hand_sprite.loadTexture(this.key_name + "_" + this.action_key_name);
        this.setAnimation(this.hand_sprite, this.action_key_name);
        this.hand_sprite.animations.frameName = `${this.action_key_name}/${reverse_directions[this.cast_direction]}/00`;
        this.hand_sprite.anchor.x = 0.5;
        this.hand_sprite.centerX = this.data.hero.centerX;
        this.hand_sprite.centerY = this.data.hero.centerY;
        this.data.npc_group.bringToTop(this.hand_sprite);
    }

    translate_hand() {
        let translate_x = this.hand_sprite.centerX;
        let translate_y = this.hand_sprite.centerY;
        switch (this.cast_direction) {
            case directions.up:
                if (this.target_found) {
                    translate_x = this.target_object.interactable_object_sprite.centerX;
                    translate_y = this.target_object.interactable_object_sprite.y;
                } else {
                    translate_y -= MAX_HAND_TRANSLATE;
                }
                break;
            case directions.down:
                if (this.target_found) {
                    translate_x = this.target_object.interactable_object_sprite.centerX;
                    translate_y = this.target_object.interactable_object_sprite.y - this.target_object.interactable_object_sprite.height + this.data.interactable_objects_db[this.target_object.key_name].body_radius;
                } else {
                    translate_y += MAX_HAND_TRANSLATE;
                }
                break;
            case directions.right:
                if (this.target_found) {
                    translate_x = this.target_object.interactable_object_sprite.x - 2 * this.data.interactable_objects_db[this.target_object.key_name].body_radius;
                    translate_y = this.target_object.interactable_object_sprite.centerY;
                } else {
                    translate_x += MAX_HAND_TRANSLATE;
                }
                break;
            case directions.left:
                if (this.target_found) {
                    translate_x = this.target_object.interactable_object_sprite.x + 2 * this.data.interactable_objects_db[this.target_object.key_name].body_radius;
                    translate_y = this.target_object.interactable_object_sprite.centerY;
                } else {
                    translate_x -= MAX_HAND_TRANSLATE;
                }
                break;
        }
        this.game.add.tween(this.hand_sprite).to(
            {centerX: translate_x, centerY: translate_y},
            200,
            Phaser.Easing.Linear.None,
            true
        ).onComplete.addOnce(() => {
            this.hand_sprite.animations.play(this.action_key_name + "_" + reverse_directions[this.cast_direction]);
            if (this.target_found) {
                this.target_object.interactable_object_sprite.filters = [this.data.pasynergy_item_color_filters];
                this.target_hueshift_timer = this.game.time.create(false);
                this.target_hueshift_timer.loop(5, () => {
                    this.data.pasynergy_item_color_filters.hue_adjust = Math.random() * 2 * Math.PI;
                });
                this.target_hueshift_timer.start();
                this.controls_active = true;
            } else {
                this.game.time.events.add(700, () => {
                    this.finish_hand();
                    this.unset_hero_cast_anim();
                });
            }
        });
    }

    finish_hand() {
        let flip_timer = this.game.time.create(false);
        let fake_hand_scale = {x : 1};
        flip_timer.loop(40, () => {
            this.hand_sprite.scale.x = this.hand_sprite.scale.x > 0 ? -fake_hand_scale.x : fake_hand_scale.x;
        });
        flip_timer.start();
        let y_shift = this.hand_sprite.y - 10;
        this.game.add.tween(this.hand_sprite).to(
            { y: y_shift },
            350,
            Phaser.Easing.Linear.None,
            true
        );
        this.game.add.tween(fake_hand_scale).to(
            { x: 0 },
            350,
            Phaser.Easing.Linear.None,
            true
        );
        this.game.add.tween(this.hand_sprite.scale).to(
            { y: 0 },
            350,
            Phaser.Easing.Linear.None,
            true
        ).onComplete.addOnce(() => {
            this.start_final_emitter(this.hand_sprite.x, this.hand_sprite.y);
            this.stop_casting();
            flip_timer.stop();
            this.data.npc_group.remove(this.hand_sprite, true);
            this.unset_emitter();
        });
        
    }

    search_for_target() {
        this.target_found = false;
        let min_x, max_x, min_y, max_y;
        if (this.cast_direction === directions.up || this.cast_direction === directions.down) {
            min_x = this.data.hero.x - numbers.HERO_BODY_RADIUS;
            max_x = this.data.hero.x + numbers.HERO_BODY_RADIUS;
            if (this.cast_direction === directions.up) {
                min_y = this.data.hero.y - numbers.HERO_BODY_RADIUS - MOVE_MAX_RANGE;
                max_y = this.data.hero.y - numbers.HERO_BODY_RADIUS;
            } else {
                min_y = this.data.hero.y + numbers.HERO_BODY_RADIUS;
                max_y = this.data.hero.y + numbers.HERO_BODY_RADIUS + MOVE_MAX_RANGE;
            }
        } else {
            min_y = this.data.hero.y - numbers.HERO_BODY_RADIUS;
            max_y = this.data.hero.y + numbers.HERO_BODY_RADIUS;
            if (this.cast_direction === directions.left) {
                min_x = this.data.hero.x - numbers.HERO_BODY_RADIUS - MOVE_MAX_RANGE;
                max_x = this.data.hero.x - numbers.HERO_BODY_RADIUS;
            } else {
                min_x = this.data.hero.x + numbers.HERO_BODY_RADIUS;
                max_x = this.data.hero.x + numbers.HERO_BODY_RADIUS + MOVE_MAX_RANGE;
            }
        }
        let sqr_distance = Infinity;
        for (let i = 0; i < maps[this.data.map_name].interactable_objects.length; ++i) {
            let interactable_object = maps[this.data.map_name].interactable_objects[i];
            if (!this.data.interactable_objects_db[interactable_object.key_name].psynergy_keys.includes(this.ability_key_name)) continue;
            const item_x_px = interactable_object.current_x * maps[this.data.map_name].sprite.tileWidth + (maps[this.data.map_name].sprite.tileWidth >> 1);
            const item_y_px = interactable_object.current_y * maps[this.data.map_name].sprite.tileHeight + (maps[this.data.map_name].sprite.tileHeight >> 1);
            const x_condition = item_x_px >= min_x && item_x_px <= max_x;
            const y_condition = item_y_px >= min_y && item_y_px <= max_y;
            if (x_condition && y_condition && this.data.map_collider_layer === interactable_object.base_collider_layer) {
                let this_sqr_distance = Math.pow(item_x_px - this.data.hero.x, 2) + Math.pow(item_y_px - this.data.hero.y, 2);
                if (this_sqr_distance < sqr_distance) {
                    sqr_distance = this_sqr_distance;
                    this.target_found = true;
                    this.target_object = interactable_object;
                }
            }
        }
    }

    set_emitter() {
        let x_shift = 0;
        let y_shift = 0;
        switch(this.cast_direction) {
            case directions.up:
                y_shift = -MAX_HAND_TRANSLATE;
                break;
            case directions.down:
                y_shift = MAX_HAND_TRANSLATE;
                break;
            case directions.left:
                x_shift = -MAX_HAND_TRANSLATE;
                break;
            case directions.right:
                x_shift = MAX_HAND_TRANSLATE;
                break;
        }
        this.emitter = this.game.add.emitter(this.data.hero.centerX + x_shift, this.data.hero.centerY + y_shift, 150);
        this.emitter.makeParticles("psynergy_particle");
        this.emitter.minParticleSpeed.setTo(-15, -15);
        this.emitter.maxParticleSpeed.setTo(15, 15);
        this.emitter.gravity = 0;
        this.emitter.width = 2 * MOVE_MAX_RANGE;
        this.emitter.height = 2 * MOVE_MAX_RANGE;
        this.emitter.forEach(particle => {
            particle.animations.add('vanish', null, 4, true, false);
        });
    }

    start_emitter() {
        this.emitter.start(false, Phaser.Timer.QUARTER, 15, 0);
        this.emitter.forEach(particle => {
            particle.animations.play('vanish');
            particle.animations.currentAnim.setFrame(parseInt(Math.random()*particle.animations.frameTotal));
        });
    }

    unset_emitter() {
        this.emitter.destroy();
    }

    set_final_emitter() {
        this.final_emitter_particles_count = 8;
        this.final_emitter = this.game.add.emitter(0, 0, this.final_emitter_particles_count);
        this.final_emitter.makeParticles("psynergy_particle");
        this.final_emitter.gravity = 300;
        this.final_emitter.forEach(particle => {
            particle.animations.add('vanish', null, 4, true, false);
        });
    }

    start_final_emitter(x, y) {
        this.final_emitter.x = x;
        this.final_emitter.y = y;
        let lifetime = Phaser.Timer.QUARTER;
        this.final_emitter.start(true, lifetime, null, this.final_emitter_particles_count);
        this.final_emitter.forEach(particle => {
            particle.animations.play('vanish');
            particle.animations.currentAnim.setFrame(parseInt(Math.random()*particle.animations.frameTotal));
        });
        this.game.time.events.add(lifetime, () => {
            this.unset_final_emitter();
        });
    }

    unset_final_emitter() {
        this.final_emitter.destroy();
    }

    cast(caster_key_name) {
        if (this.data.casting_psynergy) return;
        let caster = main_char_list[caster_key_name];
        let ability = abilities_list[this.ability_key_name];
        if (caster.current_pp < ability.pp_cost || !caster.abilities.includes(this.ability_key_name)) {
            return;
        }
        this.data.casting_psynergy = true;
        this.game.physics.p2.pause();
        this.data.hero.body.velocity.y = data.hero.body.velocity.x = 0;
        caster.current_pp -= ability.pp_cost;
        this.cast_direction = set_cast_direction(this.data.current_direction);
        this.data.current_direction = this.cast_direction;
        this.set_emitter();
        this.set_final_emitter();
        this.search_for_target();
        this.set_hero_cast_anim();
        let reset_map;
        this.stop_casting = init_cast_aura(this.game, this.data.hero, this.data.npc_group, this.data.hero_color_filters, () => {
            reset_map = tint_map_layers(maps[this.data.map_name], this.data.map_color_filters);
            this.set_hand();
            this.translate_hand();
            this.start_emitter();
        }, () => {
            this.game.physics.p2.resume();
            this.data.casting_psynergy = false;
            this.target_object = null;
        }, () => {
            if (this.target_found) {
                this.target_object.interactable_object_sprite.filters = undefined;
                this.target_hueshift_timer.stop();
            }
            reset_map();
        });
    }
}