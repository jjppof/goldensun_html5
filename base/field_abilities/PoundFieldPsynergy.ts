import * as numbers from "../magic_numbers";
import {directions, reverse_directions, join_directions, base_actions} from "../utils";
import {StepEvent} from "../tile_events/StepEvent";
import {FieldAbilities} from "./FieldAbilities";
import {SpriteBase} from "../SpriteBase";
import * as _ from "lodash";
import {timer} from "rxjs";

/*Handles the "Frost" field psynergy
Does not handle the in-battle command

Input:game [Phaser:Game] - Reference to the running game object
       data [GoldenSun] - Reference to the main JS Class instance*/
export class PoundFieldPsynergy extends FieldAbilities {
    private static readonly ABILITY_KEY_NAME = "pound";
    private static readonly ACTION_KEY_NAME = "cast";
    private static readonly POUND_MAX_RANGE = 12;
    private static readonly POUND_HAND_KEY_NAME = "pound_hand";

    public hand_sprite_base: SpriteBase;
    public hand_sprite: Phaser.Sprite;
    public emitter: Phaser.Particles.Arcade.Emitter;
    public final_emitter: Phaser.Particles.Arcade.Emitter;
    public sprite_base: SpriteBase;

    constructor(game, data) {
        super(
            game,
            data,
            PoundFieldPsynergy.ABILITY_KEY_NAME,
            PoundFieldPsynergy.POUND_MAX_RANGE,
            PoundFieldPsynergy.ACTION_KEY_NAME,
            true
        );
        this.set_bootstrap_method(this.init_hand.bind(this));
        this.hand_sprite_base = this.data.info.misc_sprite_base_list[PoundFieldPsynergy.POUND_HAND_KEY_NAME];
        const sprite_key = this.hand_sprite_base.getActionKey(PoundFieldPsynergy.POUND_HAND_KEY_NAME);
        this.hand_sprite = this.game.add.sprite(0, 0, sprite_key);
        this.hand_sprite.visible = false;
        this.hand_sprite_base.setAnimation(this.hand_sprite, PoundFieldPsynergy.POUND_HAND_KEY_NAME);
        this.sprite_base = this.data.info.iter_objs_sprite_base_list["pound_pillar"];
    }

    init_hand() {
        this.field_psynergy_window.close();
        this.data.overlayer_group.add(this.hand_sprite);
        this.data.overlayer_group.bringToTop(this.hand_sprite);
        this.hand_sprite.visible = true;
        this.hand_sprite.scale.setTo(1, 1);
        this.hand_sprite.send_to_front = true;
        this.hand_sprite.base_collision_layer = this.data.map.collision_layer;
        this.hand_sprite.animations.currentAnim.stop(true);
        this.hand_sprite.frameName = this.hand_sprite_base.getFrameName(
            PoundFieldPsynergy.POUND_HAND_KEY_NAME,
            reverse_directions[this.cast_direction],
            0
        );
        this.hand_sprite.anchor.x = 0.5;
        this.hand_sprite.centerX = this.controllable_char.sprite.centerX;
        this.hand_sprite.centerY = this.controllable_char.sprite.centerY;
        let translate_x = this.hand_sprite.centerX;
        let translate_y = this.hand_sprite.centerY;
        translate_x += 12 * this.move_hand()[0];
        translate_y -= 12 * this.move_hand()[1];
        this.hand_tween(translate_x, translate_y, 300, this.change_hand_frame.bind(this));
    }

    change_hand_frame() {
        this.hand_sprite.frameName = this.hand_sprite_base.getFrameName(
            PoundFieldPsynergy.POUND_HAND_KEY_NAME,
            reverse_directions[this.cast_direction],
            1
        );
        let timer = this.game.time.create(true);
        timer.add(200, () => {
            this.hand_sprite.frameName = this.hand_sprite_base.getFrameName(
                PoundFieldPsynergy.POUND_HAND_KEY_NAME,
                reverse_directions[this.cast_direction],
                2
            );
            this.hand_down();
        });
        timer.start();
    }

    hand_down() {
        let timer = this.game.time.create(true);
        timer.add(200, () => {
            let translate_x = this.hand_sprite.centerX;
            let translate_y = this.hand_sprite.centerY;
            translate_y -= 20 * this.move_hand()[1];
            this.hand_tween(translate_x, translate_y, 400, () => {
                let timer2 = this.game.time.create(true);
                timer2.add(200, () => {
                    translate_y += (this.controllable_char.sprite.height + 8) * this.move_hand()[1];
                    if (this.target_found) {
                        this.game.add
                            .tween(this.target_object.sprite.scale)
                            .to({y: 0.1}, 100, Phaser.Easing.Linear.None, true);
                    }
                    this.hand_tween(translate_x, translate_y, 100, this.finish_hand.bind(this));
                });
                timer2.start();
            });
        });
        timer.start();
    }

    finish_hand() {
        if (this.target_found) {
            this.game.add.tween(this.target_object.sprite.scale).to({y: 1}, 1, Phaser.Easing.Linear.None, true);
            const anim_key = this.sprite_base.getAnimationKey("pound_stone", "down");
            this.target_object.sprite.animations.play(anim_key);
            this.target_object.change_collider_layer(this.data, 0);
        }
        let translate_x = this.hand_sprite.centerX;
        let translate_y = this.controllable_char.sprite.centerY - 16 * this.move_hand()[1];
        let timer = this.game.time.create(true);
        timer.add(600, () => {
            this.hand_tween(translate_x, translate_y, 350, () => {
                this.game.add.tween(this.hand_sprite).to({width: 0, height: 0}, 350, Phaser.Easing.Linear.None, true);
                translate_x = this.controllable_char.sprite.centerX;
                translate_y = this.controllable_char.sprite.centerY;
                this.hand_tween(translate_x, translate_y, 400, () => {
                    this.unset_hero_cast_anim();
                    this.stop_casting();
                    this.data.overlayer_group.remove(this.hand_sprite, false);
                });
            });
        });
        timer.start();
    }

    move_hand() {
        let final_x = 1;
        let final_y = 1;
        switch (this.cast_direction) {
            case directions.up:
                final_x *= 0;
                break;
            case directions.down:
                final_x *= 0;
                final_y *= -1;
                break;
            case directions.left:
                final_x *= -1;
                break;
        }
        return [final_x, final_y];
    }

    hand_tween(var_x, var_y, time, complete_action) {
        this.game.add
            .tween(this.hand_sprite)
            .to({centerX: var_x, centerY: var_y}, time, Phaser.Easing.Linear.None, true)
            .onComplete.addOnce(complete_action);
    }
}
