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
import * as physics from './physics/collision_bodies.js';
import { initialize_menu } from './screens/menu.js';
import { TileEvent } from './base/TileEvent.js';
import { Debug } from './debug.js';
import { event_triggering } from './events/triggering.js';
import { load_all } from './initializers/assets_loader.js';
import { config_hero } from './initializers/hero.js';

//debugging porpouses
window.maps = maps;
window.main_char_list = main_char_list;
window.abilities_list = abilities_list;
window.items_list = items_list;
window.field_abilities_list = field_abilities_list;
window.djinni_list = djinni_list;
window.enemies_list = enemies_list;
window.party_data = party_data;

class GoldenSun {
    constructor() {
        this.game = new Phaser.Game(
            numbers.GAME_WIDTH,
            numbers.GAME_HEIGHT,
            Phaser.WEBGL,
            "game", //dom element id
            {
                preload: this.preload.bind(this),
                create: this.create.bind(this),
                update: this.update.bind(this),
                render: this.render.bind(this),
                loadRender: this.loadRender.bind(this)
            },
            false, //transparent
            false //antialias
        );

        //events and game states
        this.event_timers = {};
        this.on_event = false;
        this.teleporting = false;
        this.waiting_to_step = false;
        this.step_event_data = {};
        this.waiting_to_change_collision = false;
        this.collision_event_data = {};
        this.menu_open = false;
        this.in_battle = false;
        this.battle_stage = null;
        this.created = false;
        this.in_dialog = false;
        this.frame_counter = 0;

        //screen
        this.fullscreen = false;
        this.scale_factor = 1;

        //collision
        this.npcCollisionGroups = {};
        this.interactableObjectCollisionGroups = {};
        this.walking_on_pillars_tiles = new Set();
        this.dynamic_jump_events_bodies = [];

        //npc
        this.npc_event = false;
        this.active_npc = null;
        this.waiting_for_enter_press = false;
        this.dialog_manager = null;
    }

    preload() {
        load_all(this.game);

        this.enter_input = this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER).onDown;
        this.esc_input = this.game.input.keyboard.addKey(Phaser.Keyboard.ESC).onDown;
        this.shift_input = this.game.input.keyboard.addKey(Phaser.Keyboard.SHIFT).onDown;
        this.spacebar_input = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR).onDown;

        initialize_field_abilities(this.game, this);

        this.game.time.advancedTiming = true;
        this.game.stage.smoothed = false;
        this.game.camera.roundPx = true;
        this.game.renderer.renderSession.roundPixels = true;

        this.game.camera.fade(0x0, 1);
    }

    render_loading() {
        this.game.debug.text('Loading...', 5, 15, "#00ff00");
    }

    loadRender() {
        this.render_loading();
    }

    async initialize_game_data() {
        let load_maps_promise_resolve;
        const load_maps_promise = new Promise(resolve => {
            load_maps_promise_resolve = resolve;
        });
        initialize_maps(this.maps_db);
        load_maps(this.game, load_maps_promise_resolve);
        await load_maps_promise;

        initialize_classes(this.classes_db);

        let load_enemies_sprites_promise_resolve;
        const load_enemies_sprites_promise = new Promise(resolve => {
            load_enemies_sprites_promise_resolve = resolve;
        });
        initialize_enemies(this.game, this.enemies_db, load_enemies_sprites_promise_resolve);
        await load_enemies_sprites_promise;

        let load_djinni_sprites_promise_resolve;
        const load_djinni_sprites_promise = new Promise(resolve => {
            load_djinni_sprites_promise_resolve = resolve;
        });
        initialize_djinni(this.game, this.djinni_db, load_djinni_sprites_promise_resolve);
        await load_djinni_sprites_promise;
        
        let load_abilities_promise_resolve;
        const load_abilities_promise = new Promise(resolve => {
            load_abilities_promise_resolve = resolve;
        });
        initialize_abilities(this.game, this.abilities_db, load_abilities_promise_resolve);
        await load_abilities_promise;
        
        let load_items_promise_resolve;
        const load_items_promise = new Promise(resolve => {
            load_items_promise_resolve = resolve;
        });
        initialize_items(this.game, this.items_db, load_items_promise_resolve);
        await load_items_promise;

        let load_chars_promise_resolve;
        const load_chars_promise = new Promise(resolve => {
            load_chars_promise_resolve = resolve;
        });
        initialize_main_chars(this.game, this.main_chars_db, load_chars_promise_resolve);
        await load_chars_promise;

        //creating groups. Order here is important
        this.underlayer_group = this.game.add.group();
        this.npc_group = this.game.add.group();
        this.overlayer_group = this.game.add.group();

        //initialize screens
        this.menu_screen = initialize_menu(this.game, this);

        //configuring map layers: creating sprites, listing events and setting the layers
        await maps[this.map_name].mount_map(this.game, this);
    }

    async create() {
        // initializing some vars
        this.init_db = this.game.cache.getJSON('init_db'); 
        this.npc_db = this.game.cache.getJSON('npc_db');
        this.interactable_objects_db = this.game.cache.getJSON('interactable_objects_db');
        this.classes_db = this.game.cache.getJSON('classes_db');
        this.abilities_db = this.game.cache.getJSON('abilities_db');
        this.items_db = this.game.cache.getJSON('items_db');
        this.djinni_db = this.game.cache.getJSON('djinni_db');
        this.enemies_db = this.game.cache.getJSON('enemies_db');
        this.enemies_parties_db = this.game.cache.getJSON('enemies_parties_db');
        this.maps_db = this.game.cache.getJSON('maps_db');
        this.main_chars_db = this.game.cache.getJSON('main_chars_db');
        this.summons_db = this.game.cache.getJSON('summons_db');
        this.hero_color_filters = this.game.add.filter('ColorFilters');
        this.map_color_filters = this.game.add.filter('ColorFilters');
        this.pasynergy_item_color_filters = this.game.add.filter('ColorFilters');

        this.hero_name = this.init_db.hero_key_name;
        this.map_name = this.init_db.map_key_name;
        this.scale_factor = this.init_db.initial_scale_factor;
        this.map_collider_layer = this.init_db.map_z_index;
        party_data.coins = this.init_db.coins;

        //format some db structures
        this.interactable_objects_db = _.mapKeys(this.interactable_objects_db, interactable_object_data => interactable_object_data.key_name);
        this.enemies_parties_db = _.mapKeys(this.enemies_parties_db, enemy_party_data => enemy_party_data.key_name);
        this.npc_db = _.mapKeys(this.npc_db, npc_data => npc_data.key_name);
        this.summons_db = _.mapKeys(this.summons_db, (summon_data, index) => {
            summon_data.index = parseInt(index);
            return summon_data.key_name;
        });

        //init debug instance
        this.debug = new Debug(this.game, this);
        //init debug controls
        this.debug.initialize_controls();

        await this.initialize_game_data();

        config_hero(this.game, this);
        physics.config_world_physics(this.game);
        physics.config_physics_for_hero(this.game, this);
        physics.config_physics_for_npcs(this.game, this);
        physics.config_physics_for_interactable_objects(this.game, this);
        this.dynamicEventsCollisionGroup = this.game.physics.p2.createCollisionGroup();
        physics.config_physics_for_map(this.game, this);
        physics.config_collisions(this);
        this.game.physics.p2.updateBoundsCollisionGroup();

        this.initialize_game_main_controls();

        //set keyboard cursors
        this.cursors = this.game.input.keyboard.createCursorKeys();

        this.created = true;
        this.game.camera.resetFX();
    }

    initialize_game_main_controls() {
        //set initial zoom
        this.game.scale.setupScale(this.scale_factor * numbers.GAME_WIDTH, this.scale_factor * numbers.GAME_HEIGHT);
        window.dispatchEvent(new Event('resize'));

        //enable full screen
        this.game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.game.input.onTap.add((pointer, isDoubleClick) => {
            if (isDoubleClick) {
                this.game.scale.startFullScreen(true);
            }
        });
        this.game.scale.onFullScreenChange.add(() => {
            this.fullscreen = !this.fullscreen;
            this.scale_factor = 1;
            this.game.scale.setupScale(numbers.GAME_WIDTH, numbers.GAME_HEIGHT);
            window.dispatchEvent(new Event('resize'));
        });

        //enable zoom
        this.game.input.keyboard.addKey(Phaser.Keyboard.ONE).onDown.add(() => {
            if (this.fullscreen) return;
            this.scale_factor = 1;
            this.game.scale.setupScale(numbers.GAME_WIDTH, numbers.GAME_HEIGHT);
            window.dispatchEvent(new Event('resize'));
        });
        this.game.input.keyboard.addKey(Phaser.Keyboard.TWO).onDown.add(() => {
            if (this.fullscreen) return;
            this.scale_factor = 2;
            this.game.scale.setupScale(this.scale_factor * numbers.GAME_WIDTH, this.scale_factor * numbers.GAME_HEIGHT);
            window.dispatchEvent(new Event('resize'));
        });
        this.game.input.keyboard.addKey(Phaser.Keyboard.THREE).onDown.add(() => {
            if (this.fullscreen) return;
            this.scale_factor = 3;
            this.game.scale.setupScale(this.scale_factor * numbers.GAME_WIDTH, this.scale_factor * numbers.GAME_HEIGHT);
            window.dispatchEvent(new Event('resize'));
        });

        //enable psynergies shortcuts for testing
        this.game.input.keyboard.addKey(Phaser.Keyboard.Q).onDown.add(() => {
            if (this.hero.climbing || this.menu_open || this.hero.pushing || this.teleporting || this.hero.jumping || this.in_battle) return;
            field_abilities_list.move.cast(this.init_db.initial_shortcuts.move);
        });
        this.game.input.keyboard.addKey(Phaser.Keyboard.W).onDown.add(() => {
            if (this.hero.climbing || this.menu_open || this.hero.pushing || this.teleporting || this.hero.jumping || this.in_battle) return;
            field_abilities_list.frost.cast(this.init_db.initial_shortcuts.frost);
        });
        this.game.input.keyboard.addKey(Phaser.Keyboard.E).onDown.add(() => {
            if (this.hero.climbing || this.menu_open || this.hero.pushing || this.teleporting || this.hero.jumping || this.in_battle) return;
            field_abilities_list.growth.cast(this.init_db.initial_shortcuts.growth);
        });

        //enable event trigger key
        this.enter_input.add(() => {
            if (this.hero.casting_psynergy || this.hero.climbing || this.hero.pushing || this.teleporting || this.hero.jumping || this.in_battle || !this.created) return;
            trigger_npc_dialog(this.game, this);
        });
    }

    update() {
        if (!this.created) {
            this.render_loading();
            return;
        }
        if (!this.on_event && !this.npc_event && !this.hero.pushing && !this.menu_open && !this.hero.casting_psynergy && !this.in_battle) {
            this.hero.update_tile_position(maps[this.map_name].sprite);

            if (this.waiting_to_step) { //step event
                do_step(this);
            }
            if (this.waiting_to_change_collision) { //change collision pattern layer event
                do_collision_change(this.game, this);
            }

            //check if the actual tile has an event
            const event_location_key = TileEvent.get_location_key(this.hero.tile_x_pos, this.hero.tile_y_pos);
            if (event_location_key in maps[this.map_name].events) {
                event_triggering(this.game, this, event_location_key);
            } else if (this.hero.extra_speed !== 0) { //disabling speed event
                this.hero.extra_speed = 0;
            }

            this.hero.update(maps[this.map_name]); //update hero position/velocity/sprite

            this.map_collider.body.velocity.y = this.map_collider.body.velocity.x = 0; //fixes map body

            for (let i = 0; i < maps[this.map_name].npcs.length; ++i) { //updates npcs' movement
                const npc = maps[this.map_name].npcs[i];
                npc.update();
            }

            maps[this.map_name].sort_sprites(this);
        } else if (this.on_event) {
            this.hero.stop_char(false);
        } else if (this.npc_event) {
            set_npc_event(this.game, this);
            this.hero.stop_char(false);
        } else if (this.hero.pushing) {
            this.hero.change_sprite();
        } else if (this.menu_open && this.menu_screen.horizontal_menu.menu_active) {
            this.hero.stop_char(false);
            this.menu_screen.update_position();
        } else if (this.in_battle) {
            this.battle_instance.update();
        }

        this.frame_counter = (this.frame_counter + 1) % numbers.TARGET_FPS;
    }

    render() {
        this.debug.set_debug_info();
        if (this.frame_counter%8 === 0) {
            this.debug.fill_key_debug_table();
        }
        if (this.frame_counter%(numbers.TARGET_FPS >> 1) === 0) {
            this.debug.fill_stats_debug_table();
        }
    }
}

var golden_sun = new GoldenSun();

//debugging porpouses
window.game = golden_sun.game;
window.data = golden_sun;
