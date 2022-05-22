import {GameEvent, event_types} from "./GameEvent";
import {DialogManager} from "../utils/DialogManager";
import {Summon} from "../Summon";
import {FieldAbilities} from "../field_abilities/FieldAbilities";
import {Button} from "../XGamepad";
import * as _ from "lodash";
import {base_actions, directions, element_colors, element_names, ordered_elements, range_360} from "../utils";
import {degree90} from "../magic_numbers";
import * as numbers from "../magic_numbers";

export class SummonEvent extends GameEvent {
    private static readonly ACTION = "summon";
    private static readonly PARTICLES_NUMBER = 60;
    private static readonly LETTERS_NUMBER = 48;
    private static readonly LETTER_INIT_X = 27;
    private static readonly LETTER_INIT_Y = 26;
    private static readonly LETTER_PADDING_X = 12;
    private static readonly LETTER_PADDING_Y = 24;
    private summon: Summon;
    private control_enable: boolean;
    private animate: boolean;
    private dialog: DialogManager;
    private emitter: Phaser.Particles.Arcade.Emitter;
    private letters: Phaser.Sprite[];
    private finish_events: GameEvent[];
    private control_key: number;

    constructor(game, data, active, key_name, summon_key, animate, finish_events) {
        super(game, data, event_types.SUMMON, active, key_name);
        this.summon = this.data.info.summons_list[summon_key];
        this.control_enable = false;
        this.dialog = null;
        this.control_key = null;
        this.animate = animate ?? true;

        this.finish_events = [];
        finish_events?.forEach(event_info => {
            const event = this.data.game_event_manager.get_event_instance(event_info);
            this.finish_events.push(event);
        });
    }

    config_emitter() {
        this.emitter = this.game.add.emitter(
            this.origin_npc.sprite.centerX,
            this.origin_npc.sprite.centerY,
            SummonEvent.PARTICLES_NUMBER
        );
        const sprite_key = this.origin_npc.sprite_info.getSpriteKey(SummonEvent.ACTION);
        this.emitter.makeParticles(sprite_key);
        this.emitter.minParticleSpeed.setTo(-180, -100);
        this.emitter.maxParticleSpeed.setTo(180, -250);
        this.emitter.gravity = 450;
        this.emitter.width = this.emitter.height = 8;
        const anim_key = this.origin_npc.sprite_info.getAnimationKey(SummonEvent.ACTION, "particles");
        this.emitter.forEach((particle: Phaser.Sprite) => {
            this.origin_npc.sprite_info.setAnimation(particle, SummonEvent.ACTION);
            particle.onEmit = () => {
                particle.animations.play(anim_key);
                particle.animations.currentAnim.killOnComplete = true;
            };
        });
    }

    config_letters() {
        this.letters = new Array(SummonEvent.LETTERS_NUMBER);
        const sprite_key = this.origin_npc.sprite_info.getSpriteKey(SummonEvent.ACTION);
        for (let i = 0; i < SummonEvent.PARTICLES_NUMBER; ++i) {
            const frame_index = _.random(0, 15);
            const frame = this.origin_npc.sprite_info.getFrameName(SummonEvent.ACTION, "letters", frame_index);
            const letter = this.game.add.sprite(
                this.origin_npc.sprite.centerX - 4,
                this.origin_npc.sprite.centerY,
                sprite_key,
                frame
            );
            letter.visible = false;
            this.letters[i] = letter;
        }
    }

    finish() {
        this.summon.available = true;
        this.control_enable = false;
        this.data.control_manager.detach_bindings(this.control_key);
        this.control_enable = null;
        this.data.game_event_manager.force_idle_action = true;
        this.data.hero.play(base_actions.IDLE);
        this.emitter?.destroy();
        this.dialog?.destroy();
        this.emitter = null;
        this.dialog = null;
        this.letters = null;
        --this.data.game_event_manager.events_running_count;
        this.finish_events.forEach(event => event.fire(this.origin_npc));
    }

    async _fire() {
        if (!this.animate) {
            this.summon.available = true;
            return;
        }
        ++this.data.game_event_manager.events_running_count;
        this.control_enable = false;
        let aux_resolve;
        this.control_key = this.data.control_manager.add_controls(
            [
                {
                    buttons: Button.A,
                    on_down: () => {
                        if (this.control_enable) {
                            this.control_enable = false;
                            this.dialog.kill_dialog(aux_resolve, false, true);
                        }
                    },
                },
            ],
            {persist: true}
        );

        const x0 = this.game.camera.x;
        const y0 = this.game.camera.y;

        this.config_emitter();
        this.config_letters();

        const hero_name = this.data.info.main_char_list[this.data.hero.key_name].name;
        this.dialog = new DialogManager(this.game, this.data);
        let aux_promise = new Promise(resolve => (aux_resolve = resolve));
        this.dialog.next_dialog(
            `${hero_name} examined the stone tablet...`,
            () => {
                this.control_enable = true;
            },
            {show_crystal: true}
        );

        await aux_promise;
        const reset_map = FieldAbilities.tint_map_layers(this.game, this.data.map);
        this.origin_npc.play(SummonEvent.ACTION, "stone_continuos");
        aux_promise = new Promise(resolve => (aux_resolve = resolve));
        this.game.time.events.add(1000, () => {
            this.origin_npc.play(SummonEvent.ACTION, "stone_shining");
            aux_resolve();
        });

        await aux_promise;
        aux_promise = new Promise(resolve => (aux_resolve = resolve));
        this.game.time.events.add(1000, () => {
            this.emitter.flow(1000, 20, 2, SummonEvent.PARTICLES_NUMBER);
            aux_resolve();
        });

        await aux_promise;
        const min_time = 300;
        const max_time = 500;
        for (let i = 0; i < 3; ++i) {
            aux_promise = new Promise(resolve => (aux_resolve = resolve));
            for (let j = 0; j < 16; ++j) {
                const dest_x = x0 + SummonEvent.LETTER_INIT_X + SummonEvent.LETTER_PADDING_X * j;
                const dest_y = y0 + SummonEvent.LETTER_INIT_Y + SummonEvent.LETTER_PADDING_Y * i;
                const letter = this.letters[16 * i + j];
                letter.visible = true;
                const angle = range_360(Math.atan2(dest_y - letter.y, dest_x - letter.x)) % Math.PI;
                const time = (max_time - min_time) * (angle / degree90) + min_time;
                this.game.add.tween(letter).to(
                    {
                        x: dest_x,
                        y: dest_y,
                    },
                    time,
                    Phaser.Easing.Quadratic.InOut,
                    true
                );
            }
            this.game.time.events.add(500, aux_resolve);
            await aux_promise;
        }

        this.origin_npc.toggle_active(false);

        let counter = 0;
        aux_promise = new Promise(resolve => (aux_resolve = resolve));
        const normal_color = 0xffffff;
        const blue_color = 0x0000ff;
        const sequence = 0b1100110000111;
        const letter_shine_update_callback = () => {
            if (counter === 32) {
                aux_resolve();
                return;
            }
            for (let i = 0; i < 3; ++i) {
                const this_seq = sequence & ((2 << counter) - 1);
                for (let j = 0; j < 16; ++j) {
                    const index = counter - j - i;
                    let mask = 0;
                    if (index === 0) {
                        mask = 1;
                    } else if (index > 0) {
                        mask = 2 << (index - 1);
                    }
                    const seq_pos = this_seq & mask;
                    const letter = this.letters[16 * i + j];
                    letter.tint = seq_pos ? blue_color : normal_color;
                }
            }
            ++counter;
        };
        this.data.game_event_manager.add_callback(letter_shine_update_callback);

        await aux_promise;
        this.data.game_event_manager.remove_callback(letter_shine_update_callback);

        await this.data.hero.face_direction(directions.down);
        this.data.game_event_manager.force_idle_action = false;
        this.data.hero.play(base_actions.GRANT);

        const total_phi = (Math.PI * 17) / 2;
        const total_time = 4000;
        const speed_factor = (total_phi * 1000) / this.game.time.fps / total_time;
        aux_promise = new Promise(resolve => (aux_resolve = resolve));
        let ref_phi = 0;
        const PI = Math.PI;
        const delta = 0.1;
        const half_width = numbers.GAME_WIDTH >> 1;
        const half_height = numbers.GAME_HEIGHT >> 1;
        const time_to_join_track = 700;
        const time_to_all_be_in_track = 2000;
        const delta_time_to_be_in_track = time_to_all_be_in_track / SummonEvent.LETTERS_NUMBER;
        const join_timers = new Array(SummonEvent.LETTERS_NUMBER).fill(time_to_join_track);
        const ref_time = this.game.time.now;
        const letter_spiral_update_callback = () => {
            for (let i = 0; i < SummonEvent.LETTERS_NUMBER; ++i) {
                const now = this.game.time.now - ref_time;
                if (now < i * delta_time_to_be_in_track) {
                    continue;
                }
                const letter = this.letters[i];
                const phi = -delta * i + ref_phi;
                let new_x, new_y;
                if (phi < PI) {
                    new_x = -Math.cos(phi);
                    new_y = Math.sin(phi);
                } else if (phi >= PI && phi < 2 * PI) {
                    new_x = (-2 * Math.cos(phi)) / 3 + 1 / 3;
                    new_y = (2 * Math.sin(phi)) / 3;
                } else if (phi >= 2 * PI && phi < (5 * PI) / 2) {
                    new_x = (-4 * Math.cos(phi)) / 3 + 1;
                    new_y = 2 * Math.sin(phi);
                } else if (phi >= (5 * PI) / 2 && phi < (11 * PI) / 2) {
                    new_x = -Math.cos(phi) + 1;
                    new_y = Math.sin(phi) + 1;
                } else if (phi >= (11 * PI) / 2 && phi < (13 * PI) / 2) {
                    new_x = -Math.cos(phi) / 2 + 1;
                    new_y = Math.sin(phi) / 2 + 0.5;
                } else if (phi >= (13 * PI) / 2 && phi < (17 * PI) / 2) {
                    const _phi = phi - (12 * PI) / 2;
                    new_x = -1.8 * Math.exp(-0.4 * _phi) * Math.cos(_phi) + 1;
                    new_y = 2.4 * Math.exp(-0.4 * _phi) * Math.sin(_phi) - 0.1 - Math.pow(6, -1.52 * (-0.95 + _phi));
                } else if (phi > total_phi) {
                    if (letter.parent) {
                        letter.destroy();
                    }
                    if (i === SummonEvent.LETTERS_NUMBER - 1) {
                        aux_resolve();
                    }
                    continue;
                }
                new_x += 0.5;
                new_y += 1.5;
                new_x = new_x / 3;
                new_y = new_y / 3;
                new_y = 1 - new_y;
                new_x = numbers.GAME_WIDTH * new_x + this.data.hero.sprite.centerX - half_width - 4;
                new_y = numbers.GAME_HEIGHT * new_y + this.data.hero.sprite.centerY - half_height - 10;
                const join_factor = join_timers[i] / time_to_join_track;
                letter.x = letter.x * join_factor + (1 - join_factor) * new_x;
                letter.y = letter.y * join_factor + (1 - join_factor) * new_y;
                if (join_timers[i] > 0) {
                    join_timers[i] -= this.game.time.elapsedMS;
                } else {
                    join_timers[i] = 0;
                }
            }
            ref_phi += speed_factor;
        };
        this.data.game_event_manager.add_callback(letter_spiral_update_callback);
        this.game.time.events.add(4000, () => {
            this.data.hero.shake();
        });

        await aux_promise;
        this.data.game_event_manager.remove_callback(letter_spiral_update_callback);

        reset_map();
        const summon_name = this.data.info.abilities_list[this.summon.key_name].name;
        aux_promise = new Promise(resolve => (aux_resolve = resolve));
        this.dialog.next_dialog(
            `${hero_name} can now summon ${summon_name}!`,
            () => {
                this.control_enable = true;
            },
            {show_crystal: true}
        );

        await aux_promise;

        aux_promise = new Promise(resolve => (aux_resolve = resolve));
        const requirements = [];
        ordered_elements.forEach(element => {
            const requirement = this.summon.requirements[element];
            if (requirement) {
                requirements.push(
                    `\${COLOR:${element_colors[element].toString(16)}}${requirement} ${
                        element_names[element]
                    }\${COLOR:/}`
                );
            }
        });
        this.dialog.next_dialog(
            `To summon ${summon_name}\${BREAK_LINE}${requirements.join(" ")}\${BREAK_LINE}Standby Djinn are needed.`,
            () => {
                this.control_enable = true;
            },
            {show_crystal: false}
        );

        await aux_promise;
        this.finish();
    }

    _destroy() {
        this.finish_events.forEach(event => event.destroy());
        this.dialog?.destroy();
        this.emitter?.destroy();
        this.letters = null;
        this.summon = null;
        if (this.control_enable !== null) {
            this.data.control_manager.detach_bindings(this.control_key);
            this.control_enable = null;
        }
    }
}
