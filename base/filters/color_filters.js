Phaser.Filter.ColorFilters = function (game) {
    Phaser.Filter.call(this, game);

    this.uniforms.gray = { type: '1f', value: 0.0 };
    this.uniforms.colorize = { type: '1f', value: -1.0 };
    this.uniforms.colorize_intensity = { type: '1f', value: 0.0 };
    this.uniforms.r_colorize = { type: '1f', value: 1.0 };
    this.uniforms.g_colorize = { type: '1f', value: 1.0 };
    this.uniforms.b_colorize = { type: '1f', value: 1.0 };
    this.uniforms.hue_adjust = { type: '1f', value: 0.0 };
    this.uniforms.r_tint = { type: '1f', value: -1.0 };
    this.uniforms.g_tint = { type: '1f', value: -1.0 };
    this.uniforms.b_tint = { type: '1f', value: -1.0 };
    this.uniforms.flame = { type: '1f', value: 0.0 };
    this.uniforms.min_input = { type: '1f', value: -1.0 };
    this.uniforms.max_input = { type: '1f', value: -1.0 };
    this.uniforms.gamma = { type: '1f', value: -1.0 };
    this.uniforms.r_blend = { type: '1f', value: -1.0 };
    this.uniforms.g_blend = { type: '1f', value: -1.0 };
    this.uniforms.b_blend = { type: '1f', value: -1.0 };

    this.fragmentSrc = [
        "precision mediump float;",

        "varying vec2       vTextureCoord;",
        "varying vec4       vColor;",
        "uniform sampler2D  uSampler;",
        "uniform float      gray;",
        "uniform float      colorize_intensity;",
        "uniform float      r_colorize;",
        "uniform float      g_colorize;",
        "uniform float      b_colorize;",
        "uniform float      hue_adjust;",
        "uniform float      r_tint;",
        "uniform float      g_tint;",
        "uniform float      b_tint;",
        "uniform float      flame;",
        "uniform float      min_input;",
        "uniform float      max_input;",
        "uniform float      gamma;",
        "uniform float      r_blend;",
        "uniform float      g_blend;",
        "uniform float      b_blend;",

        "vec3 gammaCorrect(vec3 color, float gamma, float alpha){",
            "return pow(color, alpha * vec3(1.0/gamma));",
        "}",

        "vec3 levelRange(vec3 color, float minInput, float maxInput, float alpha){",
            "return min(max(color - alpha*vec3(minInput), vec3(0.0)) / (vec3(maxInput) - vec3(minInput)), vec3(1.0));",
        "}",

        "vec3 finalLevels(vec3 color, float minInput, float gamma, float maxInput, float alpha){",
            "return gammaCorrect(levelRange(color, minInput, maxInput, alpha), gamma, alpha);",
        "}",

        "void main(void) {",
            "gl_FragColor = texture2D(uSampler, vTextureCoord);",
            "if (gray != 0.0) {",
                "gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.2126 * gl_FragColor.r + 0.7152 * gl_FragColor.g + 0.0722 * gl_FragColor.b), gray);",
            "}",

            "if (r_blend != -1.0 || g_blend != -1.0 || b_blend != -1.0) {",
                "gl_FragColor.rgb = finalLevels(gl_FragColor.rgb, min_input, gamma, max_input, gl_FragColor.a);",
            "}",

            "if (r_tint != -1.0 && g_tint != -1.0 && b_tint != -1.0) {",
                "gl_FragColor.rgb = vec3(r_tint * gl_FragColor.a, g_tint * gl_FragColor.a, b_tint * gl_FragColor.a);",
            "}",

            "if (flame == 1.0) {",
                "gl_FragColor.rgb = vec3(gl_FragColor.a, (gl_FragColor.r + gl_FragColor.g + gl_FragColor.b)/3.0, 0);",
            "}",

            "if (r_blend != -1.0 || g_blend != -1.0 || b_blend != -1.0) {",
                "gl_FragColor.rgb = vec3((gl_FragColor.r + gl_FragColor.a*r_blend)/2.0, (gl_FragColor.g + gl_FragColor.a*g_blend)/2.0, (gl_FragColor.b + gl_FragColor.a*b_blend)/2.0);",
            "}",

            "if (r_colorize != 1.0 || g_colorize != 1.0 || b_colorize != 1.0) {",
                "gl_FragColor.rgb = vec3(colorize_intensity * r_colorize * gl_FragColor.r + gl_FragColor.r * (1.0 - colorize_intensity), colorize_intensity * g_colorize * gl_FragColor.g + gl_FragColor.g * (1.0 - colorize_intensity), colorize_intensity * b_colorize * gl_FragColor.b + gl_FragColor.b * (1.0 - colorize_intensity));",
            "}",

            "if (hue_adjust != 0.0) {",
                "const vec3 k = vec3(0.57735, 0.57735, 0.57735);",
                "float cosAngle = cos(hue_adjust);",
                "gl_FragColor.rgb = vec3(gl_FragColor.rgb * cosAngle + cross(k, gl_FragColor.rgb) * sin(hue_adjust) + k * dot(k, gl_FragColor.rgb) * (1.0 - cosAngle));",
            "}",
        "}"
    ];
};

Phaser.Filter.ColorFilters.prototype = Object.create(Phaser.Filter.prototype);
Phaser.Filter.ColorFilters.prototype.constructor = Phaser.Filter.ColorFilters;
Phaser.Filter.ColorFilters.prototype.set_colorize_values = function(value) {
    if (value >= 0 && value < 1/6) {
        this.uniforms.r_colorize.value = value*6;
        this.uniforms.g_colorize.value = 0;
        this.uniforms.b_colorize.value = 1;
    } else if (value >= 1/6 && value < 2/6) {
        this.uniforms.r_colorize.value = 1;
        this.uniforms.g_colorize.value = 0;
        this.uniforms.b_colorize.value = -value*6 + 2;
    } else if (value >= 2/6 && value < 3/6) {
        this.uniforms.r_colorize.value = 1;
        this.uniforms.g_colorize.value = value*6 - 2;
        this.uniforms.b_colorize.value = 0;
    } else if (value >= 3/6 && value < 4/6) {
        this.uniforms.r_colorize.value = -value*6 + 4;
        this.uniforms.g_colorize.value = 1;
        this.uniforms.b_colorize.value = 0;
    } else if (value >= 4/6 && value < 5/6) {
        this.uniforms.r_colorize.value = 0;
        this.uniforms.g_colorize.value = 1;
        this.uniforms.b_colorize.value = value*6 - 4;
    }  else if (value >= 5/6 && value <= 1) {
        this.uniforms.r_colorize.value = 0;
        this.uniforms.g_colorize.value = -value*6 + 6;
        this.uniforms.b_colorize.value = 1;
    }
}

Object.defineProperty(Phaser.Filter.ColorFilters.prototype, 'gray', {
    get: function() {
        return this.uniforms.gray.value;
    },
    set: function(value) {
        this.uniforms.gray.value = value;
    }

});
Object.defineProperty(Phaser.Filter.ColorFilters.prototype, 'colorize_intensity', {
    get: function() {
        return this.uniforms.colorize_intensity.value;
    },
    set: function(value) {
        this.uniforms.colorize_intensity.value = value;
        this.set_colorize_values(this.uniforms.colorize.value);
    }
});
Object.defineProperty(Phaser.Filter.ColorFilters.prototype, 'colorize', {
    get: function() {
        return this.uniforms.colorize.value;
    },
    set: function(value) {
        if (value === -1) {
            this.uniforms.r_colorize.value = 1;
            this.uniforms.g_colorize.value = 1;
            this.uniforms.b_colorize.value = 1;
            return;
        }
        if (value < 0) value = 0;
        if (value > 1) value = 1;
        this.uniforms.colorize.value = value;
        this.set_colorize_values(value);
    }
});
Object.defineProperty(Phaser.Filter.ColorFilters.prototype, 'hue_adjust', {
    get: function() {
        return this.uniforms.hue_adjust.value;
    },
    set: function(value) {
        this.uniforms.hue_adjust.value = value;
    }
});
Object.defineProperty(Phaser.Filter.ColorFilters.prototype, 'tint', {
    get: function() {
        return [this.uniforms.r_tint.value, this.uniforms.g_tint.value, this.uniforms.b_tint.value];
    },
    set: function(value) {
        this.uniforms.r_tint.value = value[0];
        this.uniforms.g_tint.value = value[1];
        this.uniforms.b_tint.value = value[2];
    }
});
Object.defineProperty(Phaser.Filter.ColorFilters.prototype, 'flame', {
    get: function() {
        return Boolean(this.uniforms.flame.value);
    },
    set: function(value) {
        this.uniforms.flame.value = +value;
    }
});
Phaser.Filter.ColorFilters.prototype.set_levels = function(min_input, max_input, gamma) {
    this.uniforms.min_input.value = min_input;
    this.uniforms.max_input.value = max_input;
    this.uniforms.gamma.value = gamma;
};
Object.defineProperty(Phaser.Filter.ColorFilters.prototype, 'levels', {
    get: function() {
        return {
            min_input: this.uniforms.min_input.value,
            max_input: this.uniforms.max_input.value,
            gamma: this.uniforms.gamma.value
        }
    },
    set: function(value) {
        this.uniforms.min_input.value = value[0];
        this.uniforms.max_input.value = value[1];
        this.uniforms.gamma.value = value[2];
    }
});
Phaser.Filter.ColorFilters.prototype.set_color_blend = function(r, g, b) {
    this.uniforms.r_blend.value = r;
    this.uniforms.g_blend.value = g;
    this.uniforms.b_blend.value = b;
};
Object.defineProperty(Phaser.Filter.ColorFilters.prototype, 'color_blend', {
    get: function() {
        return [
            this.uniforms.r_blend.value,
            this.uniforms.g_blend.value,
            this.uniforms.b_blend.value
        ]
    },
    set: function(value) {
        this.uniforms.r_blend.value = value[0];
        this.uniforms.g_blend.value = value[1];
        this.uniforms.b_blend.value = value[2];
    }
});
