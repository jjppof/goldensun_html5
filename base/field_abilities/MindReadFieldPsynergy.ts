import {FieldAbilities} from "./FieldAbilities";
import {base_actions} from "../utils";
import { NPC } from "../NPC";

export class MindReadFieldPsynergy extends FieldAbilities {
    private static readonly ABILITY_KEY_NAME = "mind_read";
    private static readonly ACTION_KEY_NAME = base_actions.CAST;
    private static readonly MIND_READ_RANGE = 12;

    protected target_object: NPC;

    constructor(game, data) {
        super(
            game,
            data,
            MindReadFieldPsynergy.ABILITY_KEY_NAME,
            MindReadFieldPsynergy.ACTION_KEY_NAME,
            true,
            true,
            MindReadFieldPsynergy.MIND_READ_RANGE,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            true
        );
        this.set_bootstrap_method(this.init.bind(this));
    }

    update() {

    }

    async init() {
        this.field_psynergy_window.close();
    }
}
