import {ControllableChar} from "ControllableChar";
import {get_centered_pos_in_px} from "../utils";
import {GameEvent, event_types} from "./GameEvent";
import * as _ from "lodash";

export class CharTweenPositionEvent extends GameEvent {
    private is_npc: boolean;
    private npc_label: string;
    private duration: number;
    private ease: Function;
    private repeat: number;
    private yoyo: boolean;
    private position: {x?: number; y?: number};
    private incremental: boolean;
    private is_px: boolean;
    private finish_events: GameEvent[];
    private hide_shadow: boolean;
    private keep_shadow_hidden: boolean;
    private shadow_follow_char: boolean;
    private keep_char_collision_disable: boolean;
    private prev_collision_status: boolean;

    constructor(
        game,
        data,
        active,
        key_name,
        keep_reveal,
        is_npc,
        npc_label,
        duration,
        ease,
        repeat,
        yoyo,
        position,
        incremental,
        is_px,
        finish_events,
        hide_shadow,
        keep_shadow_hidden,
        shadow_follow_char,
        keep_char_collision_disable
    ) {
        super(game, data, event_types.CHAR_TWEEN_POSITION, active, key_name, keep_reveal);
        this.is_npc = is_npc;
        this.npc_label = npc_label;
        this.duration = duration;
        this.ease = ease ? _.get(Phaser.Easing, ease) : Phaser.Easing.Linear.None;
        this.repeat = repeat ?? 0;
        this.yoyo = yoyo ?? false;
        this.position = position ?? {};
        this.incremental = incremental ?? false;
        this.is_px = is_px ?? true;
        this.hide_shadow = hide_shadow ?? false;
        this.keep_shadow_hidden = keep_shadow_hidden ?? false;
        this.shadow_follow_char = shadow_follow_char ?? true;
        this.keep_char_collision_disable = keep_char_collision_disable ?? false;
        this.finish_events = [];
        if (finish_events !== undefined) {
            finish_events.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info, this.type, this.origin_npc);
                this.finish_events.push(event);
            });
        }
    }

    async _fire() {
        const target_char =
            GameEvent.get_char(this.data, {
                is_npc: this.is_npc,
                npc_label: this.npc_label,
            }) ?? this.origin_npc;
        if (!target_char || !target_char.sprite) {
            return;
        }
        ++this.data.game_event_manager.events_running_count;
        const tween_pos: CharTweenPositionEvent["position"] = {};
        if (this.position.hasOwnProperty("x")) {
            tween_pos.x = this.is_px
                ? this.position.x
                : get_centered_pos_in_px(this.position.x, this.data.map.tile_width);
            tween_pos.x = this.incremental ? target_char.x + tween_pos.x : tween_pos.x;
        }
        if (this.position.hasOwnProperty("y")) {
            tween_pos.y = this.is_px
                ? this.position.y
                : get_centered_pos_in_px(this.position.y, this.data.map.tile_height);
            tween_pos.y = this.incremental ? target_char.y + tween_pos.y : tween_pos.y;
        }
        this.prev_collision_status = target_char.shapes_collision_active;
        const target = target_char.body ?? target_char.sprite;
        if (this.duration >= 30) {
            target_char.toggle_collision(false);
            if (this.hide_shadow && target_char.shadow) {
                target_char.shadow.visible = false;
            }
            const tween = this.game.add
                .tween(target)
                .to(tween_pos, this.duration, this.ease, true, undefined, this.repeat, this.yoyo);
            tween.onComplete.addOnce(() => {
                this.finish(target_char);
            });
            if (this.shadow_follow_char) {
                tween.onUpdateCallback(() => {
                    target_char.update_shadow();
                });
            }
        } else {
            if (tween_pos.hasOwnProperty("x")) {
                target_char.x = tween_pos.x;
            }
            if (tween_pos.hasOwnProperty("y")) {
                target_char.y = tween_pos.y;
            }
            this.finish(target_char);
        }
    }

    finish(target_char: ControllableChar) {
        if (!this.keep_char_collision_disable) {
            target_char.toggle_collision(this.prev_collision_status);
        }
        if (this.hide_shadow && target_char.shadow && !this.keep_shadow_hidden) {
            target_char.shadow.visible = true;
        }
        --this.data.game_event_manager.events_running_count;
        this.finish_events.forEach(event => event.fire(this.origin_npc));
    }

    _destroy() {
        this.finish_events.forEach(event => event?.destroy());
    }
}
