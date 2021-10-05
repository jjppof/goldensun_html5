import {NPC} from "../NPC";
import {DialogManager} from "../utils/DialogManager";
import {GameEvent, event_types} from "./GameEvent";
import {Button} from "../XGamepad";

export class DialogEvent extends GameEvent {
    private text: string;
    private avatar: string;
    private voice_key: string;
    private dialog_manager: DialogManager = null;
    private running: boolean = false;
    private control_enable: boolean = true;
    private npc_hero_reciprocal_look: boolean = false;
    private reset_reciprocal_look: boolean = true;
    private finish_events: GameEvent[] = [];
    private previous_npc_direction: number;
    private control_key: number;
    private disable_controls: number;

    constructor(
        game,
        data,
        active,
        key_name,
        text,
        avatar,
        npc_hero_reciprocal_look,
        reset_reciprocal_look,
        finish_events,
        voice_key,
        disable_controls
    ) {
        super(game, data, event_types.DIALOG, active, key_name);
        this.text = text;
        this.avatar = avatar;
        this.npc_hero_reciprocal_look = npc_hero_reciprocal_look ?? false;
        this.reset_reciprocal_look = reset_reciprocal_look ?? true;
        this.voice_key = voice_key ?? "";
        this.disable_controls = disable_controls ?? false;

        this.control_key = this.data.control_manager.add_controls(
            [
                {
                    button: Button.A,
                    on_down: () => {
                        if (!this.active || !this.running || !this.control_enable) return;
                        this.next();
                    },
                },
            ],
            {persist: true}
        );

        if (finish_events !== undefined) {
            finish_events.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info);
                this.finish_events.push(event);
            });
        }
    }

    next() {
        this.control_enable = false;
        this.dialog_manager.next(async finished => {
            this.control_enable = true;
            if (finished) {
                if (this.origin_npc && this.npc_hero_reciprocal_look && this.reset_reciprocal_look) {
                    await this.origin_npc.face_direction(this.previous_npc_direction);
                }
                this.running = false;
                if (this.disable_controls) {
                    this.data.control_manager.detach_bindings(this.control_key);
                }
                --this.data.game_event_manager.events_running_count;
                this.finish_events.forEach(event => event.fire(this.origin_npc));
            }
        });
    }

    async _fire(origin_npc?: NPC) {
        if (!this.active) return;
        ++this.data.game_event_manager.events_running_count;
        this.control_enable = false;
        this.running = true;
        this.origin_npc = origin_npc;
        if (this.origin_npc && this.npc_hero_reciprocal_look) {
            this.previous_npc_direction = this.origin_npc.current_direction;
            await this.data.game_event_manager.set_npc_and_hero_directions(this.origin_npc);
        }
        this.dialog_manager = new DialogManager(this.game, this.data);
        this.dialog_manager.set_dialog(this.text, {
            avatar: this.avatar,
            voice_key: this.voice_key ? this.voice_key : origin_npc.voice_key,
        });
        this.next();
    }

    destroy() {
        this.finish_events.forEach(event => event.destroy());
        this.origin_npc = null;
        this.dialog_manager?.destroy();
        if (this.disable_controls) {
            this.data.control_manager.detach_bindings(this.control_key);
        }
        this.active = false;
    }
}
