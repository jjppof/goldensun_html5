Phaser.Filter.Colorize = function (game) {
    Phaser.Filter.call(this, game);

    this._color = -1.0;
    this.uniforms.intensity = { type: '1f', value: 0.0 };
    this.uniforms.r = { type: '1f', value: 1.0 };
    this.uniforms.g = { type: '1f', value: 1.0 };
    this.uniforms.b = { type: '1f', value: 1.0 };

    this.fragmentSrc = [
        "precision mediump float;",

        "varying vec2       vTextureCoord;",
        "uniform sampler2D  uSampler;",
        "uniform float      intensity;",
        "uniform float      r;",
        "uniform float      g;",
        "uniform float      b;",

        "void main(void) {",
            "gl_FragColor = texture2D(uSampler, vTextureCoord);",
            "gl_FragColor.rgb = vec3(intensity * r * gl_FragColor.r + gl_FragColor.r * (1.0 - intensity), intensity * g * gl_FragColor.g + gl_FragColor.g * (1.0 - intensity), intensity * b * gl_FragColor.b + gl_FragColor.b * (1.0 - intensity));",
        "}"
    ];
};

Phaser.Filter.Colorize.prototype = Object.create(Phaser.Filter.prototype);
Phaser.Filter.Colorize.prototype.constructor = Phaser.Filter.Colorize;
Phaser.Filter.Colorize.prototype.key = "colorize";

Phaser.Filter.Colorize.prototype.set_colorize_values = function(value) {
    if (value >= 0 && value < 1/6) {
        this.uniforms.r.value = value*6;
        this.uniforms.g.value = 0;
        this.uniforms.b.value = 1;
    } else if (value >= 1/6 && value < 2/6) {
        this.uniforms.r.value = 1;
        this.uniforms.g.value = 0;
        this.uniforms.b.value = -value*6 + 2;
    } else if (value >= 2/6 && value < 3/6) {
        this.uniforms.r.value = 1;
        this.uniforms.g.value = value*6 - 2;
        this.uniforms.b.value = 0;
    } else if (value >= 3/6 && value < 4/6) {
        this.uniforms.r.value = -value*6 + 4;
        this.uniforms.g.value = 1;
        this.uniforms.b.value = 0;
    } else if (value >= 4/6 && value < 5/6) {
        this.uniforms.r.value = 0;
        this.uniforms.g.value = 1;
        this.uniforms.b.value = value*6 - 4;
    }  else if (value >= 5/6 && value <= 1) {
        this.uniforms.r.value = 0;
        this.uniforms.g.value = -value*6 + 6;
        this.uniforms.b.value = 1;
    }
}

Object.defineProperty(Phaser.Filter.Colorize.prototype, 'intensity', {
    get: function() {
        return this.uniforms.intensity.value;
    },
    set: function(value) {
        this.uniforms.intensity.value = value;
        this.set_colorize_values(this.color);
    }
});
Object.defineProperty(Phaser.Filter.Colorize.prototype, 'color', {
    get: function() {
        return this._color;
    },
    set: function(value) {
        if (value === -1) {
            this.uniforms.r.value = 1;
            this.uniforms.g.value = 1;
            this.uniforms.b.value = 1;
            return;
        }
        if (value < 0) value = 0;
        if (value > 1) value = 1;
        this._color = value;
        this.set_colorize_values(value);
    }
});
