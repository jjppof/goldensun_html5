import {GameEvent, event_types} from "./GameEvent";
import {NPC} from "../NPC";
import {ControllableChar} from "../ControllableChar";

export class EmoticonEvent extends GameEvent {
    private static readonly DEFAULT_DURATION = 800;

    private emoticon: string;
    private duration: number;
    private sound_effect: string;
    private is_npc: boolean;
    private npc_index: number;
    private char: ControllableChar;
    private finish_events: GameEvent[] = [];
    private location: {x: number; y: number};
    private face_hero: boolean;

    constructor(
        game,
        data,
        active,
        emoticon,
        duration,
        sound_effect,
        is_npc,
        npc_index,
        location,
        face_hero,
        finish_events
    ) {
        super(game, data, event_types.EMOTICON, active);
        this.emoticon = emoticon;
        this.duration = duration ?? EmoticonEvent.DEFAULT_DURATION;
        this.sound_effect = sound_effect;
        this.is_npc = is_npc;
        this.npc_index = npc_index;
        this.location = location;
        this.face_hero = face_hero ?? true;
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

    async _fire(oringin_npc: NPC) {
        if (!this.active) return;
        this.origin_npc = oringin_npc;
        ++this.data.game_event_manager.events_running_count;
        this.set_char();

        if (this.face_hero && this.char !== this.data.hero) {
            await this.data.game_event_manager.set_npc_and_hero_directions(this.origin_npc);
        }

        await this.char.show_emoticon(this.emoticon, {
            duration: this.duration,
            location: {
                x: this.location?.x,
                y: this.location?.y,
            },
            sound_effect: this.sound_effect,
        });

        this.finish();
    }

    finish() {
        this.is_npc = undefined;
        --this.data.game_event_manager.events_running_count;
        this.finish_events.forEach(event => event.fire(this.origin_npc));
    }

    destroy() {
        this.finish_events.forEach(event => event.destroy());
        this.origin_npc = null;
        this.char = null;
    }
}
