var maps = {};

function initializeMaps(){
	maps.madra = new Map(
		'Madra', //name
		'madra', //key_name
		'madra', //tileset_name
		['madra', 'madra_2'], //physics_names
		'assets/images/maps/madra/madra.png', //tileset_image_url
		'assets/images/maps/madra/madra.json', //tileset_json_url
		['assets/images/maps/madra/madra_physics.json', 'assets/images/maps/madra/madra_2_physics.json'] //physics_jsons_url
	);

	maps.madra_inn = new Map(
		'inn_down',
		'madra_inn_down',
		'Inside_town',
		['madra_inn_down'],
		'assets/images/maps/madra/Inside_town_00.png',
		'assets/images/maps/madra/inn_down.json',
		['assets/images/maps/madra/madra_physics_inn.json']
	);

	maps.madra_inn_up_stair = new Map(
		'inn_up_stair',
		'madra_inn_up_stair',
		'Inside_town',
		['madra_inn_up_stair'],
		'assets/images/maps/madra/Inside_town_00.png',
		'assets/images/maps/madra/inn_up_stair.json',
		['assets/images/maps/madra/madra_physics_inn_up_stair.json']
	);

	maps.madra_inn_up = new Map(
		'inn_up',
		'madra_inn_up',
		'Inside_town',
		['madra_inn_up'],
		'assets/images/maps/madra/Inside_town_00.png',
		'assets/images/maps/madra/inn_up.json',
		['assets/images/maps/madra/madra_physics_inn_up.json']
	);

	maps.madra_house_1 = new Map(
		'house_1',
		'madra_house_1',
		'Inside_town',
		['madra_house_1'],
		'assets/images/maps/madra/Inside_town_00.png',
		'assets/images/maps/madra/house_1.json',
		['assets/images/maps/madra/madra_physics_house_1.json']
	);
}

function loadMaps(game){
	for(var map in maps){
		maps[map].loadMapAssets(game);
	}
}