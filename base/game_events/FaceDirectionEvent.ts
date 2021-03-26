import {GameEvent, event_types} from "./GameEvent";
import {NPC} from "../NPC";
import {directions} from "../utils";
import {ControllableChar} from "../ControllableChar";
import * as numbers from "../magic_numbers";

export class FaceDirectionEvent extends GameEvent {
    private static readonly START_FOLLOW_TIME = 300;
    private direction: directions;
    private finish_events: GameEvent[] = [];
    private char: ControllableChar;
    private is_npc: boolean;
    private npc_index: number;
    private time_between_frames: number;
    private camera_follow: boolean;
    private follow_hero_on_finish: boolean;
    private keep_camera_follow: boolean;
    private camera_follow_time: number;
    private wait_after: number;

    constructor(
        game,
        data,
        active,
        direction,
        is_npc,
        npc_index,
        time_between_frames,
        finish_events,
        camera_follow,
        camera_follow_time,
        follow_hero_on_finish,
        keep_camera_follow,
        wait_after
    ) {
        super(game, data, event_types.FACE_DIRECTION, active);
        this.direction = directions[direction as string];
        this.is_npc = is_npc;
        this.npc_index = npc_index;
        this.time_between_frames = time_between_frames;
        this.camera_follow = camera_follow;
        this.camera_follow_time = camera_follow_time;
        this.follow_hero_on_finish = follow_hero_on_finish;
        this.keep_camera_follow = keep_camera_follow;
        this.wait_after = wait_after;
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
            const follow_time = this.camera_follow_time ?? FaceDirectionEvent.START_FOLLOW_TIME;
            this.game.camera.unfollow();
            this.game.add
                .tween(this.game.camera)
                .to(
                    {
                        x: this.char.sprite.x - (numbers.GAME_WIDTH >> 1),
                        y: this.char.sprite.y - (numbers.GAME_HEIGHT >> 1),
                    },
                    follow_time,
                    Phaser.Easing.Linear.None,
                    true
                )
                .onComplete.addOnce(() => {
                    this.char.camera_follow();
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
            const follow_time = this.camera_follow_time ?? FaceDirectionEvent.START_FOLLOW_TIME;
            this.game.add
                .tween(this.game.camera)
                .to(
                    {
                        x: this.data.hero.sprite.x - (numbers.GAME_WIDTH >> 1),
                        y: this.data.hero.sprite.y - (numbers.GAME_HEIGHT >> 1),
                    },
                    follow_time,
                    Phaser.Easing.Linear.None,
                    true
                )
                .onComplete.addOnce(() => {
                    this.data.hero.camera_follow();
                    follow_resolve();
                });
        } else {
            follow_resolve();
        }
        await follow_promise;
    }

    async _fire(oringin_npc: NPC) {
        if (!this.active) return;
        this.origin_npc = oringin_npc;
        ++this.data.game_event_manager.events_running_count;

        if (this.is_npc === undefined && this.npc_index === undefined) {
            this.char = this.origin_npc;
            this.is_npc = true;
        } else if (this.is_npc) {
            this.char = this.data.map.npcs[this.npc_index];
        } else {
            this.char = this.data.hero;
            this.data.game_event_manager.allow_char_to_move = true;
        }

        await this.camera_follow_char();

        await this.char.face_direction(this.direction, this.time_between_frames);

        if (this.wait_after) {
            let this_resolve;
            const promise = new Promise(resolve => (this_resolve = resolve));
            this.game.time.events.add(this.wait_after, this_resolve);
            await promise;
        }

        await this.camera_unfollow_char();

        --this.data.game_event_manager.events_running_count;
        this.finish_events.forEach(event => event.fire(this.origin_npc));
    }

    destroy() {
        this.finish_events.forEach(event => event.destroy());
        this.origin_npc = null;
        this.char = null;
    }
}
