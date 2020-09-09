import * as numbers from './magic_numbers.js';
import { initialize_main_chars, main_char_list, initialize_classes, party_data } from './initializers/main_chars.js';
import { initialize_abilities, abilities_list, initialize_field_abilities, field_abilities_list } from './initializers/abilities.js';
import { initialize_items, items_list } from './initializers/items.js';
import { initialize_djinni, djinni_list } from './initializers/djinni.js';
import { initialize_enemies, enemies_list } from './initializers/enemies.js';
import { initialize_maps, load_maps, maps } from './initializers/maps.js';
import { set_npc_event, trigger_npc_dialog } from './events/npc.js';
import { do_step } from './events/step.js';
import { do_collision_change } from './events/collision.js';
import * as climb from './events/climb.js';
import * as physics from './physics/collision_bodies.js';
import * as movement from './physics/movement.js';
import { initialize_menu } from './screens/menu.js';
import { TileEvent } from './base/TileEvent.js';
import { Debug } from './debug.js';
import { event_triggering } from './events/triggering.js';
import { load_all } from './initializers/assets_loader.js';
import { config_hero } from './initializers/hero.js';

//this variable contains important data used throughout the game
var data = {
    //movement
    arrow_inputs: null,

    //events and game states
    event_timers: {},
    on_event: false,
    teleporting: false,
    waiting_to_step: false,
    step_event_data: {},
    waiting_to_change_collision: false,
    collision_event_data: {},
    push_timer: null,
    menu_open: false,
    climbing_event_data: null,
    in_battle: false,
    battle_stage: null,
    created: false,
    in_dialog: false,
    frame_counter: 0,

    //screen
    fullscreen: false,
    scale_factor: 1,

    //collision
    npcCollisionGroups: {},
    interactableObjectCollisionGroups: {},
    walking_on_pillars_tiles: new Set(),
    dynamic_jump_events_bodies: [],

    //npc
    npc_event: false,
    active_npc: null,
    waiting_for_enter_press: false,
    dialog_manager: null
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
    numbers.GAME_WIDTH,
    numbers.GAME_HEIGHT,
    Phaser.WEBGL, //renderer
    "game",
    { preload: preload, create: create, update: update, render: render, loadRender: loadRender }, //states
    false, //transparent
    false //antialias
);
window.game = game;
data.game = game;

function preload() {
    load_all(game);

    data.enter_input = game.input.keyboard.addKey(Phaser.Keyboard.ENTER).onDown;
    data.esc_input = game.input.keyboard.addKey(Phaser.Keyboard.ESC).onDown;
    data.shift_input = game.input.keyboard.addKey(Phaser.Keyboard.SHIFT).onDown;
    data.spacebar_input = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR).onDown;

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
    data.enemies_parties_db = game.cache.getJSON('enemies_parties_db');
    data.maps_db = game.cache.getJSON('maps_db');
    data.main_chars_db = game.cache.getJSON('main_chars_db');
    data.summons_db = game.cache.getJSON('summons_db');
    data.hero_color_filters = game.add.filter('ColorFilters');
    data.map_color_filters = game.add.filter('ColorFilters');
    data.pasynergy_item_color_filters = game.add.filter('ColorFilters');

    data.hero_name = data.init_db.hero_key_name;
    data.map_name = data.init_db.map_key_name;
    data.scale_factor = data.init_db.initial_scale_factor;
    data.map_collider_layer = data.init_db.map_z_index;
    party_data.coins = data.init_db.coins;

    //format some structures
    data.interactable_objects_db = _.mapKeys(data.interactable_objects_db, interactable_object_data => interactable_object_data.key_name);
    data.enemies_parties_db = _.mapKeys(data.enemies_parties_db, enemy_party_data => enemy_party_data.key_name);
    data.npc_db = _.mapKeys(data.npc_db, npc_data => npc_data.key_name);
    data.summons_db = _.mapKeys(data.summons_db, (summon_data, index) => {
        summon_data.index = parseInt(index);
        return summon_data.key_name;
    });

    //init debug instance
    data.debug = new Debug(game, data);

    //intialize game objects
    let load_maps_promise_resolve;
    const load_maps_promise = new Promise(resolve => {
        load_maps_promise_resolve = resolve;
    });
    initialize_maps(data.maps_db);
    load_maps(game, load_maps_promise_resolve);
    await load_maps_promise;

    initialize_classes(data.classes_db);

    let load_enemies_sprites_promise_resolve;
    const load_enemies_sprites_promise = new Promise(resolve => {
        load_enemies_sprites_promise_resolve = resolve;
    });
    initialize_enemies(game, data.enemies_db, load_enemies_sprites_promise_resolve);
    await load_enemies_sprites_promise;

    let load_djinni_sprites_promise_resolve;
    const load_djinni_sprites_promise = new Promise(resolve => {
        load_djinni_sprites_promise_resolve = resolve;
    });
    initialize_djinni(game, data.djinni_db, load_djinni_sprites_promise_resolve);
    await load_djinni_sprites_promise;
    
    let load_abilities_promise_resolve;
    const load_abilities_promise = new Promise(resolve => {
        load_abilities_promise_resolve = resolve;
    });
    initialize_abilities(game, data.abilities_db, load_abilities_promise_resolve);
    await load_abilities_promise;
    
    let load_items_promise_resolve;
    const load_items_promise = new Promise(resolve => {
        load_items_promise_resolve = resolve;
    });
    initialize_items(game, data.items_db, load_items_promise_resolve);
    await load_items_promise;

    let load_chars_promise_resolve;
    const load_chars_promise = new Promise(resolve => {
        load_chars_promise_resolve = resolve;
    });
    initialize_main_chars(game, data.main_chars_db, load_chars_promise_resolve);
    await load_chars_promise;

    //creating groups. Order here is important
    data.underlayer_group = game.add.group();
    data.npc_group = game.add.group();
    data.overlayer_group = game.add.group();

    //initialize screens
    data.menu_screen = initialize_menu(game, data);

    //configuring map layers: creating sprites, listing events and setting the layers
    await maps[data.map_name].mount_map(game, data);
    config_hero(game, data);
    physics.config_world_physics(game);
    physics.config_physics_for_hero(data);
    physics.config_physics_for_npcs(data);
    physics.config_physics_for_interactable_objects(data);
    data.dynamicEventsCollisionGroup = game.physics.p2.createCollisionGroup();
    physics.config_physics_for_map(data);
    physics.config_collisions(data);
    game.physics.p2.updateBoundsCollisionGroup();

    data.debug.initialize_controls();

    //set initial zoom
    game.scale.setupScale(data.scale_factor * numbers.GAME_WIDTH, data.scale_factor * numbers.GAME_HEIGHT);
    window.dispatchEvent(new Event('resize'));

    //enable full screen
    game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
    game.input.onTap.add((pointer, isDoubleClick) => {
        if (isDoubleClick) {
            game.scale.startFullScreen(true);
        }
    });
    game.scale.onFullScreenChange.add(() => {
        data.fullscreen = !data.fullscreen;
        data.scale_factor = 1;
        game.scale.setupScale(numbers.GAME_WIDTH, numbers.GAME_HEIGHT);
        window.dispatchEvent(new Event('resize'));
    });

    //enable zoom
    game.input.keyboard.addKey(Phaser.Keyboard.ONE).onDown.add(() => {
        if (data.fullscreen) return;
        data.scale_factor = 1;
        game.scale.setupScale(numbers.GAME_WIDTH, numbers.GAME_HEIGHT);
        window.dispatchEvent(new Event('resize'));
    });
    game.input.keyboard.addKey(Phaser.Keyboard.TWO).onDown.add(() => {
        if (data.fullscreen) return;
        data.scale_factor = 2;
        game.scale.setupScale(data.scale_factor * numbers.GAME_WIDTH, data.scale_factor * numbers.GAME_HEIGHT);
        window.dispatchEvent(new Event('resize'));
    });
    game.input.keyboard.addKey(Phaser.Keyboard.THREE).onDown.add(() => {
        if (data.fullscreen) return;
        data.scale_factor = 3;
        game.scale.setupScale(data.scale_factor * numbers.GAME_WIDTH, data.scale_factor * numbers.GAME_HEIGHT);
        window.dispatchEvent(new Event('resize'));
    });

    //enable psynergies shortcuts for testing
    game.input.keyboard.addKey(Phaser.Keyboard.Q).onDown.add(() => {
        if (data.hero.climbing || data.menu_open || data.hero.pushing || data.teleporting || data.hero.jumping || data.in_battle) return;
        field_abilities_list.move.cast(data.init_db.initial_shortcuts.move);
    });
    game.input.keyboard.addKey(Phaser.Keyboard.W).onDown.add(() => {
        if (data.hero.climbing || data.menu_open || data.hero.pushing || data.teleporting || data.hero.jumping || data.in_battle) return;
        field_abilities_list.frost.cast(data.init_db.initial_shortcuts.frost);
    });
    game.input.keyboard.addKey(Phaser.Keyboard.E).onDown.add(() => {
        if (data.hero.climbing || data.menu_open || data.hero.pushing || data.teleporting || data.hero.jumping || data.in_battle) return;
        field_abilities_list.growth.cast(data.init_db.initial_shortcuts.growth);
    });

    //enable event trigger key
    data.enter_input.add(() => {
        if (data.hero.casting_psynergy || data.hero.climbing || data.hero.pushing || data.teleporting || data.hero.jumping || data.in_battle || !data.created) return;
        trigger_npc_dialog(game, data);
    });

    //set keyboard cursors
    data.cursors = game.input.keyboard.createCursorKeys();

    data.created = true;
    game.camera.resetFX();
}

function update() {
    if (!data.created) {
        render_loading();
        return;
    }
    if (!data.on_event && !data.npc_event && !data.hero.pushing && !data.menu_open && !data.hero.casting_psynergy && !data.in_battle) {
        data.hero.update_tile_position(maps[data.map_name].sprite);

        if (data.waiting_to_step) { //step event
            do_step(data);
        }
        if (data.waiting_to_change_collision) { //change collision pattern layer event
            do_collision_change(data);
        }

        //check if the actual tile has an event
        const event_location_key = TileEvent.get_location_key(data.hero.tile_x_pos, data.hero.tile_y_pos);
        if (event_location_key in maps[data.map_name].events) {
            event_triggering(game, data, event_location_key);
        } else if (data.hero.extra_speed !== 0) { //disabling speed event
            data.hero.extra_speed = 0;
        }

        movement.update_arrow_inputs(data);
        movement.set_speed_factors(data, true); //sets the direction of the movement
        movement.set_current_action(data); //chooses which sprite the hero shall assume
        movement.calculate_hero_speed(game, data); //calculates the final speed
        movement.collision_dealer(game, data); //check if the hero is colliding and its consequences
        data.hero.change_sprite(true); //sets the hero sprite
        data.hero.update_shadow(); //updates the hero's shadow position

        data.map_collider.body.velocity.y = data.map_collider.body.velocity.x = 0; //fixes map body

        for (let i = 0; i < maps[data.map_name].npcs.length; ++i) { //updates npcs' movement
            let npc = maps[data.map_name].npcs[i];
            npc.update();
        }

        maps[data.map_name].sort_sprites(data);
    } else if (data.on_event) {
        if (data.hero.climbing_event_data !== null) {
            climb.climb_event_animation_steps(data);
        }
        data.hero.stop_char(false);
    } else if (data.npc_event) {
        set_npc_event(data);
        data.hero.stop_char(false);
    } else if (data.hero.pushing) {
        data.hero.change_sprite();
    } else if (data.menu_open && data.menu_screen.horizontal_menu.menu_active) {
        data.hero.stop_char(false);
        data.menu_screen.update_position();
    } else if (data.in_battle) {
        data.battle_instance.update();
    }

    data.frame_counter = (data.frame_counter + 1) % numbers.TARGET_FPS;
}

function render() {
    data.debug.set_debug_info();
    if (data.frame_counter%8 === 0) {
        data.debug.fill_key_debug_table();
    }
    if (data.frame_counter%(numbers.TARGET_FPS >> 1) === 0) {
        data.debug.fill_stats_debug_table();
    }
}
