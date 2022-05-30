Phaser.Filter.ColorFilters = function (game) {
    Phaser.Filter.call(this, game);

    this.uniforms.colorize = { type: '1f', value: -1.0 };
    this.uniforms.colorize_intensity = { type: '1f', value: 0.0 };
    this.uniforms.r_colorize = { type: '1f', value: 1.0 };
    this.uniforms.g_colorize = { type: '1f', value: 1.0 };
    this.uniforms.b_colorize = { type: '1f', value: 1.0 };
    this.uniforms.flame = { type: '1f', value: 0.0 };

    this.fragmentSrc = [
        "precision mediump float;",

        "varying vec2       vTextureCoord;",
        "uniform sampler2D  uSampler;",
        "uniform float      colorize_intensity;",
        "uniform float      r_colorize;",
        "uniform float      g_colorize;",
        "uniform float      b_colorize;",
        "uniform float      flame;",

        "void main(void) {",
            "gl_FragColor = texture2D(uSampler, vTextureCoord);",

            "if (flame == 1.0) {",
                "gl_FragColor.rgb = vec3(gl_FragColor.a, (gl_FragColor.r + gl_FragColor.g + gl_FragColor.b)/3.0, 0);",
            "}",

            "if (r_colorize != 1.0 || g_colorize != 1.0 || b_colorize != 1.0) {",
                "gl_FragColor.rgb = vec3(colorize_intensity * r_colorize * gl_FragColor.r + gl_FragColor.r * (1.0 - colorize_intensity), colorize_intensity * g_colorize * gl_FragColor.g + gl_FragColor.g * (1.0 - colorize_intensity), colorize_intensity * b_colorize * gl_FragColor.b + gl_FragColor.b * (1.0 - colorize_intensity));",
            "}",
        "}"
    ];
};

Phaser.Filter.ColorFilters.prototype = Object.create(Phaser.Filter.prototype);
Phaser.Filter.ColorFilters.prototype.constructor = Phaser.Filter.ColorFilters;
Phaser.Filter.ColorFilters.prototype.key = "colorize";

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
Object.defineProperty(Phaser.Filter.ColorFilters.prototype, 'flame', {
    get: function() {
        return Boolean(this.uniforms.flame.value);
    },
    set: function(value) {
        this.uniforms.flame.value = +value;
    }
});
