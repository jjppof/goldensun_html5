import {FieldAbilities} from "./FieldAbilities";
import {base_actions, directions, promised_wait, reverse_directions} from "../utils";
import * as _ from "lodash";
import {SpriteBase} from "../SpriteBase";

export class SandFieldPsynergy extends FieldAbilities {
    private static readonly ABILITY_KEY_NAME = "sand";
    private static readonly ACTION_KEY_NAME = base_actions.CAST;
    private static readonly TRAIL_PERIOD = 85;
    private enable_update: boolean;
    private prev_collision_index: number;
    private elapsed_ms: number;
    private trail_sprite_base: SpriteBase;
    private trail_sprite_key: string;
    private trail_animation_key: string;

    constructor(game, data) {
        super(game, data, SandFieldPsynergy.ABILITY_KEY_NAME, SandFieldPsynergy.ACTION_KEY_NAME, false);
        this.set_bootstrap_method(this.init.bind(this));
        this.enable_update = false;
        this.prev_collision_index = 0;
        this.elapsed_ms = 0;
        this.trail_sprite_base = this.data.info.misc_sprite_base_list[SandFieldPsynergy.ABILITY_KEY_NAME];
        this.trail_sprite_key = this.trail_sprite_base.getSpriteKey(SandFieldPsynergy.ABILITY_KEY_NAME);
        this.trail_animation_key = this.trail_sprite_base.getAnimationKey(SandFieldPsynergy.ABILITY_KEY_NAME, "trail");
    }

    async init() {
        this.close_field_psynergy_window();

        const current_tile = _.last(this.data.map.get_current_tile(this.controllable_char) as Phaser.Tile[]);
        const allow_sand = current_tile?.properties.allow_sand;
        this.prev_collision_index = this.data.map.collision_layer;
        this.melt_into_sand(allow_sand);
    }

    private melt_into_sand(allow_sand: boolean) {
        this.enable_update = true;
        this.stop_casting(false, false);
        this.data.audio.play_se("psynergy/sand_in_1");
        this.controllable_char.set_rotation(true);
        if (this.controllable_char.shadow) {
            this.controllable_char.shadow.visible = false;
        }
        const tween_shift = 8;
        const prev_collision_state = this.controllable_char.toggle_collision(false);
        this.game.add
            .tween(this.controllable_char.body ?? this.controllable_char.sprite)
            .to(
                {
                    y: this.controllable_char.y - tween_shift,
                },
                300,
                Phaser.Easing.Linear.None,
                true
            )
            .onComplete.addOnce(async () => {
                this.controllable_char.set_rotation(false);
                this.enable_update = false;
                await this.controllable_char.face_direction(directions.down);
                await promised_wait(this.game, 250);
                this.data.audio.play_se("psynergy/sand_in_2");
                const animation = this.controllable_char.play(
                    base_actions.SANDING,
                    reverse_directions[directions.down],
                    undefined,
                    undefined,
                    undefined,
                    true,
                    false
                );
                await promised_wait(this.game, 250);
                this.dust_emitter();
                this.data.map.sort_sprites();
                animation.onComplete.addOnce(async () => {
                    this.controllable_char.y += tween_shift;
                    this.controllable_char.toggle_collision(prev_collision_state);
                    if (allow_sand && this.data.map.sand_collision_layer > -1) {
                        this.controllable_char.sand_mode = true;
                        this.controllable_char.sprite.anchor.y = 0.6;
                        this.data.collision.change_map_body(this.data.map.sand_collision_layer);
                        this.finish();
                    } else {
                        this.return_to_normal(() => {
                            this.finish();
                        });
                    }
                });
            });
    }

    async return_to_normal(finish_callback?: () => void) {
        if (
            this.data.map.is_tile_blocked(
                this.controllable_char.tile_pos.x,
                this.controllable_char.tile_pos.y,
                this.prev_collision_index,
                true
            )
        ) {
            return;
        }
        this.controllable_char.misc_busy = true;
        const tween_shift = 8;
        this.controllable_char.y -= tween_shift;
        const prev_collision_state = this.controllable_char.toggle_collision(false);
        this.data.audio.play_se("psynergy/sand_out");
        const animation = this.controllable_char.play(
            base_actions.SANDING,
            reverse_directions[directions.down],
            undefined,
            undefined,
            undefined,
            true,
            true
        );
        this.controllable_char.ignore_play = true;
        await promised_wait(this.game, 250);
        this.dust_emitter();
        this.data.map.sort_sprites();
        animation.onComplete.addOnce(() => {
            this.controllable_char.ignore_play = false;
            this.controllable_char.stop_char(true);
            this.controllable_char.set_direction(directions.down, true);
            this.game.add
                .tween(this.controllable_char.body ?? this.controllable_char.sprite)
                .to(
                    {
                        y: this.controllable_char.y + tween_shift,
                    },
                    45,
                    Phaser.Easing.Linear.None,
                    true
                )
                .onComplete.addOnce(() => {
                    if (this.controllable_char.shadow) {
                        this.controllable_char.shadow.visible = true;
                    }
                    this.controllable_char.toggle_collision(prev_collision_state);
                    this.controllable_char.sand_mode = false;
                    this.controllable_char.reset_anchor();
                    if (this.data.map.collision_layer !== this.prev_collision_index) {
                        this.data.collision.change_map_body(this.prev_collision_index);
                    }
                    this.controllable_char.misc_busy = false;
                    if (finish_callback) {
                        finish_callback();
                    }
                });
        });
    }

    private generate_trail() {
        if (this.elapsed_ms >= SandFieldPsynergy.TRAIL_PERIOD) {
            this.elapsed_ms = 0;
            if (this.controllable_char.current_speed.x === 0 && this.controllable_char.current_speed.y === 0) {
                return;
            }
            const trail_sprite: Phaser.Sprite = this.data.middlelayer_group.create(0, 0, this.trail_sprite_key);
            trail_sprite.send_to_back = true;
            trail_sprite.base_collision_layer = this.data.map.collision_layer;
            trail_sprite.sendToBack();
            trail_sprite.centerX = this.controllable_char.x;
            trail_sprite.centerY = this.controllable_char.y;
            this.trail_sprite_base.setAnimation(trail_sprite, SandFieldPsynergy.ABILITY_KEY_NAME);
            trail_sprite.animations.getAnimation(this.trail_animation_key).onComplete.addOnce(() => {
                trail_sprite.destroy(true);
            });
            trail_sprite.animations.play(this.trail_animation_key);
            this.data.audio.play_se("psynergy/sand_trail");
        }
        this.elapsed_ms += this.game.time.elapsedMS;
    }

    update() {
        if (this.controllable_char?.sand_mode) {
            this.generate_trail();
            return;
        }
        if (this.enable_update) {
            this.controllable_char.update_on_event();
        }
    }

    private async dust_emitter() {
        await this.data.particle_wrapper.start_particles(
            [
                {
                    data: {
                        dust: {
                            image: "dust/dust",
                            animations: {
                                leaf: {
                                    frames: {start: 0, stop: 7, prefix: "dust/spread/", suffix: "", zeroPad: 2},
                                    frameRate: 12,
                                    loop: false,
                                },
                            },
                            lifespan: 670,
                            velocity: {
                                initial: 0.4,
                                radial: {arcStart: 0, arcEnd: 360},
                                control: [
                                    {x: 0, y: 1},
                                    {x: 0.5, y: 1},
                                    {x: 1, y: 0},
                                ],
                            },
                        },
                    },
                    zones: {},
                    emitters: [
                        {
                            x: this.controllable_char.sprite.centerX,
                            y: this.controllable_char.body.y + 8,
                            render_type: "sprite",
                            total: 3,
                            frequency: 100,
                            repeat: 7,
                            emitter_data_key: "dust",
                        },
                    ],
                    emission_finish: 1000,
                    particles_callback: particle => (particle.sprite.send_to_back = true),
                },
            ],
            this.data.middlelayer_group
        );
    }

    private finish() {
        this.reset_map();
        this.controllable_char.casting_psynergy = false;
        this.enable_update = false;
        this.return_to_idle_anim();
    }
}
