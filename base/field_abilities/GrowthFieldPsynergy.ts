import {base_actions, directions} from "../utils";
import {FieldAbilities} from "./FieldAbilities";
import * as _ from "lodash";
import {SpriteBase} from "../SpriteBase";
import {InteractableObjects} from "../interactable_objects/InteractableObjects";

export class GrowthFieldPsynergy extends FieldAbilities {
    private static readonly ABILITY_KEY_NAME = "growth";
    private static readonly ACTION_KEY_NAME = base_actions.CAST;
    private static readonly GROWTH_MAX_RANGE = 12;
    private static readonly MAX_PARTICLE_SPEED = 60;
    private static readonly MIN_PARTICLE_SPEED = 55;
    private static readonly X_PARTICLE_SPEED = 35;
    private static readonly Y_PARTICLE_SPEED = 35;
    private static readonly NO_TARGET_SPROUT_COUNT = 5;

    private increase_duration: number;
    private emitter: Phaser.Particles.Arcade.Emitter;
    private particle_filter: Phaser.Filter.Hue;
    private sprite_base: SpriteBase;

    protected target_object: InteractableObjects;

    constructor(game, data) {
        super(
            game,
            data,
            GrowthFieldPsynergy.ABILITY_KEY_NAME,
            GrowthFieldPsynergy.ACTION_KEY_NAME,
            true,
            true,
            GrowthFieldPsynergy.GROWTH_MAX_RANGE
        );
        this.set_bootstrap_method(this.init_bubbles.bind(this));
        this.sprite_base = this.data.info.iter_objs_sprite_base_list[GrowthFieldPsynergy.ABILITY_KEY_NAME];
    }

    update() {}

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
        switch (this.cast_direction) {
            case directions.up:
                max_y_speed = -GrowthFieldPsynergy.MAX_PARTICLE_SPEED;
                min_y_speed = -GrowthFieldPsynergy.MIN_PARTICLE_SPEED;
                max_x_speed = min_x_speed = GrowthFieldPsynergy.X_PARTICLE_SPEED;
                y_dest -= 7;
                emitter_width = GrowthFieldPsynergy.GROWTH_MAX_RANGE >> 1;
                emitter_height = 1.5 * GrowthFieldPsynergy.GROWTH_MAX_RANGE;
                this.increase_duration = 80;
                break;
            case directions.down:
                max_y_speed = GrowthFieldPsynergy.MAX_PARTICLE_SPEED;
                min_y_speed = GrowthFieldPsynergy.MIN_PARTICLE_SPEED;
                max_x_speed = min_x_speed = GrowthFieldPsynergy.X_PARTICLE_SPEED;
                y_dest += 12;
                emitter_width = GrowthFieldPsynergy.GROWTH_MAX_RANGE >> 1;
                emitter_height = 1.5 * GrowthFieldPsynergy.GROWTH_MAX_RANGE;
                this.increase_duration = 80;
                break;
            case directions.left:
                max_x_speed = -GrowthFieldPsynergy.MAX_PARTICLE_SPEED;
                min_x_speed = -GrowthFieldPsynergy.MIN_PARTICLE_SPEED;
                max_y_speed = min_y_speed = GrowthFieldPsynergy.Y_PARTICLE_SPEED;
                x_dest -= 16;
                emitter_width = 1.5 * GrowthFieldPsynergy.GROWTH_MAX_RANGE;
                emitter_height = GrowthFieldPsynergy.GROWTH_MAX_RANGE;
                break;
            case directions.right:
                max_x_speed = GrowthFieldPsynergy.MAX_PARTICLE_SPEED;
                min_x_speed = GrowthFieldPsynergy.MIN_PARTICLE_SPEED;
                max_y_speed = min_y_speed = GrowthFieldPsynergy.Y_PARTICLE_SPEED;
                x_dest += 16;
                emitter_width = 1.5 * GrowthFieldPsynergy.GROWTH_MAX_RANGE;
                emitter_height = GrowthFieldPsynergy.GROWTH_MAX_RANGE;
                break;
        }
        this.emitter = this.game.add.emitter(x_dest, y_dest, 20);
        this.emitter.makeParticles("psynergy_ball");
        this.emitter.minParticleSpeed.setTo(min_x_speed, min_y_speed);
        this.emitter.maxParticleSpeed.setTo(max_x_speed, max_y_speed);
        this.emitter.gravity = 0;
        this.emitter.width = emitter_width;
        this.emitter.height = emitter_height;
        this.particle_filter = this.game.add.filter("Hue") as Phaser.Filter.Hue;
        this.particle_filter.angle = 3;
        this.emitter.maxParticleScale = 0.5;
        this.emitter.minParticleScale = 0.4;
        this.emitter.forEach(particle => {
            particle.filters = [this.particle_filter];
            particle.animations.add("shine", ["ball/01", "ball/02", "ball/03"], 4, false, false);
        });
    }

    init_bubbles() {
        this.field_psynergy_window.close();
        const reproduce = (reproduction_counter: number) => {
            if (reproduction_counter === 0) return;
            this.data.audio.play_se("psynergy/6", undefined, 0.1);
            this.game.time.events.add(34, reproduce.bind(this, --reproduction_counter));
        };
        reproduce(23);
        this.set_emitter();
        this.emitter.start(false, 100 + this.increase_duration, 8, 0);
        this.emitter.forEach(particle => {
            particle.animations.play("shine");
        });
        this.game.time.events.add(Phaser.Timer.SECOND, () => {
            if (this.target_object) {
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
        this.data.audio.play_se("battle/heal_1");
        const anim_key = this.sprite_base.getAnimationKey(this.target_object.current_action, "growing");
        this.target_object.sprite.animations.play(anim_key);
        this.target_object.sprite.animations.currentAnim.onComplete.addOnce(() => {
            this.target_object.sprite.send_to_back = true;
            this.return_to_idle_anim();
            this.stop_casting();
        });
    }

    miss_target() {
        this.emitter.destroy();
        let grow_center_x = this.controllable_char.sprite.centerX;
        let grow_center_y = this.controllable_char.sprite.centerY + 17;
        switch (this.cast_direction) {
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
        this.data.audio.play_se("battle/hit_1");
        const promises = new Array(GrowthFieldPsynergy.NO_TARGET_SPROUT_COUNT);
        const variation = 13;
        const action_key = this.sprite_base.getSpriteKey(GrowthFieldPsynergy.ABILITY_KEY_NAME);
        const anim_key = this.sprite_base.getAnimationKey(GrowthFieldPsynergy.ABILITY_KEY_NAME, "no_target");
        const first_frame_name = this.sprite_base.getFrameName(GrowthFieldPsynergy.ABILITY_KEY_NAME, "no_target", 0);
        for (let i = 0; i < GrowthFieldPsynergy.NO_TARGET_SPROUT_COUNT; ++i) {
            const center_x = grow_center_x + _.random(-variation, variation);
            const center_y = grow_center_y + _.random(-variation, variation);
            const miss_target_sprite: Phaser.Sprite = this.data.overlayer_group.create(center_x, center_y, action_key);
            miss_target_sprite.anchor.setTo(0.5, 1);
            this.sprite_base.setAnimation(miss_target_sprite, GrowthFieldPsynergy.ABILITY_KEY_NAME);
            miss_target_sprite.frameName = first_frame_name;
            let resolve_func;
            promises.push(
                new Promise(resolve => {
                    resolve_func = resolve;
                })
            );
            this.game.time.events.add(i * 40, () => {
                miss_target_sprite.animations.play(anim_key);
                miss_target_sprite.animations.currentAnim.onComplete.addOnce(() => {
                    miss_target_sprite.destroy();
                    resolve_func();
                });
            });
        }
        Promise.all(promises).then(() => {
            this.return_to_idle_anim();
            this.stop_casting();
        });
    }
}
