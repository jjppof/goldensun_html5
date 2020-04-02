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

export function get_text_width(game, text) {
    let text_sprite = game.add.bitmapText(0, 0, 'gs-bmp-font', text, numbers.FONT_SIZE);
    const text_width = text_sprite.width;
    text_sprite.destroy();
    return text_width;
}

export function set_dialog(game, text) {
    const max_efective_width = numbers.MAX_DIAG_WIN_WIDTH - 2 * numbers.WINDOW_PADDING_H - numbers.INSIDE_BORDER_WIDTH;
    let words = text.split(' ');
    let windows = [];
    let lines = [];
    let line = [];
    let line_width = 0;
    let window_width = max_efective_width;
    for (let i = 0; i < words.length; ++i) {
        const word = words[i];
        line_width = get_text_width(game, line.join(' ') + word);
        if (line_width >= window_width) {
            lines.push(line.join(' '));
            line = [];
            line.push(word);
            line_width = get_text_width(game, word);
            if (lines.length === numbers.MAX_LINES_PER_DIAG_WIN) {
                windows.push({
                    lines: lines.slice(),
                    width: window_width + 2 * numbers.WINDOW_PADDING_H + numbers.INSIDE_BORDER_WIDTH,
                    height: numbers.WINDOW_PADDING_TOP + numbers.WINDOW_PADDING_BOTTOM + lines.length * (numbers.FONT_SIZE + numbers.SPACE_BETWEEN_LINES) - numbers.SPACE_BETWEEN_LINES
                });
                lines = [];
            }
        } else {
            line.push(word);
        }
    }
    if (line.length) {
        lines.push(line.join(' '));
        windows.push({
            lines: lines.slice(),
            width: line_width + 2 * numbers.WINDOW_PADDING_H + numbers.INSIDE_BORDER_WIDTH,
            height: numbers.WINDOW_PADDING_TOP + numbers.WINDOW_PADDING_BOTTOM + lines.length * (numbers.FONT_SIZE + numbers.SPACE_BETWEEN_LINES) - numbers.SPACE_BETWEEN_LINES
        });
    };
    return windows;
}
