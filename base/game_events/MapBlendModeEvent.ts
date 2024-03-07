import {parse_blend_mode} from "../utils";
import {GameEvent, event_types} from "./GameEvent";

export class MapBlendModeEvent extends GameEvent {
    private map_layer_name: string;
    private blend_mode: PIXI.blendModes;

    constructor(game, data, active, key_name, keep_reveal, keep_custom_psynergy, map_layer_name, blend_mode) {
        super(game, data, event_types.MAP_BLEND_MODE, active, key_name, keep_reveal, keep_custom_psynergy);
        this.map_layer_name = map_layer_name;
        this.blend_mode = parse_blend_mode(blend_mode);
    }

    _fire() {
        const map_layer = this.data.map.get_layer(this.map_layer_name);

        if (!map_layer || !map_layer.sprite) {
            return;
        }

        map_layer.sprite.blendMode = this.blend_mode;
        this.data.map.layer_changes[this.map_layer_name].layer_blend = this.blend_mode;
    }

    _destroy() {}
}
