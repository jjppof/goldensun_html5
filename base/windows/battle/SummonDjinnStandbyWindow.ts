import {TextObj, Window} from "../../Window";
import {ordered_elements} from "../../utils";

const BASE_WIN_X = 160;
const BASE_WIN_Y = 64;
const BASE_WIN_WIDTH = 76;
const BASE_WIN_HEIGHT = 20;
const STAR_LEFT_PADDING = 9;
const STAR_TOP_PADDING = 9;
const TEXT_LEFT_PADDING = 22;
const TEXT_TOP_PADDING = 8;
const SPACE_BETWEEN_STARS = 16;
const SPACE_BETWEEN_TEXTS = 16;
const HIGHLIGHT_WIDTH = 16;
const HIGHLIGHT_HEIGHT = 8;
const HIGHLIGHT_LEFT_PADDING = 8;
const HIGHLIGHT_TOP_PADDING = 8;

export class SummonDjinnStandbyWindow {
    public game: Phaser.Game;
    public base_window: Window;
    public texts: {[element: string]: TextObj};
    public graphics: {[element: string]: Phaser.Graphics};
    public timers: {[element: string]: Phaser.Timer};
    public window_open: boolean;

    constructor(game) {
        this.game = game;
        this.base_window = new Window(this.game, BASE_WIN_X, BASE_WIN_Y, BASE_WIN_WIDTH, BASE_WIN_HEIGHT);
        this.texts = {};
        this.graphics = {};
        this.timers = {};
        for (let i = 0; i < ordered_elements.length; ++i) {
            const element = ordered_elements[i];
            this.base_window.create_at_group(
                STAR_LEFT_PADDING + i * SPACE_BETWEEN_STARS,
                STAR_TOP_PADDING,
                "stars",
                undefined,
                element
            );
            this.texts[element] = this.base_window.set_text_in_position(
                "",
                TEXT_LEFT_PADDING + i * SPACE_BETWEEN_TEXTS,
                TEXT_TOP_PADDING,
                {right_align: true}
            );
            this.graphics[element] = this.game.add.graphics(0, 0);
            this.graphics[element].blendMode = PIXI.blendModes.SCREEN;
            this.base_window.add_sprite_to_group(this.graphics[element]);
            this.graphics[element].beginFill(this.base_window.color, 1);
            this.graphics[element].drawRect(
                HIGHLIGHT_LEFT_PADDING + i * HIGHLIGHT_WIDTH,
                HIGHLIGHT_TOP_PADDING,
                HIGHLIGHT_WIDTH,
                HIGHLIGHT_HEIGHT
            );
            this.graphics[element].endFill();
        }
        this.window_open = false;
    }

    blink(element, sprite) {
        this.timers[element] = this.game.time.create(false);
        this.timers[element].loop(150, () => {
            sprite.alpha = +!sprite.alpha;
        });
        this.timers[element].start();
    }

    set_numbers(requirements) {
        for (let element in requirements) {
            const djinn_number = requirements[element];
            if (this.timers[element]) {
                this.timers[element].destroy();
                this.timers[element] = null;
            }
            if (djinn_number) {
                this.blink(element, this.graphics[element]);
            } else {
                this.graphics[element].alpha = 0;
            }
            this.base_window.update_text(djinn_number.toString(), this.texts[element]);
        }
    }

    open() {
        this.base_window.show(undefined, false);
        this.window_open = true;
    }

    close() {
        this.base_window.close(undefined, false);
        this.window_open = false;
        for (let i = 0; i < ordered_elements.length; ++i) {
            const element = ordered_elements[i];
            if (this.timers[element]) {
                this.timers[element].destroy();
                this.timers[element] = null;
            }
        }
    }

    destroy() {
        this.base_window.destroy(false);
        for (let element in this.timers) {
            if (this.timers[element]) {
                this.timers[element].destroy();
            }
        }
    }
}
