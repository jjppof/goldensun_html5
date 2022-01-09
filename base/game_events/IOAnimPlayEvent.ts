import {GameEvent, event_types} from "./GameEvent";
import {NPC} from "../NPC";

export class IOAnimPlayEvent extends GameEvent {
    private finish_events: GameEvent[] = [];
    private io_label: string;
    private action: string;
    private animation: string;
    private frame_rate: number;
    private loop: boolean;

    constructor(game, data, active, key_name, io_label, action, animation, frame_rate, loop, finish_events) {
        super(game, data, event_types.IO_ANIM_PLAY, active, key_name);
        this.io_label = io_label;
        this.action = action;
        this.animation = animation;
        this.frame_rate = frame_rate;
        this.loop = loop;
        if (finish_events !== undefined) {
            finish_events.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info);
                this.finish_events.push(event);
            });
        }
    }

    async _fire(oringin_npc: NPC) {
        if (!this.active) return;
        this.origin_npc = oringin_npc;

        const interactable_object = this.data.map.interactable_objects_label_map[this.io_label];
        const animation = interactable_object.play(this.action, this.animation, this.frame_rate, this.loop);
        if (!animation.loop) {
            ++this.data.game_event_manager.events_running_count;
            animation.onComplete.addOnce(() => {
                --this.data.game_event_manager.events_running_count;
                this.finish_events.forEach(event => event.fire(this.origin_npc));
            });
        }
    }

    destroy() {
        this.finish_events.forEach(event => event.destroy());
        this.origin_npc = null;
        this.active = false;
    }
}
