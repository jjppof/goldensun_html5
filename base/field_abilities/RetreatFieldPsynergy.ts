import {FieldAbilities} from "./FieldAbilities";
import {base_actions, directions, promised_wait} from "../utils";

export class RetreatFieldPsynergy extends FieldAbilities {
    private static readonly ABILITY_KEY_NAME = "retreat";
    private static readonly ACTION_KEY_NAME = base_actions.CAST;
    private enable_update: boolean;

    constructor(game, data) {
        super(game, data, RetreatFieldPsynergy.ABILITY_KEY_NAME, RetreatFieldPsynergy.ACTION_KEY_NAME, false, false, undefined, undefined, undefined, undefined, undefined, true);
        this.set_bootstrap_method(this.init.bind(this));
        this.enable_update = false;
    }

    update() {
        if (this.enable_update) {
            this.controllable_char.update_on_event();
        }
    }

    async init() {
        this.field_psynergy_window.close();

        await this.controllable_char.face_direction(directions.down);
        this.controllable_char.play(base_actions.GRANT);

        await promised_wait(this.game, Phaser.Timer.HALF);

        this.controllable_char.play(base_actions.IDLE);
        this.controllable_char.set_rotation(true);
        this.enable_update = true;

        // this.finish();
    }

    finish() {
        this.unset_hero_cast_anim();
        this.stop_casting();
    }
}
