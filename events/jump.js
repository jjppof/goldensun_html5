import * as numbers from '../magic_numbers.js';
import { main_char_list } from '../chars/main_char_list.js';

export function jump_event(data) {
    data.jumping = false;
    data.shadow.visible = false;
    let jump_offset = numbers.JUMP_OFFSET;
    let direction;
    if (Array.isArray(data.current_event.activation_direction)) {
        if (data.actual_direction === "left") {
            jump_offset = -jump_offset;
            direction = "x";
        } else if (data.actual_direction === "right") {
            direction = "x";
        } else if (data.actual_direction === "up") {
            jump_offset = -jump_offset;
            direction = "y";
        } else if (data.actual_direction === "down") {
            direction = "y";
        }
    } else {
        if (data.current_event.activation_direction === "left") {
            jump_offset = -jump_offset;
            direction = "x";
        } else if (data.current_event.activation_direction === "right") {
            direction = "x";
        } else if (data.current_event.activation_direction === "up") {
            jump_offset = -jump_offset;
            direction = "y";
        } else if (data.current_event.activation_direction === "down") {
            direction = "y";
        }
    }
    let tween_obj = {};
    data.shadow[direction] = data.hero[direction] + jump_offset;
    tween_obj[direction] = data.hero[direction] + jump_offset;
    if(direction === "x")
        tween_obj.y = [data.hero.y - 5, data.hero.y];
    data.hero.loadTexture(data.hero_name + "_jump");
    main_char_list[data.hero_name].setAnimation(data.hero, "jump");
    data.hero.animations.frameName = "jump/" + data.current_event.activation_direction;
    game.add.tween(data.hero.body).to( 
        tween_obj, 
        numbers.JUMP_DURATION, 
        Phaser.Easing.Linear.None, 
        true
    ).onComplete.addOnce(() => {
        data.on_event = false;
        data.current_event = null;
        data.shadow.visible = true;
    }, this);
}