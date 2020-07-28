import * as numbers from '../../magic_numbers.js';
import { ability_msg_types } from '../Ability.js';

const LOG_X = 3;
const LOG_OUT_Y = 127;
const LOG_1_Y = 139;
const LOG_2_Y = 151;
const ANIM_DURATION = 50;

export class BattleLog {
    constructor(game) {
        this.game = game;
        this.x = game.camera.x;
        this.y = game.camera.y;
        this.logs = [];
        this.logs.push(this.create(this.y + LOG_1_Y));
        this.logs.push(this.create(this.y + LOG_2_Y));
    }

    create(y_pos) {
        const log_text = this.game.add.bitmapText(this.x + LOG_X, y_pos, 'gs-bmp-font', "", numbers.FONT_SIZE);
        log_text.tint = numbers.DEFAULT_FONT_COLOR;
        log_text.smoothed = false;
        log_text.autoRound = true;
        return log_text
    }

    add(text) {
        let resolve_anim;
        const promise = new Promise(resolve => { resolve_anim = resolve; })
        if (this.logs[0].text === "") {
            this.logs[0].setText(text);
            this.logs[1].setText("");
            resolve_anim();
        } else if (this.logs[1].text === "") {
            this.logs[1].setText(text);
            resolve_anim();
        } else {
            this.game.add.tween(this.logs[0]).to({
                y: this.y + LOG_OUT_Y
            }, ANIM_DURATION, Phaser.Easing.Linear.None, true);
            this.game.add.tween(this.logs[1]).to({
                y: this.y + LOG_1_Y
            }, ANIM_DURATION, Phaser.Easing.Linear.None, true).onComplete.addOnce(() => {
                this.logs[0].y = this.y + LOG_2_Y;
                this.logs[0].setText(text);
                this.logs.reverse();
                resolve_anim();
            });
        }
        return promise;
    }

    async add_ability(caster, ability, item_name, djinn_name) {
        switch (ability.msg_type) {
            case ability_msg_types.ATTACK:
                await this.add(`${caster.name} attacks!`);
                break;
            case ability_msg_types.CAST:
                await this.add(`${caster.name} casts ${ability.name}!`);
                break;
            case ability_msg_types.UNLEASH:
                await this.add(`${caster.name} unleashes ${ability.name}!`);
                break;
            case ability_msg_types.SUMMON:
                await this.add(`${caster.name} summons ${ability.name}!`);
                break;
            case ability_msg_types.USE:
                await this.add(`${caster.name} uses ${ability.name}!`);
                break;
            case ability_msg_types.DEFEND:
                await this.add(`${caster.name} is defending!`);
                break;
            case ability_msg_types.ITEM_UNLEASH:
                await this.add(`${caster.name}'s ${item_name}`);
                await this.add(`lets out a howl! ${ability.name}!`);
                break;
            case ability_msg_types.SET_DJINN:
                await this.add(`${djinn_name} is set to ${caster.name}!`);
        }
    }

    clear() {
        this.logs[0].setText("");
        this.logs[1].setText("");
    }

    destroy() {
        this.logs[0].destroy();
        this.logs[1].destroy();
    }
}