main_char_list = {};

function initializeMainChars(){
	main_char_list.isaac = new MainChar(
		'isaac',
		['idle', 'walk', 'dash', 'climb'],
		60,
		85,
		50
	);
	main_char_list.isaac.setActionSpritesheet('idle', 'assets/images/spritesheets/isaac_idle.png', 'assets/images/spritesheets/isaac_idle.json');
	main_char_list.isaac.setActionDirections('idle', [
		'down', 
		'up', 
		'left', 
		'right', 
		'down_left', 
		'down_right', 
		'up_left', 
		'up_right'
	], [5,5,5,5,5,5,5,5]);
	main_char_list.isaac.setActionFrameRate('idle', 1);

	main_char_list.isaac.setActionSpritesheet('walk', 'assets/images/spritesheets/isaac_walk.png', 'assets/images/spritesheets/isaac_walk.json');
	main_char_list.isaac.setActionDirections('walk', [
		'down', 
		'up', 
		'left', 
		'right', 
		'down_left', 
		'down_right', 
		'up_left', 
		'up_right'
	], [5,5,5,5,5,5,5,5]);
	main_char_list.isaac.setActionFrameRate('walk', 7);

	main_char_list.isaac.setActionSpritesheet('dash', 'assets/images/spritesheets/isaac_dash.png', 'assets/images/spritesheets/isaac_dash.json');
	main_char_list.isaac.setActionDirections('dash', [
		'down', 
		'up', 
		'left', 
		'right', 
		'down_left', 
		'down_right', 
		'up_left', 
		'up_right'
	], [5,5,5,5,5,5,5,5]);
	main_char_list.isaac.setActionFrameRate('dash', 9);

	main_char_list.isaac.setActionSpritesheet('climb', 'assets/images/spritesheets/isaac_climb.png', 'assets/images/spritesheets/isaac_climb.json');
	main_char_list.isaac.setActionDirections('climb', [
		'climb', 
		'end', 
		'idle', 
		'start'
	], [3,2,0,6]);
	main_char_list.isaac.setActionFrameRate('climb', 6);

	addAnimations();
}

function addAnimations(){
	for(var action in main_char_list.isaac.actions){
		directions = main_char_list.isaac.actions[action].directions;
		frame_counts = main_char_list.isaac.actions[action].frame_counts;
		for(var key in directions){
			direction = directions[key];
			main_char_list.isaac.addAnimation(action, direction, 0, frame_counts[key], '', 2);
		}
	}
}

function loadSpriteSheets(game){
	for(var char in main_char_list){
		main_char_list[char].loadSpritesheets(game);
	}
}