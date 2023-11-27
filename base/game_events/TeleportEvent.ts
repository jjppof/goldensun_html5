import {TeleportEvent as TileTeleportEvent} from "../tile_events/TeleportEvent";
import {GameEvent, event_types} from "./GameEvent";

export class TeleportEvent extends GameEvent {
    private target_map_key: string;
    private target_tile_position: {x: number; y: number};
    private target_collision_layer: number;
    private target_direction: string;
    private keep_encounter_cumulator: boolean;
    private fade_color: string;

    constructor(
        game,
        data,
        active,
        key_name,
        keep_reveal,
        target_map_key,
        target_tile_position,
        target_collision_layer,
        target_direction,
        keep_encounter_cumulator,
        fade_color
    ) {
        super(game, data, event_types.TELEPORT, active, key_name, keep_reveal);
        this.target_map_key = target_map_key;
        this.target_tile_position = target_tile_position;
        this.target_collision_layer = target_collision_layer;
        this.target_direction = target_direction;
        this.keep_encounter_cumulator = keep_encounter_cumulator ?? true;
        this.fade_color = fade_color;
    }

    _fire() {
        const event = new TileTeleportEvent(
            this.game,
            this.data,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            false,
            undefined,
            this.target_map_key,
            this.target_tile_position.x,
            this.target_tile_position.y,
            false,
            false,
            false,
            this.target_collision_layer,
            this.target_direction,
            this.keep_encounter_cumulator,
            true,
            true,
            false,
            false,
            undefined,
            undefined,
            undefined,
            undefined,
            this.fade_color,
            undefined,
            undefined
        );
        event.set_fadein_callback(() => {
            this.data.game_event_manager.events_running_count = 0;
        });
        ++this.data.game_event_manager.events_running_count;
        event.fire();
    }

    _destroy() {}
}
