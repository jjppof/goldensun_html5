import {DEFAULT_FONT_COLOR, INACTIVE_FONT_COLOR} from "../magic_numbers";
import {Window, TextObj} from "../Window";

export enum PageIndicatorModes {
    HIGHLIGHT,
    FLASH,
}

export class PageIndicator {
    private static readonly NUMBER_WIDTH = 8;
    private static readonly NUMBER_HEIGHT = 8;

    private static readonly ARROW_SHIFT = 1;
    private static readonly GROUP_KEY = "page_indicator";

    private static readonly ARROW_LOOP = Phaser.Timer.QUARTER >> 1;
    private static readonly FLASH_LOOP = 150;

    private game: Phaser.Game;
    private window: Window;

    private set: boolean;
    private mode: PageIndicatorModes;

    private page_count: number;
    private anchor: {x: number; y: number};

    private number_bar: Phaser.Graphics;
    private number_bar_highlight: Phaser.Graphics;

    private flash_timer: Phaser.Timer;
    private flash_event: Phaser.TimerEvent;
    private arrow_timer: Phaser.Timer;

    private right_arrow: Phaser.Sprite;
    private left_arrow: Phaser.Sprite;

    private default_arrow_pos: {
        right: number;
        left: number;
    };

    private page_numbers: TextObj[];

    public constructor(game: Phaser.Game, window: Window, anchor?: {x: number; y: number}) {
        this.game = game;
        this.window = window;

        this.window.define_internal_group(PageIndicator.GROUP_KEY, {x: 0, y: 0});

        this.set = false;
        this.mode = null;
        this.flash_event = null;

        this.page_count = 0;
        this.anchor = {
            x: anchor ? anchor.x : this.window.width - 3,
            y: anchor ? anchor.y : 0,
        };

        this.default_arrow_pos = {right: 0, left: 0};
    }

    get is_set() {
        return this.set;
    }

    set position(anchor: {x?: number; y?: number}) {
        if (anchor.x) this.anchor.x = anchor.x;
        if (anchor.y) this.anchor.y = anchor.y;
    }

    public initialize(page_count: number, page_index: number, mode?: PageIndicatorModes) {
        if (page_count <= 1) return;
        if (this.is_set) {
        }
        this.mode = mode ? mode : PageIndicatorModes.HIGHLIGHT;
        this.page_count = page_count;

        this.number_bar = this.game.add.graphics(0, 0);
        this.number_bar.alpha = 0;
        this.window.add_sprite_to_group(this.number_bar, PageIndicator.GROUP_KEY);

        this.number_bar.beginFill(this.window.color, 1);
        this.number_bar.drawRect(0, 0, PageIndicator.NUMBER_WIDTH, PageIndicator.NUMBER_HEIGHT);
        this.number_bar.endFill();

        this.number_bar_highlight = this.game.add.graphics(0, 0);
        this.number_bar_highlight.blendMode = PIXI.blendModes.SCREEN;
        this.number_bar_highlight.alpha = 0;

        this.window.add_sprite_to_group(this.number_bar_highlight, PageIndicator.GROUP_KEY);
        this.number_bar_highlight.beginFill(this.window.color, 1);
        this.number_bar_highlight.drawRect(0, 0, PageIndicator.NUMBER_WIDTH, PageIndicator.NUMBER_HEIGHT);
        this.number_bar_highlight.endFill();

        this.page_numbers = [];

        this.arrow_timer = this.game.time.create(false);
        this.flash_timer = this.game.time.create(false);

        this.right_arrow = this.window.create_at_group(0, 0, "menu", undefined, "page_arrow", PageIndicator.GROUP_KEY);
        this.right_arrow.alpha = 0;

        this.left_arrow = this.window.create_at_group(0, 0, "menu", undefined, "page_arrow", PageIndicator.GROUP_KEY);
        this.left_arrow.alpha = 0;

        this.set = true;

        this.number_bar.width = this.page_count * PageIndicator.NUMBER_WIDTH;
        this.number_bar.x = this.anchor.x - this.number_bar.width - 2;
        this.number_bar.y = this.anchor.y;
        this.number_bar.alpha = 1;

        for (let i = 1; i <= this.page_count; ++i) {
            const x = this.number_bar.x + PageIndicator.NUMBER_WIDTH * (i - 1) + (PageIndicator.NUMBER_WIDTH >> 1);
            const y = this.number_bar.y + (PageIndicator.NUMBER_HEIGHT >> 1);
            this.page_numbers.push(this.window.set_text_in_position(i.toString(), x, y, {is_center_pos: true}));
        }

        this.number_bar_highlight.alpha = 1;
        this.select_page(page_index);
        this.set_arrows();
    }

    public select_page(page_index: number) {
        if (this.mode === PageIndicatorModes.HIGHLIGHT) {
            this.number_bar_highlight.x = this.number_bar.x + page_index * PageIndicator.NUMBER_WIDTH;
            this.number_bar_highlight.y = this.number_bar.y;
        } else if (this.mode === PageIndicatorModes.FLASH) {
            this.number_bar_highlight.alpha = 0;

            if (this.flash_timer.running) {
                this.flash_event.pendingDelete = true;
                this.flash_event = null;
            }

            this.page_numbers.forEach((n, index) => {
                n.text.tint = index === page_index ? DEFAULT_FONT_COLOR : INACTIVE_FONT_COLOR;
            });

            this.flash_event = this.flash_timer.loop(PageIndicator.FLASH_LOOP, () => {
                if (this.page_numbers[page_index].text.tint === DEFAULT_FONT_COLOR) {
                    this.page_numbers[page_index].text.tint = INACTIVE_FONT_COLOR;
                } else {
                    this.page_numbers[page_index].text.tint = DEFAULT_FONT_COLOR;
                }
            });
            this.flash_timer.start();
        }
    }

    private set_arrows() {
        this.left_arrow.alpha = 1;
        this.right_arrow.alpha = 1;

        const left_arrow_x = this.number_bar.x - 8;
        this.left_arrow.x = left_arrow_x;
        this.left_arrow.y = this.anchor.y;

        this.right_arrow.x = this.anchor.x;
        this.right_arrow.y = this.anchor.y;

        this.right_arrow.scale.x = -1;
        this.right_arrow.x -= this.right_arrow.width;

        this.default_arrow_pos = {right: this.right_arrow.x, left: this.left_arrow.x};

        if (this.arrow_timer.running && this.arrow_timer.paused) {
            this.arrow_timer.resume();
        } else {
            this.arrow_timer.loop(PageIndicator.ARROW_LOOP, () => {
                if (
                    this.right_arrow.x !== this.default_arrow_pos.right &&
                    this.left_arrow.x !== this.default_arrow_pos.left
                ) {
                    this.right_arrow.x = this.default_arrow_pos.right;
                    this.left_arrow.x = this.default_arrow_pos.left;
                } else {
                    this.right_arrow.x += -PageIndicator.ARROW_SHIFT;
                    this.left_arrow.x += PageIndicator.ARROW_SHIFT;
                }
            });
            this.arrow_timer.start();
        }
    }

    public terminante() {
        if (!this.set) return;

        this.set = false;
        this.mode = null;

        this.number_bar.alpha = 0;
        this.number_bar_highlight.alpha = 0;
        this.left_arrow.alpha = 0;
        this.right_arrow.alpha = 0;

        for (let i = 0; i < this.page_numbers.length; ++i) {
            this.window.remove_text(this.page_numbers[i]);
        }

        this.page_numbers = [];

        this.arrow_timer.pause();
        this.flash_timer.pause();
    }
}
