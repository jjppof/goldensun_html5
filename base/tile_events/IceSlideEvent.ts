import {directions} from "../utils";
import {event_types, TileEvent} from "./TileEvent";

export class IceSlideEvent extends TileEvent {
    private start_sliding_direction: directions;
    private ready_to_deactive: boolean;

    constructor(
        game,
        data,
        x,
        y,
        activation_directions,
        activation_collision_layers,
        dynamic,
        active,
        active_storage_key,
        affected_by_reveal,
        key_name: string,
        start_sliding_direction
    ) {
        super(
            game,
            data,
            event_types.ICE_SLIDE,
            x,
            y,
            activation_directions,
            activation_collision_layers,
            dynamic,
            active,
            active_storage_key,
            null,
            affected_by_reveal,
            key_name
        );
        this.start_sliding_direction = directions[start_sliding_direction as string];
        this.ready_to_deactive = false;
    }

    fire() {
        if (!this.data.hero_movement_allowed()) {
            return;
        }
        if (this.check_position()) {
            let direction = this.data.hero.required_direction;
            if (direction !== this.start_sliding_direction) {
                if (((direction + 1) & 7) !== this.start_sliding_direction) {
                    --direction;
                } else {
                    ++direction;
                }
            }
            if (!this.data.hero.ice_sliding_active && direction === this.start_sliding_direction) {
                this.data.hero.ice_sliding_active = true;
                this.data.hero.dashing = false;
                this.data.hero.set_ice_slide_direction(this.start_sliding_direction);
                this.data.hero.set_speed_factors(false, this.start_sliding_direction);
            } else if (
                this.data.hero.ice_sliding_active &&
                this.data.hero.ice_slide_direction !== this.start_sliding_direction
            ) {
                this.ready_to_deactive = true;
                this.data.tile_event_manager.set_triggered_event(this);
            }
        } else if (this.ready_to_deactive && !this.check_position()) {
            this.data.tile_event_manager.unset_triggered_event(this);
            this.ready_to_deactive = false;
            this.data.hero.ice_sliding_active = false;
            this.data.hero.sliding_on_ice = false;
            this.data.hero.set_ice_slide_direction(null);
        }
    }

    destroy() {
        this._origin_interactable_object = null;
        this.deactivate();
    }
}
