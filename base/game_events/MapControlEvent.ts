import {GameEvent} from "./GameEvent";

export abstract class MapControlEvent extends GameEvent {
    protected map_layer_name: string;
    protected finish_events: GameEvent[] = [];

    constructor(
        game,
        data,
        event_type,
        active,
        key_name,
        map_layer_name,
        finish_events
    ) {
        super(game, data, event_type, active, key_name);
        this.map_layer_name = map_layer_name;
        if (finish_events !== undefined) {
            finish_events.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info);
                this.finish_events.push(event);
            });
        }
    }

    get_map_layer() {
        return this.data.map.get_layer(this.map_layer_name);
    }
}
