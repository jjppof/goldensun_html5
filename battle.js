var battle_bg;
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

var game = new Phaser.Game(
	width,
	height,
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
}

function create() {
	game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
	game.input.onTap.add(function(pointer, isDoubleClick) {  
		if(isDoubleClick) {    
			game.scale.startFullScreen(true);
		}  
	});

	battle_bg = game.add.tileSprite(0, 15, width, 122, 'colosso');
	battle_bg2 = game.add.tileSprite(0, 15, width, 122, 'colosso');

	spining = false;
	default_scale = 0.85;
	center_x = width/2;
	center_y = height - 30;
	a = width/2 - 30;
	b = height/30;
	camera_angle = {rad : 0};
	camera_speed = 0.009 * Math.PI;
	bg_speed = 2.4;
	party_count = 3;
	enemy_count = 3;
	players_number = party_count + enemy_count;
	spacing_distance = 35;
	middle_shift_enemy = spacing_distance*enemy_count/2;
	middle_shift_party = spacing_distance*party_count/2;

	group_enemy = game.add.group();
	group_party = game.add.group();

	for(var i = 0; i < players_number; i++){
		if(i < party_count){
			var p = group_party.create(0, 0, 'felix_back');
		} else{
			var p = group_enemy.create(0, 0, 'mino_back');
		}
		p.anchor.setTo(0.5, 1);
		p.scale.setTo(default_scale, default_scale);
		players.push(p);
	}

	first_party_char = group_party.children[0];
	last_party_char = group_party.children[party_count - 1];
	first_enemy_char = group_enemy.children[0];
	last_enemy_char = group_enemy.children[party_count - 1];

	game.input.keyboard.addKey(Phaser.Keyboard.ONE).onDown.add(function(){
		battle_bg.loadTexture('colosso');
		battle_bg2.loadTexture('colosso');
	}, this);
	game.input.keyboard.addKey(Phaser.Keyboard.TWO).onDown.add(function(){
		battle_bg.loadTexture('kolima');
		battle_bg2.loadTexture('kolima');
	}, this);
	game.input.keyboard.addKey(Phaser.Keyboard.THREE).onDown.add(function(){
		battle_bg.loadTexture('mercury');
		battle_bg2.loadTexture('mercury');
	}, this);
	game.input.keyboard.addKey(Phaser.Keyboard.FOUR).onDown.add(function(){
		battle_bg.loadTexture('desert');
		battle_bg2.loadTexture('desert');
	}, this);
	game.input.keyboard.addKey(Phaser.Keyboard.FIVE).onDown.add(function(){
		battle_bg.loadTexture('tunnel');
		battle_bg2.loadTexture('tunnel');
	}, this);
	game.input.keyboard.addKey(Phaser.Keyboard.SIX).onDown.add(function(){
		battle_bg.loadTexture('vault');
		battle_bg2.loadTexture('vault');
	}, this);
	game.input.keyboard.addKey(Phaser.Keyboard.SEVEN).onDown.add(function(){
		battle_bg.loadTexture('venus');
		battle_bg2.loadTexture('venus');
	}, this);

	cursors = game.input.keyboard.createCursorKeys();
}

function spin(angle, easing, duration){
	if(!spining){
		spining = true;
		game.add.tween(camera_angle).to( { rad: camera_angle.rad + angle }, duration, easing, true);
		game.time.events.add(duration + 50, function(){
			spining = false;
		}, this);
	}
}

function update() {
	if (cursors.left.isDown || cursors.right.isDown || spining){

		if(!cursors.left.isDown && cursors.right.isDown && !spining){
			camera_angle.rad -= camera_speed;
			battle_bg.x -= bg_speed
		} else if(cursors.left.isDown && !cursors.right.isDown && !spining){
			camera_angle.rad += camera_speed; 
			battle_bg.x += bg_speed
		}

		if(!spining){
			if(camera_angle.rad >= 2*Math.PI) camera_angle.rad -= 2*Math.PI;
			if(camera_angle.rad < 0) camera_angle.rad += 2*Math.PI;
		} else
			battle_bg.x = bg_speed * width * camera_angle.rad/(2*Math.PI);

		if(battle_bg.x > width)
			battle_bg.x -= Math.abs(Math.floor(battle_bg.x/width)) * width;
		else if(battle_bg.x < -width)
			battle_bg.x += Math.abs(Math.floor(battle_bg.x/width)) * width;

		if(battle_bg.x > 0 && battle_bg.x < width)
			battle_bg2.x = battle_bg.x - width;
		else if(battle_bg.x < 0 && battle_bg.x > -width)
			battle_bg2.x = battle_bg.x + width;

		party_angle = get_angle(camera_angle.rad);
		enemy_angle = get_angle(camera_angle.rad + Math.PI);
		var pos_x_party = center_x + ellipse(party_angle)*Math.cos(party_angle);
		var pos_y_party = center_y + ellipse(party_angle)*Math.sin(party_angle);
		var pos_x_enemy  = center_x + ellipse(enemy_angle)*Math.cos(enemy_angle);
		var pos_y_enemy  = center_y + ellipse(enemy_angle)*Math.sin(enemy_angle);

		if(Math.sin(camera_angle.rad) > 0 && game.world.getChildIndex(group_party) < game.world.getChildIndex(group_enemy))
			game.world.swapChildren(group_enemy, group_party);
		else if(Math.sin(camera_angle.rad) < 0 && game.world.getChildIndex(group_party) > game.world.getChildIndex(group_enemy))
			game.world.swapChildren(group_enemy, group_party);

		if(Math.cos(camera_angle.rad) < 0 && first_party_char.z > last_party_char.z)
			group_party.reverse();
		else if(Math.cos(camera_angle.rad) > 0 && first_party_char.z < last_party_char.z)
			group_party.reverse();

		if(Math.cos(camera_angle.rad) < 0 && first_enemy_char.z < last_enemy_char.z)
			group_enemy.reverse();
		else if(Math.cos(camera_angle.rad) > 0 && first_enemy_char.z > last_enemy_char.z)
			group_enemy.reverse();

		for(var i = 0; i < players_number; i++){
			relative_angle = i < party_count ? camera_angle.rad : camera_angle.rad + Math.PI;
			if(i < party_count){
				players[i].x = pos_x_party + ((spacing_distance*i - middle_shift_party) + (spacing_distance >> 1))*Math.sin(relative_angle);
				players[i].y = pos_y_party;
			} else{
				players[i].x = pos_x_enemy + ((spacing_distance*(i-party_count) - middle_shift_enemy) + (spacing_distance >> 1))*Math.sin(relative_angle);
				players[i].y = pos_y_enemy;
			}
			var scale = get_scale(relative_angle);
			players[i].scale.setTo(scale, scale);

			if(i < party_count){
				if(Math.sin(relative_angle) > 0 && players[i].key != 'felix_back')
					players[i].loadTexture('felix_back');
				else if(Math.sin(relative_angle) <= 0 && players[i].key != 'felix_front')
					players[i].loadTexture('felix_front');
			} else{
				if(Math.sin(relative_angle) > 0 && players[i].key != 'mino_back')
					players[i].loadTexture('mino_back');
				else if(Math.sin(relative_angle) <= 0 && players[i].key != 'mino_front')
					players[i].loadTexture('mino_front');
			}

			if(Math.cos(relative_angle) > 0 && players[i].scale.x < 0)
				players[i].scale.setTo(players[i].scale.x, players[i].scale.y);
			else if(Math.cos(relative_angle) <= 0 && players[i].scale.x > 0)
				players[i].scale.setTo(-players[i].scale.x, players[i].scale.y);
		}
	}
}

function ellipse(angle){
	return a*b/Math.sqrt(Math.pow(b*Math.cos(angle), 2) + Math.pow(a*Math.sin(angle), 2));
}

function get_angle(angle){
	return angle + Math.atan(( (b-a)*Math.tan(angle) )/( a + b*Math.pow(Math.tan(angle), 2) ));
}

function get_scale(angle){
	return (Math.sin(angle)/6 + 0.8334) * default_scale;
}