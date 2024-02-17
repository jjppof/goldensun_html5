import {GameEvent, event_types} from "./GameEvent";
import * as _ from "lodash";

export class LayerTweenEvent extends GameEvent {
    private map_layer_name: string;
    private finish_events: GameEvent[];
    private duration: number;
    private destination_offset: {
        x?: number;
        y?: number;
    };
    private easing: string;

    constructor(
        game,
        data,
        active,
        key_name,
        keep_reveal,
        map_layer_name,
        finish_events,
        destination_offset,
        duration,
        easing
    ) {
        super(game, data, event_types.LAYER_TWEEN, active, key_name, keep_reveal);
        this.map_layer_name = map_layer_name;
        this.finish_events = [];
        if (finish_events !== undefined) {
            finish_events.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info, this.type, this.origin_npc);
                this.finish_events.push(event);
            });
        }
        this.destination_offset = destination_offset ?? {};
        this.duration = duration ?? 0;
        this.easing = easing ?? "Linear.None";
    }

    _fire() {
        const map_layer = this.data.map.get_layer(this.map_layer_name);

        if (!map_layer || !map_layer.sprite) {
            return;
        }

        ++this.data.game_event_manager.events_running_count;

        const finish = () => {
            this.data.map.layer_changes[this.map_layer_name].layer_offset = {
                x: map_layer.sprite.tileOffset.x,
                y: map_layer.sprite.tileOffset.y,
            };
            --this.data.game_event_manager.events_running_count;
            this.finish_events.forEach(event => event.fire(this.origin_npc));
        };

        if (this.duration > 30) {
            const easing = _.get(Phaser.Easing, this.easing);
            this.game.add
                .tween(map_layer.sprite.tileOffset)
                .to(_.pick(this.destination_offset, "x", "y"), this.duration, easing, true)
                .onComplete.addOnce(finish);
        } else {
            map_layer.sprite.tileOffset.x = this.destination_offset.x ?? map_layer.sprite.tileOffset.x;
            map_layer.sprite.tileOffset.y = this.destination_offset.y ?? map_layer.sprite.tileOffset.y;
            finish();
        }
    }

    _destroy() {
        this.finish_events.forEach(event => event?.destroy());
    }
}
