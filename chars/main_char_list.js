import { MainChar } from '../base/MainChar.js';

export let main_char_list = {};

export function initializeMainChars(game) {
    //the data below will come from a json file
    main_char_list.isaac = new MainChar(
        'isaac',
        ['idle', 'walk', 'dash', 'climb', 'jump', 'push'],
        60, 85, 50, 50
    );
    main_char_list.isaac.setActionSpritesheet('idle', 'assets/images/spritesheets/isaac_idle.png', 'assets/images/spritesheets/isaac_idle.json');
    main_char_list.isaac.setActionDirections('idle', [
        'down', 
        'up', 
        'left', 
        'right', 
        'down_left', 
        'down_right', 
        'up_left', 
        'up_right'
    ] /* available directions in this action */, [5,5,5,5,5,5,5,5] /* frame count for each direction */);
    main_char_list.isaac.setActionFrameRate('idle', 1);

    main_char_list.isaac.setActionSpritesheet('walk', 'assets/images/spritesheets/isaac_walk.png', 'assets/images/spritesheets/isaac_walk.json');
    main_char_list.isaac.setActionDirections('walk', [
        'down', 
        'up', 
        'left', 
        'right', 
        'down_left', 
        'down_right', 
        'up_left', 
        'up_right'
    ], [5,5,5,5,5,5,5,5]);
    main_char_list.isaac.setActionFrameRate('walk', 7);

    main_char_list.isaac.setActionSpritesheet('dash', 'assets/images/spritesheets/isaac_dash.png', 'assets/images/spritesheets/isaac_dash.json');
    main_char_list.isaac.setActionDirections('dash', [
        'down', 
        'up', 
        'left', 
        'right', 
        'down_left', 
        'down_right', 
        'up_left', 
        'up_right'
    ], [5,5,5,5,5,5,5,5]);
    main_char_list.isaac.setActionFrameRate('dash', 9);

    main_char_list.isaac.setActionSpritesheet('climb', 'assets/images/spritesheets/isaac_climb.png', 'assets/images/spritesheets/isaac_climb.json');
    main_char_list.isaac.setActionDirections('climb', [
        'climb', 
        'end', 
        'idle', 
        'start'
    ], [3,2,0,6]);
    main_char_list.isaac.setActionFrameRate('climb', 6);

    main_char_list.isaac.setActionSpritesheet('jump', 'assets/images/spritesheets/isaac_jump.png', 'assets/images/spritesheets/isaac_jump.json');
    main_char_list.isaac.setActionDirections('jump', [
        'down', 
        'up', 
        'left', 
        'right'
    ], [0,0,0,0]);
    main_char_list.isaac.setActionFrameRate('jump', 1);

    main_char_list.isaac.setActionSpritesheet('push', 'assets/images/spritesheets/isaac_push.png', 'assets/images/spritesheets/isaac_push.json');
    main_char_list.isaac.setActionDirections('push', [
        'down', 
        'up', 
        'left', 
        'right'
    ], [3,3,3,3]);
    main_char_list.isaac.setActionFrameRate('push', 4);

    main_char_list.isaac.addAnimations();
    main_char_list.isaac.loadSpritesheets(game);
}