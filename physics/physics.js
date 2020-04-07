import { maps } from '../maps/maps.js';
import * as numbers from '../magic_numbers.js';
import { get_transition_directions } from '../utils.js';
import { main_char_list } from '../chars/main_char_list.js';

export function config_physics_for_hero(data, initialize = true) {
    if (initialize) data.heroCollisionGroup = game.physics.p2.createCollisionGroup();
    game.physics.p2.enable(data.hero, false);
    data.hero.anchor.y = numbers.HERO_Y_AP; //Important to be after the previous command
    data.hero.body.clearShapes();
    data.hero.body.setCircle(numbers.HERO_BODY_RADIUS, 0, 0);
    data.hero.body.setCollisionGroup(data.heroCollisionGroup);
    data.hero.body.mass = numbers.HERO_BODY_MASS;
    data.hero.body.damping = numbers.HERO_DAMPING;
    data.hero.body.angularDamping = numbers.HERO_DAMPING;
    data.hero.body.setZeroRotation();
    data.hero.body.fixedRotation = true; //disalble hero collision body rotation
}

export function config_physics_for_npcs(data, initialize = true) {
    if (initialize) data.npcCollisionGroup = game.physics.p2.createCollisionGroup();
    for (let i = 0; i < maps[data.map_name].npcs.length; ++i) {
        let npc = maps[data.map_name].npcs[i];
        game.physics.p2.enable(npc.npc_sprite, false);
        npc.npc_sprite.anchor.y = data.npc_db[npc.key_name].anchor_y; //Important to be after the previous command
        npc.npc_sprite.body.clearShapes();
        npc.npc_sprite.body.setCircle(data.npc_db[npc.key_name].body_radius, 0, 0);
        npc.npc_sprite.body.setCollisionGroup(data.npcCollisionGroup);
        npc.npc_sprite.body.damping = numbers.NPC_DAMPING;
        npc.npc_sprite.body.angularDamping = numbers.NPC_DAMPING;
        npc.npc_sprite.body.setZeroRotation();
        npc.npc_sprite.body.fixedRotation = true; //disalble npm collision body rotation
        npc.npc_sprite.body.dynamic = false;
        npc.npc_sprite.body.static = true;
    }
}

export function config_physics_for_map(data, initialize = true, collision_layer = undefined) {
    if (initialize) {
        data.map_collider = game.add.sprite(0, 0);
        data.map_collider.width = data.map_collider.height = 0;
        data.mapCollisionGroup = game.physics.p2.createCollisionGroup();
    }
    game.physics.p2.enable(data.map_collider, false);
    data.map_collider.body.clearShapes();
    data.map_collider.body.loadPolygon(
        maps[data.map_name].physics_names[collision_layer !== undefined ? collision_layer : data.map_collider_layer], 
        maps[data.map_name].physics_names[collision_layer !== undefined ? collision_layer : data.map_collider_layer]
    );
    data.map_collider.body.setCollisionGroup(data.mapCollisionGroup);
    data.map_collider.body.damping = numbers.MAP_DAMPING;
    data.map_collider.body.angularDamping = numbers.MAP_DAMPING;
    data.map_collider.body.setZeroRotation();
    data.map_collider.body.dynamic = false;
    data.map_collider.body.static = true;
}

export function config_world_physics(data) {
    game.physics.startSystem(Phaser.Physics.P2JS);
    game.physics.p2.setImpactEvents(true);
    game.physics.p2.world.defaultContactMaterial.restitution = numbers.WORLD_RESTITUTION;
    game.physics.p2.world.defaultContactMaterial.relaxation = numbers.WORLD_RELAXION;
    game.physics.p2.world.defaultContactMaterial.friction = numbers.WORLD_FRICTION;
    game.physics.p2.world.setGlobalStiffness(numbers.WORLD_STIFFNESS);
    game.physics.p2.restitution = numbers.WORLD_RESTITUTION;
}

export function config_collisions(data) {
    data.hero.body.collides(data.mapCollisionGroup);
    data.map_collider.body.collides(data.heroCollisionGroup);

    data.hero.body.collides(data.npcCollisionGroup);
    for (let i = 0; i < data.npc_group.children.length; ++i) {
        let sprite = data.npc_group.children[i];
        if (!sprite.is_npc) continue;
        sprite.body.collides(data.heroCollisionGroup);
    }
}

export function collision_dealer(data) {
    for (let i = 0; i < game.physics.p2.world.narrowphase.contactEquations.length; ++i){
        let c = game.physics.p2.world.narrowphase.contactEquations[i];
        if (c.bodyA === data.hero.body.data){
            if(c.contactPointA[0] >= numbers.COLLISION_MARGIN && data.actual_direction === "left")
                data.hero.body.velocity.x = 0;
            if(c.contactPointA[0] <= -numbers.COLLISION_MARGIN && data.actual_direction === "right")
                data.hero.body.velocity.x = 0;
            if(c.contactPointA[1] <= -numbers.COLLISION_MARGIN && data.actual_direction === "down")
                data.hero.body.velocity.y = 0;
            if(c.contactPointA[1] >= numbers.COLLISION_MARGIN && data.actual_direction === "up")
                data.hero.body.velocity.y = 0;
            break;
        }
    }
}

export function calculate_hero_speed(data) {
    if (data.actual_action === "dash") {
        data.hero.body.velocity.x = parseInt(data.delta_time * data.x_speed * (main_char_list[data.hero_name].dash_speed + data.extra_speed));
        data.hero.body.velocity.y = parseInt(data.delta_time * data.y_speed * (main_char_list[data.hero_name].dash_speed + data.extra_speed));
    } else if(data.actual_action === "walk") {
        data.hero.body.velocity.x = parseInt(data.delta_time * data.x_speed * (main_char_list[data.hero_name].walk_speed + data.extra_speed));
        data.hero.body.velocity.y = parseInt(data.delta_time * data.y_speed * (main_char_list[data.hero_name].walk_speed + data.extra_speed));
    } else if(data.actual_action === "climb") {
        data.hero.body.velocity.x = parseInt(data.delta_time * data.x_speed * main_char_list[data.hero_name].climb_speed);
        data.hero.body.velocity.y = parseInt(data.delta_time * data.y_speed * main_char_list[data.hero_name].climb_speed);
    } else if(data.actual_action === "idle") {
        data.hero.body.velocity.y = data.hero.body.velocity.x = 0;
    }
}

export function set_speed_factors(data, force = false) {
    if (data.climbing) {
        if (!data.cursors.up.isDown && data.cursors.down.isDown) {
            data.x_speed = 0;
            data.y_speed = 1;
            data.climb_direction = "down";
        } else if (data.cursors.up.isDown && !data.cursors.down.isDown) {
            data.x_speed = 0;
            data.y_speed = -1;
            data.climb_direction = "up";
        } else if (!data.cursors.up.isDown && !data.cursors.down.isDown) {
            data.x_speed = 0;
            data.y_speed = 0;
            data.climb_direction = "idle";
        }
    } else {
        if (data.cursors.up.isDown && !data.cursors.left.isDown && !data.cursors.right.isDown && !data.cursors.down.isDown && (data.actual_direction != "up" || force)){
            data.actual_direction = get_transition_directions(data.actual_direction, "up"); 
            data.x_speed = 0;
            data.y_speed = -1;
        } else if (!data.cursors.up.isDown && !data.cursors.left.isDown && !data.cursors.right.isDown && data.cursors.down.isDown && (data.actual_direction != "down" || force)){
            data.actual_direction = get_transition_directions(data.actual_direction, "down");
            data.x_speed = 0;
            data.y_speed = 1;
        } else if (!data.cursors.up.isDown && data.cursors.left.isDown && !data.cursors.right.isDown && !data.cursors.down.isDown && (data.actual_direction != "left" || force)){
            data.actual_direction = get_transition_directions(data.actual_direction, "left");
            data.x_speed = -1;
            data.y_speed = 0;
        } else if (!data.cursors.up.isDown && !data.cursors.left.isDown && data.cursors.right.isDown && !data.cursors.down.isDown && (data.actual_direction != "right" || force)){
            data.actual_direction = get_transition_directions(data.actual_direction, "right");
            data.x_speed = 1;
            data.y_speed = 0;
        } else if (data.cursors.up.isDown && data.cursors.left.isDown && !data.cursors.right.isDown && !data.cursors.down.isDown && (data.actual_direction != "up_left" || force)){
            data.actual_direction = get_transition_directions(data.actual_direction, "up_left");
            data.x_speed = -numbers.INV_SQRT2;
            data.y_speed = -numbers.INV_SQRT2;
        } else if (data.cursors.up.isDown && !data.cursors.left.isDown && data.cursors.right.isDown && !data.cursors.down.isDown && (data.actual_direction != "up_right" || force)){
            data.actual_direction = get_transition_directions(data.actual_direction, "up_right");
            data.x_speed = numbers.INV_SQRT2;
            data.y_speed = -numbers.INV_SQRT2;
        } else if (!data.cursors.up.isDown && data.cursors.left.isDown && !data.cursors.right.isDown && data.cursors.down.isDown && (data.actual_direction != "down_left" || force)){
            data.actual_direction = get_transition_directions(data.actual_direction, "down_left");
            data.x_speed = -numbers.INV_SQRT2;
            data.y_speed = numbers.INV_SQRT2;
        } else if (!data.cursors.up.isDown && !data.cursors.left.isDown && data.cursors.right.isDown && data.cursors.down.isDown && (data.actual_direction != "down_right" || force)){
            data.actual_direction = get_transition_directions(data.actual_direction, "down_right");
            data.x_speed = numbers.INV_SQRT2;
            data.y_speed = numbers.INV_SQRT2;
        }
    }
}
