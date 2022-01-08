import {FieldAbilities} from "./FieldAbilities";
import {base_actions, directions, get_centered_pos_in_px, promised_wait, reverse_directions} from "../utils";
import {InteractableObjects} from "../interactable_objects/InteractableObjects";
import { SpriteBase } from "../SpriteBase";
import { degree360 } from "../magic_numbers";

export class LiftFieldPsynergy extends FieldAbilities {
    private static readonly ABILITY_KEY_NAME = "lift";
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
        this.field_psynergy_window.close();

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
        await this.scale_hand_sprite_init(this.left_hand_sprite);
        await this.scale_hand_sprite_init(this.right_hand_sprite);
        await this.hold_target_obj();

        if (this.target_object.has_shadow) {
            this.target_object.shadow.sort_function = null;
            this.target_object.shadow.send_to_back = true;
        }

        await this.lift_target_obj();
        await this.scale_hand_sprite_end(this.left_hand_sprite);
        await this.scale_hand_sprite_end(this.right_hand_sprite);

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

        this.left_hand_sprite.x = this.target_object.x - (this.target_object.width);
        this.left_hand_sprite.centerY = this.target_object.sprite.centerY;

        this.right_hand_sprite.x = this.target_object.x + (this.target_object.width);
        this.right_hand_sprite.centerY = this.target_object.sprite.centerY;
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
        const flip_promise = new Promise(resolve => flip_resolve = resolve);
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
        const flip_promise = new Promise(resolve => flip_resolve = resolve);
        this.game.add
            .tween(hand_sprite.scale)
            .to({y: 0}, time_value, Phaser.Easing.Linear.None, true)
            .onComplete.addOnce(flip_resolve);
        await flip_promise;
        flip_timer.destroy();
        await this.set_final_emitter(hand_sprite);
    }

    async hold_target_obj() {
        const hold_time = 150;
        let left_resolve;
        const left_promise = new Promise(resolve => left_resolve = resolve);
        this.game.add.tween(this.left_hand_sprite).to({
            x: this.target_object.x - (this.target_object.width >> 1)
        }, hold_time, Phaser.Easing.Linear.None, true).onComplete.addOnce(left_resolve);

        let right_resolve;
        const right_promise = new Promise(resolve => right_resolve = resolve);
        this.game.add.tween(this.right_hand_sprite).to({
            x: this.target_object.x + (this.target_object.width >> 1)
        }, hold_time, Phaser.Easing.Linear.None, true).onComplete.addOnce(right_resolve);

        await Promise.all([left_promise, right_promise]);

        this.target_object.set_color_filter();
        const target_hueshift_timer = this.game.time.create(false);
        const target_object = this.target_object;
        target_hueshift_timer.loop(5, () => {
            target_object.color_filter.hue_adjust = Math.random() * degree360;
        });
        target_hueshift_timer.start();
        this.target_object.add_unset_callback(() => {
            target_hueshift_timer?.destroy();
        });
    }

    async lift_target_obj() {
        const lift_time = 1200;
        const target_y = get_centered_pos_in_px(this.destination_y_pos, this.data.map.tile_height);
        const delta_y = this.left_hand_sprite.centerY - target_y;

        let target_resolve;
        const target_promise = new Promise(resolve => target_resolve = resolve);
        this.game.add.tween(this.target_object.body).to({
            y: this.target_object.sprite.y - delta_y
        }, lift_time, Phaser.Easing.Linear.None, true).onComplete.addOnce(target_resolve);
        let left_resolve;
        const left_promise = new Promise(resolve => left_resolve = resolve);
        this.game.add.tween(this.left_hand_sprite).to({
            centerY: target_y
        }, lift_time, Phaser.Easing.Linear.None, true).onComplete.addOnce(left_resolve);
        let right_resolve;
        const right_promise = new Promise(resolve => right_resolve = resolve);
        this.game.add.tween(this.right_hand_sprite).to({
            centerY: target_y
        }, lift_time, Phaser.Easing.Linear.None, true).onComplete.addOnce(right_resolve);

        await Promise.all([target_promise, left_promise, right_promise]);
        this.set_permanent_tween();
    }

    async set_final_emitter(hand_sprite: Phaser.Sprite) {
        const sprite_key = this.psynergy_particle_base.getSpriteKey("psynergy_particle");
        const final_emitter_particles_count = 8;
        const final_emitter = this.game.add.emitter(0, 0, final_emitter_particles_count);
        final_emitter.makeParticles(sprite_key);
        final_emitter.gravity = 300;
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

    set_permanent_tween() {
        const tween = this.game.add.tween(this.target_object.body).to({
            y: this.target_object.y + 2
        }, 500, Phaser.Easing.Linear.None, true, 0, -1, true);
        this.target_object.add_unset_callback(() => {
            tween?.stop();
        });
    }

    update() {}

    finish() {
        this.left_hand_sprite?.destroy();
        this.right_hand_sprite?.destroy();
        this.target_object.set_tile_position({
            y: this.destination_y_pos
        }, true);
        this.target_object.change_collision_layer(this.destination_collision_layer, true);
        this.target_object.allow_jumping_through_it = false;
        this.unset_hero_cast_anim();
        this.stop_casting();
    }
}
