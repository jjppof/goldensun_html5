import {FieldAbilities} from "./FieldAbilities";
import {base_actions, directions, promised_wait} from "../utils";
import {Hero} from "../Hero";
import {DialogManager} from "../utils/DialogManager";
import {Button} from "../XGamepad";

export class AvoidFieldPsynergy extends FieldAbilities {
    private static readonly ABILITY_KEY_NAME = "avoid";
    private static readonly ACTION_KEY_NAME = base_actions.CAST;

    private enable_update: boolean;

    constructor(game, data) {
        super(game, data, AvoidFieldPsynergy.ABILITY_KEY_NAME, AvoidFieldPsynergy.ACTION_KEY_NAME, false, false);
        this.set_bootstrap_method(this.init.bind(this));
        this.enable_update = false;
    }

    update() {
        if (this.enable_update) {
            this.controllable_char.update_on_event();
        }
    }
    async init() {
        this.close_field_psynergy_window();

        await this.stop_casting(false);

        const previous_direction = this.cast_direction;

        this.controllable_char.change_action(base_actions.CAST, false);
        const frame_index =
            this.controllable_char.sprite_info.getFrameNumber(
                base_actions.CAST,
                this.controllable_char.current_animation
            ) - 1;
        this.controllable_char.set_rotation(true, 40, frame_index);
        this.enable_update = true;
        this.controllable_char.blink(8, 125);

        const aura_duration = 2000;
        this.data.audio.play_se("psynergy/18");
        await this.aura(aura_duration);
        await promised_wait(this.game, aura_duration);
        this.data.audio.play_se("menu/positive_3");

        this.enable_update = false;
        this.controllable_char.set_rotation(false);

        await this.controllable_char.face_direction(previous_direction);

        await this.controllable_char.blink(15, 30, {outline_blink: true});

        const dialog = new DialogManager(this.game, this.data);
        let controls_enabled = false;
        const control_key = this.data.control_manager.add_controls(
            [
                {
                    buttons: Button.A,
                    on_down: () => {
                        if (controls_enabled) {
                            dialog.kill_dialog(
                                () => {
                                    this.data.control_manager.detach_bindings(control_key);
                                    this.finish();
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
        dialog.next_dialog("Monsters won't attack so often now.", () => (controls_enabled = true));
    }

    async aura(total_time: number) {
        const auras_count = 25;
        const fall_time = 500;
        const delta_time = (total_time / auras_count) | 0;
        const start_x = this.controllable_char.x;
        const start_y = this.controllable_char.y - (this.controllable_char.height << 1) + 10;
        const end_x = start_x;
        let end_y = this.controllable_char.y + 10;
        const hue_filter = this.game.add.filter("Hue") as Phaser.Filter.Hue;
        hue_filter.angle = Phaser.Math.degToRad(242);
        for (let i = 0; i < auras_count; ++i) {
            const start_delay = delta_time * i;
            for (let j = 0; j < 2; ++j) {
                const y_delta = +(j === 0);
                const aura = this.data.overlayer_group.create(start_x, start_y + y_delta, "psynergy_aura");
                aura.filters = [hue_filter];
                aura.scale.setTo(0, 0);
                aura.anchor.setTo(0.5, 0);
                this.game.add
                    .tween(aura)
                    .to(
                        {
                            x: end_x,
                            y: end_y + y_delta,
                        },
                        fall_time,
                        Phaser.Easing.Linear.None,
                        true,
                        start_delay
                    )
                    .onComplete.addOnce(() => {
                        aura.destroy();
                    });
                const scale = j > 0 ? 1 : -1;
                this.game.add.tween(aura.scale).to(
                    {
                        x: scale,
                        y: scale,
                    },
                    fall_time >> 1,
                    Phaser.Easing.Linear.None,
                    true,
                    start_delay
                );
            }
        }
    }

    async finish() {
        await this.return_to_idle_anim();
        (this.controllable_char as Hero).avoid_encounter = true;
        this.controllable_char.casting_psynergy = false;
    }
}
