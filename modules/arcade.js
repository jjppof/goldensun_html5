/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2016 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

/**
* The Arcade Physics world. Contains Arcade Physics related collision, overlap and motion methods.
*
* @class Phaser.Physics.Arcade
* @constructor
* @param {Phaser.Game} game - reference to the current game instance.
*/
Phaser.Physics.Arcade = function (game) {

    /**
    * @property {Phaser.Game} game - Local reference to game.
    */
    this.game = game;

    /**
    * @property {Phaser.Point} gravity - The World gravity setting. Defaults to x: 0, y: 0, or no gravity.
    */
    this.gravity = new Phaser.Point();

    /**
    * @property {Phaser.Rectangle} bounds - The bounds inside of which the physics world exists. Defaults to match the world bounds.
    */
    this.bounds = new Phaser.Rectangle(0, 0, game.world.width, game.world.height);

    /**
    * Set the checkCollision properties to control for which bounds collision is processed.
    * For example checkCollision.down = false means Bodies cannot collide with the World.bounds.bottom.
    * @property {object} checkCollision - An object containing allowed collision flags.
    */
    this.checkCollision = { up: true, down: true, left: true, right: true };

    /**
    * @property {number} maxObjects - Used by the QuadTree to set the maximum number of objects per quad.
    */
    this.maxObjects = 10;

    /**
    * @property {number} maxLevels - Used by the QuadTree to set the maximum number of iteration levels.
    */
    this.maxLevels = 4;

    /**
    * @property {number} OVERLAP_BIAS - A value added to the delta values during collision checks.
    */
    this.OVERLAP_BIAS = 4;

    /**
    * @property {boolean} forceX - If true World.separate will always separate on the X axis before Y. Otherwise it will check gravity totals first.
    */
    this.forceX = false;

    /**
    * @property {number} sortDirection - Used when colliding a Sprite vs. a Group, or a Group vs. a Group, this defines the direction the sort is based on. Default is Phaser.Physics.Arcade.LEFT_RIGHT.
    * @default
    */
    this.sortDirection = Phaser.Physics.Arcade.LEFT_RIGHT;

    /**
    * @property {boolean} skipQuadTree - If true the QuadTree will not be used for any collision. QuadTrees are great if objects are well spread out in your game, otherwise they are a performance hit. If you enable this you can disable on a per body basis via `Body.skipQuadTree`.
    */
    this.skipQuadTree = true;

    /**
    * @property {boolean} isPaused - If `true` the `Body.preUpdate` method will be skipped, halting all motion for all bodies. Note that other methods such as `collide` will still work, so be careful not to call them on paused bodies.
    */
    this.isPaused = false;

    /**
    * @property {Phaser.QuadTree} quadTree - The world QuadTree.
    */
    this.quadTree = new Phaser.QuadTree(this.game.world.bounds.x, this.game.world.bounds.y, this.game.world.bounds.width, this.game.world.bounds.height, this.maxObjects, this.maxLevels);

    /**
    * @property {number} _total - Internal cache var.
    * @private
    */
    this._total = 0;

    // By default we want the bounds the same size as the world bounds
    this.setBoundsToWorld();

};

Phaser.Physics.Arcade.prototype.constructor = Phaser.Physics.Arcade;

/**
* A constant used for the sortDirection value.
* Use this if you don't wish to perform any pre-collision sorting at all, or will manually sort your Groups.
* @constant
* @type {number}
*/
Phaser.Physics.Arcade.SORT_NONE = 0;

/**
* A constant used for the sortDirection value.
* Use this if your game world is wide but short and scrolls from the left to the right (i.e. Mario)
* @constant
* @type {number}
*/
Phaser.Physics.Arcade.LEFT_RIGHT = 1;

/**
* A constant used for the sortDirection value.
* Use this if your game world is wide but short and scrolls from the right to the left (i.e. Mario backwards)
* @constant
* @type {number}
*/
Phaser.Physics.Arcade.RIGHT_LEFT = 2;

/**
* A constant used for the sortDirection value.
* Use this if your game world is narrow but tall and scrolls from the top to the bottom (i.e. Dig Dug)
* @constant
* @type {number}
*/
Phaser.Physics.Arcade.TOP_BOTTOM = 3;

/**
* A constant used for the sortDirection value.
* Use this if your game world is narrow but tall and scrolls from the bottom to the top (i.e. Commando or a vertically scrolling shoot-em-up)
* @constant
* @type {number}
*/
Phaser.Physics.Arcade.BOTTOM_TOP = 4;

Phaser.Physics.Arcade.prototype = {

    /**
    * Updates the size of this physics world.
    *
    * @method Phaser.Physics.Arcade#setBounds
    * @param {number} x - Top left most corner of the world.
    * @param {number} y - Top left most corner of the world.
    * @param {number} width - New width of the world. Can never be smaller than the Game.width.
    * @param {number} height - New height of the world. Can never be smaller than the Game.height.
    */
    setBounds: function (x, y, width, height) {

        this.bounds.setTo(x, y, width, height);

    },

    /**
    * Updates the size of this physics world to match the size of the game world.
    *
    * @method Phaser.Physics.Arcade#setBoundsToWorld
    */
    setBoundsToWorld: function () {

        this.bounds.copyFrom(this.game.world.bounds);

    },

    /**
    * This will create an Arcade Physics body on the given game object or array of game objects.
    * A game object can only have 1 physics body active at any one time, and it can't be changed until the object is destroyed.
    *
    * @method Phaser.Physics.Arcade#enable
    * @param {object|array|Phaser.Group} object - The game object to create the physics body on. Can also be an array or Group of objects, a body will be created on every child that has a `body` property.
    * @param {boolean} [children=true] - Should a body be created on all children of this object? If true it will recurse down the display list as far as it can go.
    */
    enable: function (object, children) {

        if (children === undefined) { children = true; }

        var i = 1;

        if (Array.isArray(object))
        {
            i = object.length;

            while (i--)
            {
                if (object[i] instanceof Phaser.Group)
                {
                    //  If it's a Group then we do it on the children regardless
                    this.enable(object[i].children, children);
                }
                else
                {
                    this.enableBody(object[i]);

                    if (children && object[i].hasOwnProperty('children') && object[i].children.length > 0)
                    {
                        this.enable(object[i], true);
                    }
                }
            }
        }
        else
        {
            if (object instanceof Phaser.Group)
            {
                //  If it's a Group then we do it on the children regardless
                this.enable(object.children, children);
            }
            else
            {
                this.enableBody(object);

                if (children && object.hasOwnProperty('children') && object.children.length > 0)
                {
                    this.enable(object.children, true);
                }
            }
        }

    },

    /**
    * Creates an Arcade Physics body on the given game object.
    * 
    * A game object can only have 1 physics body active at any one time, and it can't be changed until the body is nulled.
    *
    * When you add an Arcade Physics body to an object it will automatically add the object into its parent Groups hash array.
    *
    * @method Phaser.Physics.Arcade#enableBody
    * @param {object} object - The game object to create the physics body on. A body will only be created if this object has a null `body` property.
    */
    enableBody: function (object) {

        if (object.hasOwnProperty('body') && object.body === null)
        {
            object.body = new Phaser.Physics.Arcade.Body(object);

            if (object.parent && object.parent instanceof Phaser.Group)
            {
                object.parent.addToHash(object);
            }
        }

    },

    /**
    * Called automatically by a Physics body, it updates all motion related values on the Body unless `World.isPaused` is `true`.
    *
    * @method Phaser.Physics.Arcade#updateMotion
    * @param {Phaser.Physics.Arcade.Body} The Body object to be updated.
    */
    updateMotion: function (body) {

        var velocityDelta = this.computeVelocity(0, body, body.angularVelocity, body.angularAcceleration, body.angularDrag, body.maxAngular) - body.angularVelocity;
        body.angularVelocity += velocityDelta;
        body.rotation += (body.angularVelocity * this.game.time.physicsElapsed);

        body.velocity.x = this.computeVelocity(1, body, body.velocity.x, body.acceleration.x, body.drag.x, body.maxVelocity.x);
        body.velocity.y = this.computeVelocity(2, body, body.velocity.y, body.acceleration.y, body.drag.y, body.maxVelocity.y);

    },

    /**
    * A tween-like function that takes a starting velocity and some other factors and returns an altered velocity.
    * Based on a function in Flixel by @ADAMATOMIC
    *
    * @method Phaser.Physics.Arcade#computeVelocity
    * @param {number} axis - 0 for nothing, 1 for horizontal, 2 for vertical.
    * @param {Phaser.Physics.Arcade.Body} body - The Body object to be updated.
    * @param {number} velocity - Any component of velocity (e.g. 20).
    * @param {number} acceleration - Rate at which the velocity is changing.
    * @param {number} drag - Really kind of a deceleration, this is how much the velocity changes if Acceleration is not set.
    * @param {number} [max=10000] - An absolute value cap for the velocity.
    * @return {number} The altered Velocity value.
    */
    computeVelocity: function (axis, body, velocity, acceleration, drag, max) {

        if (max === undefined) { max = 10000; }

        if (axis === 1 && body.allowGravity)
        {
            velocity += (this.gravity.x + body.gravity.x) * this.game.time.physicsElapsed;
        }
        else if (axis === 2 && body.allowGravity)
        {
            velocity += (this.gravity.y + body.gravity.y) * this.game.time.physicsElapsed;
        }

        if (acceleration)
        {
            velocity += acceleration * this.game.time.physicsElapsed;
        }
        else if (drag)
        {
            drag *= this.game.time.physicsElapsed;

            if (velocity - drag > 0)
            {
                velocity -= drag;
            }
            else if (velocity + drag < 0)
            {
                velocity += drag;
            }
            else
            {
                velocity = 0;
            }
        }

        if (velocity > max)
        {
            velocity = max;
        }
        else if (velocity < -max)
        {
            velocity = -max;
        }

        return velocity;

    },

    /**
    * Checks for overlaps between two game objects. The objects can be Sprites, Groups or Emitters.
    * You can perform Sprite vs. Sprite, Sprite vs. Group and Group vs. Group overlap checks.
    * Unlike collide the objects are NOT automatically separated or have any physics applied, they merely test for overlap results.
    * Both the first and second parameter can be arrays of objects, of differing types.
    * If two arrays are passed, the contents of the first parameter will be tested against all contents of the 2nd parameter.
    * NOTE: This function is not recursive, and will not test against children of objects passed (i.e. Groups within Groups).
    *
    * @method Phaser.Physics.Arcade#overlap
    * @param {Phaser.Sprite|Phaser.Group|Phaser.Particles.Emitter|array} object1 - The first object or array of objects to check. Can be Phaser.Sprite, Phaser.Group or Phaser.Particles.Emitter.
    * @param {Phaser.Sprite|Phaser.Group|Phaser.Particles.Emitter|array} object2 - The second object or array of objects to check. Can be Phaser.Sprite, Phaser.Group or Phaser.Particles.Emitter.
    * @param {function} [overlapCallback=null] - An optional callback function that is called if the objects overlap. The two objects will be passed to this function in the same order in which you specified them, unless you are checking Group vs. Sprite, in which case Sprite will always be the first parameter.
    * @param {function} [processCallback=null] - A callback function that lets you perform additional checks against the two objects if they overlap. If this is set then `overlapCallback` will only be called if this callback returns `true`.
    * @param {object} [callbackContext] - The context in which to run the callbacks.
    * @return {boolean} True if an overlap occurred otherwise false.
    */
    overlap: function (object1, object2, overlapCallback, processCallback, callbackContext) {

        overlapCallback = overlapCallback || null;
        processCallback = processCallback || null;
        callbackContext = callbackContext || overlapCallback;

        this._total = 0;

        if (!Array.isArray(object1) && Array.isArray(object2))
        {
            for (var i = 0; i < object2.length; i++)
            {
                this.collideHandler(object1, object2[i], overlapCallback, processCallback, callbackContext, true);
            }
        }
        else if (Array.isArray(object1) && !Array.isArray(object2))
        {
            for (var i = 0; i < object1.length; i++)
            {
                this.collideHandler(object1[i], object2, overlapCallback, processCallback, callbackContext, true);
            }
        }
        else if (Array.isArray(object1) && Array.isArray(object2))
        {
            for (var i = 0; i < object1.length; i++)
            {
                for (var j = 0; j < object2.length; j++)
                {
                    this.collideHandler(object1[i], object2[j], overlapCallback, processCallback, callbackContext, true);
                }
            }
        }
        else
        {
            this.collideHandler(object1, object2, overlapCallback, processCallback, callbackContext, true);
        }

        return (this._total > 0);

    },

    /**
    * Checks for collision between two game objects. You can perform Sprite vs. Sprite, Sprite vs. Group, Group vs. Group, Sprite vs. Tilemap Layer or Group vs. Tilemap Layer collisions.
    * Both the first and second parameter can be arrays of objects, of differing types.
    * If two arrays are passed, the contents of the first parameter will be tested against all contents of the 2nd parameter.
    * The objects are also automatically separated. If you don't require separation then use ArcadePhysics.overlap instead.
    * An optional processCallback can be provided. If given this function will be called when two sprites are found to be colliding. It is called before any separation takes place,
    * giving you the chance to perform additional checks. If the function returns true then the collision and separation is carried out. If it returns false it is skipped.
    * The collideCallback is an optional function that is only called if two sprites collide. If a processCallback has been set then it needs to return true for collideCallback to be called.
    * NOTE: This function is not recursive, and will not test against children of objects passed (i.e. Groups or Tilemaps within other Groups).
    *
    * @method Phaser.Physics.Arcade#collide
    * @param {Phaser.Sprite|Phaser.Group|Phaser.Particles.Emitter|Phaser.TilemapLayer|array} object1 - The first object or array of objects to check. Can be Phaser.Sprite, Phaser.Group, Phaser.Particles.Emitter, or Phaser.TilemapLayer.
    * @param {Phaser.Sprite|Phaser.Group|Phaser.Particles.Emitter|Phaser.TilemapLayer|array} object2 - The second object or array of objects to check. Can be Phaser.Sprite, Phaser.Group, Phaser.Particles.Emitter or Phaser.TilemapLayer.
    * @param {function} [collideCallback=null] - An optional callback function that is called if the objects collide. The two objects will be passed to this function in the same order in which you specified them, unless you are colliding Group vs. Sprite, in which case Sprite will always be the first parameter.
    * @param {function} [processCallback=null] - A callback function that lets you perform additional checks against the two objects if they overlap. If this is set then collision will only happen if processCallback returns true. The two objects will be passed to this function in the same order in which you specified them, unless you are colliding Group vs. Sprite, in which case Sprite will always be the first parameter.
    * @param {object} [callbackContext] - The context in which to run the callbacks.
    * @return {boolean} True if a collision occurred otherwise false.
    */
    collide: function (object1, object2, collideCallback, processCallback, callbackContext) {

        collideCallback = collideCallback || null;
        processCallback = processCallback || null;
        callbackContext = callbackContext || collideCallback;

        this._total = 0;

        if (!Array.isArray(object1) && Array.isArray(object2))
        {
            for (var i = 0; i < object2.length; i++)
            {
                this.collideHandler(object1, object2[i], collideCallback, processCallback, callbackContext, false);
            }
        }
        else if (Array.isArray(object1) && !Array.isArray(object2))
        {
            for (var i = 0; i < object1.length; i++)
            {
                this.collideHandler(object1[i], object2, collideCallback, processCallback, callbackContext, false);
            }
        }
        else if (Array.isArray(object1) && Array.isArray(object2))
        {
            for (var i = 0; i < object1.length; i++)
            {
                for (var j = 0; j < object2.length; j++)
                {
                    this.collideHandler(object1[i], object2[j], collideCallback, processCallback, callbackContext, false);
                }
            }
        }
        else
        {
            this.collideHandler(object1, object2, collideCallback, processCallback, callbackContext, false);
        }

        return (this._total > 0);

    },

    /**
     * A Sort function for sorting two bodies based on a LEFT to RIGHT sort direction.
     *
     * This is called automatically by World.sort
     *
     * @method Phaser.Physics.Arcade#sortLeftRight
     * @param {Phaser.Sprite} a - The first Sprite to test. The Sprite must have an Arcade Physics Body.
     * @param {Phaser.Sprite} b - The second Sprite to test. The Sprite must have an Arcade Physics Body.
     * @return {integer} A negative value if `a > b`, a positive value if `a < b` or 0 if `a === b` or the bodies are invalid.
     */
    sortLeftRight: function (a, b) {

        if (!a.body || !b.body)
        {
            return 0;
        }

        return a.body.x - b.body.x;

    },

    /**
     * A Sort function for sorting two bodies based on a RIGHT to LEFT sort direction.
     *
     * This is called automatically by World.sort
     *
     * @method Phaser.Physics.Arcade#sortRightLeft
     * @param {Phaser.Sprite} a - The first Sprite to test. The Sprite must have an Arcade Physics Body.
     * @param {Phaser.Sprite} b - The second Sprite to test. The Sprite must have an Arcade Physics Body.
     * @return {integer} A negative value if `a > b`, a positive value if `a < b` or 0 if `a === b` or the bodies are invalid.
     */
    sortRightLeft: function (a, b) {

        if (!a.body || !b.body)
        {
            return 0;
        }

        return b.body.x - a.body.x;

    },

    /**
     * A Sort function for sorting two bodies based on a TOP to BOTTOM sort direction.
     *
     * This is called automatically by World.sort
     *
     * @method Phaser.Physics.Arcade#sortTopBottom
     * @param {Phaser.Sprite} a - The first Sprite to test. The Sprite must have an Arcade Physics Body.
     * @param {Phaser.Sprite} b - The second Sprite to test. The Sprite must have an Arcade Physics Body.
     * @return {integer} A negative value if `a > b`, a positive value if `a < b` or 0 if `a === b` or the bodies are invalid.
     */
    sortTopBottom: function (a, b) {

        if (!a.body || !b.body)
        {
            return 0;
        }

        return a.body.y - b.body.y;

    },

    /**
     * A Sort function for sorting two bodies based on a BOTTOM to TOP sort direction.
     *
     * This is called automatically by World.sort
     *
     * @method Phaser.Physics.Arcade#sortBottomTop
     * @param {Phaser.Sprite} a - The first Sprite to test. The Sprite must have an Arcade Physics Body.
     * @param {Phaser.Sprite} b - The second Sprite to test. The Sprite must have an Arcade Physics Body.
     * @return {integer} A negative value if `a > b`, a positive value if `a < b` or 0 if `a === b` or the bodies are invalid.
     */
    sortBottomTop: function (a, b) {

        if (!a.body || !b.body)
        {
            return 0;
        }

        return b.body.y - a.body.y;

    },

    /**
     * This method will sort a Groups hash array.
     *
     * If the Group has `physicsSortDirection` set it will use the sort direction defined.
     *
     * Otherwise if the sortDirection parameter is undefined, or Group.physicsSortDirection is null, it will use Phaser.Physics.Arcade.sortDirection.
     *
     * By changing Group.physicsSortDirection you can customise each Group to sort in a different order.
     *
     * @method Phaser.Physics.Arcade#sort
     * @param {Phaser.Group} group - The Group to sort.
     * @param {integer} [sortDirection] - The sort direction used to sort this Group.
     */
    sort: function (group, sortDirection) {

        if (group.physicsSortDirection !== null)
        {
            sortDirection = group.physicsSortDirection;
        }
        else
        {
            if (sortDirection === undefined) { sortDirection = this.sortDirection; }
        }

        if (sortDirection === Phaser.Physics.Arcade.LEFT_RIGHT)
        {
            //  Game world is say 2000x600 and you start at 0
            group.hash.sort(this.sortLeftRight);
        }
        else if (sortDirection === Phaser.Physics.Arcade.RIGHT_LEFT)
        {
            //  Game world is say 2000x600 and you start at 2000
            group.hash.sort(this.sortRightLeft);
        }
        else if (sortDirection === Phaser.Physics.Arcade.TOP_BOTTOM)
        {
            //  Game world is say 800x2000 and you start at 0
            group.hash.sort(this.sortTopBottom);
        }
        else if (sortDirection === Phaser.Physics.Arcade.BOTTOM_TOP)
        {
            //  Game world is say 800x2000 and you start at 2000
            group.hash.sort(this.sortBottomTop);
        }

    },

    /**
    * Internal collision handler.
    *
    * @method Phaser.Physics.Arcade#collideHandler
    * @private
    * @param {Phaser.Sprite|Phaser.Group|Phaser.Particles.Emitter|Phaser.TilemapLayer} object1 - The first object to check. Can be an instance of Phaser.Sprite, Phaser.Group, Phaser.Particles.Emitter, or Phaser.TilemapLayer.
    * @param {Phaser.Sprite|Phaser.Group|Phaser.Particles.Emitter|Phaser.TilemapLayer} object2 - The second object to check. Can be an instance of Phaser.Sprite, Phaser.Group, Phaser.Particles.Emitter or Phaser.TilemapLayer. Can also be an array of objects to check.
    * @param {function} collideCallback - An optional callback function that is called if the objects collide. The two objects will be passed to this function in the same order in which you specified them.
    * @param {function} processCallback - A callback function that lets you perform additional checks against the two objects if they overlap. If this is set then collision will only happen if processCallback returns true. The two objects will be passed to this function in the same order in which you specified them.
    * @param {object} callbackContext - The context in which to run the callbacks.
    * @param {boolean} overlapOnly - Just run an overlap or a full collision.
    */
    collideHandler: function (object1, object2, collideCallback, processCallback, callbackContext, overlapOnly) {

        //  Only collide valid objects
        if (object2 === undefined && object1.physicsType === Phaser.GROUP)
        {
            this.sort(object1);
            this.collideGroupVsSelf(object1, collideCallback, processCallback, callbackContext, overlapOnly);
            return;
        }

        //  If neither of the objects are set or exist then bail out
        if (!object1 || !object2 || !object1.exists || !object2.exists)
        {
            return;
        }

        //  Groups? Sort them
        if (this.sortDirection !== Phaser.Physics.Arcade.SORT_NONE)
        {
            if (object1.physicsType === Phaser.GROUP)
            {
                this.sort(object1);
            }

            if (object2.physicsType === Phaser.GROUP)
            {
                this.sort(object2);
            }
        }

        //  SPRITES
        if (object1.physicsType === Phaser.SPRITE)
        {
            if (object2.physicsType === Phaser.SPRITE)
            {
                this.collideSpriteVsSprite(object1, object2, collideCallback, processCallback, callbackContext, overlapOnly);
            }
            else if (object2.physicsType === Phaser.GROUP)
            {
                this.collideSpriteVsGroup(object1, object2, collideCallback, processCallback, callbackContext, overlapOnly);
            }
            else if (object2.physicsType === Phaser.TILEMAPLAYER)
            {
                this.collideSpriteVsTilemapLayer(object1, object2, collideCallback, processCallback, callbackContext, overlapOnly);
            }
        }
        //  GROUPS
        else if (object1.physicsType === Phaser.GROUP)
        {
            if (object2.physicsType === Phaser.SPRITE)
            {
                this.collideSpriteVsGroup(object2, object1, collideCallback, processCallback, callbackContext, overlapOnly);
            }
            else if (object2.physicsType === Phaser.GROUP)
            {
                this.collideGroupVsGroup(object1, object2, collideCallback, processCallback, callbackContext, overlapOnly);
            }
            else if (object2.physicsType === Phaser.TILEMAPLAYER)
            {
                this.collideGroupVsTilemapLayer(object1, object2, collideCallback, processCallback, callbackContext, overlapOnly);
            }
        }
        //  TILEMAP LAYERS
        else if (object1.physicsType === Phaser.TILEMAPLAYER)
        {
            if (object2.physicsType === Phaser.SPRITE)
            {
                this.collideSpriteVsTilemapLayer(object2, object1, collideCallback, processCallback, callbackContext, overlapOnly);
            }
            else if (object2.physicsType === Phaser.GROUP)
            {
                this.collideGroupVsTilemapLayer(object2, object1, collideCallback, processCallback, callbackContext, overlapOnly);
            }
        }

    },

    /**
    * An internal function. Use Phaser.Physics.Arcade.collide instead.
    *
    * @method Phaser.Physics.Arcade#collideSpriteVsSprite
    * @private
    * @param {Phaser.Sprite} sprite1 - The first sprite to check.
    * @param {Phaser.Sprite} sprite2 - The second sprite to check.
    * @param {function} collideCallback - An optional callback function that is called if the objects collide. The two objects will be passed to this function in the same order in which you specified them.
    * @param {function} processCallback - A callback function that lets you perform additional checks against the two objects if they overlap. If this is set then collision will only happen if processCallback returns true. The two objects will be passed to this function in the same order in which you specified them.
    * @param {object} callbackContext - The context in which to run the callbacks.
    * @param {boolean} overlapOnly - Just run an overlap or a full collision.
    * @return {boolean} True if there was a collision, otherwise false.
    */
    collideSpriteVsSprite: function (sprite1, sprite2, collideCallback, processCallback, callbackContext, overlapOnly) {

        if (!sprite1.body || !sprite2.body)
        {
            return false;
        }

        if (this.separate(sprite1.body, sprite2.body, processCallback, callbackContext, overlapOnly))
        {
            if (collideCallback)
            {
                collideCallback.call(callbackContext, sprite1, sprite2);
            }

            this._total++;
        }

        return true;

    },

    /**
    * An internal function. Use Phaser.Physics.Arcade.collide instead.
    *
    * @method Phaser.Physics.Arcade#collideSpriteVsGroup
    * @private
    * @param {Phaser.Sprite} sprite - The sprite to check.
    * @param {Phaser.Group} group - The Group to check.
    * @param {function} collideCallback - An optional callback function that is called if the objects collide. The two objects will be passed to this function in the same order in which you specified them.
    * @param {function} processCallback - A callback function that lets you perform additional checks against the two objects if they overlap. If this is set then collision will only happen if processCallback returns true. The two objects will be passed to this function in the same order in which you specified them.
    * @param {object} callbackContext - The context in which to run the callbacks.
    * @param {boolean} overlapOnly - Just run an overlap or a full collision.
    */
    collideSpriteVsGroup: function (sprite, group, collideCallback, processCallback, callbackContext, overlapOnly) {

        if (group.length === 0 || !sprite.body)
        {
            return;
        }

        if (this.skipQuadTree || sprite.body.skipQuadTree)
        {
            var bounds = {};

            for (var i = 0; i < group.hash.length; i++)
            {
                var object1 = group.hash[i];

                //  Skip duff entries - we can't check a non-existent sprite or one with no body
                if (!object1 || !object1.exists || !object1.body)
                {
                    continue;
                }

                //  Inject the Body bounds data into the bounds object
                bounds = object1.body.getBounds(bounds);

                //  Skip items either side of the sprite
                if (this.sortDirection === Phaser.Physics.Arcade.LEFT_RIGHT)
                {
                    if (sprite.body.right < bounds.x)
                    {
                        break;
                    }
                    else if (bounds.right < sprite.body.x)
                    {
                        continue;
                    }
                }
                else if (this.sortDirection === Phaser.Physics.Arcade.RIGHT_LEFT)
                {
                    if (sprite.body.x > bounds.right)
                    {
                        break;
                    }
                    else if (bounds.x > sprite.body.right)
                    {
                        continue;
                    }
                }
                else if (this.sortDirection === Phaser.Physics.Arcade.TOP_BOTTOM)
                {
                    if (sprite.body.bottom < bounds.y)
                    {
                        break;
                    }
                    else if (bounds.bottom < sprite.body.y)
                    {
                        continue;
                    }
                }
                else if (this.sortDirection === Phaser.Physics.Arcade.BOTTOM_TOP)
                {
                    if (sprite.body.y > bounds.bottom)
                    {
                        break;
                    }
                    else if (bounds.y > sprite.body.bottom)
                    {
                        continue;
                    }
                }
                
                this.collideSpriteVsSprite(sprite, object1, collideCallback, processCallback, callbackContext, overlapOnly);
            }
        }
        else
        {
            //  What is the sprite colliding with in the quadtree?
            this.quadTree.clear();

            this.quadTree.reset(this.game.world.bounds.x, this.game.world.bounds.y, this.game.world.bounds.width, this.game.world.bounds.height, this.maxObjects, this.maxLevels);

            this.quadTree.populate(group);

            var items = this.quadTree.retrieve(sprite);

            for (var i = 0; i < items.length; i++)
            {
                //  We have our potential suspects, are they in this group?
                if (this.separate(sprite.body, items[i], processCallback, callbackContext, overlapOnly))
                {
                    if (collideCallback)
                    {
                        collideCallback.call(callbackContext, sprite, items[i].sprite);
                    }

                    this._total++;
                }
            }
        }

    },

    /**
    * An internal function. Use Phaser.Physics.Arcade.collide instead.
    *
    * @method Phaser.Physics.Arcade#collideGroupVsSelf
    * @private
    * @param {Phaser.Group} group - The Group to check.
    * @param {function} collideCallback - An optional callback function that is called if the objects collide. The two objects will be passed to this function in the same order in which you specified them.
    * @param {function} processCallback - A callback function that lets you perform additional checks against the two objects if they overlap. If this is set then collision will only happen if processCallback returns true. The two objects will be passed to this function in the same order in which you specified them.
    * @param {object} callbackContext - The context in which to run the callbacks.
    * @param {boolean} overlapOnly - Just run an overlap or a full collision.
    * @return {boolean} True if there was a collision, otherwise false.
    */
    collideGroupVsSelf: function (group, collideCallback, processCallback, callbackContext, overlapOnly) {

        if (group.length === 0)
        {
            return;
        }

        for (var i = 0; i < group.hash.length; i++)
        {
            var bounds1 = {};
            var object1 = group.hash[i];

            //  Skip duff entries - we can't check a non-existent sprite or one with no body
            if (!object1 || !object1.exists || !object1.body)
            {
                continue;
            }

            //  Inject the Body bounds data into the bounds1 object
            bounds1 = object1.body.getBounds(bounds1);

            for (var j = i + 1; j < group.hash.length; j++)
            {
                var bounds2 = {};
                var object2 = group.hash[j];

                //  Skip duff entries - we can't check a non-existent sprite or one with no body
                if (!object2 || !object2.exists || !object2.body)
                {
                    continue;
                }

                //  Inject the Body bounds data into the bounds2 object
                bounds2 = object2.body.getBounds(bounds2);

                //  Skip items either side of the sprite
                if (this.sortDirection === Phaser.Physics.Arcade.LEFT_RIGHT)
                {
                    if (bounds1.right < bounds2.x)
                    {
                        break;
                    }
                    else if (bounds2.right < bounds1.x)
                    {
                        continue;
                    }
                }
                else if (this.sortDirection === Phaser.Physics.Arcade.RIGHT_LEFT)
                {
                    if (bounds1.x > bounds2.right)
                    {
                        continue;
                    }
                    else if (bounds2.x > bounds1.right)
                    {
                        break;
                    }
                }
                else if (this.sortDirection === Phaser.Physics.Arcade.TOP_BOTTOM)
                {
                    if (bounds1.bottom < bounds2.y)
                    {
                        continue;
                    }
                    else if (bounds2.bottom < bounds1.y)
                    {
                        break;
                    }
                }
                else if (this.sortDirection === Phaser.Physics.Arcade.BOTTOM_TOP)
                {
                    if (bounds1.y > bounds2.bottom)
                    {
                        continue;
                    }
                    else if (bounds2.y > object1.body.bottom)
                    {
                        break;
                    }
                }
                
                this.collideSpriteVsSprite(object1, object2, collideCallback, processCallback, callbackContext, overlapOnly);
            }
        }

    },

    /**
    * An internal function. Use Phaser.Physics.Arcade.collide instead.
    *
    * @method Phaser.Physics.Arcade#collideGroupVsGroup
    * @private
    * @param {Phaser.Group} group1 - The first Group to check.
    * @param {Phaser.Group} group2 - The second Group to check.
    * @param {function} collideCallback - An optional callback function that is called if the objects collide. The two objects will be passed to this function in the same order in which you specified them.
    * @param {function} processCallback - A callback function that lets you perform additional checks against the two objects if they overlap. If this is set then collision will only happen if processCallback returns true. The two objects will be passed to this function in the same order in which you specified them.
    * @param {object} callbackContext - The context in which to run the callbacks.
    * @param {boolean} overlapOnly - Just run an overlap or a full collision.
    */
    collideGroupVsGroup: function (group1, group2, collideCallback, processCallback, callbackContext, overlapOnly) {

        if (group1.length === 0 || group2.length === 0)
        {
            return;
        }

        for (var i = 0; i < group1.children.length; i++)
        {
            if (group1.children[i].exists)
            {
                if (group1.children[i].physicsType === Phaser.GROUP)
                {
                    this.collideGroupVsGroup(group1.children[i], group2, collideCallback, processCallback, callbackContext, overlapOnly);
                }
                else
                {
                    this.collideSpriteVsGroup(group1.children[i], group2, collideCallback, processCallback, callbackContext, overlapOnly);
                }
            }
        }

    },

    /**
    * The core separation function to separate two physics bodies.
    *
    * @private
    * @method Phaser.Physics.Arcade#separate
    * @param {Phaser.Physics.Arcade.Body} body1 - The first Body object to separate.
    * @param {Phaser.Physics.Arcade.Body} body2 - The second Body object to separate.
    * @param {function} [processCallback=null] - A callback function that lets you perform additional checks against the two objects if they overlap. If this function is set then the sprites will only be collided if it returns true.
    * @param {object} [callbackContext] - The context in which to run the process callback.
    * @param {boolean} overlapOnly - Just run an overlap or a full collision.
    * @return {boolean} Returns true if the bodies collided, otherwise false.
    */
    separate: function (body1, body2, processCallback, callbackContext, overlapOnly) {

        if (
            !body1.enable ||
            !body2.enable ||
            body1.checkCollision.none ||
            body2.checkCollision.none ||
            !this.intersects(body1, body2))
        {
            return false;
        }

        //  They overlap. Is there a custom process callback? If it returns true then we can carry on, otherwise we should abort.
        if (processCallback && processCallback.call(callbackContext, body1.sprite, body2.sprite) === false)
        {
            return false;
        }

        //  Circle vs. Circle quick bail out
        if (body1.isCircle && body2.isCircle)
        {
            return this.separateCircle(body1, body2, overlapOnly);
        }

        // We define the behavior of bodies in a collision circle and rectangle
        // If a collision occurs in the corner points of the rectangle, the body behave like circles

        //  Either body1 or body2 is a circle
        if (body1.isCircle !== body2.isCircle)
        {
            var bodyRect = (body1.isCircle) ? body2 : body1;
            var bodyCircle = (body1.isCircle) ? body1 : body2;

            var rect = {
                x: bodyRect.x,
                y: bodyRect.y,
                right: bodyRect.right,
                bottom: bodyRect.bottom
            };

            var circle = {
                x: bodyCircle.x + bodyCircle.radius,
                y: bodyCircle.y + bodyCircle.radius
            };

            if (circle.y < rect.y || circle.y > rect.bottom)
            {
                if (circle.x < rect.x || circle.x > rect.right)
                {
                    return this.separateCircle(body1, body2, overlapOnly);
                }
            }
        }

        var resultX = false;
        var resultY = false;

        //  Do we separate on x or y first?
        if (this.forceX || Math.abs(this.gravity.y + body1.gravity.y) < Math.abs(this.gravity.x + body1.gravity.x))
        {
            resultX = this.separateX(body1, body2, overlapOnly);

            //  Are they still intersecting? Let's do the other axis then
            if (this.intersects(body1, body2))
            {
                resultY = this.separateY(body1, body2, overlapOnly);
            }
        }
        else
        {
            resultY = this.separateY(body1, body2, overlapOnly);

            //  Are they still intersecting? Let's do the other axis then
            if (this.intersects(body1, body2))
            {
                resultX = this.separateX(body1, body2, overlapOnly);
            }
        }

        var result = (resultX || resultY);

        if (result)
        {
            if (overlapOnly)
            {
                if (body1.onOverlap)
                {
                    body1.onOverlap.dispatch(body1.sprite, body2.sprite);
                }

                if (body2.onOverlap)
                {
                    body2.onOverlap.dispatch(body2.sprite, body1.sprite);
                }
            }
            else
            {
                if (body1.onCollide)
                {
                    body1.onCollide.dispatch(body1.sprite, body2.sprite);
                }

                if (body2.onCollide)
                {
                    body2.onCollide.dispatch(body2.sprite, body1.sprite);
                }
            }
        }

        return result;

    },

    /**
    * Check for intersection against two bodies.
    *
    * @method Phaser.Physics.Arcade#intersects
    * @param {Phaser.Physics.Arcade.Body} body1 - The first Body object to check.
    * @param {Phaser.Physics.Arcade.Body} body2 - The second Body object to check.
    * @return {boolean} True if they intersect, otherwise false.
    */
    intersects: function (body1, body2) {

        if (body1 === body2)
        {
            return false;
        }

        if (body1.isCircle)
        {
            if (body2.isCircle)
            {
                //  Circle vs. Circle
                return Phaser.Math.distance(body1.center.x, body1.center.y, body2.center.x, body2.center.y) <= (body1.radius + body2.radius);
            }
            else
            {
                //  Circle vs. Rect
                return this.circleBodyIntersects(body1, body2);
            }
        }
        else
        {
            if (body2.isCircle)
            {
                //  Rect vs. Circle
                return this.circleBodyIntersects(body2, body1);
            }
            else
            {
                //  Rect vs. Rect
                if (body1.right <= body2.position.x)
                {
                    return false;
                }

                if (body1.bottom <= body2.position.y)
                {
                    return false;
                }

                if (body1.position.x >= body2.right)
                {
                    return false;
                }

                if (body1.position.y >= body2.bottom)
                {
                    return false;
                }

                return true;
            }
        }

    },

    /**
    * Checks to see if a circular Body intersects with a Rectangular Body.
    *
    * @method Phaser.Physics.Arcade#circleBodyIntersects
    * @param {Phaser.Physics.Arcade.Body} circle - The Body with `isCircle` set.
    * @param {Phaser.Physics.Arcade.Body} body - The Body with `isCircle` not set (i.e. uses Rectangle shape)
    * @return {boolean} Returns true if the bodies intersect, otherwise false.
    */
    circleBodyIntersects: function (circle, body) {

        var x = Phaser.Math.clamp(circle.center.x, body.left, body.right);
        var y = Phaser.Math.clamp(circle.center.y, body.top, body.bottom);

        var dx = (circle.center.x - x) * (circle.center.x - x);
        var dy = (circle.center.y - y) * (circle.center.y - y);

        return (dx + dy) <= (circle.radius * circle.radius);

    },

    /**
    * The core separation function to separate two circular physics bodies.
    *
    * @method Phaser.Physics.Arcade#separateCircle
    * @private
    * @param {Phaser.Physics.Arcade.Body} body1 - The first Body to separate. Must have `Body.isCircle` true and a positive `radius`.
    * @param {Phaser.Physics.Arcade.Body} body2 - The second Body to separate. Must have `Body.isCircle` true and a positive `radius`.
    * @param {boolean} overlapOnly - If true the bodies will only have their overlap data set, no separation or exchange of velocity will take place.
    * @return {boolean} Returns true if the bodies were separated or overlap, otherwise false.
    */
    separateCircle: function (body1, body2, overlapOnly) {

        //  Set the bounding box overlap values
        this.getOverlapX(body1, body2);
        this.getOverlapY(body1, body2);

        var dx = body2.center.x - body1.center.x;
        var dy = body2.center.y - body1.center.y;

        var angleCollision = Math.atan2(dy, dx);

        var overlap = 0;

        if (body1.isCircle !== body2.isCircle)
        {
            var rect = {
                x: (body2.isCircle) ? body1.position.x : body2.position.x,
                y: (body2.isCircle) ? body1.position.y : body2.position.y,
                right: (body2.isCircle) ? body1.right : body2.right,
                bottom: (body2.isCircle) ? body1.bottom : body2.bottom
            };

            var circle = {
                x: (body1.isCircle) ? (body1.position.x + body1.radius) : (body2.position.x + body2.radius),
                y: (body1.isCircle) ? (body1.position.y + body1.radius) : (body2.position.y + body2.radius),
                radius: (body1.isCircle) ? body1.radius : body2.radius
            };

            if (circle.y < rect.y)
            {
                if (circle.x < rect.x)
                {
                    overlap = Phaser.Math.distance(circle.x, circle.y, rect.x, rect.y) - circle.radius;
                }
                else if (circle.x > rect.right)
                {
                    overlap = Phaser.Math.distance(circle.x, circle.y, rect.right, rect.y) - circle.radius;
                }
            }
            else if (circle.y > rect.bottom)
            {
                if (circle.x < rect.x)
                {
                    overlap = Phaser.Math.distance(circle.x, circle.y, rect.x, rect.bottom) - circle.radius;
                }
                else if (circle.x > rect.right)
                {
                    overlap = Phaser.Math.distance(circle.x, circle.y, rect.right, rect.bottom) - circle.radius;
                }
            }

            overlap *= -1;
        }
        else
        {
            overlap = (body1.radius + body2.radius) - Phaser.Math.distance(body1.center.x, body1.center.y, body2.center.x, body2.center.y);
        }

        //  Can't separate two immovable bodies, or a body with its own custom separation logic
        if (overlapOnly || overlap === 0 || (body1.immovable && body2.immovable) || body1.customSeparateX || body2.customSeparateX)
        {
            if (overlap !== 0)
            {
                if (body1.onOverlap)
                {
                    body1.onOverlap.dispatch(body1.sprite, body2.sprite);
                }

                if (body2.onOverlap)
                {
                    body2.onOverlap.dispatch(body2.sprite, body1.sprite);
                }
            }

            //  return true if there was some overlap, otherwise false
            return (overlap !== 0);
        }

        // Transform the velocity vector to the coordinate system oriented along the direction of impact.
        // This is done to eliminate the vertical component of the velocity
        var v1 = {
            x: body1.velocity.x * Math.cos(angleCollision) + body1.velocity.y * Math.sin(angleCollision),
            y: body1.velocity.x * Math.sin(angleCollision) - body1.velocity.y * Math.cos(angleCollision)
        };

        var v2 = {
            x: body2.velocity.x * Math.cos(angleCollision) + body2.velocity.y * Math.sin(angleCollision),
            y: body2.velocity.x * Math.sin(angleCollision) - body2.velocity.y * Math.cos(angleCollision)
        };

        // We expect the new velocity after impact
        var tempVel1 = ((body1.mass - body2.mass) * v1.x + 2 * body2.mass * v2.x) / (body1.mass + body2.mass);
        var tempVel2 = (2 * body1.mass * v1.x + (body2.mass - body1.mass) * v2.x) / (body1.mass + body2.mass);

        // We convert the vector to the original coordinate system and multiplied by factor of rebound
        if (!body1.immovable)
        {
            body1.velocity.x = (tempVel1 * Math.cos(angleCollision) - v1.y * Math.sin(angleCollision)) * body1.bounce.x;
            body1.velocity.y = (v1.y * Math.cos(angleCollision) + tempVel1 * Math.sin(angleCollision)) * body1.bounce.y;
        }

        if (!body2.immovable)
        {
            body2.velocity.x = (tempVel2 * Math.cos(angleCollision) - v2.y * Math.sin(angleCollision)) * body2.bounce.x;
            body2.velocity.y = (v2.y * Math.cos(angleCollision) + tempVel2 * Math.sin(angleCollision)) * body2.bounce.y;
        }

        // When the collision angle is almost perpendicular to the total initial velocity vector
        // (collision on a tangent) vector direction can be determined incorrectly.
        // This code fixes the problem

        if (Math.abs(angleCollision) < Math.PI / 2)
        {
            if ((body1.velocity.x > 0) && !body1.immovable && (body2.velocity.x > body1.velocity.x))
            {
                body1.velocity.x *= -1;
            }
            else if ((body2.velocity.x < 0) && !body2.immovable && (body1.velocity.x < body2.velocity.x))
            {
                body2.velocity.x *= -1;
            }
            else if ((body1.velocity.y > 0) && !body1.immovable && (body2.velocity.y > body1.velocity.y))
            {
                body1.velocity.y *= -1;
            }
            else if ((body2.velocity.y < 0) && !body2.immovable && (body1.velocity.y < body2.velocity.y))
            {
                body2.velocity.y *= -1;
            }
        }
        else if (Math.abs(angleCollision) > Math.PI / 2)
        {
            if ((body1.velocity.x < 0) && !body1.immovable && (body2.velocity.x < body1.velocity.x))
            {
                body1.velocity.x *= -1;
            }
            else if ((body2.velocity.x > 0) && !body2.immovable && (body1.velocity.x > body2.velocity.x))
            {
                body2.velocity.x *= -1;
            }
            else if ((body1.velocity.y < 0) && !body1.immovable && (body2.velocity.y < body1.velocity.y))
            {
                body1.velocity.y *= -1;
            }
            else if ((body2.velocity.y > 0) && !body2.immovable && (body1.velocity.x > body2.velocity.y))
            {
                body2.velocity.y *= -1;
            }
        }

        if (!body1.immovable)
        {
            body1.x += (body1.velocity.x * this.game.time.physicsElapsed) - overlap * Math.cos(angleCollision);
            body1.y += (body1.velocity.y * this.game.time.physicsElapsed) - overlap * Math.sin(angleCollision);
        }

        if (!body2.immovable)
        {
            body2.x += (body2.velocity.x * this.game.time.physicsElapsed) + overlap * Math.cos(angleCollision);
            body2.y += (body2.velocity.y * this.game.time.physicsElapsed) + overlap * Math.sin(angleCollision);
        }

        if (body1.onCollide)
        {
            body1.onCollide.dispatch(body1.sprite, body2.sprite);
        }

        if (body2.onCollide)
        {
            body2.onCollide.dispatch(body2.sprite, body1.sprite);
        }

        return true;

    },

    /**
    * Calculates the horizontal overlap between two Bodies and sets their properties accordingly, including:
    * `touching.left`, `touching.right` and `overlapX`.
    *
    * @method Phaser.Physics.Arcade#getOverlapX
    * @param {Phaser.Physics.Arcade.Body} body1 - The first Body to separate.
    * @param {Phaser.Physics.Arcade.Body} body2 - The second Body to separate.
    * @param {boolean} overlapOnly - Is this an overlap only check, or part of separation?
    * @return {float} Returns the amount of horizontal overlap between the two bodies.
    */
    getOverlapX: function (body1, body2, overlapOnly) {

        var overlap = 0;
        var maxOverlap = body1.deltaAbsX() + body2.deltaAbsX() + this.OVERLAP_BIAS;

        if (body1.deltaX() === 0 && body2.deltaX() === 0)
        {
            //  They overlap but neither of them are moving
            body1.embedded = true;
            body2.embedded = true;
        }
        else if (body1.deltaX() > body2.deltaX())
        {
            //  Body1 is moving right and / or Body2 is moving left
            overlap = body1.right - body2.x;

            if ((overlap > maxOverlap && !overlapOnly) || body1.checkCollision.right === false || body2.checkCollision.left === false)
            {
                overlap = 0;
            }
            else
            {
                body1.touching.none = false;
                body1.touching.right = true;
                body2.touching.none = false;
                body2.touching.left = true;
            }
        }
        else if (body1.deltaX() < body2.deltaX())
        {
            //  Body1 is moving left and/or Body2 is moving right
            overlap = body1.x - body2.width - body2.x;

            if ((-overlap > maxOverlap && !overlapOnly) || body1.checkCollision.left === false || body2.checkCollision.right === false)
            {
                overlap = 0;
            }
            else
            {
                body1.touching.none = false;
                body1.touching.left = true;
                body2.touching.none = false;
                body2.touching.right = true;
            }
        }

        //  Resets the overlapX to zero if there is no overlap, or to the actual pixel value if there is
        body1.overlapX = overlap;
        body2.overlapX = overlap;

        return overlap;

    },

    /**
    * Calculates the vertical overlap between two Bodies and sets their properties accordingly, including:
    * `touching.up`, `touching.down` and `overlapY`.
    *
    * @method Phaser.Physics.Arcade#getOverlapY
    * @param {Phaser.Physics.Arcade.Body} body1 - The first Body to separate.
    * @param {Phaser.Physics.Arcade.Body} body2 - The second Body to separate.
    * @param {boolean} overlapOnly - Is this an overlap only check, or part of separation?
    * @return {float} Returns the amount of vertical overlap between the two bodies.
    */
    getOverlapY: function (body1, body2, overlapOnly) {

        var overlap = 0;
        var maxOverlap = body1.deltaAbsY() + body2.deltaAbsY() + this.OVERLAP_BIAS;

        if (body1.deltaY() === 0 && body2.deltaY() === 0)
        {
            //  They overlap but neither of them are moving
            body1.embedded = true;
            body2.embedded = true;
        }
        else if (body1.deltaY() > body2.deltaY())
        {
            //  Body1 is moving down and/or Body2 is moving up
            overlap = body1.bottom - body2.y;

            if ((overlap > maxOverlap && !overlapOnly) || body1.checkCollision.down === false || body2.checkCollision.up === false)
            {
                overlap = 0;
            }
            else
            {
                body1.touching.none = false;
                body1.touching.down = true;
                body2.touching.none = false;
                body2.touching.up = true;
            }
        }
        else if (body1.deltaY() < body2.deltaY())
        {
            //  Body1 is moving up and/or Body2 is moving down
            overlap = body1.y - body2.bottom;

            if ((-overlap > maxOverlap && !overlapOnly) || body1.checkCollision.up === false || body2.checkCollision.down === false)
            {
                overlap = 0;
            }
            else
            {
                body1.touching.none = false;
                body1.touching.up = true;
                body2.touching.none = false;
                body2.touching.down = true;
            }
        }

        //  Resets the overlapY to zero if there is no overlap, or to the actual pixel value if there is
        body1.overlapY = overlap;
        body2.overlapY = overlap;

        return overlap;

    },

    /**
    * The core separation function to separate two physics bodies on the x axis.
    *
    * @method Phaser.Physics.Arcade#separateX
    * @private
    * @param {Phaser.Physics.Arcade.Body} body1 - The first Body to separate.
    * @param {Phaser.Physics.Arcade.Body} body2 - The second Body to separate.
    * @param {boolean} overlapOnly - If true the bodies will only have their overlap data set, no separation or exchange of velocity will take place.
    * @return {boolean} Returns true if the bodies were separated or overlap, otherwise false.
    */
    separateX: function (body1, body2, overlapOnly) {

        var overlap = this.getOverlapX(body1, body2, overlapOnly);

        //  Can't separate two immovable bodies, or a body with its own custom separation logic
        if (overlapOnly || overlap === 0 || (body1.immovable && body2.immovable) || body1.customSeparateX || body2.customSeparateX)
        {
            //  return true if there was some overlap, otherwise false
            return (overlap !== 0) || (body1.embedded && body2.embedded);
        }

        //  Adjust their positions and velocities accordingly (if there was any overlap)
        var v1 = body1.velocity.x;
        var v2 = body2.velocity.x;

        if (!body1.immovable && !body2.immovable)
        {
            overlap *= 0.5;

            body1.x -= overlap;
            body2.x += overlap;

            var nv1 = Math.sqrt((v2 * v2 * body2.mass) / body1.mass) * ((v2 > 0) ? 1 : -1);
            var nv2 = Math.sqrt((v1 * v1 * body1.mass) / body2.mass) * ((v1 > 0) ? 1 : -1);
            var avg = (nv1 + nv2) * 0.5;

            nv1 -= avg;
            nv2 -= avg;

            body1.velocity.x = avg + nv1 * body1.bounce.x;
            body2.velocity.x = avg + nv2 * body2.bounce.x;
        }
        else if (!body1.immovable)
        {
            body1.x -= overlap;
            body1.velocity.x = v2 - v1 * body1.bounce.x;

            //  This is special case code that handles things like vertically moving platforms you can ride
            if (body2.moves)
            {
                body1.y += (body2.y - body2.prev.y) * body2.friction.y;
            }
        }
        else
        {
            body2.x += overlap;
            body2.velocity.x = v1 - v2 * body2.bounce.x;

            //  This is special case code that handles things like vertically moving platforms you can ride
            if (body1.moves)
            {
                body2.y += (body1.y - body1.prev.y) * body1.friction.y;
            }
        }

        //  If we got this far then there WAS overlap, and separation is complete, so return true
        return true;

    },

    /**
    * The core separation function to separate two physics bodies on the y axis.
    *
    * @private
    * @method Phaser.Physics.Arcade#separateY
    * @param {Phaser.Physics.Arcade.Body} body1 - The first Body to separate.
    * @param {Phaser.Physics.Arcade.Body} body2 - The second Body to separate.
    * @param {boolean} overlapOnly - If true the bodies will only have their overlap data set, no separation or exchange of velocity will take place.
    * @return {boolean} Returns true if the bodies were separated or overlap, otherwise false.
    */
    separateY: function (body1, body2, overlapOnly) {

        var overlap = this.getOverlapY(body1, body2, overlapOnly);

        //  Can't separate two immovable bodies, or a body with its own custom separation logic
        if (overlapOnly || overlap === 0 || (body1.immovable && body2.immovable) || body1.customSeparateY || body2.customSeparateY)
        {
            //  return true if there was some overlap, otherwise false
            return (overlap !== 0) || (body1.embedded && body2.embedded);
        }

        //  Adjust their positions and velocities accordingly (if there was any overlap)
        var v1 = body1.velocity.y;
        var v2 = body2.velocity.y;

        if (!body1.immovable && !body2.immovable)
        {
            overlap *= 0.5;

            body1.y -= overlap;
            body2.y += overlap;

            var nv1 = Math.sqrt((v2 * v2 * body2.mass) / body1.mass) * ((v2 > 0) ? 1 : -1);
            var nv2 = Math.sqrt((v1 * v1 * body1.mass) / body2.mass) * ((v1 > 0) ? 1 : -1);
            var avg = (nv1 + nv2) * 0.5;

            nv1 -= avg;
            nv2 -= avg;

            body1.velocity.y = avg + nv1 * body1.bounce.y;
            body2.velocity.y = avg + nv2 * body2.bounce.y;
        }
        else if (!body1.immovable)
        {
            body1.y -= overlap;
            body1.velocity.y = v2 - v1 * body1.bounce.y;

            //  This is special case code that handles things like horizontal moving platforms you can ride
            if (body2.moves)
            {
                body1.x += (body2.x - body2.prev.x) * body2.friction.x;
            }
        }
        else
        {
            body2.y += overlap;
            body2.velocity.y = v1 - v2 * body2.bounce.y;

            //  This is special case code that handles things like horizontal moving platforms you can ride
            if (body1.moves)
            {
                body2.x += (body1.x - body1.prev.x) * body1.friction.x;
            }
        }

        //  If we got this far then there WAS overlap, and separation is complete, so return true
        return true;

    },

    /**
    * Given a Group and a Pointer this will check to see which Group children overlap with the Pointer coordinates.
    * Each child will be sent to the given callback for further processing.
    * Note that the children are not checked for depth order, but simply if they overlap the Pointer or not.
    *
    * @method Phaser.Physics.Arcade#getObjectsUnderPointer
    * @param {Phaser.Pointer} pointer - The Pointer to check.
    * @param {Phaser.Group} group - The Group to check.
    * @param {function} [callback] - A callback function that is called if the object overlaps with the Pointer. The callback will be sent two parameters: the Pointer and the Object that overlapped with it.
    * @param {object} [callbackContext] - The context in which to run the callback.
    * @return {PIXI.DisplayObject[]} An array of the Sprites from the Group that overlapped the Pointer coordinates.
    */
    getObjectsUnderPointer: function (pointer, group, callback, callbackContext) {

        if (group.length === 0 || !pointer.exists)
        {
            return;
        }

        return this.getObjectsAtLocation(pointer.x, pointer.y, group, callback, callbackContext, pointer);

    },

    /**
    * Given a Group and a location this will check to see which Group children overlap with the coordinates.
    * Each child will be sent to the given callback for further processing.
    * Note that the children are not checked for depth order, but simply if they overlap the coordinate or not.
    *
    * @method Phaser.Physics.Arcade#getObjectsAtLocation
    * @param {number} x - The x coordinate to check.
    * @param {number} y - The y coordinate to check.
    * @param {Phaser.Group} group - The Group to check.
    * @param {function} [callback] - A callback function that is called if the object overlaps the coordinates. The callback will be sent two parameters: the callbackArg and the Object that overlapped the location.
    * @param {object} [callbackContext] - The context in which to run the callback.
    * @param {object} [callbackArg] - An argument to pass to the callback.
    * @return {PIXI.DisplayObject[]} An array of the Sprites from the Group that overlapped the coordinates.
    */
    getObjectsAtLocation: function (x, y, group, callback, callbackContext, callbackArg) {

        this.quadTree.clear();

        this.quadTree.reset(this.game.world.bounds.x, this.game.world.bounds.y, this.game.world.bounds.width, this.game.world.bounds.height, this.maxObjects, this.maxLevels);

        this.quadTree.populate(group);

        var rect = new Phaser.Rectangle(x, y, 1, 1);
        var output = [];

        var items = this.quadTree.retrieve(rect);

        for (var i = 0; i < items.length; i++)
        {
            if (items[i].hitTest(x, y))
            {
                if (callback)
                {
                    callback.call(callbackContext, callbackArg, items[i].sprite);
                }

                output.push(items[i].sprite);
            }
        }

        return output;
        
    },

    /**
    * Move the given display object towards the destination object at a steady velocity.
    * If you specify a maxTime then it will adjust the speed (overwriting what you set) so it arrives at the destination in that number of seconds.
    * Timings are approximate due to the way browser timers work. Allow for a variance of +- 50ms.
    * Note: The display object does not continuously track the target. If the target changes location during transit the display object will not modify its course.
    * Note: The display object doesn't stop moving once it reaches the destination coordinates.
    * Note: Doesn't take into account acceleration, maxVelocity or drag (if you've set drag or acceleration too high this object may not move at all)
    *
    * @method Phaser.Physics.Arcade#moveToObject
    * @param {any} displayObject - The display object to move.
    * @param {any} destination - The display object to move towards. Can be any object but must have visible x/y properties.
    * @param {number} [speed=60] - The speed it will move, in pixels per second (default is 60 pixels/sec)
    * @param {number} [maxTime=0] - Time given in milliseconds (1000 = 1 sec). If set the speed is adjusted so the object will arrive at destination in the given number of ms.
    * @return {number} The angle (in radians) that the object should be visually set to in order to match its new velocity.
    */
    moveToObject: function (displayObject, destination, speed, maxTime) {

        if (speed === undefined) { speed = 60; }
        if (maxTime === undefined) { maxTime = 0; }

        var angle = Math.atan2(destination.y - displayObject.y, destination.x - displayObject.x);

        if (maxTime > 0)
        {
            //  We know how many pixels we need to move, but how fast?
            speed = this.distanceBetween(displayObject, destination) / (maxTime / 1000);
        }

        displayObject.body.velocity.x = Math.cos(angle) * speed;
        displayObject.body.velocity.y = Math.sin(angle) * speed;

        return angle;

    },

    /**
    * Move the given display object towards the pointer at a steady velocity. If no pointer is given it will use Phaser.Input.activePointer.
    * If you specify a maxTime then it will adjust the speed (over-writing what you set) so it arrives at the destination in that number of seconds.
    * Timings are approximate due to the way browser timers work. Allow for a variance of +- 50ms.
    * Note: The display object does not continuously track the target. If the target changes location during transit the display object will not modify its course.
    * Note: The display object doesn't stop moving once it reaches the destination coordinates.
    *
    * @method Phaser.Physics.Arcade#moveToPointer
    * @param {any} displayObject - The display object to move.
    * @param {number} [speed=60] - The speed it will move, in pixels per second (default is 60 pixels/sec)
    * @param {Phaser.Pointer} [pointer] - The pointer to move towards. Defaults to Phaser.Input.activePointer.
    * @param {number} [maxTime=0] - Time given in milliseconds (1000 = 1 sec). If set the speed is adjusted so the object will arrive at destination in the given number of ms.
    * @return {number} The angle (in radians) that the object should be visually set to in order to match its new velocity.
    */
    moveToPointer: function (displayObject, speed, pointer, maxTime) {

        if (speed === undefined) { speed = 60; }
        pointer = pointer || this.game.input.activePointer;
        if (maxTime === undefined) { maxTime = 0; }

        var angle = this.angleToPointer(displayObject, pointer);

        if (maxTime > 0)
        {
            //  We know how many pixels we need to move, but how fast?
            speed = this.distanceToPointer(displayObject, pointer) / (maxTime / 1000);
        }

        displayObject.body.velocity.x = Math.cos(angle) * speed;
        displayObject.body.velocity.y = Math.sin(angle) * speed;

        return angle;

    },

    /**
    * Move the given display object towards the x/y coordinates at a steady velocity.
    * If you specify a maxTime then it will adjust the speed (over-writing what you set) so it arrives at the destination in that number of seconds.
    * Timings are approximate due to the way browser timers work. Allow for a variance of +- 50ms.
    * Note: The display object does not continuously track the target. If the target changes location during transit the display object will not modify its course.
    * Note: The display object doesn't stop moving once it reaches the destination coordinates.
    * Note: Doesn't take into account acceleration, maxVelocity or drag (if you've set drag or acceleration too high this object may not move at all)
    *
    * @method Phaser.Physics.Arcade#moveToXY
    * @param {any} displayObject - The display object to move.
    * @param {number} x - The x coordinate to move towards.
    * @param {number} y - The y coordinate to move towards.
    * @param {number} [speed=60] - The speed it will move, in pixels per second (default is 60 pixels/sec)
    * @param {number} [maxTime=0] - Time given in milliseconds (1000 = 1 sec). If set the speed is adjusted so the object will arrive at destination in the given number of ms.
    * @return {number} The angle (in radians) that the object should be visually set to in order to match its new velocity.
    */
    moveToXY: function (displayObject, x, y, speed, maxTime) {

        if (speed === undefined) { speed = 60; }
        if (maxTime === undefined) { maxTime = 0; }

        var angle = Math.atan2(y - displayObject.y, x - displayObject.x);

        if (maxTime > 0)
        {
            //  We know how many pixels we need to move, but how fast?
            speed = this.distanceToXY(displayObject, x, y) / (maxTime / 1000);
        }

        displayObject.body.velocity.x = Math.cos(angle) * speed;
        displayObject.body.velocity.y = Math.sin(angle) * speed;

        return angle;

    },

    /**
    * Given the angle (in degrees) and speed calculate the velocity and return it as a Point object, or set it to the given point object.
    * One way to use this is: velocityFromAngle(angle, 200, sprite.velocity) which will set the values directly to the sprites velocity and not create a new Point object.
    *
    * @method Phaser.Physics.Arcade#velocityFromAngle
    * @param {number} angle - The angle in degrees calculated in clockwise positive direction (down = 90 degrees positive, right = 0 degrees positive, up = 90 degrees negative)
    * @param {number} [speed=60] - The speed it will move, in pixels per second sq.
    * @param {Phaser.Point|object} [point] - The Point object in which the x and y properties will be set to the calculated velocity.
    * @return {Phaser.Point} - A Point where point.x contains the velocity x value and point.y contains the velocity y value.
    */
    velocityFromAngle: function (angle, speed, point) {

        if (speed === undefined) { speed = 60; }
        point = point || new Phaser.Point();

        return point.setTo((Math.cos(this.game.math.degToRad(angle)) * speed), (Math.sin(this.game.math.degToRad(angle)) * speed));

    },

    /**
    * Given the rotation (in radians) and speed calculate the velocity and return it as a Point object, or set it to the given point object.
    * One way to use this is: velocityFromRotation(rotation, 200, sprite.velocity) which will set the values directly to the sprites velocity and not create a new Point object.
    *
    * @method Phaser.Physics.Arcade#velocityFromRotation
    * @param {number} rotation - The angle in radians.
    * @param {number} [speed=60] - The speed it will move, in pixels per second sq.
    * @param {Phaser.Point|object} [point] - The Point object in which the x and y properties will be set to the calculated velocity.
    * @return {Phaser.Point} - A Point where point.x contains the velocity x value and point.y contains the velocity y value.
    */
    velocityFromRotation: function (rotation, speed, point) {

        if (speed === undefined) { speed = 60; }
        point = point || new Phaser.Point();

        return point.setTo((Math.cos(rotation) * speed), (Math.sin(rotation) * speed));

    },

    /**
    * Given the rotation (in radians) and speed calculate the acceleration and return it as a Point object, or set it to the given point object.
    * One way to use this is: accelerationFromRotation(rotation, 200, sprite.acceleration) which will set the values directly to the sprites acceleration and not create a new Point object.
    *
    * @method Phaser.Physics.Arcade#accelerationFromRotation
    * @param {number} rotation - The angle in radians.
    * @param {number} [speed=60] - The speed it will move, in pixels per second sq.
    * @param {Phaser.Point|object} [point] - The Point object in which the x and y properties will be set to the calculated acceleration.
    * @return {Phaser.Point} - A Point where point.x contains the acceleration x value and point.y contains the acceleration y value.
    */
    accelerationFromRotation: function (rotation, speed, point) {

        if (speed === undefined) { speed = 60; }
        point = point || new Phaser.Point();

        return point.setTo((Math.cos(rotation) * speed), (Math.sin(rotation) * speed));

    },

    /**
    * Sets the acceleration.x/y property on the display object so it will move towards the target at the given speed (in pixels per second sq.)
    * You must give a maximum speed value, beyond which the display object won't go any faster.
    * Note: The display object does not continuously track the target. If the target changes location during transit the display object will not modify its course.
    * Note: The display object doesn't stop moving once it reaches the destination coordinates.
    *
    * @method Phaser.Physics.Arcade#accelerateToObject
    * @param {any} displayObject - The display object to move.
    * @param {any} destination - The display object to move towards. Can be any object but must have visible x/y properties.
    * @param {number} [speed=60] - The speed it will accelerate in pixels per second.
    * @param {number} [xSpeedMax=500] - The maximum x velocity the display object can reach.
    * @param {number} [ySpeedMax=500] - The maximum y velocity the display object can reach.
    * @return {number} The angle (in radians) that the object should be visually set to in order to match its new trajectory.
    */
    accelerateToObject: function (displayObject, destination, speed, xSpeedMax, ySpeedMax) {

        if (speed === undefined) { speed = 60; }
        if (xSpeedMax === undefined) { xSpeedMax = 1000; }
        if (ySpeedMax === undefined) { ySpeedMax = 1000; }

        var angle = this.angleBetween(displayObject, destination);

        displayObject.body.acceleration.setTo(Math.cos(angle) * speed, Math.sin(angle) * speed);
        displayObject.body.maxVelocity.setTo(xSpeedMax, ySpeedMax);

        return angle;

    },

    /**
    * Sets the acceleration.x/y property on the display object so it will move towards the target at the given speed (in pixels per second sq.)
    * You must give a maximum speed value, beyond which the display object won't go any faster.
    * Note: The display object does not continuously track the target. If the target changes location during transit the display object will not modify its course.
    * Note: The display object doesn't stop moving once it reaches the destination coordinates.
    *
    * @method Phaser.Physics.Arcade#accelerateToPointer
    * @param {any} displayObject - The display object to move.
    * @param {Phaser.Pointer} [pointer] - The pointer to move towards. Defaults to Phaser.Input.activePointer.
    * @param {number} [speed=60] - The speed it will accelerate in pixels per second.
    * @param {number} [xSpeedMax=500] - The maximum x velocity the display object can reach.
    * @param {number} [ySpeedMax=500] - The maximum y velocity the display object can reach.
    * @return {number} The angle (in radians) that the object should be visually set to in order to match its new trajectory.
    */
    accelerateToPointer: function (displayObject, pointer, speed, xSpeedMax, ySpeedMax) {

        if (speed === undefined) { speed = 60; }
        if (pointer === undefined) { pointer = this.game.input.activePointer; }
        if (xSpeedMax === undefined) { xSpeedMax = 1000; }
        if (ySpeedMax === undefined) { ySpeedMax = 1000; }

        var angle = this.angleToPointer(displayObject, pointer);

        displayObject.body.acceleration.setTo(Math.cos(angle) * speed, Math.sin(angle) * speed);
        displayObject.body.maxVelocity.setTo(xSpeedMax, ySpeedMax);

        return angle;

    },

    /**
    * Sets the acceleration.x/y property on the display object so it will move towards the x/y coordinates at the given speed (in pixels per second sq.)
    * You must give a maximum speed value, beyond which the display object won't go any faster.
    * Note: The display object does not continuously track the target. If the target changes location during transit the display object will not modify its course.
    * Note: The display object doesn't stop moving once it reaches the destination coordinates.
    *
    * @method Phaser.Physics.Arcade#accelerateToXY
    * @param {any} displayObject - The display object to move.
    * @param {number} x - The x coordinate to accelerate towards.
    * @param {number} y - The y coordinate to accelerate towards.
    * @param {number} [speed=60] - The speed it will accelerate in pixels per second.
    * @param {number} [xSpeedMax=500] - The maximum x velocity the display object can reach.
    * @param {number} [ySpeedMax=500] - The maximum y velocity the display object can reach.
    * @return {number} The angle (in radians) that the object should be visually set to in order to match its new trajectory.
    */
    accelerateToXY: function (displayObject, x, y, speed, xSpeedMax, ySpeedMax) {

        if (speed === undefined) { speed = 60; }
        if (xSpeedMax === undefined) { xSpeedMax = 1000; }
        if (ySpeedMax === undefined) { ySpeedMax = 1000; }

        var angle = this.angleToXY(displayObject, x, y);

        displayObject.body.acceleration.setTo(Math.cos(angle) * speed, Math.sin(angle) * speed);
        displayObject.body.maxVelocity.setTo(xSpeedMax, ySpeedMax);

        return angle;

    },

    /**
    * Find the distance between two display objects (like Sprites).
    *
    * The optional `world` argument allows you to return the result based on the Game Objects `world` property,
    * instead of its `x` and `y` values. This is useful of the object has been nested inside an offset Group,
    * or parent Game Object.
    *
    * @method Phaser.Physics.Arcade#distanceBetween
    * @param {any} source - The Display Object to test from.
    * @param {any} target - The Display Object to test to.
    * @param {boolean} [world=false] - Calculate the distance using World coordinates (true), or Object coordinates (false, the default)
    * @return {number} The distance between the source and target objects.
    */
    distanceBetween: function (source, target, world) {

        if (world === undefined) { world = false; }

        var dx = (world) ? source.world.x - target.world.x : source.x - target.x;
        var dy = (world) ? source.world.y - target.world.y : source.y - target.y;

        return Math.sqrt(dx * dx + dy * dy);

    },

    /**
    * Find the distance between a display object (like a Sprite) and the given x/y coordinates.
    * The calculation is made from the display objects x/y coordinate. This may be the top-left if its anchor hasn't been changed.
    * If you need to calculate from the center of a display object instead use the method distanceBetweenCenters()
    *
    * The optional `world` argument allows you to return the result based on the Game Objects `world` property,
    * instead of its `x` and `y` values. This is useful of the object has been nested inside an offset Group,
    * or parent Game Object.
    *
    * @method Phaser.Physics.Arcade#distanceToXY
    * @param {any} displayObject - The Display Object to test from.
    * @param {number} x - The x coordinate to move towards.
    * @param {number} y - The y coordinate to move towards.
    * @param {boolean} [world=false] - Calculate the distance using World coordinates (true), or Object coordinates (false, the default)
    * @return {number} The distance between the object and the x/y coordinates.
    */
    distanceToXY: function (displayObject, x, y, world) {

        if (world === undefined) { world = false; }

        var dx = (world) ? displayObject.world.x - x : displayObject.x - x;
        var dy = (world) ? displayObject.world.y - y : displayObject.y - y;

        return Math.sqrt(dx * dx + dy * dy);

    },

    /**
    * Find the distance between a display object (like a Sprite) and a Pointer. If no Pointer is given the Input.activePointer is used.
    * The calculation is made from the display objects x/y coordinate. This may be the top-left if its anchor hasn't been changed.
    * If you need to calculate from the center of a display object instead use the method distanceBetweenCenters()
    *
    * The optional `world` argument allows you to return the result based on the Game Objects `world` property,
    * instead of its `x` and `y` values. This is useful of the object has been nested inside an offset Group,
    * or parent Game Object.
    *
    * @method Phaser.Physics.Arcade#distanceToPointer
    * @param {any} displayObject - The Display Object to test from.
    * @param {Phaser.Pointer} [pointer] - The Phaser.Pointer to test to. If none is given then Input.activePointer is used.
    * @param {boolean} [world=false] - Calculate the distance using World coordinates (true), or Object coordinates (false, the default)
    * @return {number} The distance between the object and the Pointer.
    */
    distanceToPointer: function (displayObject, pointer, world) {

        if (pointer === undefined) { pointer = this.game.input.activePointer; }
        if (world === undefined) { world = false; }

        var dx = (world) ? displayObject.world.x - pointer.worldX : displayObject.x - pointer.worldX;
        var dy = (world) ? displayObject.world.y - pointer.worldY : displayObject.y - pointer.worldY;

        return Math.sqrt(dx * dx + dy * dy);

    },

    /**
    * Find the angle in radians between two display objects (like Sprites).
    *
    * The optional `world` argument allows you to return the result based on the Game Objects `world` property,
    * instead of its `x` and `y` values. This is useful of the object has been nested inside an offset Group,
    * or parent Game Object.
    *
    * @method Phaser.Physics.Arcade#angleBetween
    * @param {any} source - The Display Object to test from.
    * @param {any} target - The Display Object to test to.
    * @param {boolean} [world=false] - Calculate the angle using World coordinates (true), or Object coordinates (false, the default)
    * @return {number} The angle in radians between the source and target display objects.
    */
    angleBetween: function (source, target, world) {

        if (world === undefined) { world = false; }

        if (world)
        {
            return Math.atan2(target.world.y - source.world.y, target.world.x - source.world.x);
        }
        else
        {
            return Math.atan2(target.y - source.y, target.x - source.x);
        }

    },

    /**
    * Find the angle in radians between centers of two display objects (like Sprites).
    *
    * @method Phaser.Physics.Arcade#angleBetweenCenters
    * @param {any} source - The Display Object to test from.
    * @param {any} target - The Display Object to test to.
    * @return {number} The angle in radians between the source and target display objects.
    */
    angleBetweenCenters: function (source, target) {

        var dx = target.centerX - source.centerX;
        var dy = target.centerY - source.centerY;

        return Math.atan2(dy, dx);

    },

    /**
    * Find the angle in radians between a display object (like a Sprite) and the given x/y coordinate.
    *
    * The optional `world` argument allows you to return the result based on the Game Objects `world` property,
    * instead of its `x` and `y` values. This is useful of the object has been nested inside an offset Group,
    * or parent Game Object.
    *
    * @method Phaser.Physics.Arcade#angleToXY
    * @param {any} displayObject - The Display Object to test from.
    * @param {number} x - The x coordinate to get the angle to.
    * @param {number} y - The y coordinate to get the angle to.
    * @param {boolean} [world=false] - Calculate the angle using World coordinates (true), or Object coordinates (false, the default)
    * @return {number} The angle in radians between displayObject.x/y to Pointer.x/y
    */
    angleToXY: function (displayObject, x, y, world) {

        if (world === undefined) { world = false; }

        if (world)
        {
            return Math.atan2(y - displayObject.world.y, x - displayObject.world.x);
        }
        else
        {
            return Math.atan2(y - displayObject.y, x - displayObject.x);
        }

    },

    /**
    * Find the angle in radians between a display object (like a Sprite) and a Pointer, taking their x/y and center into account.
    *
    * The optional `world` argument allows you to return the result based on the Game Objects `world` property,
    * instead of its `x` and `y` values. This is useful of the object has been nested inside an offset Group,
    * or parent Game Object.
    *
    * @method Phaser.Physics.Arcade#angleToPointer
    * @param {any} displayObject - The Display Object to test from.
    * @param {Phaser.Pointer} [pointer] - The Phaser.Pointer to test to. If none is given then Input.activePointer is used.
    * @param {boolean} [world=false] - Calculate the angle using World coordinates (true), or Object coordinates (false, the default)
    * @return {number} The angle in radians between displayObject.x/y to Pointer.x/y
    */
    angleToPointer: function (displayObject, pointer, world) {

        if (pointer === undefined) { pointer = this.game.input.activePointer; }
        if (world === undefined) { world = false; }

        if (world)
        {
            return Math.atan2(pointer.worldY - displayObject.world.y, pointer.worldX - displayObject.world.x);
        }
        else
        {
            return Math.atan2(pointer.worldY - displayObject.y, pointer.worldX - displayObject.x);
        }

    },

    /**
    * Find the angle in radians between a display object (like a Sprite) and a Pointer, 
    * taking their x/y and center into account relative to the world.
    *
    * @method Phaser.Physics.Arcade#worldAngleToPointer
    * @param {any} displayObject - The DisplayObjerct to test from.
    * @param {Phaser.Pointer} [pointer] - The Phaser.Pointer to test to. If none is given then Input.activePointer is used.
    * @return {number} The angle in radians between displayObject.world.x/y to Pointer.worldX / worldY
    */
    worldAngleToPointer: function (displayObject, pointer) {

        return this.angleToPointer(displayObject, pointer, true);

    }

};

/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2016 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

/**
* The Physics Body is linked to a single Sprite. All physics operations should be performed against the body rather than
* the Sprite itself. For example you can set the velocity, acceleration, bounce values etc all on the Body.
*
* @class Phaser.Physics.Arcade.Body
* @constructor
* @param {Phaser.Sprite} sprite - The Sprite object this physics body belongs to.
*/
Phaser.Physics.Arcade.Body = function (sprite) {

    /**
    * @property {Phaser.Sprite} sprite - Reference to the parent Sprite.
    */
    this.sprite = sprite;

    /**
    * @property {Phaser.Game} game - Local reference to game.
    */
    this.game = sprite.game;

    /**
    * @property {number} type - The type of physics system this body belongs to.
    */
    this.type = Phaser.Physics.ARCADE;

    /**
    * @property {boolean} enable - A disabled body won't be checked for any form of collision or overlap or have its pre/post updates run.
    * @default
    */
    this.enable = true;

    /**
    * If `true` this Body is using circular collision detection. If `false` it is using rectangular.
    * Use `Body.setCircle` to control the collision shape this Body uses.
    * @property {boolean} isCircle
    * @default
    * @readOnly
    */
    this.isCircle = false;

    /**
    * The radius of the circular collision shape this Body is using if Body.setCircle has been enabled.
    * If you wish to change the radius then call `setCircle` again with the new value.
    * If you wish to stop the Body using a circle then call `setCircle` with a radius of zero (or undefined).
    * @property {number} radius
    * @default
    * @readOnly
    */
    this.radius = 0;

    /**
    * @property {Phaser.Point} offset - The offset of the Physics Body from the Sprite x/y position.
    */
    this.offset = new Phaser.Point();

    /**
    * @property {Phaser.Point} position - The position of the physics body.
    * @readonly
    */
    this.position = new Phaser.Point(sprite.x, sprite.y);

    /**
    * @property {Phaser.Point} prev - The previous position of the physics body.
    * @readonly
    */
    this.prev = new Phaser.Point(this.position.x, this.position.y);

    /**
    * @property {boolean} allowRotation - Allow this Body to be rotated? (via angularVelocity, etc)
    * @default
    */
    this.allowRotation = true;

    /**
    * The Body's rotation in degrees, as calculated by its angularVelocity and angularAcceleration. Please understand that the collision Body
    * itself never rotates, it is always axis-aligned. However these values are passed up to the parent Sprite and updates its rotation.
    * @property {number} rotation
    */
    this.rotation = sprite.angle;

    /**
    * @property {number} preRotation - The previous rotation of the physics body.
    * @readonly
    */
    this.preRotation = sprite.angle;

    /**
    * @property {number} width - The calculated width of the physics body.
    * @readonly
    */
    this.width = sprite.width;

    /**
    * @property {number} height - The calculated height of the physics body.
    * @readonly
    */
    this.height = sprite.height;

    /**
    * @property {number} sourceWidth - The un-scaled original size.
    * @readonly
    */
    this.sourceWidth = sprite.width;

    /**
    * @property {number} sourceHeight - The un-scaled original size.
    * @readonly
    */
    this.sourceHeight = sprite.height;

    if (sprite.texture)
    {
        this.sourceWidth = sprite.texture.frame.width;
        this.sourceHeight = sprite.texture.frame.height;
    }

    /**
    * @property {number} halfWidth - The calculated width / 2 of the physics body.
    * @readonly
    */
    this.halfWidth = Math.abs(sprite.width / 2);

    /**
    * @property {number} halfHeight - The calculated height / 2 of the physics body.
    * @readonly
    */
    this.halfHeight = Math.abs(sprite.height / 2);

    /**
    * @property {Phaser.Point} center - The center coordinate of the Physics Body.
    * @readonly
    */
    this.center = new Phaser.Point(sprite.x + this.halfWidth, sprite.y + this.halfHeight);

    /**
    * @property {Phaser.Point} velocity - The velocity, or rate of change in speed of the Body. Measured in pixels per second.
    */
    this.velocity = new Phaser.Point();

    /**
    * @property {Phaser.Point} newVelocity - The new velocity. Calculated during the Body.preUpdate and applied to its position.
    * @readonly
    */
    this.newVelocity = new Phaser.Point();

    /**
    * @property {Phaser.Point} deltaMax - The Sprite position is updated based on the delta x/y values. You can set a cap on those (both +-) using deltaMax.
    */
    this.deltaMax = new Phaser.Point();

    /**
    * @property {Phaser.Point} acceleration - The acceleration is the rate of change of the velocity. Measured in pixels per second squared.
    */
    this.acceleration = new Phaser.Point();

    /**
    * @property {Phaser.Point} drag - The drag applied to the motion of the Body.
    */
    this.drag = new Phaser.Point();

    /**
    * @property {boolean} allowGravity - Allow this Body to be influenced by gravity? Either world or local.
    * @default
    */
    this.allowGravity = true;

    /**
    * @property {Phaser.Point} gravity - A local gravity applied to this Body. If non-zero this over rides any world gravity, unless Body.allowGravity is set to false.
    */
    this.gravity = new Phaser.Point();

    /**
    * @property {Phaser.Point} bounce - The elasticity of the Body when colliding. bounce.x/y = 1 means full rebound, bounce.x/y = 0.5 means 50% rebound velocity.
    */
    this.bounce = new Phaser.Point();

    /**
    * The elasticity of the Body when colliding with the World bounds.
    * By default this property is `null`, in which case `Body.bounce` is used instead. Set this property
    * to a Phaser.Point object in order to enable a World bounds specific bounce value.
    * @property {Phaser.Point} worldBounce
    */
    this.worldBounce = null;

    /**
    * A Signal that is dispatched when this Body collides with the world bounds.
    * Due to the potentially high volume of signals this could create it is disabled by default.
    * To use this feature set this property to a Phaser.Signal: `sprite.body.onWorldBounds = new Phaser.Signal()`
    * and it will be called when a collision happens, passing five arguments:
    * `onWorldBounds(sprite, up, down, left, right)`
    * where the Sprite is a reference to the Sprite that owns this Body, and the other arguments are booleans
    * indicating on which side of the world the Body collided.
    * @property {Phaser.Signal} onWorldBounds
    */
    this.onWorldBounds = null;

    /**
    * A Signal that is dispatched when this Body collides with another Body.
    * 
    * You still need to call `game.physics.arcade.collide` in your `update` method in order
    * for this signal to be dispatched.
    *
    * Usually you'd pass a callback to the `collide` method, but this signal provides for
    * a different level of notification.
    * 
    * Due to the potentially high volume of signals this could create it is disabled by default.
    * 
    * To use this feature set this property to a Phaser.Signal: `sprite.body.onCollide = new Phaser.Signal()`
    * and it will be called when a collision happens, passing two arguments: the sprites which collided.
    * The first sprite in the argument is always the owner of this Body.
    * 
    * If two Bodies with this Signal set collide, both will dispatch the Signal.
    * @property {Phaser.Signal} onCollide
    */
    this.onCollide = null;

    /**
    * A Signal that is dispatched when this Body overlaps with another Body.
    * 
    * You still need to call `game.physics.arcade.overlap` in your `update` method in order
    * for this signal to be dispatched.
    *
    * Usually you'd pass a callback to the `overlap` method, but this signal provides for
    * a different level of notification.
    * 
    * Due to the potentially high volume of signals this could create it is disabled by default.
    * 
    * To use this feature set this property to a Phaser.Signal: `sprite.body.onOverlap = new Phaser.Signal()`
    * and it will be called when a collision happens, passing two arguments: the sprites which collided.
    * The first sprite in the argument is always the owner of this Body.
    * 
    * If two Bodies with this Signal set collide, both will dispatch the Signal.
    * @property {Phaser.Signal} onOverlap
    */
    this.onOverlap = null;

    /**
    * @property {Phaser.Point} maxVelocity - The maximum velocity in pixels per second sq. that the Body can reach.
    * @default
    */
    this.maxVelocity = new Phaser.Point(10000, 10000);

    /**
    * @property {Phaser.Point} friction - The amount of movement that will occur if another object 'rides' this one.
    */
    this.friction = new Phaser.Point(1, 0);

    /**
    * @property {number} angularVelocity - The angular velocity controls the rotation speed of the Body. It is measured in degrees per second.
    * @default
    */
    this.angularVelocity = 0;

    /**
    * @property {number} angularAcceleration - The angular acceleration is the rate of change of the angular velocity. Measured in degrees per second squared.
    * @default
    */
    this.angularAcceleration = 0;

    /**
    * @property {number} angularDrag - The drag applied during the rotation of the Body. Measured in degrees per second squared.
    * @default
    */
    this.angularDrag = 0;

    /**
    * @property {number} maxAngular - The maximum angular velocity in degrees per second that the Body can reach.
    * @default
    */
    this.maxAngular = 1000;

    /**
    * @property {number} mass - The mass of the Body. When two bodies collide their mass is used in the calculation to determine the exchange of velocity.
    * @default
    */
    this.mass = 1;

    /**
    * @property {number} angle - The angle of the Body's velocity in radians.
    * @readonly
    */
    this.angle = 0;

    /**
    * @property {number} speed - The speed of the Body as calculated by its velocity.
    * @readonly
    */
    this.speed = 0;

    /**
    * @property {number} facing - A const reference to the direction the Body is traveling or facing.
    * @default
    */
    this.facing = Phaser.NONE;

    /**
    * @property {boolean} immovable - An immovable Body will not receive any impacts from other bodies.
    * @default
    */
    this.immovable = false;

    /**
    * If you have a Body that is being moved around the world via a tween or a Group motion, but its local x/y position never
    * actually changes, then you should set Body.moves = false. Otherwise it will most likely fly off the screen.
    * If you want the physics system to move the body around, then set moves to true.
    * @property {boolean} moves - Set to true to allow the Physics system to move this Body, otherwise false to move it manually.
    * @default
    */
    this.moves = true;

    /**
    * This flag allows you to disable the custom x separation that takes place by Physics.Arcade.separate.
    * Used in combination with your own collision processHandler you can create whatever type of collision response you need.
    * @property {boolean} customSeparateX - Use a custom separation system or the built-in one?
    * @default
    */
    this.customSeparateX = false;

    /**
    * This flag allows you to disable the custom y separation that takes place by Physics.Arcade.separate.
    * Used in combination with your own collision processHandler you can create whatever type of collision response you need.
    * @property {boolean} customSeparateY - Use a custom separation system or the built-in one?
    * @default
    */
    this.customSeparateY = false;

    /**
    * When this body collides with another, the amount of overlap is stored here.
    * @property {number} overlapX - The amount of horizontal overlap during the collision.
    */
    this.overlapX = 0;

    /**
    * When this body collides with another, the amount of overlap is stored here.
    * @property {number} overlapY - The amount of vertical overlap during the collision.
    */
    this.overlapY = 0;

    /**
    * If `Body.isCircle` is true, and this body collides with another circular body, the amount of overlap is stored here.
    * @property {number} overlapR - The amount of overlap during the collision.
    */
    this.overlapR = 0;

    /**
    * If a body is overlapping with another body, but neither of them are moving (maybe they spawned on-top of each other?) this is set to true.
    * @property {boolean} embedded - Body embed value.
    */
    this.embedded = false;

    /**
    * A Body can be set to collide against the World bounds automatically and rebound back into the World if this is set to true. Otherwise it will leave the World.
    * @property {boolean} collideWorldBounds - Should the Body collide with the World bounds?
    */
    this.collideWorldBounds = false;

    /**
    * Set the checkCollision properties to control which directions collision is processed for this Body.
    * For example checkCollision.up = false means it won't collide when the collision happened while moving up.
    * If you need to disable a Body entirely, use `body.enable = false`, this will also disable motion.
    * If you need to disable just collision and/or overlap checks, but retain motion, set `checkCollision.none = true`.
    * @property {object} checkCollision - An object containing allowed collision.
    */
    this.checkCollision = { none: false, any: true, up: true, down: true, left: true, right: true };

    /**
    * This object is populated with boolean values when the Body collides with another.
    * touching.up = true means the collision happened to the top of this Body for example.
    * @property {object} touching - An object containing touching results.
    */
    this.touching = { none: true, up: false, down: false, left: false, right: false };

    /**
    * This object is populated with previous touching values from the bodies previous collision.
    * @property {object} wasTouching - An object containing previous touching results.
    */
    this.wasTouching = { none: true, up: false, down: false, left: false, right: false };

    /**
    * This object is populated with boolean values when the Body collides with the World bounds or a Tile.
    * For example if blocked.up is true then the Body cannot move up.
    * @property {object} blocked - An object containing on which faces this Body is blocked from moving, if any.
    */
    this.blocked = { up: false, down: false, left: false, right: false };

    /**
    * If this is an especially small or fast moving object then it can sometimes skip over tilemap collisions if it moves through a tile in a step.
    * Set this padding value to add extra padding to its bounds. tilePadding.x applied to its width, y to its height.
    * @property {Phaser.Point} tilePadding - Extra padding to be added to this sprite's dimensions when checking for tile collision.
    */
    this.tilePadding = new Phaser.Point();

    /**
    * @property {boolean} dirty - If this Body in a preUpdate (true) or postUpdate (false) state?
    */
    this.dirty = false;

    /**
    * @property {boolean} skipQuadTree - If true and you collide this Sprite against a Group, it will disable the collision check from using a QuadTree.
    */
    this.skipQuadTree = false;

    /**
    * If true the Body will check itself against the Sprite.getBounds() dimensions and adjust its width and height accordingly.
    * If false it will compare its dimensions against the Sprite scale instead, and adjust its width height if the scale has changed.
    * Typically you would need to enable syncBounds if your sprite is the child of a responsive display object such as a FlexLayer, 
    * or in any situation where the Sprite scale doesn't change, but its parents scale is effecting the dimensions regardless.
    * @property {boolean} syncBounds
    * @default
    */
    this.syncBounds = false;

    /**
    * @property {boolean} isMoving - Set by the `moveTo` and `moveFrom` methods.
    */
    this.isMoving = false;

    /**
    * @property {boolean} stopVelocityOnCollide - Set by the `moveTo` and `moveFrom` methods.
    */
    this.stopVelocityOnCollide = true;

    /**
    * @property {integer} moveTimer - Internal time used by the `moveTo` and `moveFrom` methods.
    * @private
    */
    this.moveTimer = 0;

    /**
    * @property {integer} moveDistance - Internal distance value, used by the `moveTo` and `moveFrom` methods.
    * @private
    */
    this.moveDistance = 0;

    /**
    * @property {integer} moveDuration - Internal duration value, used by the `moveTo` and `moveFrom` methods.
    * @private
    */
    this.moveDuration = 0;

    /**
    * @property {Phaser.Line} moveTarget - Set by the `moveTo` method, and updated each frame.
    * @private
    */
    this.moveTarget = null;

    /**
    * @property {Phaser.Point} moveEnd - Set by the `moveTo` method, and updated each frame.
    * @private
    */
    this.moveEnd = null;

    /**
    * @property {Phaser.Signal} onMoveComplete - Listen for the completion of `moveTo` or `moveFrom` events.
    */
    this.onMoveComplete = new Phaser.Signal();

    /**
    * @property {function} movementCallback - Optional callback. If set, invoked during the running of `moveTo` or `moveFrom` events.
    */
    this.movementCallback = null;

    /**
    * @property {object} movementCallbackContext - Context in which to call the movementCallback.
    */
    this.movementCallbackContext = null;

    /**
    * @property {boolean} _reset - Internal cache var.
    * @private
    */
    this._reset = true;

    /**
    * @property {number} _sx - Internal cache var.
    * @private
    */
    this._sx = sprite.scale.x;

    /**
    * @property {number} _sy - Internal cache var.
    * @private
    */
    this._sy = sprite.scale.y;

    /**
    * @property {number} _dx - Internal cache var.
    * @private
    */
    this._dx = 0;

    /**
    * @property {number} _dy - Internal cache var.
    * @private
    */
    this._dy = 0;

};

Phaser.Physics.Arcade.Body.prototype = {

    /**
    * Internal method.
    *
    * @method Phaser.Physics.Arcade.Body#updateBounds
    * @protected
    */
    updateBounds: function () {

        if (this.syncBounds)
        {
            var b = this.sprite.getBounds();
            b.ceilAll();

            if (b.width !== this.width || b.height !== this.height)
            {
                this.width = b.width;
                this.height = b.height;
                this._reset = true;
            }
        }
        else
        {
            var asx = Math.abs(this.sprite.scale.x);
            var asy = Math.abs(this.sprite.scale.y);

            if (asx !== this._sx || asy !== this._sy)
            {
                this.width = this.sourceWidth * asx;
                this.height = this.sourceHeight * asy;
                this._sx = asx;
                this._sy = asy;
                this._reset = true;
            }
        }

        if (this._reset)
        {
            this.halfWidth = Math.floor(this.width / 2);
            this.halfHeight = Math.floor(this.height / 2);
            this.center.setTo(this.position.x + this.halfWidth, this.position.y + this.halfHeight);
        }

    },

    /**
    * Internal method.
    *
    * @method Phaser.Physics.Arcade.Body#preUpdate
    * @protected
    */
    preUpdate: function () {

        if (!this.enable || this.game.physics.arcade.isPaused)
        {
            return;
        }

        this.dirty = true;

        //  Store and reset collision flags
        this.wasTouching.none = this.touching.none;
        this.wasTouching.up = this.touching.up;
        this.wasTouching.down = this.touching.down;
        this.wasTouching.left = this.touching.left;
        this.wasTouching.right = this.touching.right;

        this.touching.none = true;
        this.touching.up = false;
        this.touching.down = false;
        this.touching.left = false;
        this.touching.right = false;

        this.blocked.up = false;
        this.blocked.down = false;
        this.blocked.left = false;
        this.blocked.right = false;

        this.embedded = false;

        this.updateBounds();

        this.position.x = (this.sprite.world.x - (this.sprite.anchor.x * this.sprite.width)) + this.sprite.scale.x * this.offset.x;
        this.position.x -= this.sprite.scale.x < 0 ? this.width : 0;

        this.position.y = (this.sprite.world.y - (this.sprite.anchor.y * this.sprite.height)) + this.sprite.scale.y * this.offset.y;
        this.position.y -= this.sprite.scale.y < 0 ? this.height : 0;

        this.rotation = this.sprite.angle;

        this.preRotation = this.rotation;

        if (this._reset || this.sprite.fresh)
        {
            this.prev.x = this.position.x;
            this.prev.y = this.position.y;
        }

        if (this.moves)
        {
            this.game.physics.arcade.updateMotion(this);

            this.newVelocity.set(this.velocity.x * this.game.time.physicsElapsed, this.velocity.y * this.game.time.physicsElapsed);

            this.position.x += this.newVelocity.x;
            this.position.y += this.newVelocity.y;

            if (this.position.x !== this.prev.x || this.position.y !== this.prev.y)
            {
                this.angle = Math.atan2(this.velocity.y, this.velocity.x);
            }

            this.speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);

            //  Now the State update will throw collision checks at the Body
            //  And finally we'll integrate the new position back to the Sprite in postUpdate

            if (this.collideWorldBounds)
            {
                if (this.checkWorldBounds() && this.onWorldBounds)
                {
                    this.onWorldBounds.dispatch(this.sprite, this.blocked.up, this.blocked.down, this.blocked.left, this.blocked.right);
                }
            }
        }

        this._dx = this.deltaX();
        this._dy = this.deltaY();

        this._reset = false;

    },

    /**
    * Internal method.
    *
    * @method Phaser.Physics.Arcade.Body#updateMovement
    * @protected
    */
    updateMovement: function () {

        var percent = 0;
        var collided = (this.overlapX !== 0 || this.overlapY !== 0);

        //  Duration or Distance based?

        if (this.moveDuration > 0)
        {
            this.moveTimer += this.game.time.elapsedMS;

            percent = this.moveTimer / this.moveDuration;
        }
        else
        {
            this.moveTarget.end.set(this.position.x, this.position.y);

            percent = this.moveTarget.length / this.moveDistance;
        }

        if (this.movementCallback)
        {
            var result = this.movementCallback.call(this.movementCallbackContext, this, this.velocity, percent);
        }

        if (collided || percent >= 1 || (result !== undefined && result !== true))
        {
            this.stopMovement((percent >= 1) || (this.stopVelocityOnCollide && collided));
            return false;
        }

        return true;

    },

    /**
    * If this Body is moving as a result of a call to `moveTo` or `moveFrom` (i.e. it
    * has Body.isMoving true), then calling this method will stop the movement before
    * either the duration or distance counters expire.
    *
    * The `onMoveComplete` signal is dispatched.
    *
    * @method Phaser.Physics.Arcade.Body#stopMovement
    * @param {boolean} [stopVelocity] - Should the Body.velocity be set to zero?
    */
    stopMovement: function (stopVelocity) {

        if (this.isMoving)
        {
            this.isMoving = false;

            if (stopVelocity)
            {
                this.velocity.set(0);
            }

            //  Send the Sprite this Body belongs to
            //  and a boolean indicating if it stopped because of a collision or not
            this.onMoveComplete.dispatch(this.sprite, (this.overlapX !== 0 || this.overlapY !== 0));
        }

    },

    /**
    * Internal method.
    *
    * @method Phaser.Physics.Arcade.Body#postUpdate
    * @protected
    */
    postUpdate: function () {

        //  Only allow postUpdate to be called once per frame
        if (!this.enable || !this.dirty)
        {
            return;
        }

        //  Moving?
        if (this.isMoving)
        {
            this.updateMovement();
        }

        this.dirty = false;

        if (this.deltaX() < 0)
        {
            this.facing = Phaser.LEFT;
        }
        else if (this.deltaX() > 0)
        {
            this.facing = Phaser.RIGHT;
        }

        if (this.deltaY() < 0)
        {
            this.facing = Phaser.UP;
        }
        else if (this.deltaY() > 0)
        {
            this.facing = Phaser.DOWN;
        }

        if (this.moves)
        {
            this._dx = this.deltaX();
            this._dy = this.deltaY();

            if (this.deltaMax.x !== 0 && this._dx !== 0)
            {
                if (this._dx < 0 && this._dx < -this.deltaMax.x)
                {
                    this._dx = -this.deltaMax.x;
                }
                else if (this._dx > 0 && this._dx > this.deltaMax.x)
                {
                    this._dx = this.deltaMax.x;
                }
            }

            if (this.deltaMax.y !== 0 && this._dy !== 0)
            {
                if (this._dy < 0 && this._dy < -this.deltaMax.y)
                {
                    this._dy = -this.deltaMax.y;
                }
                else if (this._dy > 0 && this._dy > this.deltaMax.y)
                {
                    this._dy = this.deltaMax.y;
                }
            }

            this.sprite.position.x += this._dx;
            this.sprite.position.y += this._dy;
            this._reset = true;
        }

        this.center.setTo(this.position.x + this.halfWidth, this.position.y + this.halfHeight);

        if (this.allowRotation)
        {
            this.sprite.angle += this.deltaZ();
        }

        this.prev.x = this.position.x;
        this.prev.y = this.position.y;

    },

    /**
    * Internal method.
    *
    * @method Phaser.Physics.Arcade.Body#checkWorldBounds
    * @protected
    * @return {boolean} True if the Body collided with the world bounds, otherwise false.
    */
    checkWorldBounds: function () {

        var pos = this.position;
        var bounds = this.game.physics.arcade.bounds;
        var check = this.game.physics.arcade.checkCollision;

        var bx = (this.worldBounce) ? -this.worldBounce.x : -this.bounce.x;
        var by = (this.worldBounce) ? -this.worldBounce.y : -this.bounce.y;

        if (this.isCircle)
        {
            var bodyBounds = {
                x: this.center.x - this.radius,
                y: this.center.y - this.radius,
                right: this.center.x + this.radius,
                bottom: this.center.y + this.radius
            };

            if (bodyBounds.x < bounds.x && check.left)
            {
                pos.x = bounds.x - this.halfWidth + this.radius;
                this.velocity.x *= bx;
                this.blocked.left = true;
            }
            else if (bodyBounds.right > bounds.right && check.right)
            {
                pos.x = bounds.right - this.halfWidth - this.radius;
                this.velocity.x *= bx;
                this.blocked.right = true;
            }

            if (bodyBounds.y < bounds.y && check.up)
            {
                pos.y = bounds.y - this.halfHeight + this.radius;
                this.velocity.y *= by;
                this.blocked.up = true;
            }
            else if (bodyBounds.bottom > bounds.bottom && check.down)
            {
                pos.y = bounds.bottom  - this.halfHeight - this.radius;
                this.velocity.y *= by;
                this.blocked.down = true;
            }
        }
        else
        {
            if (pos.x < bounds.x && check.left)
            {
                pos.x = bounds.x;
                this.velocity.x *= bx;
                this.blocked.left = true;
            }
            else if (this.right > bounds.right && check.right)
            {
                pos.x = bounds.right - this.width;
                this.velocity.x *= bx;
                this.blocked.right = true;
            }

            if (pos.y < bounds.y && check.up)
            {
                pos.y = bounds.y;
                this.velocity.y *= by;
                this.blocked.up = true;
            }
            else if (this.bottom > bounds.bottom && check.down)
            {
                pos.y = bounds.bottom - this.height;
                this.velocity.y *= by;
                this.blocked.down = true;
            }
        }

        return (this.blocked.up || this.blocked.down || this.blocked.left || this.blocked.right);

    },

    /**
    * Note: This method is experimental, and may be changed or removed in a future release.
    * 
    * This method moves the Body in the given direction, for the duration specified.
    * It works by setting the velocity on the Body, and an internal timer, and then
    * monitoring the duration each frame. When the duration is up the movement is
    * stopped and the `Body.onMoveComplete` signal is dispatched.
    *
    * Movement also stops if the Body collides or overlaps with any other Body.
    * 
    * You can control if the velocity should be reset to zero on collision, by using
    * the property `Body.stopVelocityOnCollide`.
    *
    * Stop the movement at any time by calling `Body.stopMovement`.
    *
    * You can optionally set a speed in pixels per second. If not specified it
    * will use the current `Body.speed` value. If this is zero, the function will return false.
    *
    * Please note that due to browser timings you should allow for a variance in 
    * when the duration will actually expire. Depending on system it may be as much as
    * +- 50ms. Also this method doesn't take into consideration any other forces acting
    * on the Body, such as Gravity, drag or maxVelocity, all of which may impact the
    * movement.
    * 
    * @method Phaser.Physics.Arcade.Body#moveFrom
    * @param  {integer} duration  - The duration of the movement, in ms.
    * @param  {integer} [speed] - The speed of the movement, in pixels per second. If not provided `Body.speed` is used.
    * @param  {integer} [direction] - The angle of movement. If not provided `Body.angle` is used.
    * @return {boolean} True if the movement successfully started, otherwise false.
    */
    moveFrom: function (duration, speed, direction) {

        if (speed === undefined) { speed = this.speed; }

        if (speed === 0)
        {
            return false;
        }

        var angle;

        if (direction === undefined)
        {
            angle = this.angle;
            direction = this.game.math.radToDeg(angle);
        }
        else
        {
            angle = this.game.math.degToRad(direction);
        }

        this.moveTimer = 0;
        this.moveDuration = duration;

        //  Avoid sin/cos
        if (direction === 0 || direction === 180)
        {
            this.velocity.set(Math.cos(angle) * speed, 0);
        }
        else if (direction === 90 || direction === 270)
        {
            this.velocity.set(0, Math.sin(angle) * speed);
        }
        else
        {
            this.velocity.set(Math.cos(angle) * speed, Math.sin(angle) * speed);
        }

        this.isMoving = true;

        return true;

    },

    /**
    * Note: This method is experimental, and may be changed or removed in a future release.
    * 
    * This method moves the Body in the given direction, for the duration specified.
    * It works by setting the velocity on the Body, and an internal distance counter.
    * The distance is monitored each frame. When the distance equals the distance
    * specified in this call, the movement is stopped, and the `Body.onMoveComplete` 
    * signal is dispatched.
    *
    * Movement also stops if the Body collides or overlaps with any other Body.
    * 
    * You can control if the velocity should be reset to zero on collision, by using
    * the property `Body.stopVelocityOnCollide`.
    *
    * Stop the movement at any time by calling `Body.stopMovement`.
    *
    * Please note that due to browser timings you should allow for a variance in 
    * when the distance will actually expire.
    * 
    * Note: This method doesn't take into consideration any other forces acting
    * on the Body, such as Gravity, drag or maxVelocity, all of which may impact the
    * movement.
    * 
    * @method Phaser.Physics.Arcade.Body#moveTo
    * @param  {integer} duration - The duration of the movement, in ms.
    * @param  {integer} distance - The distance, in pixels, the Body will move.
    * @param  {integer} [direction] - The angle of movement. If not provided `Body.angle` is used.
    * @return {boolean} True if the movement successfully started, otherwise false.
    */
    moveTo: function (duration, distance, direction) {

        var speed = distance / (duration / 1000);

        if (speed === 0)
        {
            return false;
        }

        var angle;

        if (direction === undefined)
        {
            angle = this.angle;
            direction = this.game.math.radToDeg(angle);
        }
        else
        {
            angle = this.game.math.degToRad(direction);
        }

        distance = Math.abs(distance);

        this.moveDuration = 0;
        this.moveDistance = distance;

        if (this.moveTarget === null)
        {
            this.moveTarget = new Phaser.Line();
            this.moveEnd = new Phaser.Point();
        }

        this.moveTarget.fromAngle(this.x, this.y, angle, distance);

        this.moveEnd.set(this.moveTarget.end.x, this.moveTarget.end.y);

        this.moveTarget.setTo(this.x, this.y, this.x, this.y);

        //  Avoid sin/cos
        if (direction === 0 || direction === 180)
        {
            this.velocity.set(Math.cos(angle) * speed, 0);
        }
        else if (direction === 90 || direction === 270)
        {
            this.velocity.set(0, Math.sin(angle) * speed);
        }
        else
        {
            this.velocity.set(Math.cos(angle) * speed, Math.sin(angle) * speed);
        }

        this.isMoving = true;

        return true;

    },

    /**
    * You can modify the size of the physics Body to be any dimension you need.
    * This allows you to make it smaller, or larger, than the parent Sprite.
    * You can also control the x and y offset of the Body. This is the position of the
    * Body relative to the top-left of the Sprite _texture_.
    *
    * For example: If you have a Sprite with a texture that is 80x100 in size,
    * and you want the physics body to be 32x32 pixels in the middle of the texture, you would do:
    *
    * `setSize(32, 32, 24, 34)`
    *
    * Where the first two parameters is the new Body size (32x32 pixels).
    * 24 is the horizontal offset of the Body from the top-left of the Sprites texture, and 34
    * is the vertical offset.
    *
    * Calling `setSize` on a Body that has already had `setCircle` will reset all of the Circle
    * properties, making this Body rectangular again.
    *
    * @method Phaser.Physics.Arcade.Body#setSize
    * @param {number} width - The width of the Body.
    * @param {number} height - The height of the Body.
    * @param {number} [offsetX] - The X offset of the Body from the top-left of the Sprites texture.
    * @param {number} [offsetY] - The Y offset of the Body from the top-left of the Sprites texture.
    */
    setSize: function (width, height, offsetX, offsetY) {

        if (offsetX === undefined) { offsetX = this.offset.x; }
        if (offsetY === undefined) { offsetY = this.offset.y; }

        this.sourceWidth = width;
        this.sourceHeight = height;
        this.width = this.sourceWidth * this._sx;
        this.height = this.sourceHeight * this._sy;
        this.halfWidth = Math.floor(this.width / 2);
        this.halfHeight = Math.floor(this.height / 2);
        this.offset.setTo(offsetX, offsetY);

        this.center.setTo(this.position.x + this.halfWidth, this.position.y + this.halfHeight);

        this.isCircle = false;
        this.radius = 0;

    },

    /**
    * Sets this Body as using a circle, of the given radius, for all collision detection instead of a rectangle.
    * The radius is given in pixels and is the distance from the center of the circle to the edge.
    *
    * You can also control the x and y offset, which is the position of the Body relative to the top-left of the Sprite.
    *
    * To change a Body back to being rectangular again call `Body.setSize`.
    *
    * Note: Circular collision only happens with other Arcade Physics bodies, it does not
    * work against tile maps, where rectangular collision is the only method supported.
    *
    * @method Phaser.Physics.Arcade.Body#setCircle
    * @param {number} [radius] - The radius of the Body in pixels. Pass a value of zero / undefined, to stop the Body using a circle for collision.
    * @param {number} [offsetX] - The X offset of the Body from the Sprite position.
    * @param {number} [offsetY] - The Y offset of the Body from the Sprite position.
    */
    setCircle: function (radius, offsetX, offsetY) {

        if (offsetX === undefined) { offsetX = this.offset.x; }
        if (offsetY === undefined) { offsetY = this.offset.y; }

        if (radius > 0)
        {
            this.isCircle = true;
            this.radius = radius;

            this.sourceWidth = radius * 2;
            this.sourceHeight = radius * 2;

            this.width = this.sourceWidth * this._sx;
            this.height = this.sourceHeight * this._sy;

            this.halfWidth = Math.floor(this.width / 2);
            this.halfHeight = Math.floor(this.height / 2);

            this.offset.setTo(offsetX, offsetY);

            this.center.setTo(this.position.x + this.halfWidth, this.position.y + this.halfHeight);
        }
        else
        {
            this.isCircle = false;
        }

    },

    /**
    * Resets all Body values (velocity, acceleration, rotation, etc)
    *
    * @method Phaser.Physics.Arcade.Body#reset
    * @param {number} x - The new x position of the Body.
    * @param {number} y - The new y position of the Body.
    */
    reset: function (x, y) {

        this.velocity.set(0);
        this.acceleration.set(0);

        this.speed = 0;
        this.angularVelocity = 0;
        this.angularAcceleration = 0;

        this.position.x = (x - (this.sprite.anchor.x * this.sprite.width)) + this.sprite.scale.x * this.offset.x;
        this.position.x -= this.sprite.scale.x < 0 ? this.width : 0;

        this.position.y = (y - (this.sprite.anchor.y * this.sprite.height)) + this.sprite.scale.y * this.offset.y;
        this.position.y -= this.sprite.scale.y < 0 ? this.height : 0;

        this.prev.x = this.position.x;
        this.prev.y = this.position.y;

        this.rotation = this.sprite.angle;
        this.preRotation = this.rotation;

        this._sx = this.sprite.scale.x;
        this._sy = this.sprite.scale.y;

        this.center.setTo(this.position.x + this.halfWidth, this.position.y + this.halfHeight);

    },

    /**
    * Returns the bounds of this physics body.
    * 
    * Only used internally by the World collision methods.
    *
    * @method Phaser.Physics.Arcade.Body#getBounds
    * @param {object} obj - The object in which to set the bounds values.
    * @return {object} The object that was given to this method.
    */
    getBounds: function (obj) {

        if (this.isCircle)
        {
            obj.x = this.center.x - this.radius;
            obj.y = this.center.y - this.radius;
            obj.right = this.center.x + this.radius;
            obj.bottom = this.center.y + this.radius;
        }
        else
        {
            obj.x = this.x;
            obj.y = this.y;
            obj.right = this.right;
            obj.bottom = this.bottom;
        }

        return obj;

    },

    /**
    * Tests if a world point lies within this Body.
    *
    * @method Phaser.Physics.Arcade.Body#hitTest
    * @param {number} x - The world x coordinate to test.
    * @param {number} y - The world y coordinate to test.
    * @return {boolean} True if the given coordinates are inside this Body, otherwise false.
    */
    hitTest: function (x, y) {

        return (this.isCircle) ? Phaser.Circle.contains(this, x, y) : Phaser.Rectangle.contains(this, x, y);

    },

    /**
    * Returns true if the bottom of this Body is in contact with either the world bounds or a tile.
    *
    * @method Phaser.Physics.Arcade.Body#onFloor
    * @return {boolean} True if in contact with either the world bounds or a tile.
    */
    onFloor: function () {

        return this.blocked.down;

    },
    
    /**
    * Returns true if the top of this Body is in contact with either the world bounds or a tile.
    *
    * @method Phaser.Physics.Arcade.Body#onCeiling
    * @return {boolean} True if in contact with either the world bounds or a tile.
    */
    onCeiling: function(){

        return this.blocked.up;

    },

    /**
    * Returns true if either side of this Body is in contact with either the world bounds or a tile.
    *
    * @method Phaser.Physics.Arcade.Body#onWall
    * @return {boolean} True if in contact with either the world bounds or a tile.
    */
    onWall: function () {

        return (this.blocked.left || this.blocked.right);

    },

    /**
    * Returns the absolute delta x value.
    *
    * @method Phaser.Physics.Arcade.Body#deltaAbsX
    * @return {number} The absolute delta value.
    */
    deltaAbsX: function () {

        return (this.deltaX() > 0 ? this.deltaX() : -this.deltaX());

    },

    /**
    * Returns the absolute delta y value.
    *
    * @method Phaser.Physics.Arcade.Body#deltaAbsY
    * @return {number} The absolute delta value.
    */
    deltaAbsY: function () {

        return (this.deltaY() > 0 ? this.deltaY() : -this.deltaY());

    },

    /**
    * Returns the delta x value. The difference between Body.x now and in the previous step.
    *
    * @method Phaser.Physics.Arcade.Body#deltaX
    * @return {number} The delta value. Positive if the motion was to the right, negative if to the left.
    */
    deltaX: function () {

        return this.position.x - this.prev.x;

    },

    /**
    * Returns the delta y value. The difference between Body.y now and in the previous step.
    *
    * @method Phaser.Physics.Arcade.Body#deltaY
    * @return {number} The delta value. Positive if the motion was downwards, negative if upwards.
    */
    deltaY: function () {

        return this.position.y - this.prev.y;

    },

    /**
    * Returns the delta z value. The difference between Body.rotation now and in the previous step.
    *
    * @method Phaser.Physics.Arcade.Body#deltaZ
    * @return {number} The delta value. Positive if the motion was clockwise, negative if anti-clockwise.
    */
    deltaZ: function () {

        return this.rotation - this.preRotation;

    },

    /**
    * Destroys this Body.
    * 
    * First it calls Group.removeFromHash if the Game Object this Body belongs to is part of a Group.
    * Then it nulls the Game Objects body reference, and nulls this Body.sprite reference.
    *
    * @method Phaser.Physics.Arcade.Body#destroy
    */
    destroy: function () {

        if (this.sprite.parent && this.sprite.parent instanceof Phaser.Group)
        {
            this.sprite.parent.removeFromHash(this.sprite);
        }

        this.sprite.body = null;
        this.sprite = null;

    }

};

/**
* @name Phaser.Physics.Arcade.Body#left
* @property {number} left - The x position of the Body. The same as `Body.x`.
*/
Object.defineProperty(Phaser.Physics.Arcade.Body.prototype, "left", {

    get: function () {

        return this.position.x;

    }

});

/**
* @name Phaser.Physics.Arcade.Body#right
* @property {number} right - The right value of this Body (same as Body.x + Body.width)
* @readonly
*/
Object.defineProperty(Phaser.Physics.Arcade.Body.prototype, "right", {

    get: function () {

        return this.position.x + this.width;

    }

});

/**
* @name Phaser.Physics.Arcade.Body#top
* @property {number} top - The y position of the Body. The same as `Body.y`.
*/
Object.defineProperty(Phaser.Physics.Arcade.Body.prototype, "top", {

    get: function () {

        return this.position.y;

    }

});

/**
* @name Phaser.Physics.Arcade.Body#bottom
* @property {number} bottom - The bottom value of this Body (same as Body.y + Body.height)
* @readonly
*/
Object.defineProperty(Phaser.Physics.Arcade.Body.prototype, "bottom", {

    get: function () {

        return this.position.y + this.height;

    }

});

/**
* @name Phaser.Physics.Arcade.Body#x
* @property {number} x - The x position.
*/
Object.defineProperty(Phaser.Physics.Arcade.Body.prototype, "x", {

    get: function () {

        return this.position.x;

    },

    set: function (value) {

        this.position.x = value;
    }

});

/**
* @name Phaser.Physics.Arcade.Body#y
* @property {number} y - The y position.
*/
Object.defineProperty(Phaser.Physics.Arcade.Body.prototype, "y", {

    get: function () {

        return this.position.y;

    },

    set: function (value) {

        this.position.y = value;

    }

});

/**
* Render Sprite Body.
*
* @method Phaser.Physics.Arcade.Body#render
* @param {object} context - The context to render to.
* @param {Phaser.Physics.Arcade.Body} body - The Body to render the info of.
* @param {string} [color='rgba(0,255,0,0.4)'] - color of the debug info to be rendered. (format is css color string).
* @param {boolean} [filled=true] - Render the objected as a filled (default, true) or a stroked (false)
*/
Phaser.Physics.Arcade.Body.render = function (context, body, color, filled) {

    if (filled === undefined) { filled = true; }

    color = color || 'rgba(0,255,0,0.4)';

    context.fillStyle = color;
    context.strokeStyle = color;

    if (body.isCircle)
    {
        context.beginPath();
        context.arc(body.center.x - body.game.camera.x, body.center.y - body.game.camera.y, body.radius, 0, 2 * Math.PI);

        if (filled)
        {
            context.fill();
        }
        else
        {
            context.stroke();
        }
    }
    else
    {
        if (filled)
        {
            context.fillRect(body.position.x - body.game.camera.x, body.position.y - body.game.camera.y, body.width, body.height);
        }
        else
        {
            context.strokeRect(body.position.x - body.game.camera.x, body.position.y - body.game.camera.y, body.width, body.height);
        }
    }

};

/**
* Render Sprite Body Physics Data as text.
*
* @method Phaser.Physics.Arcade.Body#renderBodyInfo
* @param {Phaser.Physics.Arcade.Body} body - The Body to render the info of.
* @param {number} x - X position of the debug info to be rendered.
* @param {number} y - Y position of the debug info to be rendered.
* @param {string} [color='rgb(255,255,255)'] - color of the debug info to be rendered. (format is css color string).
*/
Phaser.Physics.Arcade.Body.renderBodyInfo = function (debug, body) {

    debug.line('x: ' + body.x.toFixed(2), 'y: ' + body.y.toFixed(2), 'width: ' + body.width, 'height: ' + body.height);
    debug.line('velocity x: ' + body.velocity.x.toFixed(2), 'y: ' + body.velocity.y.toFixed(2), 'deltaX: ' + body._dx.toFixed(2), 'deltaY: ' + body._dy.toFixed(2));
    debug.line('acceleration x: ' + body.acceleration.x.toFixed(2), 'y: ' + body.acceleration.y.toFixed(2), 'speed: ' + body.speed.toFixed(2), 'angle: ' + body.angle.toFixed(2));
    debug.line('gravity x: ' + body.gravity.x, 'y: ' + body.gravity.y, 'bounce x: ' + body.bounce.x.toFixed(2), 'y: ' + body.bounce.y.toFixed(2));
    debug.line('touching left: ' + body.touching.left, 'right: ' + body.touching.right, 'up: ' + body.touching.up, 'down: ' + body.touching.down);
    debug.line('blocked left: ' + body.blocked.left, 'right: ' + body.blocked.right, 'up: ' + body.blocked.up, 'down: ' + body.blocked.down);

};

Phaser.Physics.Arcade.Body.prototype.constructor = Phaser.Physics.Arcade.Body;
