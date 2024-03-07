import {get_centered_pos_in_px, get_tile_position} from "../utils";
import {GameEvent, event_types} from "./GameEvent";
import * as _ from "lodash";
import {InteractableObjects} from "../interactable_objects/InteractableObjects";

export class IOTweenPositionEvent extends GameEvent {
    private io_label: string;
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
    private shadow_follow_io: boolean;
    private keep_io_collision_disable: boolean;
    private prev_collision_status: boolean;
    private dest_collision_layer: number;
    private change_collision_layer_on_init: boolean;

    constructor(
        game,
        data,
        active,
        key_name,
        keep_reveal,
        keep_custom_psynergy,
        io_label,
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
        shadow_follow_io,
        keep_io_collision_disable,
        dest_collision_layer,
        change_collision_layer_on_init
    ) {
        super(game, data, event_types.IO_TWEEN_POSITION, active, key_name, keep_reveal, keep_custom_psynergy);
        this.io_label = io_label;
        this.duration = duration;
        this.ease = ease ? _.get(Phaser.Easing, ease) : Phaser.Easing.Linear.None;
        this.repeat = repeat ?? 0;
        this.yoyo = yoyo ?? false;
        this.position = position ?? {};
        this.incremental = incremental ?? false;
        this.is_px = is_px ?? true;
        this.hide_shadow = hide_shadow ?? false;
        this.keep_shadow_hidden = keep_shadow_hidden ?? false;
        this.shadow_follow_io = shadow_follow_io ?? true;
        this.keep_io_collision_disable = keep_io_collision_disable ?? false;
        this.dest_collision_layer = dest_collision_layer;
        this.change_collision_layer_on_init = change_collision_layer_on_init ?? false;
        this.finish_events = [];
        if (finish_events !== undefined) {
            finish_events.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info, this.type, this.origin_npc);
                this.finish_events.push(event);
            });
        }
    }

    async _fire() {
        const interactable_object = this.data.map.interactable_objects_label_map[this.io_label];
        if (!(this.io_label in this.data.map.interactable_objects_label_map)) {
            this.data.logger.log_message(`Game Event [${this.type}]: IO with label "${this.io_label}" doesn't exist.`);
            return;
        }
        ++this.data.game_event_manager.events_running_count;
        const tween_pos: IOTweenPositionEvent["position"] = {};
        if (this.position.hasOwnProperty("x")) {
            tween_pos.x = this.is_px
                ? this.position.x
                : get_centered_pos_in_px(this.position.x, this.data.map.tile_width);
            tween_pos.x = this.incremental ? interactable_object.x + tween_pos.x : tween_pos.x;
        }
        if (this.position.hasOwnProperty("y")) {
            tween_pos.y = this.is_px
                ? this.position.y
                : get_centered_pos_in_px(this.position.y, this.data.map.tile_height);
            tween_pos.y = this.incremental ? interactable_object.y + tween_pos.y : tween_pos.y;
        }
        this.prev_collision_status = interactable_object.shapes_collision_active;
        const target = interactable_object.body ?? interactable_object.sprite;
        if (this.change_collision_layer_on_init && this.dest_collision_layer !== undefined) {
            interactable_object.change_collision_layer(this.dest_collision_layer);
            this.data.map.sort_sprites();
        }
        if (this.duration >= 30) {
            interactable_object.toggle_collision(false);
            if (this.hide_shadow && interactable_object.shadow) {
                interactable_object.shadow.visible = false;
            }
            const tween = this.game.add
                .tween(target)
                .to(tween_pos, this.duration, this.ease, true, undefined, this.repeat, this.yoyo);
            tween.onComplete.addOnce(() => {
                this.finish(interactable_object);
            });
            if (this.shadow_follow_io) {
                tween.onUpdateCallback(() => {
                    interactable_object.update_shadow();
                });
            }
        } else {
            if (tween_pos.hasOwnProperty("x")) {
                interactable_object.x = tween_pos.x;
            }
            if (tween_pos.hasOwnProperty("y")) {
                interactable_object.y = tween_pos.y;
            }
            this.finish(interactable_object);
        }
    }

    finish(interactable_object: InteractableObjects) {
        if (!this.change_collision_layer_on_init && this.dest_collision_layer !== undefined) {
            interactable_object.change_collision_layer(this.dest_collision_layer);
        }
        const dest_tile_pos = {
            x: get_tile_position(interactable_object.x, this.data.map.tile_width),
            y: get_tile_position(interactable_object.y, this.data.map.tile_height),
        };
        interactable_object.shift_events(
            dest_tile_pos.x - interactable_object.tile_x_pos,
            dest_tile_pos.y - interactable_object.tile_y_pos
        );
        interactable_object.set_tile_position({
            x: dest_tile_pos.x,
            y: dest_tile_pos.y,
        });
        if (!this.keep_io_collision_disable) {
            interactable_object.toggle_collision(this.prev_collision_status);
        }
        if (this.hide_shadow && interactable_object.shadow && !this.keep_shadow_hidden) {
            interactable_object.shadow.visible = true;
        }
        --this.data.game_event_manager.events_running_count;
        this.finish_events.forEach(event => event.fire(this.origin_npc));
    }

    _destroy() {
        this.finish_events.forEach(event => event?.destroy());
    }
}
