import * as utils from './utils.js';
import * as numbers from './magic_numbers.js';
import { initializeMainChars, main_char_list } from './chars/main_char_list.js';
import { initializeMaps, loadMaps, maps } from './maps/maps.js';
import { jump_event } from './events/jump.js';
import { set_door_event, door_event_phases } from './events/door.js';
import { set_npc_event } from './events/npc.js';
import * as climb from './events/climb.js';
import * as physics from './physics/physics.js';

window.maps = maps;

var data = {
    cursors: undefined,
    hero: undefined,
    map_collider_layer: undefined,
    actual_action: undefined,
    actual_direction: undefined,
    climb_direction: undefined,
    x_speed: undefined,
    y_speed: undefined,
    hero_name: undefined,
    map_name: undefined,
    shadow: undefined,
    hero_tile_pos_x: undefined,
    hero_tile_pos_y: undefined,
    current_event: undefined,
    event_activation_process: undefined,
    event_timer: undefined,
    on_event: undefined,
    climbing: undefined,
    extra_speed: undefined,
    map_collider: undefined,
    mapCollisionGroup: undefined,
    heroCollisionGroup: undefined,
    npcCollisionGroup: undefined,
    underlayer_group: undefined,
    overlayer_group: undefined,
    npc_group: undefined,
    teleporting: undefined,
    fading_out: undefined,
    processing_teleport: undefined,
    delta_time: undefined,
    jumping: undefined,
    show_fps: undefined,
    npc_db: undefined,
    npc_event: undefined,
    active_npc: undefined,
    waiting_for_enter_press: undefined,
    dialog_manager: undefined,
    in_dialog: undefined,
    created: false
};
window.data = data;

var game = new Phaser.Game(
    numbers.GAME_WIDTH, //width
    numbers.GAME_HEIGHT, //height
    Phaser.WEBGL, //renderer
    "game", //parent
    { preload: preload, create: create, update: update, render: render }, //states
    false, //transparent
    false //antialias
);
window.game = game;

function preload() {
    initializeMainChars(game);
    initializeMaps();
    loadMaps(game);
    game.load.json('npc_db', 'assets/dbs/npc_db.json');
    game.load.image('shadow', 'assets/images/misc/shadow.png');
    game.load.bitmapFont('gs-bmp-font', 'assets/font/golden-sun.png', 'assets/font/golden-sun.fnt');

    game.time.advancedTiming = true;
    game.stage.smoothed = false;
    game.camera.roundPx = false;
    game.renderer.renderSession.roundPixels = false;
}

function config_hero() {
    //creating sprites and adding hero and its shadow to npc_group
    data.shadow = data.npc_group.create(0, 0, 'shadow');
    data.shadow.blendMode = PIXI.blendModes.MULTIPLY;
    data.shadow.anchor.setTo(numbers.SHADOW_X_AP, numbers.SHADOW_Y_AP); //shadow anchor point
    data.hero = data.npc_group.create(0, 0, utils.u([data.hero_name, data.actual_action]));
    data.hero.centerX = numbers.HERO_START_X; //hero x start position
    data.hero.centerY = numbers.HERO_START_Y; //hero y start position
    game.camera.follow(data.hero, Phaser.Camera.FOLLOW_LOCKON); //makes camera follow the data.hero
    //config data.hero initial animation state
    main_char_list[data.hero_name].setAnimation(data.hero, data.actual_action);
    data.hero.animations.play(utils.u([data.actual_action, data.actual_direction]));
}

function enter_key_event() {
    if (!data.in_dialog) {
        for (let i = 0; i < maps[data.map_name].npcs.length; ++i) {
            let npc = maps[data.map_name].npcs[i];
            let npc_tile_x = Math.floor(npc.npc_sprite.x/maps[data.map_name].sprite.tileWidth);
            let npc_tile_y = Math.floor(npc.npc_sprite.y/maps[data.map_name].sprite.tileHeight);
            let nearby_tiles = utils.get_nearby(
                data.actual_direction,
                data.hero_tile_pos_x,
                data.hero_tile_pos_y,
                maps[data.map_name].sprite.tileWidth,
                maps[data.map_name].sprite.tileHeight,
                numbers.NPC_TALK_RANGE
            );
            for (let j = 0; j < nearby_tiles.length; ++j) {
                let pos = nearby_tiles[j];
                if (pos.x === npc_tile_x && pos.y === npc_tile_y) {
                    data.actual_action = "idle";
                    change_hero_sprite();
                    data.npc_event = true;
                    data.active_npc = npc;
                    break;
                }
                if (data.npc_event) break;
            }
        }
    } else if (data.in_dialog && data.waiting_for_enter_press) {
        data.waiting_for_enter_press = false;
        data.dialog_manager.next(() => {
            if (data.dialog_manager.finished) {
                data.in_dialog = false;
                data.dialog_manager = null;
                data.npc_event = false;
            } else {
                data.waiting_for_enter_press = true;
            }
        });
    }
}

function toggle_debug_physics() {
    data.hero.body.debug = !data.hero.body.debug;
    data.map_collider.body.debug = !data.map_collider.body.debug;
    for (let i = 0; i < data.npc_group.children.length; ++i) {
        let sprite = data.npc_group.children[i];
        if (!sprite.is_npc) continue;
        sprite.body.debug = !sprite.body.debug;
    }
}

function create() {
    // Initializing some vars
    data.hero_name = "isaac";
    data.map_name = "madra";
    data.map_collider_layer = 0;
    data.actual_action = 'idle';
    data.actual_direction = 'down';
    data.extra_speed = 0;
    data.delta_time = 0;
    data.x_speed = 0;
    data.y_speed = 0;
    data.event_activation_process = false;
    data.on_event = false;
    data.climbing = false;
    data.teleporting = false;
    data.fading_out = false;
    data.processing_teleport = false;
    data.jumping = false;
    data.npc_event = false;
    data.active_npc = null;
    data.waiting_for_enter_press = false;
    data.dialog_manager = null;
    data.in_dialog = false;
    data.npc_db = game.cache.getJSON('npc_db');

    //creating groups. Order here is important
    data.underlayer_group = game.add.group();
    data.npc_group = game.add.group();
    data.overlayer_group = game.add.group();

    //configing map layers: creating sprites, listing events and setting the layers
    maps[data.map_name].setLayers(game, maps, data.npc_db, data.map_name, data.underlayer_group, data.overlayer_group, data.map_collider_layer, data.npc_group);

    config_hero();
    physics.config_world_physics(data);
    physics.config_physics_for_hero(data);
    physics.config_physics_for_npcs(data);
    physics.config_physics_for_map(data);
    physics.config_collisions(data);
    game.physics.p2.updateBoundsCollisionGroup();

    //activate debug mode
    game.input.keyboard.addKey(Phaser.Keyboard.D).onDown.add(toggle_debug_physics, this);

    //enable full screen
    game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
    game.input.onTap.add(function(pointer, isDoubleClick) {  
        if(isDoubleClick) {
            game.scale.startFullScreen(true);
        }  
    });

    //enable fps show
    data.show_fps = false;
    game.input.keyboard.addKey(Phaser.Keyboard.F).onDown.add(function(){
        data.show_fps = !data.show_fps;
    }, this);

    //enable zoom
    game.input.keyboard.addKey(Phaser.Keyboard.ONE).onDown.add(function(){
        game.scale.setupScale(numbers.GAME_WIDTH, numbers.GAME_HEIGHT);
        window.dispatchEvent(new Event('resize'));
    }, this);
    game.input.keyboard.addKey(Phaser.Keyboard.TWO).onDown.add(function(){
        game.scale.setupScale(2*numbers.GAME_WIDTH, 2*numbers.GAME_HEIGHT);
        window.dispatchEvent(new Event('resize'));
    }, this);
    game.input.keyboard.addKey(Phaser.Keyboard.THREE).onDown.add(function(){
        game.scale.setupScale(3*numbers.GAME_WIDTH, 3*numbers.GAME_HEIGHT);
        window.dispatchEvent(new Event('resize'));
    }, this);

    //enable enter event
    game.input.keyboard.addKey(Phaser.Keyboard.ENTER).onDown.add(enter_key_event, this);

    //set keyboard cursors
    data.cursors = game.input.keyboard.createCursorKeys();

    data.created = true;
}

function fire_event() {
    if(data.event_activation_process){
        if (data.current_event.type === "stair")
            climb.climbing_event(data);
        else if (data.current_event.type === "door") {
            set_door_event(data);
        } else if (data.current_event.type = "jump") {
            data.on_event = true;
            data.event_activation_process = false;
            data.jumping = true;
        }
    }
}

function event_triggering() {
    data.current_event = maps[data.map_name].events[utils.u([data.hero_tile_pos_x, data.hero_tile_pos_y])];
    if (!data.climbing) {
        if(!data.event_activation_process && data.actual_direction === data.current_event.activation_direction && (data.actual_action === "walk" || data.actual_action === "dash")){
            data.event_activation_process = true;
            data.event_timer = game.time.events.add(Phaser.Timer.HALF, fire_event, this);
        } else if(data.event_activation_process && (data.actual_direction != data.current_event.activation_direction ||  data.actual_action === "idle"))
            data.event_activation_process = false;
    } else {
        if(!data.event_activation_process && data.climb_direction === data.current_event.activation_direction && (data.actual_direction === "climb")){
            data.event_activation_process = true;
            data.event_timer = game.time.events.add(Phaser.Timer.HALF, fire_event, this);
        } else if(data.event_activation_process && (data.climb_direction != data.current_event.activation_direction ||  data.actual_direction === "idle"))
            data.event_activation_process = false;
    }

    if (data.current_event.type === "speed") { //speed event activation
        if(data.extra_speed != data.current_event.speed)
            data.extra_speed = data.current_event.speed;
    }

    if (data.current_event.type === "door") { //door event activation
        if (!data.current_event.avance_effect) {
            data.event_activation_process = true;
            fire_event();
        }
    }
}

function update() {
    if (data.created) {
        if (!data.on_event && !data.npc_event) {
            data.hero_tile_pos_x = Math.floor(data.hero.x/maps[data.map_name].sprite.tileWidth);
            data.hero_tile_pos_y = Math.floor(data.hero.y/maps[data.map_name].sprite.tileHeight);

            //check if the actual tile has an event
            if (utils.u([data.hero_tile_pos_x, data.hero_tile_pos_y]) in maps[data.map_name].events)
                event_triggering();
            else if (data.extra_speed != 0) //disabling speed event
                data.extra_speed = 0;

            physics.set_speed_factors(data);
            set_actual_action(); //choose which sprite the hero shall assume
            data.delta_time = game.time.elapsedMS/numbers.DELTA_TIME_FACTOR;
            physics.calculate_hero_speed(data);
            change_hero_sprite();
            physics.collision_dealer(data);

            //make the shadow follow the hero
            data.shadow.x = data.hero.x;
            data.shadow.y = data.hero.y;

            //adjust bodies
            data.map_collider.body.velocity.y = data.map_collider.body.velocity.x = 0; //fix map body
            for (let i = 0; i < data.npc_group.children.length; ++i) {
                let sprite = data.npc_group.children[i];
                if (!sprite.is_npc) continue;
                sprite.body.velocity.y = sprite.body.velocity.x = 0; //fix npcs body
            }

            //organize layers on hero move
            data.npc_group.sort('y', Phaser.Group.SORT_ASCENDING);
        } else if (data.on_event) {
            if (data.current_event.type === "stair")
                climb.climb_event_animation_steps(data);
            else if (data.current_event.type === "door")
                door_event_phases(data);
            else if (data.jumping)
                jump_event(data);

            //disabling hero body movement
            data.hero.body.velocity.y = data.hero.body.velocity.x = 0;
        } else if (data.npc_event) {
            set_npc_event(data);

            //disabling hero body movement
            data.hero.body.velocity.y = data.hero.body.velocity.x = 0;
        }
    }
}

function render() {
    if (data.show_fps)
        game.debug.text('FPS: ' + game.time.fps || 'FPS: --', 5, 15, "#00ff00");
    else
        game.debug.text('', 0, 0);
}

function change_hero_sprite() {
    const key = data.hero_name + "_" + data.actual_action;
    const animation = data.actual_action + "_" + data.actual_direction;
    if (data.hero.key != key) {
        data.hero.loadTexture(key);
        main_char_list[data.hero_name].setAnimation(data.hero, data.actual_action);
        data.hero.animations.play(animation);
    }
    if (data.hero.animations.currentAnim.name != animation) {
        data.hero.animations.play(animation);
    }
}

function set_actual_action() {
    if (!data.cursors.up.isDown && !data.cursors.left.isDown && !data.cursors.right.isDown && !data.cursors.down.isDown && data.actual_action != "idle" && !data.climbing)
        data.actual_action = "idle";
    else if (!data.cursors.up.isDown && !data.cursors.left.isDown && !data.cursors.right.isDown && !data.cursors.down.isDown && data.actual_direction != "idle" && data.climbing)
        data.actual_direction = "idle";
    else if ((data.cursors.up.isDown || data.cursors.left.isDown || data.cursors.right.isDown || data.cursors.down.isDown) && data.actual_direction != "climb" && data.climbing)
        data.actual_direction = "climb";
    else if ((data.cursors.up.isDown || data.cursors.left.isDown || data.cursors.right.isDown || data.cursors.down.isDown) && (data.actual_action != "walk" || data.actual_action != "dash") && !data.climbing) {
        if (game.input.keyboard.isDown(Phaser.Keyboard.SHIFT) && data.actual_action != "dash")
            data.actual_action = "dash";
        else if (!game.input.keyboard.isDown(Phaser.Keyboard.SHIFT) && data.actual_action != "walk")
            data.actual_action = "walk";
    }
}
