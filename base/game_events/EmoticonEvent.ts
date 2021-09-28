import {GameEvent, event_types} from "./GameEvent";
import {NPC} from "../NPC";
import {ControllableChar} from "../ControllableChar";

/**
 * The GameEvent that shows an emoticon above a ControllableChar head.
 */
export class EmoticonEvent extends GameEvent {
    private static readonly DEFAULT_DURATION = 800;

    /** INPUT. The emoticon key name. */
    private emoticon: string;
    /** INPUT. The emoticon show duration. */
    private duration: number;
    /** INPUT. A sfx to be played while on emoticon show. */
    private sound_effect: string;
    /** INPUT. Whether the target char is a NPC. If not, it's the hero. */
    private is_npc: boolean;
    /** INPUT. If the target char is a NPC, the npc unqie label. Use this or npc_index */
    private npc_label: number;
    /** INPUT. If the target char is a NPC, the npc index. Use this or npc_label */
    private npc_index: number;
    /** INPUT. The list of game events to be fired on this event end. */
    private finish_events: GameEvent[] = [];
    /** INPUT. A custom location for the emoticon. */
    private location: {x: number; y: number};
    /** INPUT. If target char is NPC, make hero and npc look each other. */
    private face_hero: boolean;
    /** The target char that will show the emoticon. */
    private char: ControllableChar;

    constructor(
        game,
        data,
        active,
        key_name,
        emoticon,
        duration,
        sound_effect,
        is_npc,
        npc_index,
        npc_label,
        location,
        face_hero,
        finish_events
    ) {
        super(game, data, event_types.EMOTICON, active, key_name);
        this.emoticon = emoticon;
        this.duration = duration ?? EmoticonEvent.DEFAULT_DURATION;
        this.sound_effect = sound_effect;
        this.is_npc = is_npc;
        this.npc_index = npc_index;
        this.npc_label = npc_label;
        this.location = location;
        this.face_hero = face_hero ?? true;
        if (finish_events !== undefined) {
            finish_events.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info);
                this.finish_events.push(event);
            });
        }
    }

    /**
     * Defines the ControllableChar which is going to show the emoticon.
     */
    set_char() {
        if (this.is_npc === undefined && this.npc_index === undefined && this.npc_label === undefined) {
            this.char = this.origin_npc;
            this.is_npc = true;
        } else if (this.is_npc) {
            if (this.npc_label) {
                this.char = this.data.map.npcs_label_map[this.npc_label];
            } else {
                this.char = this.data.map.npcs[this.npc_index];
            }
        } else {
            this.char = this.data.hero;
            this.data.game_event_manager.allow_char_to_move = true;
        }
    }

    /**
     * Fires the EmoticonEvent.
     * @param oringin_npc If it's the case, the origin NPC that originated this event.
     */
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

    /**
     * Finishes this event by reducing GameEventManager.events_running_count and firing final events.
     */
    finish() {
        this.is_npc = undefined;
        --this.data.game_event_manager.events_running_count;
        this.finish_events.forEach(event => event.fire(this.origin_npc));
    }

    /**
     * Unsets this event.
     */
    destroy() {
        this.finish_events.forEach(event => event.destroy());
        this.origin_npc = null;
        this.char = null;
    }
}
