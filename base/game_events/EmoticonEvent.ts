import {GameEvent, event_types} from "./GameEvent";
import {ControllableChar} from "../ControllableChar";
import {directions} from "utils";

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
    private npc_label: string;
    /** INPUT. If the target char is a NPC, the npc index. Use this or npc_label */
    private npc_index: number;
    /** INPUT. The list of game events to be fired on this event end. */
    private finish_events: GameEvent[] = [];
    /** INPUT. A custom location for the emoticon. */
    private location: {x: number; y: number};
    /** INPUT. If target char is NPC, make hero and npc look each other. */
    private face_hero: boolean;
    /** INPUT. Reset direction on finish if "face_hero" was set to true. */
    private reset_direction: boolean;
    /** The target char that will show the emoticon. */
    private char: ControllableChar;
    /** The previous direction before facing hero. */
    private previous_direction: directions;

    constructor(
        game,
        data,
        active,
        key_name,
        keep_reveal,
        emoticon,
        duration,
        sound_effect,
        is_npc,
        npc_index,
        npc_label,
        location,
        face_hero,
        reset_direction,
        finish_events
    ) {
        super(game, data, event_types.EMOTICON, active, key_name, keep_reveal);
        this.emoticon = emoticon;
        this.duration = duration ?? EmoticonEvent.DEFAULT_DURATION;
        this.sound_effect = sound_effect;
        this.is_npc = is_npc;
        this.npc_index = npc_index;
        this.npc_label = npc_label;
        this.location = location;
        this.face_hero = face_hero ?? false;
        this.reset_direction = reset_direction ?? true;
        this.previous_direction = null;
        if (finish_events !== undefined) {
            finish_events.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info, this.type, this.origin_npc);
                this.finish_events.push(event);
            });
        }
    }

    /**
     * Fires the EmoticonEvent.
     */
    async _fire() {
        ++this.data.game_event_manager.events_running_count;

        this.char = GameEvent.get_char(this.data, {
            is_npc: this.is_npc,
            npc_index: this.npc_index,
            npc_label: this.npc_label,
        });
        if (!this.char) {
            this.char = this.origin_npc;
            this.is_npc = true;
        }

        if (this.face_hero && this.char !== this.data.hero) {
            this.previous_direction = this.char.current_direction;
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

        await this.finish();
    }

    /**
     * Finishes this event by reducing GameEventManager.events_running_count and firing final events.
     */
    async finish() {
        if (this.face_hero && this.reset_direction && this.char !== this.data.hero) {
            await this.origin_npc.face_direction(this.previous_direction);
        }
        this.is_npc = undefined;
        --this.data.game_event_manager.events_running_count;
        this.finish_events.forEach(event => event.fire(this.origin_npc));
    }

    /**
     * Unsets this event.
     */
    _destroy() {
        this.finish_events.forEach(event => event?.destroy());
        this.char = null;
    }
}
