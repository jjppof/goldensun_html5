import * as numbers from "../magic_numbers";
import {event_types, LocationKey} from "../tile_events/TileEvent";
import {get_surroundings, get_opposite_direction, directions, reverse_directions, base_actions} from "../utils";
import {JumpEvent} from "../tile_events/JumpEvent";
import {InteractableObjects} from "./InteractableObjects";

export class Pushable extends InteractableObjects {
    private static readonly DUST_COUNT = 7;
    private static readonly DUST_RADIUS = 18;
    private static readonly PUSH_SHIFT = 16;
    private static readonly DUST_KEY = "dust";
    private static readonly DUST_ANIM_KEY = "spread";

    constructor(
        game,
        data,
        key_name,
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
        events_info
    ) {
        super(
            game,
            data,
            key_name,
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
        );
        this._pushable = true;
    }

    normal_push() {
        if (
            this.data.hero.trying_to_push &&
            (this.data.hero.trying_to_push_direction & 1) === 0 &&
            this.data.hero.trying_to_push_direction === this.data.hero.current_direction &&
            !this.data.hero.in_action()
        ) {
            this.fire_push_movement();
        }
    }

    target_only_push(
        before_move,
        push_end,
        enable_physics_at_end = true,
        on_push_update = undefined
    ) {
        this.fire_push_movement(
            push_end,
            before_move,
            true,
            enable_physics_at_end,
            on_push_update
        );
    }

    fire_push_movement(
        push_end?,
        before_move?,
        target_only = false,
        enable_physics_at_end = true,
        on_push_update = undefined
    ) {
        let expected_position;
        if (!target_only) {
            const positive_limit = this.data.hero.sprite.x + (-this.sprite.y - this.sprite.x);
            const negative_limit = -this.data.hero.sprite.x + (-this.sprite.y + this.sprite.x);
            if (-this.data.hero.sprite.y >= positive_limit && -this.data.hero.sprite.y >= negative_limit) {
                expected_position = directions.down;
            } else if (-this.data.hero.sprite.y <= positive_limit && -this.data.hero.sprite.y >= negative_limit) {
                expected_position = directions.left;
            } else if (-this.data.hero.sprite.y <= positive_limit && -this.data.hero.sprite.y <= negative_limit) {
                expected_position = directions.up;
            } else if (-this.data.hero.sprite.y >= positive_limit && -this.data.hero.sprite.y <= negative_limit) {
                expected_position = directions.right;
            }
        }
        if (target_only || expected_position === this.data.hero.trying_to_push_direction) {
            if (!target_only) {
                this.data.hero.pushing = true;
                this.data.audio.play_se("actions/push");
                this.data.hero.change_action(base_actions.PUSH, true);
            } else {
                this.data.audio.play_se("menu/positive_4");
            }
            this.game.physics.p2.pause();
            let tween_x = 0,
                tween_y = 0;
            let event_shift_x = 0,
                event_shift_y = 0;
            switch (this.data.hero.trying_to_push_direction) {
                case directions.up:
                    event_shift_y = -1;
                    tween_y = -Pushable.PUSH_SHIFT;
                    break;
                case directions.down:
                    event_shift_y = 1;
                    tween_y = Pushable.PUSH_SHIFT;
                    break;
                case directions.left:
                    event_shift_x = -1;
                    tween_x = -Pushable.PUSH_SHIFT;
                    break;
                case directions.right:
                    event_shift_x = 1;
                    tween_x = Pushable.PUSH_SHIFT;
                    break;
            }
            this.shift_events(event_shift_x, event_shift_y);
            const sprites = [this.sprite.body];
            if (!target_only) {
                sprites.push(...[this.data.hero.shadow, this.data.hero.sprite.body]);
            }
            const prev_x = this.current_x;
            const prev_y = this.current_y;
            this.set_tile_position({
                x: this.current_x + event_shift_x,
                y: this.current_y + event_shift_y,
            });
            const promises = [];
            if (before_move !== undefined) {
                before_move(tween_x, tween_y);
            }
            if (this.blocking_stair_block) {
                this.blocking_stair_block.x += tween_x;
                this.blocking_stair_block.y += tween_y;
            }
            for (let i = 0; i < sprites.length; ++i) {
                const body = sprites[i];
                let dest_x = body.x + tween_x;
                let dest_y = body.y + tween_y;
                if (body === this.data.hero.shadow || body === this.data.hero.sprite.body) {
                    if (tween_x === 0) {
                        dest_x = this.data.map.tile_width * (prev_x + event_shift_x + 0.5);
                    } else if (tween_y === 0) {
                        dest_y = this.data.map.tile_height * (prev_y + event_shift_y + 0.5);
                    }
                }
                let promise_resolve;
                promises.push(new Promise(resolve => (promise_resolve = resolve)));
                const this_tween = this.game.add.tween(body).to(
                    {
                        x: dest_x,
                        y: dest_y,
                    },
                    numbers.PUSH_TIME,
                    Phaser.Easing.Linear.None,
                    true
                );
                if (on_push_update) {
                    this_tween.onUpdateCallback(on_push_update);
                }
                this_tween.onComplete.addOnce(() => {
                    let drop_found = false;
                    if (i === sprites.length - 1) {
                        this.object_drop_tiles.forEach(drop_tile => {
                            if (
                                drop_tile.x === this.current_x &&
                                drop_tile.y === this.current_y
                            ) {
                                drop_found = true;
                                const dest_y_shift_px =
                                    (drop_tile.dest_y - this.current_y) * this.data.map.tile_height;
                                this.shift_events(
                                    0,
                                    drop_tile.dest_y - this.current_y
                                );
                                this.set_tile_position({y: drop_tile.dest_y});
                                this.change_collision_layer(drop_tile.destination_collision_layer);
                                this.game.add
                                    .tween(this.sprite.body)
                                    .to(
                                        {
                                            y: this.sprite.body.y + dest_y_shift_px,
                                        },
                                        drop_tile.animation_duration,
                                        Phaser.Easing.Quadratic.In,
                                        true
                                    )
                                    .onComplete.addOnce(() => {
                                        this.data.audio.play_se("misc/rock_drop");
                                        if (drop_tile.dust_animation) {
                                            this.data.hero.change_action(base_actions.IDLE);
                                            this.data.hero.play(
                                                this.data.hero.current_action,
                                                reverse_directions[this.data.hero.current_direction]
                                            );
                                            this.dust_animation(promise_resolve);
                                        } else {
                                            promise_resolve();
                                        }
                                    });
                                return;
                            }
                        });
                    }
                    if (!drop_found) {
                        promise_resolve();
                    }
                });
            }
            Promise.all(promises).then(() => {
                this.data.hero.pushing = false;
                if (enable_physics_at_end) {
                    this.game.physics.p2.resume();
                }
                if (push_end !== undefined) {
                    push_end();
                }
            });
        }
    }

    shift_events(event_shift_x, event_shift_y) {
        const object_events = this.get_events();
        for (let i = 0; i < object_events.length; ++i) {
            const event = object_events[i];
            this.data.map.events[event.location_key] = this.data.map.events[event.location_key].filter(e => {
                return e.id !== event.id;
            });
            if (this.data.map.events[event.location_key].length === 0) {
                delete this.data.map.events[event.location_key];
            }
            let old_x = event.x;
            let old_y = event.y;
            let new_x = old_x + event_shift_x;
            let new_y = old_y + event_shift_y;
            event.set_position(new_x, new_y);
            if (!(event.location_key in this.data.map.events)) {
                this.data.map.events[event.location_key] = [];
            }
            this.data.map.events[event.location_key].push(event);
            const new_surroundings = get_surroundings(new_x, new_y, false, 2);
            JumpEvent.active_jump_surroundings(
                this.data,
                new_surroundings,
                event.collision_layer_shift_from_source + this.base_collision_layer
            );
            const old_surroundings = get_surroundings(old_x, old_y, false, 2);
            for (let j = 0; j < old_surroundings.length; ++j) {
                const old_surrounding = old_surroundings[j];
                const old_key = LocationKey.get_key(old_surrounding.x, old_surrounding.y);
                if (old_key in this.data.map.events) {
                    for (let k = 0; k < this.data.map.events[old_key].length; ++k) {
                        const old_surr_event = this.data.map.events[old_key][k];
                        if (old_surr_event.type === event_types.JUMP) {
                            const target_layer =
                                event.collision_layer_shift_from_source + this.base_collision_layer;
                            if (
                                old_surr_event.activation_collision_layers.includes(target_layer) &&
                                old_surr_event.dynamic === false
                            ) {
                                old_surr_event.deactivate_at(get_opposite_direction(old_surrounding.direction));
                            }
                        }
                    }
                }
            }
        }
    }

    dust_animation(promise_resolve) {
        const promises = new Array(Pushable.DUST_COUNT);
        const sprites = new Array(Pushable.DUST_COUNT);
        const origin_x = (this.current_x + 0.5) * this.data.map.tile_width;
        const origin_y = (this.current_y + 0.5) * this.data.map.tile_height;
        const dust_sprite_base = this.data.info.misc_sprite_base_list[Pushable.DUST_KEY];
        for (let i = 0; i < Pushable.DUST_COUNT; ++i) {
            const this_angle = ((Math.PI + numbers.degree60) * i) / (Pushable.DUST_COUNT - 1) - numbers.degree30;
            const x = origin_x + Pushable.DUST_RADIUS * Math.cos(this_angle);
            const y = origin_y + Pushable.DUST_RADIUS * Math.sin(this_angle);
            const dust_sprite = this.data.npc_group.create(origin_x, origin_y, Pushable.DUST_KEY);
            if (this_angle < 0 || this_angle > Math.PI) {
                this.data.npc_group.setChildIndex(dust_sprite, this.data.npc_group.getChildIndex(this.sprite));
            }
            dust_sprite.anchor.setTo(0.5, 0.5);
            this.game.add.tween(dust_sprite).to(
                {
                    x: x,
                    y: y,
                },
                400,
                Phaser.Easing.Linear.None,
                true
            );
            sprites[i] = dust_sprite;
            dust_sprite_base.setAnimation(dust_sprite, Pushable.DUST_KEY);
            const animation_key = dust_sprite_base.getAnimationKey(Pushable.DUST_KEY, Pushable.DUST_ANIM_KEY);
            let resolve_func;
            promises[i] = new Promise(resolve => (resolve_func = resolve));
            dust_sprite.animations.getAnimation(animation_key).onComplete.addOnce(resolve_func);
            dust_sprite.animations.play(animation_key);
        }
        Promise.all(promises).then(() => {
            sprites.forEach(sprite => {
                this.data.npc_group.remove(sprite, true);
            });
            promise_resolve();
        });
    }

}
