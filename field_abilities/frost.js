import { main_char_list } from "../chars/main_chars.js";
import { abilities_list } from "../chars/abilities.js";
import { init_cast_aura, tint_map_layers } from  '../chars/psynergy_cast.js';
import { maps } from  '../maps/maps.js';
import * as numbers from '../magic_numbers.js';

const KEY_NAME = "frost_psynergy";
const ACTION_KEY_NAME = "cast";
const FROST_MAX_RANGE = 12;
const SNOWFLAKES_COUNT = 15;
const TOTAL_TURNS_SNOWFLAKES = Math.PI * 4.999;
const POLAR_SLOPE = 0.2;
const SPIRAL_INTENSITY = 4.25;
const SNOWFLAKE_DURATION = 1500;

export class FrostFieldPsynergy {
    constructor(game, data) {
        this.game = game;
        this.data = data;
        this.ability_key_name = "frost";
        this.action_key_name = ACTION_KEY_NAME;
        this.game.load.image('frost_snowflake', 'assets/images/spritesheets/psynergy_items/snowflake.png');
        this.target_found = false;
        this.target_item = null;
        this.stop_casting = null;
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
                min_y = this.data.hero.y - numbers.HERO_BODY_RADIUS - FROST_MAX_RANGE;
                max_y = this.data.hero.y - numbers.HERO_BODY_RADIUS;
            } else {
                min_y = this.data.hero.y + numbers.HERO_BODY_RADIUS;
                max_y = this.data.hero.y + numbers.HERO_BODY_RADIUS + FROST_MAX_RANGE;
            }
        } else {
            min_y = this.data.hero.y - numbers.HERO_BODY_RADIUS;
            max_y = this.data.hero.y + numbers.HERO_BODY_RADIUS;
            if (this.cast_direction === "left") {
                min_x = this.data.hero.x - numbers.HERO_BODY_RADIUS - FROST_MAX_RANGE;
                max_x = this.data.hero.x - numbers.HERO_BODY_RADIUS;
            } else {
                min_x = this.data.hero.x + numbers.HERO_BODY_RADIUS;
                max_x = this.data.hero.x + numbers.HERO_BODY_RADIUS + FROST_MAX_RANGE;
            }
        }
        let sqr_distance = Infinity;
        for (let i = 0; i < maps[this.data.map_name].psynergy_items.length; ++i) {
            let psynergy_item = maps[this.data.map_name].psynergy_items[i];
            if (!this.data.psynergy_items_db[psynergy_item.key_name].psynergy_keys.includes(this.ability_key_name)) continue;
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

    set_hero_cast_anim() {
        this.data.hero.loadTexture(this.data.hero_name + "_" + this.action_key_name);
        main_char_list[this.data.hero_name].setAnimation(this.data.hero, this.action_key_name);
        this.data.hero.animations.play(this.action_key_name + "_" + this.cast_direction, main_char_list[this.data.hero_name].actions[this.action_key_name].frame_rate, false);
    }

    unset_hero_cast_anim() {
        this.data.hero.animations.currentAnim.reverseOnce();
        this.data.hero.animations.currentAnim.onComplete.addOnce(() => {
            this.data.hero.loadTexture(this.data.hero_name + "_idle");
            main_char_list[this.data.hero_name].setAnimation(this.data.hero, "idle");
            this.data.hero.animations.frameName = `idle/${this.cast_direction}/00`;
        });
        this.data.hero.animations.play(this.action_key_name + "_" + this.cast_direction, main_char_list[this.data.hero_name].actions[this.action_key_name].frame_rate, false);
    }

    init_snowflakes() {
        for (let i = 0; i < SNOWFLAKES_COUNT; ++i) {
            let snowflake_sprite = this.data.npc_group.create(0, 0, "frost_snowflake");
            snowflake_sprite.anchor.setTo(0.5, 0.5);
            const scale_factor = _.random(5, 9)/10.0;
            const rotation_factor = Math.random() * numbers.degree360;
            snowflake_sprite.scale.setTo(scale_factor, scale_factor);
            snowflake_sprite.rotation = rotation_factor;
            let x_dest = this.data.hero.centerX;
            let y_dest = this.data.hero.centerY + 12;
            switch (this.cast_direction) {
                case "left": x_dest -= 16; break;
                case "right": x_dest += 16; break;
                case "up": y_dest -= 14; break;
                case "down": y_dest += 12; break;
            }
            let spiral_angle = {rad: TOTAL_TURNS_SNOWFLAKES};
            const sign_x = Math.sign(Math.random() - 0.5);
            const sign_y = Math.sign(Math.random() - 0.5);
            const tween = this.game.add.tween(spiral_angle).to(
                {rad: -Math.PI},
                SNOWFLAKE_DURATION,
                Phaser.Easing.Linear.None,
                true,
                i * (Phaser.Timer.QUARTER >> 1)
            );
            tween.onUpdateCallback(() => {
                snowflake_sprite.centerX = sign_x * SPIRAL_INTENSITY * Math.exp(POLAR_SLOPE * spiral_angle.rad) * Math.cos(spiral_angle.rad) + x_dest;
                snowflake_sprite.centerY = sign_y * SPIRAL_INTENSITY * Math.exp(POLAR_SLOPE * spiral_angle.rad) * Math.sin(spiral_angle.rad) + y_dest;
            });
            tween.onComplete.addOnce(() => {
                snowflake_sprite.destroy();
                if (i === SNOWFLAKES_COUNT - 1) {
                    if (this.target_found) {
                        this.init_pillar();
                    } else {
                        this.unset_hero_cast_anim();
                        this.stop_casting();
                    }
                }
            });
        }
    }

    init_pillar() {
        this.target_item.psynergy_item_sprite.send_to_back = false;
        this.data.npc_group.sort('y_sort', Phaser.Group.SORT_ASCENDING);
        this.target_item.events.forEach(event_key => {
            maps[data.map_name].events[event_key].active = false;
        });
        this.target_item.psynergy_item_sprite.animations.play("frost_pool_pillar", 5, false);
        this.target_item.psynergy_item_sprite.animations.currentAnim.onComplete.addOnce(() => {
            this.unset_hero_cast_anim();
            this.stop_casting();
        });
    }

    cast(caster_key_name) {
        if (this.data.casting_psynergy) return;
        let caster = main_char_list[caster_key_name];
        let ability = abilities_list[this.ability_key_name];
        if (caster.current_pp < ability.pp_cost && caster.abilities.includes(this.ability_key_name)) {
            return;
        }
        this.data.casting_psynergy = true;
        this.game.physics.p2.pause();
        this.data.hero.body.velocity.y = data.hero.body.velocity.x = 0;
        caster.current_pp -= ability.pp_cost;
        this.set_cast_direction();
        this.search_for_target();
        this.set_hero_cast_anim();
        let reset_map;
        this.stop_casting = init_cast_aura(this.game, this.data.hero, this.data.npc_group, this.data.hero_color_filters, () => {
            reset_map = tint_map_layers(maps[this.data.map_name], this.data.map_color_filters);
            this.init_snowflakes();
        }, () => {
            this.game.physics.p2.resume();
            this.data.casting_psynergy = false;
            this.target_item = null;
        }, () => {
            reset_map();
        });
    }
}