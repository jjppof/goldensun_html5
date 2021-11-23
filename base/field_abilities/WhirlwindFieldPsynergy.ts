import {SpriteBase} from "../SpriteBase";
import {FieldAbilities} from "./FieldAbilities";
import {base_actions, get_front_position, get_sqr_distance, random_normal} from "../utils";
import * as _ from "lodash";
import {degree360, degree90} from "../magic_numbers";

export class WhirlwindFieldPsynergy extends FieldAbilities {
    private static readonly ABILITY_KEY_NAME = "whirlwind";
    private static readonly ACTION_KEY_NAME = base_actions.CAST;
    private static readonly WHIRLWIND_MAX_RANGE = 26;
    private static readonly WHIRLWIND_MISS_SHIFT = 16;
    private static readonly WHIRLWIND_SCALE_X = 1.8;
    private static readonly WHIRLWIND_SCALE_Y = 1.3;
    private static readonly INIT_DURATION = 250;
    private static readonly MISS_DURATION = 800;
    private static readonly LEAVES_COUNT = 15;
    private static readonly LEAVES_CIRCLE_RAD = 8;
    private static readonly ROTATE_DURATION = 2500;
    private static readonly BLOW_DURATION = 3000;
    private static readonly BLOW_GRADIENT = 1000;
    private static readonly BLOW_PHI_STEP_SCALE = 0.5;
    private static readonly BLOW_RO_STEP_SCALE_MIN = 1.5;
    private static readonly BLOW_RO_STEP_SCALE_MAX = 3.5;
    private static readonly KILL_DISTANCE_SQR = 100 * 100;

    private _whirlwind_sprite_base: SpriteBase;
    private _whirlwind_sprite: Phaser.Sprite;
    private _leaves: Phaser.Group;
    private _blowing: boolean;
    private _previous_angles: Array<number>;
    private _blow_gradient: {gradient: number};

    constructor(game, data) {
        super(
            game,
            data,
            WhirlwindFieldPsynergy.ABILITY_KEY_NAME,
            WhirlwindFieldPsynergy.ACTION_KEY_NAME,
            true,
            true,
            WhirlwindFieldPsynergy.WHIRLWIND_MAX_RANGE,
            undefined,
            undefined,
            true,
            io => io.entangled_by_bush && !io.enable
        );
        this.set_bootstrap_method(this.init.bind(this));
        this._whirlwind_sprite_base = this.data.info.misc_sprite_base_list[WhirlwindFieldPsynergy.ABILITY_KEY_NAME];
        this._blowing = false;
    }

    init() {
        this.field_psynergy_window.close();
        const sprite_key = this._whirlwind_sprite_base.getSpriteKey(WhirlwindFieldPsynergy.ABILITY_KEY_NAME);
        this._whirlwind_sprite = this.game.add.sprite(0, 0, sprite_key);
        this.data.overlayer_group.add(this._whirlwind_sprite);
        this.data.overlayer_group.bringToTop(this._whirlwind_sprite);
        this._whirlwind_sprite.send_to_front = true;
        this._whirlwind_sprite.base_collision_layer = this.data.map.collision_layer;
        this._whirlwind_sprite_base.setAnimation(this._whirlwind_sprite, WhirlwindFieldPsynergy.ABILITY_KEY_NAME);
        const blow_key = this._whirlwind_sprite_base.getAnimationKey(WhirlwindFieldPsynergy.ABILITY_KEY_NAME, "blow");
        this._whirlwind_sprite.play(blow_key);
        this._whirlwind_sprite.anchor.setTo(0.5, 0.5);
        this._whirlwind_sprite.scale.setTo(0, 0);
        this.game.add.tween(this._whirlwind_sprite.scale).to(
            {
                x: WhirlwindFieldPsynergy.WHIRLWIND_SCALE_X,
                y: WhirlwindFieldPsynergy.WHIRLWIND_SCALE_Y,
            },
            WhirlwindFieldPsynergy.INIT_DURATION,
            Phaser.Easing.Linear.None,
            true
        );

        this._whirlwind_sprite.centerX = this.controllable_char.sprite.centerX;
        this._whirlwind_sprite.centerY = this.controllable_char.sprite.centerY;
        let target_x, target_y;
        if (this.target_found) {
            target_x = this.target_object.bush_sprite.centerX;
            target_y = this.target_object.bush_sprite.centerY;
        } else {
            const front_pos = get_front_position(0, 0, this.cast_direction);
            target_x =
                this.controllable_char.sprite.centerX + front_pos.x * WhirlwindFieldPsynergy.WHIRLWIND_MISS_SHIFT;
            target_y =
                this.controllable_char.sprite.centerY + front_pos.y * WhirlwindFieldPsynergy.WHIRLWIND_MISS_SHIFT;
        }
        this.game.add
            .tween(this._whirlwind_sprite)
            .to(
                {
                    centerX: target_x,
                    centerY: target_y,
                },
                WhirlwindFieldPsynergy.INIT_DURATION,
                Phaser.Easing.Linear.None,
                true
            )
            .onComplete.addOnce(() => {
                if (this.target_found) {
                    this.blow_leaves();
                } else {
                    this.miss_target();
                }
            });
    }

    async blow_leaves() {
        await this.rotate_leaves();
        this.finish_whirlwind();
    }

    async remove_bush() {
        this.target_object.set_entangled_by_bush(false);
        this.target_object.set_enable(true);
        this.target_object.destroy_bush();
    }

    async rotate_leaves() {
        this._previous_angles = new Array(WhirlwindFieldPsynergy.LEAVES_COUNT).fill(0);
        this._blow_gradient = {gradient: WhirlwindFieldPsynergy.BLOW_RO_STEP_SCALE_MIN};

        this._leaves = this.game.add.group();
        this.data.overlayer_group.add(this._leaves);
        this.data.overlayer_group.bringToTop(this._leaves);
        this._leaves.centerX = this._whirlwind_sprite.centerX;
        this._leaves.centerY = this._whirlwind_sprite.centerY;

        let promise_rotation_resolve;
        const promise_rotation = new Promise(resolve => (promise_rotation_resolve = resolve));
        const shifts: {x: number; y: number}[] = new Array(WhirlwindFieldPsynergy.LEAVES_COUNT);
        for (let i = 0; i < WhirlwindFieldPsynergy.LEAVES_COUNT; ++i) {
            const frame_name = `leaves/blowing/0${_.random(5)}`;
            const leaf = this._leaves.create(0, 0, "bush", frame_name) as Phaser.Sprite;
            leaf.visible = false;
            shifts[i] = {x: 0, y: 0};
        }
        const angle = {rad: 0};
        const dest_angle = 3 * degree360;
        const dest_angle_fraction = dest_angle / 3;
        const rotate_tween = this.game.add.tween(angle).to(
            {
                rad: dest_angle,
            },
            WhirlwindFieldPsynergy.ROTATE_DURATION,
            Phaser.Easing.Linear.None,
            true
        );
        const angle_diff = degree360 / WhirlwindFieldPsynergy.LEAVES_COUNT;
        const gradient_discount = WhirlwindFieldPsynergy.BLOW_RO_STEP_SCALE_MIN / 2;
        const initial_gradient_factor = this._blow_gradient.gradient * gradient_discount;
        rotate_tween.onUpdateCallback(() => {
            if (angle.rad > dest_angle_fraction) {
                this.remove_bush();
            }
            for (let i = 0; i < WhirlwindFieldPsynergy.LEAVES_COUNT; ++i) {
                const leaf = this._leaves.children[i] as Phaser.Sprite;
                const this_angle = angle.rad - i * angle_diff;
                leaf.visible = this_angle > 0;
                leaf.centerX = WhirlwindFieldPsynergy.LEAVES_CIRCLE_RAD * Math.cos(this_angle) + shifts[i].x;
                leaf.centerY = WhirlwindFieldPsynergy.LEAVES_CIRCLE_RAD * Math.sin(this_angle) + shifts[i].y;
                if (this_angle > dest_angle_fraction) {
                    let new_angle =
                        this._previous_angles[i] + WhirlwindFieldPsynergy.BLOW_PHI_STEP_SCALE * random_normal();
                    new_angle = (4.5 * new_angle + this_angle + degree90) / 5.5;
                    this._previous_angles[i] = new_angle;
                    shifts[i].x += initial_gradient_factor * Math.cos(new_angle);
                    shifts[i].y += initial_gradient_factor * Math.sin(new_angle);
                }
            }
        });
        rotate_tween.onComplete.addOnce(promise_rotation_resolve);
        await promise_rotation;

        let promise_blowing_resolve;
        const promise_blowing = new Promise(resolve => (promise_blowing_resolve = resolve));
        this._blowing = true;
        this.game.add.tween(this._blow_gradient).to(
            {
                gradient: WhirlwindFieldPsynergy.BLOW_RO_STEP_SCALE_MAX,
            },
            WhirlwindFieldPsynergy.BLOW_GRADIENT,
            Phaser.Easing.Linear.None,
            true
        );
        const timer_event = this.game.time.events.add(WhirlwindFieldPsynergy.BLOW_DURATION, promise_blowing_resolve);
        timer_event.timer.start();
        await promise_blowing;
        this._blowing = false;
    }

    miss_target() {
        const timer_event = this.game.time.events.add(WhirlwindFieldPsynergy.MISS_DURATION, () => {
            this.finish_whirlwind();
        });
        timer_event.timer.start();
    }

    finish_whirlwind() {
        const end_key = this._whirlwind_sprite_base.getAnimationKey(WhirlwindFieldPsynergy.ABILITY_KEY_NAME, "end");
        this._whirlwind_sprite.play(end_key).onComplete.addOnce(() => {
            if (this._leaves) {
                this._leaves.destroy(true);
                this._leaves = null;
            }
            this._previous_angles = null;
            this._whirlwind_sprite.destroy();
            this._whirlwind_sprite = null;
            this.unset_hero_cast_anim();
            this.stop_casting();
        });
    }

    update() {
        if (!this._blowing) {
            return;
        }
        for (let i = 0; i < WhirlwindFieldPsynergy.LEAVES_COUNT; ++i) {
            const leaf = this._leaves.children[i] as Phaser.Sprite;
            if (!leaf.visible) {
                continue;
            }
            const new_angle = this._previous_angles[i] + WhirlwindFieldPsynergy.BLOW_PHI_STEP_SCALE * random_normal();
            this._previous_angles[i] = new_angle;
            leaf.centerX += this._blow_gradient.gradient * Math.cos(new_angle);
            leaf.centerY += this._blow_gradient.gradient * Math.sin(new_angle);
            const leaf_distance = get_sqr_distance(leaf.centerX, 0, leaf.centerY, 0);
            if (leaf_distance > WhirlwindFieldPsynergy.KILL_DISTANCE_SQR) {
                leaf.visible = false;
            }
        }
    }
}
