import {StatusComponent} from "./StatusComponent";
import {TextObj, Window} from "../Window";
import {GoldenSun} from "../GoldenSun";
import {CursorManager, PointVariants} from "../utils/CursorManager";
import {Ability} from "../Ability";
import {MainStatusMenu} from "../main_menus/MainStatusMenu";

export class MainStatusPsynergy extends StatusComponent {
    private static readonly CURSOR = {
        X: 65,
        Y: 66,
    };
    private static readonly HIGHLIGHT = {
        X: 80,
        Y: 24,
        WIDTH: 152,
        HEIGHT: 8,
    };
    private static readonly PSYNERGY = {
        ICON_X: 81,
        ICON_Y: 19,
        NAME_X: 96,
        NAME_Y: 24,
        PP_LABEL_X: 184,
        PP_LABEL_Y: 8,
        PP_VALUE_END_X: 194,
        PP_VALUE_Y: 24,
        STAR_X: 201,
        STAR_Y: 25,
        RANGE_CENTER_X: 220,
        RANGE_Y: 24,
    };
    private static readonly USE_TEXT = {
        X: 8,
        Y: 104,
    };

    private static readonly MAX_LINES = 5;
    private static readonly SHIFT = 16;

    private ability_pages: Ability[][];
    private use_text: TextObj;

    public constructor(
        game: Phaser.Game,
        data: GoldenSun,
        window: Window,
        manager: MainStatusMenu,
        pos?: {line: number; col: number}
    ) {
        super(game, data, window, manager, pos);
    }

    public select_option() {
        const highlight = {
            x: MainStatusPsynergy.HIGHLIGHT.X,
            y: MainStatusPsynergy.HIGHLIGHT.Y + MainStatusPsynergy.SHIFT * this.current_line,
            width: MainStatusPsynergy.HIGHLIGHT.WIDTH,
            height: MainStatusPsynergy.HIGHLIGHT.HEIGHT,
        };
        this.update_highlight(highlight);

        const cursor_x = MainStatusPsynergy.CURSOR.X;
        const cursor_y = MainStatusPsynergy.CURSOR.Y + MainStatusPsynergy.SHIFT * this.current_line;

        const cursor_tween = {type: CursorManager.CursorTweens.POINT, variant: PointVariants.NORMAL};
        this.data.cursor_manager.move_to({x: cursor_x, y: cursor_y}, {animate: false, tween_config: cursor_tween});

        this.window.page_indicator.select_page(this.current_col);
    }

    public on_change() {
        if (!this.ability_pages[this.current_col][this.current_line])
            this.current_line = this.ability_pages[this.current_col].length - 1;

        const chosen_ability = this.ability_pages[this.current_col][this.current_line];

        this.select_option();
        this.update_description(chosen_ability.description);

        let use_text = "Can be used in ";
        if (chosen_ability.is_field_psynergy || chosen_ability.effects_outside_battle) use_text += "Towns";
        else use_text += "Battle";

        this.window.update_text(use_text, this.use_text);
    }

    public on_left() {
        if (this.ability_pages.length <= 1) return;

        const pages = this.ability_pages.length;
        this.current_col = (this.current_col + pages - 1) % pages;

        if (!this.ability_pages[this.current_col][this.current_line])
            this.current_line = this.ability_pages[this.current_col].length - 1;

        this.reset();
    }

    public on_right() {
        if (this.ability_pages.length <= 1) return;

        const pages = this.ability_pages.length;
        this.current_col = (this.current_col + 1) % pages;

        if (!this.ability_pages[this.current_col][this.current_line])
            this.current_line = this.ability_pages[this.current_col].length - 1;

        this.reset();
    }

    public on_up() {
        if (this.ability_pages[this.current_col].length <= 1) return;

        const len = this.ability_pages[this.current_col].length;
        this.current_line = (this.current_line + len - 1) % len;

        this.on_change();
    }

    public on_down() {
        if (this.ability_pages[this.current_col].length <= 1) return;

        const len = this.ability_pages[this.current_col].length;
        this.current_line = (this.current_line + 1) % len;

        this.on_change();
    }

    public initialize() {
        this.update_abilities();

        if (!this.ability_pages[this.current_col]) this.current_col = this.ability_pages.length - 1;

        const abilities = this.ability_pages[this.current_col];

        abilities.forEach((ability, index) => {
            const icon_key = ability.key_name;
            const name = ability.name;
            const pp_cost = ability.pp_cost;
            const range = String(ability.range);

            let x_pos = MainStatusPsynergy.PSYNERGY.ICON_X;
            let y_pos = MainStatusPsynergy.PSYNERGY.ICON_Y + index * MainStatusPsynergy.SHIFT;

            const icon = this.window.create_at_group(
                x_pos,
                y_pos,
                "abilities_icons",
                undefined,
                icon_key,
                MainStatusPsynergy.GROUP_KEY
            );
            this.state_sprites.push(icon);

            x_pos = MainStatusPsynergy.PSYNERGY.NAME_X;
            y_pos = MainStatusPsynergy.PSYNERGY.NAME_Y + index * MainStatusPsynergy.SHIFT;

            const name_text = this.window.set_text_in_position(
                name,
                x_pos,
                y_pos,
                false,
                false,
                undefined,
                false,
                MainStatusPsynergy.GROUP_KEY
            );
            this.state_sprites.push(name_text.text, name_text.shadow);

            x_pos = MainStatusPsynergy.PSYNERGY.PP_VALUE_END_X;
            y_pos = MainStatusPsynergy.PSYNERGY.PP_VALUE_Y + index * MainStatusPsynergy.SHIFT;

            const pp_value = this.window.set_text_in_position(
                pp_cost,
                x_pos,
                y_pos,
                true,
                false,
                undefined,
                false,
                MainStatusPsynergy.GROUP_KEY
            );
            this.state_sprites.push(pp_value.text, pp_value.shadow);

            x_pos = MainStatusPsynergy.PSYNERGY.STAR_X;
            y_pos = MainStatusPsynergy.PSYNERGY.STAR_Y + index * MainStatusPsynergy.SHIFT;

            const star = this.window.create_at_group(
                x_pos,
                y_pos,
                "stars",
                undefined,
                ability.element,
                MainStatusPsynergy.GROUP_KEY
            );
            this.state_sprites.push(star);

            x_pos = MainStatusPsynergy.PSYNERGY.RANGE_CENTER_X;
            y_pos = MainStatusPsynergy.PSYNERGY.RANGE_Y + index * MainStatusPsynergy.SHIFT;

            const range_icon = this.window.create_at_group(
                x_pos,
                y_pos,
                "ranges",
                undefined,
                range,
                MainStatusPsynergy.GROUP_KEY
            );
            range_icon.x -= (range_icon.width / 2) | 0;
            this.state_sprites.push(range_icon);
        });

        let x_pos = MainStatusPsynergy.PSYNERGY.PP_LABEL_X;
        let y_pos = MainStatusPsynergy.PSYNERGY.PP_LABEL_Y;

        const pp_label = this.window.set_text_in_position(
            "PP",
            x_pos,
            y_pos,
            false,
            false,
            undefined,
            false,
            MainStatusPsynergy.GROUP_KEY
        );
        this.state_sprites.push(pp_label.text, pp_label.shadow);

        x_pos = MainStatusPsynergy.USE_TEXT.X;
        y_pos = MainStatusPsynergy.USE_TEXT.Y;

        this.use_text = this.window.set_text_in_position(
            "",
            x_pos,
            y_pos,
            false,
            false,
            undefined,
            false,
            MainStatusPsynergy.GROUP_KEY
        );
        this.state_sprites.push(this.use_text.text, this.use_text.shadow);

        this.window.page_indicator.initialize(this.ability_pages.length, this.current_line);
        this.select_option();
    }

    private update_abilities() {
        const all_abilities = this.selected_char.abilities;

        const battle_psy = all_abilities.filter((key_name: string) => {
            const a = this.data.info.abilities_list[key_name];
            if (!a) return true;

            return !(a.is_field_psynergy || a.effects_outside_battle);
        });
        const field_psy = all_abilities.filter((key_name: string) => {
            const a = this.data.info.abilities_list[key_name];
            if (!a) return false;

            return a.is_field_psynergy || a.effects_outside_battle;
        });

        const sorted_abilities = field_psy.concat(battle_psy);

        let page_abilities = [];
        this.ability_pages = [];

        let count = 0;
        sorted_abilities.forEach((key_name: string) => {
            if (count === MainStatusPsynergy.MAX_LINES) {
                this.ability_pages.push(page_abilities);
                page_abilities = [];
                count = 0;
            }
            if (!this.data.info.abilities_list[key_name]) {
                console.warn(`Ability "${key_name}" does not exist in the database.`);
            } else {
                page_abilities.push(this.data.info.abilities_list[key_name]);
                count++;
            }
        });
        if (page_abilities.length > 0) this.ability_pages.push(page_abilities);
    }
}
