import * as numbers from "./magic_numbers";
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
import {Gamepad as XGamepad, Button, AdvanceButton} from "./XGamepad";
import {Audio} from "./Audio";
import {Storage} from "./Storage";
import {Camera} from "./Camera";
import {HealerMenu} from "./main_menus/HealerMenu";
import {Snapshot} from "./Snapshot";
import {base_actions} from "./utils";
import {StartMenu} from "./main_menus/StartMenu";
import {initialize_save_menu, SaveMenu} from "./main_menus/SaveMenu";
import {ParticlesWrapper} from "./ParticlesWrapper";

export enum EngineFilters {
    COLORIZE = "colorize",
    OUTLINE = "outline",
    LEVELS = "levels",
    COLOR_BLEND = "color_blend",
    HUE = "hue",
    TINT = "tint",
    GRAY = "gray",
    MODE7 = "mode7",
}

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
    public fps_reduction_active: boolean = false;

    public electron_app: boolean;
    private ipcRenderer: any;

    //main game states
    public menu_open: boolean = false;
    public save_open: boolean = false;
    public shop_open: boolean = false;
    public healer_open: boolean = false;
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

    /** Class responbible for the start menu */
    public start_menu: StartMenu = null;

    /** Class responbible for the main menu */
    public main_menu: MainMenu = null;

    /** Class responbible for saving a snapshot of the game. */
    public save_menu: SaveMenu = null;

    /** Class responsible for the shop system */
    public shop_menu: ShopMenu = null;

    /** Class responsible for the healer menu */
    public healer_menu: HealerMenu = null;

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

    /** Class responsible for generating and restoring save files. */
    public snapshot_manager: Snapshot = null;

    /** A wrapper for Particles Storm. */
    public particle_wrapper: ParticlesWrapper = null;

    //managers
    public control_manager: ControlManager = null;
    public cursor_manager: CursorManager = null;
    public gamepad: XGamepad;

    //variables that control the canvas
    /** Whether the game is in fullscreen state. */
    public fullscreen: boolean = false;
    /** The zoom scaling factor if the game canvas. */
    public scale_factor: number = 1;

    //Phaser groups that will hold the sprites that are below the hero, same level than hero and above the hero
    /** Phaser.Group that holds sprites that are below Hero. */
    public underlayer_group: Phaser.Group = null;
    /** Phaser.Group that holds sprites that are in the same level as Hero. */
    public middlelayer_group: Phaser.Group = null;
    /** Phaser.Group that holds sprites that are over Hero. */
    public overlayer_group: Phaser.Group = null;
    /** Phaser.Group that holds underlayer, middlelayer and overlayer groups. */
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
        if (!this.loading_what) {
            return;
        }
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
        await this.audio.init_se();

        //init camera custom features
        this.camera = new Camera(this.game);

        //initialize managers
        this.gamepad = new XGamepad(this);
        this.cursor_manager = new CursorManager(this.game);
        this.control_manager = new ControlManager(this.game, this.gamepad, this.audio);

        //advanced particle system
        this.particle_manager = this.game.plugins.add(Phaser.ParticleStorm);
        this.particle_wrapper = new ParticlesWrapper(this.game, this);

        //init debug systems
        this.debug = new Debug(this.game, this);
        this.debug.initialize_controls();

        this.audio.initialize_controls();
        this.initialize_utils_controls();

        this.scale_factor = this.dbs.init_db.initial_scale_factor;
        this.game.scale.setupScale(this.scale_factor * numbers.GAME_WIDTH, this.scale_factor * numbers.GAME_HEIGHT);
        window.dispatchEvent(new Event("resize"));

        this.game.stage.disableVisibilityChange = false;

        this.game.camera.resetFX();
        this.loading_what = "";

        //initializes start menu
        this.start_menu = new StartMenu(this.game, this);
        this.start_menu.open(snapshot => {
            this.audio.stop_bgm();

            //initializes the snapshot manager
            this.snapshot_manager = new Snapshot(this.game, this, snapshot);

            //initializes the game
            this.initialize_game();
        });
    }

    /**
     * Initializes the game. It can be a new one or a restored one from snapshot.
     */
    private async initialize_game() {
        this.game.camera.fade(0x0, 1);

        this.game.sound.mute = this.snapshot_manager.snapshot?.mute ?? this.game.sound.mute;

        //init storage
        this.storage = new Storage(this);
        this.storage.init();

        //creating groups. Order here is important
        this.underlayer_group = this.game.add.group();
        this.middlelayer_group = this.game.add.group();
        this.overlayer_group = this.game.add.group();
        this.super_group = this.game.add.group();
        this.super_group.addChild(this.underlayer_group);
        this.super_group.addChild(this.middlelayer_group);
        this.super_group.addChild(this.overlayer_group);

        //use the data loaded from json files to initialize some data
        await initialize_game_data(this.game, this);

        //initializes the event managers
        this.tile_event_manager = new TileEventManager(this.game, this);
        this.game_event_manager = new GameEventManager(this.game, this);

        //configs map layers: creates sprites, interactable objects and npcs, lists events and sets the map layers
        const map =
            this.info.maps_list[this.snapshot_manager.snapshot?.map_data.key_name ?? this.dbs.init_db.map_key_name];
        const initial_collision_layer =
            this.snapshot_manager.snapshot?.map_data.collision_layer ?? this.dbs.init_db.collision_layer;
        this.map = await map.mount_map(
            initial_collision_layer,
            this.snapshot_manager.snapshot?.map_data.encounter_cumulator
        );
        const hero_initial_x =
            this.snapshot_manager.snapshot?.map_data.pc.position.x ?? this.dbs.init_db.x_tile_position;
        const hero_initial_y =
            this.snapshot_manager.snapshot?.map_data.pc.position.y ?? this.dbs.init_db.y_tile_position;
        this.map.set_map_bounds(hero_initial_x, hero_initial_y);

        //initializes the controllable hero
        const hero_key_name = this.dbs.init_db.hero_key_name;
        this.hero = new Hero(
            this.game,
            this,
            hero_key_name,
            hero_initial_x,
            hero_initial_y,
            this.snapshot_manager.snapshot ? base_actions.IDLE : this.dbs.init_db.initial_action,
            this.snapshot_manager.snapshot?.map_data.pc.direction ?? this.dbs.init_db.initial_direction,
            this.dbs.npc_db[hero_key_name].walk_speed,
            this.dbs.npc_db[hero_key_name].dash_speed,
            this.dbs.npc_db[hero_key_name].climb_speed
        );
        this.hero.initialize();

        //initializes collision system
        this.collision = new Collision(this.game, this);
        this.hero.config_body(this.map.is_world_map ? numbers.HERO_BODY_RADIUS_M7 : numbers.HERO_BODY_RADIUS);
        this.collision.config_collision_groups(this.map);
        this.map.config_all_bodies(this.map.collision_layer);
        this.collision.config_collisions(this.map.collision_layer);
        this.game.physics.p2.updateBoundsCollisionGroup();

        //initializes main menus
        this.shop_menu = new ShopMenu(this.game, this);
        this.healer_menu = new HealerMenu(this.game, this);
        this.inn_menu = new InnMenu(this.game, this);
        this.save_menu = initialize_save_menu(this.game, this);
        this.main_menu = initialize_menu(this.game, this);

        //set initial zoom
        this.scale_factor = this.snapshot_manager.snapshot?.scale_factor ?? this.scale_factor;
        this.game.scale.setupScale(this.scale_factor * numbers.GAME_WIDTH, this.scale_factor * numbers.GAME_HEIGHT);
        window.dispatchEvent(new Event("resize"));

        this.fullscreen = this.snapshot_manager.snapshot?.full_screen ?? false;
        if (this.fullscreen) {
            this.set_fullscreen_mode(false);
        }

        this.assets_loaded = true;

        this.game.camera.resetFX();

        this.initialize_psynergy_controls();

        this.map.fire_game_events();

        this.snapshot_manager.clear_snapshot();
    }

    /**
     * Deals with fullscreen mode. It will be called on fullscreen mode change.
     * @param change_flag whether the fullscreen flag should be toggled.
     */
    private set_fullscreen_mode(change_flag: boolean = true) {
        if (change_flag) {
            this.fullscreen = !this.fullscreen;
        }
        this.scale_factor = 1;
        this.game.scale.setupScale(numbers.GAME_WIDTH, numbers.GAME_HEIGHT);
        window.dispatchEvent(new Event("resize"));
        if (this.ipcRenderer) {
            this.ipcRenderer.send("resize-window", numbers.GAME_WIDTH, numbers.GAME_HEIGHT);
        }
    }

    /**
     * Initializes some utils controls like canvas scale control, fullscreen etc.
     */
    private initialize_utils_controls() {
        //enable full screen
        this.game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.game.input.onTap.add((pointer, is_double_click) => {
            if (is_double_click) {
                this.game.scale.startFullScreen(true);
            }
        });
        this.game.scale.onFullScreenChange.add(this.set_fullscreen_mode.bind(this));

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

        const controls = [
            {
                buttons: Button.ZOOM1,
                on_down: () => setup_scale(1),
            },
            {
                buttons: Button.ZOOM2,
                on_down: () => setup_scale(2),
            },
            {
                buttons: Button.ZOOM3,
                on_down: () => setup_scale(3),
            },
            {
                buttons: Button.ZOOM4,
                on_down: () => setup_scale(4),
            },
        ];
        this.control_manager.add_controls(controls, {persist: true});
    }

    /**
     * Initializes controls related to psynergy casting. Psynergy shortcuts.
     */
    private initialize_psynergy_controls() {
        const quick_ability = (index: number) => {
            if (!this.hero_movement_allowed(false)) return;
            const shortcut = this.dbs.init_db.initial_shortcuts[index];
            this.info.field_abilities_list[shortcut.ability].cast(this.hero, shortcut.adept);
        };

        const fire_psynergy_shortcut = (button: AdvanceButton.L | AdvanceButton.R) => {
            if (!this.hero_movement_allowed(false)) return;
            const ability_info = this.info.party_data.psynergies_shortcuts[button];
            if (ability_info) {
                const char_key = ability_info.main_char;
                const ability_key = ability_info.ability;
                this.info.field_abilities_list[ability_key].cast(this.hero, char_key);
            }
        };

        const controls = [
            {
                buttons: Button.L,
                on_down: () => fire_psynergy_shortcut(Button.L),
            },
            {
                buttons: Button.R,
                on_down: () => fire_psynergy_shortcut(Button.R),
            },
            {
                buttons: Button.PSY1,
                on_down: () => quick_ability(0),
            },
            {
                buttons: Button.PSY2,
                on_down: () => quick_ability(1),
            },
            {
                buttons: Button.PSY3,
                on_down: () => quick_ability(2),
            },
            {
                buttons: Button.PSY4,
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
            this.save_open ||
            this.shop_open ||
            this.healer_open ||
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

            //checks if the current tile has tile events
            this.tile_event_manager.check_tile_events();

            this.hero.update(); //updates hero position/velocity/sprite
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
            } else if (this.healer_open && this.healer_menu.horizontal_menu.menu_active) {
                this.healer_menu.update_position();
            } else if (this.in_battle) {
                this.battle_instance.update();
            }
        }

        this.map.update(); //updates map and its objects (NPC, Interact. Objs etc) position/velocity/sprite

        if (!this.in_battle) {
            //updates whatever it is related to a field ability
            for (let ability_key in this.info.field_abilities_list) {
                this.info.field_abilities_list[ability_key].update();
            }
        }

        this.camera.update();

        //checks whether it's necessary to keep fps at 60
        if (!this.fps_reduction_active && this.game.time.suggestedFps > numbers.TARGET_FPS_DOUBLE) {
            this.force_target_fps();
        }
    }

    private force_target_fps() {
        if (this.fps_reduction_active) {
            return;
        }
        this.fps_reduction_active = true;
        const originalRequestAnimationFrame = window.requestAnimationFrame;
        const fps_interval = 1000 / numbers.TARGET_FPS;
        let then = window.performance.now();
        let raf_callback;

        const raf_controller = () => {
            const now = window.performance.now();
            const elapsed = now - then;
            if (elapsed > fps_interval) {
                then = now - (elapsed % fps_interval);
                originalRequestAnimationFrame(raf_callback);
            } else {
                originalRequestAnimationFrame(raf_controller);
            }
        };

        window.requestAnimationFrame = callback => {
            raf_callback = callback;
            raf_controller();
            return null;
        };
    }

    /**
     * Renders some debug info.
     */
    private render() {
        if (this.assets_loaded) {
            this.debug.set_debug_info();
            if (!this.electron_app) {
                if (this.game.time.frames % 8 === 0) {
                    this.debug.fill_key_debug_table();
                }
                if (this.game.time.frames % 30 === 0) {
                    this.debug.fill_stats_debug_table();
                }
            }
        }
    }
}

var golden_sun = new GoldenSun();

//debugging porpouses
(window as any).data = golden_sun;
