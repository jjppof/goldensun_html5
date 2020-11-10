import {StatusComponent} from "./StatusComponent";
import {Window} from "../Window";
import {GoldenSun} from "../GoldenSun";
import {CursorManager, PointVariants} from "../utils/CursorManager";
import {BattleStatusWindow} from "../windows/battle/BattleStatusWindow";
import {effect_type_stat, ordered_status_battle, permanent_status, temporary_status} from "../Player";
import {elements, element_names, ordered_elements} from "../utils";
import {effect_names, effect_types} from "../Effect";
import {djinn_status} from "../Djinn";
import * as _ from "lodash";

export enum Statistics {
    NAME,
    EXP,
    HP,
    PP,
    CLASS,
    DJINN,
    ELEM_LEVELS,
    ELEM_POWER,
    ELEM_RESIST,
}

export class StatusStatistics extends StatusComponent {
    public static readonly BattleStatusMsgs = {
        [temporary_status.DELUSION]: {
            line1: "Delusions misdirect your attacks.",
            line2: "Cure with Elixer or Restore.",
        },
        [temporary_status.STUN]: {line1: "You are stunned and cannot act.", line2: "Cure with Elixer or Restore."},
        [temporary_status.SLEEP]: {line1: "Sleep prevents you from acting.", line2: "Wake with Elixer or Restore."},
        [temporary_status.SEAL]: {line1: "Your Psynergy is sealed.", line2: "Cure with Elixer or Restore."},
        [temporary_status.DEATH_CURSE]: {
            line1: (turns: number) => `You will be downed in ${turns} turns.`,
            line2: "Cure wth Elixer or Restore.",
        },
        [permanent_status.DOWNED]: {line1: "You are down. Heal at a Sanctum", line2: "or use Revive or Water of Life."},
        [permanent_status.POISON]: {
            line1: "A mild poison wracks your body.",
            line2: "Cure with Antidote or Cure Poison.",
        },
        [permanent_status.VENOM]: {
            line1: "A vile poison wracks your body.",
            line2: "Cure with Antidote or Cure Poison.",
        },
        [permanent_status.EQUIP_CURSE]: {
            line1: "A cursed item binds your actions.",
            line2: "Remove the item at a Sanctum.",
        },
        [permanent_status.HAUNT]: {line1: "An evil spirit wounds you.", line2: "Exorcise it at a Sanctum."},
    };

    public static readonly BattleBuffMsgs = {
        up: {
            [effect_types.ATTACK]: {line1: (value: number) => `Attack increased by ${value}.`, line2: ""},
            [effect_types.DEFENSE]: {line1: (value: number) => `Defense increased by ${value}.`, line2: ""},
            [effect_types.AGILITY]: {line1: (value: number) => `Agility increased by ${value}.`, line2: ""},
        },
        down: {
            [effect_types.ATTACK]: {
                line1: (value: number) => `Attack dropped by ${value}.`,
                line2: "Increase with spells like Impact.",
            },
            [effect_types.DEFENSE]: {
                line1: (value: number) => `Defense dropped by ${value}.`,
                line2: "Increase with spells like Guard.",
            },
            [effect_types.AGILITY]: {line1: (value: number) => `Agility dropped by ${value}.`, line2: ""},
        },
    };

    public static readonly MenuStatusMsgs = {
        [permanent_status.DOWNED]: {line1: "You are down. Revive at a Sanctum", line2: "or with the Water of Life."},
        [permanent_status.POISON]: {line1: "You're afflicted by poison.", line2: "Cure with Antidote or Cure Poison."},
        [permanent_status.VENOM]: {line1: "You're afflicted by venom.", line2: "Cure with Antidote or Cure Poison."},
        [permanent_status.EQUIP_CURSE]: {line1: "A cursed item immoblizes you.", line2: "Remove it at a Sanctum."},
        [permanent_status.HAUNT]: {
            line1: "You receve damage from spirits.",
            line2: "Exorcise the spirits at a Sanctum.",
        },
    };

    public static readonly StatisticsMsgs = {
        0: {line1: "Use the L & R Buttons to", line2: "switch between characters."},
        1: {line1: "Current experience points.", line2: (exp: number) => `${exp} to next level.`},
        2: {line1: "Your current and maximum HP.", line2: "Affected by Djinn and equipment."},
        3: {line1: "Your current and maximum PP.", line2: "Affected by Djinn and equipment."},
        4: {line1: "Your current class. Your", line2: "class changes when you set Djinn."},
        5: {line1: "The number of Djinn currently set", line2: "and your total number of Djinn."},
        6: {line1: "Your Elemental Levels. These", line2: "reflect your skill in each element."},
        7: {line1: "Power reflects the damage you", line2: "can do with each element."},
        8: {line1: "Resist reflects your defensive", line2: "strength against each element."},
    };

    public static readonly CURSOR = {
        0: {X: 31, Y: 15},
        1: {X: 79, Y: 23},
        2: {X: 111, Y: 39},
        3: {X: 111, Y: 47},
        4: {X: 39, Y: 63},
        5: {X: 119, Y: 87},
        6: {X: 119, Y: 95},
        7: {X: 119, Y: 103},
        8: {X: 119, Y: 111},
        EFFECT: {X: 119, Y: 15, SHIFT: 16},
    };
    public static readonly HIGHLIGHT = {
        0: {X: 8, Y: 8, WIDTH: 96, HEIGHT: 8},
        1: {X: 8, Y: 16, WIDTH: 104, HEIGHT: 8},
        2: {X: 48, Y: 32, WIDTH: 88, HEIGHT: 8},
        3: {X: 48, Y: 40, WIDTH: 88, HEIGHT: 8},
        4: {X: 8, Y: 56, WIDTH: 80, HEIGHT: 8},
        5: {X: 8, Y: 80, WIDTH: 160, HEIGHT: 8},
        6: {X: 8, Y: 88, WIDTH: 160, HEIGHT: 8},
        7: {X: 8, Y: 96, WIDTH: 160, HEIGHT: 8},
        8: {X: 8, Y: 104, WIDTH: 160, HEIGHT: 8},
        EFFECT: {X: 112, Y: 8, WIDTH: 16, HEIGHT: 16, SHIFT: 16},
        NORMAL: {X: 120, Y: 8, WIDTH: 80, HEIGHT: 8},
    };

    public static readonly LINES = 9;

    public static readonly STARS_X = 65;
    public static readonly STARS_Y = 73;
    public static readonly STARS_SHIFT = 32;

    public static readonly LABEL_X = 8;
    public static readonly LABEL_Y = 80;
    public static readonly LABEL_SHIFT = 8;

    public static readonly NUMBERS_END_X = 69;
    public static readonly NUMBERS_Y = 80;
    public static readonly NUMBERS_X_SHIFT = 32;
    public static readonly NUMBERS_Y_SHIFT = 8;

    public constructor(
        game: Phaser.Game,
        data: GoldenSun,
        window: Window,
        manager: BattleStatusWindow,
        pos?: {line: number; col: number}
    ) {
        super(game, data, window, manager, pos);
    }

    public select_option() {
        const highlight = {x: 0, y: 0, width: 0, height: 0};
        let cursor_x = 0;
        let cursor_y = 0;

        if (this.current_col === 0) {
            highlight.x = StatusStatistics.HIGHLIGHT[this.current_line].X;
            highlight.y = StatusStatistics.HIGHLIGHT[this.current_line].Y;
            highlight.width = StatusStatistics.HIGHLIGHT[this.current_line].WIDTH;
            highlight.height = StatusStatistics.HIGHLIGHT[this.current_line].HEIGHT;

            cursor_x = StatusStatistics.CURSOR[this.current_line].X;
            cursor_y = StatusStatistics.CURSOR[this.current_line].Y;
        } else {
            if (this.manager.battle_effects_array.length === 0) {
                highlight.x = StatusStatistics.HIGHLIGHT.NORMAL.X;
                highlight.y = StatusStatistics.HIGHLIGHT.NORMAL.Y;
                highlight.width = StatusStatistics.HIGHLIGHT.NORMAL.WIDTH;
                highlight.height = StatusStatistics.HIGHLIGHT.NORMAL.HEIGHT;
            } else {
                let highlight_shift = StatusStatistics.HIGHLIGHT.EFFECT.SHIFT;
                highlight.x = StatusStatistics.HIGHLIGHT.EFFECT.X + highlight_shift * (this.current_col - 1);
                highlight.y = StatusStatistics.HIGHLIGHT.EFFECT.Y;
                highlight.width = StatusStatistics.HIGHLIGHT.EFFECT.WIDTH;
                highlight.height = StatusStatistics.HIGHLIGHT.EFFECT.HEIGHT;
            }

            const cursor_shift = StatusStatistics.CURSOR.EFFECT.SHIFT;
            cursor_x = StatusStatistics.CURSOR.EFFECT.X + cursor_shift * (this.current_col - 1);
            cursor_y = StatusStatistics.CURSOR.EFFECT.Y;
        }
        this.update_highlight(highlight);

        const cursor_tween = {type: CursorManager.CursorTweens.POINT, variant: PointVariants.SHORT};
        this.data.cursor_manager.move_to(
            {x: cursor_x, y: cursor_y},
            {animate: false, flip: true, tween_config: cursor_tween}
        );
    }

    public on_change() {
        this.select_option();
        if (this.current_col === 0) {
            const msgs = {
                line1: StatusStatistics.StatisticsMsgs[this.current_line].line1,
                line2: StatusStatistics.StatisticsMsgs[this.current_line].line2,
            };

            if (this.current_line === Statistics.EXP) {
                const char = this.manager.selected_character;
                const exp = char.exp_curve[char.level] - char.current_exp;
                msgs.line2 = msgs.line2(exp);
            }
            this.manager.update_description(msgs.line1, msgs.line2);
        } else {
            if (this.manager.battle_effects_array.length === 0) {
                this.manager.update_description("Normal status.", "");
            } else {
                const effect = this.manager.battle_effects_array[this.current_col - 1];

                let msgs = null;
                if (ordered_status_battle.includes(effect.key as temporary_status | permanent_status)) {
                    msgs = {
                        line1: StatusStatistics.BattleStatusMsgs[effect.key].line1,
                        line2: StatusStatistics.BattleStatusMsgs[effect.key].line2,
                    };

                    if (effect.key === temporary_status.DEATH_CURSE) {
                        const turns = effect.properties.turns ? effect.properties.turns : 0;
                        msgs.line1 = msgs.line1(turns);
                    }
                } else if (effect.key === effect_types.RESIST || effect.key === effect_types.POWER) {
                    let effect_name = "";
                    if ((effect.key = effect_types.RESIST)) effect_name = effect_names.resist;
                    else if ((effect.key = effect_types.RESIST)) effect_name = effect_names.power;

                    const elems_to_show = _.flatMap(elements, element =>
                        effect.properties.value[element]
                            ? [
                                  {
                                      element: element,
                                      value: effect.properties.value[element],
                                  },
                              ]
                            : []
                    );

                    msgs = {line1: "", line2: ""};

                    for (let i = 0; i < elems_to_show.length; i++) {
                        if (elems_to_show[i].value >= 0) elems_to_show[i].value = "+" + elems_to_show[i].value;
                        const element_name = element_names[elems_to_show[i].element];

                        const line = i < 2 ? "line1" : "line2";
                        msgs[line] +=
                            (i % 2 !== 0 ? ", " : "") + element_name + " " + effect_name + " " + elems_to_show[i].value;
                    }

                    if (msgs.line2 === "") msgs.line1 += ".";
                    else msgs.line2 += ".";
                } else if (effect.key in effect_type_stat) {
                    msgs = {
                        line1: StatusStatistics.BattleBuffMsgs[effect.properties.modifier][effect.key].line1,
                        line2: StatusStatistics.BattleBuffMsgs[effect.properties.modifier][effect.key].line2,
                    };

                    const value = effect.properties.value ? effect.properties.value : 0;
                    msgs.line1 = msgs.line1(value);
                }
                this.manager.update_description(msgs.line1, msgs.line2);
            }
        }
    }

    public on_left() {
        const effects_count = this.manager.battle_effects_array.length;

        if (effects_count === 0) this.current_col = this.current_col === 0 ? 1 : 0;
        else this.current_col = (this.current_col + (effects_count + 1) - 1) % (effects_count + 1);

        this.on_change();
    }

    public on_right() {
        const effects_count = this.manager.battle_effects_array.length;

        if (effects_count === 0) this.current_col = this.current_col === 0 ? 1 : 0;
        else this.current_col = (this.current_col + 1) % (effects_count + 1);

        this.on_change();
    }

    public on_up() {
        if (this.current_col !== 0) {
            this.current_col = 0;
            this.on_change();
        } else {
            this.current_line = (this.current_line + StatusStatistics.LINES - 1) % StatusStatistics.LINES;
            this.on_change();
        }
    }

    public on_down() {
        if (this.current_col !== 0) {
            this.current_col = 0;
            this.on_change();
        } else {
            this.current_line = (this.current_line + 1) % StatusStatistics.LINES;
            this.on_change();
        }
    }

    public initialize() {
        const stars = ["venus_star", "mercury_star", "mars_star", "jupiter_star"];
        for (let i = 0; i < stars.length; i++) {
            const x_pos = StatusStatistics.STARS_X + i * StatusStatistics.STARS_SHIFT;
            const y_pos = StatusStatistics.STARS_Y;

            const star = this.window.create_at_group(
                x_pos,
                y_pos,
                stars[i],
                undefined,
                undefined,
                StatusStatistics.GROUP_KEY
            );
            this.state_sprites.push(star);
        }

        const labels = ["Djinn", "Lv", "Power", "Resist"];

        for (let i = 0; i < labels.length; i++) {
            const x_pos = StatusStatistics.LABEL_X;
            const y_pos = StatusStatistics.LABEL_Y + i * StatusStatistics.LABEL_SHIFT;

            const label = this.window.set_text_in_position(
                labels[i],
                x_pos,
                y_pos,
                false,
                false,
                undefined,
                false,
                StatusStatistics.GROUP_KEY
            );
            this.state_sprites.push(label.text, label.shadow);
        }

        for (let i = 0; i < ordered_elements.length; i++) {
            const djinn_counts = this.get_djinn_counts(ordered_elements[i]);
            const elemental_stats = this.get_elemental_stats(ordered_elements[i]);

            const x_pos = StatusStatistics.NUMBERS_END_X + i * StatusStatistics.NUMBERS_X_SHIFT;
            let y_pos = StatusStatistics.NUMBERS_Y;
            let text = djinn_counts.set + "/" + djinn_counts.total;

            let numbers = this.window.set_text_in_position(
                text,
                x_pos,
                y_pos,
                true,
                false,
                undefined,
                false,
                StatusStatistics.GROUP_KEY
            );
            this.state_sprites.push(numbers.text, numbers.shadow);

            y_pos += StatusStatistics.NUMBERS_Y_SHIFT;
            text = String(elemental_stats.level);

            numbers = this.window.set_text_in_position(
                text,
                x_pos,
                y_pos,
                true,
                false,
                undefined,
                false,
                StatusStatistics.GROUP_KEY
            );
            this.state_sprites.push(numbers.text, numbers.shadow);

            y_pos += StatusStatistics.NUMBERS_Y_SHIFT;
            text = String(elemental_stats.power);

            numbers = this.window.set_text_in_position(
                text,
                x_pos,
                y_pos,
                true,
                false,
                undefined,
                false,
                StatusStatistics.GROUP_KEY
            );
            this.state_sprites.push(numbers.text, numbers.shadow);

            y_pos += StatusStatistics.NUMBERS_Y_SHIFT;
            text = String(elemental_stats.resistance);

            numbers = this.window.set_text_in_position(
                text,
                x_pos,
                y_pos,
                true,
                false,
                undefined,
                false,
                StatusStatistics.GROUP_KEY
            );
            this.state_sprites.push(numbers.text, numbers.shadow);
        }
    }

    private get_djinn_counts(element: elements) {
        let set_count = 0;
        let total_count = 0;
        let djinn_names = [];

        switch (element) {
            case elements.VENUS:
                djinn_names = this.manager.selected_character.venus_djinni;
                total_count = this.manager.selected_character.venus_djinni.length;
                break;
            case elements.MERCURY:
                djinn_names = this.manager.selected_character.mercury_djinni;
                total_count = this.manager.selected_character.mercury_djinni.length;
                break;
            case elements.MARS:
                djinn_names = this.manager.selected_character.mars_djinni;
                total_count = this.manager.selected_character.mars_djinni.length;
                break;
            case elements.JUPITER:
                djinn_names = this.manager.selected_character.jupiter_djinni;
                total_count = this.manager.selected_character.jupiter_djinni.length;
                break;
        }

        for (let index in djinn_names) {
            if (this.data.info.djinni_list[djinn_names[index]].status === djinn_status.SET) set_count++;
        }

        return {set: set_count, total: total_count};
    }

    private get_elemental_stats(element: elements) {
        let elemental_level = 0;
        let elemental_power = 0;
        let elemental_resistance = 0;

        switch (element) {
            case elements.VENUS:
                elemental_level = this.manager.selected_character.venus_level_current;
                elemental_power = this.manager.selected_character.venus_power_current;
                elemental_resistance = this.manager.selected_character.venus_resist_current;
                break;
            case elements.MERCURY:
                elemental_level = this.manager.selected_character.mercury_level_current;
                elemental_power = this.manager.selected_character.mercury_power_current;
                elemental_resistance = this.manager.selected_character.mercury_resist_current;
                break;
            case elements.MARS:
                elemental_level = this.manager.selected_character.mars_level_current;
                elemental_power = this.manager.selected_character.mars_power_current;
                elemental_resistance = this.manager.selected_character.mars_resist_current;
                break;
            case elements.JUPITER:
                elemental_level = this.manager.selected_character.jupiter_level_current;
                elemental_power = this.manager.selected_character.jupiter_power_current;
                elemental_resistance = this.manager.selected_character.jupiter_resist_current;
                break;
        }

        return {level: elemental_level, power: elemental_power, resistance: elemental_resistance};
    }
}
