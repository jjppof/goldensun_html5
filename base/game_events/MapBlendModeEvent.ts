import {NPC} from "../NPC";
import {parse_blend_mode} from "../utils";
import {GameEvent, event_types} from "./GameEvent";

export class MapBlendModeEvent extends GameEvent {
    private map_layer_name: string;
    private blend_mode: PIXI.blendModes;

    constructor(game, data, active, key_name, map_layer_name, blend_mode) {
        super(game, data, event_types.MAP_BLEND_MODE, active, key_name);
        this.map_layer_name = map_layer_name;
        this.blend_mode = parse_blend_mode(blend_mode);
    }

    async _fire(origin_npc?: NPC) {
        if (!this.active) return;
        const map_layer = this.data.map.get_layer(this.map_layer_name);

        if (!map_layer || !map_layer.sprite) {
            return;
        }

        ++this.data.game_event_manager.events_running_count;

        map_layer.sprite.blendMode = this.blend_mode;

        this.finish();
    }

    finish() {
        --this.data.game_event_manager.events_running_count;
    }

    destroy() {
        this.active = false;
    }
}
