import {ControllableChar} from "./ControllableChar";
import {InteractableObjects} from "./interactable_objects/InteractableObjects";

export class Camera {
    private static readonly CAMERA_LERP = 0.15;
    private static readonly SHAKE_INTENSITY = 3;

    private game: Phaser.Game;
    private target: ControllableChar | InteractableObjects;
    private camera_shake_enable: boolean;

    constructor(game: Phaser.Game) {
        this.game = game;
        this.target = null;
        this.camera_shake_enable = false;
    }

    reset_lerp() {
        this.game.camera.lerp.setTo(Camera.CAMERA_LERP, Camera.CAMERA_LERP);
    }

    follow(target?: Camera["target"], duration?: number): Promise<void> {
        if (target) {
            this.target = target;
        }
        if (this.target?.sprite) {
            this.game.camera.follow(
                this.target.sprite,
                Phaser.Camera.FOLLOW_LOCKON,
                Camera.CAMERA_LERP,
                Camera.CAMERA_LERP
            );
            if (duration === undefined) {
                this.game.camera.focusOn(this.target.sprite);
            } else {
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
                    .onComplete.addOnce(promise_resolve);
                return promise;
            }
        }
    }

    unfollow() {
        this.game.camera.unfollow();
        return this.target;
    }

    enable_shake() {
        this.camera_shake_enable = true;
    }

    disable_shake() {
        this.camera_shake_enable = false;
    }

    update() {
        if (this.camera_shake_enable) {
            this.game.camera.x += (Math.random() - 0.5) * Camera.SHAKE_INTENSITY;
            this.game.camera.y += (Math.random() - 0.5) * Camera.SHAKE_INTENSITY;
        }
    }
}
