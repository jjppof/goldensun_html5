import {base_actions, directions, get_centered_pos_in_px, reverse_directions} from "../utils";
import {event_types, TileEvent} from "./TileEvent";
import * as _ from "lodash";
import {RevealFieldPsynergy} from "../field_abilities/RevealFieldPsynergy";
import {climb_actions} from "./ClimbEvent";
import {ParticlesInfo, ParticlesWrapper} from "../ParticlesWrapper";

export class TeleportEvent extends TileEvent {
    private static readonly DEFAULT_FADE_DURATION: number = 500;
    private static readonly DEFAULT_DOOR_OPEN_SFX: string = "door/open_door";

    private target: string;
    private x_target: number;
    private y_target: number;
    private open_door: boolean;
    private _start_climbing: boolean;
    private _stop_climbing: boolean;
    private dest_collision_layer: number;
    private destination_direction: string;
    private keep_encounter_cumulator: boolean;
    private fade_camera: boolean;
    private skip_checks: boolean;
    private finish_before_fadeout: boolean;
    private skip_map_change_events: boolean;
    private fade_duration: number;
    private finish_callbacks: (() => void)[];
    private fadein_callbacks: (() => void)[];
    private door_settings: {
        replace_map: {
            tile_layer: string;
            from_tile_id: number;
            to_tile_id: number;
            offset_x: number;
            offset_y: number;
            origin_x: number;
            origin_y: number;
        }[];
        door_open_sfx: string;
    };
    private spiral_stair: "up" | "down";
    private on_event_toggle_layers: string[];
    private fade_color: string;
    private dont_change_to_idle: boolean;
    private play_sfx: boolean;
    private custom_sfx: string;
    private particles_info: ParticlesInfo;
    private custom_advance_time: number;
    private custom_advance_shift: number;
    private fade_on_advance: boolean;
    private watery_filter_on_advance: boolean;
    private _prev_alpha_sprite: number;
    private _prev_alpha_shadow: number;

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
        target,
        x_target,
        y_target,
        open_door,
        start_climbing,
        stop_climbing,
        dest_collision_layer,
        destination_direction,
        keep_encounter_cumulator,
        fade_camera,
        skip_checks,
        finish_before_fadeout,
        skip_map_change_events,
        fade_duration,
        door_settings,
        spiral_stair,
        on_event_toggle_layers,
        fade_color,
        dont_change_to_idle,
        play_sfx,
        custom_sfx,
        particles_info,
        custom_advance_time,
        custom_advance_shift,
        fade_on_advance,
        watery_filter_on_advance
    ) {
        super(
            game,
            data,
            event_types.TELEPORT,
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
        this.target = target;
        this.x_target = x_target;
        this.y_target = y_target;
        this.open_door = open_door ?? false;
        this._start_climbing = start_climbing ?? false;
        this._stop_climbing = stop_climbing ?? false;
        this.dest_collision_layer = dest_collision_layer ?? 0;
        this.destination_direction = destination_direction;
        this.keep_encounter_cumulator = keep_encounter_cumulator ?? true;
        this.fade_camera = fade_camera ?? true;
        this.skip_checks = skip_checks ?? false;
        this.finish_before_fadeout = finish_before_fadeout ?? false;
        this.skip_map_change_events = skip_map_change_events ?? false;
        this.fade_duration = fade_duration ?? TeleportEvent.DEFAULT_FADE_DURATION;
        this.finish_callbacks = [];
        this.fadein_callbacks = [];
        this.door_settings = door_settings ?? null;
        this.spiral_stair = spiral_stair ?? null;
        this.fade_color = fade_color ?? "0x0";
        this.dont_change_to_idle = dont_change_to_idle ?? false;
        this.play_sfx = play_sfx ?? true;
        this.custom_sfx = custom_sfx;
        this.particles_info = particles_info;
        this.custom_advance_time = custom_advance_time ?? 400;
        this.custom_advance_shift = custom_advance_shift ?? 15;
        this.fade_on_advance = fade_on_advance ?? false;
        this.watery_filter_on_advance = watery_filter_on_advance ?? false;
        this.on_event_toggle_layers = on_event_toggle_layers
            ? Array.isArray(on_event_toggle_layers)
                ? on_event_toggle_layers
                : [on_event_toggle_layers]
            : [];
    }

    get need_stop_before_start() {
        return this.open_door || this.particles_info;
    }
    get start_climbing() {
        return this._start_climbing;
    }
    get stop_climbing() {
        return this._stop_climbing;
    }

    fire() {
        if (!this.skip_checks && (!this.check_position() || !this.data.hero_movement_allowed())) {
            return;
        }
        this.data.tile_event_manager.on_event = true;
        this.data.hero.teleporting = true;

        if (this.open_door && this.door_settings) {
            this.open_door_teleport();
        } else if (this.start_climbing) {
            this.climbing_teleport();
        } else if (this.spiral_stair) {
            this.spiral_stair_teleport();
        } else if (this.particles_info) {
            this.particles_teleport();
        } else {
            this.toggle_layers();
            if (this.play_sfx) {
                this.data.audio.play_se(this.custom_sfx ?? "door/default");
            }
            this.camera_fade_in();
        }
    }

    private toggle_layers() {
        this.on_event_toggle_layers.forEach(layer => {
            const layer_obj = this.data.map.get_layer(layer);
            if (layer_obj) {
                layer_obj.sprite.visible = !layer_obj.sprite.visible;
            }
        });
    }

    private advance(callback: () => void) {
        const tween_x = this.data.map.tile_width * (this.x + 0.5);
        const tween_y = this.data.hero.sprite.y - this.custom_advance_shift;
        this.game.add.tween(this.data.hero.shadow).to(
            {
                x: tween_x,
                y: tween_y,
            },
            this.custom_advance_time,
            Phaser.Easing.Linear.None,
            true
        );
        if (this.fade_on_advance) {
            this._prev_alpha_sprite = this.data.hero.sprite.alpha;
            if (this.data.hero.shadow) {
                this._prev_alpha_shadow = this.data.hero.shadow.alpha;
            }
            this.game.add.tween(this.data.hero.sprite).to(
                {
                    alpha: 0,
                },
                this.custom_advance_time,
                Phaser.Easing.Quartic.In,
                true
            );
            if (this.data.hero.shadow) {
                this.game.add.tween(this.data.hero.shadow).to(
                    {
                        alpha: 0,
                    },
                    this.custom_advance_time,
                    Phaser.Easing.Quartic.In,
                    true
                );
            }
        }
        if (this.watery_filter_on_advance) {
            const timer = this.game.time.create(true);
            timer.add(this.custom_advance_time >> 1, () => {
                timer.destroy();
                this.data.hero.manage_filter(this.data.hero.watery_filter, true);
            });
            timer.start();
        }
        this.game.add
            .tween(this.data.hero.sprite.body)
            .to(
                {
                    x: tween_x,
                    y: tween_y,
                },
                this.custom_advance_time,
                Phaser.Easing.Linear.None,
                true
            )
            .onComplete.addOnce(() => {
                callback();
            });
    }

    private open_door_teleport() {
        if (!this.data.hero.stop_by_colliding) {
            this.data.tile_event_manager.on_event = false;
            this.data.hero.teleporting = false;
            return;
        }
        this.toggle_layers();
        if (this.play_sfx) {
            this.data.audio.play_se(this.door_settings.door_open_sfx ?? TeleportEvent.DEFAULT_DOOR_OPEN_SFX);
        }
        this.data.hero.play(base_actions.WALK, reverse_directions[directions.up]);
        this.door_settings.replace_map.forEach(replace_info => {
            const from_tile_id = replace_info.from_tile_id + 1;
            const to_tile_id = replace_info.to_tile_id + 1;
            const x =
                (replace_info.origin_x ??
                    Math.floor((this.x * this.data.map.tile_width) / this.data.map.sprite.tileWidth)) +
                replace_info.offset_x;
            const y =
                (replace_info.origin_y ??
                    Math.floor((this.y * this.data.map.tile_height) / this.data.map.sprite.tileHeight)) +
                replace_info.offset_y;
            this.data.map.sprite.replace(from_tile_id, to_tile_id, x, y, 1, 1, replace_info.tile_layer);
        });
        this.game.physics.p2.pause();
        this.advance(this.camera_fade_in.bind(this));
    }

    private particles_teleport() {
        if (!this.data.hero.stop_by_colliding) {
            this.data.tile_event_manager.on_event = false;
            this.data.hero.teleporting = false;
            return;
        }
        this.toggle_layers();
        if (this.play_sfx && this.custom_sfx) {
            this.data.audio.play_se(this.custom_sfx);
        }
        this.data.hero.play(base_actions.WALK, reverse_directions[directions.up]);

        const force_destroy_callbacks = this.data.particle_wrapper.start_particles(
            this.particles_info,
            undefined,
            undefined,
            undefined,
            ParticlesWrapper.expanded_xy_pos_getter.bind(this, this.data)
        ).force_destroy_callbacks;
        this.game.physics.p2.pause();
        this.advance(() => {
            this.set_fadein_callback(() => {
                force_destroy_callbacks.forEach(callback => callback());
            });
            this.camera_fade_in();
        });
    }

    private climbing_teleport() {
        if (!this.data.hero.stop_by_colliding) {
            this.data.tile_event_manager.on_event = false;
            this.data.hero.teleporting = false;
            return;
        }
        this.toggle_layers();
        this.data.map.sprites_sort_paused = true;
        const turn_animation = this.data.hero.play(base_actions.CLIMB, climb_actions.TURN);
        turn_animation.onComplete.addOnce(() => {
            this.data.hero.shadow.visible = false;
            const x_tween = this.data.map.tile_width * (this.x + 0.5);
            const y_tween = this.data.hero.sprite.y + 25;
            this.game.physics.p2.pause();
            this.game.add
                .tween(this.data.hero.sprite.body)
                .to({x: x_tween, y: y_tween}, 300, Phaser.Easing.Linear.None, true);
            const start_animation = this.data.hero.play(base_actions.CLIMB, climb_actions.START);
            start_animation.onComplete.addOnce(() => {
                this.data.hero.sprite.anchor.y -= 0.1;
                this.data.hero.play(base_actions.CLIMB, climb_actions.IDLE);
                this.data.map.sprites_sort_paused = false;
                this.data.hero.climbing = true;
                this.data.hero.change_action(base_actions.CLIMB);
                this.data.hero.idle_climbing = true;
                if (this.play_sfx) {
                    this.data.audio.play_se("door/default");
                }
                this.camera_fade_in();
            });
        });
    }

    private spiral_stair_teleport() {
        this.toggle_layers();
        let animation: string;
        if (this.spiral_stair === "down") {
            animation = "up_to_down_in";
            if (this.play_sfx) {
                this.data.audio.play_se("door/stair_down");
            }
        } else if (this.spiral_stair === "up") {
            animation = "down_to_up_in";
            if (this.play_sfx) {
                this.data.audio.play_se("door/stair_up");
            }
        }
        const get_in_animation = this.data.hero.play(base_actions.STAIR, animation);
        this.data.hero.shadow.visible = false;
        get_in_animation.onComplete.addOnce(() => {
            this.data.hero.sprite.visible = false;
        });
        this.camera_fade_in();
    }

    private camera_fade_in() {
        this.data.hero.stop_char(this.spiral_stair ? false : !this.dont_change_to_idle);

        const on_camera_fade_in = () => {
            this.fadein_callbacks.forEach(callback => callback());
            if (this.fade_on_advance) {
                this.data.hero.sprite.alpha = this._prev_alpha_sprite;
                if (this.data.hero.shadow) {
                    this.data.hero.shadow.alpha = this._prev_alpha_shadow;
                }
                if (this.watery_filter_on_advance) {
                    this.data.hero.manage_filter(this.data.hero.watery_filter, false);
                }
            }
            if (this.data.hero.on_reveal) {
                (this.data.info.field_abilities_list.reveal as RevealFieldPsynergy).finish(true);
            }
            const destination_direction =
                directions[this.destination_direction] !== undefined
                    ? directions[this.destination_direction]
                    : this.get_activation_direction();
            if (this.stop_climbing) {
                this.data.hero.climbing = false;
                this.data.hero.change_action(base_actions.IDLE);
                this.data.hero.idle_climbing = false;
                this.data.hero.set_direction(directions.up);
                this.data.hero.shadow.visible = true;
                this.data.hero.sprite.anchor.y += 0.1;
            }
            if (!this.data.hero.climbing && !this.spiral_stair) {
                this.data.hero.set_direction(destination_direction);
                this.data.hero.play(base_actions.IDLE, reverse_directions[this.data.hero.current_direction]);
            }
            this.game.camera.lerp.setTo(1, 1);
            this.change_map();
        };

        if (this.fade_camera) {
            const fade_color = parseInt(this.fade_color, 16);
            if (
                this.game.camera.fxType === Phaser.Camera.FADE_OUT &&
                this.game.camera.fx.graphicsData[0]?.fillColor === fade_color
            ) {
                const timer = this.game.time.create(true);
                timer.add(this.fade_duration, () => {
                    timer.destroy();
                    on_camera_fade_in();
                });
                timer.start();
            } else {
                this.game.camera.fade(fade_color, this.fade_duration, true);
                this.game.camera.onFadeComplete.addOnce(on_camera_fade_in);
            }
        } else {
            on_camera_fade_in();
        }
    }

    private async change_map() {
        const previous_map_name = this.data.map.name;
        const next_map_name = this.data.info.maps_list[this.target].name;
        const target_collision_layer = this.dest_collision_layer;
        this.data.hero.set_collision_layer(target_collision_layer);
        this.data.map.unset_map();
        const encounter_cumulator =
            this.keep_encounter_cumulator && previous_map_name === next_map_name
                ? this.data.map.encounter_cumulator
                : undefined;
        this.data.map = await this.data.info.maps_list[this.target].mount_map(
            target_collision_layer,
            encounter_cumulator,
            {
                x: this.x_target,
                y: this.y_target,
            },
            previous_map_name === next_map_name ? this.data.map.retreat_data : null
        );
        this.data.map.change_camera_bounds();
        this.data.collision.config_collision_groups(this.data.map);
        this.data.map.config_all_bodies(this.data.map.collision_layer);
        this.data.collision.config_collisions(this.data.map.collision_layer);
        this.game.physics.p2.updateBoundsCollisionGroup();
        if (!this.data.electron_app) {
            this.data.debug.update_debug_physics(this.data.hero.sprite.body.debug);
        }
        this.data.hero.sprite.body.x = get_centered_pos_in_px(this.x_target, this.data.map.tile_width);
        if (this.spiral_stair) {
            this.data.hero.sprite.body.y = this.y_target * this.data.map.tile_height + 1;
        } else {
            this.data.hero.sprite.body.y = get_centered_pos_in_px(this.y_target, this.data.map.tile_height);
        }
        this.game.physics.p2.resume();
        this.camera_fade_out(previous_map_name);
    }

    private camera_fade_out(previous_map_name?: string) {
        this.data.hero.update_shadow();
        this.data.hero.update_tile_position();
        this.data.hero.update_half_crop(true);
        this.data.map.sort_sprites();
        this.data.map.npcs.forEach(npc => npc.update());

        const on_camera_fade_out = () => {
            if (this.data.map.show_map_name && this.data.map.name !== previous_map_name) {
                this.data.map.map_name_window.show();
                this.game.time.events.add(2000, () => {
                    if (this.data.map.map_name_window.open) {
                        this.data.map.map_name_window.close();
                    }
                });
            }

            this.data.camera.reset_lerp();
            this.data.tile_event_manager.on_event = false;
            this.data.hero.teleporting = false;
            this.finish_callbacks.forEach(callback => callback());
            this.finish_callbacks = null;
            if (!this.skip_map_change_events) {
                this.data.map.fire_game_events();
            }
        };

        if (this.fade_camera) {
            this.game.camera.flash(0x0, this.fade_duration, true);
            if (this.finish_before_fadeout) {
                on_camera_fade_out();
            } else {
                if (this.spiral_stair) {
                    let animation: string;
                    if (this.spiral_stair === "down") {
                        animation = "up_to_down_out";
                    } else if (this.spiral_stair === "up") {
                        animation = "down_to_up_out";
                    }
                    this.data.hero.sprite.visible = true;
                    const get_in_animation = this.data.hero.play(base_actions.STAIR, animation);
                    get_in_animation.onComplete.addOnce(() => {
                        this.data.hero.shadow.visible = true;
                        this.data.hero.set_direction(directions.down);
                        this.data.hero.play(base_actions.IDLE, reverse_directions[this.data.hero.current_direction]);
                    });
                }
                this.game.camera.onFlashComplete.addOnce(on_camera_fade_out);
            }
        } else {
            on_camera_fade_out();
        }
    }

    set_fadein_callback(callback: () => void) {
        this.fadein_callbacks.push(callback);
    }

    set_finish_callback(callback: () => void) {
        this.finish_callbacks.push(callback);
    }

    destroy() {
        this.fadein_callbacks = null;
        if (!this.data.hero.teleporting) {
            this.finish_callbacks = null;
        }
        this._origin_interactable_object = null;
        this.deactivate();
    }
}
