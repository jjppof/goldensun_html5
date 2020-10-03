import { directions } from "../utils.js";
import { FieldAbilities } from "./FieldAbilities.js";

const ABILITY_KEY_NAME = "growth";
const ACTION_KEY_NAME = "cast";
const GROWTH_MAX_RANGE = 12;
const MAX_PARTICLE_SPEED = 60;
const MIN_PARTICLE_SPEED = 55;
const X_PARTICLE_SPEED = 35;
const Y_PARTICLE_SPEED = 35;
const NO_TARGET_SPROUT_COUNT = 5;

export class GrowthFieldPsynergy extends FieldAbilities {
    constructor(game, data) {
        super(game, data, ABILITY_KEY_NAME, GROWTH_MAX_RANGE, ACTION_KEY_NAME, true);
        this.set_bootstrap_method(this.init_bubbles.bind(this));
    }

    set_emitter() {
        let max_x_speed = 0;
        let max_y_speed = 0;
        let min_x_speed = 0;
        let min_y_speed = 0;
        let x_dest = this.controllable_char.sprite.centerX;
        let y_dest = this.controllable_char.sprite.centerY + 5;
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
        this.field_psynergy_window.close();
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
        let grow_center_x = this.controllable_char.sprite.centerX; 
        let grow_center_y = this.controllable_char.sprite.centerY + 17; 
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
            let miss_target_sprite = this.data.overlayer_group.create(grow_center_x + _.random(-variation, variation), grow_center_y + _.random(-variation, variation), "growth_growth");
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
}