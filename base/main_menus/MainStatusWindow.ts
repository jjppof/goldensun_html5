import {GoldenSun} from "../GoldenSun";

export class MainStatusWindow {
    private static readonly MAIN_WIN = {
        X: 0,
        Y: 39,
        WIDTH: 236,
        HEIGHT: 116,
    };

    private game: Phaser.Game;
    private data: GoldenSun;

    public constructor(game: Phaser.Game, data: GoldenSun) {
        this.game = game;
        this.data = data;
    }
}
