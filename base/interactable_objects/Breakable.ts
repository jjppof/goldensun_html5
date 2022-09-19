import {ControllableChar} from "../ControllableChar";
import {degree30, degree60} from "../magic_numbers";
import {base_actions, get_centered_pos_in_px} from "../utils";
import {InteractableObjects} from "./InteractableObjects";

/**
 * An interactable object that can be broken by a ControllableChar when jumping on it.
 */
export class Breakable extends InteractableObjects {
    private static readonly ACTION_KEY = "breaking_pillar";
    private static readonly DOWN_DUST_COUNT = 7;
    private static readonly DOWN_FRAME_RATE = 20;
    private static readonly BROKEN_DUST_COUNT = 8;
    private static readonly BROKEN_DUST_RADIUS = 18;
    private static readonly DUST_KEY = "dust";

    private _one_level_broken: boolean;
    private _two_level_broken: boolean;

    constructor(
        game,
        data,
        key_name,
        map_index,
        x,
        y,
        storage_keys,
        allowed_tiles,
        base_collision_layer,
        not_allowed_tiles,
        object_drop_tiles,
        anchor_x,
        anchor_y,
        scale_x,
        scale_y,
        block_climb_collision_layer_shift,
        events_info,
        enable,
        entangled_by_bush,
        toggle_enable_events,
        label,
        allow_jumping_over_it,
        allow_jumping_through_it,
        psynergies_info,
        has_shadow,
        animation,
        action,
        snapshot_info,
        affected_by_reveal
    ) {
        super(
            game,
            data,
            key_name,
            map_index,
            x,
            y,
            storage_keys,
            allowed_tiles,
            base_collision_layer,
            not_allowed_tiles,
            object_drop_tiles,
            anchor_x,
            anchor_y,
            scale_x,
            scale_y,
            block_climb_collision_layer_shift,
            events_info,
            enable,
            entangled_by_bush,
            toggle_enable_events,
            label,
            allow_jumping_over_it,
            allow_jumping_through_it,
            psynergies_info,
            has_shadow,
            animation,
            action,
            snapshot_info,
            affected_by_reveal
        );
        this._breakable = true;
        this._one_level_broken = this.snapshot_info?.state_by_type.breakable.one_level_broken ?? false;
        this._two_level_broken = this.snapshot_info?.state_by_type.breakable.two_level_broken ?? false;
    }

    get one_level_broken() {
        return this._one_level_broken;
    }

    get two_level_broken() {
        return this._two_level_broken;
    }

    intialize_breakable() {
        if (this.two_level_broken) {
            this.sprite.visible = false;
        }
    }

    break(char: ControllableChar) {
        if (this.one_level_broken) {
            this.break_entire_pillar(char);
        } else {
            this.first_level_break(char);
        }
    }

    private first_level_break(char: ControllableChar) {
        char.misc_busy = true;
        this._one_level_broken = true;

        char.play(base_actions.IDLE);
        this.play("to_break", Breakable.ACTION_KEY);

        this.manage_filter(this.tint_filter, true);
        let blink_counter = 4;
        const blink_timer = this.game.time.create(false);
        blink_timer.loop(50, async () => {
            if (blink_counter % 2 === 0) {
                this.tint_filter.r = 1;
                this.tint_filter.g = 1;
                this.tint_filter.b = 1;
            } else {
                this.tint_filter.r = -1;
                this.tint_filter.g = -1;
                this.tint_filter.b = -1;
            }
            --blink_counter;
            if (blink_counter === 0) {
                blink_timer.stop();
                blink_timer.destroy();
                await this.down_dust_animation(char);
                char.misc_busy = false;
                this.manage_filter(this.tint_filter, false);
            }
        });
        blink_timer.start();
    }

    private async break_entire_pillar(char: ControllableChar) {
        char.misc_busy = true;
        char.play(base_actions.IDLE);
        char.toggle_collision(false);

        this.data.camera.enable_shake();
        await this.down_dust_animation(char);
        this.data.camera.disable_shake();

        this.play("broken", Breakable.ACTION_KEY);

        let fall_resolve;
        const fall_promise = new Promise(resolve => (fall_resolve = resolve));
        const bounce_tween = this.game.add.tween(char.body).to({y: this.y}, 500, Phaser.Easing.Bounce.Out, true);
        bounce_tween.start();
        bounce_tween.onComplete.addOnce(fall_resolve);
        bounce_tween.onUpdateCallback(() => {
            char.update_shadow();
        });

        let resolve_dust;
        const dust_promise = new Promise(resolve => (resolve_dust = resolve));
        const timer = this.game.time.events.add(300, async () => {
            this.sprite.visible = false;
            this._two_level_broken = true;
            this.data.camera.enable_shake();
            await this.broken_dust_animation();
            this.data.camera.disable_shake();
            resolve_dust();
        });
        timer.timer.start();

        await Promise.all([dust_promise, fall_promise]);

        this.data.collision.change_map_body(this.base_collision_layer);
        this.get_events().forEach(event => {
            if (event.is_active_at_direction()) {
                event.deactivate();
                event.activation_collision_layers.forEach(collision_layer => {
                    this.data.map.set_collision_in_tile(event.x, event.y, true, collision_layer);
                });
            } else {
                event.activate();
            }
        });
        this.destroy_body();
        char.toggle_collision(true);
        char.misc_busy = false;
    }

    private async down_dust_animation(char: ControllableChar) {
        const promises = new Array<Promise<void>>(Breakable.DOWN_DUST_COUNT);
        const dust_sprite_base = this.data.info.misc_sprite_base_list[Breakable.DUST_KEY];
        const dust_key = dust_sprite_base.getSpriteKey(Breakable.DUST_KEY);
        for (let i = 0; i < Breakable.DOWN_DUST_COUNT; ++i) {
            const start_x = char.x - (this.data.map.tile_width >> 1) + Math.random() * this.data.map.tile_width;
            const start_y = char.y + Math.random() * this.data.map.tile_height + (this.data.map.tile_height >> 1);
            const dust_sprite: Phaser.Sprite = this.data.middlelayer_group.create(start_x, start_y, dust_key);
            dust_sprite.base_collision_layer = char.collision_layer;
            dust_sprite.anchor.setTo(0.5, 0.5);
            dust_sprite.scale.setTo(0.7, 0.7);
            this.game.add.tween(dust_sprite).to(
                {
                    y: start_y + (this.data.map.tile_height >> 1),
                },
                300,
                Phaser.Easing.Linear.None,
                true
            );
            dust_sprite_base.setAnimation(dust_sprite, Breakable.DUST_KEY);
            const animation_key = dust_sprite_base.getAnimationKey(Breakable.DUST_KEY, "spread");
            let resolve_func;
            promises[i] = new Promise(resolve => (resolve_func = resolve));
            dust_sprite.animations.getAnimation(animation_key).onComplete.addOnce(() => {
                dust_sprite.destroy();
                resolve_func();
            });
            const frame_name = dust_sprite_base.getFrameName(Breakable.DUST_KEY, "spread", 2);
            dust_sprite.frameName = frame_name;
            dust_sprite.animations.play(animation_key, Breakable.DOWN_FRAME_RATE);
        }
        this.data.map.sort_sprites();
        await Promise.all(promises);
    }

    private async broken_dust_animation() {
        const promises = new Array(Breakable.BROKEN_DUST_COUNT);
        const sprites = new Array(Breakable.BROKEN_DUST_COUNT);
        const origin_x = get_centered_pos_in_px(this.tile_x_pos, this.data.map.tile_width);
        const origin_y = get_centered_pos_in_px(this.tile_y_pos, this.data.map.tile_height);
        const dust_sprite_base = this.data.info.misc_sprite_base_list[Breakable.DUST_KEY];
        const dust_key = dust_sprite_base.getSpriteKey(Breakable.DUST_KEY);
        for (let i = 0; i < Breakable.BROKEN_DUST_COUNT; ++i) {
            const this_angle = ((Math.PI + degree60) * i) / (Breakable.BROKEN_DUST_COUNT - 1) - degree30;
            const x = origin_x + Breakable.BROKEN_DUST_RADIUS * Math.cos(this_angle);
            const y = origin_y + Breakable.BROKEN_DUST_RADIUS * Math.sin(this_angle);
            const dust_sprite = this.data.middlelayer_group.create(origin_x, origin_y, dust_key);
            if (this_angle < 0 || this_angle > Math.PI) {
                this.data.middlelayer_group.setChildIndex(
                    dust_sprite,
                    this.data.middlelayer_group.getChildIndex(this.sprite)
                );
            }
            dust_sprite.anchor.setTo(0.5, 0.5);
            this.game.add.tween(dust_sprite).to(
                {
                    x: x,
                    y: y,
                },
                300,
                Phaser.Easing.Linear.None,
                true
            );
            sprites[i] = dust_sprite;
            dust_sprite_base.setAnimation(dust_sprite, Breakable.DUST_KEY);
            const animation_key = dust_sprite_base.getAnimationKey(Breakable.DUST_KEY, "spread");
            let resolve_func;
            promises[i] = new Promise(resolve => (resolve_func = resolve));
            dust_sprite.animations.getAnimation(animation_key).onComplete.addOnce(() => {
                dust_sprite.destroy();
                resolve_func();
            });
            dust_sprite.animations.play(animation_key);
        }
        await Promise.all(promises);
    }
}
