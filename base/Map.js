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

	setLayers(underlayer_group, overlayer_group){
		this.sprite = game.add.tilemap(this.key_name);
    	this.sprite.addTilesetImage(this.tileset_name, this.key_name);

    	for(var tile_index in maps.madra.sprite.tilesets[0].tileProperties){
    		maps.madra.sprite.tilesets[0].tileProperties[tile_index].index = tile_index;
    	}

    	for(var property in this.sprite.properties){
    		if(property.startsWith("event")){
    			var property_info = this.sprite.properties[property].split(",");
    			if(property_info[0] == "stair"){
	    			this.events[u([property_info[1], property_info[2]])] = {
	    				type : property_info[0],
	    				x : property_info[1],
	    				y : property_info[2],
	    				activation_direction : property_info[3]
	    			}
	    		} else if(property_info[0] == "speed"){
	    			this.events[u([property_info[1], property_info[2]])] = {
	    				type : property_info[0],
	    				x : property_info[1],
	    				y : property_info[2],
	    				speed : parseFloat(property_info[3])
	    			}
	    		} else if(property_info[0] == "door"){
	    			this.events[u([property_info[1], property_info[2]])] = {
	    				type : property_info[0],
	    				x : parseInt(property_info[1]),
	    				y : parseInt(property_info[2]),
	    				target : property_info[3],
	    				activation_direction : property_info[4],
	    				x_target : parseFloat(property_info[5]),
	    				y_target : parseFloat(property_info[6]),
	    				avance_effect: !!parseInt(property_info[7])
	    			}
	    		}
    		}
    	}

    	var layers = this.sprite.layers.sort(function(a, b){
			if(a.properties.over != b.properties.over) return a - b;
			if(a.properties.z != b.properties.z) return a - b;
		});

	    for(var i = 0; i < layers.length; i++){
	    	var layer = this.sprite.createLayer(layers[i].name);
	    	layer.resizeWorld();
	    	layer.blendMode = PIXI.blendModes[layers[i].properties.blendMode];
	    	layer.alpha = layers[i].alpha;

	    	if(layers[i].properties.over != 0)
	    		overlayer_group.addChild(layer);
	    	else
	    		underlayer_group.addChild(layer);
	    }
	}
}