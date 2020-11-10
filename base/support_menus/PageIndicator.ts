import { Window, TextObj } from "../Window";

export class PageIndicator {
  private static readonly NUMBER_WIDTH = 8;
  private static readonly NUMBER_HEIGHT = 8;

  private static readonly GROUP_KEY = "page_indicator";

  private game: Phaser.Game;
  private window: Window;

  private set: boolean;
  private page_count: number;
  private anchor_x: number;

  private number_bar: Phaser.Graphics;
  private number_bar_highlight: Phaser.Graphics;

  private arrow_timer: Phaser.Timer;
  private right_arrow: Phaser.Sprite;
  private left_arrow: Phaser.Sprite;

  private page_numbers: TextObj[];

  public constructor(game: Phaser.Game, window: Window, anchor_x?: number) {
    this.game = game;
    this.window = window;

    this.window.define_internal_group(PageIndicator.GROUP_KEY, { x: 0, y: 0 });

    this.set = false;
    this.page_count = 0;
    this.anchor_x = anchor_x ? anchor_x : this.window.width - 3;
  }

  get is_set() {
    return this.set;
  }

  public initialize(page_count: number) {
    this.page_count = page_count;

    this.number_bar = this.game.add.graphics(0, 0);
    this.number_bar.alpha = 0;
    this.window.add_sprite_to_group(this.number_bar, PageIndicator.GROUP_KEY);

    this.number_bar.beginFill(this.window.color, 1);
    this.number_bar.drawRect(
      0,
      0,
      PageIndicator.NUMBER_WIDTH,
      PageIndicator.NUMBER_HEIGHT
    );
    this.number_bar.endFill();

    this.number_bar_highlight = this.game.add.graphics(0, 0);
    this.number_bar_highlight.blendMode = PIXI.blendModes.SCREEN;
    this.number_bar_highlight.alpha = 0;

    this.window.add_sprite_to_group(
      this.number_bar_highlight,
      PageIndicator.GROUP_KEY
    );
    this.number_bar_highlight.beginFill(this.window.color, 1);
    this.number_bar_highlight.drawRect(
      0,
      0,
      PageIndicator.NUMBER_WIDTH,
      PageIndicator.NUMBER_HEIGHT
    );
    this.number_bar_highlight.endFill();

    this.page_numbers = [];
    this.arrow_timer = this.game.time.create(false);

    this.right_arrow = this.window.create_at_group(
      this.anchor_x,
      0,
      "page_arrow",
      undefined,
      undefined,
      PageIndicator.GROUP_KEY
    );
    this.right_arrow.scale.x = -1;
    this.right_arrow.x -= this.right_arrow.width;
    this.right_arrow.alpha = 0;

    this.left_arrow = this.window.create_at_group(
      0,
      0,
      "page_arrow",
      undefined,
      undefined,
      PageIndicator.GROUP_KEY
    );
    this.left_arrow.alpha = 0;

    this.set = true;
  }

  public set_page(page_index: number) {
    if (this.page_count <= 1) return;

    this.number_bar.width = this.page_count * PageIndicator.NUMBER_WIDTH;
    this.number_bar.x = this.window.width - this.number_bar.width - 5;
    this.number_bar.alpha = 1;

    for (let i = 1; i <= this.page_count; ++i) {
      const x =
        this.number_bar.x +
        PageIndicator.NUMBER_WIDTH * (i - 1) +
        (PageIndicator.NUMBER_WIDTH >> 1);
      const y = PageIndicator.NUMBER_HEIGHT >> 1;
      this.page_numbers.push(
        this.window.set_text_in_position(i.toString(), x, y, false, true)
      );
    }

    this.number_bar_highlight.alpha = 1;
    this.set_highlight(page_index);
    this.set_arrows();
  }

  public set_highlight(page_index: number) {
    this.number_bar_highlight.x =
      this.window.width -
      5 -
      (this.page_count - page_index) * PageIndicator.NUMBER_WIDTH;
  }

  private set_arrows() {
    this.left_arrow.alpha = 1;
    this.right_arrow.alpha = 1;

    let left_arrow_x =
      this.window.width -
      5 -
      this.page_count * PageIndicator.NUMBER_WIDTH -
      this.left_arrow.width -
      2;
    this.left_arrow.x = left_arrow_x;

    if (this.arrow_timer.running && this.arrow_timer.paused) {
      this.arrow_timer.resume();
    } else {
      this.arrow_timer.loop(Phaser.Timer.QUARTER >> 1, () => {
        this.left_arrow.x = left_arrow_x + ~(-this.left_arrow.x % 2);
        this.right_arrow.x = this.anchor_x - ~(-this.right_arrow.x % 2);
        this.right_arrow.x -= this.right_arrow.width;
      });
      this.arrow_timer.start();
    }
  }

  public terminante() {
    this.set = false;

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
