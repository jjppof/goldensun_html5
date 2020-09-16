import { main_char_list } from "../initializers/main_chars.js";
import { abilities_list } from "../initializers/abilities.js";
import { init_cast_aura, tint_map_layers } from  '../initializers/psynergy_cast.js';
import * as numbers from '../magic_numbers.js';
import { set_cast_direction, directions, reverse_directions } from "../utils.js";

const ACTION_KEY_NAME = "cast";
const GROWTH_MAX_RANGE = 12;
const MAX_PARTICLE_SPEED = 60;
const MIN_PARTICLE_SPEED = 55;
const X_PARTICLE_SPEED = 35;
const Y_PARTICLE_SPEED = 35;
const NO_TARGET_SPROUT_COUNT = 5;

export class GrowthFieldPsynergy {
    constructor(game, data) {
        this.game = game;
        this.data = data;
        this.ability_key_name = "growth";
        this.action_key_name = ACTION_KEY_NAME;
        this.target_found = false;
        this.target_object = null;
        this.stop_casting = null;
    }

    search_for_target() {
        this.target_found = false;
        let min_x, max_x, min_y, max_y;
        if (this.cast_direction === directions.up || this.cast_direction === directions.down) {
            min_x = this.data.hero.sprite.x - numbers.HERO_BODY_RADIUS;
            max_x = this.data.hero.sprite.x + numbers.HERO_BODY_RADIUS;
            if (this.cast_direction === directions.up) {
                min_y = this.data.hero.sprite.y - numbers.HERO_BODY_RADIUS - GROWTH_MAX_RANGE;
                max_y = this.data.hero.sprite.y - numbers.HERO_BODY_RADIUS;
            } else {
                min_y = this.data.hero.sprite.y + numbers.HERO_BODY_RADIUS;
                max_y = this.data.hero.sprite.y + numbers.HERO_BODY_RADIUS + GROWTH_MAX_RANGE;
            }
        } else {
            min_y = this.data.hero.sprite.y - numbers.HERO_BODY_RADIUS;
            max_y = this.data.hero.sprite.y + numbers.HERO_BODY_RADIUS;
            if (this.cast_direction === directions.left) {
                min_x = this.data.hero.sprite.x - numbers.HERO_BODY_RADIUS - GROWTH_MAX_RANGE;
                max_x = this.data.hero.sprite.x - numbers.HERO_BODY_RADIUS;
            } else {
                min_x = this.data.hero.sprite.x + numbers.HERO_BODY_RADIUS;
                max_x = this.data.hero.sprite.x + numbers.HERO_BODY_RADIUS + GROWTH_MAX_RANGE;
            }
        }
        let sqr_distance = Infinity;
        for (let i = 0; i < this.data.map.interactable_objects.length; ++i) {
            let interactable_object = this.data.map.interactable_objects[i];
            if (!(this.ability_key_name in this.data.interactable_objects_db[interactable_object.key_name].psynergy_keys)) continue;
            const item_x_px = interactable_object.current_x * this.data.map.sprite.tileWidth + (this.data.map.sprite.tileWidth >> 1);
            const item_y_px = interactable_object.current_y * this.data.map.sprite.tileHeight + (this.data.map.sprite.tileHeight >> 1);
            const x_condition = item_x_px >= min_x && item_x_px <= max_x;
            const y_condition = item_y_px >= min_y && item_y_px <= max_y;
            if (x_condition && y_condition && this.data.map.collision_layer === interactable_object.base_collider_layer) {
                let this_sqr_distance = Math.pow(item_x_px - this.data.hero.sprite.x, 2) + Math.pow(item_y_px - this.data.hero.sprite.y, 2);
                if (this_sqr_distance < sqr_distance) {
                    this.target_found = true;
                    this.target_object = interactable_object;
                }
            }
        }
    }

    set_hero_cast_anim() {
        this.data.hero.play(this.action_key_name, reverse_directions[this.cast_direction]);
    }

    unset_hero_cast_anim() {
        this.data.hero.sprite.animations.currentAnim.reverseOnce();
        this.data.hero.sprite.animations.currentAnim.onComplete.addOnce(() => {
            this.data.hero.play("idle", reverse_directions[this.cast_direction]);
        });
        this.data.hero.play(this.action_key_name, reverse_directions[this.cast_direction]);
    }

    set_emitter() {
        let max_x_speed = 0;
        let max_y_speed = 0;
        let min_x_speed = 0;
        let min_y_speed = 0;
        let x_dest = this.data.hero.sprite.centerX;
        let y_dest = this.data.hero.sprite.centerY + 5;
        let emitter_width = 0;
        let emitter_height = 0;
        this.increase_duration = 0;
        switch(this.cast_direction) {
            case directions.up:
                max_y_speed = -MAX_PARTICLE_SPEED;
                min_y_speed = -MIN_PARTICLE_SPEED;
                max_x_speed = min_x_speed = X_PARTICLE_SPEED;
                y_dest -= 7;
                emitter_width = GROWTH_MAX_RANGE >> 1;
                emitter_height = 1.5 * GROWTH_MAX_RANGE;
                this.increase_duration = 80;
                break;
            case directions.down:
                max_y_speed = MAX_PARTICLE_SPEED;
                min_y_speed = MIN_PARTICLE_SPEED;
                max_x_speed = min_x_speed = X_PARTICLE_SPEED;
                y_dest += 12;
                emitter_width = GROWTH_MAX_RANGE >> 1;
                emitter_height = 1.5 * GROWTH_MAX_RANGE;
                this.increase_duration = 80;
                break;
            case directions.left:
                max_x_speed = -MAX_PARTICLE_SPEED;
                min_x_speed = -MIN_PARTICLE_SPEED;
                max_y_speed = min_y_speed = Y_PARTICLE_SPEED;
                x_dest -= 16;
                emitter_width = 1.5 * GROWTH_MAX_RANGE;
                emitter_height = GROWTH_MAX_RANGE;
                break;
            case directions.right:
                max_x_speed = MAX_PARTICLE_SPEED;
                min_x_speed = MIN_PARTICLE_SPEED;
                max_y_speed = min_y_speed = Y_PARTICLE_SPEED;
                x_dest += 16;
                emitter_width = 1.5 * GROWTH_MAX_RANGE;
                emitter_height = GROWTH_MAX_RANGE;
                break;
        }
        this.emitter = this.game.add.emitter(x_dest, y_dest, 20);
        this.emitter.makeParticles("psynergy_ball");
        this.emitter.minParticleSpeed.setTo(min_x_speed, min_y_speed);
        this.emitter.maxParticleSpeed.setTo(max_x_speed, max_y_speed);
        this.emitter.gravity = 0;
        this.emitter.width = emitter_width;
        this.emitter.height = emitter_height;
        this.particle_filter = this.game.add.filter('ColorFilters');
        this.particle_filter.hue_adjust = 3;
        this.emitter.maxParticleScale = 0.5;
        this.emitter.minParticleScale = 0.4;
        this.emitter.forEach(particle => {
            particle.filters = [this.particle_filter];
            particle.animations.add('shine', ["ball/01", "ball/02", "ball/03"], 4, false, false);
        });
    }

    init_bubbles() {
        this.set_emitter();
        this.emitter.start(false, 100 + this.increase_duration, 8, 0);
        this.emitter.forEach(particle => {
            particle.animations.play('shine');
        });
        this.game.time.events.add(Phaser.Timer.SECOND, () => {
            if (this.target_found) {
                this.grow_sprout();
            } else {
                this.miss_target();
            }
        });
    }

    grow_sprout() {
        this.emitter.destroy();
        this.target_object.get_events().forEach(event => {
            event.activate();
        });
        this.target_object.interactable_object_sprite.animations.play("growth_growing", 8, false);
        this.target_object.interactable_object_sprite.animations.currentAnim.onComplete.addOnce(() => {
            this.unset_hero_cast_anim();
            this.stop_casting();
        });
    }

    miss_target() {
        this.emitter.destroy();
        let grow_center_x = this.data.hero.sprite.centerX; 
        let grow_center_y = this.data.hero.sprite.centerY + 17; 
        switch(this.cast_direction) {
            case directions.up:
                grow_center_y -= 16;
                break;
            case directions.down:
                grow_center_y += 16;
                break;
            case directions.left:
                grow_center_x -= 16;
                break;
            case directions.right:
                grow_center_x += 16;
                break;
        }
        const frames = Phaser.Animation.generateFrameNames('growth/no_target/', 0, 6, '', 2);
        let promises = new Array(NO_TARGET_SPROUT_COUNT);
        const variation = 13;
        for (let i = 0; i < NO_TARGET_SPROUT_COUNT; ++i) {
            let miss_target_sprite = this.data.npc_group.create(grow_center_x + _.random(-variation, variation), grow_center_y + _.random(-variation, variation), "growth_growth");
            miss_target_sprite.anchor.setTo(0.5, 1);
            miss_target_sprite.animations.add("no_target", frames, 10, false, false);
            let resolve_func;
            promises.push(new Promise(resolve => { resolve_func = resolve; }));
            this.game.time.events.add(i * 40, () => {
                miss_target_sprite.animations.play("no_target");
                miss_target_sprite.animations.currentAnim.onComplete.addOnce(() => {
                    miss_target_sprite.destroy();
                    resolve_func();
                });
            });
        }
        Promise.all(promises).then(() => {
            this.unset_hero_cast_anim();
            this.stop_casting();
        });
    }

    cast(caster_key_name) {
        if (this.data.hero.casting_psynergy) return;
        let caster = main_char_list[caster_key_name];
        let ability = abilities_list[this.ability_key_name];
        if (caster.current_pp < ability.pp_cost || !caster.abilities.includes(this.ability_key_name)) {
            return;
        }
        this.data.hero.casting_psynergy = true;
        this.game.physics.p2.pause();
        this.data.hero.sprite.body.velocity.y = this.data.hero.sprite.body.velocity.x = 0;
        caster.current_pp -= ability.pp_cost;
        this.cast_direction = set_cast_direction(this.data.hero.current_direction);
        this.data.hero.current_direction = this.cast_direction;
        this.search_for_target();
        if (this.target_object && this.target_object.custom_data.growth_casted) {
            this.target_found = false;
            this.target_object = null;
        } else if (this.target_found) {
            this.target_object.custom_data.growth_casted = true;
        }
        this.set_hero_cast_anim();
        let reset_map;
        this.stop_casting = init_cast_aura(this.game, this.data.hero.sprite, this.data.npc_group, this.data.hero.color_filter, () => {
            reset_map = tint_map_layers(this.game, this.data.map, this.data.map.color_filter);
            this.init_bubbles();
        }, () => {
            this.game.physics.p2.resume();
            this.data.hero.casting_psynergy = false;
            this.target_object = null;
        }, () => {
            reset_map();
        });
    }
}