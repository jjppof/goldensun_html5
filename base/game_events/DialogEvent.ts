import {NPC} from "../NPC";
import {DialogManager} from "../utils/DialogManager";
import {GameEvent, event_types} from "./GameEvent";
import {Button} from "../XGamepad";

type DialogInfo = {
    text: string;
    avatar: string;
    voice_key: string;
};

export class DialogEvent extends GameEvent {
    private dialog_manager: DialogManager = null;
    private running: boolean = false;
    private control_enable: boolean = true;
    private npc_hero_reciprocal_look: boolean = false;
    private reset_reciprocal_look: boolean = true;
    private finish_events: GameEvent[] = [];
    private previous_npc_direction: number;
    private control_key: number;
    private dialog_info: DialogInfo[];
    private dialog_index: number;

    constructor(
        game,
        data,
        active,
        key_name,
        dialog_info,
        npc_hero_reciprocal_look,
        reset_reciprocal_look,
        finish_events
    ) {
        super(game, data, event_types.DIALOG, active, key_name);
        this.dialog_info = Array.isArray(dialog_info) ? dialog_info : [dialog_info];
        this.npc_hero_reciprocal_look = npc_hero_reciprocal_look ?? false;
        this.reset_reciprocal_look = reset_reciprocal_look ?? true;
        this.control_key = null;
        this.dialog_index = 0;

        if (finish_events !== undefined) {
            finish_events.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info);
                this.finish_events.push(event);
            });
        }
    }

    set_control() {
        this.reset_control();
        this.control_key = this.data.control_manager.add_controls(
            [
                {
                    buttons: Button.A,
                    on_down: () => {
                        if (!this.active || !this.running || !this.control_enable) return;
                        this.next();
                    },
                },
            ],
            {persist: true}
        );
    }

    reset_control() {
        if (this.control_key !== null) {
            this.data.control_manager.detach_bindings(this.control_key);
            this.control_key = null;
        }
    }

    async finish() {
        if (this.origin_npc && this.npc_hero_reciprocal_look && this.reset_reciprocal_look) {
            await this.origin_npc.face_direction(this.previous_npc_direction);
        }
        this.running = false;
        this.dialog_index = 0;
        this.reset_control();
        --this.data.game_event_manager.events_running_count;
        this.finish_events.forEach(event => event.fire(this.origin_npc));
    }

    next() {
        this.control_enable = false;
        this.dialog_manager.next(async finished => {
            this.control_enable = true;
            if (finished) {
                if (this.dialog_index === this.dialog_info.length) {
                    await this.finish();
                } else {
                    this.start_dialog();
                }
            }
        });
    }

    start_dialog() {
        const info = this.dialog_info[this.dialog_index];
        ++this.dialog_index;
        this.set_control();
        this.dialog_manager = new DialogManager(this.game, this.data);
        this.dialog_manager.set_dialog(info.text, {
            avatar: info.avatar ?? this.origin_npc.avatar,
            voice_key: info.voice_key ?? this.origin_npc.voice_key,
        });
        this.next();
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
        this.dialog_index = 0;
        this.start_dialog();
    }

    destroy() {
        this.finish_events.forEach(event => event.destroy());
        this.dialog_index = 0;
        this.origin_npc = null;
        this.dialog_manager?.destroy();
        this.reset_control();
        this.active = false;
    }
}
