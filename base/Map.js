class Map {
	constructor(
		name,
		key_name,
		tileset_name,
		tileset_image_url,
		tileset_json_url,
		physics_json_url
	){
		this.name = name;
		this.key_name = key_name;
		this.tileset_name = tileset_name;
		this.tileset_image_url = tileset_image_url;
		this.tileset_json_url = tileset_json_url;
		this.physics_json_url = physics_json_url;
		this.sprite = null;
		this.events = {};
	}

	loadMapAssets(game){
		game.load.tilemap(this.key_name, this.tileset_json_url, null, Phaser.Tilemap.TILED_JSON);
	    game.load.image(this.key_name, this.tileset_image_url);
	    game.load.physics(this.key_name, this.physics_json_url);
	}

	setLayers(move_down_count){
		this.sprite = game.add.tilemap(this.key_name);
    	this.sprite.addTilesetImage(this.tileset_name, this.key_name);

    	for(var property in this.sprite.properties){
    		if(property.startsWith("event")){
    			var property_info = this.sprite.properties[property].split(",");
    			this.events[u([property_info[1], property_info[2]])] = {
    				type : property_info[0],
    				x : property_info[1],
    				y : property_info[2],
    				activation_direction : property_info[3]
    			}
    		}
    	}

    	var layers = this.sprite.layers.sort(function(a, b){
			if(a.properties.over != b.properties.over) return a - b;
			if(a.properties.z != b.properties.z) return a - b;
		});

	    var over_occurrence = false;
	    for(var i = 0; i < layers.length; i++){
	    	if(layers[i].properties.over != 0 && !over_occurrence)
	    		over_occurrence = true;
	    	var layer = this.sprite.createLayer(layers[i].name);
	    	layer.resizeWorld();
	    	layer.blendMode = PIXI.blendModes[layers[i].properties.blendMode];
	    	if(!over_occurrence){
	    		for(var j = 0; j < move_down_count; j++){
		    		layer.moveDown();
		    	}
	    	}
	    }
	}
}