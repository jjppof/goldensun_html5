/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2016 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

/**
* ArraySet is a Set data structure (items must be unique within the set) that also maintains order.
* This allows specific items to be easily added or removed from the Set.
*
* Item equality (and uniqueness) is determined by the behavior of `Array.indexOf`.
*
* This used primarily by the Input subsystem.
*
* @class Phaser.ArraySet
* @constructor
* @param {any[]} [list=(new array)] - The backing array: if specified the items in the list _must_ be unique, per `Array.indexOf`, and the ownership of the array _should_ be relinquished to the ArraySet.
*/
Phaser.ArraySet = function (list) {

    /**
    * Current cursor position as established by `first` and `next`.
    * @property {integer} position
    * @default
    */
    this.position = 0;

    /**
    * The backing array.
    * @property {any[]} list
    */
    this.list = list || [];

};

Phaser.ArraySet.prototype = {

    /**
    * Adds a new element to the end of the list.
    * If the item already exists in the list it is not moved.
    *
    * @method Phaser.ArraySet#add
    * @param {any} item - The element to add to this list.
    * @return {any} The item that was added.
    */
    add: function (item) {

        if (!this.exists(item))
        {
            this.list.push(item);
        }

        return item;

    },

    /**
    * Gets the index of the item in the list, or -1 if it isn't in the list.
    *
    * @method Phaser.ArraySet#getIndex
    * @param {any} item - The element to get the list index for.
    * @return {integer} The index of the item or -1 if not found.
    */
    getIndex: function (item) {

        return this.list.indexOf(item);

    },

    /**
    * Gets an item from the set based on the property strictly equaling the value given.
    * Returns null if not found.
    *
    * @method Phaser.ArraySet#getByKey
    * @param {string} property - The property to check against the value.
    * @param {any} value - The value to check if the property strictly equals.
    * @return {any} The item that was found, or null if nothing matched.
    */
    getByKey: function (property, value) {

        var i = this.list.length;

        while (i--)
        {
            if (this.list[i][property] === value)
            {
                return this.list[i];
            }
        }

        return null;

    },

    /**
    * Checks for the item within this list.
    *
    * @method Phaser.ArraySet#exists
    * @param {any} item - The element to get the list index for.
    * @return {boolean} True if the item is found in the list, otherwise false.
    */
    exists: function (item) {

        return (this.list.indexOf(item) > -1);

    },

    /**
    * Removes all the items.
    *
    * @method Phaser.ArraySet#reset
    */
    reset: function () {

        this.list.length = 0;

    },

    /**
    * Removes the given element from this list if it exists.
    *
    * @method Phaser.ArraySet#remove
    * @param {any} item - The item to be removed from the list.
    * @return {any} item - The item that was removed.
    */
    remove: function (item) {

        var idx = this.list.indexOf(item);

        if (idx > -1)
        {
            this.list.splice(idx, 1);
            return item;
        }

    },

    /**
    * Sets the property `key` to the given value on all members of this list.
    *
    * @method Phaser.ArraySet#setAll
    * @param {any} key - The property of the item to set.
    * @param {any} value - The value to set the property to.
    */
    setAll: function (key, value) {

        var i = this.list.length;

        while (i--)
        {
            if (this.list[i])
            {
                this.list[i][key] = value;
            }
        }

    },

    /**
    * Calls a function on all members of this list, using the member as the context for the callback.
    *
    * If the `key` property is present it must be a function.
    * The function is invoked using the item as the context.
    *
    * @method Phaser.ArraySet#callAll
    * @param {string} key - The name of the property with the function to call.
    * @param {...*} parameter - Additional parameters that will be passed to the callback.
    */
    callAll: function (key) {

        var args = Array.prototype.slice.call(arguments, 1);

        var i = this.list.length;

        while (i--)
        {
            if (this.list[i] && this.list[i][key])
            {
                this.list[i][key].apply(this.list[i], args);
            }
        }

    },

    /**
    * Removes every member from this ArraySet and optionally destroys it.
    *
    * @method Phaser.ArraySet#removeAll
    * @param {boolean} [destroy=false] - Call `destroy` on each member as it's removed from this set.
    */
    removeAll: function (destroy) {

        if (destroy === undefined) { destroy = false; }

        var i = this.list.length;

        while (i--)
        {
            if (this.list[i])
            {
                var item = this.remove(this.list[i]);

                if (destroy)
                {
                    item.destroy();
                }
            }
        }

        this.position = 0;
        this.list = [];

    }

};

/**
* Number of items in the ArraySet. Same as `list.length`.
*
* @name Phaser.ArraySet#total
* @property {integer} total
*/
Object.defineProperty(Phaser.ArraySet.prototype, "total", {

    get: function () {
        return this.list.length;
    }

});

/**
* Returns the first item and resets the cursor to the start.
*
* @name Phaser.ArraySet#first
* @property {any} first
*/
Object.defineProperty(Phaser.ArraySet.prototype, "first", {

    get: function () {

        this.position = 0;

        if (this.list.length > 0)
        {
            return this.list[0];
        }
        else
        {
            return null;
        }

    }

});

/**
* Returns the the next item (based on the cursor) and advances the cursor.
*
* @name Phaser.ArraySet#next
* @property {any} next
*/
Object.defineProperty(Phaser.ArraySet.prototype, "next", {

    get: function () {

        if (this.position < this.list.length)
        {
            this.position++;

            return this.list[this.position];
        }
        else
        {
            return null;
        }

    }

});

Phaser.ArraySet.prototype.constructor = Phaser.ArraySet;

/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2016 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

/**
* Utility functions for dealing with Arrays.
*
* @class Phaser.ArrayUtils
* @static
*/
Phaser.ArrayUtils = {

    /**
    * Fetch a random entry from the given array.
    *
    * Will return null if there are no array items that fall within the specified range
    * or if there is no item for the randomly chosen index.
    *
    * @method
    * @param {any[]} objects - An array of objects.
    * @param {integer} startIndex - Optional offset off the front of the array. Default value is 0, or the beginning of the array.
    * @param {integer} length - Optional restriction on the number of values you want to randomly select from.
    * @return {object} The random object that was selected.
    */
    getRandomItem: function (objects, startIndex, length) {

        if (objects === null) { return null; }
        if (startIndex === undefined) { startIndex = 0; }
        if (length === undefined) { length = objects.length; }

        var randomIndex = startIndex + Math.floor(Math.random() * length);

        return objects[randomIndex] === undefined ? null : objects[randomIndex];

    },

    /**
    * Removes a random object from the given array and returns it.
    *
    * Will return null if there are no array items that fall within the specified range
    * or if there is no item for the randomly chosen index.
    *
    * @method
    * @param {any[]} objects - An array of objects.
    * @param {integer} startIndex - Optional offset off the front of the array. Default value is 0, or the beginning of the array.
    * @param {integer} length - Optional restriction on the number of values you want to randomly select from.
    * @return {object} The random object that was removed.
    */
    removeRandomItem: function (objects, startIndex, length) {

        if (objects == null) { // undefined or null
            return null;
        }

        if (startIndex === undefined) { startIndex = 0; }
        if (length === undefined) { length = objects.length; }

        var randomIndex = startIndex + Math.floor(Math.random() * length);
        if (randomIndex < objects.length)
        {
            var removed = objects.splice(randomIndex, 1);
            return removed[0] === undefined ? null : removed[0];
        }
        else
        {
            return null;
        }

    },

    /**
    * A standard Fisher-Yates Array shuffle implementation which modifies the array in place.
    *
    * @method
    * @param {any[]} array - The array to shuffle.
    * @return {any[]} The original array, now shuffled.
    */
    shuffle: function (array) {

        for (var i = array.length - 1; i > 0; i--)
        {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }

        return array;

    },

    /**
    * Transposes the elements of the given matrix (array of arrays).
    *
    * @method
    * @param {Array<any[]>} array - The matrix to transpose.
    * @return {Array<any[]>} A new transposed matrix
    */
    transposeMatrix: function (array) {

        var sourceRowCount = array.length;
        var sourceColCount = array[0].length;

        var result = new Array(sourceColCount);

        for (var i = 0; i < sourceColCount; i++)
        {
            result[i] = new Array(sourceRowCount);

            for (var j = sourceRowCount - 1; j > -1; j--)
            {
                result[i][j] = array[j][i];
            }
        }

        return result;

    },

    /**
    * Rotates the given matrix (array of arrays).
    *
    * Based on the routine from {@link http://jsfiddle.net/MrPolywhirl/NH42z/}.
    *
    * @method
    * @param {Array<any[]>} matrix - The array to rotate; this matrix _may_ be altered.
    * @param {number|string} direction - The amount to rotate: the rotation in degrees (90, -90, 270, -270, 180) or a string command ('rotateLeft', 'rotateRight' or 'rotate180').
    * @return {Array<any[]>} The rotated matrix. The source matrix should be discarded for the returned matrix.
    */
    rotateMatrix: function (matrix, direction) {

        if (typeof direction !== 'string')
        {
            direction = ((direction % 360) + 360) % 360;
        }

        if (direction === 90 || direction === -270 || direction === 'rotateLeft')
        {
            matrix = Phaser.ArrayUtils.transposeMatrix(matrix);
            matrix = matrix.reverse();
        }
        else if (direction === -90 || direction === 270 || direction === 'rotateRight')
        {
            matrix = matrix.reverse();
            matrix = Phaser.ArrayUtils.transposeMatrix(matrix);
        }
        else if (Math.abs(direction) === 180 || direction === 'rotate180')
        {
            for (var i = 0; i < matrix.length; i++)
            {
                matrix[i].reverse();
            }

            matrix = matrix.reverse();
        }

        return matrix;

    },

    /**
    * Snaps a value to the nearest value in an array.
    * The result will always be in the range `[first_value, last_value]`.
    *
    * @method
    * @param {number} value - The search value
    * @param {number[]} arr - The input array which _must_ be sorted.
    * @return {number} The nearest value found.
    */
    findClosest: function (value, arr) {

        if (!arr.length)
        {
            return NaN;
        }
        else if (arr.length === 1 || value < arr[0])
        {
            return arr[0];
        }

        var i = 1;
        while (arr[i] < value) {
            i++;
        }

        var low = arr[i - 1];
        var high = (i < arr.length) ? arr[i] : Number.POSITIVE_INFINITY;

        return ((high - value) <= (value - low)) ? high : low;

    },

    /**
    * Moves the element from the end of the array to the start, shifting all items in the process.
    * The "rotation" happens to the right.
    *
    * Before: `[ A, B, C, D, E, F ]`
    * After: `[ F, A, B, C, D, E ]`
    * 
    * See also Phaser.ArrayUtils.rotateLeft.
    *
    * @method Phaser.ArrayUtils.rotateRight
    * @param {any[]} array - The array to rotate. The array is modified.
    * @return {any} The shifted value.
    */
    rotateRight: function (array) {

        var s = array.pop();
        array.unshift(s);

        return s;

    },

    /**
    * Moves the element from the start of the array to the end, shifting all items in the process.
    * The "rotation" happens to the left.
    *
    * Before: `[ A, B, C, D, E, F ]`
    * After: `[ B, C, D, E, F, A ]`
    * 
    * See also Phaser.ArrayUtils.rotateRight
    *
    * @method Phaser.ArrayUtils.rotateLeft
    * @param {any[]} array - The array to rotate. The array is modified.
    * @return {any} The rotated value.
    */
    rotateLeft: function (array) {

        var s = array.shift();
        array.push(s);

        return s;

    },

    /**
    * Moves the element from the start of the array to the end, shifting all items in the process.
    * The "rotation" happens to the left.
    *
    * Before: `[ A, B, C, D, E, F ]`
    * After: `[ B, C, D, E, F, A ]`
    * 
    * See also Phaser.ArrayUtils.rotateRight
    *
    * @method Phaser.ArrayUtils.rotate
    * @deprecated Please use Phaser.ArrayUtils.rotate instead.
    * @param {any[]} array - The array to rotate. The array is modified.
    * @return {any} The rotated value.
    */
    rotate: function (array) {

        var s = array.shift();
        array.push(s);

        return s;

    },

    /**
    * Create an array representing the inclusive range of numbers (usually integers) in `[start, end]`.
    * This is equivalent to `numberArrayStep(start, end, 1)`.
    *
    * @method Phaser.ArrayUtils#numberArray
    * @param {number} start - The minimum value the array starts with.
    * @param {number} end - The maximum value the array contains.
    * @return {number[]} The array of number values.
    */
    numberArray: function (start, end) {

        var result = [];

        for (var i = start; i <= end; i++)
        {
            result.push(i);
        }

        return result;

    },

    /**
    * Create an array of numbers (positive and/or negative) progressing from `start`
    * up to but not including `end` by advancing by `step`.
    *
    * If `start` is less than `end` a zero-length range is created unless a negative `step` is specified.
    *
    * Certain values for `start` and `end` (eg. NaN/undefined/null) are currently coerced to 0;
    * for forward compatibility make sure to pass in actual numbers.
    *
    * @method Phaser.ArrayUtils#numberArrayStep
    * @param {number} start - The start of the range.
    * @param {number} [end] - The end of the range.
    * @param {number} [step=1] - The value to increment or decrement by.
    * @returns {Array} Returns the new array of numbers.
    * @example
    * Phaser.ArrayUtils.numberArrayStep(4);
    * // => [0, 1, 2, 3]
    *
    * Phaser.ArrayUtils.numberArrayStep(1, 5);
    * // => [1, 2, 3, 4]
    *
    * Phaser.ArrayUtils.numberArrayStep(0, 20, 5);
    * // => [0, 5, 10, 15]
    *
    * Phaser.ArrayUtils.numberArrayStep(0, -4, -1);
    * // => [0, -1, -2, -3]
    *
    * Phaser.ArrayUtils.numberArrayStep(1, 4, 0);
    * // => [1, 1, 1]
    *
    * Phaser.ArrayUtils.numberArrayStep(0);
    * // => []
    */
    numberArrayStep: function (start, end, step) {

        if (start === undefined || start === null) { start = 0; }

        if (end === undefined || end === null)
        {
            end = start;
            start = 0;
        }

        if (step === undefined) { step = 1; }

        var result = [];
        var total = Math.max(Phaser.Math.roundAwayFromZero((end - start) / (step || 1)), 0);

        for (var i = 0; i < total; i++)
        {
            result.push(start);
            start += step;
        }

        return result;

    }

};

/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2016 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

/**
* A basic Linked List data structure.
*
* This implementation _modifies_ the `prev` and `next` properties of each item added:
* - The `prev` and `next` properties must be writable and should not be used for any other purpose.
* - Items _cannot_ be added to multiple LinkedLists at the same time.
* - Only objects can be added.
*
* @class Phaser.LinkedList
* @constructor
*/
Phaser.LinkedList = function () {

    /**
    * Next element in the list.
    * @property {object} next
    * @default
    */
    this.next = null;

    /**
    * Previous element in the list.
    * @property {object} prev
    * @default
    */
    this.prev = null;

    /**
    * First element in the list.
    * @property {object} first
    * @default
    */
    this.first = null;

    /**
    * Last element in the list.
    * @property {object} last
    * @default
    */
    this.last = null;

    /**
    * Number of elements in the list.
    * @property {integer} total
    * @default
    */
    this.total = 0;

};

Phaser.LinkedList.prototype = {

    /**
    * Adds a new element to this linked list.
    *
    * @method Phaser.LinkedList#add
    * @param {object} item - The element to add to this list. Can be a Phaser.Sprite or any other object you need to quickly iterate through.
    * @return {object} The item that was added.
    */
    add: function (item) {

        //  If the list is empty
        if (this.total === 0 && this.first === null && this.last === null)
        {
            this.first = item;
            this.last = item;
            this.next = item;
            item.prev = this;
            this.total++;
            return item;
        }

        //  Gets appended to the end of the list, regardless of anything, and it won't have any children of its own (non-nested list)
        this.last.next = item;

        item.prev = this.last;

        this.last = item;

        this.total++;

        return item;

    },

    /**
    * Resets the first, last, next and previous node pointers in this list.
    *
    * @method Phaser.LinkedList#reset
    */
    reset: function () {

        this.first = null;
        this.last = null;
        this.next = null;
        this.prev = null;
        this.total = 0;

    },

    /**
    * Removes the given element from this linked list if it exists.
    *
    * @method Phaser.LinkedList#remove
    * @param {object} item - The item to be removed from the list.
    */
    remove: function (item) {

        if (this.total === 1)
        {
            this.reset();
            item.next = item.prev = null;
            return;
        }

        if (item === this.first)
        {
            // It was 'first', make 'first' point to first.next
            this.first = this.first.next;
        }
        else if (item === this.last)
        {
            // It was 'last', make 'last' point to last.prev
            this.last = this.last.prev;
        }

        if (item.prev)
        {
            // make item.prev.next point to childs.next instead of item
            item.prev.next = item.next;
        }

        if (item.next)
        {
            // make item.next.prev point to item.prev instead of item
            item.next.prev = item.prev;
        }

        item.next = item.prev = null;

        if (this.first === null )
        {
            this.last = null;
        }

        this.total--;

    },

    /**
    * Calls a function on all members of this list, using the member as the context for the callback.
    * The function must exist on the member.
    *
    * @method Phaser.LinkedList#callAll
    * @param {function} callback - The function to call.
    */
    callAll: function (callback) {

        if (!this.first || !this.last)
        {
            return;
        }

        var entity = this.first;

        do
        {
            if (entity && entity[callback])
            {
                entity[callback].call(entity);
            }

            entity = entity.next;

        }
        while (entity !== this.last.next);

    }

};

Phaser.LinkedList.prototype.constructor = Phaser.LinkedList;
