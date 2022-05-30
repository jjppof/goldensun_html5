Phaser.Filter.Hue = function (game) {
    Phaser.Filter.call(this, game);

    this.uniforms.angle = { type: '1f', value: 0.0 };

    this.fragmentSrc = [
        "precision mediump float;",

        "varying vec2       vTextureCoord;",
        "uniform sampler2D  uSampler;",
        "uniform float      angle;",

        "void main(void) {",
            "gl_FragColor = texture2D(uSampler, vTextureCoord);",
            "if (angle != 0.0) {",
                "const vec3 k = vec3(0.57735, 0.57735, 0.57735);",
                "float cosAngle = cos(angle);",
                "gl_FragColor.rgb = vec3(gl_FragColor.rgb * cosAngle + cross(k, gl_FragColor.rgb) * sin(angle) + k * dot(k, gl_FragColor.rgb) * (1.0 - cosAngle));",
            "}",
        "}"
    ];
};

Phaser.Filter.Hue.prototype = Object.create(Phaser.Filter.prototype);
Phaser.Filter.Hue.prototype.constructor = Phaser.Filter.Hue;
Phaser.Filter.Hue.prototype.key = "hue";

Object.defineProperty(Phaser.Filter.Hue.prototype, 'angle', {
    get: function() {
        return this.uniforms.angle.value;
    },
    set: function(value) {
        this.uniforms.angle.value = value;
    }
});
