const tween_types = {
    INITIAL: "initial"
};

export class BattleAnimation {
    //tween type can be 'Initial' for first position
    //tween type can be 'NoTween' for immediately change
    //sprite_index: "target" is the target, "caster" is the caster, 0... is the sprites_key_names index
    //values can be "target", "caster" or an actual value
    constructor(
        game,
        key_name,
        sprites_keys, //{key_name: string, per_target: bool}
        x_sequence, //{start_at: value, sprite_index: index, to: value, is_absolute: bool, tween: type, duration: value}
        y_sequence, //{start_at: value, sprite_index: index, to: value, is_absolute: bool, tween: type, duration: value}
        x_scale_sequence, //{start_at: value, sprite_index: index, to: value, is_absolute: bool, tween: type, duration: value}
        y_scale_sequence, //{start_at: value, sprite_index: index, to: value, is_absolute: bool, tween: type, duration: value}
        alpha_sequence, //{start_at: value, sprite_index: index, to: value, is_absolute: bool, tween: type, duration: value}
        rotation_sequence, //{start_at: value, sprite_index: index, to: value, is_absolute: bool, tween: type, duration: value, direction: value}
        stage_angle_sequence, //{start_at: value, to: value, is_absolute: bool, tween: type, duration: value, direction: value}
        hue_angle_sequence, //{start_at: value, sprite_index: index, to: value, is_absolute: bool, tween: type, duration: value, direction: value}
        tint_sequence, //{start_at: value, sprite_index: index, to: value, is_absolute: bool, tween: type, duration: value}
        camera_shake_sequence, //{start_at: value, intensity: value, duration: value: direction: direction_option}
        play_sequence, //{start_at: value, sprite_index: index, reverse: bool, frame_rate: value, repeat: bool}
        set_frame_sequence, //{start_at: value, frame_key_name: string}
        blend_mode_sequence, //{start_at: value, mode: type, sprite_index: index}
        is_party_animation
    ) {
        this.game = game;
        this.key_name = key_name;
        this.sprites_keys = sprites_keys;
        this.x_sequence = x_sequence;
        this.y_sequence = y_sequence;
        this.x_scale_sequence = x_scale_sequence;
        this.y_scale_sequence = y_scale_sequence;
        this.alpha_sequence = alpha_sequence;
        this.rotation_sequence = rotation_sequence;
        this.stage_angle_sequence = stage_angle_sequence;
        this.hue_angle_sequence = hue_angle_sequence;
        this.tint_sequence = tint_sequence;
        this.camera_shake_sequence = camera_shake_sequence;
        this.play_sequence = play_sequence;
        this.set_frame_sequence = set_frame_sequence;
        this.blend_mode_sequence = blend_mode_sequence;
        this.is_party_animation = is_party_animation;
    }

    initialize(caster_sprite, targets_sprites, stage_camera) {
        this.sprites = [];
        this.x0 = this.game.camera.x;
        this.y0 = this.game.camera.y;
        this.caster_sprite = caster_sprite;
        this.targets_sprites = targets_sprites;
        this.stage_camera = stage_camera;
        for (let i = 0; i < this.sprites_keys.length; ++i) {
            const sprite_info = this.sprites_keys[i];
            if (!sprite_info.per_target) {
                this.sprites.push(this.game.add.sprite(this.x0, this.y0, sprite_info.key_name));
                this.sprites[i].animations.add('cast', Phaser.Animation.generateFrameNames('', 1, this.sprites[i].animations.frameTotal, '', 3));
            }
        }
    }

    play() {
        this.play_x_sequence();
        this.play_y_sequence();
        this.play_sprite_sequence();
        this.play_blend_modes();
        this.play_stage_angle_sequence();
    }

    play_x_sequence() {
        for (let i = 0; i < this.x_sequence.length; ++i) {
            const x_seq = this.x_sequence[i];
            if (x_seq.tween === tween_types.INITIAL) {
                if (x_seq.is_absolute) {
                    this.sprites[x_seq.sprite_index].x = this.x0 + x_seq.to;
                } else {
                    this.sprites[x_seq.sprite_index].x += x_seq.to;
                }
            }
        }
    }

    play_y_sequence() {
        for (let i = 0; i < this.y_sequence.length; ++i) {
            const y_seq = this.y_sequence[i];
            if (y_seq.tween === tween_types.INITIAL) {
                if (y_seq.is_absolute) {
                    this.sprites[y_seq.sprite_index].y = this.y0 + y_seq.to;
                } else {
                    this.sprites[y_seq.sprite_index].y += y_seq.to;
                }
            }
        }
    }

    play_sprite_sequence() {
        for (let i = 0; i < this.play_sequence.length; ++i) {
            const play_seq = this.play_sequence[i];
            game.time.events.add(play_seq.start_at, () => {
                if (play_seq.reverse) {
                    this.sprites[play_seq.sprite_index].animations.currentAnim.reverse();
                }
                this.sprites[play_seq.sprite_index].animations.play('cast', play_seq.frame_rate, play_seq.repeat);
            });
        }
    }

    play_blend_modes() {
        for (let i = 0; i < this.blend_mode_sequence.length; ++i) {
            const blend_mode_seq = this.blend_mode_sequence[i];
            switch (blend_mode_seq.mode) {
                case "screen":
                    this.sprites[blend_mode_seq.sprite_index].blendMode = PIXI.blendModes.SCREEN;
                    break;
            }
        }
    }

    play_stage_angle_sequence() {
        for (let i = 0; i < this.stage_angle_sequence.length; ++i) {
            const stage_angle_seq = this.stage_angle_sequence[i];
            if (stage_angle_seq.tween === tween_types.INITIAL) {
                if (stage_angle_seq.is_absolute) {
                    this.stage_camera.rad = stage_angle_seq.to;
                } else {
                    this.stage_camera.rad += stage_angle_seq.to;
                }
            } else {
                const tween = game.add.tween(this.stage_camera).to(
                    { rad: stage_angle_seq.to },
                    stage_angle_seq.duration,
                    stage_angle_seq.tween.split('.').reduce((p, prop) => p[prop], Phaser.Easing),
                    true,
                    stage_angle_seq.start_at
                );
                tween.onStart.addOnce(() => {
                    tween.updateTweenData('rad', this.stage_camera.rad);
                    this.stage_camera.spining = true;
                });
                tween.onComplete.addOnce(() => {
                    this.stage_camera.spining = false;
                });
            }
        }
    }
}