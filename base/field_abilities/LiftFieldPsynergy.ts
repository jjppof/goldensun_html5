import {FieldAbilities} from "./FieldAbilities";
import {base_actions} from "../utils";
import {InteractableObjects} from "../interactable_objects/InteractableObjects";

export class LiftFieldPsynergy extends FieldAbilities {
    private static readonly ABILITY_KEY_NAME = "lift";
    private static readonly ACTION_KEY_NAME = base_actions.CAST;
    private static readonly LIFT_MAX_RANGE = 12;

    protected target_object: InteractableObjects;

    constructor(game, data) {
        super(
            game,
            data,
            LiftFieldPsynergy.ABILITY_KEY_NAME,
            LiftFieldPsynergy.ACTION_KEY_NAME,
            true,
            true,
            LiftFieldPsynergy.LIFT_MAX_RANGE
        );
        this.set_bootstrap_method(this.init.bind(this));
    }

    init() {
        this.field_psynergy_window.close();
        this.finish();
    }

    update() {}

    finish() {
        this.unset_hero_cast_anim();
        this.stop_casting();
    }
}
