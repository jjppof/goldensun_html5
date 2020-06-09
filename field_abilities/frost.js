import { main_char_list } from "../chars/main_chars.js";
import { abilities_list } from "../chars/abilities.js";
import { init_cast_aura, tint_map_layers } from  '../chars/psynergy_cast.js';
import { maps } from  '../maps/maps.js';
import * as numbers from '../magic_numbers.js';

const KEY_NAME = "frost_psynergy";
const ACTION_KEY_NAME = "cast";
const FROST_MAX_RANGE = 26;

export class FrostFieldPsynergy {
    constructor(game, data) {
        super(KEY_NAME, [ACTION_KEY_NAME]);
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

    init_snowflakes() {

    }

    cast(caster_key_name) {
        if (this.data.casting_psynergy) return;
        let caster = main_char_list[caster_key_name];
        let ability = abilities_list[this.ability_key_name];
        if (caster.current_pp < ability.pp_cost) {
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