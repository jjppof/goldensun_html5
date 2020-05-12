import { SpriteBase } from "../base/SpriteBase.js";
import { main_char_list } from "../chars/main_chars.js";
import { abilities_list } from "../chars/abilities.js";
import { init_cast_aura, tint_map_layers } from  '../chars/psynergy_cast.js';
import { maps } from  '../maps/maps.js';
import * as numbers from '../magic_numbers.js';

const KEY_NAME = "move_psynergy_hand";
const ACTION_KEY_NAME = "cast";
const MAX_HAND_TRANSLATE = 16;
const MOVE_MAX_RANGE = 32;

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
        this.setActionFrameRate(this.action_key_name, 10);
        this.addAnimations();
        this.loadSpritesheets(this.game);
        this.hand_sprite = null;
        this.target_found = false;
        this.target_item = null;
        this.stop_casting = null;
    }

    set_hero_cast_anim() {
        this.data.hero.loadTexture(this.data.hero_name + "_" + this.action_key_name);
        main_char_list[this.data.hero_name].setAnimation(this.data.hero, this.action_key_name);
        this.data.hero.animations.play(this.action_key_name + "_" + this.cast_direction, main_char_list[this.data.hero_name].actions[this.action_key_name].frame_rate, false);
    }

    unset_hero_cast_anim() {
        data.hero.animations.currentAnim.reverseOnce();
        data.hero.animations.currentAnim.onComplete.addOnce(() => {
            this.data.hero.loadTexture(this.data.hero_name + "_idle");
            main_char_list[this.data.hero_name].setAnimation(this.data.hero, "idle");
            this.data.hero.animations.frameName = `idle/${this.cast_direction}/00`;
        });
        this.data.hero.animations.play(this.action_key_name + "_" + this.cast_direction, main_char_list[this.data.hero_name].actions[this.action_key_name].frame_rate, false);
    }

    set_hand() {
        this.hand_sprite = this.data.npc_group.create(0, 0, this.key_name + "_" + this.action_key_name);
        this.hand_sprite.loadTexture(this.key_name + "_" + this.action_key_name);
        this.setAnimation(this.hand_sprite, this.action_key_name);
        this.hand_sprite.animations.frameName = `${this.action_key_name}/${this.cast_direction}/00`;
        this.hand_sprite.anchor.x = 0.5;
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
            Phaser.Timer.QUARTER >> 1,
            Phaser.Easing.Linear.None,
            true
        ).onComplete.addOnce(() => {
            this.hand_sprite.animations.play(this.action_key_name + "_" + this.cast_direction);
            if (this.target_found) {

            } else {
                game.time.events.add(700, () => {
                    this.finish_hand();
                    this.unset_hero_cast_anim();
                });
            }
        });
    }

    finish_hand() {
        let flip_timer = game.time.create(false);
        let fake_hand_scale = {x : 1};
        flip_timer.loop(30, () => {
            this.hand_sprite.scale.x = this.hand_sprite.scale.x > 0 ? -fake_hand_scale.x : fake_hand_scale.x;
        });
        flip_timer.start();
        let y_shift = this.hand_sprite.y - 10;
        game.add.tween(this.hand_sprite).to(
            { y: y_shift },
            Phaser.Timer.QUARTER,
            Phaser.Easing.Linear.None,
            true
        );
        game.add.tween(fake_hand_scale).to(
            { x: 0 },
            Phaser.Timer.QUARTER,
            Phaser.Easing.Linear.None,
            true
        );
        game.add.tween(this.hand_sprite.scale).to(
            { y: 0 },
            Phaser.Timer.QUARTER,
            Phaser.Easing.Linear.None,
            true
        ).onComplete.addOnce(() => {
            this.stop_casting();
            flip_timer.stop();
            this.data.npc_group.remove(this.hand_sprite, true);
        });
        
    }

    set_cast_direction() {
        this.cast_direction = this.data.actual_direction;
        if (this.cast_direction === "down_left") {
            this.cast_direction = "left";
        } else if (this.cast_direction === "up_left") {
            this.cast_direction = "up";
        } else if (this.cast_direction === "up_right") {
            this.cast_direction = "right";
        } else if (this.cast_direction === "down_right") {
            this.cast_direction = "down";
        }
        this.data.actual_direction = this.cast_direction;
    }
    search_for_target() {
        this.target_found = false;
        let min_x, max_x, min_y, max_y;
        if (this.cast_direction === "up" || this.cast_direction === "down") {
            min_x = this.data.hero.x - numbers.HERO_BODY_RADIUS;
            max_x = this.data.hero.x + numbers.HERO_BODY_RADIUS;
            if (this.cast_direction === "up") {
                min_y = this.data.hero.y - numbers.HERO_BODY_RADIUS - MOVE_MAX_RANGE;
                max_y = this.data.hero.y - numbers.HERO_BODY_RADIUS;
            } else {
                min_y = this.data.hero.y + numbers.HERO_BODY_RADIUS;
                max_y = this.data.hero.y + numbers.HERO_BODY_RADIUS + MOVE_MAX_RANGE;
            }
        } else {
            min_y = this.data.hero.y - numbers.HERO_BODY_RADIUS;
            max_y = this.data.hero.y + numbers.HERO_BODY_RADIUS;
            if (this.cast_direction === "left") {
                min_x = this.data.hero.x - numbers.HERO_BODY_RADIUS - MOVE_MAX_RANGE;
                max_x = this.data.hero.x - numbers.HERO_BODY_RADIUS;
            } else {
                min_x = this.data.hero.x + numbers.HERO_BODY_RADIUS;
                max_x = this.data.hero.x + numbers.HERO_BODY_RADIUS + MOVE_MAX_RANGE;
            }
        }
        let sqr_distance = Infinity;
        for (let i = 0; i < maps[this.data.map_name].psynergy_items.length; ++i) {
            let psynergy_item = maps[this.data.map_name].psynergy_items[i];
            const item_x_px = psynergy_item.current_x * maps[this.data.map_name].sprite.tileWidth + (maps[this.data.map_name].sprite.tileWidth >> 1);
            const item_y_px = psynergy_item.current_y * maps[this.data.map_name].sprite.tileHeight + (maps[this.data.map_name].sprite.tileHeight >> 1);
            const x_condition = item_x_px >= min_x && item_x_px <= max_x;
            const y_condition = item_y_px >= min_y && item_y_px <= max_y;
            if (x_condition && y_condition) {
                let this_sqr_distance = Math.pow(item_x_px - this.data.hero.x, 2) + Math.pow(item_y_px - this.data.hero.y, 2);
                if (this_sqr_distance < sqr_distance) {
                    this.target_found = true;
                    this.target_item = psynergy_item;
                }
            }
        }
    }

    cast(caster_key_name) {
        if (this.data.casting_psynergy) return;
        let caster = main_char_list[caster_key_name];
        let ability = abilities_list[this.ability_key_name];
        if (caster.current_pp < ability.pp_cost) {
            return;
        }
        this.data.casting_psynergy = true;
        data.hero.body.velocity.y = data.hero.body.velocity.x = 0;
        caster.current_pp -= ability.pp_cost;
        this.set_cast_direction();
        this.search_for_target();
        this.set_hero_cast_anim();
        let reset_map;
        this.stop_casting = init_cast_aura(this.game, this.data.hero, this.data.npc_group, this.data.hero_color_filters, () => {
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