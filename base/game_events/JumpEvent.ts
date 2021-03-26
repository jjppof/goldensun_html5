import {GameEvent, event_types} from "./GameEvent";
import {NPC} from "../NPC";
import {ControllableChar} from "../ControllableChar";
import {directions} from "../utils";
import * as numbers from "../magic_numbers";

export class JumpEvent extends GameEvent {
    private static readonly START_FOLLOW_TIME = 300;
    private is_npc: boolean;
    private camera_follow: boolean;
    private follow_hero_on_finish: boolean;
    private keep_camera_follow: boolean;
    private camera_follow_time: number;
    private npc_index: number;
    private char: ControllableChar;
    private finish_events: GameEvent[] = [];
    private jump_height: number;
    private duration: number;
    private wait_after: number;
    private dest: {
        tile_x?: number;
        tile_y?: number;
        distance?: number;
    };
    private jump_direction: directions;

    constructor(
        game,
        data,
        active,
        is_npc,
        npc_index,
        camera_follow,
        camera_follow_time,
        follow_hero_on_finish,
        finish_events,
        jump_height,
        duration,
        dest,
        jump_direction,
        keep_camera_follow,
        wait_after
    ) {
        super(game, data, event_types.JUMP, active);
        this.is_npc = is_npc;
        this.npc_index = npc_index;
        this.camera_follow = camera_follow;
        this.camera_follow_time = camera_follow_time;
        this.follow_hero_on_finish = follow_hero_on_finish;
        this.keep_camera_follow = keep_camera_follow;
        this.jump_height = jump_height;
        this.duration = duration;
        this.wait_after = wait_after;
        this.dest = dest;
        this.jump_direction = jump_direction !== undefined ? directions[jump_direction as string] : undefined;
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
            const follow_time = this.camera_follow_time ?? JumpEvent.START_FOLLOW_TIME;
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
            const follow_time = this.camera_follow_time ?? JumpEvent.START_FOLLOW_TIME;
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

        await this.char.jump({
            jump_height: this.jump_height,
            duration: this.duration,
            jump_direction: this.jump_direction,
            dest: this.dest,
            time_on_finish: this.wait_after,
        });

        await this.camera_unfollow_char();

        this.finish();
    }

    finish() {
        if (!this.is_npc) {
            this.data.game_event_manager.allow_char_to_move = false;
        }
        --this.data.game_event_manager.events_running_count;
        this.finish_events.forEach(event => event.fire(this.origin_npc));
    }

    destroy() {
        this.finish_events.forEach(event => event.destroy());
        this.origin_npc = null;
        this.char = null;
    }
}
