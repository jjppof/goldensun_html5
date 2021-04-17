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

export class GoldenSun {
    public game: Phaser.Game = null;
    public dbs: any = {};
    public info: GameInfo = {} as GameInfo;
    public particle_manager: Phaser.ParticleStorm = null;
    public loading_progress: string = "";
    public loading_what: string = "";

    //main game states
    public menu_open: boolean = false;
    public shop_open: boolean = false;
    public inn_open: boolean = false;
    public in_battle: boolean = false;
    public assets_loaded: boolean = false;

    //game objects
    public hero: Hero = null; //class responsible for the control of the main hero
    public collision: Collision = null; //class responsible for the collision system
    public debug: Debug = null; //class responsible for the debug systems
    public main_menu: MainMenu = null; //class responbible for the main menu
    public shop_menu: ShopMenu = null; //class responsible for the shop system
    public inn_menu: InnMenu = null; //class responsible for the inn system
    public map: Map = null; //the current active map
    public tile_event_manager: TileEventManager = null; //class responsible for the tile events
    public game_event_manager: GameEventManager = null; //class responsible for the game events
    public battle_instance: Battle = null; //class responsible for a battle
    public audio: Audio = null; //class responsible for controlling the game audio engine
    public storage: Storage = null; //class responsible for storing the game custom states
    public camera: Camera = null; //class responsible for some specific camera features for this engine

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
                loadRender: this.loadRender.bind(this),
            },
            false, //transparent
            false //antialias
        );
    }

    preload() {
        this.loading_what = "initial database";
        load_all(this.game);

        this.game.time.advancedTiming = true;
        this.game.stage.smoothed = false;
        this.game.camera.roundPx = true;
        this.game.renderer.renderSession.roundPixels = true;
        this.game.stage.disableVisibilityChange = true;
        this.game.sound.mute = true;

        this.game.camera.fade(0x0, 1);
    }

    render_loading() {
        if (this.game.time.frames % 4 === 0) {
            this.loading_progress = this.game.load.progress.toLocaleString("en-US", {
                minimumIntegerDigits: 2,
                useGrouping: false,
            });
        }
        this.game.debug.text(`${this.loading_progress}% loading ${this.loading_what}...`, 5, 15, "#00ff00");
    }

    loadRender() {
        this.render_loading();
    }

    async create() {
        //load some json files from assets folder
        load_databases(this.game, this.dbs);

        //init audio engine
        this.audio = new Audio(this.game);

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
        this.debug = new Debug(this.game, this);
        this.debug.initialize_controls();

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
        this.map = await this.info.maps_list[this.dbs.init_db.map_key_name].mount_map(this.dbs.init_db.map_z_index);

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
            this.dbs.npc_db[hero_key_name].climb_speed
        );
        const hero_sprite_base = this.info.main_char_list[hero_key_name].sprite_base;
        this.hero.set_sprite(
            this.npc_group,
            hero_sprite_base,
            this.map.collision_layer,
            this.map,
            this.map.is_world_map
        );
        this.hero.set_shadow("shadow", this.npc_group, this.map.collision_layer, {is_world_map: this.map.is_world_map});
        this.hero.create_half_crop_mask(this.map.is_world_map);
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

        this.initialize_utils_controls();
    }

    initialize_utils_controls() {
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
        });

        // Enable zoom and psynergies shortcuts for testing
        const setup_scale = (scaleFactor: number) => {
            if (this.fullscreen) return;
            this.scale_factor = scaleFactor;
            this.game.scale.setupScale(this.scale_factor * numbers.GAME_WIDTH, this.scale_factor * numbers.GAME_HEIGHT);
            window.dispatchEvent(new Event("resize"));
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
                button: Button.MUTE,
                on_down: () => {
                    this.game.sound.context.resume();
                    this.game.sound.mute = !this.game.sound.mute;
                },
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
            {
                button: Button.VOL_UP,
                on_down: () => this.audio.alter_volume(+Audio.VOLUME_STEP),
                params: {loop_time: Audio.VOLUME_ALTER_LOOP_TIME},
            },
            {
                button: Button.VOL_DOWN,
                on_down: () => this.audio.alter_volume(-Audio.VOLUME_STEP),
                params: {loop_time: Audio.VOLUME_ALTER_LOOP_TIME},
            },
        ];
        this.control_manager.add_controls(controls, {persist: true});
    }

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

    update() {
        if (!this.assets_loaded) {
            this.render_loading();
            return;
        }
        if (this.hero_movement_allowed()) {
            this.hero.update_tile_position();

            this.tile_event_manager.fire_triggered_events(); //trigger any event that's waiting to be triggered
            const location_key = LocationKey.get_key(this.hero.tile_x_pos, this.hero.tile_y_pos);
            if (location_key in this.map.events) {
                //check if the actual tile has an event
                this.tile_event_manager.check_tile_events(location_key, this.map);
            }

            this.hero.update(this.map); //update hero position/velocity/sprite
            this.map.update(); //update map and its objects position/velocity/sprite
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
        if (this.game.time.fps > 60 && Math.abs(this.game.time.suggestedFps - this.game.time.desiredFps) > 10) {
            this.game.time.desiredFps = this.game.time.suggestedFps;
        }
    }

    render() {
        this.debug.set_debug_info();
        if (this.game.time.frames % 8 === 0) {
            this.debug.fill_key_debug_table();
        }
        if (this.game.time.frames % 30 === 0) {
            this.debug.fill_stats_debug_table();
        }
    }
}

var golden_sun = new GoldenSun();

//debugging porpouses
(window as any).data = golden_sun;
