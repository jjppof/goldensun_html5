import {BitmapText} from "phaser-ce";
import {GoldenSun} from "../GoldenSun";
import {Window} from "../Window";
import {BattleStatusWindow} from "../windows/battle/BattleStatusWindow";

export abstract class StatusComponent {
    protected static readonly GROUP_KEY = "status_component";

    protected game: Phaser.Game;
    protected data: GoldenSun;
    protected window: Window;

    protected current_line: number;
    protected current_col: number;

    protected highlight: Phaser.Graphics;
    protected state_sprites: (Phaser.Sprite | BitmapText)[];
    protected manager: BattleStatusWindow;

    public constructor(
        game: Phaser.Game,
        data: GoldenSun,
        window: Window,
        manager: BattleStatusWindow,
        pos?: {line: number; col: number}
    ) {
        this.game = game;
        this.data = data;
        this.window = window;

        this.window.define_internal_group(StatusComponent.GROUP_KEY, {x: 0, y: 0});
        this.highlight = this.game.add.graphics(0, 0);
        this.highlight.blendMode = PIXI.blendModes.SCREEN;
        this.window.add_to_internal_group(StatusComponent.GROUP_KEY, this.highlight);

        this.state_sprites = [];
        this.manager = manager;

        this.current_col = pos ? pos.col : 0;
        this.current_line = pos ? pos.line : 0;
    }

    public abstract select_option(): void;
    public abstract on_change(): void;
    public abstract on_left(): void;
    public abstract on_right(): void;
    public abstract on_up(): void;
    public abstract on_down(): void;
    public abstract initialize(): void;

    protected update_highlight(highlight: {x: number; y: number; width: number; height: number}) {
        this.highlight.clear();

        this.highlight.beginFill(this.window.color, 1);
        this.highlight.drawRect(highlight.x, highlight.y, highlight.width, highlight.height);
        this.highlight.endFill();
    }

    public get current_pos() {
        return {line: this.current_line, col: this.current_col};
    }

    public reset(pos?: {line: number; col: number}) {
        if (pos) {
            this.current_line = pos.line;
            this.current_col = pos.col;
        }

        this.clear();
        this.initialize();

        this.select_option();
        this.on_change();
    }

    public clear() {
        this.highlight.clear();
        this.data.cursor_manager.hide();

        for (let index in this.state_sprites) {
            this.state_sprites[index].destroy();
        }
        this.state_sprites = [];
    }
}
