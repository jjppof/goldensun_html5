import {EngineFilters, GoldenSun} from "../GoldenSun";
import * as numbers from "../magic_numbers";
import {elements, element_colors_in_battle, hex2rgb, range_360} from "../utils";
import {BattleStage, DEFAULT_POS_ANGLE} from "./BattleStage";
import * as _ from "lodash";
import {battle_actions, PlayerSprite} from "./PlayerSprite";
import {ParticlesInfo} from "../ParticlesWrapper";

export const CAST_STAGE_POSITION = 0.5242024;
export const MIRRORED_CAST_STAGE_POSITION = -0.7151327;

export enum battle_positions {
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
    shift_direction?: ("in_center" | "out_center") | ("in_center" | "out_center")[];
    direction?: string;
};

type GeneralFilterAttr = {
    start_delay: number | number[];
    sprite_index: string | number | number[];
    remove: boolean;
};

enum sprite_types {
    SPRITE = "sprite",
    CIRCLE = "circle",
    RECTANGLE = "rectangle",
    RING = "ring",
}

type GeometryInfo = {
    color: string;
    radius: number;
    width: number;
    height: number;
    thickness: number;
    keep_core_white: boolean;
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
        type: sprite_types;
        geometry_info: GeometryInfo;
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
    public levels_filter_sequence: (GeneralFilterAttr & {
        min_input: number;
        max_input: number;
        gamma: number;
    })[] = [];
    public color_blend_filter_sequence: (GeneralFilterAttr & {
        r: number;
        g: number;
        b: number;
    })[] = [];
    public play_sequence: {
        start_delay: number | number[];
        sprite_index: string | number | number[];
        reverse: boolean;
        frame_rate: number;
        repeat: boolean;
        animation_key: string;
        wait: boolean;
        wait_for_index: number;
        hide_on_complete: boolean;
    }[] = [];
    public set_frame_sequence: any[] = [];
    public blend_mode_sequence: {
        start_delay: number | number[];
        sprite_index: string | number | number[];
        mode: string;
    }[] = [];
    public particles_sequence: ParticlesInfo;
    public running: boolean;
    public sprites: (Phaser.Sprite | Phaser.Graphics)[];
    public sprites_prev_properties: {
        [key: string]: {
            [property: string]: any;
        };
    };
    public stage_prev_value: number;
    public init_pos: {
        x: number;
        y: number;
    };
    public caster_sprite: PlayerSprite;
    public targets_sprites: PlayerSprite[];
    public background_sprites: Phaser.TileSprite[];
    public group_caster: Phaser.Group;
    public group_enemy: Phaser.Group;
    public super_group: Phaser.Group;
    public back_group: Phaser.Group;
    public front_group: Phaser.Group;
    public ability_sprites_groups: {
        [battle_positions.BEHIND]: Phaser.Group;
        [battle_positions.BETWEEN]: Phaser.Group;
        [battle_positions.OVER]: Phaser.Group;
    };
    public battle_stage: BattleStage;
    public trails_objs: Phaser.Image[];
    public trails_bmps: Phaser.BitmapData[];
    public promises: Promise<any>[];
    public render_callbacks: {[callback_key: string]: Function};
    public mirrored: boolean;
    public cast_type: string;
    public wait_for_cast_animation: boolean;
    public element: elements;
    public follow_caster: boolean;
    public follow_caster_prev_pos: {
        x: number;
        y: number;
    };

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
        x_ellipse_axis_factor_sequence, //{start_delay: value, sprite_index: index, to: value, is_absolute: bool, tween: type, yoyo: bool, duration: value
        y_ellipse_axis_factor_sequence, //{start_delay: value, sprite_index: index, to: value, is_absolute: bool, tween: type, yoyo: bool, duration: value
        x_scale_sequence, //{start_delay: value, sprite_index: index, to: value, is_absolute: bool, tween: type, yoyo: bool, duration: value, shift: value, shift_direction: value}
        y_scale_sequence, //{start_delay: value, sprite_index: index, to: value, is_absolute: bool, tween: type, yoyo: bool, duration: value, shift: value, shift_direction: value}
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
        levels_filter_sequence,
        color_blend_filter_sequence,
        particles_sequence,
        cast_type,
        wait_for_cast_animation,
        follow_caster,
        mirrored,
        element
    ) {
        this.game = game;
        this.data = data;
        this.key_name = key_name;
        this.sprites_keys = sprites_keys ?? [];
        this.x_sequence = x_sequence ?? [];
        this.y_sequence = y_sequence ?? [];
        this.x_ellipse_axis_factor_sequence = x_ellipse_axis_factor_sequence ?? [];
        this.y_ellipse_axis_factor_sequence = y_ellipse_axis_factor_sequence ?? [];
        this.x_scale_sequence = x_scale_sequence ?? [];
        this.y_scale_sequence = y_scale_sequence ?? [];
        this.x_anchor_sequence = x_anchor_sequence ?? [];
        this.y_anchor_sequence = y_anchor_sequence ?? [];
        this.alpha_sequence = alpha_sequence ?? [];
        this.rotation_sequence = rotation_sequence ?? [];
        this.stage_angle_sequence = stage_angle_sequence ?? [];
        this.hue_angle_sequence = hue_angle_sequence ?? [];
        this.tint_sequence = tint_sequence ?? [];
        this.grayscale_sequence = grayscale_sequence ?? [];
        this.colorize_sequence = colorize_sequence ?? [];
        this.custom_filter_sequence = custom_filter_sequence ?? [];
        this.levels_filter_sequence = levels_filter_sequence ?? [];
        this.color_blend_filter_sequence = color_blend_filter_sequence ?? [];
        this.play_sequence = play_sequence ?? [];
        this.set_frame_sequence = set_frame_sequence ?? [];
        this.blend_mode_sequence = blend_mode_sequence ?? [];
        this.particles_sequence = particles_sequence ?? [];
        this.running = false;
        this.cast_type = cast_type;
        this.wait_for_cast_animation = wait_for_cast_animation;
        this.mirrored = mirrored;
        this.element = element;
        this.follow_caster = follow_caster ?? false;
        this.follow_caster_prev_pos = {
            x: 0,
            y: 0,
        };
        this.render_callbacks = {};
        this.ability_sprites_groups = {
            [battle_positions.BEHIND]: this.game.add.group(),
            [battle_positions.BETWEEN]: this.game.add.group(),
            [battle_positions.OVER]: this.game.add.group(),
        };
    }

    initialize(
        caster_sprite: PlayerSprite,
        targets_sprites: PlayerSprite[],
        group_caster: Phaser.Group,
        group_enemy: Phaser.Group,
        super_group: Phaser.Group,
        battle_stage: BattleStage,
        background_sprites: Phaser.TileSprite[],
        sprite_key?: string
    ) {
        this.sprites = [];
        this.sprites_prev_properties = {};
        this.stage_prev_value = undefined;
        this.init_pos = {
            x: this.game.camera.x,
            y: this.game.camera.y,
        };
        this.caster_sprite = caster_sprite;
        this.follow_caster_prev_pos = {
            x: this.caster_sprite.x,
            y: this.caster_sprite.y,
        };
        this.targets_sprites = targets_sprites;
        this.background_sprites = background_sprites;
        this.group_caster = group_caster;
        this.group_enemy = group_enemy;
        this.super_group = super_group;
        this.battle_stage = battle_stage;
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
            Object.values(battle_positions).forEach(position => {
                this.ability_sprites_groups[position].scale.x = -1;
                this.ability_sprites_groups[position].x += numbers.GAME_WIDTH;
            });
        }
        for (let i = 0; i < this.sprites_keys.length; ++i) {
            const sprite_info = this.sprites_keys[i];
            let trail_image: Phaser.Image;
            if (sprite_info.trails) {
                const trail_bitmap_data = this.game.make.bitmapData(numbers.GAME_WIDTH, numbers.GAME_HEIGHT);
                trail_bitmap_data.smoothed = false;
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
                    let psy_sprite: Phaser.Sprite | Phaser.Graphics;
                    const sprite_type = sprite_info.type ?? sprite_types.SPRITE;
                    let color;
                    const get_color = (color: string) => {
                        if (color === "element") {
                            return element_colors_in_battle[this.element];
                        } else {
                            return parseInt(sprite_info.geometry_info.color, 16);
                        }
                    };
                    switch (sprite_type) {
                        case sprite_types.SPRITE:
                            psy_sprite = this.game.add.sprite(this.init_pos.x, this.init_pos.y, sprite_key);
                            const frames = Phaser.Animation.generateFrameNames(
                                sprite_info.key_name + "/",
                                0,
                                sprite_info.frames_number ?? psy_sprite.animations.frameTotal,
                                "",
                                3
                            );
                            psy_sprite.animations.add(sprite_info.key_name, frames);
                            psy_sprite.animations.frameName = frames[0];
                            break;
                        case sprite_types.RING:
                            psy_sprite = this.game.add.graphics(this.init_pos.x, this.init_pos.y);
                            color = sprite_info.geometry_info.keep_core_white
                                ? 0xffffff
                                : get_color(sprite_info.geometry_info.color);
                            psy_sprite.lineStyle(sprite_info.geometry_info.thickness, color);
                            psy_sprite.arc(0, 0, sprite_info.geometry_info.radius, 0, numbers.degree360, false);
                            break;
                        case sprite_types.RECTANGLE:
                            psy_sprite = this.game.add.graphics(this.init_pos.x, this.init_pos.y);
                            color = sprite_info.geometry_info.keep_core_white
                                ? 0xffffff
                                : get_color(sprite_info.geometry_info.color);
                            psy_sprite.beginFill(color, 1);
                            psy_sprite.drawRect(
                                0,
                                0,
                                sprite_info.geometry_info.width,
                                sprite_info.geometry_info.height
                            );
                            psy_sprite.endFill();
                            break;
                        case sprite_types.CIRCLE:
                            psy_sprite = this.game.add.graphics(this.init_pos.x, this.init_pos.y);
                            color = sprite_info.geometry_info.keep_core_white
                                ? 0xffffff
                                : get_color(sprite_info.geometry_info.color);
                            psy_sprite.beginFill(color, 1);
                            psy_sprite.drawCircle(0, 0, sprite_info.geometry_info.radius << 1);
                            psy_sprite.endFill();
                            break;
                    }
                    if (psy_sprite instanceof Phaser.Graphics) {
                        const graphic = psy_sprite;
                        psy_sprite = this.game.add.sprite(psy_sprite.x, psy_sprite.y, psy_sprite.generateTexture());
                        graphic.destroy();
                        psy_sprite.data.color = get_color(sprite_info.geometry_info.color);
                        psy_sprite.data.keep_core_white = sprite_info.geometry_info.keep_core_white;
                    }
                    this.ability_sprites_groups[sprite_info.position].addChild(psy_sprite);
                    psy_sprite.data.custom_key = `${sprite_type}/${i}/${j}`;
                    psy_sprite.data.trail_image = trail_image;
                    psy_sprite.data.ignore_trim = true;
                    this.sprites.push(psy_sprite);
                }
            } else {
                //TODO: create one sprite for each target
            }
        }
        this.set_filters();
    }

    manage_filter(filter: Phaser.Filter, sprite: PlayerSprite | PIXI.DisplayObject, remove: boolean) {
        if (remove) {
            if (sprite.filters) {
                const index = sprite.filters.indexOf(filter);
                sprite.filters.splice(index, 1);
                if (sprite.filters.length === 0) {
                    sprite.filters = undefined;
                }
            }
        } else {
            if (sprite.filters) {
                sprite.filters = [...sprite.filters, filter];
            } else {
                sprite.filters = [filter];
            }
        }
    }

    set_filters() {
        this.sprites.forEach(sprite => {
            const color_filter = this.game.add.filter("ColorFilters") as Phaser.Filter.ColorFilters;
            sprite.available_filters[color_filter.key] = color_filter;
            const levels_filter = this.game.add.filter("Levels") as Phaser.Filter.Levels;
            sprite.available_filters[levels_filter.key] = levels_filter;
            const color_blend_filter = this.game.add.filter("ColorBlend") as Phaser.Filter.ColorBlend;
            sprite.available_filters[color_blend_filter.key] = color_blend_filter;
            const hue_filter = this.game.add.filter("Hue") as Phaser.Filter.Hue;
            sprite.available_filters[hue_filter.key] = hue_filter;
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
        this.play_number_property_sequence(this.rotation_sequence, "rotation", undefined, {
            rotational_property: true,
            rotate_in_4h_quadrant: true,
        });
        this.play_number_property_sequence(this.x_scale_sequence, "scale", "x");
        this.play_number_property_sequence(this.y_scale_sequence, "scale", "y");
        this.play_number_property_sequence(this.x_anchor_sequence, "anchor", "x");
        this.play_number_property_sequence(this.y_anchor_sequence, "anchor", "y");
        this.play_number_property_sequence(this.hue_angle_sequence, "filters", "hue_adjust", {
            rotational_property: true,
            filter_property: true,
        });
        // this.play_number_property_sequence(this.grayscale_sequence, "filters", "gray");
        this.play_sprite_sequence();
        this.play_blend_modes();
        this.play_filter_property(this.tint_sequence, "tint");
        this.play_filter_property(this.colorize_sequence, "colorize", "colorize_intensity");
        this.play_filter_property(this.custom_filter_sequence);
        this.play_levels_filter(this.levels_filter_sequence);
        this.play_color_blend_filter(this.color_blend_filter_sequence);
        this.play_stage_angle_sequence();
        this.play_particles();
        this.unmount_animation(finish_callback);
    }

    unmount_animation(finish_callback) {
        Promise.all(this.promises).then(() => {
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

    get_sprites(
        seq,
        obj_propety?: keyof PlayerSprite
    ): {
        [key: string]: {
            obj: PIXI.DisplayObject | PlayerSprite | keyof PlayerSprite;
            index: number;
        };
    } {
        if (obj_propety) {
            if (seq.sprite_index === "background") {
                return this.background_sprites.reduce((prev, cur, index) => {
                    prev[`${cur.key}/${index}`] = {
                        obj: cur[obj_propety],
                        index: index,
                    };
                    return prev;
                }, {});
            } else if (seq.sprite_index === "caster") {
                return {
                    [this.caster_sprite.key]: {
                        obj: this.caster_sprite[obj_propety] as keyof PlayerSprite,
                        index: 0,
                    },
                };
            } else if (seq.sprite_index === "targets") {
                return this.targets_sprites.reduce((prev, cur, index) => {
                    prev[`${cur.key}/${index}`] = {
                        obj: cur[obj_propety],
                        index: index,
                    };
                    return prev;
                }, {});
            } else {
                if (Array.isArray(seq.sprite_index)) {
                    return seq.sprite_index.reduce((prev, cur, index) => {
                        prev[this.sprites[cur].data.custom_key] = {
                            obj: this.sprites[cur][obj_propety],
                            index: index,
                        };
                        return prev;
                    }, {});
                } else {
                    return {
                        [this.sprites[seq.sprite_index].data.custom_key]: {
                            obj: this.sprites[seq.sprite_index][obj_propety],
                            index: 0,
                        },
                    };
                }
            }
        } else {
            if (seq.sprite_index === "background") {
                return this.background_sprites.reduce((prev, cur, index) => {
                    prev[`${cur.key}/${index}`] = {
                        obj: cur,
                        index: index,
                    };
                    return prev;
                }, {});
            } else if (seq.sprite_index === "caster") {
                return {[this.caster_sprite.key]: {obj: this.caster_sprite, index: 0}};
            } else if (seq.sprite_index === "targets") {
                return this.targets_sprites.reduce((prev, cur, index) => {
                    prev[`${cur.key}/${index}`] = {
                        obj: cur,
                        index: index,
                    };
                    return prev;
                }, {});
            } else if (Array.isArray(seq.sprite_index)) {
                return seq.sprite_index.reduce((prev, cur, index) => {
                    prev[this.sprites[cur].data.custom_key] = {
                        obj: this.sprites[cur],
                        index: index,
                    };
                    return prev;
                }, {});
            } else {
                return {
                    [this.sprites[seq.sprite_index].data.custom_key]: {
                        obj: this.sprites[seq.sprite_index],
                        index: 0,
                    },
                };
            }
        }
    }

    play_number_property_sequence(
        sequence,
        target_property: keyof PlayerSprite,
        inner_property?,
        options?: {
            rotational_property?: boolean;
            filter_property?: boolean;
            rotate_in_4h_quadrant?: boolean;
        }
    ) {
        const chained_tweens = {};
        const auto_start_tween = {};
        const property_to_set = inner_property ?? target_property;
        for (let i = 0; i < sequence.length; ++i) {
            const seq = sequence[i];
            const sprites = this.get_sprites(seq, inner_property !== undefined ? target_property : undefined);
            let promises_set = false;
            _.forEach(sprites, (sprite_info, key) => {
                const this_sprite = sprite_info.obj;
                const uniq_key: string = key;
                const property_uniq_key = `${uniq_key}/${target_property}/${inner_property ?? ""}`;
                if (!(property_uniq_key in auto_start_tween)) {
                    auto_start_tween[property_uniq_key] = true;
                }
                if (property_uniq_key in chained_tweens && chained_tweens[property_uniq_key].length) {
                    auto_start_tween[property_uniq_key] = false;
                }
                const get_to_value = () => {
                    if (this.sprites_prev_properties[uniq_key] === undefined) {
                        this.sprites_prev_properties[uniq_key] = {};
                    }
                    if (this.sprites_prev_properties[uniq_key][property_to_set] === undefined) {
                        this.sprites_prev_properties[uniq_key][property_to_set] = this_sprite[property_to_set];
                    }
                    const seq_to = Array.isArray(seq.to) ? seq.to[sprite_info.index] : seq.to;
                    let to_value = seq_to;
                    if (["targets", "caster"].includes(seq_to)) {
                        let player_sprite = this.caster_sprite;
                        if (seq_to === "targets") {
                            player_sprite = this.targets_sprites[this.targets_sprites.length >> 1];
                        }
                        let shift_sign = 1;
                        if (seq.shift_direction !== undefined) {
                            const center = {
                                x: numbers.GAME_WIDTH >> 1,
                                y: numbers.GAME_HEIGHT >> 1,
                            };
                            const shift_direction: DefaultAttr["shift_direction"] = Array.isArray(seq.shift_direction)
                                ? seq.shift_direction[sprite_info.index]
                                : seq.shift_direction;
                            if (
                                (shift_direction === "in_center" &&
                                    player_sprite[property_to_set] > center[property_to_set]) ||
                                (shift_direction === "out_center" &&
                                    player_sprite[property_to_set] < center[property_to_set])
                            ) {
                                shift_sign = -1;
                            }
                        }
                        const shift =
                            ((Array.isArray(seq.shift) ? seq.shift[sprite_info.index] : seq.shift) ?? 0) * shift_sign;
                        to_value = player_sprite[property_to_set] + shift;
                        if (this.mirrored && property_to_set === "x") {
                            to_value = numbers.GAME_WIDTH - to_value;
                        }
                    }
                    if (options?.rotational_property) {
                        this.sprites_prev_properties[uniq_key][property_to_set] = range_360(
                            this.sprites_prev_properties[uniq_key][property_to_set]
                        );
                        this_sprite[property_to_set] = this.sprites_prev_properties[uniq_key][property_to_set];
                        to_value = BattleAnimation.get_angle_by_direction(
                            this.sprites_prev_properties[uniq_key][property_to_set],
                            seq_to,
                            seq.direction,
                            options?.rotate_in_4h_quadrant
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
                    if (!(property_uniq_key in chained_tweens)) {
                        chained_tweens[property_uniq_key] = [];
                    }
                    const start_delay = Array.isArray(seq.start_delay)
                        ? seq.start_delay[sprite_info.index]
                        : seq.start_delay;
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
                            if (["ellipses_semi_major", "ellipses_semi_minor"].includes(property_to_set)) {
                                this.battle_stage.update_sprite_properties();
                            }
                            if (seq.is_absolute && options?.rotational_property) {
                                this_sprite[property_to_set] = range_360(this_sprite[property_to_set]);
                            }
                            if (resolve_function !== undefined) {
                                resolve_function();
                            }
                        });
                    } else {
                        const tween = this.game.add.tween(this_sprite).to(
                            {[property_to_set]: get_to_value},
                            Array.isArray(seq.duration) ? seq.duration[sprite_info.index] : seq.duration,
                            seq.tween.split(".").reduce((p, prop) => p[prop], Phaser.Easing),
                            auto_start_tween[property_uniq_key],
                            start_delay,
                            0,
                            seq.yoyo ?? false,
                            true
                        );
                        if (["ellipses_semi_major", "ellipses_semi_minor"].includes(property_to_set)) {
                            tween.onStart.addOnce(() => {
                                (this_sprite as PlayerSprite).force_stage_update = true;
                            });
                            tween.onComplete.addOnce(() => {
                                (this_sprite as PlayerSprite).force_stage_update = false;
                            });
                        }
                        if (!promises_set) {
                            let resolve_function;
                            const this_promise = new Promise(resolve => (resolve_function = resolve));
                            this.promises.push(this_promise);
                            tween.onComplete.addOnce(() => {
                                if (seq.is_absolute && options?.rotational_property) {
                                    this_sprite[property_to_set] = range_360(this_sprite[property_to_set]);
                                }
                                resolve_function();
                            });
                            promises_set = true;
                        }
                        if (chained_tweens[property_uniq_key].length) {
                            chained_tweens[property_uniq_key][chained_tweens[property_uniq_key].length - 1].chain(
                                tween
                            );
                        }
                        chained_tweens[property_uniq_key].push(tween);
                    }
                }
            });
        }
    }

    play_sprite_sequence() {
        const index_promises_resolve = new Array<() => void>(this.play_sequence.length);
        const index_promises = new Array<Promise<void>>(this.play_sequence.length).fill(null).map((foo, i) => {
            return new Promise<void>(resolve => (index_promises_resolve[i] = resolve));
        });
        for (let i = 0; i < this.play_sequence.length; ++i) {
            const play_seq = this.play_sequence[i];
            const sprites = this.get_sprites(play_seq);
            const sprites_length = Object.keys(sprites).length;
            _.forEach(sprites, sprite_info => {
                const sprite = sprite_info.obj as PlayerSprite | Phaser.Sprite;
                let resolve_function;
                const this_promise = new Promise(resolve => (resolve_function = resolve));
                this.promises.push(this_promise);
                const start = async () => {
                    if (
                        _.isNumber(play_seq.wait_for_index) &&
                        play_seq.wait_for_index >= 0 &&
                        play_seq.wait_for_index < index_promises.length
                    ) {
                        await index_promises[play_seq.wait_for_index];
                    }
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
                        anim.reversed = play_seq.reverse ?? false;
                        anim.stop(true);
                        if (sprite instanceof PlayerSprite && (sprite as PlayerSprite).is_ally) {
                            sprite.set_action(play_seq.animation_key as battle_actions, false);
                            sprite.play_position(play_seq.frame_rate, play_seq.repeat);
                        } else {
                            sprite.animations.play(animation_key, play_seq.frame_rate, play_seq.repeat);
                        }
                        sprite.animations.currentAnim.onComplete.addOnce(() => {
                            if (play_seq.hide_on_complete) {
                                sprite.alpha = 0;
                            }
                            if (sprite_info.index === sprites_length - 1) {
                                index_promises_resolve[i]();
                            }
                            if (play_seq.wait) {
                                resolve_function();
                            }
                        });
                        if (!play_seq.wait) {
                            resolve_function();
                        }
                    } else {
                        if (sprite_info.index === sprites_length - 1) {
                            index_promises_resolve[i]();
                        }
                        resolve_function();
                    }
                };
                const start_delay = Array.isArray(play_seq.start_delay)
                    ? play_seq.start_delay[sprite_info.index]
                    : play_seq.start_delay;
                if (start_delay) {
                    this.game.time.events.add(start_delay, start);
                } else {
                    start();
                }
            });
        }
    }

    play_blend_modes() {
        for (let i = 0; i < this.blend_mode_sequence.length; ++i) {
            const blend_mode_seq = this.blend_mode_sequence[i];
            const sprites = this.get_sprites(blend_mode_seq);
            _.forEach(sprites, sprite_info => {
                const sprite = sprite_info.obj as PlayerSprite | Phaser.Sprite;
                let resolve_function;
                let this_promise = new Promise(resolve => {
                    resolve_function = resolve;
                });
                this.promises.push(this_promise);
                const start_delay = Array.isArray(blend_mode_seq.start_delay)
                    ? blend_mode_seq.start_delay[sprite_info.index]
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

    play_general_filter(
        sequence: GeneralFilterAttr[],
        filter_key: EngineFilters,
        set_filter: (sequence: GeneralFilterAttr, filter: Phaser.Filter) => void
    ) {
        for (let i = 0; i < sequence.length; ++i) {
            const filter_seq = sequence[i];
            const sprites = this.get_sprites(filter_seq);
            _.forEach(sprites, sprite_info => {
                const sprite = sprite_info.obj as PlayerSprite | Phaser.Sprite;
                let resolve_function;
                const this_promise = new Promise(resolve => (resolve_function = resolve));
                this.promises.push(this_promise);
                const start_delay = Array.isArray(filter_seq.start_delay)
                    ? filter_seq.start_delay[sprite_info.index]
                    : filter_seq.start_delay;
                this.game.time.events.add(start_delay, () => {
                    const filter = sprite.available_filters[filter_key];
                    this.manage_filter(filter as Phaser.Filter, sprite, filter_seq.remove);
                    if (!filter_seq.remove) {
                        set_filter(filter_seq, filter as Phaser.Filter);
                    }
                });
                resolve_function();
            });
        }
    }

    play_levels_filter(sequence: BattleAnimation["levels_filter_sequence"]) {
        this.play_general_filter(
            sequence,
            EngineFilters.LEVELS,
            (filter_seq: BattleAnimation["levels_filter_sequence"][0], filter: Phaser.Filter.Levels) => {
                filter.min_input = filter_seq.min_input ?? filter.min_input;
                filter.max_input = filter_seq.max_input ?? filter.max_input;
                filter.gamma = filter_seq.gamma ?? filter.gamma;
            }
        );
    }

    play_color_blend_filter(sequence: BattleAnimation["color_blend_filter_sequence"]) {
        this.play_general_filter(
            sequence,
            EngineFilters.COLOR_BLEND,
            (filter_seq: BattleAnimation["color_blend_filter_sequence"][0], filter: Phaser.Filter.ColorBlend) => {
                filter.r = filter_seq.r ?? filter.r;
                filter.g = filter_seq.g ?? filter.g;
                filter.b = filter_seq.b ?? filter.b;
            }
        );
    }

    play_filter_property(sequence, property?, ...secondary_properties) {
        for (let i = 0; i < sequence.length; ++i) {
            const filter_seq = sequence[i];
            let sprites = this.get_sprites(filter_seq);
            _.forEach(sprites, sprite_info => {
                const sprite = sprite_info.obj as PlayerSprite | Phaser.Sprite;
                let resolve_function;
                let this_promise = new Promise(resolve => {
                    resolve_function = resolve;
                });
                this.promises.push(this_promise);
                const start_delay = Array.isArray(filter_seq.start_delay)
                    ? filter_seq.start_delay[sprite_info.index]
                    : filter_seq.start_delay;
                this.game.time.events.add(start_delay, () => {
                    const this_property = filter_seq.filter ?? property;
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
                this.stage_prev_value = this.battle_stage.camera_angle.rad;
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
                this.battle_stage.camera_angle.rad = this.stage_prev_value;
                to_value = BattleAnimation.get_angle_by_direction(this.stage_prev_value, to_value, direction, true);
            } else {
                to_value = this.stage_prev_value + (stage_angle_seq.to as number);
            }
            this.stage_prev_value = to_value;
            if (stage_angle_seq.tween === "initial") {
                if (is_absolute) {
                    this.battle_stage.camera_angle.rad = to_value;
                } else {
                    this.battle_stage.camera_angle.rad += to_value;
                }
            } else {
                const tween = this.game.add.tween(this.battle_stage.camera_angle).to(
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
                    this.battle_stage.pause_players_update = false;
                });
                tween.onComplete.addOnce(() => {
                    if (is_absolute) {
                        this.battle_stage.camera_angle.rad = range_360(this.battle_stage.camera_angle.rad);
                    }
                    this.battle_stage.pause_players_update = true;
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
            if (this.mirrored) {
                x = numbers.GAME_WIDTH - (x as number);
            }
        } else if (x === "targets") {
            x = _.mean(this.targets_sprites.map(target => target.x));
            if (this.mirrored) {
                x = numbers.GAME_WIDTH - (x as number);
            }
        }
        if (y === "caster") {
            y = this.caster_sprite.y;
        } else if (y === "targets") {
            y = _.mean(this.targets_sprites.map(target => target.y));
        }
        (x as number) += shift_x ?? 0;
        (y as number) += shift_y ?? 0;
        return {x: x as number, y: y as number};
    }

    play_particles() {
        const promises = this.data.particle_wrapper.start_particles(
            this.particles_sequence,
            this.super_group,
            this.ability_sprites_groups,
            this.element,
            this.get_sprite_xy_pos.bind(this)
        );
        this.promises.push(...promises);
    }

    render() {
        this.trails_bmps.forEach(bmp => bmp.fill(0, 0, 0, bmp.trail_factor));
        this.sprites.forEach(sprite => {
            if (!sprite.data.trail_image) return;
            const bm_data = sprite.data.trail_image.key as Phaser.BitmapData;
            if (sprite.data.keep_core_white) {
                sprite.tint = sprite.data.color;
            }
            bm_data.draw(sprite);
            if (sprite.data.keep_core_white) {
                sprite.tint = 0xffffff;
            }
        });
        if (this.follow_caster) {
            for (let pos in this.ability_sprites_groups) {
                const group: Phaser.Group = this.ability_sprites_groups[pos];
                group.x += this.caster_sprite.x - this.follow_caster_prev_pos.x;
                group.y += this.caster_sprite.y - this.follow_caster_prev_pos.y;
            }
            this.follow_caster_prev_pos.x = this.caster_sprite.x;
            this.follow_caster_prev_pos.y = this.caster_sprite.y;
        }
        for (let key in this.render_callbacks) {
            this.render_callbacks[key]();
        }
        this.data.particle_wrapper.render();
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
