import {StatusComponent} from "./StatusComponent";
import {Window} from "../Window";
import {GoldenSun} from "../GoldenSun";
import {BattleStatusWindow} from "../windows/battle/BattleStatusWindow";
import {elements, ordered_elements} from "../utils";
import * as _ from "lodash";
import {MainStatusMenu} from "../main_menus/MainStatusMenu";
import {Djinn} from "../Djinn";

export type DjinnList = {[element in elements]?: Djinn[]};

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
        CENTER_X: 32,
        Y: 57,
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
            const elem_djinn: Djinn[] = djinn[ordered_elements[i]];

            for (let n = 0; n < elem_djinn.length; n++) {
                let x_pos = MainStatusDjinn.STARS.X + i * MainStatusDjinn.STARS.X_SHIFT;
                let y_pos = MainStatusDjinn.STARS.Y + n * MainStatusDjinn.STARS.Y_SHIFT;

                const star = this.window.create_at_group(
                    x_pos,
                    y_pos,
                    "stars",
                    undefined,
                    ordered_elements[i],
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

            const x_pos = MainStatusDjinn.SPRITES.CENTER_X + i * MainStatusDjinn.SPRITES.SHIFT;
            const y_pos = MainStatusDjinn.SPRITES.Y;

            const djinni_sprite = this.get_djinni_sprite(elem, this.djinn_group, {x: x_pos, y: y_pos});
            this.state_sprites.push(djinni_sprite);
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

        const highest_count = (_.maxBy(Object.values(djinn_list), (list: Djinn[]) => list.length) as Djinn[]).length;

        let n_pages = (highest_count / max_per_page) | 0;
        if (highest_count % max_per_page) n_pages++;
        this.djinn_pages = [];

        for (let i = 0; i < n_pages; i++) {
            const page: DjinnList = ordered_elements.reduce((result, elem) => {
                result[elem] = djinn_list[elem].slice(max_per_page * i, max_per_page * (i + 1) - 1);
                return result;
            }, {} as DjinnList);

            this.djinn_pages.push(page);
        }
    }

    private get_djinn_by_element() {
        const djinn = ordered_elements.reduce((result, elem) => {
            const char_djinn = this.data.info.party_data.members.map(char => char.djinn_by_element[elem]).flat();
            result[elem] = _.sortBy(
                char_djinn.map(djinni_key => this.data.info.djinni_list[djinni_key]),
                char_djinn => char_djinn.index
            );
            return result;
        }, {});

        return djinn;
    }
}
