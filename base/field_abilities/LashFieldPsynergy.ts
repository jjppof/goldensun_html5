import {RopeDock} from "../interactable_objects/RopeDock";
import {SpriteBase} from "../SpriteBase";
import {directions, get_centered_pos_in_px, get_distance, get_front_position} from "../utils";
import {FieldAbilities} from "./FieldAbilities";

export class LashFieldPsynergy extends FieldAbilities {
    private static readonly ABILITY_KEY_NAME = "lash";
    private static readonly ACTION_KEY_NAME = "cast";
    private static readonly LASH_MAX_RANGE = 12;
    private static readonly LASH_HAND_KEY_NAME = "lash_hand";
    private static readonly HAND_SPEED = 0.25;

    private _psynergy_particle_base: SpriteBase;
    private _hand_sprite_base: SpriteBase;
    private _hand_sprite: Phaser.Sprite;
    private _hand_side: number;
    private _default_emitter: Phaser.Particles.Arcade.Emitter;
    private _placed_frag_index: number;

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

    private get _rope_dock() {
        return this.target_object as RopeDock;
    }

    init_hand() {
        this.field_psynergy_window.close();
        const sprite_key = this._hand_sprite_base.getSpriteKey(LashFieldPsynergy.LASH_HAND_KEY_NAME);
        this._hand_sprite = this.game.add.sprite(0, 0, sprite_key);
        this.data.overlayer_group.add(this._hand_sprite);
        this.data.overlayer_group.bringToTop(this._hand_sprite);
        this._hand_sprite.send_to_front = true;
        this._hand_sprite.base_collision_layer = this.data.map.collision_layer;
        this._hand_sprite_base.setAnimation(this._hand_sprite, LashFieldPsynergy.LASH_HAND_KEY_NAME);
        const close_hand_key = this._hand_sprite_base.getAnimationKey(LashFieldPsynergy.LASH_HAND_KEY_NAME, "close");
        this._hand_sprite.play(close_hand_key);
        this._hand_sprite.anchor.setTo(0.4, 0.85);
        this._hand_side = this.cast_direction === directions.left ? -1 : 1;
        this._hand_sprite.scale.setTo(0.2 * this._hand_side, 0.2);
        this._hand_sprite.x = this.controllable_char.x;
        this._hand_sprite.y = this.controllable_char.y - this.controllable_char.height + this._hand_sprite.height;
        this.goto_dock();
    }

    goto_dock() {
        let target_x: number, target_y: number;
        const front_pos = get_front_position(0, 0, this.cast_direction);
        if (this.target_found) {
            target_x = this.target_object.sprite.centerX;
            target_y = this.target_object.sprite.centerY - this.controllable_char.height;
        } else {
            target_x = this.controllable_char.x + LashFieldPsynergy.LASH_MAX_RANGE * front_pos.x;
            target_y =
                this.controllable_char.y +
                LashFieldPsynergy.LASH_MAX_RANGE * front_pos.y -
                this.controllable_char.height;
        }

        const to_up_duration = 150;
        this.game.add.tween(this._hand_sprite.scale).to(
            {
                x: 1 * this._hand_side,
                y: 1,
            },
            to_up_duration,
            Phaser.Easing.Linear.None,
            true
        );
        const to_up_tween = this.game.add.tween(this._hand_sprite).to(
            {
                x: target_x,
                y: target_y,
            },
            to_up_duration,
            Phaser.Easing.Linear.None,
            true
        );

        to_up_tween.onComplete.addOnce(() => {
            const open_hand_key = this._hand_sprite_base.getAnimationKey(LashFieldPsynergy.LASH_HAND_KEY_NAME, "open");
            this._hand_sprite.play(open_hand_key);

            let timer_event = this.game.time.events.add(180, () => {
                const down_hand_key = this._hand_sprite_base.getAnimationKey(
                    LashFieldPsynergy.LASH_HAND_KEY_NAME,
                    "down"
                );
                this._hand_sprite.play(down_hand_key);

                target_y = this.target_found
                    ? this.target_object.sprite.centerY
                    : target_y + this.controllable_char.height;
                const to_down_duration = 350;
                timer_event = this.game.time.events.add(to_down_duration >> 1, () => {
                    const tie_hand_key = this._hand_sprite_base.getAnimationKey(
                        LashFieldPsynergy.LASH_HAND_KEY_NAME,
                        "tie"
                    );
                    this._hand_sprite.play(tie_hand_key);
                });
                timer_event.timer.start();
                const to_down_tween = this.game.add.tween(this._hand_sprite).to(
                    {
                        y: target_y,
                    },
                    to_down_duration,
                    Phaser.Easing.Linear.None,
                    true
                );

                to_down_tween.onComplete.addOnce(() => {
                    if (this.target_found && this._rope_dock.is_starting_dock && !this._rope_dock.tied) {
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

    start_final_emitter(x: number, y: number) {
        const sprite_key = this._psynergy_particle_base.getSpriteKey("psynergy_particle");
        const final_emitter_particles_count = 16;
        const final_emitter = this.game.add.emitter(0, 0, final_emitter_particles_count);
        final_emitter.makeParticles(sprite_key);
        final_emitter.gravity = 0;
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

    start_default_emitter(x: number, y: number) {
        const sprite_key = this._psynergy_particle_base.getSpriteKey("psynergy_particle");
        const emitter_particles_count = 50;
        const emitter = this.game.add.emitter(0, 0, emitter_particles_count);
        emitter.makeParticles(sprite_key);
        emitter.gravity = 100;
        const base_speed = 80;
        emitter.minParticleSpeed.setTo(-base_speed, -base_speed);
        emitter.maxParticleSpeed.setTo(base_speed, base_speed);
        emitter.forEach((particle: Phaser.Sprite) => {
            this._psynergy_particle_base.setAnimation(particle, "psynergy_particle");
        });

        emitter.x = x;
        emitter.y = y;
        const lifetime = 600;
        const freq = 15;
        emitter.start(false, lifetime, freq, 0);
        const anim_key = this._psynergy_particle_base.getAnimationKey("psynergy_particle", "vanish");
        emitter.forEach((particle: Phaser.Sprite) => {
            particle.animations.play(anim_key, 15);
            particle.animations.currentAnim.setFrame((Math.random() * particle.animations.frameTotal) | 0);
        });
        return emitter;
    }

    async tie() {
        const dest_x_px = get_centered_pos_in_px(this._rope_dock.dest_x, this.data.map.tile_width);
        const dest_y_px = get_centered_pos_in_px(this._rope_dock.dest_y, this.data.map.tile_height);
        const constains_dest = this.game.camera.view.contains(dest_x_px, dest_y_px);

        this._default_emitter = this.start_default_emitter(0, 0);

        let shake_promise_resolve;
        const shake_promise = new Promise(resolve => (shake_promise_resolve = resolve));
        const base_pos = {x: this._hand_sprite.x, y: this._hand_sprite.y};
        const shift = 4;
        const total_repeats = 20;
        const duration_unit = 35;
        let counter = 0;
        this.game.time.events.repeat(duration_unit, total_repeats, () => {
            this._hand_sprite.x = (2 * Math.random() - 1) * shift + base_pos.x;
            this._hand_sprite.y = (2 * Math.random() - 1) * shift + base_pos.y;
            ++counter;
            if (counter === total_repeats) {
                shake_promise_resolve();
            }
        });

        let to_dock_promise_resolve;
        const to_dock_promise = new Promise(resolve => (to_dock_promise_resolve = resolve));
        if (!constains_dest) {
            this.game.camera.unfollow();
            this.game.add
                .tween(this.game.camera)
                .to(
                    {
                        x: (this.target_object.x - this.game.camera.width) >> 1,
                        y: (this.target_object.y - this.game.camera.height) >> 1,
                    },
                    total_repeats * duration_unit,
                    Phaser.Easing.Linear.None,
                    true
                )
                .onComplete.addOnce(to_dock_promise_resolve);
        } else {
            to_dock_promise_resolve();
        }

        await Promise.all([shake_promise, to_dock_promise]);

        this._hand_sprite.x = base_pos.x;
        this._hand_sprite.y = base_pos.y;

        this._placed_frag_index = 0;
        let to_dest_promise_resolve;
        const to_dest_promise = new Promise(resolve => (to_dest_promise_resolve = resolve));
        const distance = get_distance(dest_x_px, this._rope_dock.x, dest_y_px, this._rope_dock.y);
        const hand_translate_duration = distance / LashFieldPsynergy.HAND_SPEED;
        const hand_translate_tween = this.game.add.tween(this._hand_sprite).to(
            {
                x: dest_x_px,
                y: dest_y_px,
            },
            hand_translate_duration,
            Phaser.Easing.Linear.None,
            true
        );
        hand_translate_tween.onComplete.addOnce(to_dest_promise_resolve);
        hand_translate_tween.onUpdateCallback((ctx, timeline_value: number) => {
            this.update_rope_frags(timeline_value);
        });
        if (!constains_dest) {
            this.game.camera.follow(this._hand_sprite, Phaser.Camera.FOLLOW_LOCKON, 0.05, 0.05);
        }
        this._rope_dock.destroy_overlapping_fragments();
        this._rope_dock.intialize_swing(true);
        this._rope_dock.set_sprites_z_sorting(false);
        this.data.map.sort_sprites();
        await to_dest_promise;
        this._rope_dock.reset_fragments_pos();
        this._rope_dock.swing_tween.stop();
        this._rope_dock.swing_tween = null;

        const timer_event = this.game.time.events.add(100, async () => {
            const down_hand_key = this._hand_sprite_base.getAnimationKey(LashFieldPsynergy.LASH_HAND_KEY_NAME, "down");
            this._hand_sprite.play(down_hand_key);

            const final_promises: Promise<void>[] = [];
            if (!constains_dest) {
                final_promises.push(this.data.camera.follow(this.controllable_char, 700));
            }

            let to_out_promise_resolve;
            final_promises.push(new Promise(resolve => (to_out_promise_resolve = resolve)));
            const dest_y_out = this.game.camera.y - this._hand_sprite.height;
            this.game.add
                .tween(this._hand_sprite)
                .to(
                    {
                        y: dest_y_out,
                    },
                    150,
                    Phaser.Easing.Linear.None,
                    true
                )
                .onComplete.addOnce(to_out_promise_resolve);

            this._rope_dock.tie();

            await Promise.all(final_promises);

            this._default_emitter.destroy();
            this._default_emitter = null;
            this._hand_sprite.destroy();
            this._hand_sprite = null;

            this.unset_hero_cast_anim();
            this.stop_casting();
        });
        timer_event.timer.start();
    }

    update_rope_frags(completeness: number) {
        const target_index = (this._rope_dock.rope_fragments_group.children.length * completeness) | 0;
        for (let i = this._placed_frag_index; i < target_index; ++i) {
            const frag = this._rope_dock.rope_fragments_group.children[i];
            frag.rotation = this._rope_dock.fragment_angle;
            frag.x = this._rope_dock.rope_frag_base_pos[i].x;
            frag.y = this._rope_dock.rope_frag_base_pos[i].y;
            this._rope_dock.frag_able_to_swing[i] = true;
        }
        this._placed_frag_index = target_index;
    }

    update() {
        if (this.controllable_char?.casting_psynergy && this._default_emitter && this._hand_sprite) {
            this._default_emitter.x = this._hand_sprite.x;
            this._default_emitter.y = this._hand_sprite.y;
        }
    }
}
