import {FieldAbilities} from "./FieldAbilities";
import {base_actions, get_centered_pos_in_px, get_front_position, promised_wait} from "../utils";
import {InteractableObjects} from "../interactable_objects/InteractableObjects";

export class DouseFieldPsynergy extends FieldAbilities {
    private static readonly ABILITY_KEY_NAME = "douse";
    private static readonly ACTION_KEY_NAME = base_actions.CAST;
    private static readonly DOUSE_MAX_RANGE = 12;
    private static readonly CLOUD_KEY_NAME = "douse";
    private static readonly CLOUD_ANIM_KEY_NAME = "cloud";
    private static readonly DOUSE_HEIGHT = 45;

    private cloud_sprite: Phaser.Sprite;

    protected target_object: InteractableObjects;

    constructor(game, data) {
        super(
            game,
            data,
            DouseFieldPsynergy.ABILITY_KEY_NAME,
            DouseFieldPsynergy.ACTION_KEY_NAME,
            true,
            true,
            DouseFieldPsynergy.DOUSE_MAX_RANGE
        );
        this.set_bootstrap_method(this.init.bind(this));
    }

    async init() {
        this.field_psynergy_window.close();

        this.init_cloud();
        await this.move_cloud_out();
        await this.drops();
        await this.move_cloud_in();

        this.cloud_sprite.destroy();
        this.controllable_char.casting_psynergy = false;
        this.target_object = null;
    }

    init_cloud() {
        const cloud_sprite_base = this.data.info.misc_sprite_base_list[DouseFieldPsynergy.CLOUD_KEY_NAME];
        const sprite_key = cloud_sprite_base.getSpriteKey(DouseFieldPsynergy.CLOUD_KEY_NAME);
        this.cloud_sprite = this.data.overlayer_group.create(0, 0, sprite_key);
        cloud_sprite_base.setAnimation(this.cloud_sprite, DouseFieldPsynergy.CLOUD_KEY_NAME);
        const anim_key = cloud_sprite_base.getAnimationKey(
            DouseFieldPsynergy.CLOUD_KEY_NAME,
            DouseFieldPsynergy.CLOUD_ANIM_KEY_NAME
        );
        this.cloud_sprite.play(anim_key);
        this.cloud_sprite.anchor.setTo(0.5, 0.5);
        this.cloud_sprite.scale.setTo(0, 0);
        this.cloud_sprite.x = this.controllable_char.x;
        this.cloud_sprite.y = this.controllable_char.y - this.controllable_char.height + 10;
    }

    async move_cloud_out() {
        this.data.audio.play_se("psynergy/1");
        let dest_x: number, dest_y: number;
        if (this.target_object) {
            dest_x = this.target_object.x;
            dest_y = this.target_object.y - DouseFieldPsynergy.DOUSE_HEIGHT;
        } else {
            const front_pos = get_front_position(
                this.controllable_char.tile_x_pos,
                this.controllable_char.tile_y_pos,
                this.cast_direction
            );
            dest_x = get_centered_pos_in_px(front_pos.x, this.data.map.tile_width);
            dest_y = get_centered_pos_in_px(front_pos.y, this.data.map.tile_height) - DouseFieldPsynergy.DOUSE_HEIGHT;
        }
        const tween_duration = 250;
        let tween_resolve;
        const tween_promise = new Promise(resolve => (tween_resolve = resolve));
        this.game.add
            .tween(this.cloud_sprite)
            .to(
                {
                    x: dest_x,
                    y: dest_y,
                },
                tween_duration,
                Phaser.Easing.Linear.None,
                true
            )
            .onComplete.addOnce(tween_resolve);
        this.game.add
            .tween(this.cloud_sprite.scale)
            .to(
                {
                    x: 1,
                    y: 1,
                },
                tween_duration,
                Phaser.Easing.Linear.None,
                true
            )
            .onComplete.addOnce(tween_resolve);
        await tween_promise;
    }

    async drops() {
        const x_delta = 7;
        const x1_s = this.cloud_sprite.x - x_delta;
        const x2_s = this.cloud_sprite.x + x_delta;
        const y1_s = this.cloud_sprite.y;
        const y2_s = y1_s;
        const zone_source = this.data.particle_manager.createLineZone(x1_s, y1_s, x2_s, y2_s);
        const x1_t = x1_s;
        const x2_t = x2_s;
        const y1_t = this.cloud_sprite.y + DouseFieldPsynergy.DOUSE_HEIGHT;
        const y2_t = y1_t;
        const zone_target = this.data.particle_manager.createLineZone(x1_t, y1_t, x2_t, y2_t);
        const lifespan = 140;
        const in_data = {
            image: "water_drop",
            alpha: 0.9,
            lifespan: lifespan,
            target: {
                zone: zone_target,
            },
        };
        this.data.particle_manager.addData("drops", in_data);
        const into_emitter = this.data.particle_manager.createEmitter(Phaser.ParticleStorm.SPRITE);
        into_emitter.addToWorld(this.data.overlayer_group);
        this.cloud_sprite.bringToTop();
        const repeat = this.target_object ? 30 : 10;
        const ellapse_between_repeats = 120;
        into_emitter.emit("drops", undefined, undefined, {
            total: 1,
            repeat: repeat,
            frequency: ellapse_between_repeats,
            random: true,
            zone: zone_source,
        });
        into_emitter.onEmit = new Phaser.Signal();
        into_emitter.onEmit.add(() => {
            this.data.audio.play_se("psynergy/19");
        });

        const duration = repeat * Math.max(ellapse_between_repeats, lifespan);
        await promised_wait(this.game, duration);

        this.return_to_idle_anim();
        if (this.target_object) {
            await this.stop_casting(false);
        } else {
            this.stop_casting(false);
        }

        this.data.particle_manager.removeEmitter(into_emitter);
        into_emitter.destroy();
        into_emitter.onEmit.removeAll();
        this.data.particle_manager.clearData("drops");
    }

    async move_cloud_in() {
        const dest_x = this.controllable_char.x;
        const dest_y = this.controllable_char.y - this.controllable_char.height + 10;
        const tween_duration = 250;
        let tween_resolve;
        const tween_promise = new Promise(resolve => (tween_resolve = resolve));
        this.game.add
            .tween(this.cloud_sprite)
            .to(
                {
                    x: dest_x,
                    y: dest_y,
                },
                tween_duration,
                Phaser.Easing.Linear.None,
                true
            )
            .onComplete.addOnce(tween_resolve);
        this.game.add
            .tween(this.cloud_sprite.scale)
            .to(
                {
                    x: 0,
                    y: 0,
                },
                tween_duration,
                Phaser.Easing.Linear.None,
                true
            )
            .onComplete.addOnce(tween_resolve);
        await tween_promise;
    }

    update() {}
}
