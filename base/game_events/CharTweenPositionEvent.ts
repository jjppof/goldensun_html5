import {get_centered_pos_in_px} from "../utils";
import {GameEvent, event_types} from "./GameEvent";

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
        finish_events
    ) {
        super(game, data, event_types.CHAR_TWEEN_POSITION, active, key_name, keep_reveal);
        this.is_npc = is_npc;
        this.npc_label = npc_label;
        this.duration = duration;
        this.ease = ease ?? Phaser.Easing.Linear.None;
        this.repeat = repeat ?? 0;
        this.yoyo = yoyo ?? false;
        this.position = position ?? {};
        this.incremental = incremental ?? false;
        this.is_px = is_px ?? true;
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
        const target = target_char.body ?? target_char.sprite;
        if (this.duration >= 30) {
            this.game.add
                .tween(target)
                .to(tween_pos, this.duration, this.ease, true, undefined, this.repeat, this.yoyo)
                .onComplete.addOnce(() => {
                    this.finish();
                });
        } else {
            if (tween_pos.hasOwnProperty("x")) {
                target_char.x = tween_pos.x;
            }
            if (tween_pos.hasOwnProperty("y")) {
                target_char.y = tween_pos.y;
            }
            this.finish();
        }
    }

    finish() {
        --this.data.game_event_manager.events_running_count;
        this.finish_events.forEach(event => event.fire(this.origin_npc));
    }

    _destroy() {
        this.finish_events.forEach(event => event?.destroy());
    }
}
