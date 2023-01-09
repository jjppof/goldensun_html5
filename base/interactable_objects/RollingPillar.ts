import {ControllableChar} from "../ControllableChar";
import {Map} from "../Map";
import {
    base_actions,
    directions,
    get_centered_pos_in_px,
    get_distance,
    get_sqr_distance,
    get_vector_direction,
} from "../utils";
import {InteractableObjects} from "./InteractableObjects";

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
        this._rollable = true;
        this._pillar_is_stuck = this.snapshot_info?.state_by_type.rollable.pillar_is_stuck ?? false;
    }

    get pillar_is_stuck() {
        return this._pillar_is_stuck;
    }

    initialize_rolling_pillar(
        falling_pos: RollablePillar["_falling_pos"],
        contact_points: RollablePillar["_contact_points"],
        pillar_direction: pillar_directions,
        dest_pos_after_fall: RollablePillar["_dest_pos_after_fall"],
        dest_collision_layer: number
    ) {
        this._falling_pos = falling_pos;
        this._contact_points = contact_points;
        this._pillar_direction = pillar_direction;
        this._dest_pos_after_fall = dest_pos_after_fall;
        this._dest_collision_layer = dest_collision_layer ?? this.base_collision_layer;
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
                char.set_push_timer(() => {
                    this.define_pillar_direction(char);
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
            let next_contact: RollablePillar["_contact_points"][0] = null;
            let last_distance = Infinity;
            for (let i = 0; i < this._contact_points.length; ++i) {
                const point = this._contact_points[i];
                if (point.x === this.tile_x_pos && point.y === this.tile_y_pos) {
                    continue;
                }
                const distance = get_sqr_distance(point.x, this.tile_x_pos, point.y, this.tile_y_pos);
                if (distance < last_distance) {
                    next_contact = point;
                    last_distance = distance;
                }
            }
            let rolling_pillar_will_fall = false;
            if (next_contact === null) {
                next_contact = this._falling_pos;
                rolling_pillar_will_fall = true;
            }
            const rolling_direction = get_vector_direction(
                this.tile_x_pos,
                next_contact.x,
                this.tile_y_pos,
                next_contact.y
            );
            if (rolling_direction !== char.trying_to_push_direction) {
                return;
            }

            if (rolling_direction === directions.up && char.tile_y_pos <= this.tile_y_pos) return;
            if (rolling_direction === directions.down && char.tile_y_pos >= this.tile_y_pos) return;
            if (rolling_direction === directions.right && char.tile_x_pos >= this.tile_x_pos) return;
            if (rolling_direction === directions.left && char.tile_x_pos <= this.tile_x_pos) return;

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
                x: dest_x,
                y: dest_y,
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
}
