import {GameEvent, event_types} from "./GameEvent";

export class LayerVisibilityEvent extends GameEvent {
    private map_layer_name: string;
    private visible: boolean;

    constructor(game, data, active, key_name, keep_reveal, keep_custom_psynergy, map_layer_name, visible) {
        super(game, data, event_types.LAYER_VISIBILITY, active, key_name, keep_reveal, keep_custom_psynergy);
        this.map_layer_name = map_layer_name;
        this.visible = visible ?? true;
    }

    _fire() {
        const map_layer = this.data.map.get_layer(this.map_layer_name);

        if (!map_layer || !map_layer.sprite) {
            return;
        }

        map_layer.sprite.visible = this.visible;
        this.data.map.layer_changes[this.map_layer_name].visibility = this.visible;
    }

    _destroy() {}
}
