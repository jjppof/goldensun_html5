import { directions } from "../utils";
import { TileEvent, event_types } from "./TileEvent";

export class StepEvent extends TileEvent {
    private static readonly STEP_SHIFT_FACTOR = 3;

    public step_direction: number;
    public next_x: number;
    public next_y: number;
    public shift_y: number;

    constructor(game, data, x, y, activation_directions, activation_collision_layers, dynamic, active, step_direction) {
        super(game, data, event_types.STEP, x, y, activation_directions, activation_collision_layers, dynamic, active, null);
        this.step_direction = step_direction;
        this.next_x = 0;
        this.next_y = 0;
        this.shift_y = 0;
    }

    set() {
        let next_x, next_y = this.y, shift_y;
        if (this.step_direction === directions.up) {
            shift_y = -((this.data.map.sprite.tileHeight/StepEvent.STEP_SHIFT_FACTOR) | 0);
        } else if (this.step_direction === directions.down) {
            shift_y = (this.data.map.sprite.tileHeight/StepEvent.STEP_SHIFT_FACTOR) | 0;
        }
        if (this.activation_directions[0] === directions.left) {
            next_x = this.x - 1;
        } else if (this.activation_directions[0] === directions.right) {
            next_x = this.x + 1;
        }
        this.next_x = next_x;
        this.next_y = next_y;
        this.shift_y = shift_y;
        this.data.tile_event_manager.set_triggered_event(this);
    }

    fire() {
        if (this.data.hero.tile_x_pos === this.next_x && this.data.hero.tile_y_pos === this.next_y) {
            this.data.tile_event_manager.unset_triggered_event(this);
            if (this.shift_y > 0) {
                this.data.hero.shadow_following = false;
                this.data.hero.shadow.y += this.shift_y;
                const tween = this.game.add.tween(this.data.hero.sprite.body).to({
                    y: this.data.hero.sprite.body.y + this.shift_y
                }, 50, Phaser.Easing.Linear.None, true);
                tween.onComplete.addOnce(() => {
                    this.data.hero.shadow_following = true;
                });
                tween.onUpdateCallback(() => {
                    this.data.hero.shadow.x = this.data.hero.sprite.body.x;
                });
            } else {
                this.data.hero.sprite.body.y += this.shift_y;
            }
        } else if (!this.check_position()) {
            this.data.tile_event_manager.unset_triggered_event(this);
        }
    }
}