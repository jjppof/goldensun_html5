import * as numbers from './magic_numbers.js';
import * as utils from './utils.js';

var battle_bg;
var battle_bg2;
var players = [];
var a;
var b;
var camera_angle;
var camera_speed;
var cursors;
var default_scale;
var center_x;
var center_y;
var bg_speed;
var spining;
var party_count;
var enemy_count;
var spacing_distance;
var party_angle;
var enemy_angle;
var group_party;
var group_enemy;
var first_party_char;
var last_party_char;
var first_enemy_char;
var last_enemy_char;
var old_camera_angle;
var bg_spin_speed;
var pos_x_party;
var pos_y_party;
var pos_x_enemy;
var pos_y_enemy;
var scale;
var players_number;
var middle_shift_enemy;
var middle_shift_party;

var party=['isaac','garet','ivan','mia','felix','jenna','sheba','picard']; // switch: permet de changer ordre équipe?
var monsters=['mino','goblin','demon'];

//put all the stuffs (psynergies, djinns etc.) in a database (json var)????
var psynergies_earth=['ragnarok','quake','earth quake','spire','cure'];
var psynergies_fire=['flare','flare wall','fire','fireball','volcano'];
var psynergies_wind=['ray','ray storm','plasma'];
var psynergies_water=['pray','pray well','ice','ice horn'];

var djinn_earth=[];
var djinn_fire=[];
var djinn_wind=[];
var djinn_water=[];

var touche = 0;
var ui =['Attack','Psynergy','Djinn','Summon','Item','Defend'];
var elements= ["venus","mars","jupiter","mercury"];

var game = new Phaser.Game (
    numbers.GAME_WIDTH,
    numbers.GAME_HEIGHT,
    Phaser.AUTO,
    '',
    { preload: preload, create: create, update: update },
    false,
    false
);

var currentWidth = window.innerWidth;
var music;

function preload() {
    game.load.image('colosso', 'assets/images/battle_backgrounds/colosso.gif');
    game.load.image('kolima', 'assets/images/battle_backgrounds/Kolima_Forest.gif');
    game.load.image('mercury', 'assets/images/battle_backgrounds/mercury_lighthouse.gif');
    game.load.image('desert', 'assets/images/battle_backgrounds/Suhalla_Desert.gif');
    game.load.image('tunnel', 'assets/images/battle_backgrounds/Tunnel_Ruins.gif');
    game.load.image('vault', 'assets/images/battle_backgrounds/Vault_Inn.gif');
    game.load.image('venus', 'assets/images/battle_backgrounds/Venus_Lighthouse.gif');

    game.load.bitmapFont('gs-bmp-font', 'assets/font/golden-sun.png', 'assets/font/golden-sun.fnt');

    var i;
    // characters
    for(i=0; i< party.length;i++){
      game.load.image(party[i]+'_back', 'assets/images/spritesheets/'+party[i]+'_back.png');
      game.load.image(party[i]+'_front', 'assets/images/spritesheets/'+party[i]+'_front.png');
    }

    // characters facesets
    for(i=0; i< party.length;i++){
      var string= party[i].charAt(0).toUpperCase() + party[i].slice(1); // upperCase the first letter
      game.load.image(party[i], 'assets/images/icons/'+string+'.png');
    }

    // monsters
    for(i=0; i< monsters.length;i++){
      game.load.image(monsters[i]+'_back', 'assets/images/spritesheets/'+monsters[i]+'_back.png');
      game.load.image(monsters[i]+'_front', 'assets/images/spritesheets/'+monsters[i]+'_front.png');
    }

    //ui (top and bottom ui + "big icons" + elemental stars)
    game.load.image('ui-battle-up', 'assets/images/ui/ui_battle.png');
    game.load.image('ui-battle-down', 'assets/images/ui/ui_battle2.png');
    for(i=0; i< ui.length;i++){
      var string= ui[i].charAt(0).toLowerCase() + ui[i].slice(1); // lowerCase the first letter
      game.load.image('ui-'+string, 'assets/images/ui/'+ui[i]+'.png');
    }
    for(i=0; i< elements.length;i++){
      game.load.image('ui-'+elements[i], 'assets/images/ui/'+elements[i]+'_star.png');
    }

    game.load.audio('bg-battle', 'assets/music/battle/battle_jenna.mp3');
    game.load.audio('option', 'assets/music/se/battle_option.wav');
}

function create() {

    resizeGame();
    config_music();
    /*game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
    game.input.onTap.add(function(pointer, isDoubleClick) {
        if (isDoubleClick) game.scale.startFullScreen(true);
    });*/

    battle_bg = game.add.tileSprite(0, 27, 240, 113, 'colosso');
    battle_bg2 = game.add.tileSprite(0, 27, 240, 113, 'colosso');

    var ui_up = game.add.image(0, 0, 'ui-battle-up');
    var ui_down = game.add.image(33, 136, 'ui-battle-down');
    var ui_char = game.add.image(0, 128, party[0]);

    // prob: numbers...
    game.add.image(8, 8, 'ui-venus');
    this.game.add.bitmapText(16, 8, 'gs-bmp-font', djinn_earth.length.toString() , numbers.FONT_SIZE);
    game.add.image(8, 16, 'ui-mars');
    this.game.add.bitmapText(16, 16, 'gs-bmp-font', djinn_fire.length.toString() , numbers.FONT_SIZE);
    game.add.image(24, 8, 'ui-jupiter');
    this.game.add.bitmapText(32, 8, 'gs-bmp-font', djinn_wind.length.toString() , numbers.FONT_SIZE);
    game.add.image(24, 16, 'ui-mercury');
    this.game.add.bitmapText(32, 16, 'gs-bmp-font',djinn_water.length.toString() , numbers.FONT_SIZE);

    for(var i=0; i< ui.length;i++){
      var string= party[i].charAt(0).toUpperCase() + party[i].slice(1); // upperCase the first letter

      var drawnObject;
      var width = utils.get_text_width(this.game, string);
      var height = 8;
      var char_rect_bg = game.add.bitmapData(width, height);
      char_rect_bg.ctx.beginPath();
      char_rect_bg.ctx.rect(0, 0, width, height);
      char_rect_bg.ctx.fillStyle = '#006088';
      char_rect_bg.ctx.fill();
      drawnObject = game.add.sprite(48 + 48*i, 0, char_rect_bg);

      var hp_bar = game.add.bitmapData(40, 3);
      hp_bar.ctx.beginPath();
      hp_bar.ctx.rect(0, 0, 40, 3);
      hp_bar.ctx.fillStyle = '#0000f8';
      hp_bar.ctx.fill();
      drawnObject = game.add.sprite(48 + 48*i, 12, hp_bar);

      var pp_bar = game.add.bitmapData(40, 3);
      pp_bar.ctx.beginPath();
      pp_bar.ctx.rect(0, 0, 40, 3);
      pp_bar.ctx.fillStyle = '#0000f8';
      pp_bar.ctx.fill();
      drawnObject = game.add.sprite(48 + 48*i, 20, pp_bar);


      this.game.add.bitmapText(48 + 48*i, 0, 'gs-bmp-font', string, 8 );
      this.game.add.bitmapText(48 + 48*i, 8, 'gs-bmp-font', "HP", 8 );
      this.game.add.bitmapText(48 + 48*i, 16, 'gs-bmp-font', "PP", 8 );

    }

    var img= game.add.image(33, 130, 'ui-attack');
    this.add.tween(img.scale).to({ x: 14/15, y: 14/15  }, 200, Phaser.Easing.Back.Out, true, 0, -1, true);
    this.add.tween(img).to({y: 132 }, 200, Phaser.Easing.Back.Out, true, 0, -1,true);
    var txt= this.game.add.bitmapText(185, 144, 'gs-bmp-font', ui[0], numbers.FONT_SIZE);

    // maintenir touche?
    game.input.keyboard.addKey(Phaser.Keyboard.LEFT).onDown.add(() => {
        txt.destroy();
        img.destroy();
        music = game.add.audio('option');
        music.volume=0.3;
        music.play();
        if(touche-1< 0 )
          touche= ui.length -1;
        else
          touche -= 1;
        txt= this.game.add.bitmapText(185, 144, 'gs-bmp-font', ui[touche], numbers.FONT_SIZE);
        if (touche== ui.length -1)
          img= this.game.add.image(147, 130, 'ui-'+ui[touche].charAt(0).toLowerCase() + ui[touche].slice(1) );
        else if (touche== 0)
          img= this.game.add.image(33, 130, 'ui-'+ui[touche].charAt(0).toLowerCase() + ui[touche].slice(1) );
        else
          img= this.game.add.image(31+ 24*touche, 130, 'ui-'+ui[touche].charAt(0).toLowerCase() + ui[touche].slice(1) );

        if (touche== ui.length -1){ // deals with last icon (add 2 more pixels the "right side kept its position")
          this.add.tween(img.scale).to({ x: 14/15, y: 14/15  }, 200, Phaser.Easing.Back.Out, true, 0, -1, true);
          this.add.tween(img).to({x: 149, y: 132 }, 200, Phaser.Easing.Back.Out, true, 0, -1,true);
        }
        else{
          this.add.tween(img.scale).to({ x: 14/15, y: 14/15  }, 200, Phaser.Easing.Back.Out, true, 0, -1, true);
          this.add.tween(img).to({y: 132 }, 200, Phaser.Easing.Back.Out, true, 0, -1,true);
        }
    }, this);

    game.input.keyboard.addKey(Phaser.Keyboard.RIGHT).onDown.add(() => {
        txt.destroy();
        img.destroy();
        music = game.add.audio('option');
        music.volume=0.3;
        music.play();
        if(touche+1>  ui.length -1)
          touche= 0;
        else
          touche += 1;
        txt= this.game.add.bitmapText(185, 144, 'gs-bmp-font', ui[touche], numbers.FONT_SIZE);
        if (touche== ui.length -1)
          img= this.game.add.image(147, 130, 'ui-'+ui[touche].charAt(0).toLowerCase() + ui[touche].slice(1) );
        else if (touche== 0)
          img= this.game.add.image(33, 130, 'ui-'+ui[touche].charAt(0).toLowerCase() + ui[touche].slice(1) );
        else
          img= this.game.add.image(31+ 24*touche, 130, 'ui-'+ui[touche].charAt(0).toLowerCase() + ui[touche].slice(1) );

        if (touche== ui.length -1){ // deals with last icon (add 2 more pixels the "right side kept its position")
          this.add.tween(img.scale).to({ x: 14/15, y: 14/15  }, 200, Phaser.Easing.Back.Out, true, 0, -1, true);
          this.add.tween(img).to({x: 149, y: 132 }, 200, Phaser.Easing.Back.Out, true, 0, -1,true);
        }
        else{
          this.add.tween(img.scale).to({ x: 14/15, y: 14/15  }, 200, Phaser.Easing.Back.Out, true, 0, -1, true);
          this.add.tween(img).to({y: 132 }, 200, Phaser.Easing.Back.Out, true, 0, -1,true);
        }
    }, this);

    //where does the numbers come from? an example-----> y= numbers.GAME_HEIGHT-24 (size of the image)
    // game.add.tileSprite(): x,y, repeat_to_x,repeat_to_y
    // ...not equal to game.add.image()!

    spining = false;
    default_scale = 0.9;
    center_x = numbers.GAME_WIDTH/2;
    center_y = numbers.GAME_HEIGHT - 35;
    a = numbers.GAME_WIDTH/2 - 30;
    b = numbers.GAME_HEIGHT/30;
    camera_angle = {rad : 0};
    old_camera_angle = camera_angle.rad;
    camera_speed = 0.009 * Math.PI;
    bg_speed = 2.4;
    bg_spin_speed = 0.4;
    party_count = 4;
    enemy_count = Math.floor(Math.random() * 4 + 1); // between 1 and 4
    players_number = party_count + enemy_count;
    spacing_distance = 35;
    middle_shift_enemy = spacing_distance*enemy_count/2;
    middle_shift_party = spacing_distance*party_count/2;

    group_enemy = game.add.group();
    group_party = game.add.group();

    for (let i = 0; i < players_number; ++i) {
        let p;
        if (i < party_count)
            p = group_party.create(0, 0, party[i]+'_back');
        else{
          var number= Math.floor(Math.random() * monsters.length  ); // between 0 and 2
          p = group_enemy.create(0, 0, monsters[number]+'_back');
        }
        p.anchor.setTo(0.5, 1);
        p.scale.setTo(default_scale, default_scale);
        players.push(p);
    }

    first_party_char = group_party.children[0];
    last_party_char = group_party.children[party_count - 1];
    first_enemy_char = group_enemy.children[0];
    last_enemy_char = group_enemy.children[enemy_count - 1];

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
}

//active spin effect
window.spin = function(angle, easing, duration) {
    if (!spining) {
        spining = true;
        game.add.tween(camera_angle).to(
            {rad: camera_angle.rad + angle},
            duration,
            easing,
            true
        );
        game.time.events.add(duration + 50, () => {
            spining = false;
        }, this);
    }
}

function update() {
    if (cursors.left.isDown || cursors.right.isDown || spining) {
        //angle change and bg x position change
        if (!cursors.left.isDown && cursors.right.isDown && !spining) {
            camera_angle.rad -= camera_speed;
            battle_bg.x -= bg_speed
        } else if (cursors.left.isDown && !cursors.right.isDown && !spining) {
            camera_angle.rad += camera_speed;
            battle_bg.x += bg_speed
        }

        if (!spining) { //let spin effect do its work freely
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
                players[i].y = pos_y_party;
            } else {  //shift enemy players from base point
                players[i].x = pos_x_enemy + ((spacing_distance*(i-party_count) - middle_shift_enemy) + (spacing_distance >> 1)) * Math.sin(relative_angle);
                players[i].y = pos_y_enemy;
            }

            //set scale
            scale = get_scale(relative_angle);
            players[i].scale.setTo(scale, scale);

            //change texture in function of position
            if (i < party_count) {
                  if (Math.sin(relative_angle) > 0 && players[i].key != party[i]+'_back')
                      players[i].loadTexture(party[i]+'_back');
                  else if (Math.sin(relative_angle) <= 0 && players[i].key != party[i]+'_front')
                      players[i].loadTexture(party[i]+'_front');
            } else {
                if (Math.sin(relative_angle) > 0 && players[i].key != 'mino_back' ) { // by default, compare to mino sprite
                    players[i].loadTexture( players[i].key.replace('front','back') ); // -> in players: players.push (_back only)
                }
                else if (Math.sin(relative_angle) <= 0 && players[i].key != 'mino_front'){
                    players[i].loadTexture( players[i].key.replace('back','front') );
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

function ellipse(angle) { //ellipse formula
    return a*b/Math.sqrt(Math.pow(b*Math.cos(angle), 2) + Math.pow(a*Math.sin(angle), 2));
}

function get_angle(angle) { //equidistant ellipse angle formula
    return angle + Math.atan(( (b-a)*Math.tan(angle) )/( a + b*Math.pow(Math.tan(angle), 2) ));
}

function get_scale(angle) { //scale formula
    return (Math.sin(angle)/6 + 0.8334) * default_scale;
}

function resizeGame()
{
    if( currentWidth >= 1024 )
    {
        game.scale.setupScale(numbers.GAME_WIDTH*3, numbers.GAME_HEIGHT*3);
        window.dispatchEvent(new Event('resize'));
    }
    else if( currentWidth >= 480 )
    {
        game.scale.setupScale(numbers.GAME_WIDTH*2, numbers.GAME_HEIGHT*2);
        window.dispatchEvent(new Event('resize'));
    }
    else if( currentWidth >= 375 )
    {
        game.scale.setupScale(numbers.GAME_WIDTH*1.5, numbers.GAME_HEIGHT*1.5);
        window.dispatchEvent(new Event('resize'));
    }
}

function config_music(){
    music = game.add.audio('bg-battle');
    music.loopFull();
    music.volume=0.3;
    music.play();
}
