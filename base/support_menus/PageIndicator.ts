import { Window, TextObj } from "../Window";

const PAGE_NUMBER_WIDTH = 8;
const PAGE_NUMBER_HEIGHT = 8;
const PAGE_INDICATOR_ARROW_Y = 0;

const GROUP_KEY = "page_indicator";

export class PageIndicator{
    public game:Phaser.Game;
    public window:Window;
    public group:Phaser.Group

    public is_set: boolean;
    public number_bar: Phaser.Graphics;
    public number_bar_highlight: Phaser.Graphics;

    public arrow_timer: Phaser.Timer;
    public right_arrow: Phaser.Sprite;
    public left_arrow: Phaser.Sprite;
    
    public page_numbers: TextObj[];

    constructor(game:Phaser.Game, window:Window){
        this.game = game;
        this.window = window;

        this.group = this.window.define_internal_group(GROUP_KEY, {x:0, y:0});
    }

    initialize() {
        this.number_bar = this.game.add.graphics(0, 0);
        this.number_bar.alpha = 0;
        this.window.add_sprite_to_group(this.number_bar, GROUP_KEY);

        this.number_bar.beginFill(this.window.color, 1);
        this.number_bar.drawRect(0, 0, PAGE_NUMBER_WIDTH, PAGE_NUMBER_HEIGHT);
        this.number_bar.endFill();

        this.number_bar_highlight = this.game.add.graphics(0, 0);
        this.number_bar_highlight.blendMode = PIXI.blendModes.SCREEN;
        this.number_bar_highlight.alpha = 0;

        this.window.add_sprite_to_group(this.number_bar_highlight, GROUP_KEY);
        this.number_bar_highlight.beginFill(this.window.color, 1);
        this.number_bar_highlight.drawRect(0, 0, PAGE_NUMBER_WIDTH, PAGE_NUMBER_HEIGHT);
        this.number_bar_highlight.endFill();

        this.page_numbers = [];
        this.arrow_timer = this.game.time.create(false);

        this.right_arrow = this.window.create_at_group((this.window.width - 3), PAGE_INDICATOR_ARROW_Y,
            "page_arrow", undefined, undefined, GROUP_KEY);
        this.right_arrow.scale.x = -1;
        this.right_arrow.x -= this.right_arrow.width;
        this.right_arrow.alpha = 0;

        this.left_arrow = this.window.create_at_group(0, PAGE_INDICATOR_ARROW_Y, "page_arrow",
            undefined, undefined, GROUP_KEY);
        this.left_arrow.alpha = 0;

        this.is_set = true;
    }

    set_page(page_number:number, page_index:number) {
        if (page_number <= 1) return;
        
        this.number_bar.width = page_number * PAGE_NUMBER_WIDTH;
        this.number_bar.x = this.window.width - this.number_bar.width - 5;
        this.number_bar.alpha = 1;

        for (let i = 1; i <= page_number; ++i) {
            const x = this.number_bar.x + PAGE_NUMBER_WIDTH * (i - 1) + (PAGE_NUMBER_WIDTH >> 1);
            const y = PAGE_NUMBER_HEIGHT >> 1;
            this.page_numbers.push(this.window.set_text_in_position(i.toString(), x, y, false, true));
        }

        this.number_bar_highlight.alpha = 1;
        this.set_highlight(page_number, page_index);
        this.set_arrows(page_number);
    }

    set_highlight(page_number:number, page_index:number) {
        this.number_bar_highlight.x = this.window.width - 5 - (page_number - page_index) * PAGE_NUMBER_WIDTH;
    }

    set_arrows(page_number:number) {
        this.left_arrow.alpha = 1;
        this.right_arrow.alpha = 1;

        let calculated_arrow_left_x = this.window.width - 5 - page_number * PAGE_NUMBER_WIDTH - this.left_arrow.width - 2;
        this.left_arrow.x = calculated_arrow_left_x;

        if (this.arrow_timer.running && this.arrow_timer.paused) {
            this.arrow_timer.resume();
        } else {
            this.arrow_timer.loop(Phaser.Timer.QUARTER >> 1, () => {
                this.left_arrow.x = calculated_arrow_left_x + ~(-this.left_arrow.x%2);
                this.right_arrow.x = (this.window.width - 3) - ~(-this.right_arrow.x%2);
                this.right_arrow.x -= this.right_arrow.width;
            });
            this.arrow_timer.start();
        }
    }

    terminante() {
        this.is_set = false;

        this.number_bar.alpha = 0;
        this.number_bar_highlight.alpha = 0;
        this.left_arrow.alpha = 0;
        this.right_arrow.alpha = 0;
        
        for (let i = 0; i < this.page_numbers.length; ++i) {
            this.window.remove_text(this.page_numbers[i]);
        }
        this.page_numbers = [];
        this.arrow_timer.pause();
    }
}