var cursors;
var hero;
var actual_action;
var actual_direction;
var climb_direction;
var x_speed;
var y_speed;
var hero_name;
var map_name;
var is_mobile;
var shadow;
var hero_tile_pos_x;
var hero_tile_pos_y;
var current_event;
var event_activation_process;
var event_timer;
var on_event;
var climbing;

var game = new Phaser.Game(
	width,	//width
	height,	//height
	Phaser.AUTO,	//renderer
	'',	//parent
	{ preload: preload, create: create, update: update },	//state
	false,	//transparent
	false	//antialias
);

function preload() {
	initializeMainChars();
	loadSpriteSheets(game);
	initializeMaps();
	loadMaps(game);

	hero_name = "isaac";
	map_name = "madra";

	game.load.image('shadow', 'assets/images/misc/shadow.png');

	is_mobile = checkMobile();

	if(is_mobile){
	    game.load.image('vjoy_base', 'assets/images/vjoy/base.png');
		game.load.image('vjoy_body', 'assets/images/vjoy/body.png');
		game.load.image('vjoy_cap', 'assets/images/vjoy/cap.png');
	}
}

var map;

function create() {
	actual_action = 'idle';
	actual_direction = 'down';

	shadow = game.add.sprite(0, 0, 'shadow');
	shadow.anchor.setTo(0.5, 0.0);
    hero = game.add.sprite(0, 0, u([hero_name, actual_action]));

    var move_down_count = 2;

    maps[map_name].setLayers(move_down_count);

	game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;

	hero.centerX = 280;
	hero.centerY = 210;
	game.camera.follow(hero);	
	main_char_list[hero_name].setAnimation(hero, actual_action);
	hero.animations.play(u([actual_action, actual_direction]));

	game.physics.startSystem(Phaser.Physics.P2JS);
	game.physics.p2.setImpactEvents(true);
	game.physics.p2.world.defaultContactMaterial.restitution = 0;
	game.physics.p2.world.defaultContactMaterial.relaxation = 5;
	game.physics.p2.world.defaultContactMaterial.friction = 0;
    game.physics.p2.world.setGlobalStiffness(1e5);
    game.physics.p2.restitution = 0;

	game.physics.p2.enable(hero, false);
	hero.body.clearShapes();
	hero.body.setCircle(7, 0, 0);
	heroCollisionGroup = game.physics.p2.createCollisionGroup();
	hero.body.setCollisionGroup(heroCollisionGroup);
	hero.body.mass = 0.1;
	hero.body.setZeroDamping();
	hero.body.setZeroRotation();

	map_collider = game.add.sprite(0, 0);
	game.physics.p2.enable(map_collider, false);
	map_collider.body.clearShapes();
    map_collider.body.loadPolygon(maps[map_name].key_name, maps[map_name].key_name);
	mapCollisionGroup = game.physics.p2.createCollisionGroup();
	map_collider.body.setCollisionGroup(mapCollisionGroup);
	map_collider.body.setZeroDamping();
	map_collider.body.setZeroRotation();
	
	hero.body.collides(mapCollisionGroup);
	map_collider.body.collides(heroCollisionGroup);
	hero.body.fixedRotation = true;
	hero.anchor.y = 0.8;

	game.physics.p2.updateBoundsCollisionGroup();

	event_activation_process = false;
	on_event = false;
	climbing = false;

	game.input.keyboard.addKey(Phaser.Keyboard.D).onDown.add(function(){
		hero.body.debug = !hero.body.debug;
		map_collider.body.debug = !map_collider.body.debug; 
	}, this);

	game.input.onTap.add(function(pointer, isDoubleClick) {  
		if(isDoubleClick) {    
			game.scale.startFullScreen(true);
		}  
	});

	if(is_mobile){
		game.vjoy = game.plugins.add(Phaser.Plugin.VJoy);
		game.vjoy.inputEnable();
		cursors = game.vjoy.cursors;
	} else
		cursors = game.input.keyboard.createCursorKeys();
}

function fireEvent(){
	if(event_activation_process){
		if(current_event.type == "stair" && !climbing){
			if(current_event.activation_direction == "down"){
				on_event = true;
				event_activation_process = false;
				hero.loadTexture(u([hero_name, "climb"]));
		    	main_char_list[hero_name].setAnimation(hero, "climb");
		    	hero.animations.play(u(["climb", "start"]), 9, false, true);
		    } else if(current_event.activation_direction == "up"){
		    	on_event = true;
				event_activation_process = false;
				hero.loadTexture(u([hero_name, "climb"]));
	    		main_char_list[hero_name].setAnimation(hero, "climb");
	    		hero.animations.play(u(["climb", "idle"]));
	    		var out_time = Phaser.Timer.QUARTER/2;
				game.add.tween(hero.body).to( { y: hero.y - 15 }, out_time, Phaser.Easing.Bounce.In, true);
				game.time.events.add(out_time + 50, function(){
					on_event = false;
	    			climbing = true;
	    			current_event = null;
				}, this);
	    		shadow.visible = false;
	    		actual_action = "climb";
	    		actual_direction = "idle";
		    }
		} else if(current_event.type == "stair" && climbing){
			if(current_event.activation_direction == "up"){
				on_event = true;
				event_activation_process = false;
				hero.animations.play(u(["climb", "end"]), 9, false, true);
				shadow.visible = false;
				game.add.tween(hero.body).to( { y: hero.y - 25 }, Phaser.Timer.HALF, Phaser.Easing.Linear.None, true);
			} else if(current_event.activation_direction == "down"){
				on_event = true;
				event_activation_process = false;
				hero.loadTexture(u([hero_name, "idle"]));
	    		main_char_list[hero_name].setAnimation(hero, "idle");
	    		hero.animations.play(u(["idle", "up"]));
	    		var out_time = Phaser.Timer.QUARTER/2;
				game.add.tween(hero.body).to( { y: hero.y + 15 }, out_time, Phaser.Easing.Bounce.In, true);
				game.time.events.add(out_time + 50, function(){
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
}

function update() {
	if(!on_event) {
		hero_tile_pos_x = Math.floor(hero.x/maps.madra.sprite.tileWidth);
		hero_tile_pos_y = Math.floor(hero.y/maps.madra.sprite.tileHeight);

		if(u([hero_tile_pos_x, hero_tile_pos_y]) in maps.madra.events){
			current_event = maps.madra.events[u([hero_tile_pos_x, hero_tile_pos_y])];
			if(!climbing){
				if(!event_activation_process && actual_direction == current_event.activation_direction && (actual_action == "walk" || actual_action == "dash")){
					event_activation_process = true;
					event_timer = game.time.events.add(Phaser.Timer.HALF, fireEvent, this);
				} else if(event_activation_process && (actual_direction != current_event.activation_direction ||  actual_action == "idle"))
					event_activation_process = false;
			} else {
				if(!event_activation_process && climb_direction == current_event.activation_direction && (actual_direction == "climb")){
					event_activation_process = true;
					event_timer = game.time.events.add(Phaser.Timer.HALF, fireEvent, this);
				} else if(event_activation_process && (climb_direction != current_event.activation_direction ||  actual_direction == "idle"))
					event_activation_process = false;
			}
		}

		if(!climbing){
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
				x_speed = -1/Math.sqrt(2);
				y_speed = -1/Math.sqrt(2);
		    } else if (cursors.up.isDown && !cursors.left.isDown && cursors.right.isDown && !cursors.down.isDown && actual_direction != "up_right"){
				actual_direction = getTransitionDirection(actual_direction, "up_right");
				x_speed = 1/Math.sqrt(2);
				y_speed = -1/Math.sqrt(2);
			} else if (!cursors.up.isDown && cursors.left.isDown && !cursors.right.isDown && cursors.down.isDown && actual_direction != "down_left"){
				actual_direction = getTransitionDirection(actual_direction, "down_left");
				x_speed = -1/Math.sqrt(2);
				y_speed = 1/Math.sqrt(2);
			} else if (!cursors.up.isDown && !cursors.left.isDown && cursors.right.isDown && cursors.down.isDown && actual_direction != "down_right"){
				actual_direction = getTransitionDirection(actual_direction, "down_right");
				x_speed = 1/Math.sqrt(2);
				y_speed = 1/Math.sqrt(2);
			}
		} else {
			if (!cursors.up.isDown && cursors.down.isDown){
				x_speed = 0;
				y_speed = 1;
				climb_direction = "down";
			} else if (cursors.up.isDown && !cursors.down.isDown){
				x_speed = 0;
				y_speed = -1;
				climb_direction = "up";
			} else if (!cursors.up.isDown && !cursors.down.isDown){
				x_speed = 0;
				y_speed = 0;
				climb_direction = "idle";
			}
		}
		
		if(!cursors.up.isDown && !cursors.left.isDown && !cursors.right.isDown && !cursors.down.isDown && actual_action != "idle" && !climbing)
			actual_action = "idle";
		else if(!cursors.up.isDown && !cursors.left.isDown && !cursors.right.isDown && !cursors.down.isDown && actual_direction != "idle" && climbing)
			actual_direction = "idle";
		else if((cursors.up.isDown || cursors.left.isDown || cursors.right.isDown || cursors.down.isDown) && actual_direction != "climb" && climbing)
			actual_direction = "climb";
		else if((cursors.up.isDown || cursors.left.isDown || cursors.right.isDown || cursors.down.isDown) && (actual_action != "walk" || actual_action != "dash") && !climbing){
			if (game.input.keyboard.isDown(Phaser.Keyboard.SHIFT) && actual_action != "dash")
				actual_action = "dash";
			else if (!game.input.keyboard.isDown(Phaser.Keyboard.SHIFT) && actual_action != "walk")
				actual_action = "walk";
		}

		if(actual_action == "dash") {
			hero.body.velocity.x = x_speed * main_char_list[hero_name].dash_speed;
			hero.body.velocity.y = y_speed * main_char_list[hero_name].dash_speed;
		} else if(actual_action == "walk") {
			hero.body.velocity.x = x_speed * main_char_list[hero_name].walk_speed;
			hero.body.velocity.y = y_speed * main_char_list[hero_name].walk_speed;
		} else if(actual_action == "climb") {
			hero.body.velocity.x = x_speed * main_char_list[hero_name].climb_speed;
			hero.body.velocity.y = y_speed * main_char_list[hero_name].climb_speed;
		} else if(actual_action == "idle")
			hero.body.velocity.y = hero.body.velocity.x = 0;

		if(hero.key != u([hero_name, actual_action])){
	    	hero.loadTexture(u([hero_name, actual_action]));
	    	main_char_list[hero_name].setAnimation(hero, actual_action);
	    }

	    if(hero.animations.currentAnim.name != u([actual_action, actual_direction]))
	    	hero.animations.play(u([actual_action, actual_direction]));

	    for (var i=0; i < game.physics.p2.world.narrowphase.contactEquations.length; i++){
	        var c = game.physics.p2.world.narrowphase.contactEquations[i];
	        if (c.bodyA === hero.body.data){
	        	if(c.contactPointA[0] >= 0.25 && actual_direction == "left")
	        		hero.body.velocity.x = 0;
	        	if(c.contactPointA[0] <= -0.25 && actual_direction == "right")
	        		hero.body.velocity.x = 0;
	        	if(c.contactPointA[1] <= -0.25 && actual_direction == "down")
	        		hero.body.velocity.y = 0;
	        	if(c.contactPointA[1] >= 0.25 && actual_direction == "up")
	        		hero.body.velocity.y = 0;
	        	break;
	        }
	    }

	    if(shadow.x != hero.x)
	    	shadow.x = hero.x;
	    if(shadow.y != hero.y)
	    	shadow.y = hero.y;
	} else{
		if(current_event.type == "stair"){
			if(hero.animations.frameName == "climb/start/03"){
				shadow.visible = false;
				game.add.tween(hero.body).to( { y: hero.y + 25 }, 500, Phaser.Easing.Linear.None, true);
			} else if(hero.animations.frameName == "climb/start/06"){
	    		hero.animations.play(u(["climb", "idle"]), 9);
	    		on_event = false;
	    		climbing = true;
	    		actual_action = "climb";
	    		current_event = null;
			} else if(hero.animations.frameName == "climb/end/02"){
				hero.loadTexture(u([hero_name, "idle"]));
	    		main_char_list[hero_name].setAnimation(hero, "idle");
	    		hero.animations.play(u(["idle", "up"]));
	    		shadow.y = hero.y;
	    		shadow.visible = true;
	    		on_event = false;
	    		climbing = false;
	    		actual_action = "idle";
	    		actual_direction = "up";
	    		current_event = null;
			} 
		}
		hero.body.velocity.y = hero.body.velocity.x = 0;
	}
	
}

function getTransitionDirection(actual_direction, desired_direction){
	return transitions[desired_direction][actual_direction];
}