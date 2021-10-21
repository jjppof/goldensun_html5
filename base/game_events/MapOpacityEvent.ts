import {NPC} from "../NPC";
import {event_types} from "./GameEvent";
import {MapControlEvent} from "./MapControlEvent";

export class MapOpacityEvent extends MapControlEvent {
    private map_layer: any;
    private opacity: number;
    private animation_time: number;

    constructor(
        game,
        data,
        active,
        key_name,
        map_layer_name,
        finish_events,
        opacity,
        animation_time
    ) {
        super(game, data, event_types.MAP_OPACITY, active, key_name, map_layer_name, finish_events);
        this.opacity = opacity;
        this.animation_time = animation_time;
    }

    async _fire(origin_npc?: NPC) {
        if (!this.active) return;
        this.map_layer = this.get_map_layer();

        if (!this.map_layer || !this.map_layer.sprite) {
            return;
        }

        ++this.data.game_event_manager.events_running_count;

        if (this.animation_time > 0) {
            new Phaser.Tween(this.map_layer.sprite, this.data.game, this.data.game.tweens)
                .to({ "alpha": this.opacity}, this.animation_time, null, true)
                .onComplete.add(() => {
                    if (this.map_layer.sprite.alpha === 0) {
                        this.map_layer.visible = false;
                    }
                    this.finish();
                });
        }
        else {
            this.map_layer.sprite.alpha = this.opacity;
            this.map_layer.visible == this.map_layer.sprite.alpha > 0;
            this.finish();
        }
        this.origin_npc = origin_npc;
    }

    finish() {
        --this.data.game_event_manager.events_running_count;
        this.finish_events.forEach(event => event.fire(this.origin_npc));
    }

    destroy() {
        this.finish_events.forEach(event => event.destroy());
        this.origin_npc = null;
        this.active = false;
    }
}
