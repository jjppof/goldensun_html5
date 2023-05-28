import * as _ from "lodash";
import {GameEvent, event_types} from "./GameEvent";

type CameraPoint = {
    x: number;
    y: number;
    easing: string; //examples: "Linear.None", "Bounce.In", "Quadratic.Out"
    duration: number;
};

export class CameraMoveEvent extends GameEvent {
    private positions: CameraPoint[];
    private reset_follow: boolean;
    private return_to_target_duration: number;
    private finish_events: GameEvent[];

    constructor(
        game,
        data,
        active,
        key_name,
        keep_reveal,
        positions,
        reset_follow,
        return_to_target_duration,
        finish_events
    ) {
        super(game, data, event_types.CAMERA_MOVE, active, key_name, keep_reveal);
        this.positions = positions ?? [];
        this.reset_follow = reset_follow ?? false;
        this.return_to_target_duration = return_to_target_duration ?? 0;
        this.finish_events = [];
        if (finish_events !== undefined) {
            finish_events.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info);
                this.finish_events.push(event);
            });
        }
    }

    async _fire() {
        ++this.data.game_event_manager.events_running_count;
        const camera_was_following = this.data.camera.following;
        const previous_target = this.data.camera.unfollow();
        for (let i = 0; i < this.positions.length; ++i) {
            const point = this.positions[i];
            const x = point.x ?? this.game.camera.x;
            const y = point.y ?? this.game.camera.y;
            const duration = point.duration ?? 500;
            const easing = point.easing ? _.get(Phaser.Easing, point.easing) : Phaser.Easing.Linear.None;
            let promise_resolve;
            const promise = new Promise(resolve => (promise_resolve = resolve));
            this.game.add
                .tween(this.game.camera)
                .to(
                    {
                        x: x,
                        y: y,
                    },
                    duration,
                    easing,
                    true
                )
                .onComplete.addOnce(promise_resolve);
            await promise;
        }
        if (this.reset_follow && camera_was_following) {
            await this.data.camera.follow(previous_target, this.return_to_target_duration);
        }
        --this.data.game_event_manager.events_running_count;
        this.finish_events.forEach(event => event.fire(this.origin_npc));
    }

    _destroy() {
        this.finish_events.forEach(event => event?.destroy());
    }
}
