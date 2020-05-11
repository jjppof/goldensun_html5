Phaser.Filter.Hue = function (game) {
    Phaser.Filter.call(this, game);

    this.uniforms.gray = { type: '1f', value: 0.0 };
    this.uniforms.r = { type: '1f', value: 1.0 };
    this.uniforms.g = { type: '1f', value: 1.0 };
    this.uniforms.b = { type: '1f', value: 1.0 };
    this.uniforms.shift = { type: '1f', value: -1.0 };
    this.uniforms.shift_cap = { type: '1f', value: 1.0 };
    this.uniforms.r_shift = { type: '1f', value: 1.0 };
    this.uniforms.g_shift = { type: '1f', value: 1.0 };
    this.uniforms.b_shift = { type: '1f', value: 1.0 };

    this.fragmentSrc = [
        "precision mediump float;",

        "varying vec2       vTextureCoord;",
        "varying vec4       vColor;",
        "uniform sampler2D  uSampler;",
        "uniform float      gray;",
        "uniform float      r;",
        "uniform float      g;",
        "uniform float      b;",
        "uniform float      r_shift;",
        "uniform float      g_shift;",
        "uniform float      b_shift;",

        "void main(void) {",
            "gl_FragColor = texture2D(uSampler, vTextureCoord);",
            "gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.2126 * gl_FragColor.r + 0.7152 * gl_FragColor.g + 0.0722 * gl_FragColor.b), gray);",
            "gl_FragColor.rgb = vec3(r * r_shift * gl_FragColor.r, g * g_shift * gl_FragColor.g, b * b_shift * gl_FragColor.b);",
        "}"
    ];
};

Phaser.Filter.Hue.prototype = Object.create(Phaser.Filter.prototype);
Phaser.Filter.Hue.prototype.constructor = Phaser.Filter.Hue;

Object.defineProperty(Phaser.Filter.Hue.prototype, 'gray', {
    get: function() {
        return this.uniforms.gray.value;
    },
    set: function(value) {
        this.uniforms.gray.value = value;
    }

});
Object.defineProperty(Phaser.Filter.Hue.prototype, 'r', {
    get: function() {
        return this.uniforms.r.value;
    },
    set: function(value) {
        this.uniforms.r.value = value;
    }
});
Object.defineProperty(Phaser.Filter.Hue.prototype, 'g', {
    get: function() {
        return this.uniforms.g.value;
    },
    set: function(value) {
        this.uniforms.g.value = value;
    }
});
Object.defineProperty(Phaser.Filter.Hue.prototype, 'b', {
    get: function() {
        return this.uniforms.b.value;
    },
    set: function(value) {
        this.uniforms.b.value = value;
    }
});
Object.defineProperty(Phaser.Filter.Hue.prototype, 'shift_cap', {
    get: function() {
        return this.uniforms.shift_cap.value;
    },
    set: function(value) {
        this.uniforms.shift_cap.value = value;
    }
});
Object.defineProperty(Phaser.Filter.Hue.prototype, 'shift', {
    get: function() {
        return this.uniforms.shift.value;
    },
    set: function(value) {
        if (value === -1) {
            this.uniforms.r_shift.value = 1;
            this.uniforms.g_shift.value = 1;
            this.uniforms.b_shift.value = 1;
            return;
        }
        if (value < 0) value = 0;
        if (value > 1) value = 1;
        this.uniforms.shift.value = value;
        if (value >= 0 && value < 1/6) {
            this.uniforms.r_shift.value = value*6;
            this.uniforms.g_shift.value = 0;
            this.uniforms.b_shift.value = 1;
        } else if (value >= 1/6 && value < 2/6) {
            this.uniforms.r_shift.value = 1;
            this.uniforms.g_shift.value = 0;
            this.uniforms.b_shift.value = -value*6 + 2;
        } else if (value >= 2/6 && value < 3/6) {
            this.uniforms.r_shift.value = 1;
            this.uniforms.g_shift.value = value*6 - 2;
            this.uniforms.b_shift.value = 0;
        } else if (value >= 3/6 && value < 4/6) {
            this.uniforms.r_shift.value = -value*6 + 4;
            this.uniforms.g_shift.value = 1;
            this.uniforms.b_shift.value = 0;
        } else if (value >= 4/6 && value < 5/6) {
            this.uniforms.r_shift.value = 0;
            this.uniforms.g_shift.value = 1;
            this.uniforms.b_shift.value = value*6 - 4;
        }  else if (value >= 5/6 && value <= 1) {
            this.uniforms.r_shift.value = 0;
            this.uniforms.g_shift.value = -value*6 + 6;
            this.uniforms.b_shift.value = 1;
        }
        this.uniforms.r_shift.value *= this.uniforms.shift_cap.value;
        this.uniforms.g_shift.value *= this.uniforms.shift_cap.value;
        this.uniforms.b_shift.value *= this.uniforms.shift_cap.value;
    }
});
