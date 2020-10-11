import { GoldenSun } from "../GoldenSun";
import { MainChar } from "../MainChar";
import { reverse_directions, ordered_elements } from "../utils.js";

export class Debug {
    public game: Phaser.Game;
    public data: GoldenSun;
    public debug_physics: boolean;
    public grid: boolean;
    public debug_keys: boolean;
    public debug_stats: boolean;
    public show_fps: boolean;
    public debug_stats_info: {
        chars: MainChar[],
        selected: number,
        listener: EventListener
    };

    constructor(game, data) {
        this.game = game;
        this.data = data;
        this.debug_physics = false;
        this.grid = false;
        this.debug_keys = false;
        this.debug_stats = false;
        this.show_fps = false;
    }

    initialize_controls() {
        //activate debug mode
        this.game.input.keyboard.addKey(Phaser.Keyboard.D).onDown.add(() => {
            this.toggle_debug_physics();
        });
        
        //activate grid mode
        this.game.input.keyboard.addKey(Phaser.Keyboard.G).onDown.add(() => {
            this.toggle_grid();
        }, this);

        //activate keys debug mode
        this.game.input.keyboard.addKey(Phaser.Keyboard.K).onDown.add(() => {
            this.toggle_keys();
        }, this);

        //activate stats debug mode
        this.game.input.keyboard.addKey(Phaser.Keyboard.S).onDown.add(() => {
            this.toggle_stats();
        }, this);

        //enable fps show
        this.game.input.keyboard.addKey(Phaser.Keyboard.F).onDown.add(() => {
            this.toggle_fps();
        }, this);
    }

    update_debug_physics(flag) {
        this.data.map.collision_sprite.body.debug = flag;
        for (let i = 0; i < this.data.npc_group.children.length; ++i) {
            let sprite: Phaser.Sprite = this.data.npc_group.children[i] as Phaser.Sprite;
            if (!sprite.is_npc && !sprite.is_interactable_object) continue;
            if (!sprite.body) continue;
            sprite.body.debug = flag;
        }
    }

    toggle_debug_physics() {
        this.data.hero.sprite.body.debug = !this.data.hero.sprite.body.debug;
        this.update_debug_physics(this.data.hero.sprite.body.debug);
        for (let i = 0; i < this.data.collision.dynamic_jump_events_bodies.length; ++i) {
            this.data.collision.dynamic_jump_events_bodies[i].debug = !this.data.collision.dynamic_jump_events_bodies[i].debug;
        }
        for (let i = 0; i < this.data.map.interactable_objects.length; ++i) {
            const interactable_object = this.data.map.interactable_objects[i];
            if (interactable_object.custom_data.blocking_stair_block) {
                interactable_object.custom_data.blocking_stair_block.debug = !interactable_object.custom_data.blocking_stair_block.debug;
            }
        }
        this.debug_physics = !this.debug_physics;
    }

    toggle_keys() {
        this.debug_keys = !this.debug_keys;
        const toggler = (is_down, e) => {
            let class_list;
            switch (e.keyCode) {
                case 38:
                    if (e.repeat) return;
                    class_list = document.querySelector("#key_debug .up").classList;
                    break;
                case 40:
                    if (e.repeat) return;
                    class_list = document.querySelector("#key_debug .down").classList;
                    break;
                case 39:
                    if (e.repeat) return;
                    class_list = document.querySelector("#key_debug .right").classList;
                    break;
                case 37:
                    if (e.repeat) return;
                    class_list = document.querySelector("#key_debug .left").classList;
                    break;
            };
            if (class_list) {
                if (is_down) {
                    class_list.add('pressed');
                } else {
                    class_list.remove('pressed');
                }
            }
        }
        if (this.debug_keys) {
            document.getElementById("key_debug").style.display = "flex";
            document.onkeydown = toggler.bind(null, true);
            document.onkeyup = toggler.bind(null, false);
        } else {
            document.getElementById("key_debug").style.display = "none";
            document.onkeydown = undefined;
            document.onkeyup = undefined;
        }
    }

    fill_key_debug_table() {
        if (!this.debug_keys) return;
        document.querySelector("#key_debug table .direction").innerHTML = reverse_directions[this.data.hero.current_direction];
        document.querySelector("#key_debug table .action").innerHTML = this.data.hero.current_action;
        document.querySelector("#key_debug table .x").innerHTML = `${this.data.hero.tile_x_pos}/${this.data.hero.sprite.body.x.toFixed(3)}`;
        document.querySelector("#key_debug table .y").innerHTML = `${this.data.hero.tile_y_pos}/${this.data.hero.sprite.body.y.toFixed(3)}`;
        document.querySelector("#key_debug table .speed_x").innerHTML = this.data.hero.sprite.body.velocity.x.toFixed(3);
        document.querySelector("#key_debug table .speed_y").innerHTML = this.data.hero.sprite.body.velocity.y.toFixed(3);
        document.querySelector("#key_debug table .force_direction").innerHTML = this.data.hero.force_direction.toString();
        document.querySelector("#key_debug table .stop_by_colliding").innerHTML = this.data.hero.stop_by_colliding.toString();
    }

    toggle_fps() {
        this.show_fps = !this.show_fps;
    }

    toggle_grid() {
        this.grid = !this.grid;
    }

    set_debug_info() {
        this.game.debug.text('', 0, 0);

        if (this.show_fps) {
            this.game.debug.text('FPS: ' + this.game.time.fps || 'FPS: --', 5, 15, "#00ff00");
        }

        if (this.grid) {
            const tile_width = this.data.map.sprite.tileWidth;
            for (let x = 0; x < this.game.world.width; x += tile_width) {
                this.game.debug.geom(new Phaser.Line(x, 0, x, this.game.world.height), 'rgba(0,255,255,0.35)', false, 4);
            }
            const tile_height = this.data.map.sprite.tileHeight;
            for (let y = 0; y < this.game.world.height; y += tile_height) {
                this.game.debug.geom(new Phaser.Line(0, y, this.game.world.width, y), 'rgba(0,255,255,0.35)', false, 4);
            }
            let x_pos = this.data.hero.tile_x_pos*tile_width;
            let y_pos = this.data.hero.tile_y_pos*tile_height;
            this.game.debug.geom(new Phaser.Rectangle(x_pos, y_pos, tile_width, tile_height), 'rgba(255,0,0,0.5)');
            this.game.debug.geom(new Phaser.Circle(this.data.hero.sprite.x, this.data.hero.sprite.y, 5), 'rgba(20,75,0,1.0)');
            for (let point in this.data.map.events) {
                let pos = point.split('_').map(p => parseInt(p));
                this.game.debug.geom(new Phaser.Rectangle(pos[0]*tile_width, pos[1]*tile_height, tile_width, tile_height), 'rgba(255,255,60,0.7)');
            }

            if (this.game.input.mousePointer.withinGame) {
                const mouse_x = ((this.game.camera.x + this.game.input.mousePointer.x/this.data.scale_factor)/this.data.map.sprite.tileWidth) | 0;
                const mouse_y = ((this.game.camera.y + this.game.input.mousePointer.y/this.data.scale_factor)/this.data.map.sprite.tileHeight) | 0;
                this.game.debug.text(`x: ${mouse_x}, y: ${mouse_y}`, 140, 15, "#00ff00");
                const event_key = mouse_x + "_" + mouse_y;
                if (event_key in this.data.map.events) {
                    const events = this.data.map.events[event_key].map(event => {
                        return Object.assign({}, event, {
                            game: "[Phaser.Game]",
                            data: "[GoldenSun]",
                            activation_directions: event.activation_directions.map(dir => reverse_directions[dir]),
                            ...(event.origin_interactable_object && {
                                origin_interactable_object: `[${event.origin_interactable_object.key_name}]`
                            })
                        });
                    });
                    document.getElementById("object_inspector").innerText = JSON.stringify(events, null, 4);
                }
            } else {
                this.game.debug.text(`x: --, y: --`, 140, 15, "#00ff00");
            }
        } else {
            document.getElementById("object_inspector").innerText = "";
        }
    }

    toggle_stats() {
        if (!this.data.in_battle) {
            this.debug_stats = false;
        } else {
            this.debug_stats = !this.debug_stats;
        }
        const select_element = document.getElementById("stats_debug_select");
        if (this.debug_stats) {
            this.debug_stats_info = {
                chars: this.data.battle_instance.allies_info.concat(this.data.battle_instance.enemies_info).map(info => info.instance as MainChar),
                selected: 0,
                listener: event => {
                    this.debug_stats_info.selected = (event.target as any).value;
                }
            };
            this.debug_stats_info.chars.forEach((char, index) => {
                let option = document.createElement("option");
                option.innerText = char.name;
                option.setAttribute("value", index.toString());
                select_element.appendChild(option);
            });
            select_element.addEventListener('change', this.debug_stats_info.listener);
            document.getElementById("stats_debug").style.display = "block";
        } else {
            if (this.debug_stats_info) {
                select_element.removeEventListener('change', this.debug_stats_info.listener);
                this.debug_stats_info = undefined;
            }
            document.getElementById("stats_debug_select").innerHTML = "";
            document.getElementById("stats_debug").style.display = "none";
        }
    }

    fill_stats_debug_table() {
        if (!this.debug_stats || !this.data.in_battle) return;
        const char = this.debug_stats_info.chars[this.debug_stats_info.selected];
        document.querySelector("#stats_debug table .name").innerHTML = char.name;
        document.querySelector("#stats_debug table .class").innerHTML = char.class.name;
        document.querySelector("#stats_debug table .level").innerHTML = char.level.toString();
        document.querySelector("#stats_debug table .exp").innerHTML = char.current_exp.toString();
        document.querySelector("#stats_debug table .current_hp").innerHTML = char.current_hp.toString();
        document.querySelector("#stats_debug table .max_hp").innerHTML = char.max_hp.toString();
        document.querySelector("#stats_debug table .current_pp").innerHTML = char.current_pp.toString();
        document.querySelector("#stats_debug table .max_pp").innerHTML = char.max_pp.toString();
        document.querySelector("#stats_debug table .atk").innerHTML = char.current_atk.toString();
        document.querySelector("#stats_debug table .def").innerHTML = char.current_def.toString();
        document.querySelector("#stats_debug table .agi").innerHTML = char.current_agi.toString();
        document.querySelector("#stats_debug table .luk").innerHTML = char.current_luk.toString();
        document.querySelector("#stats_debug table .venus_power").innerHTML = char.venus_power_current.toString();
        document.querySelector("#stats_debug table .venus_resist").innerHTML = char.venus_resist_current.toString();
        document.querySelector("#stats_debug table .venus_level").innerHTML = char.venus_level_current.toString();
        document.querySelector("#stats_debug table .mercury_power").innerHTML = char.mercury_power_current.toString();
        document.querySelector("#stats_debug table .mercury_resist").innerHTML = char.mercury_resist_current.toString();
        document.querySelector("#stats_debug table .mercury_level").innerHTML = char.mercury_level_current.toString();
        document.querySelector("#stats_debug table .mars_power").innerHTML = char.mars_power_current.toString();
        document.querySelector("#stats_debug table .mars_resist").innerHTML = char.mars_resist_current.toString();
        document.querySelector("#stats_debug table .mars_level").innerHTML = char.mars_level_current.toString();
        document.querySelector("#stats_debug table .jupiter_power").innerHTML = char.jupiter_power_current.toString();
        document.querySelector("#stats_debug table .jupiter_resist").innerHTML = char.jupiter_resist_current.toString();
        document.querySelector("#stats_debug table .jupiter_level").innerHTML = char.jupiter_level_current.toString();
        document.querySelector("#stats_debug table .turns").innerHTML = char.turns.toString();
        document.querySelector("#stats_debug table .temp_statuses").innerHTML = [...char.temporary_status].join(" ");
        document.querySelector("#stats_debug table .perm_statuses").innerHTML = [...char.permanent_status].join(" ");
        let buff_html = "";
        Object.keys(char.effect_turns_count).sort().forEach(effect => {
            if (effect === "power" || effect === "resist") {
                ordered_elements.forEach(element => {
                    buff_html += `${effect}[${element}]/${char.effect_turns_count[effect][element]} <br>`;
                });
            } else {
                buff_html += `${effect}/${char.effect_turns_count[effect]} <br>`;
            }
        });
        document.querySelector("#stats_debug table .buff").innerHTML = buff_html;
        document.querySelector("#stats_debug table .effect_count").innerHTML = char.effects.length.toString();
    }
}