import {GameEvent, event_types} from "./GameEvent";
import {NPC} from "../NPC";
import {DialogManager} from "../utils/DialogManager";
import {Summon} from "../Summon";
import {FieldAbilities} from "../field_abilities/FieldAbilities";
import {Button} from "../XGamepad";
import * as _ from "lodash";
import {base_actions, directions, range_360} from "../utils";
import {degree90} from "../magic_numbers";

export class SummonEvent extends GameEvent {
    private static readonly ACTION = "summon";
    private static readonly PARTICLES_NUMBER = 60;
    private static readonly LETTERS_NUMBER = 48;
    private static readonly LETTER_INIT_X = 27;
    private static readonly LETTER_INIT_Y = 26;
    private static readonly LETTER_PADDING_X = 12;
    private static readonly LETTER_PADDING_Y = 24;
    private summon: Summon;
    private aux_promise: Promise<void>;
    private aux_resolve: () => void;
    private control_enable: boolean = false;
    private running: boolean = false;
    private dialog: DialogManager;
    private emitter: Phaser.Particles.Arcade.Emitter;
    private letters: Phaser.Sprite[];
    private finish_events: GameEvent[] = [];

    constructor(game, data, active, summon_key, finish_events) {
        super(game, data, event_types.SUMMON, active);
        this.summon = this.data.info.summons_list[summon_key];

        this.data.control_manager.add_controls(
            [
                {
                    button: Button.A,
                    on_down: () => {
                        if (!this.active || !this.running || !this.control_enable) return;
                        this.control_enable = false;
                        this.dialog.kill_dialog(this.aux_resolve, false, true);
                    },
                },
            ],
            {persist: true}
        );

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

    finish(reset_map) {
        reset_map();
        this.summon.available = true;
        this.running = false;
        this.control_enable = false;
        this.data.game_event_manager.force_idle_action = true;
        this.emitter.destroy();
        this.letters.forEach(letter => letter.destroy());
        --this.data.game_event_manager.events_running_count;
        this.finish_events.forEach(event => event.fire(this.origin_npc));
    }

    async _fire(oringin_npc: NPC) {
        if (!this.active) return;
        ++this.data.game_event_manager.events_running_count;
        this.origin_npc = oringin_npc;
        this.running = true;
        this.control_enable = false;

        const x0 = this.game.camera.x;
        const y0 = this.game.camera.y;

        this.config_emitter();
        this.config_letters();

        const hero_name = this.data.info.main_char_list[this.data.hero.key_name].name;
        this.dialog = new DialogManager(this.game, this.data);
        this.aux_promise = new Promise(resolve => (this.aux_resolve = resolve));
        this.dialog.quick_next(
            `${hero_name} examined the stone tablet...`,
            () => {
                this.control_enable = true;
            },
            {show_crystal: true}
        );

        await this.aux_promise;
        const reset_map = FieldAbilities.tint_map_layers(this.game, this.data.map);
        this.origin_npc.play(SummonEvent.ACTION, "stone_continuos");
        this.aux_promise = new Promise(resolve => (this.aux_resolve = resolve));
        this.game.time.events.add(1000, () => {
            this.origin_npc.play(SummonEvent.ACTION, "stone_shining");
            this.aux_resolve();
        });

        await this.aux_promise;
        this.aux_promise = new Promise(resolve => (this.aux_resolve = resolve));
        this.game.time.events.add(1000, () => {
            this.emitter.flow(1000, 20, 2, SummonEvent.PARTICLES_NUMBER);
            this.aux_resolve();
        });

        await this.aux_promise;
        const min_time = 300;
        const max_time = 500;
        for (let i = 0; i < 3; ++i) {
            this.aux_promise = new Promise(resolve => (this.aux_resolve = resolve));
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
            this.game.time.events.add(500, this.aux_resolve);
            await this.aux_promise;
        }

        this.origin_npc.toggle_active(false);

        let counter = 0;
        this.aux_promise = new Promise(resolve => (this.aux_resolve = resolve));
        const normal_color = 0xffffff;
        const blue_color = 0x0000ff;
        const sequence = 0b1100110000111;
        const update_callback = () => {
            if (counter === 32) {
                this.aux_resolve();
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
        this.data.game_event_manager.add_callback(update_callback);

        await this.aux_promise;
        this.data.game_event_manager.remove_callback(update_callback);

        await this.data.hero.face_direction(directions.down);
        this.data.game_event_manager.force_idle_action = false;
        this.data.hero.play(base_actions.GRANT);

        this.finish(reset_map);
    }
}
