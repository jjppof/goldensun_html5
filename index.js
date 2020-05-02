import * as utils from './utils.js';
import * as numbers from './magic_numbers.js';
import { initializeMainChars, main_char_list } from './chars/main_char_list.js';
import { initializeMaps, loadMaps, maps } from './maps/maps.js';
import { jump_event } from './events/jump.js';
import { set_door_event, door_event_phases } from './events/door.js';
import { set_npc_event } from './events/npc.js';
import { config_step, do_step } from './events/step.js';
import { config_collision_change, do_collision_change } from './events/collision.js';
import * as climb from './events/climb.js';
import * as physics from './physics/physics.js';
import { Window } from './base/Window.js';

window.maps = maps;

var currentWidth = window.innerWidth;
var music;
var map_name="madra"; // hum...prob on écrit en dur map_name et aussi pr data.map_name :(
var maps_name=["world","madra","madra_catacombes"];

var menu_open= false;
var option= false;
var ui =['Psynergy','Djinn','Item','Status'];
var touche = 0;
var curseur = 0; //for the options
var ui_display=[];
var ui_windows=[];

var party=['isaac','garet','ivan','mia','felix','jenna','sheba','picard'];

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
    created: false,
    waiting_to_step: false,
    step_event_data: {},
    debug: false,
    grid: false,
    waiting_to_change_collision: false,
    collision_event_data: {},
};
window.data = data;

var game = new Phaser.Game(
    numbers.GAME_WIDTH, //width
    numbers.GAME_HEIGHT, //height
    Phaser.WEBGL, //renderer
    "game", //parent
    { preload: preload, create: create, update: update, render: render, loadRender: loadRender }, //states
    false, //transparent
    false //antialias
);
window.game = game;

function preload() {
    initializeMainChars(game);
    initializeMaps();
    loadMaps(game);
    game.load.json('npc_db', 'assets/dbs/npc_db.json');
    game.load.image('shadow', 'assets/images/misc/shadow.jpg');
    game.load.bitmapFont('gs-bmp-font', 'assets/font/golden-sun.png', 'assets/font/golden-sun.fnt');

    game.load.image('cursor', 'assets/images/ui/cursor.png');
    game.load.image('menu-top', 'assets/images/ui/ui_top.png');
    game.load.image('menu', 'assets/images/ui/ui_menu.png');
    for (let i=0; i< ui.length; i++){
      game.load.image('ui-'+ utils.lowerCaseFirstLetter(ui[i]), 'assets/images/ui/'+ui[i]+'.png');
    }

    for (let i=0; i< maps_name.length; i++){
      game.load.audio('bg-music-'+ maps_name[i], 'assets/music/bg/'+ maps_name[i] + '.mp3');
    }

    for (let i=0; i< party.length; i++){ //faceset
      game.load.image('ui-'+ party[i] , 'assets/images/ui/'+utils.upperCaseFirstLetter(party[i])+'.png');
    }
    for (let i=0; i< ui.length; i++){ // characters img as npc
      game.load.image('ui-faceset-'+ party[i], 'assets/images/icons/'+utils.upperCaseFirstLetter(party[i])+'.png');
    }

    //se
    game.load.audio('step', 'assets/music/se/door.wav');
    game.load.audio('option', 'assets/music/se/battle_option.wav');
    game.load.audio('option-enter', 'assets/music/se/battle_option_enter.wav');
    game.load.audio('menu-cancel', 'assets/music/se/menu_cancel.wav');

    game.time.advancedTiming = true;
    game.stage.smoothed = false;
    game.camera.roundPx = false;
    game.renderer.renderSession.roundPixels = false;
}

function render_loading() {
    game.debug.text('Loading...', 5, 15, "#00ff00");
}

function loadRender() {
    render_loading();
}

function config_hero() {
    //creating sprites and adding hero and its shadow to npc_group
    data.shadow = data.npc_group.create(0, 0, 'shadow');
    data.shadow.blendMode = PIXI.blendModes.MULTIPLY;
    data.shadow.anchor.setTo(numbers.SHADOW_X_AP, numbers.SHADOW_Y_AP); //shadow anchor point
    data.hero = data.npc_group.create(0, 0, data.hero_name + "_" + data.actual_action);
    data.hero.centerX = numbers.HERO_START_X; //hero x start position
    data.hero.centerY = numbers.HERO_START_Y; //hero y start position
    game.camera.follow(data.hero, Phaser.Camera.FOLLOW_LOCKON, 0.9, 0.9); //makes camera follow the data.hero
    //config data.hero initial animation state
    main_char_list[data.hero_name].setAnimation(data.hero, data.actual_action);
    data.hero.animations.play(data.actual_action + "_" + data.actual_direction);
}

function enter_key_event() {
    if (!data.in_dialog) {
        for (let i = 0; i < maps[data.map_name].npcs.length; ++i) {
            let npc = maps[data.map_name].npcs[i];
            let is_close = utils.is_close(
                data.actual_direction,
                data.hero.x,
                data.hero.y,
                npc.npc_sprite.x,
                npc.npc_sprite.y,
                numbers.NPC_TALK_RANGE
            );
            if (is_close) {
                data.actual_action = "idle";
                change_hero_sprite();
                data.npc_event = true;
                data.active_npc = npc;
                break;
            }
        }
    } else if (data.in_dialog && data.waiting_for_enter_press) {
        data.waiting_for_enter_press = false;
        data.dialog_manager.next(() => {
            if (data.dialog_manager.finished) {
                data.in_dialog = false;
                data.dialog_manager = null;
                data.npc_event = false;
                data.active_npc.npc_sprite.animations.play([
                    data.npc_db[data.active_npc.key_name].initial_action,
                    data.npc_db[data.active_npc.key_name].actions[data.npc_db[data.active_npc.key_name].initial_action].initial_direction
                ].join("_"));
            } else {
                data.waiting_for_enter_press = true;
            }
        });
    }
}

function toggle_debug() {
    data.hero.body.debug = !data.hero.body.debug;
    data.map_collider.body.debug = !data.map_collider.body.debug;
    for (let i = 0; i < data.npc_group.children.length; ++i) {
        let sprite = data.npc_group.children[i];
        if (!sprite.is_npc) continue;
        sprite.body.debug = !sprite.body.debug;
    }
    data.debug = !data.debug;
}

function toggle_grid() {
    data.grid = !data.grid;
}


function create() {
    game.camera.fade(0x0, 0);

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

    init_music();
    resizeGame();


    game.input.keyboard.addKey(Phaser.Keyboard.H).onDown.add(() => {
      if (document.getElementById('intro').style.display == "none")
        document.getElementById('intro').style.display= "block";
      else
        document.getElementById('intro').style.display= "none";
    }, this);

    game.input.keyboard.addKey(Phaser.Keyboard.LEFT).onDown.add(() => {
      if(menu_open && !option)
        key_ui (0, 3, game.camera.x + 153, game.camera.x + 49, "left");

      if(option && ui[touche]=="Psynergy"){
        if(curseur-1 < 0){
          clear_ui();
          ui_display.push(game.add.image(game.camera.x , game.camera.y+24, 'cursor' ) );
          curseur= party.length -1;
          for (let i=4; i<8; i++ ){
              ui_display.push(game.add.image(game.camera.x + 24*(i-4) , game.camera.y, 'ui-'+ party[i] ) );
          }
        }
        else if (curseur-1 ==3){
          clear_ui();
          ui_display.push(game.add.image(game.camera.x , game.camera.y+24, 'cursor' ) );
          for (let i=0; i<4; i++ ){
              ui_display.push(game.add.image(game.camera.x + 24*i , game.camera.y, 'ui-'+ party[i] ) );
          }
          curseur--;
        }
        else
          curseur--;

        if(curseur >3)
            ui_display[0].position.x= game.camera.x +(curseur-4)* 24; // représente le curseur: 1er élem pushed
        else
            ui_display[0].position.x= game.camera.x + curseur*24;
      }

    }, this);

    game.input.keyboard.addKey(Phaser.Keyboard.RIGHT).onDown.add(() => {
      if(menu_open && !option)
        key_ui (0, 3, game.camera.x + 153, game.camera.x + 49, "right");


      if(option && ui[touche]=="Psynergy"){

        if(curseur+1 > party.length-1){
          clear_ui();
          ui_display.push(game.add.image(game.camera.x , game.camera.y+24, 'cursor' ) );
          curseur=0;
          for (let i=0; i<4; i++ ){
              ui_display.push(game.add.image(game.camera.x + 24*i , game.camera.y, 'ui-'+ party[i] ) );
          }
        }
        else if (curseur+1 ==4){
          clear_ui();
          ui_display.push(game.add.image(game.camera.x , game.camera.y+24, 'cursor' ) );
          for (let i=4; i<8; i++ ){
              ui_display.push(game.add.image(game.camera.x + 24*(i-4) , game.camera.y, 'ui-'+ party[i] ) );
          }
          curseur++;

        }
        else
          curseur++;

        if(curseur >3)
            ui_display[0].position.x= game.camera.x +(curseur-4)* 24; // représente le curseur
        else
            ui_display[0].position.x= game.camera.x + curseur*24;
      }
    }, this);

    game.input.keyboard.addKey(Phaser.Keyboard.X).onDown.add(() => {
      if(menu_open && !option) {
        menu_open= false;
        music = game.add.audio('menu-cancel');
        music.volume=0.3;
        music.play();

        clear_ui();
      }
      else if(!menu_open && option){
        menu_open= false;
        music = game.add.audio('menu-cancel');
        music.volume=0.3;
        music.play();

        clear_ui();
        clear_windows();
        menu_open=true;
        console.log(touche);
        draw_ui_top();
        draw_ui_down (0, 3, game.camera.x + 153, game.camera.x + 49, "left");
        option=false;

      }

    }, this);

    game.input.keyboard.addKey(Phaser.Keyboard.Z).onDown.add(() => {
      if(menu_open){
        music = game.add.audio('option-enter');
        music.volume=0.3;
        music.play();

        if(ui[touche]=='Psynergy' || ui[touche]=='Item' || ui[touche]=='Djinn' || ui[touche]=='Status'){
          menu_open=false;
          option=true;
          clear_ui(); // à faire TJRS au début de chaque option

          //faire les quatres options
          if(ui[touche]=='Psynergy' || ui[touche]=='Item'){
            ui_windows.push(new Window(game, 0, 0, 100, 36, false) ); // win_char
            ui_windows.push(new Window(game, 0, 40, 100, 92, false) ); // win_char_info
            ui_windows.push(new Window(game, 0, 136, 236, 20, false) ); // win_coin
            ui_windows.push(new Window(game, 104, 0, 132, 20, false) ); // win_question
            ui_windows.push(new Window(game, 104, 24, 132, 76, false) ); // win_psynergy/item
            ui_windows.push(new Window(game, 104, 104, 132, 28, false) ); // win_cmd

            ui_display.push(game.add.image(game.camera.x , game.camera.y+24, 'cursor' ) );
            for (let i=0; i<4; i++ ){
                ui_display.push(game.add.image(game.camera.x + 24*i , game.camera.y, 'ui-'+ party[i] ) );
            }

          }
          if(ui[touche]=='Djinn' || ui[touche]=='Status'){
            ui_windows.push(new Window(game, 0, 0, 100, 36, false) ); // win_char
            ui_windows.push(new Window(game, 104, 0, 132, 36, false) ); // win_cmd
            ui_windows.push(new Window(game, 0, 40, 236, 116, false) ); // win_djinn/status
          }

          for (let i=0; i<ui_windows.length; i++){
              ui_windows[i].show();
          }
        }

      }
      else{
        menu_open= true;
        music = game.add.audio('option');
        music.volume=0.3;
        music.play();

        draw_ui_top();
        draw_ui_down (0, 3, game.camera.x + 153, game.camera.x + 49, "left");

        }

    }, this);

    //activate debug mode
    game.input.keyboard.addKey(Phaser.Keyboard.D).onDown.add(toggle_debug, this);

    //activate grid mode
    game.input.keyboard.addKey(Phaser.Keyboard.G).onDown.add(toggle_grid, this);

    /*
    //enable full screen
    game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
    game.input.onTap.add(function(pointer, isDoubleClick) {
        if(isDoubleClick) {
            game.scale.startFullScreen(true);
        }
    });*/

    //enable fps show
    data.show_fps = false;
    game.input.keyboard.addKey(Phaser.Keyboard.F).onDown.add(function(){
        data.show_fps = !data.show_fps;
    }, this);

    //enable zoom
    game.input.keyboard.addKey(Phaser.Keyboard.NUMPAD_1).onDown.add(function(){
        game.scale.setupScale(numbers.GAME_WIDTH, numbers.GAME_HEIGHT);
        window.dispatchEvent(new Event('resize'));
    }, this);

    game.input.keyboard.addKey(Phaser.Keyboard.NUMPAD_2).onDown.add(function(){
        game.scale.setupScale(2*numbers.GAME_WIDTH, 2*numbers.GAME_HEIGHT);
        window.dispatchEvent(new Event('resize'));
    }, this);

    game.input.keyboard.addKey(Phaser.Keyboard.NUMPAD_3).onDown.add(function(){
        game.scale.setupScale(3*numbers.GAME_WIDTH, 3*numbers.GAME_HEIGHT);
        window.dispatchEvent(new Event('resize'));
    }, this);

    //enable enter event
    game.input.keyboard.addKey(Phaser.Keyboard.ENTER).onDown.add(enter_key_event, this);

    //set keyboard cursors
    data.cursors = game.input.keyboard.createCursorKeys();

    //set initial speed factors
    if (data.actual_direction === "up") {
        data.x_speed = 0;
        data.y_speed = -1;
    } else if (data.actual_direction === "down") {
        data.x_speed = 0;
        data.y_speed = 1;
    } else if (data.actual_direction === "left") {
        data.x_speed = -1;
        data.y_speed = 0;
    } else if (data.actual_direction === "right") {
        data.x_speed = 1;
        data.y_speed = 0;
    }

    data.created = true;
    game.camera.resetFX();
}

function fire_event() {
    if(data.event_activation_process){
        if (data.current_event.type === "stair")
            climb.climbing_event(data);
        else if (data.current_event.type === "door") {

            for (let i=0; i< maps_name.length; i++){
              if(data.current_event.target.startsWith(maps_name[i]) && music.key != 'bg-music-'+ maps_name[i] ){
                music.destroy();
                music = game.add.audio('bg-music-'+ maps_name[i]);
                music.loopFull();
                music.volume=0.2;
                music.play();
                i= maps_name.length;
              }
            }

            set_door_event(data);
        } else if (data.current_event.type === "jump") {
            data.on_event = true;
            data.event_activation_process = false;
            data.jumping = true;
        }
    }
}

function event_triggering() {
    data.current_event = maps[data.map_name].events[data.hero_tile_pos_x + "_" + data.hero_tile_pos_y];
    if (!data.current_event.activation_collision_layers.includes(data.map_collider_layer)) return;
    if (!data.climbing) {
        if(!data.event_activation_process && data.actual_direction === data.current_event.activation_direction && (data.actual_action === "walk" || data.actual_action === "dash")){
            data.event_activation_process = true;
            data.event_timer = game.time.events.add(Phaser.Timer.HALF, fire_event, this);
        } else if(data.event_activation_process && (data.actual_direction !== data.current_event.activation_direction ||  data.actual_action === "idle"))
            data.event_activation_process = false;
    } else {
        if(!data.event_activation_process && data.climb_direction === data.current_event.activation_direction && (data.actual_direction === "climb")){
            data.event_activation_process = true;
            data.event_timer = game.time.events.add(Phaser.Timer.HALF, fire_event, this);
        } else if(data.event_activation_process && (data.climb_direction !== data.current_event.activation_direction ||  data.actual_direction === "idle"))
            data.event_activation_process = false;
    }

    if (data.current_event.type === "speed") { //speed event activation
        if(data.extra_speed !== data.current_event.speed)
            data.extra_speed = data.current_event.speed;
    } else if (data.current_event.type === "door") { //door event activation
        if (!data.current_event.advance_effect) {
            data.event_activation_process = true;
            fire_event();
        }
    } else if (data.current_event.type === "step" && !data.waiting_to_step) {
        config_step(data);
    } else if (data.current_event.type === "collision" && !data.waiting_to_change_collision) {
        config_collision_change(data);
    }
}

function update() {
    if (data.created) {
        if (!data.on_event && !data.npc_event) {
            data.hero_tile_pos_x = parseInt(data.hero.x/maps[data.map_name].sprite.tileWidth);
            data.hero_tile_pos_y = parseInt(data.hero.y/maps[data.map_name].sprite.tileHeight);

            if (data.waiting_to_step) {
                do_step(data);
            }
            if (data.waiting_to_change_collision) {
                do_collision_change(data);
            }

            //check if the actual tile has an event
            if ((data.hero_tile_pos_x + "_" + data.hero_tile_pos_y) in maps[data.map_name].events) {
                event_triggering();
            } else if (data.extra_speed !== 0) { //disabling speed event
                data.extra_speed = 0;
            }

            physics.set_speed_factors(data);
            set_actual_action(); //chooses which sprite the hero shall assume
            data.delta_time = game.time.elapsedMS/numbers.DELTA_TIME_FACTOR;
            physics.calculate_hero_speed(data);
            change_hero_sprite();
            physics.collision_dealer(data);

            //makes the shadow follow the hero
            data.shadow.x = data.hero.x;
            data.shadow.y = data.hero.y;

            data.map_collider.body.velocity.y = data.map_collider.body.velocity.x = 0; //fixes map body

            for (let i = 0; i < maps[data.map_name].npcs.length; ++i) { //updates npcs' movement
                let npc = maps[data.map_name].npcs[i];
                npc.update();
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
    } else {
        render_loading();
    }
}

function render() {
    if (data.show_fps)
        game.debug.text('FPS: ' + game.time.fps || 'FPS: --', 5, 15, "#00ff00");
    else
        game.debug.text('', 0, 0);

    if (data.grid) {
        const tile_width = maps[data.map_name].sprite.tileWidth;
        for (let x = 0; x < game.world.width; x += tile_width) {
            game.debug.geom(new Phaser.Line(x, 0, x, game.world.height), 'rgba(0,255,255,0.35)', false, 4);
        }
        const tile_height = maps[data.map_name].sprite.tileHeight;
        for (let y = 0; y < game.world.height; y += tile_height) {
            game.debug.geom(new Phaser.Line(0, y, game.world.width, y), 'rgba(0,255,255,0.35)', false, 4);
        }
        let x_pos = data.hero_tile_pos_x*tile_width;
        let y_pos = data.hero_tile_pos_y*tile_height;
        game.debug.geom(new Phaser.Rectangle(x_pos, y_pos, tile_width, tile_height), 'rgba(255,0,0,0.5)');
        game.debug.geom(new Phaser.Circle(data.hero.x, data.hero.y, 5), 'rgba(20,75,0,1.0)');
        for (let point in maps[data.map_name].events) {
            let pos = point.split('_');
            game.debug.geom(new Phaser.Rectangle(pos[0]*tile_width, pos[1]*tile_height, tile_width, tile_height), 'rgba(255,255,60,0.7)');
        }
    }
}

function change_hero_sprite() {

    const key = data.hero_name + "_" + data.actual_action;
    const animation = data.actual_action + "_" + data.actual_direction;

    if (data.hero.key !== key) {
        data.hero.loadTexture(key);
        main_char_list[data.hero_name].setAnimation(data.hero, data.actual_action);
        data.hero.animations.play(animation);
    }
    if (data.hero.animations.currentAnim.name !== animation && !menu_open) {
        data.hero.animations.play(animation);
    }
}

function set_actual_action() {
    if (!data.cursors.up.isDown && !data.cursors.left.isDown && !data.cursors.right.isDown && !data.cursors.down.isDown && data.actual_action !== "idle" && !data.climbing || menu_open || option)
        data.actual_action = "idle";
    else if (!data.cursors.up.isDown && !data.cursors.left.isDown && !data.cursors.right.isDown && !data.cursors.down.isDown && data.actual_direction !== "idle" && data.climbing)
        data.actual_direction = "idle";
    else if ((data.cursors.up.isDown || data.cursors.left.isDown || data.cursors.right.isDown || data.cursors.down.isDown) && data.actual_direction !== "climb" && data.climbing)
        data.actual_direction = "climb";
    else if ((data.cursors.up.isDown || data.cursors.left.isDown || data.cursors.right.isDown || data.cursors.down.isDown) && (data.actual_action !== "walk" || data.actual_action !== "dash") && !data.climbing) {
        if (game.input.keyboard.isDown(Phaser.Keyboard.SHIFT) && data.actual_action !== "dash")
            data.actual_action = "dash";
        else if (!game.input.keyboard.isDown(Phaser.Keyboard.SHIFT) && data.actual_action !== "walk")
            data.actual_action = "walk";
    }
}

function init_music(){
      music = game.add.audio('bg-music-'+map_name);
      music.loopFull();
      music.volume=0.2;
      music.play();
}

function resizeGame()
{
    if( currentWidth >= 1024 )
    {
        game.scale.setupScale(numbers.GAME_WIDTH*3, numbers.GAME_HEIGHT*3);
        window.dispatchEvent(new Event('resize'));
    }
    else if( currentWidth >= 480 )
    {
        game.scale.setupScale(numbers.GAME_WIDTH*2, numbers.GAME_HEIGHT*2);
        window.dispatchEvent(new Event('resize'));
    }
    else if( currentWidth >= 375 )
    {
        game.scale.setupScale(numbers.GAME_WIDTH*1.5, numbers.GAME_HEIGHT*1.5);
        window.dispatchEvent(new Event('resize'));
    }
}

function key_ui (touche_debut, touche_fin, txt_pos_x, img_pos_x, key)
{
  console.log("je suis ds la fonction key_ui");
    ui_display[ui_display.length-2].destroy();
    ui_display[ui_display.length-1].destroy();
    ui_display.splice(ui_display.length-2, 2);
  music = game.add.audio('option');
  music.volume=0.3;
  music.play();

  if(key=="right"){
    if(touche+1>  touche_fin)
      touche= touche_debut;
    else
      touche += 1;
  }
  if(key=="left"){
    if(touche -1< touche_debut )
      touche= touche_fin;
    else
      touche -= 1;
  }

  ui_display.push( game.add.bitmapText(txt_pos_x, game.camera.y +144, 'gs-bmp-font', ui[touche], numbers.FONT_SIZE) );
  if (touche== touche_fin)
    ui_display.push (game.add.image(img_pos_x + 24*(touche-touche_debut)-6, game.camera.y +130, 'ui-'+ utils.lowerCaseFirstLetter(ui[touche]) ) );
  else if (touche== touche_debut)
    ui_display.push (game.add.image(img_pos_x, game.camera.y +130, 'ui-'+ utils.lowerCaseFirstLetter(ui[touche]) ) );
  else
    ui_display.push (game.add.image(img_pos_x-2 + 24*(touche-touche_debut), game.camera.y +130, 'ui-'+ utils.lowerCaseFirstLetter(ui[touche]) ) );

  game.add.tween(ui_display[ui_display.length-1].scale).to({ x: 14/15, y: 14/15  }, 200, Phaser.Easing.Back.Out, true, 0, -1, true);
  if (touche== touche_fin){
    game.add.tween(ui_display[ui_display.length-1]).to({x: img_pos_x + 24*(touche-touche_debut)-4, y: game.camera.y + 132 }, 200, Phaser.Easing.Back.Out, true, 0, -1,true);
  }
  else{
    game.add.tween(ui_display[ui_display.length-1]).to({y: game.camera.y +132 }, 200, Phaser.Easing.Back.Out, true, 0, -1,true);
  }

}

function draw_ui_top(){
  ui_display.push( game.add.image(game.camera.x + 40, game.camera.y, 'menu-top') );

  for(var i=0; i< 4;i++){
    var hp_bar = game.add.bitmapData(40, 3); //hp
    hp_bar.ctx.beginPath();
    hp_bar.ctx.rect(0, 0, 40, 3);
    hp_bar.ctx.fillStyle = '#0000f8';
    hp_bar.ctx.fill();
    ui_display.push( game.add.sprite(game.camera.x +48 + 48*i, game.camera.y +21, hp_bar) );

    var pp_bar = game.add.bitmapData(40, 3); //pp
    pp_bar.ctx.beginPath();
    pp_bar.ctx.rect(0, 0, 40, 3);
    pp_bar.ctx.fillStyle = '#0000f8';
    pp_bar.ctx.fill();
    ui_display.push( game.add.sprite(game.camera.x +48 + 48*i, game.camera.y +29, pp_bar) );

    var string= utils.upperCaseFirstLetter(party[i]); // characters name
    ui_display.push( game.add.bitmapText(game.camera.x +48 + 48*i, game.camera.y +8, 'gs-bmp-font', string, 8 ) );
    ui_display.push( game.add.bitmapText(game.camera.x +48 + 48*i, game.camera.y +16, 'gs-bmp-font', "HP", 8 ) );
    ui_display.push( game.add.bitmapText(game.camera.x +48 + 48*i, game.camera.y +24, 'gs-bmp-font', "PP", 8 ) );

  }
}

function draw_ui_down(touche_debut, touche_fin, txt_pos_x, img_pos_x, key){
  ui_display.push (game.add.image(game.camera.x + 49, game.camera.y + 136, 'menu' ) );
  data.hero.animations.play("idle_" + data.actual_direction); // we block in idle state
  // tiny problem: if press key, it saves it and show when resume

  if (!option){
    ui_display.push( game.add.image(game.camera.x + 49, game.camera.y +130, 'ui-psynergy') );
    game.add.tween(ui_display[ui_display.length-1].scale).to({ x: 14/15, y: 14/15  }, 200, Phaser.Easing.Back.Out, true, 0, -1, true);
    game.add.tween(ui_display[ui_display.length-1]).to({y: game.camera.y + 132 }, 200, Phaser.Easing.Back.Out, true, 0, -1,true);

    // x= 153 -> 8 px to the right (little box)
    ui_display.push(game.add.bitmapText(game.camera.x + 153, game.camera.y + 144, 'gs-bmp-font', ui[0], numbers.FONT_SIZE) );
  }
  else{ // we have in memory touche
    ui_display.push( game.add.bitmapText(txt_pos_x, game.camera.y +144, 'gs-bmp-font', ui[touche], numbers.FONT_SIZE) );
    if (touche== touche_fin)
      ui_display.push (game.add.image(img_pos_x + 24*(touche-touche_debut)-6, game.camera.y +130, 'ui-'+ utils.lowerCaseFirstLetter(ui[touche]) ) );
    else if (touche== touche_debut)
      ui_display.push (game.add.image(img_pos_x, game.camera.y +130, 'ui-'+ utils.lowerCaseFirstLetter(ui[touche]) ) );
    else
      ui_display.push (game.add.image(img_pos_x-2 + 24*(touche-touche_debut), game.camera.y +130, 'ui-'+ utils.lowerCaseFirstLetter(ui[touche]) ) );

    game.add.tween(ui_display[ui_display.length-1].scale).to({ x: 14/15, y: 14/15  }, 200, Phaser.Easing.Back.Out, true, 0, -1, true);
    if (touche== touche_fin){
      game.add.tween(ui_display[ui_display.length-1]).to({x: img_pos_x + 24*(touche-touche_debut)-4, y: game.camera.y + 132 }, 200, Phaser.Easing.Back.Out, true, 0, -1,true);
    }
    else{
      game.add.tween(ui_display[ui_display.length-1]).to({y: game.camera.y +132 }, 200, Phaser.Easing.Back.Out, true, 0, -1,true);
    }
  }

}

function clear_ui(){
  console.log("effacé");
  for (let i=0; i<ui_display.length; i++){
    ui_display[i].destroy();
  }
  ui_display=[];
}

function clear_windows(){
  for (let i=0; i<ui_windows.length; i++){
    ui_windows[i].destroy();
  }
  ui_windows=[];
}
