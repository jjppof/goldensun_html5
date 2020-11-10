import {StatusComponent} from "./StatusComponent";
import {Window} from "../Window";
import {GoldenSun} from "../GoldenSun";
import {CursorManager, PointVariants} from "../utils/CursorManager";
import {BattleStatusWindow} from "../windows/battle/BattleStatusWindow";

export class PsynergyStatistics extends StatusComponent {
    public constructor(
        game: Phaser.Game,
        data: GoldenSun,
        window: Window,
        manager: BattleStatusWindow,
        pos?: {line: number; col: number}
    ) {
        super(game, data, window, manager, pos);
    }

    public on_change() {}

    public select_option() {}

    public on_left() {}

    public on_right() {}

    public on_up() {}

    public on_down() {}

    public initialize() {}
}
