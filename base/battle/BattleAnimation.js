const tween_types = {
    INITIAL: "initial"
};

export class BattleAnimation {
    //tween type can be 'initial' for first position
    //sprite_index: "targets" is the target, "caster" is the caster, "background" is the background sprite, 0...n is the sprites_key_names index
    //property "to" values can be "center_target", "caster" or an actual value. In the case of "center_target" or "caster", is the the corresponding property value 
    //values in rad can have direction set to "clockwise", "counter_clockwise" or "closest"
    //in sprite_keys, position can be: "between", "over" or "behind"
    //"duration" set to "instantly" must have the "start_delay" value set as absolute
    constructor(
        game,
        key_name,
        sprites_keys, //{key_name: string, per_target: bool, position: value}
        x_sequence, //{start_delay: value, sprite_index: index, to: value, is_absolute: bool, tween: type, duration: value}
        y_sequence, //{start_delay: value, sprite_index: index, to: value, is_absolute: bool, tween: type, duration: value}
        x_ellipse_axis_factor_sequence, //{start_delay: value, sprite_index: index, to: value, is_absolute: bool, tween: type, duration: value, force_stage_update: bool}
        y_ellipse_axis_factor_sequence, //{start_delay: value, sprite_index: index, to: value, is_absolute: bool, tween: type, duration: value, force_stage_update: bool}
        x_scale_sequence, //{start_delay: value, sprite_index: index, to: value, is_absolute: bool, tween: type, duration: value}
        y_scale_sequence, //{start_delay: value, sprite_index: index, to: value, is_absolute: bool, tween: type, duration: value}
        x_anchor_sequence, //{start_delay: value, sprite_index: index, to: value, is_absolute: bool, tween: type, duration: value}
        y_anchor_sequence, //{start_delay: value, sprite_index: index, to: value, is_absolute: bool, tween: type, duration: value}
        alpha_sequence, //{start_delay: value, sprite_index: index, to: value, is_absolute: bool, tween: type, duration: value}
        rotation_sequence, //{start_delay: value, sprite_index: index, to: value, is_absolute: bool, tween: type, duration: value, direction: value}
        stage_angle_sequence, //{start_delay: value, to: value, is_absolute: bool, tween: type, duration: value, direction: value}
        hue_angle_sequence, //{start_delay: value, sprite_index: index, to: value, is_absolute: bool, tween: type, duration: value, direction: value}
        tint_sequence, //{start_delay: value, sprite_index: index, value: %rgb array}
        grayscale_sequence, //{start_delay: value, sprite_index: index, to: value, is_absolute: bool, tween: type, duration: value}
        colorize_sequence, //{start_delay: value, sprite_index: index, value: value, colorize_intensity: value}
        custom_filter_sequence, //{start_delay: value, sprite_index: index, filter: key, value: value}
        camera_shake_sequence, //{start_delay: value, intensity: value, duration: value: direction: direction_option}
        play_sequence, //{start_delay: value, sprite_index: index, reverse: bool, frame_rate: value, repeat: bool, animation_key: key, wait: bool}
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
        this.camera_shake_sequence = camera_shake_sequence;
        this.play_sequence = play_sequence;
        this.set_frame_sequence = set_frame_sequence;
        this.blend_mode_sequence = blend_mode_sequence;
        this.is_party_animation = is_party_animation;
        this.running = false;
    }

    initialize(caster_sprite, targets_sprites, group_caster, group_enemy, super_group, stage_camera, background_sprites) {
        this.sprites = [];
        this.sprites_prev_properties = {};
        this.x0 = this.game.camera.x;
        this.y0 = this.game.camera.y;
        this.caster_sprite = caster_sprite;
        this.targets_sprites = targets_sprites;
        this.background_sprites = background_sprites;
        this.group_caster = group_caster;
        this.group_enemy = group_enemy;
        this.super_group = super_group;
        this.stage_camera = stage_camera;
        for (let i = 0; i < this.sprites_keys.length; ++i) {
            const sprite_info = this.sprites_keys[i];
            if (!sprite_info.per_target) {
                const psy_sprite = this.game.add.sprite(this.x0, this.y0, sprite_info.key_name);
                super_group.addChildAt(psy_sprite, super_group.getChildIndex(group_caster));
                this.sprites.push(psy_sprite);
                this.sprites[i].animations.add('cast', Phaser.Animation.generateFrameNames('', 1, this.sprites[i].animations.frameTotal, '', 3));
            }
        }
        this.set_filters();
    }

    set_filters() {
        this.caster_filter = this.game.add.filter('ColorFilters');
        this.targets_filter = this.game.add.filter('ColorFilters');
        this.background_filter = this.game.add.filter('ColorFilters');
        this.sprites_filters = [];
        this.caster_sprite.filters = [this.caster_filter];
        this.targets_sprites.forEach(sprite => {
            sprite.filters = [this.targets_filter];
        });
        this.background_sprites.forEach(sprite => {
            sprite.filters = [this.background_filter];
        });
        this.sprites.forEach((sprite, index) => {
            this.sprites_filters.push(this.game.add.filter('ColorFilters'));
            sprite.filters = [this.sprites_filters[index]];
        });
    }

    play(finish_callback) {
        this.running = true;
        this.promises = [];
        this.play_number_property_sequence(this.x_sequence, 'x');
        this.play_number_property_sequence(this.y_sequence, 'y');
        this.play_number_property_sequence(this.x_ellipse_axis_factor_sequence, 'ellipses_axis_factor_a');
        this.play_number_property_sequence(this.y_ellipse_axis_factor_sequence, 'ellipses_axis_factor_b');
        this.play_number_property_sequence(this.alpha_sequence, 'alpha');
        this.play_number_property_sequence(this.rotation_sequence, 'rotation');
        this.play_number_property_sequence(this.x_scale_sequence, 'x', 'scale');
        this.play_number_property_sequence(this.y_scale_sequence, 'y', 'scale');
        this.play_number_property_sequence(this.x_anchor_sequence, 'x', 'anchor');
        this.play_number_property_sequence(this.y_anchor_sequence, 'y', 'anchor');
        this.play_number_property_sequence(this.hue_angle_sequence, 'hue_adjust', 'filter');
        this.play_number_property_sequence(this.grayscale_sequence, 'gray', 'filter');
        this.play_sprite_sequence();
        this.play_blend_modes();
        this.play_filter_property(this.tint_sequence, 'tint');
        this.play_filter_property(this.colorize_sequence, 'colorize', 'colorize_intensity');
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
            this.running = false;
            if (finish_callback !== undefined) {
                finish_callback();
            }
        });
    }

    get_sprites(seq, inner_property) {
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
                    return [this.sprites_filters[seq.sprite_index]];
                } else {
                    return [this.sprites[seq.sprite_index][inner_property]];
                }
            }
        } else {
            if (seq.sprite_index === "background") {
                return this.background_sprites;
            } else if (seq.sprite_index === "caster") {
                return [this.caster_sprite];
            } else if (seq.sprite_index === "targets") {
                return this.targets_sprites;
            } else {
                return [this.sprites[seq.sprite_index]];
            }
        }
    }

    play_number_property_sequence(sequence, target_property, inner_property) {
        let chained_tweens = {};
        let auto_start_tween = {};
        for (let i = 0; i < sequence.length; ++i) {
            const seq = sequence[i];
            if (!(seq.sprite_index in auto_start_tween)) auto_start_tween[seq.sprite_index] = true;
            if (seq.sprite_index in chained_tweens) {
                auto_start_tween[seq.sprite_index] = false;
            }
            let sprites = this.get_sprites(seq, inner_property);
            let initial_value = 0;
            if (!['scale', 'anchor'].includes(inner_property)) {
                switch (target_property) {
                    case 'x': initial_value = this.x0; break;
                    case 'y': initial_value = this.y0; break;
                }
            }
            let promises_set = false;
            sprites.forEach((this_sprite, index) => {
                if (this.sprites_prev_properties[this_sprite.key] === undefined) {
                    this.sprites_prev_properties[this_sprite.key] = {};
                }
                if (this.sprites_prev_properties[this_sprite.key][target_property] === undefined) {
                    this.sprites_prev_properties[this_sprite.key][target_property] = this_sprite[target_property];
                }
                const to_value = seq.is_absolute ? initial_value + seq.to : this.sprites_prev_properties[this_sprite.key][target_property] + seq.to;
                this.sprites_prev_properties[this_sprite.key][target_property] = to_value;
                if (seq.tween === tween_types.INITIAL) {
                    this_sprite[target_property] = to_value;
                } else {
                    if (!(seq.sprite_index in chained_tweens)) chained_tweens[seq.sprite_index] = { [index]: [] };
                    if (!(index in chained_tweens[seq.sprite_index])) chained_tweens[seq.sprite_index][index] = [];
                    if (seq.duration === "instantly") {
                        let resolve_function;
                        if (!promises_set) {
                            let this_promise = new Promise(resolve => { resolve_function = resolve; });
                            this.promises.push(this_promise);
                            promises_set = true;
                        }
                        this.game.time.events.add(seq.start_delay, () => {
                            this_sprite[target_property] = to_value;
                            if (seq.force_stage_update) {
                                this.stage_camera.update();
                            }
                            resolve_function();
                        });
                    } else {
                        const tween = this.game.add.tween(this_sprite).to(
                            { [target_property]: to_value },
                            seq.duration,
                            seq.tween.split('.').reduce((p, prop) => p[prop], Phaser.Easing),
                            auto_start_tween[seq.sprite_index],
                            seq.start_delay
                        );
                        if (!promises_set) {
                            let resolve_function;
                            let this_promise = new Promise(resolve => { resolve_function = resolve; });
                            this.promises.push(this_promise);
                            tween.onStart.addOnce(() => {
                                if (seq.force_stage_update) {
                                    this.stage_camera.spining = true;
                                }
                            });
                            tween.onComplete.addOnce(() => {
                                resolve_function();
                                if (seq.force_stage_update) {
                                    this.stage_camera.spining = false;
                                }
                            });
                            promises_set = true;
                        }
                        if (chained_tweens[seq.sprite_index][index].length) {
                            chained_tweens[seq.sprite_index][index][chained_tweens[seq.sprite_index][index].length - 1].chain(tween);
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
            let resolve_function;
            let this_promise = new Promise(resolve => { resolve_function = resolve; });
            this.promises.push(this_promise);
            this.game.time.events.add(play_seq.start_delay, () => {
                let sprites = this.get_sprites(play_seq);
                sprites.forEach(sprite => {
                    if (play_seq.reverse) {
                        sprite.animations.getAnimation(play_seq.animation_key).reversed = true;
                    } else {
                        sprite.animations.getAnimation(play_seq.animation_key).reversed = false;
                    }
                    sprite.animations.play(play_seq.animation_key, play_seq.frame_rate, play_seq.repeat);
                    if (play_seq.wait) {
                        sprite.animations.currentAnim.onComplete.addOnce(resolve_function);
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
            let resolve_function;
            let this_promise = new Promise(resolve => { resolve_function = resolve; });
            this.promises.push(this_promise);
            this.game.time.events.add(blend_mode_seq.start_delay, () => {
                let sprites = this.get_sprites(blend_mode_seq);
                sprites.forEach(sprite => {
                    switch (blend_mode_seq.mode) {
                        case "screen":
                            sprite.blendMode = PIXI.blendModes.SCREEN;
                            break;
                    }
                });
                resolve_function();
            });
        }
    }

    play_filter_property(sequence, property, ...secondary_properties) {
        for (let i = 0; i < sequence.length; ++i) {
            const filter_seq = sequence[i];
            if (property === undefined) {
                property = filter_seq.filter;
            }
            let resolve_function;
            let this_promise = new Promise(resolve => { resolve_function = resolve; });
            this.promises.push(this_promise);
            this.game.time.events.add(filter_seq.start_delay, () => {
                let sprites = this.get_sprites(filter_seq);
                sprites.forEach(sprite => {
                    sprite.filters[0][property] = filter_seq.value;
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
            if (stage_angle_seq.tween === tween_types.INITIAL) {
                if (stage_angle_seq.is_absolute) {
                    this.stage_camera.rad = stage_angle_seq.to;
                } else {
                    this.stage_camera.rad += stage_angle_seq.to;
                }
            } else {
                const tween = this.game.add.tween(this.stage_camera).to(
                    { rad: stage_angle_seq.to },
                    stage_angle_seq.duration,
                    stage_angle_seq.tween.split('.').reduce((p, prop) => p[prop], Phaser.Easing),
                    chained_tweens.length === 0,
                    stage_angle_seq.start_delay
                );
                let resolve_function;
                let this_promise = new Promise(resolve => { resolve_function = resolve; });
                this.promises.push(this_promise);
                tween.onStart.addOnce(() => {
                    this.stage_camera.spining = true;
                });
                tween.onComplete.addOnce(() => {
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
}