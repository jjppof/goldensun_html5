import {FieldAbilities} from "./FieldAbilities";
import {base_actions, directions, promised_wait} from "../utils";
import * as numbers from "../magic_numbers";

export class RetreatFieldPsynergy extends FieldAbilities {
    private static readonly ABILITY_KEY_NAME = "retreat";
    private static readonly ACTION_KEY_NAME = base_actions.CAST;
    private static readonly RISE_TIME = 1500;
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

        this.unset_hero_cast_anim();
        this.controllable_char.set_rotation(true);
        this.enable_update = true;
        await this.stop_casting();

        await promised_wait(this.game, Phaser.Timer.HALF);

        if (this.controllable_char.shadow) {
            this.controllable_char.shadow.visible = false;
        }
        this.data.camera.unfollow();
        this.game.physics.p2.pause();

        this.game.add.tween(this.controllable_char.body).to({
            y: this.controllable_char.y - (numbers.GAME_HEIGHT >> 1)
        }, RetreatFieldPsynergy.RISE_TIME, Phaser.Easing.Linear.None, true);
        this.game.add.tween(this.controllable_char.sprite.scale).to({
            x: 0,
            y: 0,
        }, RetreatFieldPsynergy.RISE_TIME, Phaser.Easing.Linear.None, true);

        // this.finish();
    }

    finish() {
        
        
    }
}
