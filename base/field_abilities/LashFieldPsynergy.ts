import { SpriteBase } from "../SpriteBase";
import { get_centered_pos_in_px, get_front_position } from "../utils";
import {FieldAbilities} from "./FieldAbilities";

export class LashFieldPsynergy extends FieldAbilities {
    private static readonly ABILITY_KEY_NAME = "lash";
    private static readonly ACTION_KEY_NAME = "cast";
    private static readonly LASH_MAX_RANGE = 12;
    private static readonly LASH_HAND_KEY_NAME = "lash_hand";

    private _psynergy_particle_base: SpriteBase;
    private _hand_sprite_base: SpriteBase;
    private _hand_sprite: Phaser.Sprite;

    constructor(game, data) {
        super(
            game,
            data,
            LashFieldPsynergy.ABILITY_KEY_NAME,
            LashFieldPsynergy.ACTION_KEY_NAME,
            true,
            true,
            LashFieldPsynergy.LASH_MAX_RANGE
        );
        this.set_bootstrap_method(this.init_hand.bind(this));
        this._hand_sprite_base = this.data.info.misc_sprite_base_list[LashFieldPsynergy.LASH_HAND_KEY_NAME];
        this._psynergy_particle_base = this.data.info.misc_sprite_base_list["psynergy_particle"];
    }

    init_hand() {
        this.field_psynergy_window.close();
        const sprite_key = this._hand_sprite_base.getSpriteKey(LashFieldPsynergy.LASH_HAND_KEY_NAME);
        this._hand_sprite = this.game.add.sprite(0, 0, sprite_key);
        this._hand_sprite_base.setAnimation(this._hand_sprite, LashFieldPsynergy.LASH_HAND_KEY_NAME);
        const close_hand_key = this._hand_sprite_base.getAnimationKey(LashFieldPsynergy.LASH_HAND_KEY_NAME, "close");
        this._hand_sprite.play(close_hand_key);
        this._hand_sprite.anchor.setTo(0.4, 0.85);
        this._hand_sprite.scale.setTo(0.2, 0.2);
        this._hand_sprite.x = this.controllable_char.x;
        this._hand_sprite.y = this.controllable_char.y - this.controllable_char.height + this._hand_sprite.height;
        this.goto_dock();
    }

    goto_dock() {
        let target_x: number, target_y: number;
        const front_pos = get_front_position(this.controllable_char.tile_x_pos, this.controllable_char.tile_y_pos, this.cast_direction);
        if (this.target_found) {
            target_x = this.target_object.sprite.centerX;
            target_y = this.target_object.sprite.centerY - this.controllable_char.height;
        } else {
            //fix these positions
            target_x = get_centered_pos_in_px(front_pos.x, this.data.map.tile_width);
            target_y = get_centered_pos_in_px(front_pos.y, this.data.map.tile_height) - this.controllable_char.height;
        }

        const to_up_duration = 150;
        this.game.add.tween(this._hand_sprite.scale).to({
            x: 1,
            y: 1
        }, to_up_duration, Phaser.Easing.Linear.None, true);
        const to_up_tween = this.game.add.tween(this._hand_sprite).to({
            x: target_x,
            y: target_y
        }, to_up_duration, Phaser.Easing.Linear.None, true);

        to_up_tween.onComplete.addOnce(() => {
            const open_hand_key = this._hand_sprite_base.getAnimationKey(LashFieldPsynergy.LASH_HAND_KEY_NAME, "open");
            this._hand_sprite.play(open_hand_key);

            let timer_event = this.game.time.events.add(180, () => {
                const down_hand_key = this._hand_sprite_base.getAnimationKey(LashFieldPsynergy.LASH_HAND_KEY_NAME, "down");
                this._hand_sprite.play(down_hand_key);

                target_y = this.target_found ? this.target_object.sprite.centerY : get_centered_pos_in_px(front_pos.y, this.data.map.tile_height);
                const to_down_duration = 350;
                timer_event = this.game.time.events.add(to_down_duration >> 1, () => {
                    const tie_hand_key = this._hand_sprite_base.getAnimationKey(LashFieldPsynergy.LASH_HAND_KEY_NAME, "tie");
                    this._hand_sprite.play(tie_hand_key);
                });
                timer_event.timer.start();
                const to_down_tween = this.game.add.tween(this._hand_sprite).to({
                    y: target_y
                }, to_down_duration, Phaser.Easing.Linear.None, true);

                to_down_tween.onComplete.addOnce(() => {
                    if (this.target_found) {
                        this.tie();
                    } else {
                        this._hand_sprite.destroy();
                        this.start_final_emitter(this._hand_sprite.x, this._hand_sprite.y);
                        this.unset_hero_cast_anim();
                        this.stop_casting();
                    }
                });
            });
            timer_event.timer.start();
        });
    }

    start_final_emitter(x, y) {
        const sprite_key = this._psynergy_particle_base.getSpriteKey("psynergy_particle");
        const final_emitter_particles_count = 16;
        const final_emitter = this.game.add.emitter(0, 0, final_emitter_particles_count);
        final_emitter.makeParticles(sprite_key);
        final_emitter.gravity = 0;;
        const base_speed = 70;
        final_emitter.minParticleSpeed.setTo(-base_speed, -base_speed);
        final_emitter.maxParticleSpeed.setTo(base_speed, base_speed);
        final_emitter.forEach((particle: Phaser.Sprite) => {
            this._psynergy_particle_base.setAnimation(particle, "psynergy_particle");
        });

        final_emitter.x = x;
        final_emitter.y = y;
        const lifetime = 350;
        final_emitter.start(true, lifetime, null, final_emitter_particles_count);
        const anim_key = this._psynergy_particle_base.getAnimationKey("psynergy_particle", "vanish");
        final_emitter.forEach((particle: Phaser.Sprite) => {
            particle.animations.play(anim_key);
            particle.animations.currentAnim.setFrame((Math.random() * particle.animations.frameTotal) | 0);
        });
        const vanish_timer = this.game.time.events.add(lifetime, () => {
            final_emitter.destroy();
        });
        vanish_timer.timer.start();
    }

    tie() {

    }

    update() {}
}
