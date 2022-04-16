import {FieldAbilities} from "./FieldAbilities";
import {base_actions, directions, get_centered_pos_in_px, promised_wait} from "../utils";
import * as numbers from "../magic_numbers";
import {DialogManager} from "../utils/DialogManager";
import {Button} from "../XGamepad";
import * as _ from "lodash";

export class RetreatFieldPsynergy extends FieldAbilities {
    private static readonly ABILITY_KEY_NAME = "retreat";
    private static readonly ACTION_KEY_NAME = base_actions.CAST;
    private static readonly RISE_TIME = 1500;
    private static readonly EMITTER_DATA_NAME = "retreat_particles";
    private enable_update: boolean;

    constructor(game, data) {
        super(
            game,
            data,
            RetreatFieldPsynergy.ABILITY_KEY_NAME,
            RetreatFieldPsynergy.ACTION_KEY_NAME,
            false,
            false,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            true
        );
        this.set_bootstrap_method(this.init.bind(this));
        this.set_extra_cast_check(this.check_if_can_retreat.bind(this));
        this.enable_update = false;
    }

    update() {
        if (this.enable_update) {
            this.controllable_char.update_on_event();
        }
    }

    check_if_can_retreat() {
        if (this.data.map.get_retreat_data()) {
            return true;
        }
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
                            dialog.next_dialog(`It doesn't work here.`, () => {
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
        const ability_name = this.data.info.abilities_list[RetreatFieldPsynergy.ABILITY_KEY_NAME].name;
        dialog.next_dialog(
            `${ability_name}...`,
            () => {
                next = true;
            },
            {show_crystal: true}
        );
        return false;
    }

    async init() {
        this.field_psynergy_window.close();

        await this.controllable_char.face_direction(directions.down);
        this.controllable_char.play(base_actions.GRANT);

        await promised_wait(this.game, Phaser.Timer.HALF);

        this.return_to_idle_anim();
        this.controllable_char.set_rotation(true);
        this.enable_update = true;
        await this.stop_casting(false);

        await promised_wait(this.game, Phaser.Timer.HALF);

        if (this.controllable_char.shadow) {
            this.controllable_char.shadow.visible = false;
        }
        this.data.camera.unfollow();
        this.controllable_char.toggle_collision(false);

        const emitter = this.start_particles_emitter();

        let tween_pos_resolve;
        const promise_tween_pos = new Promise(resolve => (tween_pos_resolve = resolve));
        this.game.add
            .tween(this.controllable_char.body)
            .to(
                {
                    y: this.controllable_char.y - (numbers.GAME_HEIGHT >> 1),
                },
                RetreatFieldPsynergy.RISE_TIME,
                Phaser.Easing.Linear.None,
                true
            )
            .onComplete.addOnce(tween_pos_resolve);

        let tween_scale_resolve;
        const promise_tween_scale = new Promise(resolve => (tween_scale_resolve = resolve));
        this.game.add
            .tween(this.controllable_char.sprite.scale)
            .to(
                {
                    x: 0,
                    y: 0,
                },
                RetreatFieldPsynergy.RISE_TIME,
                Phaser.Easing.Linear.None,
                true
            )
            .onComplete.addOnce(tween_scale_resolve);

        await Promise.all([promise_tween_pos, promise_tween_scale]);

        this.data.particle_manager.removeEmitter(emitter);
        emitter.destroy();
        this.data.particle_manager.clearData(RetreatFieldPsynergy.EMITTER_DATA_NAME);

        this.game.camera.fade(undefined, undefined, true);
        this.game.camera.onFadeComplete.addOnce(this.move_char.bind(this));
    }

    start_particles_emitter() {
        const out_data = {
            image: "psynergy_ball",
            alpha: 0.9,
            lifespan: 500,
            frame: "ball/03",
            scale: {min: 0.4, max: 0.7},
            velocity: {
                initial: {min: 3, max: 5},
                radial: {arcStart: -18, arcEnd: 18},
            },
        };
        this.data.particle_manager.addData(RetreatFieldPsynergy.EMITTER_DATA_NAME, out_data);
        const emitter = this.data.particle_manager.createEmitter(Phaser.ParticleStorm.SPRITE);
        emitter.addToWorld();
        emitter.emit(
            RetreatFieldPsynergy.EMITTER_DATA_NAME,
            () => this.controllable_char.x,
            () => this.controllable_char.y + 5,
            {
                total: 3,
                repeat: 23,
                frequency: 60,
                random: true,
            }
        );
        emitter.onEmit = new Phaser.Signal();
        emitter.onEmit.add((emitter: Phaser.ParticleStorm.Emitter, particle: Phaser.ParticleStorm.Particle) => {
            particle.sprite.tint = _.sample([16776470, 190960, 16777215, 5700990]);
        });
        return emitter;
    }

    async move_char() {
        this.enable_update = false;
        this.controllable_char.set_rotation(false);
        const retreat_info = this.data.map.get_retreat_data();
        this.data.map.set_map_bounds(retreat_info.x, retreat_info.y);
        this.data.collision.change_map_body(retreat_info.collision_layer);
        this.controllable_char.body.x = get_centered_pos_in_px(retreat_info.x, this.data.map.tile_width);
        this.controllable_char.body.y = get_centered_pos_in_px(retreat_info.y, this.data.map.tile_height);
        this.controllable_char.set_direction(retreat_info.direction, true);
        this.controllable_char.reset_scale();
        this.controllable_char.update_shadow();
        this.controllable_char.update_tile_position();
        if (this.controllable_char.shadow) {
            this.controllable_char.shadow.visible = true;
        }
        this.controllable_char.toggle_collision(true);
        this.data.camera.follow(this.controllable_char);
        this.game.camera.flash(0x0, undefined, true);
        this.game.camera.onFlashComplete.addOnce(() => {
            this.controllable_char.casting_psynergy = false;
        });
    }
}
