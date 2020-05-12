import { SpriteBase } from "../base/SpriteBase.js";
import { main_char_list } from "../chars/main_chars.js";
import { abilities_list } from "../chars/abilities.js";
import { init_cast_aura, tint_map_layers } from  '../chars/psynergy_cast.js';
import { maps } from  '../maps/maps.js';

const KEY_NAME = "move_psynergy_hand";
const ACTION_KEY_NAME = "cast";
const MAX_HAND_TRANSLATE = 16;

export class MoveFieldPsynergy extends SpriteBase {
    constructor(game, data) {
        super(KEY_NAME, [ACTION_KEY_NAME]);
        this.game = game;
        this.data = data;
        this.ability_key_name = "move";
        this.action_key_name = ACTION_KEY_NAME;
        this.setActionSpritesheet(
            this.action_key_name,
            "assets/images/spritesheets/move_psynergy.png",
            "assets/images/spritesheets/move_psynergy.json"
        );
        this.setActionDirections(
            this.action_key_name, 
            ["up", "down", "left", "right"],
            [2, 2, 2, 2]
        );
        this.setActionFrameRate(this.action_key_name, 8);
        this.addAnimations();
        this.loadSpritesheets(this.game);
        this.hand_sprite = null;
    }

    set_hero_cast_anim() {
        this.data.hero.loadTexture(this.data.hero_name + "_" + this.action_key_name);
        main_char_list[this.data.hero_name].setAnimation(this.data.hero, this.action_key_name);
        this.data.hero.animations.play(this.action_key_name + "_" + this.data.actual_direction, main_char_list[this.data.hero_name].actions[this.action_key_name].frame_rate, false);
    }

    set_hand() {
        this.hand_sprite = this.data.npc_group.create(0, 0, this.key_name + "_" + this.action_key_name);
        this.hand_sprite.loadTexture(this.key_name + "_" + this.action_key_name);
        this.setAnimation(this.hand_sprite, this.action_key_name);
        this.hand_sprite.animations.frameName = `${this.action_key_name}/${this.cast_direction}/00`;
        this.hand_sprite.centerX = this.data.hero.centerX;
        this.hand_sprite.centerY = this.data.hero.centerY;
        this.data.npc_group.bringToTop(this.hand_sprite);
    }

    translate_hand() {
        let translate_x = this.hand_sprite.x;
        let translate_y = this.hand_sprite.y;
        switch (this.cast_direction) {
            case "up":
                translate_y -= MAX_HAND_TRANSLATE;
                break;
            case "down":
                translate_y += MAX_HAND_TRANSLATE;
                break;
            case "right":
                translate_x += MAX_HAND_TRANSLATE;
                break;
            case "left":
                translate_x -= MAX_HAND_TRANSLATE;
                break;
        }
        game.add.tween(this.hand_sprite).to(
            {x: translate_x, y: translate_y},
            Phaser.Timer.QUARTER,
            Phaser.Easing.Linear.None,
            true
        ).onComplete.addOnce(() => {
            this.hand_sprite.animations.play(this.action_key_name + "_" + this.cast_direction);
        });
    }

    cast(caster_key_name) {
        let caster = main_char_list[caster_key_name];
        let ability = abilities_list[this.ability_key_name];
        if (caster.current_pp < ability.pp_cost) {
            return;
        }
        this.data.casting_psynergy = true;
        data.hero.body.velocity.y = data.hero.body.velocity.x = 0;
        caster.current_pp -= ability.pp_cost;
        let reset_map;
        this.cast_direction = this.data.actual_direction;
        this.set_hero_cast_anim();
        let stop_casting = init_cast_aura(this.game, this.data.hero, this.data.npc_group, this.data.hero_color_filters, () => {
            reset_map = tint_map_layers(maps[this.data.map_name], this.data.map_color_filters);
            this.set_hand();
            this.translate_hand();
        }, () => {
            data.casting_psynergy = false;
        }, () => {
            reset_map();
        });
    
    }
}