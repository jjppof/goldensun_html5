import * as numbers from "../magic_numbers";
import {ability_msg_types} from "../Ability";
import {effect_names, effect_types} from "../Effect";
import {element_names} from "../utils";
import {main_stats, on_remove_status_msg} from "../Player";

const LOG_X = 3;
const LOG_OUT_Y = 127;
const LOG_1_Y = 139;
const LOG_2_Y = 151;
const ANIM_DURATION = 50;

export class BattleLog {
    public game: Phaser.Game;
    public x: number;
    public y: number;
    public logs: Phaser.BitmapText[];

    constructor(game) {
        this.game = game;
        this.x = game.camera.x;
        this.y = game.camera.y;
        this.logs = [];
        this.logs.push(this.create(this.y + LOG_1_Y));
        this.logs.push(this.create(this.y + LOG_2_Y));
    }

    create(y_pos) {
        const log_text = this.game.add.bitmapText(this.x + LOG_X, y_pos, "gs-bmp-font", "", numbers.FONT_SIZE);
        log_text.tint = numbers.DEFAULT_FONT_COLOR;
        log_text.smoothed = false;
        log_text.autoRound = true;
        return log_text;
    }

    add(text) {
        let resolve_anim;
        const promise = new Promise(resolve => {
            resolve_anim = resolve;
        });
        if (this.logs[0].text === "") {
            this.logs[0].setText(text);
            this.logs[1].setText("");
            resolve_anim();
        } else if (this.logs[1].text === "") {
            this.logs[1].setText(text);
            resolve_anim();
        } else {
            this.game.add.tween(this.logs[0]).to(
                {
                    y: this.y + LOG_OUT_Y,
                },
                ANIM_DURATION,
                Phaser.Easing.Linear.None,
                true
            );
            this.game.add
                .tween(this.logs[1])
                .to(
                    {
                        y: this.y + LOG_1_Y,
                    },
                    ANIM_DURATION,
                    Phaser.Easing.Linear.None,
                    true
                )
                .onComplete.addOnce(() => {
                    this.logs[0].y = this.y + LOG_2_Y;
                    this.logs[0].setText(text);
                    this.logs.reverse();
                    resolve_anim();
                });
        }
        return promise;
    }

    async add_ability(caster, ability, item_name, djinn_name, force_use = false) {
        const msg_type = force_use ? ability_msg_types.USE : ability.msg_type;
        switch (msg_type) {
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
                await this.add(`${caster.name} uses ${item_name ? item_name : ability.name}!`);
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

    async add_recover_effect(effect) {
        const player = effect.char;
        switch (effect.type) {
            case effect_types.MAX_HP:
            case effect_types.MAX_PP:
            case effect_types.ATTACK:
            case effect_types.DEFENSE:
            case effect_types.AGILITY:
            case effect_types.LUCK:
                await this.add(`${player.name}'s ${effect_names[effect.type]} returns to normal!`);
                break;
            case effect_types.POWER:
            case effect_types.RESIST:
                await this.add(
                    `${player.name}'s ${element_names[effect.attribute]} ${
                        effect_names[effect.type]
                    } returns to normal!`
                );
                break;
            case effect_types.TEMPORARY_STATUS:
            case effect_types.PERMANENT_STATUS:
                await this.add(on_remove_status_msg[effect.status_key_name](player));
                break;
        }
    }

    async add_damage(damage, target, pp_damage = false) {
        const stat_str = pp_damage ? "PP" : "HP";
        const current_property = pp_damage ? main_stats.CURRENT_PP : main_stats.CURRENT_HP;
        const max_property = pp_damage ? main_stats.MAX_PP : main_stats.MAX_HP;
        if (damage >= 0) {
            if (target[current_property] - damage < 0) {
                damage = target[current_property];
            }
            await this.add(`${target.name} takes ${damage.toString()} damage!`);
        } else {
            if (target[current_property] >= target[max_property]) {
                await this.add(`${target.name}'s ${stat_str} is fully restored`);
            } else {
                await this.add(`${target.name} recovers ${Math.abs(damage).toString()} ${stat_str}!`);
            }
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
