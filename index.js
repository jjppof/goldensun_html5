import * as numbers from './magic_numbers.js';
import { initialize_main_chars, main_char_list, initialize_classes, party_data } from './chars/main_chars.js';
import { initialize_abilities, abilities_list, initialize_field_abilities, field_abilities_list } from './chars/abilities.js';
import { initialize_djinni, djinni_list } from './chars/djinni.js';
import { initializeMaps, loadMaps, maps } from './maps/maps.js';
import { jump_event, jump_near_collision } from './events/jump.js';
import { set_door_event, door_event_phases } from './events/door.js';
import { set_npc_event, trigger_npc_dialog } from './events/npc.js';
import { config_step, do_step } from './events/step.js';
import { config_collision_change, do_collision_change } from './events/collision.js';
import * as climb from './events/climb.js';
import * as physics from './physics/physics.js';
import { initialize_menu } from './screens/menu.js';
import { config_hero, change_hero_sprite, set_actual_action, update_shadow, stop_hero, init_speed_factors } from './chars/hero_control.js';

var data = {
    game: undefined,
    cursors: undefined,
    hero: undefined,
    camera_type: undefined,
    map_collider_layer: undefined,
    actual_action: "idle",
    actual_direction: undefined,
    climb_direction: undefined,
    x_speed: 0,
    y_speed: 0,
    hero_name: undefined,
    map_name: undefined,
    shadow: undefined,
    hero_tile_pos_x: undefined,
    hero_tile_pos_y: undefined,
    current_event: undefined,
    event_activation_process: false,
    event_timers: {},
    on_event: false,
    climbing: false,
    extra_speed: 0,
    map_collider: undefined,
    mapCollisionGroup: undefined,
    heroCollisionGroup: undefined,
    npcCollisionGroups: {},
    psynergyItemCollisionGroups: {},
    dynamicEventsCollisionGroup: undefined,
    underlayer_group: undefined,
    overlayer_group: undefined,
    npc_group: undefined,
    teleporting: false,
    fading_out: false,
    processing_teleport: false,
    delta_time: 0,
    show_fps: undefined,
    npc_db: undefined,
    psynergy_items_db: undefined,
    npc_event: false,
    active_npc: null,
    waiting_for_enter_press: false,
    dialog_manager: null,
    in_dialog: false,
    created: false,
    waiting_to_step: false,
    step_event_data: {},
    debug: false,
    grid: false,
    waiting_to_change_collision: false,
    collision_event_data: {},
    trying_to_push: false,
    trying_to_push_direction: "",
    push_timer: null,
    pushing: false,
    walking_on_pillars_tiles: new Set(),
    dynamic_jump_events_bodies: [],
    scale_factor: 1,
    menu_open: false,
    esc_input: null,
    classes_db: null,
    abilities_db: null,
    casting_psynergy: false,
    hero_color_filters: undefined,
    map_color_filters: undefined,
    pasynergy_item_color_filters: undefined,
    stop_by_colliding: false
};

//debugging porpouses
window.maps = maps;
window.main_char_list = main_char_list;
window.abilities_list = abilities_list;
window.field_abilities_list = field_abilities_list;
window.djinni_list = djinni_list;
window.party_data = party_data;
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
data.game = game;

function load_buttons() {
    game.load.image('psynergy_button', 'assets/images/buttons/psynergy.gif');
    game.load.image('djinni_button', 'assets/images/buttons/djinni.gif');
    game.load.image('item_button', 'assets/images/buttons/item.gif');
    game.load.image('status_button', 'assets/images/buttons/status.gif');

    game.load.image('shift_keyboard', 'assets/images/keyboard/shift.png');
    game.load.image('tab_keyboard', 'assets/images/keyboard/tab.png');
}

function load_misc() {
    game.load.image('shadow', 'assets/images/misc/shadow.jpg');
    game.load.image('cursor', 'assets/images/misc/cursor.gif');
    game.load.image('green_arrow', 'assets/images/misc/green_arrow.gif');
    game.load.image('page_arrow', 'assets/images/misc/page_arrow.png');
    game.load.image('psynergy_aura', 'assets/images/misc/psynergy_aura.png');
    game.load.atlasJSONHash('psynergy_particle', 'assets/images/spritesheets/psynergy_particle.png', 'assets/images/spritesheets/psynergy_particle.json');
}

function preload() {
    initializeMaps();
    loadMaps(game);
    game.load.json('init_db', 'init.json');
    game.load.json('classes_db', 'assets/dbs/classes_db.json');
    game.load.json('abilities_db', 'assets/dbs/abilities_db.json');
    game.load.json('npc_db', 'assets/dbs/npc_db.json');
    game.load.json('psynergy_items_db', 'assets/dbs/psynergy_items_db.json');
    game.load.json('djinni_db', 'assets/dbs/djinni_db.json');
    game.load.script('color_filters', 'plugins/ColorFilters.js');
    load_misc();
    load_buttons();
    game.load.bitmapFont('gs-bmp-font', 'assets/font/golden-sun.png', 'assets/font/golden-sun.fnt');
    initialize_field_abilities(game, data);

    game.time.advancedTiming = true;
    game.stage.smoothed = false;
    game.camera.roundPx = true;
    game.renderer.renderSession.roundPixels = true;

    game.camera.fade(0x0, 1);
}

function render_loading() {
    game.debug.text('Loading...', 5, 15, "#00ff00");
}

function loadRender() {
    render_loading();
}

function enter_key_event() {
    if (data.casting_psynergy) return;
    trigger_npc_dialog(data);
}

function toggle_debug() {
    data.hero.body.debug = !data.hero.body.debug;
    data.map_collider.body.debug = !data.map_collider.body.debug;
    for (let i = 0; i < data.npc_group.children.length; ++i) {
        let sprite = data.npc_group.children[i];
        if (!sprite.is_npc && !sprite.is_psynergy_item) continue;
        sprite.body.debug = !sprite.body.debug;
    }
    for (let i = 0; i < data.dynamic_jump_events_bodies.length; ++i) {
        data.dynamic_jump_events_bodies[i].debug = !data.dynamic_jump_events_bodies[i].debug;
    }
    data.debug = !data.debug;
}

async function create() {
    // initializing some vars
    data.init_db = game.cache.getJSON('init_db'); 
    data.npc_db = game.cache.getJSON('npc_db');
    data.psynergy_items_db = game.cache.getJSON('psynergy_items_db');
    data.classes_db = game.cache.getJSON('classes_db');
    data.abilities_db = game.cache.getJSON('abilities_db');
    data.djinni_db = game.cache.getJSON('djinni_db');
    data.hero_color_filters = game.add.filter('ColorFilters');
    data.map_color_filters = game.add.filter('ColorFilters');
    data.pasynergy_item_color_filters = game.add.filter('ColorFilters');

    data.hero_name = data.init_db.hero_key_name;
    data.actual_direction = data.init_db.initial_direction;
    data.map_name = data.init_db.map_key_name;
    data.scale_factor = data.init_db.initial_scale_factor;
    data.map_collider_layer = data.init_db.map_z_index;
    party_data.coins = data.init_db.coins;

    game.scale.setupScale(data.scale_factor * numbers.GAME_WIDTH, data.scale_factor * numbers.GAME_HEIGHT);
    window.dispatchEvent(new Event('resize'));

    initialize_classes(data.classes_db);
    initialize_djinni(data.djinni_db);

    let load_abilities_promise_resolve;
    let load_abilities_promise = new Promise(resolve => {
        load_abilities_promise_resolve = resolve;
    });
    initialize_abilities(game, data.abilities_db, load_abilities_promise_resolve);
    await load_abilities_promise;

    let load_chars_promise_resolve;
    let load_chars_promise = new Promise(resolve => {
        load_chars_promise_resolve = resolve;
    });
    game.load.json('main_chars_db', 'assets/dbs/main_chars.json').onLoadComplete.addOnce(() => {
        data.main_chars_db = game.cache.getJSON('main_chars_db');
        initialize_main_chars(game, data.main_chars_db, load_chars_promise_resolve);
    });
    game.load.start();
    await load_chars_promise;

    //creating groups. Order here is important
    data.underlayer_group = game.add.group();
    data.npc_group = game.add.group();
    data.overlayer_group = game.add.group();

    //initialize screens
    data.menu_screen = initialize_menu(data);
    game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR).onDown.add(() => {
        if (data.casting_psynergy) return;
        if (!data.menu_open) {
            data.menu_open = true;
            stop_hero(data);
            update_shadow(data);
            data.menu_screen.open_menu();
        } else if (data.menu_screen.is_active()) {
            data.menu_open = false;
            data.menu_screen.close_menu();
        }
    }, this);
    data.esc_input = game.input.keyboard.addKey(Phaser.Keyboard.ESC).onDown.add(() => {
        if (data.menu_open) {
            data.menu_open = false;
            data.menu_screen.close_menu();
        }
    }, this);

    //configuring map layers: creating sprites, listing events and setting the layers
    maps[data.map_name].setLayers(
        game,
        data,
        maps,
        data.npc_db,
        data.psynergy_items_db,
        data.map_name,
        data.underlayer_group,
        data.overlayer_group,
        data.map_collider_layer,
        data.npc_group
    ).then(() => {
        config_hero(data);
        physics.config_world_physics();
        physics.config_physics_for_hero(data);
        physics.config_physics_for_npcs(data);
        physics.config_physics_for_psynergy_items(data);
        data.dynamicEventsCollisionGroup = game.physics.p2.createCollisionGroup();
        physics.config_physics_for_map(data);
        physics.config_collisions(data);
        game.physics.p2.updateBoundsCollisionGroup();

        //activate debug mode
        game.input.keyboard.addKey(Phaser.Keyboard.D).onDown.add(toggle_debug, this);
        
        //activate grid mode
        game.input.keyboard.addKey(Phaser.Keyboard.G).onDown.add(() => {
            data.grid = !data.grid;
        }, this);

        //enable full screen
        game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
        game.input.onTap.add(function(pointer, isDoubleClick) {  
            if (isDoubleClick) {
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
            data.scale_factor = 1;
            game.scale.setupScale(numbers.GAME_WIDTH, numbers.GAME_HEIGHT);
            window.dispatchEvent(new Event('resize'));
        }, this);
        game.input.keyboard.addKey(Phaser.Keyboard.TWO).onDown.add(function(){
            data.scale_factor = 2;
            game.scale.setupScale(data.scale_factor * numbers.GAME_WIDTH, data.scale_factor * numbers.GAME_HEIGHT);
            window.dispatchEvent(new Event('resize'));
        }, this);
        game.input.keyboard.addKey(Phaser.Keyboard.THREE).onDown.add(function(){
            data.scale_factor = 3;
            game.scale.setupScale(data.scale_factor * numbers.GAME_WIDTH, data.scale_factor * numbers.GAME_HEIGHT);
            window.dispatchEvent(new Event('resize'));
        }, this);

        //enable psynergies shortcuts
        game.input.keyboard.addKey(Phaser.Keyboard.Q).onDown.add(function(){
            field_abilities_list.move.cast(data.hero_name);
        }, this);

        //enable enter event
        data.enter_input = game.input.keyboard.addKey(Phaser.Keyboard.ENTER).onDown.add(enter_key_event, this);

        //set keyboard cursors
        data.cursors = game.input.keyboard.createCursorKeys();

        init_speed_factors(data);

        data.created = true;
        game.camera.resetFX();
    });
}

function fire_event(event_key = undefined) {
    if(data.event_activation_process){
        if (data.current_event.type === "stair")
            climb.climbing_event(data, event_key);
        else if (data.current_event.type === "door") {
            set_door_event(data);
        } else if (data.current_event.type === "jump") {
            if (!data.current_event.active) return;
            data.on_event = true;
            data.event_activation_process = false;
            jump_event(data, event_key);
        }
    }
}

function event_triggering() {
    const event_key = data.hero_tile_pos_x + "_" + data.hero_tile_pos_y;
    data.current_event = maps[data.map_name].events[event_key];
    if (!data.current_event.activation_collision_layers.includes(data.map_collider_layer)) return;
    if (data.current_event.type === "jump") {
        jump_near_collision(data, event_key);
    }
    let right_direction;
    if (Array.isArray(data.current_event.activation_direction)) {
        right_direction = data.current_event.activation_direction.includes(data.actual_direction);
    } else {
        right_direction = data.actual_direction === data.current_event.activation_direction;
    }
    if (!data.climbing) {
        if (!data.event_activation_process && right_direction && (data.actual_action === "walk" || data.actual_action === "dash")) {
            if (data.event_timers[event_key] && !data.event_timers[event_key].timer.expired) {
                return;
            }
            data.event_activation_process = true;
            data.event_timers[event_key] = game.time.events.add(numbers.EVENT_TIME, fire_event.bind(null, event_key), this);
        } else if (data.event_activation_process && (!right_direction || data.actual_action === "idle")) {
            data.event_activation_process = false;
        }
    } else {
        if (!data.event_activation_process && data.climb_direction === data.current_event.activation_direction && (data.actual_direction === "climb")) {
            if (data.event_timers[event_key] && !data.event_timers[event_key].timer.expired) {
                return;
            }
            data.event_activation_process = true;
            data.event_timers[event_key] = game.time.events.add(numbers.EVENT_TIME, fire_event.bind(null, event_key), this);
        } else if (data.event_activation_process && (data.climb_direction !== data.current_event.activation_direction ||  data.actual_direction === "idle")) {
            data.event_activation_process = false;
        }
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
        if (!data.on_event && !data.npc_event && !data.pushing && !data.menu_open && !data.casting_psynergy) {
            data.hero_tile_pos_x = parseInt(data.hero.x/maps[data.map_name].sprite.tileWidth);
            data.hero_tile_pos_y = parseInt(data.hero.y/maps[data.map_name].sprite.tileHeight);

            if (data.waiting_to_step) { //step event
                do_step(data);
            }
            if (data.waiting_to_change_collision) { //change collision pattern layer event
                do_collision_change(data);
            }

            //check if the actual tile has an event
            if ((data.hero_tile_pos_x + "_" + data.hero_tile_pos_y) in maps[data.map_name].events) {
                event_triggering();
            } else if (data.extra_speed !== 0) { //disabling speed event
                data.extra_speed = 0;
            }

            physics.set_speed_factors(data);
            set_actual_action(data); //chooses which sprite the hero shall assume
            data.delta_time = game.time.elapsedMS/numbers.DELTA_TIME_FACTOR;
            physics.calculate_hero_speed(data);
            change_hero_sprite(data);
            physics.collision_dealer(data);

            update_shadow(data);

            data.map_collider.body.velocity.y = data.map_collider.body.velocity.x = 0; //fixes map body

            for (let i = 0; i < maps[data.map_name].npcs.length; ++i) { //updates npcs' movement
                let npc = maps[data.map_name].npcs[i];
                npc.update();
            }

            //organize layers on hero move
            data.npc_group.children.forEach(sprite => {
                sprite.y_sort = parseInt(sprite.base_collider_layer.toString() + sprite.y.toString());
            });
            data.npc_group.sort('y_sort', Phaser.Group.SORT_ASCENDING);
        } else if (data.on_event) {
            if (data.current_event.type === "stair") {
                climb.climb_event_animation_steps(data);
            } else if (data.current_event.type === "door") {
                door_event_phases(data);
            }

            //disabling hero body movement
            data.hero.body.velocity.y = data.hero.body.velocity.x = 0;
        } else if (data.npc_event) {
            set_npc_event(data);

            //disabling hero body movement
            data.hero.body.velocity.y = data.hero.body.velocity.x = 0;
        } else if (data.pushing) {
            change_hero_sprite(data);
        }
    } else {
        render_loading();
    }
}

function render() {
    game.debug.text('', 0, 0);

    if (data.show_fps) {
        game.debug.text('FPS: ' + game.time.fps || 'FPS: --', 5, 15, "#00ff00");
    }

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

        if (game.input.mousePointer.withinGame) {
            const mouse_x = parseInt((game.camera.x + game.input.mousePointer.x/data.scale_factor)/maps[data.map_name].sprite.tileWidth);
            const mouse_y = parseInt((game.camera.y + game.input.mousePointer.y/data.scale_factor)/maps[data.map_name].sprite.tileHeight);
            game.debug.text(`x: ${mouse_x}, y: ${mouse_y}`, 140, 15, "#00ff00");
        } else {
            game.debug.text(`x: --, y: --`, 140, 15, "#00ff00");
        }
    }
}
