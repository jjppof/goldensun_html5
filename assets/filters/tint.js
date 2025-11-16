Phaser.Filter.Tint = function (game) {
    Phaser.Filter.call(this, game);

    this.uniforms.r = { type: '1f', value: -1.0 };
    this.uniforms.g = { type: '1f', value: -1.0 };
    this.uniforms.b = { type: '1f', value: -1.0 };

    this.fragmentSrc = [
        "precision mediump float;",

        "varying vec2       vTextureCoord;",
        "uniform sampler2D  uSampler;",
        "uniform float      r;",
        "uniform float      g;",
        "uniform float      b;",

        "void main(void) {",
            "gl_FragColor = texture2D(uSampler, vTextureCoord);",
            "float r_tint = r != -1.0 ? gl_FragColor.a * r : gl_FragColor.r;",
            "float g_tint = g != -1.0 ? gl_FragColor.a * g : gl_FragColor.g;",
            "float b_tint = b != -1.0 ? gl_FragColor.a * b : gl_FragColor.b;",
            "gl_FragColor.rgb = vec3(r_tint, g_tint, b_tint);",
        "}"
    ];
};

Phaser.Filter.Tint.prototype = Object.create(Phaser.Filter.prototype);
Phaser.Filter.Tint.prototype.constructor = Phaser.Filter.Tint;
Phaser.Filter.Tint.prototype.key = "tint";

Object.defineProperty(Phaser.Filter.Tint.prototype, 'r', {
    get: function() {
        return this.uniforms.r.value;
    },
    set: function(value) {
        this.uniforms.r.value = value;
    }
});
Object.defineProperty(Phaser.Filter.Tint.prototype, 'g', {
    get: function() {
        return this.uniforms.g.value;
    },
    set: function(value) {
        this.uniforms.g.value = value;
    }
});
Object.defineProperty(Phaser.Filter.Tint.prototype, 'b', {
    get: function() {
        return this.uniforms.b.value;
    },
    set: function(value) {
        this.uniforms.b.value = value;
    }
});
