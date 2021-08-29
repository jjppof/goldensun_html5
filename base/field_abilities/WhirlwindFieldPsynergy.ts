import {SpriteBase} from "../SpriteBase";
import {FieldAbilities} from "./FieldAbilities";
import {base_actions, get_front_position} from "../utils";

export class WhirlwindFieldPsynergy extends FieldAbilities {
    private static readonly ABILITY_KEY_NAME = "whirlwind";
    private static readonly ACTION_KEY_NAME = base_actions.CAST;
    private static readonly WHIRLWIND_MAX_RANGE = 26;
    private static readonly WHIRLWIND_MISS_SHIFT = 16;
    private static readonly WHIRLWIND_SCALE_X = 1.8;
    private static readonly WHIRLWIND_SCALE_Y = 1.3;
    private static readonly INIT_DURATION = 250;
    private static readonly MISS_DURATION = 800;

    private _whirlwind_sprite_base: SpriteBase;
    private _whirlwind_sprite: Phaser.Sprite;

    constructor(game, data) {
        super(
            game,
            data,
            WhirlwindFieldPsynergy.ABILITY_KEY_NAME,
            WhirlwindFieldPsynergy.ACTION_KEY_NAME,
            true,
            true,
            WhirlwindFieldPsynergy.WHIRLWIND_MAX_RANGE
        );
        this.set_bootstrap_method(this.init.bind(this));
        this._whirlwind_sprite_base = this.data.info.misc_sprite_base_list[WhirlwindFieldPsynergy.ABILITY_KEY_NAME];
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
        const front_pos = get_front_position(0, 0, this.cast_direction);
        this._whirlwind_sprite.centerX = this.controllable_char.sprite.centerX;
        this._whirlwind_sprite.centerY = this.controllable_char.sprite.centerY;
        const target_x =
            this.controllable_char.sprite.centerX + front_pos.x * WhirlwindFieldPsynergy.WHIRLWIND_MISS_SHIFT;
        const target_y =
            this.controllable_char.sprite.centerY + front_pos.y * WhirlwindFieldPsynergy.WHIRLWIND_MISS_SHIFT;
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
                } else {
                    this.miss_target();
                }
            });
    }

    miss_target() {
        const timer_event = this.game.time.events.add(WhirlwindFieldPsynergy.MISS_DURATION, () => {
            const end_key = this._whirlwind_sprite_base.getAnimationKey(WhirlwindFieldPsynergy.ABILITY_KEY_NAME, "end");
            this._whirlwind_sprite.play(end_key).onComplete.addOnce(() => {
                this._whirlwind_sprite.destroy();
                this._whirlwind_sprite = null;
                this.unset_hero_cast_anim();
                this.stop_casting();
            });
        });
        timer_event.timer.start();
    }

    update() {}
}
