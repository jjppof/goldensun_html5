var maps = {};

function initializeMaps(){
	maps.madra = new Map(
		'Madra',
		'madra',
		'madra',
		'assets/images/maps/madra/madra.png',
		'assets/images/maps/madra/madra.json',
		'assets/images/maps/madra/madra_physics.json'
	);

	maps.madra_inn = new Map(
		'inn_down',
		'madra_inn_down',
		'Inside_town',
		'assets/images/maps/madra/Inside_town_00.png',
		'assets/images/maps/madra/inn_down.json',
		'assets/images/maps/madra/madra_physics_inn.json'
	);
}

function loadMaps(game){
	for(var map in maps){
		maps[map].loadMapAssets(game);
	}
}