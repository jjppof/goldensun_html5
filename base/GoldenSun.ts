import * as numbers from "./magic_numbers";
import {TileEvent} from "./tile_events/TileEvent";
import {Debug} from "./debug/Debug";
import {load_all} from "./initializers/assets_loader";
import {Collision} from "./Collision";
import {directions} from "./utils";
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
import {Gamepad} from "./Gamepad";
import {Audio} from "./Audio";
import {Storage} from "./Storage";

export class GoldenSun {
    public game: Phaser.Game = null;
    public dbs: any = {};
    public info: GameInfo = {} as GameInfo;
    public particle_manager: Phaser.ParticleStorm = null;

    //main game states
    public menu_open: boolean = false;
    public shop_open: boolean = false;
    public inn_open: boolean = false;
    public in_battle: boolean = false;
    public created: boolean = false;
    public force_stop_movement: boolean = false;

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

    //managers
    public control_manager: ControlManager = null;
    public cursor_manager: CursorManager = null;
    public gamepad: Gamepad = null;

    //variables that control the canvas
    public fullscreen: boolean = false;
    public scale_factor: number = 1;

    //groups that will hold the sprites that are below the hero, same level than hero and above the hero
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
                loadRender: this.loadRender.bind(this),
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
        this.game.debug.text("Loading...", 5, 15, "#00ff00");
    }

    loadRender() {
        this.render_loading();
    }

    async create() {
        //load some json files from assets folder
        load_databases(this.game, this.dbs);

        //init audio engine
        this.audio = new Audio(this.game);
        this.game.sound.mute = true;

        //init storage
        this.storage = new Storage(this);
        this.storage.init();

        //initialize managers
        this.gamepad = new Gamepad(this);
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
            this.info.main_char_list[hero_key_name].walk_speed,
            this.info.main_char_list[hero_key_name].dash_speed,
            this.info.main_char_list[hero_key_name].climb_speed
        );
        const hero_sprite_base = this.info.main_char_list[hero_key_name].sprite_base;
        this.hero.set_sprite(
            this.npc_group,
            hero_sprite_base,
            this.map.collision_layer,
            this.map,
            undefined,
            undefined,
            this.map.is_world_map
        );
        this.hero.set_shadow("shadow", this.npc_group, this.map.collision_layer);
        this.hero.create_half_crop_mask(this.map.is_world_map);
        this.hero.camera_follow();
        this.hero.play();

        //initializes collision system
        this.collision = new Collision(this.game, this.hero);
        this.hero.config_body(
            this.collision,
            this.map.is_world_map ? numbers.HERO_BODY_RADIUS_M7 : numbers.HERO_BODY_RADIUS
        );
        this.collision.config_collision_groups(this.map);
        this.map.config_all_bodies(this.collision, this.map.collision_layer);
        this.collision.config_collisions(this.map, this.map.collision_layer, this.npc_group);
        this.game.physics.p2.updateBoundsCollisionGroup();

        this.initialize_utils_controls();

        this.created = true;
        this.game.camera.resetFX();
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

        //initialize screens
        this.shop_menu = new ShopMenu(this.game, this);
        this.inn_menu = new InnMenu(this.game, this);
        this.main_menu = initialize_menu(this.game, this);

        //enable zoom and psynergies shortcuts for testing
        let controls = [
            {
                key: this.gamepad.ZOOM1,
                on_down: () => {
                    if (this.fullscreen) return;
                    this.scale_factor = 1;
                    this.game.scale.setupScale(numbers.GAME_WIDTH, numbers.GAME_HEIGHT);
                    window.dispatchEvent(new Event("resize"));
                },
            },
            {
                key: this.gamepad.ZOOM2,
                on_down: () => {
                    if (this.fullscreen) return;
                    this.scale_factor = 2;
                    this.game.scale.setupScale(
                        this.scale_factor * numbers.GAME_WIDTH,
                        this.scale_factor * numbers.GAME_HEIGHT
                    );
                    window.dispatchEvent(new Event("resize"));
                },
            },
            {
                key: this.gamepad.ZOOM3,
                on_down: () => {
                    if (this.fullscreen) return;
                    this.scale_factor = 3;
                    this.game.scale.setupScale(
                        this.scale_factor * numbers.GAME_WIDTH,
                        this.scale_factor * numbers.GAME_HEIGHT
                    );
                    window.dispatchEvent(new Event("resize"));
                },
            },
            {
                key: this.gamepad.MUTE,
                on_down: () => {
                    this.game.sound.context.resume();
                    this.game.sound.mute = !this.game.sound.mute;
                },
            },
            {
                key: this.gamepad.PSY1,
                on_down: () => {
                    if (!this.hero_movement_allowed(false)) return;
                    this.info.field_abilities_list.move.cast(this.hero, this.dbs.init_db.initial_shortcuts.move);
                },
            },
            {
                key: this.gamepad.PSY2,
                on_down: () => {
                    if (!this.hero_movement_allowed(false)) return;
                    this.info.field_abilities_list.frost.cast(this.hero, this.dbs.init_db.initial_shortcuts.frost);
                },
            },
            {
                key: this.gamepad.PSY3,
                on_down: () => {
                    if (!this.hero_movement_allowed(false)) return;
                    this.info.field_abilities_list.growth.cast(this.hero, this.dbs.init_db.initial_shortcuts.growth);
                },
            },
        ];
        this.control_manager.set_control(controls, {persist: true});
    }

    hero_movement_allowed(allow_climbing = true) {
        return !(
            this.hero.in_action(allow_climbing) ||
            this.menu_open ||
            this.shop_open ||
            this.inn_open ||
            this.in_battle ||
            this.tile_event_manager.on_event ||
            this.game_event_manager.on_event ||
            this.force_stop_movement
        );
    }

    update() {
        if (!this.created) {
            this.render_loading();
            return;
        }
        if (this.hero_movement_allowed()) {
            this.hero.update_tile_position();

            this.tile_event_manager.fire_triggered_events(); //trigger any event that's waiting to be triggered
            const location_key = TileEvent.get_location_key(this.hero.tile_x_pos, this.hero.tile_y_pos);
            if (location_key in this.map.events) {
                //check if the actual tile has an event
                this.tile_event_manager.check_tile_events(location_key, this.map);
            }

            this.hero.update(this.map); //update hero position/velocity/sprite
            this.map.update(); //update map and its objects position/velocity/sprite
        } else {
            if (this.game_event_manager.on_event) {
                this.game_event_manager.update();
                if (this.force_stop_movement) {
                    this.hero.stop_char(false);
                }
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
