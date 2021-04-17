import {GameEvent, event_types} from "./GameEvent";
import {NPC} from "../NPC";
import {ControllableChar} from "../ControllableChar";

export class EmoticonEvent extends GameEvent {
    private static readonly DEFAULT_DURATION = 1000;

    private emoticon: string;
    private duration: number;
    private sound_effect: string;
    private is_npc: boolean;
    private npc_index: number;
    private char: ControllableChar;
    private finish_events: GameEvent[] = [];

    constructor(game, data, active, emoticon, duration, sound_effect, is_npc, npc_index, finish_events) {
        super(game, data, event_types.EMOTICON, active);
        this.emoticon = emoticon;
        this.duration = duration ?? EmoticonEvent.DEFAULT_DURATION;
        this.sound_effect = sound_effect;
        this.is_npc = is_npc;
        this.npc_index = npc_index;
        if (finish_events !== undefined) {
            finish_events.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info);
                this.finish_events.push(event);
            });
        }
    }

    set_char() {
        if (this.is_npc === undefined && this.npc_index === undefined) {
            this.char = this.origin_npc;
            this.is_npc = true;
        } else if (this.is_npc) {
            this.char = this.data.map.npcs[this.npc_index];
        } else {
            this.char = this.data.hero;
            this.data.game_event_manager.allow_char_to_move = true;
        }
    }

    _fire(oringin_npc: NPC) {
        if (!this.active) return;
        this.origin_npc = oringin_npc;
        ++this.data.game_event_manager.events_running_count;
        this.set_char();
    }

    finish() {
        --this.data.game_event_manager.events_running_count;
        this.finish_events.forEach(event => event.fire(this.origin_npc));
    }

    destroy() {
        this.finish_events.forEach(event => event.destroy());
        this.origin_npc = null;
        this.char = null;
    }
}
