import * as utils from './utils.js';
import * as numbers from './magic_numbers.js';
import { initializeMainChars, main_char_list } from './chars/main_char_list.js';
import { initializeMaps, loadMaps, maps } from './maps/maps.js';

var cursors;
var hero;
var map_collider_layer;
var actual_action;
var actual_direction;
var climb_direction;
var x_speed;
var y_speed;
var hero_name;
var map_name;
var shadow;
var hero_tile_pos_x;
var hero_tile_pos_y;
var current_event;
var event_activation_process;
var event_timer;
var on_event;
var climbing;
var extra_speed;
var map_collider;
var mapCollisionGroup;
var heroCollisionGroup;
var npcCollisionGroup;
var underlayer_group;
var overlayer_group;
var black_rect;
var transtions_group;
var npc_group;
var teleporting;
var fading_out;
var processing_teleport;
var delta_time;
var jumping;
var show_fps;
var npc_db;

var game = new Phaser.Game(
    numbers.GAME_WIDTH, //width
    numbers.GAME_HEIGHT, //height
    Phaser.AUTO, //renderer
    "game", //parent
    { preload: preload, create: create, update: update, render: render }, //states
    false, //transparent
    false //antialias
);

function preload() {
    initializeMainChars(game);
    initializeMaps();
    loadMaps(game);
    get_npc_db().then(data => npc_db = data);

    game.time.advancedTiming = true;

    game.load.image('shadow', 'assets/images/misc/shadow.png');
}

async function get_npc_db() {
    let response = await fetch("assets/dbs/npc_db.json");
    let data = await response.json();
    return data;
}

function config_groups_and_layers() {
    //creating groups. Order here is important
    underlayer_group = game.add.group();
    npc_group = game.add.group();
    overlayer_group = game.add.group();
    transtions_group = game.add.group();

    //configing map layers: creating sprites, listing events and setting the layers
    maps[map_name].setLayers(game, maps, npc_db, underlayer_group, overlayer_group, map_collider_layer, npc_group);
}

function config_transitions_group() {
    //configing black rectangle properties and adding to transitions_group
    transtions_group.alpha = 0
    black_rect = game.add.graphics(0, 0);
    black_rect.lineStyle(0);
    black_rect.beginFill(0x0, 1);
    black_rect.drawRect(0, 0, numbers.GAME_WIDTH, numbers.GAME_HEIGHT);
    black_rect.endFill();
    transtions_group.addChild(black_rect);
}

function config_hero() {
    //creating sprites and adding hero and its shadow to npc_group
    shadow = npc_group.create(0, 0, 'shadow');
    shadow.anchor.setTo(numbers.SHADOW_X_AP, numbers.SHADOW_Y_AP); //shadow anchor point
    hero = npc_group.create(0, 0, utils.u([hero_name, actual_action]));
    hero.centerX = numbers.HERO_START_X; //hero x start position
    hero.centerY = numbers.HERO_START_Y; //hero y start position
    game.camera.follow(hero); //makes camera follow the hero
    //config hero initial animation state
    main_char_list[hero_name].setAnimation(hero, actual_action);
    hero.animations.play(utils.u([actual_action, actual_direction]));
}

function config_world_physics() {
    game.physics.startSystem(Phaser.Physics.P2JS);
    game.physics.p2.setImpactEvents(true);
    game.physics.p2.world.defaultContactMaterial.restitution = numbers.WORLD_RESTITUTION;
    game.physics.p2.world.defaultContactMaterial.relaxation = numbers.WORLD_RELAXION;
    game.physics.p2.world.defaultContactMaterial.friction = numbers.WORLD_FRICTION;
    game.physics.p2.world.setGlobalStiffness(numbers.WORLD_STIFFNESS);
    game.physics.p2.restitution = numbers.WORLD_RESTITUTION;
}

function config_physics_for_hero() {
    game.physics.p2.enable(hero, false);
    hero.anchor.y = numbers.HERO_Y_AP; //Important to be after the previous command
    hero.body.clearShapes();
    hero.body.setCircle(numbers.HERO_BODY_RADIUS, 0, 0);
    heroCollisionGroup = game.physics.p2.createCollisionGroup();
    hero.body.setCollisionGroup(heroCollisionGroup);
    hero.body.mass = numbers.HERO_BODY_MASS;
    hero.body.damping = numbers.HERO_DAMPING;
    hero.body.angularDamping = numbers.HERO_DAMPING;
    hero.body.setZeroRotation();
    hero.body.fixedRotation = true; //disalble hero collision body rotation
}

function config_physics_for_npcs() {
    npcCollisionGroup = game.physics.p2.createCollisionGroup();
    for (let i = 0; i < npc_group.children.length; ++i) {
        let sprite = npc_group.children[i];
        if (!sprite.is_npc) continue;
        game.physics.p2.enable(sprite, false);
        sprite.anchor.y = numbers.NPC_Y_AP; //Important to be after the previous command
        sprite.body.clearShapes();
        sprite.body.setCircle(numbers.NPC_BODY_RADIUS, 0, 0);
        sprite.body.setCollisionGroup(npcCollisionGroup);
        sprite.body.damping = numbers.NPC_DAMPING;
        sprite.body.angularDamping = numbers.NPC_DAMPING;
        sprite.body.setZeroRotation();
        sprite.body.fixedRotation = true; //disalble npm collision body rotation
        sprite.body.dynamic = false;
        sprite.body.static = true;
    }
}

function config_physics_for_map(initialize = true) {
    if (initialize) {
        map_collider = game.add.sprite(0, 0);
        game.physics.p2.enable(map_collider, false);
    }
    map_collider.body.clearShapes();
    map_collider.body.loadPolygon(
        maps[map_name].physics_names[map_collider_layer], 
        maps[map_name].physics_names[map_collider_layer]
    );
    mapCollisionGroup = game.physics.p2.createCollisionGroup();
    map_collider.body.setCollisionGroup(mapCollisionGroup);
    map_collider.body.damping = numbers.MAP_DAMPING;
    map_collider.body.angularDamping = numbers.MAP_DAMPING;
    map_collider.body.setZeroRotation();
    map_collider.body.dynamic = false;
    map_collider.body.static = true;
}

function config_collisions() {
    hero.body.collides(mapCollisionGroup);
    hero.body.collides(npcCollisionGroup);

    for (let i = 0; i < npc_group.children.length; ++i) {
        let sprite = npc_group.children[i];
        if (!sprite.is_npc) continue;
        sprite.body.collides(heroCollisionGroup);
    }

    map_collider.body.collides(heroCollisionGroup);
}

function create() {
    // Initializing some vars
    hero_name = "isaac";
    map_name = "madra";
    map_collider_layer = 0;
    actual_action = 'idle';
    actual_direction = 'down';
    extra_speed = 0;
    delta_time = 0;
    x_speed = 0;
    y_speed = 0;
    event_activation_process = false;
    on_event = false;
    climbing = false;
    teleporting = false;
    fading_out = false;
    processing_teleport = false;
    jumping = false;

    config_groups_and_layers();
    config_transitions_group();
    config_hero();
    config_world_physics();
    config_physics_for_hero();
    config_physics_for_npcs();
    config_physics_for_map();
    config_collisions();

    game.physics.p2.updateBoundsCollisionGroup();

    //activate debug mode
    game.input.keyboard.addKey(Phaser.Keyboard.D).onDown.add(function(){
        hero.body.debug = !hero.body.debug;
        map_collider.body.debug = !map_collider.body.debug;
        for (let i = 0; i < npc_group.children.length; ++i) {
            let sprite = npc_group.children[i];
            if (!sprite.is_npc) continue;
            sprite.body.debug = !sprite.body.debug;
        }
    }, this);

    //enable full screen
    game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
    game.input.onTap.add(function(pointer, isDoubleClick) {  
        if(isDoubleClick) {
            game.scale.startFullScreen(true);
        }  
    });

    //enable fps show
    show_fps = false;
    game.input.keyboard.addKey(Phaser.Keyboard.F).onDown.add(function(){
        show_fps = !show_fps;
    }, this);

    //enable zoom
    game.input.keyboard.addKey(Phaser.Keyboard.ONE).onDown.add(function(){
        game.scale.setupScale(numbers.GAME_WIDTH, numbers.GAME_HEIGHT);
        window.dispatchEvent(new Event('resize'));
    }, this);
    game.input.keyboard.addKey(Phaser.Keyboard.TWO).onDown.add(function(){
        game.scale.setupScale(2*numbers.GAME_WIDTH, 2*numbers.GAME_HEIGHT);
        window.dispatchEvent(new Event('resize'));
    }, this);
    game.input.keyboard.addKey(Phaser.Keyboard.THREE).onDown.add(function(){
        game.scale.setupScale(3*numbers.GAME_WIDTH, 3*numbers.GAME_HEIGHT);
        window.dispatchEvent(new Event('resize'));
    }, this);

    //set keyboard cursors
    cursors = game.input.keyboard.createCursorKeys();
}

function climbing_event() {
    if (!climbing) {
        if (current_event.activation_direction === "down") {
            on_event = true;
            event_activation_process = false;
            hero.loadTexture(utils.u([hero_name, "climb"]));
            main_char_list[hero_name].setAnimation(hero, "climb");
            hero.animations.play(utils.u(["climb", "start"]), 9, false, true);
        } else if (current_event.activation_direction === "up") {
            on_event = true;
            event_activation_process = false;
            hero.loadTexture(utils.u([hero_name, "climb"]));
            main_char_list[hero_name].setAnimation(hero, "climb");
            hero.animations.play(utils.u(["climb", "idle"]));
            const out_time = Phaser.Timer.QUARTER/2;
            game.add.tween(hero.body).to(
                { y: hero.y - 15 },
                out_time,
                Phaser.Easing.Exponential.InOut,
                true
            );
            game.time.events.add(out_time + 50, () => {
                on_event = false;
                climbing = true;
                current_event = null;
            }, this);
            shadow.visible = false;
            actual_action = "climb";
            actual_direction = "idle";
        }
    } else if (climbing) {
        if (current_event.activation_direction === "up") {
            on_event = true;
            game.physics.p2.pause();
            event_activation_process = false;
            hero.animations.play(utils.u(["climb", "end"]), 8, false, false);
            shadow.visible = false;
            const time = Phaser.Timer.QUARTER;
            game.add.tween(hero.body).to(
                { y: hero.y - 12 },
                time,
                Phaser.Easing.Linear.None,
                true
            );
        } else if (current_event.activation_direction === "down") {
            on_event = true;
            event_activation_process = false;
            hero.loadTexture(utils.u([hero_name, "idle"]));
            main_char_list[hero_name].setAnimation(hero, "idle");
            hero.animations.play(utils.u(["idle", "up"]));
            const out_time = Phaser.Timer.QUARTER/2;
            game.add.tween(hero.body).to(
                { y: hero.y + 15 },
                out_time,
                Phaser.Easing.Exponential.InOut,
                true
            );
            game.time.events.add(out_time + 50, () => {
                on_event = false;
                climbing = false;
                current_event = null;
            }, this);
            shadow.y = hero.y;
            shadow.visible = true;
            actual_action = "idle";
            actual_direction = "up";
        }
    }
}

function fire_event() {
    if(event_activation_process){
        if (current_event.type === "stair")
            climbing_event();
        else if (current_event.type === "door") {
            on_event = true;
            event_activation_process = false;
            if (current_event.avance_effect) {
                hero.loadTexture(utils.u([hero_name, "walk"]));
                main_char_list[hero_name].setAnimation(hero, "walk");
                hero.animations.play(utils.u(["walk", "up"]));
                open_door();
                game.physics.p2.pause();
                const time = Phaser.Timer.HALF;
                const tween_x = maps[map_name].sprite.tileWidth*(parseFloat(current_event.x) + 1/2);
                const tween_y = hero.y - 15;
                game.add.tween(shadow).to({
                    x: tween_x,
                    y: tween_y
                }, time, Phaser.Easing.Linear.None, true);
                game.add.tween(hero.body).to({
                    x: tween_x,
                    y: tween_y
                }, time, Phaser.Easing.Linear.None, true);
                game.time.events.add(time + 50, () => { teleporting = true; }, this);
            } else
                teleporting = true;
        } else if (current_event.type = "jump") {
            on_event = true;
            event_activation_process = false;
            jumping = true;
        }
    }
}

function event_triggering() {
    current_event = maps[map_name].events[utils.u([hero_tile_pos_x, hero_tile_pos_y])];
    if (!climbing) {
        if(!event_activation_process && actual_direction === current_event.activation_direction && (actual_action === "walk" || actual_action === "dash")){
            event_activation_process = true;
            event_timer = game.time.events.add(Phaser.Timer.HALF, fire_event, this);
        } else if(event_activation_process && (actual_direction != current_event.activation_direction ||  actual_action === "idle"))
            event_activation_process = false;
    } else {
        if(!event_activation_process && climb_direction === current_event.activation_direction && (actual_direction === "climb")){
            event_activation_process = true;
            event_timer = game.time.events.add(Phaser.Timer.HALF, fire_event, this);
        } else if(event_activation_process && (climb_direction != current_event.activation_direction ||  actual_direction === "idle"))
            event_activation_process = false;
    }

    if (current_event.type === "speed") { //speed event activation
        if(extra_speed != current_event.speed)
            extra_speed = current_event.speed;
    }

    if (current_event.type === "door") { //door event activation
        if (!current_event.avance_effect) {
            event_activation_process = true;
            fire_event();
        }
    }
}

function update() {
    if (!on_event) {
        hero_tile_pos_x = Math.floor(hero.x/maps[map_name].sprite.tileWidth);
        hero_tile_pos_y = Math.floor(hero.y/maps[map_name].sprite.tileHeight);

        //check if the actual tile has an event
        if (utils.u([hero_tile_pos_x, hero_tile_pos_y]) in maps[map_name].events)
            event_triggering();
        else if (extra_speed != 0) //disabling speed event
            extra_speed = 0;

        if (!climbing)
            set_speed_factors(); //dash or walk movement
        else
            set_climbing_speed_factors(); //climbing movement
        
        set_actual_action(); //choose which sprite the hero shall assume

        delta_time = game.time.elapsedMS/numbers.DELTA_TIME_FACTOR;

        calculate_hero_speed();

        change_hero_sprite();

        collision_dealer();

        //make the shadow follow the hero
        if(shadow.x != hero.x)
            shadow.x = hero.x;
        if(shadow.y != hero.y)
            shadow.y = hero.y;

        map_collider.body.velocity.y = map_collider.body.velocity.x = 0; //fix map body
        for (let i = 0; i < npc_group.children.length; ++i) {
            let sprite = npc_group.children[i];
            if (!sprite.is_npc) continue;
            sprite.body.velocity.y = sprite.body.velocity.x = 0; //fix npcs body
        }
        map_collider.body.y = map_collider.body.x = 16;
        npc_group.sort('y', Phaser.Group.SORT_ASCENDING);
        
    } else {
        if (current_event.type === "stair")
            climb_event_animation_steps();
        else if (current_event.type === "door")
            door_event_phases();
        else if (jumping)
            jump_event();

        //disabling hero body movement
        hero.body.velocity.y = hero.body.velocity.x = 0;
    }
}

function render() {
    if (show_fps)
        game.debug.text('FPS: ' + game.time.fps || 'FPS: --', 5, 15, "#00ff00");
    else
        game.debug.text('', 0, 0);
}

function climb_event_animation_steps() {
    if (hero.animations.frameName === "climb/start/03") {
        shadow.visible = false;
        game.add.tween(hero.body).to(
            { x: maps[map_name].sprite.tileWidth*(parseFloat(current_event.x) + 1/2), y: hero.y + 25 },
            500,
            Phaser.Easing.Linear.None,
            true
        );
    } else if (hero.animations.frameName === "climb/start/06") {
        hero.animations.play(utils.u(["climb", "idle"]), 9);
        on_event = false;
        climbing = true;
        actual_action = "climb";
        current_event = null;
    } else if (hero.animations.frameName === "climb/end/02") {
        game.time.events.add(150, () => {
            game.add.tween(hero.body).to(
                { y: hero.y - 6 },
                70,
                Phaser.Easing.Linear.None,
                true
            );
            hero.loadTexture(utils.u([hero_name, "idle"]));
            main_char_list[hero_name].setAnimation(hero, "idle");
            hero.animations.play(utils.u(["idle", "up"]));
            game.time.events.add(120, () => {
                shadow.y = hero.y;
                shadow.visible = true;
                on_event = false;
                climbing = false;
                actual_action = "idle";
                actual_direction = "up";
                current_event = null;
                game.physics.p2.resume();
            }, this);
        }, this);
    }
}

function collision_dealer() {
    for (let i=0; i < game.physics.p2.world.narrowphase.contactEquations.length; ++i){
        let c = game.physics.p2.world.narrowphase.contactEquations[i];
        if (c.bodyA === hero.body.data){
            if(c.contactPointA[0] >= numbers.COLLISION_MARGIN && actual_direction === "left")
                hero.body.velocity.x = 0;
            if(c.contactPointA[0] <= -numbers.COLLISION_MARGIN && actual_direction === "right")
                hero.body.velocity.x = 0;
            if(c.contactPointA[1] <= -numbers.COLLISION_MARGIN && actual_direction === "down")
                hero.body.velocity.y = 0;
            if(c.contactPointA[1] >= numbers.COLLISION_MARGIN && actual_direction === "up")
                hero.body.velocity.y = 0;
            break;
        }
    }
}

function change_hero_sprite() {
    if (hero.key != utils.u([hero_name, actual_action])) {
        hero.loadTexture(utils.u([hero_name, actual_action]));
        main_char_list[hero_name].setAnimation(hero, actual_action);
    }
    if (hero.animations.currentAnim.name != utils.u([actual_action, actual_direction]))
        hero.animations.play(utils.u([actual_action, actual_direction]));
}

function calculate_hero_speed() {
    if (actual_action === "dash") {
        hero.body.velocity.x = delta_time * x_speed * (main_char_list[hero_name].dash_speed + extra_speed);
        hero.body.velocity.y = delta_time * y_speed * (main_char_list[hero_name].dash_speed + extra_speed);
    } else if(actual_action === "walk") {
        hero.body.velocity.x = delta_time * x_speed * (main_char_list[hero_name].walk_speed + extra_speed);
        hero.body.velocity.y = delta_time * y_speed * (main_char_list[hero_name].walk_speed + extra_speed);
    } else if(actual_action === "climb") {
        hero.body.velocity.x = delta_time * x_speed * main_char_list[hero_name].climb_speed;
        hero.body.velocity.y = delta_time * y_speed * main_char_list[hero_name].climb_speed;
    } else if(actual_action === "idle")
        hero.body.velocity.y = hero.body.velocity.x = 0;
}

function set_actual_action() {
    if (!cursors.up.isDown && !cursors.left.isDown && !cursors.right.isDown && !cursors.down.isDown && actual_action != "idle" && !climbing)
        actual_action = "idle";
    else if (!cursors.up.isDown && !cursors.left.isDown && !cursors.right.isDown && !cursors.down.isDown && actual_direction != "idle" && climbing)
        actual_direction = "idle";
    else if ((cursors.up.isDown || cursors.left.isDown || cursors.right.isDown || cursors.down.isDown) && actual_direction != "climb" && climbing)
        actual_direction = "climb";
    else if ((cursors.up.isDown || cursors.left.isDown || cursors.right.isDown || cursors.down.isDown) && (actual_action != "walk" || actual_action != "dash") && !climbing) {
        if (game.input.keyboard.isDown(Phaser.Keyboard.SHIFT) && actual_action != "dash")
            actual_action = "dash";
        else if (!game.input.keyboard.isDown(Phaser.Keyboard.SHIFT) && actual_action != "walk")
            actual_action = "walk";
    }
}

function set_speed_factors() {
    if (cursors.up.isDown && !cursors.left.isDown && !cursors.right.isDown && !cursors.down.isDown && actual_direction != "up"){
        actual_direction = getTransitionDirection(actual_direction, "up"); 
        x_speed = 0;
        y_speed = -1;
    } else if (!cursors.up.isDown && !cursors.left.isDown && !cursors.right.isDown && cursors.down.isDown && actual_direction != "down"){
        actual_direction = getTransitionDirection(actual_direction, "down");
        x_speed = 0;
        y_speed = 1;
    } else if (!cursors.up.isDown && cursors.left.isDown && !cursors.right.isDown && !cursors.down.isDown && actual_direction != "left"){
        actual_direction = getTransitionDirection(actual_direction, "left");
        x_speed = -1;
        y_speed = 0;
    } else if (!cursors.up.isDown && !cursors.left.isDown && cursors.right.isDown && !cursors.down.isDown && actual_direction != "right"){
        actual_direction = getTransitionDirection(actual_direction, "right");
        x_speed = 1;
        y_speed = 0;
    } else if (cursors.up.isDown && cursors.left.isDown && !cursors.right.isDown && !cursors.down.isDown && actual_direction != "up_left"){
        actual_direction = getTransitionDirection(actual_direction, "up_left");
        x_speed = -numbers.INV_SQRT2;
        y_speed = -numbers.INV_SQRT2;
    } else if (cursors.up.isDown && !cursors.left.isDown && cursors.right.isDown && !cursors.down.isDown && actual_direction != "up_right"){
        actual_direction = getTransitionDirection(actual_direction, "up_right");
        x_speed = numbers.INV_SQRT2;
        y_speed = -numbers.INV_SQRT2;
    } else if (!cursors.up.isDown && cursors.left.isDown && !cursors.right.isDown && cursors.down.isDown && actual_direction != "down_left"){
        actual_direction = getTransitionDirection(actual_direction, "down_left");
        x_speed = -numbers.INV_SQRT2;
        y_speed = numbers.INV_SQRT2;
    } else if (!cursors.up.isDown && !cursors.left.isDown && cursors.right.isDown && cursors.down.isDown && actual_direction != "down_right"){
        actual_direction = getTransitionDirection(actual_direction, "down_right");
        x_speed = numbers.INV_SQRT2;
        y_speed = numbers.INV_SQRT2;
    }
}

function set_climbing_speed_factors() {
    if (!cursors.up.isDown && cursors.down.isDown) {
        x_speed = 0;
        y_speed = 1;
        climb_direction = "down";
    } else if (cursors.up.isDown && !cursors.down.isDown) {
        x_speed = 0;
        y_speed = -1;
        climb_direction = "up";
    } else if (!cursors.up.isDown && !cursors.down.isDown) {
        x_speed = 0;
        y_speed = 0;
        climb_direction = "idle";
    }
}

function jump_event() {
    jumping = false;
    shadow.visible = false;
    let jump_offset = numbers.JUMP_OFFSET;
    let direction;
    if (current_event.activation_direction === "left") {
        jump_offset = -jump_offset;
        direction = "x";
    } else if (current_event.activation_direction === "right")
        direction = "x";
    else if (current_event.activation_direction === "up") {
        jump_offset = -jump_offset;
        direction = "y";
    } else if (current_event.activation_direction === "down")
        direction = "y";
    let tween_obj = {};
    shadow[direction] = hero[direction] + jump_offset;
    tween_obj[direction] = hero[direction] + jump_offset;
    if(direction === "x")
        tween_obj.y = [hero.y - 5, hero.y];
    hero.loadTexture(utils.u([hero_name, "jump"]));
    main_char_list[hero_name].setAnimation(hero, "jump");
    hero.animations.frameName = utils.b(["jump", current_event.activation_direction]);
    game.add.tween(hero.body).to( 
        tween_obj, 
        numbers.JUMP_DURATION, 
        Phaser.Easing.Linear.None, 
        true
    ).onComplete.addOnce(() => {
        on_event = false;
        current_event = null;
        shadow.visible = true;
    }, this);
}

function getTransitionDirection(actual_direction, desired_direction){
    return utils.transitions[desired_direction][actual_direction];
}

function door_event_phases() {
    if (teleporting) {
        teleporting = false;
        hero.loadTexture(utils.u([hero_name, "idle"]));
        main_char_list[hero_name].setAnimation(hero, "idle");
        hero.animations.play(utils.u(["idle", current_event.activation_direction]));
        actual_direction = current_event.activation_direction;
        actual_action = "idle";
        game.camera.fade();
        game.camera.onFadeComplete.add(() => { processing_teleport = true; }, this);
    } else if (processing_teleport) {
        processing_teleport = false;
        underlayer_group.removeAll();
        overlayer_group.removeAll();

        for (let i = 0; i < npc_group.children.length; ++i) {
            let sprite = npc_group.children[i];
            if (!sprite.is_npc) continue;
            sprite.body.destroy()
        }

        npc_group.removeAll();
        npc_group.add(shadow);
        npc_group.add(hero);
        map_name = current_event.target;
        map_collider_layer = current_event.collider_layer;

        maps[map_name].setLayers(
            game,
            maps,
            npc_db,
            underlayer_group,
            overlayer_group,
            map_collider_layer,
            npc_group
        ).then(() => {
            hero.body.x = current_event.x_target * maps[map_name].sprite.tileWidth;
            hero.body.y = current_event.y_target * maps[map_name].sprite.tileHeight;

            game.physics.p2.resume();

            config_physics_for_npcs();
            config_physics_for_map(false);
            config_collisions();
            game.physics.p2.updateBoundsCollisionGroup();

            for (let i = 0; i < npc_group.children.length; ++i) {
                let sprite = npc_group.children[i];
                if (!sprite.is_npc) continue;
                sprite.body.debug = hero.body.debug;
            }

            fading_out = true;
        });
    } else if (fading_out) {
        fading_out = false;
        game.camera.flash(0x0);
        game.camera.onFlashComplete.add(() => {
            on_event = false;
            current_event = null;
        }, this);
        shadow.x = hero.body.x;
        shadow.y = hero.body.y;
    }
}

function open_door() {
    let layer = _.findWhere(maps[map_name].sprite.layers, {name : maps[map_name].sprite.properties.door_layer});
    let sample_tile = maps[map_name].sprite.getTile(current_event.x, current_event.y - 1, layer.name);
    let door_type_index = sample_tile.properties.door_type;
    let tiles = _.filter(maps[map_name].sprite.tilesets[0].tileProperties, function(key){
        return key.door_type === door_type_index && "close_door" in key && key.id === sample_tile.properties.id;
    })
    let tile, source_index, close_door_index, offsets, base_x, base_y, target_index;
    for(let i = 0; i < tiles.length; ++i){
        tile = tiles[i];
        source_index = parseInt(tile.index) + 1;
        close_door_index = tile.close_door;
        offsets = tile.base_offset.split(",");
        base_x = current_event.x + parseInt(offsets[0]);
        base_y = current_event.y + parseInt(offsets[1]) - 1;
        target_index = parseInt(_.findKey(maps[map_name].sprite.tilesets[0].tileProperties, {open_door : close_door_index})) + 1;
        maps[map_name].sprite.replace(source_index, target_index, base_x, base_y, 1, 1, layer.name);
    }
}
