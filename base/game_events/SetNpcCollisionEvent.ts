import {GameEvent, event_types} from "./GameEvent";

export class SetNpcCollisionEvent extends GameEvent {
    private collision_active: boolean;

    constructor(game, data, active, key_name, keep_reveal, keep_custom_psynergy, collision_active) {
        super(game, data, event_types.SET_NPC_COLLISION, active, key_name, keep_reveal, keep_custom_psynergy);
        this.collision_active = collision_active ?? true;
    }

    _fire() {
        if (this.collision_active) {
            this.data.collision.enable_npc_collision(this.data.map.collision_layer);
        } else {
            this.data.collision.disable_npc_collision();
        }
    }

    _destroy() {}
}
