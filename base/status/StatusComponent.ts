import { BitmapText } from "phaser-ce";
import { GoldenSun } from "../GoldenSun";
import { Window } from "../Window";
import { BattleStatusWindow } from "../windows/battle/BattleStatusWindow";

export abstract class StatusComponent{
    protected static readonly GROUP_KEY = "status_component";

    protected game:Phaser.Game;
    protected data:GoldenSun;
    protected window:Window;

    protected current_line:number;
    protected current_col:number;

    protected highlight:Phaser.Graphics;
    protected state_sprites:(Phaser.Sprite|BitmapText)[];
    protected manager:BattleStatusWindow;

    public constructor(game:Phaser.Game, data:GoldenSun, window:Window, manager:BattleStatusWindow, pos?:{line:number, col:number}){
        if(this.constructor === StatusComponent){
            throw new Error("Cannot instanciate abstract class.");
        }
        else{
            this.game = game;
            this.data = data;
            this.window = window;

            this.window.define_internal_group(StatusComponent.GROUP_KEY, {x:0, y:0});
            this.highlight = this.game.add.graphics(0, 0);
            this.highlight.blendMode = PIXI.blendModes.SCREEN;
            this.window.add_to_internal_group(StatusComponent.GROUP_KEY, this.highlight);

            this.state_sprites = [];
            this.manager = manager;

            this.current_col = pos ? pos.col : 0;
            this.current_line = pos ? pos.line : 0;

            this.initialize();
            this.select_option();
        }
    }

    protected update_highlight(highlight:{x:number, y:number, width:number, height:number}){
        this.highlight.clear();

        this.highlight.beginFill(this.window.color, 1);
        this.highlight.drawRect(highlight.x, highlight.y, highlight.width, highlight.height);
        this.highlight.endFill();
    }

    public get current_pos(){
        return {line: this.current_line, col: this.current_col};
    }

    public select_option(){
        throw new Error("Abstract method must by implemented by inheritance");
    }

    public on_change(){
        throw new Error("Abstract method must by implemented by inheritance");
    }

    public on_left(){
        throw new Error("Abstract method must by implemented by inheritance");
    }

    public on_right(){
        throw new Error("Abstract method must by implemented by inheritance");
    }

    public on_up(){
        throw new Error("Abstract method must by implemented by inheritance");
    }

    public on_down(){
        throw new Error("Abstract method must by implemented by inheritance");
    }

    public initialize(){
        throw new Error("Abstract method must by implemented by inheritance");
    }

    public destroy(){
        this.highlight.clear();
        this.highlight.destroy();
        this.data.cursor_manager.hide();

        for(let index in this.state_sprites){
            this.state_sprites[index].destroy();
        }
        this.state_sprites = [];
    }
}