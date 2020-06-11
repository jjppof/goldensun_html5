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

export function is_close(actual_direction, x, y, target_x, target_y, range_factor) {
    switch (actual_direction) {
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

export function get_transition_directions(actual_direction, desired_direction){
    return transitions[desired_direction][actual_direction];
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

export function get_surroundings(x, y, with_diagonals = false) {
    let surroundings = [
        {x: x - 1, y: y, diag: false},
        {x: x + 1, y: y, diag: false},
        {x: x, y: y - 1, diag: false},
        {x: x, y: y + 1, diag: false},
    ];
    if (with_diagonals) {
        surroundings = surroundings.concat([
            {x: x - 1, y: y - 1, diag: true},
            {x: x + 1, y: y - 1, diag: true},
            {x: x - 1, y: y + 1, diag: true},
            {x: x + 1, y: y + 1, diag: true},
        ]);
    }
    return surroundings;
};
