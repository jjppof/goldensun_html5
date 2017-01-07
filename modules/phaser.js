/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2016 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

/**
* @namespace Phaser
*/
var Phaser = Phaser || {    // jshint ignore:line

    /**
    * The Phaser version number.
    * @constant
    * @type {string}
    */
    VERSION: '2.6.2',

    /**
    * An array of Phaser game instances.
    * @constant
    * @type {array}
    */
    GAMES: [],

    /**
    * AUTO renderer - picks between WebGL or Canvas based on device.
    * @constant
    * @type {integer}
    */
    AUTO: 0,

    /**
    * Canvas Renderer.
    * @constant
    * @type {integer}
    */
    CANVAS: 1,

    /**
    * WebGL Renderer.
    * @constant
    * @type {integer}
    */
    WEBGL: 2,

    /**
    * Headless renderer (not visual output)
    * @constant
    * @type {integer}
    */
    HEADLESS: 3,

    /**
    * Direction constant.
    * @constant
    * @type {integer}
    */
    NONE: 0,

    /**
    * Direction constant.
    * @constant
    * @type {integer}
    */
    LEFT: 1,

    /**
    * Direction constant.
    * @constant
    * @type {integer}
    */
    RIGHT: 2,

    /**
    * Direction constant.
    * @constant
    * @type {integer}
    */
    UP: 3,

    /**
    * Direction constant.
    * @constant
    * @type {integer}
    */
    DOWN: 4,

    /**
    * Game Object type.
    * @constant
    * @type {integer}
    */
    SPRITE: 0,

    /**
    * Game Object type.
    * @constant
    * @type {integer}
    */
    BUTTON: 1,

    /**
    * Game Object type.
    * @constant
    * @type {integer}
    */
    IMAGE: 2,

    /**
    * Game Object type.
    * @constant
    * @type {integer}
    */
    GRAPHICS: 3,

    /**
    * Game Object type.
    * @constant
    * @type {integer}
    */
    TEXT: 4,

    /**
    * Game Object type.
    * @constant
    * @type {integer}
    */
    TILESPRITE: 5,

    /**
    * Game Object type.
    * @constant
    * @type {integer}
    */
    BITMAPTEXT: 6,

    /**
    * Game Object type.
    * @constant
    * @type {integer}
    */
    GROUP: 7,

    /**
    * Game Object type.
    * @constant
    * @type {integer}
    */
    RENDERTEXTURE: 8,

    /**
    * Game Object type.
    * @constant
    * @type {integer}
    */
    TILEMAP: 9,

    /**
    * Game Object type.
    * @constant
    * @type {integer}
    */
    TILEMAPLAYER: 10,

    /**
    * Game Object type.
    * @constant
    * @type {integer}
    */
    EMITTER: 11,

    /**
    * Game Object type.
    * @constant
    * @type {integer}
    */
    POLYGON: 12,

    /**
    * Game Object type.
    * @constant
    * @type {integer}
    */
    BITMAPDATA: 13,

    /**
    * Game Object type.
    * @constant
    * @type {integer}
    */
    CANVAS_FILTER: 14,

    /**
    * Game Object type.
    * @constant
    * @type {integer}
    */
    WEBGL_FILTER: 15,

    /**
    * Game Object type.
    * @constant
    * @type {integer}
    */
    ELLIPSE: 16,

    /**
    * Game Object type.
    * @constant
    * @type {integer}
    */
    SPRITEBATCH: 17,

    /**
    * Game Object type.
    * @constant
    * @type {integer}
    */
    RETROFONT: 18,

    /**
    * Game Object type.
    * @constant
    * @type {integer}
    */
    POINTER: 19,

    /**
    * Game Object type.
    * @constant
    * @type {integer}
    */
    ROPE: 20,

    /**
    * Game Object type.
    * @constant
    * @type {integer}
    */
    CIRCLE: 21,

    /**
    * Game Object type.
    * @constant
    * @type {integer}
    */
    RECTANGLE: 22,

    /**
    * Game Object type.
    * @constant
    * @type {integer}
    */
    LINE: 23,

    /**
    * Game Object type.
    * @constant
    * @type {integer}
    */
    MATRIX: 24,

    /**
    * Game Object type.
    * @constant
    * @type {integer}
    */
    POINT: 25,

    /**
    * Game Object type.
    * @constant
    * @type {integer}
    */
    ROUNDEDRECTANGLE: 26,

    /**
    * Game Object type.
    * @constant
    * @type {integer}
    */
    CREATURE: 27,

    /**
    * Game Object type.
    * @constant
    * @type {integer}
    */
    VIDEO: 28,

    /**
    * Game Object type.
    * @constant
    * @type {integer}
    */
    PENDING_ATLAS: -1,

    /**
    * A horizontal orientation
    * @constant
    * @type {integer}
    */
    HORIZONTAL: 0,

    /**
    * A vertical orientation
    * @constant
    * @type {integer}
    */
    VERTICAL: 1,

    /**
    * A landscape orientation
    * @constant
    * @type {integer}
    */
    LANDSCAPE: 0,

    /**
    * A portrait orientation
    * @constant
    * @type {integer}
    */
    PORTRAIT: 1,

    /**
    * The Angle (in degrees) a Game Object needs to be set to in order to face up.
    * @constant
    * @type {integer}
    */
    ANGLE_UP: 270,

    /**
    * The Angle (in degrees) a Game Object needs to be set to in order to face down.
    * @constant
    * @type {integer}
    */
    ANGLE_DOWN: 90,

    /**
    * The Angle (in degrees) a Game Object needs to be set to in order to face left.
    * @constant
    * @type {integer}
    */
    ANGLE_LEFT: 180,

    /**
    * The Angle (in degrees) a Game Object needs to be set to in order to face right.
    * @constant
    * @type {integer}
    */
    ANGLE_RIGHT: 0,

    /**
    * The Angle (in degrees) a Game Object needs to be set to in order to face north east.
    * @constant
    * @type {integer}
    */
    ANGLE_NORTH_EAST: 315,

    /**
    * The Angle (in degrees) a Game Object needs to be set to in order to face north west.
    * @constant
    * @type {integer}
    */
    ANGLE_NORTH_WEST: 225,

    /**
    * The Angle (in degrees) a Game Object needs to be set to in order to face south east.
    * @constant
    * @type {integer}
    */
    ANGLE_SOUTH_EAST: 45,

    /**
    * The Angle (in degrees) a Game Object needs to be set to in order to face south west.
    * @constant
    * @type {integer}
    */
    ANGLE_SOUTH_WEST: 135,

    /**
    * A constant representing a top-left alignment or position.
    * @constant
    * @type {integer}
    */
    TOP_LEFT: 0,

    /**
    * A constant representing a top-center alignment or position.
    * @constant
    * @type {integer}
    */
    TOP_CENTER: 1,

    /**
    * A constant representing a top-right alignment or position.
    * @constant
    * @type {integer}
    */
    TOP_RIGHT: 2,

    /**
    * A constant representing a left-top alignment or position.
    * @constant
    * @type {integer}
    */
    LEFT_TOP: 3,

    /**
    * A constant representing a left-center alignment or position.
    * @constant
    * @type {integer}
    */
    LEFT_CENTER: 4,

    /**
    * A constant representing a left-bottom alignment or position.
    * @constant
    * @type {integer}
    */
    LEFT_BOTTOM: 5,

    /**
    * A constant representing a center alignment or position.
    * @constant
    * @type {integer}
    */
    CENTER: 6,

    /**
    * A constant representing a right-top alignment or position.
    * @constant
    * @type {integer}
    */
    RIGHT_TOP: 7,

    /**
    * A constant representing a right-center alignment or position.
    * @constant
    * @type {integer}
    */
    RIGHT_CENTER: 8,

    /**
    * A constant representing a right-bottom alignment or position.
    * @constant
    * @type {integer}
    */
    RIGHT_BOTTOM: 9,

    /**
    * A constant representing a bottom-left alignment or position.
    * @constant
    * @type {integer}
    */
    BOTTOM_LEFT: 10,

    /**
    * A constant representing a bottom-center alignment or position.
    * @constant
    * @type {integer}
    */
    BOTTOM_CENTER: 11,

    /**
    * A constant representing a bottom-right alignment or position.
    * @constant
    * @type {integer}
    */
    BOTTOM_RIGHT: 12,

    /**
     * Various blend modes supported by Pixi.
     * 
     * IMPORTANT: The WebGL renderer only supports the NORMAL, ADD, MULTIPLY and SCREEN blend modes.
     * 
     * @constant
     * @property {Number} blendModes.NORMAL
     * @property {Number} blendModes.ADD
     * @property {Number} blendModes.MULTIPLY
     * @property {Number} blendModes.SCREEN
     * @property {Number} blendModes.OVERLAY
     * @property {Number} blendModes.DARKEN
     * @property {Number} blendModes.LIGHTEN
     * @property {Number} blendModes.COLOR_DODGE
     * @property {Number} blendModes.COLOR_BURN
     * @property {Number} blendModes.HARD_LIGHT
     * @property {Number} blendModes.SOFT_LIGHT
     * @property {Number} blendModes.DIFFERENCE
     * @property {Number} blendModes.EXCLUSION
     * @property {Number} blendModes.HUE
     * @property {Number} blendModes.SATURATION
     * @property {Number} blendModes.COLOR
     * @property {Number} blendModes.LUMINOSITY
     * @static
     */
    blendModes: {
        NORMAL:0,
        ADD:1,
        MULTIPLY:2,
        SCREEN:3,
        OVERLAY:4,
        DARKEN:5,
        LIGHTEN:6,
        COLOR_DODGE:7,
        COLOR_BURN:8,
        HARD_LIGHT:9,
        SOFT_LIGHT:10,
        DIFFERENCE:11,
        EXCLUSION:12,
        HUE:13,
        SATURATION:14,
        COLOR:15,
        LUMINOSITY:16
    },

    /**
     * The scale modes that are supported by Pixi.
     *
     * The DEFAULT scale mode affects the default scaling mode of future operations.
     * It can be re-assigned to either LINEAR or NEAREST, depending upon suitability.
     *
     * @constant
     * @property {Object} Phaser.scaleModes
     * @property {Number} scaleModes.DEFAULT=LINEAR
     * @property {Number} scaleModes.LINEAR Smooth scaling
     * @property {Number} scaleModes.NEAREST Pixelating scaling
     * @static
     */
    scaleModes: {
        DEFAULT:0,
        LINEAR:0,
        NEAREST:1
    },

    PIXI: PIXI || {}

};

/**
* @copyright    2016 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

// ES6 Math.trunc - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/trunc
if (!Math.trunc) {
    Math.trunc = function trunc(x) {
        return x < 0 ? Math.ceil(x) : Math.floor(x);
    };
}

/**
* A polyfill for Function.prototype.bind
*/
if (!Function.prototype.bind) {

    /* jshint freeze: false */
    Function.prototype.bind = (function () {

        var slice = Array.prototype.slice;

        return function (thisArg) {

            var target = this, boundArgs = slice.call(arguments, 1);

            if (typeof target !== 'function')
            {
                throw new TypeError();
            }

            function bound() {
                var args = boundArgs.concat(slice.call(arguments));
                target.apply(this instanceof bound ? this : thisArg, args);
            }

            bound.prototype = (function F(proto) {
                if (proto)
                {
                    F.prototype = proto;
                }

                if (!(this instanceof F))
                {
                    /* jshint supernew: true */
                    return new F;
                }
            })(target.prototype);

            return bound;
        };
    })();
}

/**
* A polyfill for Array.isArray
*/
if (!Array.isArray)
{
    Array.isArray = function (arg)
    {
        return Object.prototype.toString.call(arg) === '[object Array]';
    };
}

/**
* A polyfill for Array.forEach
* https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach
*/
if (!Array.prototype.forEach)
{
    Array.prototype.forEach = function(fun /*, thisArg */)
    {
        "use strict";

        if (this === void 0 || this === null)
        {
            throw new TypeError();
        }

        var t = Object(this);
        var len = t.length >>> 0;

        if (typeof fun !== "function")
        {
            throw new TypeError();
        }

        var thisArg = arguments.length >= 2 ? arguments[1] : void 0;

        for (var i = 0; i < len; i++)
        {
            if (i in t)
            {
                fun.call(thisArg, t[i], i, t);
            }
        }
    };
}

/**
* Low-budget Float32Array knock-off, suitable for use with P2.js in IE9
* Source: http://www.html5gamedevs.com/topic/5988-phaser-12-ie9/
* Cameron Foale (http://www.kibibu.com)
*/
if (typeof window.Uint32Array !== "function" && typeof window.Uint32Array !== "object")
{
    var CheapArray = function(type)
    {
        var proto = new Array(); // jshint ignore:line

        window[type] = function(arg) {

            if (typeof(arg) === "number")
            {
                Array.call(this, arg);
                this.length = arg;

                for (var i = 0; i < this.length; i++)
                {
                    this[i] = 0;
                }
            }
            else
            {
                Array.call(this, arg.length);

                this.length = arg.length;

                for (var i = 0; i < this.length; i++)
                {
                    this[i] = arg[i];
                }
            }
        };

        window[type].prototype = proto;
        window[type].constructor = window[type];
    };

    CheapArray('Uint32Array'); // jshint ignore:line
    CheapArray('Int16Array');  // jshint ignore:line
}

/**
 * Also fix for the absent console in IE9
 */
if (!window.console)
{
    window.console = {};
    window.console.log = window.console.assert = function(){};
    window.console.warn = window.console.assert = function(){};
}

/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2016 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

/**
* @class Phaser.Utils
* @static
*/
Phaser.Utils = {

    /**
    * Takes the given string and reverses it, returning the reversed string.
    * For example if given the string `Atari 520ST` it would return `TS025 iratA`.
    *
    * @method Phaser.Utils.reverseString
    * @param {string} string - The string to be reversed.
    * @return {string} The reversed string.
    */
    reverseString: function (string) {

        return string.split('').reverse().join('');

    },

    /**
     * Gets an objects property by string.
     *
     * @method Phaser.Utils.getProperty
     * @param {object} obj - The object to traverse.
     * @param {string} prop - The property whose value will be returned.
     * @return {*} the value of the property or null if property isn't found .
     */
    getProperty: function(obj, prop) {

        var parts = prop.split('.'),
            last = parts.pop(),
            l = parts.length,
            i = 1,
            current = parts[0];

        while (i < l && (obj = obj[current]))
        {
            current = parts[i];
            i++;
        }

        if (obj)
        {
            return obj[last];
        }
        else
        {
            return null;
        }

    },

    /**
     * Sets an objects property by string.
     *
     * @method Phaser.Utils.setProperty
     * @param {object} obj - The object to traverse
     * @param {string} prop - The property whose value will be changed
     * @return {object} The object on which the property was set.
     */
    setProperty: function(obj, prop, value) {

        var parts = prop.split('.'),
            last = parts.pop(),
            l = parts.length,
            i = 1,
            current = parts[0];

        while (i < l && (obj = obj[current]))
        {
            current = parts[i];
            i++;
        }

        if (obj)
        {
            obj[last] = value;
        }

        return obj;

    },

    /**
    * Generate a random bool result based on the chance value.
    *
    * Returns true or false based on the chance value (default 50%). For example if you wanted a player to have a 30% chance
    * of getting a bonus, call chanceRoll(30) - true means the chance passed, false means it failed.
    *
    * @method Phaser.Utils#chanceRoll
    * @param {number} chance - The chance of receiving the value. A number between 0 and 100 (effectively 0% to 100%).
    * @return {boolean} True if the roll passed, or false otherwise.
    */
    chanceRoll: function (chance) {
        if (chance === undefined) { chance = 50; }
        return chance > 0 && (Math.random() * 100 <= chance);
    },

    /**
    * Choose between one of two values randomly.
    *
    * @method Phaser.Utils#randomChoice
    * @param {any} choice1
    * @param {any} choice2
    * @return {any} The randomly selected choice
    */
    randomChoice: function (choice1, choice2) {
        return (Math.random() < 0.5) ? choice1 : choice2;
    },

    /**
    * Get a unit dimension from a string.
    *
    * @method Phaser.Utils.parseDimension
    * @param {string|number} size - The size to parse.
    * @param {number} dimension - The window dimension to check.
    * @return {number} The parsed dimension.
    */
    parseDimension: function (size, dimension) {

        var f = 0;
        var px = 0;

        if (typeof size === 'string')
        {
            //  %?
            if (size.substr(-1) === '%')
            {
                f = parseInt(size, 10) / 100;

                if (dimension === 0)
                {
                    px = window.innerWidth * f;
                }
                else
                {
                    px = window.innerHeight * f;
                }
            }
            else
            {
                px = parseInt(size, 10);
            }
        }
        else
        {
            px = size;
        }

        return px;

    },

    /**
    * Takes the given string and pads it out, to the length required, using the character
    * specified. For example if you need a string to be 6 characters long, you can call:
    *
    * `pad('bob', 6, '-', 2)`
    *
    * This would return: `bob---` as it has padded it out to 6 characters, using the `-` on the right.
    *
    * You can also use it to pad numbers (they are always returned as strings):
    * 
    * `pad(512, 6, '0', 1)`
    *
    * Would return: `000512` with the string padded to the left.
    *
    * If you don't specify a direction it'll pad to both sides:
    * 
    * `pad('c64', 7, '*')`
    *
    * Would return: `**c64**`
    *
    * @method Phaser.Utils.pad
    * @param {string} str - The target string. `toString()` will be called on the string, which means you can also pass in common data types like numbers.
    * @param {integer} [len=0] - The number of characters to be added.
    * @param {string} [pad=" "] - The string to pad it out with (defaults to a space).
    * @param {integer} [dir=3] - The direction dir = 1 (left), 2 (right), 3 (both).
    * @return {string} The padded string.
    */
    pad: function (str, len, pad, dir) {

        if (len === undefined) { var len = 0; }
        if (pad === undefined) { var pad = ' '; }
        if (dir === undefined) { var dir = 3; }

        str = str.toString();

        var padlen = 0;

        if (len + 1 >= str.length)
        {
            switch (dir)
            {
                case 1:
                    str = new Array(len + 1 - str.length).join(pad) + str;
                    break;

                case 3:
                    var right = Math.ceil((padlen = len - str.length) / 2);
                    var left = padlen - right;
                    str = new Array(left+1).join(pad) + str + new Array(right+1).join(pad);
                    break;

                default:
                    str = str + new Array(len + 1 - str.length).join(pad);
                    break;
            }
        }

        return str;

    },

    /**
    * This is a slightly modified version of jQuery.isPlainObject.
    * A plain object is an object whose internal class property is [object Object].
    * @method Phaser.Utils.isPlainObject
    * @param {object} obj - The object to inspect.
    * @return {boolean} - true if the object is plain, otherwise false.
    */
    isPlainObject: function (obj) {

        // Not plain objects:
        // - Any object or value whose internal [[Class]] property is not "[object Object]"
        // - DOM nodes
        // - window
        if (typeof(obj) !== "object" || obj.nodeType || obj === obj.window)
        {
            return false;
        }

        // Support: Firefox <20
        // The try/catch suppresses exceptions thrown when attempting to access
        // the "constructor" property of certain host objects, ie. |window.location|
        // https://bugzilla.mozilla.org/show_bug.cgi?id=814622
        try {
            if (obj.constructor && !({}).hasOwnProperty.call(obj.constructor.prototype, "isPrototypeOf"))
            {
                return false;
            }
        } catch (e) {
            return false;
        }

        // If the function hasn't returned already, we're confident that
        // |obj| is a plain object, created by {} or constructed with new Object
        return true;
    },

    /**
    * This is a slightly modified version of http://api.jquery.com/jQuery.extend/
    * 
    * @method Phaser.Utils.extend
    * @param {boolean} deep - Perform a deep copy?
    * @param {object} target - The target object to copy to.
    * @return {object} The extended object.
    */
    extend: function () {

        var options, name, src, copy, copyIsArray, clone,
            target = arguments[0] || {},
            i = 1,
            length = arguments.length,
            deep = false;

        // Handle a deep copy situation
        if (typeof target === "boolean")
        {
            deep = target;
            target = arguments[1] || {};
            // skip the boolean and the target
            i = 2;
        }

        // extend Phaser if only one argument is passed
        if (length === i)
        {
            target = this;
            --i;
        }

        for (; i < length; i++)
        {
            // Only deal with non-null/undefined values
            if ((options = arguments[i]) != null)
            {
                // Extend the base object
                for (name in options)
                {
                    src = target[name];
                    copy = options[name];

                    // Prevent never-ending loop
                    if (target === copy)
                    {
                        continue;
                    }

                    // Recurse if we're merging plain objects or arrays
                    if (deep && copy && (Phaser.Utils.isPlainObject(copy) || (copyIsArray = Array.isArray(copy))))
                    {
                        if (copyIsArray)
                        {
                            copyIsArray = false;
                            clone = src && Array.isArray(src) ? src : [];
                        }
                        else
                        {
                            clone = src && Phaser.Utils.isPlainObject(src) ? src : {};
                        }

                        // Never move original objects, clone them
                        target[name] = Phaser.Utils.extend(deep, clone, copy);

                    // Don't bring in undefined values
                    }
                    else if (copy !== undefined)
                    {
                        target[name] = copy;
                    }
                }
            }
        }

        // Return the modified object
        return target;

    },

    /**
    * Mixes in an existing mixin object with the target.
    *
    * Values in the mixin that have either `get` or `set` functions are created as properties via `defineProperty`
    * _except_ if they also define a `clone` method - if a clone method is defined that is called instead and
    * the result is assigned directly.
    *
    * @method Phaser.Utils.mixinPrototype
    * @param {object} target - The target object to receive the new functions.
    * @param {object} mixin - The object to copy the functions from.
    * @param {boolean} [replace=false] - If the target object already has a matching function should it be overwritten or not?
    */
    mixinPrototype: function (target, mixin, replace) {
    
        if (replace === undefined) { replace = false; }

        var mixinKeys = Object.keys(mixin);

        for (var i = 0; i < mixinKeys.length; i++)
        {
            var key = mixinKeys[i];
            var value = mixin[key];

            if (!replace && (key in target))
            {
                //  Not overwriting existing property
                continue;
            }
            else
            {
                if (value &&
                    (typeof value.get === 'function' || typeof value.set === 'function'))
                {
                    //  Special case for classes like Phaser.Point which has a 'set' function!
                    if (typeof value.clone === 'function')
                    {
                        target[key] = value.clone();
                    }
                    else
                    {
                        Object.defineProperty(target, key, value);
                    }
                }
                else
                {
                    target[key] = value;
                }
            }
        }

    },

    /**
    * Mixes the source object into the destination object, returning the newly modified destination object.
    * Based on original code by @mudcube
    *
    * @method Phaser.Utils.mixin
    * @param {object} from - The object to copy (the source object).
    * @param {object} to - The object to copy to (the destination object).
    * @return {object} The modified destination object.
    */
    mixin: function (from, to) {

        if (!from || typeof (from) !== "object")
        {
            return to;
        }

        for (var key in from)
        {
            var o = from[key];

            if (o.childNodes || o.cloneNode)
            {
                continue;
            }

            var type = typeof (from[key]);

            if (!from[key] || type !== "object")
            {
                to[key] = from[key];
            }
            else
            {
                //  Clone sub-object
                if (typeof (to[key]) === type)
                {
                    to[key] = Phaser.Utils.mixin(from[key], to[key]);
                }
                else
                {
                    to[key] = Phaser.Utils.mixin(from[key], new o.constructor());
                }
            }
        }

        return to;

    }

};
