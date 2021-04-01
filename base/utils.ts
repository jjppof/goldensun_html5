import * as numbers from "./magic_numbers";
import * as _ from "lodash";

/*Font names*/
export const FONT_NAME = "gs-bmp-font";
export const ITALIC_FONT_NAME = "gs-italic-bmp-font";

/*Element keys*/
export enum elements {
    VENUS = "venus",
    MERCURY = "mercury",
    MARS = "mars",
    JUPITER = "jupiter",
    NO_ELEMENT = "no_element",
    ALL_ELEMENTS = "all_elements",
}

/*Default elements order*/
export const ordered_elements = [elements.VENUS, elements.MERCURY, elements.MARS, elements.JUPITER];

/*Element names*/
export const element_names = {
    [elements.VENUS]: "Earth",
    [elements.MERCURY]: "Water",
    [elements.MARS]: "Fire",
    [elements.JUPITER]: "Wind",
    [elements.ALL_ELEMENTS]: "All elements",
};

/*Element colors*/
export const element_colors = {
    [elements.VENUS]: 0xfef116,
    [elements.MERCURY]: 0x0ad2ef,
    [elements.MARS]: 0xf87000,
    [elements.JUPITER]: 0xe070b0,
};

/*Element colors in battle*/
export const element_colors_in_battle = {
    [elements.VENUS]: 0xf8f848,
    [elements.MERCURY]: 0x80f8f8,
    [elements.MARS]: 0xf87038,
    [elements.JUPITER]: 0xf7adf7,
    [elements.NO_ELEMENT]: 0xc6c6c6,
};

/*8-Directional direction values*/
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

/*8-Directional direction keys*/
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
}

/*Returns the angle for an 8-Directional value
Works clockwise starting with "Right"

Input: direction [number]: 0-7, clockwise starting with "Right"

Output: [number] - Angle in radians*/
export function directions_angles(direction) {
    //clockwise from "right"
    return (direction * Math.PI) / 4;
}

export function get_direction_mask(direction: directions) {
    if (direction === null) return 0;
    return direction === 0 ? 1 : 2 << (direction - 1);
}

/*Returns the direction values for diagonal directions
Example: Input: 7 (up_right) / Output: [6,0]

Input: direction [number] - Diagonal direction value

Output: [array] - Array with split direction values*/
export function split_direction(direction: directions) {
    if (direction % 2 === 0) return [direction];
    const vals = new Array(2);
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
export function join_directions(dir_1, dir_2) {
    dir_2 = dir_1 === directions.up && dir_2 === directions.right ? 8 : dir_2;
    return Math.min(dir_1, dir_2) + 1;
}

export function direction_range(direction: directions) {
    switch (direction) {
        case directions.up:
            return [directions.up_left, directions.up, directions.up_right];
        case directions.down:
            return [directions.down_left, directions.down, directions.down_right];
        case directions.right:
            return [directions.up_right, directions.right, directions.down_right];
        case directions.left:
            return [directions.up_left, directions.left, directions.down_left];
    }
}

/*Returns a random number (0,4)

Output: [number] - Random number from 0 to 4*/
export function variation() {
    return _.random(0, 4);
}

/*Places the angle (radians) in the [0,2*PI] range

Input: angle [number] - Angle in radians
Output: [number] - Angle in the [0,2*PI] range*/
export function range_360(angle: number) {
    angle = angle % numbers.degree360;
    angle = angle < 0 ? angle + numbers.degree360 : angle;
    return angle;
}

/*Checks proximity in given quadrants

Input: quadrants [array] - Quadrants to check (array of number)
       radius [number] - Radius of the body
       range_factor [number] - Additional range factor
       x, y [number] - The body's coordinates
       target_x, target_y [number] - The target's coordinates

Output: [boolean]*/
export function is_inside_sector(quadrants, radius, range_factor, x, y, target_x, target_y) {
    const range_radius_squared = radius * range_factor * (radius * range_factor);
    const target_radius_squared = Math.pow(target_x - x, 2) + Math.pow(target_y - y, 2);
    const target_angle = range_360(Math.atan2(y - target_y, target_x - x));
    const angles = [0, numbers.degree90, Math.PI, numbers.degree270, numbers.degree360];
    let between_angles = false;
    for (let i = 0; i < quadrants.length; ++i) {
        let quadrant = quadrants[i];
        let start_angle = angles[quadrant - 1];
        let end_angle = angles[quadrant];
        between_angles = end_angle >= target_angle && target_angle >= start_angle;
        if (between_angles) break;
    }

    return target_radius_squared <= range_radius_squared && between_angles;
}

/*Checks proximity based on current direction

Input: current_direction [number] - The current direction
       x, y [number] - The body's coordinates
       target_x, target_y [number] - The target's coordinates
       range_factor [number] - Additional range factor

Output: [boolean]*/
export function is_close(current_direction, x, y, target_x, target_y, range_factor) {
    switch (current_direction) {
        case directions.up:
            return is_inside_sector([1, 2], numbers.HERO_BODY_RADIUS, range_factor, x, y, target_x, target_y);
        case directions.up_right:
            return is_inside_sector([1], numbers.HERO_BODY_RADIUS, range_factor, x, y, target_x, target_y);
        case directions.right:
            return is_inside_sector([1, 4], numbers.HERO_BODY_RADIUS, range_factor, x, y, target_x, target_y);
        case directions.down_right:
            return is_inside_sector([4], numbers.HERO_BODY_RADIUS, range_factor, x, y, target_x, target_y);
        case directions.down:
            return is_inside_sector([3, 4], numbers.HERO_BODY_RADIUS, range_factor, x, y, target_x, target_y);
        case directions.down_left:
            return is_inside_sector([3], numbers.HERO_BODY_RADIUS, range_factor, x, y, target_x, target_y);
        case directions.left:
            return is_inside_sector([2, 3], numbers.HERO_BODY_RADIUS, range_factor, x, y, target_x, target_y);
        case directions.up_left:
            return is_inside_sector([2], numbers.HERO_BODY_RADIUS, range_factor, x, y, target_x, target_y);
    }
}

/*Returns the opposite of the given direction

Input: direction [number] - Direction value

Output: [number] - Opposite direction value*/
export function get_opposite_direction(direction: directions) {
    return (direction + 4) % 8;
}

/*Apply the transition directions
Used when being forced to face a different direction

Input: current_direction [number] - Current direction value
       desired_direction [number] - Desired direction value

Output: [number] - The direction value to apply*/
export function get_transition_directions(current_direction: directions, desired_direction: directions) {
    const diff = desired_direction - current_direction;
    if (diff === 0) return current_direction;
    const sign = diff === 4 ? -1 : Math.sign(diff);
    return (current_direction + (Math.abs(diff) >= 4 ? -sign : sign) + 8) % 8;
}

/*Obtains the text width in pixels (INEFFICIENT)

Input: game [Phaser:Game] - Reference to the running game object
       text [string] - Text string*/
export function get_text_width(game, text, italic = false) {
    //get text width in px (dirty way)
    const font_name = italic ? ITALIC_FONT_NAME : FONT_NAME;
    let text_sprite = game.add.bitmapText(0, 0, font_name, text, numbers.FONT_SIZE);
    const text_width = text_sprite.width;
    text_sprite.destroy();
    return text_width;
}

/*Either kills or destroys each sprite in the group

Input: group [Phaser:Group] - The parent group
       destroy [boolean] - If true, child is destroyed instead.*/
export function kill_all_sprites(group, destroy = false) {
    group.children.forEach(child => {
        if (destroy) child.parent.remove(child, true);
        else child.kill();
    });
}

/*Returns the surrounding positions
Diagonals are optional

Input: x,y [number] - The body's position
       with_diagonals [boolean] - If true, includes diagonals
       shift [number] - Distance to check*/
export function get_surroundings(x, y, with_diagonals = false, shift = 1) {
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

/*Lists all directions, diagonals optional

Input: with_diagonals [boolean] - If true, includes diagonals*/
export function get_directions(with_diagonals = false) {
    const dirs = [directions.up, directions.down, directions.left, directions.right];
    if (with_diagonals) {
        dirs.push(...[directions.up_left, directions.up_right, directions.down_left, directions.down_right]);
    }
    return dirs;
}

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

/*Changes the brightness of a given color code

Input: hex [number] - Input color
       percent [number] - Brightness factor

Output [number] - Output color*/
export function change_brightness(hex, percent) {
    let {r, g, b} = hex2rgb(hex);
    let h, s, v;
    [h, s, v] = rgb2hsv(r, g, b);
    v = (v * percent) | 0;
    [r, g, b] = hsv2rgb(h, s, v);

    hex = ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    return parseInt(hex, 16);
}

/*Transform RGB color into HSV color

Input: r,g,b [number] - Red, Green, Blue channels

Output [array] - Hue, Saturation, Value channels (array of number)*/
export function rgb2hsv(r, g, b) {
    let v = Math.max(r, g, b),
        n = v - Math.min(r, g, b);
    let h = n && (v === r ? (g - b) / n : v === g ? 2 + (b - r) / n : 4 + (r - g) / n);
    return [60 * (h < 0 ? h + 6 : h), v && n / v, v];
}

/*Transform HSV color into RGB color

Input: h,s,v [number] - Hue, Saturation, Value channels

Output [array] - Red, Green, Blue (array of number)*/
export function hsv2rgb(h, s, v) {
    let f = (n, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
    return [f(5), f(3), f(1)];
}

/*Defines the collision polygon

Input: width [number] - Width of the body
       shift [number] - Shift value
       bevel [number] - Body's bevel value

Output: [array] - Multidimensional array with points*/
export function mount_collision_polygon(width, shift, bevel) {
    if (bevel === undefined) bevel = 0;
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
