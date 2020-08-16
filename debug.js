import { reverse_directions, ordered_elements } from "./utils.js";

export function toggle_debug(data) {
    data.hero.body.debug = !data.hero.body.debug;
    data.map_collider.body.debug = !data.map_collider.body.debug;
    for (let i = 0; i < data.npc_group.children.length; ++i) {
        let sprite = data.npc_group.children[i];
        if (!sprite.is_npc && !sprite.is_interactable_object) continue;
        if (!sprite.body) continue;
        sprite.body.debug = !sprite.body.debug;
    }
    for (let i = 0; i < data.dynamic_jump_events_bodies.length; ++i) {
        data.dynamic_jump_events_bodies[i].debug = !data.dynamic_jump_events_bodies[i].debug;
    }
    for (let i = 0; i < maps[data.map_name].interactable_objects.length; ++i) {
        const interactable_object = maps[data.map_name].interactable_objects[i];
        if (interactable_object.custom_data.blocking_stair_block) {
            interactable_object.custom_data.blocking_stair_block.debug = !interactable_object.custom_data.blocking_stair_block.debug;
        }
    }
    data.debug = !data.debug;
}

export function toggle_keys(data) {
    data.debug_keys = !data.debug_keys;
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
    if (data.debug_keys) {
        document.getElementById("key_debug").style.display = "flex";
        document.onkeydown = toggler.bind(null, true);
        document.onkeyup = toggler.bind(null, false);
    } else {
        document.getElementById("key_debug").style.display = "none";
        document.onkeydown = undefined;
        document.onkeyup = undefined;
    }
}

export function fill_key_debug_table(data) {
    if (!data.debug_keys) return;
    document.querySelector("#key_debug table .direction").innerHTML = reverse_directions[data.current_direction];
    document.querySelector("#key_debug table .action").innerHTML = data.current_action;
    document.querySelector("#key_debug table .x").innerHTML = data.hero.body.x.toFixed(3);
    document.querySelector("#key_debug table .y").innerHTML = data.hero.body.y.toFixed(3);
    document.querySelector("#key_debug table .speed_x").innerHTML = data.hero.body.velocity.x.toFixed(3);
    document.querySelector("#key_debug table .speed_y").innerHTML = data.hero.body.velocity.y.toFixed(3);
    document.querySelector("#key_debug table .force_direction").innerHTML = data.force_direction;
    document.querySelector("#key_debug table .stop_by_colliding").innerHTML = data.stop_by_colliding;
}

export function set_debug_info(game, data) {
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
            const mouse_x = ((game.camera.x + game.input.mousePointer.x/data.scale_factor)/maps[data.map_name].sprite.tileWidth) | 0;
            const mouse_y = ((game.camera.y + game.input.mousePointer.y/data.scale_factor)/maps[data.map_name].sprite.tileHeight) | 0;
            game.debug.text(`x: ${mouse_x}, y: ${mouse_y}`, 140, 15, "#00ff00");
            const event_key = mouse_x + "_" + mouse_y;
            if (event_key in maps[data.map_name].events) {
                const events = maps[data.map_name].events[event_key].map(event => {
                    return Object.assign({}, event, {
                        activation_directions: event.activation_directions.map(dir => reverse_directions[dir]),
                        ...(event.origin_interactable_object && {
                            origin_interactable_object: `[${event.origin_interactable_object.key_name}]`
                        })
                    });
                });
                document.getElementById("object_inspector").innerText = JSON.stringify(events, null, 4);
            }
        } else {
            game.debug.text(`x: --, y: --`, 140, 15, "#00ff00");
        }
    } else {
        document.getElementById("object_inspector").innerText = "";
    }
}

export function toggle_stats(data) {
    if (!data.in_battle) {
        data.debug_stats = false;
    } else {
        data.debug_stats = !data.debug_stats;
    }
    const select_element = document.getElementById("stats_debug_select");
    if (data.debug_stats) {
        data.debug_stats_info = {
            chars: data.battle_instance.allies_info.concat(data.battle_instance.enemies_info).map(info => info.instance),
            selected: 0,
            listener: event => {
                data.debug_stats_info.selected = event.target.value;
            }
        };
        data.debug_stats_info.chars.forEach((char, index) => {
            let option = document.createElement("option");
            option.innerText = char.name;
            option.setAttribute("value", index);
            select_element.appendChild(option);
        });
        select_element.addEventListener('change', data.debug_stats_info.listener);
        document.getElementById("stats_debug").style.display = "block";
    } else {
        if (data.debug_stats_info) {
            select_element.removeEventListener('change', data.debug_stats_info.listener);
            data.debug_stats_info = undefined;
        }
        document.getElementById("stats_debug_select").innerHTML = "";
        document.getElementById("stats_debug").style.display = "none";
    }
}

export function fill_stats_debug_table(data) {
    if (!data.debug_stats || !data.in_battle) return;
    const char = data.debug_stats_info.chars[data.debug_stats_info.selected];
    document.querySelector("#stats_debug table .name").innerHTML = char.name;
    document.querySelector("#stats_debug table .class").innerHTML = char.class.name;
    document.querySelector("#stats_debug table .level").innerHTML = char.level;
    document.querySelector("#stats_debug table .exp").innerHTML = char.current_exp;
    document.querySelector("#stats_debug table .current_hp").innerHTML = char.current_hp;
    document.querySelector("#stats_debug table .max_hp").innerHTML = char.max_hp;
    document.querySelector("#stats_debug table .current_pp").innerHTML = char.current_pp;
    document.querySelector("#stats_debug table .max_pp").innerHTML = char.max_pp;
    document.querySelector("#stats_debug table .atk").innerHTML = char.current_atk;
    document.querySelector("#stats_debug table .def").innerHTML = char.current_def;
    document.querySelector("#stats_debug table .agi").innerHTML = char.current_agi;
    document.querySelector("#stats_debug table .luk").innerHTML = char.current_luk;
    document.querySelector("#stats_debug table .venus_power").innerHTML = char.venus_power_current;
    document.querySelector("#stats_debug table .venus_resist").innerHTML = char.venus_resist_current;
    document.querySelector("#stats_debug table .venus_level").innerHTML = char.venus_level_current;
    document.querySelector("#stats_debug table .mercury_power").innerHTML = char.mercury_power_current;
    document.querySelector("#stats_debug table .mercury_resist").innerHTML = char.mercury_resist_current;
    document.querySelector("#stats_debug table .mercury_level").innerHTML = char.mercury_level_current;
    document.querySelector("#stats_debug table .mars_power").innerHTML = char.mars_power_current;
    document.querySelector("#stats_debug table .mars_resist").innerHTML = char.mars_resist_current;
    document.querySelector("#stats_debug table .mars_level").innerHTML = char.mars_level_current;
    document.querySelector("#stats_debug table .jupiter_power").innerHTML = char.jupiter_power_current;
    document.querySelector("#stats_debug table .jupiter_resist").innerHTML = char.jupiter_resist_current;
    document.querySelector("#stats_debug table .jupiter_level").innerHTML = char.jupiter_level_current;
    document.querySelector("#stats_debug table .turns").innerHTML = char.turns;
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
    document.querySelector("#stats_debug table .effect_count").innerHTML = char.effects.length;
}