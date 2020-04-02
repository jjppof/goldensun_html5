import * as numbers from './magic_numbers.js';

export function u(array) {
    return array.join("_");
}

export function b(array) {
    return array.join("/");
}

export function checkMobile() { 
    if(
        navigator.userAgent.match(/Android/i)
        || navigator.userAgent.match(/webOS/i)
        || navigator.userAgent.match(/iPhone/i)
        || navigator.userAgent.match(/iPad/i)
        || navigator.userAgent.match(/iPod/i)
        || navigator.userAgent.match(/BlackBerry/i)
        || navigator.userAgent.match(/Windows Phone/i)
    )
        return true;
    else
        return false;
}

export function get_tiles_in_quadrant(quadrants, radius, range, x0, y0, tile_width, tile_height) {
    const range_radius = radius * range;
    let x1 = x0;
    let x2 = x0;
    let y1 = y0;
    let y2 = y0;
    if (quadrants.includes(1)) {
        x2 = x0 + Math.round(range_radius/tile_width);
        y2 = y0 - Math.round(range_radius/tile_height);
    }
    if (quadrants.includes(2)) {
        x1 = x0 - Math.round(range_radius/tile_width);
        y2 = y0 - Math.round(range_radius/tile_height);
    }
    if (quadrants.includes(3)) {
        x1 = x0 - Math.round(range_radius/tile_width);
        y1 = y0 + Math.round(range_radius/tile_height);
    }
    if (quadrants.includes(4)) {
        x2 = x0 + Math.round(range_radius/tile_width);
        y1 = y0 + Math.round(range_radius/tile_height);
    }
    const radius_squared = range_radius * range_radius;
    let result = [];
    for (let x = Math.min(x1, x2); x < Math.max(x1, x2); ++x) {
        for (let y = Math.min(y1, y2); y < Math.max(y1, y2); ++y) {
            let dx = (x - x0) * tile_width - radius;
            let dy = (y - y0) * tile_height - radius;
            let distanceSquared = dx * dx + dy * dy;
            if (distanceSquared <= radius_squared) {
                result.push({x: x, y: y});
            }
        }
    }
    return result;
}

export function get_nearby(actual_direction, x, y, tile_width, tile_height, range) {
    switch (actual_direction) {
        case "up":
            return get_tiles_in_quadrant([1, 2], numbers.HERO_BODY_RADIUS, range, x, y, tile_width, tile_height);
        case "up_right":
            return get_tiles_in_quadrant([1], numbers.HERO_BODY_RADIUS, range, x, y, tile_width, tile_height);
        case "right":
            return get_tiles_in_quadrant([1, 4], numbers.HERO_BODY_RADIUS, range, x, y, tile_width, tile_height);
        case "down_right":
            return get_tiles_in_quadrant([4], numbers.HERO_BODY_RADIUS, range, x, y, tile_width, tile_height);
        case "down":
            return get_tiles_in_quadrant([3, 4], numbers.HERO_BODY_RADIUS, range, x, y, tile_width, tile_height);
        case "down_left":
            return get_tiles_in_quadrant([3], numbers.HERO_BODY_RADIUS, range, x, y, tile_width, tile_height);
        case "left":
            return get_tiles_in_quadrant([2, 3], numbers.HERO_BODY_RADIUS, range, x, y, tile_width, tile_height);
        case "up_left":
            return get_tiles_in_quadrant([2], numbers.HERO_BODY_RADIUS, range, x, y, tile_width, tile_height);
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

export function split_msg(game, words, win_width) {
    let result = [];
    let actual_width = win_width - 2 * numbers.WINDOW_PADDING_H - numbers.INSIDE_BORDER_WIDTH;
    let bucket = [], width = 0;
    for (let i = 0; i < words.length; ++i) {
        let whitespace = i + 1 === words.length ? "" : " ";
        let text = game.add.bitmapText(0, 0, 'gs-bmp-font', words[i] + whitespace, numbers.FONT_SIZE);
        const this_width = text.width;
        width += this_width;
        text.destroy();
        if (width >= actual_width && i + 1 < words.length) {
            result.push(bucket);
            bucket = [words[i]];
            width = this_width;
        } else {
            bucket.push(words[i]);
        }
    }
    if (bucket.length) result.push(bucket);
    return result;
}

export function get_window_size_hint(game, text) {
    let text_sprite = game.add.bitmapText(0, 0, 'gs-bmp-font', text, numbers.FONT_SIZE);
    const text_width = text_sprite.width;
    text_sprite.destroy();
    const MAX_EFECTIVE_WIDTH = numbers.MAX_DIAG_WIN_WIDTH - 2 * numbers.WINDOW_PADDING_H - numbers.INSIDE_BORDER_WIDTH;
    let actual_width;
    if (text_width > MAX_EFECTIVE_WIDTH)
        actual_width = numbers.MAX_DIAG_WIN_WIDTH;
    else
        actual_width = text_width + 2 * numbers.WINDOW_PADDING_H + numbers.INSIDE_BORDER_WIDTH;
    const line_number = split_msg(game, text.split(' '), actual_width).length;
    const actual_height = 2 * numbers.WINDOW_PADDING_V + line_number * (numbers.FONT_SIZE + numbers.SPACE_BETWEEN_LINES) - numbers.SPACE_BETWEEN_LINES;
    return {width: actual_width, height: actual_height};
}
