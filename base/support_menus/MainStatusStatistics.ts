import {StatusComponent} from "./StatusComponent";
import {Window} from "../Window";
import {GoldenSun} from "../GoldenSun";
import {CursorManager, PointVariants} from "../utils/CursorManager";
import {BattleStatusEffect, BattleStatusWindow} from "../windows/battle/BattleStatusWindow";
import {permanent_status} from "../Player";
import {elements, ordered_elements} from "../utils";
import * as _ from "lodash";
import {MainStatusMenu, MainStatusStates} from "../main_menus/MainStatusMenu";

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
        normal: {
            line1: "Your status is normal.",
            line2: "",
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

    public static readonly EFFECT_LABELS = {
        [permanent_status.DOWNED]: "Downed",
        [permanent_status.EQUIP_CURSE]: "Cursed",
        [permanent_status.HAUNT]: "Haunt",
        [permanent_status.POISON]: "Poison",
        [permanent_status.VENOM]: "Venom",
    };

    public static readonly CURSOR = {
        [MainStatistics.NAME]: {X: 34, Y: 54},
        [MainStatistics.EXP]: {X: 34, Y: 62},
        [MainStatistics.HP]: {X: 34, Y: 70},
        [MainStatistics.PP]: {X: 34, Y: 78},
        [MainStatistics.DJINN]: {X: 58, Y: 118},
        [MainStatistics.ELEM_LEVELS]: {X: 58, Y: 126},
        [MainStatistics.ELEM_POWER]: {X: 58, Y: 134},
        [MainStatistics.ELEM_RESIST]: {X: 58, Y: 142},
        EFFECT: {X: 0, Y: 94, SHIFT: 16},
    };
    public static readonly HIGHLIGHT = {
        [MainStatistics.NAME]: {X: 48, Y: 8, WIDTH: 104, HEIGHT: 8},
        [MainStatistics.EXP]: {X: 48, Y: 16, WIDTH: 104, HEIGHT: 8},
        [MainStatistics.HP]: {X: 48, Y: 24, WIDTH: 104, HEIGHT: 8},
        [MainStatistics.PP]: {X: 48, Y: 32, WIDTH: 104, HEIGHT: 8},
        [MainStatistics.DJINN]: {X: 72, Y: 72, WIDTH: 160, HEIGHT: 8},
        [MainStatistics.ELEM_LEVELS]: {X: 72, Y: 80, WIDTH: 160, HEIGHT: 8},
        [MainStatistics.ELEM_POWER]: {X: 72, Y: 88, WIDTH: 160, HEIGHT: 8},
        [MainStatistics.ELEM_RESIST]: {X: 72, Y: 96, WIDTH: 160, HEIGHT: 8},
        EFFECT: {X: 8, Y: 48, WIDTH: 40, HEIGHT: 8, SHIFT: 16},
    };
    private static readonly ELEM = {
        STARS: {X: 128, Y: 65},
        STARS_SHIFT: 32,
        LABEL: {X: 72, Y: 72},
        LABEL_SHIFT: 8,
        NUMBERS: {END_X: 133, Y: 72, X_SHIFT: 32, Y_SHIFT: 8},
        DJINN: {CENTER_X: 130, Y: 66, X_SHIFT: 32},
        DOWN_SHIFT: 24,
    };
    private static readonly EXP = {
        LABEL_X: 48,
        LABEL_Y: 16,
        VALUE_END_X: 149,
        VALUE_Y: 16,
    };
    private static readonly NORMAL_STATUS = {
        X: 8,
        Y: 48,
    };
    private static readonly STATS = {
        LABEL_X: 160,
        LABEL_Y: 8,
        VALUE_END_X: 229,
        VALUE_Y: 8,
        LINE_SHIFT: 8,
    };
    private static readonly HP = {
        LABEL_X: 48,
        LABEL_Y: 24,
        MAX_END_X: 149,
        MAX_Y: 24,
        CURR_END_X: 117,
        CURR_Y: 24,
    };
    private static readonly PP = {
        LABEL_X: 48,
        LABEL_Y: 32,
        MAX_END_X: 149,
        MAX_Y: 32,
        CURR_END_X: 117,
        CURR_Y: 32,
    };
    private static readonly EFFECTS = {
        ICON_X: 9,
        ICON_Y: 48,
        NAME_X: 24,
        NAME_Y: 48,
        SHIFT: 16,
    };

    private static readonly LINES = 8;
    private static readonly DJINN_GROUP_Y_OFFSET = 40;

    private state: MainStatusStates;
    private djinn_group: Phaser.Group;

    public constructor(
        game: Phaser.Game,
        data: GoldenSun,
        window: Window,
        manager: BattleStatusWindow | MainStatusMenu,
        pos?: {line: number; col: number}
    ) {
        super(game, data, window, manager, pos);

        this.djinn_group = this.game.add.group();
    }

    public select_option() {
        if (this.state === MainStatusStates.CHARACTERS) return;

        const highlight = {x: 0, y: 0, width: 0, height: 0};
        let cursor_x = 0;
        let cursor_y = 0;

        if (this.current_col !== 0) {
            highlight.x = MainStatusStatistics.HIGHLIGHT[this.current_line].X;
            highlight.y = MainStatusStatistics.HIGHLIGHT[this.current_line].Y;
            highlight.width = MainStatusStatistics.HIGHLIGHT[this.current_line].WIDTH;
            highlight.height = MainStatusStatistics.HIGHLIGHT[this.current_line].HEIGHT;

            cursor_x = MainStatusStatistics.CURSOR[this.current_line].X;
            cursor_y = MainStatusStatistics.CURSOR[this.current_line].Y;
        } else {
            let highlight_shift = MainStatusStatistics.HIGHLIGHT.EFFECT.SHIFT;
            highlight.x = MainStatusStatistics.HIGHLIGHT.EFFECT.X;
            highlight.y = MainStatusStatistics.HIGHLIGHT.EFFECT.Y + highlight_shift * this.current_line;
            highlight.width = MainStatusStatistics.HIGHLIGHT.EFFECT.WIDTH;
            highlight.height = MainStatusStatistics.HIGHLIGHT.EFFECT.HEIGHT;

            const cursor_shift = MainStatusStatistics.CURSOR.EFFECT.SHIFT;
            cursor_x = MainStatusStatistics.CURSOR.EFFECT.X;
            cursor_y = MainStatusStatistics.CURSOR.EFFECT.Y + cursor_shift * this.current_line;
        }
        this.update_highlight(highlight);

        const cursor_tween = {type: CursorManager.CursorTweens.POINT, variant: PointVariants.NORMAL};
        this.data.cursor_manager.move_to({x: cursor_x, y: cursor_y}, {animate: false, tween_config: cursor_tween});
    }

    public on_change() {
        this.select_option();
        let msg_obj = null;

        if (this.current_col === 0) {
            if (this.battle_status_effects.length === 0) msg_obj = MainStatusStatistics.MenuStatusMsgs.normal;
            else msg_obj = MainStatusStatistics.MenuStatusMsgs[this.battle_status_effects[this.current_line].key];
        } else {
            msg_obj = {line1: null, line2: null};
            msg_obj.line1 = MainStatusStatistics.MenuDescriptions[this.current_line].line1;

            if (this.current_line === MainStatistics.EXP) {
                const exp = this.selected_char.exp_curve[this.selected_char.level] - this.selected_char.current_exp;
                msg_obj.line2 = MainStatusStatistics.MenuDescriptions[this.current_line].line2(exp);
            } else msg_obj.line2 = MainStatusStatistics.MenuDescriptions[this.current_line].line2;
        }
        this.update_description(msg_obj.line1, msg_obj.line2);
    }

    public on_left() {
        if (this.state === MainStatusStates.CHARACTERS) return;
        const effects_count = this.battle_status_effects.length;

        this.current_col = (this.current_col + 1) % 2;

        if (this.current_col === 0 && this.current_line >= effects_count) {
            this.current_line = effects_count === 0 ? 0 : effects_count - 1;
        }

        this.on_change();
    }

    public on_right() {
        if (this.state === MainStatusStates.CHARACTERS) return;
        const effects_count = this.battle_status_effects.length;

        this.current_col = (this.current_col + 1) % 2;

        if (this.current_col === 0 && this.current_line >= effects_count) {
            this.current_line = effects_count === 0 ? 0 : effects_count - 1;
        }

        this.on_change();
    }

    public on_up() {
        if (this.state === MainStatusStates.CHARACTERS) return;
        const effects_count = this.battle_status_effects.length;

        if (this.current_col === 0) {
            if (effects_count <= 1) return;
            this.current_line = (this.current_line + effects_count - 1) % effects_count;
        } else this.current_line = (this.current_line + MainStatusStatistics.LINES - 1) % MainStatusStatistics.LINES;

        this.on_change();
    }

    public on_down() {
        if (this.state === MainStatusStates.CHARACTERS) return;
        const effects_count = this.battle_status_effects.length;

        if (this.current_col === 0) {
            if (effects_count <= 1) return;
            this.current_line = (this.current_line + 1) % effects_count;
        } else this.current_line = (this.current_line + 1) % MainStatusStatistics.LINES;

        this.on_change();
    }

    public initialize() {
        this.djinn_group.x = this.game.camera.x;
        this.djinn_group.y = this.game.camera.y + MainStatusStatistics.DJINN_GROUP_Y_OFFSET;

        this.state = (this.manager as MainStatusMenu).state;

        const stars = ["venus_star", "mercury_star", "mars_star", "jupiter_star"];
        for (let i = 0; i < stars.length; i++) {
            const x_pos = MainStatusStatistics.ELEM.STARS.X + i * MainStatusStatistics.ELEM.STARS_SHIFT;
            let y_pos = MainStatusStatistics.ELEM.STARS.Y;

            if (this.state === MainStatusStates.CHARACTERS) y_pos += MainStatusStatistics.ELEM.DOWN_SHIFT;

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
            let y_pos = MainStatusStatistics.ELEM.LABEL.Y + i * MainStatusStatistics.ELEM.LABEL_SHIFT;

            if (this.state === MainStatusStates.CHARACTERS) y_pos += MainStatusStatistics.ELEM.DOWN_SHIFT;

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

            if (this.state === MainStatusStates.CHARACTERS && i === 0) break;
        }

        for (let i = 0; i < ordered_elements.length; i++) {
            const djinn_counts = this.get_djinn_counts(ordered_elements[i]);
            const elemental_stats = this.get_elemental_stats(ordered_elements[i]);

            const x_pos = MainStatusStatistics.ELEM.NUMBERS.END_X + i * MainStatusStatistics.ELEM.NUMBERS.X_SHIFT;
            let y_pos = MainStatusStatistics.ELEM.NUMBERS.Y;
            let text = djinn_counts.set + "/" + djinn_counts.total;

            if (this.state === MainStatusStates.CHARACTERS) {
                y_pos += MainStatusStatistics.ELEM.DOWN_SHIFT;
                text = String(djinn_counts.total);
            }

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

            if (this.state !== MainStatusStates.CHARACTERS) {
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

            const djinni_elements = [elements.VENUS, elements.MERCURY, elements.MARS, elements.JUPITER];

            for (let i = 0; i < djinni_elements.length; i++) {
                const elem = djinni_elements[i];

                const x_pos = MainStatusStatistics.ELEM.DJINN.CENTER_X + i * MainStatusStatistics.ELEM.DJINN.X_SHIFT;
                let y_pos = MainStatusStatistics.ELEM.DJINN.Y;

                if (this.state === MainStatusStates.CHARACTERS) y_pos += MainStatusStatistics.ELEM.DOWN_SHIFT;

                const djinni_sprite = this.djinn_group.create(x_pos, y_pos, elem + "_djinn_set");

                djinni_sprite.anchor.setTo(0.5, 1.0);
                djinni_sprite.scale.x = -1;

                const direction = "down";
                const action = "set";

                this.data.info.djinni_sprites[elem].setAnimation(djinni_sprite, action);
                djinni_sprite.animations.play(action + "_" + direction);

                this.state_sprites.push(djinni_sprite);
            }

            let txt = this.window.set_text_in_position(
                "Exp",
                MainStatusStatistics.EXP.LABEL_X,
                MainStatusStatistics.EXP.LABEL_Y,
                false,
                false,
                undefined,
                false,
                MainStatusStatistics.GROUP_KEY
            );
            this.state_sprites.push(txt.text, txt.shadow);

            txt = this.window.set_text_in_position(
                this.selected_char.current_exp,
                MainStatusStatistics.EXP.VALUE_END_X,
                MainStatusStatistics.EXP.VALUE_Y,
                true,
                false,
                undefined,
                false,
                MainStatusStatistics.GROUP_KEY
            );
            this.state_sprites.push(txt.text, txt.shadow);

            txt = this.window.set_text_in_position(
                "HP",
                MainStatusStatistics.HP.LABEL_X,
                MainStatusStatistics.HP.LABEL_Y,
                false,
                false,
                undefined,
                false,
                MainStatusStatistics.GROUP_KEY
            );
            this.state_sprites.push(txt.text, txt.shadow);

            txt = this.window.set_text_in_position(
                this.selected_char.max_hp,
                MainStatusStatistics.HP.MAX_END_X,
                MainStatusStatistics.HP.MAX_Y,
                true,
                false,
                undefined,
                false,
                MainStatusStatistics.GROUP_KEY
            );
            this.state_sprites.push(txt.text, txt.shadow);

            txt = this.window.set_text_in_position(
                this.selected_char.current_hp + "/",
                MainStatusStatistics.HP.CURR_END_X,
                MainStatusStatistics.HP.CURR_Y,
                true,
                false,
                undefined,
                false,
                MainStatusStatistics.GROUP_KEY
            );
            this.state_sprites.push(txt.text, txt.shadow);

            txt = this.window.set_text_in_position(
                "PP",
                MainStatusStatistics.PP.LABEL_X,
                MainStatusStatistics.PP.LABEL_Y,
                false,
                false,
                undefined,
                false,
                MainStatusStatistics.GROUP_KEY
            );
            this.state_sprites.push(txt.text, txt.shadow);

            txt = this.window.set_text_in_position(
                this.selected_char.max_pp,
                MainStatusStatistics.PP.MAX_END_X,
                MainStatusStatistics.PP.MAX_Y,
                true,
                false,
                undefined,
                false,
                MainStatusStatistics.GROUP_KEY
            );
            this.state_sprites.push(txt.text, txt.shadow);

            txt = this.window.set_text_in_position(
                this.selected_char.current_pp + "/",
                MainStatusStatistics.PP.CURR_END_X,
                MainStatusStatistics.PP.CURR_Y,
                true,
                false,
                undefined,
                false,
                MainStatusStatistics.GROUP_KEY
            );
            this.state_sprites.push(txt.text, txt.shadow);

            const shift = MainStatusStatistics.STATS.LINE_SHIFT;

            txt = this.window.set_text_in_position(
                "Attack",
                MainStatusStatistics.STATS.LABEL_X,
                MainStatusStatistics.STATS.LABEL_Y,
                false,
                false,
                undefined,
                false,
                MainStatusStatistics.GROUP_KEY
            );
            this.state_sprites.push(txt.text, txt.shadow);

            txt = this.window.set_text_in_position(
                this.selected_char.atk,
                MainStatusStatistics.STATS.VALUE_END_X,
                MainStatusStatistics.STATS.VALUE_Y,
                true,
                false,
                undefined,
                false,
                MainStatusStatistics.GROUP_KEY
            );
            this.state_sprites.push(txt.text, txt.shadow);

            txt = this.window.set_text_in_position(
                "Defense",
                MainStatusStatistics.STATS.LABEL_X,
                MainStatusStatistics.STATS.LABEL_Y + shift,
                false,
                false,
                undefined,
                false,
                MainStatusStatistics.GROUP_KEY
            );
            this.state_sprites.push(txt.text, txt.shadow);

            txt = this.window.set_text_in_position(
                this.selected_char.def,
                MainStatusStatistics.STATS.VALUE_END_X,
                MainStatusStatistics.STATS.VALUE_Y + shift,
                true,
                false,
                undefined,
                false,
                MainStatusStatistics.GROUP_KEY
            );
            this.state_sprites.push(txt.text, txt.shadow);

            txt = this.window.set_text_in_position(
                "Agility",
                MainStatusStatistics.STATS.LABEL_X,
                MainStatusStatistics.STATS.LABEL_Y + 2 * shift,
                false,
                false,
                undefined,
                false,
                MainStatusStatistics.GROUP_KEY
            );
            this.state_sprites.push(txt.text, txt.shadow);

            txt = this.window.set_text_in_position(
                this.selected_char.agi,
                MainStatusStatistics.STATS.VALUE_END_X,
                MainStatusStatistics.STATS.VALUE_Y + 2 * shift,
                true,
                false,
                undefined,
                false,
                MainStatusStatistics.GROUP_KEY
            );
            this.state_sprites.push(txt.text, txt.shadow);

            txt = this.window.set_text_in_position(
                "Luck",
                MainStatusStatistics.STATS.LABEL_X,
                MainStatusStatistics.STATS.LABEL_Y + 3 * shift,
                false,
                false,
                undefined,
                false,
                MainStatusStatistics.GROUP_KEY
            );
            this.state_sprites.push(txt.text, txt.shadow);

            txt = this.window.set_text_in_position(
                this.selected_char.luk,
                MainStatusStatistics.STATS.VALUE_END_X,
                MainStatusStatistics.STATS.VALUE_Y + 3 * shift,
                true,
                false,
                undefined,
                false,
                MainStatusStatistics.GROUP_KEY
            );
            this.state_sprites.push(txt.text, txt.shadow);
        }
        this.init_status_effects();
    }

    init_status_effects() {
        if (this.battle_status_effects.length === 0) {
            let txt = this.window.set_text_in_position(
                "Normal",
                MainStatusStatistics.NORMAL_STATUS.X,
                MainStatusStatistics.NORMAL_STATUS.Y,
                false,
                false,
                undefined,
                false,
                MainStatusStatistics.GROUP_KEY
            );
            this.state_sprites.push(txt.text, txt.shadow);
        } else {
            for (let i = 0; i < this.battle_status_effects.length; i++) {
                const effect: BattleStatusEffect = this.battle_status_effects[i];

                let x_pos = MainStatusStatistics.EFFECTS.NAME_X;
                let y_pos = MainStatusStatistics.EFFECTS.NAME_Y + i * MainStatusStatistics.EFFECTS.SHIFT;

                let txt = this.window.set_text_in_position(
                    MainStatusStatistics.EFFECT_LABELS[effect.key],
                    x_pos,
                    y_pos,
                    false,
                    false,
                    undefined,
                    false,
                    MainStatusStatistics.GROUP_KEY
                );
                this.state_sprites.push(txt.text, txt.shadow);

                x_pos = MainStatusStatistics.EFFECTS.ICON_X;
                y_pos = MainStatusStatistics.EFFECTS.ICON_Y + i * MainStatusStatistics.EFFECTS.SHIFT;

                const sprite = this.window.create_at_group(
                    x_pos,
                    y_pos,
                    "battle_effect_icons",
                    undefined,
                    effect.key,
                    MainStatusStatistics.GROUP_KEY
                );
                this.state_sprites.push(sprite);
            }
        }
    }
}
