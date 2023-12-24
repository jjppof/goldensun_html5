import {ParticlesInfo} from "ParticlesWrapper";
import {EventValue, GameEvent, event_types} from "./GameEvent";

enum game_groups {
    LOWER = "lower",
    MIDDLE = "middle",
    OVER = "over",
}

export class ParticlesEvent extends GameEvent {
    private particles_info: ParticlesInfo;
    private group: Phaser.Group;

    constructor(game, data, active, key_name, keep_reveal, particles_info, group) {
        super(game, data, event_types.PARTICLES, active, key_name, keep_reveal);
        this.particles_info = particles_info;
        switch (group) {
            case game_groups.LOWER:
                this.group = this.data.underlayer_group;
                break;
            case game_groups.MIDDLE:
                this.group = this.data.middlelayer_group;
                break;
            case game_groups.OVER:
                this.group = this.data.overlayer_group;
                break;
        }
    }

    async _fire() {
        ++this.data.game_event_manager.events_running_count;
        const xy_pos_getter = (
            x: number | EventValue,
            y: number | EventValue,
            shift_x: number | EventValue,
            shift_y: number | EventValue
        ) => {
            let this_x = x as number;
            let this_y = y as number;
            let this_shift_x = shift_x as number;
            let this_shift_y = shift_y as number;
            if (x !== undefined && typeof x !== "number") {
                this_x = this.data.game_event_manager.get_value(x);
            }
            if (y !== undefined && typeof y !== "number") {
                this_y = this.data.game_event_manager.get_value(y);
            }
            if (shift_x !== undefined && typeof shift_x !== "number") {
                this_shift_x = this.data.game_event_manager.get_value(shift_x);
            }
            if (shift_y !== undefined && typeof shift_y !== "number") {
                this_shift_y = this.data.game_event_manager.get_value(shift_y);
            }
            this_x += this_shift_x ?? 0;
            this_y += this_shift_y ?? 0;
            return {x: this_x, y: this_y};
        };
        const promises = this.data.particle_wrapper.start_particles(
            this.particles_info,
            this.group,
            undefined,
            undefined,
            xy_pos_getter
        );
        const udpate_callback = () => this.data.particle_wrapper.render();
        this.data.game_event_manager.add_callback(udpate_callback);
        await Promise.all(promises);
        this.data.game_event_manager.remove_callback(udpate_callback);
        --this.data.game_event_manager.events_running_count;
    }

    _destroy() {}
}
