import * as numbers from "../magic_numbers";
import {get_surroundings, directions, base_actions} from "../utils";
import {JumpEvent} from "../tile_events/JumpEvent";
import {FieldAbilities} from "./FieldAbilities";
import * as _ from "lodash";
import {InteractableObjects} from "../interactable_objects/InteractableObjects";

/*Handles the "Frost" field psynergy
Does not handle the in-battle command

Input:game [Phaser:Game] - Reference to the running game object
       data [GoldenSun] - Reference to the main JS Class instance*/
export class FrostFieldPsynergy extends FieldAbilities {
    public static readonly ABILITY_KEY_NAME = "frost";
    private static readonly ACTION_KEY_NAME = base_actions.CAST;
    private static readonly FROST_MAX_RANGE = 12;
    private static readonly SNOWFLAKES_COUNT = 16;
    private static readonly TOTAL_TURNS_SNOWFLAKES = Math.PI * 7;
    private static readonly POLAR_SLOPE = 0.15;
    private static readonly SPIRAL_INTENSITY = 8;
    private static readonly SNOWFLAKE_DURATION = 1650;

    protected target_object: InteractableObjects;

    constructor(game, data) {
        super(
            game,
            data,
            FrostFieldPsynergy.ABILITY_KEY_NAME,
            FrostFieldPsynergy.ACTION_KEY_NAME,
            true,
            true,
            FrostFieldPsynergy.FROST_MAX_RANGE
        );
        this.set_bootstrap_method(this.init_snowflakes.bind(this));
    }

    update() {}

    /*Begins the snowflake effects
    Upon finishing, triggers the pillar's growth*/
    init_snowflakes() {
        this.field_psynergy_window.close();
        this.data.audio.play_se("misc/ice_hitting", () => {
            this.data.audio.play_se("misc/ice_hitting");
        });
        for (let i = 0; i < FrostFieldPsynergy.SNOWFLAKES_COUNT; ++i) {
            const snowflake_sprite = this.data.overlayer_group.create(0, 0, "frost_snowflake");
            snowflake_sprite.anchor.setTo(0.5, 0.5);
            const scale_factor = _.random(5, 8) / 10.0;
            const rotation_factor = Math.random() * numbers.degree360;
            snowflake_sprite.scale.setTo(scale_factor, scale_factor);
            snowflake_sprite.rotation = rotation_factor;
            let x_dest = this.controllable_char.sprite.centerX;
            let y_dest = this.controllable_char.sprite.centerY + 12;
            switch (this.cast_direction) {
                case directions.left:
                    x_dest -= 16;
                    break;
                case directions.right:
                    x_dest += 16;
                    break;
                case directions.up:
                    y_dest -= 14;
                    break;
                case directions.down:
                    y_dest += 12;
                    break;
            }
            const spiral_angle = {rad: FrostFieldPsynergy.TOTAL_TURNS_SNOWFLAKES};
            const sign_x = Math.sign(Math.random() - 0.5);
            const sign_y = Math.sign(Math.random() - 0.5);
            const tween = this.game.add
                .tween(spiral_angle)
                .to(
                    {rad: -Math.PI},
                    FrostFieldPsynergy.SNOWFLAKE_DURATION,
                    Phaser.Easing.Linear.None,
                    true,
                    i * (Phaser.Timer.QUARTER / 5)
                );
            tween.onUpdateCallback(() => {
                snowflake_sprite.centerX =
                    sign_x *
                        FrostFieldPsynergy.SPIRAL_INTENSITY *
                        Math.exp(FrostFieldPsynergy.POLAR_SLOPE * spiral_angle.rad) *
                        Math.cos(spiral_angle.rad) +
                    x_dest;
                snowflake_sprite.centerY =
                    sign_y *
                        FrostFieldPsynergy.SPIRAL_INTENSITY *
                        Math.exp(FrostFieldPsynergy.POLAR_SLOPE * spiral_angle.rad) *
                        Math.sin(spiral_angle.rad) +
                    y_dest;
            });
            tween.onComplete.addOnce(() => {
                snowflake_sprite.destroy();
                if (i === FrostFieldPsynergy.SNOWFLAKES_COUNT - 1) {
                    if (this.target_object) {
                        this.init_pillar();
                    } else {
                        this.return_to_idle_anim();
                        this.stop_casting();
                    }
                }
            });
        }
    }

    /*Changes the pool into a pillar
    Will change its properties and animation*/
    init_pillar() {
        this.target_object.get_events().forEach((event: JumpEvent) => {
            if (event.is_active_at_direction()) {
                event.deactivate();
            } else {
                event.activate(this.target_object.affected_by_reveal);
                event.activation_collision_layers.forEach(collision_layer => {
                    this.data.map.set_collision_in_tile(event.x, event.y, false, collision_layer);
                });
            }
        });
        this.target_object.allow_jumping_through_it = false;
        this.target_object.sprite.send_to_back = false;
        this.data.map.sort_sprites();
        this.data.audio.play_se("psynergy/4");

        this.target_object.manage_filter(this.target_object.tint_filter, true);
        let blink_counter = 16;
        const blink_timer = this.game.time.create(false);
        blink_timer.loop(50, () => {
            if (blink_counter % 2 === 0) {
                this.target_object.tint_filter.r = 1;
                this.target_object.tint_filter.g = 1;
                this.target_object.tint_filter.b = 1;
            } else {
                this.target_object.tint_filter.r = -1;
                this.target_object.tint_filter.g = -1;
                this.target_object.tint_filter.b = -1;
            }
            --blink_counter;
            if (blink_counter === 0) {
                this.target_object.manage_filter(this.target_object.tint_filter, false);
                blink_timer.stop();
                this.grow_pillar();
            }
        });
        blink_timer.start();
    }

    /*Plays the pillar's growing animation*/
    grow_pillar() {
        this.data.audio.play_se("psynergy/7");
        this.target_object.sprite.visible = true;
        this.target_object.play("pillar");
        this.target_object.sprite.animations.currentAnim.onComplete.addOnce(() => {
            FrostFieldPsynergy.set_permanent_blink(this.game, this.target_object);
            this.return_to_idle_anim();
            this.stop_casting();
        });
    }

    /*Enables the pillar's blinking state*/
    static set_permanent_blink(game: Phaser.Game, target_object: FrostFieldPsynergy["target_object"]) {
        const blink_timer = game.time.create(false);
        target_object.manage_filter(target_object.hue_filter, true);
        blink_timer.loop(150, () => {
            target_object.hue_filter.angle = 5.3;
            const timer_event = game.time.events.add(20, () => {
                if (target_object?.hue_filter) {
                    target_object.hue_filter.angle = 0;
                }
            });
            timer_event.timer.start();
        });
        blink_timer.start();
        target_object.add_unset_callback(() => {
            blink_timer.destroy();
        });
    }
}
