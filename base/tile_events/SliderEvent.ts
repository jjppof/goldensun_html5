import {degree30, degree60} from "../magic_numbers";
import {base_actions, directions, get_centered_pos_in_px, reverse_directions} from "../utils";
import {TeleportEvent} from "./TeleportEvent";
import {event_types, TileEvent} from "./TileEvent";

export class SliderEvent extends TileEvent {
    private static readonly TIME_PER_TILE = 50;
    private static readonly DUST_COUNT = 6;
    private static readonly DUST_KEY = "dust";
    private static readonly DUST_ANIM_KEY = "spread";
    private static readonly DUST_COUNT_GROUND_HIT = 7;
    private static readonly DUST_RADIUS_GROUND_HIT = 18;

    private x_target: number;
    private y_target: number;
    private dest_collision_layer: number;
    private show_dust: boolean;

    private teleport: boolean;
    private teleport_target: string;
    private teleport_init_x: number;
    private teleport_init_y: number;
    private teleport_end_x: number;
    private teleport_end_y: number;
    private ground_hit_animation: boolean;

    constructor(
        game,
        data,
        x,
        y,
        activation_directions,
        initial_disabled_directions,
        activation_collision_layers,
        active_storage_key,
        affected_by_reveal,
        key_name: string,
        x_target,
        y_target,
        dest_collision_layer,
        show_dust,
        teleport,
        teleport_target,
        teleport_init_x,
        teleport_init_y,
        teleport_end_x,
        teleport_end_y,
        ground_hit_animation
    ) {
        super(
            game,
            data,
            event_types.SLIDER,
            x,
            y,
            activation_directions,
            initial_disabled_directions,
            activation_collision_layers,
            active_storage_key,
            null,
            affected_by_reveal,
            key_name
        );
        this.x_target = x_target;
        this.y_target = y_target;
        this.dest_collision_layer = dest_collision_layer ?? 0;
        this.show_dust = show_dust ?? true;
        this.teleport = teleport ?? false;
        this.teleport_target = teleport_target;
        this.teleport_init_x = teleport_init_x;
        this.teleport_init_y = teleport_init_y;
        this.teleport_end_x = teleport_end_x;
        this.teleport_end_y = teleport_end_y;
        this.ground_hit_animation = ground_hit_animation ?? true;
    }

    fire() {
        if (!this.data.hero.stop_by_colliding || !this.check_position() || !this.data.hero_movement_allowed(false)) {
            return;
        }
        this.data.tile_event_manager.on_event = true;
        this.data.hero.sliding = true;
        this.data.hero.toggle_collision(false);

        const initial_x = this.data.map.tile_width * (this.x + 0.5);
        const initial_y = this.data.map.tile_height * (this.y + 0.6);
        const jump_y = this.data.map.tile_height * this.y;
        this.data.hero.play(base_actions.JUMP, reverse_directions[directions.down], false);
        this.game.time.events.add(200, () => {
            this.data.hero.shadow.visible = false;
            this.data.hero.change_action(base_actions.IDLE);
            this.data.hero.play(base_actions.IDLE, reverse_directions[directions.down], false);
            this.game.add
                .tween(this.data.hero.sprite.body)
                .to({x: initial_x, y: [jump_y, initial_y]}, 150, Phaser.Easing.Linear.None, true)
                .onComplete.addOnce(() => {
                    this.data.audio.play_se("actions/slide");
                    if (this.show_dust) {
                        this.dust_animation();
                    }
                    const little_step = initial_y + this.data.map.tile_height * 1.2;
                    this.game.add
                        .tween(this.data.hero.sprite.body)
                        .to({y: little_step}, 70, Phaser.Easing.Quadratic.Out, true)
                        .onComplete.addOnce(() => {
                            this.data.hero.set_frame(directions.down_right);
                            this.game.time.events.add(40, () => {
                                this.data.hero.set_frame(directions.down_left);
                                this.game.time.events.add(40, () => {
                                    this.data.hero.set_frame(directions.down);
                                });
                            });
                            const target_x = get_centered_pos_in_px(this.x_target, this.data.map.tile_width);
                            const target_y = get_centered_pos_in_px(this.y_target, this.data.map.tile_height);
                            const slide_time = Math.abs(this.y_target - this.y) * SliderEvent.TIME_PER_TILE;
                            const hero_fall_tween = this.game.add
                                .tween(this.data.hero.sprite.body)
                                .to({x: target_x, y: target_y}, slide_time, Phaser.Easing.Linear.None, true);
                            hero_fall_tween.onComplete.addOnce(() => {
                                if (this.teleport) {
                                    return;
                                }
                                this.finish();
                            });
                            if (this.teleport) {
                                let teleport_time = slide_time - SliderEvent.TIME_PER_TILE * 4;
                                if (teleport_time < 0) {
                                    teleport_time = slide_time;
                                }
                                this.game.time.events.add(teleport_time, () => {
                                    this.start_teleport(hero_fall_tween);
                                });
                            }
                        });
                });
        });
    }

    private finish() {
        this.data.hero.play();
        this.data.hero.update_shadow();
        this.data.hero.shadow.visible = true;
        if (!this.teleport && this.dest_collision_layer !== this.data.map.collision_layer) {
            this.data.collision.change_map_body(this.dest_collision_layer);
        }
        this.game.time.events.add(80, () => {
            this.data.hero.sliding = false;
            this.data.hero.toggle_collision(true);
            this.data.tile_event_manager.on_event = false;
        });
    }

    private dust_animation() {
        const dust_sprite_base = this.data.info.misc_sprite_base_list[SliderEvent.DUST_KEY];
        const dust_key = dust_sprite_base.getSpriteKey(SliderEvent.DUST_KEY);
        const initial_x = this.data.map.tile_width * (this.x + 0.5);
        for (let i = 0; i < SliderEvent.DUST_COUNT; ++i) {
            this.game.time.events.add(40 * i, () => {
                const start_x =
                    this.data.hero.sprite.body.x -
                    Math.random() * this.data.map.tile_width +
                    (this.data.map.tile_width >> 1);
                const start_y =
                    this.data.hero.sprite.body.y -
                    Math.random() * this.data.map.tile_height +
                    (this.data.map.tile_height >> 1);
                const dust_sprite: Phaser.Sprite = this.data.middlelayer_group.create(start_x, start_y, dust_key);
                dust_sprite.base_collision_layer = this.dest_collision_layer;
                dust_sprite.anchor.setTo(0.5, 0.5);
                this.game.add.tween(dust_sprite).to(
                    {
                        x: start_x + (start_x < initial_x ? -1 : 1) * (this.data.map.tile_height / 3),
                        y: start_y - (this.data.map.tile_height >> 1),
                    },
                    400,
                    Phaser.Easing.Linear.None,
                    true
                );
                this.data.middlelayer_group.setChildIndex(
                    dust_sprite,
                    this.data.middlelayer_group.getChildIndex(this.data.hero.sprite)
                );
                dust_sprite_base.setAnimation(dust_sprite, SliderEvent.DUST_KEY);
                const animation_key = dust_sprite_base.getAnimationKey(SliderEvent.DUST_KEY, "spread");
                dust_sprite.animations.getAnimation(animation_key).onComplete.addOnce(() => {
                    dust_sprite.destroy();
                });
                dust_sprite.animations.play(animation_key);
            });
        }
    }

    private start_teleport(hero_fall_tween: Phaser.Tween) {
        const event = new TeleportEvent(
            this.game,
            this.data,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            false,
            undefined,
            this.teleport_target,
            this.teleport_init_x,
            this.teleport_init_y,
            false,
            false,
            false,
            this.dest_collision_layer,
            reverse_directions[directions.down],
            false,
            true,
            true,
            true,
            true,
            300,
            undefined,
            undefined,
            undefined,
            undefined
        );
        event.set_fadein_callback(() => {
            hero_fall_tween.stop(false);
        });
        event.set_finish_callback(() => {
            event.destroy();
            this.data.tile_event_manager.on_event = true;
            const slide_time = Math.abs(this.teleport_end_y - this.teleport_init_y) * SliderEvent.TIME_PER_TILE;
            const target_x = get_centered_pos_in_px(this.teleport_end_x, this.data.map.tile_width);
            const target_y = get_centered_pos_in_px(this.teleport_end_y, this.data.map.tile_height);
            this.game.add
                .tween(this.data.hero.sprite.body)
                .to({x: target_x, y: target_y}, slide_time, Phaser.Easing.Linear.None, true)
                .onComplete.addOnce(() => {
                    if (this.ground_hit_animation) {
                        this.data.hero.update_shadow();
                        this.data.hero.shadow.visible = true;
                        this.data.hero.play(base_actions.GROUND);
                        this.data.audio.play_se("actions/ground_hit");
                        this.data.camera.enable_shake();
                        this.game.time.events.add(300, () => {
                            this.data.hero.play(base_actions.IDLE);
                            this.data.camera.disable_shake();
                        });
                        this.ground_hit_dust_animation(() => {
                            this.finish();
                        });
                    } else {
                        this.finish();
                    }
                });
        });
        event.fire();
    }

    private ground_hit_dust_animation(on_animation_end: () => void) {
        const promises = new Array(SliderEvent.DUST_COUNT_GROUND_HIT);
        const sprites = new Array(SliderEvent.DUST_COUNT_GROUND_HIT);
        const origin_x = this.data.hero.x;
        const origin_y = this.data.hero.y;
        const dust_sprite_base = this.data.info.misc_sprite_base_list[SliderEvent.DUST_KEY];
        const dust_key = dust_sprite_base.getSpriteKey(SliderEvent.DUST_KEY);
        for (let i = 0; i < SliderEvent.DUST_COUNT_GROUND_HIT; ++i) {
            const this_angle = ((Math.PI + degree60) * i) / (SliderEvent.DUST_COUNT_GROUND_HIT - 1) - degree30;
            const x = origin_x + SliderEvent.DUST_RADIUS_GROUND_HIT * Math.cos(this_angle);
            const y = origin_y + SliderEvent.DUST_RADIUS_GROUND_HIT * Math.sin(this_angle);
            const dust_sprite = this.data.middlelayer_group.create(origin_x, origin_y, dust_key);
            if (this_angle < 0 || this_angle > Math.PI) {
                this.data.middlelayer_group.setChildIndex(
                    dust_sprite,
                    this.data.middlelayer_group.getChildIndex(this.data.hero.sprite)
                );
            }
            dust_sprite.anchor.setTo(0.5, 0.5);
            this.game.add.tween(dust_sprite).to(
                {
                    x: x,
                    y: y,
                },
                400,
                Phaser.Easing.Linear.None,
                true
            );
            sprites[i] = dust_sprite;
            dust_sprite_base.setAnimation(dust_sprite, SliderEvent.DUST_KEY);
            const animation_key = dust_sprite_base.getAnimationKey(SliderEvent.DUST_KEY, SliderEvent.DUST_ANIM_KEY);
            let resolve_func;
            promises[i] = new Promise(resolve => (resolve_func = resolve));
            dust_sprite.animations.getAnimation(animation_key).onComplete.addOnce(resolve_func);
            dust_sprite.animations.play(animation_key);
        }
        Promise.all(promises).then(() => {
            sprites.forEach(sprite => {
                this.data.middlelayer_group.remove(sprite, true);
            });
            on_animation_end();
        });
    }

    destroy() {
        this._origin_interactable_object = null;
        this.deactivate();
    }
}
