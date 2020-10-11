import * as numbers from './magic_numbers.js';
import { TileEvent } from './tile_events/TileEvent';
import { Debug } from './debug/Debug';
import { load_all } from './initializers/assets_loader';
import { Collision } from './Collision';
import { directions } from './utils.js';
import { Hero } from './Hero';
import { TileEventManager } from './tile_events/TileEventManager';
import { GameEventManager } from './game_events/GameEventManager';
import { load_databases } from './initializers/databases_loader';
import { initialize_game_data } from './initializers/initialize_info';
import { Map } from './Map';
import { Battle } from './battle/Battle';
import { MainMenu } from './main_menus/MainMenu';
import { ShopMenu } from './main_menus/ShopMenu.js';

export class GoldenSun {
    public game: Phaser.Game = null;
    public dbs: any = {};
    public info: any = {};

    //game states
    public menu_open: boolean = false;
    public shop_open: boolean = false;
    public in_battle: boolean = false;
    public created: boolean = false;
    public force_stop_movement: boolean = false;

    //game objects
    public hero: Hero = null;
    public collision: Collision = null;
    public cursors: Phaser.CursorKeys = null;
    public debug: Debug = null;
    public main_menu: MainMenu = null;
    public shop_menu: ShopMenu = null;
    public map: Map = null;
    public tile_event_manager: TileEventManager = null;
    public game_event_manager: GameEventManager = null;
    public battle_instance: Battle = null;

    //common inputs
    public enter_input: Phaser.Signal = null;
    public esc_input: Phaser.Signal = null;
    public shift_input: Phaser.Signal = null;
    public spacebar_input: Phaser.Signal = null;

    //screen
    public fullscreen: boolean = false;
    public scale_factor: number = 1;

    //groups
    public underlayer_group: Phaser.Group = null;
    public npc_group: Phaser.Group = null;
    public overlayer_group: Phaser.Group = null;

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
    }

    preload() {
        load_all(this.game);

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

    async create() {
        load_databases(this.game, this.dbs);

        this.enter_input = this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER).onDown;
        this.esc_input = this.game.input.keyboard.addKey(Phaser.Keyboard.ESC).onDown;
        this.shift_input = this.game.input.keyboard.addKey(Phaser.Keyboard.SHIFT).onDown;
        this.spacebar_input = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR).onDown;

        this.scale_factor = this.dbs.init_db.initial_scale_factor;

        //init debug instance
        this.debug = new Debug(this.game, this);
        //init debug controls
        this.debug.initialize_controls();

        //creating groups. Order here is important
        this.underlayer_group = this.game.add.group();
        this.npc_group = this.game.add.group();
        this.overlayer_group = this.game.add.group();

        await initialize_game_data(this.game, this);

        //configuring map layers: creating sprites, listing events and setting the layers
        this.map = await this.info.maps_list[this.dbs.init_db.map_key_name].mount_map(this.dbs.init_db.map_z_index);

        //initializes the controllable hero
        this.hero = new Hero(
            this.game,
            this,
            this.dbs.init_db.hero_key_name,
            this.dbs.init_db.x_tile_position,
            this.dbs.init_db.y_tile_position,
            this.dbs.init_db.initial_action,
            directions[this.dbs.init_db.initial_direction]
        );
        this.hero.set_sprite(this.npc_group, this.info.main_char_list[this.hero.key_name].sprite_base, this.map.sprite, this.map.collision_layer);
        this.hero.set_shadow('shadow', this.npc_group, this.map.collision_layer);
        this.hero.camera_follow();
        this.hero.play();

        //initializes collision system
        this.collision = new Collision(this.game, this.hero);
        this.hero.config_body(this.collision);
        this.collision.config_collision_groups(this.map);
        this.map.config_all_bodies(this.collision, this.map.collision_layer);
        this.collision.config_collisions(this.map, this.map.collision_layer, this.npc_group);
        this.game.physics.p2.updateBoundsCollisionGroup();

        this.initialize_game_main_controls();

        this.tile_event_manager = new TileEventManager(this.game, this, this.hero, this.collision);
        this.game_event_manager = new GameEventManager(this.game, this);

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
        this.game.input.onTap.add((pointer, is_double_click) => {
            if (is_double_click) {
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
            if (this.hero.in_action() || this.menu_open || this.in_battle || this.shop_open) return;
            this.info.field_abilities_list.move.cast(this.hero, this.dbs.init_db.initial_shortcuts.move);
        });
        this.game.input.keyboard.addKey(Phaser.Keyboard.W).onDown.add(() => {
            if (this.hero.in_action() || this.menu_open || this.in_battle || this.shop_open) return;
            this.info.field_abilities_list.frost.cast(this.hero, this.dbs.init_db.initial_shortcuts.frost);
        });
        this.game.input.keyboard.addKey(Phaser.Keyboard.E).onDown.add(() => {
            if (this.hero.in_action() || this.menu_open || this.in_battle || this.shop_open) return;
            this.info.field_abilities_list.growth.cast(this.hero, this.dbs.init_db.initial_shortcuts.growth);
        });
    }

    hero_movement_allowed() {
        return !(this.hero.in_action(true) || this.menu_open || this.shop_open || this.in_battle || this.tile_event_manager.on_event || this.force_stop_movement);
    }

    update() {
        if (!this.created) {
            this.render_loading();
            return;
        }
        if (this.hero_movement_allowed()) {
            this.hero.update_tile_position(this.map.sprite);

            this.tile_event_manager.fire_triggered_events();
            const location_key = TileEvent.get_location_key(this.hero.tile_x_pos, this.hero.tile_y_pos);
            if (location_key in this.map.events) { //check if the actual tile has an event
                this.tile_event_manager.check_tile_events(location_key, this.map);
            }

            this.hero.update(this.map); //update hero position/velocity/sprite
            this.map.update(); //update map and its objects position/velocity/sprite
        } else {
            this.hero.stop_char(false);
            if (this.menu_open && this.main_menu.horizontal_menu.menu_active) {
                this.main_menu.update_position();
            } else if (this.shop_open && this.shop_menu.horizontal_menu.menu_active) {
                this.shop_menu.update_position();
            } else if (this.in_battle) {
                this.battle_instance.update();
            }
        }
    }

    render() {
        this.debug.set_debug_info();
        if (this.game.time.frames%8 === 0) {
            this.debug.fill_key_debug_table();
        }
        if (this.game.time.frames%30 === 0) {
            this.debug.fill_stats_debug_table();
        }
    }
}

var golden_sun = new GoldenSun();

//debugging porpouses
(window as any).data = golden_sun;
