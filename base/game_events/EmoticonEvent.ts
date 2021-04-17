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
    private emoticon_sprite: Phaser.Sprite;
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

        const x = this.location?.x ?? this.char.sprite.x;
        const y = this.location?.y ?? this.char.sprite.y - this.char.sprite.height + 5;
        this.emoticon_sprite = this.game.add.sprite(x, y, "emoticons", this.emoticon);
        this.emoticon_sprite.anchor.setTo(0.5, 1);
        this.emoticon_sprite.scale.x = 0;

        this.game.add
            .tween(this.emoticon_sprite.scale)
            .to(
                {
                    x: 1,
                },
                200,
                Phaser.Easing.Elastic.Out,
                true
            )
            .onComplete.addOnce(() => {
                if (this.sound_effect) {
                    this.data.audio.play_se(this.sound_effect);
                }
                this.game.time.events.add(this.duration, () => {
                    this.finish();
                });
            });
    }

    finish() {
        this.emoticon_sprite.destroy();
        this.is_npc = undefined;
        --this.data.game_event_manager.events_running_count;
        this.finish_events.forEach(event => event.fire(this.origin_npc));
    }

    destroy() {
        this.finish_events.forEach(event => event.destroy());
        this.origin_npc = null;
        this.char = null;
        if (this.emoticon_sprite) {
            this.emoticon_sprite.destroy();
        }
    }
}
