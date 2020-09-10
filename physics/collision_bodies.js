import { maps } from '../initializers/maps.js';
import * as numbers from '../magic_numbers.js';
import { mount_collision_polygon } from '../utils.js';

const WORLD_RESTITUTION = 0;
const WORLD_RELAXATION = 8;
const WORLD_FRICTION = 0;
const WORLD_STIFFNESS = 1e5;
const HERO_BODY_MASS = 1.0;
const HERO_DAMPING = 0;
const INERTIA = 0;
const NPC_DAMPING = 1;
const INTERACTABLE_OBJECT_DAMPING = 1;
const HERO_Y_AP = 0.8;
const CONTACT_SKIN_SIZE = 1e-3;

export function config_physics_for_hero(game, data, initialize = true) {
    if (initialize) data.heroCollisionGroup = game.physics.p2.createCollisionGroup(); //groups only need to be created once
    game.physics.p2.enable(data.hero.sprite, false);
    data.hero.sprite.anchor.y = HERO_Y_AP; //Important to be after the previous command
    data.hero.sprite.body.clearShapes();
    data.hero.sprite.body.setCircle(numbers.HERO_BODY_RADIUS, 0, 0);
    data.hero.sprite.body.setCollisionGroup(data.heroCollisionGroup);
    data.hero.sprite.body.mass = HERO_BODY_MASS;
    data.hero.sprite.body.damping = HERO_DAMPING;
    data.hero.sprite.body.angularDamping = HERO_DAMPING;
    data.hero.sprite.body.inertia = INERTIA;
    data.hero.sprite.body.setZeroRotation();
    data.hero.sprite.body.fixedRotation = true; //disalble hero collision body rotation
}

export function config_physics_for_npcs(game, data, only_set_groups = false) {
    for (let i = 0; i < maps[data.map_name].npcs.length; ++i) {
        let npc = maps[data.map_name].npcs[i];
        if (!(npc.base_collider_layer in data.npcCollisionGroups)) {
            data.npcCollisionGroups[npc.base_collider_layer] = game.physics.p2.createCollisionGroup(); //groups only need to be created once
        }
        if (only_set_groups) continue;
        game.physics.p2.enable(npc.npc_sprite, false);
        npc.npc_sprite.anchor.y = data.npc_db[npc.key_name].anchor_y; //Important to be after the previous command
        npc.npc_sprite.body.clearShapes();
        const width = data.npc_db[npc.key_name].body_radius * 2;
        npc.npc_sprite.body.addPolygon({
                optimalDecomp: false,
                skipSimpleCheck: true,
                removeCollinearPoints: false
        }, mount_collision_polygon(width, -(width >> 1), data.npc_db[npc.key_name].collision_body_bevel));
        npc.npc_sprite.body.setCollisionGroup(data.npcCollisionGroups[npc.base_collider_layer]);
        npc.npc_sprite.body.damping = NPC_DAMPING;
        npc.npc_sprite.body.angularDamping = NPC_DAMPING;
        npc.npc_sprite.body.setZeroRotation();
        npc.npc_sprite.body.fixedRotation = true; //disalble npm collision body rotation
        npc.npc_sprite.body.dynamic = false;
        npc.npc_sprite.body.static = true;
    }
}

export function config_physics_for_interactable_objects(game, data, only_set_groups = false) {
    for (let i = 0; i < maps[data.map_name].interactable_objects.length; ++i) {
        let interactable_object = maps[data.map_name].interactable_objects[i];
        if (data.interactable_objects_db[interactable_object.key_name].body_radius === 0) continue;
        if (!(interactable_object.base_collider_layer in data.interactableObjectCollisionGroups)) {
            data.interactableObjectCollisionGroups[interactable_object.base_collider_layer] = game.physics.p2.createCollisionGroup(); //groups only need to be created once
        }
        if (only_set_groups) continue;
        game.physics.p2.enable(interactable_object.interactable_object_sprite, false);
        interactable_object.interactable_object_sprite.anchor.y = data.interactable_objects_db[interactable_object.key_name].anchor_y; //Important to be after the previous command
        interactable_object.interactable_object_sprite.body.clearShapes();
        const width = data.interactable_objects_db[interactable_object.key_name].body_radius * 2;
        interactable_object.interactable_object_sprite.body.addPolygon({
                optimalDecomp: false,
                skipSimpleCheck: true,
                removeCollinearPoints: false
        }, mount_collision_polygon(width, -(width >> 1), data.interactable_objects_db[interactable_object.key_name].collision_body_bevel));
        interactable_object.interactable_object_sprite.body.setCollisionGroup(data.interactableObjectCollisionGroups[interactable_object.base_collider_layer]);
        interactable_object.interactable_object_sprite.body.damping = INTERACTABLE_OBJECT_DAMPING;
        interactable_object.interactable_object_sprite.body.angularDamping = INTERACTABLE_OBJECT_DAMPING;
        interactable_object.interactable_object_sprite.body.setZeroRotation();
        interactable_object.interactable_object_sprite.body.fixedRotation = true; //disalble npm collision body rotation
        interactable_object.interactable_object_sprite.body.dynamic = false;
        interactable_object.interactable_object_sprite.body.static = true;
        if (interactable_object.custom_data.block_stair_collider_layer_shift !== undefined) {
            interactable_object.creating_blocking_stair_block();
        }
    }
}

export function config_physics_for_map(game, data, initialize = true, collision_layer = undefined) {
    if (initialize) { //groups only need to be created once
        data.map_collider = game.add.sprite(0, 0);
        data.map_collider.width = data.map_collider.height = 0;
        data.mapCollisionGroup = game.physics.p2.createCollisionGroup();
    }
    game.physics.p2.enable(data.map_collider, false);
    data.map_collider.body.clearShapes();
    data.map_collider.body.loadPolygon( //load map physics data json files
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

export function config_world_physics(game) {
    game.physics.startSystem(Phaser.Physics.P2JS);
    game.physics.p2.setImpactEvents(true);
    game.physics.p2.world.defaultContactMaterial.restitution = WORLD_RESTITUTION;
    game.physics.p2.world.defaultContactMaterial.relaxation = WORLD_RELAXATION;
    game.physics.p2.world.defaultContactMaterial.friction = WORLD_FRICTION;
    game.physics.p2.world.defaultContactMaterial.contactSkinSize = CONTACT_SKIN_SIZE;
    game.physics.p2.world.setGlobalStiffness(WORLD_STIFFNESS);
    game.physics.p2.restitution = WORLD_RESTITUTION;
}

export function config_collisions(data) { //make the world bodies interact with hero body
    data.hero.sprite.body.collides(data.mapCollisionGroup);
    data.map_collider.body.collides(data.heroCollisionGroup);

    for (let collide_index in data.npcCollisionGroups) {
        data.hero.sprite.body.removeCollisionGroup(data.npcCollisionGroups[collide_index], true);
    }
    if (data.map_collider_layer in data.npcCollisionGroups) {
        data.hero.sprite.body.collides(data.npcCollisionGroups[data.map_collider_layer]);
    }

    for (let collide_index in data.interactableObjectCollisionGroups) {
        data.hero.sprite.body.removeCollisionGroup(data.interactableObjectCollisionGroups[collide_index], true);
    }
    if (data.map_collider_layer in data.interactableObjectCollisionGroups) {
        data.hero.sprite.body.collides(data.interactableObjectCollisionGroups[data.map_collider_layer]);
    }

    for (let i = 0; i < data.npc_group.children.length; ++i) {
        let sprite = data.npc_group.children[i];
        if (!sprite.is_npc && !sprite.is_interactable_object) continue;
        if (!sprite.body) continue;
        sprite.body.collides(data.heroCollisionGroup);
    }
    data.hero.sprite.body.collides(data.dynamicEventsCollisionGroup);
}
