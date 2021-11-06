import * as numbers from "./magic_numbers";
import * as _ from "lodash";

/** Default font name */
export const FONT_NAME = "gs-bmp-font";
/** Italic font name */
export const ITALIC_FONT_NAME = "gs-italic-bmp-font";

/** Element keys */
export enum elements {
    VENUS = "venus",
    MERCURY = "mercury",
    MARS = "mars",
    JUPITER = "jupiter",
    NO_ELEMENT = "no_element",
    ALL_ELEMENTS = "all_elements",
}

/** Default elements order */
export const ordered_elements = [elements.VENUS, elements.MERCURY, elements.MARS, elements.JUPITER];

/** Element names */
export const element_names = {
    [elements.VENUS]: "Earth",
    [elements.MERCURY]: "Water",
    [elements.MARS]: "Fire",
    [elements.JUPITER]: "Wind",
    [elements.ALL_ELEMENTS]: "All elements",
};

/** Element colors */
export const element_colors = {
    [elements.VENUS]: 0xfef116,
    [elements.MERCURY]: 0x0ad2ef,
    [elements.MARS]: 0xf87000,
    [elements.JUPITER]: 0xe070b0,
};

/** Element colors in battle */
export const element_colors_in_battle = {
    [elements.VENUS]: 0xf8f848,
    [elements.MERCURY]: 0x80f8f8,
    [elements.MARS]: 0xf87038,
    [elements.JUPITER]: 0xf7adf7,
    [elements.NO_ELEMENT]: 0xc6c6c6,
};

/** 8-Directional direction values */
export enum directions {
    right = 0,
    down_right = 1,
    down = 2,
    down_left = 3,
    left = 4,
    up_left = 5,
    up = 6,
    up_right = 7,
}

/** 8-Directional direction keys */
export const reverse_directions = {
    [directions.right]: "right",
    [directions.up_right]: "up_right",
    [directions.up]: "up",
    [directions.up_left]: "up_left",
    [directions.left]: "left",
    [directions.down_left]: "down_left",
    [directions.down]: "down",
    [directions.down_right]: "down_right",
};

/** Base actions of a controllable char */
export enum base_actions {
    IDLE = "idle",
    WALK = "walk",
    DASH = "dash",
    PUSH = "push",
    CLIMB = "climb",
    CAST = "cast",
    JUMP = "jump",
    BATTLE = "battle",
    GRANT = "grant",
    ROPE = "rope",
}

/**
 * Generate a mask for the given direction.
 * Examples:
 *  - The given direction is left, which is 4, then this function will return: 00010000
 *  - The given direction is right, which is 0, then this function will return: 00000001
 * @param direction The direction to generate the mask.
 * @returns Returns the mask.
 */
export function get_direction_mask(direction: directions) {
    if (direction === null) return 0;
    return direction === 0 ? 1 : 2 << (direction - 1);
}

/**
 * Returns the direction values for diagonal directions
 * Example: Input: 7 (up_right) / Output: [6,0]
 * @param direction Diagonal direction value
 * @returns Array with split direction values
 */
export function split_direction(direction: directions) {
    if (direction % 2 === 0) return [direction];
    const vals: directions[] = new Array(2);
    vals[0] = direction === directions.right ? directions.up_right : direction - 1;
    vals[1] = direction === directions.up_right ? directions.right : direction + 1;
    return vals;
}

/**
 * Returns the diagonal value for its component directions
 * Example: Input: 6, 0 (up, right) / Output: 7 (up_right)
 *
 * @param {number} dir_1 - Direction values
 * @param {number} dir_2 - Direction values
 * @return {number} Diagonal direction value
 */
export function join_directions(dir_1: directions, dir_2: directions): directions {
    dir_2 = dir_1 === directions.up && dir_2 === directions.right ? 8 : dir_2;
    return Math.min(dir_1, dir_2) + 1;
}

/**
 * Given a direction, returns this direction and its adjacent directions.
 * @param direction the direction value.
 * @returns Returns the range of the given direction.
 */
export function direction_range(direction: directions): directions[] {
    return [(direction + 7) % 8, direction, (direction + 1) % 8];
}

/**
 * Returns a random number from 0 to 4.
 * @returns  Random number from 0 to 4
 */
export function variation() {
    return _.random(0, 4);
}

/**
 * Places the angle (radians) in the [0,2*PI[ range.
 * @param angle any angle in radians.
 * @returns Angle in the [0,2*PI[ range.
 */
export function range_360(angle: number) {
    angle = angle % numbers.degree360;
    angle = angle < 0 ? angle + numbers.degree360 : angle;
    return angle;
}

/**
 * Returns the opposite of the given direction.
 * @param direction Direction value
 * @returns Opposite direction value
 */
export function get_opposite_direction(direction: directions): directions {
    return (direction + 4) % 8;
}

/**
 * Transforms a direction into a non diagonal direction.
 * @param direction the input direction.
 * @returns returns the non diagonal direction.
 */
export function get_non_diagonal_direction(direction: directions) {
    return (direction % 2 ? direction + 1 : direction) % 8;
}

/**
 * Gets the directions between the current direction and a desired/target direction.
 * Example of transition between left and right: left -> up left -> up -> up right -> right.
 * @param current_direction Current direction value
 * @param desired_direction Desired/Target direction value
 * @returns The direction value to apply
 */
export function get_transition_directions(current_direction: directions, desired_direction: directions): directions {
    const diff = desired_direction - current_direction;
    if (diff === 0) return current_direction;
    const sign = diff === 4 ? -1 : Math.sign(diff);
    return (current_direction + (Math.abs(diff) >= 4 ? -sign : sign) + 8) % 8;
}

/**
 * Gets the direction of a given vector.
 * @param x1 x source pos.
 * @param x2 x dest pos.
 * @param y1 y source pos.
 * @param y2 y dest pos.
 * @returns The direction of the given vector.
 */
export function get_vector_direction(x1: number, x2: number, y1: number, y2: number): directions {
    const angle = range_360(Math.atan2(y2 - y1, x2 - x1));
    return (((8 * (angle + numbers.degree45_half)) / numbers.degree360) | 0) % 8;
}

/**
 * Given a direction and a current position, returns the next front position.
 * @param x_pos x tile position.
 * @param y_pos y tile position.
 * @param direction the direction that's going towards.
 * @param strict_cardinal if true, returns null on diagonal input. Otherwise, returns input as is.
 * @returns the front position.
 */
export function get_front_position(
    x_pos: number,
    y_pos: number,
    direction: directions,
    strict_cardinal: boolean = true
) {
    switch (direction) {
        case directions.up:
            --y_pos;
            break;
        case directions.down:
            ++y_pos;
            break;
        case directions.right:
            ++x_pos;
            break;
        case directions.left:
            --x_pos;
            break;
        default:
            if (strict_cardinal) {
                return null;
            }
    }
    return {
        x: x_pos,
        y: y_pos,
    };
}

/**
 * Obtains the text width in pixels (INEFFICIENT).
 * @param game the Phaser.Game instance
 * @param text the text string to measure width
 * @param italic whether the text is in italic
 * @returns
 */
export function get_text_width(game: Phaser.Game, text: string, italic = false) {
    //get text width in px (dirty way)
    const font_name = italic ? ITALIC_FONT_NAME : FONT_NAME;
    const text_sprite = game.add.bitmapText(0, 0, font_name, text, numbers.FONT_SIZE);
    const text_width = text_sprite.width;
    text_sprite.destroy();
    return text_width;
}

/**
 * Either kills or destroys each sprite in the group
 * @param group The parent group
 * @param destroy If true, child is destroyed instead
 */
export function kill_all_sprites(group, destroy = false) {
    group.children.forEach(child => {
        if (destroy) child.parent.remove(child, true);
        else child.kill();
    });
}

/**
 * Gets the center position of a tile in pixels.
 * @param tile_pos the tile position.
 * @param tile_size the tile size.
 * @returns centered tile position in pixels.
 */
export function get_centered_pos_in_px(tile_pos: number, tile_size: number) {
    return tile_pos * tile_size + (tile_size >> 1);
}

/**
 * Gets the tile position of a given position in px.
 * @param pos the position in px.
 * @param tile_size the tile size.
 * @returns returns the tile position.
 */
export function get_tile_position(pos: number, tile_size: number) {
    return (pos / tile_size) | 0;
}

/**
 * Gets the px position of a given position in tile.
 * @param pos the position in tile.
 * @param tile_size the tile size.
 * @returns returns the px position.
 */
export function get_px_position(tile_pos: number, tile_size: number) {
    return tile_pos * tile_size;
}

/**
 * Calculates the distance between two points.
 * @param x1 source x position.
 * @param x2 dest x position.
 * @param y1 source y position.
 * @param y2 dest y position.
 * @param square_root if false, returns the distance to the square.
 * @returns return the distance value.
 */
export function get_distance(x1: number, x2: number, y1: number, y2: number, square_root: boolean = true) {
    const sqr_distance = Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2);
    if (square_root) {
        return Math.sqrt(sqr_distance);
    } else {
        return sqr_distance;
    }
}

/**
 * Returns the surrounding positions. Diagonals are optional.
 * @param x the x reference position.
 * @param y the y reference position.
 * @param with_diagonals if true, includes diagonals.
 * @param shift how distant if the surrounding positions from the given position.
 * @returns Returns the surrounding positions.
 */
export function get_surroundings(x: number, y: number, with_diagonals = false, shift = 1) {
    let surroundings = [
        {x: x - shift, y: y, diag: false, direction: directions.left},
        {x: x + shift, y: y, diag: false, direction: directions.right},
        {x: x, y: y - shift, diag: false, direction: directions.up},
        {x: x, y: y + shift, diag: false, direction: directions.down},
    ];
    if (with_diagonals) {
        surroundings = surroundings.concat([
            {x: x - shift, y: y - shift, diag: true, direction: directions.up_left},
            {x: x + shift, y: y - shift, diag: true, direction: directions.up_right},
            {x: x - shift, y: y + shift, diag: true, direction: directions.down_left},
            {x: x + shift, y: y + shift, diag: true, direction: directions.down_right},
        ]);
    }
    return surroundings;
}

/**
 * Lists all directions, diagonals optional.
 * @param with_diagonals If true, includes diagonals.
 * @returns Returns the directions.
 */
export function get_directions(with_diagonals = false) {
    const dirs = [directions.up, directions.down, directions.left, directions.right];
    if (with_diagonals) {
        dirs.push(...[directions.up_left, directions.up_right, directions.down_left, directions.down_right]);
    }
    return dirs;
}

/**
 * Converts a color from hex to rgb.
 * @param hex the color in hex format.
 * @returns the color in rgb format.
 */
export function hex2rgb(hex: string | number) {
    if (typeof hex === "string") {
        hex = hex.replace(/^\s*#|\s*$/g, "");
    } else {
        hex = hex.toString(16);
    }
    if (hex.length == 3) {
        hex = hex.replace(/(.)/g, "$1$1");
    } else {
        hex = ("000000" + hex).slice(-6);
    }
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return {r: r, g: g, b: b};
}

/**
 * Changes the brightness of a given color code.
 * @param hex the input color in hex.
 * @param percent how much the brightness should change.
 * @returns returns the new color in hex.
 */
export function change_brightness(hex: string | number, percent: number) {
    let {r, g, b} = hex2rgb(hex);
    let h, s, v;
    [h, s, v] = rgb2hsv(r, g, b);
    v = (v * percent) | 0;
    [r, g, b] = hsv2rgb(h, s, v);

    hex = ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    return parseInt(hex, 16);
}

/**
 * Transforms RGB color into HSV color.
 * @param r red channel color value [0, 255]
 * @param g green channel color value [0, 255]
 * @param b blue channel color value [0, 255]
 * @returns returns the color in HSV
 */
export function rgb2hsv(r: number, g: number, b: number) {
    const v = Math.max(r, g, b),
        n = v - Math.min(r, g, b);
    const h = n && (v === r ? (g - b) / n : v === g ? 2 + (b - r) / n : 4 + (r - g) / n);
    return [60 * (h < 0 ? h + 6 : h), v && n / v, v];
}

/**
 * Transforms HSV color into RGB color
 * @param h hue channel color value
 * @param s saturation channel color value
 * @param v value channel color value
 * @returns returns the color in RGB
 */
export function hsv2rgb(h: number, s: number, v: number) {
    let f = (n, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
    return [f(5), f(3), f(1)];
}

/**
 * Creates a collision polygon.
 * @param width Width of the body
 * @param shift Shift value
 * @param bevel Body's bevel value
 * @returns Returns a list of coodinates of the polygon.
 */
export function mount_collision_polygon(width: number, shift: number, bevel: number = 0) {
    return [
        [bevel + shift, shift],
        ...(bevel === 0 ? [] : [[width - bevel + shift, shift]]),
        [width + shift, bevel + shift],
        ...(bevel === 0 ? [] : [[width + shift, width - bevel + shift]]),
        [width - bevel + shift, width + shift],
        ...(bevel === 0 ? [] : [[bevel + shift, width + shift]]),
        [shift, width - bevel + shift],
        ...(bevel === 0 ? [] : [[shift, bevel + shift]]),
    ];
}

/**
 * Standard Normal variate using Box-Muller transform. Mean = 0, variance = 1.
 * @returns returns a normal pseudo-random number.
 */
export function random_normal() {
    let u = 0,
        v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Convert a string to a `PIXI.blendModes` enum value
 * @param blendMode Desired blend mode string
 * @returns returns a `PIXI.blendModes` enum value
 */
export function parse_blend_mode(blendMode: string) {
    return (PIXI.blendModes[blendMode] as unknown) as PIXI.blendModes;
}
