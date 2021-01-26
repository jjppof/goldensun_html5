import {GoldenSun} from "../GoldenSun";
import * as numbers from "../magic_numbers";
import {range_360} from "../utils";
import {CameraAngle, DEFAULT_POS_ANGLE} from "./BattleStage";
import * as _ from "lodash";
import {battle_actions, PlayerSprite} from "./PlayerSprite";

export const CAST_STAGE_POSITION = 0.5242024;
export const MIRRORED_CAST_STAGE_POSITION = -0.7151327;

enum positions {
    OVER = "over",
    BETWEEN = "between",
    BEHIND = "behind",
}

type DefaultAttr = {
    start_delay: number | number[];
    to: string | number | number[];
    is_absolute: boolean;
    tween: string;
    duration: number;
    sprite_index?: string | number | number[];
    yoyo?: boolean;
    shift?: number | number[];
    force_stage_update?: boolean;
    direction?: string;
};

type AdvParticleValue =
    | number
    | {min: number; max: number}
    | {
          initial?: number | {min: number; max: number};
          value: number | {min: number; max: number};
          delta: number | {min: number; max: number};
          radial: {arcStart: number; arcEnd: number};
          control: {x: number; y: number}[] | "linear" | "reverse" | "yoyo";
      };

type ParticleObject = {
    lifespan: AdvParticleValue;
    red: AdvParticleValue;
    green: AdvParticleValue;
    blue: AdvParticleValue;
    vx: AdvParticleValue;
    vy: AdvParticleValue;
    ax: AdvParticleValue;
    ay: AdvParticleValue;
    alpha: AdvParticleValue;
    scale: AdvParticleValue;
    rotation: AdvParticleValue;
    image: string | string[];
    frame: string | string[];
    blendMode: string;
    visible: boolean;
    sendToBack: boolean;
    bringToTop: boolean;
    hsv: AdvParticleValue;
    target: {
        x: number;
        y: number;
        zone_key?: string;
        zone?: Phaser.ParticleStorm.Zones.Base;
        speed?: "yoyo" | "reverse" | "linear";
    };
};

enum ZoneTypes {
    RECTANGLE = "rectangle",
    POINT = "point",
    LINE = "line",
    ELLIPSE = "ellipse",
    CIRCLE = "circle",
}

type ParticlesZone = {
    type: ZoneTypes;
    radius: number;
    width: number;
    height: number;
    points: {x: number; y: number}[];
};

type Emitter = {
    emitter_data_key: string;
    render_type: "pixel" | "sprite";
    x: number | string;
    y: number | string;
    position: positions;
    shift_x: number;
    shift_y: number;
    total: number;
    repeat: number;
    frequency: number;
    x_step: number;
    y_step: number;
    delay: {
        start: number;
        step: number;
        visible: boolean;
    };
    particles_display_blend_mode: string;
    render_white_core: boolean;
    zone_key: string;
    random_in_zone: boolean;
    spacing: number | number[];
    force: {x: number; y: number};
    radiate: {
        velocity: number;
        from: number;
        to: number;
    };
    radiateFrom: {
        x: number;
        y: number;
        velocity: number;
    };
    show_trails: boolean;
    trails_clear_factor: number;
    pixel_size: number;
    pixel_reducing_factor: number;
    pixel_is_rect: boolean;
    gravity_well: {
        x: number;
        y: number;
        power: number;
        epsilon: number;
        gravity: number;
    };
    animation: {
        animation_key: string;
        frame_rate: number;
        loop: boolean;
    };
};

export class BattleAnimation {
    public game: Phaser.Game;
    public data: GoldenSun;
    public key_name: string;
    public sprites_keys: {
        key_name: string;
        per_target: boolean;
        position: string;
        count: number;
        trails: boolean;
        trails_factor: number;
        frames_number: number;
    }[];
    public x_sequence: DefaultAttr[] = [];
    public y_sequence: DefaultAttr[] = [];
    public x_ellipse_axis_factor_sequence: DefaultAttr[] = [];
    public y_ellipse_axis_factor_sequence: DefaultAttr[] = [];
    public x_scale_sequence: DefaultAttr[] = [];
    public y_scale_sequence: DefaultAttr[] = [];
    public x_anchor_sequence: DefaultAttr[] = [];
    public y_anchor_sequence: DefaultAttr[] = [];
    public alpha_sequence: DefaultAttr[] = [];
    public rotation_sequence: DefaultAttr[] = [];
    public stage_angle_sequence: DefaultAttr[] = [];
    public hue_angle_sequence: DefaultAttr[] = [];
    public tint_sequence: {
        start_delay: number | number[];
        sprite_index: string | number | number[];
        value: [r: number, g: number, b: number];
    }[] = [];
    public grayscale_sequence: DefaultAttr[] = [];
    public colorize_sequence: {
        start_delay: number | number[];
        sprite_index: string | number | number[];
        value: number;
        colorize_intensity: number;
    }[] = [];
    public custom_filter_sequence: {
        start_delay: number | number[];
        sprite_index: string | number | number[];
        filter: string;
        value: any;
    }[] = [];
    public play_sequence: {
        start_delay: number | number[];
        sprite_index: string | number | number[];
        reverse: boolean;
        frame_rate: number;
        repeat: boolean;
        animation_key: string;
        wait: boolean;
        hide_on_complete: boolean;
    }[] = [];
    public set_frame_sequence: any[] = [];
    public blend_mode_sequence: {
        start_delay: number | number[];
        sprite_index: string | number | number[];
        mode: string;
    }[] = [];
    public particles_sequence: {
        data: {[emitter_data_key: string]: ParticleObject};
        zones: {[zone_key: string]: ParticlesZone};
        emitters: Emitter[];
        emission_finish: number;
    }[];
    public running: boolean;
    public sprites: Phaser.Sprite[];
    public sprites_prev_properties: {
        [key: string]: {
            [property: string]: any;
        };
    };
    public stage_prev_value: number;
    public x0: number;
    public y0: number;
    public caster_sprite: PlayerSprite;
    public targets_sprites: PlayerSprite[];
    public background_sprites: Phaser.Sprite[];
    public group_caster: Phaser.Group;
    public group_enemy: Phaser.Group;
    public super_group: Phaser.Group;
    public back_group: Phaser.Group;
    public front_group: Phaser.Group;
    public ability_sprites_groups: {
        [positions.BEHIND]: Phaser.Group;
        [positions.BETWEEN]: Phaser.Group;
        [positions.OVER]: Phaser.Group;
    };
    public stage_camera: CameraAngle;
    public trails_objs: Phaser.Image[];
    public trails_bmps: Phaser.BitmapData[];
    public caster_filter: any;
    public targets_filter: any;
    public background_filter: any;
    public sprites_filters: any[];
    public promises: Promise<any>[];
    public render_callbacks: {[callback_key: string]: Function};
    public mirrored: boolean;

    //tween type can be 'initial' for first position
    //sprite_index: "targets" is the target, "caster" is the caster, "background" is the background sprite, 0...n is the sprites_key_names index
    //property "to" value can be "targets" or an actual value. In the case of "targets" is the the corresponding property value. In the case of using "targets", a "shift" property is available to be added to the resulting value
    //values in rad can have "direction" set to "clockwise", "counter_clockwise" or "closest" if "absolute" is true
    //in sprite_keys, position can be: "between", "over" or "behind"
    //"duration" set to "instantly" must have the "start_delay" value set as absolute
    constructor(
        game,
        data,
        key_name,
        sprites_keys, //{key_name: string, per_target: bool, position: value}
        x_sequence, //{start_delay: value, sprite_index: index, to: value, is_absolute: bool, tween: type, yoyo: bool, duration: value, shift: value}
        y_sequence, //{start_delay: value, sprite_index: index, to: value, is_absolute: bool, tween: type, yoyo: bool, duration: value, shift: value}
        x_ellipse_axis_factor_sequence, //{start_delay: value, sprite_index: index, to: value, is_absolute: bool, tween: type, yoyo: bool, duration: value, force_stage_update: bool, shift: value}
        y_ellipse_axis_factor_sequence, //{start_delay: value, sprite_index: index, to: value, is_absolute: bool, tween: type, yoyo: bool, duration: value, force_stage_update: bool, shift: value}
        x_scale_sequence, //{start_delay: value, sprite_index: index, to: value, is_absolute: bool, tween: type, yoyo: bool, duration: value, shift: value}
        y_scale_sequence, //{start_delay: value, sprite_index: index, to: value, is_absolute: bool, tween: type, yoyo: bool, duration: value, shift: value}
        x_anchor_sequence, //{start_delay: value, sprite_index: index, to: value, is_absolute: bool, tween: type, yoyo: bool, duration: value, shift: value}
        y_anchor_sequence, //{start_delay: value, sprite_index: index, to: value, is_absolute: bool, tween: type, yoyo: bool, duration: value, shift: value}
        alpha_sequence, //{start_delay: value, sprite_index: index, to: value, is_absolute: bool, tween: type, yoyo: bool, duration: value, shift: value}
        rotation_sequence, //{start_delay: value, sprite_index: index, to: value, is_absolute: bool, tween: type, yoyo: bool, duration: value, direction: value, shift: value}
        stage_angle_sequence, //{start_delay: value, to: value, is_absolute: bool, tween: type, duration: value, direction: value}
        hue_angle_sequence, //{start_delay: value, sprite_index: index, to: value, is_absolute: bool, tween: type, yoyo: bool, duration: value, direction: value, shift: value}
        tint_sequence, //{start_delay: value, sprite_index: index, value: %rgb array}
        grayscale_sequence, //{start_delay: value, sprite_index: index, to: value, is_absolute: bool, tween: type, yoyo: bool, duration: value, shift: value}
        colorize_sequence, //{start_delay: value, sprite_index: index, value: value, colorize_intensity: value}
        custom_filter_sequence, //{start_delay: value, sprite_index: index, filter: key, value: value}
        play_sequence, //{start_delay: value, sprite_index: index, reverse: bool, frame_rate: value, repeat: bool, animation_key: key, wait: bool, hide_on_complete: bool}
        set_frame_sequence, //{start_delay: value, frame: string, sprite_index: index}
        blend_mode_sequence, //{start_delay: value, mode: type, sprite_index: index}
        particles_sequence,
        mirrored
    ) {
        this.game = game;
        this.data = data;
        this.key_name = key_name;
        this.sprites_keys = sprites_keys;
        this.x_sequence = x_sequence === undefined ? [] : x_sequence;
        this.y_sequence = y_sequence === undefined ? [] : y_sequence;
        this.x_ellipse_axis_factor_sequence =
            x_ellipse_axis_factor_sequence === undefined ? [] : x_ellipse_axis_factor_sequence;
        this.y_ellipse_axis_factor_sequence =
            y_ellipse_axis_factor_sequence === undefined ? [] : y_ellipse_axis_factor_sequence;
        this.x_scale_sequence = x_scale_sequence === undefined ? [] : x_scale_sequence;
        this.y_scale_sequence = y_scale_sequence === undefined ? [] : y_scale_sequence;
        this.x_anchor_sequence = x_anchor_sequence === undefined ? [] : x_anchor_sequence;
        this.y_anchor_sequence = y_anchor_sequence === undefined ? [] : y_anchor_sequence;
        this.alpha_sequence = alpha_sequence === undefined ? [] : alpha_sequence;
        this.rotation_sequence = rotation_sequence === undefined ? [] : rotation_sequence;
        this.stage_angle_sequence = stage_angle_sequence === undefined ? [] : stage_angle_sequence;
        this.hue_angle_sequence = hue_angle_sequence === undefined ? [] : hue_angle_sequence;
        this.tint_sequence = tint_sequence === undefined ? [] : tint_sequence;
        this.grayscale_sequence = grayscale_sequence === undefined ? [] : grayscale_sequence;
        this.colorize_sequence = colorize_sequence === undefined ? [] : colorize_sequence;
        this.custom_filter_sequence = custom_filter_sequence === undefined ? [] : custom_filter_sequence;
        this.play_sequence = play_sequence === undefined ? [] : play_sequence;
        this.set_frame_sequence = set_frame_sequence === undefined ? [] : set_frame_sequence;
        this.blend_mode_sequence = blend_mode_sequence === undefined ? [] : blend_mode_sequence;
        this.particles_sequence = particles_sequence === undefined ? [] : particles_sequence;
        this.running = false;
        this.mirrored = mirrored;
        this.render_callbacks = {};
        this.ability_sprites_groups = {
            [positions.BEHIND]: this.game.add.group(),
            [positions.BETWEEN]: this.game.add.group(),
            [positions.OVER]: this.game.add.group(),
        };
    }

    initialize(
        sprite_key,
        caster_sprite,
        targets_sprites,
        group_caster,
        group_enemy,
        super_group,
        stage_camera,
        background_sprites
    ) {
        this.sprites = [];
        this.sprites_prev_properties = {};
        this.stage_prev_value = undefined;
        this.x0 = this.game.camera.x;
        this.y0 = this.game.camera.y;
        this.caster_sprite = caster_sprite;
        this.targets_sprites = targets_sprites;
        this.background_sprites = background_sprites;
        this.group_caster = group_caster;
        this.group_enemy = group_enemy;
        this.super_group = super_group;
        this.stage_camera = stage_camera;
        this.trails_objs = [];
        this.trails_bmps = [];
        if (super_group.getChildIndex(group_caster) < super_group.getChildIndex(group_enemy)) {
            this.back_group = group_caster;
            this.front_group = group_enemy;
        } else {
            this.back_group = group_enemy;
            this.front_group = group_caster;
        }
        super_group.addChild(this.ability_sprites_groups.over);
        super_group.addChildAt(this.ability_sprites_groups.between, super_group.getChildIndex(this.front_group));
        super_group.addChildAt(this.ability_sprites_groups.behind, super_group.getChildIndex(this.back_group));
        if (this.mirrored) {
            Object.values(positions).forEach(position => {
                this.ability_sprites_groups[position].scale.x = -1;
                this.ability_sprites_groups[position].x += numbers.GAME_WIDTH;
            });
        }
        for (let i = 0; i < this.sprites_keys.length; ++i) {
            const sprite_info = this.sprites_keys[i];
            let trail_image: Phaser.Image;
            if (sprite_info.trails) {
                const trail_bitmap_data = this.game.make.bitmapData(numbers.GAME_WIDTH, numbers.GAME_HEIGHT);
                trail_bitmap_data.fill(0, 0, 0, 1);
                trail_bitmap_data.trail_factor = sprite_info.trails_factor;
                trail_image = this.game.make.image(0, 0, trail_bitmap_data);
                trail_image.blendMode = Phaser.blendModes.SCREEN;
                this.trails_bmps.push(trail_bitmap_data);
                this.trails_objs.push(trail_image);
                this.ability_sprites_groups[sprite_info.position].addChild(trail_image);
            }
            if (!sprite_info.per_target) {
                const count = sprite_info.count ? sprite_info.count : 1;
                for (let j = 0; j < count; ++j) {
                    const psy_sprite = this.game.add.sprite(this.x0, this.y0, sprite_key);
                    this.ability_sprites_groups[sprite_info.position].addChild(psy_sprite);
                    const frames = Phaser.Animation.generateFrameNames(
                        sprite_info.key_name + "/",
                        0,
                        sprite_info.frames_number ?? psy_sprite.animations.frameTotal,
                        "",
                        3
                    );
                    psy_sprite.animations.add(sprite_info.key_name, frames);
                    psy_sprite.animations.frameName = frames[0];
                    psy_sprite.data.battle_index = this.sprites.length;
                    psy_sprite.data.trail_image = trail_image;
                    psy_sprite.data.ignore_trim = true;
                    this.sprites.push(psy_sprite);
                }
            }
        }
        this.set_filters();
    }

    set_filters() {
        this.caster_filter = this.game.add.filter("ColorFilters");
        this.targets_filter = this.game.add.filter("ColorFilters");
        this.background_filter = this.game.add.filter("ColorFilters");
        this.sprites_filters = [];
        this.caster_sprite.filters = [this.caster_filter];
        this.targets_sprites.forEach(sprite => {
            sprite.filters = [this.targets_filter];
        });
        this.background_sprites.forEach(sprite => {
            sprite.filters = [this.background_filter];
        });
        this.sprites.forEach((sprite, index) => {
            this.sprites_filters.push(this.game.add.filter("ColorFilters"));
            sprite.filters = [this.sprites_filters[index]];
        });
    }

    play(finish_callback) {
        this.running = true;
        this.promises = [];
        this.play_number_property_sequence(this.x_sequence, "x");
        this.play_number_property_sequence(this.y_sequence, "y");
        this.play_number_property_sequence(this.x_ellipse_axis_factor_sequence, "ellipses_semi_major");
        this.play_number_property_sequence(this.y_ellipse_axis_factor_sequence, "ellipses_semi_minor");
        this.play_number_property_sequence(this.alpha_sequence, "alpha");
        this.play_number_property_sequence(this.rotation_sequence, "rotation");
        this.play_number_property_sequence(this.x_scale_sequence, "scale", "x");
        this.play_number_property_sequence(this.y_scale_sequence, "scale", "y");
        this.play_number_property_sequence(this.x_anchor_sequence, "anchor", "x");
        this.play_number_property_sequence(this.y_anchor_sequence, "anchor", "y");
        this.play_number_property_sequence(this.hue_angle_sequence, "filters", "hue_adjust");
        this.play_number_property_sequence(this.grayscale_sequence, "filters", "gray");
        this.play_sprite_sequence();
        this.play_blend_modes();
        this.play_filter_property(this.tint_sequence, "tint");
        this.play_filter_property(this.colorize_sequence, "colorize", "colorize_intensity");
        this.play_filter_property(this.custom_filter_sequence);
        this.play_stage_angle_sequence();
        this.play_particles();
        this.unmount_animation(finish_callback);
    }

    unmount_animation(finish_callback) {
        Promise.all(this.promises).then(() => {
            this.caster_filter = null;
            this.targets_filter = null;
            this.background_filter = null;
            this.sprites_filters = [];
            this.caster_sprite.filters = undefined;
            this.targets_sprites.forEach(sprite => {
                sprite.filters = undefined;
            });
            this.background_sprites.forEach(sprite => {
                sprite.filters = undefined;
            });
            this.sprites.forEach(sprite => {
                sprite.destroy();
            });
            this.trails_objs.forEach(obj => {
                obj.destroy(true);
            });
            this.trails_bmps.forEach(obj => {
                obj.destroy();
            });
            for (let position in this.ability_sprites_groups) {
                this.ability_sprites_groups[position].destroy(true);
            }
            this.running = false;
            if (finish_callback !== undefined) {
                finish_callback();
            }
        });
    }

    get_sprites(seq, obj_propety?: keyof PlayerSprite) {
        if (obj_propety) {
            if (seq.sprite_index === "background") {
                if (obj_propety === "filters") {
                    return [this.background_filter];
                } else {
                    return this.background_sprites.forEach(sprite => sprite[obj_propety]);
                }
            } else if (seq.sprite_index === "caster") {
                if (obj_propety === "filters") {
                    return [this.caster_filter];
                } else {
                    return [this.caster_sprite[obj_propety]];
                }
            } else if (seq.sprite_index === "targets") {
                if (obj_propety === "filters") {
                    return [this.targets_filter];
                } else {
                    return this.targets_sprites.forEach(sprite => sprite[obj_propety]);
                }
            } else {
                if (obj_propety === "filters") {
                    if (Array.isArray(seq.sprite_index)) {
                        return seq.sprite_index.map(index => this.sprites_filters[index]);
                    } else {
                        return [this.sprites_filters[seq.sprite_index]];
                    }
                } else {
                    if (Array.isArray(seq.sprite_index)) {
                        return seq.sprite_index.map(index => this.sprites[index][obj_propety]);
                    } else {
                        return [this.sprites[seq.sprite_index][obj_propety]];
                    }
                }
            }
        } else {
            if (seq.sprite_index === "background") {
                return this.background_sprites;
            } else if (seq.sprite_index === "caster") {
                return [this.caster_sprite];
            } else if (seq.sprite_index === "targets") {
                return this.targets_sprites;
            } else if (Array.isArray(seq.sprite_index)) {
                return seq.sprite_index.map(index => this.sprites[index]);
            } else {
                return [this.sprites[seq.sprite_index]];
            }
        }
    }

    play_number_property_sequence(sequence, target_property: keyof PlayerSprite, inner_property?) {
        let chained_tweens = {};
        let auto_start_tween = {};
        const property_to_set = inner_property !== undefined ? inner_property : target_property;
        for (let i = 0; i < sequence.length; ++i) {
            const seq = sequence[i];
            if (!(seq.sprite_index in auto_start_tween)) auto_start_tween[seq.sprite_index] = true;
            if (seq.sprite_index in chained_tweens) {
                auto_start_tween[seq.sprite_index] = false;
            }
            let sprites = this.get_sprites(seq, inner_property !== undefined ? target_property : undefined);
            let promises_set = false;
            sprites.forEach((this_sprite, index) => {
                const get_to_value = () => {
                    let uniq_key;
                    if (this_sprite.data && this_sprite.data.hasOwnProperty("battle_index")) {
                        uniq_key = this_sprite.key + "_" + this_sprite.data.battle_index;
                    } else {
                        uniq_key = this_sprite.key + "_" + index; //potential bug
                    }
                    if (this.sprites_prev_properties[uniq_key] === undefined) {
                        this.sprites_prev_properties[uniq_key] = {};
                    }
                    if (this.sprites_prev_properties[uniq_key][property_to_set] === undefined) {
                        this.sprites_prev_properties[uniq_key][property_to_set] = this_sprite[property_to_set];
                    }
                    const seq_to = Array.isArray(seq.to) ? seq.to[index] : seq.to;
                    let to_value = seq_to;
                    if (["targets", "caster"].includes(seq_to)) {
                        let shift = Array.isArray(seq.shift) ? seq.shift[index] : seq.shift;
                        let player_sprite = this.caster_sprite;
                        if (seq_to === "targets") {
                            player_sprite = this.targets_sprites[this.targets_sprites.length >> 1];
                        }
                        to_value = player_sprite[property_to_set] + (shift === undefined ? 0 : shift);
                        if (this.mirrored && property_to_set === "x") {
                            to_value = numbers.GAME_WIDTH - to_value;
                        }
                    }
                    if (["rotation", "hue_adjust"].includes(property_to_set)) {
                        this.sprites_prev_properties[uniq_key][property_to_set] = range_360(
                            this.sprites_prev_properties[uniq_key][property_to_set]
                        );
                        this_sprite[property_to_set] = this.sprites_prev_properties[uniq_key][property_to_set];
                        to_value = BattleAnimation.get_angle_by_direction(
                            this.sprites_prev_properties[uniq_key][property_to_set],
                            seq_to,
                            seq.direction,
                            property_to_set === "rotation"
                        );
                        if (
                            Math.abs(this.sprites_prev_properties[uniq_key][property_to_set] - to_value) >
                            numbers.degree360
                        ) {
                            to_value -= Math.sign(to_value) * numbers.degree360;
                        }
                    }
                    to_value = seq.is_absolute
                        ? to_value
                        : this.sprites_prev_properties[uniq_key][property_to_set] + seq_to;
                    this.sprites_prev_properties[uniq_key][property_to_set] = to_value;
                    return to_value;
                };
                if (seq.tween === "initial") {
                    this_sprite[property_to_set] = get_to_value();
                } else {
                    if (!(seq.sprite_index in chained_tweens)) chained_tweens[seq.sprite_index] = {[index]: []};
                    if (!(index in chained_tweens[seq.sprite_index])) chained_tweens[seq.sprite_index][index] = [];
                    const start_delay = Array.isArray(seq.start_delay) ? seq.start_delay[index] : seq.start_delay;
                    if (seq.duration === "instantly") {
                        let resolve_function;
                        if (!promises_set) {
                            let this_promise = new Promise(resolve => {
                                resolve_function = resolve;
                            });
                            this.promises.push(this_promise);
                            promises_set = true;
                        }
                        this.game.time.events.add(start_delay, () => {
                            this_sprite[property_to_set] = get_to_value();
                            if (seq.force_stage_update) {
                                this.stage_camera.update();
                            }
                            if (seq.is_absolute && ["rotation", "hue_adjust"].includes(property_to_set)) {
                                this_sprite[property_to_set] = range_360(this_sprite[property_to_set]);
                            }
                            if (resolve_function !== undefined) {
                                resolve_function();
                            }
                        });
                    } else {
                        const tween = this.game.add.tween(this_sprite).to(
                            {[property_to_set]: get_to_value},
                            Array.isArray(seq.duration) ? seq.duration[index] : seq.duration,
                            seq.tween.split(".").reduce((p, prop) => p[prop], Phaser.Easing),
                            auto_start_tween[seq.sprite_index],
                            start_delay,
                            0,
                            seq.yoyo === undefined ? false : seq.yoyo,
                            true
                        );
                        if (!promises_set) {
                            let resolve_function;
                            let this_promise = new Promise(resolve => {
                                resolve_function = resolve;
                            });
                            this.promises.push(this_promise);
                            tween.onStart.addOnce(() => {
                                if (seq.force_stage_update) {
                                    this.stage_camera.spining = true;
                                }
                            });
                            tween.onComplete.addOnce(() => {
                                if (seq.is_absolute && ["rotation", "hue_adjust"].includes(property_to_set)) {
                                    this_sprite[property_to_set] = range_360(this_sprite[property_to_set]);
                                }
                                resolve_function();
                                if (seq.force_stage_update) {
                                    this.stage_camera.spining = false;
                                }
                            });
                            promises_set = true;
                        }
                        if (chained_tweens[seq.sprite_index][index].length) {
                            chained_tweens[seq.sprite_index][index][
                                chained_tweens[seq.sprite_index][index].length - 1
                            ].chain(tween);
                        }
                        chained_tweens[seq.sprite_index][index].push(tween);
                    }
                }
            });
        }
    }

    play_sprite_sequence() {
        for (let i = 0; i < this.play_sequence.length; ++i) {
            const play_seq = this.play_sequence[i];
            let sprites = this.get_sprites(play_seq);
            sprites.forEach((sprite: Phaser.Sprite | PlayerSprite, index) => {
                let resolve_function;
                let this_promise = new Promise(resolve => {
                    resolve_function = resolve;
                });
                this.promises.push(this_promise);
                const start_delay = Array.isArray(play_seq.start_delay)
                    ? play_seq.start_delay[index]
                    : play_seq.start_delay;
                this.game.time.events.add(start_delay, () => {
                    let animation_key = play_seq.animation_key;
                    if (sprite instanceof PlayerSprite) {
                        const player = sprite as PlayerSprite;
                        animation_key = player.get_animation_key(
                            play_seq.animation_key as battle_actions,
                            player.position
                        );
                    }
                    const anim = sprite.animations.getAnimation(animation_key);
                    if (anim) {
                        anim.reversed = play_seq.reverse === undefined ? false : play_seq.reverse;
                        anim.stop(true);
                        sprite.animations.play(animation_key, play_seq.frame_rate, play_seq.repeat);
                        if (play_seq.wait) {
                            sprite.animations.currentAnim.onComplete.addOnce(() => {
                                if (play_seq.hide_on_complete) {
                                    sprite.alpha = 0;
                                }
                                resolve_function();
                            });
                        } else {
                            resolve_function();
                        }
                    } else {
                        resolve_function();
                    }
                });
            });
        }
    }

    play_blend_modes() {
        for (let i = 0; i < this.blend_mode_sequence.length; ++i) {
            const blend_mode_seq = this.blend_mode_sequence[i];
            let sprites = this.get_sprites(blend_mode_seq);
            sprites.forEach((sprite, index) => {
                let resolve_function;
                let this_promise = new Promise(resolve => {
                    resolve_function = resolve;
                });
                this.promises.push(this_promise);
                const start_delay = Array.isArray(blend_mode_seq.start_delay)
                    ? blend_mode_seq.start_delay[index]
                    : blend_mode_seq.start_delay;
                this.game.time.events.add(start_delay, () => {
                    switch (blend_mode_seq.mode) {
                        case "screen":
                            sprite.blendMode = PIXI.blendModes.SCREEN;
                            break;
                        case "normal":
                            sprite.blendMode = PIXI.blendModes.NORMAL;
                            break;
                    }
                });
                resolve_function();
            });
        }
    }

    play_filter_property(sequence, property?, ...secondary_properties) {
        for (let i = 0; i < sequence.length; ++i) {
            const filter_seq = sequence[i];
            let sprites = this.get_sprites(filter_seq);
            sprites.forEach((sprite, index) => {
                let resolve_function;
                let this_promise = new Promise(resolve => {
                    resolve_function = resolve;
                });
                this.promises.push(this_promise);
                const start_delay = Array.isArray(filter_seq.start_delay)
                    ? filter_seq.start_delay[index]
                    : filter_seq.start_delay;
                this.game.time.events.add(start_delay, () => {
                    const this_property = filter_seq.filter !== undefined ? filter_seq.filter : property;
                    sprite.filters[0][this_property] = filter_seq.value;
                    secondary_properties.forEach(secondary_property => {
                        sprite.filters[0][secondary_property] = filter_seq[secondary_property];
                    });
                });
                resolve_function();
            });
        }
    }

    play_stage_angle_sequence() {
        let chained_tweens = [];
        for (let i = 0; i < this.stage_angle_sequence.length; ++i) {
            const stage_angle_seq = this.stage_angle_sequence[i];
            let to_value = stage_angle_seq.to as number;
            if (this.stage_prev_value === undefined) {
                this.stage_prev_value = this.stage_camera.rad;
            }
            let is_absolute = stage_angle_seq.is_absolute;
            let direction = stage_angle_seq.direction;
            if (stage_angle_seq.to === "default") {
                to_value = DEFAULT_POS_ANGLE;
                direction = "closest";
                is_absolute = true;
            } else if (stage_angle_seq.to === "cast_position") {
                to_value = this.mirrored ? MIRRORED_CAST_STAGE_POSITION : CAST_STAGE_POSITION;
                direction = "closest";
                is_absolute = true;
            }
            if (is_absolute) {
                this.stage_prev_value = range_360(this.stage_prev_value);
                this.stage_camera.rad = this.stage_prev_value;
                to_value = BattleAnimation.get_angle_by_direction(this.stage_prev_value, to_value, direction, true);
            } else {
                to_value = this.stage_prev_value + (stage_angle_seq.to as number);
            }
            this.stage_prev_value = to_value;
            if (stage_angle_seq.tween === "initial") {
                if (is_absolute) {
                    this.stage_camera.rad = to_value;
                } else {
                    this.stage_camera.rad += to_value;
                }
            } else {
                const tween = this.game.add.tween(this.stage_camera).to(
                    {rad: to_value},
                    stage_angle_seq.duration,
                    stage_angle_seq.tween.split(".").reduce((p, prop) => p[prop], Phaser.Easing),
                    chained_tweens.length === 0,
                    stage_angle_seq.start_delay as number
                );
                let resolve_function;
                let this_promise = new Promise(resolve => {
                    resolve_function = resolve;
                });
                this.promises.push(this_promise);
                tween.onStart.addOnce(() => {
                    this.stage_camera.spining = true;
                });
                tween.onComplete.addOnce(() => {
                    if (is_absolute) {
                        this.stage_camera.rad = range_360(this.stage_camera.rad);
                    }
                    this.stage_camera.spining = false;
                    resolve_function();
                });
                if (chained_tweens.length) {
                    chained_tweens[chained_tweens.length - 1].chain(tween);
                }
                chained_tweens.push(tween);
            }
        }
    }

    get_sprite_xy_pos(
        x: number | string,
        y: number | string,
        shift_x: number,
        shift_y: number
    ): {x: number; y: number} {
        if (x === "caster") {
            x = this.caster_sprite.x;
        } else if (x === "targets") {
            _.mean(this.targets_sprites.map(target => target.x));
        }
        if (y === "caster") {
            y = this.caster_sprite.y;
        } else if (y === "targets") {
            _.mean(this.targets_sprites.map(target => target.y));
        }
        (x as number) += shift_x ? shift_x : 0;
        (y as number) += shift_y ? shift_y : 0;
        return {x: x as number, y: y as number};
    }

    play_particles() {
        for (let i = 0; i < this.particles_sequence.length; ++i) {
            let resolve_function;
            const this_promise = new Promise(resolve => {
                resolve_function = resolve;
            });
            this.promises.push(this_promise);
            const adv_particles_seq = this.particles_sequence[i];

            const zone_objs: {[zone_key: string]: Phaser.ParticleStorm.Zones.Base} = {};
            for (let key in adv_particles_seq.zones) {
                const zone_info = adv_particles_seq.zones[key];
                let zone: Phaser.ParticleStorm.Zones.Base;
                switch (zone_info.type) {
                    case ZoneTypes.CIRCLE:
                        zone = this.data.particle_manager.createCircleZone(zone_info.radius);
                        break;
                    case ZoneTypes.ELLIPSE:
                        zone = this.data.particle_manager.createEllipseZone(zone_info.width, zone_info.height);
                        break;
                    case ZoneTypes.LINE:
                        zone = this.data.particle_manager.createLineZone(
                            zone_info.points[0].x,
                            zone_info.points[0].y,
                            zone_info.points[1].x,
                            zone_info.points[1].y
                        );
                        break;
                    case ZoneTypes.POINT:
                        zone = this.data.particle_manager.createPointZone(zone_info.points[0].x, zone_info.points[0].y);
                        break;
                    case ZoneTypes.RECTANGLE:
                        zone = this.data.particle_manager.createRectangleZone(zone_info.width, zone_info.height);
                        break;
                }
                zone_objs[key] = zone;
            }

            for (let key in adv_particles_seq.data) {
                const data = _.cloneDeep(adv_particles_seq.data[key]);
                if (data.target?.zone_key !== undefined) {
                    data.target.zone = zone_objs[data.target.zone_key];
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
                    emitter_info.render_white_core
                );
                emitter.force.x = emitter_info.force?.x === undefined ? emitter.force.x : emitter_info.force.x;
                emitter.force.y = emitter_info.force?.y === undefined ? emitter.force.y : emitter_info.force.y;

                (emitter.renderer as Phaser.ParticleStorm.Renderer.Pixel).autoClear = !emitter_info.show_trails;
                if (emitter_info.show_trails || emitter_info.pixel_reducing_factor) {
                    const key = `advanced_particles_sequence_${i}_${index}`;
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
                    (emitter.renderer as Phaser.ParticleStorm.Renderer.Pixel).pixelSize =
                        emitter_info.pixel_size === undefined ? 2 : emitter_info.pixel_size;
                    (emitter.renderer as Phaser.ParticleStorm.Renderer.Pixel).useRect =
                        emitter_info.pixel_is_rect === undefined ? false : emitter_info.pixel_is_rect;

                    if (emitter_info.particles_display_blend_mode === "screen") {
                        (emitter.renderer as Phaser.ParticleStorm.Renderer.Pixel).display.blendMode =
                            Phaser.blendModes.SCREEN;
                    }
                    (emitter.renderer as Phaser.ParticleStorm.Renderer.Pixel).resize(
                        numbers.GAME_WIDTH << 1,
                        numbers.GAME_HEIGHT
                    );
                }

                const displays = emitter.addToWorld(this.super_group);
                displays.forEach(display => {
                    if (!display) return;
                    this.ability_sprites_groups[emitter_info.position].addChild(display);
                });
                if (emitter_info.gravity_well) {
                    emitter.createGravityWell(
                        emitter_info.gravity_well.x,
                        emitter_info.gravity_well.y,
                        emitter_info.gravity_well.power,
                        emitter_info.gravity_well.epsilon,
                        emitter_info.gravity_well.gravity
                    );
                }
                const {x, y} = this.get_sprite_xy_pos(
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
                if (emitter_info.animation !== undefined) {
                    const particle_key = adv_particles_seq.data[emitter_info.emitter_data_key].image as string;
                    const particle_sprite_base = this.data.info.misc_sprite_base_list[particle_key];
                    const anim_key = particle_sprite_base.getAnimationKey(
                        particle_key,
                        emitter_info.animation.animation_key
                    );
                    emitter.forEach((particle: Phaser.Sprite) => {
                        particle_sprite_base.setAnimation(particle, particle_key);
                    }, this);
                    emitter.onEmit = new Phaser.Signal();
                    emitter.onEmit.add((emitter: Phaser.ParticleStorm.Emitter, particle: Phaser.Sprite) => {
                        particle.animations.play(
                            anim_key,
                            emitter_info.animation.frame_rate,
                            emitter_info.animation.loop
                        );
                    });
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
    }

    render() {
        this.trails_bmps.forEach(bmp => bmp.fill(0, 0, 0, bmp.trail_factor));
        this.sprites.forEach(sprite => {
            if (!sprite.data.trail_image) return;
            const bm_data = sprite.data.trail_image.key as Phaser.BitmapData;
            bm_data.draw(sprite);
        });
        for (let key in this.render_callbacks) {
            this.render_callbacks[key]();
        }
    }

    //assuming that current angle is between 0 and 360 in rad
    static get_angle_by_direction(incoming_current_angle, incoming_target_angle, direction, fourth_quadrant = false) {
        let this_direction;
        const target_angle = fourth_quadrant ? numbers.degree360 - incoming_target_angle : incoming_target_angle;
        const current_angle = fourth_quadrant ? numbers.degree360 - incoming_current_angle : incoming_current_angle;
        this_direction = target_angle > current_angle ? "counter_clockwise" : "clockwise";
        if (this_direction === direction) {
            return target_angle;
        } else if (direction !== "closest") {
            const times_bigger = Math.abs(incoming_target_angle / numbers.degree360) | 0;
            return (
                incoming_target_angle +
                times_bigger * (incoming_target_angle > incoming_current_angle ? -numbers.degree360 : numbers.degree360)
            );
        } else {
            const range360_target_angle = range_360(incoming_target_angle);
            const towards_target = range_360(range360_target_angle - incoming_current_angle);
            const towards_current = range_360(incoming_current_angle - range360_target_angle);
            const diff = _.round(towards_target - towards_current, 4);
            if (+(range360_target_angle > incoming_current_angle) ^ +(diff > 0) || diff === 0) {
                return range360_target_angle;
            } else {
                return range360_target_angle + (diff > 0 ? -numbers.degree360 : numbers.degree360);
            }
        }
    }
}
