import {FieldAbilities} from "./FieldAbilities";
import {
    base_actions,
    directions,
    get_centered_pos_in_px,
    get_front_position,
    promised_wait,
    reverse_directions,
} from "../utils";
import {InteractableObjects} from "../interactable_objects/InteractableObjects";
import {SpriteBase} from "../SpriteBase";
import {degree360} from "../magic_numbers";

export class LiftFieldPsynergy extends FieldAbilities {
    public static readonly ABILITY_KEY_NAME = "lift";
    private static readonly ACTION_KEY_NAME = base_actions.CAST;
    private static readonly LIFT_MAX_RANGE = 12;
    private static readonly MOVE_HAND_KEY_NAME = "move_hand";
    private static readonly PSY_PARTICLE_KEY_NAME = "psynergy_particle";

    private destination_y_pos: number;
    private destination_collision_layer: number;
    private hand_sprite_base: SpriteBase;
    private psynergy_particle_base: SpriteBase;
    private left_hand_sprite: Phaser.Sprite;
    private right_hand_sprite: Phaser.Sprite;

    protected target_object: InteractableObjects;

    constructor(game, data) {
        super(
            game,
            data,
            LiftFieldPsynergy.ABILITY_KEY_NAME,
            LiftFieldPsynergy.ACTION_KEY_NAME,
            true,
            true,
            LiftFieldPsynergy.LIFT_MAX_RANGE
        );
        this.set_bootstrap_method(this.init.bind(this));

        this.hand_sprite_base = this.data.info.misc_sprite_base_list[LiftFieldPsynergy.MOVE_HAND_KEY_NAME];
        this.psynergy_particle_base = this.data.info.misc_sprite_base_list[LiftFieldPsynergy.PSY_PARTICLE_KEY_NAME];
    }

    async init() {
        this.close_field_psynergy_window();

        if (this.target_object) {
            if (this.target_object.psynergies_info?.lift?.destination_y_pos) {
                this.destination_y_pos = this.target_object.psynergies_info.lift.destination_y_pos;
            } else {
                this.destination_y_pos = this.target_object.tile_y_pos - 2;
            }

            if (this.target_object.psynergies_info?.lift?.destination_collision_layer) {
                this.destination_collision_layer = this.target_object.psynergies_info.lift.destination_collision_layer;
            } else {
                this.destination_collision_layer = this.target_object.base_collision_layer + 1;
            }

            this.init_hand_sprites();
            this.data.audio.play_se("psynergy/1");
            await this.scale_hand_sprite_init(this.left_hand_sprite);
            this.data.audio.play_se("psynergy/1");
            await this.scale_hand_sprite_init(this.right_hand_sprite);
            await this.hold_target_obj();
            this.data.audio.play_se("psynergy/5");

            if (this.target_object.has_shadow) {
                this.target_object.shadow.sort_function = null;
                this.target_object.shadow.send_to_back = true;
            }

            await this.lift_target_obj();
            this.data.audio.play_se("psynergy/4");
            await this.scale_hand_sprite_end(this.left_hand_sprite);
            this.data.audio.play_se("psynergy/10");
            this.data.audio.play_se("psynergy/4");
            await this.scale_hand_sprite_end(this.right_hand_sprite);
            this.data.audio.play_se("psynergy/10");
        } else {
            this.init_hand_sprites();
            this.data.audio.play_se("psynergy/1");
            await this.scale_hand_sprite_init(this.left_hand_sprite);
            this.data.audio.play_se("psynergy/1");
            await this.scale_hand_sprite_init(this.right_hand_sprite);
            await this.hold_target_obj();
            this.data.audio.play_se("psynergy/17");
        }

        this.finish();
    }

    init_hand_sprites() {
        const sprite_key = this.hand_sprite_base.getSpriteKey(LiftFieldPsynergy.MOVE_HAND_KEY_NAME);

        this.left_hand_sprite = this.data.overlayer_group.create(0, 0, sprite_key);
        this.hand_sprite_base.setAnimation(this.left_hand_sprite, LiftFieldPsynergy.MOVE_HAND_KEY_NAME);
        this.left_hand_sprite.frameName = this.hand_sprite_base.getFrameName(
            LiftFieldPsynergy.MOVE_HAND_KEY_NAME,
            reverse_directions[directions.right],
            0
        );
        this.left_hand_sprite.anchor.setTo(0.5, 0.5);
        this.left_hand_sprite.scale.setTo(0, 0);

        this.right_hand_sprite = this.data.overlayer_group.create(0, 0, sprite_key);
        this.hand_sprite_base.setAnimation(this.right_hand_sprite, LiftFieldPsynergy.MOVE_HAND_KEY_NAME);
        this.right_hand_sprite.frameName = this.hand_sprite_base.getFrameName(
            LiftFieldPsynergy.MOVE_HAND_KEY_NAME,
            reverse_directions[directions.left],
            0
        );
        this.right_hand_sprite.anchor.setTo(0.5, 0.5);
        this.right_hand_sprite.scale.setTo(0, 0);

        let left_x, right_x, y_pos;
        if (this.target_object) {
            left_x = this.target_object.x - this.target_object.width;
            right_x = this.target_object.x + this.target_object.width;
            y_pos = this.target_object.sprite.centerY;
        } else {
            const front_pos = get_front_position(
                this.controllable_char.tile_x_pos,
                this.controllable_char.tile_y_pos,
                this.cast_direction
            );
            const front_pos_x_px = get_centered_pos_in_px(front_pos.x, this.data.map.tile_width);
            left_x = front_pos_x_px - (this.data.map.tile_width << 1);
            right_x = front_pos_x_px + (this.data.map.tile_width << 1);
            y_pos = get_centered_pos_in_px(front_pos.y, this.data.map.tile_height) - (this.data.map.tile_height >> 1);
        }

        this.left_hand_sprite.x = left_x;
        this.left_hand_sprite.centerY = y_pos;

        this.right_hand_sprite.x = right_x;
        this.right_hand_sprite.centerY = y_pos;
    }

    async scale_hand_sprite_init(hand_sprite: Phaser.Sprite) {
        const flip_timer = this.game.time.create(false);
        const fake_hand_scale = {x: 0};
        flip_timer.loop(50, () => {
            hand_sprite.scale.x = hand_sprite.scale.x > 0 ? -fake_hand_scale.x : fake_hand_scale.x;
        });
        flip_timer.start();
        const time_value = 400;
        this.game.add.tween(fake_hand_scale).to({x: 1}, time_value, Phaser.Easing.Linear.None, true);
        let flip_resolve;
        const flip_promise = new Promise(resolve => (flip_resolve = resolve));
        this.game.add
            .tween(hand_sprite.scale)
            .to({y: 1}, time_value, Phaser.Easing.Linear.None, true)
            .onComplete.addOnce(flip_resolve);
        await flip_promise;
        flip_timer.destroy();
        hand_sprite.scale.setTo(1, 1);
    }

    async scale_hand_sprite_end(hand_sprite: Phaser.Sprite) {
        const flip_timer = this.game.time.create(false);
        const fake_hand_scale = {x: 1};
        flip_timer.loop(40, () => {
            hand_sprite.scale.x = hand_sprite.scale.x > 0 ? -fake_hand_scale.x : fake_hand_scale.x;
        });
        flip_timer.start();
        const y_shift = hand_sprite.y - 10;
        const time_value = 400;
        this.game.add.tween(hand_sprite).to({y: y_shift}, time_value, Phaser.Easing.Linear.None, true);
        this.game.add.tween(fake_hand_scale).to({x: 0}, time_value, Phaser.Easing.Linear.None, true);
        let flip_resolve;
        const flip_promise = new Promise(resolve => (flip_resolve = resolve));
        this.game.add
            .tween(hand_sprite.scale)
            .to({y: 0}, time_value, Phaser.Easing.Linear.None, true)
            .onComplete.addOnce(flip_resolve);
        await flip_promise;
        flip_timer.destroy();
        await this.set_final_emitter(hand_sprite);
    }

    async hold_target_obj() {
        let left_x, right_x;
        if (this.target_object) {
            left_x = this.target_object.x - (this.target_object.width >> 1);
            right_x = this.target_object.x + (this.target_object.width >> 1);
        } else {
            const front_pos = get_front_position(
                this.controllable_char.tile_x_pos,
                this.controllable_char.tile_y_pos,
                this.cast_direction
            );
            right_x = left_x = get_centered_pos_in_px(front_pos.x, this.data.map.tile_width);
        }
        const hold_time = 150;
        let left_resolve;
        const left_promise = new Promise(resolve => (left_resolve = resolve));
        this.game.add
            .tween(this.left_hand_sprite)
            .to(
                {
                    x: left_x,
                },
                hold_time,
                Phaser.Easing.Linear.None,
                true
            )
            .onComplete.addOnce(left_resolve);

        let right_resolve;
        const right_promise = new Promise(resolve => (right_resolve = resolve));
        this.game.add
            .tween(this.right_hand_sprite)
            .to(
                {
                    x: right_x,
                },
                hold_time,
                Phaser.Easing.Linear.None,
                true
            )
            .onComplete.addOnce(right_resolve);

        await Promise.all([left_promise, right_promise]);

        if (this.target_object) {
            LiftFieldPsynergy.set_permanent_hue_effect(this.game, this.target_object);
        } else {
            this.left_hand_sprite.destroy();
            this.right_hand_sprite.destroy();
            const left_prom = this.set_final_emitter(this.left_hand_sprite);
            const right_prom = this.set_final_emitter(this.right_hand_sprite);
            await Promise.all([left_prom, right_prom]);
        }
    }

    async lift_target_obj() {
        const lift_time = 1200;
        const target_y = get_centered_pos_in_px(this.destination_y_pos, this.data.map.tile_height);
        const delta_y = this.left_hand_sprite.centerY - target_y;

        const col_layer_chance_timer = this.game.time.create(true);
        col_layer_chance_timer.add((lift_time / 3) | 0, () => {
            this.target_object.change_collision_layer(this.destination_collision_layer, true);
        });
        col_layer_chance_timer.start();

        let target_resolve;
        const target_promise = new Promise(resolve => (target_resolve = resolve));
        this.game.add
            .tween(this.target_object.body)
            .to(
                {
                    y: this.target_object.sprite.y - delta_y,
                },
                lift_time,
                Phaser.Easing.Linear.None,
                true
            )
            .onComplete.addOnce(target_resolve);
        let left_resolve;
        const left_promise = new Promise(resolve => (left_resolve = resolve));
        this.game.add
            .tween(this.left_hand_sprite)
            .to(
                {
                    centerY: target_y,
                },
                lift_time,
                Phaser.Easing.Linear.None,
                true
            )
            .onComplete.addOnce(left_resolve);
        let right_resolve;
        const right_promise = new Promise(resolve => (right_resolve = resolve));
        this.game.add
            .tween(this.right_hand_sprite)
            .to(
                {
                    centerY: target_y,
                },
                lift_time,
                Phaser.Easing.Linear.None,
                true
            )
            .onComplete.addOnce(right_resolve);

        await Promise.all([target_promise, left_promise, right_promise]);
        LiftFieldPsynergy.set_permanent_tween(this.game, this.target_object);
    }

    async set_final_emitter(hand_sprite: Phaser.Sprite) {
        const sprite_key = this.psynergy_particle_base.getSpriteKey("psynergy_particle");
        const final_emitter_particles_count = 8;
        const final_emitter = this.game.add.emitter(0, 0, final_emitter_particles_count);
        final_emitter.makeParticles(sprite_key);
        final_emitter.gravity = 200;
        final_emitter.forEach((particle: Phaser.Sprite) => {
            this.psynergy_particle_base.setAnimation(particle, "psynergy_particle");
        });
        final_emitter.x = hand_sprite.centerX;
        final_emitter.y = hand_sprite.centerY;
        const lifetime = Phaser.Timer.QUARTER;
        final_emitter.start(true, lifetime, null, final_emitter_particles_count);
        const anim_key = this.psynergy_particle_base.getAnimationKey("psynergy_particle", "vanish");
        final_emitter.forEach((particle: Phaser.Sprite) => {
            particle.animations.play(anim_key);
            particle.animations.currentAnim.setFrame((Math.random() * particle.animations.frameTotal) | 0);
        });
        await promised_wait(this.game, lifetime);
        final_emitter.destroy();
    }

    static restore_lift_rock(game: Phaser.Game, target_object: LiftFieldPsynergy["target_object"]) {
        LiftFieldPsynergy.set_permanent_hue_effect(game, target_object);
        LiftFieldPsynergy.set_permanent_tween(game, target_object);
        if (target_object.has_shadow) {
            target_object.shadow.sort_function = null;
            target_object.shadow.send_to_back = true;
        }
    }

    static set_permanent_tween(game: Phaser.Game, target_object: LiftFieldPsynergy["target_object"]) {
        const tween = game.add.tween(target_object.body).to(
            {
                y: target_object.y + 2,
            },
            500,
            Phaser.Easing.Linear.None,
            true,
            0,
            -1,
            true
        );
        target_object.add_unset_callback(() => {
            tween?.stop();
        });
    }

    static set_permanent_hue_effect(game: Phaser.Game, target_object: LiftFieldPsynergy["target_object"]) {
        const target_hueshift_timer = game.time.create(false);
        target_object.manage_filter(target_object.hue_filter, true);
        target_hueshift_timer.loop(5, () => {
            if (target_object?.hue_filter) {
                target_object.hue_filter.angle = Math.random() * degree360;
            }
        });
        target_hueshift_timer.start();
        target_object.add_unset_callback(() => {
            target_hueshift_timer?.stop(true);
            target_hueshift_timer?.destroy();
        });
    }

    update() {}

    finish() {
        this.left_hand_sprite?.destroy();
        this.right_hand_sprite?.destroy();
        if (this.target_object) {
            this.target_object.set_tile_position(
                {
                    y: this.destination_y_pos,
                },
                true
            );
            this.target_object.allow_jumping_through_it = false;
        }
        this.return_to_idle_anim();
        this.stop_casting();
    }
}
