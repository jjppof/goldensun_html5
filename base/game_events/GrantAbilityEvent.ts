import {DialogManager} from "../utils/DialogManager";
import {zone_types} from "../ParticlesWrapper";
import {base_actions, directions, promised_wait} from "../utils";
import {GameEvent, event_types} from "./GameEvent";

export class GrantAbilityEvent extends GameEvent {
    private ability: string;
    private char_key: string;
    private play_animation: boolean;
    private reset_direction: boolean;
    private show_learn_msg: boolean;
    private finish_events: GameEvent[];

    constructor(
        game,
        data,
        active,
        key_name,
        keep_reveal,
        keep_custom_psynergy,
        char_key,
        ability,
        play_animation,
        reset_direction,
        show_learn_msg,
        finish_events
    ) {
        super(game, data, event_types.GRANT_ABILITY, active, key_name, keep_reveal, keep_custom_psynergy);
        this.char_key = char_key;
        this.ability = ability;
        this.play_animation = play_animation ?? false;
        this.reset_direction = reset_direction ?? false;
        this.show_learn_msg = show_learn_msg ?? true;
        this.finish_events = [];
        if (finish_events !== undefined) {
            finish_events.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info, this.type, this.origin_npc);
                this.finish_events.push(event);
            });
        }
    }

    async _fire() {
        const char = this.data.info.main_char_list[this.char_key];
        if (!char) {
            this.data.logger.log_message(
                `Could not grant ability for "${this.char_key}" char. Check "char_key" property.`
            );
            return;
        }
        char.learn_ability(this.ability, true);
        if (this.play_animation) {
            await this._get_ability_anim(char.name, this.data.info.abilities_list[this.ability].name);
        }
    }

    async _get_ability_anim(char_name: string, ability_name: string) {
        ++this.data.game_event_manager.events_running_count;
        const previous_direction = this.data.hero.current_direction;
        const previous_force_idle_action_in_event = this.data.hero.force_idle_action_in_event;
        this.data.hero.force_idle_action_in_event = false;
        const prev_collision_state = this.data.hero.toggle_collision(false);

        await this.data.hero.face_direction(directions.down);
        this.data.hero.play(base_actions.GRANT);

        const filter = this.game.add.filter("Glow", 0.55, 3, 0.01, 0.5) as Phaser.Filter.Glow;
        this.data.hero.sprite.filters = [...(this.data.hero.sprite.filters ?? []), filter];
        filter.texture_width = this.data.hero.sprite.texture.baseTexture.width;
        filter.texture_height = this.data.hero.sprite.texture.baseTexture.height;
        filter.r = 1;
        filter.g = 1;
        filter.b = 0;
        filter.outer_strength = 0;
        this.game.add
            .tween(filter)
            .to(
                {
                    b: 1,
                    outer_strength: 2,
                },
                1500,
                Phaser.Easing.Linear.None,
                true
            )
            .onComplete.addOnce(() => {
                this.game.add.tween(filter).to(
                    {
                        outer_strength: 1,
                    },
                    1500,
                    Phaser.Easing.Linear.None,
                    true
                );
            });

        this.data.audio.play_se("misc/power");
        promised_wait(this.game, 500, () => this.data.hero.blink(2, 50));
        promised_wait(this.game, 1500, () => {
            this.data.audio.play_se("psynergy/7");
            this.data.hero.blink(2, 50);
        });
        promised_wait(this.game, 2500, () => this.data.hero.blink(2, 50));

        this.data.particle_wrapper.start_particles(
            [
                {
                    data: {
                        energy: {
                            red: 255,
                            green: 255,
                            blue: 230,
                            lifespan: 1200,
                            alpha: {
                                value: 0.75,
                                control: [
                                    {x: 0, y: 1},
                                    {x: 0.3, y: 0.75},
                                    {x: 0.5, y: 1},
                                    {x: 0.7, y: 0.65},
                                    {x: 0.9, y: 1},
                                    {x: 1.0, y: 0},
                                ],
                            },
                            velocity: {
                                initial: {min: 0.2, max: 0.6},
                                radial: {arcStart: -45, arcEnd: 45},
                                control: [
                                    {x: 0, y: 1},
                                    {x: 1, y: 0.25},
                                ],
                            },
                        },
                    },
                    zones: {
                        circle_zone: {
                            type: zone_types.CIRCLE,
                            radius: 15,
                        },
                    },
                    emitters: [
                        {
                            x: this.data.hero.sprite.centerX,
                            y: this.data.hero.sprite.centerY,
                            shift_y: 5,
                            render_type: "pixel",
                            zone_key: "circle_zone",
                            resize_renderer: false,
                            show_trails: false,
                            trails_clear_factor: 0.2,
                            pixel_size: 6,
                            pixel_reducing_factor: 0.14,
                            pixel_is_rect: false,
                            total: 1,
                            frequency: 90,
                            repeat: 30,
                            emitter_data_key: "energy",
                            tween_emitter: {
                                y: -15,
                                incremental: true,
                                duration: 3000,
                            },
                        },
                    ],
                    emission_finish: 3000,
                },
            ],
            this.data.middlelayer_group
        );

        const tween_up = this.game.add
            .tween(this.data.hero.body)
            .to({y: this.data.hero.body.y - 15}, 3000, Phaser.Easing.Linear.None, true);
        let resolve_calback;
        const tween_up_finish_promise = new Promise(resolve => (resolve_calback = resolve));
        tween_up.onComplete.addOnce(resolve_calback);
        await tween_up_finish_promise;

        this.data.audio.play_se("misc/psynergy_stone_shatter");
        await promised_wait(this.game, 500);
        this.data.hero.play(base_actions.IDLE);

        const tween_down = this.game.add
            .tween(this.data.hero.body)
            .to({y: this.data.hero.body.y + 15}, 100, Phaser.Easing.Linear.None, true);
        const tween_down_finish_promise = new Promise(resolve => (resolve_calback = resolve));
        tween_down.onComplete.addOnce(resolve_calback);
        await tween_down_finish_promise;

        this.data.hero.sprite.filters = this.data.hero.sprite.filters.filter(f => f != filter);
        if (!this.data.hero.sprite.filters.length) {
            this.data.hero.sprite.filters = undefined;
        }
        filter.destroy();

        if (this.show_learn_msg) {
            this.data.audio.pause_bgm();
            this.data.audio.play_se("misc/party_join", () => {
                this.data.audio.resume_bgm();
            });
            const dialog_manager = new DialogManager(this.game, this.data);
            const text = `${char_name} learned ${ability_name}!`;
            await dialog_manager.quick_dialog(text);
        }

        await this.finish(previous_direction, previous_force_idle_action_in_event, prev_collision_state);
    }

    async finish(previous_direction, previous_force_idle_action_in_event, prev_collision_state) {
        if (this.reset_direction) {
            await this.data.hero.face_direction(previous_direction);
        }
        this.data.hero.force_idle_action_in_event = previous_force_idle_action_in_event;
        this.data.hero.toggle_collision(prev_collision_state);
        --this.data.game_event_manager.events_running_count;
        this.finish_events.forEach(event => event.fire(this.origin_npc));
    }

    _destroy() {}
}
