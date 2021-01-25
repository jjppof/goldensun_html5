import {Battle} from "../../battle/Battle";
import {GoldenSun} from "../../GoldenSun";
import {Button} from "../../XGamepad";
import {MainChar} from "../../MainChar";
import {
    temporary_status,
    ordered_status_battle,
    ordered_status_menu,
    permanent_status,
    effect_type_stat,
} from "../../Player";
import {TextObj, Window} from "../../Window";
import {base_actions, elements, ordered_elements} from "../../utils";
import * as _ from "lodash";
import {StatusComponent} from "../../support_menus/StatusComponent";
import {BattleStatusStatistics} from "../../support_menus/BattleStatusStatistics";
import {effect_types} from "../../Effect";
import {BattleStatusPsynergy} from "../../support_menus/BattleStatusPsynergy";
import {BattleStatusDjinn} from "../../support_menus/BattleStatusDjinn";
import {BattleStatusItems} from "../../support_menus/BattleStatusItems";

export type BattleStatusEffect = {
    key: temporary_status | permanent_status | effect_types;
    properties?: {
        modifier?: string;
        turns?: number;
        value?: number | {[element in elements]?: number};
    };
};

export enum BattleStatusStates {
    STATISTICS,
    PSYNERGY,
    DJINN,
    ITEMS,
}

export class BattleStatusWindow {
    private static readonly WINDOW = {
        WIDTH: 236,
        HEIGHT: 156,
    };
    private static readonly SEPARATOR = {
        X: 4,
        Y: 115,
        WIDTH: 232,
        SHIFT: 16,
    };
    private static readonly BATTLESPRITE = {
        CENTER_X: 204,
        END_Y: 120,
        SHADOW_Y: 114,
    };
    private static readonly DESCRIPTION = {
        X: 8,
        LINE1_Y: 124,
        LINE2_Y: 140,
    };
    private static readonly NAME = {
        X: 8,
        Y: 8,
    };
    private static readonly CLASS_NAME = {
        X: 8,
        Y: 56,
    };
    private static readonly EXP = {
        LABEL_X: 8,
        LABEL_Y: 16,
        VALUE_END_X: 109,
        VALUE_Y: 16,
    };
    private static readonly LEVEL = {
        LABEL_X: 64,
        LABEL_Y: 8,
        VALUE_END_X: 93,
        VALUE_Y: 8,
    };
    private static readonly AVATAR = {
        X: 8,
        Y: 24,
    };
    private static readonly NORMAL_STATUS = {
        X: 120,
        Y: 8,
    };
    private static readonly IN_THE_BACK = {
        X: 48,
        Y: 24,
    };
    private static readonly STATS = {
        LABEL_X: 144,
        LABEL_Y: 24,
        VALUE_END_X: 213,
        VALUE_Y: 24,
        LINE_SHIFT: 8,
    };
    private static readonly HP = {
        LABEL_X: 48,
        LABEL_Y: 32,
        MAX_END_X: 133,
        MAX_Y: 32,
        CURR_END_X: 100,
        CURR_Y: 32,
    };
    private static readonly PP = {
        LABEL_X: 48,
        LABEL_Y: 40,
        MAX_END_X: 133,
        MAX_Y: 40,
        CURR_END_X: 100,
        CURR_Y: 40,
    };
    private static readonly EFFECTS = {
        X: 112,
        Y: 8,
        SHIFT: 16,
    };

    private static readonly GROUP_KEY = "status_win";
    private static readonly MAX_EFFECTS_DISPLAYED = 8;

    private game: Phaser.Game;
    private data: GoldenSun;
    private close_callback: Function;

    private desc_shifted: boolean;
    private selected_char: MainChar;

    private current_state: BattleStatusStates;
    private current_component: StatusComponent;
    private components: StatusComponent[];

    private battle_effects: BattleStatusEffect[];
    private effect_sprites: Phaser.Sprite[];

    private window: Window;
    private battle_sprite: Phaser.Sprite;
    private avatar: Phaser.Sprite;

    private name: TextObj;
    private level_value: TextObj;

    private exp_value: TextObj;
    private normal_status: TextObj;

    private max_hp: TextObj;
    private curr_hp: TextObj;

    private max_pp: TextObj;
    private curr_pp: TextObj;

    private atk_value: TextObj;
    private def_value: TextObj;
    private agi_value: TextObj;
    private luk_value: TextObj;

    private class_name: TextObj;
    private in_the_back: TextObj;

    private desc_line1: TextObj;
    private desc_line2: TextObj;

    public constructor(game: Phaser.Game, data: GoldenSun) {
        this.game = game;
        this.data = data;
        this.close_callback = null;

        this.desc_shifted = null;
        this.selected_char = null;

        this.battle_effects = [];
        this.effect_sprites = [];

        this.window = new Window(this.game, 0, 0, BattleStatusWindow.WINDOW.WIDTH, BattleStatusWindow.WINDOW.HEIGHT);
        this.window.define_internal_group(BattleStatusWindow.GROUP_KEY, {x: 0, y: 0});

        this.components = [
            new BattleStatusStatistics(this.game, this.data, this.window, this),
            new BattleStatusPsynergy(this.game, this.data, this.window, this),
            new BattleStatusDjinn(this.game, this.data, this.window, this),
            new BattleStatusItems(this.game, this.data, this.window, this),
        ];

        this.battle_sprite = null;
        this.avatar = null;

        this.window.group.bringToTop(this.window.internal_groups[BattleStatusWindow.GROUP_KEY]);
        this.init_text();
    }

    public get selected_character() {
        return this.selected_char;
    }

    public get battle_effects_array() {
        return this.battle_effects;
    }

    private init_text() {
        this.name = this.window.set_text_in_position(
            "",
            BattleStatusWindow.NAME.X,
            BattleStatusWindow.NAME.Y,
            false,
            false,
            undefined,
            false,
            BattleStatusWindow.GROUP_KEY
        );
        this.window.set_text_in_position(
            "Lv",
            BattleStatusWindow.LEVEL.LABEL_X,
            BattleStatusWindow.LEVEL.LABEL_Y,
            false,
            false,
            undefined,
            false,
            BattleStatusWindow.GROUP_KEY
        );
        this.level_value = this.window.set_text_in_position(
            "",
            BattleStatusWindow.LEVEL.VALUE_END_X,
            BattleStatusWindow.LEVEL.VALUE_Y,
            true,
            false,
            undefined,
            false,
            BattleStatusWindow.GROUP_KEY
        );

        this.window.set_text_in_position(
            "Exp",
            BattleStatusWindow.EXP.LABEL_X,
            BattleStatusWindow.EXP.LABEL_Y,
            false,
            false,
            undefined,
            false,
            BattleStatusWindow.GROUP_KEY
        );
        this.exp_value = this.window.set_text_in_position(
            "",
            BattleStatusWindow.EXP.VALUE_END_X,
            BattleStatusWindow.EXP.VALUE_Y,
            true,
            false,
            undefined,
            false,
            BattleStatusWindow.GROUP_KEY
        );
        this.normal_status = this.window.set_text_in_position(
            "",
            BattleStatusWindow.NORMAL_STATUS.X,
            BattleStatusWindow.NORMAL_STATUS.Y,
            false,
            false,
            undefined,
            false,
            BattleStatusWindow.GROUP_KEY
        );

        this.window.set_text_in_position(
            "HP",
            BattleStatusWindow.HP.LABEL_X,
            BattleStatusWindow.HP.LABEL_Y,
            false,
            false,
            undefined,
            false,
            BattleStatusWindow.GROUP_KEY
        );
        this.max_hp = this.window.set_text_in_position(
            "",
            BattleStatusWindow.HP.MAX_END_X,
            BattleStatusWindow.HP.MAX_Y,
            true,
            false,
            undefined,
            false,
            BattleStatusWindow.GROUP_KEY
        );
        this.curr_hp = this.window.set_text_in_position(
            "/",
            BattleStatusWindow.HP.CURR_END_X,
            BattleStatusWindow.HP.CURR_Y,
            true,
            false,
            undefined,
            false,
            BattleStatusWindow.GROUP_KEY
        );

        this.window.set_text_in_position(
            "PP",
            BattleStatusWindow.PP.LABEL_X,
            BattleStatusWindow.PP.LABEL_Y,
            false,
            false,
            undefined,
            false,
            BattleStatusWindow.GROUP_KEY
        );
        this.max_pp = this.window.set_text_in_position(
            "",
            BattleStatusWindow.PP.MAX_END_X,
            BattleStatusWindow.PP.MAX_Y,
            true,
            false,
            undefined,
            false,
            BattleStatusWindow.GROUP_KEY
        );
        this.curr_pp = this.window.set_text_in_position(
            "/",
            BattleStatusWindow.PP.CURR_END_X,
            BattleStatusWindow.PP.CURR_Y,
            true,
            false,
            undefined,
            false,
            BattleStatusWindow.GROUP_KEY
        );

        const shift = BattleStatusWindow.STATS.LINE_SHIFT;

        this.window.set_text_in_position(
            "Attack",
            BattleStatusWindow.STATS.LABEL_X,
            BattleStatusWindow.STATS.LABEL_Y,
            false,
            false,
            undefined,
            false,
            BattleStatusWindow.GROUP_KEY
        );
        this.atk_value = this.window.set_text_in_position(
            "",
            BattleStatusWindow.STATS.VALUE_END_X,
            BattleStatusWindow.STATS.VALUE_Y,
            true,
            false,
            undefined,
            false,
            BattleStatusWindow.GROUP_KEY
        );
        this.window.set_text_in_position(
            "Defense",
            BattleStatusWindow.STATS.LABEL_X,
            BattleStatusWindow.STATS.LABEL_Y + shift,
            false,
            false,
            undefined,
            false,
            BattleStatusWindow.GROUP_KEY
        );
        this.def_value = this.window.set_text_in_position(
            "",
            BattleStatusWindow.STATS.VALUE_END_X,
            BattleStatusWindow.STATS.VALUE_Y + shift,
            true,
            false,
            undefined,
            false,
            BattleStatusWindow.GROUP_KEY
        );
        this.window.set_text_in_position(
            "Agility",
            BattleStatusWindow.STATS.LABEL_X,
            BattleStatusWindow.STATS.LABEL_Y + 2 * shift,
            false,
            false,
            undefined,
            false,
            BattleStatusWindow.GROUP_KEY
        );
        this.agi_value = this.window.set_text_in_position(
            "",
            BattleStatusWindow.STATS.VALUE_END_X,
            BattleStatusWindow.STATS.VALUE_Y + 2 * shift,
            true,
            false,
            undefined,
            false,
            BattleStatusWindow.GROUP_KEY
        );
        this.window.set_text_in_position(
            "Luck",
            BattleStatusWindow.STATS.LABEL_X,
            BattleStatusWindow.STATS.LABEL_Y + 3 * shift,
            false,
            false,
            undefined,
            false,
            BattleStatusWindow.GROUP_KEY
        );
        this.luk_value = this.window.set_text_in_position(
            "",
            BattleStatusWindow.STATS.VALUE_END_X,
            BattleStatusWindow.STATS.VALUE_Y + 3 * shift,
            true,
            false,
            undefined,
            false,
            BattleStatusWindow.GROUP_KEY
        );

        this.class_name = this.window.set_text_in_position(
            "",
            BattleStatusWindow.CLASS_NAME.X,
            BattleStatusWindow.CLASS_NAME.Y,
            false,
            false,
            undefined,
            false,
            BattleStatusWindow.GROUP_KEY
        );

        this.in_the_back = this.window.set_text_in_position(
            "",
            BattleStatusWindow.IN_THE_BACK.X,
            BattleStatusWindow.IN_THE_BACK.Y,
            false,
            false,
            undefined,
            false,
            BattleStatusWindow.GROUP_KEY
        );

        this.desc_line1 = this.window.set_text_in_position(
            "",
            BattleStatusWindow.DESCRIPTION.X,
            BattleStatusWindow.DESCRIPTION.LINE1_Y,
            false,
            false,
            undefined,
            false,
            BattleStatusWindow.GROUP_KEY
        );
        this.desc_line2 = this.window.set_text_in_position(
            "",
            BattleStatusWindow.DESCRIPTION.X,
            BattleStatusWindow.DESCRIPTION.LINE2_Y,
            false,
            false,
            undefined,
            false,
            BattleStatusWindow.GROUP_KEY
        );
    }

    private update_info() {
        const char = this.selected_char;
        const party = this.data.info.party_data.members;
        let char_index = -1;

        this.battle_effects = [];

        for (let index in party) {
            if (party[index].key_name === this.selected_char.key_name) char_index = parseInt(index);
            break;
        }

        this.window.update_text(char.name, this.name);
        this.window.update_text(char.level, this.level_value);
        this.window.update_text(char.current_exp, this.exp_value);

        this.window.update_text(char.class.name, this.class_name);
        this.window.update_text(char_index >= Battle.MAX_CHARS_IN_BATTLE ? "In the back" : "", this.in_the_back);

        if (this.update_effects() !== 0) this.window.update_text("", this.normal_status);
        else this.window.update_text("Normal", this.normal_status);

        this.window.update_text(char.max_hp, this.max_hp);
        this.window.update_text(char.current_hp + "/", this.curr_hp);
        this.window.update_text(char.max_pp, this.max_pp);
        this.window.update_text(char.current_pp + "/", this.curr_pp);

        this.window.update_text(char.atk, this.atk_value);
        this.window.update_text(char.def, this.def_value);
        this.window.update_text(char.agi, this.agi_value);
        this.window.update_text(char.luk, this.luk_value);
    }

    private update_effects() {
        const status_effects = this.get_status_effects();
        const buffs_debuffs = this.get_buffs_debuffs();

        const effects = [];

        for (let index in status_effects) {
            const effect: BattleStatusEffect = {key: null, properties: null};

            effect.key = status_effects[index];

            if (status_effects[index] === temporary_status.DEATH_CURSE) {
                const main_char_effect = _.find(this.selected_char.effects, {
                    status_key_name: temporary_status.DEATH_CURSE,
                });
                effect.properties.turns = this.selected_char.get_effect_turns_count(main_char_effect);
            }

            if (effects.length < BattleStatusWindow.MAX_EFFECTS_DISPLAYED) effects.push(effect);
        }

        for (let index in buffs_debuffs) {
            const effect: BattleStatusEffect = {key: null, properties: {value: null}};

            let modifier = null;

            if (buffs_debuffs[index].stat === effect_types.RESIST || buffs_debuffs[index].stat === effect_types.POWER) {
                for (let element in elements) {
                    if (buffs_debuffs[index].value[elements[element]] < 0) {
                        if (modifier === null) {
                            modifier = "down";
                        } else if (modifier === "up") {
                            modifier === "up_down";
                        }
                    } else if (buffs_debuffs[index].value[elements[element]] > 0) {
                        if (modifier === null) {
                            modifier = "up";
                        } else if (modifier === "down") {
                            modifier = "up_down";
                        }
                    }
                }
            } else if (buffs_debuffs[index].stat in effect_type_stat) {
                if (effect.properties.value >= 0) modifier = "up";
                else modifier = "down";
            }

            if (modifier === null) continue;

            effect.key = buffs_debuffs[index].stat;
            effect.properties.modifier = modifier;
            effect.properties.value = buffs_debuffs[index].value;

            if (effects.length < BattleStatusWindow.MAX_EFFECTS_DISPLAYED) effects.push(effect);
        }

        this.battle_effects = effects;
        return this.battle_effects.length;
    }

    private get_buffs_debuffs() {
        const effects: {stat: effect_types; value: BattleStatusEffect["properties"]["value"]}[] = [];

        const stat_keys = [effect_types.ATTACK, effect_types.DEFENSE, effect_types.AGILITY];

        for (let i = 0; i < stat_keys.length; i++) {
            const val =
                this.selected_char[effect_type_stat[stat_keys[i]]] -
                this.selected_char.preview_stat_without_abilities_effect(effect_type_stat[stat_keys[i]]);
            if (val !== 0) {
                const effect = {stat: stat_keys[i], value: val};
                effects.push(effect);
            }
        }

        const elemental_base = this.selected_char.preview_elemental_stats_without_abilities_effect();

        const power_value: BattleStatusEffect["properties"]["value"] = ordered_elements.reduce((obj, elem) => {
            obj[elem] = this.selected_char.current_power[elem] - elemental_base[elem].power;
            return obj;
        }, {});
        const resist_value: BattleStatusEffect["properties"]["value"] = ordered_elements.reduce((obj, elem) => {
            obj[elem] = this.selected_char.current_resist[elem] - elemental_base[elem].resist;
            return obj;
        }, {});

        if (_.some(power_value)) {
            effects.push({stat: effect_types.POWER, value: power_value});
        }
        if (_.some(resist_value)) {
            effects.push({stat: effect_types.RESIST, value: resist_value});
        }

        return effects;
    }

    private get_status_effects(menu?: boolean) {
        if (menu) {
            return _.sortBy([...this.data.info.main_char_list[this.selected_char.key_name].permanent_status], s =>
                ordered_status_menu.indexOf(s)
            );
        } else {
            return _.sortBy(
                ([...this.data.info.main_char_list[this.selected_char.key_name].temporary_status] as (
                    | permanent_status
                    | temporary_status
                )[]).concat([...this.data.info.main_char_list[this.selected_char.key_name].permanent_status]),
                s => ordered_status_battle.indexOf(s)
            );
        }
    }

    private set_sprites() {
        if (this.battle_sprite) this.battle_sprite.destroy();
        if (this.avatar) this.avatar.destroy();

        if (this.effect_sprites.length > 0) {
            for (let index in this.effect_sprites) {
                this.effect_sprites[index].destroy();
            }
            this.effect_sprites = [];
        }

        this.avatar = this.window.create_at_group(
            BattleStatusWindow.AVATAR.X,
            BattleStatusWindow.AVATAR.Y,
            "avatars",
            undefined,
            this.selected_char.key_name,
            BattleStatusWindow.GROUP_KEY
        );

        const sprite_key = this.selected_char.sprite_base.getActionKey(base_actions.BATTLE);
        const sprite_base = this.data.info.main_char_list[this.selected_char.key_name].sprite_base;

        this.battle_sprite = this.window.create_at_group(
            BattleStatusWindow.BATTLESPRITE.CENTER_X,
            BattleStatusWindow.BATTLESPRITE.END_Y,
            sprite_key,
            undefined,
            undefined,
            BattleStatusWindow.GROUP_KEY
        );
        this.battle_sprite.anchor.setTo(0.5, 1);

        sprite_base.setAnimation(this.battle_sprite, base_actions.BATTLE);
        this.battle_sprite.animations.play(sprite_base.getAnimationKey(base_actions.BATTLE, "idle_back"));

        //TO DO: add shadow
        //TO DO: add weapon

        if (this.battle_effects.length > 0) {
            for (let index in this.battle_effects) {
                const effect = this.battle_effects[index];
                let key = effect.key as String;
                if (
                    effect.key in effect_type_stat ||
                    effect.key === effect_types.RESIST ||
                    effect.key === effect_types.POWER
                ) {
                    key = key + "_" + effect.properties.modifier;
                }

                const x_pos = BattleStatusWindow.EFFECTS.X + parseInt(index) * BattleStatusWindow.EFFECTS.SHIFT;
                const y_pos = BattleStatusWindow.EFFECTS.Y;

                const sprite = this.window.create_at_group(
                    x_pos,
                    y_pos,
                    "battle_effect_icons",
                    undefined,
                    key,
                    BattleStatusWindow.GROUP_KEY
                );
                this.effect_sprites.push(sprite);
            }
        }
    }

    private change_character(new_char: MainChar) {
        this.selected_char = new_char;
        this.update_info();
        this.set_sprites();

        this.change_state(this.current_state);
    }

    private next_char() {
        const party = this.data.info.party_data.members;
        let char_index = -1;

        for (let index in party) {
            if (party[index].key_name === this.selected_char.key_name) {
                char_index = parseInt(index);
                break;
            }
        }

        this.change_character(party[(char_index + 1) % party.length]);
    }

    private previous_char() {
        const party = this.data.info.party_data.members;
        let char_index = -1;

        for (let index in party) {
            if (party[index].key_name === this.selected_char.key_name) {
                char_index = parseInt(index);
                break;
            }
        }

        this.change_character(party[(char_index + party.length - 1) % party.length]);
    }

    public grant_control() {
        const controls = [
            {button: Button.A, on_down: this.trigger_state_change.bind(this), sfx: {down: "menu/positive"}},
            {button: Button.B, on_down: this.close.bind(this, this.close_callback)},
            {button: Button.L, on_down: this.previous_char.bind(this), sfx: {down: "menu/move"}},
            {button: Button.R, on_down: this.next_char.bind(this), sfx: {down: "menu/move"}},
            {
                button: Button.LEFT,
                on_down: this.current_component.on_left.bind(this.current_component),
                sfx: {down: "menu/move"},
            },
            {
                button: Button.RIGHT,
                on_down: this.current_component.on_right.bind(this.current_component),
                sfx: {down: "menu/move"},
            },
            {
                button: Button.UP,
                on_down: this.current_component.on_up.bind(this.current_component),
                sfx: {down: "menu/move"},
            },
            {
                button: Button.DOWN,
                on_down: this.current_component.on_down.bind(this.current_component),
                sfx: {down: "menu/move"},
            },
        ];

        this.data.control_manager.add_controls(controls, {
            loop_config: {vertical: true, horizontal: true, shoulder: true},
        });
    }

    public trigger_state_change() {
        if (this.current_state === BattleStatusStates.ITEMS) this.current_state = BattleStatusStates.STATISTICS;
        else this.current_state++;

        this.change_state(this.current_state, true);
    }

    private change_state(new_state: BattleStatusStates, reset_pos: boolean = false) {
        let pos = {line: 0, col: 0};

        if (this.current_component) {
            if (!reset_pos) pos = this.current_component.current_pos;

            this.current_component.clear();
            this.current_component = null;
        }

        this.current_state = new_state;
        this.current_component = this.components[this.current_state];

        this.current_component.reset(pos);
        this.draw_seprartor();
        this.grant_control();
    }

    private draw_seprartor() {
        const shift = this.current_state !== BattleStatusStates.STATISTICS;
        this.window.clear_separators();

        const separator_x = BattleStatusWindow.SEPARATOR.X;
        const separator_y = BattleStatusWindow.SEPARATOR.Y + (shift ? BattleStatusWindow.SEPARATOR.SHIFT : 0);
        const separator_width = BattleStatusWindow.SEPARATOR.WIDTH;

        this.window.draw_separator(separator_x, separator_y, separator_x + separator_width, separator_y, false);

        this.desc_shifted = shift;
    }

    public update_description(line1: string, line2?: string) {
        if (line2 === undefined) {
            this.window.update_text("", this.desc_line1);
            this.window.update_text(line1, this.desc_line2);
        } else {
            this.window.update_text(line1, this.desc_line1);
            this.window.update_text(line2, this.desc_line2);
        }
    }

    public open(selected_char?: MainChar, close_callback?: Function, open_callback?: Function) {
        if (!selected_char) this.selected_char = this.data.info.party_data.members[0];
        else this.selected_char = selected_char;

        this.close_callback = close_callback;

        this.window.show(() => {
            this.update_info();
            this.set_sprites();
            this.change_state(BattleStatusStates.STATISTICS);

            if (open_callback) {
                open_callback();
            }
        });
    }

    public clear_component() {
        this.current_component.clear();
        this.current_state = null;
        this.current_component = null;
    }

    public close(callback?: Function) {
        this.data.control_manager.reset();
        this.clear_component();
        this.window.close(callback);
    }
}
