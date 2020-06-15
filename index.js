import * as numbers from './magic_numbers.js';
import { initialize_main_chars, main_char_list, initialize_classes, party_data } from './initializers/main_chars.js';
import { initialize_abilities, abilities_list, initialize_field_abilities, field_abilities_list } from './initializers/abilities.js';
import { initialize_items, items_list } from './initializers/items.js';
import { initialize_djinni, djinni_list } from './initializers/djinni.js';
import { initialize_enemies, enemies_list } from './initializers/enemies.js';
import { initialize_maps, load_maps, maps } from './initializers/maps.js';
import { door_event_phases } from './events/door.js';
import { set_npc_event, trigger_npc_dialog } from './events/npc.js';
import { do_step } from './events/step.js';
import { do_collision_change } from './events/collision.js';
import * as climb from './events/climb.js';
import * as physics from './physics/physics.js';
import { initialize_menu } from './screens/menu.js';
import { config_hero, change_hero_sprite, set_actual_action, update_shadow, stop_hero, init_speed_factors } from './initializers/hero_control.js';
import { TileEvent } from './base/TileEvent.js';
import { set_debug_info, toggle_debug } from './debug.js';
import { event_triggering } from './events/triggering.js';

var data = {
    game: undefined,
    cursors: undefined,
    hero: undefined,
    camera_type: undefined,
    map_collider_layer: undefined,
    actual_action: "idle",
    actual_direction: undefined,
    x_speed: 0,
    y_speed: 0,
    hero_name: undefined,
    map_name: undefined,
    shadow: undefined,
    hero_tile_pos_x: undefined,
    hero_tile_pos_y: undefined,
    current_event: undefined,
    event_timers: {},
    on_event: false,
    climbing: false,
    extra_speed: 0,
    map_collider: undefined,
    mapCollisionGroup: undefined,
    heroCollisionGroup: undefined,
    npcCollisionGroups: {},
    interactableObjectCollisionGroups: {},
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
    interactable_objects_db: undefined,
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
    items_db: null,
    casting_psynergy: false,
    hero_color_filters: undefined,
    map_color_filters: undefined,
    pasynergy_item_color_filters: undefined,
    stop_by_colliding: false,
    force_direction: false,
    enemies_db: null,
    shift_input: null,
    forcing_on_diagonal: false,
    door_event_data: null,
    climbing_event_data: null,
    maps_db: undefined,
    jumping: false
};

//debugging porpouses
window.maps = maps;
window.main_char_list = main_char_list;
window.abilities_list = abilities_list;
window.items_list = items_list;
window.field_abilities_list = field_abilities_list;
window.djinni_list = djinni_list;
window.enemies_list = enemies_list;
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

function load_db_files() {
    game.load.json('init_db', 'init.json');
    game.load.json('classes_db', 'assets/dbs/classes_db.json');
    game.load.json('abilities_db', 'assets/dbs/abilities_db.json');
    game.load.json('items_db', 'assets/dbs/items_db.json');
    game.load.json('npc_db', 'assets/dbs/npc_db.json');
    game.load.json('interactable_objects_db', 'assets/dbs/interactable_objects_db.json');
    game.load.json('djinni_db', 'assets/dbs/djinni_db.json');
    game.load.json('enemies_db', 'assets/dbs/enemies_db.json');
    game.load.json('maps_db', 'assets/dbs/maps_db.json');
    game.load.json('main_chars_db', 'assets/dbs/main_chars.json');
}

function load_misc() {
    game.load.image('shadow', 'assets/images/misc/shadow.jpg');
    game.load.image('cursor', 'assets/images/misc/cursor.gif');
    game.load.image('green_arrow', 'assets/images/misc/green_arrow.gif');
    game.load.image('up_arrow', 'assets/images/misc/up_arrow.gif');
    game.load.image('down_arrow', 'assets/images/misc/down_arrow.gif');
    game.load.image('page_arrow', 'assets/images/misc/page_arrow.png');
    game.load.image('psynergy_aura', 'assets/images/misc/psynergy_aura.png');
    game.load.image('equipped', 'assets/images/misc/equipped.gif');
    game.load.image('venus_star', 'assets/images/misc/venus_star.gif');
    game.load.image('mercury_star', 'assets/images/misc/mercury_star.gif');
    game.load.image('mars_star', 'assets/images/misc/mars_star.gif');
    game.load.image('jupiter_star', 'assets/images/misc/jupiter_star.gif');
    game.load.image('stat_up', 'assets/images/misc/stat_up.gif');
    game.load.image('stat_down', 'assets/images/misc/stat_down.gif');
    game.load.atlasJSONHash('psynergy_particle', 'assets/images/spritesheets/interactable_objects/psynergy_particle.png', 'assets/images/spritesheets/interactable_objects/psynergy_particle.json');
}

function preload() {
    load_db_files();
    load_misc();
    load_buttons();
    game.load.script('color_filters', 'plugins/ColorFilters.js');
    game.load.bitmapFont('gs-bmp-font', 'assets/font/golden-sun.png', 'assets/font/golden-sun.fnt');
    game.load.bitmapFont('gs-item-bmp-font', 'assets/font/gs-item-font.png', 'assets/font/gs-item-font.fnt');
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

async function create() {
    // initializing some vars
    data.init_db = game.cache.getJSON('init_db'); 
    data.npc_db = game.cache.getJSON('npc_db');
    data.interactable_objects_db = game.cache.getJSON('interactable_objects_db');
    data.classes_db = game.cache.getJSON('classes_db');
    data.abilities_db = game.cache.getJSON('abilities_db');
    data.items_db = game.cache.getJSON('items_db');
    data.djinni_db = game.cache.getJSON('djinni_db');
    data.enemies_db = game.cache.getJSON('enemies_db');
    data.maps_db = game.cache.getJSON('maps_db');
    data.main_chars_db = game.cache.getJSON('main_chars_db');
    data.hero_color_filters = game.add.filter('ColorFilters');
    data.map_color_filters = game.add.filter('ColorFilters');
    data.pasynergy_item_color_filters = game.add.filter('ColorFilters');

    data.hero_name = data.init_db.hero_key_name;
    data.actual_direction = data.init_db.initial_direction;
    data.map_name = data.init_db.map_key_name;
    data.scale_factor = data.init_db.initial_scale_factor;
    data.map_collider_layer = data.init_db.map_z_index;
    party_data.coins = data.init_db.coins;

    let load_maps_promise_resolve;
    let load_maps_promise = new Promise(resolve => {
        load_maps_promise_resolve = resolve;
    });
    initialize_maps(data.maps_db);
    load_maps(game, load_maps_promise_resolve);
    await load_maps_promise;

    game.scale.setupScale(data.scale_factor * numbers.GAME_WIDTH, data.scale_factor * numbers.GAME_HEIGHT);
    window.dispatchEvent(new Event('resize'));

    initialize_classes(data.classes_db);
    initialize_enemies(data.enemies_db);

    let load_djinni_sprites_promise_resolve;
    let load_djinni_sprites_promise = new Promise(resolve => {
        load_djinni_sprites_promise_resolve = resolve;
    });
    initialize_djinni(game, data.djinni_db, load_djinni_sprites_promise_resolve);
    await load_djinni_sprites_promise;
    
    let load_abilities_promise_resolve;
    let load_abilities_promise = new Promise(resolve => {
        load_abilities_promise_resolve = resolve;
    });
    initialize_abilities(game, data.abilities_db, load_abilities_promise_resolve);
    await load_abilities_promise;
    
    let load_items_promise_resolve;
    let load_items_promise = new Promise(resolve => {
        load_items_promise_resolve = resolve;
    });
    initialize_items(game, data.items_db, load_items_promise_resolve);
    await load_items_promise;

    let load_chars_promise_resolve;
    let load_chars_promise = new Promise(resolve => {
        load_chars_promise_resolve = resolve;
    });
    initialize_main_chars(game, data.main_chars_db, load_chars_promise_resolve);
    await load_chars_promise;

    //creating groups. Order here is important
    data.underlayer_group = game.add.group();
    data.npc_group = game.add.group();
    data.overlayer_group = game.add.group();
    
    data.shift_input = game.input.keyboard.addKey(Phaser.Keyboard.SHIFT).onDown;

    //initialize screens
    data.menu_screen = initialize_menu(data);
    game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR).onDown.add(() => {
        if (data.casting_psynergy || data.climbing || data.pushing || data.teleporting || data.jumping) return;
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
        data.interactable_objects_db,
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
        physics.config_physics_for_interactable_objects(data);
        data.dynamicEventsCollisionGroup = game.physics.p2.createCollisionGroup();
        physics.config_physics_for_map(data);
        physics.config_collisions(data);
        game.physics.p2.updateBoundsCollisionGroup();

        //activate debug mode
        game.input.keyboard.addKey(Phaser.Keyboard.D).onDown.add(toggle_debug.bind(this, data), this);
        
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
        game.scale.onFullScreenChange.add(() => {
            game.scale.setupScale(numbers.GAME_WIDTH, numbers.GAME_HEIGHT);
            window.dispatchEvent(new Event('resize'));
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
            if (data.climbing || data.menu_open || data.pushing || data.teleporting || data.jumping) return;
            field_abilities_list.move.cast(data.init_db.initial_shortcuts.move);
        }, this);
        game.input.keyboard.addKey(Phaser.Keyboard.W).onDown.add(function(){
            if (data.climbing || data.menu_open || data.pushing || data.teleporting || data.jumping) return;
            field_abilities_list.frost.cast(data.init_db.initial_shortcuts.frost);
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
            const event_location_key = TileEvent.get_location_key(data.hero_tile_pos_x, data.hero_tile_pos_y);
            if (event_location_key in maps[data.map_name].events) {
                event_triggering(game, data, event_location_key);
            } else if (data.extra_speed !== 0) { //disabling speed event
                data.extra_speed = 0;
            }

            physics.set_speed_factors(data);
            set_actual_action(data); //chooses which sprite the hero shall assume
            data.delta_time = game.time.elapsedMS/numbers.DELTA_TIME_FACTOR;
            physics.calculate_hero_speed(data);
            physics.collision_dealer(data);
            change_hero_sprite(data);

            update_shadow(data);

            data.map_collider.body.velocity.y = data.map_collider.body.velocity.x = 0; //fixes map body

            for (let i = 0; i < maps[data.map_name].npcs.length; ++i) { //updates npcs' movement
                let npc = maps[data.map_name].npcs[i];
                npc.update();
            }

            //organize layers on hero move
            let send_to_back_list = new Array(data.npc_group.children.length);
            data.npc_group.children.forEach((sprite, index) => {
                sprite.y_sort = parseInt(sprite.base_collider_layer.toString() + sprite.y.toString());
                if (sprite.send_to_back) {
                    send_to_back_list[index] = sprite;
                }
            });
            data.npc_group.sort('y_sort', Phaser.Group.SORT_ASCENDING);
            send_to_back_list.forEach(sprite => {
                if (sprite) {
                    data.npc_group.sendChildToBack(sprite);
                }
            });
        } else if (data.on_event) {
            if (data.climbing_event_data !== null) {
                climb.climb_event_animation_steps(data);
            }
            if (data.door_event_data !== null) {
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
    set_debug_info(game, data);
}
