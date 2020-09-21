import { main_char_list } from "../initializers/main_chars.js";
import { abilities_list } from "../initializers/abilities.js";
import { init_cast_aura, tint_map_layers } from  '../initializers/psynergy_cast.js';
import * as numbers from '../magic_numbers.js';
import { event_types } from "../base/tile_events/TileEvent.js";
import { get_surroundings, set_cast_direction, directions, reverse_directions } from "../utils.js";
import { JumpEvent } from "../base/tile_events/JumpEvent.js";

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
        this.target_found = false;
        this.target_object = null;
        this.stop_casting = null;
    }

    search_for_target() {
        this.target_found = false;
        let min_x, max_x, min_y, max_y;
        if (this.cast_direction === directions.up || this.cast_direction === directions.down) {
            min_x = this.data.hero.sprite.x - numbers.HERO_BODY_RADIUS;
            max_x = this.data.hero.sprite.x + numbers.HERO_BODY_RADIUS;
            if (this.cast_direction === directions.up) {
                min_y = this.data.hero.sprite.y - numbers.HERO_BODY_RADIUS - FROST_MAX_RANGE;
                max_y = this.data.hero.sprite.y - numbers.HERO_BODY_RADIUS;
            } else {
                min_y = this.data.hero.sprite.y + numbers.HERO_BODY_RADIUS;
                max_y = this.data.hero.sprite.y + numbers.HERO_BODY_RADIUS + FROST_MAX_RANGE;
            }
        } else {
            min_y = this.data.hero.sprite.y - numbers.HERO_BODY_RADIUS;
            max_y = this.data.hero.sprite.y + numbers.HERO_BODY_RADIUS;
            if (this.cast_direction === directions.left) {
                min_x = this.data.hero.sprite.x - numbers.HERO_BODY_RADIUS - FROST_MAX_RANGE;
                max_x = this.data.hero.sprite.x - numbers.HERO_BODY_RADIUS;
            } else {
                min_x = this.data.hero.sprite.x + numbers.HERO_BODY_RADIUS;
                max_x = this.data.hero.sprite.x + numbers.HERO_BODY_RADIUS + FROST_MAX_RANGE;
            }
        }
        let sqr_distance = Infinity;
        for (let i = 0; i < this.data.map.interactable_objects.length; ++i) {
            let interactable_object = this.data.map.interactable_objects[i];
            if (!(this.ability_key_name in this.data.interactable_objects_db[interactable_object.key_name].psynergy_keys)) continue;
            const item_x_px = interactable_object.current_x * this.data.map.sprite.tileWidth + (this.data.map.sprite.tileWidth >> 1);
            const item_y_px = interactable_object.current_y * this.data.map.sprite.tileHeight + (this.data.map.sprite.tileHeight >> 1);
            const x_condition = item_x_px >= min_x && item_x_px <= max_x;
            const y_condition = item_y_px >= min_y && item_y_px <= max_y;
            if (x_condition && y_condition && this.data.map.collision_layer === interactable_object.base_collider_layer) {
                let this_sqr_distance = Math.pow(item_x_px - this.data.hero.sprite.x, 2) + Math.pow(item_y_px - this.data.hero.sprite.y, 2);
                if (this_sqr_distance < sqr_distance) {
                    this.target_found = true;
                    this.target_object = interactable_object;
                }
            }
        }
    }

    set_hero_cast_anim() {
        this.data.hero.play(this.action_key_name, reverse_directions[this.cast_direction]);
    }

    unset_hero_cast_anim() {
        this.data.hero.sprite.animations.currentAnim.reverseOnce();
        this.data.hero.sprite.animations.currentAnim.onComplete.addOnce(() => {
            this.data.hero.play("idle", reverse_directions[this.cast_direction]);
        });
        this.data.hero.play(this.action_key_name, reverse_directions[this.cast_direction]);
    }

    init_snowflakes() {
        for (let i = 0; i < SNOWFLAKES_COUNT; ++i) {
            let snowflake_sprite = this.data.npc_group.create(0, 0, "frost_snowflake");
            snowflake_sprite.anchor.setTo(0.5, 0.5);
            const scale_factor = _.random(5, 9)/10.0;
            const rotation_factor = Math.random() * numbers.degree360;
            snowflake_sprite.scale.setTo(scale_factor, scale_factor);
            snowflake_sprite.rotation = rotation_factor;
            let x_dest = this.data.hero.sprite.centerX;
            let y_dest = this.data.hero.sprite.centerY + 12;
            switch (this.cast_direction) {
                case directions.left: x_dest -= 16; break;
                case directions.right: x_dest += 16; break;
                case directions.up: y_dest -= 14; break;
                case directions.down: y_dest += 12; break;
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
        this.target_object.get_events().forEach(event => {
            if (event.is_set) {
                event.deactivate();
                event.is_set = false;
            } else {
                event.activate();
                event.is_set = true;
                if (event.type === event_types.JUMP) {
                    JumpEvent.active_jump_surroundings(
                        this.data,
                        get_surroundings(event.x, event.y, false, 2),
                        this.target_object.collider_layer_shift + this.target_object.base_collider_layer
                    );
                }
            }
        });
        this.target_object.interactable_object_sprite.send_to_back = false;
        this.data.map.sort_sprites();
        this.target_object.custom_data.color_filters = this.game.add.filter('ColorFilters');
        this.target_object.interactable_object_sprite.filters = [this.target_object.custom_data.color_filters];
        let blink_counter = 16;
        let blink_timer = this.game.time.create(false);
        blink_timer.loop(50, () => {
            if (blink_counter%2 === 0) {
                this.target_object.custom_data.color_filters.tint = [1,1,1];
            } else {
                this.target_object.custom_data.color_filters.tint = [-1,-1,-1];
            }
            --blink_counter;
            if (blink_counter === 0) {
                blink_timer.stop();
                this.grow_pillar();
            }
        });
        blink_timer.start();
    }

    grow_pillar() {
        this.target_object.interactable_object_sprite.animations.play("frost_pool_pillar", 5, false);
        this.target_object.interactable_object_sprite.animations.currentAnim.onComplete.addOnce(() => {
            this.set_permanent_blink();
            this.unset_hero_cast_anim();
            this.stop_casting();
        });
    }

    set_permanent_blink() {
        let blink_timer = this.game.time.create(false);
        let target_object = this.target_object;
        blink_timer.loop(150, () => {
            target_object.custom_data.color_filters.hue_adjust = 5.3;
            this.game.time.events.add(20, () => {
                target_object.custom_data.color_filters.hue_adjust = 0;
            });
        });
        blink_timer.start();
        target_object.interactable_object_sprite.events.onDestroy.add(() => {
            blink_timer.destroy();
        });
    }

    cast(caster_key_name) {
        if (this.data.hero.casting_psynergy) return;
        let caster = main_char_list[caster_key_name];
        let ability = abilities_list[this.ability_key_name];
        if (caster.current_pp < ability.pp_cost || !caster.abilities.includes(this.ability_key_name)) {
            return;
        }
        this.data.hero.casting_psynergy = true;
        this.game.physics.p2.pause();
        this.data.hero.sprite.body.velocity.y = this.data.hero.sprite.body.velocity.x = 0;
        caster.current_pp -= ability.pp_cost;
        this.cast_direction = set_cast_direction(this.data.hero.current_direction);
        this.data.hero.current_direction = this.cast_direction;
        this.search_for_target();
        if (this.target_object && this.target_object.custom_data.frost_casted) {
            this.target_found = false;
            this.target_object = null;
        } else if (this.target_found) {
            this.target_object.custom_data.frost_casted = true;
        }
        this.set_hero_cast_anim();
        let reset_map;
        this.stop_casting = init_cast_aura(this.game, this.data.hero.sprite, this.data.npc_group, this.data.hero.color_filter, () => {
            reset_map = tint_map_layers(this.game, this.data.map, this.data.map.color_filter);
            this.init_snowflakes();
        }, () => {
            this.game.physics.p2.resume();
            this.data.hero.casting_psynergy = false;
            this.target_object = null;
        }, () => {
            reset_map();
        });
    }
}