import {Loader} from "../utils/Loader";
import {TextObj, Window} from "../Window";
import {GAME_HEIGHT, GAME_WIDTH, TOTAL_BORDER_WIDTH} from "../magic_numbers";

export class LoaderWindow {
    private static readonly MAX_DESCRIPTION_WIDTH: number = 165;
    private static readonly WIN_WIDTH: number = GAME_WIDTH - TOTAL_BORDER_WIDTH;
    private static readonly WIN_HEIGHT: number = GAME_HEIGHT - TOTAL_BORDER_WIDTH;
    private static readonly TITLE_X: number = GAME_WIDTH >> 1;
    private static readonly TITLE_Y: number = 48;
    private static readonly LOADER_X: number = 72;
    private static readonly LOADER_Y: number = 72;
    private static readonly DESCRIPTION_X: number = 47;
    private static readonly DESCRIPTION_Y: number = 96;
    private static readonly DESCRIPTION_SPACE_BET_LINES: number = 6;

    private game: Phaser.Game;
    private back_window: Window;
    private title_text: TextObj;
    private description_texts: TextObj[];
    private loader: Loader;
    public is_open: boolean;

    constructor(game: Phaser.Game) {
        this.game = game;

        this.is_open = false;
        this.back_window = new Window(this.game, 0, 0, LoaderWindow.WIN_WIDTH, LoaderWindow.WIN_HEIGHT);
        this.back_window.set_canvas_update();
        this.title_text = this.back_window.set_text_in_position("", LoaderWindow.TITLE_X, LoaderWindow.TITLE_Y, {
            is_center_pos: true,
        });
        this.description_texts = null;
        this.loader = new Loader(this.game, LoaderWindow.LOADER_X, LoaderWindow.LOADER_Y, this.back_window.group);
    }

    set_title(title: string) {
        this.back_window.update_text(title, this.title_text);
    }

    set_description(description: string) {
        this.description_texts?.forEach(obj => this.back_window.destroy_text_obj(obj));
        this.description_texts = this.back_window.set_lines_of_text(description, {
            padding_x: LoaderWindow.DESCRIPTION_X,
            padding_y: LoaderWindow.DESCRIPTION_Y,
            max_line_width: LoaderWindow.MAX_DESCRIPTION_WIDTH,
            space_between_lines: LoaderWindow.DESCRIPTION_SPACE_BET_LINES,
        });
    }

    set_loading_percentage(percentage: number) {
        this.loader.set_loading_percentage(percentage);
    }

    open_window(callback?: () => void) {
        this.is_open = true;
        this.back_window.send_to_front();
        this.back_window.show(() => {
            if (callback) {
                callback();
            }
        }, false);
    }

    close(callback?: () => void) {
        this.is_open = false;
        this.set_title("");
        this.description_texts?.forEach(obj => this.back_window.destroy_text_obj(obj));
        this.description_texts = null;
        this.back_window.close(() => {
            if (callback) {
                callback();
            }
        });
    }
}
