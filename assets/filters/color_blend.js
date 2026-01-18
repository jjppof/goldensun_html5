Phaser.Filter.ColorBlend = function (game) {
    Phaser.Filter.call(this, game);

    this.uniforms.r = { type: '1f', value: -1.0 };
    this.uniforms.g = { type: '1f', value: -1.0 };
    this.uniforms.b = { type: '1f', value: -1.0 };
    this.uniforms.fake_blend = { type: '1f', value: 0.0 };

    this.fragmentSrc = [
        "precision mediump float;",

        "varying vec2       vTextureCoord;",
        "uniform sampler2D  uSampler;",
        "uniform float      r;",
        "uniform float      g;",
        "uniform float      b;",
        "uniform float      fake_blend;",

        "void main(void) {",
            "gl_FragColor = texture2D(uSampler, vTextureCoord);",
            "if (fake_blend != 0.0) {",
                "gl_FragColor.a = (gl_FragColor.r + gl_FragColor.g + gl_FragColor.b) / 3.0;",
            "}",
            "float r_blend = r != -1.0 ? gl_FragColor.a * r : gl_FragColor.r;",
            "float g_blend = g != -1.0 ? gl_FragColor.a * g : gl_FragColor.g;",
            "float b_blend = b != -1.0 ? gl_FragColor.a * b : gl_FragColor.b;",
            "gl_FragColor.rgb = vec3((gl_FragColor.r + r_blend)/2.0, (gl_FragColor.g + g_blend)/2.0, (gl_FragColor.b + b_blend)/2.0);",
        "}"
    ];
};

Phaser.Filter.ColorBlend.prototype = Object.create(Phaser.Filter.prototype);
Phaser.Filter.ColorBlend.prototype.constructor = Phaser.Filter.ColorBlend;
Phaser.Filter.ColorBlend.prototype.key = "color_blend";

Object.defineProperty(Phaser.Filter.ColorBlend.prototype, 'r', {
    get: function() {
        return this.uniforms.r.value;
    },
    set: function(value) {
        this.uniforms.r.value = value;
    }
});
Object.defineProperty(Phaser.Filter.ColorBlend.prototype, 'g', {
    get: function() {
        return this.uniforms.g.value;
    },
    set: function(value) {
        this.uniforms.g.value = value;
    }
});
Object.defineProperty(Phaser.Filter.ColorBlend.prototype, 'b', {
    get: function() {
        return this.uniforms.b.value;
    },
    set: function(value) {
        this.uniforms.b.value = value;
    }
});
Object.defineProperty(Phaser.Filter.ColorBlend.prototype, 'fake_blend', {
    get: function() {
        return Boolean(this.uniforms.fake_blend.value);
    },
    set: function(value) {
        this.uniforms.fake_blend.value = value ? 1.0 : 0.0;
    }
});
