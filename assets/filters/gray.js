Phaser.Filter.Gray = function (game) {
    Phaser.Filter.call(this, game);

    this.uniforms.intensity = { type: '1f', value: 0.0 };

    this.fragmentSrc = [
        "precision mediump float;",

        "varying vec2       vTextureCoord;",
        "uniform sampler2D  uSampler;",
        "uniform float      intensity;",

        "void main(void) {",
            "gl_FragColor = texture2D(uSampler, vTextureCoord);",
            "gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.2126 * gl_FragColor.r + 0.7152 * gl_FragColor.g + 0.0722 * gl_FragColor.b), intensity);",
        "}"
    ];
};

Phaser.Filter.Gray.prototype = Object.create(Phaser.Filter.prototype);
Phaser.Filter.Gray.prototype.constructor = Phaser.Filter.Gray;
Phaser.Filter.Gray.prototype.key = "gray";

Object.defineProperty(Phaser.Filter.Gray.prototype, 'intensity', {
    get: function() {
        return this.uniforms.intensity.value;
    },
    set: function(value) {
        this.uniforms.intensity.value = value;
    }
});
