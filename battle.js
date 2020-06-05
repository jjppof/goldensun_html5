//====================================================================//
//=== THIS FILE IS JUST FOR TESTING. NOT PART OF THE MAIN PROJECT. ===//
//====================================================================//

import * as numbers from './magic_numbers.js';
import { BattleAnimation } from './base/battle/BattleAnimation.js';

window.battle_bg = undefined;
window.battle_bg2 = undefined;
window.players = [];
window.a = undefined;
window.b = undefined;
window.camera_angle = undefined;
window.camera_speed = undefined;
window.cursors = undefined;
window.default_scale = undefined;
window.center_x = undefined;
window.center_y = undefined;
window.bg_speed = undefined;
window.party_count = undefined;
window.enemy_count = undefined;
window.spacing_distance = undefined;
window.party_angle = undefined;
window.enemy_angle = undefined;
window.group_party = undefined;
window.group_enemy = undefined;
window.first_party_char = undefined;
window.last_party_char = undefined;
window.first_enemy_char = undefined;
window.last_enemy_char = undefined;
window.old_camera_angle = undefined;
window.bg_spin_speed = undefined;
window.pos_x_party = undefined;
window.pos_y_party = undefined;
window.pos_x_enemy = undefined;
window.pos_y_enemy = undefined;
window.scale = undefined;
window.players_number = undefined;
window.middle_shift_enemy = undefined;
window.middle_shift_party = undefined;
window.screen_scale_factor = undefined;
window.psynergy_animations_db = undefined;
window.battle_animation_executing = false;
window.game_intialized = false;
window.battle_anim = null;

var sprites_db = {
    "isaac_battle_animation": [
        {
            action: "attack_back",
            frames_count: 2,
            frame_rate: 1,
            loop: false
        },{
            action: "attack_front",
            frames_count: 2,
            frame_rate: 1,
            loop: false
        },{
            action: "back",
            frames_count: 4,
            frame_rate: 3,
            loop: true
        },{
            action: "front",
            frames_count: 4,
            frame_rate: 3,
            loop: true
        },{
            action: "cast_back",
            frames_count: 2,
            frame_rate: 10,
            loop: true
        },{
            action: "cast_front",
            frames_count: 2,
            frame_rate: 10,
            loop: true
        },{
            action: "cast_init_back",
            frames_count: 3,
            frame_rate: 6,
            loop: false
        },{
            action: "cast_init_front",
            frames_count: 3,
            frame_rate: 6,
            loop: false
        },{
            action: "damage_back",
            frames_count: 1,
            frame_rate: 1,
            loop: false
        },{
            action: "damage_front",
            frames_count: 1,
            frame_rate: 1,
            loop: false
        },{
            action: "downed_back",
            frames_count: 1,
            frame_rate: 1,
            loop: false
        },{
            action: "downed_front",
            frames_count: 1,
            frame_rate: 1,
            loop: false
        }
    ],
    "mini_goblin_battle_animation": [
        {
            action: "attack_back",
            frames_count: 2,
            frame_rate: 1,
            loop: false
        },{
            action: "attack_front",
            frames_count: 2,
            frame_rate: 1,
            loop: false
        },{
            action: "back",
            frames_count: 4,
            frame_rate: 3,
            loop: true
        },{
            action: "front",
            frames_count: 4,
            frame_rate: 3,
            loop: true
        },{
            action: "damage_back",
            frames_count: 1,
            frame_rate: 1,
            loop: false
        },{
            action: "damage_front",
            frames_count: 1,
            frame_rate: 1,
            loop: false
        }
    ]
}

window.game = new Phaser.Game (
    numbers.GAME_WIDTH,
    numbers.GAME_HEIGHT,
    Phaser.AUTO,
    '',
    { preload: preload, create: create, update: update },
    false,
    false
);

function preload() {
    game.load.image('colosso', 'assets/images/battle_backgrounds/colosso.gif');
    game.load.image('kolima', 'assets/images/battle_backgrounds/Kolima_Forest.gif');
    game.load.image('mercury', 'assets/images/battle_backgrounds/mercury_lighthouse.gif');
    game.load.image('desert', 'assets/images/battle_backgrounds/Suhalla_Desert.gif');
    game.load.image('tunnel', 'assets/images/battle_backgrounds/Tunnel_Ruins.gif');
    game.load.image('vault', 'assets/images/battle_backgrounds/Vault_Inn.gif');
    game.load.image('venus', 'assets/images/battle_backgrounds/Venus_Lighthouse.gif');

    game.load.image('felix_back', 'assets/images/spritesheets/felix_back.png');
    game.load.image('felix_front', 'assets/images/spritesheets/felix_front.png');
    game.load.image('mino_back', 'assets/images/spritesheets/mino_back.png');
    game.load.image('mino_front', 'assets/images/spritesheets/mino_front.png');

    game.load.atlasJSONHash('isaac_battle_animation', 'assets/images/spritesheets/battle/isaac_battle.png', 'assets/images/spritesheets/battle/isaac_battle.json');
    game.load.atlasJSONHash('mini_goblin_battle_animation', 'assets/images/spritesheets/battle/mini_goblin_battle.png', 'assets/images/spritesheets/battle/mini_goblin_battle.json');

    game.load.script('color_filters', 'plugins/ColorFilters.js');

    game.load.atlasJSONHash('pyroclasm_psynergy_animation', 'assets/images/psynergy_animations/pyroclasm.png', 'assets/images/psynergy_animations/pyroclasm.json');
    game.load.json('psynergy_animations_db', 'assets/dbs/psynergy_animations_db.json');
}

function set_animations(data) {
    data.db.forEach(action => {
        const frames = Phaser.Animation.generateFrameNames(`battle/${action.action}/`, 0, action.frames_count - 1, '', 2);
        data.sprite.animations.add(action.action, frames,action.frame_rate, action.loop);
        data.sprite.animations.play(data.is_party ? 'back' : 'front');
    });
}

function create() {
    game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
    game.input.onTap.add(function(pointer, isDoubleClick) {  
        if (isDoubleClick) game.scale.startFullScreen(true);
    });

    screen_scale_factor = 2;
    game.scale.setupScale(screen_scale_factor * numbers.GAME_WIDTH, screen_scale_factor * numbers.GAME_HEIGHT);
    window.dispatchEvent(new Event('resize'));

    game.stage.disableVisibilityChange = true;

    battle_bg = game.add.tileSprite(0, 17, numbers.GAME_WIDTH, 113, 'colosso');
    battle_bg2 = game.add.tileSprite(0, 17, numbers.GAME_WIDTH, 113, 'colosso');

    psynergy_animations_db = game.cache.getJSON('psynergy_animations_db');

    default_scale = 0.9;
    center_x = numbers.GAME_WIDTH/2;
    center_y = numbers.GAME_HEIGHT - 35;
    a = numbers.GAME_WIDTH/2 - 30;
    b = numbers.GAME_HEIGHT/30;
    camera_angle = {rad : 0, spining: false};
    old_camera_angle = camera_angle.rad;
    camera_speed = 0.009 * Math.PI;
    bg_speed = 2.4;
    bg_spin_speed = 0.4;
    party_count = 1;
    enemy_count = 1;
    players_number = party_count + enemy_count;
    spacing_distance = 35;
    middle_shift_enemy = spacing_distance*enemy_count/2;
    middle_shift_party = spacing_distance*party_count/2;

    group_enemy = game.add.group();
    group_party = game.add.group();

    // ====== NEED REFAC ====== //
    //get equidistant arc lenghts from camera angle
    party_angle = get_angle(camera_angle.rad);
    enemy_angle = get_angle(camera_angle.rad + Math.PI);
    // ====== NEED REFAC END ====== //

    //calculate party and enemy base position
    pos_x_party = center_x + ellipse(party_angle)*Math.cos(party_angle);
    pos_y_party = center_y + ellipse(party_angle)*Math.sin(party_angle);
    pos_x_enemy = center_x + ellipse(enemy_angle)*Math.cos(enemy_angle);
    pos_y_enemy = center_y + ellipse(enemy_angle)*Math.sin(enemy_angle);

    for (let i = 0; i < players_number; ++i) {
        let p;
        if (i < party_count)
            p = group_party.create(0, 0, 'isaac_battle_animation');
        else
            p = group_enemy.create(0, 0, 'mini_goblin_battle_animation');
        p.anchor.setTo(0.5, 1);
        p.scale.setTo(default_scale, default_scale);
        players.push(p);
        set_animations({ sprite: p, db: sprites_db[p.key], is_party: i < party_count});

        // ====== NEED REFAC ====== //
        //initialize position
        let relative_angle = i < party_count ? camera_angle.rad : camera_angle.rad + Math.PI;
        if (i < party_count) { //shift party players from base point
            players[i].x = pos_x_party + ((spacing_distance*i - middle_shift_party) + (spacing_distance >> 1)) * Math.sin(relative_angle);
            if (battle_anim === null || !battle_anim.moving_y) {
                players[i].y = pos_y_party;
            }
        } else {  //shift enemy players from base point
            players[i].x = pos_x_enemy + ((spacing_distance*(i-party_count) - middle_shift_enemy) + (spacing_distance >> 1)) * Math.sin(relative_angle);
            if (battle_anim === null || !battle_anim.moving_y) {
                players[i].y = pos_y_enemy;
            }
        }
        // ====== NEED REFAC END ====== //
    }

    first_party_char = group_party.children[0];
    last_party_char = group_party.children[party_count - 1];
    first_enemy_char = group_enemy.children[0];
    last_enemy_char = group_enemy.children[party_count - 1];

    game.input.keyboard.addKey(Phaser.Keyboard.ONE).onDown.add(() => {
        battle_bg.loadTexture('colosso');
        battle_bg2.loadTexture('colosso');
    }, this);
    game.input.keyboard.addKey(Phaser.Keyboard.TWO).onDown.add(() => {
        battle_bg.loadTexture('kolima');
        battle_bg2.loadTexture('kolima');
    }, this);
    game.input.keyboard.addKey(Phaser.Keyboard.THREE).onDown.add(() => {
        battle_bg.loadTexture('mercury');
        battle_bg2.loadTexture('mercury');
    }, this);
    game.input.keyboard.addKey(Phaser.Keyboard.FOUR).onDown.add(() => {
        battle_bg.loadTexture('desert');
        battle_bg2.loadTexture('desert');
    }, this);
    game.input.keyboard.addKey(Phaser.Keyboard.FIVE).onDown.add(() => {
        battle_bg.loadTexture('tunnel');
        battle_bg2.loadTexture('tunnel');
    }, this);
    game.input.keyboard.addKey(Phaser.Keyboard.SIX).onDown.add(() => {
        battle_bg.loadTexture('vault');
        battle_bg2.loadTexture('vault');
    }, this);
    game.input.keyboard.addKey(Phaser.Keyboard.SEVEN).onDown.add(() => {
        battle_bg.loadTexture('venus');
        battle_bg2.loadTexture('venus');
    }, this);

    cursors = game.input.keyboard.createCursorKeys();

    game_intialized = true;
}

//active spin effect
window.spin = function(angle, easing, duration) {
    if (!camera_angle.spining) {
        camera_angle.spining = true;
        game.add.tween(camera_angle).to(
            {rad: camera_angle.rad + angle},
            duration,
            easing,
            true
        ).onComplete.addOnce(() => {
            camera_angle.spining = false;
        });
    }
}

function update() {
    if (cursors.left.isDown || cursors.right.isDown || camera_angle.spining) {
        //angle change and bg x position change
        if (!cursors.left.isDown && cursors.right.isDown && !camera_angle.spining) {
            camera_angle.rad -= camera_speed;
            battle_bg.x -= bg_speed
        } else if (cursors.left.isDown && !cursors.right.isDown && !camera_angle.spining) {
            camera_angle.rad += camera_speed; 
            battle_bg.x += bg_speed
        }

        if (!camera_angle.spining) { //let spin effect do its work freely
            if(camera_angle.rad >= numbers.FULL_ROUND) camera_angle.rad -= numbers.FULL_ROUND;
            if(camera_angle.rad < 0) camera_angle.rad += numbers.FULL_ROUND;
        } else //tie bg x position with camera angle when spining
            battle_bg.x += bg_spin_speed * numbers.GAME_WIDTH * (camera_angle.rad - old_camera_angle);
        old_camera_angle = camera_angle.rad;

        //check bg x position surplus
        if (battle_bg.x > numbers.GAME_WIDTH)
            battle_bg.x -= Math.abs(Math.floor(battle_bg.x/numbers.GAME_WIDTH)) * numbers.GAME_WIDTH;
        else if (battle_bg.x < -numbers.GAME_WIDTH)
            battle_bg.x += Math.abs(Math.floor(battle_bg.x/numbers.GAME_WIDTH)) * numbers.GAME_WIDTH;

        //make mirrored bg follow default bg
        if (battle_bg.x > 0 && battle_bg.x < numbers.GAME_WIDTH)
            battle_bg2.x = battle_bg.x - numbers.GAME_WIDTH;
        else if (battle_bg.x < 0 && battle_bg.x > -numbers.GAME_WIDTH)
            battle_bg2.x = battle_bg.x + numbers.GAME_WIDTH;

        //get equidistant arc lenghts from camera angle
        party_angle = get_angle(camera_angle.rad);
        enemy_angle = get_angle(camera_angle.rad + Math.PI);

        //calculate party and enemy base position
        pos_x_party = center_x + ellipse(party_angle)*Math.cos(party_angle);
        pos_y_party = center_y + ellipse(party_angle)*Math.sin(party_angle);
        pos_x_enemy = center_x + ellipse(enemy_angle)*Math.cos(enemy_angle);
        pos_y_enemy = center_y + ellipse(enemy_angle)*Math.sin(enemy_angle);

        //check party and enemy z index
        if (Math.sin(camera_angle.rad) > 0 && game.world.getChildIndex(group_party) < game.world.getChildIndex(group_enemy))
            game.world.swapChildren(group_enemy, group_party);
        else if (Math.sin(camera_angle.rad) < 0 && game.world.getChildIndex(group_party) > game.world.getChildIndex(group_enemy))
            game.world.swapChildren(group_enemy, group_party);

        //check party z index order
        if (Math.cos(camera_angle.rad) < 0 && first_party_char.z > last_party_char.z)
            group_party.reverse();
        else if (Math.cos(camera_angle.rad) > 0 && first_party_char.z < last_party_char.z)
            group_party.reverse();

        //check enemy z index order
        if (Math.cos(camera_angle.rad) < 0 && first_enemy_char.z < last_enemy_char.z)
            group_enemy.reverse();
        else if (Math.cos(camera_angle.rad) > 0 && first_enemy_char.z > last_enemy_char.z)
            group_enemy.reverse();

        for (let i = 0; i < players_number; ++i) {
            let relative_angle = i < party_count ? camera_angle.rad : camera_angle.rad + Math.PI;
            if (i < party_count) { //shift party players from base point
                players[i].x = pos_x_party + ((spacing_distance*i - middle_shift_party) + (spacing_distance >> 1)) * Math.sin(relative_angle);
                if (!players[i].moving_y) {
                    players[i].y = pos_y_party;
                }
            } else {  //shift enemy players from base point
                players[i].x = pos_x_enemy + ((spacing_distance*(i-party_count) - middle_shift_enemy) + (spacing_distance >> 1)) * Math.sin(relative_angle);
                if (!players[i].moving_y) {
                    players[i].y = pos_y_enemy;
                }
            }

            //set scale
            scale = get_scale(relative_angle);
            players[i].scale.setTo(scale, scale);

            //change texture in function of position
            if (i < party_count) {
                if (Math.sin(relative_angle) > 0 && !players[i].animations.currentAnim.name.endsWith('back')) {
                    players[i].animations.play(players[i].animations.currentAnim.name.replace('front', 'back'));
                } else if (Math.sin(relative_angle) <= 0 && !players[i].animations.currentAnim.name.endsWith('front')) {
                    players[i].animations.play(players[i].animations.currentAnim.name.replace('back', 'front'));
                } 
            } else {
                if (Math.sin(relative_angle) > 0 && !players[i].animations.currentAnim.name.endsWith('back')) {
                    players[i].animations.play(players[i].animations.currentAnim.name.replace('front', 'back'));
                } else if (Math.sin(relative_angle) <= 0 && !players[i].animations.currentAnim.name.endsWith('front')) {
                    players[i].animations.play(players[i].animations.currentAnim.name.replace('back', 'front'));
                }
            }

            //change side in function of position
            if (Math.cos(relative_angle) > 0 && players[i].scale.x < 0)
                players[i].scale.setTo(players[i].scale.x, players[i].scale.y);
            else if (Math.cos(relative_angle) <= 0 && players[i].scale.x > 0)
                players[i].scale.setTo(-players[i].scale.x, players[i].scale.y);
        }
    }
}

window.cast_psynergy = function() {
    if (battle_animation_executing || !game_intialized) return;
    battle_animation_executing = true;
    const psy_key = 0;
    battle_anim = new BattleAnimation(
        game,
        psynergy_animations_db[psy_key].key_name,
        psynergy_animations_db[psy_key].sprites,
        psynergy_animations_db[psy_key].x_sequence,
        psynergy_animations_db[psy_key].y_sequence,
        psynergy_animations_db[psy_key].x_scale_sequence,
        psynergy_animations_db[psy_key].y_scale_sequence,
        psynergy_animations_db[psy_key].x_anchor_sequence,
        psynergy_animations_db[psy_key].y_anchor_sequence,
        psynergy_animations_db[psy_key].alpha_sequence,
        psynergy_animations_db[psy_key].rotation_sequence,
        psynergy_animations_db[psy_key].stage_angle_sequence,
        psynergy_animations_db[psy_key].hue_angle_sequence,
        psynergy_animations_db[psy_key].tint_sequence,
        psynergy_animations_db[psy_key].grayscale_sequence,
        psynergy_animations_db[psy_key].colorize_sequence,
        psynergy_animations_db[psy_key].custom_filter_sequence,
        psynergy_animations_db[psy_key].camera_shake_sequence,
        psynergy_animations_db[psy_key].play_sequence,
        psynergy_animations_db[psy_key].set_frame_sequence,
        psynergy_animations_db[psy_key].blend_mode_sequence,
        psynergy_animations_db[psy_key].is_party_animation
    );
    battle_anim.initialize(group_party.children[0], group_enemy.children, group_party, group_enemy, game.world, camera_angle, [battle_bg, battle_bg2]);
    battle_anim.play(() => {
        battle_animation_executing = false;
    });
}

function ellipse(angle) { //ellipse formula
    return a*b/Math.sqrt(Math.pow(b*Math.cos(angle), 2) + Math.pow(a*Math.sin(angle), 2));
}

function get_angle(angle) { //equidistant ellipse angle formula
    return angle + Math.atan(( (b-a)*Math.tan(angle) )/( a + b*Math.pow(Math.tan(angle), 2) ));
}

function get_scale(angle) { //scale formula
    return (Math.sin(angle)/6 + 0.8334) * default_scale;
}