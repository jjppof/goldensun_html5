import {FieldAbilities} from "./FieldAbilities";
import {base_actions} from "../utils";
import { NPC } from "../NPC";
import { Button } from "../XGamepad";
import { interaction_patterns } from "../game_events/GameEventManager";
import { DialogManager } from "../utils/DialogManager";

export class MindReadFieldPsynergy extends FieldAbilities {
    private static readonly ABILITY_KEY_NAME = "mind_read";
    private static readonly ACTION_KEY_NAME = base_actions.CAST;
    private static readonly MIND_READ_RANGE = 14;

    private control_enable: boolean;
    private control_id: number;
    private fire_next_step: () => void;
    private dialog_manager: DialogManager;
    private cast_finish_promise: Promise<void>;

    protected target_object: NPC;

    constructor(game, data) {
        super(
            game,
            data,
            MindReadFieldPsynergy.ABILITY_KEY_NAME,
            MindReadFieldPsynergy.ACTION_KEY_NAME,
            true,
            true,
            (target: NPC) => target.talk_range ? target.talk_range - this.controllable_char.body_radius : MindReadFieldPsynergy.MIND_READ_RANGE,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            true,
            true
        );
        this.set_bootstrap_method(this.init.bind(this));
        this.control_enable = false;
    }

    set_controls() {
        this.control_id = this.data.control_manager.add_controls(
            [
                {
                    button: Button.A,
                    on_down: () => {
                        if (!this.control_enable) {
                            return;
                        }
                        this.control_enable = false;
                        this.fire_next_step();
                    },
                },
            ],
            {persist: true}
        );
    }

    async finish() {
        await this.cast_finish_promise;
        this.data.control_manager.detach_bindings(this.control_id);
        this.target_object = null;
        this.dialog_manager.destroy();
        this.reset_map();
        this.controllable_char.casting_psynergy = false;
    }

    update() {
        this.dialog_manager?.update_borders();
    }

    async init() {
        this.field_psynergy_window.close();
        this.set_controls();

        this.cast_finish_promise = this.unset_hero_cast_anim();
        this.stop_casting(false, false);

        if (
            !this.target_object ||
            this.target_object.interaction_pattern === interaction_patterns.NO_INTERACTION ||
            !this.target_object.active ||
            this.target_object.base_collision_layer !== this.data.map.collision_layer ||
            !this.target_object.thought_message
        ) {
            this.finish();
            return;
        }

        this.dialog_manager = new DialogManager(this.game, this.data, undefined, true);
        this.dialog_manager.set_dialog(this.target_object.thought_message, {
            avatar: this.target_object.avatar,
            voice_key: this.target_object.voice_key,
            hero_direction: this.controllable_char.current_direction,
        });
        this.fire_next_step = this.dialog_manager.next.bind(this.dialog_manager, async (finished: boolean) => {
            if (finished) {
                this.fire_next_step = null;
                this.finish();
            } else {
                this.control_enable = true;
            }
        });
        this.fire_next_step();
    }
}
