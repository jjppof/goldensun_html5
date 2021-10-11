import * as numbers from "../magic_numbers";
import {event_types, LocationKey} from "../tile_events/TileEvent";
import {
    get_surroundings,
    get_opposite_direction,
    directions,
    reverse_directions,
    base_actions,
    get_centered_pos_in_px,
    get_front_position,
} from "../utils";
import {JumpEvent} from "../tile_events/JumpEvent";
import {InteractableObjects} from "./InteractableObjects";
import {ControllableChar} from "../ControllableChar";
import {ClimbEvent} from "../tile_events/ClimbEvent";

/**
 * An interactable object that can be pushed by a ControllableChar.
 */
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
        events_info,
        enable,
        entangled_by_bush,
        toggle_enable_events,
        label
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
            enable,
            entangled_by_bush,
            toggle_enable_events,
            label
        );
        this._pushable = true;
    }

    /**
     * Checks if a given char is trying to push this interactable object, if it's trying, starts
     * the push process.
     * @param char the char that is trying to push this pushable interactable object.
     * @returns returns whether the char is trying to push or not.
     */
    check_and_start_push(char: ControllableChar) {
        if (
            [base_actions.WALK, base_actions.DASH].includes(char.current_action as base_actions) &&
            this.data.map.collision_layer === this.base_collision_layer &&
            !this.check_if_trying_to_climb(char)
        ) {
            char.trying_to_push = true;
            if (char.push_timer === null) {
                char.set_trying_to_push_direction(char.current_direction);
                const events_in_pos = this.data.map.events[LocationKey.get_key(this.tile_x_pos, this.tile_y_pos)];
                let has_stair = false;
                if (events_in_pos) {
                    events_in_pos.forEach(event => {
                        if (
                            event.type === event_types.CLIMB &&
                            (event as ClimbEvent).is_set &&
                            event.activation_directions.includes(char.trying_to_push_direction) &&
                            event.activation_collision_layers.includes(this.data.map.collision_layer) &&
                            !event.dynamic
                        ) {
                            has_stair = true;
                            return;
                        }
                    });
                }
                if (!has_stair) {
                    const item_position = this.get_current_position(this.data.map);
                    const front_pos = get_front_position(
                        item_position.x,
                        item_position.y,
                        char.trying_to_push_direction,
                        false
                    );
                    if (this.position_allowed(front_pos.x, front_pos.y)) {
                        char.set_push_timer(() => {
                            this.normal_push(char);
                            char.trying_to_push = false;
                            char.unset_push_timer();
                        });
                    }
                }
            }
        }
        return char.trying_to_push;
    }

    /**
     * Checks if a given char is trying to climb this interactable object, if it's trying, starts
     * the climb process.
     * @param char the char that is trying to climb this climbable interactable object.
     * @returns returns whether the char is trying to climb or not.
     */
    check_if_trying_to_climb(char: ControllableChar) {
        if (char.is_npc) {
            return false;
        }

        const pos_key = LocationKey.get_key(char.tile_x_pos, char.tile_y_pos);
        const events = this.data.map.events[pos_key];

        if (!events) return false;

        for (let i = 0; i < events.length; ++i) {
            const event = events[i];
            if (
                event.type === event_types.CLIMB &&
                event.activation_directions.includes(char.current_direction) &&
                event.activation_collision_layers.includes(this.data.map.collision_layer) &&
                event.is_active(char.current_direction) > -1
            ) {
                return true;
            }
        }
        return false;
    }

    /**
     * Starts a manual push in which the char manually push it.
     * @param char the char that is pushing this controllable object.
     */
    normal_push(char: ControllableChar) {
        if (
            char.trying_to_push &&
            (char.trying_to_push_direction & 1) === 0 &&
            char.trying_to_push_direction === char.current_direction &&
            !char.in_action()
        ) {
            this.fire_push_movement(char);
        }
    }

    /**
     * Starts the push process in which only this interactable object move.
     * @param char the char that is pushing this controllable object.
     * @param before_move before moving this interactable object callback.
     * @param push_end after moving this interactable object callback.
     * @param enable_physics_at_end whether you want to enable p2 physics at the end of the process or not.
     * @param on_push_update the callback that is called while the push is happening.
     */
    target_only_push(
        char: ControllableChar,
        before_move: (x_shift: number, y_shift: number) => void,
        push_end: () => void,
        enable_physics_at_end = true,
        on_push_update?: () => void
    ) {
        this.fire_push_movement(char, push_end, before_move, true, enable_physics_at_end, on_push_update);
    }

    /**
     *
     * @param char the char that is pushing this controllable object.
     * @param push_end after moving this interactable object callback.
     * @param before_move before moving this interactable object callback.
     * @param target_only if true, only this interactable object will move. False means physical move.
     * @param enable_physics_at_end whether you want to enable p2 physics at the end of the process or not.
     * @param on_push_update the callback that is called while the push is happening.
     */
    fire_push_movement(
        char: ControllableChar,
        push_end?: () => void,
        before_move?: (x_shift: number, y_shift: number) => void,
        target_only = false,
        enable_physics_at_end = true,
        on_push_update?: () => void
    ) {
        let expected_position;
        if (!target_only) {
            const positive_limit = char.sprite.x + (-this.sprite.y - this.sprite.x);
            const negative_limit = -char.sprite.x + (-this.sprite.y + this.sprite.x);
            if (-char.sprite.y >= positive_limit && -char.sprite.y >= negative_limit) {
                expected_position = directions.down;
            } else if (-char.sprite.y <= positive_limit && -char.sprite.y >= negative_limit) {
                expected_position = directions.left;
            } else if (-char.sprite.y <= positive_limit && -char.sprite.y <= negative_limit) {
                expected_position = directions.up;
            } else if (-char.sprite.y >= positive_limit && -char.sprite.y <= negative_limit) {
                expected_position = directions.right;
            }
        }
        if (target_only || expected_position === char.trying_to_push_direction) {
            if (!target_only) {
                char.pushing = true;
                this.data.audio.play_se("actions/push");
                char.change_action(base_actions.PUSH, true);
            } else {
                this.data.audio.play_se("menu/positive_4");
            }
            this.game.physics.p2.pause();
            let tween_x = 0,
                tween_y = 0;
            let event_shift_x = 0,
                event_shift_y = 0;
            switch (char.trying_to_push_direction) {
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
                sprites.push(...[char.shadow, char.sprite.body]);
            }
            const prev_x = this.tile_x_pos;
            const prev_y = this.tile_y_pos;
            this.set_tile_position({
                x: this.tile_x_pos + event_shift_x,
                y: this.tile_y_pos + event_shift_y,
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
                if (body === char.shadow || body === char.sprite.body) {
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
                            if (drop_tile.x === this.tile_x_pos && drop_tile.y === this.tile_y_pos) {
                                drop_found = true;
                                const dest_y_shift_px =
                                    (drop_tile.dest_y - this.tile_y_pos) * this.data.map.tile_height;
                                this.shift_events(0, drop_tile.dest_y - this.tile_y_pos);
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
                                            char.change_action(base_actions.IDLE);
                                            char.play(char.current_action, reverse_directions[char.current_direction]);
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
                char.pushing = false;
                if (enable_physics_at_end) {
                    this.game.physics.p2.resume();
                }
                if (push_end !== undefined) {
                    push_end();
                }
            });
        }
    }

    /**
     * Shifts the related events of this interactable object according to the push
     * destination position.
     * @param event_shift_x
     * @param event_shift_y
     */
    shift_events(event_shift_x: number, event_shift_y: number) {
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
            event.set_position(new_x, new_y, true);
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
                            const target_layer = event.collision_layer_shift_from_source + this.base_collision_layer;
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

    /**
     * Starts the dust animation when this interactable object fall on the ground.
     * @param on_animation_end the animation end callback.
     */
    dust_animation(on_animation_end: () => void) {
        const promises = new Array(Pushable.DUST_COUNT);
        const sprites = new Array(Pushable.DUST_COUNT);
        const origin_x = get_centered_pos_in_px(this.tile_x_pos, this.data.map.tile_width);
        const origin_y = get_centered_pos_in_px(this.tile_y_pos, this.data.map.tile_height);
        const dust_sprite_base = this.data.info.misc_sprite_base_list[Pushable.DUST_KEY];
        const dust_key = dust_sprite_base.getSpriteKey(Pushable.DUST_KEY);
        for (let i = 0; i < Pushable.DUST_COUNT; ++i) {
            const this_angle = ((Math.PI + numbers.degree60) * i) / (Pushable.DUST_COUNT - 1) - numbers.degree30;
            const x = origin_x + Pushable.DUST_RADIUS * Math.cos(this_angle);
            const y = origin_y + Pushable.DUST_RADIUS * Math.sin(this_angle);
            const dust_sprite = this.data.npc_group.create(origin_x, origin_y, dust_key);
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
            on_animation_end();
        });
    }
}
