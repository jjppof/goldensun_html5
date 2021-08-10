import {FieldAbilities} from "./FieldAbilities";

export class LashFieldPsynergy extends FieldAbilities {
    private static readonly ABILITY_KEY_NAME = "lash";
    private static readonly ACTION_KEY_NAME = "cast";
    private static readonly LASH_MAX_RANGE = 12;

    constructor(game, data) {
        super(
            game,
            data,
            LashFieldPsynergy.ABILITY_KEY_NAME,
            LashFieldPsynergy.ACTION_KEY_NAME,
            true,
            true,
            LashFieldPsynergy.LASH_MAX_RANGE
        );
        this.set_bootstrap_method(this.init_hand.bind(this));
    }

    update() {}

    init_hand() {

    }
}
