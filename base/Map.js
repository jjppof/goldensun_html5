class Map {
    constructor (
        name,
        key_name,
        tileset_name,
        physics_names,
        tileset_image_url,
        tileset_json_url,
        physics_jsons_url
    ) {
        this.name = name;
        this.key_name = key_name;
        this.tileset_name = tileset_name;
        this.physics_names = physics_names;
        this.tileset_image_url = tileset_image_url;
        this.tileset_json_url = tileset_json_url;
        this.physics_jsons_url = physics_jsons_url;
        this.sprite = null;
        this.events = {};
    }

    loadMapAssets(game) {
        game.load.tilemap(this.key_name, this.tileset_json_url, null, Phaser.Tilemap.TILED_JSON);
        game.load.image(this.key_name, this.tileset_image_url);
        for (let i = 0; i < this.physics_names.length; i++) {
            game.load.physics(this.physics_names[i], this.physics_jsons_url[i]);
        }
    }

    setLayers (underlayer_group, overlayer_group, collider_layer) {
        this.sprite = game.add.tilemap(this.key_name);
        this.sprite.addTilesetImage(this.tileset_name, this.key_name);

        for (let tile_index in maps.madra.sprite.tilesets[0].tileProperties) {
            maps.madra.sprite.tilesets[0].tileProperties[tile_index].index = tile_index;
        }

        for (let property in this.sprite.properties) {
            if (property.startsWith("event")) { //check for events
                const property_info = this.sprite.properties[property].split(",");
                if (property_info[0] == "stair") {
                    this.events[u([property_info[1], property_info[2]])] = {
                        type : property_info[0],
                        x : property_info[1],
                        y : property_info[2],
                        activation_direction : property_info[3]
                    }
                } else if (property_info[0] == "speed") {
                    this.events[u([property_info[1], property_info[2]])] = {
                        type : property_info[0],
                        x : property_info[1],
                        y : property_info[2],
                        speed : parseFloat(property_info[3])
                    }
                } else if (property_info[0] == "door") {
                    this.events[u([property_info[1], property_info[2]])] = {
                        type : property_info[0],
                        x : parseInt(property_info[1]),
                        y : parseInt(property_info[2]),
                        target : property_info[3],
                        activation_direction : property_info[4],
                        x_target : parseFloat(property_info[5]),
                        y_target : parseFloat(property_info[6]),
                        avance_effect: !!parseInt(property_info[7]),
                        collider_layer: property_info.length == 9 ? parseInt(property_info[8]) : 0
                    }
                } else if (property_info[0] == "jump") {
                    this.events[u([property_info[1], property_info[2]])] = {
                        type : property_info[0],
                        x : property_info[1],
                        y : property_info[2],
                        activation_direction : property_info[3],
                        collider_layer : property_info.length == 5 ? parseInt(property_info[4]) : 0
                    }
                } 
            }
        }

        const layers = this.sprite.layers.sort(function(a, b) {
            if (a.properties.over != b.properties.over) return a - b;
            if (a.properties.z != b.properties.z) return a - b;
        });

        for (let i = 0; i < layers.length; i++) {
            let layer = this.sprite.createLayer(layers[i].name);
            layer.resizeWorld();
            layer.blendMode = PIXI.blendModes[layers[i].properties.blendMode];
            layer.alpha = layers[i].alpha;

            let is_over = layers[i].properties.over.toString().split(",");
            is_over = is_over.length > collider_layer ? parseInt(is_over[collider_layer]) : parseInt(is_over[0]);
            if (is_over != 0)
                overlayer_group.add(layer);
            else
                underlayer_group.add(layer);
        }
    }
}