import {GameEvent} from "./GameEvent";
import {ControllableChar} from "../ControllableChar";
import * as numbers from "../magic_numbers";

export abstract class CharControlEvent extends GameEvent {
    private static readonly START_FOLLOW_TIME = 400;
    protected is_npc: boolean;
    protected camera_follow: boolean;
    protected follow_hero_on_finish: boolean;
    protected keep_camera_follow: boolean;
    protected camera_follow_time: number;
    protected npc_index: number;
    protected char: ControllableChar;
    protected finish_events: GameEvent[] = [];

    constructor(
        game,
        data,
        event_type,
        active,
        is_npc,
        npc_index,
        camera_follow,
        camera_follow_time,
        follow_hero_on_finish,
        finish_events,
        keep_camera_follow
    ) {
        super(game, data, event_type, active);
        this.is_npc = is_npc;
        this.npc_index = npc_index;
        this.camera_follow = camera_follow;
        this.camera_follow_time = camera_follow_time;
        this.follow_hero_on_finish = follow_hero_on_finish;
        this.keep_camera_follow = keep_camera_follow;
        if (finish_events !== undefined) {
            finish_events.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info);
                this.finish_events.push(event);
            });
        }
    }

    async camera_follow_char() {
        let follow_resolve;
        const follow_promise = new Promise(resolve => (follow_resolve = resolve));
        if (this.camera_follow) {
            const follow_time = this.camera_follow_time ?? CharControlEvent.START_FOLLOW_TIME;
            this.game.camera.unfollow();
            this.game.add
                .tween(this.game.camera)
                .to(
                    {
                        x: this.char.sprite.x - (numbers.GAME_WIDTH >> 1),
                        y: this.char.sprite.y - (numbers.GAME_HEIGHT >> 1),
                    },
                    follow_time,
                    Phaser.Easing.Quadratic.InOut,
                    true
                )
                .onComplete.addOnce(() => {
                    this.data.camera.follow(this.char);
                    follow_resolve();
                });
        } else {
            follow_resolve();
        }
        await follow_promise;
    }

    async camera_unfollow_char() {
        let follow_resolve;
        const follow_promise = new Promise(resolve => (follow_resolve = resolve));
        if (this.camera_follow && !this.keep_camera_follow) {
            this.game.camera.unfollow();
        }
        if (this.follow_hero_on_finish) {
            this.game.camera.unfollow();
            const follow_time = this.camera_follow_time ?? CharControlEvent.START_FOLLOW_TIME;
            this.game.add
                .tween(this.game.camera)
                .to(
                    {
                        x: this.data.hero.sprite.x - (numbers.GAME_WIDTH >> 1),
                        y: this.data.hero.sprite.y - (numbers.GAME_HEIGHT >> 1),
                    },
                    follow_time,
                    Phaser.Easing.Quadratic.InOut,
                    true
                )
                .onComplete.addOnce(() => {
                    this.data.camera.follow(this.data.hero);
                    follow_resolve();
                });
        } else {
            follow_resolve();
        }
        await follow_promise;
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
}
