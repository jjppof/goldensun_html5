import * as numbers from '../../magic_numbers.js';

const LOG_X = 3;
const LOG_1_Y = 139;
const LOG_2_Y = 151;
const LOG_1_KEY = "log_1";
const LOG_2_KEY = "log_2";

export class BattleLog {
    constructor(game) {
        this.game = game;
        this.x = game.camera.x;
        this.y = game.camera.y;
        this.logs = {};
        this.create(LOG_1_KEY, this.y + LOG_1_Y);
        this.create(LOG_2_KEY, this.y + LOG_2_Y);
    }

    create(key, y_pos) {
        this.logs[key] = this.game.add.bitmapText(this.x + LOG_X, y_pos, 'gs-bmp-font', "", numbers.FONT_SIZE);
        this.logs[key].tint = numbers.DEFAULT_FONT_COLOR;
        this.logs[key].smoothed = false;
        this.logs[key].autoRound = true;
    }

    add(text) {
        this.logs[LOG_2_KEY].setText(this.logs[LOG_1_KEY].text);
        this.logs[LOG_1_KEY].setText(text);
    }

    clear() {
        this.logs[LOG_1_KEY].setText("");
        this.logs[LOG_2_KEY].setText("");
    }

    destroy() {
        this.logs[LOG_1_KEY].destroy();
        this.logs[LOG_2_KEY].destroy();
    }
}