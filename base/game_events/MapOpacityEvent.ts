import {GameEvent, event_types} from "./GameEvent";

export class MapOpacityEvent extends GameEvent {
    private map_layer_name: string;
    private finish_events: GameEvent[];
    private map_layer: any;
    private opacity: number;
    private duration: number;

    constructor(game, data, active, key_name, keep_reveal, map_layer_name, finish_events, opacity, duration) {
        super(game, data, event_types.MAP_OPACITY, active, key_name, keep_reveal);
        this.map_layer_name = map_layer_name;
        this.finish_events = [];
        if (finish_events !== undefined) {
            finish_events.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info);
                this.finish_events.push(event);
            });
        }
        this.opacity = opacity;
        this.duration = duration ?? 0;
    }

    async _fire() {
        this.map_layer = this.data.map.get_layer(this.map_layer_name);

        if (!this.map_layer || !this.map_layer.sprite) {
            return;
        }

        ++this.data.game_event_manager.events_running_count;

        if (this.duration > 30) {
            this.game.add
                .tween(this.map_layer.sprite)
                .to({alpha: this.opacity}, this.duration, Phaser.Easing.Linear.None, true)
                .onComplete.addOnce(() => {
                    this.map_layer.visible = this.map_layer.sprite.alpha > 0;
                    this.finish();
                });
        } else {
            this.map_layer.sprite.alpha = this.opacity;
            this.map_layer.visible = this.map_layer.sprite.alpha > 0;
            this.finish();
        }
    }

    finish() {
        --this.data.game_event_manager.events_running_count;
        this.map_layer = null;
        this.finish_events.forEach(event => event.fire(this.origin_npc));
    }

    _destroy() {
        this.map_layer = null;
        this.finish_events.forEach(event => event?.destroy());
    }
}
