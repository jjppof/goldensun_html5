import * as numbers from './magic_numbers.js';

export function u(array) {
    return array.join("_");
}

export function b(array) {
    return array.join("/");
}

export function variation() {
    return parseInt(Math.random() * 3);
}

export function range_360(angle) {
    angle = angle % numbers.degree360;
    angle = angle < 0 ? angle + numbers.degree360 : angle;
    return angle;
}

export function is_inside_sector(quadrants, radius, range_factor, x, y, target_x, target_y) {
    const range_radius_squared = (radius * range_factor) * (radius * range_factor);
    const target_radius_quared = Math.pow(target_x - x, 2) + Math.pow(target_y - y, 2);

    let target_angle = Math.atan2(y - target_y, target_x - x);
    target_angle = (target_angle + (2*Math.PI))%(2*Math.PI);
    const angles = [0, Math.PI/2.0, Math.PI, 3.0*Math.PI/2.0, 2.0*Math.PI];
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
        case "up":
            return is_inside_sector([1, 2], numbers.HERO_BODY_RADIUS, range_factor, x, y, target_x, target_y);
        case "up_right":
            return is_inside_sector([1], numbers.HERO_BODY_RADIUS, range_factor, x, y, target_x, target_y);
        case "right":
            return is_inside_sector([1, 4], numbers.HERO_BODY_RADIUS, range_factor, x, y, target_x, target_y);
        case "down_right":
            return is_inside_sector([4], numbers.HERO_BODY_RADIUS, range_factor, x, y, target_x, target_y);
        case "down":
            return is_inside_sector([3, 4], numbers.HERO_BODY_RADIUS, range_factor, x, y, target_x, target_y);
        case "down_left":
            return is_inside_sector([3], numbers.HERO_BODY_RADIUS, range_factor, x, y, target_x, target_y);
        case "left":
            return is_inside_sector([2, 3], numbers.HERO_BODY_RADIUS, range_factor, x, y, target_x, target_y);
        case "up_left":
            return is_inside_sector([2], numbers.HERO_BODY_RADIUS, range_factor, x, y, target_x, target_y);
    };
}

export const transitions = {
    "up" : {
        "up" : "up",
        "down" : "down_left",
        "left" : "up_left",
        "right" : "up_right",
        "down_left" : "left",
        "down_right" : "right",
        "up_left" : "up",
        "up_right" : "up"
    },
    "down" : {
        "up" : "up_left",
        "down" : "down",
        "left" : "down_left",
        "right" : "down_right",
        "down_left" : "down",
        "down_right" : "down",
        "up_left" : "left",
        "up_right" : "right"
    },
    "left" : {
        "up" : "up_left",
        "down" : "down_left",
        "left" : "left",
        "right" : "up_right",
        "down_left" : "left",
        "down_right" : "down",
        "up_left" : "left",
        "up_right" : "up"
    },
    "right" : {
        "up" : "up_right",
        "down" : "down_right",
        "left" : "up_left",
        "right" : "right",
        "down_left" : "down",
        "down_right" : "right",
        "up_left" : "up",
        "up_right" : "right"
    },
    "down_left" : {
        "up" : "up_left",
        "down" : "down_left",
        "left" : "down_left",
        "right" : "down_right",
        "down_left" : "down_left",
        "down_right" : "down",
        "up_left" : "left",
        "up_right" : "up"
    },
    "down_right" : {
        "up" : "up_right",
        "down" : "down_right",
        "left" : "down_left",
        "right" : "down_right",
        "down_left" : "down",
        "down_right" : "down_right",
        "up_left" : "left",
        "up_right" : "right"
    },
    "up_left" : {
        "up" : "up_left",
        "down" : "down_left",
        "left" : "up_left",
        "right" : "up_right",
        "down_left" : "left",
        "down_right" : "right",
        "up_left" : "up_left",
        "up_right" : "up"
    },
    "up_right" : {
        "up" : "up_right",
        "down" : "down_right",
        "left" : "up_left",
        "right" : "up_right",
        "down_left" : "left",
        "down_right" : "right",
        "up_left" : "up",
        "up_right" : "up_right"
    },
};

export function get_opposite_direcion(direction) {
    switch (direction) {
        case "up": return "down";
        case "down": return "up";
        case "left": return "right";
        case "right": return "left";
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
    let result = true;
    ["up", "left", "down", "right"].forEach(direction => {
        result = result && !(cursors[direction].isDown ^ keys.includes(direction));
    });
    return result;
}

export function get_surroundings(x, y, with_diagonals = false, shift = 1) {
    let surroundings = [
        {x: x - shift, y: y, diag: false, direction: "left"},
        {x: x + shift, y: y, diag: false, direction: "right"},
        {x: x, y: y - shift, diag: false, direction: "up"},
        {x: x, y: y + shift, diag: false, direction: "down"},
    ];
    if (with_diagonals) {
        surroundings = surroundings.concat([
            {x: x - shift, y: y - shift, diag: true, direction: "up_left"},
            {x: x + shift, y: y - shift, diag: true, direction: "up_right"},
            {x: x - shift, y: y + shift, diag: true, direction: "down_left"},
            {x: x + shift, y: y + shift, diag: true, direction: "down_right"},
        ]);
    }
    return surroundings;
};

export function set_cast_direction(direction) {
    if (direction === "down_left") {
        direction = "left";
    } else if (direction === "up_left") {
        direction = "up";
    } else if (direction === "up_right") {
        direction = "right";
    } else if (direction === "down_right") {
        direction = "down";
    }
    return direction;
}

export function get_directions(with_diagonals = false) {
    let directions = ["up", "down", "left", "right"];
    if (with_diagonals) {
        directions.push(...["up_left", "up_right", "down_left", "down_right"]);
    }
    return directions;
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
    }
    let r = parseInt(hex.substr(0, 2), 16);
    let g = parseInt(hex.substr(2, 2), 16);
    let b = parseInt(hex.substr(4, 2), 16);

    let h, s, v;
    [h, s, v] = rgb2hsv(r, g, b);
    v = parseInt(v * percent);
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
