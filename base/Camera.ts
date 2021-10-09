import {ControllableChar} from "./ControllableChar";
import {InteractableObjects} from "./interactable_objects/InteractableObjects";

/**
 * A helper class to manage Phaser.Camera with some utils.
 */
export class Camera {
    private static readonly CAMERA_LERP = 0.15;
    private static readonly SHAKE_INTENSITY = 3;

    private game: Phaser.Game;
    private _target: ControllableChar | InteractableObjects;
    private _camera_shake_enable: boolean;
    private _following: boolean;

    constructor(game: Phaser.Game) {
        this.game = game;
        this._target = null;
        this._camera_shake_enable = false;
        this._following = false;
    }

    /** The target that the camera is following. */
    get target() {
        return this._target;
    }
    /** Whether the camera is shaking or not. */
    get camera_shake_enable() {
        return this._camera_shake_enable;
    }
    /** Whether the camera is following a target or not. */
    get following() {
        return this._following;
    }

    /**
     * Resets camera lerp to engine defaults.
     */
    reset_lerp() {
        this.game.camera.lerp.setTo(Camera.CAMERA_LERP, Camera.CAMERA_LERP);
    }

    /**
     * Enable camera following for a given target.
     * @param target the target for the camera to follow.
     * @param duration the duration that the camera will to take to reach target position in ms.
     * @returns returns a promise to the transition end.
     */
    follow(target?: Camera["target"], duration?: number): Promise<void> {
        if (target) {
            this._target = target;
        }
        if (this.target?.sprite) {
            this._following = true;
            if (duration == undefined || duration < 30) {
                this.game.camera.follow(
                    this.target.sprite,
                    Phaser.Camera.FOLLOW_LOCKON,
                    Camera.CAMERA_LERP,
                    Camera.CAMERA_LERP
                );
                this.game.camera.focusOn(this.target.sprite);
            } else {
                this.game.camera.unfollow();
                let promise_resolve;
                const promise = new Promise<void>(resolve => (promise_resolve = resolve));
                this.game.add
                    .tween(this.game.camera)
                    .to(
                        {
                            x: (this.target.x - this.game.camera.width) >> 1,
                            y: (this.target.y - this.game.camera.height) >> 1,
                        },
                        duration,
                        Phaser.Easing.Linear.None,
                        true
                    )
                    .onComplete.addOnce(() => {
                        this.game.camera.follow(
                            this.target.sprite,
                            Phaser.Camera.FOLLOW_LOCKON,
                            Camera.CAMERA_LERP,
                            Camera.CAMERA_LERP
                        );
                        promise_resolve();
                    });
                return promise;
            }
        }
    }

    /**
     * Makes the camera static, to follow nothing.
     * @returns Returns the target that was being followed.
     */
    unfollow() {
        this.game.camera.unfollow();
        this._following = false;
        return this.target;
    }

    /**
     * Enables camera shake.
     */
    enable_shake() {
        this._camera_shake_enable = true;
    }

    /**
     * Disables camera shake.
     */
    disable_shake() {
        this._camera_shake_enable = false;
    }

    /**
     * The camera update function.
     */
    update() {
        if (this.camera_shake_enable) {
            this.game.camera.x += (Math.random() - 0.5) * Camera.SHAKE_INTENSITY;
            this.game.camera.y += (Math.random() - 0.5) * Camera.SHAKE_INTENSITY;
        }
    }
}
