Phaser.Filter.ColorFilters = function (game) {
    Phaser.Filter.call(this, game);

    this.uniforms.gray = { type: '1f', value: 0.0 };
    this.uniforms.colorize = { type: '1f', value: -1.0 };
    this.uniforms.colorize_intensity = { type: '1f', value: 1.0 };
    this.uniforms.r_colorize = { type: '1f', value: 1.0 };
    this.uniforms.g_colorize = { type: '1f', value: 1.0 };
    this.uniforms.b_colorize = { type: '1f', value: 1.0 };
    this.uniforms.hue_adjust = { type: '1f', value: 0.0 };

    this.fragmentSrc = [
        "precision mediump float;",

        "varying vec2       vTextureCoord;",
        "varying vec4       vColor;",
        "uniform sampler2D  uSampler;",
        "uniform float      gray;",
        "uniform float      r_colorize;",
        "uniform float      g_colorize;",
        "uniform float      b_colorize;",
        "uniform float      hue_adjust;",

        "void main(void) {",
            "gl_FragColor = texture2D(uSampler, vTextureCoord);",
            "gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.2126 * gl_FragColor.r + 0.7152 * gl_FragColor.g + 0.0722 * gl_FragColor.b), gray);",
            "gl_FragColor.rgb = vec3(r_colorize * gl_FragColor.r, g_colorize * gl_FragColor.g, b_colorize * gl_FragColor.b);",

            "const vec3  kRGBToYPrime = vec3 (0.299, 0.587, 0.114);",
            "const vec3  kRGBToI      = vec3 (0.596, -0.275, -0.321);",
            "const vec3  kRGBToQ      = vec3 (0.212, -0.523, 0.311);",
            "const vec3  kYIQToR     = vec3 (1.0, 0.956, 0.621);",
            "const vec3  kYIQToG     = vec3 (1.0, -0.272, -0.647);",
            "const vec3  kYIQToB     = vec3 (1.0, -1.107, 1.704);",
            "float   YPrime  = dot (gl_FragColor.rgb, kRGBToYPrime);",
            "float   I       = dot (gl_FragColor.rgb, kRGBToI);",
            "float   Q       = dot (gl_FragColor.rgb, kRGBToQ);",
            "float   hue     = atan (Q, I);",
            "float   chroma  = sqrt (I * I + Q * Q);",
            "hue += hue_adjust;",
            "Q = chroma * sin (hue);",
            "I = chroma * cos (hue);",
            "vec3    yIQ   = vec3 (YPrime, I, Q);",
            "gl_FragColor.rgb = vec3( dot (yIQ, kYIQToR), dot (yIQ, kYIQToG), dot (yIQ, kYIQToB) );",
        "}"
    ];
};

Phaser.Filter.ColorFilters.prototype = Object.create(Phaser.Filter.prototype);
Phaser.Filter.ColorFilters.prototype.constructor = Phaser.Filter.ColorFilters;
Phaser.Filter.ColorFilters.prototype.set_colorize_values = function(value) {
    if (value >= 0 && value < 1/6) {
        this.uniforms.r_colorize.value = (value*6).clamp(1 - this.uniforms.colorize_intensity.value, this.uniforms.colorize_intensity.value);
        this.uniforms.g_colorize.value = (0).clamp(1 - this.uniforms.colorize_intensity.value, this.uniforms.colorize_intensity.value);
        this.uniforms.b_colorize.value = (1).clamp(1 - this.uniforms.colorize_intensity.value, this.uniforms.colorize_intensity.value);
    } else if (value >= 1/6 && value < 2/6) {
        this.uniforms.r_colorize.value = (1).clamp(1 - this.uniforms.colorize_intensity.value, this.uniforms.colorize_intensity.value);
        this.uniforms.g_colorize.value = (0).clamp(1 - this.uniforms.colorize_intensity.value, this.uniforms.colorize_intensity.value);
        this.uniforms.b_colorize.value = (-value*6 + 2).clamp(1 - this.uniforms.colorize_intensity.value, this.uniforms.colorize_intensity.value);
    } else if (value >= 2/6 && value < 3/6) {
        this.uniforms.r_colorize.value = (1).clamp(1 - this.uniforms.colorize_intensity.value, this.uniforms.colorize_intensity.value);
        this.uniforms.g_colorize.value = (value*6 - 2).clamp(1 - this.uniforms.colorize_intensity.value, this.uniforms.colorize_intensity.value);
        this.uniforms.b_colorize.value = (0).clamp(1 - this.uniforms.colorize_intensity.value, this.uniforms.colorize_intensity.value);
    } else if (value >= 3/6 && value < 4/6) {
        this.uniforms.r_colorize.value = (-value*6 + 4).clamp(1 - this.uniforms.colorize_intensity.value, this.uniforms.colorize_intensity.value);
        this.uniforms.g_colorize.value = (1).clamp(1 - this.uniforms.colorize_intensity.value, this.uniforms.colorize_intensity.value);
        this.uniforms.b_colorize.value = (0).clamp(1 - this.uniforms.colorize_intensity.value, this.uniforms.colorize_intensity.value);
    } else if (value >= 4/6 && value < 5/6) {
        this.uniforms.r_colorize.value = (0).clamp(1 - this.uniforms.colorize_intensity.value, this.uniforms.colorize_intensity.value);
        this.uniforms.g_colorize.value = (1).clamp(1 - this.uniforms.colorize_intensity.value, this.uniforms.colorize_intensity.value);
        this.uniforms.b_colorize.value = (value*6 - 4).clamp(1 - this.uniforms.colorize_intensity.value, this.uniforms.colorize_intensity.value);
    }  else if (value >= 5/6 && value <= 1) {
        this.uniforms.r_colorize.value = (0).clamp(1 - this.uniforms.colorize_intensity.value, this.uniforms.colorize_intensity.value);
        this.uniforms.g_colorize.value = (-value*6 + 6).clamp(1 - this.uniforms.colorize_intensity.value, this.uniforms.colorize_intensity.value);
        this.uniforms.b_colorize.value = (1).clamp(1 - this.uniforms.colorize_intensity.value, this.uniforms.colorize_intensity.value);
    }
}

Number.prototype.clamp = function(min, max) {
    return Math.min(Math.max(this, min), max);
};

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
