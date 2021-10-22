import {NPC} from "../NPC";
import {GameEvent, event_types} from "./GameEvent";

export class MapOpacityEvent extends GameEvent {
    private map_layer_name: string;
    private finish_events: GameEvent[] = [];
    private map_layer: any;
    private opacity: number;
    private duration: number;

    constructor(
        game,
        data,
        active,
        key_name,
        map_layer_name,
        finish_events,
        opacity,
        duration
    ) {
        super(game, data, event_types.MAP_OPACITY, active, key_name);
        this.map_layer_name = map_layer_name;
        if (finish_events !== undefined) {
            finish_events.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info);
                this.finish_events.push(event);
            });
        }
        this.opacity = opacity;
        this.duration = duration;
    }

    private get_map_layer() {
        return this.data.map.get_layer(this.map_layer_name);
    }

    async _fire(origin_npc?: NPC) {
        if (!this.active) return;
        this.map_layer = this.get_map_layer();

        if (!this.map_layer || !this.map_layer.sprite) {
            return;
        }

        ++this.data.game_event_manager.events_running_count;

        if (this.duration > 0) {
            this.game.add.tween(this.map_layer.sprite)
                .to({"alpha": this.opacity}, this.duration, Phaser.Easing.Linear.None, true)
                .onComplete.add(() => {
                    this.map_layer.visible = this.map_layer.sprite.alpha > 0;
                    this.finish();
                });
        }
        else {
            this.map_layer.sprite.alpha = this.opacity;
            this.map_layer.visible = this.map_layer.sprite.alpha > 0;
            this.finish();
        }
        this.origin_npc = origin_npc;
    }

    finish() {
        --this.data.game_event_manager.events_running_count;
        this.map_layer = null;
        this.finish_events.forEach(event => event.fire(this.origin_npc));
    }

    destroy() {
        this.map_layer = null;
        this.finish_events.forEach(event => event.destroy());
        this.origin_npc = null;
        this.active = false;
    }
}
