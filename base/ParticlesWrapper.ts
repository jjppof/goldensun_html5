import {battle_positions} from "./battle/BattleAnimation";
import {GoldenSun} from "GoldenSun";
import {GAME_HEIGHT, GAME_WIDTH} from "./magic_numbers";
import {elements, element_colors_in_battle, hex2rgb} from "./utils";
import * as _ from "lodash";

export type AdvParticleValue =
    | number
    | {min: number; max: number}
    | {
          initial?: number | {min: number; max: number};
          value?: number | {min: number; max: number};
          delta?: number | {min: number; max: number};
          radial?: {arcStart: number; arcEnd: number};
          control?: {x: number; y: number}[] | "linear" | "reverse" | "yoyo";
      };

export type ParticleObject = {
    lifespan?: AdvParticleValue;
    color?: string;
    red?: AdvParticleValue;
    green?: AdvParticleValue;
    blue?: AdvParticleValue;
    vx?: AdvParticleValue;
    vy?: AdvParticleValue;
    velocity?: AdvParticleValue;
    ax?: AdvParticleValue;
    ay?: AdvParticleValue;
    alpha?: AdvParticleValue;
    scale?: AdvParticleValue;
    rotation?: AdvParticleValue;
    image?: string | string[];
    frame?: string | string[];
    animations?: any;
    blendMode?: string;
    visible?: boolean;
    sendToBack?: boolean;
    bringToTop?: boolean;
    hsv?: AdvParticleValue;
    target?: {
        x: number;
        y: number;
        shift_x: number;
        shift_y: number;
        zone_key?: string;
        zone?: Phaser.ParticleStorm.Zones.Base;
        speed?: "yoyo" | "reverse" | "linear";
    };
};

export enum zone_types {
    RECTANGLE = "rectangle",
    POINT = "point",
    LINE = "line",
    ELLIPSE = "ellipse",
    CIRCLE = "circle",
}

export type ParticlesZone = {
    type: zone_types;
    radius: number;
    width: number;
    height: number;
    points: {
        x: number;
        y: number;
        shift_x: number;
        shift_y: number;
    }[];
};

export type Emitter = {
    emitter_data_key?: string;
    render_type?: "pixel" | "sprite";
    x?: number | string;
    y?: number | string;
    position?: battle_positions;
    shift_x?: number;
    shift_y?: number;
    total?: number;
    repeat?: number;
    frequency?: number;
    x_step?: number;
    y_step?: number;
    delay?: {
        start: number;
        step: number;
        visible: boolean;
    };
    particles_display_blend_mode?: string;
    render_white_core?: boolean;
    core_custom_color?: string;
    zone_key?: string;
    random_in_zone?: boolean;
    spacing?: number | number[];
    force?: {x: number; y: number};
    radiate?: {
        velocity: number;
        from: number;
        to: number;
    };
    radiateFrom?: {
        x: number;
        y: number;
        velocity: number;
    };
    show_trails?: boolean;
    trails_clear_factor?: number;
    pixel_size?: number;
    pixel_reducing_factor?: number;
    pixel_is_rect?: boolean;
    gravity_well?: {
        x: number | string;
        y: number | string;
        shift_x: number;
        shift_y: number;
        power: number;
        epsilon: number;
        gravity: number;
    };
    animation?: {
        animation_key: string;
        frame_rate: number;
        loop: boolean;
    };
};

export type ParticlesInfo = {
    data: {[emitter_data_key: string]: ParticleObject};
    zones: {[zone_key: string]: ParticlesZone};
    emitters: Emitter[];
    emission_finish: number;
    particles_callback?: (particle: Phaser.ParticleStorm.Particle) => void;
}[];

export class ParticlesWrapper {
    private game: Phaser.Game;
    private data: GoldenSun;
    private render_callbacks: {[callback_key: string]: Function};

    constructor(game: Phaser.Game, data: GoldenSun) {
        this.game = game;
        this.data = data;
        this.render_callbacks = {};
    }

    start_particles(
        particles_info: ParticlesInfo,
        particles_group: Phaser.Group,
        inner_groups?: {
            [battle_positions.BEHIND]: Phaser.Group;
            [battle_positions.BETWEEN]: Phaser.Group;
            [battle_positions.OVER]: Phaser.Group;
        },
        element?: elements,
        xy_pos_getter?: (
            x: number | string,
            y: number | string,
            shift_x: number,
            shift_y: number
        ) => {x: number; y: number}
    ) {
        const promises: Promise<void>[] = [];
        xy_pos_getter =
            xy_pos_getter ??
            ((x: number, y: number, shift_x: number, shift_y: number) => {
                x += shift_x ?? 0;
                y += shift_y ?? 0;
                return {x: x, y: y};
            });

        for (let i = 0; i < particles_info.length; ++i) {
            let resolve_function;
            const this_promise = new Promise<void>(resolve => {
                resolve_function = resolve;
            });
            promises.push(this_promise);
            const adv_particles_seq = particles_info[i];

            const zone_objs: {[zone_key: string]: Phaser.ParticleStorm.Zones.Base} = {};
            for (let key in adv_particles_seq.zones) {
                const zone_info = adv_particles_seq.zones[key];
                let zone: Phaser.ParticleStorm.Zones.Base;
                switch (zone_info.type) {
                    case zone_types.CIRCLE:
                        zone = this.data.particle_manager.createCircleZone(zone_info.radius);
                        break;
                    case zone_types.ELLIPSE:
                        zone = this.data.particle_manager.createEllipseZone(zone_info.width, zone_info.height);
                        break;
                    case zone_types.LINE:
                        zone = this.data.particle_manager.createLineZone(
                            zone_info.points[0].x,
                            zone_info.points[0].y,
                            zone_info.points[1].x,
                            zone_info.points[1].y
                        );
                        break;
                    case zone_types.POINT:
                        const {x, y} = xy_pos_getter(
                            zone_info.points[0].x,
                            zone_info.points[0].y,
                            zone_info.points[0].shift_x,
                            zone_info.points[0].shift_y
                        );
                        zone = this.data.particle_manager.createPointZone(x, y);
                        break;
                    case zone_types.RECTANGLE:
                        zone = this.data.particle_manager.createRectangleZone(zone_info.width, zone_info.height);
                        break;
                }
                zone_objs[key] = zone;
            }

            for (let key in adv_particles_seq.data) {
                const data = _.cloneDeep(adv_particles_seq.data[key]);
                if (data.target) {
                    if (data.target.zone_key !== undefined) {
                        data.target.zone = zone_objs[data.target.zone_key];
                    }
                    if (data.target.hasOwnProperty("x") && data.target.hasOwnProperty("y")) {
                        const {x, y} = xy_pos_getter(
                            data.target.x,
                            data.target.y,
                            data.target.shift_x,
                            data.target.shift_y
                        );
                        data.target.x = x;
                        data.target.y = y;
                    }
                }
                if (data.color) {
                    let rgb: ReturnType<typeof hex2rgb>;
                    if (data.color === "element" && element) {
                        rgb = hex2rgb(element_colors_in_battle[element]);
                    } else {
                        rgb = hex2rgb(data.color);
                    }
                    data.red = rgb.r;
                    data.green = rgb.g;
                    data.blue = rgb.b;
                }
                this.data.particle_manager.addData(key, data);
            }

            const render_callbacks = [];
            const emitters: Phaser.ParticleStorm.Emitter[] = [];
            adv_particles_seq.emitters.forEach((emitter_info, index) => {
                const emitter = this.data.particle_manager.createEmitter(
                    emitter_info.render_type,
                    undefined,
                    undefined,
                    emitter_info.render_white_core,
                    emitter_info.core_custom_color
                );
                emitter.force.x = emitter_info.force?.x ?? emitter.force.x;
                emitter.force.y = emitter_info.force?.y ?? emitter.force.y;

                (emitter.renderer as Phaser.ParticleStorm.Renderer.Pixel).autoClear = !emitter_info.show_trails;
                if (emitter_info.show_trails || emitter_info.pixel_reducing_factor) {
                    const key = `advanced_particles_sequence_${i}_${index}_${emitter_info.emitter_data_key}`;
                    this.render_callbacks[key] = () => {
                        if (emitter_info.render_type === "pixel") {
                            if (emitter_info.show_trails) {
                                (emitter.renderer as Phaser.ParticleStorm.Renderer.Pixel).clear(
                                    emitter_info.trails_clear_factor
                                );
                            }
                            if (emitter_info.pixel_reducing_factor !== undefined) {
                                if (!(emitter as any)._delay.waiting) {
                                    (emitter.renderer as Phaser.ParticleStorm.Renderer.Pixel).pixelSize -=
                                        emitter_info.pixel_reducing_factor;
                                }
                            }
                        }
                    };
                    render_callbacks.push(key);
                }

                if (emitter_info.render_type === "pixel") {
                    (emitter.renderer as Phaser.ParticleStorm.Renderer.Pixel).pixelSize = emitter_info.pixel_size ?? 2;
                    (emitter.renderer as Phaser.ParticleStorm.Renderer.Pixel).useRect =
                        emitter_info.pixel_is_rect ?? false;

                    if (emitter_info.particles_display_blend_mode === "screen") {
                        (emitter.renderer as Phaser.ParticleStorm.Renderer.Pixel).display.blendMode =
                            Phaser.blendModes.SCREEN;
                    }
                    (emitter.renderer as Phaser.ParticleStorm.Renderer.Pixel).resize(GAME_WIDTH << 1, GAME_HEIGHT);
                }

                const displays = emitter.addToWorld(particles_group);
                if (inner_groups) {
                    displays.forEach(display => {
                        if (!display) return;
                        inner_groups[emitter_info.position].addChild(display);
                    });
                }
                if (emitter_info.gravity_well) {
                    const {x, y} = xy_pos_getter(
                        emitter_info.gravity_well.x,
                        emitter_info.gravity_well.y,
                        emitter_info.gravity_well.shift_x,
                        emitter_info.gravity_well.shift_y
                    );
                    emitter.createGravityWell(
                        x,
                        y,
                        emitter_info.gravity_well.power,
                        emitter_info.gravity_well.epsilon,
                        emitter_info.gravity_well.gravity
                    );
                }
                const {x, y} = xy_pos_getter(
                    emitter_info.x,
                    emitter_info.y,
                    emitter_info.shift_x,
                    emitter_info.shift_y
                );
                emitter.emit(emitter_info.emitter_data_key, x, y, {
                    ...(emitter_info.total !== undefined && {total: emitter_info.total}),
                    ...(emitter_info.repeat !== undefined && {repeat: emitter_info.repeat}),
                    ...(emitter_info.frequency !== undefined && {frequency: emitter_info.frequency}),
                    ...(emitter_info.x_step !== undefined && {xStep: emitter_info.x_step}),
                    ...(emitter_info.y_step !== undefined && {yStep: emitter_info.y_step}),
                    ...(emitter_info.delay !== undefined && {delay: emitter_info.delay}),
                    ...(emitter_info.zone_key !== undefined && {zone: zone_objs[emitter_info.zone_key]}),
                    ...(emitter_info.random_in_zone !== undefined && {random: emitter_info.random_in_zone}),
                    ...(emitter_info.spacing !== undefined && {spacing: emitter_info.spacing}),
                    ...(emitter_info.radiate !== undefined && {radiate: emitter_info.radiate}),
                    ...(emitter_info.radiateFrom !== undefined && {radiateFrom: emitter_info.radiateFrom}),
                });
                if (adv_particles_seq.particles_callback) {
                    emitter.forEach((particle: Phaser.ParticleStorm.Particle) => {
                        adv_particles_seq.particles_callback(particle);
                    }, this);
                }
                if (emitter_info.animation !== undefined) {
                    const particle_key = adv_particles_seq.data[emitter_info.emitter_data_key].image as string;
                    const particle_sprite_base = this.data.info.misc_sprite_base_list[particle_key];
                    const anim_key = particle_sprite_base.getAnimationKey(
                        particle_key,
                        emitter_info.animation.animation_key
                    );
                    emitter.forEach((particle: Phaser.ParticleStorm.Particle) => {
                        particle_sprite_base.setAnimation(particle.sprite, particle_key);
                    }, this);
                    emitter.onEmit = new Phaser.Signal();
                    emitter.onEmit.add(
                        (emitter: Phaser.ParticleStorm.Emitter, particle: Phaser.ParticleStorm.Particle) => {
                            particle.sprite.animations.play(
                                anim_key,
                                emitter_info.animation.frame_rate,
                                emitter_info.animation.loop
                            );
                        }
                    );
                }
                emitters.push(emitter);
            });

            this.game.time.events.add(adv_particles_seq.emission_finish, () => {
                render_callbacks.forEach(key => {
                    delete this.render_callbacks[key];
                });
                emitters.forEach(emitter => {
                    this.data.particle_manager.removeEmitter(emitter);
                    if (emitter.onEmit) {
                        emitter.onEmit.removeAll();
                    }
                    emitter.destroy();
                });
                for (let key in adv_particles_seq.data) {
                    this.data.particle_manager.clearData(key);
                }
                resolve_function();
            });
        }

        return promises;
    }

    render() {
        for (let key in this.render_callbacks) {
            this.render_callbacks[key]();
        }
    }
}
