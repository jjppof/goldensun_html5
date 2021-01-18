import {init_cast_aura, tint_map_layers} from "./psynergy_cast";
import {base_actions, directions, reverse_directions} from "../utils";
import {InteractableObjects, interactable_object_interaction_types} from "../InteractableObjects";
import {FieldPsynergyWindow} from "../windows/FieldPsynergyWindow";
import {GoldenSun} from "../GoldenSun";
import {ControllableChar} from "../ControllableChar";

/*Defines and manages the usage of field psynergy

Input: game [Phaser:Game] - Reference to the running game object
       data [GoldenSun] - Reference to the main JS Class instance*/
export class FieldAbilities {
    public game: Phaser.Game;
    public ability_key_name: string;
    public data: GoldenSun;
    public target_max_range: number;
    public action_key_name: string;
    public need_target: boolean;
    public bootstrap_method: Function;
    public cast_finisher: Function;
    public controllable_char: ControllableChar;
    public target_found: boolean;
    public target_object: InteractableObjects;
    public stop_casting: Function;
    public field_psynergy_window: FieldPsynergyWindow;
    public cast_direction: number;

    constructor(game, data, ability_key_name, target_max_range, action_key_name, need_target) {
        this.game = game;
        this.ability_key_name = ability_key_name;
        this.data = data;
        this.target_max_range = target_max_range;
        this.action_key_name = action_key_name;
        this.need_target = need_target;
        this.bootstrap_method = () => {};
        this.cast_finisher = () => {};
        this.controllable_char = null;
        this.target_found = false;
        this.target_object = null;
        this.stop_casting = null;
        this.field_psynergy_window = new FieldPsynergyWindow(this.game, this.data);
    }

    /**
     * Sets the psynergy cast direction,
     * For diagonals, picks the next clockwise non-diagonal.
     * @param {number} direction - Current direction
     * @return {number} Non-diagonal cast direction
     */
    get_cast_direction(direction) {
        return (direction % 2 ? direction + 1 : direction) % 8;
    }

    set_hero_cast_anim() {
        this.controllable_char.play(this.action_key_name, reverse_directions[this.cast_direction]);
    }

    unset_hero_cast_anim() {
        this.controllable_char.sprite.animations.currentAnim.reverseOnce();
        this.controllable_char.sprite.animations.currentAnim.onComplete.addOnce(() => {
            this.controllable_char.play(base_actions.IDLE, reverse_directions[this.cast_direction]);
        });
        this.controllable_char.play(this.action_key_name, reverse_directions[this.cast_direction]);
    }

    set_bootstrap_method(method) {
        this.bootstrap_method = method;
    }

    set_cast_finisher_method(method) {
        this.cast_finisher = method;
    }

    search_for_target() {
        this.target_found = false;
        let min_x, max_x, min_y, max_y;
        if (this.cast_direction === directions.up || this.cast_direction === directions.down) {
            min_x = this.controllable_char.sprite.x - this.controllable_char.body_radius;
            max_x = this.controllable_char.sprite.x + this.controllable_char.body_radius;
            if (this.cast_direction === directions.up) {
                min_y = this.controllable_char.sprite.y - this.controllable_char.body_radius - this.target_max_range;
                max_y = this.controllable_char.sprite.y - this.controllable_char.body_radius;
            } else {
                min_y = this.controllable_char.sprite.y + this.controllable_char.body_radius;
                max_y = this.controllable_char.sprite.y + this.controllable_char.body_radius + this.target_max_range;
            }
        } else {
            min_y = this.controllable_char.sprite.y - this.controllable_char.body_radius;
            max_y = this.controllable_char.sprite.y + this.controllable_char.body_radius;
            if (this.cast_direction === directions.left) {
                min_x = this.controllable_char.sprite.x - this.controllable_char.body_radius - this.target_max_range;
                max_x = this.controllable_char.sprite.x - this.controllable_char.body_radius;
            } else {
                min_x = this.controllable_char.sprite.x + this.controllable_char.body_radius;
                max_x = this.controllable_char.sprite.x + this.controllable_char.body_radius + this.target_max_range;
            }
        }
        let sqr_distance = Infinity;
        for (let i = 0; i < this.data.map.interactable_objects.length; ++i) {
            let interactable_object = this.data.map.interactable_objects[i];
            if (
                !(
                    this.ability_key_name in
                    this.data.dbs.interactable_objects_db[interactable_object.key_name].psynergy_keys
                )
            )
                continue;
            const item_x_px =
                interactable_object.current_x * this.data.map.tile_width + (this.data.map.tile_width >> 1);
            const item_y_px =
                interactable_object.current_y * this.data.map.tile_height + (this.data.map.tile_height >> 1);
            const x_condition = item_x_px >= min_x && item_x_px <= max_x;
            const y_condition = item_y_px >= min_y && item_y_px <= max_y;
            if (
                x_condition &&
                y_condition &&
                this.data.map.collision_layer === interactable_object.base_collision_layer
            ) {
                let this_sqr_distance =
                    Math.pow(item_x_px - this.controllable_char.sprite.x, 2) +
                    Math.pow(item_y_px - this.controllable_char.sprite.y, 2);
                if (this_sqr_distance < sqr_distance) {
                    sqr_distance = this_sqr_distance;
                    this.target_found = true;
                    this.target_object = interactable_object;
                }
            }
        }
    }

    set_target_casted() {
        if (this.target_object) {
            const psynergy_properties = this.data.dbs.interactable_objects_db[this.target_object.key_name]
                .psynergy_keys[this.ability_key_name];
            if (psynergy_properties.interaction_type === interactable_object_interaction_types.ONCE) {
                const casted_property = this.ability_key_name + "_casted";
                if (this.target_object.custom_data[casted_property]) {
                    this.target_found = false;
                    this.target_object = null;
                } else if (this.target_found) {
                    this.target_object.custom_data[casted_property] = true;
                }
            }
        }
    }

    cast(controllable_char, caster_key_name) {
        this.controllable_char = controllable_char;
        if (this.controllable_char.casting_psynergy) return;
        if (caster_key_name !== undefined && caster_key_name in this.data.info.main_char_list) {
            const caster = this.data.info.main_char_list[caster_key_name];
            const ability = this.data.info.abilities_list[this.ability_key_name];
            if (caster.current_pp < ability.pp_cost || !caster.abilities.includes(this.ability_key_name)) {
                return;
            }
            caster.current_pp -= ability.pp_cost;
        }

        this.field_psynergy_window.window.send_to_front();
        this.field_psynergy_window.open(this.ability_key_name);

        this.controllable_char.casting_psynergy = true;
        this.data.audio.play_se("psynergy/4");
        this.game.physics.p2.pause();
        this.controllable_char.stop_char(false);

        this.cast_direction = this.get_cast_direction(this.controllable_char.current_direction);
        this.controllable_char.set_direction(this.cast_direction);
        if (this.need_target) {
            this.search_for_target();
            this.set_target_casted();
        }

        this.set_hero_cast_anim();
        let reset_map;
        this.stop_casting = init_cast_aura(
            this.game,
            this.controllable_char.sprite,
            this.data.npc_group,
            this.controllable_char.color_filter,
            () => {
                reset_map = tint_map_layers(this.game, this.data.map, this.data.map.color_filter);
                this.bootstrap_method();
            },
            () => {
                this.game.physics.p2.resume();
                this.controllable_char.casting_psynergy = false;
                this.target_object = null;
            },
            () => {
                this.cast_finisher();
                reset_map();
            }
        );
    }
}
