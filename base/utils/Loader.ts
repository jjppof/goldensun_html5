import {Window} from "../Window";
import * as _ from "lodash";

export class Loader {
    private static readonly BG_X = 1;
    private static readonly BG_Y = 1;
    private static readonly BG_WIDTH = 93;
    private static readonly BG_HEIGHT = 5;
    private static readonly LIGHT_BORDER_COLOR = 0xe5e5e5;
    private static readonly BAR_COLOR = 0xf8f800;

    private game: Phaser.Game;
    private group: Phaser.Group;
    private border_graphics: Phaser.Graphics;
    private bg_graphics: Phaser.Graphics;
    private bar_graphics: Phaser.Graphics;

    constructor(game: Phaser.Game, x: number, y: number, parent_group?: Phaser.Group) {
        this.game = game;
        this.group = game.add.group();
        if (parent_group) {
            parent_group.add(this.group);
        }
        this.group.x = x;
        this.group.y = y;
        this.bg_graphics = this.game.add.graphics(0, 0);
        this.border_graphics = this.game.add.graphics(0, 0);
        this.bar_graphics = this.game.add.graphics(0, 0);
        this.draw_components();
        this.group.add(this.bg_graphics);
        this.group.add(this.border_graphics);
        this.group.add(this.bar_graphics);
    }

    private draw_components() {
        this.bg_graphics.beginFill(Window.DEFAULT_WINDOW_COLOR, 1);
        this.bg_graphics.drawRect(Loader.BG_X, Loader.BG_Y, Loader.BG_WIDTH, Loader.BG_HEIGHT);
        this.bg_graphics.endFill();

        this.border_graphics.lineStyle(1, Loader.LIGHT_BORDER_COLOR);
        this.border_graphics.moveTo(1, 0);
        this.border_graphics.lineTo(this.bg_graphics.width + 1, 0);
        this.border_graphics.lineStyle(1, Loader.LIGHT_BORDER_COLOR);
        this.border_graphics.moveTo(1, this.bg_graphics.height + 1);
        this.border_graphics.lineTo(this.bg_graphics.width + 1, this.bg_graphics.height + 1);
        this.border_graphics.lineStyle(1, Loader.LIGHT_BORDER_COLOR);
        this.border_graphics.moveTo(this.bg_graphics.width + 1, 0);
        this.border_graphics.lineTo(this.bg_graphics.width + 1, this.bg_graphics.height);
        this.border_graphics.lineStyle(1, Loader.LIGHT_BORDER_COLOR);
        this.border_graphics.moveTo(0, 0);
        this.border_graphics.lineTo(0, this.bg_graphics.height);

        this.border_graphics.lineStyle(1, 0x0);
        this.border_graphics.moveTo(2, this.bg_graphics.height + 2);
        this.border_graphics.lineTo(this.bg_graphics.width + 2, this.bg_graphics.height + 2);
        this.border_graphics.lineStyle(1, 0x0);
        this.border_graphics.moveTo(this.bg_graphics.width + 2, 1);
        this.border_graphics.lineTo(this.bg_graphics.width + 2, this.bg_graphics.height + 1);

        this.bar_graphics.beginFill(Loader.BAR_COLOR, 1);
        this.bar_graphics.drawRect(Loader.BG_X, Loader.BG_Y, Loader.BG_WIDTH, Loader.BG_HEIGHT);
        this.bar_graphics.endFill();
    }

    set_loading_percentage(percentage: number) {
        percentage = _.clamp(percentage, 0, 100);
        const width = ((Loader.BG_WIDTH * percentage) / 100) | 0;
        this.bar_graphics.width = _.clamp(width, 0, Loader.BG_WIDTH);
    }
}
