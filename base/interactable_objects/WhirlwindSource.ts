import {get_centered_pos_in_px, get_distance} from "../utils";
import {SpriteBase} from "../SpriteBase";
import {InteractableObjects} from "./InteractableObjects";
import * as numbers from "../magic_numbers";

export class WhirlwindSource extends InteractableObjects {
    private static readonly DEFAULT_EMISSION_INTERVAL = 4500;
    private static readonly WHIRLWIND_SPRITE_KEY = "whirlwind";
    private static readonly WHIRLWIND_INIT_DURATION = 250;
    private static readonly WHIRLWIND_SCALE_X = 1.0;
    private static readonly WHIRLWIND_SCALE_Y = 1.0;
    private static readonly WHIRLWIND_SPEED = 0.004;
    private static readonly WHIRLWIND_BODY_RADIUS = 4.0;

    private _dest_point: {x: number; y: number};
    private _emission_interval: number;
    private _emission_timer: Phaser.Timer;
    private _whirlwinds: Phaser.Sprite[];
    private _whirlwind_sprite_base: SpriteBase;
    private _hero_collided: boolean;
    private _misc_busy_prev_state: boolean;
    private _collision_prev_state: boolean;
    private _collided_whirlwind: Phaser.Sprite;
    private _tweens: Phaser.Tween[];
    private _speed_factor: number;
    private _wind_blow_sound: Phaser.Sound;

    constructor(
        game,
        data,
        key_name,
        map_index,
        x,
        y,
        storage_keys,
        allowed_tiles,
        base_collision_layer,
        not_allowed_tiles,
        object_drop_tiles,
        anchor_x,
        anchor_y,
        scale_x,
        scale_y,
        block_climb_collision_layer_shift,
        events_info,
        enable,
        entangled_by_bush,
        toggle_enable_events,
        label,
        allow_jumping_over_it,
        allow_jumping_through_it,
        psynergies_info,
        has_shadow,
        animation,
        action,
        snapshot_info,
        affected_by_reveal,
        active,
        visible
    ) {
        super(
            game,
            data,
            key_name,
            map_index,
            x,
            y,
            storage_keys,
            allowed_tiles,
            base_collision_layer,
            not_allowed_tiles,
            object_drop_tiles,
            anchor_x,
            anchor_y,
            scale_x,
            scale_y,
            block_climb_collision_layer_shift,
            events_info,
            enable,
            entangled_by_bush,
            toggle_enable_events,
            label,
            allow_jumping_over_it,
            allow_jumping_through_it,
            psynergies_info,
            has_shadow,
            animation,
            action,
            snapshot_info,
            affected_by_reveal,
            active,
            visible
        );
        this._whirlwind_source = true;
        this._whirlwinds = [];
        this._tweens = [];
        this._whirlwind_sprite_base = this.data.info.misc_sprite_base_list[WhirlwindSource.WHIRLWIND_SPRITE_KEY];
        this._hero_collided = false;
        this._wind_blow_sound = null;
    }

    intialize_whirlwind_source(
        dest_point: WhirlwindSource["_dest_point"],
        emission_interval: WhirlwindSource["_emission_interval"],
        speed_factor: WhirlwindSource["_speed_factor"]
    ) {
        this._dest_point = dest_point;
        this._emission_interval = emission_interval ?? WhirlwindSource.DEFAULT_EMISSION_INTERVAL;
        this._speed_factor = speed_factor ?? WhirlwindSource.WHIRLWIND_SPEED;
    }

    config_whirlwind_source() {
        this._emission_timer = this.game.time.create(false);
        this._emission_timer.loop(this._emission_interval, this.emit_whirlwind.bind(this));
        this._emission_timer.start();
    }

    private emit_whirlwind() {
        if (
            !this.game.camera.bounds.contains(
                get_centered_pos_in_px(this.tile_x_pos, this.data.map.tile_width),
                get_centered_pos_in_px(this.tile_y_pos, this.data.map.tile_height)
            )
        ) {
            this._emission_timer.stop();
            return;
        }
        if (!this.enable || !this.active || this.stop_emit()) {
            return;
        }
        const whirlwind = this.get_whirlwind_sprite();
        this.config_whirlwind_body(whirlwind);
        if (
            this.game.camera.view.contains(
                get_centered_pos_in_px(this.tile_x_pos, this.data.map.tile_width),
                get_centered_pos_in_px(this.tile_y_pos, this.data.map.tile_height)
            )
        ) {
            this.data.audio.play_se("misc/whirlwind_emit");
        }
        this.game.add.tween(whirlwind.scale).to(
            {
                x: WhirlwindSource.WHIRLWIND_SCALE_X,
                y: WhirlwindSource.WHIRLWIND_SCALE_Y,
            },
            WhirlwindSource.WHIRLWIND_INIT_DURATION,
            Phaser.Easing.Linear.None,
            true
        );
        this._whirlwinds.push(whirlwind);
        const trajectory_duration =
            (get_distance(this.tile_x_pos, this._dest_point.x, this.tile_y_pos, this._dest_point.y) /
                this._speed_factor) |
            0;
        const tween = this.game.add.tween(whirlwind.body).to(
            {
                x: get_centered_pos_in_px(this._dest_point.x, this.data.map.tile_width),
                y: get_centered_pos_in_px(this._dest_point.y, this.data.map.tile_height),
            },
            trajectory_duration,
            Phaser.Easing.Linear.None,
            true
        );
        this._tweens.push(tween);
        tween.onUpdateCallback(() => {
            if (!tween.isPaused && this.stop_emit()) {
                tween.pause();
                if (this.data.map.paused) {
                    whirlwind.visible = false;
                }
            }
            if (this._hero_collided) {
                this.data.hero.body.x = this._collided_whirlwind.x;
                this.data.hero.body.y = this._collided_whirlwind.y - 3;
                this.data.hero.update_on_event();
            }
        });
        tween.onComplete.addOnce(() => {
            this._whirlwinds = this._whirlwinds.filter(w => w !== whirlwind);
            const end_key = this._whirlwind_sprite_base.getAnimationKey(WhirlwindSource.WHIRLWIND_SPRITE_KEY, "end");
            whirlwind.play(end_key).onComplete.addOnce(() => {
                whirlwind.destroy(true);
            });
            this._tweens = this._tweens.filter(t => t !== tween);
            if (this._hero_collided && whirlwind === this._collided_whirlwind) {
                this._hero_collided = false;
                this._wind_blow_sound?.stop();
                this._wind_blow_sound = null;
                this._collided_whirlwind = null;
                this.data.hero.set_rotation(false);
                const sign = {
                    x: Math.sign(this._dest_point.x - this.tile_x_pos),
                    y: Math.sign(this._dest_point.y - this.tile_y_pos),
                };
                const final_hero_pos = {
                    x: get_centered_pos_in_px(this._dest_point.x - sign.x, this.data.map.tile_width),
                    y: get_centered_pos_in_px(this._dest_point.y - sign.y, this.data.map.tile_height),
                };
                this.data.camera.enable_shake(true);
                this.data.audio.play_se("misc/rock_drop");
                this.game.add
                    .tween(this.data.hero.body)
                    .to(
                        {
                            x: this.data.hero.x - 6 * sign.x,
                            y: this.data.hero.y - 8,
                        },
                        40,
                        Phaser.Easing.Linear.None,
                        true
                    )
                    .onComplete.addOnce(() => {
                        this.game.add
                            .tween(this.data.hero.body)
                            .to(
                                {
                                    x: final_hero_pos.x,
                                    y: final_hero_pos.y,
                                },
                                60,
                                Phaser.Easing.Linear.None,
                                true
                            )
                            .onComplete.addOnce(() => {
                                this.data.camera.disable_shake();
                                this.data.hero.toggle_collision(this._collision_prev_state);
                                this.data.hero.update_shadow();
                                this.data.hero.shadow.visible = true;
                                this.data.hero.misc_busy = this._misc_busy_prev_state;
                            });
                    });
            }
        });
    }

    update() {
        if (this.stop_emit()) {
            return;
        }
        this._tweens.forEach(tween => {
            if (tween.isPaused) {
                tween.resume();
                tween.target.sprite.visible = true;
            }
        });
    }

    private stop_emit() {
        return (
            this.data.menu_open ||
            this.data.save_open ||
            this.data.shop_open ||
            this.data.healer_open ||
            this.data.inn_open ||
            this.data.map.paused ||
            this.data.hero.casting_psynergy
        );
    }

    private get_whirlwind_sprite() {
        const sprite_key = this._whirlwind_sprite_base.getSpriteKey(WhirlwindSource.WHIRLWIND_SPRITE_KEY);
        const whirlwind = this.game.add.sprite(0, 0, sprite_key);
        this.data.middlelayer_group.add(whirlwind);
        whirlwind.base_collision_layer = this.base_collision_layer;
        this._whirlwind_sprite_base.setAnimation(whirlwind, WhirlwindSource.WHIRLWIND_SPRITE_KEY);
        const blow_key = this._whirlwind_sprite_base.getAnimationKey(WhirlwindSource.WHIRLWIND_SPRITE_KEY, "blow");
        whirlwind.play(blow_key);
        whirlwind.anchor.setTo(0.5, 0.6);
        whirlwind.scale.setTo(0, 0);
        whirlwind.centerX = get_centered_pos_in_px(this.tile_x_pos, this.data.map.tile_width);
        whirlwind.centerY = get_centered_pos_in_px(this.tile_y_pos, this.data.map.tile_height);
        return whirlwind;
    }

    private config_whirlwind_body(whirlwind: Phaser.Sprite) {
        this.game.physics.p2.enable(whirlwind, false);
        whirlwind.anchor.setTo(0.5, 0.6);
        whirlwind.body.clearShapes();
        whirlwind.body.setCircle(WhirlwindSource.WHIRLWIND_BODY_RADIUS);
        whirlwind.body.setCollisionGroup(
            this.data.collision.interactable_objs_collision_groups[this.base_collision_layer]
        );
        whirlwind.body.damping = numbers.MAP_DAMPING;
        whirlwind.body.angularDamping = numbers.MAP_DAMPING;
        whirlwind.body.setZeroRotation();
        whirlwind.body.fixedRotation = true;
        whirlwind.body.dynamic = false;
        whirlwind.body.static = true;
        whirlwind.body.debug = false;
        whirlwind.body.collides(this.data.collision.hero_collision_group);
        whirlwind.body.data.shapes[0].sensor = true;
        whirlwind.body.onBeginContact.addOnce(() => {
            if (this._hero_collided) {
                return;
            }
            whirlwind.send_to_back = true;
            this._misc_busy_prev_state = this.data.hero.misc_busy;
            this.data.hero.shadow.visible = false;
            this.data.hero.misc_busy = true;
            this.data.hero.stop_char(true);
            this.data.hero.set_rotation(true, 25);
            this._collision_prev_state = this.data.hero.shapes_collision_active;
            this.data.hero.toggle_collision(false);
            this._collided_whirlwind = whirlwind;
            this._hero_collided = true;
            const call_wind_blowing_se = () => {
                if (this._hero_collided) {
                    this._wind_blow_sound = this.data.audio.play_se("misc/wind_blowing", call_wind_blowing_se);
                }
            };
            call_wind_blowing_se();
        });
    }

    custom_unset() {
        this._collided_whirlwind = null;
        this._emission_timer?.stop();
        this._emission_timer?.destroy();
        this._emission_timer = null;
        this._tweens.forEach(tween => tween.stop(false));
        this._tweens = null;
        this._whirlwinds.forEach(whirlwind => whirlwind.destroy(true));
        this._whirlwinds = null;
        this._wind_blow_sound?.stop();
        this._wind_blow_sound = null;
    }
}
