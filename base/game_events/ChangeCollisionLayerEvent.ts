import {GameEvent, event_types} from "./GameEvent";

export class ChangeCollisionLayerEvent extends GameEvent {
    private target_collision_layer: number;

    constructor(game, data, active, key_name, keep_reveal, keep_custom_psynergy, target_collision_layer) {
        super(game, data, event_types.CHANGE_COLLISION_LAYER, active, key_name, keep_reveal, keep_custom_psynergy);
        this.target_collision_layer = target_collision_layer;
    }

    _fire() {
        this.data.collision.change_map_body(this.target_collision_layer);
    }

    _destroy() {}
}
