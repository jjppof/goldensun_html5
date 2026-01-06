/*
Extract graphics from MFT:

1. Load ROM up in a hex editor of your choice.
2. Locate your file(s) in the MFT, which for a recap begins at $08680000, and find the
   pointer(s) for the files you want to extract. Pointer = hex(MFT ID * 4) + 0x08680000.
3. If your file has a palette, you will want to extract the palette separately. The easy way of
   doing this is to just copy+paste the raw HEX into a new binary file, since palettes are
   uncompressed and TiledGGD can make use of it pretty easily for viewing purposes (and I imagine
   you'll want the palette for yourself as well). The palette's length varied depending on the
   bit-format of the graphic file, but will either be 0x80 (128, 8-bit graphics) or 0x20 (32,
   4-bit graphics) bytes in length. The pallete data is the beggining of the graphics + the pallete
   size.
4. Once you have extracted your palette, go back to your pointer in the MFT and add + 0x80 to the
   pointer (e.g. $08700000 would become $08700080) for 8-bit graphics, or else 0x20 for 4-bit
   graphics. Save your changes.

If you are not tweaking gs2mapcodecompressor's source code to make things easier:
5. Change whatever map code file pointers you want to match the pointers of the graphic files you
   wish to extract. Save your changes. gs2mapcodecompressor only exports from MFT ID 1609 till 1722,
   so we could be replacing 1609 pointer, for example, by the pointer you want. 1609 is at
   0x08681924 that points to graphic 0x08ec3878. If we want to extract Volcanos graphics (MFT id
   326) we can get it graphics pointer that's in hex(326 * 4) + 0x08680000 = 0x08680518 location,
   which is is 0x088cbc4c. So at 0x08681924, we replace 1609 graphics 0x08ec3878 by Volcano's
   graphics which is 0x088cbc4c + pallete offset (0x80 on Volcanos case), then 0x088cbccc. Then
   when gs2mapcodecompressor exports 1609, it will be volcano.

Using the tool:
6. Once saved, click+drag your ROM onto the compression tool. If a folder does not exist, it will
   automatically extract all MFT files within range, decompressed for your convenience. If the
   folder does exist, then it will compress everything in the folder back to the ROM; note that it
   only compresses to one format, so you may not get 1:1 byte size parity).

Using TiledGGD to view (i.e. to confirm you ripped it successfully, and also to fully determine graphic
widths used):
7. You will want to load your newly extracted graphic file + the palette as a separate file.
8. Once you have done so, you can use the arrow keys on your keyboard to change width and height
   of whatever is displayed.
9. You can also go to Image > Go to offset... (shortcut Ctrl+G) to start from later in the graphic
   file, since it is very common for one graphic file to contain multiple graphics).
10. Keep experimenting until you figure out everything you want!
*/

import {GoldenSun} from "../GoldenSun";
import * as numbers from "../magic_numbers";
import {
    elements,
    element_colors_in_battle,
    range_360,
    engine_filters,
    random_normal,
    get_distance,
    cumsum,
    promised_wait,
} from "../utils";
import {BattleStage, DEFAULT_POS_ANGLE} from "./BattleStage";
import * as _ from "lodash";
import {battle_actions, PlayerSprite} from "./PlayerSprite";
import {ParticlesInfo} from "../ParticlesWrapper";
import * as mathjs from "mathjs";

export const CAST_STAGE_POSITION = 0.5242024;
export const MIRRORED_CAST_STAGE_POSITION = -0.7151327;

enum target_types {
    CASTER = "caster",
    TARGETS = "targets",
    ALLIES = "allies",
    BACKGROUND = "background",
}

enum to_misc_values {
    RESET = "reset",
    DEFAULT = "default",
    CAST_POSITION = "cast_position",
}

export enum battle_positions {
    OVER = "over",
    BETWEEN = "between",
    BEHIND = "behind",
}

type CompactValuesSpecifier = {
    starting_value: number;
    cumulator: number;
    reverse?: boolean;
    amount?: number | target_types;
};

type DefaultAttr = {
    start_delay: number | number[] | CompactValuesSpecifier;
    to: to_misc_values | target_types | number | number[] | CompactValuesSpecifier;
    to_expression: string;
    is_absolute: boolean;
    tween: string;
    duration: number;
    sprite_index?: string | number | number[];
    affect_only_shadow?: boolean;
    dont_affect_shadow?: boolean;
    per_target_key?: string;
    yoyo?: boolean;
    shift?: number | number[] | CompactValuesSpecifier;
    shift_direction?: ("in_center" | "out_center") | ("in_center" | "out_center")[];
    direction?: string;
    remove?: boolean;
    ignore_if_dodge?: boolean;
    round_final_value?: boolean;
};

type MiscAttr = {
    type: "trail_toggle";
    start_delay: number | number[] | CompactValuesSpecifier;
    sprite_index?: string | number | number[];
    per_target_key?: string;
    ignore_if_dodge?: boolean;
    value: any;
};

type ShakeAttr = {
    start_delay: number | number[] | CompactValuesSpecifier;
    sprite_index: string | number | number[];
    per_target_key?: string;
    ignore_if_dodge: boolean;
    interval: number;
    direction: "x" | "y";
    shake_count: number;
    intensity: number;
    random_delta: number;
};

type GeneralFilterAttr = {
    start_delay: number | number[] | CompactValuesSpecifier;
    sprite_index: string | number | number[] | CompactValuesSpecifier;
    per_target_key?: string;
    remove: boolean;
    ignore_if_dodge?: boolean;
    duration?: number;
};

type BlinkAttr = Omit<GeneralFilterAttr, "remove"> & {
    count: number;
    interval: number;
    color: {
        r: number;
        g: number;
        b: number;
    };
};

enum sprite_types {
    SPRITE = "sprite",
    CIRCLE = "circle",
    RECTANGLE = "rectangle",
    RING = "ring",
    BACKGROUND_COPY = "background_copy",
}

type GeometryInfo = {
    color: string;
    radius: number;
    width: number;
    height: number;
    thickness: number;
    keep_core_white: boolean;
};

type BackgrounCopyInfo = {
    width: number;
    height: number;
    x: number | sprite_types;
    y: number | sprite_types;
};

type InitialConfig = {
    x: number | sprite_types;
    y: number | sprite_types;
    alpha: number;
    frame_name: string;
    scale: {
        x: number;
        y: number;
    };
    anchor: {
        x: number;
        y: number;
    };
    blend_mode: "screen" | "normal";
};

type SpriteKey = {
    key_name: string;
    per_target: boolean;
    per_target_key: string;
    position: string;
    count: number;
    trails: boolean;
    trails_factor: number;
    frames_number: number;
    type: sprite_types;
    follow_sprite: string | number;
    geometry_info: GeometryInfo;
    background_copy_info: BackgrounCopyInfo;
    initial_config: InitialConfig;
};

export class BattleAnimation {
    public game: Phaser.Game;
    public data: GoldenSun;
    public key_name: string;
    public target_dodged: boolean;
    public sprites_keys: SpriteKey[] | target_types;
    public x_sequence: DefaultAttr[] = [];
    public y_sequence: DefaultAttr[] = [];
    public x_ellipse_axis_factor_sequence: DefaultAttr[] = [];
    public y_ellipse_axis_factor_sequence: DefaultAttr[] = [];
    public center_shift_sequence: DefaultAttr[] = [];
    public x_scale_sequence: DefaultAttr[] = [];
    public y_scale_sequence: DefaultAttr[] = [];
    public x_anchor_sequence: DefaultAttr[] = [];
    public y_anchor_sequence: DefaultAttr[] = [];
    public alpha_sequence: DefaultAttr[] = [];
    public rotation_sequence: DefaultAttr[] = [];
    public stage_angle_sequence: DefaultAttr[] = [];
    public hue_angle_sequence: DefaultAttr[] = [];
    public blink_sequence: BlinkAttr[] = [];
    public shake_sequence: ShakeAttr[] = [];
    public misc_sequence: MiscAttr[] = [];
    public texture_displacement_sequence: (GeneralFilterAttr & {
        duration: number;
        repeat_texture: boolean;
        yoyo: boolean;
        tween: string;
        shift: {
            x?: number;
            y?: number;
        };
    })[] = [];
    public tint_sequence: (GeneralFilterAttr & {
        r: number;
        g: number;
        b: number;
    })[] = [];
    public grayscale_sequence: DefaultAttr[] = [];
    public levels_filter_sequence: (GeneralFilterAttr & {
        min_input: number;
        max_input: number;
        gamma: number;
    })[] = [];
    public colorize_sequence: (GeneralFilterAttr & {
        color: number;
        intensity: number;
        tween: string;
    })[] = [];
    public glow_filter_sequence: (GeneralFilterAttr & {
        distance: number;
        strength: number;
        quality: number;
        r: number;
        g: number;
        b: number;
    })[] = [];
    public color_blend_filter_sequence: (GeneralFilterAttr & {
        r: number;
        g: number;
        b: number;
        fake_blend: boolean;
        tween: string;
        duration: number;
    })[] = [];
    public flame_filter_sequence: GeneralFilterAttr[] = [];
    public alpha_gray_filter_sequence: GeneralFilterAttr[] = [];
    public play_sequence: {
        start_delay: number | number[];
        sprite_index: target_types | number | number[];
        reverse: boolean;
        frame_rate: number;
        repeat: boolean;
        animation_key: string;
        wait: boolean;
        wait_for_index: number;
        hide_on_complete: boolean;
        ignore_if_dodge?: boolean;
    }[] = [];
    public set_frame_sequence: {
        start_delay: number | number[];
        sprite_index: target_types | number | number[];
        frame_name: string;
        ignore_if_dodge?: boolean;
    }[] = [];
    public blend_mode_sequence: {
        start_delay: number | number[];
        sprite_index: string | number | number[];
        mode: string;
        ignore_if_dodge?: boolean;
    }[] = [];
    public sfx_sequence: {
        start_delay: number;
        sfx_key: string;
        position_shift: number;
        volume: number;
        ignore_if_dodge?: boolean;
    }[] = [];
    public lighting_sequence: {
        start_delay: number | number[] | CompactValuesSpecifier;
        from: {
            delta: {x: number; y: number};
            pos: {x: number | target_types; y: number | target_types};
            range_delta: {x: number; y: number};
        };
        to: {
            delta: {x: number; y: number};
            pos: {x: number | target_types; y: number | target_types};
            range_delta: {x: number; y: number};
        };
        thickness: {
            base_value: number;
            range_delta: number;
        };
        glow: {
            distance: number;
            strength: number;
            quality: number;
            r: number;
            g: number;
            b: number;
        };
        roughness: number;
        count: number;
        interval_time: number | number[];
        render_position: battle_positions;
        ignore_if_dodge?: boolean;
        trail: boolean;
        trail_factor: number;
        trail_count: number;
        trail_colorize: {
            color: number;
            intensity: number;
        };
        duration: number;
    }[] = [];
    public particles_sequence: ParticlesInfo;
    public running: boolean;
    public sprites: (Phaser.Sprite | Phaser.Graphics | Phaser.TileSprite | PlayerSprite | Phaser.Image)[];
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
    public per_target_sprites: {
        [key: string]: (Phaser.Sprite | Phaser.Graphics)[];
    };
    public caster_sprite: PlayerSprite;
    public targets_sprites: PlayerSprite[];
    public allies_sprites: PlayerSprite[];
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
    private destroy_sprites: boolean;

    //sprite_index: "targets" is the target, "caster" is the caster, "allies" are the allies, "background" is the background sprite, 0...n is the sprites_key_names index
    //property "to" value can be "targets" or an actual value. In the case of "targets" is the the corresponding property value. In the case of using "targets", a "shift" property is available to be added to the resulting value
    //values in rad can have "direction" set to "clockwise", "counter_clockwise" or "closest" if "absolute" is true
    //in sprite_keys, position can be: "between", "over" or "behind"
    constructor(
        game,
        data,
        key_name,
        sprites_keys, //{key_name: string, per_target: bool, position: value}
        x_sequence, //{start_delay: value, sprite_index: index, to: value, is_absolute: bool, tween: type, yoyo: bool, duration: value, shift: value}
        y_sequence, //{start_delay: value, sprite_index: index, to: value, is_absolute: bool, tween: type, yoyo: bool, duration: value, shift: value}
        x_ellipse_axis_factor_sequence, //{start_delay: value, sprite_index: index, to: value, is_absolute: bool, tween: type, yoyo: bool, duration: value
        y_ellipse_axis_factor_sequence, //{start_delay: value, sprite_index: index, to: value, is_absolute: bool, tween: type, yoyo: bool, duration: value
        center_shift_sequence, //{start_delay: value, sprite_index: index, to: value, is_absolute: bool, tween: type, yoyo: bool, duration: value, shift: value}
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
        colorize_sequence,
        glow_filter_sequence,
        play_sequence, //{start_delay: value, sprite_index: index, reverse: bool, frame_rate: value, repeat: bool, animation_key: key, wait: bool, hide_on_complete: bool}
        set_frame_sequence, //{start_delay: value, frame_name: string, sprite_index: index}
        blend_mode_sequence, //{start_delay: value, mode: type, sprite_index: index}
        levels_filter_sequence,
        color_blend_filter_sequence,
        flame_filter_sequence,
        alpha_gray_filter_sequence,
        particles_sequence,
        sfx_sequence,
        blink_sequence,
        shake_sequence,
        texture_displacement_sequence,
        misc_sequence,
        lighting_sequence,
        cast_type,
        wait_for_cast_animation,
        follow_caster,
        mirrored,
        element
    ) {
        this.game = game;
        this.data = data;
        this.key_name = key_name;
        this.target_dodged = false;
        this.sprites_keys = sprites_keys ?? [];
        this.x_sequence = x_sequence ?? [];
        this.y_sequence = y_sequence ?? [];
        this.x_ellipse_axis_factor_sequence = x_ellipse_axis_factor_sequence ?? [];
        this.y_ellipse_axis_factor_sequence = y_ellipse_axis_factor_sequence ?? [];
        this.center_shift_sequence = center_shift_sequence ?? [];
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
        this.levels_filter_sequence = levels_filter_sequence ?? [];
        this.color_blend_filter_sequence = color_blend_filter_sequence ?? [];
        this.flame_filter_sequence = flame_filter_sequence ?? [];
        this.alpha_gray_filter_sequence = alpha_gray_filter_sequence ?? [];
        this.play_sequence = play_sequence ?? [];
        this.set_frame_sequence = set_frame_sequence ?? [];
        this.blend_mode_sequence = blend_mode_sequence ?? [];
        this.particles_sequence = particles_sequence ?? [];
        this.sfx_sequence = sfx_sequence ?? [];
        this.blink_sequence = blink_sequence ?? [];
        this.shake_sequence = shake_sequence ?? [];
        this.texture_displacement_sequence = texture_displacement_sequence ?? [];
        this.misc_sequence = misc_sequence ?? [];
        this.lighting_sequence = lighting_sequence ?? [];
        this.glow_filter_sequence = glow_filter_sequence ?? [];
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
        this.destroy_sprites = true;
    }

    initialize(
        caster_sprite: PlayerSprite,
        targets_sprites: PlayerSprite[],
        allies_sprites: PlayerSprite[],
        group_caster: Phaser.Group,
        group_enemy: Phaser.Group,
        super_group: Phaser.Group,
        battle_stage: BattleStage,
        background_sprites: Phaser.TileSprite[],
        sprite_key?: string,
        target_dodged?: boolean
    ) {
        this.sprites = [];
        this.per_target_sprites = {};
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
        this.allies_sprites = allies_sprites.filter(s => s !== caster_sprite);
        this.background_sprites = background_sprites;
        this.group_caster = group_caster;
        this.group_enemy = group_enemy;
        this.super_group = super_group;
        this.battle_stage = battle_stage;
        this.target_dodged = target_dodged;
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
        if (typeof this.sprites_keys === "string") {
            this.destroy_sprites = false;
            let sprites: (Phaser.Sprite | PlayerSprite | Phaser.TileSprite)[] = [];
            switch (this.sprites_keys) {
                case target_types.ALLIES:
                    sprites = this.allies_sprites;
                    break;
                case target_types.BACKGROUND:
                    sprites = this.background_sprites;
                    break;
                case target_types.CASTER:
                    sprites = [this.caster_sprite];
                    break;
                case target_types.TARGETS:
                    sprites = this.targets_sprites;
                    break;
            }
            for (let i = 0; i < sprites.length; ++i) {
                const sprite = sprites[i];
                sprite.data.custom_key = `${this.sprites_keys}/${i}`;
                this.sprites.push(sprite);
            }
        } else {
            for (let i = 0; i < this.sprites_keys.length; ++i) {
                const sprite_info = this.sprites_keys[i] as SpriteKey;
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
                const per_target_count = sprite_info.per_target ? this.targets_sprites.length : 1;
                const count = sprite_info.count ?? 1;
                for (let j = 0; j < count; ++j) {
                    for (let k = 0; k < per_target_count; ++k) {
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
                            case sprite_types.BACKGROUND_COPY:
                                const bmd = this.game.add.bitmapData(
                                    sprite_info.background_copy_info.width,
                                    sprite_info.background_copy_info.height,
                                    undefined,
                                    undefined,
                                    true
                                );
                                bmd.smoothed = false;
                                psy_sprite = this.game.add.sprite(this.init_pos.x, this.init_pos.y, bmd);
                                const pos = this.get_sprite_xy_pos(
                                    sprite_info.background_copy_info.x,
                                    sprite_info.background_copy_info.y,
                                    0,
                                    0
                                );
                                for (let bg of this.background_sprites) {
                                    const pos_x =
                                        -pos.x + (sprite_info.initial_config.anchor?.x ?? 1) * bmd.width + (bg.x | 0);
                                    const pos_y =
                                        -pos.y + (sprite_info.initial_config.anchor?.y ?? 1) * bmd.height + (bg.y | 0);
                                    bmd.writeOnCanvas(bg, pos_x, pos_y, bg.scale.x, bg.scale.y);
                                }
                                bmd.update();
                                psy_sprite.events.onDestroy.addOnce(() => {
                                    bmd.destroy();
                                });
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
                        psy_sprite.data.custom_key = sprite_info.per_target
                            ? `${sprite_type}/${i}/${j}/${sprite_info.per_target_key}/${k}`
                            : `${sprite_type}/${i}/${j}`;
                        psy_sprite.data.trail_image = trail_image;
                        psy_sprite.data.trail_enabled = true;
                        psy_sprite.data.ignore_trim = true;
                        psy_sprite.data.follow_sprite = sprite_info.follow_sprite;
                        if (sprite_info.initial_config) {
                            psy_sprite.anchor.x = sprite_info.initial_config.anchor?.x ?? psy_sprite.anchor.x;
                            psy_sprite.anchor.y = sprite_info.initial_config.anchor?.y ?? psy_sprite.anchor.y;
                            psy_sprite.scale.x = sprite_info.initial_config.scale?.x ?? psy_sprite.scale.x;
                            psy_sprite.scale.y = sprite_info.initial_config.scale?.y ?? psy_sprite.scale.y;
                            psy_sprite.alpha = sprite_info.initial_config.alpha ?? psy_sprite.alpha;
                            if (sprite_info.initial_config.frame_name) {
                                psy_sprite.frameName = sprite_info.initial_config.frame_name;
                            }
                            const pos = this.get_sprite_xy_pos(
                                sprite_info.initial_config.x ?? psy_sprite.x,
                                sprite_info.initial_config.y ?? psy_sprite.y,
                                0,
                                0
                            );
                            psy_sprite.x = pos.x;
                            psy_sprite.y = pos.y;
                            if (sprite_info.initial_config.blend_mode === "screen") {
                                psy_sprite.blendMode = Phaser.blendModes.SCREEN;
                            }
                        }
                        if (sprite_info.per_target) {
                            if (sprite_info.per_target_key in this.per_target_sprites) {
                                this.per_target_sprites[sprite_info.per_target_key].push(psy_sprite);
                            } else {
                                this.per_target_sprites[sprite_info.per_target_key] = [psy_sprite];
                            }
                            if (k === 0) {
                                this.sprites.push(null);
                            }
                        } else {
                            this.sprites.push(psy_sprite);
                        }
                    }
                }
            }
        }
        this.sprites.forEach(sprite => {
            if (sprite?.data.follow_sprite !== undefined) {
                sprite.data.follow_sprite = Object.values(
                    this.get_sprites({sprite_index: sprite.data.follow_sprite})
                )[0].obj;
            }
        });
        this.set_filters();
    }

    manage_filter(filter: Phaser.Filter, sprite: PlayerSprite | PIXI.DisplayObject, remove: boolean) {
        const index = sprite.filters ? sprite.filters.indexOf(filter) : -1;
        if (remove) {
            if (sprite.filters) {
                sprite.filters.splice(index, 1);
                if (sprite.filters.length === 0) {
                    sprite.filters = undefined;
                }
            }
        } else if (index === -1) {
            if (sprite.filters) {
                sprite.filters = [...sprite.filters, filter];
            } else {
                sprite.filters = [filter];
            }
        }
    }

    set_filters() {
        const set_available_filters = (sprite: BattleAnimation["sprites"][0]) => {
            const colorize_filter = this.game.add.filter("Colorize") as Phaser.Filter.Colorize;
            sprite.available_filters[colorize_filter.key] = colorize_filter;
            const levels_filter = this.game.add.filter("Levels") as Phaser.Filter.Levels;
            sprite.available_filters[levels_filter.key] = levels_filter;
            const color_blend_filter = this.game.add.filter("ColorBlend") as Phaser.Filter.ColorBlend;
            sprite.available_filters[color_blend_filter.key] = color_blend_filter;
            const hue_filter = this.game.add.filter("Hue") as Phaser.Filter.Hue;
            sprite.available_filters[hue_filter.key] = hue_filter;
            const tint_filter = this.game.add.filter("Tint") as Phaser.Filter.Tint;
            sprite.available_filters[tint_filter.key] = tint_filter;
            const gray_filter = this.game.add.filter("Gray") as Phaser.Filter.Gray;
            sprite.available_filters[gray_filter.key] = gray_filter;
            const flame_filter = this.game.add.filter("Flame") as Phaser.Filter.Flame;
            sprite.available_filters[flame_filter.key] = flame_filter;
            const pixel_shift_filter = this.game.add.filter("PixelShift") as Phaser.Filter.PixelShift;
            sprite.available_filters[pixel_shift_filter.key] = pixel_shift_filter;
            const alpha_gray_filter = this.game.add.filter("AlphaGray") as Phaser.Filter.AlphaGray;
            sprite.available_filters[alpha_gray_filter.key] = alpha_gray_filter;
            const glow_filter = this.game.add.filter("Glow", 5, 0.2) as Phaser.Filter.Glow;
            sprite.available_filters[glow_filter.key] = glow_filter;
        };
        this.sprites.forEach(sprite => {
            if (!sprite) {
                return;
            }
            set_available_filters(sprite);
        });
        for (let key in this.per_target_sprites) {
            for (let sprite of this.per_target_sprites[key]) {
                if (sprite) {
                    set_available_filters(sprite);
                }
            }
        }
    }

    get_expanded_values(recipe: CompactValuesSpecifier, number: number | target_types) {
        if (typeof number === "string") {
            switch (number) {
                case target_types.ALLIES:
                    number = this.allies_sprites.length;
                    break;
                case target_types.BACKGROUND:
                    number = this.background_sprites.length;
                    break;
                case target_types.CASTER:
                    number = 1;
                    break;
                case target_types.TARGETS:
                    number = this.targets_sprites.length;
                    break;
            }
        }
        const result = new Array<number>(number as number);
        for (let i = 0; i < (number as number); ++i) {
            result[i] = recipe.starting_value + i * recipe.cumulator;
        }
        return recipe.reverse ? result.reverse() : result;
    }

    play(finish_callback: () => void) {
        this.running = true;
        this.promises = [];
        this.play_number_property_sequence(this.x_sequence, "x");
        this.play_number_property_sequence(this.y_sequence, "y");
        this.play_number_property_sequence(this.x_ellipse_axis_factor_sequence, "ellipses_semi_major");
        this.play_number_property_sequence(this.y_ellipse_axis_factor_sequence, "ellipses_semi_minor");
        this.play_number_property_sequence(this.center_shift_sequence, "center_shift");
        this.play_number_property_sequence(this.alpha_sequence, "alpha");
        this.play_number_property_sequence(this.rotation_sequence, "rotation", {
            rotational_property: true,
            rotate_in_4h_quadrant: true,
        });
        this.play_number_property_sequence(this.x_scale_sequence, "scale.x");
        this.play_number_property_sequence(this.y_scale_sequence, "scale.y");
        this.play_number_property_sequence(this.x_anchor_sequence, "anchor.x");
        this.play_number_property_sequence(this.y_anchor_sequence, "anchor.y");
        this.play_number_property_sequence(this.hue_angle_sequence, "available_filters.hue.angle", {
            rotational_property: true,
            filter_key: "hue",
        });
        this.play_number_property_sequence(this.grayscale_sequence, "available_filters.gray.intensity", {
            filter_key: "gray",
        });
        this.play_sprite_sequence();
        this.play_set_frame_sequence();
        this.play_blend_modes();
        this.play_colorize_filter();
        this.play_tint_filter();
        this.play_levels_filter();
        this.play_color_blend_filter();
        this.play_flame_filter();
        this.play_alpha_gray_filter();
        this.play_stage_angle_sequence();
        this.play_particles();
        this.play_sfx();
        this.play_blink_sequence();
        this.play_shake_sequence();
        this.play_texture_displacement_sequence();
        this.play_misc_sequence();
        this.play_lightning_sequence();
        this.play_glow_filter();
        this.unmount_animation(finish_callback);
    }

    unmount_animation(finish_callback) {
        Promise.all(this.promises).then(() => {
            if (this.destroy_sprites) {
                this.sprites.forEach(sprite => {
                    if (!sprite) {
                        return;
                    }
                    sprite.filters = undefined;
                    for (let filter_key in sprite.available_filters) {
                        (sprite.available_filters[filter_key] as Phaser.Filter).destroy();
                    }
                    sprite.destroy();
                });
                for (let key in this.per_target_sprites) {
                    for (let sprite of this.per_target_sprites[key]) {
                        if (sprite) {
                            sprite.filters = undefined;
                            for (let filter_key in sprite.available_filters) {
                                (sprite.available_filters[filter_key] as Phaser.Filter).destroy();
                            }
                            sprite.destroy();
                        }
                    }
                }
            }
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
        obj_propety?: string
    ): {
        [key: string]: {
            obj: PIXI.DisplayObject | PlayerSprite | keyof PlayerSprite | Phaser.Filter;
            sprite?: PIXI.DisplayObject | PlayerSprite;
            index: number;
        };
    } {
        if (obj_propety) {
            if (seq.sprite_index === target_types.BACKGROUND) {
                return this.background_sprites.reduce((prev, cur, index) => {
                    prev[`${cur.key}/${index}`] = {
                        obj: _.get(cur, obj_propety),
                        sprite: cur,
                        index: index,
                    };
                    return prev;
                }, {});
            } else if (seq.sprite_index === target_types.CASTER) {
                let sprite: PlayerSprite | PIXI.DisplayObject = this.caster_sprite;
                if (seq.dont_affect_shadow) {
                    sprite = this.caster_sprite.char_sprite;
                } else if (seq.affect_only_shadow) {
                    sprite = this.caster_sprite.shadow_sprite;
                }
                return {
                    [this.caster_sprite.key]: {
                        obj: _.get(this.caster_sprite, obj_propety) as keyof PlayerSprite,
                        sprite: sprite,
                        index: 0,
                    },
                };
            } else if (seq.sprite_index === target_types.TARGETS || seq.sprite_index === target_types.ALLIES) {
                const sprites = seq.sprite_index === target_types.TARGETS ? this.targets_sprites : this.allies_sprites;
                return sprites.reduce((prev, cur, index) => {
                    let sprite: PlayerSprite | PIXI.DisplayObject = cur;
                    if (seq.dont_affect_shadow) {
                        sprite = cur.char_sprite;
                    } else if (seq.affect_only_shadow) {
                        sprite = cur.shadow_sprite;
                    }
                    prev[`${cur.key}/${index}`] = {
                        obj: _.get(cur, obj_propety),
                        sprite: sprite,
                        index: index,
                    };
                    return prev;
                }, {});
            } else {
                if (Array.isArray(seq.sprite_index)) {
                    return seq.sprite_index.reduce((prev, cur, index) => {
                        prev[this.sprites[cur].data.custom_key] = {
                            obj: _.get(this.sprites[cur], obj_propety),
                            sprite: this.sprites[cur],
                            index: index,
                        };
                        return prev;
                    }, {});
                } else if (!Array.isArray(seq.sprite_index) && typeof seq.sprite_index === "object") {
                    const sprite_index_arr = this.get_expanded_values(
                        seq.sprite_index as CompactValuesSpecifier,
                        seq.sprite_index.amount
                    );
                    return sprite_index_arr.reduce((prev, cur, index) => {
                        prev[this.sprites[cur].data.custom_key] = {
                            obj: _.get(this.sprites[cur], obj_propety),
                            sprite: this.sprites[cur],
                            index: index,
                        };
                        return prev;
                    }, {});
                } else if (seq.per_target_key) {
                    return this.per_target_sprites[seq.per_target_key].reduce((acc, cur, index) => {
                        acc[cur.data.custom_key] = {
                            obj: _.get(cur, obj_propety),
                            sprite: cur,
                            index: index,
                        };
                        return acc;
                    }, {});
                } else {
                    return {
                        [this.sprites[seq.sprite_index].data.custom_key]: {
                            obj: _.get(this.sprites[seq.sprite_index], obj_propety),
                            sprite: this.sprites[seq.sprite_index],
                            index: 0,
                        },
                    };
                }
            }
        } else {
            if (seq.sprite_index === target_types.BACKGROUND) {
                return this.background_sprites.reduce((prev, cur, index) => {
                    prev[`${cur.key}/${index}`] = {
                        obj: cur,
                        index: index,
                    };
                    return prev;
                }, {});
            } else if (seq.sprite_index === target_types.CASTER) {
                let sprite: PlayerSprite | PIXI.DisplayObject = this.caster_sprite;
                if (seq.dont_affect_shadow) {
                    sprite = this.caster_sprite.char_sprite;
                } else if (seq.affect_only_shadow) {
                    sprite = this.caster_sprite.shadow_sprite;
                }
                return {
                    [this.caster_sprite.key]: {
                        obj: sprite,
                        index: 0,
                    },
                };
            } else if (seq.sprite_index === target_types.TARGETS || seq.sprite_index === target_types.ALLIES) {
                const sprites = seq.sprite_index === target_types.TARGETS ? this.targets_sprites : this.allies_sprites;
                return sprites.reduce((prev, cur, index) => {
                    let sprite: PlayerSprite | PIXI.DisplayObject = cur;
                    if (seq.dont_affect_shadow) {
                        sprite = cur.char_sprite;
                    } else if (seq.affect_only_shadow) {
                        sprite = cur.shadow_sprite;
                    }
                    prev[`${cur.key}/${index}`] = {
                        obj: sprite,
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
            } else if (!Array.isArray(seq.sprite_index) && typeof seq.sprite_index === "object") {
                const sprite_index_arr = this.get_expanded_values(
                    seq.sprite_index as CompactValuesSpecifier,
                    seq.sprite_index.amount
                );
                return sprite_index_arr.reduce((prev, cur, index) => {
                    prev[this.sprites[cur].data.custom_key] = {
                        obj: this.sprites[cur],
                        index: index,
                    };
                    return prev;
                }, {});
            } else if (seq.per_target_key) {
                return this.per_target_sprites[seq.per_target_key].reduce((acc, cur, index) => {
                    acc[cur.data.custom_key] = {
                        obj: cur,
                        index: index,
                    };
                    return acc;
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
        sequence: DefaultAttr[],
        target_property: string,
        options?: {
            rotational_property?: boolean;
            filter_key?: string;
            rotate_in_4h_quadrant?: boolean;
        }
    ) {
        const dot_index = target_property.lastIndexOf(".");
        const obj_propety = dot_index >= 0 ? target_property.slice(0, dot_index) : null;
        const property_to_set =
            dot_index >= 0 ? target_property.slice(dot_index + 1, target_property.length) : target_property;
        for (let i = 0; i < sequence.length; ++i) {
            const seq = sequence[i];
            if (seq.ignore_if_dodge && this.target_dodged) {
                continue;
            }
            const sprites = this.get_sprites(seq, obj_propety);
            if (!Array.isArray(seq.start_delay) && typeof seq.start_delay === "object") {
                seq.start_delay = this.get_expanded_values(
                    seq.start_delay as CompactValuesSpecifier,
                    Object.keys(sprites).length
                );
            }
            if (!Array.isArray(seq.to) && typeof seq.to === "object") {
                seq.to = this.get_expanded_values(seq.to as CompactValuesSpecifier, Object.keys(sprites).length);
            }
            if (!Array.isArray(seq.shift) && typeof seq.shift === "object") {
                seq.shift = this.get_expanded_values(seq.shift as CompactValuesSpecifier, Object.keys(sprites).length);
            }
            for (let key in sprites) {
                const sprite_info = sprites[key];
                const this_sprite = sprite_info.obj;
                if (options?.filter_key) {
                    const filter = this_sprite as Phaser.Filter;
                    const remove = seq.remove ?? false;
                    this.manage_filter(filter, sprite_info.sprite, remove);
                    if (remove) {
                        return;
                    }
                }
                const uniq_key: string = key;
                const get_to_value = () => {
                    if (this.sprites_prev_properties[uniq_key] === undefined) {
                        this.sprites_prev_properties[uniq_key] = {};
                    }
                    if (this.sprites_prev_properties[uniq_key][property_to_set] === undefined) {
                        this.sprites_prev_properties[uniq_key][property_to_set] = this_sprite[property_to_set];
                    }
                    const seq_to = Array.isArray(seq.to) ? seq.to[sprite_info.index] : seq.to;
                    let to_value: number = seq_to as number;
                    if (
                        [target_types.TARGETS, target_types.ALLIES, target_types.CASTER].includes(
                            seq_to as target_types
                        )
                    ) {
                        let player_sprite = this.caster_sprite;
                        if (seq_to === target_types.TARGETS) {
                            if (seq.per_target_key) {
                                player_sprite = this.targets_sprites[sprite_info.index];
                            } else {
                                player_sprite = this.targets_sprites[this.targets_sprites.length >> 1];
                            }
                        } else if (seq_to === target_types.ALLIES) {
                            player_sprite = this.allies_sprites[this.allies_sprites.length >> 1];
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
                            ((Array.isArray(seq.shift) ? seq.shift[sprite_info.index] : (seq.shift as number)) ?? 0) *
                            shift_sign;
                        to_value = player_sprite[property_to_set] + shift;
                        if (this.mirrored && property_to_set === "x") {
                            to_value = numbers.GAME_WIDTH - to_value;
                        }
                    } else if (seq_to === to_misc_values.RESET) {
                        const index_on_stage = this.data.battle_instance.battle_stage.sprites.indexOf(
                            this_sprite as PlayerSprite
                        );
                        const pos = this.data.battle_instance.battle_stage.get_player_position_in_stage(index_on_stage);
                        to_value = pos[property_to_set];
                        this.sprites_prev_properties[uniq_key][property_to_set] = to_value;
                        if (seq.to_expression) {
                            to_value = mathjs.evaluate(seq.to_expression, {v: to_value});
                        }
                        return to_value;
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
                        : this.sprites_prev_properties[uniq_key][property_to_set] + to_value;
                    this.sprites_prev_properties[uniq_key][property_to_set] = to_value;
                    if (seq.to_expression) {
                        to_value = mathjs.evaluate(seq.to_expression, {v: to_value});
                    }
                    to_value = seq.round_final_value ? Math.floor(to_value) : to_value;
                    return to_value;
                };
                const start_delay = Array.isArray(seq.start_delay)
                    ? seq.start_delay[sprite_info.index]
                    : (seq.start_delay as number) ?? 0;
                const duration = Array.isArray(seq.duration) ? seq.duration[sprite_info.index] : seq.duration ?? 0;
                let resolve_function;
                const this_promise = new Promise(resolve => {
                    resolve_function = resolve;
                });
                this.promises.push(this_promise);
                const call_tween = () => {
                    const tween = this.game.add
                        .tween(this_sprite)
                        .to(
                            {[property_to_set]: get_to_value},
                            duration,
                            seq.tween ? _.get(Phaser.Easing, seq.tween) : Phaser.Easing.Linear.None,
                            true,
                            0,
                            0,
                            seq.yoyo ?? false,
                            true
                        );
                    if (["ellipses_semi_major", "ellipses_semi_minor", "center_shift"].includes(property_to_set)) {
                        tween.onStart.addOnce(() => {
                            (this_sprite as PlayerSprite).force_stage_update = true;
                        });
                    }
                    tween.onComplete.addOnce(() => {
                        if (["ellipses_semi_major", "ellipses_semi_minor", "center_shift"].includes(property_to_set)) {
                            (this_sprite as PlayerSprite).force_stage_update = false;
                        }
                        if (seq.is_absolute && options?.rotational_property) {
                            this_sprite[property_to_set] = range_360(this_sprite[property_to_set]);
                        }
                        resolve_function();
                    });
                };
                if (start_delay < 30) {
                    if (duration < 30) {
                        this_sprite[property_to_set] = get_to_value();
                        resolve_function();
                    } else {
                        call_tween();
                    }
                } else {
                    this.game.time.events.add(start_delay, () => {
                        if (duration < 30) {
                            this_sprite[property_to_set] = get_to_value();
                            if (
                                ["ellipses_semi_major", "ellipses_semi_minor", "center_shift"].includes(property_to_set)
                            ) {
                                this.battle_stage.update_sprite_properties();
                            }
                            if (seq.is_absolute && options?.rotational_property) {
                                this_sprite[property_to_set] = range_360(this_sprite[property_to_set]);
                            }
                            if (resolve_function !== undefined) {
                                resolve_function();
                            }
                        } else {
                            call_tween();
                        }
                    });
                }
            }
        }
    }

    play_sprite_sequence() {
        const index_promises_resolve = new Array<() => void>(this.play_sequence.length);
        const index_promises = new Array<Promise<void>>(this.play_sequence.length).fill(null).map((foo, i) => {
            return new Promise<void>(resolve => (index_promises_resolve[i] = resolve));
        });
        for (let i = 0; i < this.play_sequence.length; ++i) {
            const play_seq = this.play_sequence[i];
            if (play_seq.ignore_if_dodge && this.target_dodged) {
                continue;
            }
            const sprites = this.get_sprites(play_seq);
            const sprites_length = Object.keys(sprites).length;
            if (!Array.isArray(play_seq.start_delay) && typeof play_seq.start_delay === "object") {
                play_seq.start_delay = this.get_expanded_values(
                    play_seq.start_delay as CompactValuesSpecifier,
                    Object.keys(sprites).length
                );
            }
            for (let key in sprites) {
                const sprite_info = sprites[key];
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
            }
        }
    }

    play_set_frame_sequence() {
        for (let i = 0; i < this.set_frame_sequence.length; ++i) {
            const set_frame_seq = this.set_frame_sequence[i];
            if (set_frame_seq.ignore_if_dodge && this.target_dodged) {
                continue;
            }
            const sprites = this.get_sprites(set_frame_seq);
            for (let key in sprites) {
                const sprite_info = sprites[key];
                const sprite = sprite_info.obj as PlayerSprite | Phaser.Sprite;
                let resolve_function;
                const this_promise = new Promise(resolve => {
                    resolve_function = resolve;
                });
                this.promises.push(this_promise);
                const start_delay = Array.isArray(set_frame_seq.start_delay)
                    ? set_frame_seq.start_delay[sprite_info.index]
                    : set_frame_seq.start_delay;
                const set_sprite_frame = () => {
                    sprite.frameName = Array.isArray(set_frame_seq.frame_name)
                        ? set_frame_seq.frame_name[sprite_info.index]
                        : set_frame_seq.frame_name;
                    resolve_function();
                };
                if (start_delay > 30) {
                    this.game.time.events.add(start_delay, set_sprite_frame);
                } else {
                    set_sprite_frame();
                }
            }
        }
    }

    play_blend_modes() {
        for (let i = 0; i < this.blend_mode_sequence.length; ++i) {
            const blend_mode_seq = this.blend_mode_sequence[i];
            if (blend_mode_seq.ignore_if_dodge && this.target_dodged) {
                continue;
            }
            const sprites = this.get_sprites(blend_mode_seq);
            for (let key in sprites) {
                const sprite_info = sprites[key];
                const sprite = sprite_info.obj as PlayerSprite | Phaser.Sprite;
                let resolve_function;
                const this_promise = new Promise(resolve => {
                    resolve_function = resolve;
                });
                this.promises.push(this_promise);
                const start_delay = Array.isArray(blend_mode_seq.start_delay)
                    ? blend_mode_seq.start_delay[sprite_info.index]
                    : blend_mode_seq.start_delay;
                const apply_blend_mode = () => {
                    switch (blend_mode_seq.mode) {
                        case "screen":
                            sprite.blendMode = PIXI.blendModes.SCREEN;
                            break;
                        case "normal":
                            sprite.blendMode = PIXI.blendModes.NORMAL;
                            break;
                    }
                    resolve_function();
                };
                if (start_delay > 30) {
                    this.game.time.events.add(start_delay, apply_blend_mode);
                } else {
                    apply_blend_mode();
                }
            }
        }
    }

    play_lightning_sequence() {
        for (let i = 0; i < this.lighting_sequence.length; ++i) {
            const lighting_seq = this.lighting_sequence[i];
            if (lighting_seq.ignore_if_dodge && this.target_dodged) {
                continue;
            }
            const from_delta = lighting_seq.from.delta ?? {x: 0, y: 0};
            const to_delta = lighting_seq.to.delta ?? {x: 0, y: 0};
            const from = this.get_sprite_xy_pos(
                lighting_seq.from.pos.x,
                lighting_seq.from.pos.y,
                from_delta.x,
                from_delta.y
            );
            const to = this.get_sprite_xy_pos(lighting_seq.to.pos.x, lighting_seq.to.pos.y, to_delta.x, to_delta.y);
            const pos_range_delta_from = lighting_seq.from.range_delta ?? {x: 0, y: 0};
            pos_range_delta_from.x = pos_range_delta_from.x ?? 0;
            pos_range_delta_from.y = pos_range_delta_from.y ?? 0;
            const pos_range_delta_to = lighting_seq.from.range_delta ?? {x: 0, y: 0};
            pos_range_delta_to.x = pos_range_delta_to.x ?? 0;
            pos_range_delta_to.y = pos_range_delta_to.y ?? 0;
            const thickness_base_value = lighting_seq.thickness?.base_value ?? 1;
            const thickness_range_delta = lighting_seq.thickness?.range_delta ?? 0;
            const count = lighting_seq.count ?? 1;
            const trail = lighting_seq.trail ?? true;
            const trail_factor = lighting_seq.trail_factor ?? 0.5;
            const trail_count = lighting_seq.trail_count ?? -1;
            const trail_colorize = lighting_seq.trail_colorize ?? null;
            const duration = _.clamp(lighting_seq.duration, 30, Infinity);
            for (let j = 0; j < count; ++j) {
                let resolve_function;
                const this_promise = new Promise(resolve => {
                    resolve_function = resolve;
                });
                this.promises.push(this_promise);
                let interval_time = 0;
                if (lighting_seq.count > 1 && lighting_seq.interval_time) {
                    interval_time = Array.isArray(lighting_seq.interval_time)
                        ? lighting_seq.interval_time[j]
                        : lighting_seq.interval_time * j;
                }
                const cast_lighting = async () => {
                    if (interval_time > 30) {
                        await promised_wait(this.game, interval_time);
                    }
                    const calcualted_from = {
                        x: from.x + _.random(-pos_range_delta_from.x, pos_range_delta_from.x, true),
                        y: from.y + _.random(-pos_range_delta_from.y, pos_range_delta_from.y, true),
                    };
                    const calcualted_to = {
                        x: to.x + _.random(-pos_range_delta_to.y, pos_range_delta_to.x, true),
                        y: to.y + _.random(-pos_range_delta_to.y, pos_range_delta_to.x, true),
                    };
                    const thickness =
                        thickness_base_value + _.random(-thickness_range_delta, thickness_range_delta, true);
                    const cast_angle = Math.atan2(
                        calcualted_to.y - calcualted_from.y,
                        calcualted_to.x - calcualted_from.x
                    );
                    const cast_angle_sin = Math.sin(cast_angle);
                    const cast_angle_cos = Math.cos(cast_angle);
                    const dist = get_distance(calcualted_from.x, calcualted_to.x, calcualted_from.y, calcualted_to.y);
                    const data_size = dist | 0;

                    const group_pos = lighting_seq.render_position ?? battle_positions.BETWEEN;
                    const group = this.ability_sprites_groups[group_pos];
                    const img = this.game.add.image(0, 0, undefined, undefined, group);
                    const bmp = this.game.add.bitmapData(numbers.GAME_WIDTH, numbers.GAME_HEIGHT);
                    bmp.smoothed = false;
                    bmp.add(img);
                    bmp.clear();
                    this.sprites.push(img);

                    if (lighting_seq.glow) {
                        const glow_filter = this.game.add.filter(
                            "Glow",
                            lighting_seq.glow.distance,
                            lighting_seq.glow.quality ?? 0.5
                        ) as Phaser.Filter.Glow;
                        glow_filter.r = lighting_seq.glow.r;
                        glow_filter.g = lighting_seq.glow.g;
                        glow_filter.b = lighting_seq.glow.b;
                        glow_filter.outer_strength = lighting_seq.glow.strength;
                        glow_filter.texture_width = img.texture.baseTexture.width;
                        glow_filter.texture_height = img.texture.baseTexture.height;
                        img.filters = [glow_filter];
                    }

                    if (trail) {
                        const trail_bitmap_data = this.game.make.bitmapData(numbers.GAME_WIDTH, numbers.GAME_HEIGHT);
                        trail_bitmap_data.smoothed = false;
                        trail_bitmap_data.fill(0, 0, 0, 1);
                        trail_bitmap_data.trail_factor = trail_factor;
                        const trail_image = this.game.make.image(0, 0, trail_bitmap_data);
                        trail_image.blendMode = Phaser.blendModes.SCREEN;
                        this.trails_bmps.push(trail_bitmap_data);
                        this.trails_objs.push(trail_image);
                        this.ability_sprites_groups[group_pos].addChild(trail_image);
                        img.data.trail_image = trail_image;
                        img.data.trail_count = trail_count;
                        img.data.trail_applied = 0;
                        img.data.trail_enabled = true;
                        img.data.render_texture = this.game.make.renderTexture(img.width, img.height);

                        if (trail_colorize) {
                            const colorize_filter = this.game.add.filter("Colorize") as Phaser.Filter.Colorize;
                            colorize_filter.color = trail_colorize.color;
                            colorize_filter.intensity = trail_colorize.intensity;
                            trail_image.filters = [colorize_filter];
                        }
                    }

                    const y_data = cumsum(random_normal(data_size, lighting_seq.roughness ?? 0.01, 0));
                    for (let k = 0; k < data_size; ++k) {
                        const x = calcualted_from.x + (dist * k) / data_size;
                        const y = calcualted_from.y + dist * y_data[k];
                        const rot_x =
                            (x - calcualted_from.x) * cast_angle_cos -
                            (y - calcualted_from.y) * cast_angle_sin +
                            calcualted_from.x;
                        const rot_y =
                            (x - calcualted_from.x) * cast_angle_sin +
                            (y - calcualted_from.y) * cast_angle_cos +
                            calcualted_from.y;
                        bmp.setPixel32(rot_x | 0, rot_y | 0, 255, 255, 255, 255, false);
                    }

                    bmp.context.putImageData(bmp.imageData, 0, 0);

                    this.game.time.events.add(duration, () => {
                        bmp.destroy();
                        img.destroy();
                        resolve_function();
                    });
                };
                let start_delay = lighting_seq.start_delay;
                if (!Array.isArray(start_delay) && typeof start_delay === "object") {
                    start_delay = this.get_expanded_values(start_delay as CompactValuesSpecifier, count);
                }
                start_delay = Array.isArray(start_delay) ? start_delay[j] : (start_delay as number) ?? 0;
                if (start_delay < 30) {
                    cast_lighting();
                } else {
                    this.game.time.events.add(start_delay, cast_lighting);
                }
            }
        }
    }

    play_sfx() {
        for (let i = 0; i < this.sfx_sequence.length; ++i) {
            const sfx_seq = this.sfx_sequence[i];
            if (sfx_seq.ignore_if_dodge && this.target_dodged) {
                continue;
            }
            let resolve_function;
            const this_promise = new Promise(resolve => {
                resolve_function = resolve;
            });
            this.promises.push(this_promise);
            const play = () => {
                this.data.audio.play_se(sfx_seq.sfx_key, undefined, sfx_seq.position_shift, sfx_seq.volume);
                resolve_function();
            };
            if (sfx_seq.start_delay < 30) {
                play();
            } else {
                this.game.time.events.add(sfx_seq.start_delay, play);
            }
        }
    }

    play_misc_sequence() {
        for (let i = 0; i < this.misc_sequence.length; ++i) {
            const misc_seq = this.misc_sequence[i];
            if (misc_seq.ignore_if_dodge && this.target_dodged) {
                continue;
            }
            const sprites = this.get_sprites(misc_seq);
            if (!Array.isArray(misc_seq.start_delay) && typeof misc_seq.start_delay === "object") {
                misc_seq.start_delay = this.get_expanded_values(
                    misc_seq.start_delay as CompactValuesSpecifier,
                    Object.keys(sprites).length
                );
            }
            for (let key in sprites) {
                const sprite_info = sprites[key];
                const sprite = sprite_info.obj as PlayerSprite | Phaser.Sprite;
                let resolve_function;
                const this_promise = new Promise(resolve => {
                    resolve_function = resolve;
                });
                this.promises.push(this_promise);
                const start_delay = Array.isArray(misc_seq.start_delay)
                    ? misc_seq.start_delay[sprite_info.index]
                    : misc_seq.start_delay;
                const apply_misc = () => {
                    if (misc_seq.type === "trail_toggle" && sprite.data.trail_image) {
                        sprite.data.trail_enabled = !sprite.data.trail_enabled;
                    }
                    resolve_function();
                };
                if (start_delay > 30) {
                    this.game.time.events.add(start_delay, apply_misc);
                } else {
                    apply_misc();
                }
            }
        }
    }

    play_general_filter(
        sequence: GeneralFilterAttr[],
        filter_key: engine_filters,
        set_filter: (
            sequence: GeneralFilterAttr,
            filter: Phaser.Filter,
            sprite?: PlayerSprite | Phaser.Sprite,
            sprite_index?: number
        ) => void
    ) {
        for (let i = 0; i < sequence.length; ++i) {
            const filter_seq = sequence[i];
            if (filter_seq.ignore_if_dodge && this.target_dodged) {
                continue;
            }
            const sprites = this.get_sprites(filter_seq);
            if (!Array.isArray(filter_seq.start_delay) && typeof filter_seq.start_delay === "object") {
                filter_seq.start_delay = this.get_expanded_values(
                    filter_seq.start_delay as CompactValuesSpecifier,
                    Object.keys(sprites).length
                );
            }
            for (let key in sprites) {
                const sprite_info = sprites[key];
                const sprite = sprite_info.obj as PlayerSprite | Phaser.Sprite;
                let resolve_function;
                const this_promise = new Promise(resolve => (resolve_function = resolve));
                this.promises.push(this_promise);
                const start_delay = Array.isArray(filter_seq.start_delay)
                    ? filter_seq.start_delay[sprite_info.index]
                    : (filter_seq.start_delay as number);
                const apply_filter = async () => {
                    const filter = sprite.available_filters[filter_key];
                    this.manage_filter(filter as Phaser.Filter, sprite, filter_seq.remove);
                    if (!filter_seq.remove) {
                        if (set_filter) {
                            await set_filter(filter_seq, filter as Phaser.Filter, sprite, sprite_info.index);
                        }
                    }
                    resolve_function();
                };
                if (start_delay > 30) {
                    this.game.time.events.add(start_delay, apply_filter);
                } else {
                    apply_filter();
                }
            }
        }
    }

    play_levels_filter() {
        this.play_general_filter(
            this.levels_filter_sequence,
            engine_filters.LEVELS,
            async (filter_seq: BattleAnimation["levels_filter_sequence"][0], filter: Phaser.Filter.Levels) => {
                if (filter_seq.duration && filter_seq.duration > 30) {
                    let promise_resolve;
                    const promise = new Promise(resolve => (promise_resolve = resolve));
                    this.data.game.add
                        .tween(filter)
                        .to(
                            {
                                min_input: filter_seq.min_input ?? filter.min_input,
                                max_input: filter_seq.max_input ?? filter.max_input,
                                gamma: filter_seq.gamma ?? filter.gamma,
                            },
                            filter_seq.duration,
                            Phaser.Easing.Linear.None,
                            true
                        )
                        .onComplete.addOnce(promise_resolve);
                    await promise;
                } else {
                    filter.min_input = filter_seq.min_input ?? filter.min_input;
                    filter.max_input = filter_seq.max_input ?? filter.max_input;
                    filter.gamma = filter_seq.gamma ?? filter.gamma;
                }
            }
        );
    }

    play_color_blend_filter() {
        this.play_general_filter(
            this.color_blend_filter_sequence,
            engine_filters.COLOR_BLEND,
            async (filter_seq: BattleAnimation["color_blend_filter_sequence"][0], filter: Phaser.Filter.ColorBlend) => {
                filter.fake_blend = filter_seq.fake_blend ?? filter.fake_blend;
                if (filter_seq.duration && filter_seq.duration > 30) {
                    let promise_resolve;
                    const promise = new Promise(resolve => (promise_resolve = resolve));
                    this.data.game.add
                        .tween(filter)
                        .to(
                            {
                                r: filter_seq.r ?? filter.r,
                                g: filter_seq.g ?? filter.g,
                                b: filter_seq.b ?? filter.b,
                            },
                            filter_seq.duration,
                            filter_seq.tween ? _.get(Phaser.Easing, filter_seq.tween) : Phaser.Easing.Linear.None,
                            true
                        )
                        .onComplete.addOnce(promise_resolve);
                    await promise;
                } else {
                    filter.r = filter_seq.r ?? filter.r;
                    filter.g = filter_seq.g ?? filter.g;
                    filter.b = filter_seq.b ?? filter.b;
                }
            }
        );
    }

    play_flame_filter() {
        this.play_general_filter(this.flame_filter_sequence, engine_filters.FLAME, null);
    }

    play_alpha_gray_filter() {
        this.play_general_filter(this.alpha_gray_filter_sequence, engine_filters.ALPHA_GRAY, null);
    }

    play_tint_filter() {
        this.play_general_filter(
            this.tint_sequence,
            engine_filters.TINT,
            (filter_seq: BattleAnimation["tint_sequence"][0], filter: Phaser.Filter.Tint) => {
                filter.r = filter_seq.r ?? filter.r;
                filter.g = filter_seq.g ?? filter.g;
                filter.b = filter_seq.b ?? filter.b;
            }
        );
    }

    play_colorize_filter() {
        this.play_general_filter(
            this.colorize_sequence,
            engine_filters.COLORIZE,
            async (filter_seq: BattleAnimation["colorize_sequence"][0], filter: Phaser.Filter.Colorize) => {
                if (filter_seq.duration && filter_seq.duration > 30) {
                    let promise_resolve;
                    const promise = new Promise(resolve => (promise_resolve = resolve));
                    this.data.game.add
                        .tween(filter)
                        .to(
                            {
                                intensity: filter_seq.intensity ?? filter.intensity,
                            },
                            filter_seq.duration,
                            filter_seq.tween ? _.get(Phaser.Easing, filter_seq.tween) : Phaser.Easing.Linear.None,
                            true
                        )
                        .onComplete.addOnce(promise_resolve);
                    await promise;
                } else {
                    filter.intensity = filter_seq.intensity ?? filter.intensity;
                }
                filter.color = filter_seq.color ?? filter.color;
            }
        );
    }

    play_glow_filter() {
        this.play_general_filter(
            this.glow_filter_sequence,
            engine_filters.GLOW,
            async (filter_seq: BattleAnimation["glow_filter_sequence"][0], filter: Phaser.Filter.Glow, sprite) => {
                filter.r = filter_seq.r;
                filter.g = filter_seq.g;
                filter.b = filter_seq.b;
                filter.outer_strength = filter_seq.strength;
                filter.texture_width = sprite.texture.baseTexture.width;
                filter.texture_height = sprite.texture.baseTexture.height;
            }
        );
    }

    play_texture_displacement_sequence() {
        this.play_general_filter(
            this.texture_displacement_sequence,
            engine_filters.PIXEL_SHIFT,
            async (
                filter_seq: BattleAnimation["texture_displacement_sequence"][0],
                filter: Phaser.Filter.PixelShift,
                sprite: PlayerSprite | Phaser.Sprite,
                sprite_index: number
            ) => {
                sprite.avoidFilterCapping = true;
                filter.frame_height = sprite.texture.crop.height * sprite.scale.y;
                filter.frame_width = sprite.texture.crop.width * sprite.scale.x;
                filter.repeat_texture = filter_seq.repeat_texture ?? filter.repeat_texture;
                const x_shift =
                    (Array.isArray(filter_seq.shift.x) ? filter_seq.shift.x[sprite_index] : filter_seq.shift.x) ??
                    filter.x_shift;
                const y_shift =
                    (Array.isArray(filter_seq.shift.y) ? filter_seq.shift.y[sprite_index] : filter_seq.shift.y) ??
                    filter.y_shift;
                const duration = Array.isArray(filter_seq.duration)
                    ? filter_seq.duration[sprite_index]
                    : filter_seq.duration ?? 0;
                if (duration > 30) {
                    let resolve_function;
                    const promise = new Promise(resolve => (resolve_function = resolve));
                    this.game.add
                        .tween(filter)
                        .to(
                            {
                                x_shift: x_shift,
                                y_shift: y_shift,
                            },
                            duration,
                            filter_seq.tween ? _.get(Phaser.Easing, filter_seq.tween) : Phaser.Easing.Linear.None,
                            true,
                            undefined,
                            undefined,
                            filter_seq.yoyo ?? false
                        )
                        .onComplete.addOnce(resolve_function);
                    await promise;
                } else {
                    filter.x_shift = x_shift;
                    filter.y_shift = y_shift;
                }
            }
        );
    }

    play_shake_sequence() {
        for (let i = 0; i < this.shake_sequence.length; ++i) {
            const shake_seq = this.shake_sequence[i];
            if (shake_seq.ignore_if_dodge && this.target_dodged) {
                continue;
            }
            const sprites = this.get_sprites(shake_seq);
            if (!Array.isArray(shake_seq.start_delay) && typeof shake_seq.start_delay === "object") {
                shake_seq.start_delay = this.get_expanded_values(
                    shake_seq.start_delay as CompactValuesSpecifier,
                    Object.keys(sprites).length
                );
            }
            const shake_count = shake_seq.shake_count ? shake_seq.shake_count : 1;
            const random_delta_data = new Array(shake_count).fill(0);
            if (shake_seq.random_delta) {
                for (let i = 0; i < shake_count; ++i) {
                    random_delta_data[i] = _.random(-shake_seq.random_delta, shake_seq.random_delta);
                }
            }
            for (let key in sprites) {
                const sprite_info = sprites[key];
                const sprite = sprite_info.obj as PlayerSprite | Phaser.Sprite;
                const start_delay = Array.isArray(shake_seq.start_delay)
                    ? shake_seq.start_delay[sprite_info.index]
                    : (shake_seq.start_delay as number) ?? 0;

                let resolve_function;
                const this_promise = new Promise(resolve => (resolve_function = resolve));
                this.promises.push(this_promise);

                const apply_shake = async () => {
                    for (let i = 0; i < shake_count; ++i) {
                        let resolve_f;
                        const this_prom = new Promise(resolve => (resolve_f = resolve));
                        const direction = shake_seq.direction ?? "y";
                        let intensity = shake_seq.intensity ? shake_seq.intensity : 2;
                        intensity += random_delta_data[i];
                        this.game.add
                            .tween(sprite)
                            .to(
                                {
                                    [direction]: sprite[direction] + intensity,
                                },
                                shake_seq.interval ?? 70,
                                Phaser.Easing.Linear.None,
                                true,
                                0,
                                undefined,
                                true
                            )
                            .onComplete.addOnce(resolve_f);
                        await this_prom;
                    }
                    resolve_function();
                };

                if (start_delay < 30) {
                    apply_shake();
                } else {
                    this.game.time.events.add(start_delay, apply_shake);
                }
            }
        }
    }

    play_blink_sequence() {
        for (let i = 0; i < this.blink_sequence.length; ++i) {
            const filter_seq = this.blink_sequence[i];
            if (filter_seq.ignore_if_dodge && this.target_dodged) {
                continue;
            }
            const sprites = this.get_sprites(filter_seq);
            if (!Array.isArray(filter_seq.start_delay) && typeof filter_seq.start_delay === "object") {
                filter_seq.start_delay = this.get_expanded_values(
                    filter_seq.start_delay as CompactValuesSpecifier,
                    Object.keys(sprites).length
                );
            }
            for (let key in sprites) {
                const sprite_info = sprites[key];
                const sprite = sprite_info.obj as PlayerSprite | Phaser.Sprite;
                let resolve_function;
                const this_promise = new Promise(resolve => (resolve_function = resolve));
                this.promises.push(this_promise);
                const start_delay = Array.isArray(filter_seq.start_delay)
                    ? filter_seq.start_delay[sprite_info.index]
                    : (filter_seq.start_delay as number) ?? 0;
                const apply_blink = async () => {
                    const filter = sprite.available_filters[engine_filters.TINT] as Phaser.Filter.Tint;
                    this.manage_filter(filter as Phaser.Filter, sprite, false);

                    let counter = filter_seq.count << 1;
                    const blink_timer = this.game.time.create(false);
                    let timer_resolve;
                    const timer_promise = new Promise(resolve => (timer_resolve = resolve));
                    const r = filter_seq?.color?.r ?? 1.0;
                    const g = filter_seq?.color?.g ?? 1.0;
                    const b = filter_seq?.color?.b ?? 1.0;
                    const blink_duration = filter_seq?.duration ?? null;
                    blink_timer.loop(filter_seq.interval, async () => {
                        if (counter % 2 === 0) {
                            filter.r = r;
                            filter.g = g;
                            filter.b = b;
                        } else {
                            filter.r = -1;
                            filter.g = -1;
                            filter.b = -1;
                        }
                        if (blink_duration && blink_duration > 30 && filter.r !== -1) {
                            await promised_wait(this.game, blink_duration);
                            filter.r = -1;
                            filter.g = -1;
                            filter.b = -1;
                        }
                        --counter;
                        if (counter === 0) {
                            blink_timer.stop();
                            timer_resolve();
                        }
                    });
                    blink_timer.start();
                    await timer_promise;
                    blink_timer.destroy();
                    this.manage_filter(filter as Phaser.Filter, sprite, true);

                    resolve_function();
                };
                if (start_delay < 30) {
                    apply_blink();
                } else {
                    this.game.time.events.add(start_delay, apply_blink);
                }
            }
        }
    }

    play_stage_angle_sequence() {
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
            const duration = (stage_angle_seq.duration as number) ?? 0;
            const set_stage_angle = () => {
                if (duration < 30) {
                    if (is_absolute) {
                        this.battle_stage.camera_angle.rad = to_value;
                    } else {
                        this.battle_stage.camera_angle.rad += to_value;
                    }
                } else {
                    const tween = this.game.add
                        .tween(this.battle_stage.camera_angle)
                        .to(
                            {rad: to_value},
                            duration,
                            stage_angle_seq.tween
                                ? _.get(Phaser.Easing, stage_angle_seq.tween)
                                : Phaser.Easing.Linear.None,
                            true
                        );
                    let resolve_function;
                    const this_promise = new Promise(resolve => {
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
                }
            };
            const start_delay = (stage_angle_seq.start_delay as number) ?? 0;
            if (start_delay < 30) {
                set_stage_angle();
            } else {
                let resolve_function;
                const this_promise = new Promise(resolve => {
                    resolve_function = resolve;
                });
                this.promises.push(this_promise);
                this.game.time.events.add(start_delay, () => {
                    set_stage_angle();
                    resolve_function();
                });
            }
        }
    }

    get_sprite_xy_pos(
        x: number | string,
        y: number | string,
        shift_x: number,
        shift_y: number
    ): {x: number; y: number} {
        if (x === target_types.CASTER) {
            x = this.caster_sprite.x;
            if (this.mirrored) {
                x = numbers.GAME_WIDTH - (x as number);
            }
        } else if (x === target_types.TARGETS || x === target_types.ALLIES) {
            const sprites = x === target_types.TARGETS ? this.targets_sprites : this.allies_sprites;
            x = _.mean(sprites.map(target => target.x));
            if (this.mirrored) {
                x = numbers.GAME_WIDTH - (x as number);
            }
        }
        if (y === target_types.CASTER) {
            y = this.caster_sprite.y;
        } else if (y === target_types.TARGETS || y === target_types.ALLIES) {
            const sprites = y === target_types.TARGETS ? this.targets_sprites : this.allies_sprites;
            y = _.mean(sprites.map(target => target.y));
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
        ).promises;
        this.promises.push(...promises);
    }

    render() {
        this.trails_bmps.forEach(bmp => bmp.fill(0, 0, 0, bmp.trail_factor * this.data.fps_factor));
        this.sprites.forEach(sprite => {
            if (!sprite) {
                return;
            }
            if (sprite.data.follow_sprite) {
                sprite.x = sprite.data.follow_sprite.x;
                sprite.y = sprite.data.follow_sprite.y;
            }
            if (!sprite.data.trail_image || !sprite.data.trail_enabled) return;
            const bm_data = sprite.data.trail_image.key as Phaser.BitmapData;
            if (sprite.data.keep_core_white) {
                sprite.tint = sprite.data.color;
            }
            if (sprite.data.trail_count > 0) {
                if (sprite.data.trail_applied > sprite.data.trail_count) {
                    return;
                }
                ++sprite.data.trail_applied;
            }
            if (sprite.data.render_texture) {
                sprite.data.render_texture.renderXY(sprite, 0, 0);
                bm_data.draw(sprite.data.render_texture);
            } else {
                bm_data.draw(sprite);
            }
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
