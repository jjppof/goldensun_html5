/**
* @author       Richard Davey <rich@photonstorm.com>
* @author       Pete Baron <pete@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link http://choosealicense.com/licenses/no-license/|No License}
* @version      1.0.0 - October 7th 2015
*/

/**
* @namespace Phaser
*/

/**
* An instance of a Particle Storm Plugin.
* 
* This class is responsible for updating and managing all active emitters created by this plugin.
*
* Add it to your game via the Phaser Plugin Manager:
*
* `this.manager = this.game.plugins.add(Phaser.ParticleStorm);`
*
* You only need one instance of this plugin installed. It can create multiple emitters, each
* capable of controlling their own sets of particles.
*
* The plugin is not a display object itself, you cannot add it to the display list or position it.
*
* @class Phaser.ParticleStorm
* @constructor
* @param {Phaser.Game} game - A reference to the current Phaser.Game instance.
* @param {Phaser.PluginManager} parent - The Phaser Plugin Manager which looks after this plugin.
*/
Phaser.ParticleStorm = function (game, parent) {

    Phaser.Plugin.call(this, game, parent);

    /**
    * An array of Emitter objects.
    * 
    * @property {array} emitters
    * @protected
    */
    this.emitters = [];

    /**
    * An object containing references or copies of all the Particle data that has been added via `addData` and `cloneData`.
    * 
    * Clear this list by calling `clearData()`.
    * 
    * @property {object} dataList
    * @protected
    */
    this.dataList = {};

    var useNew = PIXI.canUseNewCanvasBlendModes();

    /**
    * A local helper object which stores blend mode string to blend mode mappings.
    * 
    * @property {object} blendModeMap
    * @protected
    */
    this.blendModeMap = {
        "NORMAL": [0, 'source-over'],
        "ADD": [1, 'lighter'],
        "MULTIPLY": [2 , (useNew) ? 'multiply' : 'source-over'],
        "SCREEN": [3, (useNew) ? 'screen' : 'source-over'],
        "OVERLAY": [4, (useNew) ? 'overlay' : 'source-over'],
        "DARKEN": [5, (useNew) ? 'darken' : 'source-over'],
        "LIGHTEN": [6, (useNew) ? 'lighten' : 'source-over'],
        "COLOR_DODGE": [7, (useNew) ? 'color-dodge' : 'source-over'],
        "COLOR_BURN": [8, (useNew) ? 'color-burn' : 'source-over'],
        "HARD_LIGHT": [9, (useNew) ? 'hard-light' : 'source-over'],
        "SOFT_LIGHT": [10, (useNew) ? 'soft-light' : 'source-over'],
        "DIFFERENCE": [11, (useNew) ? 'difference' : 'source-over'],
        "EXCLUSION": [12, (useNew) ? 'exclusion' : 'source-over'],
        "HUE": [13, (useNew) ? 'hue' : 'source-over'],
        "SATURATION": [14, (useNew) ? 'saturation' : 'source-over'],
        "COLOR": [15, (useNew) ? 'color' : 'source-over'],
        "LUMINOSITY": [16, (useNew) ? 'luminosity' : 'source-over']
    };

    /**
    * A local helper object which stores HSV color modes for emitter renderers to use.
    * 
    * @property {array} hsv
    * @protected
    */
    this.hsv = Phaser.Color.HSVColorWheel();

};

Phaser.ParticleStorm.prototype = Object.create(Phaser.Plugin.prototype);
Phaser.ParticleStorm.prototype.constructor = Phaser.ParticleStorm;

/**
* A constant used for the Sprite Renderer.
* @constant
* @type {string}
*/
Phaser.ParticleStorm.SPRITE = 'sprite';

/**
* A constant used for the BitmapData based Pixel Renderer.
* @constant
* @type {string}
*/
Phaser.ParticleStorm.PIXEL = 'pixel';

/**
* A constant used for the Render Texture based Renderer.
* @constant
* @type {string}
*/
Phaser.ParticleStorm.RENDERTEXTURE = 'render texture';

/**
* A constant used for the Sprite Batch based Renderer.
* @constant
* @type {string}
*/
Phaser.ParticleStorm.SPRITE_BATCH = 'sprite batch';

/**
* A constant used for the Bitmap Data based Renderer.
* @constant
* @type {string}
*/
Phaser.ParticleStorm.BITMAP_DATA = 'bitmap data';

/**
* A constant that contains the base object properties.
* @constant
* @type {object}
*/
Phaser.ParticleStorm.BASE = { value: 0, initial: 0, delta: 0, offset: 0, control: null, calc: 0 };

/**
* A constant that contains the base 1 object properties.
* @constant
* @type {object}
*/
Phaser.ParticleStorm.BASE_1 = { value: 1, initial: 0, delta: 0, offset: 0, control: null, calc: 1 };

/**
* A constant that contains the base 255 object properties.
* @constant
* @type {object}
*/
Phaser.ParticleStorm.BASE_255 = { value: 0, initial: 0, delta: 0, offset: 0, min: 0, max: 255, control: null, calc: 0 };

/**
* A constant that contains the base 359 object properties.
* @constant
* @type {object}
*/
Phaser.ParticleStorm.BASE_359 = { value: 0, initial: 0, delta: 0, offset: 0, min: 0, max: 359, control: null, calc: 0 };

/**
* A constant that contains the null base object properties.
* @constant
* @type {object}
*/
Phaser.ParticleStorm.BASE_NULL = { value: null, initial: 0, delta: 0, offset: 0, control: null, calc: 0 };

/**
* A constant that contains the base object used by the emit property.
* @constant
* @type {object}
*/
Phaser.ParticleStorm.BASE_EMIT = { name: null, value: 0, initial: 0, control: null, at: null, inherit: true, offsetX: 0, offsetY: 0 };

Phaser.ParticleStorm.Controls = {};

Phaser.ParticleStorm.Zones = {};

Phaser.ParticleStorm.PI_180 = Math.PI / 180.0;

Phaser.ParticleStorm.FPS_MULT = 60 / 1000;

/**
* Creates a new Particle Emitter. You can specify the type of renderer the emitter will use. By default it uses
* the Sprite emitter, meaning each particle it creates is its own sprite object.
*
* `this.manager = this.game.plugins.add(Phaser.ParticleStorm);`
* `this.emitter = this.manager.createEmitter();`
* 
* The emitter is added to the ParticleStorm.emitters array and is updated every frame.
*
* @method Phaser.ParticleStorm#createEmitter
* @param {Phaser.ParticleStorm.SPRITE|Phaser.ParticleStorm.PIXEL|Phaser.ParticleStorm.RENDERTEXTURE|Phaser.ParticleStorm.SPRITE_BATCH} [renderType=Phaser.ParticleStorm.SPRITE] - The Particle Renderer type constant.
* @param {Phaser.Point} [force] - Amount of force to be applied to all particles every update.
* @param {Phaser.Point} [scrollSpeed] - All particles can be scrolled. This offsets their positions by the amount in this Point each update.
*     This is different to force which is applied as a velocity on the particle, where-as scrollSpeed directly adjusts their final position.
* @return {Phaser.ParticleStorm.Emitter} The Emitter object.
*/
Phaser.ParticleStorm.prototype.createEmitter = function (renderType, force, scrollSpeed, render_white_core = false, core_custom_color = null, core_size_factor = 1, transforms = null) {

    var emitter = new Phaser.ParticleStorm.Emitter(this, renderType, force, scrollSpeed, render_white_core, core_custom_color, core_size_factor, transforms);

    this.emitters.push(emitter);

    return emitter;

};

/**
* Removes the given Particle Emitter from the plugin. Stops it from being updated.
*
* Note that this does not destroy the emitter, or any objects it may in turn have created.
*
* @method Phaser.ParticleStorm#removeEmitter
* @param {Phaser.ParticleStorm.Emitter} emitter - The Emitter object you wish to remove.
*/
Phaser.ParticleStorm.prototype.removeEmitter = function (emitter) {

    for (var i = 0; i < this.emitters.length; i++)
    {
        if (this.emitters[i] === emitter)
        {
            this.emitters.splice(i, 1);
            return;
        }
    }

};

/**
* Particle Storm works by taking a specially formatted JavaScript object that contains all of the settings the
* emitter needs to emit a particle. The settings objects each have a unique string-based key and are stored
* within the plugin itself, making them available for any Emitter to access.
*
* You can either pass in a JavaScript object to this method, or a string. If you pass a string it will use that
* to look in the Phaser.Cache for a matching JSON object and use that instead, allowing you to externally load
* particle data rather than create it all at run-time. If you are loading JSON data from the cache then you can
* also provide an array of strings, and it will load each of them in turn. Note that when doing this the `obj`
* argument is ignored.
*
* @method Phaser.ParticleStorm#addData
* @param {string|array} key - The unique key for this set of particle data. If no `obj` argument is provided it will use
*     Phaser.Cache.getJSON to try and get a matching entry. Can be either a string or an Array of strings.
*     When using an array of strings the `obj` argument is ignored.
* @param {object} [obj] - The particle data. This is optional and if not provided the `key` argument will be used to look
*     for the data in the Phaser.Cache. If provided it will be used instead of looking in the Cache.
*     This should be a well formed object matching the ParticleStorm object structure.
*     A reference to the object is stored internally, so if you manipulate the original object all freshly emitted particles
*     will use the new values. To avoid this you can use `ParticleStorm.cloneData` instead.
* @return {Phaser.ParticleStorm} This ParticleManager.
*/
Phaser.ParticleStorm.prototype.addData = function (key, obj) {

    if (key === undefined)
    {
        return this;
    }

    if (Array.isArray(key))
    {
        for (var i = 0; i < key.length; i++)
        {
            this.dataList[key[i]] = this.game.cache.getJSON(key[i]);
        }
    }
    else
    {
        if (obj !== undefined)
        {
            this.dataList[key] = obj;
        }
        else
        {
            this.dataList[key] = this.game.cache.getJSON(key);
        }
    }

    return this;

};

/**
* Gets the particle data based on the given key.
*
* @method Phaser.ParticleStorm#getData
* @memberOf Phaser.ParticleStorm
* @param {string} [key] - The unique key of the particle data that was added.
* @return {object} The particle data.
*/
Phaser.ParticleStorm.prototype.getData = function (key) {

    return this.dataList[key];

};

/**
* Clears particle data sets from memory.
* 
* You can provide a specific key, or array of keys to remove.
* 
* If no key is provided it will remove all data sets currently held.
*
* @method Phaser.ParticleStorm#clearData
* @memberOf Phaser.ParticleStorm
* @param {string|array} [key] - A string or array of strings that map to the data to be removed. If not provided all data sets are removed.
* @return {Phaser.ParticleStorm} This ParticleManager.
*/
Phaser.ParticleStorm.prototype.clearData = function (key) {

    if (key === undefined)
    {
        //  Nuke them all
        this.dataList = {};
    }
    else
    {
        if (Array.isArray(key))
        {
            for (var i = 0; i < key.length; i++)
            {
                delete this.dataList[key[i]];
            }
        }
        else
        {
            delete this.dataList[key];
        }
    }

    return this;

};

/**
* This method works in exactly the same way as ParticleStorm.addData, with the exception that clones of
* the particle data objects are stored internally, instead of references to the original objects.
* 
* @method Phaser.ParticleStorm#cloneData
* @memberOf Phaser.ParticleStorm
* @param {string|array} key - The unique key for this set of particle data. If no `obj` argument is provided it will use
*     Phaser.Cache.getJSON to try and get a matching entry. Can be either a string or an Array of strings.
*     When using an array of strings the `obj` argument is ignored.
* @param {object} [obj] - The particle data. This is optional and if not provided the `key` argument will be used to look
*     for the data in the Phaser.Cache. If provided it will be used instead of looking in the Cache.
*     This should be a well formed object matching the ParticleStorm object structure.
*     The settings object, whether from the Cache or given as an argument, is cloned before being stored locally.
*     If you wish to add a reference to an object instead of cloning it then see `addData`.
* @return {Phaser.ParticleStorm} This ParticleManager.
*/
Phaser.ParticleStorm.prototype.cloneData = function (key, obj) {

    if (key === undefined)
    {
        return this;
    }

    if (Array.isArray(key))
    {
        for (var i = 0; i < key.length; i++)
        {
            this.dataList[key[i]] = Phaser.Utils.extend(true, this.game.cache.getJSON(key[i]));
        }
    }
    else
    {
        if (obj !== undefined)
        {
            this.dataList[key] = Phaser.Utils.extend(true, obj);
        }
        else
        {
            this.dataList[key] = Phaser.Utils.extend(true, this.game.cache.getJSON(key));
        }
    }

    return this;

};

/**
* Zones allow you to define an area within which particles can be emitted.
*
* This method creates a Point Zone. This is a zone consisting of a single coordinate from which particles
* are emitted.
*
* All zones extend Phaser.ParticleStorm.Zones.Base, which you can use to create your own custom
* zones if required.
* 
* @method Phaser.ParticleStorm#createPointZone
* @memberOf Phaser.ParticleStorm
* @param {number} [x=0] - The x coordinate of the zone.
* @param {number} [y=0] - The y coordinate of the zone.
* @return {Phaser.ParticleStorm.Zones.Point} The zone that was created.
*/
Phaser.ParticleStorm.prototype.createPointZone = function (x, y) {

    return new Phaser.ParticleStorm.Zones.Point(this.game, x, y);

};

/**
* Zones allow you to define an area within which particles can be emitted.
*
* This method creates a Line Zone. This is a zone consisting of two sets of points, the start
* and end of the line respectively. Particles can be emitted from anywhere on this line segment.
*
* All zones extend Phaser.ParticleStorm.Zones.Base, which you can use to create your own custom
* zones if required.
* 
* @method Phaser.ParticleStorm#createLineZone
* @memberOf Phaser.ParticleStorm
* @param {number} [x1=0] - The x coordinate of the start of the line.
* @param {number} [y1=0] - The y coordinate of the start of the line.
* @param {number} [x2=0] - The x coordinate of the end of the line.
* @param {number} [y2=0] - The y coordinate of the end of the line.
* @return {Phaser.ParticleStorm.Zones.Line} The zone that was created.
*/
Phaser.ParticleStorm.prototype.createLineZone = function (x1, y1, x2, y2) {

    return new Phaser.ParticleStorm.Zones.Line(this.game, x1, y1, x2, y2);

};

/**
* Zones allow you to define an area within which particles can be emitted.
*
* This method creates a Rectangle Zone. This is a zone consisting of a rectangle shape.
* Particles can be emitted from anywhere within this rectangle.
*
* All zones extend Phaser.ParticleStorm.Zones.Base, which you can use to create your own custom
* zones if required.
* 
* @method Phaser.ParticleStorm#createRectangleZone
* @memberOf Phaser.ParticleStorm
* @param {number} [width=0] - The width of the Rectangle. Should always be a positive value.
* @param {number} [height=0] - The height of the Rectangle. Should always be a positive value.
* @return {Phaser.ParticleStorm.Zones.Rectangle} The zone that was created.
*/
Phaser.ParticleStorm.prototype.createRectangleZone = function (width, height) {

    return new Phaser.ParticleStorm.Zones.Rectangle(this.game, width, height);

};

/**
* Zones allow you to define an area within which particles can be emitted.
*
* This method creates a Circle Zone. This is a zone consisting of a circle shape.
* Particles can be emitted from anywhere within this circle.
*
* All zones extend Phaser.ParticleStorm.Zones.Base, which you can use to create your own custom
* zones if required.
* 
* @method Phaser.ParticleStorm#createCircleZone
* @memberOf Phaser.ParticleStorm
* @param {number} [radius=0] - The radius of the circle.
* @return {Phaser.ParticleStorm.Zones.Circle} The zone that was created.
*/
Phaser.ParticleStorm.prototype.createCircleZone = function (radius) {

    return new Phaser.ParticleStorm.Zones.Circle(this.game, radius);

};

/**
* Zones allow you to define an area within which particles can be emitted.
*
* This method creates a Ellipse Zone. This is a zone consisting of an ellipse shape.
* Particles can be emitted from anywhere within this ellipse.
*
* All zones extend Phaser.ParticleStorm.Zones.Base, which you can use to create your own custom
* zones if required.
* 
* @method Phaser.ParticleStorm#createEllipseZone
* @memberOf Phaser.ParticleStorm
* @param {number} [width=0] - The overall width of this ellipse.
* @param {number} [height=0] - The overall height of this ellipse.
* @return {Phaser.ParticleStorm.Zones.Ellipse} The zone that was created.
*/
Phaser.ParticleStorm.prototype.createEllipseZone = function (width, height) {

    return new Phaser.ParticleStorm.Zones.Ellipse(this.game, width, height);

};

/**
* Zones allow you to define an area within which particles can be emitted.
*
* This method creates a Linear Spline Zone. A Linear Spline consists of a set of points through
* which a linear path is constructed. Particles can be emitted anywhere along this path.
* 
* The points can be set from a variety of formats:
*
* - An array of Point objects: `[new Phaser.Point(x1, y1), ...]`
* - An array of objects with public x/y properties: `[ { x: 0, y: 0 }, ...]`
* - An array of objects with public x/y properties: `[obj1, obj2, ...]`
*
* All zones extend Phaser.ParticleStorm.Zones.Base, which you can use to create your own custom
* zones if required.
* 
* @method Phaser.ParticleStorm#createLinearSplineZone
* @memberOf Phaser.ParticleStorm
* @param {number} [resolution=1000] - The resolution of the spline. Higher values generate more points during path interpolation.
* @param {boolean} [closed=true] - A closed path loops from the final point back to the start again.
* @param {Phaser.Point[]|number[]|...Phaser.Point|...number} points - An array of points to use for the spline.
*        These can also be set later via `ParticleStorm.Zones.Spline.setTo`.
* @return {Phaser.ParticleStorm.Zones.Spline} The zone that was created.
*/
Phaser.ParticleStorm.prototype.createLinearSplineZone = function (resolution, closed, points) {

    return new Phaser.ParticleStorm.Zones.Spline(this.game, 0, resolution, closed, points);

};

/**
* Zones allow you to define an area within which particles can be emitted.
*
* This method creates a Bezier Spline Zone. A Bezier Spline consists of a set of points through
* which a bezier curved path is constructed. Particles can be emitted anywhere along this path.
* 
* The points can be set from a variety of formats:
*
* - An array of Point objects: `[new Phaser.Point(x1, y1), ...]`
* - An array of objects with public x/y properties: `[ { x: 0, y: 0 }, ...]`
* - An array of objects with public x/y properties: `[obj1, obj2, ...]`
*
* All zones extend Phaser.ParticleStorm.Zones.Base, which you can use to create your own custom
* zones if required.
* 
* @method Phaser.ParticleStorm#createBezierSplineZone
* @memberOf Phaser.ParticleStorm
* @param {number} [resolution=1000] - The resolution of the spline. Higher values generate more points during path interpolation.
* @param {boolean} [closed=true] - A closed path loops from the final point back to the start again.
* @param {Phaser.Point[]|number[]|...Phaser.Point|...number} points - An array of points to use for the spline.
*        These can also be set later via `ParticleStorm.Zones.Spline.setTo`.
* @return {Phaser.ParticleStorm.Zones.Spline} The zone that was created.
*/
Phaser.ParticleStorm.prototype.createBezierSplineZone = function (resolution, closed, points) {

    return new Phaser.ParticleStorm.Zones.Spline(this.game, 1, resolution, closed, points);

};

/**
* Zones allow you to define an area within which particles can be emitted.
*
* This method creates a Catmull Rom Spline Zone. A Catmull Spline consists of a set of points through
* which a catmull curved path is constructed. Particles can be emitted anywhere along this path.
* 
* The points can be set from a variety of formats:
*
* - An array of Point objects: `[new Phaser.Point(x1, y1), ...]`
* - An array of objects with public x/y properties: `[ { x: 0, y: 0 }, ...]`
* - An array of objects with public x/y properties: `[obj1, obj2, ...]`
*
* All zones extend Phaser.ParticleStorm.Zones.Base, which you can use to create your own custom
* zones if required.
* 
* @method Phaser.ParticleStorm#createCatmullSplineZone
* @memberOf Phaser.ParticleStorm
* @param {number} [resolution=1000] - The resolution of the spline. Higher values generate more points during path interpolation.
* @param {boolean} [closed=true] - A closed path loops from the final point back to the start again.
* @param {Phaser.Point[]|number[]|...Phaser.Point|...number} points - An array of points to use for the spline.
*        These can also be set later via `ParticleStorm.Zones.Spline.setTo`.
* @return {Phaser.ParticleStorm.Zones.Spline} The zone that was created.
*/
Phaser.ParticleStorm.prototype.createCatmullSplineZone = function (resolution, closed, points) {

    return new Phaser.ParticleStorm.Zones.Spline(this.game, 2, resolution, closed, points);

};

/**
* Zones allow you to define an area within which particles can be emitted.
*
* This method creates a Spline Zone. A spline consists of a set of points through
* which a path is constructed. Particles can be emitted anywhere along this path.
* 
* The points can be set from a variety of formats:
*
* - An array of Point objects: `[new Phaser.Point(x1, y1), ...]`
* - An array of objects with public x/y properties: `[ { x: 0, y: 0 }, ...]`
* - An array of objects with public x/y properties: `[obj1, obj2, ...]`
*
* All zones extend Phaser.ParticleStorm.Zones.Base, which you can use to create your own custom
* zones if required.
* 
* @method Phaser.ParticleStorm#createSplineZone
* @memberOf Phaser.ParticleStorm
* @param {integer} [mode=0] - The type of spline to create. 0 = linear, 1 = bezier and 2 = catmull.
* @param {number} [resolution=1000] - The resolution of the spline. Higher values generate more points during path interpolation.
* @param {boolean} [closed=true] - A closed path loops from the final point back to the start again.
* @param {Phaser.Point[]|number[]|...Phaser.Point|...number} points - An array of points to use for the spline.
*        These can also be set later via `ParticleStorm.Zones.Spline.setTo`.
* @return {Phaser.ParticleStorm.Zones.Spline} The zone that was created.
*/
Phaser.ParticleStorm.prototype.createSplineZone = function (mode, resolution, closed, points) {

    return new Phaser.ParticleStorm.Zones.Spline(this.game, mode, resolution, closed, points);

};

/**
* Zones allow you to define an area within which particles can be emitted.
*
* This method creates a Text Zone. This is a zone consisting of a Phaser.Text object.
* Particles can be emitted from anywhere within the Text object.
*
* All zones extend Phaser.ParticleStorm.Zones.Base, which you can use to create your own custom
* zones if required.
* 
* @method Phaser.ParticleStorm#createTextZone
* @memberOf Phaser.ParticleStorm
* @param {Phaser.Text} text - The Text object that is used to create this zone.
* @return {Phaser.ParticleStorm.Zones.Text} The zone that was created.
*/
Phaser.ParticleStorm.prototype.createTextZone = function (text) {

    return new Phaser.ParticleStorm.Zones.Text(this.game, text);

};

/**
* Zones allow you to define an area within which particles can be emitted.
*
* This method creates an Image Zone. This is a zone consisting of an image which certain types of
* Emitter renderer can read from in order to extract pixel data, which can then be used to tint
* or otherwise modify the properties of the particles if emits.
*
* All zones extend Phaser.ParticleStorm.Zones.Base, which you can use to create your own custom
* zones if required.
* 
* @method Phaser.ParticleStorm#createImageZone
* @memberOf Phaser.ParticleStorm
* @param {Phaser.Sprite|Phaser.Image|Phaser.Text|Phaser.BitmapData|Image|HTMLCanvasElement|string} key - The object that 
*     will be used to create this Image zone. If you give a string it will try and find the Image in the Game.Cache first.
* @return {Phaser.ParticleStorm.Zones.Image} The zone that was created.
*/
Phaser.ParticleStorm.prototype.createImageZone = function (key) {

    return new Phaser.ParticleStorm.Zones.Image(this.game, key);

};

/**
* Update all emitters in this plugin. Only emitters that have `enabled` set will be updated.
* 
* You can tell an emitter to never be updated by the plugin by setting its `manualUpdate` property
* to `true`. This allows you to update it as you see fit, rather than have the plugin do it
* automatically.
*
* Set ParticleStorm.active to `false` to stop the plugin from updating _all_ emitters.
*
* @method Phaser.ParticleStorm#update
* @memberOf Phaser.ParticleStorm
* @protected
*/
Phaser.ParticleStorm.prototype.update = function () {

    if (!this.active)
    {
        return;
    }

    for (var i = 0; i < this.emitters.length; i++)
    {
        if (this.emitters[i].enabled && !this.emitters[i].manualUpdate)
        {
            this.emitters[i].update();
        }
    }

};

/**
* @author       Richard Davey <rich@photonstorm.com>
* @author       Pete Baron <pete@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link http://choosealicense.com/licenses/no-license/|No License}
*/

/**
* An instance of a Particle Storm Emitter.
* 
* This class is responsible for updating and managing all active particles created by this emitter.
*
* Add it to your game via the plugin:
*
* `this.manager = this.game.plugins.add(Phaser.ParticleStorm);`
* `this.emitter = this.manager.createEmitter();`
*
* You can have multiple emitters running, each controlling their own set of particles.
*
* Emitters are not display objects and you cannot add it to the display list or position it.
* The renderer created by this emitter is the entity that lives on the display list.
*
* @class Phaser.ParticleStorm.Emitter
* @constructor
* @param {Phaser.ParticleStorm} parent - The ParticleStorm Plugin.
* @param {Phaser.ParticleStorm.SPRITE|Phaser.ParticleStorm.PIXEL|Phaser.ParticleStorm.RENDERTEXTURE|Phaser.ParticleStorm.SPRITE_BATCH} [renderType=Phaser.ParticleStorm.SPRITE] - The Particle Renderer type constant.
* @param {Phaser.Point} [force] - Amount of force to be applied to all particles every update.
* @param {Phaser.Point} [scrollSpeed] - All particles can be scrolled. This offsets their positions by the amount in this Point each update.
*     This is different to force which is applied as a velocity on the particle, where-as scrollSpeed directly adjusts their final position.
*/
Phaser.ParticleStorm.Emitter = function (parent, renderType, force, scrollSpeed, render_white_core = false, core_custom_color = null, core_size_factor = 1, transforms = null) {

    /**
    * @property {Phaser.Game} game - A reference to the Phaser Game instance.
    */
    this.game = parent.game;

    /**
    * @property {Phaser.ParticleStorm} parent - The Particle Storm plugin.
    */
    this.parent = parent;

    /**
    * The Particle Renderer this emitter is using.
    * @property {Phaser.ParticleStorm.Renderer.Base} renderer
    * @default
    */
    this.renderer = null;

    /**
    * The type of renderer this emitter is using.
    * @property {string} renderType
    */
    this.renderType = null;

    /**
    * A set of useful common static functions.
    * @property {Phaser.ParticleStorm.Graph} graph
    */
    this.graph = Phaser.ParticleStorm.Graph;

    /**
    * The enabled state of this emitter. If set to `false` it won't emit any new particles or update
    * alive particles. You can toggle this directly or via Emitter.paused.
    * @property {boolean} enabled
    */
    this.enabled = false;

    /**
    * Is this emitter updated automatically by the Particle Storm plugin, or should it be 
    * updated manually via the game code?
    * 
    * If `false` (the default) the plugin will update this emitter automatically for you.
    * If `true` then you need to call the `update` method directly from your game code.
    * 
    * @property {boolean} manualUpdate
    * @default
    */
    this.manualUpdate = false;

    /**
    * The scrolling speed of the particles in pixels per frame.
    * The amount specified in this Point object is added to the particles position each frame 
    * after their internal velocities and calculations have taken place.
    *
    * @property {Phaser.Point} scrollSpeed
    */
    this.scrollSpeed = new Phaser.Point();

    /**
    * Amount of force to be applied to all particles every update.
    * This is in addition to any particle velocities or forces defined in the particle data.
    * This object can be manipulated in real-time to provide for effects such as varying wind 
    * or gravity.
    * 
    * @property {Phaser.Point} force
    */
    this.force = new Phaser.Point();

    /**
    * This signal is dispatched each time a particle is emitted by this emitter.
    *
    * By default this signal is set to `null`. This is because it can generate
    * extremely high numbers of callbacks in busy particle systems. To enable it
    * add: `emitter.onEmit = new Phaser.Signal()` to your code.
    * 
    * It is sent two parameters: a reference to this emitter and a reference to the 
    * particle that was emitted.
    *
    * This signal is dispatched BEFORE the first time the particle is rendered, so
    * you can adjust positions, colors, textures and other properties the callback.
    * 
    * @property {Phaser.Signal} onEmit
    * @default
    */
    this.onEmit = null;

    /**
    * This signal is dispatched each time a particle enters a 'complete' state.
    * A particle can only do this if it has a fixed lifespan (i.e. a lifespan value
    * greater than 0) and has its `keepAlive` property set to `true`. This enables
    * you to emit particles with timespan based events that when they complete are
    * not immediately killed ready for re-use, but instead enter an 'idle' completed 
    * state.
    *
    * By default this signal is set to `null`. This is because it can generate
    * extremely high numbers of callbacks in busy particle systems. To enable it
    * add: `emitter.onComplete = new Phaser.Signal()` to your code.
    * 
    * It is sent two parameters: a reference to this emitter and a reference to the 
    * particle that was killed.
    * 
    * @property {Phaser.Signal} onComplete
    * @default
    */
    this.onComplete = null;

    /**
    * This signal is dispatched each time a particle is killed.
    *
    * By default this signal is set to `null`. This is because it can generate
    * extremely high numbers of callbacks in busy particle systems. To enable it
    * add: `emitter.onKill = new Phaser.Signal()` to your code.
    * 
    * It is sent two parameters: a reference to this emitter and a reference to the 
    * particle that was killed.
    * 
    * @property {Phaser.Signal} onKill
    * @default
    */
    this.onKill = null;

    /**
    * The class type of the Particle that is emitted.
    * 
    * You can change this to your own custom object, as long as it extends ParticleStorm.Particle.
    * 
    * If you change it in an emitter that has already emitted some particles then you will create
    * a mixed data-type emitter. You are recommended to clear this emitter first before changing
    * the particleClass.
    * 
    * @property {object} particleClass
    * @default Phaser.ParticleStorm.Particle
    */
    this.particleClass = Phaser.ParticleStorm.Particle;

    /**
    * The Timer used by this emitter for repeated and looped emissions.
    * 
    * @property {Phaser.Timer} timer
    */
    this.timer = this.game.time.create(false);

    /**
    * The Phaser.TimerEvent object that was created by the last call to emit that had a repeat value set.
    * If you set-up multiple repeated emits then this property will be overwritten each time, so it's up
    * to you to store your own reference locally before creating another repeated emitter.
    * 
    * @property {Phaser.TimerEvent} timerEvent
    * @default
    */
    this.timerEvent = null;

    /**
    * Contains all active particles being managed by this emitter.
    * When a particle is killed it is moved to the `pool` array.
    * 
    * @property {array} list
    * @protected
    */
    this.list = [];

    /**
    * A pool of particle objects waiting to be used. When a particle is activated it moves from the
    * pool to the `list` array. It moves back to the pool when killed.
    * 
    * @property {array} pool
    * @protected
    */
    this.pool = [];

    /**
    * Contains references to all particles that were emitted in the last call to Emitter.emit.
    * The contents of this array are reset every single time `Emitter.emit` is called, so if
    * you need to retain references to the particles that were just emitted you should make
    * a shallow copy of this array in your own game code.
    * 
    * @property {array} batch
    * @protected
    */
    this.batch = [];

    /**
    * An array containing all active GravityWells belonging to this emitter.
    * 
    * @property {array} wells
    * @protected
    */
    this.wells = [];

    this.core_custom_color = core_custom_color;

    this.core_size_factor = core_size_factor;

    this.transforms = transforms;

    /**
    * Internal Point object used by the emit methods.
    * @property {Phaser.Point} _rnd
    * @private
    */
    this._rnd = new Phaser.Point();

    /**
    * Internal Point object used by the emit methods for particle spacing.
    * @property {Phaser.Point} _step
    * @private
    */
    this._step = new Phaser.Point();

    /**
    * Internal counter for the number of parent particles emitted this batch.
    * @property {integer} _pCount
    * @private
    */
    this._pCount = 0;

    /**
    * Internal var holding the delay properties for this batch.
    * @property {object} _delay
    * @private
    */
    this._delay = { enabled: false, start: 0, inc: 0, visible: false };

    this.init(renderType, force, scrollSpeed, render_white_core);

};

Phaser.ParticleStorm.Emitter.prototype = {

    /**
    * Establishes the renderer and clears the particle list and pool ready for use.
    *
    * This is called automatically by the Phaser PluginManager.
    *
    * @method Phaser.ParticleStorm.Emitter#init
    * @protected
    * @param {Phaser.ParticleStorm.SPRITE|Phaser.ParticleStorm.PIXEL|Phaser.ParticleStorm.RENDERTEXTURE|Phaser.ParticleStorm.SPRITE_BATCH} [renderType=Phaser.ParticleStorm.SPRITE] - The Particle Renderer type constant.
    * @param {Phaser.Point} [force] - Amount of force to be applied to all particles every update.
    * @param {Phaser.Point} [scrollSpeed] - All particles can be scrolled. This offsets their positions by the amount in this Point each update.
    *     This is different to force which is applied as a velocity on the particle, where-as scrollSpeed directly adjusts their final position.
    */
    init: function (renderType, force, scrollSpeed, render_white_core) {

        if (renderType === undefined) { renderType = Phaser.ParticleStorm.SPRITE; }

        var w = this.game.width;
        var h = this.game.height;

        switch (renderType)
        {
            case Phaser.ParticleStorm.SPRITE:
                this.renderer = new Phaser.ParticleStorm.Renderer.Sprite(this);
                break;

            case Phaser.ParticleStorm.PIXEL:
                this.renderer = new Phaser.ParticleStorm.Renderer.Pixel(this, w, h, render_white_core);
                break;

            case Phaser.ParticleStorm.RENDERTEXTURE:
                this.renderer = new Phaser.ParticleStorm.Renderer.RenderTexture(this, w, h);
                break;

            case Phaser.ParticleStorm.SPRITE_BATCH:
                this.renderer = new Phaser.ParticleStorm.Renderer.SpriteBatch(this);
                break;

            case Phaser.ParticleStorm.BITMAP_DATA:
                this.renderer = new Phaser.ParticleStorm.Renderer.BitmapData(this, w, h);
                break;

            default:
                console.warn("ParticleManager.init - Invalid renderType given");
                return false;
        }
        
        this.renderType = renderType;

        if (force)
        {
            this.force.set(force.x, force.y);
        }

        if (scrollSpeed)
        {
            this.scrollSpeed.set(scrollSpeed.x, scrollSpeed.y);
        }

        this.list = [];
        this.pool = [];
        this.wells = [];

        this.enabled = true;

    },

    /**
    * Adds the Particle Renderer to the game world.
    *
    * You can optionally specify a Phaser.Group for the renderer to be added to.
    * If not provided it will be added to the World group.
    *
    * @method Phaser.ParticleStorm.Emitter#addToWorld
    * @param {Phaser.Group} [group] - The group to add the renderer to. If not specified it will be added to the World.
    * @return {Phaser.Image|Phaser.Sprite|Phaser.Group} The display object that contains the particle renderer.
    */
    addToWorld: function (group) {

        if (group === undefined) { group = this.game.world; }

        return this.renderer.addToWorld(group);

    },

    /**
    * Adds a Gravity Well to this Particle Manager. A Gravity Well creates a force on the 
    * particles to draw them towards a single point.The force applied is inversely proportional 
    * to the square of the distance from the particle to the point, in accordance with Newton's
    * law of gravity.
    * 
    * A Gravity Well only effects particles owned by the emitter that created it.
    *
    * Gravity Wells don't have any display properties, i.e. they are not Sprites.
    * 
    * @method Phaser.ParticleStorm.Emitter#createGravityWell
    * @param {number} [x=0] - The x coordinate of the Gravity Well, the point towards which particles are drawn.
    * @param {number} [y=0] - The y coordinate of the Gravity Well, the point towards which particles are drawn.
    * @param {number} [power=0] - The strength of the gravity well. Larger numbers create stronger forces. Start with low values like 1.
    * @param {number} [epsilon=100] - The minimum distance for which gravity is calculated. 
    *                               Particles closer than this distance experience a gravity force as if 
    *                               they were this distance away. This stops the gravity effect blowing 
    *                               up as distances get small. For realistic gravity effects you will want 
    *                               a small epsilon (~1), but for stable visual effects a larger
    *                               epsilon (~100) is often better.
    * @param {number} [gravity=50] - The gravity constant.
    * @return {Phaser.ParticleStorm.GravityWell} The GravityWell object.
    */
    createGravityWell: function (x, y, power, epsilon, gravity) {

        var well = new Phaser.ParticleStorm.GravityWell(this, x, y, power, epsilon, gravity);

        this.wells.push(well);

        return well;

    },

    /**
    * Seeds this emitter with `qty` number of Particle objects, and places them in the pool ready for use.
    * This allows you to pre-seed the pool and avoid object creation in hot parts of your game code.
    *
    * @method Phaser.ParticleStorm.Emitter#seed
    * @param {integer} qty - The amount of Particle objects to create in the pool.
    * @return {Phaser.ParticleStorm.Emitter} This Emitter.
    */
    seed: function (qty) {

        for (var i = 0; i < qty; i++)
        {
            var particle = new Phaser.ParticleStorm.Particle(this);

            this.pool.push(particle);
        }

        return this;

    },

    /**
    * Tells the Emitter to emit one or more particles, with a delay before it starts.
    *
    * The key refers to the ParticleData already set-up within Particle Storm via `ParticleStorm.addDdata`.
    * 
    * You must have added or created the data referenced by key before you can call `emit`.
    *
    * The `config` argument is an object that contains additional emission settings.
    *
    * @method Phaser.ParticleStorm.Emitter#emitDelayed
    * @param {number} delay - The delay (in ms) before this emit will be run. It's added to an internal timed queue.
    * @param {string} key - The key of the data that the particle will use to obtain its emission values from.
    * @param {number|array} [x=0] - The x location of the particle. Either a discrete value or an array consisting of 2 elements, the min and max, it will pick a point at random between them.
    * @param {number|array} [y=0] - The y location of the particle. Either a discrete value or an array consisting of 2 elements, the min and max, it will pick a point at random between them.
    * @param {object} [config] - An emitter configuration object. See `Emitter.emit` for the full object property docs.
    * @return {Phaser.TimerEvent} The TimerEvent object created for this delayed emit.
    */
    emitDelayed: function (delay, key, x, y, config) {

        if (!this.enabled || !this.parent.dataList[key] || delay <= 0)
        {
            return null;
        }

        this.timerEvent = this.timer.add(delay, this.emit, this, key, x, y, config);

        this.timer.start();

        return this.timerEvent;

    },

    /**
    * Tells the Emitter to emit one or more particles.
    *
    * The key refers to the ParticleData already set-up within Particle Storm via `ParticleStorm.addDdata`.
    * 
    * You must have added or created the data referenced by key before you can call `emit`.
    *
    * The `config` argument is an object that contains additional emission settings.
    *
    * @method Phaser.ParticleStorm.Emitter#emit
    * @param {string} key - The key of the data that the particle will use to obtain its emission values from.
    * @param {number|array} [x=0] - The x location of the particle. Either a discrete value or an array consisting of 2 elements, the min and max, it will pick a point at random between them.
    * @param {number|array} [y=0] - The y location of the particle. Either a discrete value or an array consisting of 2 elements, the min and max, it will pick a point at random between them.
    * @param {object} [config] - An emitter configuration object.
    * @param {number} [config.total] - The number of particles to emit (-1 means 'all' when the zone distribution is 'full')
    * @param {number} [config.repeat] - How many times this emit should repeat. A value of -1 means 'forever'.
    * @param {number} [config.frequency] - If `repeat` is -1 or > 0 this controls the ms that will elapse between each repeat.
    * @param {number} [config.xStep=0] - The amount of horizontal spacing in pixels to add between each particle emitted in this call. This is in addition to the `x` argument.
    * @param {number} [config.yStep=0] - The amount of vertical spacing in pixels to add between each particle emitted in this call. This is in addition to the `y` argument.
    * @param {number|object} [config.delay] - If a number it sets the delay of the first particle to `delay` ms. This is in addition to any delay set in the particle data.
    * @param {number} [config.delay.start=0] - A starting delay value in ms before any particle in this emit call is activated.
    * @param {number} [config.delay.step=0] - If this emit call will emit multiple particles the step controls how many ms to add between each ones delay.
    * @param {boolean} [config.delay.visible=false] - Should particles render and be visible, even when delayed?
    * @param {Phaser.ParticleStorm.Zones.Base} [config.zone] - The zone to emit the particles from.
    * @param {number} [config.percent] - If a spline based zone this value tells the emitter how far along the spline to emit the particles from. Between 0 and 100.
    * @param {boolean} [config.random] - If a zone is set this will emit the particles from random locations within the zone.
    * @param {boolean} [config.full] - If a zone is set this will emit the particles from all locations in the zone (only applies to specific types of zone like Images)
    * @param {boolean} [config.setAlpha] - If the zone supports it will the particle alpha be set?
    * @param {boolean} [config.setColor] - If the zone supports it will the particle color be set?
    * @param {integer} [config.step] - Controls the iteration through the pixel data. Only for 'full' zone emissions.
    * @param {integer|array} [config.spacing] - The pixel spacing between each emitted particle.
    * @param {object} [config.radiate] - Emits the particle in a radial arc.
    * @param {number} [config.radiate.velocity] - The speed to emit the particle when radiating.
    * @param {number} [config.radiate.from] - The starting angle to radiate from.
    * @param {number} [config.radiate.to] - The angle to radiate to.
    * @param {object} [config.radiateFrom] - Emits the particle radiating away from a given point.
    * @param {number} [config.radiateFrom.x] - The x coordinate of the point to radiate away from.
    * @param {number} [config.radiateFrom.y] - The y coordinate of the point to radiate away from.
    * @param {number} [config.radiateFrom.velocity] - The speed to emit the particle when radiating.
    * @return {Phaser.ParticleStorm.Particle|array} The particle or an array of particles that were emitted, 
    *     or null if no particle could be created.
    */
    emit: function (key, x, y, config) {

        if (!this.enabled || !this.parent.dataList[key])
        {
            return null;
        }

        this.data = this.parent.dataList[key];

        this.batch = [];

        this._pCount = 0;

        this._step.x = 0;
        this._step.y = 0;

        if (x === undefined) { x = 0; }
        if (y === undefined) { y = 0; }

        //  ------------------------------------------------
        //  Fast-exit: No config object
        //  ------------------------------------------------

        if (!config)
        {
            return this.emitParticle(key, x, y, null);
        }

        //  ------------------------------------------------
        //  The number of particles to emit
        //  ------------------------------------------------

        var total = (config.hasOwnProperty('total')) ? config.total : 1;

        //  ------------------------------------------------
        //  Batch position spacing
        //  ------------------------------------------------

        if (config.xStep > 0)
        {
            this._step.x = config.xStep;
        }
        else
        {
            this._step.x = 0;
        }

        if (config.yStep > 0)
        {
            this._step.y = config.yStep;
        }
        else
        {
            this._step.y = 0;
        }

        //  ------------------------------------------------
        //  The particle delays per emit
        //  ------------------------------------------------

        this._delay.enabled = false;

        if (config.delay)
        {
            this._delay.enabled = true;
            this._delay.waiting = true;

            if (typeof config.delay === 'number')
            {
                this._delay.start = config.delay;
                this._delay.step = 0;
                this._delay.visible = false;
            }
            else
            {
                this._delay.start = (config.delay.start) ? config.delay.start : 0;
                this._delay.step = (config.delay.step) ? config.delay.step : 0;
                this._delay.visible = (config.delay.visible) ? true : false;
            }

            if (this._delay.start > 0) {
                this.game.time.events.add(this._delay.start, () => (this._delay.waiting = false));
            }
        }

        //  ------------------------------------------------
        //  Zone
        //  ------------------------------------------------
        if (config.zone)
        {
            if ((config.random === undefined && config.full === undefined && config.percent === undefined) || config.random)
            {
                //  Neither 'random' or 'full' are set, so we default to 'random'
                config.zone.emit(this, key, x, y, total, config.setAlpha, config.setColor);
            }
            else if (config.percent === undefined && (config.full !== undefined || !config.random))
            {
                //  'full' is set, or 'random' is specifically set to false
                config.zone.emitFull(this, key, x, y, config.step, config.spacing, config.setAlpha, config.setColor);
            }
            else if (config.percent !== undefined)
            {
                //  'percent' is set for a Spline zone
                var pnt = 0;

                if (typeof config.percent === 'number')
                {
                    pnt = config.percent;
                }
                else
                {
                    //  min/max?
                    if (config.percent.hasOwnProperty('min'))
                    {
                        pnt = this.game.rnd.between(config.percent.min, config.percent.max);
                    }
                    else if (config.percent.callback)
                    {
                        pnt = config.percent.callback.call(config.percent.context, this);
                    }
                }
                
                config.zone.emitPercent(this, key, x, y, total, pnt);
            }
        }
        else
        {
            //  ------------------------------------------------
            //  No zone
            //  ------------------------------------------------
            for (var i = 0; i < total; i++)
            {
                this.emitParticle(key, x, y, null);
            }
        }

        if (config.radiate)
        {
            //  ------------------------------------------------
            //  Radiate
            //  ------------------------------------------------
            for (var c = 0; c < this.batch.length; c++)
            {
                this.batch[c].radiate(config.radiate.velocity, config.radiate.from, config.radiate.to, config.radiate.transform_key);
            }
        }
        else if (config.radiateFrom)
        {
            //  ------------------------------------------------
            //  RadiateFrom
            //  ------------------------------------------------
            for (var c = 0; c < this.batch.length; c++)
            {
                this.batch[c].radiateFrom(config.radiateFrom.x, config.radiateFrom.y, config.radiateFrom.velocity, config.radiateFrom.transform_key);
            }
        }

        //  ------------------------------------------------
        //  Repeat
        //  ------------------------------------------------
        var repeat = (config.hasOwnProperty('repeat')) ? config.repeat : 0;

        if (repeat !== 0)
        {
            var frequency = (config.hasOwnProperty('frequency')) ? config.frequency : 250;

            //  Or the repeats will stack-up
            delete config.repeat;

            if (repeat === -1)
            {
                this.timerEvent = this.timer.loop(frequency, this.emit, this, key, x, y, config);
            }
            else if (repeat > 0)
            {
                this.timerEvent = this.timer.repeat(frequency, repeat, this.emit, this, key, x, y, config);
            }

            this.timer.start();
        }

        //  Reset the pCounter
        this._pCount = 0;

        return this.batch;

    },

    /**
    * Tells the Emitter to emit one single particle.
    *
    * **This method shouldn't usually be called directly. See `Emitter.emit`.**
    *
    * The key refers to the ParticleData already set-up within Particle Storm via `ParticleStorm.addDdata`.
    * 
    * You must have added or created the data referenced by key before you can call `emit`.
    *
    * @method Phaser.ParticleStorm.Emitter#emitParticle
    * @param {string} key - The key of the data that the particle will use to obtain its emission values from.
    * @param {number|array} [x=0] - The x location of the particle. Either a discrete value or an array consisting of 2 elements, the min and max, it will pick a point at random between them.
    * @param {number|array} [y=0] - The y location of the particle. Either a discrete value or an array consisting of 2 elements, the min and max, it will pick a point at random between them.
    * @param {Phaser.ParticleStorm.Particle} [parent=null] - The parent of this particle, if any.
    * @return {Phaser.ParticleStorm.Particle} The particle that was emitted.
    */
    emitParticle: function (key, x, y, parent) {

        var particle = this.pool.pop();

        if (!particle)
        {
            particle = new this.particleClass(this);
        }

        particle.parent = parent;

        //  ------------------------------------------------
        //  If the coordinates are arrays it uses them as min/max pairs
        //  ------------------------------------------------
        if (Array.isArray(x))
        {
            x = this.game.rnd.between(x[0], x[1]);
        }

        if (Array.isArray(y))
        {
            y = this.game.rnd.between(y[0], y[1]);
        }

        //  ------------------------------------------------
        //  If the coordinates are callables it calls them to get the values
        //  ------------------------------------------------
        if (x instanceof Function)
        {
            x = x();
        }

        if (y instanceof Function)
        {
            y = y();
        }

        //  ------------------------------------------------
        //  If the coordinates are sequential based on previous particle
        //  ------------------------------------------------

        x += (this._step.x * this._pCount);
        y += (this._step.y * this._pCount);

        particle.reset(this.renderer, x, y, this.parent.dataList[key]);

        if (particle.alive)
        {
            //  Apply delay (in addition to any set in the particle data)

            if (!parent && this._delay.enabled)
            {
                particle.delay += this._delay.start + (this._pCount * this._delay.step);
                particle.delayVisible = this._delay.visible;
            }

            this.list.push(particle);

            this.batch.push(particle);

            if (!parent)
            {
                this._pCount++;
            }
        }
        else
        {
            particle.kill();

            if (this.onKill)
            {
                this.onKill.dispatch(this, particle);
            }

            this.pool.push(particle);
        }

        return particle;

    },

    /**
    * Update all particles in this emitter.
    *
    * This method is called by the Particle Storm plugin automatically unless
    * `manualUpdate` has been set to `true`.
    *
    * @method Phaser.ParticleStorm.Emitter#update
    * @return {number} The number of active particles in this manager.
    */
    update: function () {

        var elapsed = this.game.time.delta;

        this.renderer.preUpdate();

        //  Update all the particles and destroy those that request it
        for (var i = this.list.length - 1; i >= 0; i--)
        {
            var p = this.list[i];

            if (!p.ignoreScrollSpeed)
            {
                if (p.emitter.transforms) {
                    for (let transform_key in p.transform) {
                        p.transform[transform_key].x += this.scrollSpeed.x;
                        p.transform[transform_key].y += this.scrollSpeed.y;
                    }
                } else {
                    p.transform.x += this.scrollSpeed.x;
                    p.transform.y += this.scrollSpeed.y;
                }
            }

            for (var w = 0; w < this.wells.length; w++)
            {
                if (this.wells[w].active)
                {
                    this.wells[w].step(p);
                }
            }

            if (!p.step(elapsed, this.force, i))
            {
                p.kill();
                this.pool.push(p);
                this.list.splice(i, 1);
            }
        }

        this.renderer.postUpdate();

        return this.list.length;

    },

    /**
    * This is an internal method that takes a emission data object, time value and
    * life percentage and calculates the new number of child particles that should be emitted.
    *
    * @method Phaser.ParticleStorm.Emitter#updateFrequency
    * @protected
    * @param {object} emit - The emission data object describing what and when to emit.
    * @param {number} elapsedTime - How long has it been since the last time this was updated (in milliseconds)
    * @param {number} lastPercent - The lifePercent last time this was updated.
    * @param {number} lifePercent - How far through its life is this particle (from 0 to 1)
    * @return {number} The number of children for this particle to emit.
    */
    updateFrequency: function (emit, elapsedTime, lastPercent, lifePercent) {

        //  If the emit frequency is specified as a list of time intervals
        //  and number of children then ...
        if (emit.at)
        {
            //  Total is the number to be created for all time intervals 
            //  between lastPercent and lifePercent
            var total = 0;

            for (var i = 0; i < emit.at.length; i++)
            {
                var o = emit.at[i];

                //  Inclusive at the low end for time == 0 only, always inclusive at the high end
                if ((o.time > lastPercent || (o.time === 0 && lastPercent === 0)) && o.time <= lifePercent)
                {
                    //  If emit.at.value is between 0 and 1 then it expresses a 
                    //  percentage random chance to create a child at this time
                    if (o.value > 0 && o.value < 1.0)
                    {
                        if (Math.random() < o.value)
                        {
                            total += 1;
                        }
                    }
                    else
                    {
                        //  All other values are taken literally
                        total += o.value;
                    }
                }
            }

            return total;
        }

        //  Alternatively, we have a fixed emission frequency or a control graph
        return this.graph.getParamArea(emit, lastPercent, lifePercent) * elapsedTime;

    },

    /**
    * Call a function on each _alive_ particle in this emitter.
    *
    * Additional arguments for the callback can be specified after the context parameter.
    * For example:
    *
    * `Emitter.forEach(headTowards, this, 100, 500)`
    *
    * .. would invoke the `headTowards` function with the arguments `(particle, 100, 500)`.
    *
    * @method Phaser.ParticleStorm.Emitter#forEach
    * @param {function} callback - The function that will be called for each alive particle. The particle will be passed as the first argument.
    * @param {object} callbackContext - The context in which the function should be called (usually 'this').
    * @param {...any} [args=(none)] - Additional arguments to pass to the callback function, after the particle.
    */
    forEach: function (callback, callbackContext) {

        if (arguments.length <= 2)
        {
            for (var i = 0; i < this.list.length; i++)
            {
                callback.call(callbackContext, this.list[i]);
            }
        }
        else
        {
            var args = [null];

            for (var i = 2; i < arguments.length; i++)
            {
                args.push(arguments[i]);
            }

            for (var i = 0; i < this.list.length; i++)
            {
                args[0] = this.list[i];
                callback.apply(callbackContext, args);
            }
        }

    },

    /**
    * Call a function on each _alive_ particle that was emitted in the last call.
    * When you call `emit` the particles that are emitted are temporarily added to the
    * Emitter.batch array. This method allows you to call a function on all particles
    * within that array.
    *
    * Additional arguments for the callback can be specified after the context parameter.
    * For example:
    *
    * `Emitter.forEach(headTowards, this, 100, 500)`
    *
    * .. would invoke the `headTowards` function with the arguments `(particle, 100, 500)`.
    *
    * @method Phaser.ParticleStorm.Emitter#forEachNew
    * @param {function} callback - The function that will be called for each alive particle. The particle will be passed as the first argument.
    * @param {object} callbackContext - The context in which the function should be called (usually 'this').
    * @param {...any} [args=(none)] - Additional arguments to pass to the callback function, after the particle.
    */
    forEachNew: function (callback, callbackContext) {

        if (this.batch.length === 0)
        {
            return;
        }

        if (arguments.length <= 2)
        {
            for (var i = 0; i < this.batch.length; i++)
            {
                callback.call(callbackContext, this.batch[i]);
            }
        }
        else
        {
            var args = [null];

            for (var i = 2; i < arguments.length; i++)
            {
                args.push(arguments[i]);
            }

            for (var i = 0; i < this.batch.length; i++)
            {
                args[0] = this.batch[i];
                callback.apply(callbackContext, args);
            }
        }

    },

    /**
    * Gets a Particle from this emitter based on the given index.
    *
    * Only 'live' particles are checked.
    *
    * @method Phaser.ParticleStorm.Emitter#getParticle
    * @param {integer} [index=0] - The index of the particle to get.
    * @return {Phaser.ParticleStorm.Particle} The particle that was emitted.
    */
    getParticle: function (index) {

        if (index === undefined) { index = 0; }

        if (this.list[index])
        {
            return this.list[index];
        }
        else
        {
            return null;
        }

    },

    /**
    * Renders a Debug panel for this Emitter using the Phaser.Debug class.
    *
    * It displays the force, scroll speed and numbers of alive and dead particles.
    *
    * The size of the rendered debug panel is 360x70.
    * 
    * You should **never** use this in a production game, as it costs CPU/GPU time to display it.
    *
    * @method Phaser.ParticleStorm.Emitter#debug
    * @param {number} [x=0] - The x coordinate to render the Debug panel at.
    * @param {number} [y=0] - The y coordinate to render the Debug panel at.
    */
    debug: function (x, y) {

        var d = this.game.debug;

        if (d)
        {
            d.start(x + 4, y + 16, 'rgb(255, 255, 255)', 132);

            d.context.fillStyle = 'rgba(0, 74, 128, 0.5)';
            d.context.fillRect(x, y, 360, 70);

            var fx = this.force.x + '';
            var fy = this.force.y + '';

            d.line('Force:', fx.substr(0, 8), fy.substr(0, 8));
            d.line('Scroll Speed:', this.scrollSpeed.x, this.scrollSpeed.y);
            d.line('Alive:', 'Dead:', 'Total:');
            d.line(this.alive, this.dead, this.total);

            d.stop();
        }

    },

    /**
    * Destroys this emitter.
    * 
    * Calls `clear` on the renderer and kills all particles in its lists.
    *
    * @method Phaser.ParticleStorm.Emitter#destroy
    */
    destroy: function () {

        if (this.renderer.clear)
        {
            this.renderer.clear();
        }

        this.renderer.destroy();
        this.renderer = null;

        for (var i = this.list.length - 1; i >= 0; i--)
        {
            this.list[i].kill();
            this.list.splice(i, 1);
        }

        this.list = [];
        this.pool = [];
        this.batch = [];
        this.wells = [];

    }

};

/**
* The paused state of the Emitter.
*
* If paused is set to `true` then no calls to `emit` or `update` will be processed.
*
* Set to `false` to resume updating of the particles.
* 
* @name Phaser.ParticleStorm.Emitter#paused
* @property {boolean} paused
*/
Object.defineProperty(Phaser.ParticleStorm.Emitter.prototype, "paused", {

    get: function () {

        return !this.enabled;

    },

    set: function (value) {

        this.enabled = !value;

    }

});

/**
* The total number of particles being managed by this emitter, including both
* alive and dead particles.
* 
* @name Phaser.ParticleStorm.Emitter#total
* @property {integer} total
* @readOnly
*/
Object.defineProperty(Phaser.ParticleStorm.Emitter.prototype, "total", {

    get: function () {

        return this.alive + this.dead;

    }

});

/**
* The total number of active (alive) particles being managed by this emitter.
* 
* @name Phaser.ParticleStorm.Emitter#alive
* @property {integer} alive
* @readOnly
*/
Object.defineProperty(Phaser.ParticleStorm.Emitter.prototype, "alive", {

    get: function () {

        return this.list.length;

    }

});

/**
* The total number of dead particles in the pool, ready to be re-used by this emitter.
* 
* @name Phaser.ParticleStorm.Emitter#dead
* @property {integer} dead
* @readOnly
*/
Object.defineProperty(Phaser.ParticleStorm.Emitter.prototype, "dead", {

    get: function () {

        return this.pool.length;

    }

});

Phaser.ParticleStorm.Emitter.prototype.constructor = Phaser.ParticleStorm.Emitter;

/**
* @author       Richard Davey <rich@photonstorm.com>
* @author       Pete Baron <pete@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link http://choosealicense.com/licenses/no-license/|No License}
*/

/**
* A single particle created and updated by a Particle Emitter.
* 
* It can belong to only one Emitter at any one time.
*
* Particles themselves don't have any display properties, i.e. they are not Sprites. If a Particle
* is added to an Emitter Renderer that uses Sprites, then a new Sprite object will be created and
* assigned to the Particles `sprite` property. Not all types of renderer do this, for example the
* Pixel renderer doesn't use sprites at all.
* 
* Particles are frequently pooled, so don't add any parameter initialization into the constructor should you extend it.
* Instead place it inside the Particle.reset method.
*
* @class Phaser.ParticleStorm.Particle
* @constructor
* @param {Phaser.ParticleStorm.Emitter} emitter - The emitter that owns this particle.
*/
Phaser.ParticleStorm.Particle = function (emitter) {

    /**
    * The emitter that owns this particle.
    * @property {Phaser.ParticleStorm.Emitter} emitter
    */
    this.emitter = emitter;

    /**
    * The renderer responsible for rendering this particle.
    * @property {Phaser.ParticleStorm.Renderer.Base} renderer
    */
    this.renderer = null;

    /**
    * A set of useful common static functions.
    * @property {Phaser.ParticleStorm.Graph} graph
    */
    this.graph = Phaser.ParticleStorm.Graph;

    /**
    * The transform control for this particle. Contains properties such as position, velocity and acceleration.
    * @property {Phaser.ParticleStorm.Controls.Transform} transform
    */
    if (emitter.transforms) {
        this.transform = {};
        for (let transform_key of emitter.transforms) {
            this.transform[transform_key] = new Phaser.ParticleStorm.Controls.Transform(this);
        }
    } else {
        this.transform = new Phaser.ParticleStorm.Controls.Transform(this);
    }
    this.active_transforms = this.transform;

    /**
    * The color control for this particle. Contains color related properties including red, green, blue, alpha, tint and blendMode.
    * @property {Phaser.ParticleStorm.Controls.Color} color
    */
    this.color = new Phaser.ParticleStorm.Controls.Color(this);

    /**
    * The texture control for this particle. Contains texture related properties including key, frame and animation handling.
    * @property {Phaser.ParticleStorm.Controls.Texture} texture
    */
    this.texture = new Phaser.ParticleStorm.Controls.Texture(this);

    /**
    * @property {Phaser.ParticleStorm.Particle} parent - The parent particle, if it has one.
    * @default
    */
    this.parent = null;

    /**
    * The lifespan of the particle is the length of time in milliseconds that it will live for once spawned.
    * Set the lifespan to zero to allow it to live forever. However particles cannot live forever if you use
    * any parameter controls at all, as they require an expiry date.
    * @property {number} lifespan
    * @default
    */
    this.lifespan = 2000;

    /**
    * Should the particle be kept alive and rendering once it has completed its lifespan?
    * This can only be set to true if lifespan is a value above zero.
    * When a particle is 'kept alive' it will never dispatch an onKill event.
    * @property {boolean} keepAlive
    * @default
    */
    this.keepAlive = false;

    /**
    * The delay in milliseconds that the particle will wait for until spawning.
    * @property {number} delay
    * @default
    */
    this.delay = 0;

    /**
    * Controls if the particle should still be rendered or not, even when delayed.
    * This allows you to display a particle in place before its lifecycle starts.
    * @property {boolean} delayVisible
    * @default
    */
    this.delayVisible = false;

    /**
    * The current age of this particle as a percentage of its total lifespan. A value between 0 and 1.
    * @property {number} life
    * @default
    */
    this.life = 0;

    /**
    * If this particle is part of a Sprite based renderer then the sprite associated with this particle is referenced
    * in this property. Otherwise this value is `null`.
    * @property {Phaser.Sprite} sprite
    * @default
    */
    this.sprite = null;

    /**
    * The visible state of this particle.
    * @property {boolean} visible
    */
    this.visible = false;

    /**
    * A particle is considered 'complete' when it reaches 100% of its lifespan.
    * If it has no lifespan it is never 'complete'.
    * @property {boolean} isComplete
    */
    this.isComplete = false;

    /**
    * Should this particle ignore any force applied by its emitter?
    * @property {boolean} ignoreForce
    * @default
    */
    this.ignoreForce = false;

    /**
    * Should this particle ignore any scrollSpeed applied by its emitter?
    * @property {boolean} ignoreScrollSpeed
    * @default
    */
    this.ignoreScrollSpeed = false;

    /**
    * @property {object} emit - The emit data of this particle.
    * @private
    */
    this.emit = {};

    /**
    * @property {number} _age - Internal helper for tracking the current age of this particle.
    * @private
    */
    this._age = 0;

    /**
    * @property {number} _lastPercent - Internal tracking var for previous lifePercent.
    * @private
    */
    this._lastPercent = 0;

    /**
    * @property {number} _numToEmit - Internal accumulator to track the fractions of a particle to be emitted across multiple frames.
    * @private
    */
    this._numToEmit = 0;

};

Phaser.ParticleStorm.Particle.prototype = {

    /**
    * Reset all of the particle properties back to their defaults, ready for spawning.
    * 
    * If the optional `data` parameter is provided then Particle.create will be automatically called.
    *
    * @method Phaser.ParticleStorm.Particle#reset
    * @param {Phaser.ParticleStorm.Renderer.Base} renderer - The renderer responsible for rendering this particle.
    * @param {number} x - The x position of this Particle in world space.
    * @param {number} y - The y position of this Particle in world space.
    * @param {object} [data] - The data this particle will use when emitted.
    * @return {Phaser.ParticleStorm.Particle} This Particle object.
    */
    reset: function (renderer, x, y, data) {

        this.renderer = renderer;

        if (this.emitter.transforms) {
            for (let transform_key in this.transform) {
                this.transform[transform_key].reset();
            }
        } else {
            this.transform.reset();
        }
        this.color.reset();
        this.texture.reset();

        this.emit = Object.create(Phaser.ParticleStorm.BASE_EMIT);

        this.isComplete = false;
        this.keepAlive = false;

        this.delay = 0;
        this.delayVisible = false;

        this.ignoreForce = false;
        this.ignoreScrollSpeed = false;

        this.alive = false;
        this.lifespan = 2000;
        this.life = 0;
        this.visible = false;

        this._age = 0;
        this._lastPercent = 0;
        this._numToEmit = 0;

        if (data !== undefined)
        {
            this.create(x, y, data);
        }

        return this;

    },

    /**
    * Activates this Particle. Should be called only after the particle has been reset.
    * 
    * It works by populating all of the local settings with the values contained in the `data` object.
    * It's then added to the renderer and drawn once with its initial values.
    *
    * @method Phaser.ParticleStorm.Particle#create
    * @param {number} x - The x position of this Particle in world space.
    * @param {number} y - The y position of this Particle in world space.
    * @param {object} data - The data this particle will use to populate its settings.
    * @return {Phaser.ParticleStorm.Particle} This Particle object.
    */
    create: function (x, y, data) {

        this.data = data;

        if (data.hasOwnProperty('pixelSize'))
        {
            this.pixelSize = data.pixelSize;
        }

        //  ------------------------------------------------
        //  Lifespan
        //  ------------------------------------------------

        if (data.hasOwnProperty('lifespan'))
        {
            this.lifespan = this.graph.getMinMax(data.lifespan);
        }

        this.keepAlive = data.keepAlive;

        //  ------------------------------------------------
        //  Delay
        //  ------------------------------------------------

        if (data.hasOwnProperty('delay'))
        {
            this.delay = this.graph.getMinMax(data.delay);
        }

        this.ignoreForce = data.ignoreForce;
        this.ignoreScrollSpeed = data.ignoreScrollSpeed;

        //  ------------------------------------------------
        //  Update controls
        //  ------------------------------------------------

        if (this.emitter.transforms) {
            for (let transform_key in this.transform) {
                this.transform[transform_key].init(x, y, data);
            }
        } else {
            this.transform.init(x, y, data);
        }
        this.color.init(data);
        this.texture.init(data);

        //  ------------------------------------------------
        //  Emit child
        //  ------------------------------------------------

        if (data.emit)
        {
            this.emit = Object.create(data.emit);
        }

        this.visible = (data.visible === false) ? false : true;

        this.alive = true;

        if (this.parent && this.parent.emit && this.parent.emit.inherit)
        {
            this.alive = this.onInherit(this.parent);
        }

        if (this.alive)
        {
            //  Make sure all parameters are set
            if (this.emitter.transforms) {
                for (let transform_key in this.transform) {
                    this.transform[transform_key].step();
                }
            } else {
                this.transform.step();
            }
            this.color.step();

            //  Add a display system object for this particle
            var sprite = this.renderer.add(this);

            if (sprite)
            {
                //  Only the TextureControl has a post-add step (which defines the animation frames)
                this.texture.step(data, sprite);
            }

            this.onEmit();

            if (this.emitter.onEmit)
            {
                this.emitter.onEmit.dispatch(this.emitter, this);
            }

            //  Draw the particle in its initial state
            this.renderer.update(this);
        }

        return this;

    },

    /**
    * Update this particle for a single time step.
    * 
    * Decides when to emit particles and when to die.
    *
    * @method Phaser.ParticleStorm.Particle#step
    * @param {number} elapsedTime - How long has it been since the last time this was updated (in milliseconds)
    * @param {Phaser.Point} [force] - A force which is applied to this particle as acceleration on every update call.
    * @return {boolean} True to continue living, false if this particle should die now.
    */
    step: function (elapsedTime, force, particleIndex) {

        //  Keep track of the particles age
        this._age += elapsedTime;

        //  If there's a delay
        if (this.delay)
        {
            if (this._age < this.delay)
            {
                this.renderer.update(this);

                //  Exit (but don't kill the particle)
                return true;
            }
            else
            {
                //  The delay has expired. Clear the delay value and reset the particle _age to zero (newborn)
                this.delay = 0;
                this._age = 0;
            }
        }

        this._lastPercent = this.life;

        //  Calculate lifespan of this particle, commencing when delay expired (if there was one)
        if (this.lifespan > 0)
        {
            this.life = Math.min(this._age / this.lifespan, 1.0);
        }

        if (force && !this.ignoreForce)
        {
            if (this.emitter.transforms) {
                for (let transform_key in this.transform) {
                    this.transform[transform_key].velocity.x.value += force.x;
                    this.transform[transform_key].velocity.y.value += force.y;
                }
            } else {
                this.transform.velocity.x.value += force.x;
                this.transform.velocity.y.value += force.y;
            }
        }

        if (this.emitter.transforms && this.data.transform_control) {
            let control = null;
            for (let c of this.data.transform_control) {
                if (this.life >= c.x) {
                    control = c;
                } else {
                    break;
                }
            }
            if (new Set(Object.keys(this.active_transforms)).difference(new Set(control.transforms)).size) {
                this.active_transforms = Object.fromEntries(
                    Object.entries(this.transform).filter(([key]) => control.transforms.includes(key))
                );
                if (control.copy) {
                    for (let copy_info of control.copy) {
                        this.transform[copy_info.to].x = this.transform[copy_info.from].x;
                        this.transform[copy_info.to].y = this.transform[copy_info.from].y;
                        this.transform[copy_info.to].scale.x = this.transform[copy_info.from].scale.x;
                        this.transform[copy_info.to].scale.y = this.transform[copy_info.from].scale.y;
                    }
                }
            }
        }

        if (this.emitter.transforms) {
            for (let transform_key in this.transform) {
                this.transform[transform_key].step();
            }
        } else {
            this.transform.step(particleIndex);
        }
        this.color.step();

        this.onUpdate();

        if (this.alive)
        {
            //  How many should we release in this time interval (summed with any fractions we didn't emit previously)
            this._numToEmit += this.emitter.updateFrequency(this.emit, elapsedTime, this._lastPercent, this.life);

            //  Create all the 'whole' emissions
            while (this._numToEmit >= 1.0)
            {
                this.emitChild();
            }

            this.renderer.update(this, particleIndex);
        }

        if (!this.isComplete && this.life === 1.0)
        {
            this.isComplete = true;

            if (this.emitter.onComplete)
            {
                this.emitter.onComplete.dispatch(this.emitter, this);
            }
        }

        //  Return false if this particle should die, otherwise true
        return (this.life < 1.0 || this.keepAlive);

    },

    /**
    * Emit a child particle from this one.
    *
    * @method Phaser.ParticleStorm.Particle#emitChild
    * @private
    */
    emitChild: function () {

        var x = this.graph.getMinMax(this.emit.offsetX) | 0;
        var y = this.graph.getMinMax(this.emit.offsetY) | 0;

        //  Does this emitter specify a creation circle or rect?
        if (this.emit.rect)
        {
            // pick a random location inside the rectangle
            var rect = this.emit.rect;
            x = Math.random() * rect.width + rect.x;
            y = Math.random() * rect.height + rect.y;
        }
        else if (this.emit.circle)
        {
            var radius = this.emit.circle;
            // randomly pick a y coordinate inside the circle
            y = Math.random() * radius * 2 - radius;
            // calculate the horizontal span from the point (0, y) to the circumference (Pythagoras: x2 + y2 = r2)
            var span = Math.sqrt(radius * radius - y * y);
            // randomly pick an x coordinate in that span on either side of the x = 0 line
            x = Math.random() * span * 2 - span;
        }

        var key = this.emit.name;

        if (typeof key !== 'string')
        {
            key = this.getChildKey(this.emit.name);
        }

        if (key)
        {
            let transform_x = 0;
            let transform_y = 0;
            if (this.emitter.transforms) {
                let transforms_count = 0;
                for (let transform_key in this.active_transforms) {
                    transform_x += this.active_transforms[transform_key].x;
                    transform_y += this.active_transforms[transform_key].y;
                    ++transforms_count;
                }
                transform_x /= transforms_count;
                transform_y /= transforms_count;
            } else {
                transform_x = this.transform.x;
                transform_y = this.transform.y;
            }
            var p = this.emitter.emitParticle(key, transform_x + x, transform_y + y, this);

            //  Apply any overwrite parameters to the new child particle
            if (p && this.emit.overwrite)
            {
                this.applyOverwrite(this.emit.overwrite, p);
            }
        }

        this._numToEmit -= 1.0;

    },

    /**
    * A blank method that allows you to control overwriting specific particle properties
    * on emission. Extend the Particle class then use this method as required.
    *
    * @method Phaser.ParticleStorm.Particle#applyOverwrite
    * @param {object} data - The overwrite data.
    * @param {Phaser.ParticleStorm.Particle} particle - The Particle object.
    * @return {Phaser.ParticleStorm.Particle} This Particle object.
    */
    applyOverwrite: function (data, particle) {

        return particle;

    },

    /**
    * Work out what child particle should be emitted by this particle.
    * Handles simple name string, lists of name strings, and the "at" format.
    *
    * @method Phaser.ParticleStorm.Particle#getChildKey
    * @param {object} param - A child defining data structure.
    * @returns {string|null} The name of the child to emit.
    */
    getChildKey: function (param) {

        if (Array.isArray(param))
        {
            return this.emitter.game.rnd.pick(param);
        }

        if (param.at !== undefined && param.at.length > 0)
        {
            //  It's a list of child types over time using the "at" list syntax, find the appropriate one
            var ret = param.at[0].value;

            for (var i = 0; i < param.at.length; i++)
            {
                if (param.at[i].time > this.life)
                {
                    break;
                }

                ret = param.at[i].value;
            }

            return ret;
        }

        return null;

    },

    /**
    * Set this particles velocity components to radiate away from its current position by the given angle.
    *
    * @method Phaser.ParticleStorm.Particle#radiate
    * @param {object} velocity - An object containing a min/max pair, an array of strings containing discrete values, or a single discrete value.
    * @param {number} [from=0] - If both arc variables are undefined, radiate in all directions.
    * @param {number} [to=359] - If both arc variables are defined the particle will radiate within the arc range defined.
    * @return {Phaser.ParticleStorm.Particle} This Particle object.
    */
    radiate: function (velocity, from, to, transform_key) {

        //  If `from` is defined, but `to` isn't, we set `to` to match `from`
        if (to === undefined && from !== undefined)
        {
            to = from;
        }
        else
        {
            if (from === undefined) { from = 0; }
            if (to === undefined) { to = 359; }
        }

        var v = velocity;

        if (velocity.hasOwnProperty("min"))
        {
            v = this.graph.getMinMax(velocity);
        }
        else if (Array.isArray(velocity))
        {
            v = parseFloat(this.emitter.game.rnd.pick(velocity), 10);
        }

        var angle = (Math.random() * (to - from) + from) * Phaser.ParticleStorm.PI_180;

        if (transform_key) {
            this.transform[transform_key].velocity.x.value = Math.sin(angle) * v;
            this.transform[transform_key].velocity.y.value = -Math.cos(angle) * v;
        } else if (this.emitter.transforms) { 
            this.transform[this.emitter.transforms[0]].velocity.x.value = Math.sin(angle) * v;
            this.transform[this.emitter.transforms[0]].velocity.y.value = -Math.cos(angle) * v;
        } else {
            this.transform.velocity.x.value = Math.sin(angle) * v;
            this.transform.velocity.y.value = -Math.cos(angle) * v;
        }

        return this;

    },

    /**
    * Set this particles velocity components to radiate away from a given point.
    *
    * @method Phaser.ParticleStorm.Particle#radiateFrom
    * @param {number} x - The central x location to radiate from.
    * @param {number} y - The central y location to radiate from.
    * @param {object} velocity - An object containing a min/max pair, an array of strings containing discrete values, or a single discrete value.
    * @return {Phaser.ParticleStorm.Particle} This Particle object.
    */
    radiateFrom: function (x, y, velocity, transform_key) {

        var v = velocity;

        if (velocity.hasOwnProperty("min"))
        {
            v = this.graph.getMinMax(velocity);
        }
        else if (Array.isArray(velocity))
        {
            v = parseFloat(this.emitter.game.rnd.pick(velocity), 10);
        }

        let t = transform_key ? this.transform[transform_key] : (this.emitter.transforms ? this.transform[this.emitter.transforms[0]] : this.transform);

        var dx = (t.x - x);
        var dy = (t.y - y);
        var d = Math.sqrt(dx * dx + dy * dy);

        t.velocity.x.value = dx * v / d;
        t.velocity.y.value = dy * v / d;

        return this;

    },

    /**
    * Set this particles velocity components to _approximately_ head towards the given coordinates.
    * 
    * It will set the velocity to ensure it arrives within the lifespan of this particle.
    * However it does not factor in other forces acting on the particle such as
    * Emitter.force or Gravity Wells.
    *
    * If you specify a zone it will pick a random point from anywhere within the zone and
    * add the x and y values to it, using the x and y values as the placement of the zone.
    *
    * @method Phaser.ParticleStorm.Particle#target
    * @param {object} data - The target data.
    * @param {number} [data.x] - The x location to head to. Must be specified if no zone is given.
    * @param {number} [data.y] - The y location to head to. Must be specified if no zone is given.
    * @param {Phaser.ParticleStorm.Zones.Base} [data.zone] - A zone. A random point within the zone will be selected as the target.
    * @param {string} [data.speed] - Either 'linear', 'reverse' or 'yoyo'.
    * @return {Phaser.ParticleStorm.Particle} This Particle object.
    */
    target: function (data) {

        var x = 0;
        var y = 0;
        var t = data.transform_key ? this.transform[data.transform_key] : (this.emitter.transforms ? this.transform[this.emitter.transforms[0]] : this.transform);

        if (data.x)
        {
            if (data.x instanceof Function) {
                x = data.x();
            } else {
                x = data.x;
            }
        }

        if (data.y)
        {
            if (data.y instanceof Function) {
                y = data.y();
            } else {
                y = data.y;
            }
        }

        if (data.zone)
        {
            var p = data.zone.getRandom();

            x += p.x;
            y += p.y;
        }

        var angle = Math.atan2(y - t.y, x - t.x);

        var dx = t.x - x;
        var dy = t.y - y;

        const duration = data.duration ? data.duration : this.lifespan;
        var speed = Math.sqrt(dx * dx + dy * dy) / (duration / 1000);

        var vx = (Math.cos(angle) * speed) * t.time.delta * 0.001;
        var vy = (Math.sin(angle) * speed) * t.time.delta * 0.001;

        if (data.speed)
        {
            this.graph.fromControl({ value: vx * 2, control: data.speed }, t.velocity.x);
            this.graph.fromControl({ value: vy * 2, control: data.speed }, t.velocity.y);
        }
        else
        {
            t.velocity.x.value = vx;
            t.velocity.y.value = vy;
        }

        if (data.hasOwnProperty('control'))
        {
            t.velocity.x.control = data.control;
            t.velocity.y.control = data.control;
        }

        return this;

    },

    /**
    * Sets a new lifespan for this particle.
    * 
    * The current age of the particle is reset to zero when this is called.
    *
    * @method Phaser.ParticleStorm.Particle#setLife
    * @param {number|object} lifespan - The new lifespan of this particle in ms. Either a value or a min/max pair.
    * @param {boolean} [keepAlive=false] - Should the particle be kept alive at the end of its lifespan?
    * @return {Phaser.ParticleStorm.Particle} This Particle object.
    */
    setLife: function (lifespan, keepAlive) {

        this.lifespan = this.graph.getMinMax(lifespan);

        this.life = 0;
        this._age = 0;
        this._lastPercent = 0;

        this.isComplete = false;
        this.keepAlive = keepAlive;

        return this;

    },

    /**
    * Turns off this particle, leaving it ready to be restarted with reset().
    *
    * @method Phaser.ParticleStorm.Particle#kill
    */
    kill: function () {

        this.alive = false;

        if (this.data.playOnKill) {
            const anim = this.sprite.play(this.data.playOnKill, undefined, false);
            anim.onComplete.addOnce(() => {
                this.renderer.kill(this);
            });
        } else {
            this.renderer.kill(this);
        }

        this.onKill();

    },

    /**
    * Called when this Particle is first emitted.
    * 
    * This is a blank method for you to override in your own classes that extend Particle.
    *
    * @method Phaser.ParticleStorm.Particle#onEmit
    * @param {Phaser.ParticleStorm.Particle} [parent] - The parent particle that emitted this one, if any.
    */
    onEmit: function () {},

    /**
    * Called when this Particle is updated by the Particle Manager.
    *
    * It is called at the end of the Particle.step method, just before this particle emits
    * any children and before it's sent to the renderer. If you set Particle.alive to false
    * in this method then the particle will not emit any children or be rendered.
    * 
    * This is a blank method for you to override in your own classes that extend Particle.
    *
    * @method Phaser.ParticleStorm.Particle#onUpdate
    */
    onUpdate: function () {},

    /**
    * Called when this Particle inherits values from a parent particle.
    *
    * This method must return a boolean value. If you wish for this particle to be used
    * by the Particle Manager and rendered then return `true`. If you want the particle
    * to be immediately killed then return `false`.
    * 
    * This is method is for you to override in your own classes that extend Particle.
    *
    * @method Phaser.ParticleStorm.Particle#onInherit
    * @param {Phaser.ParticleStorm.Particle} parent - The parent particle that emitted this one.
    * @return {boolean} True if this particle should be added to the pool and rendered, otherwise false if it should be killed.
    */
    onInherit: function () {

        return true;

    },

    /**
    * Called when this Particle is killed by its emitter, or directly in code.
    * 
    * A killed particle is moved from the active particle list back to the pool, ready
    * for use again in the future. It is not destroyed, it is hibernated for later use.
    * 
    * This is a blank method for you to override in your own classes that extend Particle.
    *
    * @method Phaser.ParticleStorm.Particle#onKill
    */
    onKill: function () {}

};

/**
* The life percent value of this particle rounded between 0 and 100.
* 
* If you need a value between 0 and 1 then use `Particle.life` instead.
*
* @name Phaser.ParticleStorm.Particle#lifePercent
* @property {integer} lifePercent - The current life percentage of this particle. Rounded between 0 and 100.
* @readOnly
*/
Object.defineProperty(Phaser.ParticleStorm.Particle.prototype, "lifePercent", {

    get: function () {

        return Math.round(this.life * 100);

    }

});

/**
* Sets the frequency at which this particle emits children.
*
* @name Phaser.ParticleStorm.Particle#frequency
* @property {number|object} value - A value/control type object defining a set rate or a graph of rates across lifespan.
*/
Object.defineProperty(Phaser.ParticleStorm.Particle.prototype, "frequency", {

    get: function () {

        return this.emit.value;

    },

    set: function (value) {

        this.emit.value = value;

    }

});

Phaser.ParticleStorm.Particle.prototype.constructor = Phaser.ParticleStorm.Particle;

/**
* @author       Richard Davey <rich@photonstorm.com>
* @author       Richard Lord
* @copyright    2015 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

/**
* A Gravity Well creates a force on the particles to draw them towards a single point.
* The force applied is inversely proportional to the square of the distance from the particle to the point, 
* in accordance with Newton's law of gravity.
* 
* A Gravity Well only effects particles owned by the emitter that created it.
*
* Gravity Wells don't have any display properties, i.e. they are not Sprites.
*
* This class was directly inspired by the work of Richard Lord and some of the jsdocs
* use his original text. As such this class is released under an MIT License.
* 
* @class Phaser.ParticleStorm.GravityWell
* @constructor
* @param {Phaser.ParticleStorm.Emitter} emitter - The Emitter that owns this Gravity Well.
* @param {number} [x=0] - The x coordinate of the Gravity Well, the point towards which particles are drawn.
* @param {number} [y=0] - The y coordinate of the Gravity Well, the point towards which particles are drawn.
* @param {number} [power=0] - The strength of the gravity well. Larger numbers create stronger forces. Start with low values like 1.
* @param {number} [epsilon=100] - The minimum distance for which gravity is calculated. 
*                               Particles closer than this distance experience a gravity force as if 
*                               they were this distance away. This stops the gravity effect blowing 
*                               up as distances get small. For realistic gravity effects you will want 
*                               a small epsilon (~1), but for stable visual effects a larger
*                               epsilon (~100) is often better.
* @param {number} [gravity=50] - The gravity constant.
*/
Phaser.ParticleStorm.GravityWell = function (emitter, x, y, power, epsilon, gravity) {

    if (x === undefined) { x = 0; }
    if (y === undefined) { y = 0; }
    if (power === undefined) { power = 0; }
    if (epsilon === undefined) { epsilon = 100; }
    if (gravity === undefined) { gravity = 50; }

    /**
    * @property {Phaser.ParticleStorm.Emitter} emitter - The Emitter that this Gravity Well belongs to.
    */
    this.emitter = emitter;

    /**
    * @property {Phaser.Time} time - A reference to the Phaser.Time system.
    */
    this.time = emitter.game.time;

    /**
    * @property {Phaser.Point} position - The position of the Gravity Well in world space.
    */
    this.position = new Phaser.Point(x, y);

    /**
    * @property {boolean} active - When `true` the Gravity Well is in effect. When `false` it doesn't influence particles.
    */
    this.active = true;

    /**
    * @property {number} _gravity - Internal gravity var.
    * @private
    */
    this._gravity = gravity;

    /**
    * @property {number} _power - Internal power var.
    * @private
    */
    this._power = 0;

    /**
    * @property {number} _epsilon - Internal epsilon var.
    * @private
    */
    this._epsilon = 0;

    this.power = power;
    this.epsilon = epsilon;

};

Phaser.ParticleStorm.GravityWell.prototype = {

    /**
    * Applies the influence of this Gravity Well to the given Particle.
    *
    * This is called automatically by the Emitter the Gravity Well belongs to.
    * 
    * @method Phaser.ParticleStorm.GravityWell#step
    * @param {Phaser.ParticleStorm.Particle} particle - The particle to adjust based on this Gravity Well.
    */
    step: function (particle) {
        let transform_x = 0;
        let transform_y = 0;
        if (particle.emitter.transforms) {
            let transforms_count = 0;
            for (let transform_key in particle.active_transforms) {
                transform_x += particle.active_transforms[transform_key].x;
                transform_y += particle.active_transforms[transform_key].y;
                ++transforms_count;
            }
            transform_x /= transforms_count;
            transform_y /= transforms_count;
        } else {
            transform_x = particle.transform.x;
            transform_y = particle.transform.y;
        }
        var x = this.position.x - transform_x;
        var y = this.position.y - transform_y;
        var dSq = x * x + y * y;

        if (dSq === 0)
        {
            return;
        }

        var d = Math.sqrt(dSq);

        if (dSq < this._epsilon)
        {
            dSq = this._epsilon;
        }

        var factor = (this._power * this.time.delta) / (dSq * d);

        particle.transform.velocity.x.value += x * factor;
        particle.transform.velocity.y.value += y * factor;

    }

};

/**
* The minimum distance for which the gravity force is calculated. 
* Particles closer than this distance experience the gravity as if
* they were this distance away. This stops the gravity effect blowing 
* up as distances get small.  For realistic gravity effects you will want 
* a small epsilon (~1), but for stable visual effects a larger
* epsilon (~100) is often better.
* 
* @name Phaser.ParticleStorm.GravityWell#epsilon
* @property {number} epsilon
*/
Object.defineProperty(Phaser.ParticleStorm.GravityWell.prototype, "epsilon", {

    get: function () {

        return Math.sqrt(this._epsilon);

    },

    set: function (value) {

        this._epsilon = value * value;

    }

});

/**
* The strength of the gravity force - larger numbers produce a stronger force.
* 
* @name Phaser.ParticleStorm.GravityWell#power
* @property {number} power
*/
Object.defineProperty(Phaser.ParticleStorm.GravityWell.prototype, "power", {

    get: function () {

        return this._power / this.gravity;

    },

    set: function (value) {

        this._power = value * this.gravity;

    }

});

/**
* The gravity constant against which the forces are calculated.
* 
* @name Phaser.ParticleStorm.GravityWell#gravity
* @property {number} gravity
*/
Object.defineProperty(Phaser.ParticleStorm.GravityWell.prototype, "gravity", {

    get: function () {

        return this._gravity;

    },

    set: function (value) {

        var pwr = this.power;
        this._gravity = value;
        this.power = pwr;

    }

});

Phaser.ParticleStorm.GravityWell.prototype.constructor = Phaser.ParticleStorm.GravityWell;

/**
* @author       Richard Davey <rich@photonstorm.com>
* @author       Pete Baron <pete@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link http://choosealicense.com/licenses/no-license/|No License}
*/

/**
 * A collection of common functions.
 *
 * @class Phaser.ParticleStorm.Graph
 * @static
 */
Phaser.ParticleStorm.Graph = {

    /**
    * A constant used for the Linear control sets.
    * @constant
    * @type {array}
    */
    CONTROL_LINEAR: [ { x: 0, y: 1 }, { x: 1, y: 0 } ],

    /**
    * A constant used for the reversed linear control sets.
    * @constant
    * @type {array}
    */
    CONTROL_REVERSE: [ { x: 0, y: 0 }, { x: 1, y: 1 } ],

    /**
    * A constant used for yoyo'd linear control sets.
    * @constant
    * @type {array}
    */
    CONTROL_YOYO: [ { x: 0, y: 0 }, { x: 0.5, y: 1 }, { x: 1, y: 0 } ],

    /**
    * Get the control value by linear interpolation of points in the control array
    * for the current percent "x" value.
    * 
    * NOTE: The control array must contain at least points with x = 0 and x = 1, 
    * other points may lie between those.
    *
    * @method Phaser.ParticleStorm.Graph#getControlValue
    * @param {object} control - The control curve for a parameter.
    * @param {number} percent - A value between 0 and 1.
    * @return {number} The control value at 'percent'.
    */
    getControlValue: function (control, percent) {

        var index = 0;
        var point = control[index];

        if (point.x === percent)
        {
            return point.y;
        }

        while (point.x <= percent)
        {
            if (index >= control.length - 1)
            {
                return point.x;
            }

            point = control[++index];
        }

        var prev = control[index - 1];

        //  Linear interpolation: f(x) = y0 + (y1 - y0) * (x - x0) / (x1 - x0)
        return prev.y + (percent - prev.x) * (point.y - prev.y) / (point.x - prev.x);

    },

    /**
    * Create a list of all control values between the start and end times given.
    *
    * @method Phaser.ParticleStorm.Graph#getControlValues
    * @param {object} control - The control graph.
    * @param {number} previousPercent - The starting "x" value.
    * @param {number} nowPercent - The ending "x" value.
    * @return {array} An array of point objects: {x: number, y: number}[]
    */
    getControlValues: function (control, previousPercent, nowPercent) {

        // create a list containing the starting point at previousPercent, interpolated if necessary
        var firsty = Phaser.ParticleStorm.Graph.getControlValue(control, previousPercent);
        var points = [ { x: previousPercent, y: firsty } ];

        // no time has elapsed, that's all she wrote
        if (previousPercent >= nowPercent)
        {
            return points;
        }

        // scan the control array for x values between previousPercent and nowPercent, add them to the list
        for (var i = 0; i < control.length; i++)
        {
            if (control[i].x > previousPercent)
            {
                if (control[i].x < nowPercent)
                {
                    points.push(control[i]);
                }
                else
                {
                    // early out, array is in ascending order so there's no need to search the rest
                    break;
                }
            }
        }

        // push the terminal point at nowPercent, interpolated if necessary
        points.push({ x: nowPercent, y: Phaser.ParticleStorm.Graph.getControlValue(control, nowPercent) });

        return points;

    },

    /**
    * Get a value for the area under a control graph (if there is one on param)
    * Otherwise just return the "value" field of param.
    *
    * @method Phaser.ParticleStorm.Graph#getParamArea
    * @param {object} param - The parameter to evaluate.
    * @param {number} previousPercent - The life percent to begin the calculation from (0 .. 1).
    * @param {number} nowPercent - The life percent where the calculation ends (0 .. 1).
    * @return {number} The area found.
    */
    getParamArea: function (param, previousPercent, nowPercent) {

        if (param.control)
        {
            return param.value * Phaser.ParticleStorm.Graph.getControlArea(param.control, previousPercent, nowPercent);
        }

        return param.value;

    },

    /**
    * Calculate the area under a graph between two points.
    *
    * @method Phaser.ParticleStorm.Graph#getControlArea
    * @param {object} control - The graph definition as a list of objects with "x" and "y" fields.
    * @param {number} previousPercent - The starting "x" value.
    * @param {number} nowPercent - The ending "x" value.
    * @return {number} The area.
    */
    getControlArea: function (control, previousPercent, nowPercent) {

        // find all the points where the control array changes slope (including the points at previousPercent and nowPercent)
        var points = Phaser.ParticleStorm.Graph.getControlValues(control, previousPercent, nowPercent);

        if (previousPercent >= nowPercent)
        {
            return points[0].y;
        }

        // the total area under the lines is the sum areas of each trapezoid formed by a line segment, two verticals and the (y = 0) axis
        //
        //    /|\ __
        //   /A|B|C |
        //  |__|_|__|
        //
        var area = points.length > 1 ? 0 : points.y;
        var prev = points[0];

        for (var i = 1; i < points.length; i++)
        {
            var next = points[i];
            // area of a trapezoid is .5 * b * (h1 + h2)
            area += 0.5 * (next.x - prev.x) * (prev.y + next.y);
            prev = next;
        }

        return area;

    },

    /**
    * Return a value for an object which has an "initial" field.
    * The field can be either a number or a min-max range.
    * 
    * Number (eg. 1900.123)
    * Range (eg. { "min":-4.0, "max":123.45 })
    * Object with initial Number (eg. { "initial": 1900.123, ... })
    * Object with initial Range (eg. { "initial": { "min":-4.0, "max":123.45 }, ... })
    * Object without initial value at all (returns 0)
    * 
    * If there is no "initial" field, this function will return 0.
    *
    * @method Phaser.ParticleStorm.Graph#getMinMaxInitial
    * @param {object} object - The object to evaluate.
    * @return {number} The value found or zero if not found.
    */
    getMinMaxInitial: function (object) {

        if (object.initial !== undefined)
        {
            return Phaser.ParticleStorm.Graph.getMinMax(object.initial);
        }
        else
        {
            return 0;
        }

    },

    /**
    * Checks if the given value is numeric or not.
    *
    * @method Phaser.ParticleStorm.Graph#isNumeric
    * @param {object|number} n - The value to be checked.
    * @return {boolean} True if the value given is numeric, otherwise false.
    */
    isNumeric: function (n) {

        return !isNaN(parseFloat(n)) && isFinite(n);

    },

    /**
    * Pick a random number in the range between "min" and "max".
    * If the 'value' is not an object with "min" and "max" in it, return 'value'.
    *
    * @method Phaser.ParticleStorm.Graph#getMinMax
    * @param {object|number} value - An object with "min" and "max" values, or a plain number.
    * @return {number} The number picked.
    */
    getMinMax: function (value) {

        if (value !== undefined && value !== null && value.min !== undefined && value.max !== undefined)
        {
            return value.min + Math.random() * (value.max - value.min);
        }

        return value;

    },

    /**
    * Takes a source and destination graph control object and copies the values from `src` to `dest`.
    *
    * @method Phaser.ParticleStorm.Graph#clone
    * @param {object} src - The source control object from which the values are copied.
    * @param {object} dest - The destination control object into which the values are set.
    * @return {object} The destination object.
    */
    clone: function (src, dest) {

        dest.value = src.value;
        dest.initial = src.initial;
        dest.delta = src.delta;
        dest.offset = src.offset;
        dest.min = src.min;
        dest.max = src.max;
        dest.control = src.control;

        return dest;

    },

    /**
    * Takes a particle data setting and extracts just its value and control properties.
    *
    * @method Phaser.ParticleStorm.Graph#fromControl
    * @param {number|object} data - The source value or object from which the values are extracted.
    * @param {object} obj - The destination control object into which the values are set.
    */
    fromControl: function (data, obj) {

        if (data.value !== undefined)
        {
            obj.value = Phaser.ParticleStorm.Graph.getMinMax(data.value);
        }

        if (data.control)
        {
            if (data.control === 'linear')
            {
                obj.control = Phaser.ParticleStorm.Graph.CONTROL_LINEAR;
            }
            else if (data.control === 'reverse')
            {
                obj.control = Phaser.ParticleStorm.Graph.CONTROL_REVERSE;
            }
            else if (data.control === 'yoyo')
            {
                obj.control = Phaser.ParticleStorm.Graph.CONTROL_YOYO;
            }
            else
            {
                //  Reference the original object - could use Object.create here, but would rather
                //  save some memory and just use references.
                obj.control = data.control;
            }
        }

    },

    /**
    * Takes a particle data setting and extracts its values into the graph control object.
    *
    * @method Phaser.ParticleStorm.Graph#fromData
    * @param {number|object} data - The source value or object from which the values are extracted.
    * @param {object} obj - The destination control object into which the values are set.
    * @return {boolean} True if it was able to extract any data, false if it couldn't find any.
    */
    fromData: function (data, obj) {

        if (data === undefined || data === null)
        {
            return false;
        }

        if (typeof data === 'number')
        {
            obj.value = data;
            return true;
        }

        if (data.min !== undefined)
        {
            //  Allows you to do: rotation: { min: 0, max: 90 }
            //  assumes assignment to the value property only.
            obj.value = Phaser.ParticleStorm.Graph.getMinMax(data);
        }
        else if (data.value !== undefined)
        {
            //  Allows rotation: { value: { min: 0, max: 90 } }
            obj.value = Phaser.ParticleStorm.Graph.getMinMax(data.value);
        }

        if (data.initial !== undefined)
        {
            obj.initial = Phaser.ParticleStorm.Graph.getMinMax(data.initial);
        }

        if (data.delta !== undefined)
        {
            obj.delta = Phaser.ParticleStorm.Graph.getMinMax(data.delta);
        }

        if (data.offset !== undefined)
        {
            obj.offset = Phaser.ParticleStorm.Graph.getMinMax(data.offset);
        }

        if (data.control)
        {
            if (data.control === 'linear')
            {
                obj.control = Phaser.ParticleStorm.Graph.CONTROL_LINEAR;
            }
            else if (data.control === 'reverse')
            {
                obj.control = Phaser.ParticleStorm.Graph.CONTROL_REVERSE;
            }
            else if (data.control === 'yoyo')
            {
                obj.control = Phaser.ParticleStorm.Graph.CONTROL_YOYO;
            }
            else
            {
                //  Reference the original object - could use Object.create here, but would rather
                //  save some memory and just use references.
                obj.control = data.control;
            }
        }

        return true;

    },

    /**
    * Return the value of this parameter object.
    * 
    * Get the control value by linear interpolation of points in the control array for the current percent "x" value.
    * 
    * NOTE: The control array must contain at least points with x = 0 and x = 1, other points may lie between those
    *
    * @method Phaser.ParticleStorm.Graph#getValue
    * @param {number|object} obj - The source graph control object from which the value is extracted.
    * @param {number} percent - The current lifePercent value of a particle.
    * @return {number} The value of the parameter object at this point in the particles life.
    */
    getValue: function (obj, percent, callback) {

        if (!obj.control || percent === undefined)
        {
            return obj.value;
        }

        var point = obj.control[0];

        //  Very start of the graph?
        if (point.x === percent)
        {
            return point.y;
        }

        var index = obj.control.length - 1;

        //  Very end of the graph?
        var last = obj.control[index];

        if (last.x === percent)
        {
            return last.y;
        }

        index = 0;

        while (point.x <= percent)
        {
            if (index >= obj.control.length - 1)
            {
                return point.y;
            }

            point = obj.control[++index];
        }

        var prev = obj.control[index - 1];

        if (callback) {
            callback(prev);
        }

        //  Linear interpolation: f(x) = y0 + (y1 - y0) * (x - x0) / (x1 - x0)
        return obj.value * (prev.y + (percent - prev.x) * (point.y - prev.y) / (point.x - prev.x));

    },

    /**
    * Return the value of this parameter object, clamped to be within the range obj.min to obj.max.
    * 
    * Get the control value by linear interpolation of points in the control array for the current percent "x" value.
    * 
    * NOTE: The control array must contain at least points with x = 0 and x = 1, other points may lie between those
    *
    * @method Phaser.ParticleStorm.Graph#getClampedValue
    * @param {number|object} obj - The source graph control object from which the value is extracted.
    * @param {number} percent - The current lifePercent value of a particle.
    * @return {number} The clammped value of the parameter object at this point in the particles life.
    */
    getClampedValue: function (obj, percent) {

        return Phaser.Math.clamp((obj.initial + this.getValue(obj, percent)) | 0, obj.min, obj.max);

    }

};

/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link http://choosealicense.com/licenses/no-license/|No License}
*/

Phaser.ParticleStorm.Zones = {};

/**
* The base class which all ParticleStorm zones must extend.
*
* @class Phaser.ParticleStorm.Zones.Base
* @constructor
* @param {Phaser.Game} game - A reference to the currently running game.
*/
Phaser.ParticleStorm.Zones.Base = function (game) {

    /**
    * @property {Phaser.Game} game - A reference to the Phaser Game instance.
    */
    this.game = game;

    /**
    * The active state of this Zone. If set to `false` it won't emit or process any particles.
    * @property {boolean} active
    */
    this.active = true;

    /**
    * The scale of this zone. You can scale a zone, which influences the position of
    * emitted particles and the overall dimensions of the zone.
    * @property {Phaser.Point} scale
    */
    this.scale = new Phaser.Point(1, 1);

    /**
    * When scanning the pixels of image based zones you can set it to ignore any pixel
    * with an alpha value *below* the threshold. This is a value between 0 (fully
    * transparent) to 255 (fully opaque). If you change this value you need to call
    * `update` afterwards to re-scan the zone.
    * @property {integer} alphaThreshold
    * @default
    */
    this.alphaThreshold = 0;

    /**
    * @property {Phaser.Point} _rnd - Internal point property.
    * @private
    */
    this._rnd = new Phaser.Point();

};

Phaser.ParticleStorm.Zones.Base.prototype = {

    /**
    * Gets a random point from within this zone.
    * Takes the scale of the zone into account.
    * 
    * Internally this method uses the private _rnd property
    * of this zone, so what is returned is a reference to
    * that Phaser.Point object. So if you need to store
    * the result rather than use it immediately you should
    * clone the Point or extract its values.
    *
    * @method Phaser.ParticleStorm.Zones.Base#getRandom
    * @return {Phaser.Point} A random point within this zone.
    */
    getRandom: function () {

        if (this.shape === Phaser.Point)
        {
            this._rnd = this.shape;
        }
        else
        {
            this.shape.random(this._rnd);
        }

        this._rnd.x *= this.scale.x;
        this._rnd.y *= this.scale.y;

        return this._rnd;

    },

    /**
    * Emits the `qty` number of particles on the given emitter.
    * Each particle is given a random location from within this zone.
    *
    * @method Phaser.ParticleStorm.Zones.Base#emit
    * @param {Phaser.ParticleStorm.Emitter} emitter - The emitter containing the particles to be emitted from this zone.
    * @param {string} key - The key of the data that the particle will use to obtain its emission values from.
    * @param {number|array} x - The x location of the new particle.
    * @param {number|array} y - The y location of the new particle.
    * @param {number} qty - The quantity of particles to emit.
    * @return {Phaser.ParticleStorm.Particle} The particle that was emitted. If more than one was emitted it returns the last particle.
    */
    emit: function (emitter, key, x, y, qty) {

        //  ------------------------------------------------
        //  If the coordinates are arrays it uses them as min/max pairs
        //  ------------------------------------------------
        if (Array.isArray(x))
        {
            x = this.game.rnd.between(x[0], x[1]);
        }

        if (Array.isArray(y))
        {
            y = this.game.rnd.between(y[0], y[1]);
        }

        //  ------------------------------------------------
        //  If the coordinates are functions, call them to retrieve the value
        //  ------------------------------------------------
        if (x instanceof Function)
        {
            x = x();
        }

        if (y instanceof Function)
        {
            y = y();
        }

        var particle = null;

        for (var i = 0; i < qty; i++)
        {
            this.shape.random(this._rnd);

            particle = emitter.emitParticle(key, x + (this._rnd.x * this.scale.x), y + (this._rnd.y * this.scale.y), null);
        }

        return particle;

    }

};

Phaser.ParticleStorm.Zones.Base.prototype.constructor = Phaser.ParticleStorm.Zones.Base;

/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link http://choosealicense.com/licenses/no-license/|No License}
*/

/**
* A Point Zone defines a point object from within which particles can be emitted.
* 
* @class Phaser.ParticleStorm.Zones.Point
* @constructor
* @param {Phaser.Game} game - A reference to the currently running game.
* @param {number} [x=0] - The horizontal position of this Point Zone.
* @param {number} [y=0] - The vertical position of this Point Zone.
*/
Phaser.ParticleStorm.Zones.Point = function (game, x, y) {

    Phaser.ParticleStorm.Zones.Base.call(this, game);

    /**
    * The Phaser geometry primitive this zone uses.
    * @property {Phaser.Point} shape
    */
    this.shape = new Phaser.Point(x, y);

};

Phaser.ParticleStorm.Zones.Point.prototype = Object.create(Phaser.ParticleStorm.Zones.Base.prototype);
Phaser.ParticleStorm.Zones.Point.prototype.constructor = Phaser.ParticleStorm.Zones.Point;

/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link http://choosealicense.com/licenses/no-license/|No License}
*/

/**
* A Rectangle Zone defines a rectangle object from within which particles can be emitted.
* 
* @class Phaser.ParticleStorm.Zones.Rectangle
* @constructor
* @extends Phaser.ParticleStorm.Zones.Base
* @param {Phaser.Game} game - A reference to the currently running game.
* @param {number} [width=0] - The width of the Rectangle. Should always be either zero or a positive value.
* @param {number} [height=0] - The height of the Rectangle. Should always be either zero or a positive value.
*/
Phaser.ParticleStorm.Zones.Rectangle = function (game, width, height) {

    Phaser.ParticleStorm.Zones.Base.call(this, game);

    /**
    * The Phaser geometry primitive this zone uses.
    * @property {Phaser.Rectangle} shape
    */
    this.shape = new Phaser.Rectangle(0, 0, width, height);

};

Phaser.ParticleStorm.Zones.Rectangle.prototype = Object.create(Phaser.ParticleStorm.Zones.Base.prototype);
Phaser.ParticleStorm.Zones.Rectangle.prototype.constructor = Phaser.ParticleStorm.Zones.Rectangle;

/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link http://choosealicense.com/licenses/no-license/|No License}
*/

/**
* A Circle Zone defines a circular area from within which particles can be emitted.
* 
* @class Phaser.ParticleStorm.Zones.Circle
* @constructor
* @extends Phaser.ParticleStorm.Zones.Base
* @param {Phaser.Game} game - A reference to the currently running game.
* @param {number} [radius=0] - The radius of the circle in pixels.
*/
Phaser.ParticleStorm.Zones.Circle = function (game, radius) {

    Phaser.ParticleStorm.Zones.Base.call(this, game);

    /**
    * The Phaser geometry primitive this zone uses.
    * @property {Phaser.Circle} shape
    */
    this.shape = new Phaser.Circle(0, 0, radius * 2);

};

Phaser.ParticleStorm.Zones.Circle.prototype = Object.create(Phaser.ParticleStorm.Zones.Base.prototype);
Phaser.ParticleStorm.Zones.Circle.prototype.constructor = Phaser.ParticleStorm.Zones.Circle;

/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link http://choosealicense.com/licenses/no-license/|No License}
*/

/**
* An Ellipse Zone defines an elliptical area from within which particles can be emitted.
* 
* @class Phaser.ParticleStorm.Zones.Ellipse
* @constructor
* @extends Phaser.ParticleStorm.Zones.Base
* @param {Phaser.Game} game - A reference to the currently running game.
* @param {number} [width=0] - The overall width of this ellipse.
* @param {number} [height=0] - The overall height of this ellipse.
*/
Phaser.ParticleStorm.Zones.Ellipse = function (game, width, height) {

    Phaser.ParticleStorm.Zones.Base.call(this, game);

    /**
    * The Phaser geometry primitive this zone uses.
    * @property {Phaser.Ellipse} shape
    */
    this.shape = new Phaser.Ellipse(0, 0, width, height);

};

Phaser.ParticleStorm.Zones.Ellipse.prototype = Object.create(Phaser.ParticleStorm.Zones.Base.prototype);
Phaser.ParticleStorm.Zones.Ellipse.prototype.constructor = Phaser.ParticleStorm.Zones.Ellipse;

/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link http://choosealicense.com/licenses/no-license/|No License}
*/

/**
* A Line Zone defines a line segment from within which particles can be emitted.
* 
* @class Phaser.ParticleStorm.Zones.Line
* @constructor
* @param {Phaser.Game} game - A reference to the currently running game.
* @param {number} [x1=0] - The x coordinate of the start of the line.
* @param {number} [y1=0] - The y coordinate of the start of the line.
* @param {number} [x2=0] - The x coordinate of the end of the line.
* @param {number} [y2=0] - The y coordinate of the end of the line.
*/
Phaser.ParticleStorm.Zones.Line = function (game, x1, y1, x2, y2) {

    Phaser.ParticleStorm.Zones.Base.call(this, game);

    /**
    * The Phaser geometry primitive this zone uses.
    * @property {Phaser.Line} shape
    */
    this.shape = new Phaser.Line(x1, y1, x2, y2);

};

Phaser.ParticleStorm.Zones.Line.prototype = Object.create(Phaser.ParticleStorm.Zones.Base.prototype);
Phaser.ParticleStorm.Zones.Line.prototype.constructor = Phaser.ParticleStorm.Zones.Line;

/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link http://choosealicense.com/licenses/no-license/|No License}
*/

/**
* A Spline Zone. A spline consists of a set of points through which a path is 
* constructed. Particles can be emitted anywhere along this path.
* 
* The points can be set from a variety of formats:
*
* - An array of Point objects: `[new Phaser.Point(x1, y1), ...]`
* - An array of objects with public x/y properties: `[ { x: 0, y: 0 }, ...]`
* - An array of objects with public x/y properties: `[obj1, obj2, ...]`
* 
* @class Phaser.ParticleStorm.Zones.Spline
* @constructor
* @param {Phaser.Game} game - A reference to the currently running game.
* @param {integer} [mode=0] - The type of spline to create. 0 = linear, 1 = bezier and 2 = catmull.
* @param {number} [resolution=1000] - The resolution of the spline. Higher values generate more points during path interpolation.
* @param {boolean} [closed=true] - A closed path loops from the final point back to the start again.
* @param {Phaser.Point[]|number[]|...Phaser.Point|...number} points - An array of points to use for the spline.
*        These can also be set later via `ParticleStorm.Zones.Spline.setTo`.
*/
Phaser.ParticleStorm.Zones.Spline = function (game, mode, resolution, closed, points) {

    if (mode === undefined) { mode = 0; }
    if (resolution === undefined) { resolution = 1000; }
    if (closed === undefined) { closed = true; }

    Phaser.ParticleStorm.Zones.Base.call(this, game);

    /**
    * Reference to the Phaser.Math class.
    * @property {Phaser.Math} math
    */
    this.math = this.game.math;

    /**
    * An object holding the point values.
    * @property {object} points
    */
    this.points = { x: [], y: [] };

    /**
    * An array containing the interpolated path values.
    * @property {array} path
    */
    this.path = [];

    /**
    * The resolution controls how tightly packed together the interpolated results are.
    * @property {integer} resolution
    */
    this.resolution = resolution;

    /**
    * The type of spline. 0 = linear, 1 = bezier and 2 = catmull.
    * @property {integer} mode
    */
    this.mode = mode;

    /**
    * A closed path loops from the final point back to the start again.
    * @property {boolean} closed
    */
    this.closed = closed;

    /**
    * @property {number} mult - Internal index var.
    * @private
    */
    this.mult = 0;

    this.update(points);

};

Phaser.ParticleStorm.Zones.Spline.prototype = Object.create(Phaser.ParticleStorm.Zones.Base.prototype);
Phaser.ParticleStorm.Zones.Spline.prototype.constructor = Phaser.ParticleStorm.Zones.Spline;

/**
* Updates the spline path data. This clears the path and rebuilds it based on
* the points given.
* 
* @method Phaser.ParticleStorm.Zones.Spline#update
* @param {Phaser.Point[]|number[]|...Phaser.Point|...number} points - An array of points to use for the spline.
*        These can also be set later via `ParticleStorm.Zones.Spline.setTo`.
* @return {Phaser.ParticleStorm.Zones.Spline} This zone.
*/
Phaser.ParticleStorm.Zones.Spline.prototype.update = function (points) {

    this.points = { x: [], y: [] };
    this.path = [];

    for (var i = 0; i < points.length; i++)
    {
        this.points.x.push(points[i].x);
        this.points.y.push(points[i].y);
    }

    if (this.closed)
    {
        this.points.x.push(points[0].x);
        this.points.y.push(points[0].y);
    }

    //  Now loop through the points and build the path data
    var ix = 0;
    var x = 1 / this.resolution;

    for (var i = 0; i <= 1; i += x)
    {
        if (this.mode === 0)
        {
            var px = this.math.linearInterpolation(this.points.x, i);
            var py = this.math.linearInterpolation(this.points.y, i);
        }
        else if (this.mode === 1)
        {
            var px = this.math.bezierInterpolation(this.points.x, i);
            var py = this.math.bezierInterpolation(this.points.y, i);
        }
        else if (this.mode === 2)
        {
            var px = this.math.catmullRomInterpolation(this.points.x, i);
            var py = this.math.catmullRomInterpolation(this.points.y, i);
        }

        var node = { x: px, y: py, angle: 0 };

        if (ix > 0)
        {
            node.angle = this.math.angleBetweenPoints(this.path[ix - 1], node);
        }

        this.path.push(node);

        ix++;
    }

    this.mult = this.path.length / 100;

    return this;

};

/**
* Gets a random point from this path.
* 
* @method Phaser.ParticleStorm.Zones.Spline#getRandom
* @return {object} A point from the path. The object contains public x, y and angle properties.
*/
Phaser.ParticleStorm.Zones.Spline.prototype.getRandom = function () {

    return this.game.rnd.pick(this.path);

};

/**
* Emits the `qty` number of particles on the given emitter.
* 
* Each particle has a random location from the path of this spline.
*
* @method Phaser.ParticleStorm.Zones.Spline#emit
* @param {Phaser.ParticleStorm.Emitter} emitter - The emitter containing the particles to be emitted from this zone.
* @param {string} key - The key of the data that the particle will use to obtain its emission values from.
* @param {number} x - The x location of the new particle.
* @param {number} y - The y location of the new particle.
* @param {number} qty - The quantity of particles to emit.
* @return {Phaser.ParticleStorm.Particle} The particle that was emitted. If more than one was emitted it returns the last particle.
*/
Phaser.ParticleStorm.Zones.Spline.prototype.emit = function (emitter, key, x, y, qty) {

    //  ------------------------------------------------
    //  If the coordinates are arrays it uses them as min/max pairs
    //  ------------------------------------------------
    if (Array.isArray(x))
    {
        x = this.game.rnd.between(x[0], x[1]);
    }

    if (Array.isArray(y))
    {
        y = this.game.rnd.between(y[0], y[1]);
    }

    //  ------------------------------------------------
    //  If the coordinates are functions, call them to retrieve the value
    //  ------------------------------------------------
    if (x instanceof Function)
    {
        x = x();
    }

    if (y instanceof Function)
    {
        y = y();
    }

    var rnd = null;
    var particle = null;

    for (var i = 0; i < qty; i++)
    {
        rnd = this.game.rnd.pick(this.path);

        particle = emitter.emitParticle(key, x + rnd.x, y + rnd.y);
    }

    return particle;

};

/**
* Emits the `qty` number of particles on the given emitter.
* 
* Each particle has its location based on the percent argument.
* For example a percent value of 0 will emit a particle right at the
* start of the spline, where-as a percent value of 50 will emit a 
* particle half-way along the spline.
*
* @method Phaser.ParticleStorm.Zones.Spline#emit
* @param {Phaser.ParticleStorm.Emitter} emitter - The emitter containing the particles to be emitted from this zone.
* @param {string} key - The key of the data that the particle will use to obtain its emission values from.
* @param {number} x - The x location of the new particle.
* @param {number} y - The y location of the new particle.
* @param {number} qty - The quantity of particles to emit.
* @param {number} percent - The distance along the path to emit the particles from. Between 0 and 100.
* @return {Phaser.ParticleStorm.Particle} The particle that was emitted. If more than one was emitted it returns the last particle.
*/
Phaser.ParticleStorm.Zones.Spline.prototype.emitPercent = function (emitter, key, x, y, qty, percent) {

    //  ------------------------------------------------
    //  If the coordinates are arrays it uses them as min/max pairs
    //  ------------------------------------------------
    if (Array.isArray(x))
    {
        x = this.game.rnd.between(x[0], x[1]);
    }

    if (Array.isArray(y))
    {
        y = this.game.rnd.between(y[0], y[1]);
    }

    //  ------------------------------------------------
    //  If the coordinates are functions, call them to retrieve the value
    //  ------------------------------------------------
    if (x instanceof Function)
    {
        x = x();
    }

    if (y instanceof Function)
    {
        y = y();
    }

    var particle = null;

    percent = Math.floor(percent * this.mult);

    for (var i = 0; i < qty; i++)
    {
        var path = this.path[percent];

        if (path)
        {
            particle = emitter.emitParticle(key, x + path.x, y + path.y);
        }
    }

    return particle;

};

/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link http://choosealicense.com/licenses/no-license/|No License}
*/

/**
* A Text Zone. This is a special kind of zone that scans the pixel data of the given
* Text object and uses it to emit particles from.
*
* Based on the type of renderer being used with this Text zone you can emit particles
* based on the pixels in the text, optionally tinting and setting their alpha to match.
* 
* @class Phaser.ParticleStorm.Zones.Text
* @constructor
* @param {Phaser.Game} game - A reference to the currently running game.
* @param {Phaser.Text} text - The Text object used to populate this zone.
*/
Phaser.ParticleStorm.Zones.Text = function (game, text) {

    Phaser.ParticleStorm.Zones.Base.call(this, game);

    /**
    * The BitmapData object which is used to populate this zone.
    * @property {Phaser.BitmapData} bmd
    */
    this.bmd = new Phaser.BitmapData(game, 'ParticleStorm.Text');

    /**
    * A reference to the Phaser.Text object that populates the data in this zone.
    * @property {Phaser.Text} text
    */
    this.text = text;

    /**
    * This array holds all of the pixel color data from the pixels that were
    * scanned (i.e. non-transparent pixels). It is used internally and should
    * not usually be modified directly.
    * @property {array} points
    */
    this.points = [];

    this.update(text);

};

Phaser.ParticleStorm.Zones.Text.prototype = Object.create(Phaser.ParticleStorm.Zones.Base.prototype);
Phaser.ParticleStorm.Zones.Text.prototype.constructor = Phaser.ParticleStorm.Zones.Text;

/**
* Updates the contents of this zone. It resets the `points` array, clearing previous
* pixel data. If a `text` argument was provided the new Text object is loaded, then it has all
* pixels scanned and stored in the points array.
*
* The scale of the Text object is reset to 1:1 before the pixel data is scanned. The scale
* is restored again once the scan is complete. This zone is also scaled to match the scale
* of the Text object given to it.
*
* If you don't provide a `text` argument then it has the effect of re-scanning the current
* Text object, which is useful if you've modified it in any way (for example by changing
* the text value.)
*
* @method Phaser.ParticleStorm.Zones.Text#update
* @param {Phaser.Text} [text] - The Text object used to populate this zone.
* @return {Phaser.ParticleStorm.Zones.Text} This zone.
*/
Phaser.ParticleStorm.Zones.Text.prototype.update = function (text) {

    if (text !== undefined)
    {
        this.text = text;
    }
    else
    {
        text = this.text;
    }

    //  Store the Text object properties before we reset them

    var tx = text.x;
    var ty = text.y;

    var sx = text.scale.x;
    var sy = text.scale.y;

    //  Write the Text to the bmd

    text.x = 0;
    text.y = 0;

    text.scale.set(1);

    this.points = [];

    this.bmd.load(text);

    this.bmd.processPixelRGB(this.addPixel, this);

    this.scale = new Phaser.Point(sx, sy);

    //  Restore the Text object properties

    text.x = tx;
    text.y = ty;

    text.scale.set(sx, sy);

    return this;

};

/**
* Internal method used by the processPixelRGB call. Checks if the given
* color alpha is above `alphaThreshold` and if so it adds it to the
* points array.
*
* @method Phaser.ParticleStorm.Zones.Text#addPixel
* @param {object} color - The color object created by the processPixelRGB method.
* @param {number} x - The x coordinate of the pixel within the image.
* @param {number} y - The y coordinate of the pixel within the image.
* @return {boolean} This method must always return false.
*/
Phaser.ParticleStorm.Zones.Text.prototype.addPixel = function (color, x, y) {

    if (color.a > this.alphaThreshold)
    {
        this.points.push( { x: x, y: y, color: { r: color.r, g: color.g, b: color.b, a: color.a / 255 } });
    }

    return false;

};

/**
* Gets a single random pixel data object from the text.
*
* The object contains x and y properties relating to its position within the text.
* It also contains a color object containing r, g, b and a properties for the red,
* green, blue and alpha values of the pixel respectively.
*
* @method Phaser.ParticleStorm.Zones.Text#getRandom
* @return {object} A pixel data object.
*/
Phaser.ParticleStorm.Zones.Text.prototype.getRandom = function () {

    var rnd = this.game.rnd.pick(this.points);

    rnd.x *= this.scale.x;
    rnd.y *= this.scale.y;

    return rnd;

};

/**
* Emits the `qty` number of particles on the given emitter.
* Each particle is given a random location from within this zone.
*
* @method Phaser.ParticleStorm.Zones.Text#emit
* @param {Phaser.ParticleStorm.Emitter} emitter - The emitter containing the particles to be emitted from this zone.
* @param {string} key - The key of the data that the particle will use to obtain its emission values from.
* @param {number} x - The x location of the new particle.
* @param {number} y - The y location of the new particle.
* @param {number} qty - The quantity of particles to emit.
* @param {boolean} setAlpha - Should the zone set the alpha of the particle?
* @param {boolean} setColor - Should the zone set the tint of the particle?
* @return {Phaser.ParticleStorm.Particle} The particle that was emitted. If more than one was emitted it returns the last particle.
*/
Phaser.ParticleStorm.Zones.Text.prototype.emit = function (emitter, key, x, y, qty, setAlpha, setColor) {

    //  ------------------------------------------------
    //  If the coordinates are arrays it uses them as min/max pairs
    //  ------------------------------------------------
    if (Array.isArray(x))
    {
        x = this.game.rnd.between(x[0], x[1]);
    }

    if (Array.isArray(y))
    {
        y = this.game.rnd.between(y[0], y[1]);
    }

    //  ------------------------------------------------
    //  If the coordinates are functions, call them to retrieve the value
    //  ------------------------------------------------
    if (x instanceof Function)
    {
        x = x();
    }

    if (y instanceof Function)
    {
        y = y();
    }

    var rnd = null;
    var particle = null;

    for (var i = 0; i < qty; i++)
    {
        rnd = this.game.rnd.pick(this.points);

        particle = emitter.emitParticle(key, x + (rnd.x * this.scale.x), y + (rnd.y * this.scale.y));

        if (particle)
        {
            if (setAlpha && rnd.color.a < 1)
            {
                particle.color.alpha.value = rnd.color.a;
            }

            if (setColor)
            {
                particle.color.setColor(rnd.color.r, rnd.color.g, rnd.color.b, rnd.color.a);
            }
        }
    }

    return particle;

};

/**
* Emits a particle for every pixel in this text object.
* The step and spacing arguments control the iteration through the pixels.
*
* @method Phaser.ParticleStorm.Zones.Text#emitFull
* @param {Phaser.ParticleStorm.Emitter} emitter - The emitter containing the particles to be emitted from this zone.
* @param {string} key - The key of the data that the particle will use to obtain its emission values from.
* @param {number} x - The x location of the new particle.
* @param {number} y - The y location of the new particle.
* @param {number} step - Controls the iteration through the pixel data.
* @param {number|array} spacing - The spacing between the particle coordinates.
* @param {boolean} setAlpha - Should the zone set the alpha of the particle?
* @param {boolean} setColor - Should the zone set the tint of the particle?
* @return {Phaser.ParticleStorm.Particle} The particle that was emitted. If more than one was emitted it returns the last particle.
*/
Phaser.ParticleStorm.Zones.Text.prototype.emitFull = function (emitter, key, x, y, step, spacing, setAlpha, setColor) {

    if (step === undefined) { step = 1; }

    var sx = 1;
    var sy = 1;

    if (Array.isArray(spacing))
    {
        sx = spacing[0];
        sy = spacing[1];
    }
    else if (typeof spacing === 'number')
    {
        sx = spacing;
        sy = spacing;
    }

    //  ------------------------------------------------
    //  If the coordinates are arrays it uses them as min/max pairs
    //  ------------------------------------------------
    if (Array.isArray(x))
    {
        x = this.game.rnd.between(x[0], x[1]);
    }

    if (Array.isArray(y))
    {
        y = this.game.rnd.between(y[0], y[1]);
    }

    //  ------------------------------------------------
    //  If the coordinates are functions, call them to retrieve the value
    //  ------------------------------------------------
    if (x instanceof Function)
    {
        x = x();
    }

    if (y instanceof Function)
    {
        y = y();
    }

    var point = null;
    var particle = null;

    for (var i = 0; i < this.points.length; i += step)
    {
        point = this.points[i];

        var px = x + (point.x * this.scale.x) * (sx / step);
        var py = y + (point.y * this.scale.y) * (sy / step);

        particle = emitter.emitParticle(key, px, py);

        if (particle)
        {
            if (setAlpha && point.color.a < 1)
            {
                particle.color.alpha.value = point.color.a;
            }

            if (setColor)
            {
                particle.color.setColor(point.color.r, point.color.g, point.color.b, point.color.a);
            }
        }
    }

    return particle;

};

/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link http://choosealicense.com/licenses/no-license/|No License}
*/

/**
* An Image Zone. This is a special kind of zone based on the pixel data in
* the given image.
*
* Based on the type of renderer being used with this Image zone you can emit particles
* based on the pixels in the image, optionally tinting and setting their alpha to match.
* 
* @class Phaser.ParticleStorm.Zones.Image
* @constructor
* @param {Phaser.Game} game - A reference to the currently running game.
* @param {Phaser.Sprite|Phaser.Image|Phaser.Text|Phaser.BitmapData|Image|HTMLCanvasElement|string} key - The object that 
*     will be used to create this Image zone. If you give a string it will try and find the Image in the Game.Cache first.
*/
Phaser.ParticleStorm.Zones.Image = function (game, key) {

    Phaser.ParticleStorm.Zones.Base.call(this, game);

    /**
    * The BitmapData object which is used to populate this zone.
    * @property {Phaser.BitmapData} bmd
    */
    this.bmd = new Phaser.BitmapData(game, 'ParticleStorm.Image');

    /**
    * The key given in the constructor or calls to `update`.
    * @property {Phaser.Sprite|Phaser.Image|Phaser.Text|Phaser.BitmapData|Image|HTMLCanvasElement|string} key
    * @private
    */
    this.key = key;

    /**
    * This array holds all of the pixel color data from the pixels that were
    * scanned (i.e. non-transparent pixels). It is used internally and should
    * not usually be modified directly.
    * @property {array} points
    */
    this.points = [];

    this.update(key);

};

Phaser.ParticleStorm.Zones.Image.prototype = Object.create(Phaser.ParticleStorm.Zones.Base.prototype);
Phaser.ParticleStorm.Zones.Image.prototype.constructor = Phaser.ParticleStorm.Zones.Image;

/**
* Updates the contents of this zone. It resets the `points` array, clearing previous
* pixel data. If a key argument was provided the new image is loaded, then it has all
* pixels scanned and stored in the points array.
*
* If you don't provide a key argument then it has the effect of re-scanning the current
* image, which is useful if you've modified the image or BitmapData directly.
*
* @method Phaser.ParticleStorm.Zones.Image#update
* @param {Phaser.Sprite|Phaser.Image|Phaser.Text|Phaser.BitmapData|Image|HTMLCanvasElement|string} [key] - The object that 
*     will be used to create this Image zone. If you give a string it will try and find the Image in the Game.Cache first.
* @return {Phaser.ParticleStorm.Zones.Image} This zone.
*/
Phaser.ParticleStorm.Zones.Image.prototype.update = function (key) {

    if (key === undefined) { key = this.key; }

    this.points = [];

    this.bmd.load(key);

    this.bmd.processPixelRGB(this.addPixel, this);

    return this;

};

/**
* Internal method used by the processPixelRGB call. Checks if the given
* color alpha is above `alphaThreshold` and if so it adds it to the
* points array.
*
* @method Phaser.ParticleStorm.Zones.Image#addPixel
* @param {object} color - The color object created by the processPixelRGB method.
* @param {number} x - The x coordinate of the pixel within the image.
* @param {number} y - The y coordinate of the pixel within the image.
* @return {boolean} This method must always return false.
*/
Phaser.ParticleStorm.Zones.Image.prototype.addPixel = function (color, x, y) {

    if (color.a > this.alphaThreshold)
    {
        this.points.push( { x: x, y: y, color: { r: color.r, g: color.g, b: color.b, a: color.a / 255 } });
    }

    return false;

};

/**
* Gets a single random pixel data object from the image.
*
* The object contains x and y properties relating to its position within the image.
* It also contains a color object containing r, g, b and a properties for the red,
* green, blue and alpha values of the pixel respectively.
*
* @method Phaser.ParticleStorm.Zones.Image#getRandom
* @return {object} A pixel data object.
*/
Phaser.ParticleStorm.Zones.Image.prototype.getRandom = function () {

    var rnd = this.game.rnd.pick(this.points);

    rnd.x *= this.scale.x;
    rnd.y *= this.scale.y;

    return rnd;

};

/**
* Emits the `qty` number of particles on the given emitter.
* Each particle is given a random location from within this zone.
*
* @method Phaser.ParticleStorm.Zones.Image#emit
* @param {Phaser.ParticleStorm.Emitter} emitter - The emitter containing the particles to be emitted from this zone.
* @param {string} key - The key of the data that the particle will use to obtain its emission values from.
* @param {number} x - The x location of the new particle.
* @param {number} y - The y location of the new particle.
* @param {number} qty - The quantity of particles to emit.
* @param {boolean} setAlpha - Should the zone set the alpha of the particle?
* @param {boolean} setColor - Should the zone set the tint of the particle?
* @return {Phaser.ParticleStorm.Particle} The particle that was emitted. If more than one was emitted it returns the last particle.
*/
Phaser.ParticleStorm.Zones.Image.prototype.emit = function (emitter, key, x, y, qty, setAlpha, setColor) {

    //  ------------------------------------------------
    //  If the coordinates are arrays it uses them as min/max pairs
    //  ------------------------------------------------
    if (Array.isArray(x))
    {
        x = this.game.rnd.between(x[0], x[1]);
    }

    if (Array.isArray(y))
    {
        y = this.game.rnd.between(y[0], y[1]);
    }

    //  ------------------------------------------------
    //  If the coordinates are functions, call them to retrieve the value
    //  ------------------------------------------------
    if (x instanceof Function)
    {
        x = x();
    }

    if (y instanceof Function)
    {
        y = y();
    }

    var rnd = null;
    var particle = null;

    for (var i = 0; i < qty; i++)
    {
        rnd = this.game.rnd.pick(this.points);

        particle = emitter.emitParticle(key, x + (rnd.x * this.scale.x), y + (rnd.y * this.scale.y));

        if (particle)
        {
            if (setAlpha && rnd.color.a < 1)
            {
                particle.color.alpha.value = rnd.color.a;
            }

            if (setColor)
            {
                particle.color.setColor(rnd.color.r, rnd.color.g, rnd.color.b, rnd.color.a);
            }
        }
    }

    return particle;

};

/**
* Emits a particle for every pixel in this image.
* The step and spacing arguments control the iteration through the pixels.
*
* @method Phaser.ParticleStorm.Zones.Image#emitFull
* @param {Phaser.ParticleStorm.Emitter} emitter - The emitter containing the particles to be emitted from this zone.
* @param {string} key - The key of the data that the particle will use to obtain its emission values from.
* @param {number} x - The x location of the new particle.
* @param {number} y - The y location of the new particle.
* @param {number} step - Controls the iteration through the pixel data.
* @param {number|array} spacing - The spacing between the particle coordinates.
* @param {boolean} setAlpha - Should the zone set the alpha of the particle?
* @param {boolean} setColor - Should the zone set the tint of the particle?
* @return {Phaser.ParticleStorm.Particle} The particle that was emitted. If more than one was emitted it returns the last particle.
*/
Phaser.ParticleStorm.Zones.Image.prototype.emitFull = function (emitter, key, x, y, step, spacing, setAlpha, setColor) {

    if (step === undefined) { step = 1; }

    var sx = 1;
    var sy = 1;

    if (Array.isArray(spacing))
    {
        sx = spacing[0];
        sy = spacing[1];
    }
    else if (typeof spacing === 'number')
    {
        sx = spacing;
        sy = spacing;
    }

    //  ------------------------------------------------
    //  If the coordinates are arrays it uses them as min/max pairs
    //  ------------------------------------------------
    if (Array.isArray(x))
    {
        x = this.game.rnd.between(x[0], x[1]);
    }

    if (Array.isArray(y))
    {
        y = this.game.rnd.between(y[0], y[1]);
    }

    //  ------------------------------------------------
    //  If the coordinates are functions, call them to retrieve the value
    //  ------------------------------------------------
    if (x instanceof Function)
    {
        x = x();
    }

    if (y instanceof Function)
    {
        y = y();
    }

    var point = null;
    var particle = null;

    for (var i = 0; i < this.points.length; i += step)
    {
        point = this.points[i];

        var px = x + (point.x * this.scale.x) * (sx / step);
        var py = y + (point.y * this.scale.y) * (sy / step);

        particle = emitter.emitParticle(key, px, py);

        if (particle)
        {
            if (setAlpha && point.color.a < 1)
            {
                particle.color.alpha.value = point.color.a;
            }

            if (setColor)
            {
                particle.color.setColor(point.color.r, point.color.g, point.color.b, point.color.a);
            }
        }
    }

    return particle;

};

/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link http://choosealicense.com/licenses/no-license/|No License}
*/

/**
* The Texture control belongs to a single particle and controls all aspects of its texture.
* It allows you to control the texture, animation frame and z-index in display lists.
*
* @class Phaser.ParticleStorm.Controls.Texture
* @constructor
* @param {Phaser.ParticleStorm.Particle} particle - The particle this control belongs to.
*/
Phaser.ParticleStorm.Controls.Texture = function (particle) {

    /**
    * The particle this control belongs to.
    * @property {Phaser.ParticleStorm.Particle} particle
    */
    this.particle = particle;

    /**
    * A reference to the Phaser.RandomDataGenerator which several methods in this
    * control require.
    * @property {Phaser.RandomDataGenerator} rnd
    */
    this.rnd = particle.emitter.game.rnd;

    /**
    * @property {Phaser.ParticleStorm.Graph} graph - A set of useful common static functions.
    */
    this.graph = Phaser.ParticleStorm.Graph;

    /**
    * Particles that are spawned within a display list (such as Sprite particles) can
    * optionally be 'sent to the back' of the list upon being spawned.
    * @property {boolean} sendToBack
    * @default
    */
    this.sendToBack = false;

    /**
    * Particles that are spawned within a display list (such as Sprite particles) can
    * optionally be 'bought to the front' of the list upon being spawned.
    * @property {boolean} bringToTop
    * @default
    */
    this.bringToTop = true;

    /**
    * The key of the image this particle uses for rendering, if any.
    * @property {string} key
    * @default
    */
    this.key = null;

    /**
    * The current numeric frame of this particle texture, if using a sprite sheet.
    * @property {number} frame
    * @default
    */
    this.frame = undefined;

    /**
    * The current frame name of this particles texture, if using an atlas.
    * @property {string} frameName
    * @default
    */
    this.frameName = undefined;

    /**
    * The scale mode used by the texture.
    * @property {integer} scaleMode
    * @default
    */
    this.scaleMode = Phaser.scaleModes.DEFAULT;

};

Phaser.ParticleStorm.Controls.Texture.prototype = {

    /**
    * Resets this control and all properties of it. This is called automatically
    * when its parent particle is spawned.
    *
    * @method Phaser.ParticleStorm.Controls.Texture#reset
    */
    reset: function () {

        this.sendToBack = false;
        this.bringToTop = true;

        this.key = '__default';

        this.frame = undefined;
        this.frameName = undefined;

        this.scaleMode = Phaser.scaleModes.DEFAULT;

    },

    /**
    * Populates all aspects of this control to its particle that apply.
    *
    * @method Phaser.ParticleStorm.Controls.Texture#init
    */
    init: function (data) {

        //  ------------------------------------------------
        //  Send to Back / Bring to Front (boolean)
        //  ------------------------------------------------

        if (data.sendToBack)
        {
            this.sendToBack = data.sendToBack;
        }
        else if (data.bringToTop)
        {
            this.bringToTop = data.bringToTop;
        }

        //  ------------------------------------------------
        //  Particle image (string or array) with optional Frame
        //  ------------------------------------------------

        if (data.image)
        {
            if (Array.isArray(data.image))
            {
                this.key = this.rnd.pick(data.image);
            }
            else
            {
                this.key = data.image;
            }
        }

        //  Allows for single frame setting (index or string based, both work)
        if (data.frame !== undefined)
        {
            var f = data.frame;

            if (Array.isArray(data.frame))
            {
                f = this.rnd.pick(data.frame);
            }

            if (this.graph.isNumeric(f))
            {
                this.frame = f;
            }
            else
            {
                this.frameName = f;
            }
        }

        //  ------------------------------------------------
        //  Scale Mode
        //  ------------------------------------------------

        if (data.scaleMode)
        {
            var sm = data.scaleMode.toUpperCase();

            if (sm === 'LINEAR')
            {
                this.scaleMode = Phaser.scaleModes.LINEAR;
            }
            else if (sm === 'NEAREST')
            {
                this.scaleMode = Phaser.scaleModes.NEAREST;
            }
        }

    },

    /**
    * Called automatically when the parent particle updates. It applies
    * all texture controls to the particle based on its lifespan.
    *
    * @method Phaser.ParticleStorm.Controls.Texture#step
    * @param {object} data - The particle data object.
    * @param {Phaser.Sprite} [sprite] - The particle sprite.
    */
    step: function (data, sprite) {

        //  ------------------------------------------------
        //  Animation
        //  ------------------------------------------------

        if (this.particle.emitter.renderType === Phaser.ParticleStorm.SPRITE && data.animations !== undefined)
        {
            var names = [];

            for (var name in data.animations)
            {
                var anim = data.animations[name];

                var frames = null;
                var numeric = true;

                if (anim.frames !== undefined)
                {
                    if (Array.isArray(anim.frames))
                    {
                        frames = anim.frames;
                    }
                    else
                    {
                        frames = Phaser.Animation.generateFrameNames(anim.frames.prefix, anim.frames.start, anim.frames.stop, anim.frames.suffix, anim.frames.zeroPad);
                    }

                    if (typeof frames[0] === 'string')
                    {
                        numeric = false;
                    }
                }

                var frameRate = (anim.frameRate === undefined) ? 60 : anim.frameRate;
                var loop = (anim.loop === undefined) ? false : anim.loop;

                sprite.animations.add(name, frames, frameRate, loop, numeric);

                names.push(name);
            }

            if (names.length > 0)
            {
                if (data.play !== undefined)
                {
                    sprite.play(this.rnd.pick(data.play));
                }
                else
                {
                    sprite.play(names[0]);
                }
            }
        }

        //  ------------------------------------------------
        //  Z Order
        //  ------------------------------------------------

        if (this.sendToBack)
        {
            sprite.sendToBack();
        }
        else if (this.bringToTop)
        {
            sprite.bringToTop();
        }

    }

};

Phaser.ParticleStorm.Controls.Texture.prototype.constructor = Phaser.ParticleStorm.Controls.Texture;

/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link http://choosealicense.com/licenses/no-license/|No License}
*/

/**
* The Color control belongs to a single particle and controls all aspects of its color.
* It allows you to control the color channels, alpha, tint, hsv and other properties.
*
* @class Phaser.ParticleStorm.Controls.Color
* @constructor
* @param {Phaser.ParticleStorm.Particle} particle - The particle this control belongs to.
*/
Phaser.ParticleStorm.Controls.Color = function (particle) {

    /**
    * The particle this control belongs to.
    * @property {Phaser.ParticleStorm.Particle} particle
    */
    this.particle = particle;

    /**
    * @property {Phaser.ParticleStorm.Graph} graph - A set of useful common static functions.
    */
    this.graph = Phaser.ParticleStorm.Graph;

    /**
    * The red color channel control object.
    * This inherits all properties of the Phaser.ParticleStorm.BASE_255 object.
    * @property {object} red
    */
    this.red = {};

    /**
    * The green color channel control object.
    * This inherits all properties of the Phaser.ParticleStorm.BASE_255 object.
    * @property {object} green
    */
    this.green = {};

    /**
    * The blue color channel control object.
    * This inherits all properties of the Phaser.ParticleStorm.BASE_255 object.
    * @property {object} blue
    */
    this.blue = {};

    /**
    * The alpha channel control object.
    * This inherits all properties of the Phaser.ParticleStorm.BASE_1 object.
    * @property {object} alpha
    */
    this.alpha = {};

    /**
    * The hsv control object.
    * This inherits all properties of the Phaser.ParticleStorm.BASE_359 object.
    * @property {object} hsv
    */
    this.hsv = {};

    /**
    * A local helper object which stores HSV color modes for emitter renderers to use.
    * This is a reference to the array stored in Phaser.ParticleStorm.
    * 
    * @property {array} hsvData
    * @protected
    */
    this.hsvData = this.particle.emitter.parent.hsv;

    /**
    * This pre-calculated tint value.
    * @property {integer} tint
    */
    this.tint = 0;

    /**
    * A flag telling the renderer if a tint should be applied or not.
    * @property {boolean} isTinted
    */
    this.isTinted = false;

    /**
    * This pre-calculated rgba string.
    * @property {string} rgba
    */
    this.rgba = 'rgba(0, 0, 0, 1)';

    /**
    * The blend mode being used by the particle.
    * This is a reference to a ParticleStorm.blendModeMap entry.
    * @property {array} blendMode
    */
    this.blendMode = this.particle.emitter.parent.blendModeMap.NORMAL;

};

Phaser.ParticleStorm.Controls.Color.prototype = {

    /**
    * Resets this control and all properties of it. This is called automatically
    * when its parent particle is spawned.
    *
    * @method Phaser.ParticleStorm.Controls.Color#reset
    */
    reset: function () {

        this.red = Object.create(Phaser.ParticleStorm.BASE_255);
        this.green = Object.create(Phaser.ParticleStorm.BASE_255);
        this.blue = Object.create(Phaser.ParticleStorm.BASE_255);

        this.alpha = Object.create(Phaser.ParticleStorm.BASE_1);

        this.tint = 0xffffff;
        this.isTinted = false;

        this.isHSV = false;
        this.hsv = Object.create(Phaser.ParticleStorm.BASE_359);

        this.rgba = 'rgba(0, 0, 0, 1)';

        this.blendMode = this.particle.emitter.parent.blendModeMap.NORMAL;

    },

    /**
    * Takes a particle data object and populates all aspects of this control
    * that it applies to.
    *
    * @method Phaser.ParticleStorm.Controls.Color#init
    * @param {object} data - The particle data.
    */
    init: function (data) {

        var tint = false;

        //  ------------------------------------------------
        //  HSV
        //  ------------------------------------------------

        if (data.hasOwnProperty('hsv'))
        {
            if (typeof data.hsv === 'number')
            {
                this.hsv.value = data.hsv;
            }
            else
            {
                this.graph.fromData(data.hsv, this.hsv);
            }

            tint = true;
            this.isHSV = true;
        }
        else
        {
            //  ------------------------------------------------
            //  RGB
            //  ------------------------------------------------

            if (data.hasOwnProperty('red'))
            {
                if (typeof data.red === 'number')
                {
                    this.red.value = data.red;
                }
                else
                {
                    this.graph.fromData(data.red, this.red);
                }

                tint = true;
            }

            if (data.hasOwnProperty('green'))
            {
                if (typeof data.green === 'number')
                {
                    this.green.value = data.green;
                }
                else
                {
                    this.graph.fromData(data.green, this.green);
                }

                tint = true;
            }

            if (data.hasOwnProperty('blue'))
            {
                if (typeof data.blue === 'number')
                {
                    this.blue.value = data.blue;
                }
                else
                {
                    this.graph.fromData(data.blue, this.blue);
                }

                tint = true;
            }
        }

        //  ------------------------------------------------
        //  Alpha
        //  ------------------------------------------------

        if (data.hasOwnProperty('alpha'))
        {
            if (typeof data.alpha === 'number')
            {
                this.alpha.value = data.alpha;
            }
            else
            {
                this.graph.fromData(data.alpha, this.alpha);
            }
        }

        this.red.value = Phaser.Math.clamp(this.red.value, 0, 255);
        this.green.value = Phaser.Math.clamp(this.green.value, 0, 255);
        this.blue.value = Phaser.Math.clamp(this.blue.value, 0, 255);
        this.alpha.value = Phaser.Math.clamp(this.alpha.value, 0, 1);
        this.hsv.value = Phaser.Math.clamp(this.hsv.value, 0, 359);

        if (this.particle.emitter.renderType !== Phaser.ParticleStorm.PIXEL)
        {
            //  We don't tint pixels
            this.isTinted = tint;
        }

        if (data.blendMode)
        {
            this.blendMode = this.particle.emitter.parent.blendModeMap[data.blendMode.toUpperCase()];
        }

    },

    /**
    * Called automatically when the parent particle updates. It applies
    * all color controls to the particle based on its lifespan.
    *
    * @method Phaser.ParticleStorm.Controls.Color#step
    */
    step: function () {

        var life = this.particle.life;

        if (this.isHSV)
        {
            this.hsv.value += this.hsv.delta;
            this.hsv.calc = Phaser.Math.clamp(Math.floor(this.hsv.initial + this.graph.getValue(this.hsv, life)), 0, 359);

            this.red.value = this.hsvData[this.hsv.calc].r;
            this.green.value = this.hsvData[this.hsv.calc].g;
            this.blue.value = this.hsvData[this.hsv.calc].b;
        }
        else
        {
            this.red.value += this.red.delta;
            this.green.value += this.green.delta;
            this.blue.value += this.blue.delta;
        }

        this.red.calc = this.graph.getClampedValue(this.red, life);
        this.green.calc = this.graph.getClampedValue(this.green, life);
        this.blue.calc = this.graph.getClampedValue(this.blue, life);

        if (this.isTinted)
        {
            this.tint = this.red.calc << 16 | this.green.calc << 8 | this.blue.calc;
        }

        this.alpha.value += this.alpha.delta;
        this.alpha.calc = Phaser.Math.clamp(this.alpha.initial + this.graph.getValue(this.alpha, life), 0, 1);

        this.rgba = 'rgba(' + this.red.calc + ',' + this.green.calc + ',' + this.blue.calc + ',' + this.alpha.calc + ')';

    },

    /**
    * Sets the color values of the red, green and blue controls.
    *
    * @method Phaser.ParticleStorm.Controls.Color#setColor
    * @param {integer} r - The red color value. Between 1 and 255.
    * @param {integer} g - The green color value. Between 1 and 255.
    * @param {integer} b - The blue color value. Between 1 and 255.
    * @param {integer} a - The alpha color value. Between 1 and 255.
    */
    setColor: function (r, g, b, a) {

        this.red.value = r;
        this.green.value = g;
        this.blue.value = b;
        this.alpha.value = a;

        if (this.particle.emitter.renderType !== Phaser.ParticleStorm.PIXEL)
        {
            //  We don't tint pixels
            this.isTinted = true;
        }

        this.step();

    }

};

Phaser.ParticleStorm.Controls.Color.prototype.constructor = Phaser.ParticleStorm.Controls.Color;

/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link http://choosealicense.com/licenses/no-license/|No License}
*/

/**
* The Transform control belongs to a single particle and controls all aspects of its transformation.
* It allows you to control the position, scale, rotation, velocity and other properties.
*
* @class Phaser.ParticleStorm.Controls.Transform
* @constructor
* @param {Phaser.ParticleStorm.Particle} particle - The particle this control belongs to.
*/
Phaser.ParticleStorm.Controls.Transform = function (particle) {

    /**
    * The particle this control belongs to.
    * @property {Phaser.ParticleStorm.Particle} particle
    */
    this.particle = particle;

    /**
    * A reference to the Phaser.Time class.
    * @property {Phaser.Time} time
    */
    this.time = particle.emitter.game.time;

    /**
    * @property {Phaser.ParticleStorm.Graph} graph - A set of useful common static functions.
    */
    this.graph = Phaser.ParticleStorm.Graph;

    /**
    * The horizontal position of this particle.
    * @property {number} x
    */
    this.x = 0;

    /**
    * The vertical position of this particle.
    * @property {number} y
    */
    this.y = 0;

    /**
    * The velocity control object. Contains x, y and facing properties.
    * They inherits all properties of the Phaser.ParticleStorm.BASE object.
    * @property {object} velocity
    */
    this.velocity = { x: null, y: null, facing: null };

    /**
    * The acceleration control object. Contains x, y and facing properties.
    * They inherits all properties of the Phaser.ParticleStorm.BASE object.
    * @property {object} acceleration
    */
    this.acceleration = { x: null, y: null, facing: null };

    /**
    * The scale control object. Contains x and y and properties.
    * They inherits all properties of the Phaser.ParticleStorm.BASE_1 object.
    * @property {object} scale
    */
    this.scale = { x: null, y: null };

    /**
    * The rotation control object.
    * This inherits all properties of the Phaser.ParticleStorm.BASE object.
    * @property {object} rotation
    */
    this.rotation = {};

    /**
    * The anchor of the particle. By default particles all have anchors set to
    * 0.5 (i.e. their center) to assist with rotation.
    * @property {Phaser.Point} anchor
    */
    this.anchor = new Phaser.Point();

};

Phaser.ParticleStorm.Controls.Transform.prototype = {

    /**
    * Resets this control and all properties of it. This is called automatically
    * when its parent particle is spawned.
    *
    * @method Phaser.ParticleStorm.Controls.Transform#reset
    */
    reset: function () {

        this.velocity.x = Object.create(Phaser.ParticleStorm.BASE);
        this.velocity.y = Object.create(Phaser.ParticleStorm.BASE);
        this.velocity.facing = Object.create(Phaser.ParticleStorm.BASE_NULL);

        this.acceleration.x = Object.create(Phaser.ParticleStorm.BASE);
        this.acceleration.y = Object.create(Phaser.ParticleStorm.BASE);
        this.acceleration.facing = Object.create(Phaser.ParticleStorm.BASE_NULL);

        this.scale.x = Object.create(Phaser.ParticleStorm.BASE_1);
        this.scale.y = Object.create(Phaser.ParticleStorm.BASE_1);

        this.rotation = Object.create(Phaser.ParticleStorm.BASE);

        this.anchor.set(0.5);

    },

    /**
    * Takes a particle data object and populates all aspects of this control
    * that it applies to.
    *
    * @method Phaser.ParticleStorm.Controls.Transform#init
    * @param {number} x - The horizontal position of the particle.
    * @param {number} y - The vertical position of the particle.
    * @param {object} data - The particle data.
    */
    init: function (x, y, data) {

        this.x = x;
        this.y = y;
        this.data = data;

        //  ------------------------------------------------
        //  Anchor
        //  ------------------------------------------------

        if (data.hasOwnProperty('anchor'))
        {
            this.anchor.set(data.anchor);
        }
        else
        {
            if (data.hasOwnProperty('anchorX'))
            {
                this.anchor.x = data.anchorX;
            }

            if (data.hasOwnProperty('anchorY'))
            {
                this.anchor.y = data.anchorY;
            }
        }

        //  ------------------------------------------------
        //  Velocity
        //  ------------------------------------------------

        //  Use 'velocity' instead or in addition to 'vx' and 'vy' when those two are interlinked
        //  (eg. when creating a radial vector from the creation point)

        if (data.hasOwnProperty('velocity'))
        {
            if (this.graph.isNumeric(data.velocity))
            {
                //  velocity: 2
                this.velocity.x.value = data.velocity;
                this.velocity.y.value = data.velocity;
            }
            else if (data.velocity.hasOwnProperty('min'))
            {
                //  velocity: { min: -2, max: 2 }
                this.velocity.x.value = this.graph.getMinMax(data.velocity);
                this.velocity.y.value = this.velocity.x.value;
            }
            else if (data.velocity.radial)
            {
                //  radial velocity
                var v = this.graph.getMinMaxInitial(data.velocity);

                var arcs = data.velocity.radial.arcStart;
                var arce = data.velocity.radial.arcEnd;

                if (arcs !== undefined && arce !== undefined)
                {
                    //  Radiate within an arc
                    var angle = (Math.random() * (arce - arcs) + arcs) * Phaser.ParticleStorm.PI_180;
                    var dx = Math.sin(angle);
                    var dy = -Math.cos(angle);
                    this.velocity.x.value = dx * v;
                    this.velocity.y.value = dy * v;
                }
            }
            else
            {
                //  velocity: { initial: 2, value: 3, delta: 0.1, control: {} }
                this.velocity.x.initial = this.graph.getMinMaxInitial(data.velocity);
                this.velocity.y.initial = this.velocity.x.initial;

                this.velocity.x.value = this.graph.getMinMax(data.velocity.value);
                this.velocity.y.value = this.velocity.x.value;
            }

            if (data.velocity.hasOwnProperty('delta'))
            {
                this.velocity.x.delta = this.graph.getMinMax(data.velocity.delta);
                this.velocity.y.delta = this.velocity.x.delta;
            }

            if (data.velocity.hasOwnProperty('control'))
            {
                this.velocity.x.control = data.velocity.control;
                this.velocity.y.control = data.velocity.control;
            }

            //  If they defined vx/vy AND velocity then the vx/vy settings over-ride velocity
            if (data.hasOwnProperty('vx'))
            {
                this.graph.fromData(data.vx, this.velocity.x);
            }

            if (data.hasOwnProperty('vy'))
            {
                this.graph.fromData(data.vy, this.velocity.y);
            }
        }
        if (data.hasOwnProperty('target'))
        {
            //  ------------------------------------------------
            //  Target
            //  ------------------------------------------------

            this.particle.target(data.target);
        }
        else
        {
            //  ------------------------------------------------
            //  vx / vy
            //  ------------------------------------------------

            //  Avoids calling fromData if we know we're just dealing with a number
            if (typeof data.vx === 'number')
            {
                this.velocity.x.value = data.vx;
            }
            else
            {
                this.graph.fromData(data.vx, this.velocity.x);
            }

            if (typeof data.vy === 'number')
            {
                this.velocity.y.value = data.vy;
            }
            else
            {
                this.graph.fromData(data.vy, this.velocity.y);
            }
        }

        //  ------------------------------------------------
        //  Facing Acceleration / Velocity
        //  ------------------------------------------------

        //  Avoids calling fromData if we know we're just dealing with a number
        if (typeof data.facingVelocity === 'number')
        {
            this.velocity.facing.value = data.facingVelocity;
        }
        else
        {
            this.graph.fromData(data.facingVelocity, this.velocity.facing);
        }

        if (typeof data.facingAcceleration === 'number')
        {
            this.acceleration.facing.value = data.facingAcceleration;
        }
        else
        {
            this.graph.fromData(data.facingAcceleration, this.acceleration.facing);
        }

        //  ------------------------------------------------
        //  Acceleration
        //  ------------------------------------------------

        if (data.hasOwnProperty('acceleration'))
        {
            //  Use 'acceleration' when the ax and ay are interlinked
            this.graph.fromData(data.acceleration, this.acceleration.x);
            this.graph.fromData(data.acceleration, this.acceleration.y);
        }
        else
        {
            //  Avoids calling fromData if we know we're just dealing with a number
            if (typeof data.ax === 'number')
            {
                this.acceleration.x.value = data.ax;
            }
            else
            {
                this.graph.fromData(data.ax, this.acceleration.x);
            }

            if (typeof data.ay === 'number')
            {
                this.acceleration.y.value = data.ay;
            }
            else
            {
                this.graph.fromData(data.ay, this.acceleration.y);
            }
        }

        //  ------------------------------------------------
        //  Scale and Rotation
        //  ------------------------------------------------

        if (data.hasOwnProperty('scale'))
        {
            this.graph.fromData(data.scale, this.scale.x);
            this.graph.clone(this.scale.x, this.scale.y);
        }
        else
        {
            if (typeof data.scaleX === 'number')
            {
                this.scale.x.value = data.scaleX;
            }
            else
            {
                this.graph.fromData(data.scaleX, this.scale.x);
            }

            if (typeof data.scaleY === 'number')
            {
                this.scale.y.value = data.scaleY;
            }
            else
            {
                this.graph.fromData(data.scaleY, this.scale.y);
            }
        }

        if (typeof data.rotation === 'number')
        {
            this.rotation.value = data.rotation;
        }
        else
        {
            this.graph.fromData(data.rotation, this.rotation);
        }

        var parent = this.particle.parent;

        if (parent && parent.emit && parent.emit.inherit)
        {
            this.inherit(parent);
        }

    },

    /**
    * Adjust Particle parameters according to the inheritable properties
    * of the parent particle.
    *
    * @method Phaser.ParticleStorm.Controls.Transform#inherit
    * @param {Phaser.ParticleStorm.Particle} - The Parent particle to inherit from.
    */
    inherit: function (parent) {

        var inherit = parent.emit.inherit;
        var all = false;

        if (typeof inherit === 'boolean')
        {
            all = true;
        }

        if (all || inherit.vx || inherit.velocity)
        {
            this.graph.clone(parent.transform.velocity.x, this.velocity.x);
        }

        if (all || inherit.vy || inherit.velocity)
        {
            this.graph.clone(parent.transform.velocity.y, this.velocity.y);
        }

        if (all || inherit.facingVelocity)
        {
            this.graph.clone(parent.transform.velocity.facing, this.velocity.facing);
        }

        if (all || inherit.scaleX || inherit.scale)
        {
            this.graph.clone(parent.transform.scale.x, this.scale.x);
        }

        if (all || inherit.scaleY || inherit.scale)
        {
            this.graph.clone(parent.transform.scale.y, this.scale.y);
        }

        if (all || inherit.rotation)
        {
            this.graph.clone(parent.transform.rotation, this.rotation);
        }

        if (inherit.angularVelocity)
        {
            var r = (parent.transform.rotation.initial + parent.transform.rotation.value) * Phaser.ParticleStorm.PI_180;
            this.velocity.x.initial = Math.sin(r);
            this.velocity.y.initial = -Math.cos(r);
        }

    },

    /**
    * Called automatically when the parent particle updates. It applies
    * all transform controls to the particle based on its lifespan.
    *
    * @method Phaser.ParticleStorm.Controls.Transform#step
    */
    step: function (particleIndex) {

        var life = this.particle.life;

        let fps_factor = this.time.delta * Phaser.ParticleStorm.FPS_MULT;
        if (this.particle.data.target) {
            if (this.particle.data.target.transform_key) {
                if (this.particle.data.target.transform_key === this.particle.data.velocity.transform_key) {
                    fps_factor = 1;
                }
            } else {
                fps_factor = 1;
            }
        }

        this.scale.x.value += this.scale.x.delta * fps_factor;
        this.scale.y.value += this.scale.y.delta * fps_factor;

        this.rotation.value += this.rotation.delta * fps_factor;

        this.rotation.calc = (this.rotation.initial + this.graph.getValue(this.rotation, life)) * Phaser.ParticleStorm.PI_180;

        this.scale.x.calc = this.scale.x.initial + this.graph.getValue(this.scale.x, life);
        this.scale.y.calc = this.scale.y.initial + this.graph.getValue(this.scale.y, life);

        //  Bail out if fresh
        if (life === 0)
        {
            return;
        }

        var r = 0;
        var v = 0;

        if (this.acceleration.facing.value !== null)
        {
            //  Add 90 degrees because particle rotation 0 is right-handed
            this.acceleration.facing.value += this.acceleration.facing.delta * fps_factor;
            r = this.rotation.calc + ((90 + this.acceleration.facing.offset) * Phaser.ParticleStorm.PI_180);
            v = this.acceleration.facing.initial + this.graph.getValue(this.acceleration.facing, life);
            this.velocity.x.value += v * Math.sin(r);
            this.velocity.y.value += v * -Math.cos(r);
        }

        this.acceleration.x.value += this.acceleration.x.delta * fps_factor;
        this.acceleration.y.value += this.acceleration.y.delta * fps_factor;

        this.velocity.x.value += (this.velocity.x.delta + this.acceleration.x.initial + this.graph.getValue(this.acceleration.x, life)) * fps_factor;
        this.velocity.y.value += (this.velocity.y.delta + this.acceleration.y.initial + this.graph.getValue(this.acceleration.y, life)) * fps_factor;

        if (this.velocity.facing.value !== null)
        {
            //  Add 90 degrees because particle rotation 0 is right-handed
            this.velocity.facing.value += this.velocity.facing.delta * fps_factor;
            r = this.rotation.calc + ((90 + this.velocity.facing.offset) * Phaser.ParticleStorm.PI_180);
            v = this.velocity.facing.initial + this.graph.getValue(this.velocity.facing, life);
            this.x += v * Math.sin(r);
            this.y += v * -Math.cos(r);
        }

        let target_refresh_callback;
        if (this.data.target && this.data.target.control) {
            target_refresh_callback = (point) => {
                if (point.refresh_target) {
                    if (point.reference_transform_key) {
                        this.data.target.transform_key = point.reference_transform_key;
                    }
                    if (point.duration) {
                        this.data.target.duration = point.duration;
                    }
                    this.particle.target(this.data.target);
                }
            };
        }
        this.x += (this.velocity.x.initial + this.graph.getValue(this.velocity.x, life, target_refresh_callback)) * fps_factor;
        this.y += (this.velocity.y.initial + this.graph.getValue(this.velocity.y, life, target_refresh_callback)) * fps_factor;

    }

};

Phaser.ParticleStorm.Controls.Transform.prototype.constructor = Phaser.ParticleStorm.Controls.Transform;

/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link http://choosealicense.com/licenses/no-license/|No License}
*/

Phaser.ParticleStorm.Renderer = {};

/**
* The base class which all ParticleStorm renderers must extend.
*
* @class Phaser.ParticleStorm.Renderer.Base
* @constructor
* @param {Phaser.ParticleStorm.Emitter} emitter - The emitter that this renderer belongs to.
*/
Phaser.ParticleStorm.Renderer.Base = function (emitter) {

    /**
    * @property {Phaser.Game} game - A reference to the Phaser Game instance.
    */
    this.game = emitter.game;

    /**
    * @property {Phaser.ParticleStorm.Emitter} emitter - The emitter that owns this renderer.
    */
    this.emitter = emitter;

    /**
    * @property {Phaser.ParticleStorm} parent - The Particle Storm plugin.
    */
    this.parent = emitter.parent;

    /**
    * The size of a 'pixel' as used by the Pixel renderer and others that extend
    * it. It can be any positive value from 1 up. A value of 2 means a 2x2 pixel,
    * 3 is a 3x3 pixel and so on. At a size of 1 or 2 it uses setPixel to
    * draw to the BitmapData. At 3+ it uses a fillRect operation.
    * @property {integer} pixelSize
    */
    this.pixelSize = 1;

    /**
    * @property {boolean} useRect - If true, uses a rectable to build a pixel instead of a circle.
    */
    this.useRect = true;

};

Phaser.ParticleStorm.Renderer.Base.prototype = {

    /**
    * Adds this Particle Renderer to the display list.
    * 
    * You can specify a Group to add it to. If none is given it will use Phaser.World instead.
    * If this renderer emits particle display objects such as Phaser.Sprites they will be added to the same Group.
    *
    * @method Phaser.ParticleStorm.Renderer.Base#addToWorld
    * @param {Phaser.Group} [group] - The Group to add this renderer to. If not specified Phaser.World is used.
    * @return {Phaser.Image|Phaser.Sprite|Phaser.Group} The display object that contains the particle renderer.
    */
    addToWorld: function (group) {

        group.add(this.display);
        if (this.display2) {
            group.add(this.display2);
        }

        return [this.display, this.display2];

    },

    /**
    * The preUpdate method of this renderer.
    *
    * @method Phaser.ParticleStorm.Renderer.Base#preUpdate
    */
    preUpdate: function () {

    },

    /**
    * Adds the given particle to this renderer, to be rendered in the next update.
    *
    * @method Phaser.ParticleStorm.Renderer.Base#add
    * @param {Phaser.ParticleStorm.Particle} particle - Adds a particle to this renderer.
    */
    add: function () {

        return null;

    },

    /**
    * Updates the given particle within this renderer.
    *
    * @method Phaser.ParticleStorm.Renderer.Base#update
    * @param {Phaser.ParticleStorm.Particle} particle - The particle to be updated.
    */
    update: function (particle) {

        return particle;

    },

    /**
    * The postUpdate method of this renderer.
    * Called after all updates have taken place, before the render pass.
    *
    * @method Phaser.ParticleStorm.Renderer.Base#postUpdate
    */
    postUpdate: function () {

    },

    /**
    * Kills the given particle from this renderer.
    *
    * @method Phaser.ParticleStorm.Renderer.Base#kill
    * @param {Phaser.ParticleStorm.Particle} particle - The particle to be killed.
    */
    kill: function (particle) {

        return particle;

    },

    /**
    * Destroys this renderer.
    *
    * @method Phaser.ParticleStorm.Renderer.Base#destroy
    */
    destroy: function () {

        this.game = null;

    }

};

Phaser.ParticleStorm.Renderer.Base.prototype.constructor = Phaser.ParticleStorm.Renderer.Base;

/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link http://choosealicense.com/licenses/no-license/|No License}
*/

/**
* A Sprite based renderer.
*
* @class Phaser.ParticleStorm.Renderer.Sprite
* @constructor
* @param {Phaser.ParticleStorm.Emitter} emitter - The emitter that this renderer belongs to.
*/
Phaser.ParticleStorm.Renderer.Sprite = function (emitter) {

    Phaser.ParticleStorm.Renderer.Base.call(this, emitter);

    /**
    * A Phaser.Group that contains all particles created by this renderer.
    * @property {Phaser.Group} display
    */
    this.display = this.game.make.group(null, 'particleStormSpriteRenderer');

};

Phaser.ParticleStorm.Renderer.Sprite.prototype = Object.create(Phaser.ParticleStorm.Renderer.Base.prototype);
Phaser.ParticleStorm.Renderer.Sprite.prototype.constructor = Phaser.ParticleStorm.Renderer.Sprite;

/**
* Adds the given particle to this renderer. If the particle has a sprite property
* then its reset and updated. If it doesn't then a new Phaser.Sprite is created,
* belonging to this renderers display group.
*
* @method Phaser.ParticleStorm.Renderer.Sprite#add
* @param {Phaser.ParticleStorm.Particle} particle - The particle to be updated.
* @return {Phaser.Sprite} This particles sprite property.
*/
Phaser.ParticleStorm.Renderer.Sprite.prototype.add = function (particle) {

    var spr = particle.sprite;
    var key = particle.texture.key;
    var frame = particle.texture.frame;

    if (frame === undefined && particle.texture.frameName !== undefined)
    {
        //  String frame
        frame = particle.texture.frameName;
    }

    if (spr)
    {
        //GSHTML5: TODO: get avg?
        if (particle.emitter.transforms) {
            let t = particle.transform[particle.emitter.transforms[0]];
            spr.reset(t.x, t.y);
        } else {
            spr.reset(particle.transform.x, particle.transform.y);
        }

        if (spr.key !== key)
        {
            spr.loadTexture(key, frame);
        }
        else
        {
            if (particle.texture.frame !== undefined)
            {
                spr.frame = frame;
            }
            else if (particle.texture.frameName !== undefined)
            {
                spr.frameName = frame;
            }
        }
    }
    else
    {
        //GSHTML5: TODO: get avg?
        if (particle.emitter.transforms) {
            let t = particle.transform[particle.emitter.transforms[0]];
            spr = this.display.create(t.x, t.y, key, frame);
        } else {
            spr = this.display.create(particle.transform.x, particle.transform.y, key, frame);
        }
    }

    //GSHTML5: TODO: get avg?
    if (particle.emitter.transforms) {
        let t = particle.transform[particle.emitter.transforms[0]];
        spr.anchor.set(t.anchor.x, t.anchor.y);
    } else {
        spr.anchor.set(particle.transform.anchor.x, particle.transform.anchor.y);
    }

    if (particle.color.isTinted)
    {
        spr.tint = particle.color.tint;
    }

    spr.blendMode = particle.color.blendMode[0];
    spr.texture.baseTexture.scaleMode = particle.texture.scaleMode;

    spr.visible = particle.visible;

    particle.sprite = spr;

    return spr;

};

/**
* Updates and renders the given particle to this renderer.
*
* @method Phaser.ParticleStorm.Renderer.Sprite#update
* @param {Phaser.ParticleStorm.Particle} particle - The particle to be updated.
*/
Phaser.ParticleStorm.Renderer.Sprite.prototype.update = function (particle) {

    var spr = particle.sprite;

    //  If the particle is delayed AND should be hidden when delayed ...
    if (particle.delay > 0 && !particle.delayVisible)
    {
        spr.visible = false;
        return;
    }

    spr.visible = particle.visible;

    spr.alpha = particle.color.alpha.calc;

    if (particle.emitter.transforms) {
        let t = particle.transform[particle.emitter.transforms[0]];
        spr.rotation = t.rotation.calc;
    } else {
        spr.rotation = particle.transform.rotation.calc;
    }

    if (particle.color.isTinted)
    {
        spr.tint = particle.color.tint;
    }

    if (particle.emitter.transforms) {
        let t = particle.transform[particle.emitter.transforms[0]];
        spr.scale.setTo(t.scale.x.calc, t.scale.y.calc);
    } else {
        spr.scale.setTo(particle.transform.scale.x.calc, particle.transform.scale.y.calc);
    }

    let transform_x = 0;
    let transform_y = 0;
    if (particle.emitter.transforms) {
        let transforms_count = 0;
        for (let transform_key in particle.active_transforms) {
            transform_x += particle.active_transforms[transform_key].x;
            transform_y += particle.active_transforms[transform_key].y;
            ++transforms_count;
        }
        transform_x /= transforms_count;
        transform_y /= transforms_count;
    } else {
        transform_x = particle.transform.x;
        transform_y = particle.transform.y;
    }
    spr.x = transform_x;
    spr.y = transform_y;
};

/**
* Kills the given particle from this renderer.
*
* @method Phaser.ParticleStorm.Renderer.SpriteBatch#kill
* @param {Phaser.ParticleStorm.Particle} particle - The particle to be killed.
*/
Phaser.ParticleStorm.Renderer.Sprite.prototype.kill = function (particle) {

    if (particle.sprite)
    {
        particle.sprite.kill();
    }

};

/**
* Destroys this renderer.
*
* @method Phaser.ParticleStorm.Renderer.SpriteBatch#destroy
*/
Phaser.ParticleStorm.Renderer.Sprite.prototype.destroy = function () {

    this.display.destroy(true);

    this.emitter = null;

    this.game = null;

};

/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link http://choosealicense.com/licenses/no-license/|No License}
*/

/**
* A Pixel renderer. This is a special form of the BitmapData renderer which is
* dedicated to rendering pixel particles, rather than images or sprites.
*
* The size of the pixels can be controlled with the `pixelSize` property, which can
* be changed in real-time.
*
* @class Phaser.ParticleStorm.Renderer.Pixel
* @constructor
* @param {Phaser.ParticleStorm.Emitter} emitter - The emitter that this renderer belongs to.
* @param {integer} width - The width of the renderer. Defaults to Game.width.
* @param {integer} height - The height of the renderer. Defaults to Game.height.
*/
Phaser.ParticleStorm.Renderer.Pixel = function (emitter, width, height, render_white_core = false) {

    Phaser.ParticleStorm.Renderer.Base.call(this, emitter);

    /**
    * The BitmapData object which is used to render the particles to.
    * @property {Phaser.BitmapData} bmd
    */
    this.bmd = this.game.make.bitmapData(width, height);
    this.bmd.smoothed = false;
    if (render_white_core) {
        this.bmd2 = this.game.make.bitmapData(width, height);
        this.bmd2.smoothed = false;
    }

    /**
    * A Phaser.Image that has this BitmapData set as its texture.
    * When you add this renderer to the display list it is this image
    * that is added.
    * @property {Phaser.Image} display
    */
    this.display = this.game.make.image(0, 0, this.bmd);
    if (render_white_core) {
        this.display2 = this.game.make.image(0, 0, this.bmd2);
    }

    /**
    * If true then this renderer automatically clears itself each update, before
    * new particles are rendered to it. You can disable this and then call the
    * `clear` method directly to control how and when it's cleared.
    * @property {boolean} autoClear
    * @default
    */
    this.autoClear = true;

};

Phaser.ParticleStorm.Renderer.Pixel.prototype = Object.create(Phaser.ParticleStorm.Renderer.Base.prototype);
Phaser.ParticleStorm.Renderer.Pixel.prototype.constructor = Phaser.ParticleStorm.Renderer.Pixel;

/**
* Resizes the dimensions of the BitmapData used for rendering.
*
* @method Phaser.ParticleStorm.Renderer.Pixel#resize
* @param {integer} width - The width of the renderer. Defaults to Game.width.
* @param {integer} height - The height of the renderer. Defaults to Game.height.
* @return {Phaser.ParticleStorm.Renderer.Pixel} This renderer.
*/
Phaser.ParticleStorm.Renderer.Pixel.prototype.resize = function (width, height) {

    this.bmd.resize(width, height);
    if (this.bmd2) {
        this.bmd2.resize(width, height);
    }

    return this;

};

/**
* Clears this BitmapData. An optional `alpha` value allows you to specify
* the amount of alpha to use when clearing. By setting values lower than 1
* you can leave behind previous particle images, creating 'trail' like effects.
*
* @method Phaser.ParticleStorm.Renderer.Pixel#clear
* @param {number} [alpha=1] - The alpha color value, between 0 and 1.
* @return {Phaser.ParticleStorm.Renderer.Pixel} This renderer.
*/
Phaser.ParticleStorm.Renderer.Pixel.prototype.clear = function (alpha) {

    this.bmd.fill(0, 0, 0, alpha);
    this.bmd.update();

    if (this.bmd2) {
        this.bmd2.fill(0, 0, 0, alpha);
        this.bmd2.update();
    }

    return this;

};

/**
* The preUpdate method of this renderer. This is called automatically by
* the Emitter.
*
* @method Phaser.ParticleStorm.Renderer.Pixel#preUpdate
*/
Phaser.ParticleStorm.Renderer.Pixel.prototype.preUpdate = function () {

    if (this.autoClear)
    {
        this.bmd.clear();
        this.bmd.update();
    }
    if (this.bmd2) {
        this.bmd2.clear();
        this.bmd2.update();
    }

};

/**
* Updates and renders the given particle to this renderer.
*
* @method Phaser.ParticleStorm.Renderer.Pixel#update
* @param {Phaser.ParticleStorm.Particle} particle - The particle to be updated.
*/
Phaser.ParticleStorm.Renderer.Pixel.prototype.update = function (particle, particleIndex) {

    //  If the particle is delayed AND should be hidden when delayed ...
    if (particle.delay > 0 && !particle.delayVisible)
    {
        return;
    }

    //  We need whole numbers to render pixels
    let transform_x = 0;
    let transform_y = 0;
    if (particle.emitter.transforms) {
        let transforms_count = 0;
        for (let transform_key in particle.active_transforms) {
            transform_x += particle.active_transforms[transform_key].x;
            transform_y += particle.active_transforms[transform_key].y;
            ++transforms_count;
        }
        transform_x /= transforms_count;
        transform_y /= transforms_count;
    } else {
        transform_x = particle.transform.x;
        transform_y = particle.transform.y;
    }
    var x = Math.floor(transform_x);
    var y = Math.floor(transform_y);

    var r = particle.color.red.calc;
    var g = particle.color.green.calc;
    var b = particle.color.blue.calc;
    var a = Math.floor(particle.color.alpha.calc * 255);
    var a2 = Math.sign(a) * 255;

    let core_color;
    if (this.bmd2) {
        core_color = particle.emitter.core_custom_color ? particle.emitter.core_custom_color : `rgba(255,255,255,${a2/255})`;
    }

    let pixel_size_scale = 1;
    if (particle.data.scale) {
        pixel_size_scale = 0;
        if (particle.emitter.transforms) {
            let transforms_count = 0;
            for (let transform_key in particle.active_transforms) {
                pixel_size_scale += particle.active_transforms[transform_key].scale.x.calc;
                ++transforms_count;
            }
            pixel_size_scale /= transforms_count;
        } else {
            pixel_size_scale = particle.transform.scale.x.calc;
        }
    }
    if (particle.data.pixelReducingFactor && particle.pixelSize > 0) {
        particle.pixelSize -= particle.data.pixelReducingFactor * this.game.time.delta * Phaser.ParticleStorm.FPS_MULT;;
        particle.pixelSize = Math.max(0, particle.pixelSize);
    }
    const pixelSizeToRender = particle.data.pixelSize ? particle.pixelSize : this.pixelSize;
    const pixel_size = pixelSizeToRender * pixel_size_scale;
    if (pixel_size > 2)
    {
        if (this.useRect) {
            this.bmd.rect(x, y, pixel_size, pixel_size, particle.color.rgba);
            if (this.bmd2) {
                const size = particle.emitter.core_size_factor * pixel_size;
                this.bmd2.rect(x, y, size, size, core_color);
            }
        } else {
            this.bmd.circle(x, y, pixel_size / 2, particle.color.rgba);
            if (this.bmd2) {
                this.bmd2.circle(x, y, particle.emitter.core_size_factor * pixel_size / 2, core_color);
            }
        }
    }
    else
    {
        const immediate = Boolean(particle.data.pixelSize);

        this.bmd.setPixel32(x, y, r, g, b, a, immediate);
        if (this.bmd2) {
            this.bmd2.setPixel32(x, y, 255, 255, 255, a2, immediate);
        }

        //  2x2
        if (pixel_size === 2)
        {
            this.bmd.setPixel32(x + 1, y, r, g, b, a, immediate);
            this.bmd.setPixel32(x, y + 1, r, g, b, a, immediate);
            this.bmd.setPixel32(x + 1, y + 1, r, g, b, a, immediate);
            if (this.bmd2) {
                this.bmd2.setPixel32(x + 1, y, 255, 255, 255, a2, immediate);
                this.bmd2.setPixel32(x, y + 1, 255, 255, 255, a2, immediate);
                this.bmd2.setPixel32(x + 1, y + 1, 255, 255, 255, a2, immediate);
            }
        }
    }

};

/**
* The postUpdate method is called automatically when all particles have
* been rendered.
*
* @method Phaser.ParticleStorm.Renderer.Pixel#postUpdate
*/
Phaser.ParticleStorm.Renderer.Pixel.prototype.postUpdate = function () {

    if (this.pixelSize <= 2 && !this.emitter.data.pixelSize)
    {
        this.bmd.context.putImageData(this.bmd.imageData, 0, 0);
        if (this.bmd2) {
            this.bmd2.context.putImageData(this.bmd2.imageData, 0, 0);
        }
    }

    this.bmd.dirty = true;
    if (this.bmd2) {
        this.bmd2.dirty = true;
    }

};

/**
* Destroys this renderer.
*
* @method Phaser.ParticleStorm.Renderer.Pixel#destroy
*/
Phaser.ParticleStorm.Renderer.Pixel.prototype.destroy = function () {

    this.game = null;

    this.display.destroy();
    if (this.display2) {
        this.display2.destroy();
    }

    this.bmd.destroy();
    if (this.bmd2) {
        this.bmd2.destroy();
    }

};

/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link http://choosealicense.com/licenses/no-license/|No License}
*/

/**
* A BitmapData based renderer. A single BitmapData is created onto which all
* particles are rendered directly. The renderer can be resized using the resize method.
*
* @class Phaser.ParticleStorm.Renderer.BitmapData
* @constructor
* @param {Phaser.ParticleStorm.Emitter} emitter - The emitter that this renderer belongs to.
* @param {integer} width - The width of the renderer. Defaults to Game.width.
* @param {integer} height - The height of the renderer. Defaults to Game.height.
*/
Phaser.ParticleStorm.Renderer.BitmapData = function (emitter, width, height) {

    Phaser.ParticleStorm.Renderer.Base.call(this, emitter);

    /**
    * The BitmapData object which is used to render the particles to.
    * @property {Phaser.BitmapData} bmd
    */
    this.bmd = this.game.make.bitmapData(width, height);

    /**
    * A Phaser.Image that has this BitmapData set as its texture.
    * When you add this renderer to the display list it is this image
    * that is added.
    * @property {Phaser.Image} display
    */
    this.display = this.game.make.image(0, 0, this.bmd);

    /**
    * If true then all pixel coordinates will be rounded before being rendered.
    * This avoids sub-pixel anti-aliasing.
    * @property {boolean} roundPx
    * @default
    */
    this.roundPx = true;

    /**
    * If true then this renderer automatically clears itself each update, before
    * new particles are rendered to it. You can disable this and then call the
    * `clear` method directly to control how and when it's cleared.
    * @property {boolean} autoClear
    * @default
    */
    this.autoClear = true;

};

Phaser.ParticleStorm.Renderer.BitmapData.prototype = Object.create(Phaser.ParticleStorm.Renderer.Base.prototype);
Phaser.ParticleStorm.Renderer.BitmapData.prototype.constructor = Phaser.ParticleStorm.Renderer.BitmapData;

/**
* Resizes the dimensions of the BitmapData used for rendering.
*
* @method Phaser.ParticleStorm.Renderer.BitmapData#resize
* @param {integer} width - The width of the renderer. Defaults to Game.width.
* @param {integer} height - The height of the renderer. Defaults to Game.height.
* @return {Phaser.ParticleStorm.Renderer.BitmapData} This renderer.
*/
Phaser.ParticleStorm.Renderer.BitmapData.prototype.resize = function (width, height) {

    this.bmd.resize(width, height);

    return this;

};

/**
* Clears this BitmapData. An optional `alpha` value allows you to specify
* the amount of alpha to use when clearing. By setting values lower than 1
* you can leave behind previous particle images, creating 'trail' like effects.
*
* @method Phaser.ParticleStorm.Renderer.BitmapData#clear
* @param {number} [alpha=1] - The alpha color value, between 0 and 1.
* @return {Phaser.ParticleStorm.Renderer.BitmapData} This renderer.
*/
Phaser.ParticleStorm.Renderer.BitmapData.prototype.clear = function (alpha) {

    this.bmd.fill(0, 0, 0, alpha);

    return this;

};

/**
* The preUpdate method of this renderer. This is called automatically by
* the Emitter.
*
* @method Phaser.ParticleStorm.Renderer.BitmapData#preUpdate
*/
Phaser.ParticleStorm.Renderer.BitmapData.prototype.preUpdate = function () {

    if (this.autoClear)
    {
        this.bmd.clear();
    }

};

/**
* Updates and renders the given particle to this renderer.
*
* @method Phaser.ParticleStorm.Renderer.BitmapData#update
* @param {Phaser.ParticleStorm.Particle} particle - The particle to be updated.
*/
Phaser.ParticleStorm.Renderer.BitmapData.prototype.update = function (particle) {

    //  If the particle is delayed AND should be hidden when delayed ...
    if (particle.delay > 0 && !particle.delayVisible)
    {
        return;
    }

    //  We need whole numbers to render pixels
    var t = particle.emitter.transforms ? particle.transform[particle.emitter.transforms[0]] : particle.transform;

    let transform_x = 0;
    let transform_y = 0;
    if (particle.emitter.transforms) {
        let transforms_count = 0;
        for (let transform_key in particle.active_transforms) {
            transform_x += particle.active_transforms[transform_key].x;
            transform_y += particle.active_transforms[transform_key].y;
            ++transforms_count;
        }
        transform_x /= transforms_count;
        transform_y /= transforms_count;
    } else {
        transform_x = particle.transform.x;
        transform_y = particle.transform.y;
    }

    this.bmd.copy(particle.texture.key,
        0, 0, null, null,
        transform_x, transform_y, null, null,
        t.rotation.calc,
        t.anchor.x, t.anchor.y,
        t.scale.x.calc, t.scale.y.calc,
        particle.color.alpha.calc,
        particle.color.blendMode[1],
        this.roundPx);

};

/**
* Destroys this renderer.
*
* @method Phaser.ParticleStorm.Renderer.BitmapData#destroy
*/
Phaser.ParticleStorm.Renderer.BitmapData.prototype.destroy = function () {

    this.game = null;

    this.display.destroy();

    this.bmd.destroy();

};

/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link http://choosealicense.com/licenses/no-license/|No License}
*/

/**
* A RenderTexture based renderer. Render Textures are highly optimised (under WebGL)
* for rendering images to. This renderer works by creating a 'stamp', which takes on
* the form of each particle and then 'stamps' itself on this RenderTexture. This avoids
* each particle needing to have its own sprite instance.
*
* @class Phaser.ParticleStorm.Renderer.RenderTexture
* @constructor
* @param {Phaser.ParticleStorm.Emitter} emitter - The emitter that this renderer belongs to.
* @param {integer} width - The width of the renderer. Defaults to Game.width.
* @param {integer} height - The height of the renderer. Defaults to Game.height.
*/
Phaser.ParticleStorm.Renderer.RenderTexture = function (emitter, width, height) {

    Phaser.ParticleStorm.Renderer.Base.call(this, emitter);

    /**
    * The RenderTexture object which is used to render the particles to.
    * @property {Phaser.RenderTexture} renderTexture
    */
    this.renderTexture = this.game.make.renderTexture(width, height);

    /**
    * A Phaser.Image that has this RenderTexture set as its texture.
    * When you add this renderer to the display list it is this image
    * that is added.
    * @property {Phaser.Image} display
    */
    this.display = this.game.make.image(0, 0, this.renderTexture);

    /**
    * A Phaser.Image that is used as the stamp for this RenderTexture. When a
    * particle is rendered to this RenderTexture the stamp takes on the texture 
    * and form of the particle, then 'stamps' itself on the RenderTexture.
    * @property {Phaser.Image} stamp
    * @protected
    */
    this.stamp = this.game.make.image(0, 0);

    /**
    * If true then this renderer automatically clears itself each update, before
    * new particles are rendered to it. You can disable this and then call the
    * `clear` method directly to control how and when it's cleared.
    * @property {boolean} autoClear
    * @default
    */
    this.autoClear = true;

};

Phaser.ParticleStorm.Renderer.RenderTexture.prototype = Object.create(Phaser.ParticleStorm.Renderer.Base.prototype);
Phaser.ParticleStorm.Renderer.RenderTexture.prototype.constructor = Phaser.ParticleStorm.Renderer.RenderTexture;

/**
* Clears the RenderTexture being used by this renderer. This happens automatically
* if `autoClear` is enabled.
*
* @method Phaser.ParticleStorm.Renderer.RenderTexture#clear
*/
Phaser.ParticleStorm.Renderer.RenderTexture.prototype.clear = function () {

    this.renderTexture.clear();

};

/**
* The preUpdate method of this renderer. This is called automatically by
* the Emitter.
*
* @method Phaser.ParticleStorm.Renderer.RenderTexture#preUpdate
*/
Phaser.ParticleStorm.Renderer.RenderTexture.prototype.preUpdate = function () {

    if (this.autoClear)
    {
        this.renderTexture.clear();
    }

};

/**
* Updates and renders the given particle to this renderer.
*
* @method Phaser.ParticleStorm.Renderer.RenderTexture#update
* @param {Phaser.ParticleStorm.Particle} particle - The particle to be updated.
*/
Phaser.ParticleStorm.Renderer.RenderTexture.prototype.update = function (particle) {

    //  If the particle is delayed AND should be hidden when delayed ...
    if ((particle.delay > 0 && !particle.delayVisible) || !particle.visible || particle.color.alpha.calc === 0)
    {
        return;
    }

    //  Transfer settings to the drawing object
    var key = particle.texture.key;
    var frame = particle.texture.frame;

    if (frame === undefined && particle.texture.frameName !== undefined)
    {
        //  String frame
        frame = particle.texture.frameName;
    }

    if (this.stamp.key !== key)
    {
        this.stamp.loadTexture(key, frame);
    }
    else
    {
        if (particle.texture.frame !== undefined)
        {
            this.stamp.frame = frame;
        }
        else if (particle.texture.frameName !== undefined)
        {
            this.stamp.frameName = frame;
        }
    }

    let t = particle.emitter.transforms ? particle.transform[particle.emitter.transforms[0]] : particle.transform;

    this.stamp.anchor.set(t.anchor.x, t.anchor.y);

    this.stamp.alpha = particle.color.alpha.calc;

    this.stamp.rotation = t.rotation.calc;

    if (particle.color.isTinted)
    {
        this.stamp.tint = particle.color.tint;
    }

    this.stamp.blendMode = particle.color.blendMode[0];

    this.stamp.texture.baseTexture.scaleMode = particle.texture.scaleMode;

    this.stamp.scale.setTo(t.scale.x.calc, t.scale.y.calc);

    let transform_x = 0;
    let transform_y = 0;
    if (particle.emitter.transforms) {
        let transforms_count = 0;
        for (let transform_key in particle.active_transforms) {
            transform_x += particle.active_transforms[transform_key].x;
            transform_y += particle.active_transforms[transform_key].y;
            ++transforms_count;
        }
        transform_x /= transforms_count;
        transform_y /= transforms_count;
    } else {
        transform_x = particle.transform.x;
        transform_y = particle.transform.y;
    }
    this.renderTexture.renderXY(this.stamp, transform_x, transform_y, false);

};

/**
* Destroys this renderer.
*
* @method Phaser.ParticleStorm.Renderer.RenderTexture#destroy
*/
Phaser.ParticleStorm.Renderer.RenderTexture.prototype.destroy = function () {

    this.display.destroy();

    this.stamp.destroy();

    this.renderTexture.destroy();

    this.emitter = null;

    this.game = null;

};

/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link http://choosealicense.com/licenses/no-license/|No License}
*/

/**
* A Sprite Batch based renderer. Sprite Batching is a way to get extremely fast
* drawing, especially under WebGL, by batching the particles together and reducing
* the quantity of draw calls. It only works when every particle uses the exact same
* Texture. If you have particles with varying textures then they will break the batch,
* nullifying the effect of its speed. You can use texture atlases to combine different
* frames into a single batch, but the core texture must be the same for all particles.
*
* @class Phaser.ParticleStorm.Renderer.SpriteBatch
* @constructor
* @param {Phaser.ParticleStorm.Emitter} emitter - The emitter that this renderer belongs to.
*/
Phaser.ParticleStorm.Renderer.SpriteBatch = function (emitter) {

    Phaser.ParticleStorm.Renderer.Base.call(this, emitter);

    /**
    * A Phaser.SpriteBatch that contains all of the particles in this renderer.
    * @property {Phaser.SpriteBatch} display
    */
    this.display = this.game.make.spriteBatch();

};

Phaser.ParticleStorm.Renderer.SpriteBatch.prototype = Object.create(Phaser.ParticleStorm.Renderer.Base.prototype);
Phaser.ParticleStorm.Renderer.SpriteBatch.prototype.constructor = Phaser.ParticleStorm.Renderer.SpriteBatch;

/**
* Adds the given particle to this renderer. If the particle has a sprite property
* then its reset and updated. If it doesn't then a new Phaser.Sprite is created,
* belonging to this renderers display.
*
* @method Phaser.ParticleStorm.Renderer.SpriteBatch#add
* @param {Phaser.ParticleStorm.Particle} particle - The particle to be updated.
* @return {Phaser.Sprite} This particles sprite property.
*/
Phaser.ParticleStorm.Renderer.SpriteBatch.prototype.add = function (particle) {

    var spr = particle.sprite;
    var key = particle.texture.key;
    var frame = particle.texture.frame;

    if (frame === undefined && particle.texture.frameName !== undefined)
    {
        //  String frame
        frame = particle.texture.frameName;
    }

    let t = particle.emitter.transforms ? particle.transform[particle.emitter.transforms[0]] : particle.transform;

    if (spr)
    {
        spr.reset(t.x, t.y);

        if (spr.key !== key)
        {
            spr.loadTexture(key, frame);
        }
        else
        {
            if (particle.texture.frame !== undefined)
            {
                spr.frame = frame;
            }
            else if (particle.texture.frameName !== undefined)
            {
                spr.frameName = frame;
            }
        }
    }
    else
    {
        spr = this.game.make.sprite(t.x, t.y, key, frame);
    }
    
    this.display.addChild(spr);

    spr.anchor.set(t.anchor.x, t.anchor.y);

    if (particle.color.isTinted)
    {
        spr.tint = particle.color.tint;
    }

    spr.blendMode = particle.color.blendMode[0];
    spr.texture.baseTexture.scaleMode = particle.texture.scaleMode;

    spr.visible = particle.visible;

    particle.sprite = spr;

    return spr;

};

/**
* Updates and renders the given particle to this renderer.
*
* @method Phaser.ParticleStorm.Renderer.SpriteBatch#update
* @param {Phaser.ParticleStorm.Particle} particle - The particle to be updated.
*/
Phaser.ParticleStorm.Renderer.SpriteBatch.prototype.update = function (particle) {

    var spr = particle.sprite;

    //  If the particle is delayed AND should be hidden when delayed ...
    if (particle.delay > 0 && !particle.delayVisible)
    {
        spr.visible = false;
        return;
    }

    spr.visible = particle.visible;

    spr.alpha = particle.color.alpha.calc;

    let t = particle.emitter.transforms ? particle.transform[particle.emitter.transforms[0]] : particle.transform;

    spr.rotation = t.rotation.calc;

    if (particle.color.isTinted)
    {
        spr.tint = particle.color.tint;
    }

    spr.scale.setTo(t.scale.x.calc, t.scale.y.calc);

    let transform_x = 0;
    let transform_y = 0;
    if (particle.emitter.transforms) {
        let transforms_count = 0;
        for (let transform_key in particle.active_transforms) {
            transform_x += particle.active_transforms[transform_key].x;
            transform_y += particle.active_transforms[transform_key].y;
            ++transforms_count;
        }
        transform_x /= transforms_count;
        transform_y /= transforms_count;
    } else {
        transform_x = particle.transform.x;
        transform_y = particle.transform.y;
    }

    spr.x = transform_x;
    spr.y = transform_y;

};

Phaser.ParticleStorm.Renderer.SpriteBatch.prototype.kill = function (particle) {

    if (particle.sprite)
    {
        particle.sprite.kill();
    }

};

Phaser.ParticleStorm.Renderer.SpriteBatch.prototype.destroy = function () {

    this.display.destroy(true);

    this.emitter = null;

    this.game = null;

};

//# sourceURL=assets/plugins/particle-storm.js