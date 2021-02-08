import {base_actions, directions, reverse_directions} from "../utils";
import {InteractableObjects, interactable_object_interaction_types} from "../InteractableObjects";
import {FieldPsynergyWindow} from "../windows/FieldPsynergyWindow";
import {GoldenSun} from "../GoldenSun";
import {ControllableChar} from "../ControllableChar";

/*Defines and manages the usage of field psynergy

Input: game [Phaser:Game] - Reference to the running game object
       data [GoldenSun] - Reference to the main JS Class instance*/
export abstract class FieldAbilities {
    public game: Phaser.Game;
    public ability_key_name: string;
    public data: GoldenSun;
    public target_max_range: number;
    public action_key_name: string;
    public need_target: boolean;
    public tint_map: boolean;
    public bootstrap_method: Function;
    public cast_finisher: Function;
    public controllable_char: ControllableChar;
    public target_found: boolean;
    public target_object: InteractableObjects;
    public stop_casting: Function;
    public field_psynergy_window: FieldPsynergyWindow;
    public cast_direction: number;
    public field_color: number;
    public field_intensity: number;

    constructor(
        game: Phaser.Game,
        data: GoldenSun,
        ability_key_name: string,
        action_key_name: string,
        need_target: boolean,
        tint_map?: boolean,
        target_max_range?: number,
        field_color?: number,
        field_intensity?: number
    ) {
        this.game = game;
        this.ability_key_name = ability_key_name;
        this.data = data;
        this.target_max_range = target_max_range;
        this.action_key_name = action_key_name;
        this.need_target = need_target;
        this.tint_map = tint_map ?? true;
        this.bootstrap_method = () => {};
        this.cast_finisher = () => {};
        this.controllable_char = null;
        this.target_found = false;
        this.target_object = null;
        this.stop_casting = null;
        this.field_psynergy_window = new FieldPsynergyWindow(this.game, this.data);
        this.field_color = field_color;
        this.field_intensity = field_intensity;
    }

    abstract update(): void;

    /**
     * Sets the psynergy cast direction,
     * For diagonals, picks the next clockwise non-diagonal.
     * @param {number} direction - Current direction
     * @return {number} Non-diagonal cast direction
     */
    get_cast_direction(direction) {
        return (direction % 2 ? direction + 1 : direction) % 8;
    }

    set_hero_cast_anim() {
        this.controllable_char.play(this.action_key_name, reverse_directions[this.cast_direction]);
    }

    unset_hero_cast_anim() {
        this.controllable_char.sprite.animations.currentAnim.reverseOnce();
        this.controllable_char.sprite.animations.currentAnim.onComplete.addOnce(() => {
            this.controllable_char.play(base_actions.IDLE, reverse_directions[this.cast_direction]);
        });
        this.controllable_char.play(this.action_key_name, reverse_directions[this.cast_direction]);
    }

    set_bootstrap_method(method) {
        this.bootstrap_method = method;
    }

    set_cast_finisher_method(method) {
        this.cast_finisher = method;
    }

    search_for_target() {
        this.target_found = false;
        let min_x, max_x, min_y, max_y;
        if (this.cast_direction === directions.up || this.cast_direction === directions.down) {
            min_x = this.controllable_char.sprite.x - this.controllable_char.body_radius;
            max_x = this.controllable_char.sprite.x + this.controllable_char.body_radius;
            if (this.cast_direction === directions.up) {
                min_y = this.controllable_char.sprite.y - this.controllable_char.body_radius - this.target_max_range;
                max_y = this.controllable_char.sprite.y - this.controllable_char.body_radius;
            } else {
                min_y = this.controllable_char.sprite.y + this.controllable_char.body_radius;
                max_y = this.controllable_char.sprite.y + this.controllable_char.body_radius + this.target_max_range;
            }
        } else {
            min_y = this.controllable_char.sprite.y - this.controllable_char.body_radius;
            max_y = this.controllable_char.sprite.y + this.controllable_char.body_radius;
            if (this.cast_direction === directions.left) {
                min_x = this.controllable_char.sprite.x - this.controllable_char.body_radius - this.target_max_range;
                max_x = this.controllable_char.sprite.x - this.controllable_char.body_radius;
            } else {
                min_x = this.controllable_char.sprite.x + this.controllable_char.body_radius;
                max_x = this.controllable_char.sprite.x + this.controllable_char.body_radius + this.target_max_range;
            }
        }
        let sqr_distance = Infinity;
        for (let i = 0; i < this.data.map.interactable_objects.length; ++i) {
            let interactable_object = this.data.map.interactable_objects[i];
            if (
                !(
                    this.ability_key_name in
                    this.data.dbs.interactable_objects_db[interactable_object.key_name].psynergy_keys
                )
            )
                continue;
            const item_x_px =
                interactable_object.current_x * this.data.map.tile_width + (this.data.map.tile_width >> 1);
            const item_y_px =
                interactable_object.current_y * this.data.map.tile_height + (this.data.map.tile_height >> 1);
            const x_condition = item_x_px >= min_x && item_x_px <= max_x;
            const y_condition = item_y_px >= min_y && item_y_px <= max_y;
            if (
                x_condition &&
                y_condition &&
                this.data.map.collision_layer === interactable_object.base_collision_layer
            ) {
                let this_sqr_distance =
                    Math.pow(item_x_px - this.controllable_char.sprite.x, 2) +
                    Math.pow(item_y_px - this.controllable_char.sprite.y, 2);
                if (this_sqr_distance < sqr_distance) {
                    sqr_distance = this_sqr_distance;
                    this.target_found = true;
                    this.target_object = interactable_object;
                }
            }
        }
    }

    set_target_casted() {
        if (this.target_object) {
            const psynergy_properties = this.data.dbs.interactable_objects_db[this.target_object.key_name]
                .psynergy_keys[this.ability_key_name];
            if (psynergy_properties.interaction_type === interactable_object_interaction_types.ONCE) {
                if (this.target_object.psynergy_casted[this.ability_key_name]) {
                    this.target_found = false;
                    this.target_object = null;
                } else if (this.target_found) {
                    this.target_object.psynergy_casted[this.ability_key_name] = true;
                }
            }
        }
    }

    cast(controllable_char, caster_key_name) {
        this.controllable_char = controllable_char;
        if (this.controllable_char.casting_psynergy) return;
        if (caster_key_name !== undefined && caster_key_name in this.data.info.main_char_list) {
            const caster = this.data.info.main_char_list[caster_key_name];
            const ability = this.data.info.abilities_list[this.ability_key_name];
            if (caster.current_pp < ability.pp_cost || !caster.abilities.includes(this.ability_key_name)) {
                return;
            }
            caster.current_pp -= ability.pp_cost;
        }

        this.field_psynergy_window.window.send_to_front();
        this.field_psynergy_window.open(this.ability_key_name);

        this.controllable_char.casting_psynergy = true;
        this.data.audio.play_se("psynergy/4");
        this.game.physics.p2.pause();
        this.controllable_char.stop_char(false);

        this.cast_direction = this.get_cast_direction(this.controllable_char.current_direction);
        this.controllable_char.set_direction(this.cast_direction);
        if (this.need_target) {
            this.search_for_target();
            this.set_target_casted();
        }

        this.set_hero_cast_anim();
        let reset_map;
        this.stop_casting = FieldAbilities.init_cast_aura(
            this.game,
            this.controllable_char.sprite,
            this.data.npc_group,
            this.controllable_char.color_filter,
            () => {
                if (this.tint_map && !this.controllable_char.on_reveal) {
                    reset_map = FieldAbilities.tint_map_layers(
                        this.game,
                        this.data.map.color_filter,
                        this.field_color,
                        this.field_intensity
                    );
                }

                this.bootstrap_method();
            },
            () => {
                this.game.physics.p2.resume();
                this.controllable_char.casting_psynergy = false;
                this.target_object = null;
            },
            () => {
                this.cast_finisher();
                if (reset_map) {
                    reset_map();
                }
            }
        );
    }

    static init_cast_aura(
        game: Phaser.Game,
        sprite: Phaser.Sprite,
        group: Phaser.Group,
        filter,
        after_init,
        after_destroy,
        before_destroy
    ) {
        const ring_up_time = 750;
        const ring_up_time_half = ring_up_time >> 1;
        const step_time = (ring_up_time / 3) | 0;
        sprite.filters = [filter];
        const auras_number = 2;
        const tweens = [];
        let stop_asked = false;
        const promises = [];
        for (let j = 0; j < auras_number; ++j) {
            const back_aura = group.create(0, 0, "psynergy_aura");
            const front_aura = group.create(0, 0, "psynergy_aura");
            back_aura.base_collision_layer = sprite.base_collision_layer;
            front_aura.base_collision_layer = sprite.base_collision_layer;
            back_aura.sort_function = () => {
                group.setChildIndex(back_aura, group.getChildIndex(sprite));
            };
            back_aura.sort_function();
            front_aura.sort_function = () => {
                group.setChildIndex(front_aura, group.getChildIndex(sprite) + 1);
            };
            front_aura.sort_function();
            const height = sprite.height + front_aura.height - 8;
            const step_height = (height / 3) | 0;
            front_aura.anchor.setTo(0.5, 0);
            front_aura.centerX = sprite.centerX;
            front_aura.centerY = sprite.centerY + (sprite.height >> 1) + (front_aura.height >> 1);
            const initial_front_y = front_aura.y;
            front_aura.scale.setTo(0, 0);
            back_aura.anchor.setTo(0.5, 0);
            back_aura.centerX = sprite.centerX;
            back_aura.centerY = sprite.centerY + (sprite.height >> 1) + (back_aura.height >> 1);
            const initial_back_y = back_aura.y;
            back_aura.scale.setTo(0, 0);
            const auras = [
                {aura: front_aura, initial_y: initial_front_y, scale_factor: 1},
                {aura: back_aura, initial_y: initial_back_y, scale_factor: -1},
            ];
            tweens.push([]);
            for (let i = 0; i < auras.length; ++i) {
                const aura = auras[i].aura;
                const initial_y = auras[i].initial_y;
                const scale_factor = auras[i].scale_factor;
                const tween_a = game.add
                    .tween(aura)
                    .to({y: initial_y - step_height}, step_time, Phaser.Easing.Linear.None);
                const tween_b = game.add
                    .tween(aura)
                    .to({y: initial_y - 2 * step_height}, step_time, Phaser.Easing.Linear.None);
                const tween_c = game.add
                    .tween(aura)
                    .to({y: initial_y - 3 * step_height}, step_time, Phaser.Easing.Linear.None);
                let promise_resolve;
                promises.push(new Promise(resolve => (promise_resolve = resolve)));
                tween_c.onComplete.add(() => {
                    aura.y = initial_y;
                    if (!stop_asked) {
                        tween_a.start();
                        tween_aa.start();
                    } else {
                        promise_resolve();
                    }
                });
                const tween_aa = game.add
                    .tween(aura.scale)
                    .to({x: scale_factor, y: scale_factor}, ring_up_time_half, Phaser.Easing.Quadratic.Out);
                const tween_cc = game.add
                    .tween(aura.scale)
                    .to({x: 0, y: 0}, ring_up_time_half, Phaser.Easing.Quadratic.Out);
                tweens[j].push({
                    aura: aura,
                    tween_a: tween_a,
                    tween_aa: tween_aa,
                    tween_b: tween_b,
                    tween_c: tween_c,
                    tween_cc: tween_cc,
                });
                tween_a.chain(tween_b);
                tween_b.chain(tween_c);
                tween_aa.chain(tween_cc);
                if (j > 0) {
                    tween_aa.onComplete.addOnce(() => {
                        tweens[0][i].aura.y = initial_y;
                        tweens[0][i].tween_a.start();
                        tweens[0][i].tween_aa.start();
                    });
                    tween_a.start();
                    tween_aa.start();
                }
            }
        }
        let blink_counter = 16;
        const blink_timer = game.time.create(false);
        const hue_timer = game.time.create(false);
        blink_timer.loop(50, () => {
            if (blink_counter % 2 === 0) {
                filter.tint = [1, 1, 1];
            } else {
                filter.tint = [-1, -1, -1];
            }
            --blink_counter;
            if (blink_counter === 0) {
                filter.gray = 0.4;
                blink_timer.stop();
                if (after_init !== undefined) {
                    after_init();
                }
                hue_timer.start();
            }
        });
        hue_timer.loop(100, () => {
            filter.hue_adjust = Math.random() * 2 * Math.PI;
        });
        blink_timer.start();
        return async () => {
            if (before_destroy !== undefined) {
                before_destroy();
            }
            stop_asked = true;
            hue_timer.stop();
            blink_timer.stop();
            filter.tint = [-1, -1, -1];
            filter.gray = 0;
            filter.hue_adjust = 0;
            sprite.filters = undefined;
            await Promise.all(promises);
            for (let i = 0; i < tweens.length; ++i) {
                for (let j = 0; j < tweens[i].length; ++j) {
                    tweens[i][j].tween_a.stop();
                    tweens[i][j].tween_aa.stop();
                    tweens[i][j].tween_b.stop();
                    tweens[i][j].tween_c.stop();
                    tweens[i][j].tween_cc.stop();
                    group.remove(tweens[i][j].aura, true);
                }
            }
            if (after_destroy !== undefined) {
                after_destroy();
            }
        };
    }

    static tint_map_layers(game: Phaser.Game, filter, color?, intensity?, after_destroy?) {
        filter.colorize_intensity = 0;
        filter.gray = 0;
        filter.colorize = color ?? Math.random();
        game.add.tween(filter).to(
            {
                colorize_intensity: intensity ?? 0.4,
                gray: 1,
            },
            Phaser.Timer.QUARTER,
            Phaser.Easing.Linear.None,
            true
        );
        return () => {
            game.add
                .tween(filter)
                .to(
                    {
                        colorize_intensity: 0,
                        gray: 0,
                    },
                    Phaser.Timer.QUARTER,
                    Phaser.Easing.Linear.None,
                    true
                )
                .onComplete.addOnce(() => {
                    filter.colorize = -1;
                    if (after_destroy !== undefined) {
                        after_destroy();
                    }
                });
        };
    }
}
