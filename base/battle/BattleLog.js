import * as numbers from '../../magic_numbers.js';
import { ability_msg_types } from '../Ability.js';

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

    add(text, top = false) {
        if (top) {
            this.logs[LOG_1_KEY].setText(text);
            this.logs[LOG_2_KEY].setText("");
        } else {
            this.logs[LOG_1_KEY].setText(this.logs[LOG_2_KEY].text);
            this.logs[LOG_2_KEY].setText(text);
        }
    }

    add_ability(caster, ability, item_name) {
        switch (ability.msg_type) {
            case ability_msg_types.ATTACK:
                this.add(`${caster.name} attacks!`);
                break;
            case ability_msg_types.CAST:
                this.add(`${caster.name} casts ${ability.name}!`);
                break;
            case ability_msg_types.UNLEASH:
                this.add(`${caster.name} unleashes ${ability.name}!`);
                break;
            case ability_msg_types.SUMMON:
                this.add(`${caster.name} summons ${ability.name}!`);
                break;
            case ability_msg_types.USE:
                this.add(`${caster.name} uses ${ability.name}!`);
                break;
            case ability_msg_types.DEFEND:
                this.add(`${caster.name} is defending!`);
                break;
            case ability_msg_types.ITEM_UNLEASH:
                this.add(`${caster.name}'s ${item_name}`);
                this.add(`lets out a howl! ${ability.name}!`);
                break;
        }
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