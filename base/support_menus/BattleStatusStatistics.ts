import {StatusComponent} from "./StatusComponent";
import {Window} from "../Window";
import {GoldenSun} from "../GoldenSun";
import {CursorManager, PointVariants} from "../utils/CursorManager";
import {BattleStatusWindow} from "../windows/battle/BattleStatusWindow";
import {effect_type_stat, ordered_status_battle, permanent_status, temporary_status} from "../Player";
import {elements, element_names, ordered_elements} from "../utils";
import {effect_names, effect_types} from "../Effect";
import * as _ from "lodash";
import {MainStatusMenu} from "../main_menus/MainStatusMenu";

export enum BattleStatistics {
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

export class BattleStatusStatistics extends StatusComponent {
    public static readonly BattleStatusMsgs = {
        [temporary_status.DELUSION]: {
            line1: "Delusions misdirect your attacks.",
            line2: "Cure with Elixer or Restore.",
        },
        [temporary_status.STUN]: {
            line1: "You are stunned and cannot act.",
            line2: "Cure with Elixer or Restore.",
        },
        [temporary_status.SLEEP]: {
            line1: "Sleep prevents you from acting.",
            line2: "Wake with Elixer or Restore.",
        },
        [temporary_status.SEAL]: {
            line1: "Your Psynergy is sealed.",
            line2: "Cure with Elixer or Restore.",
        },
        [temporary_status.DEATH_CURSE]: {
            line1: (turns: number) => `You will be downed in ${turns} turns.`,
            line2: "Cure wth Elixer or Restore.",
        },
        [permanent_status.DOWNED]: {
            line1: "You are down. Heal at a Sanctum",
            line2: "or use Revive or Water of Life.",
        },
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
        [permanent_status.HAUNT]: {
            line1: "An evil spirit wounds you.",
            line2: "Exorcise it at a Sanctum.",
        },
    };

    public static readonly BattleBuffMsgs = {
        up: {
            [effect_types.ATTACK]: {
                line1: (value: number) => `Attack increased by ${value}.`,
                line2: "",
            },
            [effect_types.DEFENSE]: {
                line1: (value: number) => `Defense increased by ${value}.`,
                line2: "",
            },
            [effect_types.AGILITY]: {
                line1: (value: number) => `Agility increased by ${value}.`,
                line2: "",
            },
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
            [effect_types.AGILITY]: {
                line1: (value: number) => `Agility dropped by ${value}.`,
                line2: "",
            },
        },
    };

    public static readonly BattleDescriptions = {
        [BattleStatistics.NAME]: {line1: "Use the L & R Buttons to", line2: "switch between characters."},
        [BattleStatistics.EXP]: {line1: "Current experience points.", line2: (exp: number) => `${exp} to next level.`},
        [BattleStatistics.HP]: {line1: "Your current and maximum HP.", line2: "Affected by Djinn and equipment."},
        [BattleStatistics.PP]: {line1: "Your current and maximum PP.", line2: "Affected by Djinn and equipment."},
        [BattleStatistics.CLASS]: {line1: "Your current class. Your", line2: "class changes when you set Djinn."},
        [BattleStatistics.DJINN]: {
            line1: "The number of Djinn currently set",
            line2: "and your total number of Djinn.",
        },
        [BattleStatistics.ELEM_LEVELS]: {
            line1: "Your Elemental Levels. These",
            line2: "reflect your skill in each element.",
        },
        [BattleStatistics.ELEM_POWER]: {line1: "Power reflects the damage you", line2: "can do with each element."},
        [BattleStatistics.ELEM_RESIST]: {
            line1: "Resist reflects your defensive",
            line2: "strength against each element.",
        },
    };

    public static readonly CURSOR = {
        [BattleStatistics.NAME]: {X: 31, Y: 15},
        [BattleStatistics.EXP]: {X: 79, Y: 23},
        [BattleStatistics.HP]: {X: 111, Y: 39},
        [BattleStatistics.PP]: {X: 111, Y: 47},
        [BattleStatistics.CLASS]: {X: 39, Y: 63},
        [BattleStatistics.DJINN]: {X: 119, Y: 87},
        [BattleStatistics.ELEM_LEVELS]: {X: 119, Y: 95},
        [BattleStatistics.ELEM_POWER]: {X: 119, Y: 103},
        [BattleStatistics.ELEM_RESIST]: {X: 119, Y: 111},
        EFFECT: {X: 119, Y: 15, SHIFT: 16},
    };
    public static readonly HIGHLIGHT = {
        [BattleStatistics.NAME]: {X: 8, Y: 8, WIDTH: 96, HEIGHT: 8},
        [BattleStatistics.EXP]: {X: 8, Y: 16, WIDTH: 104, HEIGHT: 8},
        [BattleStatistics.HP]: {X: 48, Y: 32, WIDTH: 88, HEIGHT: 8},
        [BattleStatistics.PP]: {X: 48, Y: 40, WIDTH: 88, HEIGHT: 8},
        [BattleStatistics.CLASS]: {X: 8, Y: 56, WIDTH: 80, HEIGHT: 8},
        [BattleStatistics.DJINN]: {X: 8, Y: 80, WIDTH: 160, HEIGHT: 8},
        [BattleStatistics.ELEM_LEVELS]: {X: 8, Y: 88, WIDTH: 160, HEIGHT: 8},
        [BattleStatistics.ELEM_POWER]: {X: 8, Y: 96, WIDTH: 160, HEIGHT: 8},
        [BattleStatistics.ELEM_RESIST]: {X: 8, Y: 104, WIDTH: 160, HEIGHT: 8},
        EFFECT: {X: 112, Y: 8, WIDTH: 16, HEIGHT: 16, SHIFT: 16},
        NORMAL: {X: 120, Y: 8, WIDTH: 80, HEIGHT: 8},
    };

    private static readonly LINES = 9;
    private static readonly STARS = {X: 64, Y: 73};
    private static readonly STARS_SHIFT = 32;
    private static readonly LABEL = {X: 8, Y: 80};
    private static readonly LABEL_SHIFT = 8;
    private static readonly ELEM_NUMBERS = {END_X: 69, Y: 80, X_SHIFT: 32, Y_SHIFT: 8};

    public constructor(
        game: Phaser.Game,
        data: GoldenSun,
        window: Window,
        manager: BattleStatusWindow | MainStatusMenu,
        pos?: {line: number; col: number}
    ) {
        super(game, data, window, manager, pos);
    }

    public select_option() {
        const highlight = {x: 0, y: 0, width: 0, height: 0};
        let cursor_x = 0;
        let cursor_y = 0;

        if (this.current_col === 0) {
            highlight.x = BattleStatusStatistics.HIGHLIGHT[this.current_line].X;
            highlight.y = BattleStatusStatistics.HIGHLIGHT[this.current_line].Y;
            highlight.width = BattleStatusStatistics.HIGHLIGHT[this.current_line].WIDTH;
            highlight.height = BattleStatusStatistics.HIGHLIGHT[this.current_line].HEIGHT;

            cursor_x = BattleStatusStatistics.CURSOR[this.current_line].X;
            cursor_y = BattleStatusStatistics.CURSOR[this.current_line].Y;
        } else {
            if (this.battle_status_effects.length === 0) {
                highlight.x = BattleStatusStatistics.HIGHLIGHT.NORMAL.X;
                highlight.y = BattleStatusStatistics.HIGHLIGHT.NORMAL.Y;
                highlight.width = BattleStatusStatistics.HIGHLIGHT.NORMAL.WIDTH;
                highlight.height = BattleStatusStatistics.HIGHLIGHT.NORMAL.HEIGHT;
            } else {
                let highlight_shift = BattleStatusStatistics.HIGHLIGHT.EFFECT.SHIFT;
                highlight.x = BattleStatusStatistics.HIGHLIGHT.EFFECT.X + highlight_shift * (this.current_col - 1);
                highlight.y = BattleStatusStatistics.HIGHLIGHT.EFFECT.Y;
                highlight.width = BattleStatusStatistics.HIGHLIGHT.EFFECT.WIDTH;
                highlight.height = BattleStatusStatistics.HIGHLIGHT.EFFECT.HEIGHT;
            }

            const cursor_shift = BattleStatusStatistics.CURSOR.EFFECT.SHIFT;
            cursor_x = BattleStatusStatistics.CURSOR.EFFECT.X + cursor_shift * (this.current_col - 1);
            cursor_y = BattleStatusStatistics.CURSOR.EFFECT.Y;
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
                line1: BattleStatusStatistics.BattleDescriptions[this.current_line].line1,
                line2: BattleStatusStatistics.BattleDescriptions[this.current_line].line2,
            };

            if (this.current_line === BattleStatistics.EXP) {
                const char = this.selected_char;
                const exp = char.exp_curve[char.level] - char.current_exp;
                msgs.line2 = msgs.line2(exp);
            }
            this.update_description(msgs.line1, msgs.line2);
        } else {
            if (this.battle_status_effects.length === 0) {
                this.update_description("Normal status.", "");
            } else {
                const effect = this.battle_status_effects[this.current_col - 1];

                let msgs = null;
                if (ordered_status_battle.includes(effect.key as temporary_status | permanent_status)) {
                    msgs = {
                        line1: BattleStatusStatistics.BattleStatusMsgs[effect.key].line1,
                        line2: BattleStatusStatistics.BattleStatusMsgs[effect.key].line2,
                    };

                    if (effect.key === temporary_status.DEATH_CURSE) {
                        const turns = effect.properties.turns ? effect.properties.turns : 0;
                        msgs.line1 = msgs.line1(turns);
                    }
                } else if (effect.key === effect_types.RESIST || effect.key === effect_types.POWER) {
                    const effect_name = effect_names[effect.key];

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
                        line1: BattleStatusStatistics.BattleBuffMsgs[effect.properties.modifier][effect.key].line1,
                        line2: BattleStatusStatistics.BattleBuffMsgs[effect.properties.modifier][effect.key].line2,
                    };

                    const value = effect.properties.value ? effect.properties.value : 0;
                    msgs.line1 = msgs.line1(value);
                }
                this.update_description(msgs.line1, msgs.line2);
            }
        }
    }

    public on_left() {
        const effects_count = this.battle_status_effects.length;

        if (effects_count === 0) this.current_col = this.current_col === 0 ? 1 : 0;
        else this.current_col = (this.current_col + (effects_count + 1) - 1) % (effects_count + 1);

        this.on_change();
    }

    public on_right() {
        const effects_count = this.battle_status_effects.length;

        if (effects_count === 0) this.current_col = this.current_col === 0 ? 1 : 0;
        else this.current_col = (this.current_col + 1) % (effects_count + 1);

        this.on_change();
    }

    public on_up() {
        if (this.current_col !== 0) this.current_col = 0;
        else this.current_line = (this.current_line + BattleStatusStatistics.LINES - 1) % BattleStatusStatistics.LINES;

        this.on_change();
    }

    public on_down() {
        if (this.current_col !== 0) this.current_col = 0;
        else this.current_line = (this.current_line + 1) % BattleStatusStatistics.LINES;

        this.on_change();
    }

    public initialize() {
        for (let i = 0; i < ordered_elements.length; i++) {
            const x_pos = BattleStatusStatistics.STARS.X + i * BattleStatusStatistics.STARS_SHIFT;
            const y_pos = BattleStatusStatistics.STARS.Y;

            const star = this.window.create_at_group(
                x_pos,
                y_pos,
                "stars",
                undefined,
                ordered_elements[i],
                BattleStatusStatistics.GROUP_KEY
            );
            this.state_sprites.push(star);
        }

        const labels = ["Djinn", "Lv", "Power", "Resist"];

        for (let i = 0; i < labels.length; i++) {
            const x_pos = BattleStatusStatistics.LABEL.X;
            const y_pos = BattleStatusStatistics.LABEL.Y + i * BattleStatusStatistics.LABEL_SHIFT;

            const label = this.window.set_text_in_position(labels[i], x_pos, y_pos, {
                internal_group_key: BattleStatusStatistics.GROUP_KEY,
            });
            this.state_sprites.push(label.text, label.shadow);
        }

        for (let i = 0; i < ordered_elements.length; i++) {
            const djinn_counts = this.get_djinn_counts(ordered_elements[i]);
            const elemental_stats = this.get_elemental_stats(ordered_elements[i]);

            const x_pos = BattleStatusStatistics.ELEM_NUMBERS.END_X + i * BattleStatusStatistics.ELEM_NUMBERS.X_SHIFT;
            let y_pos = BattleStatusStatistics.ELEM_NUMBERS.Y;
            let text = djinn_counts.set + "/" + djinn_counts.total;

            let numbers = this.window.set_text_in_position(text, x_pos, y_pos, {
                right_align: true,
                internal_group_key: BattleStatusStatistics.GROUP_KEY,
            });
            this.state_sprites.push(numbers.text, numbers.shadow);

            y_pos += BattleStatusStatistics.ELEM_NUMBERS.Y_SHIFT;
            text = String(elemental_stats.level);

            numbers = this.window.set_text_in_position(text, x_pos, y_pos, {
                right_align: true,
                internal_group_key: BattleStatusStatistics.GROUP_KEY,
            });
            this.state_sprites.push(numbers.text, numbers.shadow);

            y_pos += BattleStatusStatistics.ELEM_NUMBERS.Y_SHIFT;
            text = String(elemental_stats.power);

            numbers = this.window.set_text_in_position(text, x_pos, y_pos, {
                right_align: true,
                internal_group_key: BattleStatusStatistics.GROUP_KEY,
            });
            this.state_sprites.push(numbers.text, numbers.shadow);

            y_pos += BattleStatusStatistics.ELEM_NUMBERS.Y_SHIFT;
            text = String(elemental_stats.resistance);

            numbers = this.window.set_text_in_position(text, x_pos, y_pos, {
                right_align: true,
                internal_group_key: BattleStatusStatistics.GROUP_KEY,
            });
            this.state_sprites.push(numbers.text, numbers.shadow);
        }
    }
}
