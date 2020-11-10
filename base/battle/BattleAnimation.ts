import * as numbers from "../magic_numbers";
import {range_360} from "../utils";
import {CameraAngle, DEFAULT_POS_ANGLE} from "./BattleStage";

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
    direction?: boolean;
};

export class BattleAnimation {
    public game: Phaser.Game;
    public key_name: string;
    public sprites_keys: {
        key_name: string;
        per_target: boolean;
        position: string;
        count: number;
        trails: boolean;
        trails_mode: string;
        trail_frame_diff: number;
    }[];
    public x_sequence: DefaultAttr[];
    public y_sequence: DefaultAttr[];
    public x_ellipse_axis_factor_sequence: DefaultAttr[];
    public y_ellipse_axis_factor_sequence: DefaultAttr[];
    public x_scale_sequence: DefaultAttr[];
    public y_scale_sequence: DefaultAttr[];
    public x_anchor_sequence: DefaultAttr[];
    public y_anchor_sequence: DefaultAttr[];
    public alpha_sequence: DefaultAttr[];
    public rotation_sequence: DefaultAttr[];
    public stage_angle_sequence: DefaultAttr[];
    public hue_angle_sequence: DefaultAttr[];
    public tint_sequence: {
        start_delay: number | number[];
        sprite_index: string | number | number[];
        value: [r: number, g: number, b: number];
    }[];
    public grayscale_sequence: DefaultAttr[];
    public colorize_sequence: {
        start_delay: number | number[];
        sprite_index: string | number | number[];
        value: number;
        colorize_intensity: number;
    }[];
    public custom_filter_sequence: {
        start_delay: number | number[];
        sprite_index: string | number | number[];
        filter: string;
        value: any;
    }[];
    public play_sequence: {
        start_delay: number | number[];
        sprite_index: string | number | number[];
        reverse: boolean;
        frame_rate: number;
        repeat: boolean;
        animation_key: string;
        wait: boolean;
        hide_on_complete: boolean;
    }[];
    public set_frame_sequence: any;
    public blend_mode_sequence: {
        start_delay: number | number[];
        sprite_index: string | number | number[];
        mode: string;
    }[];
    public is_party_animation: boolean;
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
    public caster_sprite: Phaser.Sprite;
    public targets_sprites: Phaser.Sprite[];
    public background_sprites: Phaser.Sprite[];
    public group_caster: Phaser.Group;
    public group_enemy: Phaser.Group;
    public super_group: Phaser.Group;
    public stage_camera: CameraAngle;
    public trails_objs: (Phaser.RenderTexture | Phaser.Sprite)[];
    public caster_filter: any;
    public targets_filter: any;
    public background_filter: any;
    public sprites_filters: any[];
    public promises: Promise<any>[];

    //tween type can be 'initial' for first position
    //sprite_index: "targets" is the target, "caster" is the caster, "background" is the background sprite, 0...n is the sprites_key_names index
    //property "to" value can be "target" or an actual value. In the case of "target" is the the corresponding property value. In the case of using "target", a "shift" property is available to be added to the resulting value
    //values in rad can have "direction" set to "clockwise", "counter_clockwise" or "closest" if "absolute" is true
    //in sprite_keys, position can be: "between", "over" or "behind"
    //"duration" set to "instantly" must have the "start_delay" value set as absolute
    constructor(
        game,
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
        is_party_animation
    ) {
        this.game = game;
        this.key_name = key_name;
        this.sprites_keys = sprites_keys;
        this.x_sequence = x_sequence;
        this.y_sequence = y_sequence;
        this.x_ellipse_axis_factor_sequence = x_ellipse_axis_factor_sequence;
        this.y_ellipse_axis_factor_sequence = y_ellipse_axis_factor_sequence;
        this.x_scale_sequence = x_scale_sequence;
        this.y_scale_sequence = y_scale_sequence;
        this.x_anchor_sequence = x_anchor_sequence;
        this.y_anchor_sequence = y_anchor_sequence;
        this.alpha_sequence = alpha_sequence;
        this.rotation_sequence = rotation_sequence;
        this.stage_angle_sequence = stage_angle_sequence;
        this.hue_angle_sequence = hue_angle_sequence;
        this.tint_sequence = tint_sequence;
        this.grayscale_sequence = grayscale_sequence;
        this.colorize_sequence = colorize_sequence;
        this.custom_filter_sequence = custom_filter_sequence;
        this.play_sequence = play_sequence;
        this.set_frame_sequence = set_frame_sequence;
        this.blend_mode_sequence = blend_mode_sequence;
        this.is_party_animation = is_party_animation;
        this.running = false;
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
        for (let i = 0; i < this.sprites_keys.length; ++i) {
            const sprite_info = this.sprites_keys[i];
            let trails_info;
            if (sprite_info.trails) {
                trails_info = this.initialize_trail_textures(sprite_info.trail_frame_diff, sprite_info.trails_mode);
            }
            if (!sprite_info.per_target) {
                const count = sprite_info.count ? sprite_info.count : 1;
                for (let j = 0; j < count; ++j) {
                    const psy_sprite = this.game.add.sprite(this.x0, this.y0, sprite_key);
                    let back_group, front_group;
                    if (super_group.getChildIndex(group_caster) < super_group.getChildIndex(group_enemy)) {
                        back_group = group_caster;
                        front_group = group_enemy;
                    } else {
                        back_group = group_enemy;
                        front_group = group_caster;
                    }
                    if (sprite_info.position === "over") {
                        super_group.addChild(psy_sprite);
                    } else if (sprite_info.position === "between") {
                        super_group.addChildAt(psy_sprite, super_group.getChildIndex(front_group));
                    } else if (sprite_info.position === "behind") {
                        super_group.addChildAt(psy_sprite, super_group.getChildIndex(back_group));
                    }
                    const frames = Phaser.Animation.generateFrameNames(
                        sprite_info.key_name + "/",
                        1,
                        psy_sprite.animations.frameTotal,
                        "",
                        3
                    );
                    psy_sprite.animations.add(sprite_info.key_name, frames);
                    psy_sprite.animations.frameName = frames[0];
                    psy_sprite.data.battle_index = this.sprites.length;
                    psy_sprite.data.trails = sprite_info.trails;
                    psy_sprite.data.trails_info = trails_info;
                    if (sprite_info.trails) {
                        psy_sprite.data.x_history = new Array(trails_info.frame_diff + 1).fill(
                            psy_sprite.x - this.game.camera.x
                        );
                        psy_sprite.data.y_history = new Array(trails_info.frame_diff + 1).fill(
                            psy_sprite.y - this.game.camera.y
                        );
                    }
                    this.sprites.push(psy_sprite);
                }
            }
        }
        this.set_filters();
    }

    initialize_trail_textures(frame_diff, blend_mode) {
        switch (blend_mode) {
            case "screen":
                blend_mode = PIXI.blendModes.SCREEN;
                break;
            case "normal":
                blend_mode = PIXI.blendModes.NORMAL;
                break;
        }
        const trail_texture = this.game.add.renderTexture(numbers.GAME_WIDTH, numbers.GAME_HEIGHT);
        let trail_sprite = this.game.add.sprite(this.game.camera.x, this.game.camera.y, trail_texture);
        trail_sprite.blendMode = blend_mode;
        trail_sprite.alpha = 0.6;
        const trail_texture_2 = this.game.add.renderTexture(numbers.GAME_WIDTH, numbers.GAME_HEIGHT);
        let trail_sprite_2 = this.game.add.sprite(this.game.camera.x, this.game.camera.y, trail_texture_2);
        trail_sprite_2.blendMode = blend_mode;
        trail_sprite_2.alpha = 0.4;
        this.trails_objs = this.trails_objs.concat(trail_texture, trail_texture_2, trail_sprite, trail_sprite_2);
        return {
            texture_1: trail_texture,
            texture_2: trail_texture_2,
            frame_diff: frame_diff,
        };
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
        this.play_number_property_sequence(this.x_scale_sequence, "x", "scale");
        this.play_number_property_sequence(this.y_scale_sequence, "y", "scale");
        this.play_number_property_sequence(this.x_anchor_sequence, "x", "anchor");
        this.play_number_property_sequence(this.y_anchor_sequence, "y", "anchor");
        this.play_number_property_sequence(this.hue_angle_sequence, "hue_adjust", "filter");
        this.play_number_property_sequence(this.grayscale_sequence, "gray", "filter");
        this.play_sprite_sequence();
        this.play_blend_modes();
        this.play_filter_property(this.tint_sequence, "tint");
        this.play_filter_property(this.colorize_sequence, "colorize", "colorize_intensity");
        this.play_filter_property(this.custom_filter_sequence);
        this.play_stage_angle_sequence();
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
            this.running = false;
            if (finish_callback !== undefined) {
                finish_callback();
            }
        });
    }

    get_sprites(seq, inner_property?) {
        if (inner_property) {
            if (seq.sprite_index === "background") {
                if (inner_property === "filter") {
                    return [this.background_filter];
                } else {
                    return this.background_sprites.forEach(sprite => sprite[inner_property]);
                }
            } else if (seq.sprite_index === "caster") {
                if (inner_property === "filter") {
                    return [this.caster_filter];
                } else {
                    return [this.caster_sprite[inner_property]];
                }
            } else if (seq.sprite_index === "targets") {
                if (inner_property === "filter") {
                    return [this.targets_filter];
                } else {
                    return this.targets_sprites.forEach(sprite => sprite[inner_property]);
                }
            } else {
                if (inner_property === "filter") {
                    if (Array.isArray(seq.sprite_index)) {
                        return seq.sprite_index.map(index => this.sprites_filters[index]);
                    } else {
                        return [this.sprites_filters[seq.sprite_index]];
                    }
                } else {
                    if (Array.isArray(seq.sprite_index)) {
                        return seq.sprite_index.map(index => this.sprites[index][inner_property]);
                    } else {
                        return [this.sprites[seq.sprite_index][inner_property]];
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

    play_number_property_sequence(sequence, target_property, inner_property?) {
        let chained_tweens = {};
        let auto_start_tween = {};
        for (let i = 0; i < sequence.length; ++i) {
            const seq = sequence[i];
            if (!(seq.sprite_index in auto_start_tween)) auto_start_tween[seq.sprite_index] = true;
            if (seq.sprite_index in chained_tweens) {
                auto_start_tween[seq.sprite_index] = false;
            }
            let sprites = this.get_sprites(seq, inner_property);
            let promises_set = false;
            sprites.forEach((this_sprite, index) => {
                let uniq_key;
                if (this_sprite.data) {
                    uniq_key = this_sprite.key + "_" + this_sprite.data.battle_index;
                } else {
                    uniq_key = index; //potential bug
                }
                if (this.sprites_prev_properties[uniq_key] === undefined) {
                    this.sprites_prev_properties[uniq_key] = {};
                }
                if (this.sprites_prev_properties[uniq_key][target_property] === undefined) {
                    this.sprites_prev_properties[uniq_key][target_property] = this_sprite[target_property];
                }
                const seq_to = Array.isArray(seq.to) ? seq.to[index] : seq.to;
                let to_value = seq_to;
                if (seq_to === "target") {
                    const shift = Array.isArray(seq.shift) ? seq.shift[index] : seq.shift;
                    to_value =
                        this.targets_sprites[this.targets_sprites.length >> 1][target_property] +
                        (shift === undefined ? 0 : shift);
                }
                if (["rotation", "hue_adjust"].includes(target_property)) {
                    this.sprites_prev_properties[uniq_key][target_property] = range_360(
                        this.sprites_prev_properties[uniq_key][target_property]
                    );
                    this_sprite[target_property] = this.sprites_prev_properties[uniq_key][target_property];
                    to_value = BattleAnimation.get_angle_by_direction(
                        this.sprites_prev_properties[uniq_key][target_property],
                        seq_to,
                        seq.direction,
                        target_property === "rotation"
                    );
                    if (
                        Math.abs(this.sprites_prev_properties[uniq_key][target_property] - to_value) > numbers.degree360
                    ) {
                        to_value -= Math.sign(to_value) * numbers.degree360;
                    }
                }
                to_value = seq.is_absolute
                    ? to_value
                    : this.sprites_prev_properties[uniq_key][target_property] + seq_to;
                if (!seq.yoyo) {
                    this.sprites_prev_properties[uniq_key][target_property] = to_value;
                }
                if (seq.tween === "initial") {
                    this_sprite[target_property] = to_value;
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
                            this_sprite[target_property] = to_value;
                            if (seq.force_stage_update) {
                                this.stage_camera.update();
                            }
                            if (seq.is_absolute && ["rotation", "hue_adjust"].includes(target_property)) {
                                this_sprite[target_property] = range_360(this_sprite[target_property]);
                            }
                            if (resolve_function !== undefined) {
                                resolve_function();
                            }
                        });
                    } else {
                        const tween = this.game.add.tween(this_sprite).to(
                            {[target_property]: to_value},
                            Array.isArray(seq.duration) ? seq.duration[index] : seq.duration,
                            seq.tween.split(".").reduce((p, prop) => p[prop], Phaser.Easing),
                            auto_start_tween[seq.sprite_index],
                            start_delay,
                            0,
                            seq.yoyo === undefined ? false : seq.yoyo
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
                                if (seq.is_absolute && ["rotation", "hue_adjust"].includes(target_property)) {
                                    this_sprite[target_property] = range_360(this_sprite[target_property]);
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
            sprites.forEach((sprite, index) => {
                let resolve_function;
                let this_promise = new Promise(resolve => {
                    resolve_function = resolve;
                });
                this.promises.push(this_promise);
                const start_delay = Array.isArray(play_seq.start_delay)
                    ? play_seq.start_delay[index]
                    : play_seq.start_delay;
                this.game.time.events.add(start_delay, () => {
                    if (play_seq.reverse) {
                        sprite.animations.getAnimation(play_seq.animation_key).reversed = true;
                    } else {
                        sprite.animations.getAnimation(play_seq.animation_key).reversed = false;
                    }
                    sprite.animations.play(play_seq.animation_key, play_seq.frame_rate, play_seq.repeat);
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
            let to_value;
            if (this.stage_prev_value === undefined) {
                this.stage_prev_value = this.stage_camera.rad;
            }
            if (stage_angle_seq.to === "default") {
                to_value = DEFAULT_POS_ANGLE;
            } else {
                if (stage_angle_seq.is_absolute) {
                    this.stage_prev_value = range_360(this.stage_prev_value);
                    this.stage_camera.rad = this.stage_prev_value;
                    to_value = BattleAnimation.get_angle_by_direction(
                        this.stage_prev_value,
                        stage_angle_seq.to,
                        stage_angle_seq.direction,
                        true
                    );
                    if (Math.abs(this.stage_prev_value - to_value) > numbers.degree360) {
                        to_value -= Math.sign(to_value) * numbers.degree360;
                    }
                } else {
                    to_value = this.stage_prev_value + (stage_angle_seq.to as number);
                }
            }
            this.stage_prev_value = to_value;
            if (stage_angle_seq.tween === "initial") {
                if (stage_angle_seq.is_absolute) {
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
                    if (stage_angle_seq.is_absolute) {
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

    render() {
        let clear = true;
        this.sprites.forEach(sprite => {
            if (!sprite.data.trails) return;
            sprite.data.x_history.unshift(sprite.x);
            sprite.data.y_history.unshift(sprite.y);
            if (clear) {
                sprite.data.trails_info.texture_1.clear();
                sprite.data.trails_info.texture_2.clear();
                clear = false;
            }
            sprite.data.trails_info.texture_1.renderXY(
                sprite,
                sprite.data.x_history[sprite.data.trails_info.frame_diff >> 1],
                sprite.data.y_history[sprite.data.trails_info.frame_diff >> 1]
            );
            sprite.data.trails_info.texture_2.renderXY(
                sprite,
                sprite.data.x_history.pop(),
                sprite.data.y_history.pop()
            );
        });
    }

    static get_angle_by_direction(current_angle, target_angle, direction, fourth_quadrant = false) {
        let this_direction;
        if (fourth_quadrant) {
            target_angle = numbers.degree360 - target_angle;
            this_direction = target_angle < current_angle ? "counter_clockwise" : "clockwise";
        } else {
            this_direction = target_angle > current_angle ? "counter_clockwise" : "clockwise";
        }
        if (this_direction === direction) {
            return target_angle;
        }
        const diff = (target_angle % numbers.degree360) - (current_angle % numbers.degree360);
        const shift = Math.sign(diff) * numbers.degree360 - diff;
        const new_target = (current_angle % numbers.degree360) - shift;
        if (direction === "closest") {
            let target_delta, new_target_delta;
            if (new_target > 0) {
                new_target_delta = new_target - range_360(current_angle);
                target_delta = numbers.degree360 - new_target_delta;
            } else {
                target_delta = target_angle - range_360(current_angle);
                new_target_delta = numbers.degree360 - target_delta;
            }
            if (Math.abs(target_delta) < Math.abs(new_target_delta)) {
                return target_angle;
            } else {
                return new_target;
            }
        }
        return new_target;
    }
}
