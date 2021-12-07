import {FieldAbilities} from "./FieldAbilities";
import {base_actions, directions, promised_wait} from "../utils";
import * as numbers from "../magic_numbers";

export class RetreatFieldPsynergy extends FieldAbilities {
    private static readonly ABILITY_KEY_NAME = "retreat";
    private static readonly ACTION_KEY_NAME = base_actions.CAST;
    private static readonly RISE_TIME = 1500;
    private static readonly EMITTER_DATA_NAME = "retreat_particles";
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

        this.start_particles_emitter();

        this.game.add.tween(this.controllable_char.body).to({
            y: this.controllable_char.y - (numbers.GAME_HEIGHT >> 1)
        }, RetreatFieldPsynergy.RISE_TIME, Phaser.Easing.Linear.None, true);
        this.game.add.tween(this.controllable_char.sprite.scale).to({
            x: 0,
            y: 0,
        }, RetreatFieldPsynergy.RISE_TIME, Phaser.Easing.Linear.None, true);

        // this.finish();
    }

    start_particles_emitter() {
        const out_data = {
            image: "psynergy_ball",
            alpha: 0.9,
            lifespan: 500,
            hsv: { min: 0, max: 359 },
            frame: "ball/03",
            scale: { min: 0.4, max: 0.5 },
            velocity: {
                initial: {min: 4, max: 6},
                radial: {arcStart: -18, arcEnd: 18},
            },
        };
        this.data.particle_manager.addData(RetreatFieldPsynergy.EMITTER_DATA_NAME, out_data);
        const out_emitter = this.data.particle_manager.createEmitter(Phaser.ParticleStorm.SPRITE);
        out_emitter.addToWorld();
        out_emitter.emit(RetreatFieldPsynergy.EMITTER_DATA_NAME, this.controllable_char.x, this.controllable_char.y, {
            total: 3,
            repeat: 23,
            frequency: 60,
            random: true,
        });
    }

    finish() {
        
        
    }
}
