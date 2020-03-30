import * as numbers from '../magic_numbers.js';

export class Window {
    constructor(game, group, x, y, width, height, need_pos_update = true, color = numbers.DEFAULT_WINDOW_COLOR, ) {
        this.game = game;
        this.group = group;
        this.x = x;
        this.y = y;
        this.rectangle = this.game.add.graphics(0, 0);
        this.rectangle.beginFill(color, 1);
        this.width = width;
        this.height = height;
        this.rectangle.drawRect(0, 0, this.width, this.height);
        this.rectangle.endFill();
        this.rectangle.alpha = 0;
        this.rectangle.width = 0;
        this.rectangle.height = 0;
        this.rectangle.window_object = this;
        this.need_pos_update = need_pos_update;
    }

    show() {
        this.group.add(this.rectangle);
        this.rectangle.alpha = 1;
        this.rectangle.x = this.game.camera.x + this.x;
        this.rectangle.y = this.game.camera.y + this.y;
        this.transition_time = Phaser.Timer.QUARTER/3;
        this.game.add.tween(this.rectangle).to(
            { width: this.width, height: this.height },
            this.transition_time,
            Phaser.Easing.Linear.None,
            true
        );
    }

    update() {
        this.rectangle.x = this.game.camera.x + this.x;
        this.rectangle.y = this.game.camera.y + this.y;
    }

    destroy() {
        this.game.add.tween(this.rectangle).to(
            { width: 0, height: 0 },
            this.transition_time,
            Phaser.Easing.Linear.None,
            true
        );
        this.game.time.events.add(this.transition_time + 50, () => { 
            this.group.removeChild(this.rectangle);
            this.rectangle.destroy();
        }, this);
        
    }
}