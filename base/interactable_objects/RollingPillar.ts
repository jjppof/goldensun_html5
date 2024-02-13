import {ControllableChar} from "../ControllableChar";
import {Map} from "../Map";
import {base_actions, directions, get_centered_pos_in_px, get_distance, get_tile_position} from "../utils";
import {InteractableObjects} from "./InteractableObjects";
import * as _ from "lodash";
import {GameEvent, game_event_origin} from "../game_events/GameEvent";

enum pillar_directions {
    HORIZONTAL = "horizontal",
    VERTICAL = "vertical",
}

export class RollablePillar extends InteractableObjects {
    private static readonly ROLLING_SPEED_PER_TILE = 500;

    private _falling_pos: {x: number; y: number};
    private _dest_pos_after_fall: {x: number; y: number};
    private _dest_collision_layer: number;
    private _contact_points: {x: number; y: number}[];
    private _pillar_direction: pillar_directions;
    private _pillar_is_stuck: boolean;
    private _after_rolling_events: GameEvent[];
    private _on_rolling_start_events: GameEvent[];

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
        affected_by_reveal,
        active,
        visible
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
            affected_by_reveal,
            active,
            visible
        );
        this._rollable = true;
        this._pillar_is_stuck = this.snapshot_info?.state_by_type.rollable?.pillar_is_stuck ?? false;
        this._after_rolling_events = [];
        this._on_rolling_start_events = [];
    }

    get pillar_is_stuck() {
        return this._pillar_is_stuck;
    }

    initialize_rolling_pillar(
        falling_pos: RollablePillar["_falling_pos"],
        contact_points: RollablePillar["_contact_points"],
        pillar_direction: pillar_directions,
        dest_pos_after_fall: RollablePillar["_dest_pos_after_fall"],
        dest_collision_layer: number,
        after_rolling_events: any[],
        on_rolling_start_events: any[]
    ) {
        this._falling_pos = falling_pos;
        this._contact_points = contact_points;
        this._pillar_direction = pillar_direction;
        this._dest_pos_after_fall = dest_pos_after_fall;
        this._dest_collision_layer = dest_collision_layer ?? this.base_collision_layer;
        after_rolling_events = after_rolling_events ?? [];
        after_rolling_events.forEach(event_info => {
            this._after_rolling_events.push(
                this.data.game_event_manager.get_event_instance(
                    event_info,
                    game_event_origin.INTERACTABLE_OBJECT_PUSH,
                    this
                )
            );
        });
        on_rolling_start_events = on_rolling_start_events ?? [];
        on_rolling_start_events.forEach(event_info => {
            this._on_rolling_start_events.push(
                this.data.game_event_manager.get_event_instance(
                    event_info,
                    game_event_origin.INTERACTABLE_OBJECT_PUSH,
                    this
                )
            );
        });
    }

    config_rolling_pillar(map: Map) {
        if (this._pillar_is_stuck) {
            const object_events = this.get_events();
            for (let i = 0; i < object_events.length; ++i) {
                const event = object_events[i];
                map.set_collision_in_tile(event.x, event.y, false, this._dest_collision_layer);
            }
        }
    }

    check_and_start_rolling(char: ControllableChar) {
        if (
            [base_actions.WALK, base_actions.DASH].includes(char.current_action as base_actions) &&
            this.data.map.collision_layer === this.base_collision_layer
        ) {
            char.trying_to_push = true;
            if (char.push_timer === null) {
                char.set_trying_to_push_direction(char.current_direction);
                if (
                    [directions.down, directions.up].includes(char.trying_to_push_direction) &&
                    this._pillar_direction === pillar_directions.VERTICAL
                ) {
                    return false;
                }
                if (
                    [directions.left, directions.right].includes(char.trying_to_push_direction) &&
                    this._pillar_direction === pillar_directions.HORIZONTAL
                ) {
                    return false;
                }
                char.set_push_timer(() => {
                    if (!this.data.main_menu.open && !this.data.save_menu.open) {
                        this.define_pillar_direction(char);
                    }
                    char.trying_to_push = false;
                    char.unset_push_timer();
                });
            }
        }
        return char.trying_to_push;
    }

    define_pillar_direction(char: ControllableChar) {
        if (
            char.trying_to_push &&
            (char.trying_to_push_direction & 1) === 0 &&
            char.trying_to_push_direction === char.current_direction &&
            !char.in_action() &&
            !this._pillar_is_stuck &&
            char.stop_by_colliding
        ) {
            if (
                [directions.down, directions.up].includes(char.trying_to_push_direction) &&
                this._pillar_direction === pillar_directions.VERTICAL
            ) {
                return;
            }
            if (
                [directions.left, directions.right].includes(char.trying_to_push_direction) &&
                this._pillar_direction === pillar_directions.HORIZONTAL
            ) {
                return;
            }

            const get_extreme = (
                io: InteractableObjects,
                index: number,
                init: number,
                func: "max" | "min",
                axis: "x" | "y"
            ) => {
                return (
                    io.body.world.mpx(
                        io.body.data.shapes.reduce((acc, cur) => {
                            return Math[func](
                                acc,
                                cur.vertices.reduce((acc, cur) => {
                                    return Math[func](acc, cur[index]);
                                }, init)
                            );
                        }, init)
                    ) + io[axis]
                );
            };
            const min_x = get_extreme(this, 0, Infinity, "min", "x");
            const max_x = get_extreme(this, 0, -Infinity, "max", "x");
            const min_y = get_extreme(this, 1, Infinity, "min", "y");
            const max_y = get_extreme(this, 1, -Infinity, "max", "y");

            const cartesian = (...a) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));

            let next_contact: RollablePillar["_contact_points"][0] = null;
            let last_distance = Infinity;
            const contact_points = this._contact_points.concat(
                this.data.map.interactable_objects.flatMap(io => {
                    if (
                        io !== this &&
                        io.active &&
                        io.body &&
                        !io.allow_jumping_over_it &&
                        !io.allow_jumping_through_it &&
                        io.shapes_collision_active &&
                        io.base_collision_layer === this.base_collision_layer
                    ) {
                        const bounds = {
                            min_x: get_extreme(io, 0, Infinity, "min", "x"),
                            max_x: get_extreme(io, 0, -Infinity, "max", "x"),
                            min_y: get_extreme(io, 1, Infinity, "min", "y"),
                            max_y: get_extreme(io, 1, -Infinity, "max", "y"),
                        };
                        if (
                            (this._pillar_direction === pillar_directions.VERTICAL &&
                                bounds.max_y >= min_y &&
                                bounds.min_y <= max_y) ||
                            (this._pillar_direction === pillar_directions.HORIZONTAL &&
                                bounds.max_x >= min_x &&
                                bounds.min_x <= max_x)
                        ) {
                            bounds.min_x = get_tile_position(bounds.min_x | 0, this.data.map.tile_width);
                            bounds.max_x = get_tile_position(bounds.max_x | 0, this.data.map.tile_width);
                            bounds.min_y = get_tile_position(bounds.min_y | 0, this.data.map.tile_height);
                            bounds.max_y = get_tile_position(bounds.max_y | 0, this.data.map.tile_height);
                            return cartesian(
                                _.range(bounds.min_x, bounds.max_x + 1),
                                _.range(bounds.min_y, bounds.max_y + 1)
                            ).map(pos => {
                                return {
                                    x: pos[0],
                                    y: pos[1],
                                };
                            });
                        } else {
                            return [];
                        }
                    } else {
                        return [];
                    }
                })
            );

            for (let i = 0; i < contact_points.length; ++i) {
                const point = contact_points[i];
                if (char.trying_to_push_direction === directions.down && point.y <= this.tile_pos.y) {
                    continue;
                }
                if (char.trying_to_push_direction === directions.up && point.y >= this.tile_pos.y) {
                    continue;
                }
                if (char.trying_to_push_direction === directions.right && point.x <= this.tile_pos.x) {
                    continue;
                }
                if (char.trying_to_push_direction === directions.left && point.x >= this.tile_pos.x) {
                    continue;
                }
                const distance =
                    this._pillar_direction === pillar_directions.VERTICAL
                        ? Math.abs(point.x - this.tile_x_pos)
                        : Math.abs(point.y - this.tile_y_pos);
                if (distance < last_distance) {
                    next_contact = Object.assign({}, point);
                    last_distance = distance;
                }
            }
            if (next_contact !== null) {
                if (char.trying_to_push_direction === directions.down) {
                    next_contact.y--;
                } else if (char.trying_to_push_direction === directions.up) {
                    next_contact.y++;
                } else if (char.trying_to_push_direction === directions.right) {
                    next_contact.x--;
                } else if (char.trying_to_push_direction === directions.left) {
                    next_contact.x++;
                }
                if (next_contact.x === this.tile_pos.x && next_contact.y === this.tile_pos.y) {
                    return;
                }
            }
            let rolling_pillar_will_fall = false;
            if (this._falling_pos) {
                if (
                    !(
                        (char.trying_to_push_direction === directions.down && this._falling_pos.y <= this.tile_pos.y) ||
                        (char.trying_to_push_direction === directions.up && this._falling_pos.y >= this.tile_pos.y) ||
                        (char.trying_to_push_direction === directions.right &&
                            this._falling_pos.x <= this.tile_pos.x) ||
                        (char.trying_to_push_direction === directions.left && this._falling_pos.x >= this.tile_pos.x)
                    )
                ) {
                    const distance =
                        this._pillar_direction === pillar_directions.VERTICAL
                            ? Math.abs(this._falling_pos.x - this.tile_x_pos)
                            : Math.abs(this._falling_pos.y - this.tile_y_pos);
                    if (distance < last_distance) {
                        next_contact = this._falling_pos;
                        rolling_pillar_will_fall = true;
                    }
                }
            }

            if (char.trying_to_push_direction === directions.up && char.tile_y_pos <= this.tile_y_pos) return;
            if (char.trying_to_push_direction === directions.down && char.tile_y_pos >= this.tile_y_pos) return;
            if (char.trying_to_push_direction === directions.right && char.tile_x_pos >= this.tile_x_pos) return;
            if (char.trying_to_push_direction === directions.left && char.tile_x_pos <= this.tile_x_pos) return;

            char.pushing = true;
            char.toggle_collision(false);
            this.fire_rolling(char, next_contact, rolling_pillar_will_fall);
        }
    }

    async fire_rolling(
        char: ControllableChar,
        next_contact: RollablePillar["_contact_points"][0],
        rolling_pillar_will_fall: boolean
    ) {
        this._on_rolling_start_events.forEach(async e => e.fire());

        this.play("rolling");

        const rolling_sound = this.data.audio.play_se("misc/rolling");
        rolling_sound.loop = true;

        char.change_action(base_actions.PUSH, true);

        let promise_resolve;
        const promise = new Promise(resolve => (promise_resolve = resolve));

        const dest_x = get_centered_pos_in_px(next_contact.x, this.data.map.tile_width);
        const dest_y = get_centered_pos_in_px(next_contact.y, this.data.map.tile_height);
        const rolling_time =
            get_distance(next_contact.x, this.tile_x_pos, next_contact.y, this.tile_y_pos) *
            RollablePillar.ROLLING_SPEED_PER_TILE;
        const pillar_tween = this.game.add.tween(this.sprite.body).to(
            {
                x: this._pillar_direction === pillar_directions.VERTICAL ? dest_x : this.x,
                y: this._pillar_direction === pillar_directions.HORIZONTAL ? dest_y : this.y,
            },
            rolling_time,
            Phaser.Easing.Linear.None,
            true
        );
        pillar_tween.onComplete.addOnce(promise_resolve);
        const last_pillar_pos = {
            x: this.sprite.body.x,
            y: this.sprite.body.y,
        };
        let stop_hero = false;
        pillar_tween.onUpdateCallback(() => {
            if (stop_hero) {
                return;
            }
            const diff_x = this.sprite.body.x - last_pillar_pos.x;
            const diff_y = this.sprite.body.y - last_pillar_pos.y;
            last_pillar_pos.x = this.sprite.body.x;
            last_pillar_pos.y = this.sprite.body.y;
            char.sprite.body.x += diff_x;
            char.sprite.body.y += diff_y;
            char.update_shadow();
        });
        const walk_timer = this.game.time.create(true);
        walk_timer.add(RollablePillar.ROLLING_SPEED_PER_TILE, () => {
            char.change_action(base_actions.WALK, true);
        });
        walk_timer.start();
        const stop_timer = this.game.time.create(true);
        stop_timer.add(Math.max(rolling_time / 2, RollablePillar.ROLLING_SPEED_PER_TILE), () => {
            char.change_action(base_actions.IDLE, true);
            stop_hero = true;
        });
        stop_timer.start();
        await promise;

        rolling_sound.stop();

        if (rolling_pillar_will_fall) {
            await this.fall_pillar(next_contact);
            this.toggle_collision(false);
            this.sprite.send_to_back = true;
            this.allow_jumping_over_it = true;
            this.change_collision_layer(this._dest_collision_layer);
        } else {
            this.sprite.animations.stop(undefined, false);
        }

        this.shift_events(next_contact.x - this.tile_x_pos, next_contact.y - this.tile_y_pos);
        this.set_tile_position({
            x: next_contact.x,
            y: next_contact.y,
        });

        if (rolling_pillar_will_fall) {
            const object_events = this.get_events();
            for (let i = 0; i < object_events.length; ++i) {
                const event = object_events[i];
                event.activate_at("all");
                this.data.map.set_collision_in_tile(event.x, event.y, false, this._dest_collision_layer);
            }
        }

        char.toggle_collision(true);
        char.pushing = false;

        this._after_rolling_events.forEach(async e => e.fire());
    }

    async fall_pillar(next_contact: RollablePillar["_contact_points"][0]) {
        let extra_shift_x = 0;
        let extra_shift_y = 0;
        let fall_speed_multiplier = 1;
        if (this._pillar_direction === pillar_directions.VERTICAL) {
            if (next_contact.x > this.tile_x_pos) {
                next_contact.x += 1;
                extra_shift_x += 2;
            } else {
                next_contact.x -= 1;
                extra_shift_x -= 2;
            }
            extra_shift_y += this.data.map.tile_height >> 1;
        } else {
            if (this._dest_pos_after_fall !== undefined) {
                fall_speed_multiplier = (this._dest_pos_after_fall.y - this._falling_pos.y) / 3.5;
                next_contact.x = this._dest_pos_after_fall.x;
                next_contact.y = this._dest_pos_after_fall.y;
            } else if (next_contact.y > this.tile_y_pos) {
                next_contact.y += 1;
            } else {
                next_contact.y -= 1;
                extra_shift_y -= 1;
            }
        }

        let promise_resolve_anim;
        const promise_anim = new Promise(resolve => (promise_resolve_anim = resolve));
        const fall_anim_timer = this.game.time.create(true);
        const anim_start_delay = RollablePillar.ROLLING_SPEED_PER_TILE * fall_speed_multiplier;
        fall_anim_timer.add(anim_start_delay, () => {
            this.data.audio.play_se("misc/fall_into_water");
            const anim = this.play("falling");
            anim.onComplete.addOnce(promise_resolve_anim);
        });
        fall_anim_timer.start();
        this.data.audio.play_se("misc/on_rolling_fall");

        let promise_resolve_tween;
        const promise_tween = new Promise(resolve => (promise_resolve_tween = resolve));
        const dest_x = get_centered_pos_in_px(next_contact.x, this.data.map.tile_width) + extra_shift_x;
        const dest_y = get_centered_pos_in_px(next_contact.y, this.data.map.tile_height) + extra_shift_y;
        const fall_tween = this.game.add.tween(this.sprite.body).to(
            {
                x: dest_x,
                y: dest_y,
            },
            RollablePillar.ROLLING_SPEED_PER_TILE * fall_speed_multiplier,
            Phaser.Easing.Linear.None,
            true
        );
        fall_tween.onComplete.addOnce(promise_resolve_tween);

        await Promise.all([promise_tween, promise_anim]);

        this.play("floating");

        this._pillar_is_stuck = true;
    }

    public custom_unset() {
        this._after_rolling_events.forEach(e => e.destroy());
        this._after_rolling_events = null;
        this._on_rolling_start_events.forEach(e => e.destroy());
        this._on_rolling_start_events = null;
    }
}
