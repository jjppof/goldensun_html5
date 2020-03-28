import { SpriteBase } from './SpriteBase.js';

export class MainChar extends SpriteBase {
    constructor (
        key_name,
        actions,
        walk_speed,
        dash_speed,
        climb_speed
    ) {
        super(key_name, actions);
        this.walk_speed = walk_speed;
        this.dash_speed = dash_speed;
        this.climb_speed = climb_speed;
    }
}