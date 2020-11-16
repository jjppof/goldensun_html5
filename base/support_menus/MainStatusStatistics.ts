import {StatusComponent, StatusModes} from "./StatusComponent";
import {Window} from "../Window";
import {GoldenSun} from "../GoldenSun";
import {CursorManager, PointVariants} from "../utils/CursorManager";
import {BattleStatusWindow} from "../windows/battle/BattleStatusWindow";
import {effect_type_stat, ordered_status_battle, permanent_status, temporary_status} from "../Player";
import {elements, element_names, ordered_elements} from "../utils";
import * as _ from "lodash";
import {MainStatusMenu} from "../main_menus/MainStatusMenu";

export enum MainStatistics {
    NAME,
    EXP,
    HP,
    PP,
    DJINN,
    ELEM_LEVELS,
    ELEM_POWER,
    ELEM_RESIST,
}

export class MainStatusStatistics extends StatusComponent {
    public static readonly MenuStatusMsgs = {
        [permanent_status.DOWNED]: {
            line1: "You are down. Revive at a Sanctum",
            line2: "or with the Water of Life.",
        },
        [permanent_status.POISON]: {
            line1: "You're afflicted by poison.",
            line2: "Cure with Antidote or Cure Poison.",
        },
        [permanent_status.VENOM]: {
            line1: "You're afflicted by venom.",
            line2: "Cure with Antidote or Cure Poison.",
        },
        [permanent_status.EQUIP_CURSE]: {
            line1: "A cursed item immoblizes you.",
            line2: "Remove it at a Sanctum.",
        },
        [permanent_status.HAUNT]: {
            line1: "You receve damage from spirits.",
            line2: "Exorcise the spirits at a Sanctum.",
        },
    };

    public static readonly MenuDescriptions = {
        [MainStatistics.NAME]: {line1: "Your name and level. Experience", line2: "points increase your level."},
        [MainStatistics.EXP]: {
            line1: "Experience points. You need",
            line2: (exp: number) => `${exp} more to reach the next level.`,
        },
        [MainStatistics.HP]: {line1: "Your current and max Hit Points.", line2: "At zero HP you cannot fight."},
        [MainStatistics.PP]: {line1: "Your Psynergy Points. They", line2: "recover as you travel."},
        [MainStatistics.DJINN]: {line1: "Your Djinn. This also shows", line2: "which ones are set."},
        [MainStatistics.ELEM_LEVELS]: {
            line1: "Elemental Levels indicate the skill",
            line2: "level of the elemental attribute.",
        },
        [MainStatistics.ELEM_POWER]: {line1: "Power reflects the damage you", line2: "can do with each element."},
        [MainStatistics.ELEM_RESIST]: {
            line1: "Resist reflects your defensive",
            line2: "strength against each element.",
        },
    };

    public static readonly CURSOR = {
        [MainStatistics.NAME]: {X: 31, Y: 15},
        [MainStatistics.EXP]: {X: 79, Y: 23},
        [MainStatistics.HP]: {X: 111, Y: 39},
        [MainStatistics.PP]: {X: 111, Y: 47},
        [MainStatistics.DJINN]: {X: 119, Y: 87},
        [MainStatistics.ELEM_LEVELS]: {X: 119, Y: 95},
        [MainStatistics.ELEM_POWER]: {X: 119, Y: 103},
        [MainStatistics.ELEM_RESIST]: {X: 119, Y: 111},
        EFFECT: {X: 119, Y: 15, SHIFT: 16},
    };
    public static readonly HIGHLIGHT = {
        [MainStatistics.NAME]: {X: 8, Y: 8, WIDTH: 96, HEIGHT: 8},
        [MainStatistics.EXP]: {X: 8, Y: 16, WIDTH: 104, HEIGHT: 8},
        [MainStatistics.HP]: {X: 48, Y: 32, WIDTH: 88, HEIGHT: 8},
        [MainStatistics.PP]: {X: 48, Y: 40, WIDTH: 88, HEIGHT: 8},
        [MainStatistics.DJINN]: {X: 8, Y: 80, WIDTH: 160, HEIGHT: 8},
        [MainStatistics.ELEM_LEVELS]: {X: 8, Y: 88, WIDTH: 160, HEIGHT: 8},
        [MainStatistics.ELEM_POWER]: {X: 8, Y: 96, WIDTH: 160, HEIGHT: 8},
        [MainStatistics.ELEM_RESIST]: {X: 8, Y: 104, WIDTH: 160, HEIGHT: 8},
        EFFECT: {X: 112, Y: 8, WIDTH: 16, HEIGHT: 16, SHIFT: 16},
        NORMAL: {X: 120, Y: 8, WIDTH: 80, HEIGHT: 8},
    };
    private static readonly ELEM = {
        STARS: {X: 65, Y: 73},
        STARS_SHIFT: 32,
        LABEL: {X: 8, Y: 80},
        LABEL_SHIFT: 8,
        NUMBERS: {END_X: 69, Y: 80, X_SHIFT: 32, Y_SHIFT: 8},
    };
    private static readonly EXP = {
        LABEL_X: 8,
        LABEL_Y: 16,
        VALUE_END_X: 109,
        VALUE_Y: 16,
    };
    private static readonly NORMAL_STATUS = {
        X: 120,
        Y: 8,
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
        ICON_X: 112,
        ICON_Y: 8,
        NAME_X: 0,
        NAME_Y: 0,
        SHIFT: 16,
    };

    private static readonly LINES = 8;

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
            highlight.x = MainStatusStatistics.HIGHLIGHT[this.current_line].X;
            highlight.y = MainStatusStatistics.HIGHLIGHT[this.current_line].Y;
            highlight.width = MainStatusStatistics.HIGHLIGHT[this.current_line].WIDTH;
            highlight.height = MainStatusStatistics.HIGHLIGHT[this.current_line].HEIGHT;

            cursor_x = MainStatusStatistics.CURSOR[this.current_line].X;
            cursor_y = MainStatusStatistics.CURSOR[this.current_line].Y;
        } else {
            if (this.battle_status_effects.length === 0) {
                highlight.x = MainStatusStatistics.HIGHLIGHT.NORMAL.X;
                highlight.y = MainStatusStatistics.HIGHLIGHT.NORMAL.Y;
                highlight.width = MainStatusStatistics.HIGHLIGHT.NORMAL.WIDTH;
                highlight.height = MainStatusStatistics.HIGHLIGHT.NORMAL.HEIGHT;
            } else {
                let highlight_shift = MainStatusStatistics.HIGHLIGHT.EFFECT.SHIFT;
                highlight.x = MainStatusStatistics.HIGHLIGHT.EFFECT.X + highlight_shift * (this.current_col - 1);
                highlight.y = MainStatusStatistics.HIGHLIGHT.EFFECT.Y;
                highlight.width = MainStatusStatistics.HIGHLIGHT.EFFECT.WIDTH;
                highlight.height = MainStatusStatistics.HIGHLIGHT.EFFECT.HEIGHT;
            }

            const cursor_shift = MainStatusStatistics.CURSOR.EFFECT.SHIFT;
            cursor_x = MainStatusStatistics.CURSOR.EFFECT.X + cursor_shift * (this.current_col - 1);
            cursor_y = MainStatusStatistics.CURSOR.EFFECT.Y;
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
        /*
        if (this.current_col === 0) {
            const msgs = {
                line1: MainStatusStatistics.BattleDescriptions[this.current_line].line1,
                line2: MainStatusStatistics.BattleDescriptions[this.current_line].line2,
            };

            if (this.current_line === Statistics.EXP) {
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
                        line1: MainStatusStatistics.BattleStatusMsgs[effect.key].line1,
                        line2: MainStatusStatistics.BattleStatusMsgs[effect.key].line2,
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
                        line1: MainStatusStatistics.BattleBuffMsgs[effect.properties.modifier][effect.key].line1,
                        line2: MainStatusStatistics.BattleBuffMsgs[effect.properties.modifier][effect.key].line2,
                    };

                    const value = effect.properties.value ? effect.properties.value : 0;
                    msgs.line1 = msgs.line1(value);
                }
                this.update_description(msgs.line1, msgs.line2);
            }
        }*/
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
        if (this.mode === StatusModes.BATTLE) {
            if (this.current_col !== 0) this.current_col = 0;
            else this.current_line = (this.current_line + MainStatusStatistics.LINES - 1) % MainStatusStatistics.LINES;
        } else if (this.mode === StatusModes.MENU) {
        }

        this.on_change();
    }

    public on_down() {
        if (this.mode === StatusModes.BATTLE) {
            if (this.current_col !== 0) this.current_col = 0;
            else this.current_line = (this.current_line + 1) % MainStatusStatistics.LINES;
        } else if (this.mode === StatusModes.MENU) {
        }

        this.on_change();
    }

    public initialize() {
        const stars = ["venus_star", "mercury_star", "mars_star", "jupiter_star"];
        for (let i = 0; i < stars.length; i++) {
            const x_pos = MainStatusStatistics.ELEM.STARS.X + i * MainStatusStatistics.ELEM.STARS_SHIFT;
            const y_pos = MainStatusStatistics.ELEM.STARS.Y;

            const star = this.window.create_at_group(
                x_pos,
                y_pos,
                stars[i],
                undefined,
                undefined,
                MainStatusStatistics.GROUP_KEY
            );
            this.state_sprites.push(star);
        }

        const labels = ["Djinn", "Lv", "Power", "Resist"];

        for (let i = 0; i < labels.length; i++) {
            const x_pos = MainStatusStatistics.ELEM.LABEL.X;
            const y_pos = MainStatusStatistics.ELEM.LABEL.Y + i * MainStatusStatistics.ELEM.LABEL_SHIFT;

            const label = this.window.set_text_in_position(
                labels[i],
                x_pos,
                y_pos,
                false,
                false,
                undefined,
                false,
                MainStatusStatistics.GROUP_KEY
            );
            this.state_sprites.push(label.text, label.shadow);
        }

        for (let i = 0; i < ordered_elements.length; i++) {
            const djinn_counts = this.get_djinn_counts(ordered_elements[i]);
            const elemental_stats = this.get_elemental_stats(ordered_elements[i]);

            const x_pos = MainStatusStatistics.ELEM.NUMBERS.END_X + i * MainStatusStatistics.ELEM.NUMBERS.X_SHIFT;
            let y_pos = MainStatusStatistics.ELEM.NUMBERS.Y;
            let text = djinn_counts.set + "/" + djinn_counts.total;

            let numbers = this.window.set_text_in_position(
                text,
                x_pos,
                y_pos,
                true,
                false,
                undefined,
                false,
                MainStatusStatistics.GROUP_KEY
            );
            this.state_sprites.push(numbers.text, numbers.shadow);

            y_pos += MainStatusStatistics.ELEM.NUMBERS.Y_SHIFT;
            text = String(elemental_stats.level);

            numbers = this.window.set_text_in_position(
                text,
                x_pos,
                y_pos,
                true,
                false,
                undefined,
                false,
                MainStatusStatistics.GROUP_KEY
            );
            this.state_sprites.push(numbers.text, numbers.shadow);

            y_pos += MainStatusStatistics.ELEM.NUMBERS.Y_SHIFT;
            text = String(elemental_stats.power);

            numbers = this.window.set_text_in_position(
                text,
                x_pos,
                y_pos,
                true,
                false,
                undefined,
                false,
                MainStatusStatistics.GROUP_KEY
            );
            this.state_sprites.push(numbers.text, numbers.shadow);

            y_pos += MainStatusStatistics.ELEM.NUMBERS.Y_SHIFT;
            text = String(elemental_stats.resistance);

            numbers = this.window.set_text_in_position(
                text,
                x_pos,
                y_pos,
                true,
                false,
                undefined,
                false,
                MainStatusStatistics.GROUP_KEY
            );
            this.state_sprites.push(numbers.text, numbers.shadow);
        }
    }
}
