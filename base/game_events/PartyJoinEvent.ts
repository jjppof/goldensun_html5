import {NPC} from "../NPC";
import {DialogManager} from "../utils/DialogManager";
import {GameEvent, event_types} from "./GameEvent";
import {Button} from "../XGamepad";
import {MainChar} from "../MainChar";

export class PartyJoinEvent extends GameEvent {
    private char_key_name: string;
    private join: boolean;
    private dialog_manager: DialogManager = null;
    private running: boolean = false;
    private control_enable: boolean = true;
    private finish_events: GameEvent[] = [];
    private control_key: number;

    constructor(game, data, active, key_name, char_key_name, join, finish_events) {
        super(game, data, event_types.PARTY_JOIN, active, key_name);
        this.char_key_name = char_key_name;
        this.join = join;

        this.control_key = this.data.control_manager.add_controls(
            [
                {
                    buttons: Button.A,
                    on_down: () => {
                        if (!this.running || !this.control_enable) return;
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
                this.running = false;
                this.data.control_manager.detach_bindings(this.control_key);
                --this.data.game_event_manager.events_running_count;
                this.finish_events.forEach(event => event.fire(this.origin_npc));
            }
        });
    }

    async _fire(origin_npc?: NPC) {
        if (!this.active) return;
        ++this.data.game_event_manager.events_running_count;
        this.origin_npc = origin_npc;
        const this_char = this.data.info.main_char_list[this.char_key_name];
        if (this.join) {
            this.control_enable = false;
            this.running = true;
            this.dialog_manager = new DialogManager(this.game, this.data);
            const text = `${this_char.name} joined your party.`;
            this.dialog_manager.set_dialog(text, {
                avatar: this.char_key_name,
                avatar_inside_window: true,
                custom_max_dialog_width: 165,
            });
            MainChar.add_member_to_party(this.data.info.party_data, this_char);
            this.data.audio.pause_bgm();
            this.data.audio.play_se("misc/party_join", () => {
                this.data.audio.resume_bgm();
            });
            this.next();
        } else {
            MainChar.remove_member_from_party(this.data.info.party_data, this_char);
            this.data.control_manager.detach_bindings(this.control_key);
            --this.data.game_event_manager.events_running_count;
            this.finish_events.forEach(event => event.fire(this.origin_npc));
        }
    }

    destroy() {
        this.finish_events.forEach(event => event.destroy());
        this.origin_npc = null;
        this.dialog_manager?.destroy();
        this.data.control_manager.detach_bindings(this.control_key);
        this.active = false;
    }
}
