import * as numbers from  "../magic_numbers.js";

export function fire_push_movement(data, psynergy_item) {
    if (data.trying_to_push && ["up", "down", "left", "right"].includes(data.trying_to_push_direction) && data.trying_to_push_direction === data.actual_direction) {
        let positive_limit = data.hero.x + (-psynergy_item.psynergy_item_sprite.y - psynergy_item.psynergy_item_sprite.x);
        let negative_limit = -data.hero.x + (-psynergy_item.psynergy_item_sprite.y + psynergy_item.psynergy_item_sprite.x);
        let expected_position;
        if (-data.hero.y >= positive_limit && -data.hero.y >= negative_limit) {
            expected_position = "down";
        } else if (-data.hero.y <= positive_limit && -data.hero.y >= negative_limit) {
            expected_position = "left";
        } else if (-data.hero.y <= positive_limit && -data.hero.y <= negative_limit) {
            expected_position = "up";
        } else if (-data.hero.y >= positive_limit && -data.hero.y <= negative_limit) {
            expected_position = "right";
        }
        if (expected_position === data.trying_to_push_direction) {
            data.pushing = true;
            data.actual_action = "push";
            game.physics.p2.pause();
            let tween_x = 0, tween_y = 0;
            switch (data.trying_to_push_direction) {
                case "up":
                    tween_y = -numbers.PUSH_SHIFT;
                    break;
                case "down":
                    tween_y = numbers.PUSH_SHIFT;
                    break;
                case "left":
                    tween_x = -numbers.PUSH_SHIFT;
                    break;
                case "right":
                    tween_x = numbers.PUSH_SHIFT;
                    break;
            }
            let sprites = [data.shadow, data.hero.body, psynergy_item.psynergy_item_sprite.body];
            for (let i = 0; i < sprites.length; ++i) {
                let body = sprites[i];
                game.add.tween(body).to({
                    x: body.x + tween_x,
                    y: body.y + tween_y
                }, numbers.PUSH_TIME, Phaser.Easing.Linear.None, true);
            }
            game.time.events.add(numbers.PUSH_TIME + 50, () => {
                data.pushing = false;
                game.physics.p2.resume();
            }, this);
        }
    }
    data.trying_to_push = false;
    data.push_timer = null;
}