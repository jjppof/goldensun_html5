import {SpriteBase} from "../SpriteBase";
import {GameEvent, event_types} from "./GameEvent";

enum control_types {
    ADD = "add",
    UPDATE = "update",
    REMOVE = "remove",
}

enum game_groups {
    LOWER = "lower",
    MIDDLE = "middle",
    OVER = "over",
}

export class GenericSpriteEvent extends GameEvent {
    private control_type: control_types;
    private generic_sprite_key_name: string;
    private misc_sprite_key: string;
    private x: number;
    private y: number;
    private group: Phaser.Group;
    private frame: string;
    private alpha: number;
    private anchor_x: number;
    private anchor_y: number;
    private scale_x: number;
    private scale_y: number;
    private rotation: number;
    private play: boolean;
    private frame_rate: number;
    private loop: boolean;
    private action: string;
    private animation: string;
    private collision_layer: number;
    private send_to_back: boolean;

    constructor(
        game,
        data,
        active,
        key_name,
        keep_reveal,
        control_type,
        generic_sprite_key_name,
        misc_sprite_key,
        x,
        y,
        group,
        frame,
        alpha,
        anchor_x,
        anchor_y,
        scale_x,
        scale_y,
        rotation,
        play,
        frame_rate,
        loop,
        action,
        animation,
        collision_layer,
        send_to_back
    ) {
        super(game, data, event_types.GENERIC_SPRITE, active, key_name, keep_reveal);
        this.control_type = control_type;
        this.generic_sprite_key_name = generic_sprite_key_name;
        this.misc_sprite_key = misc_sprite_key;
        this.x = x;
        this.y = y;
        switch (group) {
            case game_groups.LOWER:
                this.group = this.data.underlayer_group;
                break;
            case game_groups.MIDDLE:
                this.group = this.data.middlelayer_group;
                break;
            case game_groups.OVER:
                this.group = this.data.overlayer_group;
                break;
        }
        this.frame = frame;
        this.alpha = alpha;
        this.anchor_x = anchor_x;
        this.anchor_y = anchor_y;
        this.scale_x = scale_x;
        this.scale_y = scale_y;
        this.rotation = rotation;
        this.play = play;
        this.frame_rate = frame_rate;
        this.loop = loop;
        this.action = action;
        this.animation = animation;
        this.collision_layer = collision_layer;
        this.send_to_back = send_to_back;
    }

    _fire() {
        switch (this.control_type) {
            case control_types.ADD:
                this.data.map.add_generic_sprite(
                    this.generic_sprite_key_name,
                    this.misc_sprite_key,
                    this.x,
                    this.y,
                    this.group,
                    {
                        frame: this.frame,
                        alpha: this.alpha,
                        anchor_x: this.anchor_x,
                        anchor_y: this.anchor_y,
                        scale_x: this.scale_x,
                        scale_y: this.scale_y,
                        rotation: this.rotation,
                        play: this.play,
                        frame_rate: this.frame_rate,
                        loop: this.loop,
                        action: this.action,
                        animation: this.animation,
                        collision_layer: this.collision_layer,
                        send_to_back: this.send_to_back,
                    }
                );
                this.data.map.sort_sprites();
                break;
            case control_types.UPDATE:
                const generic_sprite = this.data.map.generic_sprites[this.generic_sprite_key_name];
                if (!generic_sprite) {
                    this.data.logger.log_message(`Generic sprite "${this.generic_sprite_key_name}" doesn't exist.`);
                    break;
                }
                if (this.group !== generic_sprite.parent) {
                    generic_sprite.parent.removeChild(generic_sprite);
                    this.group.add(generic_sprite);
                }
                generic_sprite.frameName = this.frame ?? generic_sprite.frameName;
                generic_sprite.x = this.x ?? generic_sprite.x;
                generic_sprite.y = this.y ?? generic_sprite.y;
                generic_sprite.alpha = this.alpha ?? generic_sprite.alpha;
                generic_sprite.anchor.x = this.anchor_x ?? generic_sprite.anchor.x;
                generic_sprite.anchor.y = this.anchor_y ?? generic_sprite.anchor.y;
                generic_sprite.scale.x = this.scale_x ?? generic_sprite.scale.x;
                generic_sprite.scale.y = this.scale_y ?? generic_sprite.scale.y;
                generic_sprite.rotation = this.rotation ?? generic_sprite.rotation;
                generic_sprite.base_collision_layer = this.collision_layer ?? generic_sprite.base_collision_layer;
                if (this.play) {
                    const sprite_key = SpriteBase.getKeyName(generic_sprite);
                    const sprite_base = this.data.info.misc_sprite_base_list[sprite_key];
                    const action = this.action ?? sprite_base.all_actions[0];
                    const anim_key = sprite_base.getAnimationKey(action, this.animation);
                    const anim = generic_sprite.animations.getAnimation(anim_key);
                    anim.play(this.frame_rate, this.loop);
                }
                this.data.map.sort_sprites();
                break;
            case control_types.REMOVE:
                this.data.map.remove_generic_sprite(this.generic_sprite_key_name);
                break;
        }
    }

    _destroy() {}
}
