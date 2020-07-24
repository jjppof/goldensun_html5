import * as numbers from '../magic_numbers.js';
import { reverse_directions } from '../utils.js';

const SHADOW_X_AP = 0.45;
const SHADOW_Y_AP = 0.05;

export function config_hero(data) {
    //creating sprites and adding hero and its shadow to npc_group
    data.shadow = data.npc_group.create(0, 0, 'shadow');
    data.shadow.blendMode = PIXI.blendModes.MULTIPLY;
    data.shadow.disableRoundPx = true;
    data.shadow.anchor.setTo(SHADOW_X_AP, SHADOW_Y_AP); //shadow anchor point
    data.shadow.base_collider_layer = data.map_collider_layer;
    data.hero = data.npc_group.create(0, 0, data.hero_name + "_" + data.current_action);
    data.hero.centerX = ((data.init_db.x_tile_position + 1.5) * maps[data.map_name].sprite.tileWidth) | 0; //hero x start position
    data.hero.centerY = ((data.init_db.y_tile_position + 1.5) * maps[data.map_name].sprite.tileHeight) | 0; //hero y start position
    data.hero.base_collider_layer = data.map_collider_layer;
    data.hero.roundPx = true;
    game.camera.follow(data.hero, Phaser.Camera.FOLLOW_LOCKON, numbers.CAMERA_LERP, numbers.CAMERA_LERP); //makes camera follow the data.hero
    game.camera.focusOn(data.hero);
    //config data.hero initial animation state
    main_char_list[data.hero_name].sprite_base.setAnimation(data.hero, data.current_action);
    data.hero.animations.play(data.current_action + "_" + reverse_directions[data.current_direction]);
}

export function change_hero_sprite(data) {
    let action = data.current_action;
    let direction = data.current_direction;
    let idle_climbing = data.idle_climbing;
    if (data.stop_by_colliding && !data.pushing && !data.climbing) {
        action = "idle";
    } else if (data.stop_by_colliding && !data.pushing && data.climbing) {
        idle_climbing = true;
    }
    const key = data.hero_name + "_" + action;
    const animation = action + "_" + (idle_climbing ? "idle" : reverse_directions[direction]);
    if (data.hero.key !== key) {
        data.hero.loadTexture(key);
        main_char_list[data.hero_name].sprite_base.setAnimation(data.hero, action);
        data.hero.animations.play(animation);
    }
    if (data.hero.animations.currentAnim.name !== animation) {
        data.hero.animations.play(animation);
    }
}

export function set_current_action(data) {
    if (!data.cursors.up.isDown && !data.cursors.left.isDown && !data.cursors.right.isDown && !data.cursors.down.isDown && data.current_action !== "idle" && !data.climbing) {
        data.current_action = "idle";
    } else if (((data.cursors.up.isDown && data.cursors.down.isDown) || (data.cursors.right.isDown && data.cursors.left.isDown)) && !data.climbing) {
        data.current_action = "idle";
    } else if ((data.cursors.up.isDown || data.cursors.left.isDown || data.cursors.right.isDown || data.cursors.down.isDown) && !data.climbing && !data.pushing) {
        if (game.input.keyboard.isDown(Phaser.Keyboard.SHIFT) && data.current_action !== "dash") {
            data.current_action = "dash";
        } else if (!game.input.keyboard.isDown(Phaser.Keyboard.SHIFT) && data.current_action !== "walk") {
            data.current_action = "walk";
        }
    }
}

export function update_shadow(data) {
    //makes the shadow follow the hero.
    data.shadow.x = data.hero.body.x;
    data.shadow.y = data.hero.body.y;
}

export function stop_hero(data, change_sprite = true) {
    data.hero.body.velocity.y = data.hero.body.velocity.x = 0;
    if (change_sprite) {
        data.current_action = "idle";
        change_hero_sprite(data);
    }
}