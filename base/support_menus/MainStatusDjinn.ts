import {StatusComponent} from "./StatusComponent";
import {Window} from "../Window";
import {GoldenSun} from "../GoldenSun";
import {CursorManager, PointVariants} from "../utils/CursorManager";
import {BattleStatusEffect, BattleStatusWindow} from "../windows/battle/BattleStatusWindow";
import {permanent_status} from "../Player";
import {elements, ordered_elements} from "../utils";
import * as _ from "lodash";
import {MainStatusMenu, MainStatusStates} from "../main_menus/MainStatusMenu";
import {Djinn} from "../Djinn";
import {MainChar} from "../MainChar";

export type DjinnList = {
    [elements.VENUS]: Djinn[];
    [elements.MERCURY]: Djinn[];
    [elements.MARS]: Djinn[];
    [elements.JUPITER]: Djinn[];
};

export class MainStatusDjinn extends StatusComponent {
    private static readonly STARS = {
        X: 17,
        Y: 17,
        X_SHIFT: 56,
        Y_SHIFT: 8,
    };
    private static readonly NAMES = {
        X: 24,
        Y: 16,
        X_SHIFT: 56,
        Y_SHIFT: 8,
    };
    private static readonly SPRITES = {
        CENTER_X: 31,
        Y: 56,
        SHIFT: 56,
    };
    private static readonly SEPARATOR = {
        X: 4,
        Y: 91,
        WIDTH: 232,
    };
    private static readonly CURRENT_DJINN = {
        X: 14,
        Y: 100,
    };

    private static readonly DJINN_PER_LINE = 9;

    private djinn_group: Phaser.Group;
    private djinn_pages: DjinnList[];
    private current_page: number;

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
        return;
    }

    public on_change() {
        return;
    }

    public on_left() {
        if (this.djinn_pages.length <= 1) return;

        this.current_page = (this.current_page + this.djinn_pages.length - 1) % this.djinn_pages.length;
        this.load_page();
    }

    public on_right() {
        if (this.djinn_pages.length <= 1) return;

        this.current_page = (this.current_page + 1) % this.djinn_pages.length;
        this.load_page();
    }

    public on_up() {
        return;
    }

    public on_down() {
        return;
    }

    public initialize() {
        this.djinn_group.x = this.game.camera.x;
        this.djinn_group.y = this.game.camera.y;

        this.make_pages();
        this.window.page_indicator.initialize(this.djinn_pages.length, this.current_page);

        this.current_page = 0;
        this.load_page();
    }

    private load_page() {
        this.clear();
        this.window.page_indicator.select_page(this.current_col);

        const djinn = this.djinn_pages[this.current_page];

        for (let i = 0; i < ordered_elements.length; i++) {
            const elem = ordered_elements[i];

            const x_pos = MainStatusDjinn.SPRITES.CENTER_X + i * MainStatusDjinn.SPRITES.SHIFT;
            let y_pos = MainStatusDjinn.SPRITES.Y;

            const djinni_sprite = this.djinn_group.create(x_pos, y_pos, elem + "_djinn_set");

            djinni_sprite.anchor.setTo(0.5, 1.0);
            djinni_sprite.scale.x = -1;

            const direction = "down";
            const action = "set";

            this.data.info.djinni_sprites[elem].setAnimation(djinni_sprite, action);
            djinni_sprite.animations.play(action + "_" + direction);

            this.state_sprites.push(djinni_sprite);

            const elem_djinn: Djinn[] = djinn[ordered_elements[i]];

            for (let n = 0; n < elem_djinn.length; n++) {
                let x_pos = MainStatusDjinn.STARS.X + i * MainStatusDjinn.STARS.X_SHIFT;
                let y_pos = MainStatusDjinn.STARS.Y + n * MainStatusDjinn.STARS.Y_SHIFT;

                const star = this.window.create_at_group(
                    x_pos,
                    y_pos,
                    ordered_elements[i] + "_star",
                    undefined,
                    undefined,
                    MainStatusDjinn.GROUP_KEY
                );
                this.state_sprites.push(star);

                x_pos = MainStatusDjinn.NAMES.X + i * MainStatusDjinn.NAMES.X_SHIFT;
                y_pos = MainStatusDjinn.NAMES.Y + n * MainStatusDjinn.NAMES.Y_SHIFT;

                const name = this.window.set_text_in_position(
                    elem_djinn[n].name,
                    x_pos,
                    y_pos,
                    false,
                    false,
                    undefined,
                    false,
                    MainStatusDjinn.GROUP_KEY
                );
                this.state_sprites.push(name.text, name.shadow);
            }
        }

        const sep_x = MainStatusDjinn.SEPARATOR.X;
        const sep_y = MainStatusDjinn.SEPARATOR.Y;
        const sep_width = MainStatusDjinn.SEPARATOR.WIDTH;

        this.window.draw_separator(sep_x, sep_y, sep_x + sep_width, sep_y, false);

        const txt = this.window.set_text_in_position(
            "Current Djinn",
            MainStatusDjinn.CURRENT_DJINN.X,
            MainStatusDjinn.CURRENT_DJINN.Y,
            false,
            false,
            undefined,
            false,
            MainStatusDjinn.GROUP_KEY,
            true
        );
        this.state_sprites.push(txt.text, txt.shadow);
    }

    private make_pages() {
        let djinn_list = this.get_djinn_by_element();

        const max_per_page = MainStatusDjinn.DJINN_PER_LINE;

        const venus = djinn_list[elements.VENUS];
        const mercury = djinn_list[elements.MERCURY];
        const mars = djinn_list[elements.MARS];
        const jupiter = djinn_list[elements.JUPITER];

        const highest_count = Math.max(venus.length, mercury.length, mars.length, jupiter.length);

        let n_pages = (highest_count / max_per_page) | 0;
        if (highest_count % max_per_page) n_pages++;
        this.djinn_pages = [];

        for (let i = 0; i < n_pages; i++) {
            let page: DjinnList = {
                [elements.VENUS]: [],
                [elements.MERCURY]: [],
                [elements.MARS]: [],
                [elements.JUPITER]: [],
            };

            page[elements.VENUS] = venus.slice(max_per_page * i, max_per_page * (i + 1) - 1);
            page[elements.MERCURY] = mercury.slice(max_per_page * i, max_per_page * (i + 1) - 1);
            page[elements.MARS] = mars.slice(max_per_page * i, max_per_page * (i + 1) - 1);
            page[elements.JUPITER] = jupiter.slice(max_per_page * i, max_per_page * (i + 1) - 1);

            this.djinn_pages.push(page);
        }
    }

    private get_djinn_by_element() {
        const djinn: DjinnList = {
            [elements.VENUS]: [],
            [elements.MERCURY]: [],
            [elements.MARS]: [],
            [elements.JUPITER]: [],
        };

        for (let i = 0; i < this.data.info.party_data.members.length; i++) {
            const char = this.data.info.party_data.members[i];

            for (let i = 0; i < ordered_elements.length; i++) {
                const char_djinn_names = char[ordered_elements[i] + "_djinni"];

                for (let n = 0; n < char_djinn_names.length; n++) {
                    djinn[ordered_elements[i]].push(this.data.info.djinni_list[char_djinn_names[n]]);
                }
            }
        }

        for (let i = 0; i < ordered_elements.length; i++) {
            djinn[ordered_elements[i]].sort((a: Djinn, b: Djinn) => a.index - b.index);
        }

        return djinn;
    }
}
