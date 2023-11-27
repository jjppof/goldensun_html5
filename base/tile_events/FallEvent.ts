import {ControllableChar} from "../ControllableChar";
import {event_types, TileEvent} from "./TileEvent";

export class FallEvent extends TileEvent {
    private options: Parameters<ControllableChar["fall"]>[0];

    constructor(
        game,
        data,
        x,
        y,
        activation_directions,
        initial_disabled_directions,
        activation_collision_layers,
        active_storage_key,
        affected_by_reveal,
        key_name: string,
        y_destination_position,
        dest_collision_layer,
        show_exclamation_emoticon,
        splash_sweat_drops,
        walking_in_the_air,
        ground_hit_animation,
        teleport
    ) {
        super(
            game,
            data,
            event_types.FALL,
            x,
            y,
            activation_directions,
            initial_disabled_directions,
            activation_collision_layers,
            active_storage_key,
            null,
            affected_by_reveal,
            key_name
        );
        this.options = {
            y_destination_position: y_destination_position,
            dest_collision_layer: dest_collision_layer,
            show_exclamation_emoticon: show_exclamation_emoticon,
            splash_sweat_drops: splash_sweat_drops,
            walking_in_the_air: walking_in_the_air,
            ground_hit_animation: ground_hit_animation,
            teleport: teleport,
        };
    }

    fire() {
        if (!this.check_position() || !this.data.hero_movement_allowed()) {
            return;
        }
        this.data.hero.fall(this.options);
    }

    destroy() {
        this.deactivate();
        this._origin_interactable_object = null;
    }
}
