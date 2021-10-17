import * as numbers from "./magic_numbers";
import {LocationKey} from "./tile_events/TileEvent";
import {Debug} from "./debug/Debug";
import {load_all} from "./initializers/assets_loader";
import {Collision} from "./Collision";
import {Hero} from "./Hero";
import {TileEventManager} from "./tile_events/TileEventManager";
import {GameEventManager} from "./game_events/GameEventManager";
import {load_databases} from "./initializers/databases_loader";
import {GameInfo, initialize_game_data} from "./initializers/initialize_info";
import {Map} from "./Map";
import {Battle} from "./battle/Battle";
import {MainMenu, initialize_menu} from "./main_menus/MainMenu";
import {ShopMenu} from "./main_menus/ShopMenu";
import {InnMenu} from "./main_menus/InnMenu";
import {ControlManager} from "./utils/ControlManager";
import {CursorManager} from "./utils/CursorManager";
import {Gamepad as XGamepad, Button} from "./XGamepad";
import {Audio} from "./Audio";
import {Storage} from "./Storage";
import {Camera} from "./Camera";

/**
 * The project has basically two important folders: assets and base. All the source code is located inside base folder.
 * All the game assets (images, database files, sounds, etc) are located inside assets folder. An engine user will only
 * modify the assets folder for instance. Any modification in assets folder files will automatically be reflected in the game.
 *
 * This class is the starting point to understand how the code works. It's the engine's main class. When the game starts,
 * it will load database files in assets/dbs folder in order to instantiate the main classes of the game like Hero,
 * Map, MainMenu, Audio, ControlManager etc.
 */
export class GoldenSun {
    public game: Phaser.Game = null;
    public dbs: any = {};
    public info: GameInfo = {} as GameInfo;
    public particle_manager: Phaser.ParticleStorm = null;
    public loading_progress: string = "";
    public loading_what: string = "";

    public electron_app: boolean;
    private ipcRenderer: any;

    //main game states
    public menu_open: boolean = false;
    public shop_open: boolean = false;
    public inn_open: boolean = false;
    public in_battle: boolean = false;
    public assets_loaded: boolean = false;

    //game objects
    /** Class responsible for the control of the main hero */
    public hero: Hero = null;

    /** Class responsible for the collision system */
    public collision: Collision = null;

    /** Class responsible for the debug systems */
    public debug: Debug = null;

    /** Class responbible for the main menu */
    public main_menu: MainMenu = null;

    /** Class responsible for the shop system */
    public shop_menu: ShopMenu = null;

    /** Class responsible for the inn system */
    public inn_menu: InnMenu = null;

    /** The current active map */
    public map: Map = null;

    /** Class responsible for the tile events */
    public tile_event_manager: TileEventManager = null;

    /** Class responsible for the game events */
    public game_event_manager: GameEventManager = null;

    /** Class responsible for a battle */
    public battle_instance: Battle = null;

    /** Class responsible for controlling the game audio engine */
    public audio: Audio = null;

    /** Class responsible for storing the game custom states */
    public storage: Storage = null;

    /** Class responsible for some specific camera features for this engine */
    public camera: Camera = null;

    //managers
    public control_manager: ControlManager = null;
    public cursor_manager: CursorManager = null;
    public gamepad: XGamepad;

    //variables that control the canvas
    public fullscreen: boolean = false;
    public scale_factor: number = 1;

    //groups that will hold the sprites that are below the hero, same level than hero and above the hero
    public underlayer_group: Phaser.Group = null;
    public npc_group: Phaser.Group = null;
    public overlayer_group: Phaser.Group = null;
    public super_group: Phaser.Group = null;

    constructor() {
        this.init_electron();
        const config: Phaser.IGameConfig = {
            width: numbers.GAME_WIDTH,
            height: numbers.GAME_HEIGHT,
            renderer: Phaser.WEBGL,
            parent: "game",
            transparent: false,
            antialias: false,
            state: {
                preload: this.preload.bind(this),
                create: this.create.bind(this),
                update: this.update.bind(this),
                render: this.render.bind(this),
                loadRender: this.load_render.bind(this),
            },
        };
        this.game = new Phaser.Game(config);
    }

    /**
     * If it's running under electron's engine, initializes it.
     */
    private init_electron() {
        this.electron_app = (window as any).is_electron_env ?? false;
        if (this.electron_app) {
            this.ipcRenderer = (window as any).ipcRenderer;
        }
    }

    /**
     * Loads initial database files and other assets.
     */
    private preload() {
        this.set_whats_loading("initial database");

        load_all(this.game);

        this.game.time.advancedTiming = true;
        this.game.stage.smoothed = false;
        this.game.camera.roundPx = true;
        this.game.renderer.renderSession.roundPixels = true;
        this.game.stage.disableVisibilityChange = true;
        this.game.sound.mute = true;

        this.game.camera.fade(0x0, 1);
    }

    /**
     * On loading phase, sets the loading message to be displayed.
     * @param loading_what the message.
     */
    set_whats_loading(loading_what: string) {
        this.loading_what = loading_what;
    }

    /**
     * Renders loading info.
     */
    private render_loading() {
        if (this.game.time.frames % 4 === 0) {
            this.loading_progress = this.game.load.progress.toLocaleString("en-US", {
                minimumIntegerDigits: 2,
                useGrouping: false,
            });
        }
        this.game.debug.text(`${this.loading_progress}% loading ${this.loading_what}...`, 5, 15, "#00ff00");
    }

    private load_render() {
        this.render_loading();
    }

    /**
     * Initializes the game main classes like Hero, Map, Audio, ControlManager, Storage etc.
     */
    private async create() {
        //load some json files from assets folder
        load_databases(this.game, this.dbs);

        //init audio engine
        this.audio = new Audio(this.game, this);

        //init camera custom features
        this.camera = new Camera(this.game);

        //init storage
        this.storage = new Storage(this);
        this.storage.init();

        //initialize managers
        this.gamepad = new XGamepad(this);
        this.cursor_manager = new CursorManager(this.game);
        this.control_manager = new ControlManager(this.game, this.gamepad, this.audio);

        this.scale_factor = this.dbs.init_db.initial_scale_factor;

        //advanced particle system
        this.particle_manager = this.game.plugins.add(Phaser.ParticleStorm);

        //init debug systems
        if (!this.electron_app) {
            this.debug = new Debug(this.game, this);
            this.debug.initialize_controls();
        }

        //creating groups. Order here is important
        this.underlayer_group = this.game.add.group();
        this.npc_group = this.game.add.group();
        this.overlayer_group = this.game.add.group();
        this.super_group = this.game.add.group();
        this.super_group.addChild(this.underlayer_group);
        this.super_group.addChild(this.npc_group);
        this.super_group.addChild(this.overlayer_group);

        //use the data loaded from json files to initialize some data
        await initialize_game_data(this.game, this);

        //initializes the event managers
        this.tile_event_manager = new TileEventManager(this.game, this);
        this.game_event_manager = new GameEventManager(this.game, this);

        //configs map layers: creates sprites, interactable objects and npcs, lists events and sets the map layers
        this.map = await this.info.maps_list[this.dbs.init_db.map_key_name].mount_map(this.dbs.init_db.collision_layer);

        //initializes the controllable hero
        const hero_key_name = this.dbs.init_db.hero_key_name;
        this.hero = new Hero(
            this.game,
            this,
            hero_key_name,
            this.dbs.init_db.x_tile_position,
            this.dbs.init_db.y_tile_position,
            this.dbs.init_db.initial_action,
            this.dbs.init_db.initial_direction,
            this.dbs.npc_db[hero_key_name].walk_speed,
            this.dbs.npc_db[hero_key_name].dash_speed,
            this.dbs.npc_db[hero_key_name].climb_speed,
            false
        );
        const hero_sprite_base = this.info.main_char_list[hero_key_name].sprite_base;
        this.hero.set_sprite(this.npc_group, hero_sprite_base, this.map.collision_layer, this.map);
        this.hero.set_shadow("shadow", this.npc_group, this.map.collision_layer, {is_world_map: this.map.is_world_map});
        if (this.map.is_world_map) {
            this.hero.create_half_crop_mask();
        }
        this.camera.follow(this.hero);
        this.hero.play();

        //initializes collision system
        this.collision = new Collision(this.game, this);
        this.hero.config_body(this.map.is_world_map ? numbers.HERO_BODY_RADIUS_M7 : numbers.HERO_BODY_RADIUS);
        this.collision.config_collision_groups(this.map);
        this.map.config_all_bodies(this.map.collision_layer);
        this.collision.config_collisions(this.map.collision_layer);
        this.game.physics.p2.updateBoundsCollisionGroup();

        //initialize screens
        this.shop_menu = new ShopMenu(this.game, this);
        this.inn_menu = new InnMenu(this.game, this);
        this.main_menu = initialize_menu(this.game, this);

        this.game.stage.disableVisibilityChange = false;
        this.assets_loaded = true;
        this.game.camera.resetFX();

        this.audio.initialize_controls();
        this.initialize_utils_controls();
    }

    /**
     * Initializes some utils controls like canvas scale control, fullscreen etc.
     */
    private initialize_utils_controls() {
        //set initial zoom
        this.game.scale.setupScale(this.scale_factor * numbers.GAME_WIDTH, this.scale_factor * numbers.GAME_HEIGHT);
        window.dispatchEvent(new Event("resize"));

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
            window.dispatchEvent(new Event("resize"));
            if (this.ipcRenderer) {
                this.ipcRenderer.send("resize-window", numbers.GAME_WIDTH, numbers.GAME_HEIGHT);
            }
        });

        //enable zoom and psynergies shortcuts for testing
        const setup_scale = (scaleFactor: number) => {
            if (this.fullscreen) return;
            this.scale_factor = scaleFactor;
            const width = this.scale_factor * numbers.GAME_WIDTH;
            const height = this.scale_factor * numbers.GAME_HEIGHT;
            this.game.scale.setupScale(width, height);
            window.dispatchEvent(new Event("resize"));
            if (this.ipcRenderer) {
                this.ipcRenderer.send("resize-window", width, height);
            }
        };

        const quick_ability = (index: number) => {
            if (!this.hero_movement_allowed(false)) return;
            // TODO Replace with ingame configuration
            const shortcut = this.dbs.init_db.initial_shortcuts[index];
            this.info.field_abilities_list[shortcut.ability].cast(this.hero, shortcut.adept);
        };

        const controls = [
            {
                button: Button.ZOOM1,
                on_down: () => setup_scale(1),
            },
            {
                button: Button.ZOOM2,
                on_down: () => setup_scale(2),
            },
            {
                button: Button.ZOOM3,
                on_down: () => setup_scale(3),
            },
            {
                button: Button.PSY1,
                on_down: () => quick_ability(0),
            },
            {
                button: Button.PSY2,
                on_down: () => quick_ability(1),
            },
            {
                button: Button.PSY3,
                on_down: () => quick_ability(2),
            },
            {
                button: Button.PSY4,
                on_down: () => quick_ability(3),
            },
        ];
        this.control_manager.add_controls(controls, {persist: true});
    }

    /**
     * Checks whether the hero is allowed to move.
     * @param allow_climbing if true, climbing won't be considered.
     * @returns if true, the hero is allowed to move.
     */
    hero_movement_allowed(allow_climbing = true) {
        return !(
            this.hero.in_action(allow_climbing) ||
            this.menu_open ||
            this.shop_open ||
            this.inn_open ||
            this.in_battle ||
            this.tile_event_manager.on_event ||
            this.game_event_manager.on_event
        );
    }

    /**
     * The engine main update function.
     */
    private update() {
        if (!this.assets_loaded) {
            this.render_loading();
            return;
        }
        if (this.hero_movement_allowed()) {
            this.hero.update_tile_position();

            //triggers any event that's waiting to be triggered
            this.tile_event_manager.fire_triggered_events();

            const location_key = LocationKey.get_key(this.hero.tile_x_pos, this.hero.tile_y_pos);
            if (location_key in this.map.events) {
                //checks if the current tile has tile events
                this.tile_event_manager.check_tile_events(location_key);
            }

            this.hero.update(); //updates hero position/velocity/sprite
            this.map.update(); //updates map and its objects (NPC, Interact. Objs etc) position/velocity/sprite
        } else {
            if (this.game_event_manager.on_event) {
                //updates whatever it is related to a game event
                this.game_event_manager.update();
            } else {
                this.hero.stop_char(false);
            }
            if (this.menu_open && this.main_menu.is_active) {
                this.main_menu.update_position();
            } else if (this.shop_open && this.shop_menu.horizontal_menu.menu_active) {
                this.shop_menu.update_position();
            } else if (this.in_battle) {
                this.battle_instance.update();
            }
        }

        if (!this.in_battle) {
            //updates whatever it is related to a field ability
            for (let ability_key in this.info.field_abilities_list) {
                this.info.field_abilities_list[ability_key].update();
            }
        }

        this.camera.update();

        //fps adjustment for faster monitors since requestAnimationFrame follows monitor frame rate
        if (
            this.game.time.fps > numbers.TARGET_FPS &&
            Math.abs(this.game.time.suggestedFps - this.game.time.desiredFps) > 10
        ) {
            this.game.time.desiredFps = this.game.time.suggestedFps;
        }
    }

    /**
     * Renders some debug info.
     */
    private render() {
        if (!this.electron_app) {
            this.debug.set_debug_info();
            if (this.game.time.frames % 8 === 0) {
                this.debug.fill_key_debug_table();
            }
            if (this.game.time.frames % 30 === 0) {
                this.debug.fill_stats_debug_table();
            }
        }
    }
}

var golden_sun = new GoldenSun();

//debugging porpouses
(window as any).data = golden_sun;
