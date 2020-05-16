export class BattleAnimation {
    //tween type can be 'Initial' for first position
    //tween type can be 'NoTween' for immediately change
    //sprite_index: "target" is the target, "caster" is the caster, 0... is the sprites_key_names index
    //values can be "target", "caster" or an actual value
    constructor(
        game,
        key_name,
        sprites, //{key_name: string, per_target: bool}
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
        blend_mode_sequence, //{start_at: value, mode: type}
        is_party_animation
    ) {
        this.game = game;
        this.key_name = key_name;
        this.sprites = sprites;
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
}