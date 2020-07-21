import * as numbers from './magic_numbers.js';

export const directions = {
    right: 0,
    up_right: 7,
    up: 6,
    up_left: 5,
    left: 4,
    down_left: 3,
    down: 2,
    down_right: 1
};

export const reverse_directions = {
    [directions.right]: "right",
    [directions.up_right]: "up_right",
    [directions.up]: "up",
    [directions.up_left]: "up_left",
    [directions.left]: "left",
    [directions.down_left]: "down_left",
    [directions.down]: "down",
    [directions.down_right]: "down_right"
};

//rotation_key can convert from pressed_keys to the corresponding in-game rotation
export const rotation_key = [
    null,    //no keys pressed
    0,       //right
    4,       //left
    null,    //right and left
    6,       //up
    7,       //up and right
    5,       //up and left
    null,    //up, left, and right
    2,       //down
    1,       //down and right
    3,       //down and left
    null,    //down, left, and right
    null,    //down and up
    null,    //down, up, and right
    null,    //down, up, and left
    null,    //down, up, left, and right
]

//rotation_normal converts from normal_angle region (floor((angle-15)/30)) to in-game rotation
export const rotation_normal = [
    0,    //345-15 degrees
    7,    //15-45 degrees
    7,    //45-75 degrees
    6,    //75-105 degrees
    5,    //105-135 degrees
    5,    //135-165 degrees
    4,    //165-195 degrees
    3,    //195-225 degrees
    3,    //225-255 degrees
    2,    //255-285 degrees
    1,    //285-315 degrees
    1,    //315-345 degrees
]

export function update_arrow_inputs(data) {
    data.arrow_inputs = 
        1 & data.cursors.RIGHT.isDown 
        | 2 & data.cursors.LEFT.isDown 
        | 4 & data.cursors.UP.isDown 
        | 8 & data.cursors.DOWN.isDown
    data.current_direction = (rotation_key[data.arrow_inputs] === null)? data.current_direction : new_inputs
}

export function map_directions(arr) {
    if (arr === undefined) return arr;
    arr = Array.isArray(arr) ? arr : [arr];
    return arr.map(key => directions[key]);
}

export function split_direction(direction) {
    return reverse_directions[direction].split("_").map(key => directions[key]);
}

export function join_directions(dir_1, dir_2) {
    if ([directions.up, directions.down].includes(dir_1)) {
        return directions[reverse_directions[dir_1] + "_" + reverse_directions[dir_2]];
    } else {
        return directions[reverse_directions[dir_2] + "_" + reverse_directions[dir_1]];
    }
}

export function variation() {
    return _.random(0, 4);
}

export function range_360(angle) {
    angle = angle % numbers.degree360;
    angle = angle < 0 ? angle + numbers.degree360 : angle;
    return angle;
}

export function is_inside_sector(quadrants, radius, range_factor, x, y, target_x, target_y) {
    const range_radius_squared = (radius * range_factor) * (radius * range_factor);
    const target_radius_quared = Math.pow(target_x - x, 2) + Math.pow(target_y - y, 2);
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

    return target_radius_quared <= range_radius_squared && between_angles;
}

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
    };
}

export const transitions = {
    [directions.up] : {
        [directions.up] : directions.up,
        [directions.down] : directions.down_left,
        [directions.left] : directions.up_left,
        [directions.right] : directions.up_right,
        [directions.down_left] : directions.left,
        [directions.down_right] : directions.right,
        [directions.up_left] : directions.up,
        [directions.up_right] : directions.up
    },
    [directions.down] : {
        [directions.up] : directions.up_left,
        [directions.down] : directions.down,
        [directions.left] : directions.down_left,
        [directions.right] : directions.down_right,
        [directions.down_left] : directions.down,
        [directions.down_right] : directions.down,
        [directions.up_left] : directions.left,
        [directions.up_right] : directions.right
    },
    [directions.left] : {
        [directions.up] : directions.up_left,
        [directions.down] : directions.down_left,
        [directions.left] : directions.left,
        [directions.right] : directions.up_right,
        [directions.down_left] : directions.left,
        [directions.down_right] : directions.down,
        [directions.up_left] : directions.left,
        [directions.up_right] : directions.up
    },
    [directions.right] : {
        [directions.up] : directions.up_right,
        [directions.down] : directions.down_right,
        [directions.left] : directions.up_left,
        [directions.right] : directions.right,
        [directions.down_left] : directions.down,
        [directions.down_right] : directions.right,
        [directions.up_left] : directions.up,
        [directions.up_right] : directions.right
    },
    [directions.down_left] : {
        [directions.up] : directions.up_left,
        [directions.down] : directions.down_left,
        [directions.left] : directions.down_left,
        [directions.right] : directions.down_right,
        [directions.down_left] : directions.down_left,
        [directions.down_right] : directions.down,
        [directions.up_left] : directions.left,
        [directions.up_right] : directions.up
    },
    [directions.down_right] : {
        [directions.up] : directions.up_right,
        [directions.down] : directions.down_right,
        [directions.left] : directions.down_left,
        [directions.right] : directions.down_right,
        [directions.down_left] : directions.down,
        [directions.down_right] : directions.down_right,
        [directions.up_left] : directions.left,
        [directions.up_right] : directions.right
    },
    [directions.up_left] : {
        [directions.up] : directions.up_left,
        [directions.down] : directions.down_left,
        [directions.left] : directions.up_left,
        [directions.right] : directions.up_right,
        [directions.down_left] : directions.left,
        [directions.down_right] : directions.right,
        [directions.up_left] : directions.up_left,
        [directions.up_right] : directions.up
    },
    [directions.up_right] : {
        [directions.up] : directions.up_right,
        [directions.down] : directions.down_right,
        [directions.left] : directions.up_left,
        [directions.right] : directions.up_right,
        [directions.down_left] : directions.left,
        [directions.down_right] : directions.right,
        [directions.up_left] : directions.up,
        [directions.up_right] : directions.up_right
    },
};

export function get_opposite_direction(direction) {
    switch (direction) {
        case directions.up: return directions.down;
        case directions.down: return directions.up;
        case directions.left: return directions.right;
        case directions.right: return directions.left;
    }
}

export function get_transition_directions(current_direction, desired_direction){
    return transitions[desired_direction][current_direction];
}

export function get_text_width(game, text) { //get text width in px (dirty way)
    let text_sprite = game.add.bitmapText(0, 0, 'gs-bmp-font', text, numbers.FONT_SIZE);
    const text_width = text_sprite.width;
    text_sprite.destroy();
    return text_width;
}

export function check_isdown(cursors, ...keys) {
    return [directions.up, directions.left, directions.down, directions.right].every(direction => {
        return !(cursors[reverse_directions[direction]].isDown ^ keys.includes(direction));
    });
}

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
};

export function set_cast_direction(direction) {
    if (direction === directions.down_left) {
        direction = directions.left;
    } else if (direction === directions.up_left) {
        direction = directions.up;
    } else if (direction === directions.up_right) {
        direction = directions.right;
    } else if (direction === directions.down_right) {
        direction = directions.down;
    }
    return direction;
}

export function get_directions(with_diagonals = false) {
    let dirs = [directions.up, directions.down, directions.left, directions.right];
    if (with_diagonals) {
        dirs.push(...[directions.up_left, directions.up_right, directions.down_left, directions.down_right]);
    }
    return dirs;
}

export function capitalize(text) {
    return text[0].toUpperCase() + text.slice(1);
}

export function change_brightness(hex, percent) {
    if (typeof hex === 'string') {
        hex = hex.replace(/^\s*#|\s*$/g, '');
    } else {
        hex = hex.toString(16);
    }
    if (hex.length == 3) {
        hex = hex.replace(/(.)/g, '$1$1');
    } else {
        hex = ("000000" + hex).slice(-6);
    }
    let r = parseInt(hex.substr(0, 2), 16);
    let g = parseInt(hex.substr(2, 2), 16);
    let b = parseInt(hex.substr(4, 2), 16);

    let h, s, v;
    [h, s, v] = rgb2hsv(r, g, b);
    v = (v * percent) | 0;
    [r, g, b] = hsv2rgb(h, s, v);

    hex = ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    return parseInt(hex, 16);
}

export function rgb2hsv(r,g,b) {
    let v = Math.max(r,g,b), n = v-Math.min(r,g,b);
    let h = n && ((v === r) ? (g-b)/n : ((v === g) ? 2+(b-r)/n : 4+(r-g)/n)); 
    return [60*(h<0?h+6:h), v&&n/v, v];
}

export function hsv2rgb(h,s,v) {
    let f = (n,k=(n+h/60)%6) => v - v*s*Math.max( Math.min(k,4-k,1), 0);
    return [f(5),f(3),f(1)];
}

export function mount_collision_polygon(width, shift, bevel) {
    if (bevel === undefined) bevel = 0;
    return [
        [bevel + shift, shift],
        ... bevel === 0 ? [] : [[width - bevel + shift, shift]],
        [width + shift, bevel + shift],
        ... bevel === 0 ? [] : [[width + shift, width - bevel + shift]],
        [width - bevel + shift, width + shift],
        ... bevel === 0 ? [] : [[bevel + shift, width + shift]],
        [shift, width - bevel + shift],
        ... bevel === 0 ? [] : [[shift, bevel + shift]]
    ];
}
