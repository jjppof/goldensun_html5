import {base_actions, directions, get_centered_pos_in_px, reverse_directions} from "../utils";
import {InteractableObjects, interactable_object_interaction_types} from "../interactable_objects/InteractableObjects";
import {FieldPsynergyWindow} from "../windows/FieldPsynergyWindow";
import {GoldenSun} from "../GoldenSun";
import {ControllableChar} from "../ControllableChar";
import {Map} from "../Map";
import {YesNoMenu} from "../windows/YesNoMenu";
import {NPC} from "../NPC";
import * as _ from "lodash";
import {Button} from "../XGamepad";
import {DialogManager} from "../utils/DialogManager";

/**
 * Defines and manages the usage of field psynergy.
 */
export abstract class FieldAbilities {
    private static readonly DEFAULT_RANGE = 12;

    protected game: Phaser.Game;
    protected data: GoldenSun;
    private ability_key_name: string;
    private target_max_range: number | ((target: FieldAbilities["target_object"]) => number);
    private action_key_name: string;
    private need_target: boolean;
    private tint_map: boolean;
    private bootstrap_method: Function;
    private cast_finisher: Function;
    protected controllable_char: ControllableChar;
    protected target_found: boolean;
    protected target_object: InteractableObjects | NPC;
    protected stop_casting: (reset_casting_psy_flag?: boolean, reset_map_tint?: boolean) => Promise<void>;
    protected field_psynergy_window: FieldPsynergyWindow;
    protected cast_direction: number;
    protected reset_map: () => void;
    private field_color: number;
    private field_intensity: number;
    private works_on_disabled_target: boolean;
    private target_found_extra_check: (target: FieldAbilities["target_object"]) => boolean;
    private ask_before_cast: boolean;
    private ask_before_cast_yes_no_menu: YesNoMenu;
    private extra_cast_check: () => boolean;
    private target_is_npc: boolean;
    private map_colors_sequence: boolean;
    private previous_collision_status: {
        char: boolean;
        target?: boolean;
    };

    /**
     * FieldAbilities Ctor.
     * @param game The Phaser.Game object.
     * @param data The GoldenSun object.
     * @param ability_key_name The ability key_name.
     * @param action_key_name The action that the char will assume when casting this ability.
     * @param need_target Whether this ability need a target or not.
     * @param tint_map Whether this ability will tint the map when casting.
     * @param target_max_range If this ability need a target, the max distance range from the caster to find a target.
     * This can also be a function that receives a target candidate, this function must return a range.
     * @param field_color A custom color to tint the map.
     * @param field_intensity A custom intensity of a color when tinting the map.
     * @param works_on_disabled_target Only for IO targets. If true, this field ability also works for disabled targets.
     * @param target_found_extra_check A function that receives a target. This called before casting.
     * Execute some custom extra checks. If this funuction returns true, the char will cast this abiliy.
     * @param ask_before_cast If true, it opens an YesNo menu asking if the char really wants to cast this ability.
     * @param target_is_npc If true, the target is a NPC instead of an IO.
     * @param map_colors_sequence If true, the map will be tinted sequentially with random colors.
     */
    constructor(
        game: Phaser.Game,
        data: GoldenSun,
        ability_key_name: string,
        action_key_name: string,
        need_target: boolean,
        tint_map?: boolean,
        target_max_range?: FieldAbilities["target_max_range"],
        field_color?: number,
        field_intensity?: number,
        works_on_disabled_target?: boolean,
        target_found_extra_check?: (target: FieldAbilities["target_object"]) => boolean,
        ask_before_cast?: boolean,
        target_is_npc?: boolean,
        map_colors_sequence?: boolean
    ) {
        this.game = game;
        this.ability_key_name = ability_key_name;
        this.data = data;
        this.target_max_range = target_max_range ?? FieldAbilities.DEFAULT_RANGE;
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
        this.works_on_disabled_target = works_on_disabled_target ?? false;
        this.target_found_extra_check = target_found_extra_check;
        this.ask_before_cast = ask_before_cast ?? false;
        this.ask_before_cast_yes_no_menu = new YesNoMenu(this.game, this.data);
        this.target_is_npc = target_is_npc ?? false;
        this.map_colors_sequence = map_colors_sequence ?? false;
    }

    abstract update(): void;

    /**
     * Sets the psynergy cast direction,
     * For diagonals, picks the next clockwise non-diagonal.
     * @param {number} direction - Current direction
     * @return {number} Non-diagonal cast direction
     */
    get_cast_direction(direction: directions) {
        return (direction % 2 ? direction + 1 : direction) % 8;
    }

    set_hero_cast_anim() {
        this.controllable_char.play(this.action_key_name, reverse_directions[this.cast_direction]);
    }

    return_to_idle_anim() {
        let promise_resolve;
        const promise = new Promise<void>(resolve => (promise_resolve = resolve));
        this.controllable_char.sprite.animations.currentAnim.reverseOnce();
        this.controllable_char.sprite.animations.currentAnim.onComplete.addOnce(() => {
            this.controllable_char.play(base_actions.IDLE, reverse_directions[this.cast_direction]);
            promise_resolve();
        });
        this.controllable_char.play(this.action_key_name, reverse_directions[this.cast_direction]);
        return promise;
    }

    set_bootstrap_method(method) {
        this.bootstrap_method = method;
    }

    set_extra_cast_check(method) {
        this.extra_cast_check = method;
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
                max_y = min_y = this.controllable_char.sprite.y - this.controllable_char.body_radius;
            } else {
                max_y = min_y = this.controllable_char.sprite.y + this.controllable_char.body_radius;
            }
        } else {
            min_y = this.controllable_char.sprite.y - this.controllable_char.body_radius;
            max_y = this.controllable_char.sprite.y + this.controllable_char.body_radius;
            if (this.cast_direction === directions.left) {
                max_x = min_x = this.controllable_char.sprite.x - this.controllable_char.body_radius;
            } else {
                max_x = min_x = this.controllable_char.sprite.x + this.controllable_char.body_radius;
            }
        }
        let sqr_distance = Infinity;
        const targets_list = this.target_is_npc ? this.data.map.npcs : this.data.map.interactable_objects;
        for (let i = 0; i < targets_list.length; ++i) {
            const target_object = targets_list[i];
            if (target_object.is_interactable_object) {
                if (!(target_object as InteractableObjects).enable && !this.works_on_disabled_target) {
                    continue;
                }
            }
            if (this.target_found_extra_check && !this.target_found_extra_check(target_object)) {
                continue;
            }
            if (target_object.is_interactable_object) {
                if (
                    !(target_object as InteractableObjects).psynergies_info ||
                    !(this.ability_key_name in (target_object as InteractableObjects).psynergies_info)
                ) {
                    continue;
                }
            }
            const item_x_px = get_centered_pos_in_px(target_object.tile_x_pos, this.data.map.tile_width);
            const item_y_px = get_centered_pos_in_px(target_object.tile_y_pos, this.data.map.tile_height);
            const max_range = Number.isFinite(this.target_max_range as unknown)
                ? (this.target_max_range as number)
                : (this.target_max_range as Function)(target_object);
            const bounds = {
                min_y: min_y,
                max_y: max_y,
                min_x: min_x,
                max_x: max_x,
            };
            switch (this.cast_direction) {
                case directions.up:
                    bounds.min_y -= max_range;
                    break;
                case directions.down:
                    bounds.max_y += max_range;
                    break;
                case directions.left:
                    bounds.min_x -= max_range;
                    break;
                case directions.right:
                    bounds.max_x += max_range;
                    break;
            }
            const x_condition = item_x_px >= bounds.min_x && item_x_px <= bounds.max_x;
            const y_condition = item_y_px >= bounds.min_y && item_y_px <= bounds.max_y;
            if (x_condition && y_condition && this.data.map.collision_layer === target_object.base_collision_layer) {
                const this_sqr_distance =
                    Math.pow(item_x_px - this.controllable_char.sprite.x, 2) +
                    Math.pow(item_y_px - this.controllable_char.sprite.y, 2);
                if (this_sqr_distance < sqr_distance) {
                    sqr_distance = this_sqr_distance;
                    this.target_found = true;
                    this.target_object = target_object;
                }
            }
        }
    }

    set_target_casted() {
        if (this.target_object && this.target_object.is_interactable_object) {
            const target_object = this.target_object as InteractableObjects;
            if (target_object.psynergies_info) {
                const psynergy_properties = target_object.psynergies_info[this.ability_key_name];
                if (psynergy_properties.interaction_type === interactable_object_interaction_types.ONCE) {
                    if (target_object.psynergy_casted[this.ability_key_name]) {
                        this.target_found = false;
                        this.target_object = null;
                    } else if (this.target_found) {
                        target_object.psynergy_casted[this.ability_key_name] = true;
                    }
                }
            }
        }
    }

    init_cast(caster_key_name: string) {
        this.field_psynergy_window.close();
        const caster = this.data.info.main_char_list[caster_key_name];
        const ability = this.data.info.abilities_list[this.ability_key_name];
        caster.current_pp -= ability.pp_cost;

        this.field_psynergy_window.open(ability.name);

        this.controllable_char.casting_psynergy = true;
        this.controllable_char.misc_busy = false;
        this.data.audio.play_se("psynergy/4");
        this.previous_collision_status = {char: this.controllable_char.shapes_collision_active};
        this.controllable_char.toggle_collision(false);
        this.controllable_char.stop_char(false);

        this.cast_direction = this.get_cast_direction(this.controllable_char.current_direction);
        this.controllable_char.set_direction(this.cast_direction);
        if (this.need_target) {
            this.search_for_target();
            this.set_target_casted();
            if (this.target_found) {
                this.previous_collision_status.target = this.target_object.shapes_collision_active;
                this.target_object.toggle_collision(false);
            }
        }

        this.set_hero_cast_anim();
        //stop_casting calls after_destroy and before_destroy.
        this.stop_casting = FieldAbilities.init_cast_aura(
            this.game,
            this.controllable_char.sprite,
            this.data.middlelayer_group,
            this.controllable_char,
            //after_init
            () => {
                if (this.tint_map && !this.controllable_char.on_reveal) {
                    this.reset_map = FieldAbilities.tint_map_layers(this.game, this.data.map, {
                        color: this.field_color,
                        intensity: this.field_intensity,
                        map_colors_sequence: this.map_colors_sequence,
                    });
                }
                if (this.target_found && this.target_object.is_interactable_object) {
                    const events = (this.target_object as InteractableObjects).before_psynergy_cast_events[
                        this.ability_key_name
                    ];
                    events?.forEach(e => e.fire());
                }
                this.bootstrap_method();
            },
            //after_destroy
            (reset_casting_psy_flag: boolean = true) => {
                this.controllable_char.toggle_collision(this.previous_collision_status.char);
                if (reset_casting_psy_flag) {
                    this.controllable_char.casting_psynergy = false;
                }
                if (this.target_found) {
                    this.target_object.toggle_collision(this.previous_collision_status.target);
                    if (this.target_object.is_interactable_object) {
                        const events = (this.target_object as InteractableObjects).after_psynergy_cast_events[
                            this.ability_key_name
                        ];
                        events?.forEach(e => e.fire());
                    }
                }
                if (reset_casting_psy_flag) {
                    this.target_object = null;
                }
            },
            //before_destroy
            (reset_map_tint: boolean = true) => {
                this.cast_finisher();
                if (this.reset_map && reset_map_tint) {
                    this.reset_map();
                }
            }
        );
    }

    no_pp() {
        this.controllable_char.misc_busy = true;
        const dialog = new DialogManager(this.game, this.data);
        let next = false;
        let kill_dialog = false;
        const control_key = this.data.control_manager.add_controls(
            [
                {
                    buttons: Button.A,
                    on_down: () => {
                        if (next) {
                            dialog.next_dialog(`Not enough PP.`, () => {
                                next = false;
                                kill_dialog = true;
                            });
                        } else if (kill_dialog) {
                            dialog.kill_dialog(
                                () => {
                                    this.data.control_manager.detach_bindings(control_key);
                                    this.controllable_char.misc_busy = false;
                                },
                                false,
                                true
                            );
                        }
                    },
                },
            ],
            {persist: true}
        );
        const ability_name = this.data.info.abilities_list[this.ability_key_name].name;
        dialog.next_dialog(
            `${ability_name}...`,
            () => {
                next = true;
            },
            {show_crystal: true}
        );
        return false;
    }

    cast(controllable_char: ControllableChar, caster_key_name: string) {
        this.controllable_char = controllable_char;
        const caster = this.data.info.main_char_list[caster_key_name];
        if (
            this.controllable_char.casting_psynergy ||
            caster_key_name === undefined ||
            !(caster_key_name in this.data.info.main_char_list) ||
            !caster.abilities.includes(this.ability_key_name)
        ) {
            return;
        }

        const ability = this.data.info.abilities_list[this.ability_key_name];
        if (caster.current_pp < ability.pp_cost) {
            this.no_pp();
            return;
        }

        if (this.extra_cast_check && !this.extra_cast_check()) {
            return;
        }

        if (this.ask_before_cast) {
            const ability = this.data.info.abilities_list[this.ability_key_name];
            this.field_psynergy_window.open(`Use ${ability.name}?`);
            this.controllable_char.misc_busy = true;
            this.ask_before_cast_yes_no_menu.open({
                yes: this.init_cast.bind(this, caster_key_name),
                no: () => {
                    this.field_psynergy_window.close();
                    this.controllable_char.misc_busy = false;
                },
            });
        } else {
            this.init_cast(caster_key_name);
        }
    }

    static init_cast_aura(
        game: Phaser.Game,
        sprite: Phaser.Sprite,
        group: Phaser.Group,
        char: ControllableChar,
        after_init: () => void,
        after_destroy: (reset_casting_psy_flag: boolean) => void,
        before_destroy: (reset_map_tint: boolean) => void
    ) {
        const ring_up_time = 750;
        const ring_up_time_half = ring_up_time >> 1;
        const step_time = (ring_up_time / 3) | 0;
        char.manage_filter(char.color_filter, true);
        const auras_number = 2;
        const tweens = [];
        let stop_asked = false;
        const promises = [];
        for (let j = 0; j < auras_number; ++j) {
            const back_aura: Phaser.Sprite = group.create(0, 0, "psynergy_aura");
            const front_aura: Phaser.Sprite = group.create(0, 0, "psynergy_aura");
            back_aura.base_collision_layer = sprite.base_collision_layer;
            front_aura.base_collision_layer = sprite.base_collision_layer;
            back_aura.sort_function = () => {
                if (group.getChildIndex(back_aura) > group.getChildIndex(sprite)) {
                    group.setChildIndex(back_aura, group.getChildIndex(sprite));
                } else {
                    group.setChildIndex(back_aura, group.getChildIndex(sprite) - 1);
                }
            };
            back_aura.sort_function();
            front_aura.sort_function = () => {
                if (group.getChildIndex(front_aura) > group.getChildIndex(sprite)) {
                    group.setChildIndex(front_aura, group.getChildIndex(sprite) + 1);
                } else {
                    group.setChildIndex(front_aura, group.getChildIndex(sprite));
                }
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
                char.color_filter.tint = [1, 1, 1];
            } else {
                char.color_filter.tint = [-1, -1, -1];
            }
            --blink_counter;
            if (blink_counter === 0) {
                char.color_filter.gray = 0.4;
                blink_timer.stop();
                if (after_init !== undefined) {
                    after_init();
                }
                hue_timer.start();
            }
        });
        hue_timer.loop(100, () => {
            char.color_filter.hue_adjust = Math.random() * 2 * Math.PI;
        });
        blink_timer.start();
        return async (reset_casting_psy_flag?: boolean, reset_map_tint?: boolean) => {
            if (before_destroy !== undefined) {
                before_destroy(reset_map_tint);
            }
            stop_asked = true;
            hue_timer.stop();
            blink_timer.stop();
            char.color_filter.tint = [-1, -1, -1];
            char.color_filter.gray = 0;
            char.color_filter.hue_adjust = 0;
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
                after_destroy(reset_casting_psy_flag);
            }
        };
    }

    static tint_map_layers(
        game: Phaser.Game,
        map: Map,
        options?: {
            color?: number;
            intensity?: number;
            after_destroy?: () => void;
            after_colorize?: () => void;
            map_colors_sequence?: boolean;
        }
    ) {
        const filter = map.color_filter;
        const target_intensity = options?.intensity ?? 0.4;
        filter.colorize_intensity = 0;
        filter.gray = 0;
        filter.colorize = options?.color ?? Math.random();
        let random_color_running: boolean = false;
        game.add
            .tween(filter)
            .to(
                {
                    colorize_intensity: target_intensity,
                    gray: 1,
                },
                Phaser.Timer.QUARTER,
                Phaser.Easing.Linear.None,
                true
            )
            .onComplete.addOnce(() => {
                if (options?.after_colorize !== undefined) {
                    options.after_colorize();
                }
                if (options?.map_colors_sequence) {
                    const colors = _.range(0, 1.0, 0.1).concat(_.range(0.1, 0.9, 0.1).reverse());
                    const tween_factory = color_index => {
                        if (!random_color_running) {
                            return;
                        }
                        game.add
                            .tween(filter)
                            .to(
                                {
                                    colorize: colors[color_index],
                                },
                                Phaser.Timer.SECOND,
                                Phaser.Easing.Linear.None,
                                true
                            )
                            .onComplete.addOnce(() => {
                                color_index = (color_index + 1) % colors.length;
                                tween_factory(color_index);
                            });
                    };

                    random_color_running = true;
                    tween_factory(colors.findIndex(v => v > filter.colorize));
                }
            });
        return () => {
            random_color_running = false;
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
                    if (options?.after_destroy !== undefined) {
                        options.after_destroy();
                    }
                });
        };
    }
}
